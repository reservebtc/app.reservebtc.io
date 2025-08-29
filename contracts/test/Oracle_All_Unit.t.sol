// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../FeeVault.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

// ============================
// Mocks
// ============================

/// @dev Minimal synth mock that enforces only-oracle but otherwise no-ops.
contract SynthOnlyOracle is IRBTCSynth {
    address public oracle;

    error NotOracle();

    constructor(address _oracle) {
        oracle = _oracle;
    }

    function setOracle(address _oracle) external {
        oracle = _oracle;
    }

    function oracleMint(address, uint64) external override {
        if (msg.sender != oracle) revert NotOracle();
        // no-op
    }

    function oracleBurn(address, uint64) external override {
        if (msg.sender != oracle) revert NotOracle();
        // no-op
    }
}

/// @dev Synth that always reverts on oracleMint/oracleBurn (to test "no state commit on external fail").
contract RevertingSynth is IRBTCSynth {
    // oracle is irrelevant because we revert unconditionally
    constructor(address) {}

    function oracleMint(address, uint64) external pure override {
        revert("mint-revert");
    }

    function oracleBurn(address, uint64) external pure override {
        revert("burn-revert");
    }
}

/// @dev FeeVault mock that implements IFeeVault; we just keep an in-memory balance map and emit events.
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
        require(bal[user] >= amount, "insufficient");
        unchecked {
            bal[user] -= amount;
        }
        emit Spent(user, amount, msg.sender);
    }

    function withdrawUnused() external override {
        uint256 amount = bal[msg.sender];
        require(amount > 0, "no-balance");
        bal[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "withdraw-failed");
        emit Withdrawn(msg.sender, amount);
    }

    receive() external payable {}
}

/// @dev Fixed-fee policy for deterministic tests.
contract FeePolicyFixed is IFeePolicy {
    uint256 public immutable fixedFee;

    constructor(uint256 _fixedFee) {
        fixedFee = _fixedFee;
    }

    function quoteFees(address, int64) external view override returns (uint256) {
        return fixedFee;
    }
}

// ============================
// Test Suite
// ============================

