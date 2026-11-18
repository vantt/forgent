---
contract: plan-v1
title: "Account lease for the secretary: Miu on her own pool, every other Claude account in the pane pool, a doctor warn for a store on a CLI's default login home"
status: running
priority: P1
blockedBy: []
footprint:
  - plans/261118-1847-account-lease-secretary/**
  - docs/how-to/install-fgos-in-a-project-and-use-doctor.md
  - src/runner/dispatch/llm-accounts.mjs
  - src/setup/registrations.mjs
  - packages/distribution/contracts/doctor-registry.v1.json
  - test/setup/model-pool-checks.test.mjs
  - docs/platform/agent-confinement/spec.md
  - packages/seat-binding/rust/src/**
  - packages/seat-binding/rust/tests/golden.rs
  - packages/seat-binding/contracts/seat-binding.golden.v1.json
  - core/config-schema/runner.schema.yaml
  - test/runner/runner-schema-vocabulary.test.mjs
  - docs/platform/seat-binding/spec.md
  - .fgos/config.yaml
base: 4c6f25972953e10bc86e5659d98f94400002b56a
source:
  - docs/discussions/account-lease-secretary/DISCUSSION.md
  - docs/discussions/account-lease-secretary/QUESTIONS.md
  - plans/261117-1856-secretary-session-spine/phase-12-head-start.md
  - plans/261117-1856-secretary-session-spine/reports/phase-18-integration.md
created: 2026-11-18
---

# Account lease for the secretary

Backlog row `p-mnymjukvqd` (seat binding / accounts). Input: the settled discussion
[DISCUSSION.md](../../docs/discussions/account-lease-secretary/DISCUSSION.md) (hand-off, sections 6 and 7) and
[QUESTIONS.md](../../docs/discussions/account-lease-secretary/QUESTIONS.md). Its decisions OD1-OD5 and SD1-SD4 are
reused as written and are not reopened here. Owner answers: Q1 = B, Q2 = `tetcu`, `anhdvh`, `van.tran` (all three
logged in), Q3 = B (2026-11-18, decided, no longer a default), Q4 = A.

## Outcome

Miu's Claude account is never spent by a pane. Every other Claude account sits only in the pane pool `claude`. Miu
starts with `fgos head start secretary --name miu`, and she and every successor that automatic rotation opens lease
only from a pool `claude-miu` that no tier cell names. When the pane pool runs out of quota a pane changes account,
then family, then is refused by name; Miu keeps running. A doctor row warns (never refuses, never fails) when any
`runner.llmAccounts` store resolves to the default login home of its CLI, so a user with a single account still runs
fgOS.

## Acceptance criteria (the discussion's four)

1. On the owner's machine no pool of `runner.llmAccounts` used by a pane points to `~/.claude` or to Miu's account,
   and a doctor row warns (never refuses or fails) when a store resolves to its CLI's default login home. Check:
   `fgos dispatch explain --for execute --json` (`data.accounts` lists `claude/tetcu|anhdvh|van.tran`, no `vantt` in
   pool `claude`); the phase 3 owning proof (warn on a default-home store, silent on a private store, the pool still
   leases); `fgos doctor` on the owner machine shows the row `ok`.
2. `fgos dispatch explain` for any pane seat never lists Miu's account or pool `claude-miu` in its walk. Owning
   proof: phase 4 golden cases; wiring proof: phase 5 live explain of a pane seat and of the secretary seat.
3. A real start of a claude pane leases exactly one account of the pane pool; a real start of Miu through
   `fgos head start secretary --name miu` runs on Miu's account (pool `claude-miu`) and spends no pane quota.
   Check: phase 5 report, lease receipt in each attempt's provenance (`.fgos/assignments/<unitRunId>/`, head attempt
   directory), plus one rotation whose successor leases from `claude-miu` again.
4. Pane pool out of quota: the seat changes account, then family, then refuses by name; Miu still runs. Owning proof:
   phase 4 golden case "every pane account quarantined walks to the next family and never names the persona pool";
   the existing cases "a pool where every account is quarantined gives no candidate for that entry" and "accounts
   come back sticky first, then probed, and quarantined or failed ones are out" stay the proof of the account order.

## Non-goals

From the discussion, kept: no rewrite of lease, ranking or quarantine; no waiting mode for a pane; no change to the
tier ladder or `tierFallback`; no change to the pools of codex, pi, omp, agy (the Q3 warn only reads them); no
automatic continuation of a write seat that stopped mid-run (Q4 C, recorded for later). Also: no edit to the
credential files or their content in any phase; nothing prints a credential or a login file.

## Decisions taken from evidence (no owner question)

| ID | Decision | Evidence |
|---|---|---|
| A1 | The key is `runner.personas.<name>.pool` (project-only, like the rest of `personas`). A seat whose persona names a pool leases only from that pool, for every family it walks; a candidate whose executor holds no login store in it is not served (`pool-unusable`, existing reason). No new refusal code; Miu on her one account is refused by name when it is out, as Q4's scope says | OD4; F9 (`packages/seat-binding/rust/src/rank.rs:874-925`); Q4 point 5 |
| A2 | No account pin instead of the key: a pin `pool/account` applies only when the seat's first choice is already served by that pool and "never moves a seat to another pool" | `rank.rs:489-496` |
| A3 | Rotation overlap is safe on one account: an account lease is not exclusive (`acct.leases[runId]` holds many) | `src/runner/dispatch/provider-capacity.mjs:534-546` |
| A4 | `vantt` moves out of pool `claude` into `claude-miu` (deleted from `claude`, not only `disabled`), so one login store is never in two pools with two quarantine and renewal records. The discussion allows "disabled or deleted" | DISCUSSION.md section 6 tier 1 ("`disabled: true` (hoặc xoá)"); OD5 |
| A5 | The warn row is Node, next to `CLI_LOGIN_HOMES` and the two account rows owned by `bridge:S6a`; writing it in Rust now would edit the Rust doctor wiring held by ops-metrics (running) and the supervisor plan. When S6a ports the accounts reader, the row moves with it (one table, one place). Phase 1 re-checks where `llm-accounts-shape` is judged at execution time and follows it | `src/runner/dispatch/llm-accounts.mjs:214`; `doctor-registry.v1.json` rows `llm-accounts-shape`, `confined-pane-accounts`; `packages/execution/rust/src/accounts.rs:222`; memory "new code in Rust when non-disruptive" |
| A6 | Q3 = B: the row covers every CLI of `CLI_LOGIN_HOMES` (codex, pi, omp, claude, agy). Owner decision 2026-11-18, recorded in QUESTIONS.md and DISCUSSION.md by commit 1ba5ecbd3 (shared main checkout, on top of the shaper's not yet pushed discussion commits) | owner message to this planner, 2026-11-18 |
| A7 | This plan delivers option (c) "a dedicated account per head persona", which the secretary spine plan sent to the role-grant follow-up plan (not yet written); that follow-up no longer needs to carry it | `plans/261117-1856-secretary-session-spine/phase-12-head-start.md:195-196`; `plan.md:336-337` |
| A8 | The three CHANGELOG lines (doctor warn, persona pool key, Miu start route) are written once in phase 5, so the wave-2 phases never edit the same file in parallel; phases 3 and 4 add no user-visible behavior until phase 5 turns the key on | orchestration rule "no parallel edits to the same file" |

Prior art reused: `runner.llmAccounts`, `disabled`, `acquireNamedAccountLease`, `order_accounts`,
`machineLoginStores`, `CLI_LOGIN_HOMES`, the persona taste table (`policy.rs:93`), `fgos head start` and automatic
rotation (spine plan phase 18 proved a real confined claude head with skill, Stop hook and rotation). Missing: the
default-home warn, the persona `pool` key, a real start of Miu on her own pool.

## Machine config is not repo code

`~/.fgos/private/accounts.yaml` (global `runner.llmAccounts`) and the login directories under `~/.fgos/private/` are
machine state. Phase 2 writes the generic guide in the repo and the owner-machine steps in its phase file; the steps
are run on each owner machine by the owner or by OPC (fg-server2), with a backup first. No path under `~/.fgos/` is in
this plan's footprint, and no phase reads or prints a login file's content (identity comparisons print only
true/false).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Facts and prior art](phase-01-facts-and-prior-art.md) | - | plans/261118-1847-account-lease-secretary/reports/phase-01-facts.md | 1 | done |
| 2 | [Pane pool and Miu pool on the owner machines](phase-02-pane-pool-and-guide.md) | 1 | docs/how-to/install-fgos-in-a-project-and-use-doctor.md, plans/261118-1847-account-lease-secretary/reports/phase-02-machine.md | 2 | done |
| 3 | [Doctor warn for a store on a default login home](phase-03-default-home-warn.md) | 1 | src/runner/dispatch/llm-accounts.mjs, src/setup/registrations.mjs, packages/distribution/contracts/doctor-registry.v1.json, test/setup/model-pool-checks.test.mjs, docs/platform/agent-confinement/spec.md | 2 | draft |
| 4 | [Persona pool key in seat binding](phase-04-persona-pool-key.md) | 1 | packages/seat-binding/rust/src/**, packages/seat-binding/rust/tests/golden.rs, packages/seat-binding/contracts/seat-binding.golden.v1.json, core/config-schema/runner.schema.yaml, test/runner/runner-schema-vocabulary.test.mjs, docs/platform/seat-binding/spec.md | 2 | draft |
| 5 | [Miu on her pool: config, release, real starts](phase-05-miu-start-and-live-proof.md) | 2, 3, 4 | .fgos/config.yaml, CHANGELOG.md, plans/261118-1847-account-lease-secretary/reports/phase-05-live.md | 3 | draft |

Effort (lead-days): 1: 0.5; 2: 0.5 (plus owner machine time); 3: 1; 4: 2; 5: 1.5. Total 5.5; critical path
1 -> 4 -> 5 = 4 lead-days, phases 2, 3, 4 run in parallel.

Capability per phase: 1 `code:review` (read-only facts); 2 `code:implement` (docs) plus a machine step by the
owner/OPC; 3 and 4 `code:implement`; 5 `code:test` (live proof) plus the release step.

## Collisions with active plans

| Plan (status) | Shared files | Handling |
|---|---|---|
| 261118-1455 S6a worktree door (ready) | `CHANGELOG.md` | out of this frontmatter footprint while 1455 holds it (plan-contract-check refuses two active plans on one path); phase 5 re-adds it to the footprint once 1455 is done (supervisor, 2026-11-18) |
| 261118-0936 ops-metrics (running) | `packages/distribution/contracts/doctor-registry.v1.json` | phase 3 appends one row; rebase, not a wait |
| 261118-1341 S6a execution tier (draft) | `src/runner/dispatch/llm-accounts.mjs`, `doctor-registry.v1.json`, `docs/platform/agent-confinement/spec.md` | phase 3 is a small additive edit; S6a's port carries the row (A5). Whichever lands second rebases |
| 261118-1045 supervisor (draft) | `core/config-schema/**`, `.fgos/config.yaml`, `src/setup/**`, `test/**`, `doctor-registry.v1.json` (catch-all footprint) | one `$defs/taste.pool` property, one persona line, one registration; rebase, not a wait |
| 261118-0947 session verb, 261118-1159 owner question store (draft) | `doctor-registry.v1.json` | append-only row; rebase |
| 261118-1455 S6a worktree door (ready) | none | - |

The supervisor sets `ready` after the contract check and decides landing order.

## Data flow

- Pane seat: `bind()` -> seat binding resolves tier and family -> cell `model@pool` names pool `claude` -> lease walks
  `tetcu`, `anhdvh`, `van.tran` in declared order, skipping quarantined -> next family of `tierFallback.<tier>` ->
  refusal by name. Pool `claude-miu` is never named by a cell, so a pane never reaches it.
- Miu: `fgos head start secretary --name miu` -> `bindHeadSeat` (persona `secretary`) -> seat binding reads
  `runner.personas.secretary.pool = claude-miu` and leases only from it -> account `vantt` (store
  `~/.fgos/private/claude-vantt`) copied into the head's private home -> rotation hook opens a successor through the
  same door, same persona, same pool.

## Risks and rollback

| Risk | Phase | Proof point or rollback |
|---|---|---|
| A pane seat pinned to claude refused while no new account passed its probe | 2 | `vantt` moves only after a passing probe; rollback: restore the backed-up `accounts.yaml` |
| The persona pool key changes the bind for seats without it | 4 | golden cases 1-2 plus the unchanged golden file; rollback: revert the phase commit |
| The confined head lacks a user setting or hook Miu relied on (F14) | 5 | spine phase 18 already proved skill, Stop hook and rotation in a real confined claude head; rollback: start Miu by hand as today, remove the persona line |
| A seat can still resolve to unconfined `claude-cli` reading `~/.claude` in place (F13) | 1 | dry-bind in phase 1; a reachable path becomes its own backlog row |
| Shared files with active plans | 3, 4, 5 | append-only rows and one-line edits; rebase, never a wait (table above) |

## Outstanding questions (owner questions)

None. Q1-Q4 are answered by the owner; F13 and F14 are answered by evidence in phases 1 and 5.
