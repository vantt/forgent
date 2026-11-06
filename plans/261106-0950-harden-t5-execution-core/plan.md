---
title: "HARDEN T5 sub-plan: Execution Core, Dispatch & Confinement, Seat Binding, Run Result"
description: "Step 4 of the HARDEN per-layer loop for T5: the accepted findings still open after batches A-D, owner decisions 61 and 62 (Q1a, Q2b, Q3b, Q5a; additions A3, A4, A5, A7, A8) split into thirteen sub-phases with serialized hot files, net size below zero, self-landing on fg-server2 and a Vietnamese owner-machine guide."
status: pending
priority: P1
effort: ~9d lead time (P01 0.5d; P02 0.5d; wave 2 P03 ∥ P04 ∥ P05 ∥ P07 ≈ 1.5d; wave 3 P08 ∥ P11 ≈ 1.5d; P06 1d; P09 1d; P10 1d; P12 1.5d; P13 1d)
branch: main (plan only; each phase runs on its own track branch `harden/t5-pNN-<slug>` in its own linked worktree from origin/main)
tags: [harden, execution-core, dispatch, confinement, seat-binding, run-result, config, tests]
blockedBy: []
blocks: [261021-1118-harden-low-layers-bottom-up]
created: 2026-11-06
---

# HARDEN T5 sub-plan: Execution Core, Dispatch & Confinement, Seat Binding, Run Result

Main `4b116c27e` (2026-11-06 09:5x Asia/Saigon, fg-server2). Every `file:line` below was re-read on this commit. Step 4 of [the per-layer loop](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop) for [layer phase 06](../261021-1118-harden-low-layers-bottom-up/phase-06-t5-execution-core-dispatch-seat-run-result.md). Inputs: [arbitration](../reports/council-261104-1854-harden-t5-arbitration.md) (§2 shapes APPROVED as written, §3 accepted, §4 additions, §5 net size), owner decisions 61 and 62 in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md), the seats ([correctness](../reports/council-261104-1840-harden-t5-seat-correctness.md), [speed](../reports/council-261104-1840-harden-t5-seat-speed.md), [simplicity](../reports/council-261104-1840-harden-t5-seat-simplicity.md), [red-team](../reports/council-261104-1840-harden-t5-seat-redteam.md)), the [baseline](../reports/research-261104-1755-harden-t5-baseline.md). Where a seat and the arbitration differ, the arbitration wins. This plan reopens no decision; one consequence of Q2b the arbitration did not cost is asked as UQ-1.

## Outcome

When T5 closes: the Run Result outcome is derived once, in Rust, through the combined addon; Node keeps flow only, cut into named functions under 300 lines; the config schema (not Node) owns type rules, and a project file can only tighten confinement; a confined worker sees only its own login; fgOS never writes the operator's `~/.claude.json`; a renewed login is written back only from a host-only record and only after the probe proves the account; held homes settle again by themselves; nothing a refused launch made is left behind; the lower layers never import Dispatch; each seat decision has one owning proof (Rust golden), Node tests prove only what the facade adds. Net size below zero; lands phase by phase on fg-server2 (decision 61 Q5a), the owner machine by a Vietnamese guide.

## Target shapes (approved, decision 62)

