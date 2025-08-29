# Protocol v1 — ReserveBTC (Spec)

> Scope: checksum format, BIP‑322 message (exact lines), Merkle leaf layout, and sync rules (minConfirmations, rate‑limit, fee‑cap, delta‑threshold).
> Goal: single source of truth for contracts, backend (oracle committee), and UI.

## 0. Conventions & Encoding

* Hash function: **keccak256** (Ethereum Keccak, not NIST SHA3).
* Concatenation: **Solidity `abi.encodePacked(...)`** with fixed‑width types to avoid ambiguity.
* Endianness: integers are big‑endian as per Solidity ABI; addresses/bytes are raw.
* Types:

  * `eth`: **bytes20** (EVM address raw; UI may show EIP‑55, but hashing uses 20 raw bytes).
  * `btcProgram`: **bytes32** witness program:

    * P2WPKH (20 bytes) → left‑pad with zeros to 32 bytes.
    * P2TR (32 bytes) → as‑is.
    * (Non‑segwit not supported in v1.)
  * `vrf_salt`: **bytes32** (cryptographically random; unique per ETH↔BTC binding).
  * `method`: **uint8** — 0x01 = BIP‑322, 0x02 = SELF\_SEND.
  * `balance_sats`: **uint64**.
  * `height`: **uint32** — Bitcoin tip height at measurement.
  * `timestamp`: **uint64** — unix seconds (UTC).

## 1. Binding Checksum

**Formula**

```
checksum = keccak256(
  abi.encodePacked(
    eth:bytes20,
    btcProgram:bytes32,
    vrf_salt:bytes32,
    "reservebtc:v1"
  )
)
```

**Notes**

* `vrf_salt` is generated off‑chain (committee service), stored with snapshots, never user‑provided.
* `checksum` is included both in the BIP‑322 message and in the Merkle leaf.

## 2. BIP‑322 Message (Exact Template)

The user signs the following exact, multi‑line message (ASCII, LF line breaks):

```
ReserveBTC binding:
ETH=0x<eth_eip55>
BTC=<btc_bech32>
checksum=0x<checksum_hex>
nonce=<N>
height=<H>
domain=reservebtc.io
```

* `eth_eip55`: user’s ETH address (display only; hashing uses raw 20 bytes elsewhere).
* `btc_bech32`: user’s BTC address (taproot/segwit).
* `checksum_hex`: 0x‑prefixed 32‑byte hex of the formula above.
* `nonce`: per‑attempt/session unique number (uint64).
* `height`: current Bitcoin tip height at message issuance (uint32).
* `domain`: fixed `reservebtc.io` (pinning the relying party).

**Verification (server‑side)**

1. Parse fields strictly (expected order, exact keys, LF separators).
2. Verify BIP‑322 signature for the provided BTC address.
3. Recompute `checksum` from normalized `(eth, btcProgram, vrf_salt)` and compare to the pasted value.
4. On success, mark `verified(eth↔btc)` with `method=0x01`.

## 3. Merkle Leaf Layout

**Packed fields (in order)**

```
leafPacked = abi.encodePacked(
  eth:bytes20,           // user ETH address (raw)
  btcProgram:bytes32,    // witness program (20→32 left‑pad; 32 as‑is)
  checksum:bytes32,      // from Section 1
  method:uint8,          // 0x01 BIP‑322, 0x02 SELF_SEND
  balance_sats:uint64,
  height:uint32,
  timestamp:uint64
);

leafHash = keccak256(leafPacked);
```

**JSON representation (snapshot line)**

```json
{
  "eth": "0xEip55...",                 // display only
  "btc": "bc1p...",                    // bech32
  "btcProgramHex": "0x...",            // 32 bytes hex (left‑padded if 20)
  "checksum": "0x...",                 // 32 bytes hex
  "method": 1,                          // 1=BIP322, 2=SELF_SEND
  "balance_sats": 123456789,
  "height": 854321,
  "timestamp": 1724399999
}
```

**Notes**

* Snapshots are JSONL; each line is one leaf object.
* IPFS CID and committee t‑of‑n signatures (over `root, height, timestamp`) are stored alongside.
* The on‑chain publisher verifies committee signatures and then calls `sync(...)` per user.

## 4. Sync Rules

**Delta computation**

```
delta = int64(newBalanceSats) - int64(lastSats[user])  // lastSats stored on-chain
```

**Min confirmations**

* `minConfirmations` (constructor param in OracleAggregator). Ignore UTXO changes below this depth.

**Rate‑limit**

* Do not publish more than once per chain block **unless** `abs(delta) ≥ delta_threshold_sats`.
* `delta_threshold_sats` is an off‑chain oracle knob (default TBD; suggested: 1\_000 sats).

**Fee‑cap**

* Each sync quotes `feeWei = feePolicy.quoteFees(user, delta)`.
* Must satisfy `feeWei <= maxFeePerSyncWei` (set in OracleAggregator).
* If vault balance < fee → mark `Needs top‑up`; skip sync.

**Zero / Full Burn cases**

* If `delta = 0`: no action.
* If `newBalanceSats = 0`: perform full burn, update lastSats = 0.

## 5. Fee Policy

Two modes (may be combined):

* **Percentage**: `pctBps` basis points (e.g., 10 = 0.1%) applied only to positive deltas (mint).
* **Fixed**: `fixedWei` constant ETH fee charged every sync.
* **Hybrid**: both applied; percentage only on mint; fixed always.

## 6. Security Invariants

* **Supply‑invariant**: Σ(rBTC‑SYNTH) == Σ(confirmed BTC sats) across all users (± rounding).
* **Monotonic sync**: a single sync event cannot jump more than X blocks in height.
* **No admin keys**: all roles set in constructor; no owner methods, no upgradeability.
* **OnlyOracle**: rBTC‑SYNTH mint/burn gated to immutable Oracle address.
* **FeeVault spendFrom**: callable only by Oracle.
* **Reorg‑safe**: only UTXO with ≥ minConfirmations counted.

## 7. Test Vectors (TODO)

Provide deterministic inputs and outputs for checksum and leafHash.

* Example ETH addr: `0x1111111111111111111111111111111111111111`
* Example BTC program: `<20‑bytes P2WPKH padded>`
* Example salt: `0x2222...`
* Expected checksum: `0x....`

(Script: `scripts/checksum.ts` will generate.)

## 8. Checklists & Sign‑off

* [ ] Contracts: implement according to this spec (FeeVault, FeePolicy, OracleAggregator).
* [ ] Backend: implement bip322‑verify, selfsend‑detector, snapshot builder, committee signer, publisher.
* [ ] Frontend: implement onboarding forms, QR message, signature verification, dashboard sync display.
* [ ] Cross‑team sign‑off: Backend ✓ Contracts ✓ Frontend ✓

---

**Definition of Done (T0.1)**: This document exists in `docs/PROTOCOL_V1.md`, committed, and approved by all teams as the canonical Protocol v1 spec.
