// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFeeVault} from "./interfaces/IFeeVault.sol";

/// @title FeeVault — prepaid fee vault per user (ETH), spendable only by Oracle
/// @notice Users (or anyone on their behalf) prepay ETH fees; the Oracle later spends from that balance on each sync.
/// @dev No owner/admin. Oracle and feeCollector are immutable and set in constructor.
///      Reentrancy-safe; uses checks-effects-interactions for external transfers.
contract FeeVault is IFeeVault {
    // ---------- Errors ----------
    error ZeroAddress();
    error ZeroValue();
    error NotOracle();
    error InsufficientBalance();
    error FeeTransferFailed();
    error WithdrawTransferFailed();

    // ---------- Immutable Config ----------
    /// @notice The on-chain Oracle contract allowed to spend user balances.
    address public immutable oracle;

    /// @notice The fee collector that receives ETH when Oracle spends.
    address payable public immutable feeCollector;

    // ---------- Storage ----------
    mapping(address => uint256) private _balanceOf;

    // Simple nonReentrant guard (minimal; avoids external deps).
    uint256 private _locked = 1;

    modifier nonReentrant() {
        if (_locked != 1) revert();
        _locked = 2;
        _;
        _locked = 1;
    }

    // ---------- Constructor ----------
    /// @param _oracle OracleAggregator contract address (only spender)
    /// @param _feeCollector The recipient of collected fees (ops/treasury/multisig)
    constructor(address _oracle, address payable _feeCollector) {
        if (_oracle == address(0) || _feeCollector == address(0)) revert ZeroAddress();
        oracle = _oracle;
        feeCollector = _feeCollector;
    }

    // ---------- IFeeVault API ----------
    /// @inheritdoc IFeeVault
    function depositETH(address user) external payable override nonReentrant {
        if (user == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroValue();

        _balanceOf[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    /// @inheritdoc IFeeVault
    function balanceOf(address user) external view override returns (uint256) {
        return _balanceOf[user];
    }

    /// @inheritdoc IFeeVault
    function spendFrom(address user, uint256 amount) external override nonReentrant {
        if (msg.sender != oracle) revert NotOracle();
        if (amount == 0) revert ZeroValue();

        uint256 bal = _balanceOf[user];
        if (bal < amount) revert InsufficientBalance();

        // Effects
        unchecked {
            _balanceOf[user] = bal - amount;
        }

        // Interactions — fees go to the designated collector
        // This low-level call is intentional: we forward all gas and bubble failure via custom error.
        // slither-disable-next-line low-level-calls
        (bool ok,) = feeCollector.call{value: amount}("");
        if (!ok) revert FeeTransferFailed();

        emit Spent(user, amount, msg.sender);
    }

    /// @inheritdoc IFeeVault
    function withdrawUnused() external override nonReentrant {
        uint256 bal = _balanceOf[msg.sender];
        if (bal == 0) revert InsufficientBalance();

        _balanceOf[msg.sender] = 0;

        // Interactions — return ETH to the caller
        // This low-level call is intentional: we forward all gas and bubble failure via custom error.
        // slither-disable-next-line low-level-calls
        (bool ok,) = payable(msg.sender).call{value: bal}("");
        if (!ok) revert WithdrawTransferFailed();

        emit Withdrawn(msg.sender, bal);
    }

    // ---------- Safety ----------
    /// @dev Disallow blind ETH transfers; deposits must go through depositETH(user).
    receive() external payable {
        revert("DIRECT_ETH_REJECTED");
    }

    fallback() external payable {
        revert("DIRECT_CALL_REJECTED");
    }
}
