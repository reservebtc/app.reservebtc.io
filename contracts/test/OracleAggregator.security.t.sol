// ============================================================================
// File: test/OracleAggregator.security.t.sol
// ============================================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../FeeVault.sol"; // used only in NeedsTopUp test
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

contract MockFeeVault is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        bal[user] += msg.value;
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        require(bal[user] >= amount, "insufficient");
        unchecked {
            bal[user] -= amount;
        }
        // no external transfer in the mock
    }

    function withdrawUnused() external override {
        uint256 amount = bal[msg.sender];
        require(amount > 0, "no-balance");
        bal[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "withdraw-failed");
    }

    receive() external payable {}
}

contract RevertingSynth is IRBTCSynth {
    function oracleMint(address, uint64) external pure {
        revert("mint-fail");
    }

    function oracleBurn(address, uint64) external pure {
        revert("burn-fail");
    }
}

contract LateRevertingVault is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        bal[user] += msg.value;
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address, uint256) external pure override {
        revert("post-check-revert"); // reverts after balance check in aggregator
    }

    function withdrawUnused() external override {}
}

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

contract OracleAggregatorSecurityTest is Test {
    address committee = address(this);
    address user = address(0xABCD);

    MockSynth synth;
    FeePolicy policy;
    OracleAggregator agg;
    MockFeeVault vault; // mock vault for most tests

    event NeedsTopUp(address indexed user);

    function setUp() public {
        synth = new MockSynth();
        // FeePolicy: pct = 0.1% (10 bps), fixed = 0, weiPerSat = 1 gwei
        policy = new FeePolicy(10, 0, 1_000_000_000);
        vault = new MockFeeVault();

        // cap = 1 ether, minConf = 3
        agg = new OracleAggregator(address(synth), address(vault), address(policy), committee, 3, 1 ether);

        vm.deal(address(this), 100 ether);
        vm.deal(user, 100 ether);

        // Prepay via aggregator helper (goes into mock vault)
        agg.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));
    }

    function test_OnlyCommittee() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(OracleAggregator.Restricted.selector);
        agg.sync(user, 1, "");
    }

    function test_SynthMintRevert_NoStateChange() public {
        RevertingSynth rs = new RevertingSynth();
        // reuse the mock vault from setUp
        OracleAggregator fresh =
            new OracleAggregator(address(rs), address(vault), address(policy), committee, 3, 1 ether);
        vm.expectRevert(bytes("mint-fail"));
        fresh.sync(user, 100_000, "");
        assertEq(fresh.lastSats(user), 0);
    }

    function test_SpendFromRevert_NoStateChange() public {
        LateRevertingVault lv = new LateRevertingVault();
        vm.deal(address(lv), 1 ether);

        OracleAggregator fresh =
            new OracleAggregator(address(synth), address(lv), address(policy), committee, 3, 1 ether);

        // Prepay directly into the late-reverting vault
        lv.depositETH{value: 1 ether}(user);

        vm.expectRevert(bytes("post-check-revert"));
        fresh.sync(user, 100_000, "");
        assertEq(fresh.lastSats(user), 0);
    }

    function test_FeeCap_Boundary() public {
        // fee for +100_000 sats under current policy: fee = 1e11 wei
        uint256 fee = (uint256(100_000) * 1_000_000_000 * 10) / 10_000;

        // Cap == fee (should pass)
        OracleAggregator ok = new OracleAggregator(
            address(synth),
            address(vault), // same mock vault with prepaid funds
            address(policy),
            committee,
            3,
            fee
        );
        ok.sync(user, 100_000, "");
        assertEq(ok.lastSats(user), 100_000);

        // Cap < fee (should revert)
        OracleAggregator bad =
            new OracleAggregator(address(synth), address(vault), address(policy), committee, 3, fee - 1);
        vm.expectRevert(OracleAggregator.FeeCapExceeded.selector);
        bad.sync(user, 100_000, "");
    }

    function test_NeedsTopUp_EmitsAndReverts() public {
        // Use a fresh real FeeVault with empty balance; oracle mismatch is OK since we revert before spendFrom
        IFeeVault emptyVault = IFeeVault(address(new FeeVault(address(this), payable(address(0xFEE)))));

        OracleAggregator fresh =
            new OracleAggregator(address(synth), address(emptyVault), address(policy), committee, 3, 1 ether);

        vm.expectEmit(true, false, false, true, address(fresh));
        emit NeedsTopUp(user);

        vm.expectRevert(bytes("needs-topup"));
        fresh.sync(user, 100_000, "");
    }

    function test_MultiStepDelta_Correctness() public {
        // up
        agg.sync(user, 200_000, "");
        assertEq(agg.lastSats(user), 200_000);
        // down
        agg.sync(user, 50_000, "");
        assertEq(agg.lastSats(user), 50_000);
        // up again
        agg.sync(user, 120_000, "");
        assertEq(agg.lastSats(user), 120_000);
    }
}
