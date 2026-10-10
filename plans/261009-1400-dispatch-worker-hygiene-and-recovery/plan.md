---
title: "Dispatch worker hygiene and crash recovery"
description: "Make confined read-only workers immune to the target project's own agent hooks/MCP, resume a crashed workflow without re-running settled seats, keep reaper and recovery inside the worker's herdr session, and let the owner quarantine an exhausted account."
status: pending
priority: P1
effort: 5 sessions
branch: main
tags: [dispatch, confinement, workflow, recovery, provider-capacity]
created: 2026-10-09
---

# Dispatch worker hygiene and crash recovery

## Purpose

- Path M passed one live run on `/home/vantt/projects/mcp-skill-hub` only behind a throwaway launcher that set aside the target's hook/MCP files. Without it, no run on an fgOS-workspace target finishes unattended (mission #1).
- A controller death re-runs seats that already settled (~26 min, 14 assignments per advisory run).
- Two HIGH session-isolation gaps: reaper and recovery talk to the ambient herdr session, not the worker's.
- An exhausted account stays selectable when its limit was never shown on screen; the owner cannot set a quarantine by hand.
- Smallest durable change per problem; each phase ships and is checked alone.

## Budget and time box

| | Added src lines | New files under `src/runner/dispatch` | New durable state | Stop date |
|---|---|---|---|---|
| Whole plan | <= 460 (raised: hygiene approach and two phases added 2026-10-10) | 0 | one workflow event type, two fields on existing records | 2026-10-14 |
| [P01](phase-01-read-only-worker-agent-config-masks.md) | <= 160 (raised from 60 by the owner 2026-10-09: hook-trust seeding replaced masks as the first fix; 157 measured) | 0 | none | 2026-10-11 |
| [P02](phase-02-unit-association-before-dispatch.md) | <= 50 | 0 | event `unit.started` in the existing workflow journal | 2026-10-11 |
| [P03](phase-03-herdr-session-identity-for-reaper-and-recovery.md) | <= 70 | 0 | `herdrSession` on launch-command record and ownership marker | 2026-10-13 |
| [P04](phase-04-owner-set-quarantine-and-reset-date.md) | <= 60 | 0 | none (reuses quarantine record) | 2026-10-14 |
| [P05](phase-05-findings-stop-reason.md) | <= 10 | 0 | none | 2026-10-14 |
| [P06](phase-06-absolute-hook-shim-path.md) | <= 40 | 0 | none | 2026-10-14 |
| [P07](phase-07-claude-mcp-approval-per-process.md) | <= 70 | 0 | none | 2026-10-14 |

Pre-merge check per phase: `git diff --stat main...<branch> -- src` vs. row above. Over by > 50% -> stop, descope or re-plan; never merge over budget silently.

## Phases, order, done-check

| # | Phase | Why this position | Done = one named check | Verified by | Shared code -> review |
|---|---|---|---|---|---|
| 01 | Worker agent-config hygiene: codex hook trust seeded at the root; masks only for faults R1 still shows | Blocks every run on an fgOS-workspace target today; mission #1; independent | Live run R1 (below) | Lead, not builder | yes (trust seeding, every codex dispatch) |
| 02 | Unit association before dispatch | Highest cost per incident; disjoint files from 01, may run in parallel with it | Test T2 | Lead re-runs test + suite | yes (workflow runner, every workflow) |
| 03 | herdr session identity for reaper and recovery | HIGH but rare; makes 02's resume safe for in-flight seats; shares `bwrap.mjs` with 01 -> after 01 | Test T3 | Lead re-runs test + suite | yes (herdr round, reaper) |
| 04 | Owner-set quarantine and reset date | Auto-quarantine starts working once 01 removes the dialog; this covers the rest | Test T4 | Lead | no (one verb + one parse function) |
| 05 | Findings stop reason | Cosmetic, zero consumers | Test T5 | Lead | no (reason string; `grep` finds no consumer in src/bin/core) |
| 06 | Absolute shim path in codex and agy hook commands | Proven cause of agy exit 127 on any dispatch into a project with hooks; independent of 01 | Gemini probe in mcp-skill-hub, first tool call without 127 | Lead | yes (installer, every project) |
| 07 | Claude worker: approve the target's own MCP servers per process | Claude seat stops at the MCP dialog; blocks R1 | Claude probe, then R1 | Lead | yes (dispatch trust path) |

