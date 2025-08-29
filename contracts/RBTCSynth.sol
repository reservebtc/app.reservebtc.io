// contracts/RBTCSynth.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IRBTCSynth} from "./interfaces/IRBTCSynth.sol";

/// @title rBTC-SYNTH (soulbound mirror of on-chain BTC balance)
/// @notice Non-transferable accounting token; mint/burn can be called only by the oracle.
/// @dev Decimals = 8 to match sats; all ERC20 transfer/approve flows are disabled (revert).
contract RBTCSynth is IRBTCSynth {
    // --- ERC20-ish metadata (read-only) ---
    string public constant name = "Reserve BTC Synth";
    string public constant symbol = "rBTC-SYNTH";
    uint8 public constant decimals = 8;

    // --- Roles ---
    address public immutable oracle;

    // --- Storage ---
    uint256 public totalSupply; // in "sats" units (decimals = 8)
    mapping(address => uint256) public balanceOf;

    // --- Errors ---
    error Restricted(); // not oracle
    error Soulbound(); // any transfer/approve flow is disabled
    error BurnExceeds(); // burn amount > balance

    // --- Events (ERC20-like for indexers) ---
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    modifier onlyOracle() {
        if (msg.sender != oracle) revert Restricted();
        _;
    }

    constructor(address _oracle) {
        require(_oracle != address(0), "oracle=0");
        oracle = _oracle;
    }

    // ---------------------------------------------------------------------
    // IRBTCSynth (oracle hooks)
    // ---------------------------------------------------------------------

    /// @inheritdoc IRBTCSynth
    function oracleMint(address user, uint64 deltaSats) external onlyOracle {
        if (deltaSats == 0) return;
        unchecked {
            balanceOf[user] += uint256(deltaSats);
            totalSupply += uint256(deltaSats);
        }
        // ERC20-compatible event (from=0 for mint)
        emit Transfer(address(0), user, uint256(deltaSats));
    }

    /// @inheritdoc IRBTCSynth
    function oracleBurn(address user, uint64 deltaSats) external onlyOracle {
        if (deltaSats == 0) return;
        uint256 amt = uint256(deltaSats);
        uint256 bal = balanceOf[user];
        if (bal < amt) revert BurnExceeds();
        unchecked {
            balanceOf[user] = bal - amt;
            totalSupply -= amt;
        }
        // ERC20-compatible event (to=0 for burn)
        emit Transfer(user, address(0), amt);
    }

    // ---------------------------------------------------------------------
    // ERC20 surface (disabled transfers/approvals for soulbound semantics)
    // ---------------------------------------------------------------------

    function transfer(address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    function approve(address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    // Keep the ERC20 view for UI compatibility, but it is always zero.
    function allowance(address, address) external pure returns (uint256) {
        return 0;
    }
}