Not copied. Read [arbitration §2](../reports/council-261104-1854-harden-t5-arbitration.md#2-part-a-target-shapes-for-owner-approval). Measurable parts used below: `src/runner/execution` ≤ 7 000 lines (7 682 now), `run.mjs` ≤ 1 150 (1 640); Dispatch outside `confinement/` ≤ 19 000 (20 041), `assignment-runner.mjs` ≤ 1 500 (2 143) with `executeAssignment` ≤ 300 (1 118, `:1027-2144`), `config.mjs` ≤ 1 300 (2 084), `dispatch.mjs` barrel gone (68); confinement ≤ 5 950 (5 892, already met; must stay met after A7/A8/Q3b); `bind.mjs` ≤ 520 (564); `run-result.mjs` ≤ 1 150 (1 387); no function over 300 lines in the layer.

## Already landed on main (excluded from the phases)

Each verified with `git merge-base --is-ancestor <hash> origin/main` on `4b116c27e`.

| Hash | Item | What it did |
|---|---|---|
| `0f6843fc6`, `a56d56541` | R-1 (Critical) | write-back target only from the host finalization descriptor `runDir/protected/confinement-finalization/<id>.json` (`authority.mjs:1326-1340,1366-1407`); held homes no longer auto-settle, doctor names them |
| `fc0d237d3` | B-3 | undeclared `role` → `...seatTag` (`run.mjs:1240-1242`) |
| `77861ee63` | B-2 | unclassified record judged, not `pass` |
| `b423adcff` | S-1 | `explainSeat(..., { chain: false })` (`bind.mjs:546`, `blind-steps-proven-pools.mjs:74`); 559 → 183 spawns |
| `79160ded6` | S-2 | one `result()` per run (`runtime-inspection.mjs:276`) |
| `e0c2f1bbb` | B-6 | doctor family via `getProviderFamily` |
| `c75da9a47` | R-4 | `.mcp.json`, hooks, marker through `readAgentFileSync` |
| `7b25e0b3c` | B-12 | unreadable generation refuses `generation-unreadable` |
| `8dabc57d1`, `6f2ccb617` | dead doors, modules, 11 exports, `validatePlacementPolicyShape`; cascade `cliSpawnAdapter` body; `herdrSpawnAdapter` → `registerSupervisedOnlyAdapter` | |
| `6c5c6d979`, `91b50c2f9`, `8af1a6b71` | H20 `lock-wait.mjs`; adapter sniff + `parseHerdrUsage`; settled-result predicate | |
| `eab8601b9` | O-3 (most sites) | `publishMutableProjection` at 8 sites (first `unit.json` write still plain, see P10) |
| `847913570` | O-5 shadow binder + doctor row | |
| `14644e7d3`, `4e4c6608a`, `a6251673a` | B-10; B-14..B-18; R-7 | |
| `d49de8fa4`, `3875eeb3c` | Simpl. 8 one quota list; B-11 | |
| `d56701e54`, `2c9226371`, `ba0186eec`, `82c4de0f6` | docs for the above | |

Measured on those 21 product commits (`git show --numstat`): Node −1 699, tests −1 747, Rust 0. **Not landed:** batch A's B-7 (`74392b7fe`, 1-hour age rule) was dropped (sticky account risk); it is re-planned in P07 on a real closed signal. `docs/` is no longer frozen (DOC Phase 9/10 landed 11-03/11-04, board row DOC), so spec lines land with their phase or in P13.

## Where each open item goes

| Item | Phase |
|---|---|
| Red proofs for every open High/Medium not yet held by a test (R-2, R-3, R-5, R-6/H-T4f, B-7, B-8, B-13, A8 residual) | [P01](phase-01-red-proofs.md) |
| O-1, O-2 leaf moves; A3 architecture guard; A4 no-undef gate | [P02](phase-02-layering-moves-and-guards.md) |
| Q3b masks; A7 host-only record (held homes settle again); A8 probe gate; dead attestation phases | [P03](phase-03-credential-and-confinement-doors.md) |
| Q2b tighten-only confinement rule; command/args global-only (gated on UQ-1) | [P04](phase-04-config-tighten-rule.md) |
| Q1a claude private trust store (R-2 = B-1 = H-T4c); B-4, B-5; trust-store durable write | [P05](phase-05-claude-private-trust-store.md) |
| R-6 + H-T4f refused pre-handover launch leaves no home and no pane | [P06](phase-06-launch-failure-path.md) |
| B-7 (closed signal), B-8, B-13, H-T4d text judge (vector-gated), D-T2-7 | [P07](phase-07-small-fixes.md) |
| A5 Run Result derivation in Rust via the addon; B-9 vectors; V3 only, V4 gone | [P08](phase-08-run-result-one-derivation.md) |
| `executeAssignment` cut; `admitRunAttempt` own module; `settleRefusedLease` to `settlement.mjs`; duplicates, no-op catches, plan labels | [P09](phase-09-dispatch-cut.md) |
| `runUnitBody` cut; pure `answerProviderLimit`; shared `askFor` (dry bind); first `unit.json` write through the door; `legacyPersonaProjection` check | [P10](phase-10-execution-core-cut.md) |
| Simpl. 7 type rules to the runner schema; `loadRunnerConfig` and fixtures; `dispatch.mjs` barrel | [P11](phase-11-config-to-schema.md) |
| Seat tests to facade wiring; failover proven on `answerProviderLimit`; pre-admission refusals file; `exec-budget` at client; failover skip fails when bwrap claimed; `executor-posture-coverage` folded into `seat-binding-dry-bind` | [P12](phase-12-test-structure-and-doctor-fold.md) |
| Spec lines (shapes, hostile-input rule, non-goal §3.2, §9.3), backlog rows, hand-offs, re-measure, close, guide | [P13](phase-13-spec-handoff-close-land.md) |

Settled without a phase: H-T4e closed (arbitration §2: short calls stay unconfined by design); `herdrSpawnAdapter` kept as registration (landed); `--wait` on `take`/`pick` reaches no wait (`bin/fgos.mjs:3200-3201,3273` parse it, `claimWork` takes none) → hand-off H-T5c to WORK (Work verbs; "foundation first, Work later"); A1, A2 not taken; A6 is backlog `p-x4qeqdvfl5`.

## Facts this plan rests on (verified on `4b116c27e`)

1. **B-7 closed signal exists in the unit record, not in the state.** `state.assignments[provider:assignmentId]` is written at lease (`provider-capacity.mjs:661`), read for sticky ranking (`:592`) and by the pass audit (`:688-698`, called `run.mjs:1393`). Assignment ids are `unitRunId/seat/round[-fbN]` (`run.mjs:1195,1328`); every later bind of a seat uses `attemptNo + 1` (`:1438,1505,1521`) and a resume reuses the recorded binding without a bind unless the seat is rebound, which also takes a new number (`:1206-1212`). So once the controller has recorded an attempt's outcome, no reader asks for that id again: dropping the entry right after the audit point is the closed signal; a controller that dies earlier leaves the entry (still needed for sticky). No age rule.
2. **Q2b breaks committed project configs.** This repo's `.fgos/config.yaml:18-25` sets `runner.executor.command/args`, and executor entries carry invocation commands (`:159` gitnexus, `:181` herdr). `scope.rs:66-75` refuses a project key under a `global-only` node and a list above one (`invocations` is a list), so after the schema change every project file that names executor commands is refused on every machine at once. Hence UQ-1.
3. **Claude private store reuses `createWorkerHome`.** `worker-home.mjs:74` already provisions a private `.claude.json` (onboarding, theme, trust) and copies `.claude/.credentials.json`; `trustStorePaths` sends claude to the real `~/.claude.json` always (`herdr-round.mjs:309-310`) and `seedAttemptTrust` writes it when there is no worker home (`:463-465`). The claude env that points at a private config is unmeasured: one live claude run (P05).
4. **A3 cannot be absolute for `src/run-supervisor`.** After the leaf moves, run-supervisor still imports dispatch from its three plug-in steps (`steps/settle-attempt.mjs:8-15`, `finalize-home.mjs:6`, `cleanup-trust.mjs:10`) plus `direct-launch.mjs:19` (`readSettledResult`) and `gate-kill-grace.mjs:9` (`RunnerConfigError`). The guard names the steps as dispatch code the supervisor runs (simplicity O-2 reading, arbitration §2); the other two are resolved in P02.
5. **Addon ownership.** `packages/git/node-addon/Cargo.toml:9-25` links git, event-store, holder-lock, process, identity, durable-file, canonical-json, yaml-doc, config, not `run-result`; the addon is Git's (owner Q1, component-boundary row 92), so A5's Cargo diff gets OPC review.
6. **No JS parser dependency** (`package.json` `"dependencies": {}`); Node 24.22 ships acorn 8.18 under `--expose-internals` (`internal/deps/acorn/...`), verified. A4 uses it.
7. **Prior art for A7.** `0f6843fc6` removed `settleHeldCredentialHome`, `settleHeldCredentialHomes`, `createConfinementCredentialRenewal` and the `heldHomes` hook of `refreshAhead`; A7 restores that settle path reading the host-only record instead of the marker (reuse `git show 0f6843fc6^:<file>`).

## Phases

| # | Phase | Depends on | Parallel with | Δ Node / Rust / tests (estimate) |
|---|---|---|---|---|
| 01 | [Red proofs](phase-01-red-proofs.md) (branch only, never landed alone) **done 11-06 on `harden/t5-p01-red-proofs`** | — | — | 0 / 0 / 0 (counted where each lands) |
| 02 | [Layering moves, A3 guard, A4 no-undef gate](phase-02-layering-moves-and-guards.md) **landed 11-06 `98e1c5824..7a4fa3654`** | 01 | — (touches import lines everywhere) | +80 / 0 / +20 |
| 03 | [Credential and confinement doors (Q3b, A7, A8)](phase-03-credential-and-confinement-doors.md) **landed 11-06 `accc31973..51d5d02dd` after three security reviews** | 02 | 04, 05, 07 | +90 / 0 / +100 |
| 04 | [Config tighten rule (Q2b)](phase-04-config-tighten-rule.md) **half A landed 11-06 `10a6b8425..fcdffd361`; half B open** | 02; command half: UQ-1 | 03, 05, 07 | 0 / +44 / +40 |
| 05 | [Claude private trust store (Q1a)](phase-05-claude-private-trust-store.md) | 02 | 03, 04, 07 | −35 / 0 / −40 |
| 06 | [Launch failure path (R-6, H-T4f)](phase-06-launch-failure-path.md) | 03, 05, 08, 11 | — | +15 / +15 / +40 |
| 07 | [Small fixes (B-7, B-8, B-13, H-T4d, D-T2-7)](phase-07-small-fixes.md) **landed 11-06 `3f81fa916..36b59f731`** | 02 | 03, 04, 05 | −310 / 0 / −50 |
| 08 | [Run Result one derivation (A5)](phase-08-run-result-one-derivation.md) | 02, 05 | 11 | −270 / +60 / −100 |
| 09 | [Dispatch cut](phase-09-dispatch-cut.md) | 06, 07 | — | −300 / 0 / −50 |
| 10 | [Execution core cut](phase-10-execution-core-cut.md) | 07, 09 | 11 (if 11 done, n/a) | −250 / 0 / −50 |
| 11 | [Config type rules to schema](phase-11-config-to-schema.md) | 03, 04 | 08, 10 | −600 to −1 000 / 0 / −200 |
| 12 | [Test structure and doctor fold](phase-12-test-structure-and-doctor-fold.md) | 10, 11 | — | −85 / 0 / −1 100 |
| 13 | [Spec, hand-off, close, land](phase-13-spec-handoff-close-land.md) | 01–12 | — | 0 / 0 / 0 |

```
wave 0:  P01 (red proofs on a branch)
wave 1:  P02 (alone: import lines in ~35 files)
wave 2:  P03 ∥ P04 ∥ P05 ∥ P07                 (disjoint files, table below)
wave 3:  P08 (after 05) ∥ P11 (after 03, 04)
wave 4:  P06 (after 03, 05, 08, 11)
wave 5:  P09 (after 06, 07)
wave 6:  P10 (after 09)                        ← P04's command half joins whenever UQ-1 is answered
wave 7:  P12 (after 10, 11)
close:   P13
```

Hot-file chains (one phase at a time): `assignment-runner.mjs` P02 → P05 (one envelope-env line) → P08 (lease-refusal writer line) → P06 → P09; `run.mjs` P02 → P07 (one call) → P10; `config.mjs` P02 → P11; `registrations.mjs` P03 → P11 → P06 → P12; `runner.schema.yaml` P04 → P11; `herdr-round.mjs` P05 → P06; `assignment.mjs` P09 → P10.

**Sum** (Rust test code counts as tests; schema YAML and JSON fixtures not counted): Node about −1 680 to −2 080, Rust about +120, tests about −1 400. **Whole-plan budget:** Node ≤ −1 300, Rust ≤ +150, tests ≤ −1 000; with the landed batches (Node −1 699, tests −1 747) the layer's HARDEN total is about −6 600 lines, inside the layer phase file's range and ≤ 0 in every answer of UQ-1. Arbitration §5 accepted Node −2 450 to −2 850 for the whole layer plus additions (Q1a −40, Q2b +10/+40 Rust, Q3b +20, A3 +10 test, A4 +40, A5 −180/+40 Rust, A7 +40, A8 +30); landed batches took Node −1 699 of it, so the remainder by that count is about −1 300 to −1 700. This plan is a little larger in Node because it also deletes the dead `buildConfinementAttestation` phases, `herdr-deadlines.mjs`, the `executor-posture-coverage` module and the `dispatch.mjs` barrel (L10), and larger in Rust because A5 must take Node's rule 0 and reason strings (B-9) and adopt releases a pane by key (H-T4f).

## File ownership (no two parallel phases share a file)

`CHANGELOG.md` and `packages/git/contracts/mutation-census.v1.json` are rebase-only (regenerate with `node scripts/git-one-door-scan.mjs --write-census`). `test/suite-baseline.json` is TEST's: report retired files, never hand-edit. `docs/architecture-manifest.json` rows go with the phase that adds, moves or deletes a `src/` file.

| File(s) | Owner phase(s), in order |
|---|---|
| `src/runner/dispatch/{process-identity,proof-helpers,run-lock,cwd-lock,dispatch-error,stray-writes,worker-artifacts,trust-store}.mjs` (move), every importer's import line, `test/architecture.test.mjs`, `scripts/` no-undef script, `test/scripts/` no-undef test | 02 |
| `src/runner/dispatch/confinement/{resources,cleanup,authority,drivers/bwrap,probes/harness}.mjs`, `provider-credential-renewal.mjs`, `provider-credential-probe.mjs`, credential doctor module in `src/setup` | 03 (authority also 06 for the finalize call on the failure path only if needed) |
| `packages/config/rust/**`, `packages/config/contracts/**` | 04 |
| `core/config-schema/runner.schema.yaml` | 04 → 11 |
| `trust-store.mjs` (moved by 02 to `src/run-supervisor/`), `src/run-supervisor/steps/cleanup-trust.mjs`, `worker-home.mjs` | 02 (move, imports) → 05 |
| `herdr-round.mjs` | 05 → 06 |
| `assignment-runner.mjs` | 02 → 05 → 08 → 06 → 09 |
| `src/run-supervisor/direct-launch.mjs`, `packages/run-supervisor/rust/src/adopt.rs`, `contracts/attempt-intent.v1.json`, Rust `adopt_matrix.rs` | 02 (import) → 06 |
| `provider-capacity.mjs`, `worker-session-boot.mjs`, `recovery-planner.mjs`, `src/verbs/dispatch/recover.mjs`, `visibility-session.mjs`, `runtime-inspection.mjs`, `src/cli/command-registry.mjs`, `contracts/recover-actions.v1.json`, `herdr-deadlines.mjs` (delete), `src/setup/terminal-control-checks.mjs` | 07 |
| `run.mjs` | 02 → 07 → 10 |
| `run-result.mjs`, `unit-run-history.mjs`, `packages/run-result/rust/**`, `packages/git/node-addon/**`, `src/native/door.mjs` (only if a loader line is needed), `test/fixtures/run-outcome/**` | 08 |
| `settlement.mjs`, new `admit-run-attempt.mjs` (name via convention) | 09 |
| `assignment.mjs` | 09 → 10 |
| `dry-bind.mjs`, `bind.mjs`, `commit-unit-work.mjs` | 10 |
| `config.mjs`, `src/runner/dispatch.mjs` (delete), `bin/fgos-runner.mjs`, `scripts/dispatch-decide-hook.mjs`, `bin/fgos.mjs` (barrel import line only) | 02 (imports) → 11 |
| `src/setup/registrations.mjs` | 02 (imports) → 03 → 11 → 06 → 12 |
| `src/setup/{seat-binding-checks,executor-posture-coverage}.mjs`, seat-binding tests, `failover-fixture.mjs`, `run-provider-failover.test.mjs`, `run.test.mjs` split, `exec-budget.test.mjs`, `client.test.mjs`, `packages/seat-binding/contracts/seat-binding.golden.v1.json` | 12 |
| `docs/platform/**` specs, `docs/backlog.md`, `docs/decisions` projection | the phase whose behaviour the line states, else 13 |

## Acceptance criteria (layer)

1. Every row of "Where each open item goes" is done, or parked with its owner question named on the board (P04 command half only, UQ-1).
2. Line budgets of §2 met and printed by `wc -l` in P13: `src/runner/execution` ≤ 7 000, `run.mjs` ≤ 1 150, Dispatch outside `confinement/` ≤ 19 000, `assignment-runner.mjs` ≤ 1 500, `config.mjs` ≤ 1 300, confinement ≤ 5 950, `bind.mjs` ≤ 520, `run-result.mjs` ≤ 1 150; the function-length scan (scratch, as used for this plan) shows no function over 300 lines in `src/runner/execution` and `src/runner/dispatch`.
3. `rg -n "runner/dispatch/" src/native src/state src/holder-lock` returns nothing; in `src/run-supervisor` only the three `steps/` files (A3 guard green).
4. `rg -n "deriveOutcome|deriveLegacyOutcome|deriveEvidenceFloor|RUN_RESULT_CONTRACT_V4|validateRunResultV4|normalizeRunResultV2" src` returns only the addon call site; `rg -n "\.claude\.json" src/runner src/run-supervisor` shows no write path; `rg -n "resume-driver|reassign-driver|dispatch\.claim|DRIVER_FRESH_MS" src` returns nothing; `src/runner/dispatch.mjs` and `herdr-deadlines.mjs` do not exist.
5. A confined read (probe harness, stand-in stores) of every inventory login store returns ENOENT; `gh` and `~/.ssh` stay readable; a project config that lowers confinement is refused by name.
6. Every retired test names the test that now owns its behaviour (phase file and commit body).
7. Land gate (below) green at each land.
8. Net size of HARDEN T5 commits ≤ 0 for the layer, per language, measured in P13.

## Land gate (every phase, run by the big lead on a host built from the tree)

- `cargo test` of each touched crate, `cargo clippy -D warnings` on them, `cargo check --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`, `cargo fmt --all --check`.
- One-door census: `node scripts/git-one-door-scan.mjs --root .` reports 0 undeclared.
- Full `npm test` through `node scripts/run-tests.mjs` with every `HERDR_*` and `CLAUDE*` variable unset and a private `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<branch>-target` (never `/tmp`); read both the ERROR lines and the fail count. Known pre-existing red: the V7n frozen addendum test (MAIL lane).
- On any docs change or `src/` deletion: `test/scripts/doc-health.test.mjs` and `test/scripts/check-decision-citation-drift.test.mjs`.
- From P02 on: the A3 guard and the A4 no-undef test are part of `npm test`.

## Lead rules (every brief carries these)

- One lead subagent per phase, own linked worktree created from `origin/main` (never local main), own ext4 `CARGO_TARGET_DIR` under `/home/vantt/projects/forgent-worktrees/<name>-target`, deleted when the phase lands.
- **Find the owning test before writing a new one** (design principle 8); a retired test names its new owner in the phase report and the commit body; never weaken an assertion of a behaviour that still exists.
- Focused Node tests only through the FR one-liner (never `npm test` or `scripts/run-tests.mjs <file>`, which runs the whole suite), with `FGOS_HOST_BIN` naming a host built from the worktree:
  `node --input-type=module -e "import { runSelectedTests, buildTestEnv } from './scripts/run-tests.mjs'; import { ensureGitAddon } from './scripts/lib/git-addon-stage.mjs'; const env = buildTestEnv(process.env); ensureGitAddon(env); process.exitCode = runSelectedTests(process.argv.slice(1), { env }).status;" -- <test files>` (FR below). No focused run in a worktree while a full suite runs there. Never SIGKILL a test run; message the big lead before any heavy run.
- `git diff --cached --stat` before every commit; explain any large deletion or empty file; stage explicit paths.
- Every edit to a hashed file regenerates the census in the same commit. A user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- RUL104 and L10: change a contract → move every caller and delete the old path in the same change; no new mechanism beyond the phase's approved item; no env switch, flag or test-only branch to make a test pass.
- No plan ids, phase numbers or finding codes in code, tests or commit messages; trim existing ones in code the phase touches.
- Report: Δ lines per language next to the phase estimate, test-cost line (tests added/retired, new spawns and their reason), red evidence for each fix; name from `fgos convention name --slug <slug> --json` under `plans/reports/`; only what you ran yourself; end with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`.

## Landing (decision 61 Q5a)

- **fg-server2 self-lands each phase** in a quiet window announced on the board (one `log.md` line with window and branch), after the land gate: rebase on `origin/main`, gate, `git log origin/main..HEAD` before push; build, stage, activate the release on fg-server2; `fgos doctor` and one real `fgos run` smoke (a direct seat; a pane seat after P05, P06; a confined seat after P03). WORK, TEST, ES told before the window; OPC reviews any Git-area diff (P02 census and moves; P08 addon Cargo diff). A `~/.fgos/config.json`/config-schema change (P04, P11) activates on every workspace and machine together: P04 and P11 land only in a window the owner machine can follow the same day.
- **Owner machine:** one Vietnamese guide `plans/reports/guide-<date>-owner-machine-harden-t5-execution-core.md` (name from `fgos convention name`), one section per landed phase: main commit, what changes for the user, commands (pull, build/stage/activate on forgentX, mdview, mcp-skill-hub; doctor; smoke), expected doctor rows, rollback. Before P04's command half (UQ-1) and P11 the guide asks for a read-only `fgos config check` census on all three workspaces with the old release.
- **Rollback per phase:** revert the phase's merge commit on `main`, re-activate the previous release on both machines (`fgos` activation of the prior release id recorded in the guide), record the revert on the board.

### On-disk formats this plan changes

| Format | Phase | Previous release reads it? |
|---|---|---|
| claude trust: no entry in `~/.claude.json`; a per-attempt private claude config dir (location fixed in P05) and no `controller/trust-context.json` for claude | 05 | yes: old `cleanup-trust` sees no context → `none-written` |
| host-only record `<tempRoot>/<dispatchId>/<name>.json` (0700, not bound; target, runDir, attemptId, keep counter) | 03 | ignored; old release keeps such homes held, as today |
| pending copies under `credentialStoreDir(...)/pending` marked by origin (agent home vs fgOS scratch) | 03 | old release applies them without the probe (rollback reopens the A8 residual; noted in guide) |
| `attempt-intent.json` gains `terminal` (pane key, group key, endpoint env) | 06 | lead verifies `adopt.rs` intent read ignores unknown fields; if not, the field ships with a contract version bump |
| provider-capacity `state.assignments` entries removed after the outcome is recorded | 07 | yes (missing entry = no sticky, no audit) |
| recover actions `resume-driver`, `reassign-driver` no longer offered | 07 | n/a (old release may still offer them on rollback) |
| lease-refusal `result.json` written V3 (was V2); recorded `classification.outcome` reasons from the Rust derivation | 08 | yes (V3 reader exists); metrics on old records may change reason strings only |
| config schema: tighten rule on confinement; command/args global-only (UQ-1); `confinement` `additionalProperties: false`; type rules moved from Node | 04, 11 | yes for files the new release accepts |

## Hand-offs (recorded here; not phases)

| Id | What | To | Source |
|---|---|---|---|
| H-T5a | S-3 split of `run.test.mjs` and the failover file across files; S-4 lighter staged test addon (ledger H13) | TEST | arbitration §4 |
| H-T5b | S-6 `refreshAhead` on the launch path; `.fgos/assignments` retention (782 run dirs) | backlog rows (P13 adds them) | arbitration §4 |
| H-T5c | `--wait`/`--no-wait` on `take`/`pick` validated but never reach `claimWork` (`bin/fgos.mjs:3200,3273`; `claim-port.mjs:98`) | WORK | batch B report, this plan |
| H-T5d | `src/event-store/native.mjs:32` regex re-parse of addon errors | ES (note) | arbitration §4 |
| H-T5e | T2 §5(1) class-B herdr callers that stay raw: `worker-session-boot.mjs:167` (`herdr server` spawn) documented as the one raw call | terminal-control spec line (P13) | arbitration §2 received |
| H-T5f | Legacy `state.assignments` entries written before P07 (636 on fg-server2) are not reached by the closed signal | guide note (optional hand removal when no lease is held) | fact 1 |

The big lead copies H-T5a to TEST and H-T5c to WORK on the board the same turn this plan is accepted (owner decision 8).

## Red-team review of this plan (planner, 2026-11-06)

| Id | Finding | Sev | Disposition | Applied to |
|---|---|---|---|---|
| RT-P1 | Q2b's global-only command keys refuse this repo's own `.fgos/config.yaml` and every project that commits executor entries, at once on all machines (fact 2) | High | UQ-1; P04 splits: tighten rule lands, command half waits | plan, P04 |
| RT-P2 | B-7 age rule could move a resumed assignment to another account | High | Closed signal = outcome recorded in the unit record (fact 1); proof: resume keeps account after drop | P07 |
| RT-P3 | A3 literal wording fails on the supervisor's plug-in steps | Med | Guard names `src/run-supervisor/steps/*` only; `direct-launch` and `gate-kill-grace` imports resolved | P02 |
| RT-P4 | A5 changes recorded reasons on new records (Rust has no rule 0, different reason strings, B-9) | Med | Vectors first; Rust takes Node's rules (Node is the writer today); metrics change on old records is reason-only and listed | P08 |
| RT-P5 | A8 probe is async (up to 90 s), finalize-home is a sync step under `stepTimeoutMs` | Med | Write-back of an agent-home copy only stages; `refreshAhead` (async, already probes) applies after the probe and identity check | P03 |
| RT-P6 | A7 keep counter is read from the agent-writable marker (`authority.mjs:1384`): an agent can force "held" or reset retries | Med | Counter moves to the host-only record with the target | P03 |
| RT-P7 | Q3b file masks: bwrap masks are `--tmpfs` on directories (`bwrap.mjs:644,654`); a login store named as a file cannot take that mask | Med | Mask the store's directory (schema: "Login directory per CLI"); a file-shaped entry is refused by name at resolve, never skipped | P03 |
| RT-P8 | Q1a may need a credential copy for claude (token rotation in a private config dir) and reopen write-back for claude | Med | Measured live run first; if a copy is needed, stop and ask (out of the Q1a frame: Node −40) | P05 |
| RT-P9 | P02 moves touch ~35 files incl. every hot file; parallel phases would conflict | Med | P02 runs alone in wave 1 | plan |
| RT-P10 | A4 relies on Node internals (`--expose-internals`) | Low | Test refuses by name when the internal parser is missing (never passes silently); `package.json` engines says only `>=18`, so the refusal names the Node version it needs | P02 |
| RT-P11 | Deleting B-13 driver actions is user-visible (`fgos dispatch recover` examples, `command-registry.mjs:1445`) | Low | CHANGELOG line; recover-actions contract updated | P07 |
| RT-P12 | P11 schema move may lose a Node check the schema cannot express (cross-field) | Med | Each removed Node check names its schema rule or stays as cross-field; `confinement` gains `additionalProperties: false` | P11 |
| RT-P13 | Retiring ~45 Node seat tests may drop a facade fact (`executorFacts`, `accountViewOf`, refusal mapping, herdr transport) | Med | Each retired test lists what it asserted and where golden or the kept wiring asserts it; anything left keeps the test | P12 |
| RT-P14 | CFG lane is closed and its reviewer role vacant (board CFG row) | Low | Big lead names a reviewer on the board before P04/P11 land (Config spec owner) | P04, P11 |

Rejected: none.

## Unresolved questions

**Answered 2026-11-06 12:1x: (a)** (HARDEN decision 64): census first, values move to each machine's global file and out of each project in its own commit, then the schema change.

### UQ-1. Where do the executor commands that projects already commit go, once command and args are global-only (Q2b)?

**What is happening.** Decision 61 Q2b makes executor `command` and `args` global-only. This repo's committed `.fgos/config.yaml` (`:18-25` default executor, `:159` gitnexus, `:181` herdr, more entries below) names them, and so does any project whose config carries executor entries. When the schema change activates, the config door refuses those files on every machine at once (`packages/config/rust/src/scope.rs:66-75`: a global-only key, or a list above one such as `invocations`, in a project file is `config-key-out-of-scope`), so every `fgos run` in those projects stops until the files change.

**Cause.** Checked on `4b116c27e`: `runner.schema.yaml:9,690` give `executor` and `executorEntry` scope `both` "read from the trusted main checkout"; Q2b's arbitration cost (Rust +40, test +40) counted the rule, not moving the values already committed in projects.

**Options.**
- (a) Refuse, and move the values first: before P04's command half lands, each machine copies the project's executor commands into its global file (guide step, read-only census first), and each project removes them in its own commit. Gain: one authority, fail closed. Cost: a coordinated edit in every project and on every machine; teammates of a project must each configure executors in their global file. Code: as planned.
- (b) A project may restate a command only when it equals the merged global/standard value; any other value is refused. Gain: projects whose commands match keep working. Harm: project-only executors (gitnexus, herdr tool entries) are still refused; a second rule for one key. Code: Rust about +25 more.
- (c) For one release a project command is ignored with a notice instead of refused (fence, owner decision 1: fences live one release), then refused. Gain: nothing stops at activation. Harm: an executor declared only in a project silently disappears for that release.

**Recommendation.** (a): it is what Q2b decided, and the census makes the edit list exact; the tighten-only confinement rule (the half that closes the red-team hole for confinement) lands now without waiting.

**Scope of the answer.** (a) authorizes the guide steps and the project-file edit as owner-made commits; no code beyond P04. (b) authorizes the equality rule in `scope.rs`/`snapshot.rs`. (c) authorizes a one-release notice path and its later removal item.
