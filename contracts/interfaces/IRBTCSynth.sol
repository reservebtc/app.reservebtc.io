// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IRBTCSynth — oracle-gated mint/burn surface
interface IRBTCSynth {
    function oracleMint(address user, uint64 deltaSats) external;
    function oracleBurn(address user, uint64 deltaSats) external;
}
