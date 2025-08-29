// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFeePolicy — quotes protocol/ops fee for a sync delta
interface IFeePolicy {
    /// @return feeWei Total fee in wei (percentage may apply only to positive deltas).
    function quoteFees(address user, int64 deltaSats) external view returns (uint256 feeWei);
}
