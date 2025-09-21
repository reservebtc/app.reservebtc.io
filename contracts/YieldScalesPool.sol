// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";
import {IRBTCSynth} from "./interfaces/IRBTCSynth.sol";
import {IFeeVault} from "./interfaces/IFeeVault.sol";

// Interface for ERC20-like functions that RBTCSynth has
interface IERC20Like {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title YieldScalesPool
 * @notice Yield Scales Protocol - Dynamic yield based on rBTC-SYNTH supply balance
 * @dev Integrates with existing ReserveBTC infrastructure without breaking existing tests
 * @dev This contract does NOT hold funds - it only tracks virtual positions and calculates yields
 */
contract YieldScalesPool is ReentrancyGuard {
    
    // ===================== EVENTS =====================
    
    event ParticipantJoined(address indexed user, uint8 participantType, uint256 amount);
    event ParticipantLeft(address indexed user, uint8 participantType, uint256 amount);
    event YieldCalculated(uint256 totalUSDTVirtual, uint256 totalRBTCSupply, uint256 currentYieldRate);
    event YieldClaimed(address indexed user, uint256 amount);
    event ScalesBalanceUpdated(uint256 usdtScale, uint256 rbtcScale, uint256 timestamp);
    event EmergencyBurnTriggered(address indexed user, uint256 burnedAmount, string reason);
    event BalanceDisputed(address indexed user, uint256 reportedBalance, uint256 oracleBalance);
    
    // ===================== STRUCTS =====================
    
    struct Participant {
        uint8 participantType;          // 0 = BITCOIN_HOLDER, 1 = TRADER
        uint256 virtualUSDTDeposited;   // For traders - virtual USDT amount
        uint256 rbtcContributed;        // For Bitcoin holders - rBTC-SYNTH amount
        uint256 yieldEarned;           // Total yield earned
        uint256 yieldClaimed;          // Total yield claimed
        uint256 joinedAt;              // Timestamp when joined
        uint256 lastActivityAt;        // Last activity timestamp
        uint8 loyaltyTier;             // 0=Bronze, 1=Silver, 2=Gold
    }
    
    struct ScalesBalance {
        uint256 usdtScale;              // Always 100% (100)
        uint256 rbtcScale;              // Percentage of peak rBTC supply (0-200+)
        uint256 lastUpdated;            // Last update timestamp
    }
    
    struct YieldMetrics {
        uint256 baseYieldRate;          // Base yield rate in basis points (500 = 5%)
        uint256 currentYieldRate;       // Current calculated yield rate
        uint256 totalYieldDistributed; // Total yield distributed to date
        uint256 peakRBTCSupply;        // Peak rBTC supply for scaling
    }
    
    // ===================== STATE VARIABLES =====================
    
    /// @notice Reference to existing RBTCSynth contract
    IRBTCSynth public immutable rbtcSynth;
    
    /// @notice RBTCSynth as ERC20-like contract for balance queries
    IERC20Like public immutable rbtcSynthERC20;
    
    /// @notice Reference to existing FeeVault contract  
    IFeeVault public immutable feeVault;
    
    /// @notice Oracle address (committee from existing system)
    address public immutable oracle;
    
    /// @notice All participants in the system
    mapping(address => Participant) public participants;
    
    /// @notice Current scales balance
    ScalesBalance public scalesBalance;
    
    /// @notice Yield calculation metrics
    YieldMetrics public yieldMetrics;
    
    /// @notice Total virtual USDT deposits (traders)
    uint256 public totalVirtualUSDT;
    
    /// @notice Total participants count
    uint256 public totalParticipants;
    
    /// @notice Disputed balances
    mapping(address => bool) public disputedBalances;
    
    // ===================== CONSTANTS =====================
    
    uint8 private constant TYPE_BITCOIN_HOLDER = 0;
    uint8 private constant TYPE_TRADER = 1;
    uint256 private constant BASIS_POINTS_DIVISOR = 10_000;
    uint256 private constant SECONDS_PER_YEAR = 31_536_000;
    uint256 private constant SCALE_DIVISOR = 1_000_000;
    uint256 private constant MAX_YIELD_RATE = 2000; // 20% max
    uint256 private constant GOLD_THRESHOLD = 365 days;
    uint256 private constant SILVER_THRESHOLD = 180 days;
    uint256 private constant GOLD_MULTIPLIER = 150;   // +50%
    uint256 private constant SILVER_MULTIPLIER = 125; // +25%
    uint256 private constant BRONZE_MULTIPLIER = 110; // +10%
    
    // ===================== ERRORS =====================
    
    error NotOracle();
    error InvalidParticipant();
    error InsufficientBalance();
    error AlreadyParticipant();
    error NotParticipant();
    error InvalidAmount();
    error DisputeAlreadyFiled();
    
    // ===================== MODIFIERS =====================
    
    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }
    
