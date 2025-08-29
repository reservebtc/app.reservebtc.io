// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeeVault.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// Minimal synth mock that allows only-oracle calls
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
    }

    function oracleBurn(address, uint64) external override {
        if (msg.sender != oracle) revert NotOracle();
    }
}

/// Simple FeeVault mock
contract FeeVaultMock is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
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

contract Oracle_NegativeDelta_NoFee_Unit is Test {
    address internal constant COMMITTEE = address(0xC0117CEe);
    address internal constant USER = address(0xA11CE);

    OracleAggregator internal agg;
    SynthOnlyOracle internal synth;
    FeeVaultMock internal vault;
    FeePolicy internal policy;

    function setUp() public {
        vm.deal(COMMITTEE, 10 ether);

        vault = new FeeVaultMock();
        policy = new FeePolicy(
            0, // 0% fee
            0, // no fixed fee
            0 // no per-sat fee
        );
        synth = new SynthOnlyOracle(address(0xDEAD));

        agg = new OracleAggregator(address(synth), address(vault), address(policy), COMMITTEE, 0, type(uint256).max);
        synth.setOracle(address(agg));
    }

    /// Negative delta should burn without charging any fee
    function test_NegativeDelta_NoFee() public {
        // initial up: set balance to 1000
        vm.startPrank(COMMITTEE);
        agg.sync(USER, 1000, "");
        assertEq(agg.lastSats(USER), 1000);

        // negative delta: go down to 400
        uint256 vaultBefore = vault.balanceOf(USER);
        agg.sync(USER, 400, "");
        uint256 vaultAfter = vault.balanceOf(USER);

        assertEq(agg.lastSats(USER), 400, "lastSats should update downwards");
        assertEq(vaultAfter, vaultBefore, "no fee deducted for negative delta");
        vm.stopPrank();
    }

    /// Gas snapshot for negative delta case
    function testGas_NegativeDelta() public {
        vm.startPrank(COMMITTEE);
        agg.sync(USER, 5000, ""); // initial up
        agg.sync(USER, 3000, ""); // negative delta
        vm.stopPrank();
    }
}
