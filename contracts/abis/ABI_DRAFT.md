# Protocol v1 — ABI Draft (Interfaces & Events)

> Scope: **interfaces only** (no implementations). Defines function signatures, events, types, and JSON ABIs to be saved under `contracts/abis/`. Matches T0.2 deliverables.

## Notes & Conventions

* Solidity `pragma solidity ^0.8.24;`
* Addresses are `address` unless a stronger type is required.
* All numeric BTC amounts are in **sats** (`uint64`). All ETH fees are in **wei** (`uint256`).
* All comments are in English. UI/BE must rely on **events** defined below.
* JSON ABIs below are **authoritative** for front‑end; keep them in sync with interfaces.

---

## 1) IFeeVault / FeeVault (interface only)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFeeVault — prepaid fee store per user
interface IFeeVault {
    /// @notice Emitted when a user deposits ETH to prepay fees.
    /// @param user The user whose balance increased.
    /// @param amount Amount of ETH deposited (wei).
    event Deposited(address indexed user, uint256 amount);

    /// @notice Emitted when Oracle spends from a user balance to cover sync fees.
    /// @param user The user whose balance decreased.
    /// @param amount Amount of ETH spent (wei).
    /// @param by The caller (OracleAggregator) that spent the funds.
    event Spent(address indexed user, uint256 amount, address indexed by);

    /// @notice Emitted when a user withdraws all leftover ETH.
    /// @param user The user who withdrew.
    /// @param amount Amount of ETH withdrawn (wei).
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice Prepay fees for `user` by sending ETH.
    /// @dev `msg.value` must be > 0. Anyone can top up anyone if desired.
    function depositETH(address user) external payable;

    /// @notice Return remaining prepaid ETH balance for `user`.
    function balanceOf(address user) external view returns (uint256);

    /// @notice Spend from `user` balance. Callable only by Oracle.
    /// @dev MUST revert if balance is insufficient.
    function spendFrom(address user, uint256 amount) external;