    modifier validParticipant(address user) {
        if (!(participants[user].joinedAt > 0)) revert NotParticipant();
        _;
    }
    
    // ===================== CONSTRUCTOR =====================
    
    constructor(
        address _rbtcSynth,
        address _feeVault, 
        address _oracle
    ) {
        require(_rbtcSynth != address(0), "Invalid rBTC address");
        require(_feeVault != address(0), "Invalid FeeVault address");
        require(_oracle != address(0), "Invalid oracle address");
        
        rbtcSynth = IRBTCSynth(_rbtcSynth);
        rbtcSynthERC20 = IERC20Like(_rbtcSynth);
        feeVault = IFeeVault(_feeVault);
        oracle = _oracle;
        
        // Initialize scales balance
        scalesBalance = ScalesBalance({
            usdtScale: 100,
            rbtcScale: 0,
            lastUpdated: block.timestamp
        });
        
        // Initialize yield metrics with conservative 5% base rate
        yieldMetrics = YieldMetrics({
            baseYieldRate: 500,  // 5% in basis points
            currentYieldRate: 0,
            totalYieldDistributed: 0,
            peakRBTCSupply: 1  // Prevent division by zero
        });
    }
    
    // ===================== PARTICIPANT MANAGEMENT =====================
    
    /**
     * @notice Join as Bitcoin holder (automatic based on rBTC-SYNTH balance)
     * @dev Called by Oracle when user first gets rBTC-SYNTH tokens
     */
    function joinAsBitcoinHolder(address user) external onlyOracle nonReentrant {
        if (participants[user].joinedAt > 0) revert AlreadyParticipant();
        
        uint256 rbtcBalance = rbtcSynthERC20.balanceOf(user);
        require(rbtcBalance > 0, "No rBTC-SYNTH balance");
        
        participants[user] = Participant({
            participantType: TYPE_BITCOIN_HOLDER,
            virtualUSDTDeposited: 0,
            rbtcContributed: rbtcBalance,
            yieldEarned: 0,
            yieldClaimed: 0,
            joinedAt: block.timestamp,
            lastActivityAt: block.timestamp,
            loyaltyTier: 0  // Bronze
        });
        
        totalParticipants++;
        _updateScalesBalance();
        
        emit ParticipantJoined(user, TYPE_BITCOIN_HOLDER, rbtcBalance);
    }
    
    /**
     * @notice Join as trader with virtual USDT deposit
     * @param user Trader address
     * @param virtualUSDTAmount Virtual USDT amount (actual funds held by DeFi partner)
     * @dev Called by authorized DeFi partner integration
     */
    function joinAsTrader(address user, uint256 virtualUSDTAmount) external onlyOracle nonReentrant {
        if (!(virtualUSDTAmount > 0)) revert InvalidAmount();
        
        if (!(participants[user].joinedAt > 0)) {
            // New trader
            participants[user] = Participant({
                participantType: TYPE_TRADER,
                virtualUSDTDeposited: virtualUSDTAmount,
                rbtcContributed: 0,
                yieldEarned: 0,
                yieldClaimed: 0,
                joinedAt: block.timestamp,
                lastActivityAt: block.timestamp,
                loyaltyTier: 0  // Bronze
            });
            totalParticipants++;
        } else {
            // Existing trader adding more
            require(participants[user].participantType > 0, "Not a trader");
            participants[user].virtualUSDTDeposited += virtualUSDTAmount;
            participants[user].lastActivityAt = block.timestamp;
        }
        
        totalVirtualUSDT += virtualUSDTAmount;
        _updateScalesBalance();
        
        emit ParticipantJoined(user, TYPE_TRADER, virtualUSDTAmount);
    }
    
