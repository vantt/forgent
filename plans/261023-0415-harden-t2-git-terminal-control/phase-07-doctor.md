---
phase: 07
title: "Doctor: Git 10 → 6 rows, terminal 3 → 2 rows, one inspectGit per run, one sentence per failing row"
status: pending
depends_on: [05, 06]
parallel: "with phase 08 (disjoint files)"
effort: ~1d
net_size: "Node −45 / Rust 0 / tests −10 (estimate)"
---

# Phase 07 — Doctor

## Context

Arbitration D1 step 7, §2.4 (the six Git rows, the two terminal rows after CF02 and E-14, one `inspectGit` per run, one sentence per failing row naming its next step with facts under `detail`), §3 verdicts 1 and 3. Simplicity doctor table (conditions), red-team (do not fold native locks or worktree recovery into the journal; keep the refspec fix). [plan.md](plan.md) D-T2-4 (F-C6 here, through WORK's `createDoctorRun` when on main; E-4 and the `git-checks.mjs:135` E-3 site here). CF02 and E-14 are merged (phase 6); E-15's fix deletion already landed separately (phase 6).

Current registrations (verified): the Git loop `src/setup/registrations.mjs:6354-6365`, `git-land-recovery` `:6366-6370`, `git-mutation-one-door` `:6371-6375`, fixes `:6389-6392`; terminal rows `:4476-4489`, config default `:4490`, `herdr-executor-kinds` `:4494` (not T2's row; E-11 is phase 11). `checkGit` `src/setup/git-checks.mjs:27-66` calls `native.inspectGit` once per row (`:38`) and a second time for a non-origin remote (`:54`).

## Requirements

### Git rows (6) and their conditions — none lost

| Surviving row | Conditions it owns (from `git-checks.mjs` today) | Level |
|---|---|---|
| `git-component-compatible` | `napi !== 8`; a contract version differs; `!floor.supported` (the duplicate `floor.probes.every(passed)` re-check at `:171` goes, E-4: the crate enforces it, `driver.rs:74,335-338`); **plus** the information lines of former `git-trust-topology` (`<commonDir>: <layout>`, `:47`, never failed) and `git-durability-capability` (`info: <durability>`, `:60`, never failed) | fail / info |
| `git-repository-config` (new id; replaces `git-transport-config` and `git-publication-refspecs`) | transport diagnostics missing → "upgrade the active release"; untrusted keys → `repository-transport-config-untrusted: …` + remedy; thrown `repository-config-untrusted: credential.helper` → remedy (`:64`); required fetch mapping missing; obsolete exact legacy mapping (configured remote or origin) → `fgos doctor --fix (git-publication-refspecs)`; reserved legacy mirror refs → inspect and remove at source | fail |
| `git-operation-journal` | WAL present and fence missing → `git-fence-missing` + `fgctl upgrade` (`:50`); not initialized / incomplete / errors / pending > 0; **plus** former `git-land-recovery` row: retained Land candidates → `warning:` list (`:154-168`, WORK's branch rewrites that message: take WORK's text if it is on main); scan incomplete → `warning:` | fail / warn |
| `git-native-locks` | native locks present → "never removed" + spec §11 runbook pointer (`:52`) | fail |
| `git-worktree-recovery` | not a repository → info; a non-advisory registration issue → fail; pending worktree operations → fail; `dirty-or-stale-checkout-preserved` and `locked-by-live-process` stay advisory (`:17-18,30-35`) | info / fail |
| `git-mutation-one-door` | census missing / stale / non-empty (`:68-72`) | fail |
| (all rows) | addon not shipped → `info: addon not shipped…`; addon throws → fail with its message (`:63-65`) | info / fail |

Fixes stay four with unchanged ids: `git-driver-directories`, `git-wal-dir`, `git-land-recovery`, `git-publication-refspecs` (`approve.mjs:172` and `merge.mjs:994` name the fix id `git-land-recovery`; unchanged).

### Terminal rows (2)

| Surviving row | Conditions | Level |
|---|---|---|
| `terminal-control` (absorbs `terminal-config`) | route did not answer → warn; answer is not `capabilities` → warn; zero capabilities → "terminal mode unsupported … direct mode unaffected" (Windows wording kept) → warn; anchor pane empty or unresolvable → fail (still the raw `pane get` at `terminal-control-checks.mjs:30` unless phase 11 runs; spec names it); no `layout.geometry` → info; config unreadable → fail; a refusal named by the core (E-14) → fail; the two Node-kept rules (grace vs agent ready timeout; `retainFailedPaneMs` shape) → fail by name; every `terminal.*` value with its source → pass text | warn / fail / info |
| `terminal-allocations` | config unreadable or grace invalid → "allocations not scanned" (the condition itself is `terminal-control`'s) → warn; route did not answer → warn; `unsupported` → info; other result → warn; findings → `warning: N slot(s) need a person; nothing was closed: <key> (pane <paneId>): …` (now true, CF02) | warn / info |

Fix `terminal-dir`: already deleted (phase 6). Config default `terminal` stays until CFG (H27).

### One `inspectGit` per doctor run (F-C6, D-T2-4)

- If `createDoctorRun` is on main (WORK merged): `checkGit(cwd, kind, loaderOptions, run)` reads `run.once(`git-inspect:${root}:${remote}`, () => native.inspectGit(…))`, and the `origin` re-read at `:54` uses the same door with its own key; the registrations pass `run` (`check: (cwd, run) => checkGit(cwd, id, undefined, run)`).
- If not: the six rows call `inspectGit` at most 4 times per run (compatible, repository-config, journal, native-locks; plus one `origin` read when the remote is not `origin`); no second memo is built. The remaining step to one call is recorded **the same turn** as a named follow-up owned by the HARDEN big lead (board HARDEN row + parent hand-off ledger line, trigger: WORK merged), and phase 17's close lists it as open or done. <!-- Updated: Red Team 2026-10-23 -->

### One sentence per failing row (G-1, G-7, G-8)

- Every failing or warning row's `message` is one sentence with the count and the next step; the JSON facts that `message` carries today (`JSON.stringify(facts)` at `:35,39,51`) move to a `detail` field (arbitration §2.4, binding). `bin/fgos.mjs:4233-4236` copies `detail` into the row when present (one line; WORK's branch rewrites this loop: if WORK is on main, edit its version). The row shape `{id, description, passed, message, detail?}` is a doctor JSON contract change: phase 9 writes it into `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` and the CHANGELOG line, and this phase adds one assertion on `detail` to `test/setup/checks.test.mjs` (no test owns the row shape today). A passing row keeps a short positive sentence. <!-- Updated: Red Team 2026-10-23 -->

## Files

**Modify**: `src/setup/git-checks.mjs`, `src/setup/terminal-control-checks.mjs`, `src/runner/dispatch/herdr-deadlines.mjs:6` (comment names the surviving row), `src/setup/registrations.mjs` (Git block `:6354-6392`, terminal block `:4476-4489`), `bin/fgos.mjs` (`detail` pass-through, one line), tests `test/setup/{git-checks,terminal-control-checks,checks,event-store-checks}.test.mjs`, `test/git/{native-load,worktree-recovery,recovery}.test.mjs` (row ids `git-transport-config`/`git-publication-refspecs` → `git-repository-config`, `native-load.test.mjs:318-381`, `event-store-checks.test.mjs:61`, the id list `checks.test.mjs:147-155`). **Delete**: rows `git-transport-config`, `git-trust-topology`, `git-durability-capability`, `git-publication-refspecs` (check id only; the fix id stays), `git-land-recovery` (check id only; the fix id stays), `terminal-config`; `compatibleGitContracts`' probe loop (E-4); the local `JSON.parse(err.message)` at `git-checks.mjs:135` → `nativeError` (E-3). **Tests to retire**: per-row cases of removed row ids are **moved** to the surviving row (not deleted); a case whose condition is now a duplicate of another case in the same row is retired naming that case.

WORK overlap: `git-checks.mjs:149-165`, `registrations.mjs` (`:184-286` run object, `:6342` hunk above the Git loop), `bin/fgos.mjs` doctor loop. Whichever lands second rebases; the big lead re-runs the doctor tests after the rebase.

## Steps

1. Branch `harden/t2-p07-doctor` after phases 5 and 6 merged (rebase on main first if WORK merged).
2. Condition table above as a checklist in the commit body; Git rows → terminal rows → F-C6 → `detail`.
3. `fgos doctor --json </dev/null` through the dev door (`npm run fgos:dev -- doctor --json </dev/null`) on this checkout: 6 Git rows + 2 terminal rows listed; paste the ids.
4. OPC review (`git-checks.mjs` is Git-area by owner decision 14's scope? it is `src/setup`, not `src/git`; send it anyway because it reads Git facts — one message).
5. Report: rows before/after, Node line counts (`git-checks.mjs` ≤ 150, `terminal-control-checks.mjs` ≤ 140), number of `inspectGit` calls in one run (count with a temporary `console.count` in the worktree only, not committed, or by strace of `cat-file`/`config` children), Δ lines.

## Verification (exact)

Node (one-file command): `test/setup/git-checks.test.mjs test/setup/terminal-control-checks.test.mjs test/setup/checks.test.mjs test/setup/event-store-checks.test.mjs test/git/native-load.test.mjs test/git/worktree-recovery.test.mjs test/git/recovery.test.mjs test/git/one-door.test.mjs`.

`rg -n "git-transport-config|git-trust-topology|git-durability-capability|terminal-config\b" src test` → only fix ids that stay (`git-publication-refspecs`, `git-land-recovery` are not in this pattern) and nothing else; `src/runner/dispatch/herdr-deadlines.mjs:6` names `terminal-control`. `npm run fgos:dev -- doctor --json </dev/null | node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8')); const ids=(r.data?.checks??r.checks).map(c=>c.id); console.log(ids.filter(i=>/^(git|terminal)-/.test(i)))"` prints exactly `git-worktree-recovery, git-component-compatible, git-repository-config, git-operation-journal, git-native-locks, git-mutation-one-door, terminal-control, terminal-allocations` (order may differ).

## Net size

Node −45 (`git-checks.mjs` 172 → ≤ 150; `terminal-control-checks.mjs` −10 beyond phase 6's `fixTerminalDir` deletion, ≤ 140 overall; `registrations.mjs` −12; `bin/fgos.mjs` +1). Rust 0. Tests −10 (moves are neutral; duplicates retired; +2 wiring cases for the merged rows).

## Test-cost line

Added 2 wiring cases (`git-repository-config`, journal with a retained-Land warning); moved ≈ 12; retired ≈ 3 duplicates; doctor run spawns ≤ 4 `inspectGit` (or 1 with the run door) instead of 9–10.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A condition disappears in the fold | M × M | The table is the checklist; every condition keeps one test under its surviving row |
| Scripts or docs grep for old row ids | M × L | `rg` list above; docs in phase 9; CHANGELOG names the renames |
| The `detail` field breaks a consumer of doctor JSON | L × L | Additive field; `fgos doctor` text output unchanged except the shorter messages |
| WORK's rewrite of the same blocks conflicts | M × M | Rebase rule; doctor tests re-run after the rebase |

## Rollback

Revert the phase's commits; no on-disk format change.

## Done when

The F-C6 follow-up is recorded (if WORK had not merged).
`fgos doctor --json` (dev door) lists exactly the 6 Git and 2 terminal rows with the four Git fixes; every condition in the tables has a passing test under its row; budgets met.
