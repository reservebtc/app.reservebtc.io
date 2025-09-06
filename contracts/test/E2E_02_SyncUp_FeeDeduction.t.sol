// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Minimal synth mock that keeps balances and totalSupply.
/// We don't enforce only-oracle here to avoid circular wiring in a tiny E2E.
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

/// @dev FeeVault mock fully compatible with IFeeVault (no extra events defined here).
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

contract E2E_02_SyncUp_FeeDeduction is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    address internal committee;
    address internal user;

    // Match project params (same as in first mini-test)
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

        // committee pre-pays for the user via aggregator
        vm.deal(committee, 1 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 0.5 ether}(user, 1, bytes32(0));
    }

    function _expectedFee(uint64 deltaPos) internal pure returns (uint256) {
        if (deltaPos == 0) return 0;
        // fee = fixed + d * weiPerSat * pctBps / 10000
        return (uint256(deltaPos) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
    }

    /// @notice sync(+Δ): rBTC increases by Δ, totalSupply increases by Δ, and exact fee is deducted from the user's FeeVault balance.
    function test_SyncUp_FeeDeducts_And_BalancesUpdate() public {
        // choose a safe delta under cap
        uint64 up = 123_456;
        uint256 feeUp = _expectedFee(up);
        require(feeUp <= FEE_CAP, "fee>cap");

        uint256 vaultBefore = vault.balanceOf(user);
        uint256 tsBefore    = synth.totalSupply();
        uint256 uBefore     = synth.balanceOf(user);

        // perform sync as committee
        vm.prank(committee);
        oracle.sync(user, up, "");

        // rBTC state
        assertEq(synth.balanceOf(user), uBefore + up, "mint mismatch");
        assertEq(synth.totalSupply(),   tsBefore + up, "totalSupply mismatch");

        // fee charged once on +Δ
        uint256 vaultAfter = vault.balanceOf(user);
        assertEq(vaultBefore - vaultAfter, feeUp, "fee deduction mismatch");
    }
}