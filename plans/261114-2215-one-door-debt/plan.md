---
title: "One-door debt: fix the ten ranked leaks of the door census"
description: "Move every second path the door census ranked onto its door, delete the old path in the same change, and leave each fix guarded by a doors-table row with no debt."
status: pending
priority: P1
effort: 11d (16 phases; longest internal chain about 2.5 lead-days)
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
| Rust `scrub_and_set` vs Node `withIdentityEnv` | The crate owns the list (lowest layer); Node keeps a second copy. No leak reaches the child (allowlist + gate `env_clear`, already tested), so phase 06 is a no-behaviour one-door refactor. |
| `uninstall.rs` `home_dir()` | Not a global-directory chooser: it feeds the `--purge` guard, which must match the state root's own home rule. Phase 04 uses holder-lock's rule; no Config edge, no `Cargo.lock` change. |
| Five route clients' host lookup | One chooser already (`resolveActiveHostBin`); the rest differs per protocol, version rule and error code. Legitimate adapters, not moved. |
| Watchdog `ps -A` tree reader | The door has no parent pid or elapsed time and `scan` is Linux-only: the reader stays as allowed tooling; only the kills move. |
| `writeFileAtomic`, `visibility-session` `writeJsonAtomic` (the big lead's finds) | Adapters over the durable door that add a fixed mode or an error class: kept. The generator's `writeAtomic` is a real temp-name leak: moved (phase 15). |
| A row that allows `.mjs` and `.rs` | The check applies every row to every file and needs `retiredBy`; for a Node facade over a crate the truthful value is "S7: the Node facade retires with the Node payload". No language split. |

## Split with the other plans (ranks 4 and 10, and shared rows)

| Leak part | Owner |
|---|---|
| Rank 4: work-state root walk | F0 phase 04 |
| Rank 4: five Node global-dir choosers, `globalFgosDir()`, the Config function | F0 phase 06 |
| Rank 4: "global fgOS directory" row with two debt entries | F0 phase 08 |
| Rank 4: `uninstall.rs:445` (F0 gave it to S4 for its crate edge) | **this plan, phase 04**, through holder-lock's state-root home rule (no new edge; S4 then has nothing to move) |
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
| 04 | Uninstall's purge guard through the state-root home rule | 4 | F0 wave A | 0.5d | [phase-04-uninstall-global-dir.md](phase-04-uninstall-global-dir.md) |
| 05 | Seat config digest through canonical JSON | 5 | capability plan on main | 0.5d | [phase-05-seat-policy-canonical-json.md](phase-05-seat-policy-canonical-json.md) |
| 06 | Launcher identity env decided once (no behaviour change) | 6 | F0 wave A | 0.75d | [phase-06-launcher-identity-env.md](phase-06-launcher-identity-env.md) |
| 07 | Test tooling through the process door | 7 | F0 wave A | 1d | [phase-07-process-tooling.md](phase-07-process-tooling.md) |
| 08 | fgos-process answers the missing facts; start-time row | 8 | F0 wave A | 1d | [phase-08-process-crate-facts.md](phase-08-process-crate-facts.md) |
| 09 | Holder-lock through fgos-process | 8 | 08 | 1d | [phase-09-holder-lock-process-facts.md](phase-09-holder-lock-process-facts.md) |
| 10 | Git crate and addon through fgos-process | 8 | 08 | 0.5d | [phase-10-git-process-facts.md](phase-10-git-process-facts.md) |
| 11 | Terminal control tty through fgos-process | 8 | 08 | 0.25d | [phase-11-terminal-control-tty.md](phase-11-terminal-control-tty.md) |
| 12 | Shim path and activation record through host-bin-path | 10 | F0 wave A | 0.75d | [phase-12-host-binary-door.md](phase-12-host-binary-door.md) |
| 13 | Raw config read through the facade | 10 | F0 06 on main | 0.5d | [phase-13-config-raw-read.md](phase-13-config-raw-read.md) |
| 14 | Clock copies; reconciliation log named | 10 | F0 wave A | 0.5d | [phase-14-clock-and-audit-log.md](phase-14-clock-and-audit-log.md) |
| 15 | Node temp names; second door names | 9 (Node) + lead's three writers | 01, 12 | 0.75d | [phase-15-node-temp-names.md](phase-15-node-temp-names.md) |
| 16 | Doctor and setup readers | 2, 4, 10 | capability plan, F0 06, 02, 12 | 0.75d | [phase-16-doctor-readers.md](phase-16-doctor-readers.md) |

### Parallel map

```text
Gate: F0 wave A on main (doors table + check).
Wave 1 (start together): 01  02  03  04  06  07  08  12  14
Wave 2: 09  10  11 (after 08)      15 (after 01 and 12)
Waiting on the other plans, start the moment their blocker lands:
  13 (F0 phase 06 on main)     05 (capability plan on main)     16 (capability plan, F0 06, 02, 12)
```

Longest internal chains: 01 -> 15 (1.5 + 0.75 = 2.25 lead-days), 08 -> 09 (2 days), 02/12 -> 16 (after the capability plan
and F0 06). Every other phase is one wave.

### Hot files (one writer at a time, in this order)

| File | Writers |
|---|---|
| `docs/architecture-manifest.json` | every phase, each only its own named row or debt entry; landings serial through the big lead; whoever lands second rebases and re-runs the check |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates; never hand-merge |
| `docs/platform/component-boundary.md` | 03 (Durable file row) -> 07 (one sentence on the probe) -> 15 (one clause in the Durable file row) |
| `src/setup/skill-wrappers.mjs` | 01 (frontmatter) -> 15 (temp names) |
| `src/setup/managed-timer.mjs` | 12 (shim path) -> 15 (temp name) |
| `src/util/session-identity.mjs` | 06 only |
| `src/setup/agent-hooks.mjs` | 12 only (06 adds a test, no src edit) |
| `test/setup/agent-hooks.test.mjs` | 06 -> 12 (one case each; whoever lands second rebases) |
| `packages/holder-lock/rust/src/**` | 04 (`state_root.rs`) and 09 (`route.rs`, `origin.rs`, `driver/flock.rs`, `helper.rs`, `route/hold.rs`, `borrow_vectors.rs`): disjoint files |
| `packages/event-store/rust/src/**` | 03 (`identity.rs`) and 14 (`publish.rs`): disjoint files |
| `packages/durable-file/rust/src/lib.rs` | 03 only |
| `scripts/project-agents.mjs` | 02 only |
| `src/setup/registrations.mjs` | 16 only (02, 06, 12 record it as allowed or debt, no edit) |
| `packages/process/rust/src/**` | 08 only (09-11 call it) |
| `Cargo.lock` | no phase changes it |

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
| `packages/distribution/rust/src/uninstall.rs` | S4 (future) | 04 | S4 drops the item; big lead tells the F0 lead |
| F0 08 "global fgOS directory" row | allows `machine.rs` and `facade.mjs` | 04 removes its `uninstall.rs` debt | that row also needs `retiredBy` (the twin rule): item for the big lead |
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
  home guard on Windows; 16: doctor answers for projects with their own `domains/`; 02: persona found in the workspace tier).
  Phase 06 has none (no behaviour change). The big lead writes CHANGELOG.

