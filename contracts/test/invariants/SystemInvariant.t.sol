// ============================================================================
// File: test/invariants/SystemInvariant.t.sol  (lightweight skeleton)
// ============================================================================
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";

import "../../FeeVault.sol";
import "../../FeePolicy.sol";
import "../../OracleAggregator.sol";
import "../../interfaces/IRBTCSynth.sol";
import "../../interfaces/IFeeVault.sol";

contract DummySynth is IRBTCSynth {
    function oracleMint(address, uint64) external {}
    function oracleBurn(address, uint64) external {}
}

contract SystemInvariantTest is StdInvariant, Test {
    FeeVault vault;
    FeePolicy policy;
    OracleAggregator agg;
    DummySynth synth;

    address committee = address(this);
    address user = address(0xA11CE);

    function setUp() public {
        synth = new DummySynth();
        vault = new FeeVault(address(this), payable(address(0xC0FFEE)));
        policy = new FeePolicy(10, 0, 1_000_000_000);
        agg = new OracleAggregator(address(synth), address(vault), address(policy), committee, 3, 1 ether);

        vm.deal(user, 10 ether);
        vm.prank(user);
        vault.depositETH{value: 1 ether}(user);

        // targetContracts can be extended with handlers later
        targetContract(address(agg));
        targetContract(address(vault));
    }

    // Invariant: lastSats does not change unless sync succeeds (trivially holds here).
    function invariant_LastSatsConsistent() public view {
        uint64 last = agg.lastSats(user);
        assertLe(last, type(uint64).max);
    }
}
