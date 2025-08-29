// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

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

/// @dev FeeVault mock compatible with IFeeVault (no duplicate event declarations).
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

contract E2E_03_SyncDown_NoFee is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    address internal committee;
    address internal user;

    // Same params as previous mini-tests
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

        // prepay for the user so +delta can charge a fee
        vm.deal(committee, 1 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 0.5 ether}(user, 1, bytes32(0));

        // initial +delta to create balance before testing -delta
        uint64 up = 120_000;
        vm.prank(committee);
        oracle.sync(user, up, "");
        assertEq(synth.balanceOf(user), up, "pre-mint failed");
    }

    /// @notice sync(-delta): burn should reduce balances and NOT charge any fee.
    function test_SyncDown_NoFee_And_BalancesUpdate() public {
        uint256 vaultBefore = vault.balanceOf(user);
        uint256 tsBefore    = synth.totalSupply();
        uint256 uBefore     = synth.balanceOf(user);

        // target below current by ~1/3
        uint64 target = uint64(uBefore) - (uint64(uBefore) / 3 == 0 ? uint64(1) : uint64(uBefore) / 3);

        // perform -delta as committee
        vm.prank(committee);
        oracle.sync(user, target, "");

        uint256 burned = uBefore - target;

        // state checks: balances and totalSupply decreased by burned
        assertEq(synth.balanceOf(user), target, "burn result mismatch");
        assertEq(synth.totalSupply(),   tsBefore - burned, "totalSupply after burn mismatch");

        // no fee charged on -delta
        uint256 vaultAfter = vault.balanceOf(user);
        assertEq(vaultAfter, vaultBefore, "no fee must be charged on -delta");
    }
}