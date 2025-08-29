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

/// @dev FeeVault mock compatible with IFeeVault.
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

contract E2E_05_MultiUser_Invariant is Test {
    OracleAggregator internal oracle;
    FeePolicy        internal policy;
    FeeVaultMock     internal vault;
    SynthMock        internal synth;

    address internal committee;
    address[] internal users;

    // Same params as in previous mini-tests
    uint256 constant PCT_BPS     = 10;             // 0.10%
    uint256 constant FIXED_WEI   = 0;
    uint256 constant WEI_PER_SAT = 1_000_000_000;  // 1 gwei per sat
    uint32  constant MIN_CONF    = 3;
    uint256 constant FEE_CAP     = 1 ether;

    function setUp() public {
        committee = makeAddr("committee");

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

        // create users and prepay some ETH for fees
        uint256 N = 5;
        users = new address[](N);
        for (uint256 i = 0; i < N; i++) {
            users[i] = makeAddr(string(abi.encodePacked("user-", vm.toString(i))));
            vm.deal(committee, 1 ether);
            vm.prank(committee);
            oracle.registerAndPrepay{value: 0.5 ether}(users[i], 1, bytes32(0));
        }
    }

    function _fee(uint64 dPos) internal pure returns (uint256) {
        if (dPos == 0) return 0;
        return (uint256(dPos) * WEI_PER_SAT * PCT_BPS) / 10_000 + FIXED_WEI;
    }

    function test_MultiUser_SupplyEqualsSumOfBalances() public {
        for (uint256 step = 0; step < 50; step++) {
            address u = users[uint256(keccak256(abi.encode(step))) % users.length];

            // current absolute (from synth mock)
            uint64 cur = uint64(synth.balanceOf(u));

            // propose new absolute within +/- 300k sats, clamp to [0, uint64.max]
            int256 jitter = int256(int16(int256(uint256(keccak256(abi.encodePacked(step, u))) % 600_001) - 300_000));
            int256 nextAbs = int256(uint256(cur)) + jitter;
            if (nextAbs < 0) nextAbs = 0;
            if (nextAbs > int256(uint256(type(uint64).max))) nextAbs = int256(uint256(type(uint64).max));

            uint64 target = uint64(uint256(nextAbs));

            // if +delta, ensure fee <= cap and vault has enough balance
            if (target > cur) {
                uint256 delta = uint256(target - cur);

                // clamp by fee cap
                uint256 fee = _fee(uint64(delta));
                if (fee > FEE_CAP) {
                    uint256 maxDelta = (FEE_CAP == 0) ? 0 : ((FEE_CAP - 1) * 10_000) / (WEI_PER_SAT * PCT_BPS);
                    target = cur + (maxDelta == 0 ? 1 : uint64(maxDelta));
                    delta  = uint256(target - cur);
                    fee    = _fee(uint64(delta));
                }

                // top-up user's vault if needed (to avoid NeedsTopUp revert)
                uint256 bal = vault.balanceOf(u);
                if (bal < fee) {
                    uint256 need = fee - bal;
                    vm.deal(committee, need);
                    vm.prank(committee);
                    vault.depositETH{value: need}(u);
                }
            }

            vm.prank(committee);
            oracle.sync(u, target, "");
        }

        // invariant: sum of user balances == totalSupply
        uint256 sum;
        for (uint256 i = 0; i < users.length; i++) {
            sum += synth.balanceOf(users[i]);
        }
        assertEq(sum, synth.totalSupply(), "sum(balanceOf) must equal totalSupply");
    }
}