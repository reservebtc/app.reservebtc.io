// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../RBTCSynth.sol";

contract RBTCSynthTest is Test {
    address oracle = address(this);
    address user = address(0xABCD);
    RBTCSynth synth;

    function setUp() public {
        synth = new RBTCSynth(oracle);
    }

    function test_MintBurn_ByOracle() public {
        synth.oracleMint(user, 100_000);
        assertEq(synth.balanceOf(user), 100_000);
        assertEq(synth.totalSupply(), 100_000);

        synth.oracleBurn(user, 40_000);
        assertEq(synth.balanceOf(user), 60_000);
        assertEq(synth.totalSupply(), 60_000);
    }

    function test_Soulbound_RevertsTransfers() public {
        vm.expectRevert(RBTCSynth.Soulbound.selector);
        (bool ok,) = address(synth).call(abi.encodeWithSignature("transfer(address,uint256)", address(1), 1));
        ok; // silence
    }

    function test_OnlyOracle() public {
        vm.prank(address(0xBEEF));
        vm.expectRevert(RBTCSynth.Restricted.selector);
        synth.oracleMint(user, 1);
    }
}
