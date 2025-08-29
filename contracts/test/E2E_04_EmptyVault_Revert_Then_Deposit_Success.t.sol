// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import "../OracleAggregator.sol";
import "../FeePolicy.sol";
import "../interfaces/IRBTCSynth.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Minimal synth mock: tracks balances and totalSupply.
contract SynthMock is IRBTCSynth {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    error BurnExceeds();

    function oracleMint(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        unchecked { balanceOf[user] += d; totalSupply += d; }
    }

    function oracleBurn(address user, uint64 deltaSats) external override {
        if (deltaSats == 0) return;
        uint256 d = uint256(deltaSats);
        uint256 bal = balanceOf[user];
        if (bal < d) revert BurnExceeds();
        unchecked { balanceOf[user] = bal - d; totalSupply -= d; }
    }
}

/// @dev FeeVault mock compatible with IFeeVault (no duplicate event declarations).
contract FeeVaultMock is IFeeVault {
    mapping(address => uint256) public bal;

    function depositETH(address user) external payable override {
        require(user != address(0), "user=0");
        require(msg.value > 0, "value=0");
        bal[user] += msg.value;
        emit Deposited(user, msg.value);
    }

    function balanceOf(address user) external view override returns (uint256) {
        return bal[user];
    }

    function spendFrom(address user, uint256 amount) external override {
        require(bal[user] >= amount, "insufficient");
        unchecked { bal[user] -= amount; }
        emit Spent(user, amount, msg.sender);
    }

    function withdrawUnused() external override {
        uint256 amt = bal[msg.sender];
        require(amt > 0, "no-balance");
        bal[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amt}("");
        require(ok, "withdraw-failed");
        emit Withdrawn(msg.sender, amt);
    }

    receive() external payable {}
}

contract E2E_04_EmptyVault_Revert_Then_Deposit_Success is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    address internal committee;
    address internal user;

    // Same params as previous mini-tests
    uint256 constant PCT_BPS     = 10;             // 0.10%
    uint256 constant FIXED_WEI   = 0;
    uint256 constant WEI_PER_SAT = 1_000_000_000;  // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;

    function setUp() public {
        committee = makeAddr("committee");
        user      = makeAddr("user");

        policy = new FeePolicy(PCT_BPS, FIXED_WEI, WEI_PER_SAT);
        vault  = new FeeVaultMock();
        synth  = new SynthMock();

        oracle = new OracleAggregator(
            address(synth),
            address(vault),
            address(policy),
            committee,
            MIN_CONF,
            FEE_CAP
        );
    }

    function _expectedFee(uint64 deltaPos) internal pure returns (uint256) {
        if (deltaPos == 0) return 0;
        return (uint256(deltaPos) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
    }

    /// @notice With empty FeeVault: sync(+delta) must revert; after depositETH, sync succeeds and deducts exact fee.
    function test_EmptyVault_Revert_Then_Deposit_Success() public {
        // choose +delta with fee under cap
        uint64 up = 123_456;
        uint256 feeUp = _expectedFee(up);
        require(feeUp <= FEE_CAP, "fee>cap");

        // 1) Empty vault -> expect revert on sync(+delta)
        vm.expectRevert(); // generic: we don't bind to a specific custom error name
        vm.prank(committee);
        oracle.sync(user, up, "");

        // 2) Deposit exactly the needed fee, then sync succeeds
        vm.deal(user, feeUp);
        uint256 beforeVault = vault.balanceOf(user);
        uint256 tsBefore    = synth.totalSupply();
        uint256 uBefore     = synth.balanceOf(user);

        vm.prank(user);
        vault.depositETH{value: feeUp}(user);

        vm.prank(committee);
        oracle.sync(user, up, "");

        // balances updated
        assertEq(synth.balanceOf(user), uBefore + up, "mint mismatch after top-up");
        assertEq(synth.totalSupply(),   tsBefore + up, "totalSupply mismatch after top-up");

        // exact fee deducted
        uint256 afterVault = vault.balanceOf(user);
        assertEq(beforeVault + feeUp - afterVault, feeUp, "fee not deducted exactly once");
    }
}