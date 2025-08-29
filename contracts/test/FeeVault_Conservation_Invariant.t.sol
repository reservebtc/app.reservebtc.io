// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";

import "../FeeVault.sol";
import "../interfaces/IFeeVault.sol";

/// @dev Collector sink to account received ETH in the invariant model.
contract FeeCollectorSink {
    uint256 public totalReceived;

    receive() external payable {
        totalReceived += msg.value;
    }
}

/// @dev Invariant fuzz handler. It mutates the FeeVault and keeps a simple model.
contract VaultHandler is Test {
    FeeVault public immutable vault;
    address public immutable oracle;
    FeeCollectorSink public immutable collector;

    address[] internal users;
    mapping(address => uint256) internal modelBalance;
    uint256 public totalIn; // sum of all deposits
    uint256 public outToCollector; // sum of all spendFrom transfers to collector
    uint256 public outToUsers; // sum of all withdrawUnused transfers to users

    constructor(FeeVault _vault, address _oracle, FeeCollectorSink _collector) {
        vault = _vault;
        oracle = _oracle;
        collector = _collector;

        users.push(address(0xA11CE));
        users.push(address(0xB0B));
        users.push(address(0xCAFE));
    }

    // --------- Actions the fuzzer will call ---------

    /// @notice Random deposit by a randomly picked user.
    function act_deposit(uint256 who, uint256 amountWei) public {
        address u = users[who % users.length];
        uint256 amt = bound(amountWei, 1, 5 ether);

        // give ETH to the caller address so it can pay
        vm.deal(address(this), amt);

        // deposit on behalf of u (anyone can deposit for user)
        vault.depositETH{value: amt}(u);
        modelBalance[u] += amt;
        totalIn += amt;
    }

    /// @notice Oracle spends from a random user up to their balance.
    function act_spend(uint256 who, uint256 amountWei) public {
        address u = users[who % users.length];
        if (modelBalance[u] == 0) return;

        uint256 amt = bound(amountWei, 1, modelBalance[u]);

        vm.prank(oracle);
        vault.spendFrom(u, amt);

        modelBalance[u] -= amt;
        outToCollector += amt;
    }

    /// @notice User withdraws all their remaining balance.
    function act_withdraw(uint256 who) public {
        address u = users[who % users.length];
        uint256 bal = modelBalance[u];
        if (bal == 0) return;

        // ensure user can receive ETH
        vm.deal(u, 1 wei);

        vm.prank(u);
        vault.withdrawUnused();

        modelBalance[u] = 0;
        outToUsers += bal;
    }

    // --------- Snapshot helpers for the invariant test ---------

    function snapshotUsers() external view returns (address[] memory addrs, uint256[] memory bals) {
        addrs = new address[](users.length);
        bals = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            addrs[i] = users[i];
            bals[i] = modelBalance[users[i]];
        }
    }
}

/// @dev Invariant: totalIn == outToCollector + outToUsers + sum(internal balances)
///      Also: on-chain internal balances match the model per user.
contract FeeVault_Conservation_Invariant is StdInvariant {
    // actors
    address internal constant ORACLE = address(0xC0117CEe);

    // system under test
    FeeVault internal vault;
    FeeCollectorSink internal collector;
    VaultHandler internal handler;

    function setUp() public {
        collector = new FeeCollectorSink();
        vault = new FeeVault(ORACLE, payable(address(collector)));

        // All cheatcodes (deals/pranks) are performed inside the handler
        handler = new VaultHandler(vault, ORACLE, collector);

        // tell the invariant engine to bombard the handler
        targetContract(address(handler));
    }

    /// Invariant over the system state after any sequence of handler actions.
    function invariant_ETHConservationAndBalancesMatch() public {
        // 1) Model vs on-chain per-user internal balances
        (address[] memory users, uint256[] memory modelBals) = handler.snapshotUsers();
        uint256 sumInternal = 0;
        for (uint256 i = 0; i < users.length; i++) {
            uint256 onchain = vault.balanceOf(users[i]);
            require(onchain == modelBals[i], "model vs vault.balanceOf mismatch");
            sumInternal += onchain;
        }

        // 2) Vault's ETH balance equals the sum of all internal balances
        require(address(vault).balance == sumInternal, "vault ETH balance must equal sum of internal balances");

        // 3) Conservation: totalIn == outToCollector + outToUsers + sumInternal
        uint256 totalIn = handler.totalIn();
        uint256 outToCollector = handler.outToCollector();
        uint256 outToUsers = handler.outToUsers();

        require(totalIn == outToCollector + outToUsers + sumInternal, "ETH conservation identity must hold");
        // (Optional sanity) Check collector actually received what the model says
        require(collector.totalReceived() == outToCollector, "collector received mismatch");
    }
}