    /**
     * @notice Update rBTC contribution for Bitcoin holder
     * @param user Bitcoin holder address
     * @param newRBTCBalance New rBTC-SYNTH balance from Oracle
     */
    function updateRBTCContribution(address user, uint256 newRBTCBalance) 
        external 
        onlyOracle 
        nonReentrant 
        validParticipant(user) 
    {
        // Check if Bitcoin holder type (type 0)
        require(!(participants[user].participantType > 0), "Not a Bitcoin holder");
        
        uint256 oldBalance = participants[user].rbtcContributed;
        participants[user].rbtcContributed = newRBTCBalance;
        participants[user].lastActivityAt = block.timestamp;
        
        // If balance went to zero from positive
        if (!(newRBTCBalance > 0) && oldBalance > 0) {
            _handleEmergencyBurn(user, oldBalance);
        }
        
        _updateScalesBalance();
        _updateLoyaltyTier(user);
    }
    
    // ===================== YIELD CALCULATION =====================
    
    /**
     * @notice Calculate current yield rate based on scales balance
     * @return currentRate Current yield rate in basis points
     */
    function calculateYieldRate() public view returns (uint256 currentRate) {
        currentRate = (scalesBalance.usdtScale * scalesBalance.rbtcScale * yieldMetrics.baseYieldRate) / SCALE_DIVISOR;
        
        // Cap at maximum rate
        currentRate = currentRate > MAX_YIELD_RATE ? MAX_YIELD_RATE : currentRate;
    }
    
    /**
     * @notice Get current scales balance information
     * @return usdtScale USDT scale percentage (always 100)
     * @return rbtcScale rBTC scale percentage (0-200+) 
     * @return timestamp Last update timestamp
     */
    function getScaleBalance() external view returns (uint256 usdtScale, uint256 rbtcScale, uint256 timestamp) {
        return (scalesBalance.usdtScale, scalesBalance.rbtcScale, scalesBalance.lastUpdated);
    }
    
    /**
     * @notice Calculate yield owed to participant
     * @param user Participant address
     * @return yieldOwed Amount of yield owed
     */
    function calculateYieldOwed(address user) public view validParticipant(user) returns (uint256 yieldOwed) {
        Participant memory participant = participants[user];
        
        // Time-based yield calculation
        uint256 timeInSystem = block.timestamp - participant.lastActivityAt;
        uint256 annualYield = calculateYieldRate();
        
        uint256 baseAmount;
        // Check if trader (type > 0)
        if (participant.participantType > 0) {
            baseAmount = participant.virtualUSDTDeposited;
        } else {
            baseAmount = participant.rbtcContributed;
        }
        
        // Calculate all in one step
        uint256 loyaltyMultiplier = _getLoyaltyMultiplier(participant.loyaltyTier);
        uint256 numerator = baseAmount * annualYield * timeInSystem * loyaltyMultiplier;
        uint256 denominator = BASIS_POINTS_DIVISOR * SECONDS_PER_YEAR * 100;
        yieldOwed = numerator / denominator;
        
        // Subtract already claimed
        yieldOwed = yieldOwed > participant.yieldClaimed ? yieldOwed - participant.yieldClaimed : 0;
    }
    
    /**
     * @notice Claim accumulated yield
     * @dev This doesn't transfer actual tokens - yield distribution handled by DeFi partners
     */
    function claimYield() external nonReentrant validParticipant(msg.sender) {
        uint256 yieldAmount = calculateYieldOwed(msg.sender);
        require(yieldAmount > 0, "No yield to claim");
        
        participants[msg.sender].yieldClaimed += yieldAmount;
        participants[msg.sender].lastActivityAt = block.timestamp;
        yieldMetrics.totalYieldDistributed += yieldAmount;
        
        emit YieldClaimed(msg.sender, yieldAmount);
    }
    
    // ===================== EMERGENCY & DISPUTE HANDLING =====================
    
    /**
     * @notice Handle emergency burn when user has insufficient fees
     * @param user User address
     * @param burnedAmount Amount of rBTC-SYNTH burned
     */
    function emergencyBurn(address user, uint256 burnedAmount) external onlyOracle nonReentrant {
        _handleEmergencyBurn(user, burnedAmount);
    }
    
