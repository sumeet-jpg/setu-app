-- =============================================================
-- Migration 023: key_version on tool_connections
--
-- Context: encrypted_key is AES-256-GCM (src/lib/tools/crypto.ts) derived
-- from a single static ENCRYPTION_KEY env var — solid encryption, but with
-- no way to rotate that key without a flag-day re-encryption of every row
-- (nothing records which key version encrypted a given row). This column
-- costs nothing today (defaults to 1, matching the only key that has ever
-- existed) but means a future key rotation can be done gradually — decrypt
-- with the version on the row, re-encrypt with the new key, bump the
-- version — instead of a hard cutover.
-- =============================================================

ALTER TABLE public.tool_connections
  ADD COLUMN IF NOT EXISTS key_version int NOT NULL DEFAULT 1;
