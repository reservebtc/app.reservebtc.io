-- All comments in English.
-- PostgreSQL 14+ recommended.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) users: one ETH wallet = one user in dApp
CREATE TABLE public.users (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  eth_address     bytea UNIQUE NOT NULL,             -- 20 raw bytes
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_eth_address_idx ON public.users (eth_address);

-- 2) btc_addresses: one per user (v1 rule: single BTC per wallet)
CREATE TABLE public.btc_addresses (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bech32          text NOT NULL,                     -- display form (bc1...)
  witness_program bytea NOT NULL,                    -- 32 bytes (20→32 left‑pad)
  method          smallint NOT NULL,                 -- 1=BIP322, 2=SELF_SEND
  checksum        bytea NOT NULL,                    -- 32 bytes
  verified        boolean NOT NULL DEFAULT false,
  verified_at     timestamptz,
  btc_height      integer,                           -- at verification
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX btc_addresses_user_idx ON public.btc_addresses (user_id);
CREATE INDEX btc_addresses_checksum_idx ON public.btc_addresses (checksum);

-- 3) proofs: raw verification artifacts (BIP-322 sig OR self-send tx evidence)
CREATE TABLE public.proofs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  btc_address_id  uuid NOT NULL REFERENCES public.btc_addresses(id) ON DELETE CASCADE,
  method          smallint NOT NULL,                 -- 1=BIP322, 2=SELF_SEND
  payload         jsonb NOT NULL,                    -- { signature: "...", or {txid: "...", vout:..., ...} }
  status          text NOT NULL,                     -- "pending" | "confirmed" | "invalid" | "expired"
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proofs_user_idx ON public.proofs (user_id);
CREATE INDEX proofs_addr_idx ON public.proofs (btc_address_id);
CREATE INDEX proofs_method_status_idx ON public.proofs (method, status);

-- 4) balances: last known confirmed BTC balance and synth (denormalized for UI speed)
CREATE TABLE public.balances (
  user_id            uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  sats_confirmed     bigint NOT NULL DEFAULT 0,      -- >=0
  synth_sats         bigint NOT NULL DEFAULT 0,      -- mirrored supply on-chain
  last_sync_at       timestamptz,
  last_delta_sats    bigint,                         -- signed
  last_fee_wei       numeric(78,0),                  -- big integer in wei
  feevault_eth_wei   numeric(78,0) DEFAULT 0
);

-- 5) sync_events: append-only journal of oracle syncs for audit/UI
CREATE TABLE public.sync_events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  btc_height      integer NOT NULL,
  new_balance_sats bigint NOT NULL,
  delta_sats      bigint NOT NULL,                   -- signed
  fee_wei         numeric(78,0) NOT NULL,
  merkle_root     bytea,                             -- 32 bytes root used for this publication
  tx_hash         text,                              -- on-chain tx hash (MegaETH)
  accepted_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sync_events_user_idx ON public.sync_events (user_id);
CREATE INDEX sync_events_height_idx ON public.sync_events (btc_height DESC);

-- 6) merkle_snapshots: IPFS snapshots + committee signatures
CREATE TABLE public.merkle_snapshots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  btc_height      integer NOT NULL,
  timestamp_unix  bigint  NOT NULL,
  root            bytea   NOT NULL,                  -- 32 bytes
  ipfs_cid        text    NOT NULL,
  signatures      jsonb   NOT NULL,                  -- t-of-n aggregated or per-signer blobs
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (btc_height, root)
);
CREATE INDEX merkle_snapshots_height_idx ON public.merkle_snapshots (btc_height);

-- 7) widgets: user’s embed config
CREATE TABLE public.widgets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  variant         text NOT NULL,                     -- "badge" | "card" | "panel"
  theme           text NOT NULL,                     -- "auto" | "light" | "dark" | "gold-glass"
  website         text NOT NULL,                     -- required
  socials         jsonb NOT NULL,                    -- { x: "@handle", ... }
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX widgets_user_idx ON public.widgets (user_id);

-- Triggers to keep updated_at fresh (optional)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_users_updated_at      BEFORE UPDATE ON public.users           FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_btc_addresses_updated BEFORE UPDATE ON public.btc_addresses   FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_proofs_updated        BEFORE UPDATE ON public.proofs          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_widgets_updated       BEFORE UPDATE ON public.widgets         FOR EACH ROW EXECUTE PROCEDURE set_updated_at();