    /**
     * @notice Report balance discrepancy for dispute
     * @param reportedBalance User's claimed actual balance
     * @param oracleBalance Oracle's recorded balance
     */
    function disputeBalance(uint256 reportedBalance, uint256 oracleBalance) external validParticipant(msg.sender) {
        if (disputedBalances[msg.sender]) revert DisputeAlreadyFiled();
        
        disputedBalances[msg.sender] = true;
        
        emit BalanceDisputed(msg.sender, reportedBalance, oracleBalance);
    }
    
    /**
     * @notice Resolve dispute (Oracle only)
     * @param user User whose dispute is being resolved
     * @param resolution True if user was correct, false if Oracle was correct
     */
    function resolveDispute(address user, bool resolution) external onlyOracle {
        disputedBalances[user] = false;
        
        if (resolution) {
            // User was right - could implement compensation logic here
        }
    }
    
    // ===================== INTERNAL FUNCTIONS =====================
    
    /**
     * @notice Update scales balance based on current state
     */
    function _updateScalesBalance() internal {
        uint256 totalRBTCSupply = rbtcSynthERC20.totalSupply();
        
        // Update peak supply if current is higher
        yieldMetrics.peakRBTCSupply = totalRBTCSupply > yieldMetrics.peakRBTCSupply ? 
            totalRBTCSupply : yieldMetrics.peakRBTCSupply;
        
        // Calculate rBTC scale
        uint256 newRBTCScale = (totalRBTCSupply * 100) / yieldMetrics.peakRBTCSupply;
        
        scalesBalance.rbtcScale = newRBTCScale;
        scalesBalance.lastUpdated = block.timestamp;
        
        // Update current yield rate
        yieldMetrics.currentYieldRate = calculateYieldRate();
        
        emit ScalesBalanceUpdated(scalesBalance.usdtScale, scalesBalance.rbtcScale, block.timestamp);
        emit YieldCalculated(totalVirtualUSDT, totalRBTCSupply, yieldMetrics.currentYieldRate);
    }
    
    /**
     * @notice Handle emergency burn scenario
     */
    function _handleEmergencyBurn(address user, uint256 burnedAmount) internal {
        // Check if Bitcoin holder (type 0)
        if (!(participants[user].participantType > 0)) {
            participants[user].rbtcContributed = 0;
        }
        
        emit EmergencyBurnTriggered(user, burnedAmount, "Insufficient fees or balance went to zero");
    }
    
    /**
     * @notice Update loyalty tier based on time in system
     */
    function _updateLoyaltyTier(address user) internal {
        uint256 timeInSystem = block.timestamp - participants[user].joinedAt;
        
        participants[user].loyaltyTier = timeInSystem >= GOLD_THRESHOLD ? 2 :
                                         timeInSystem >= SILVER_THRESHOLD ? 1 : 0;
    }
    
    /**
     * @notice Get loyalty multiplier based on tier
     */
    function _getLoyaltyMultiplier(uint8 tier) internal pure returns (uint256) {
        return tier > 1 ? GOLD_MULTIPLIER :
               tier > 0 ? SILVER_MULTIPLIER : BRONZE_MULTIPLIER;
    }
    
    // ===================== VIEW FUNCTIONS =====================
    
    /**
     * @notice Get participant information
     */
    function getParticipant(address user) external view returns (Participant memory) {
        return participants[user];
    }
    
    /**
     * @notice Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 totalParticipantsCount,
        uint256 totalVirtualUSDTDeposits,
        uint256 currentYieldRate,
        uint256 totalYieldDistributedAmount,
        uint256 usdtScale,
        uint256 rbtcScale
    ) {
        return (
            totalParticipants,
            totalVirtualUSDT,
            yieldMetrics.currentYieldRate,
            yieldMetrics.totalYieldDistributed,
            scalesBalance.usdtScale,
            scalesBalance.rbtcScale
        );
    }
    
    /**
     * @notice Check if address is disputed
     */
    function isDisputed(address user) external view returns (bool) {
        return disputedBalances[user];
    }
}