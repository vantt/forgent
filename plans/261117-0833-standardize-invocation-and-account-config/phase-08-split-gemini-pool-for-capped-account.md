---
phase: 8
title: Split the gemini pool so the capped account never serves high tiers
effort: 1h
depends_on: [P5 for the final shape; may run earlier on the transition read, see Step 0]
touches: global config (modelPolicies.gemini cells) and the accounts file; no repo code
---

# Phase 8: Split the gemini pool for the capped account

## Requirement (owner, 2026-11-17)

Only `mucdong` is capped, at Gemini 3.8 or lower (tier `advanced` and below). `tetnu` and `tetcu72`
are unrestricted and `tetcu72` stays preferred.

## Decision (owner agreed 2026-11-17, replaces the earlier `maxTier` design)

Use the mechanism already in the product, RUL102: a tier cell is `model@pool`, and a pool is a
group of accounts in `runner.llmAccounts`. This is how deepseek and glm run only the flash model on
the `thehive` pool and keep OpenRouter for the rest (commits `822a9f14f`, `5c19c18cf`; global
config `modelPolicies.deepseek`). Nothing new is built, so no schema key, no Rust change, no
collision with S5 or with `packages/seat-binding`, and no wait for other workspaces to activate a
release (global tier cells are read as written, D-ADR0075).

Why not `maxTier`: it is a new key and new crate code for a result the pool split already gives,
and RUL104 says better, not bigger.

## Steps

0. **Read-only check first.** Run `fgos dispatch explain --for <a gemini capability>` before any
   write and keep the output. It spends no quota. Confirm the walk lists the gemini pool.
1. **Owner runs `agy models`** through their own wrapper on tetnu, tetcu72 and mucdong (fgOS reads no
   login file). Expected: tetnu and tetcu72 list `gemini-4-argon-high`, mucdong does not.
2. **Declare a second pool** (a name that is not a spelling of a configured family, for example
   `gemini-lite`) in `runner.llmAccounts` holding only `mucdong`. `tetcu72` and `tetnu` stay in
   `gemini`. Back up the accounts file first. The two pools may be declared in different shapes
   until P5 because the lease reads each pool from `llmAccounts` when declared and from
   `runner.providers` otherwise (RUL102, transition read). Do not print or move login files.
3. **Edit the gemini cells in the global `modelPolicies`:** nano, mini, standard and advanced list
   both pools (`gemini-3.8-flash-<level>` for `gemini`, then the same model `@gemini-lite`);
   flagship and frontier list only `gemini-4-argon-high` for `gemini`. Entry order is the order the
   walk tries, so put `gemini-lite` first at low tiers if the owner wants mucdong drained first.
   A cell is replaced whole by a higher layer, so write each cell completely.
4. **Verify without quota:** `fgos dispatch explain` for a flagship capability shows only
   tetcu72 and tetnu; for a low-tier capability it shows all three in the chosen order.
   `fgos doctor` check `model-policy-pools` stays quiet (every pool named is declared).
5. **One owner-gated probe** (`probe-account --leg harness`) on mucdong at a low tier, to prove it
   still works there.

## Rollback

Restore the backed-up accounts file and the previous gemini cells. Both are config-only, so there
is no state to unwind. The mucdong launch failure at flagship tiers returns, nothing else.

## Risks

- Unverified: the agy invocation (`credentialStore use: agy`) served by a second pool. The
  deepseek family is served by two pools through one pi executor, so it should work. Step 0 and 4
  prove it before the owner relies on it.
- Unverified: how an "invalid model" launch is classified (account fault or candidate failure). It
  no longer matters once mucdong is out of the high-tier walk.
- Quarantine and lease state are kept per pool, so mucdong's history starts clean under the new
  pool (the earlier quarantine is already cleared).