    /// @notice Withdraw entire leftover balance for msg.sender.
    function withdrawUnused() external;
}
```

### IFeeVault — JSON ABI (save as `contracts/abis/FeeVault.json`)

```json
[
  {"type":"event","name":"Deposited","inputs":[{"name":"user","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"event","name":"Spent","inputs":[{"name":"user","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"by","type":"address","indexed":true}],"anonymous":false},
  {"type":"event","name":"Withdrawn","inputs":[{"name":"user","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"function","stateMutability":"payable","name":"depositETH","inputs":[{"name":"user","type":"address"}],"outputs":[]},
  {"type":"function","stateMutability":"view","name":"balanceOf","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},
  {"type":"function","stateMutability":"nonpayable","name":"spendFrom","inputs":[{"name":"user","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"withdrawUnused","inputs":[],"outputs":[]}
]
```

---

## 2) IFeePolicy / FeePolicy (interface only)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFeePolicy — quotes protocol/ops fee for a sync delta
interface IFeePolicy {
    /// @notice Emitted when fee parameters are updated (if mutable) or set in constructor.
    /// @dev Optional; include if implementation allows updates (can be omitted if immutable).
    event FeeParams(
        uint256 pctBps,   // e.g., 10 = 0.1%
        uint256 fixedWei  // fixed fee per sync in wei
    );

    /// @notice Quote fees in wei for a delta in sats.
    /// @param user The user for whom the fee is calculated (optional weighting).
    /// @param deltaSats Signed delta of BTC balance in sats (positive=mint, negative=burn).
    /// @return feeWei Total fee in wei (percentage may apply only to positive deltas).
    function quoteFees(address user, int64 deltaSats) external view returns (uint256 feeWei);
}
```

### IFeePolicy — JSON ABI (save as `contracts/abis/FeePolicy.json`)

```json
[
  {"type":"event","name":"FeeParams","inputs":[{"name":"pctBps","type":"uint256","indexed":false},{"name":"fixedWei","type":"uint256","indexed":false}],"anonymous":false},
  {"type":"function","stateMutability":"view","name":"quoteFees","inputs":[{"name":"user","type":"address"},{"name":"deltaSats","type":"int64"}],"outputs":[{"name":"feeWei","type":"uint256"}]}
]
```

---

## 3) IOracleAggregator / OracleAggregator (interface only)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IOracleAggregator — applies BTC balance deltas on-chain
interface IOracleAggregator {
    /// @notice Emitted upon successful sync for a user.
    /// @param user User address on L2.
    /// @param newBalanceSats Confirmed BTC balance in sats applied by this sync.
    /// @param deltaSats Signed delta in sats (positive=mint, negative=burn).
    /// @param feeWei Fee charged in wei from FeeVault.
    /// @param height Bitcoin tip height used for this sync.
    /// @param timestamp Unix seconds when this sync was accepted on-chain.
    event Synced(
        address indexed user,
        uint64 newBalanceSats,
        int64 deltaSats,
        uint256 feeWei,
        uint32 height,
        uint64 timestamp
    );

    /// @notice Emitted when a user requires top-up before next sync.
    /// @param user User address.
    event NeedsTopUp(address indexed user);

    /// @notice Return last confirmed balance in sats for `user`.
    function lastSats(address user) external view returns (uint64);

    /// @notice Core entry point to apply the snapshot delta for a user.
    /// @dev `proof` MUST include committee t-of-n signatures over (root, height, timestamp) and a Merkle proof for the leaf.
    /// @param user L2 address bound to the BTC address in the snapshot.
    /// @param newBalanceSats Confirmed BTC balance from snapshot.
    /// @param proof Opaque bytes: committee signatures + merkle branch (format defined off-chain).
    function sync(address user, uint64 newBalanceSats, bytes calldata proof) external;

    /// @notice (Optional) Single-tx helper: register BTC binding and prepay FeeVault.
    /// @dev Implementations may forward ETH to FeeVault and persist method/checksum in storage or logs.
    /// @param btcAddr Bech32 BTC address (emitted for off-chain indexing; not parsed on-chain).
    /// @param method Verification method (1=BIP-322, 2=SELF_SEND).
    /// @param checksum Commitment (bytes32) from Protocol v1.
    function registerAndPrepay(string calldata btcAddr, uint8 method, bytes32 checksum) external payable;
}
```

### IOracleAggregator — JSON ABI (save as `contracts/abis/OracleAggregator.json`)

```json
[
  {"type":"event","name":"Synced","inputs":[
    {"name":"user","type":"address","indexed":true},
    {"name":"newBalanceSats","type":"uint64","indexed":false},
    {"name":"deltaSats","type":"int64","indexed":false},
    {"name":"feeWei","type":"uint256","indexed":false},
    {"name":"height","type":"uint32","indexed":false},
    {"name":"timestamp","type":"uint64","indexed":false}
  ],"anonymous":false},
  {"type":"event","name":"NeedsTopUp","inputs":[{"name":"user","type":"address","indexed":true}],"anonymous":false},
  {"type":"function","stateMutability":"view","name":"lastSats","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"uint64"}]},
  {"type":"function","stateMutability":"nonpayable","name":"sync","inputs":[{"name":"user","type":"address"},{"name":"newBalanceSats","type":"uint64"},{"name":"proof","type":"bytes"}],"outputs":[]},
  {"type":"function","stateMutability":"payable","name":"registerAndPrepay","inputs":[{"name":"btcAddr","type":"string"},{"name":"method","type":"uint8"},{"name":"checksum","type":"bytes32"}],"outputs":[]}
]
```

---

## 4) rBTC-SYNTH (read-only subset used by Oracle)

> rBTC-SYNTH is already deployed; only the **oracle-gated** mint/burn selectors are needed by the aggregator.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRBTCSynth {
    function oracleMint(address user, uint64 deltaSats) external;  // onlyOracle in implementation
    function oracleBurn(address user, uint64 deltaSats) external;  // onlyOracle in implementation
}
```

### IRBTCSynth — JSON ABI (save as `contracts/abis/RBTC_Synth.json` — minimal subset)

```json
[
  {"type":"function","stateMutability":"nonpayable","name":"oracleMint","inputs":[{"name":"user","type":"address"},{"name":"deltaSats","type":"uint64"}],"outputs":[]},
  {"type":"function","stateMutability":"nonpayable","name":"oracleBurn","inputs":[{"name":"user","type":"address"},{"name":"deltaSats","type":"uint64"}],"outputs":[]}
]
```

---

## 5) Events — what BE/FE should subscribe to

* **FeeVault.Deposited(user, amount)** → FE updates prepaid balance.
* **FeeVault.Spent(user, amount, by)** → FE shows charged fee per sync.
* **FeeVault.Withdrawn(user, amount)** → FE updates balance after refund.
* **OracleAggregator.Synced(user, newBalanceSats, deltaSats, feeWei, height, timestamp)** → FE refreshes dashboard (reserve, rBTC-SYNTH, fee breakdown).
* **OracleAggregator.NeedsTopUp(user)** → FE toggles `Needs top‑up` status.

---

## 6) Files to create/update in repo

* `contracts/abis/FeeVault.json`
* `contracts/abis/FeePolicy.json`
* `contracts/abis/OracleAggregator.json`
* `contracts/abis/RBTC_Synth.json` (minimal subset for FE)
* `contracts/addresses/megaeth.testnet.json` (later, after deploy)

---

## 7) DoD (T0.2)

* Interfaces above reviewed/approved by **Contracts**, **Backend**, **Frontend**.
* JSON ABIs saved in `/contracts/abis/` and imported from client strictly from local files.
* Event fields match FE needs (no breaking changes without version bump).
