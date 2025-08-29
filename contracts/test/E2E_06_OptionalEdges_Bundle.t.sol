// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Minimal synth mock: tracks balances and totalSupply.
contract SynthMock is IRBTCSynth {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    error BurnExceeds();

    function oracleMint(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        unchecked { balanceOf[user] += d; totalSupply += d; }
    }

    function oracleBurn(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        uint256 bal = balanceOf[user];
        if (bal < d) revert BurnExceeds();
        unchecked { balanceOf[user] = bal - d; totalSupply -= d; }
    }
}

/// @dev FeeVault mock compatible with IFeeVault.
contract FeeVaultMock is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        require(user != address(0), "user=0");
        require(msg.value > 0, "value=0");
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        require(bal[user] >= amount, "insufficient");
        unchecked { bal[user] -= amount; }
        emit Spent(user, amount, msg.sender);
    }

    function withdrawUnused() external override {
        uint256 amt = bal[msg.sender];
        require(amt > 0, "no-balance");
        bal[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amt}("");
        require(ok, "withdraw-failed");
        emit Withdrawn(msg.sender, amt);
    }

    receive() external payable {}
}

contract E2E_06_OptionalEdges_Bundle is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    address internal committee;
    address internal user;

    uint256 constant PCT_BPS     = 10;             // 0.10%
    uint256 constant FIXED_WEI   = 0;
    uint256 constant WEI_PER_SAT = 1_000_000_000;  // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;

    function setUp() public {
        committee = makeAddr("committee");
        user      = makeAddr("user");

        policy = new FeePolicy(PCT_BPS, FIXED_WEI, WEI_PER_SAT);
        vault  = new FeeVaultMock();
        synth  = new SynthMock();

        oracle = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        vm.deal(committee, 2 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));
    }

    function _fee(uint64 dPos) internal pure returns (uint256) {
        if (dPos == 0) return 0;
        return (uint256(dPos) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
    }

    /// 1) Fee cap boundary: fee == cap is OK; fee > cap should clamp or revert.
    function test_FeeCap_Boundary_And_Above() public {
        uint256 curBal = vault.balanceOf(user);
        if (curBal < FEE_CAP) {
            uint256 need = FEE_CAP - curBal;
            vm.deal(committee, need);
            vm.prank(committee);
            vault.depositETH{value: need}(user);
        }

        // fee = delta * 1e9 * 10 / 1e4 = delta * 1e6 wei; cap=1e18 => deltaCap=1e12
        uint64 deltaCap = 1_000_000_000_000;
        uint256 expectedFeeCap = (uint256(deltaCap) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
        assertEq(expectedFeeCap, FEE_CAP, "deltaCap not aligned to cap");

        uint64 start = uint64(synth.balanceOf(user));
        assertEq(start, 0, "unexpected non-zero start");

        // at cap
        uint256 vaultBefore = vault.balanceOf(user);
        vm.prank(committee);
        oracle.sync(user, start + deltaCap, "");
        assertEq(synth.balanceOf(user), start + deltaCap, "mint at cap mismatch");
        assertEq(vaultBefore - vault.balanceOf(user), expectedFeeCap, "fee at cap mismatch");

        // above cap (+1) — allow either clamp or revert
        uint64 deltaAbove = deltaCap + 1;
        uint64 targetAbove = uint64(synth.balanceOf(user)) + deltaAbove;

        uint256 balBefore = synth.balanceOf(user);
        uint256 vaultBalBefore = vault.balanceOf(user);

        (bool ok, ) = address(oracle).call(
            abi.encodeWithSelector(oracle.sync.selector, user, targetAbove, bytes(""))
        );

        if (ok) {
            uint256 minted = synth.balanceOf(user) - balBefore;
            assertLe(minted, uint256(deltaCap), "clamp not enforced");
            uint256 feeSpent = vaultBalBefore - vault.balanceOf(user);
            assertLe(feeSpent, FEE_CAP, "fee cap exceeded on success");
        } else {
            assertEq(synth.balanceOf(user), balBefore, "balance changed on revert");
            assertEq(vault.balanceOf(user), vaultBalBefore, "vault changed on revert");
        }
    }

    /// 2) Access control: non-committee cannot call registerAndPrepay / sync
    function test_AccessControl_NonCommittee_Reverts() public {
        address notCommittee = makeAddr("not-committee");

        vm.deal(notCommittee, 1 ether);
        vm.expectRevert();
        vm.prank(notCommittee);
        oracle.registerAndPrepay{value: 0.1 ether}(user, 1, bytes32(0));

        uint64 target = 1000;
        vm.expectRevert();
        vm.prank(notCommittee);
        oracle.sync(user, target, "");
    }

    /// 3) Gas snapshot: log gas for a small happy-path sequence
    function test_GasSnapshot_HappyPath_Logging() public {
        uint64 up = 50_000;
        uint256 feeUp = _fee(up);
        uint256 have = vault.balanceOf(user);
        if (have < feeUp) {
            uint256 need = feeUp - have;
            vm.deal(committee, need);
            vm.prank(committee);
            vault.depositETH{value: need}(user);
        }

        uint256 gasStart = gasleft();

        vm.startPrank(committee);
        oracle.sync(user, up, "");           // +delta
        oracle.sync(user, up - 10_000, "");  // -delta (burn)
        vm.stopPrank();

        uint256 gasUsed = gasStart - gasleft();
        console2.log("E2E gas (register pre-paid, +delta then -delta):");
        console2.logUint(gasUsed);

        assertTrue(true);
    }

    /// 4) Zero-percent policy with fixed fee: fixed fee is charged on any non-zero delta
    function test_ZeroPercent_FixedFee_Behavior() public {
        FeePolicy policyFixed = new FeePolicy(
            0,              // PCT_BPS
            1e15,           // FIXED_WEI
            WEI_PER_SAT
        );
        FeeVaultMock vault2 = new FeeVaultMock();
        SynthMock    synth2 = new SynthMock();

        OracleAggregator oracle2 = new OracleAggregator(
            address(synth2),
            address(vault2),
            address(policyFixed),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        address user2 = makeAddr("user-fixed");
        vm.deal(committee, 2 ether);
        vm.prank(committee);
        oracle2.registerAndPrepay{value: 1 ether}(user2, 1, bytes32(0));

        uint64 up = 100_000;
        uint256 expectedFixed = 1e15;

        // +delta: charges fixed
        uint256 vBefore = vault2.balanceOf(user2);
        uint256 tsBefore = synth2.totalSupply();
        uint256 uBefore = synth2.balanceOf(user2);

        vm.prank(committee);
        oracle2.sync(user2, up, "");
        assertEq(synth2.balanceOf(user2), uBefore + up, "mint mismatch");
        assertEq(synth2.totalSupply(), tsBefore + up, "totalSupply mismatch");
        assertEq(vBefore - vault2.balanceOf(user2), expectedFixed, "fixed fee not charged on +delta");

        // -delta: with zero-percent but fixed>0, fixed fee is still charged per policy
        uint256 vBefore2 = vault2.balanceOf(user2);
        vm.prank(committee);
        oracle2.sync(user2, up - 10_000, "");
        assertEq(vBefore2 - vault2.balanceOf(user2), expectedFixed, "fixed fee expected on -delta");
    }
}