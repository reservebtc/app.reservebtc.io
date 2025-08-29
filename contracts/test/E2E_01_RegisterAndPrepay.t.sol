// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../FeeVault.sol";
import "../interfaces/IRBTCSynth.sol";

/// @dev Minimal IRBTCSynth stub; mint/burn are unused in this test.
contract SynthStub is IRBTCSynth {
    constructor(address) {}
    function oracleMint(address, uint64) external override {}
    function oracleBurn(address, uint64) external override {}
}

contract E2E_01_RegisterAndPrepay is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVault         internal vault;
    SynthStub        internal synth;

    address internal committee;
    address internal user;

    // Project-style params (values do not affect this specific test)
    uint256 constant PCT_BPS     = 10;             // 0.10%
    uint256 constant FIXED_WEI   = 0;
    uint256 constant WEI_PER_SAT = 1_000_000_000;  // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;

    function setUp() public {
        committee = makeAddr("committee");
        user      = makeAddr("user");

        // Real contracts from the project
        policy = new FeePolicy(PCT_BPS, FIXED_WEI, WEI_PER_SAT);
        // FeeVault(oracle, feeCollector). For this test we do not spend; using committee as oracle is fine.
        vault  = new FeeVault(committee, payable(address(0xCAFE)));
        synth  = new SynthStub(address(0));

        oracle = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );
    }

    /// @notice registerAndPrepay must credit the user's FeeVault balance by msg.value.
    function test_RegisterAndPrepay_DepositsToVault() public {
        uint256 beforeBal = vault.balanceOf(user);

        // registerAndPrepay is committee-only → call from committee and send value from committee
        vm.deal(committee, 1 ether);
        vm.prank(committee);
        oracle.registerAndPrepay{value: 1 ether}(user, 1, bytes32(0));

        assertEq(vault.balanceOf(user), beforeBal + 1 ether, "vault deposit mismatch");
    }
}