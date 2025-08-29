// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";

import "../OracleAggregator.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";
import "../interfaces/IFeePolicy.sol";

/// -------------------------------------------------------------------------
/// Minimal policy that always returns 0 fee (so no topup noise in fuzz/invariants)
/// -------------------------------------------------------------------------
contract FeePolicyZero is IFeePolicy {
    function quoteFees(address, int64) external pure returns (uint256) {
        return 0;
    }
}

/// -------------------------------------------------------------------------
/// Minimal synth that enforces only-oracle gate but does no state writes
/// -------------------------------------------------------------------------
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
        // no-op
    }

    function oracleBurn(address, /*user*/ uint64 /*deltaSats*/ ) external override {
        if (msg.sender != oracle) revert NotOracle();
        // no-op
    }
}

/// -------------------------------------------------------------------------
/// Minimal fee-vault stub (won't be used when fee=0, but aggregator queries it)
/// -------------------------------------------------------------------------
contract FeeVaultStub is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        // with FeePolicyZero, aggregator never calls this (amount == 0)
        if (amount == 0) return;
        uint256 b = bal[user];
        require(b >= amount, "insufficient");
        unchecked {
            bal[user] = b - amount;
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
}

/// ======================================================================
/// Main test suite (fuzz + invariants), NO duplication with existing tests
/// ======================================================================
contract Oracle_BoundaryFuzz_Invariants is StdInvariant, Test {
    // actors
    address internal constant COMMITTEE = address(0xC0117CEe);
    address internal constant USER_A = address(0x0000000000000000000000000000A11CE);
    address internal constant USER_B = address(0x00000000000000000000000000000B0B);
    address internal constant USER_C = address(0x000000000000000000000000000CAFE0);

    // system under test
    OracleAggregator internal agg;
    SynthOnlyOracle internal synth;
    FeeVaultStub internal vault;
    FeePolicyZero internal policy;

    // for invariants
    Handler internal handler;

    // int64 max cached
    uint64 internal constant INT64_MAX_U64 = uint64(type(int64).max);

    function setUp() public {
        // deploy zero-fee setup to avoid topup paths interfering with properties
        vault = new FeeVaultStub();
        policy = new FeePolicyZero();
        synth = new SynthOnlyOracle(address(0xDEAD));

        agg = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            COMMITTEE,
            /*minConfirmations*/
            0,
            /*maxFeePerSyncWei*/
            type(uint256).max
        );
        synth.setOracle(address(agg));

        // --- invariant harness ---
        handler = new Handler(agg, COMMITTEE);
        // direct the invariant fuzzer to call our handler
        targetContract(address(handler));
    }

    // ------------------------------------------------------------
    // 1) Fuzz around int64/uint64 boundary for newBalanceSats
    // ------------------------------------------------------------

    /// Fuzzes arbitrary uint64; if > int64.max -> BalanceOutOfRange revert;
    /// otherwise must set lastSats to x (delta rules handled inside agg).
    function testFuzz_NewBalance_Int64Boundary(uint64 x) public {
        vm.startPrank(COMMITTEE);
        if (x > INT64_MAX_U64) {
            vm.expectRevert(OracleAggregator.BalanceOutOfRange.selector);
            agg.sync(USER_A, x, "");
        } else {
            agg.sync(USER_A, x, "");
            assertEq(agg.lastSats(USER_A), x, "lastSats must equal accepted newBalance");
        }
        vm.stopPrank();
    }

    /// Focused fuzz very close to the boundary to catch off-by-one.
    function testFuzz_Boundary_CloseToInt64Max(uint64 noise) public {
        // Map noise into a small window around INT64_MAX_U64: [max-5, max+5]
        uint64 base = INT64_MAX_U64 > 5 ? (INT64_MAX_U64 - 5) : 0;
        uint64 x = base + (noise % 11); // 0..10 → max-5 .. max+5

        vm.startPrank(COMMITTEE);
        if (x > INT64_MAX_U64) {
            vm.expectRevert(OracleAggregator.BalanceOutOfRange.selector);
            agg.sync(USER_B, x, "");
        } else {
            agg.sync(USER_B, x, "");
            assertEq(agg.lastSats(USER_B), x, "boundary window must be accepted up to int64.max");
        }
        vm.stopPrank();
    }

    // ----------------------------------------------------------------
    // 2) Invariants for multi-user independence & last-value property
    // ----------------------------------------------------------------

    /// The fuzzer will keep calling handler.doSync(...).
    /// We assert global properties here.
    function invariant_MultiUser_StateIndependent() public {
        // The handler tracks a reference model of last written values
        (address[] memory users, uint64[] memory expectVals) = handler.snapshot();

        // a) For each tracked user, on-chain state must match the model
        for (uint256 i = 0; i < users.length; i++) {
            assertEq(agg.lastSats(users[i]), expectVals[i], "model vs on-chain mismatch");
        }

        // b) All stored values must be <= int64.max (by contract design)
        for (uint256 i2 = 0; i2 < users.length; i2++) {
            uint64 v = agg.lastSats(users[i2]);
            assertLe(v, INT64_MAX_U64, "stored value exceeds int64.max");
        }
    }

    // ------------------------------------------------------------
    // 3) Simple gas runs (use with: forge test --gas-report)
    // ------------------------------------------------------------
    function testGas_PositiveThenNoOpThenDown() public {
        vm.startPrank(COMMITTEE);
        agg.sync(USER_C, 200_000, ""); // up
        agg.sync(USER_C, 200_000, ""); // idempotent
        agg.sync(USER_C, 150_000, ""); // down
        vm.stopPrank();
        assertEq(agg.lastSats(USER_C), 150_000);
    }
}

/// =====================================================================================
/// Handler used by StdInvariant: fuzzed calls update both the contract and a model map.
/// =====================================================================================
contract Handler is Test {
    OracleAggregator internal agg;
    address internal committee;

    address[] internal users;
    mapping(address => uint64) internal model;

    uint64 internal constant INT64_MAX_U64 = uint64(type(int64).max);

    constructor(OracleAggregator _agg, address _committee) {
        agg = _agg;
        committee = _committee;

        users.push(address(0x0000000000000000000000000000A11CE));
        users.push(address(0x00000000000000000000000000000B0B));
        users.push(address(0x000000000000000000000000000CAFE0));
    }

    /// Called by the invariant fuzzer with arbitrary inputs
    function doSync(uint8 userSel, uint64 newBal) public {
        address u = users[userSel % users.length];

        vm.startPrank(committee);
        if (newBal > INT64_MAX_U64) {
            // Expect the contract to revert on out-of-range balance
            vm.expectRevert(OracleAggregator.BalanceOutOfRange.selector);
            agg.sync(u, newBal, "");
        } else {
            // Valid: perform sync, update the reference model
            agg.sync(u, newBal, "");
            model[u] = newBal; // idempotent when equal; still "last value wins"
        }
        vm.stopPrank();
    }

    /// Expose a snapshot of users and their expected values for invariant assertions
    function snapshot() external view returns (address[] memory addrs, uint64[] memory vals) {
        addrs = new address[](users.length);
        vals = new uint64[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            address u = users[i];
            addrs[i] = u;
            vals[i] = model[u];
        }
    }
}
