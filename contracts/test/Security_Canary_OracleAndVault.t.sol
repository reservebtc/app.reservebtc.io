// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// ------------------------------------------------------------------------
/// Minimal compatible Synth mock
/// ------------------------------------------------------------------------
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

/// ------------------------------------------------------------------------
/// Self-destructing FeeVault mock (fee collector)
/// ------------------------------------------------------------------------
contract BoomVault is IFeeVault {
    mapping(address => uint256) public bal;
    bool internal dead; // kill-switch after boom()

    function depositETH(address user) external payable override {
        require(!dead, "dead");
        require(user != address(0), "user=0");
        require(msg.value > 0, "value=0");
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        require(!dead, "dead"); // simulate collector failure after self-destruct
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

    /// @dev Canary: mark as dead and attempt to transfer ETH out.
    function boom(address payable sink) external {
        dead = true;            // ensure subsequent spendFrom/deposit revert
        selfdestruct(sink);     // after Cancun, code remains; only ETH may transfer
    }

    receive() external payable {}
}

/// ------------------------------------------------------------------------
/// Security canaries:
/// 1) OracleAggregator constructor must revert on zero addresses.
/// 2) If fee collector (vault) self-destructs, sync must not partially mutate
///    protocol state (no mint/burn drift on failed fee spend).
/// ------------------------------------------------------------------------
contract Security_Canary_OracleAndVault is Test {
    // Common params
    address internal committee;
    address internal user;

    // Base fee policy (same shape as in E2E)
    uint256 constant PCT_BPS     = 10;              // 0.10%
    uint256 constant FIXED_WEI   = 0;
    uint256 constant WEI_PER_SAT = 1_000_000_000;   // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;

    SynthMock internal synth;
    FeePolicy internal policy;

    function setUp() public {
        committee = makeAddr("committee");
        user      = makeAddr("user");

        synth  = new SynthMock();
        policy = new FeePolicy(PCT_BPS, FIXED_WEI, WEI_PER_SAT);
    }

    /// --------------------------------------------------------------------
    /// 1) OracleAggregator constructor — zero address canaries.
    /// We validate that each address parameter is required to be non-zero.
    /// --------------------------------------------------------------------
    function test_OracleAggregator_Constructor_ZeroAddresses_Revert() public {
        BoomVault vault = new BoomVault();

        // zero synth
        vm.expectRevert();
        new OracleAggregator(
            address(0),
            address(vault),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        // zero vault
        vm.expectRevert();
        new OracleAggregator(
            address(synth),
            address(0),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        // zero policy
        vm.expectRevert();
        new OracleAggregator(
            address(synth),
            address(vault),
            address(0),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        // zero committee
        vm.expectRevert();
        new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            address(0),
            MIN_CONF,
            FEE_CAP
        );
    }

    /// --------------------------------------------------------------------
    /// 2) Fee collector self-destruct safety:
    /// - Register & prepay to set up balances.
    /// - Destroy fee collector contract.
    /// - Attempt sync(+delta) which needs a fee spend.
    /// - Expect revert (spendFrom call cannot succeed), and ensure *no* partial
    ///   state mutation happened (user balance and totalSupply unchanged).
    /// --------------------------------------------------------------------
    function test_FeeCollector_SelfDestruct_SyncDoesNotCorruptState() public {
        // Deploy fresh vault and aggregator
        BoomVault vault = new BoomVault();
        OracleAggregator oracle = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );

        // Register & prepay (from committee), deposit enough for at least one +delta
        vm.deal(committee, 3 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));

        // Snapshot pre-state
        uint256 userBalBefore  = synth.balanceOf(user);
        uint256 totalBefore    = synth.totalSupply();
        uint256 vaultBefore    = vault.balanceOf(user);

        // Destroy the fee collector code
        vm.prank(committee);
        vault.boom(payable(committee));

        // Try a +delta: should fail due to spendFrom call to dead vault
        uint64 target = uint64(userBalBefore + 1); // +1 sat
        vm.expectRevert(); // any revert is acceptable; key point is: no partial state change
        vm.prank(committee);
        oracle.sync(user, target, "");

        // Post-state must be unchanged
        assertEq(synth.balanceOf(user), userBalBefore, "user balance must remain unchanged");
        assertEq(synth.totalSupply(),   totalBefore,   "totalSupply must remain unchanged");

        // Vault balance technically no longer readable (code gone), but our
        // storage read via interface should still return last value for the test mock.
        // The critical invariant is protocol state integrity, not vault accounting here.
        assertEq(vaultBefore, vault.balanceOf(user), "stored vault balance mapping should be intact");
    }
}