## Acceptance (measurable)

1. `rg -n "parseFrontmatter|renderFrontmatter|extractFrontmatter|FRONTMATTER_PATTERN" bin src scripts apps packages core domains .githooks`
   shows only the standalone `distill.mjs`; every tracked doc's frontmatter parses through `readFrontmatter`;
   `node scripts/check-decision-citation-drift.mjs` passes in a fresh worktree with no `FGOS_*` variables.
2. No product or tooling file outside `src/runner/agent-definitions.mjs` names the agent tier directories.
3. `init.rs` writes `activation.json` through `fgos_durable_file`; the mode is unchanged (test).
4. `packages/distribution/rust/src/uninstall.rs` has no home reader; its purge guard uses the state root's rule (test).
5. `seat-policy.mjs` has no canonical JSON function; digests of the standard, repo and fixture configs equal the old ones (report).
6. No session variable name appears in `direct-launch.mjs` or `assignment-runner.mjs`; existing env tests pass unchanged.
7. No script signals a pid it did not verify: kills of other processes go through `observe` + `signalByIdentity`; own child
   groups by group kill; a door refusal fails the run, never a time limit.
8. No `/proc` or start-time read in holder-lock (except holder discovery), git, the addon or terminal-control outside `fgos-process`.
9. Every ranked Node write-then-rename temp and the generator's comes from `uniqueTmpTag()`; in-flight temp filters accept it.
10. One shim-path function and one config-file reader in Node; no third civil-date copy outside `build.rs` (allowed).
11. Every row this plan added or touched passes `checkDoors` with no debt entry for a ranked leak; `npm test` and
    `cargo test --workspace` green on main after the last landing (big lead runs them); clippy `-D warnings`, fmt, msvc and
    darwin checks green per phase; doc-health and decision-citation drift green; the Git one-door scan count never rose.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A changed seat digest makes replay refuse stored units | L x H | phase 05 proves equality before deleting the copy |
