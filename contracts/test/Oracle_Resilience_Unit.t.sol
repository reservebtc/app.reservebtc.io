// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Minimal synth compatible with IRBTCSynth: tracks balances & totalSupply in "sats".
contract SynthMock is IRBTCSynth {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    error BurnExceeds();

    function oracleMint(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        unchecked {
            balanceOf[user] += d;
            totalSupply += d;
        }
    }

    function oracleBurn(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        uint256 bal = balanceOf[user];
        if (bal < d) revert BurnExceeds();
        unchecked {
            balanceOf[user] = bal - d;
            totalSupply -= d;
        }
    }
}

/// @dev Minimal FeeVault compatible with IFeeVault.
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
        unchecked {
            bal[user] -= amount;
        }
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

contract Oracle_Resilience_Unit is Test {
    // System under test
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    // Actors
    address internal committee;
    address internal user;

    // Fee policy params (aligned with previous E2E tests)
    uint256 constant PCT_BPS     = 10;             // 0.10%
    uint256 constant FIXED_WEI   = 0;              // no fixed leg in base policy
    uint256 constant WEI_PER_SAT = 1_000_000_000;  // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;        // maxFeePerSyncWei

    // fee(Δ+) = Δ * WEI_PER_SAT * PCT_BPS / 10_000 + FIXED_WEI
    function _pctFee(uint64 dPos) internal pure returns (uint256) {
        if (dPos == 0) return 0;
        return (uint256(dPos) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
    }

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

        // Register + prepay to initialize internal mappings and pre-fund the user's vault
        vm.deal(committee, 5 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));
    }

    /// -----------------------------------------------------------------------
    /// 1) "Small noise" sequence of +1 / -1 / 0:
    ///    - Fee must be charged only on +delta.
    ///    - 0 delta must be a no-op (no fee, no state change).
    ///    - burn on -delta must not charge any fee.
    /// -----------------------------------------------------------------------
    function test_SmallNoise_PositiveOnlyFee_ZeroIsNoOp() public {
        // Make sure we have enough ETH to cover all +1 fees comfortably
        uint256 targetPosSteps = 2_000; // 2000 * fee(+1) = 2000 * 1e6 wei = 0.002 ETH < 1 ETH prepaid
        uint256 feePerPlus = _pctFee(1);
        assertEq(feePerPlus, 1_000_000, "fee(+1) expected 1e6 wei");

        uint256 vaultBefore = vault.balanceOf(user);
        uint256 totalBefore = synth.totalSupply();
        uint256 userBefore  = synth.balanceOf(user);

        // Deterministic pattern with guards against going negative:
        //   repeat N times: 0 (no-op), +1, -1 (if possible)
        uint64 cur = uint64(userBefore); // current absolute target in sats
        uint256 posCount;
        uint256 zeroCount;
        uint256 negCount;

        for (uint256 i = 0; i < targetPosSteps; i++) {
            // 0 delta: no-op
            vm.prank(committee);
            oracle.sync(user, cur, ""); // no change
            zeroCount++;

            // +1 delta
            uint64 plus = cur + 1;
            vm.prank(committee);
            oracle.sync(user, plus, "");
            cur = plus;
            posCount++;

            // -1 delta (only if >0)
            if (cur > 0) {
                uint64 minus = cur - 1;
                vm.prank(committee);
                oracle.sync(user, minus, "");
                cur = minus;
                negCount++;
            }
        }

        // Final checks:
        // - Net balance should be userBefore (since +1 then -1 for each cycle), zero delta does nothing
        assertEq(synth.balanceOf(user), userBefore, "final user balance must return to start");
        assertEq(synth.totalSupply(),   totalBefore, "final totalSupply must return to start");

        // - Fee must equal posCount * fee(+1)
        uint256 expectedFee = posCount * feePerPlus;
        uint256 spent = vaultBefore - vault.balanceOf(user);
        assertEq(spent, expectedFee, "fee must be charged only on +delta steps");

        // - Sanity counts: 0 == + == - (since we always can decrement after increment)
        assertEq(zeroCount, posCount, "zero-delta count should match +delta count");
        assertEq(negCount,  posCount, "-delta count should match +delta count");
    }

    /// -----------------------------------------------------------------------
    /// 2) "Big spike" delta:
    ///    Attempt a +delta whose percentage fee would exceed maxFeePerSyncWei.
    ///    Expected behavior: revert (fee is capped per sync call).
    /// -----------------------------------------------------------------------
    function test_BigSpikeDelta_RevertsWhenFeeExceedsCap() public {
        // Current balance = 0 sats
        uint64 current = uint64(synth.balanceOf(user));
        assertEq(current, 0, "expected zero start");

        // fee = delta * 1e9 * 10 / 1e4 = delta * 1e6 wei
        // Solve fee == cap -> deltaCap = cap / 1e6 = 1e12
        uint64 deltaCap = 1_000_000_000_000; // 1e12 sats
        uint64 deltaAbove = deltaCap + 1;

        // Fund user's vault generously to ensure revert is due to cap, not lack of funds
        uint256 need = 10 ether;
        vm.deal(committee, need);
        vm.prank(committee);
        vault.depositETH{value: need}(user);

        // Expect revert when fee for +delta exceeds maxFeePerSyncWei
        vm.expectRevert();
        vm.prank(committee);
        oracle.sync(user, current + deltaAbove, ""); // fee(delta) > cap -> revert
    }
}