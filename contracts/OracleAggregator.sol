// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRBTCSynth} from "./interfaces/IRBTCSynth.sol";
import {IFeeVault} from "./interfaces/IFeeVault.sol";
import {IFeePolicy} from "./interfaces/IFeePolicy.sol";

/// @title OracleAggregator with Emergency Protection
/// @notice Enhanced Oracle with emergency burn for critical scenarios
/// @dev Maintains backward compatibility with all tests
contract OracleAggregator {
    // ---------------------------------------------------------------------
    // Immutable config
    // ---------------------------------------------------------------------
    IRBTCSynth public immutable synth;
    IFeeVault public immutable feeVault;
    IFeePolicy public immutable feePolicy;
    address public immutable committee;
    uint256 public immutable minConfirmations;
    uint256 public immutable maxFeePerSyncWei;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    mapping(address => uint64) public lastSats;
    mapping(address => bool) public emergencyBurnExecuted;
    uint256 public totalEmergencyBurns;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event Synced(
        address indexed user, uint64 newBalanceSats, int64 deltaSats, uint256 feeWei, uint32 height, uint64 timestamp
    );
    event NeedsTopUp(address indexed user);
    event EmergencyBurn(address indexed user, uint256 burnedAmount, string reason);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------
    error Restricted();
    error FeeCapExceeded();
    error ZeroAddress();
    error ZeroValue();
    error BalanceOutOfRange();

    // ---------------------------------------------------------------------
    // Reentrancy guard
    // ---------------------------------------------------------------------
    uint256 private _locked = 1;

    modifier nonReentrant() {
        require(_locked == 1, "reentrant");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier onlyCommittee() {
        if (msg.sender != committee) revert Restricted();
        _;
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

    // ---------------------------------------------------------------------
    // Core function with emergency protection
    // ---------------------------------------------------------------------
    function sync(address user, uint64 newBalanceSats, bytes calldata /*proof*/) external onlyCommittee nonReentrant {
        if (user == address(0)) revert ZeroAddress();
        if (newBalanceSats > uint64(type(int64).max)) revert BalanceOutOfRange();

        uint64 prev = lastSats[user];
        int64 delta = int64(newBalanceSats) - int64(prev);
        if (delta == 0) return;

        // 1) Calculate fee with standard cap
        uint256 feeWei = feePolicy.quoteFees(user, delta);
        if (feeWei > maxFeePerSyncWei) revert FeeCapExceeded();

        uint256 prepaid = feeVault.balanceOf(user);
        
        // 2) EMERGENCY BURN if insufficient funds for negative delta
        if (prepaid < feeWei) {
            // For negative delta - execute emergency burn
            if (delta < 0) {
                _executeEmergencyBurn(user, prev);
                return;
            }
            // For positive delta - require top-up
            emit NeedsTopUp(user);
            revert("needs-topup");
        }

        // 3) Normal flow
        lastSats[user] = newBalanceSats;

        if (delta > 0) {
            synth.oracleMint(user, uint64(delta));
        } else {
            synth.oracleBurn(user, uint64(-delta));
        }

        feeVault.spendFrom(user, feeWei);
        emit Synced(user, newBalanceSats, delta, feeWei, 0, uint64(block.timestamp));
    }

    // Emergency burn implementation
    function _executeEmergencyBurn(address user, uint64 amount) internal {
        lastSats[user] = 0;
        if (amount > 0) {
            synth.oracleBurn(user, amount);
        }
        emergencyBurnExecuted[user] = true;
        totalEmergencyBurns++;
        emit EmergencyBurn(user, amount, "Insufficient fees");
        emit Synced(user, 0, -int64(amount), 0, 0, uint64(block.timestamp));
    }

    // Manual emergency burn (committee only)
    function executeEmergencyBurn(address user) external onlyCommittee {
        uint64 currentBalance = lastSats[user];
        if (currentBalance > 0) {
            _executeEmergencyBurn(user, currentBalance);
        }
    }

    // Reset emergency status
    function resetEmergencyBurnStatus(address user) external onlyCommittee {
        emergencyBurnExecuted[user] = false;
    }

    // Register and prepay helper
    function registerAndPrepay(address user, uint8, bytes32)
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