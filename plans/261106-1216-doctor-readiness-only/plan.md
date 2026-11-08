---
title: "HARDEN: doctor answers readiness only"
description: "Owner decision 65 (1a 2b 3a) on the doctor audit: fgOS-repo rows move to npm test/release check, live incidents move to each component's own read-and-recover door with one read-only pointer row each, Git gets `fgos git status|recover`, dead and duplicate rows go, the three defects found in passing are fixed; ten phases, net size below zero, self-landing on fg-server2."
status: pending
priority: P1
effort: ~6.5d lead time, serial (P01 0.5d; P02 0.5d; P03 1d; P04 1d; P05 1d; P06 0.5d; P07 1d; P08 0.5d; P09 0.5d HARDEN part; P10 0.5d)
branch: main (plan only; each phase runs on its own track branch `harden/doctor-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, doctor, setup, git, event-store, holder-lock, run-supervisor, terminal-control, knowledge, tests]
blockedBy: []
blocks: []
created: 2026-11-06
---

# HARDEN: doctor answers readiness only

Main `fd476d709` (2026-11-06 12:16 Asia/Saigon, fg-server2). Every `file:line` below was re-read on this commit. Inputs: the [audit](../reports/audit-261106-1202-doctor-roles.md) (every row §1, missing doors §2, target shape §3, risks §5) and owner decision 65 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md) (`^65\. `). This plan reopens no decision; one gap is asked as UQ-1.

## Goal

`fgos doctor` answers one question: can fgOS run correctly on this machine and in this project (install, activation, platform, config, CLI wiring, identity, host routes). `--fix` repairs readiness only. Live incidents are read and repaired through each component's own door, which already runs on its normal path; doctor keeps one read-only pointer row per component ("N open, run X"). Rules about the fgOS repo's own files live in `npm test`, CI, pre-commit or the release check. Doctor in a non-fgOS repo writes nothing and starts no child. Wall time on fg-server2 falls from 45 s to ≤ 20 s with the HARDEN phases, to ≤ 12 s once WORK's hand-off and T5's seat-row cut land.

## Decision 65, applied

| Part | Meaning here | Phases |
|---|---|---|
| Shape §3 | readiness only; incident console and repo linter leave | all |
| 1a | the fgOS-repo rows move to `npm test` / CI / pre-commit / release check; the two history-derived indexes check only what the checkout has; the history-derived knowledge lints move to the knowledge verbs | 03, 05, 08 |
| 2b | one read-only pointer row per component with live incidents; pointer rows warn, never fail, never repair | 06, 07, 09 |
| 3a | `fgos git status\|recover` carries the Git sweep rows and `git-land-recovery`; the same pattern serves terminal allocations (a read section of `fgos dispatch inspect`, repair stays adopt) and workflow case bindings (WORK) | 04, 06, 07, 09 |
| 14 dead/duplicate | deleted (13 in source; `shadow-binder-divergence` already gone in `847913570`; `convention-conformance` moves under 1a) | 02, 03 |

## Decided within the approved frame (analysis chose; reported, not asked)

1. **Who runs Git recovery on onboarding: `fgos init`, not a new `fgctl` tail step.** `fgctl` never updates itself (`apps/fgctl/src/` holds only `main.rs`; no self-update in `packages/distribution/rust/src/`), so a tail step added to `run_tail` (`packages/distribution/rust/src/init.rs:554-597`) would not reach machines whose `fgctl` predates it, and would fail an older release on rollback. `fgos init` is the first tail command on every `fgctl` path (`init.rs:561`) and already runs readiness repairs itself (`bin/fgos.mjs:1003-1009`: machine id, lock dirs). It calls the same function `fgos git recover` runs, as its last, fail-safe step (D4 discipline, `bin/fgos.mjs:1010-1017`).
2. **Terminal allocations get a read section of `fgos dispatch inspect`, not a new verb.** The scan only observes (`src/setup/terminal-control-checks.mjs:91-123`; terminal spec `:218` "no terminal `--fix`"); closing stays with adopt. Audit §2.2 named this option; RUL104 prefers extending an existing verb.
3. **Pointer rows warn, never fail.** A pointer is "N open, run X". Doctor `--strict` (only consumer: `test/setup/doctor-strict-exit.test.mjs:45`) therefore stops failing on incidents; readiness rows keep failing.
4. **Pointer cost cap.** A pointer reads facts a readiness row already read in the same run (`createDoctorRun().once`, `src/setup/registrations.mjs:206`) or costs ≤ 250 ms, and all pointers together ≤ 1 s on fg-server2; if a count is dearer, the row prints "run X" without N.
5. **Instruction projections regenerate through `npm run build:skills`**, the door AGENTS.md names for generated render surfaces; no other generator exists (`materializeInstructionProjection` is called only from `registrations.mjs:2998-3000`).
6. **`changelog-unreleased-stale` is a duplicate of the release check**: `scripts/prepare-release.mjs:141-152` already refuses an empty `[Unreleased]`; as an `npm test` it would fail right after every release.

## Facts this plan rests on (verified on `fd476d709`)

1. **Doctor runs every row in sequence**, awaiting each (`bin/fgos.mjs:4231-4250`), so wall time is the sum of row costs. `--fix` runs every registered fix first (`registrations.mjs:267-290`, `bin/fgos.mjs:4240`).
2. **`fgctl` tail** = `init`, `doctor --fix`, `doctor` (`init.rs:561`); a non-zero exit marks the install `ready-degraded` (`init.rs:583-592`); doctor exits 0 unless `--strict` (`bin/fgos.mjs:5305-5322`).
3. **Git recovery's only door today is `doctor --fix`**: `fixGitOperationRecovery` (`src/setup/git-checks.mjs:152-169`) registered as `git-land-recovery` (`registrations.mjs:5514`); user messages name it at `src/runner/merge.mjs:1015` and `src/verbs/merge/approve.mjs:144,166`; Git spec §10 text at `docs/platform/git/spec.md:411` and §12 at `:639`.
4. **Doctor writes in a non-fgOS repo (traced).** (a) `checkObserveDirWritable` creates `.fgos/observe` and a probe file on the read-only path (`registrations.mjs:5110-5124`). (b) `doctor` is in `EVENT_STORE_LIFECYCLE_VERBS` (`bin/fgos.mjs:4851`), so the end trigger runs `maintainEventStore(..., end: true)` (`bin/fgos.mjs:5353-5358`), which seals and spawns `events sync --opportunistic` (`src/event-store/maintenance.mjs:17-20,50-52`). (c) That child refuses on the lock directory with "run fgos setup" (`packages/event-store/rust/src/locks.rs:128-135`), and because (a) made `.fgos/`, the fault is recorded under `.fgos/logs` (`src/cli/invocation-fault-log.mjs:48-56,92`). (d) The creator of `.fgos/locks` is **[UNVERIFIED]**; candidates: Event Store open (`eventStoreSetupContext`, `src/setup/event-store-checks.mjs:5-14`), holder-lock probes (`packages/holder-lock/rust/src/semantics.rs:38`). P01 finds it with a red test.
5. **Verb routing.** `events` and `lock-status` are `legacy-cli` rows of `packages/host-runtime/contracts/command-routes.json` (`:333-341`, `:599-607`), embedded by the host (`apps/fgos/src/main.rs:39`) and by distribution (`packages/distribution/rust/src/lib.rs:42`), generated by `scripts/export-command-selectors.mjs`; registry entries `src/cli/command-registry.mjs:1611,2330`; handlers `bin/fgos.mjs:2940,4389`. No `git` route or verb exists (`git log -S"fgos git recover"` empty).
6. **Layering.** `docs/architecture-manifest.json` layers `entry > use-case > infra > domain > kernel`; `src/setup/*` and `src/git/*` are infra, `src/verbs/*` use-case, `bin/fgos.mjs` entry. A read model shared by a doctor row and a verb therefore lives in `src/git/` (infra), as `src/runner/lock-status.mjs` (infra) serves `bin/fgos.mjs:4389`.
7. **Run adopt already runs on the normal path**: `sweepAttempts` in `src/runner/execution/run.mjs:621` and `src/runner/loop.mjs:1317`. Orphan attempt-socket removal runs only in the doctor fix (`src/setup/run-supervisor-checks.mjs:221,247`).
8. **Inventories are tested.** `test/setup/registrations.test.mjs:144,151` pins "Today's registered checks/fixes" in `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`; `test/setup/checks.test.mjs:51-` pins the row list. Every row change edits both.
9. **History-derived indexes.** `enduser-docs-index-stale` compares only doc path sets (`registrations.mjs:2838-2869`); the path set on disk comes from `enumerateDocEntries` (`src/report/enduser-index-generate.mjs:89`) with no Work fold (the fold, `:122-123`, only adds `sourceCaptureId`). `computeDecisionIndex` unions committed rows with local state (`src/report/decision-index.mjs:90`): without local history it reduces to the committed rows.
10. **CI has full history and tags** (`.github/workflows/ci.yml:32`, `fetch-depth: 0`).
11. **Shared hot file with T5.** `src/setup/registrations.mjs` is T5's chain P03 (in flight, `harden/t5-p03`) → P11 → P06 → P12; `test/setup/checks.test.mjs` is touched by T5 P12; `bin/fgos.mjs` by T5 P11 (one import line).

## Prior art

`ccd60ab45` put Land recovery into `doctor --fix`; `94d9b005b` folded the Git rows 10 → 6 and terminal rows 3 → 2; `4cd418c6a` added the retained-Land warning; `847913570` removed `shadow-binder-divergence`; T4 P01 folded the run-supervisor rows to 4 (`plans/261103-1347-harden-t4-run-supervisor/phase-01-adopt-custody-and-doctor-fold.md`). Reused: `fixGitOperationRecovery`, `retainedLandWarning`, `gitFacts` (moved, not rewritten); `collectLockStatus`; `invokeDispatchInspectOperation`; `sweepAttempts`; `enumerateDocEntries`; `buildDecisionIndexMarkdown`; `verifyCensus`; `createDoctorRun().once`. Missing and added: the `git` verb (decision 65 3a), `--check` on `fgos doc-registry`, lint findings in `fgos knowledge status`, two judgments in `fgos lock-status`, a terminal section in `fgos dispatch inspect` (audit §2.2, §2.5, §2.6, all extensions of existing verbs).

## Phases

| # | Phase | Owning lane (reviewer) | Depends on | Parallel with | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|---|
| 01 | [Defects and red proofs](phase-01-defects-and-red-proofs.md) **landed 11-06 `26cac4ef4`** | HARDEN (ES) | — | — | −20 / +0 / +40 |
| 02 | [Dead and duplicate rows deleted](phase-02-dead-and-duplicate-rows.md) **landed 11-06 `ff6947580`** | HARDEN (ES, CFG, OPC) | 01 | — | −420 / 0 / −250 |
| 03 | [Repo rows to npm test and release check](phase-03-repo-rows-to-tests.md) **landed 11-08 `35d7745d1`** | HARDEN (TEST, DOC, OPC for census) | 02 | — | −300 / 0 / −100 |
| 04 | [Git read-and-recover door](phase-04-git-status-recover-door.md) **landed 11-08 `85e081b59`** | HARDEN (OPC) | 03 | — | +120 / 0 / +40 |
| 05 | [Knowledge rows to knowledge verbs](phase-05-knowledge-rows-to-knowledge-verbs.md) **landed 11-08 `a16fce064`** | HARDEN (DOC) | 04 | — | −120 / 0 / −60 |
| 06 | [Git doctor cut and pointer](phase-06-git-doctor-cut.md) | HARDEN (OPC) | 04 landed and activated, 05 | — | −95 / 0 / −60 |
| 07 | [Component pointer rows](phase-07-component-pointer-rows.md) | HARDEN (ES, OPC, MAIL) | 06 | — | −40 / 0 / −20 |
| 08 | [Packaged definitions: release tier to tests](phase-08-packaged-definitions-split.md) | HARDEN (TEST) | 07 | — | −150 / 0 / −50 |
| 09 | [WORK hand-off and Work pointer](phase-09-work-handoff.md) | WORK (rows, doors); HARDEN (board record, pointers) | 07; pointers: WORK's doors landed | WORK's part on its own schedule | HARDEN +20 / 0 / +10 |
| 10 | [Docs gate, measure, close](phase-10-docs-gate-measure-close.md) | HARDEN (DOC) | 01–08 | — | 0 / 0 / 0 |

```
P01 → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P10
                         └ P04 landed + activated on fg-server2 before P06 starts
P09: board record at plan acceptance; WORK's part on WORK's schedule; HARDEN pointers after WORK lands
```

**Parallelism: none on code.** Three hot files are shared by almost every phase: `src/setup/registrations.mjs` (01, 02, 03, 04, 05, 06, 07, 08, 09), `bin/fgos.mjs` (01, 04, 05, 07), `src/setup/git-checks.mjs` (02, 03, 04, 06); `registrations.mjs` and `bin/fgos.mjs` are also on T5's chain. A lead may read and prepare the next phase while one lands, never edit. Ordered by value: the biggest time win (P03, about −21 s) lands third; the Git door lands before anything that removes a recovery path.

**T5 rows: T5 handles** ([sub-plan](../261106-0950-harden-t5-execution-core/plan.md)), not re-planned here: `executor-family-unique`, `executor-skills-installed`, `tier-fallback`, `model-policy-pools`, `llm-accounts-shape`, `llm-accounts-vs-legacy`, `capability-serves-valid`, `workflow-capabilities-configured`, `executor-confinement`, `invocation-git-write-grants`, `herdr-executor-kinds`, `trust-store-readable`, `non-claude-trust-stores-readable`, `agent-cli-project-trusted`, `confined-pane-accounts`, `executor-profile-warnings` (row; its level defect is fixed in P01 in a file T5 does not own), `seat-binding-dry-bind`, `blind-steps-use-proven-pools`, `executor-posture-coverage`, `seat-binding-route`, `bwrap-available`, `confinement-*` (incl. `confinement-orphaned-resources-reaped`), `credential-copies-retained`, `provider-capacity-state` (Dispatch's pointer row is T5's call), `tool-registry-configured`, `agy-*`.

## File ownership

Rebase-only (never a reason to serialize; regenerate or re-apply on rebase): `CHANGELOG.md`, `packages/git/contracts/mutation-census.v1.json` (`node scripts/git-one-door-scan.mjs --write-census`), the two inventory lines of `setup-doctor-registry.md`. `test/suite-baseline.json` is TEST's: report retired files, never hand-edit.

| File(s) | Phases, in order |
|---|---|
| `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `test/setup/registrations.test.mjs` | 01 → 02 → 03 → 04 (MERGE_HEAD read only) → 05 → 06 → 07 → 08 → 09; **one writer at a time with T5** (P03 → P11 → P06 → P12) by a board line naming the holder |
| `bin/fgos.mjs` | 01 → 04 → 05 → 07; shared with T5 P11 (import line) by the same board line |
| `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json` (generated) | 04 → 05 → 07 |
| `src/setup/git-checks.mjs` | 02 → 03 → 04 → 06 |
| new `src/git/<status module>.mjs` | 04 → 06 |
| `src/setup/event-store-checks.mjs` | 02 → 07 |
| `src/setup/identity-checks.mjs` | 02 → 03 |
| `src/setup/holder-lock-checks.mjs`, `src/runner/lock-status.mjs` | 07 |
| `src/setup/run-supervisor-checks.mjs`, `src/run-supervisor/client.mjs` | 07 |
| `src/setup/terminal-control-checks.mjs`, `src/verbs/dispatch/inspect.mjs`, `src/runner/dispatch/runtime-inspection.mjs` | 07 |
| `src/setup/executor-profile-warnings.mjs`, `packages/event-store/rust/src/locks.rs` | 01 |
| `src/runner/merge.mjs`, `src/verbs/merge/approve.mjs`, `test/direct/merge-gate.test.mjs`, `test/git/recovery.test.mjs`, `test/git/commit-parent-death.test.mjs` | 04 (→ 06 for `recovery.test.mjs:53`) |
| `src/report/enduser-index-generate.mjs`, `src/report/decision-index.mjs`, `src/setup/instruction-projections.mjs`, `scripts/build-skill-wrappers.mjs`, `test/scripts/doc-health.test.mjs` | 03 |
| new knowledge lint module, `test/setup/knowledge-doctor.test.mjs` | 05 |
| `src/setup/workflow-case-checks.mjs`, Work row bodies | WORK (09) → HARDEN pointers (09) |
| `docs/platform/git/spec.md` | 02 (two folded rows) → 04 → 06 |
| `docs/platform/packaging-distribution/spec.md`, `AGENTS.md` | 10 |
| other area specs | the phase whose behaviour the line states |
| `docs/architecture-manifest.json` rows | the phase that adds, moves or deletes the `src/` or `scripts/` file |

## Acceptance criteria

1. `fgos doctor --json` on fg-server2 main checkout, median of 3 runs of the activated release (`/usr/bin/time -f %e`), ≤ 20 s after P08; ≤ 12 s once P09 (WORK) and T5's seat-row cut have landed (re-measured then, recorded on the board).
2. In a scratch Git repo with no fgOS setup, `fgos doctor --json` leaves no `.fgos/` (`find <repo> -name .fgos` empty), starts no `events` child (`fgos` process count before = after), wall time ≤ 4.5 s.
3. No registered fix repairs an incident: `rg -n "registerFix\(\{ id: '(git-land-recovery|run-attempts-stuck|no-stuck-merge-abort|enduser-docs-index-stale|decision-index-stale|doc-registry-stale|instruction-projections-stale)'" src` returns nothing; `workflow-case-bindings` and T5's two fixes are the only incident fixes left, each named with its owner on the board.
4. Every row of audit §1 is: kept (readiness), a pointer row, moved to a named test/verb, deleted, or listed as T5/WORK-owned; P10 prints that table with the final row id list, and the row count is ≤ 112 after P08.
5. `fgos git status --json` and `fgos git recover --json` exist through the host route; `fgos init` recovers an interrupted Land (red proof in P04); no message in `src/` names `doctor --fix` for Land recovery.
6. Each pointer row: read-only, `passed: true`, message "N … open; run `<verb>`" (or "run `<verb>`" under the cost cap), no fix registered.
7. Every retired test names its new owning test (phase file and commit body); no behaviour that still exists loses its assertions.
8. Land gate green at each land; net size of the plan's commits per language within the budget below.
9. AGENTS.md gate text replaced with the audit §3 wording (P10); packaging-distribution spec and the registry contract state the readiness-only rule.

## Net-size budget

Node ≤ −700, Rust ≤ +10 (message text only), tests ≤ −250 for P01–P08 (estimate sum: Node −1 025, tests −460). P09's WORK part has WORK's own budget. Moving a function between `src/` and `scripts/` or a test counts on both sides. A phase over its line explains it in its report; the plan total is what must hold. Schema/JSON fixtures not counted.

## Land gate (every phase, run by the big lead on a host built from the tree)

- Rust touched (P01 `locks.rs`; host rebuild for the embedded routes in P04, P05, P07): `cargo test` of each touched crate, `cargo clippy -D warnings`, `cargo check --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`, `cargo fmt --all --check`.
- One-door census: `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared.
- Full `npm test` through `node scripts/run-tests.mjs` with every `HERDR_*` and `CLAUDE*` variable unset and a private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<branch>-target` (never `/tmp`); read the ERROR lines and the fail count. Known pre-existing red: the V7n frozen addendum test (MAIL).
- On any docs change or `src/` deletion: `test/scripts/doc-health.test.mjs` and `test/scripts/check-decision-citation-drift.test.mjs`.
- Doctor timing: `fgos doctor --json` timed before and after the phase on the activated release (the phase report carries both numbers).

## Lead rules (every brief carries these)

- One lead subagent per phase, own linked worktree from `origin/main` (never local main), own ext4 `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<name>-target`, deleted when the phase lands.
- Before touching `registrations.mjs`, `checks.test.mjs` or `bin/fgos.mjs`: read the board for the T5 holder line; take the file by a board line; rebase on `origin/main` before the first edit and before landing.
- Find the owning test before writing a new one (design principle 8); a retired test names its new owner in the report and commit body; never weaken an assertion of a behaviour that still exists; a deleted mechanism retires its tests in the same change.
- Focused Node tests only through the FR one-liner, with `FGOS_HOST_BIN` naming a host built from the worktree:
  `node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>` (FR). No focused run in a worktree while a full suite runs there. Never SIGKILL a test run; message the big lead before any heavy run.
- `git diff --cached --stat` before every commit; explain any large deletion or empty file; stage explicit paths.
- Every edit to a hashed file regenerates the census in the same commit. Every user-visible change (row removed or renamed, new verb or flag, changed fix list) adds a line under `## [Unreleased]` in `CHANGELOG.md`. Every row change edits the two inventory lines of the registry contract and the row list in `checks.test.mjs`.
- RUL104 and L10: change a contract → move every caller and delete the old path in the same change; no mechanism beyond the phase's item; no env switch, flag or test-only branch to make a test pass.
- Before deleting a row id: `rg -n "'<id>'|\"<id>\"|<id>" src bin apps packages test docs core domains scripts` lists every consumer; each moves or is deleted in the phase.
- No plan ids, phase numbers or finding codes in code, tests or commit messages.
- Report: Δ lines per language next to the estimate, doctor time before/after, test-cost line, red evidence per fix; name from `fgos convention name --slug <slug> --json` under `plans/reports/`; only what you ran yourself; end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.

## Landing

- **fg-server2 self-lands each phase** in a window announced on the board (one `log.md` line with window and branch), after the land gate: rebase on `origin/main`, gate, `git log origin/main..HEAD` before push; build, stage, activate on fg-server2; `fgos doctor --json` (row list and time), and for P04 one interrupted-Land recovery smoke through `fgos git recover`. WORK, TEST, ES, T5 lead told before the window; OPC reviews P02 (Git rows), P03 (census), P04, P06, P07 (lock rows).
- **Owner machine:** one Vietnamese guide `plans/reports/guide-<date>-owner-machine-doctor-readiness-only.md` (name from `fgos convention name`), one section per landed phase: main commit, what changes for the user (rows gone, new verbs), commands (pull, build/stage/activate, doctor, `fgos git status`), expected doctor rows, rollback.
- **Order guarantee for Git recovery:** P06 removes `git-land-recovery` from `--fix` only after P04 (door + `fgos init` call + messages) is landed and activated on fg-server2 and the owner-machine guide section for P04 is written. Every release that lacks the fix carries the door (P06 depends on P04), and between P04 and P06 both paths recover, so no activation order loses a recovery path.

## Rollback (per phase)

Revert the phase's merge commit on `main`, re-activate the previous release on both machines (prior release id recorded in the guide), record the revert on the board. No on-disk format changes in any phase: doctor rows are not stored; the Git door reads and writes the same WAL through the same Recovery port; moved checks write nothing. Reverting P06 alone restores `git-land-recovery` in `--fix` while P04's door stays (both paths again). Reverting P04 requires P06 reverted first (the board line says so).

## Red-team review of this plan (planner, 2026-11-06)

| Id | Finding | Sev | Disposition |
|---|---|---|---|
| RT-1 | Git recovery leaves `--fix` while an old `fgctl` keeps running only `init`/`doctor --fix`/`doctor` | High | Recovery moves into `fgos init` (release side), not the `fgctl` tail; P06 after P04 activated (Landing) |
| RT-2 | `registrations.mjs` collides with T5's chain | High | Single-writer board line shared with T5; phases kept small; rebase before edit and land; no parallel code phases inside this plan |
| RT-3 | Deleting `event-store-refspec` as "dup of `git-repository-config`" may drop the push-overlap and pinned-URL judgments | Med | P02 builds a condition table; an uncovered condition moves into `git-repository-config` before the row goes |
| RT-4 | `tier-vocabulary-dead-keys` dup claim unproven | Med | P02 proves with a fixture that `config-unknown-key` fails on each dead key, else the row stays |
| RT-5 | Removing `doctor` from the Event Store lifecycle set stops doctor from sealing/publishing on fgOS repos | Low | Every other verb still seals/publishes; doctor is a diagnostic; `event-store-incidents` points to `fgos events status` |
| RT-6 | Pointer rows that warn make `doctor --strict` pass with stuck attempts or integrity errors | Med | Decided (frame item 3); CHANGELOG names it; the component verbs still exit non-zero where they did |
| RT-7 | Moving the knowledge lints out of doctor loses `doc-current-path-missing` visibility in this repo (history-derived, cannot be an `npm test`) | Med | Owner accepted "check only what the checkout has" (1a); `fgos knowledge status` shows them; P10 guide names the verb |
| RT-8 | Other projects that adopted the doc registry or the indexes lose the `doctor --fix` refresh | Low | Their verbs regenerate (`fgos doc-registry`, `fgos docs-index`, `fgos decision-index`); CHANGELOG line |
| RT-9 | `fgos init` recovery runs before `doctor --fix` prepares Git driver directories on a damaged machine | Low | Recovery is fail-safe (warning), and the `git-incidents` pointer in the final `doctor` names `fgos git recover` |
| RT-10 | Orphan attempt sockets lose their only remover | Med | P07 moves removal into `sweepAttempts` in the same commit that drops it from the fix |

## Unresolved questions

### UQ-1. Does `active-release-matches-checkout` leave doctor?

**What is happening.** Decision 65 (1a) moves "the 21 fgOS-repo rows" to `npm test`/CI/pre-commit. The audit's 21 count includes `active-release-matches-checkout`, whose own proposed home is K.
**Cause.** The row compares this checkout's working tree with this machine's activation (`registrations.mjs:4209`); CI and `npm test` have no activation, so it cannot be a test.
**Options.** (a) Keep it in doctor (it answers "will plain `fgos` here run the code I see", a readiness question on dev machines; costs 222 ms; skips outside source checkouts). (b) Move it to pre-commit (adds a release-builder digest per commit, warns only). (c) Delete it.
**Recommendation.** (a). The plan proceeds on (a); (b) or (c) is a one-row change in P03.
**Scope of the answer.** This row only.
