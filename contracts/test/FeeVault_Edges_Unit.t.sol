// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../FeeVault.sol";

contract FeeVault_Edges_Unit is Test {
    // actors
    address internal constant USER_A = address(0xA11CE);
    address internal constant USER_B = address(0xB0B);
    address payable internal constant COLLECTOR = payable(address(0xCA11EC7));

    // the test contract will be the oracle (allowed to spend)
    address internal constant ORACLE = address(uint160(uint256(keccak256("ORACLE"))));

    FeeVault internal vault;

    function setUp() public {
        // fund actors
        vm.deal(USER_A, 100 ether);
        vm.deal(USER_B, 100 ether);

        // deploy vault with oracle = this test (we'll prank as ORACLE)
        // but msg.sender in setUp is this contract; to match spendFrom gating we pass ORACLE
        vault = new FeeVault(ORACLE, COLLECTOR);

        // also fund oracle to be able to pay gas if ever needed
        vm.deal(ORACLE, 1 ether);
    }

    /// 1 wei deposit and exact spend -> zero; collector receives +1 wei.
    function test_Deposit1Wei_And_SpendToZero() public {
        // deposit 1 wei to USER_A
        vm.prank(USER_A);
        vault.depositETH{value: 1}(USER_A);
        assertEq(vault.balanceOf(USER_A), 1);

        // spend as oracle
        uint256 before = COLLECTOR.balance;
        vm.prank(ORACLE);
        vault.spendFrom(USER_A, 1);

        assertEq(vault.balanceOf(USER_A), 0, "user balance must be zero");
        assertEq(COLLECTOR.balance, before + 1, "collector must receive 1 wei");
    }

    /// Large deposit and a sequence of tiny spends that exactly zero the balance.
    function test_LargeAndTinySpends_ExactZero() public {
        // deposit 10 wei to USER_A
        vm.prank(USER_A);
        vault.depositETH{value: 10}(USER_A);
        assertEq(vault.balanceOf(USER_A), 10);

        // split 10 wei into 1+2+3+4
        uint256 before = COLLECTOR.balance;

        vm.startPrank(ORACLE);
        vault.spendFrom(USER_A, 1);
        vault.spendFrom(USER_A, 2);
        vault.spendFrom(USER_A, 3);
        vault.spendFrom(USER_A, 4);
        vm.stopPrank();

        assertEq(vault.balanceOf(USER_A), 0, "user balance must be zero after exact split");
        assertEq(COLLECTOR.balance, before + 10, "collector must receive full amount");
    }

    /// Big number sanity: deposit/spend 50 ether without rounding issues.
    function test_BigAmounts_NoRounding() public {
        uint256 amount = 50 ether;
        vm.prank(USER_B);
        vault.depositETH{value: amount}(USER_B);
        assertEq(vault.balanceOf(USER_B), amount);

        uint256 before = COLLECTOR.balance;
        vm.prank(ORACLE);
        vault.spendFrom(USER_B, amount);
        assertEq(vault.balanceOf(USER_B), 0, "must be zero after full spend");
        assertEq(COLLECTOR.balance, before + amount, "collector must receive full amount");
    }

    /// receive() must always revert
    function test_Receive_Reverts() public {
        vm.expectRevert(bytes("DIRECT_ETH_REJECTED"));
        (bool ok,) = address(vault).call{value: 1}("");
        ok; // silence warning
    }

    /// fallback() must always revert (unknown selector)
    function test_Fallback_Reverts() public {
        vm.expectRevert(bytes("DIRECT_CALL_REJECTED"));
        (bool ok,) = address(vault).call(abi.encodeWithSignature("notExistingFunction()"));
        ok; // silence warning
    }
}
