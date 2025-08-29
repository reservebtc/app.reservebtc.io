// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFeeVault — prepaid fee store per user
interface IFeeVault {
    event Deposited(address indexed user, uint256 amount);
    event Spent(address indexed user, uint256 amount, address indexed by);
    event Withdrawn(address indexed user, uint256 amount);

    function depositETH(address user) external payable;
    function balanceOf(address user) external view returns (uint256);
    function spendFrom(address user, uint256 amount) external;
    function withdrawUnused() external;
}
