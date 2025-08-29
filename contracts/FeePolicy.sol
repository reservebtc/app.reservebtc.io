// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFeePolicy} from "./interfaces/IFeePolicy.sol";

/// @title FeePolicy — protocol/ops fee calculator
/// @notice Charges percentage only on positive deltas (+Δ), plus optional fixed fee per sync.
/// @dev pctBps is basis points (1% = 100). weiPerSat converts sats to wei for percentage leg.
///      If you want only fixed fee, set pctBps=0 or weiPerSat=0.
contract FeePolicy is IFeePolicy {
    /// @notice Percentage leg in basis points (e.g., 10 = 0.1%).
    uint256 public immutable pctBps;

    /// @notice Fixed fee per sync (wei). Can be zero.
    uint256 public immutable fixedWei;

    /// @notice Conversion for percentage leg (wei per sat). Can be zero.
    uint256 public immutable weiPerSat;

    constructor(uint256 _pctBps, uint256 _fixedWei, uint256 _weiPerSat) {
        pctBps = _pctBps;
        fixedWei = _fixedWei;
        weiPerSat = _weiPerSat;
    }

    /// @inheritdoc IFeePolicy
    function quoteFees(address, /*user*/ int64 deltaSats) external view returns (uint256 feeWei) {
        // Percentage applies only to positive delta (mint).
        if (deltaSats > 0 && pctBps > 0 && weiPerSat > 0) {
            // Safe: cast the positive part into uint64 -> uint256.
            uint256 d = uint256(uint64(deltaSats));
            // fee = d * weiPerSat * pctBps / 10_000
            feeWei = (d * weiPerSat * pctBps) / 10_000;
        }
        // Add fixed leg (always charged if > 0).
        feeWei += fixedWei;
    }
}
