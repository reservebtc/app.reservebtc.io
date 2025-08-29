// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";

import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

// ------------------------
// Simple mocks for testing
// ------------------------
contract MockSynth is IRBTCSynth {
    event MintCalled(address user, uint64 delta);
    event BurnCalled(address user, uint64 delta);

    uint64 public lastMint;
    uint64 public lastBurn;
    address public lastUserMint;
    address public lastUserBurn;

    function oracleMint(address user, uint64 deltaSats) external {
        lastUserMint = user;
        lastMint = deltaSats;
        emit MintCalled(user, deltaSats);
    }

    function oracleBurn(address user, uint64 deltaSats) external {
        lastUserBurn = user;
        lastBurn = deltaSats;
        emit BurnCalled(user, deltaSats);
    }
}

contract MockFeeVault is IFeeVault {
    // Use public mapping to read balances in tests.
    mapping(address => uint256) public bal;

    // NOTE: DO NOT re-declare events here; they already exist in IFeeVault.

    function depositETH(address user) external payable override {
        bal[user] += msg.value;
        // we don't emit events in the mock (not required)
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        require(bal[user] >= amount, "insufficient");
        unchecked {
            bal[user] -= amount;
        }
        // no external transfers in the mock
    }

    function withdrawUnused() external override {
        uint256 amount = bal[msg.sender];
        require(amount > 0, "no-balance");
        bal[msg.sender] = 0;
        // simulate returning ETH to msg.sender
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "withdraw-failed");
    }

    // allow receiving ETH for test funding paths if needed
    receive() external payable {}
}

// ------------------------
// OracleAggregator tests
// ------------------------
contract OracleAggregatorTest is Test {
    address committee = address(this);
    address user = address(0xABCD);

    MockSynth synth;
    MockFeeVault vault;
    FeePolicy policy;
    OracleAggregator agg;

    function setUp() public {
        synth = new MockSynth();
        vault = new MockFeeVault();

        // FeePolicy: pct=10 bps (0.1%), fixed=0, weiPerSat=1 gwei
        policy = new FeePolicy(10, 0, 1_000_000_000);

        // minConf = 3 (informational), cap = 1 ether
        agg = new OracleAggregator(address(synth), address(vault), address(policy), committee, 3, 1 ether);

        vm.deal(address(this), 100 ether);
        vm.deal(user, 100 ether);
    }

    function _prepay(address u, uint256 amount) internal {
        // Use aggregator helper to deposit via feeVault
        agg.registerAndPrepay{value: amount}(u, 1, bytes32(0));
    }

    function test_PositiveDelta_MintsAndChargesFee() public {
        // Δ = +100_000 sats; fee = delta * 1 gwei * 10 / 10_000 = 100_000 * 1e9 / 1000 = 1e11 wei
        uint256 expectedFee = (uint256(100_000) * 1_000_000_000 * 10) / 10_000;
        _prepay(user, expectedFee + 1); // ensure enough

        agg.sync(user, 100_000, "");

        assertEq(agg.lastSats(user), 100_000);
        assertEq(synth.lastMint(), 100_000);
        assertEq(synth.lastUserMint(), user);
        // vault balance decreased by fee
        assertEq(vault.bal(user), 1); // leftover 1 wei
    }

    function test_NegativeDelta_Burns() public {
        // First set lastSats to 200k
        _prepay(user, 1 ether);
        agg.sync(user, 200_000, "");

        // Now go down to 50k: Δ = -150_000
        uint256 beforeBal = vault.bal(user);
        agg.sync(user, 50_000, "");

        assertEq(agg.lastSats(user), 50_000);
        assertEq(synth.lastBurn(), 150_000);
        assertEq(synth.lastUserBurn(), user);
        // Fee for negative delta = fixed only (0), so balance unchanged
        assertEq(vault.bal(user), beforeBal);
    }

    function test_ZeroDelta_NoOp() public {
        _prepay(user, 1 ether);
        agg.sync(user, 42, "");
        uint256 before = vault.bal(user);

        // Same balance → no-op
        agg.sync(user, 42, "");
        assertEq(agg.lastSats(user), 42);
        // No new mint/burn; fees unchanged
        assertEq(vault.bal(user), before);
    }

    function test_FeeCap_Reverts() public {
        // Set a policy that would exceed cap by raising weiPerSat massively
        FeePolicy big = new FeePolicy(10_000, 0, 1 ether); // absurd numbers to exceed cap
        agg = new OracleAggregator(address(synth), address(vault), address(big), committee, 3, 0.1 ether);

        _prepay(user, 1 ether);
        vm.expectRevert(OracleAggregator.FeeCapExceeded.selector);
        agg.sync(user, 1, "");
    }

    function test_NeedsTopUp_EventAndRevert() public {
        // Not enough prepaid balance for expected fee
        // expected fee for +100_000 as in positive test = 1e11 wei
        vm.expectEmit(true, false, false, true);
        emit OracleAggregator.NeedsTopUp(user);

        vm.expectRevert(bytes("needs-topup"));
        agg.sync(user, 100_000, "");
    }
}