- **R1**: `fgos workflow start` of the architecture-advisory workflow in `/home/vantt/projects/mcp-skill-hub`, target files untouched (`git -C <target> status` identical before/after, no edit to the claude invocation args), ends `completed`, no seat diagnosis shows hook exit 127, a hooks-trust dialog or an MCP `internal_error`.
- **T2**: `a resumed workflow continues the unit run its dead controller started and dispatches only the seats that had not settled` (`test/workflow/workflow-runner.test.mjs`).
- **T3**: `a restarted controller and the reaper both address the herdr session a worker was launched in` (`test/runner/herdr-reconciliation.test.mjs`).
- **T4**: `an owner-set quarantine keeps the account out of selection until its end time` (`test/runner/provider-capacity.test.mjs`).
- **T5**: `a settled findings verdict on mutating work stops with a findings reason` (`test/runner/operation-choice.test.mjs`).
- Every phase also keeps `npm test` green (run with `CLAUDE_CODE_SESSION_ID` unset; known in-session leak).
- Review = one short independent Opus review of the diff (<= 20 min, max 2 rounds), only for phases marked yes.

## Dependencies

- 01 and 02: none; parallel allowed (disjoint files).
- 03 after 01 (`drivers/bwrap.mjs`). 03 does not need 02 to merge, but 02's resume of an in-flight seat is only safe after 03.
- 04 after 01 for its auto path to matter; code-independent.
- 06 and 07 are independent of each other (installer vs. dispatch trust path). 07 shares `herdr-round.mjs` with 03: run 07 before 03 or serialize.
- [Credential rotation plan](../261007-1700-provider-credential-rotation-safety/plan.md): its blocker (advisory capability landing) is gone since M landed. It edits `provider-capacity.mjs` and `drivers/bwrap.mjs` -> run it after 03 and 04, never concurrently. No overlap in scope: it renews logins; this plan never touches what is copied into a private home.

## Kill criteria

- Any phase grows a sequencer, queue, retry loop, lease, journal or second state store -> stop, re-plan.
- Any phase > 1.5x its line budget or past its stop date -> park it, report, keep merged phases.
- A run or test hits a fault outside the phase's file list -> file a separate work item; never patch inside the phase.
- 01: if a CLI rejects the neutral file content and no single neutral content works for all of agy/codex/claude -> stop 01, report per-CLI evidence, do not add per-provider branches to the driver.

## Non-goals

- No change to the hook installer (`src/setup/agent-hooks.mjs`); fail-open commands deferred (trigger in P01).
- No masks for mutating workers (masked tracked files would show as modified and could be committed: [confinement-authority §9.2](../../docs/specs/confinement-authority.md)).
- No launch-before-brief state machine (prior estimate ~400 lines; kill signal). Trigger: idle-worker-after-kill seen again after 02+03 landed.
- No receipt-collection rewrite. Trigger: R1 or a resume hits `run-unreconciled`.
- No startup-dialog capture work: `captureHerdrDiagnosis` already snapshots the screen before close (`src/runner/dispatch/herdr-diagnosis.mjs:33`, called `herdr-round.mjs:1250`).
- No change to settlement's `inconclusive`/`blocked`/`not-applicable` -> `pass` mapping (owner question 4).
- No automatic probe of quota-quarantined accounts; no new capacity state fields.
- No backward-compat aliases, no legacy-association scan (single user).
- No code comment, test name or commit message carrying plan/phase/finding ids.

## Prior art

| Source | Found | Reused | Not reused, why |
|---|---|---|---|
| `runUnit({ resumeUnitRunId })` (`src/runner/execution/run.mjs:160`) + pattern `history` | Resume of a Unit run already skips settled seats | Whole mechanism; 02 only feeds it the id | - |
| Frozen branch `advisory-pre-m-snapshot` (0e8433c0c), `prepareUnitRun` | Deterministic `unit-run-workflow-<sha256(link)>` id, unitRunId on `unit.scheduled`, legacy scan of all `unit.json` | Idea: id recorded before dispatch | Hash id (prepare split = +120 lines) and the history scan (single user, no legacy) |
| Frozen branch `cleanup.mjs` | `FGOS_HERDR_BIN` in reaper; skip while controller alive | `FGOS_HERDR_BIN` | Controller-alive skip: wrong session still answered; session identity fixes the cause |
| Frozen branch `agent-cli-trust.mjs` (+10) | Setup seeds trust into capacity account homes | Nothing now | Not observed 2026-10-09; trigger: folder-trust dialog in a private home whose declared root store trusts the project |
| `BLIND_HIDDEN_ROOTS` (`confinement/resources.mjs:26`) | Masks as contract data, driver stays provider-free | Same shape for P01's mask list | - |
| `seedWorkspaceTrust` (`herdr-round.mjs:650`) | Folder trust already derived into the private home per round | Unchanged | - |
| `workerBaseEnv` (`adapters.mjs:97`, f8d940348) | Hooks were made to run in dispatched agents on purpose | Kept for mutating workers | Read-only seats: dispatch-depth guard still bounds nesting |
| `--strict-mcp-config` (503da25bb) | Local `.fgos/config.json` only, claude only | Left alone | Not product code |
| `quarantineProviderAccount` (`provider-capacity.mjs:709`) | Quarantine writer exists, only called by settlement | 04 calls it from a verb | - |
| `git log -S` `trusted_hash`, `disableAllHooks` | No hits in src | - | Hook-trust pre-seed was a hand experiment, failed |

