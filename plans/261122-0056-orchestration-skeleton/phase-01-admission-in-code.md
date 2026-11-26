# Phase 1: Admission in code

Backlog `p-radq263tbx` (T1). Decisions: SR-D6 (code holds hard caps), OS-D4 (keeping rhythm is code, judgement is
LLM), OS-D5 (every decision has a reason code), OS-D7 (grow from the wake door).

## Inputs

- `packages/supervision/rust/src/wake.rs` (the wake door, its ports, `CAPACITY_KINDS`).
- `packages/supervision/rust/src/portfolio.rs` (`admissible()`: ready, `blockedBy` done, disjoint footprint).
- `packages/supervision/rust/src/supervisor.rs` (`supervisor plans` reports `maxLeads` but enforces nothing, line ~190).
- `apps/fgos/src/wiring/supervision.rs` (line ~1925: `config_int(root, "supervisor.maxLeads", 4)` hardcodes the
  default that `core/config-standard/supervisor.yaml` already owns).
- `core/skills/fgos-supervisor/SKILL.md` (today the skill admits and runs `session start lead`).
- `core/config-standard/workerSlots.yaml` (lane pool ceiling).
- `docs/platform/supervision/spec.md` §1 to §5, `docs/platform/session-host/spec.md` §3.

## Footprint

`packages/supervision/rust/src/wake.rs`, `packages/supervision/rust/src/portfolio.rs`,
`packages/supervision/rust/src/supervisor.rs`, `packages/supervision/rust/tests/wake.rs`,
`packages/supervision/rust/tests/portfolio.rs`, `apps/fgos/src/wiring/supervision.rs`,
`core/skills/fgos-supervisor/SKILL.md`, `apps/fgos/tests/supervision_verbs.rs`.
(Widened by owner answer q-hx2zjzqsxz.)

## Steps

1. Add to the wake door an admission step that runs before it decides whether to start the supervisor: for each plan
   `admissible()` returns, in priority order, admit while live leads are below `supervisor.maxLeads` and a lane is
   free. Live leads come from Identity holders of `head:lead-*` roles; unknown counts as live (never free).
2. Admitting a plan: write `status: running` and `lead: <role>` in its `plan.md` through the existing land door used
   by `fgos land --paths` (Supervision's `land.rs`), then start the lead through the `StartSession` port with
   persona `lead`. Write order: plan file first, start second; a failed start leaves the plan `running` with its lead
   role, which the existing `lead-ended` and `session-gone` definitions already catch.
3. Every outcome is one decision record with a reason code: `admitted`, `held-max-leads`, `held-no-lane`,
   `held-blocked`, `held-footprint-overlap`, `start-failed:<host code>`. Record it on the existing
   `fgos.supervisor.wake` span.
4. Read `supervisor.maxLeads` and the lane ceiling only from config; delete the hardcoded `4` fallback (a missing key
   is a config error, since the standard owns the default).
5. The supervisor is started only when a raised event still needs judgement after admission (ties, a plan that is
   ready but cannot be classified). Plain capacity events (`CAPACITY_KINDS`, `plan-became-ready`) are handled in code.
6. Edit `core/skills/fgos-supervisor/SKILL.md` in the same commit: remove the admission steps; the supervisor keeps
   judgement (priority changes, ties, anything the keeper raises as needing judgement). Do not run
   `npm run build:skills` here; phase 15 regenerates.

## Verify

`cargo test -p fgos-supervision --test wake --test portfolio`. Pass: one owning test per rule: admit under cap;
hold at `maxLeads` with `held-max-leads`; hold with no lane; unknown lead identity counts as live; start failure
records the host code; a capacity-only event never starts the supervisor. `cargo clippy -p fgos-supervision
--all-targets -- -D warnings` clean.

## Rollback

Revert the phase commit; the skill and the code change together, so the supervisor admits again as before.
