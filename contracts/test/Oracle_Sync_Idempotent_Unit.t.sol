// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../FeeVault.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Minimal synth mock with strict only-oracle gate.
contract SynthOnlyOracle is IRBTCSynth {
    address public oracle;

    error NotOracle();

    constructor(address _oracle) {
        oracle = _oracle;
    }

    function setOracle(address _oracle) external {
        oracle = _oracle;
    }

    function oracleMint(address, /*user*/ uint64 /*deltaSats*/ ) external override {
        if (msg.sender != oracle) revert NotOracle();
        // no-op for unit test (we only check call path & aggregator behavior)
    }

    function oracleBurn(address, /*user*/ uint64 /*deltaSats*/ ) external override {
        if (msg.sender != oracle) revert NotOracle();
        // no-op for unit test
    }
}

/// @dev Simple FeeVault mock that satisfies IFeeVault and emits interface events.
///      No duplicate event declarations here — we rely on IFeeVault's events.
contract FeeVaultMock is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        require(user != address(0), "zero-user");
        require(msg.value > 0, "zero-value");
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        // Allow zero-amount as a no-op for idempotency tests.
        if (amount == 0) {
            return;
        }

        uint256 b = bal[user];
        require(b >= amount, "insufficient");

        unchecked {
            bal[user] = b - amount;
        }

        // In tests we don't actually forward ETH; just emit the event.
        emit Spent(user, amount, msg.sender);
    }

    function withdrawUnused() external override {
        uint256 amount = bal[msg.sender];
        require(amount > 0, "no-balance");
        bal[msg.sender] = 0;
        (bool ok, bytes memory data) = payable(msg.sender).call{value: amount}("");
        data; // silence warning
        require(ok, "withdraw-failed");
        emit Withdrawn(msg.sender, amount);
    }

    receive() external payable {}
}

contract Oracle_Sync_Idempotent_Unit is Test {
    // Fixed actors
    address internal constant COMMITTEE = address(0xC0117CEe); // any 20-byte hex, valid address
    address internal constant USER = address(0xA11CE);

    // System under test
    OracleAggregator internal agg;
    SynthOnlyOracle internal synth;
    FeeVaultMock internal vault;
    FeePolicy internal policy;

    function setUp() public {
        // deal ETH for convenience
        vm.deal(COMMITTEE, 10 ether);
        vm.deal(USER, 10 ether);

        // deploy mocks
        vault = new FeeVaultMock();
        policy = new FeePolicy(
            /*pctBps*/
            10, // 0.1% on positive delta
            /*fixedWei*/
            0, // no fixed fee in this unit test
            /*weiPerSat*/
            1_000_000_000 // 1e-9 ETH per sat for percentage leg
        );

        // temporary placeholder oracle; we'll set actual oracle after agg deploy
        synth = new SynthOnlyOracle(address(0xDEAD));

        // deploy aggregator
        agg = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            COMMITTEE,
            /*minConfirmations*/
            3,
            /*maxFeePerSyncWei*/
            type(uint256).max
        );

        // now set synth oracle = aggregator
        synth.setOracle(address(agg));

        // prepay fee balance for USER via committee helper
        vm.startPrank(COMMITTEE);
        agg.registerAndPrepay{value: 1 ether}(USER, /*method*/ 1, /*checksum*/ bytes32(0));
        vm.stopPrank();
    }

    /// @notice Second sync with the same target balance must be a clean no-op:
    /// - no mint/burn (we don't assert directly here because mock is no-op, but we check logs count),
    /// - no fee charged,
    /// - no events emitted.
    function test_Idempotent_NoOp() public {
        // First call sets state and emits Synced
        vm.prank(COMMITTEE);
        agg.sync(USER, 200_000, "");

        // Record logs around the second call to the same value
        vm.recordLogs();
        vm.prank(COMMITTEE);
        agg.sync(USER, 200_000, "");
        Vm.Log[] memory logs = vm.getRecordedLogs();

        // Expect zero events on idempotent call
        assertEq(logs.length, 0, "second sync must be no-op (no events)");
        // State is unchanged
        assertEq(agg.lastSats(USER), 200_000);
    }

    /// @notice Monotonicity: up → up to the same final → down to the old value.
    /// We expect lastSats to follow exactly and idempotent steps to produce no events.
    function test_Monotonicity_Steps() public {
        // up to 100_000
        vm.prank(COMMITTEE);
        agg.sync(USER, 100_000, "");
        assertEq(agg.lastSats(USER), 100_000);

        // up again to the same final -> no-op
        vm.recordLogs();
        vm.prank(COMMITTEE);
        agg.sync(USER, 100_000, "");
        Vm.Log[] memory step2 = vm.getRecordedLogs();
        assertEq(step2.length, 0, "same target should be idempotent");
        assertEq(agg.lastSats(USER), 100_000);

        // down to 30_000 -> should update to 30_000 and emit Synced exactly once
        vm.recordLogs();
        vm.prank(COMMITTEE);
        agg.sync(USER, 30_000, "");
        Vm.Log[] memory step3 = vm.getRecordedLogs();
        assertEq(step3.length, 1, "downstep should emit exactly one Synced event");
        assertEq(agg.lastSats(USER), 30_000);
    }
}