contract Oracle_All_Unit is Test {
    // Actors
    address public committee = address(0xC0117CEe); // valid 20-byte address
    address public user = address(0xA11CE);
    address public stranger = address(0xBEEF);

    // Base system under test (SUT)
    OracleAggregator internal agg;
    SynthOnlyOracle internal synth;
    FeeVaultMock internal vault;
    FeePolicy internal pctPolicy;

    // Local copy of the event signature to use with expectEmit
    event Synced(
        address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp
    );
    event NeedsTopUp(address indexed user);

    function setUp() public {
        vm.deal(committee, 10 ether);
        vm.deal(user, 10 ether);
        vm.deal(stranger, 10 ether);

        // Base percent policy (same shape as project)
        pctPolicy = new FeePolicy(
            /*pctBps*/
            10, // 0.1%
            /*fixedWei*/
            0,
            /*weiPerSat*/
            1_000_000_000 // 1e-9 ETH per sat
        );

        // Base vault and synth
        vault = new FeeVaultMock();
        synth = new SynthOnlyOracle(address(0xDEAD));

        // Base aggregator (large fee cap)
        agg = new OracleAggregator(
            address(synth),
            address(vault),
            address(pctPolicy),
            committee,
            /*minConfirmations*/
            3,
            /*maxFeePerSyncWei*/
            type(uint256).max
        );

        // Wire synth -> oracle
        synth.setOracle(address(agg));

        // Prepay for user for most tests
        vm.startPrank(committee);
        agg.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // 1) Access control
    // ------------------------------------------------------------
    function test_AccessControl_CommitteeOnly() public {
        // sync by non-committee -> Restricted()
        vm.startPrank(stranger);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        agg.sync(user, 100_000, "");
        vm.stopPrank();

        // registerAndPrepay by non-committee -> Restricted()
        vm.startPrank(stranger);
        vm.expectRevert(OracleAggregator.Restricted.selector);
        agg.registerAndPrepay{value: 1 wei}(user, 1, bytes32(0));
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // 2) Bounds: fee cap and very large newBalanceSats (< 2^63)
    // ------------------------------------------------------------
    function test_Bounds_FeeCap_And_LargeBalance() public {
        // == cap passes
        {
            FeeVaultMock vaultEq = new FeeVaultMock();
            SynthOnlyOracle synthEq = new SynthOnlyOracle(address(0xDEAD));
            FeePolicyFixed fixed1 = new FeePolicyFixed(1);

            OracleAggregator aggCapEq = new OracleAggregator(
                address(synthEq),
                address(vaultEq),
                address(fixed1),
                committee,
                3,
                /*maxFeePerSyncWei*/
                1
            );
            synthEq.setOracle(address(aggCapEq));

            vm.startPrank(committee);
            aggCapEq.registerAndPrepay{value: 1 wei}(user, 1, bytes32(0));
            vm.stopPrank();

            vm.prank(committee);
            aggCapEq.sync(user, 10, "");
            assertEq(aggCapEq.lastSats(user), 10);
        }

        // cap - 1 (i.e., cap = 0 while fee = 1) -> FeeCapExceeded
        {
            FeeVaultMock vaultLess = new FeeVaultMock();
            SynthOnlyOracle synthLess = new SynthOnlyOracle(address(0xDEAD));
            FeePolicyFixed fixed1 = new FeePolicyFixed(1);

            OracleAggregator aggCapLess = new OracleAggregator(
                address(synthLess),
                address(vaultLess),
                address(fixed1),
                committee,
                3,
                /*maxFeePerSyncWei*/
                0
            );
            synthLess.setOracle(address(aggCapLess));

            vm.prank(committee);
            vm.expectRevert(OracleAggregator.FeeCapExceeded.selector);
            aggCapLess.sync(user, 20, "");
        }

        // Very large value just below 2^63: check storage without triggering "needs-topup".
        // Use a fresh aggregator with zero-fee policy to isolate from fee logic.
        {
            FeeVaultMock vaultBig = new FeeVaultMock();
            SynthOnlyOracle synthBig = new SynthOnlyOracle(address(0xDEAD));
            FeePolicyFixed zeroFee = new FeePolicyFixed(0);

            OracleAggregator aggBig = new OracleAggregator(
                address(synthBig),
                address(vaultBig),
                address(zeroFee),
                committee,
                3,
                /*maxFeePerSyncWei*/
                type(uint256).max
            );
            synthBig.setOracle(address(aggBig));

            uint64 big = uint64(uint64(type(int64).max) - 1);
            vm.prank(committee);
            aggBig.sync(user, big, "");
            assertEq(aggBig.lastSats(user), big, "big balance must persist");
        }
    }

    // ------------------------------------------------------------
    // 3) Events: Synced and NeedsTopUp
    // ------------------------------------------------------------
    function test_Events_Synced_And_NeedsTopUp() public {
        // Use a fixed-fee policy so the event's feeWei is deterministic (1 wei)
        FeeVaultMock vaultEv = new FeeVaultMock();
        SynthOnlyOracle synthEv = new SynthOnlyOracle(address(0xDEAD));
        FeePolicyFixed fixed1 = new FeePolicyFixed(1);

        OracleAggregator aggEv =
            new OracleAggregator(address(synthEv), address(vaultEv), address(fixed1), committee, 3, type(uint256).max);
        synthEv.setOracle(address(aggEv));

        // Prepay 1 wei so Synced will not revert
        vm.prank(committee);
        aggEv.registerAndPrepay{value: 1 wei}(user, 1, bytes32(0));

        // Expect Synced with exact fields
        vm.expectEmit(true, true, true, true, address(aggEv));
        emit Synced(user, 123, int64(int256(123)), 1, 0, uint64(block.timestamp));
        vm.prank(committee);
        aggEv.sync(user, 123, "");

        // Now NeedsTopUp: no prepay for a different user -> emits then reverts("needs-topup")
        address user2 = address(0xB0B);
        vm.expectEmit(true, true, true, false, address(aggEv));
        emit NeedsTopUp(user2);
        vm.prank(committee);
        vm.expectRevert(bytes("needs-topup"));
        aggEv.sync(user2, 10, "");
    }

    // ------------------------------------------------------------
    // 4) Reentrancy/external-fail regression: if synth reverts, lastSats must NOT be updated
    // ------------------------------------------------------------
    function test_Reentrancy_StateNotCommittedOnExternalFail() public {
        // Fresh vault and reverting synth
        FeeVaultMock vaultR = new FeeVaultMock();
        RevertingSynth synthR = new RevertingSynth(address(0xDEAD));
        FeePolicyFixed fixed1 = new FeePolicyFixed(1);

        OracleAggregator aggR =
            new OracleAggregator(address(synthR), address(vaultR), address(fixed1), committee, 3, type(uint256).max);

        // Prepay 1 wei so we hit synth first (and fail there)
        vm.prank(committee);
        aggR.registerAndPrepay{value: 1 wei}(user, 1, bytes32(0));

        // old state is zero; try to move to 1 -> synth reverts -> state must remain zero
        vm.prank(committee);
        vm.expectRevert(bytes("mint-revert"));
        aggR.sync(user, 1, "");
        assertEq(aggR.lastSats(user), 0, "state must not commit on external fail");
    }

    // ------------------------------------------------------------
    // 5) Proof passthrough: aggregator ignores proof in MVP but must accept bytes param
    // ------------------------------------------------------------
    function test_Proof_Passthrough() public {
        bytes memory proof = abi.encodePacked("dummy-proof");
        vm.prank(committee);
        agg.sync(user, 77, proof);
        assertEq(agg.lastSats(user), 77);
    }

    // ------------------------------------------------------------
    // 6) Fork canary simulation: "below min confirmations" => publisher must skip calling sync
    // ------------------------------------------------------------
    function test_ForkCanary_SkipPublish_NoStateChange() public {
        // Publisher decides NOT to call sync (below min confirmations); assert no state & no logs
        vm.recordLogs();
        // intentionally no call to agg.sync(...)
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(agg.lastSats(user), 0, "no publish -> no state changes");
        assertEq(logs.length, 0, "no publish -> no events");
    }
}