| Activation file mode, temp sweep or a late fsync error changes init | M x H | phase 03: mode test; sweep moved into the crate; installed-but-unsynced still writes the pin |
| Checkout scripts cannot load the YAML door | H x H | phase 01: `ensureAddonForScript()` in main-only entries; fresh-worktree gate |
| Windows pid reuse between check and wait | M x H | phase 08 `open_verified`: one handle verifies and waits |
| Test time limits switched off by a door refusal | M x H | phase 07: timeout kills own child group without the door; refusal fails the run |
| Generators abort on one bad doc | M x M | per-file refusal reporting; doc sweep in phase 01 |
| Windows start-time form drifts | M x H | phase 08 fixes the form by test before 09/10 move |
| Many phases touching the manifest | H x L | own-row edits only; serial landings; the check names conflicts |
| The capability plan or F0 slips and blocks 05, 13, 16 | M x M | those three are small and independent; the other thirteen do not wait |

## Rollback

Each phase is one commit series that reverts on its own. Its debt entry returns with the revert if the phase removed it; if
the phase landed before the other plan's row existed, the revert commit adds the debt entry (with its reason) itself
(`phase-lead-rules.md`). Order of reverts: 09-11 before 08; 15 before 01 and 12; 16 before 02 and 12; 16 and 13 before any
revert of F0 phase 06. No data format changes: `activation.json` is written by a different routine with the same bytes and mode.

## Ideas (not planned; each needs the owner's choice, RUL104)

| Idea | Problem and evidence | Gain |
|---|---|---|
| A YAML emitter in the door (Node `stringifyYaml` over `packages/yaml-doc/rust/src/edit.rs`) | Five more files hand-write YAML frontmatter: `src/report/knowledge-projection.mjs:17`, `src/report/decision-index.mjs:97`, `src/workflow/case-runtime.mjs:198`, `scripts/knowledge-canary.mjs:39`, `scripts/project-agents.mjs:170-175` | one writer of YAML text, quoting always right |
| An fsync-only op in the Node durable door (`sync_directory` exists in the crate, `lib.rs:404`) | `src/run-supervisor/run-lock.mjs:47-72` keeps best-effort fsync helpers because the door has none | the last Node fsync outside the door goes |
| A bounded-command API in the Run Supervisor | the credential probe launches an agent CLI itself (`provider-credential-probe.mjs:129-150`) | one launcher for every agent CLI process |
| Parent pid and elapsed time in the process door's Node views (and `scan` beyond Linux) | the watchdog keeps a `ps -A` tree reader (`scripts/lib/test-file-watchdog.mjs:130-143`) because the views lack them (`packages/git/node-addon/src/process.rs:152-157`) | test tooling judges trees through the door on every platform |
| One home rule | the state root (`holder-lock/rust/src/state_root.rs:70-90`, HOME first everywhere) and Config (`config/rust/src/machine.rs:95-106`, USERPROFILE on Windows) disagree on Windows with `HOME` set | one answer to "where is home" |
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
  - (b) Keep hand writers; add a parse-back check (write, parse with the door, compare) to each (about 0.5 day). Quoting rules stay hand-written.
  - (c) Nothing now.
- **Recommendation:** (a): a writer that quotes by hand is the same leak class as the parser just removed.
- **Scope of the answer:** a yes authorizes a follow-up plan for the YAML writer only; it does not touch this plan's phases.

## Items for the big lead

- Phase 04 takes `uninstall.rs` from F0's S4 (no new edge, no lock change): tell the F0 lead S4 drops it.
- F0 phase 08's "global fgOS directory" row allows `machine.rs` and `facade.mjs`: the twin rule (`checkDoors`) refuses it without
  `retiredBy`; it needs the same "S7: the Node facade retires with the Node payload" value this plan uses.
- Two home rules (state root vs Config) are a separate question (Ideas).
- Phases 05, 07, 09-11 remove debt from F0 phase 00 part B rows; if they land before 00B, 00B's re-run must not list them.
- Phase 15 edits `scripts/export-command-selectors.mjs` (three lines) while F0 phases 03/08 own the file: order the landings.
- The capability plan's phase 07 deletes `src/state/tool-registry.mjs`; nothing here depends on it.

## Red Team Review

