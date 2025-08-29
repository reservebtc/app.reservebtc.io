// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRBTCSynth} from "./interfaces/IRBTCSynth.sol";
import {IFeeVault} from "./interfaces/IFeeVault.sol";
import {IFeePolicy} from "./interfaces/IFeePolicy.sol";

/// @title OracleAggregator (MVP)
/// @notice Applies on-chain BTC balance deltas and charges protocol fees from FeeVault.
/// @dev No owner/admin. All external addresses are immutable. Proof validation is off-chain in MVP.
///      Access is gated by `committee` (the publisher service) to avoid arbitrary mint/burn.
contract OracleAggregator {
    // ---------------------------------------------------------------------
    // Immutable config
    // ---------------------------------------------------------------------
    IRBTCSynth public immutable synth;
    IFeeVault public immutable feeVault;
    IFeePolicy public immutable feePolicy;

    /// @notice Address allowed to call `sync` (oracle publisher/committee).
    address public immutable committee;

    /// @notice Minimum confirmations required (informational in MVP).
    uint256 public immutable minConfirmations;

    /// @notice Max fee allowed to be charged per sync (wei).
    uint256 public immutable maxFeePerSyncWei;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    /// @notice Last confirmed BTC balance in sats for the user.
    /// @dev Stored as uint64; we validate the input to fit into int64 range
    ///      so casts for signed delta stay safe forever.
    mapping(address => uint64) public lastSats;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event Synced(
        address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp
    );

    event NeedsTopUp(address indexed user);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------
    error Restricted();
    error FeeCapExceeded();
    error ZeroAddress();
    error ZeroValue();
    error BalanceOutOfRange();

    // ---------------------------------------------------------------------
    // Reentrancy guard (minimal, dependency-free)
    // ---------------------------------------------------------------------
    uint256 private _locked = 1;

    modifier nonReentrant() {
        require(_locked == 1, "reentrant");
        _locked = 2;
        _;
        _locked = 1;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(
        address synth_,
        address feeVault_,
        address feePolicy_,
        address committee_,
        uint256 minConf_,
        uint256 maxFeePerSyncWei_
    ) {
        if (synth_ == address(0) || feeVault_ == address(0) || feePolicy_ == address(0) || committee_ == address(0)) {
            revert ZeroAddress();
        }

        synth = IRBTCSynth(synth_);
        feeVault = IFeeVault(feeVault_);
        feePolicy = IFeePolicy(feePolicy_);
        committee = committee_;
        minConfirmations = minConf_;
        maxFeePerSyncWei = maxFeePerSyncWei_;
    }

    modifier onlyCommittee() {
        if (msg.sender != committee) revert Restricted();
        _;
    }

    // ---------------------------------------------------------------------
    // Core
    // ---------------------------------------------------------------------

    /// @notice Apply a new confirmed BTC balance (in sats) and charge fees.
    /// @param user The user whose BTC balance is being synchronized.
    /// @param newBalanceSats New confirmed BTC balance in sats (uint64).
    /// @param /*proof*/ Reserved for future on-chain proof validation; unused in MVP.
    function sync(address user, uint64 newBalanceSats, bytes calldata /*proof*/ ) external onlyCommittee nonReentrant {
        if (user == address(0)) revert ZeroAddress();

        // Enforce int64-safe range to avoid undefined behavior on casting.
        // type(int64).max == 2^63 - 1
        if (newBalanceSats > uint64(type(int64).max)) revert BalanceOutOfRange();

        uint64 prev = lastSats[user];
        int64 delta = int64(newBalanceSats) - int64(prev);
        if (delta == 0) {
            return; // idempotent no-op
        }

        // 1) Quote fee & checks
        uint256 feeWei = feePolicy.quoteFees(user, delta);
        if (feeWei > maxFeePerSyncWei) revert FeeCapExceeded();

        uint256 prepaid = feeVault.balanceOf(user);
        if (prepaid < feeWei) {
            emit NeedsTopUp(user);
            revert("needs-topup");
        }

        // 2) Effects first (safe with nonReentrant; any revert below rolls this back)
        lastSats[user] = newBalanceSats;

        // 3) Interactions
        if (delta > 0) {
            // mint positive delta
            synth.oracleMint(user, uint64(uint64(delta)));
        } else {
            // burn negative delta
            uint64 burn = uint64(uint64(-delta));
            synth.oracleBurn(user, burn);
        }

        // Charge fee
        feeVault.spendFrom(user, feeWei);

        // 4) Emit after successful external calls
        emit Synced(user, newBalanceSats, delta, feeWei, 0, uint64(block.timestamp));
    }

    /// @notice (Optional) Single-tx helper for publisher to prepay on behalf of user.
    /// @dev Committee-only to prevent griefing; funds are credited to user's FeeVault balance.
    function registerAndPrepay(address user, uint8, /*method*/ bytes32 /*checksum*/ )
        external
        payable
        onlyCommittee
        nonReentrant
    {
        if (user == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroValue();
        feeVault.depositETH{value: msg.value}(user);
    }
}
