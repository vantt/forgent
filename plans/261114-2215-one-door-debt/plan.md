---
title: "One-door debt: fix the ten ranked leaks of the door census"
description: "Move every second path the door census ranked onto its door, delete the old path in the same change, and leave each fix guarded by a doors-table row with no debt."
status: pending
priority: P1
effort: 12d (16 phases; critical path about 4.5 lead-days after its blockers land)
branch: plan/one-door-debt
tags: [refactor, one-door, tech-debt, rust, node]
blockedBy: [project:261114-2051-rust-verb-migration-program]
blocks: []
created: 2026-11-14
---

# One-door debt

Owner approval 2026-11-14: "10 chỗ thủng đưa vào plan luôn". Source: the door census,
`git show origin/research/one-door-census:plans/reports/research-261114-2201-one-door-census-existing-doors.md`
(sections 4, 5, 9). Facts and prior art for every leak: [phase-00-facts.md](phase-00-facts.md) (done at planning time).
Rules for every phase lead: [phase-lead-rules.md](phase-lead-rules.md). Code read on `origin/main` 781537524; the `doors`
check and row shape read on the F0 integration branch at `1161aad8c` (`test/architecture.test.mjs` `checkDoors`).

## Outcome

Each ranked leak is either moved onto its door with the old path deleted (L10), or, where evidence shows a legitimate
second path, named as an `allowed` entry with its reason. Every fix lands with its `doors` row: a new row carries no debt
for the leak it fixes; a row another plan added loses the fixed file's `debt` entry in the same commit. After phase 16 no
row this plan touches lists a debt entry for any of the ten leaks.

