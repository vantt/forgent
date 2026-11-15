# Phase 06: `bind()` composed in Rust

Start after: 04 and 03 landed. Wave 3, parallel with 07 and 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F1. Worktree `erd-p06`, report slug `erd-p06-bind`. Effort: 3d.

## Context

Node's `bind.mjs` builds the crate request (launch view, account view, persona chain, effective rigor, override
checks), calls the crate through the host route, and shapes the binding and the walk chain (F1). This phase moves that
composition into `fgos-execution`, so there is one `bind` (program exit). Inputs follow D3 and D4: the runner section
comes from the caller's request when the caller holds a run's snapshot (Node S6a callers) or from the Config crate
when the host answers a native verb (phase 09 adapter); lease state is Dispatch's and arrives as an optional overlay.

## Requirements

1. `src/bind.rs`: `pub fn bind(req: &BindRequest, machine: &dyn Machine, now: u64) -> Binding` where `BindRequest =
   { ask, runner, session {headless, herdrPresent?, hasNativeAgent, postureAtLaunch}, walk, accountState? }` per
   `bind.v1.json`. It does what `bind.mjs` :63-554 does today: family-keyed sections (`familyKeyed` :299), persona
   chain (:63-82, now reading 03's tables), override validation (tier names, effort, timeout bounds from the contract),
   launch view from the executor model (04), account view = declared inventory from the runner section
   (`llmAccounts`/`providers`) plus `accountState` when present (quarantine, sticky, probe failed; the liftable rule
   :231-243), crate call (`fgos_seat_binding::bind`), binding and provenance (:463-554), refusals including
   `agent-cli-missing` (:118-129) and `headless-no-executor` (:416-418), `fallbackFrom` (:454-461).
2. `src/explain.rs`: the walk chain (`explainSeat` :591-607) and the `dispatch explain` answer (`explain.mjs:58-121`,
   incl. cells, candidates, accounts per pool).
3. The config slice and its digest: `seat_config(runner)` (today `seat-policy.mjs:28 seatConfigOf`) and
   `seat_config_digest` (canonical JSON, sha256, as `seatConfigDigestOf` :37) live here; the binding's
   `bindingInput` carries the digest, so Node's replay check (`assignment-runner.mjs:309`) can compare it without a
   second slice (phase 09 switches it).
4. Effective rigor (`seat-resolver.mjs effectiveRigorOf`) as a pure function here; Node's copy stays for the seat
   resolver (S6a) as a declared twin read against the same vectors (D7).
5. `tests/golden_bind.rs` over `bind.v1.json` bind and explain vectors (every refusal, every provenance source, walk
   with rotation, continuity, pinned account in and out of pool).

## Files

- Create: `packages/execution/rust/src/{bind.rs,explain.rs,accounts.rs}`, `packages/execution/rust/tests/golden_bind.rs`.
- Modify: `packages/execution/rust/src/lib.rs` (`pub mod` lines), `packages/execution/contracts/bind.v1.json` (only
  vectors 01 marked missing, reported), mutation census.
- Delete: none (Node bind is switched in 09). Tests retired: none here.
- Net size: about +1 100 Rust lines, +400 test lines.

## Steps

1. Red: golden test. 2. Composition. 3. Rust gates for `-p fgos-execution -p fgos-seat-binding`.

## Acceptance

- Every bind and explain vector passes; `bind.rs` has no I/O (all machine facts through `Machine`).

## Risks / rollback

- Account view differs from Node when an inventory is unreadable (Node treats it as no accounts, `bind.mjs:213-217`)
  (M x M): a vector for it. Revert: one commit.