## Facts verified in code

| Claim | file:line | Verified |
|---|---|---|
| Unit run id reaches the workflow journal only on `unit.complete`, after `runUnit` returns | `src/workflow/runner.mjs:450-481`, `src/workflow/store.mjs:178-193` | yes |
| A `running` unit is re-run from scratch on resume (only `completed` skipped) | `src/workflow/runner.mjs:392-394` | yes |
| `unit.json` (with `workflow` link) is written before any seat starts | `src/runner/execution/run.mjs:241-256` | yes |
| Reaper asks bare `herdr pane list` in the ambient env | `src/runner/dispatch/confinement/cleanup.mjs:174` | yes |
| Reaper runs at every `fgos run` start | `src/runner/execution/run.mjs:147` | yes |
| Marker gets `paneId` only on failure retain | `cleanup.mjs:72-81`, `confinement/authority.mjs:1172` | yes |
| Resume reconcile called with no env -> ambient session | `src/runner/dispatch/assignment-runner.mjs:1977`, `herdr-reconcile.mjs:212-213` | yes |
| Launch-command record has no herdr session field | `src/runner/dispatch/herdr-reconcile.mjs:66-120` | yes (fields read; no session) |
| Worker herdr session is one fixed name `fgos-worker` | `src/runner/dispatch/worker-session-boot.mjs:28`, `config.mjs:930-934` | yes |
| Installer writes relative `.fgos/installation/bin/fgos` for codex and agy | `src/setup/agent-hooks.mjs:206,211,302,306` | yes |
| Hook exits 127 inside the confined worker | live run 2026-10-09 | UNPROVEN cause (shim visible under `--ro-bind / /`, `bwrap.mjs:471`; likely cwd/relative path) |
| Codex hook-trust dialog per fresh home; pre-seed did not help | live run 2026-10-09 | UNPROVEN cause |
| Read-only policy grants no workspace resource | `src/runner/dispatch/confinement/policies.mjs:27-43` | yes |
| `verifyProcessCwd` fails closed on unreadable `/proc/<pid>/cwd` | `src/runner/dispatch/herdr-round.mjs:193-207,1880` | yes |
| Classifier only sees the last screen line for herdr failures | `assignment-runner.mjs:2630-2637`, `herdr-round.mjs:1242-1271` | yes |
| Codex usage-limit phrase recognized; reset parsed only as "resets in Nh Nm" | `provider-capacity.mjs:919-933,982-986` | yes |
| Only `clear-quarantine` exposed on CLI | `src/verbs/dispatch/reconcile.mjs:27-40`; `docs/specs/runner.md:1024` | yes |
| `findings` on mutating work reported as `insufficient-confidence` | `src/runner/operation-choice.mjs:1745-1751` | yes |
| Assessment `inconclusive`/`blocked`/`not-applicable` -> `pass` | `src/runner/dispatch/settlement.mjs:313` | yes |
| Account `tetcu72` out of quota until 2026-10-14, capacity state showed none | owner observation | UNPROVEN in code (state file not read) |

## Unresolved questions (owner: yes/no)

1. Order hygiene (P01) before unit association (P02), unlike the 2026-10-08 note's order? **Answered yes**: masks block every target run; they can run in parallel anyway.
2. Masks only for read-only confined workers? **Superseded 2026-10-09**: diagnosis showed the codex hook dialog is cured at its root by seeding hook trust (phase 01); masks are added only for faults R1 still shows, and then only for read-only workers.
3. Defer the hook-installer fail-open change? **Answered yes (deferred)**, reason changed: the proven cause of exit 127 is the cwd-relative hook command, so the fix, if needed, is the path, never fail-open. Trigger: an interactive or mutating agent in a target hits exit 127 from an fgOS hook.
4. Keep `inconclusive`/`blocked`/`not-applicable` -> `pass` in settlement for now? **Answered yes (defer)**; changing it alters every panel's outcome with `acceptOutcomes: [pass, findings]`. Trigger: a non-answer seat counted as a vote in a real run.
5. R1 (~26 min, real quota) run by Lead after P01 merge, as P01's only done-check? **Answered yes**; codex account `tetcu72`.
6. Run the credential-rotation plan after P03+P04? **Answered yes.**