### Session — 2026-11-14
**Findings:** 35 raw from 4 reviewers (Security, Failure Mode, Assumption, Scope and Contracts), merged to 15; all 15 accepted.
**Severity:** 3 Critical (merged to 2), 12 High, rest Medium. Every finding carried `file:line` evidence and was re-checked.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Checkout scripts cannot load the YAML door (`door.mjs:22-29` `ownRelease`); `check:before-merge` and every gate would fail | Critical | Accept: `ensureAddonForScript()` in main-only entries, fresh-worktree gate; facts corrected | 00, 01, plan |
| 2 | A row cannot be split by language; every row hits every file; `.mjs`+`.rs` needs `retiredBy` | Critical | Accept: truthful `retiredBy` (S7) for facade-over-crate rows; split forbidden; F0 08 row flagged | rules, 06, 12, 13, plan |
| 3 | `distill.mjs` (and `instruction-audit.mjs`) own frontmatter code; a retired-name row fails | High | Accept: allowed as standalone skill scripts; acceptance `rg` widened | 00, 01 |
| 4 | `uninstall.rs` `home_dir()` is the purge guard, not a global-dir chooser; Config's rule weakens it | High | Accept: holder-lock state-root rule; no Config edge, no lock change | 00, 04, plan |
| 5 | Phase 06 claimed a leak the allowlist and gate already close; duplicate test, false CHANGELOG line | High | Accept: recast as no-behaviour refactor; existing test is the owner | 00, 06, plan |
| 6 | Watchdog tree needs ppid/etime the door lacks; runner parent has no door; refusal would skip reaping | High | Accept: only kills move; runner loads door itself; timeout independent of door; refusal fails the run; idea logged | 00, 07, plan |
| 7 | Windows verify-then-wait split reopens pid reuse | High | Accept: `open_verified` one-handle function | 00, 08, 09 |
| 8 | Start-time string forms differ; marker would change or be re-parsed | Medium | Accept: typed parts, golden marker tests | 00, 08, 10 |
| 9 | `same_user` is the `/proc` owner, not `effective_uid`; proof cannot use self | Medium | Accept: own function, non-dumpable test | 08, 09 |
| 10 | Renderer lookup lacks workflow context and throws new `RunnerConfigError`s | High | Accept: pass context when known; map every error to the failure line; `agent-listing.mjs:68` added; patterns widened | 02 |
| 11 | Phase 02 parse-back check is a new mechanism outside rank 2 | Medium | Accept: moved to Ideas (Q1 option b) | 02, plan |
| 12 | Activation install succeeds but late fsync error aborts before the pin; door temps unswept | Medium | Accept: map by `installed`; sweep moved into the crate from event-store | 03 |
| 13 | Canonical JSON door throws on non-finite values; proof missed throws, account view, cache key | Medium | Accept: proof covers all three uses and throws; normalize in `seatConfigOf` to today's bytes | 05 |
| 14 | Phase 15: skill-wrappers temp filter breaks; scope crept into legit tooling; `writeFileAtomic` inlining spreads 0600; patterns too loose | Medium | Accept: filter accepts both forms; scope = ranked helpers + lead's generator; `writeFileAtomic` kept; exact-form patterns | 15 |
| 15 | Phase 12 rows unguardable; shared version check has no single job; phase 14 lock change certain; rollback holes; missed spec mentions | Medium | Accept: route clients left as legitimate; template interpolates the door; `build.rs` allowed; revert adds debt; specs added | 01, 12, 14, rules, plan |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-lead-rules.md, phase-00 to phase-16.
- Decision deltas checked: 12 (YAML addon loading, retiredBy rule, standalone skills, purge guard rule, phase 06 recast, watchdog
  narrowing, open_verified, typed start time, renderer errors, activation `installed` mapping, phase 15 scope, phase 12 narrowing).
- Stale references reconciled: `Cargo.lock` mentions (04, 14, hot files, items), phase 12 dependency on 06, `session-identity.mjs`
  hot-file order, CHANGELOG lines, acceptance 1/4/6/7/9/10, revert order, effort and waves.
- Unresolved contradictions: 0.

## Validation Log

### Verification Results
- Tier: Full (16 phases). Claims checked: about 120 (4 reviewers re-checked the plan's `file:line` claims; planner re-read each
  corrected site: `door.mjs` loading, `checkDoors` row loop and twin rule at `1161aad8c`, `uninstall.rs:445-517`, `state_root.rs`,
  writer bodies at `1161aad8c`).
- Verified after fixes: all cited claims | Failed: 9 before the sweep (Leak 1 checkout claim, Leak 4 role, Leak 6 premise, Leak 7
  door views, Leak 8 handle and forms, renderer domain tier, phase 15 filter, phase 14 lock), all corrected | Unverified: none untagged.
- No owner interview (common rules): the planner decided what evidence settles; Q1 is the only owner question and blocks nothing.
