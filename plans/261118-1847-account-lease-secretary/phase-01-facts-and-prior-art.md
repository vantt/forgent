# Phase 01: facts and prior art

Wave 1. No dependency. Read-only. Capability `code:review`. Effort 0.5d. Output:
`reports/phase-01-facts.md` in this plan directory.

## Context

The discussion settled the design from a read-only survey (DISCUSSION.md section 3, F1-F16). This phase answers, from
history and live dry-binds, "what existed before, which change removed it, and was that intended", and closes the two
open facts F13 and the executor-placement question of A5, before any code phase starts.

## Steps

1. Prior art by history, each with commit and one line of meaning:
   - `git log --oneline -S'acquireNamedAccountLease'`, `-S'llmAccounts'`, `-S'excludePools'`, `-S'CLI_LOGIN_HOMES'`,
     `-S'personas'` on `packages/seat-binding/rust/src/` and `core/config-schema/runner.schema.yaml`,
     `-G'pool'` on `core/config-schema/runner.schema.yaml`, `-S'account-pin'`, and `-S'providers'` under
     `src/runner/dispatch/` (the retired `runner.providers` account list, commits 9702daec0, c9395bf8b).
   - Was there ever a per-persona or per-role pool, a reserved account, or a "main session account" exclusion? If one
     was removed, name the commit and whether removal was intended.
   - Read the "Lịch sử quyết định" sections of `docs/platform/seat-binding/spec.md` (section 15),
     `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` (RUL102, RUL105, RUL106) and decision 86 Q2 in
     `docs/platform/agent-confinement/spec.md`. Note any decision the persona `pool` key (A1) would contradict.
   - Read `plans/261117-1856-secretary-session-spine/phase-12-head-start.md:180-200` and
     `reports/phase-18-integration.md` (live confined head: skill, Stop hook, rotation) and record what F14 they
     already prove and what is left for phase 5 (user settings in `~/.claude.json`, hooks registered only in the
     user's home).
2. F13 (`task-claude-cli-inplace-proof`): dry-bind outside herdr (`fgos dispatch explain --for <capability> --json`,
   no lease) for every capability whose prefer or tier walk reaches family claude (`core/config-standard/runner.yaml`
   review/judge pins, tiers flagship and frontier). Record whether any seat can resolve to invocation `claude-cli`
   (unconfined, no `credentialStore`, reads `~/.claude` in place). Close it if none can. If one can, write a backlog
   row proposal in the report (out of scope here, RUL11) and say so in the phase 5 report.
3. A5 check: where is `llm-accounts-shape` judged at this moment (`src/setup/registrations.mjs:775` Node, or a Rust
   doctor row)? If S6a has moved it to Rust before phase 3 starts, phase 3 follows it there and the plan footprint is
   updated by the supervisor before phase 3 runs.
4. Persona path: confirm that `bindHeadSeat` (`src/session-host/head-start.mjs:107`) passes the persona to the Rust
   seat-binding route and that the Node client sends `runner.personas` whole (so a new property needs no Node edit).
   If it does not, the gap is a phase 4 footprint change raised to the supervisor, not a silent edit.
5. Golden cases: list the existing `packages/seat-binding/contracts/seat-binding.golden.v1.json` cases that already
   prove account order, quarantine and family walk (AC4), so phase 4 extends rather than copies them.

## Validation

The report answers steps 1-5, each claim with a file:line or commit. Nothing outside the report is written.

## Risk

Low. A finding that contradicts A1-A8 stops the plan and goes to Miu as an owner question in the five-part form.
