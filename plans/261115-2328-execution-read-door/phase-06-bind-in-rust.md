# Phase 06: `bind()` composed in Rust

Start after: 04 and 03 landed. Wave 3, parallel with 07 and 08. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F1. Worktree `erd-p06`, report slug `erd-p06-bind`. Effort: 3.5d.

## Context

Node's `bind.mjs` builds the crate request (launch view, account view, persona chain, effective rigor, override
checks), calls the crate through the host route, and shapes the binding and the walk chain (F1). This phase moves that
composition into `fgos-execution`, so there is one `bind` (program exit). Inputs follow D3 and D4: the runner section
comes from the caller's request when the caller holds a run's snapshot (Node S6a callers) or from the Config crate
when the host answers a native verb (phase 09 adapter); account state comes from the port's Node adapter (`provider-capacity`) as an optional overlay.

## Requirements

0. First, record `packages/execution/contracts/bind.v1.json` from Node on the post-03 integration head (fixture configs
   in the new shape, `expect` recorded by a script of the same shape as 01's `scripts/executor-model-vectors.mjs`, with `--check`): bind (walk, rotation, continuity,
   overrides, persona chain, pinned account in and out of pool, every refusal), explain, pre-admission facts, and the
   seat-config digest bytes (a cross-language vector: Node computes, Rust must match). Commit it red first.
1. `src/bind.rs`: `pub fn bind(req: &BindRequest, machine: &dyn Machine, now: u64) -> Binding` where `BindRequest =
   { ask, runner, session {headless, herdrPresent?, hasNativeAgent, postureAtLaunch, pathEnv?}, walk, accountState? }`
   per `bind.v1.json` (`pathEnv` stays: `missingClisOf` reads it and 29 test files set it through `stubAgentCliDir`). It does what `bind.mjs` :63-554 does today: family-keyed sections (`familyKeyed` :299), persona
   chain (:63-82, now reading 03's tables), override validation (tier names, effort, timeout bounds from the contract),
   launch view from the executor model (04), account view = declared inventory from the runner section
   (`llmAccounts`/`providers`, as `provider-capacity.mjs:290 providerAccountInventory` and `llm-accounts.mjs:59 readLlmAccounts`;
   both stay in Node for the lease, declared twins, D7) plus `accountState` when present (quarantine, sticky, probe failed; the liftable rule
   :231-243), crate call (`fgos_seat_binding::bind`), binding and provenance (:463-554), refusals including
   `agent-cli-missing` (:118-129) and `headless-no-executor` (:416-418), `fallbackFrom` (:454-461).
2. `src/explain.rs`: the walk chain (`explainSeat` :591-607) and the `dispatch explain` answer (`explain.mjs:58-121`,
   incl. cells, candidates, accounts per pool).
3. Pre-admission facts, `pub fn preflight(runner, session, pin?) -> { agentCliMissing?, pinQuarantinedUntil? }` (what
   `agentCliMissingRefusal` :118 and `accountQuarantineOf` :255 answer today, before any bind), so the run start keeps
   its `pre-admission` refusals without a synthetic bind.
4. The account-state overlay is keyed by the lease document's own provider keys, as Dispatch's adapter reads them
   (`readAccountStates` per key, `provider-capacity.mjs:609-612`); Rust maps a pool to its key with `legacyStateKey`
   (twin, D7), so Node never derives the pool set.
5. The config slice and its digest: `seat_config(runner)` (today `seat-policy.mjs:28 seatConfigOf`) and
   `seat_config_digest` (canonical JSON, sha256, as `seatConfigDigestOf` :37) live here. The binding's `bindingInput`
   carries the digest it was bound under; the replay check (`assignment-runner.mjs:300-314`) asks the route's `digest`
   op (09) for the committed config's digest **before** it rebinds, never compares a binding with itself. The slice
   shape changed in 03, so a mutating assignment bound before the landing is refused on replay: the landing drains them
   (D16).
6. Effective rigor (`seat-resolver.mjs effectiveRigorOf`) as a pure function here; Node's copy stays for the seat
   resolver (S6a) as a declared twin read against the same vectors (D7).
7. `tests/golden_bind.rs` over `bind.v1.json` bind and explain vectors (every refusal, every provenance source, walk
   with rotation, continuity, pinned account in and out of pool).

8. **Invocation choice is an explicit rule (owner, 2026-11-17, plan.md "Owner decisions", item V2).** Today the default
   invocation is list order, overridden by a herdr-first rule in `bind.mjs:166-171`. In Rust the choice is decided in
   `bind` or in the Seat Binding rank, not by a herdr special case: generic forms are preferred, pins stay hard
   (`seat-binding/spec.md:266`). The rule's naming input (generic vs named forms) comes from design-lap's naming rule
   (V7); if that rule is not settled on the board when this requirement is reached, stop and tell the plan lead (the
   rest of 06 does not wait). The port keeps no herdr-first override. Vectors for the rule go in `bind.v1.json`, red first.
   Phase 09 deletes the Node override with the facade.

## Files

- Create: `packages/execution/contracts/bind.v1.json`, `packages/execution/rust/src/{bind.rs,explain.rs}`,
  `packages/execution/rust/tests/golden_bind.rs`.
- Modify: `packages/execution/rust/src/lib.rs` (`pub mod` lines), `packages/execution/rust/src/accounts.rs` (the
  account inventory and `llmAccounts` reader exist already; the account view and lease-state reads are added),
  mutation census.
- Delete: none (Node bind is switched in 09). Tests retired: none here.
- Net size: about +700 Rust lines, +400 test lines.

## Steps

1. Red: golden test. 2. Composition. 3. Rust gates for `-p fgos-execution -p fgos-seat-binding`.

## Acceptance

- Every bind and explain vector passes; the phase removes `accountQuarantine` from `REPLAYED_LATER` and replays it
  from `executor-model.v1.json`; `bind.rs` has no I/O (all machine facts through `Machine`).

## Risks / rollback

- Account view differs from Node when an inventory is unreadable (Node treats it as no accounts, `bind.mjs:213-217`)
  (M x M): a vector for it. Revert: one commit.