Non-goals: no new verbs, flags or mechanisms (RUL104); no YAML emitter, no shared Node write helper, no bounded-command API in
the supervisor (all three are in "Ideas", for the owner to choose); seat-binding reads (census Q1, the capability plan's);
the parts F0 and the capability plan own (split table below).

## Lead decisions applied (not reopened)

- Leak 1: frontmatter goes through the native YAML door; the helper and its regex copies are deleted. Phase 00 found the YAML
  door work had kept the helper on purpose (`docs/platform/packaging-distribution/spec.md:827`): phase 01 records a
  superseding decision entry, never an in-place edit.
- Leaks stay visible as `debt` until fixed; each fix removes its own entry.
- Census Q1 is out (capability plan).

## Decided by evidence (phase 00 has the proof)

| Question | Answer |
|---|---|
| Q3: is `init.rs`'s private activation write on purpose? | No. Durable File is linked into fgctl at compile time; `init.rs` predates the crate and was skipped when `shim.rs` and `fgctl_refresh.rs` moved. Phase 03 moves it. |
| Q4: keep a flat frontmatter subset? | No. The YAML door keeps dates as strings; the flat parser only tolerated about nine malformed docs. Phase 01 fixes those docs. |
| Q2: provider credential reads through Secrets? | No change. The Secrets spec is an unsigned draft with no resolver, and places person-made login copies with the lease. |
| The frontmatter writer | Its only caller, `scripts/knowledge-migration.mjs`, is a finished one-shot migration (ran live as `tsk-5mh`); deleted with its classifier. |
| Persona walks with other orders or tiers | Dropped: an agent the door cannot resolve cannot run. Everything goes through `agent-definitions.mjs`. |
| `provider-credential-probe.mjs` second launcher | Legitimate: a probe is not a run (no attempt, no writes). Named with its reason; no code move. |
| `rotate.rs`, `tombstone.rs` fsync | Different jobs (move an existing file, swap two directories). Named in the Rust fsync row and the Durable File boundary row. |
| Rust `scrub_and_set` vs Node `withIdentityEnv` | The crate owns it (lowest layer); the Node copy is the only live path and misses four contract-listed variables. Node moves onto the crate. |

## Split with the other plans (ranks 4 and 10, and shared rows)

| Leak part | Owner |
|---|---|
| Rank 4: work-state root walk | F0 phase 04 |
| Rank 4: five Node global-dir choosers, `globalFgosDir()`, the Config function | F0 phase 06 |
| Rank 4: "global fgOS directory" row with two debt entries | F0 phase 08 |
| Rank 4: `uninstall.rs:445` (F0 gave it to S4 for its crate edge) | **this plan, phase 04** (one `Cargo.lock` line; S4 then has nothing to move) |
| Rank 4: `registrations.mjs:517` | **this plan, phase 16**, after the capability plan rewrites the file |
| Rank 10: `runner-config-conversion.mjs:290` (global dir) | F0 phase 06 |
| Rank 10: `runner-config-conversion.mjs` raw config reads | **this plan, phase 13**, after F0 phase 06 |
| Rank 10: registrations/bin-discovery activation reads | **this plan, phase 16** |
| Rank 5 and rank 7/8 debt entries in F0's first-tier rows (canonical JSON, process control, `/proc`) | F0 phase 00 part B adds the rows; this plan's phases remove the entries, or, if they land first, fix the code so the rows land without them |
| `bin/fgos.mjs:3971` second manifest formatter | F0 phase 09 |

## Phases

| # | Phase | Leak | Start after | Effort | File |
|---|---|---|---|---|---|
| 00 | Facts and prior art | all | done | 0 | [phase-00-facts.md](phase-00-facts.md) |
| 01 | YAML frontmatter through the YAML door | 1 | F0 wave A | 1.5d | [phase-01-yaml-frontmatter.md](phase-01-yaml-frontmatter.md) |
| 02 | Agent definitions only through their door | 2 | F0 wave A | 1d | [phase-02-persona-tiers.md](phase-02-persona-tiers.md) |
| 03 | Activation record through Durable File; Rust fsync row | 3, 9 (Rust) | F0 wave A | 1d | [phase-03-activation-durable-write.md](phase-03-activation-durable-write.md) |
| 04 | Uninstall through Config's global directory | 4 | F0 06 on main; lock-line approval | 0.5d | [phase-04-uninstall-global-dir.md](phase-04-uninstall-global-dir.md) |
| 05 | Seat config digest through canonical JSON | 5 | capability plan on main | 0.5d | [phase-05-seat-policy-canonical-json.md](phase-05-seat-policy-canonical-json.md) |
| 06 | Launcher identity env from fgos-identity | 6 | F0 wave A | 1d | [phase-06-launcher-identity-env.md](phase-06-launcher-identity-env.md) |
| 07 | Test tooling through the process door | 7 | F0 wave A | 1d | [phase-07-process-tooling.md](phase-07-process-tooling.md) |
| 08 | fgos-process answers the missing facts; start-time row | 8 | F0 wave A | 1d | [phase-08-process-crate-facts.md](phase-08-process-crate-facts.md) |
| 09 | Holder-lock through fgos-process | 8 | 08 | 1d | [phase-09-holder-lock-process-facts.md](phase-09-holder-lock-process-facts.md) |
| 10 | Git crate and addon through fgos-process | 8 | 08 | 0.5d | [phase-10-git-process-facts.md](phase-10-git-process-facts.md) |
| 11 | Terminal control tty through fgos-process | 8 | 08 | 0.25d | [phase-11-terminal-control-tty.md](phase-11-terminal-control-tty.md) |
| 12 | One host-binary door for Node | 10 | F0 wave A, 06 | 1.5d | [phase-12-host-binary-door.md](phase-12-host-binary-door.md) |
| 13 | Raw config read through the facade | 10 | F0 06 on main | 0.5d | [phase-13-config-raw-read.md](phase-13-config-raw-read.md) |
| 14 | Clock copies; reconciliation log named | 10 | F0 wave A | 0.5d | [phase-14-clock-and-audit-log.md](phase-14-clock-and-audit-log.md) |
| 15 | Node temp names; second door names | 9 (Node) + lead's three writers | 01, 12 | 0.75d | [phase-15-node-temp-names.md](phase-15-node-temp-names.md) |
| 16 | Doctor and setup readers | 2, 4, 10 | capability plan, F0 06, 02, 12 | 0.75d | [phase-16-doctor-readers.md](phase-16-doctor-readers.md) |

### Parallel map

```text
Gate: F0 wave A on main (doors table + check).
Wave 1 (start together): 01  02  03  06  07  08  14
Wave 2: 09  10  11 (after 08)      12 (after 06)
Wave 3: 15 (after 01, 12)
Waiting on the other plans, start the moment their blocker lands:
  04, 13 (F0 phase 06 on main)     05 (capability plan on main)     16 (capability plan, F0 06, 02, 12)
```

Critical path inside this plan: 06 -> 12 -> 15 (1 + 1.5 + 0.75 = 3.25 lead-days) and 06 -> 12 -> 16 (3.25 + 0.75 after the
capability plan); 08 -> 09 is 2 days. Every other phase is one wave.

### Hot files (one writer at a time, in this order)

| File | Writers |
|---|---|
| `docs/architecture-manifest.json` | every phase, each only its own named row or debt entry; landings serial through the big lead; whoever lands second rebases and re-runs the check |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates; never hand-merge |
| `docs/platform/component-boundary.md` | 03 (Durable file row) -> 07 (one sentence on the probe) -> 15 (one clause in the Durable file row) |
| `src/setup/skill-wrappers.mjs` | 01 (frontmatter) -> 15 (temp names) |
| `src/setup/managed-timer.mjs` | 12 (shim path) -> 15 (temp name) |
| `src/util/session-identity.mjs` | 06 (launcher env) -> 12 (probe refusal) |
| `src/setup/agent-hooks.mjs` | 12 only (06 adds a test, no src edit) |
| `scripts/project-agents.mjs` | 02 only |
| `src/setup/registrations.mjs` | 16 only (02, 06, 12 record it as allowed or debt, no edit) |
| `packages/process/rust/src/**` | 08 only (09-11 call it) |
| `Cargo.lock` | 04 only (one line, approved); 14 stops and asks if it would change |

Disjointness of the parallel waves: wave 1 file sets share no file except the manifest and the census (handled above);
09/10/11 touch three different crates; 12's files are disjoint from 09-11 and 13-14.

## Collision table: F0 (`origin/plan/rust-verb-migration-program` eb2e29d2f, F0 integration `1161aad8c`)

| File | F0 writer | Here | Handling |
|---|---|---|---|
| `docs/architecture-manifest.json` | 01 (done), 00B, 08, 09 | every phase | additive rows; this plan never edits an F0 row except to remove its own fixed debt entry or move a `scripts/` entry to `allowed` (07); rebase |
| `test/architecture.test.mjs` | 01 (done), 00B, 09 | 01 (one `ARM_STATIC_IMPORTS` line) | line-local; rebase |
| `bin/fgos.mjs` | 03, 09 | 01 (import + `authoritative-match` hunk) | different hunks; rebase |
| `scripts/export-command-selectors.mjs` | 03, 08 | 15 (`writeAtomic` temp name, 3 lines) | line-local; 15 rebases if F0 08 is open |
| `test/suite-baseline.json` | 00B, 09 | 01 (rows of three deleted test files) | rows; rebase |
| `src/config/facade.mjs`, `src/setup/runner-config-conversion.mjs` | 06 | 13 | 13 starts after F0 06 on main |
| `src/setup/bin-discovery.mjs` | 06 | 16 | 16 starts after F0 06 on main |
| `packages/config/rust/src/machine.rs` | 06 | 04 reads only | none |
| `packages/distribution/rust/src/uninstall.rs` | S4 (future) | 04 | S4 drops the item; big lead tells the F0 lead |
| `packages/distribution/rust/src/lib.rs` | 08 | none (03 edits `init.rs` only) | none |
| `docs/reading-map.md` | 11 (line 144, new rows) | 01 (line 170) | different rows |
| `packages/git/node-addon/src/*.rs` | 04 `git.rs`; 06 `event_store.rs`, `config.rs` | 06 `session_identity.rs`; 10 `single_load.rs` | different files |
| first-tier rows' debt (canonical JSON, process, `/proc`) | 00B adds | 05, 07, 09, 10, 11 remove | whichever lands second adjusts: the stale check names the entry |

## Collision table: capability plan (`origin/plan/capability-reads-one-door` 9be5a4d28, re-read at the end of planning)

| File | Its writer | Here | Handling |
|---|---|---|---|
| `src/runner/execution/seat-policy.mjs` | 01 | 05 | 05 starts after the capability plan lands on main |
| `src/setup/registrations.mjs` | 04, 07 | 16 | 16 starts after it lands |
| `bin/fgos.mjs` | 05, 07 | 01 | 01 lands after it (rebase) |
| `test/architecture.test.mjs`, `test/test-ownership.mjs`, `test/suite-baseline.json` | 07 | 01 | 01 lands after it (rebase) |
| `src/state/fgos-file-registry.mjs` | 07 | 14 (only if needed) | 14 lands after it if it edits the file |
| `docs/architecture-manifest.json` | 01, 06 (file rows), 08 (`doors` rows) | every phase | additive; rebase |
| `docs/reading-map.md` | 06 | 01 | different lines |
| `src/runner/dispatch/{resolve,plan,mechanism,decide,config}.mjs`, `work-dispatch.mjs`, `tool-providers.mjs` | 03, 06 | none | none |
| `src/runner/dispatch/assignment.mjs` (execution-contract hints, out of its scope) | none | 02 (`renderPersonaSection` only) | none |

## Integration and landing

- Base: `origin/main` once F0 wave A lands there (big lead, 2026-11-14). Each phase works in its own linked worktree from
  `origin/main` plus its "Start after" items, rebases onto `origin/main`, and the big lead lands it on main as soon as its gates
  pass. Landings are serial (one rebase at a time) because every phase touches the manifest.
- F0's later waves and the capability plan rebase over this plan's landings; the stale-debt check tells them which entry a
  landed fix removed.
- Each phase report names its `## [Unreleased]` line if user-visible (01: unparseable frontmatter now reported; 04: Windows
  home rule; 06: child env scrub; 16: doctor answers for projects with their own `domains/`). The big lead writes CHANGELOG.

## Acceptance (measurable)

1. `rg -n "parseFrontmatter|renderFrontmatter|extractFrontmatter|FRONTMATTER_PATTERN" bin src scripts apps packages` is empty;
   every tracked doc's frontmatter parses through `readFrontmatter`.
2. No product or tooling file outside `src/runner/agent-definitions.mjs` names the agent tier directories.
3. `init.rs` writes `activation.json` through `fgos_durable_file`; the mode is unchanged (test).
4. `fn home_dir(` exists only in `packages/config/rust/src/machine.rs`.
5. `seat-policy.mjs` has no canonical JSON function; digests of the standard, repo and fixture configs equal the old ones (report).
6. No session variable name appears in `direct-launch.mjs` or `assignment-runner.mjs`; a launched child lacks `CLAUDE_CODE_SESSION_ID`.
7. No script kills by a bare pid; `run-tests.mjs` and the watchdog use the process door.
8. No `/proc` or start-time read in holder-lock (except holder discovery), git, the addon or terminal-control outside `fgos-process`.
9. Every Node write-then-rename temp comes from `uniqueTmpTag()`; `writeFileAtomic` is gone.
10. One shim-path function, one host-missing text, one config-file reader in Node; no third civil-date copy.
11. Every row this plan added or touched passes `checkDoors` with no debt entry for a ranked leak; `npm test` and
    `cargo test --workspace` green on main after the last landing (big lead runs them); clippy `-D warnings`, fmt, msvc and
    darwin checks green per phase; doc-health and decision-citation drift green; the Git one-door scan count never rose.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A changed seat digest makes replay refuse stored units | L x H | phase 05 proves equality before deleting the copy |
| Activation file mode or temp sweep changes | M x H | phase 03 mode test; sweep keeps old and new names |
| Generators abort on one bad doc | M x M | per-file refusal reporting; doc sweep in phase 01 |
| Windows start-time form drifts | M x H | phase 08 fixes the form by test before 09/10 move |
| Many phases touching the manifest | H x L | own-row edits only; serial landings; the check names conflicts |
| The capability plan or F0 slips and blocks 04, 05, 13, 16 | M x M | those four are small and independent; the other twelve do not wait |

## Rollback

Each phase is one commit series that reverts on its own; its debt entry (if any) returns with the revert. Order of reverts:
09-11 before 08; 15 before 01/12; 16 before 02/12. No data format changes, except that `activation.json` is written by a
different routine with the same bytes and mode.

## Ideas (not planned; each needs the owner's choice, RUL104)

| Idea | Problem and evidence | Gain |
|---|---|---|
| A YAML emitter in the door (Node `stringifyYaml` over `packages/yaml-doc/rust/src/edit.rs`) | Five more files hand-write YAML frontmatter: `src/report/knowledge-projection.mjs:17`, `src/report/decision-index.mjs:97`, `src/workflow/case-runtime.mjs:198`, `scripts/knowledge-canary.mjs:39`, `scripts/project-agents.mjs:170-175` (phase 02 only adds a round-trip check) | one writer of YAML text, quoting always right |
| An fsync-only op in the Node durable door (`sync_directory` exists in the crate, `lib.rs:404`) | `src/run-supervisor/run-lock.mjs:47-72` keeps best-effort fsync helpers because the door has none | the last Node fsync outside the door goes |
| A bounded-command API in the Run Supervisor | the credential probe launches an agent CLI itself (`provider-credential-probe.mjs:129-150`) | one launcher for every agent CLI process |
| Fail loudly on an unpinned, missing persona | `renderPersonaSection` renders an empty persona section silently (`assignment.mjs:640,683`) | a wrong seat persona is visible |
| `single_load.rs` kernel lock through holder-lock | census 4.3, a kernel lock outside holder-lock (F0 row debt) | kernel-lock row without debt |

## Owner questions (batch)

None blocks this plan: every leak is decided by the lead or by evidence above. One question for the owner's next pass,
about the ideas list:

### Q1: should the YAML door also write YAML?

- **What is happening:** after phase 01 the door reads every frontmatter block, but five files still write YAML frontmatter by
  joining strings (list in Ideas).
- **Cause:** the door exposes only `parse`; the crate has a comment-preserving edit API (`packages/yaml-doc/rust/src/edit.rs:40-65`)
  that Node cannot reach. RUL108 settled one parser, not one writer.
- **Options:**
  - (a) Add `stringifyYaml` (addon export over the crate, about 60 Rust + 20 Node lines) and move the five writers (about 1.5 days, one plan).
  - (b) Keep hand writers; add the parse-back check phase 02 adds for `project-agents.mjs` to each (about 0.5 day). Two writers' quoting rules remain.
  - (c) Nothing now.
- **Recommendation:** (a): a writer that quotes by hand is the same leak class as the parser just removed.
- **Scope of the answer:** a yes authorizes a follow-up plan for the YAML writer only; it does not touch this plan's phases.

## Items for the big lead

- Phase 04 takes `uninstall.rs` from F0's S4 and changes one `Cargo.lock` line: approve, and tell the F0 lead S4 drops it.
- Phases 05, 07, 09-11 remove debt from F0 phase 00 part B rows; if they land before 00B, 00B's re-run must not list them.
- Phase 15 edits `scripts/export-command-selectors.mjs` (three lines) while F0 phases 03/08 own the file: order the landings.
- The capability plan's phase 07 deletes `src/state/tool-registry.mjs`; nothing here depends on it.
