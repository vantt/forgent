# Phase lead report: HARDEN T2 phase 7, doctor rows

Branch `harden/t2-p07-doctor` (from `harden/t2-git-terminal-control` 2658282ae). Commits: `94d9b005b` (rows, detail, tests, docs line, CHANGELOG), `9431d3b98` (census regenerated; payload digest changed, the five unresolved sites are unchanged).

## Rows before / after

| | Before | After |
|---|---|---|
| Git | worktree-recovery, component-compatible, transport-config, trust-topology, operation-journal, native-locks, publication-refspecs, durability-capability, land-recovery, mutation-one-door (10) | `git-worktree-recovery`, `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-native-locks`, `git-mutation-one-door` (6) |
| Terminal | terminal-control, terminal-config, terminal-allocations (3) | `terminal-control`, `terminal-allocations` (2) |
| Fixes | `git-driver-directories`, `git-wal-dir`, `git-land-recovery`, `git-publication-refspecs` | unchanged (4) |

`npm run fgos:dev -- doctor --json </dev/null` prints exactly: `terminal-control, terminal-allocations, git-worktree-recovery, git-component-compatible, git-repository-config, git-operation-journal, git-native-locks, git-mutation-one-door`. (`git-mutation-one-door` failed in that run because the census was stale after my payload edit; it passes after commit 2 and `one-door.test.mjs` is green.)

## Condition map (old file:line at 2658282ae -> new)

`git-checks.mjs` old lines -> same file new row:

| Old condition | Old | New |
|---|---|---|
| `napi !== 8`, contract version differs, `!floor.supported` | `:169-171` | `compatibleGitContracts` -> `git-component-compatible` fail (facts `versions`, `floor` in `detail`) |
| duplicate `floor.probes.every(passed)` | `:171` | removed (crate enforces it, `driver.rs:74,335-338`) |
| trust-topology info `<commonDir>: <layout>` | `:47` | `git-component-compatible` pass text `info: <commonDir>: <layout>; <durability>` (repository only) |
| durability info | `:60` | same pass text |
| transport diagnostics missing | `:44` | `git-repository-config` fail |
| untrusted transport keys + remedy | `:45` | `git-repository-config` fail (`repository-transport-config-untrusted: ...` + remedy) |
| thrown `repository-config-untrusted: credential.helper` | `:64` | `checkGit` catch, only for `git-repository-config` |
| required fetch mapping missing | `:56` (message was bare JSON) | `git-repository-config` fail, now named: `run fgos doctor --fix (git-publication-refspecs)` |
| obsolete exact legacy mapping (remote or origin) | `:54,57` | `git-repository-config` fail, origin read only when the remote is not `origin` and the first read found nothing |
| reserved legacy mirror refs | `:55,57` | `git-repository-config` fail |
| WAL present, fence missing | `:50` | `git-operation-journal` fail `git-fence-missing` |
| not initialized / incomplete / errors / pending > 0 | `:51` | `git-operation-journal` fail, one clause per cause, each with its next step |
| retained Land candidates | `:154-168` | `git-operation-journal` pass-with-`warning:` (helper `retainedLandWarning`) |
| Land candidate scan incomplete | `:158` | `git-operation-journal` pass-with-`warning:` |
| native locks present | `:52` | `git-native-locks` fail + `docs/platform/git/spec.md` section 11 pointer, paths in `detail` |
| not a repository | `:40` | info in the four repository rows; worktree row `:31` unchanged |
| worktree issue / pending operation; two advisory reasons | `:17-18,30-35` | `git-worktree-recovery`: reasons printed in the message, `facts` in `detail` |
| addon not shipped / addon throws | `:63-65` | `checkGit` catch (all rows) |
| census missing / stale / non-empty | `:68-72` | `git-mutation-one-door` untouched |

One narrowing, named: the retained-Land warning is read only when the WAL is initialized and the fence is present. With no WAL there are no Land candidates; with the fence missing the row already fails with the stronger `git-fence-missing` text, and the Recovery port constructed with a writer would refuse anyway.

`terminal-control-checks.mjs`:

| Old condition | Old | New (`terminal-control`) |
|---|---|---|
| route did not answer | `:44-46`, `:96-98` | one warn |
| answer not `capabilities` | `:48-50` | warn, after the failures below |
| zero capabilities, Windows wording | `:52-57` | warn, after the failures |
| anchor pane empty / unresolvable | `:19-37` | fail (still the raw `pane get`, as the plan keeps) |
| no `layout.geometry` | `:62-64` | info |
| config unreadable | `:82-84` | fail `terminal.* unreadable` |
| core refusal (below floor, usage) | `:90-95,101` | fail `the core refused the layout: ...` |
| grace vs ready timeout, `retainFailedPaneMs` shape | `:99-100` (`terminalConfigProblems`) | fail by name |
| every `terminal.*` value with its source | `:104-105` | pass text |
| allocations `see terminal-config` | `:136` | `terminal-allocations` text now says `see terminal-control` |
| findings print `(pane <paneId>)` | `:149` | `terminal-allocations`, only when the finding has a pane id |

`checkTerminalControl` now takes `(repoRoot, { env, platform, globalConfigPath, createClient })`; `createClient(config)` replaces the old `terminalControl` and `createClient` pair.

## inspectGit calls per doctor run

Temporary `console.count` in the worktree (reverted, not committed), the five Git rows on a fresh repository with the default remote: **4** (compatible, repository-config, journal, native-locks). With `eventStore.remote: upstream`: **5** (one origin read). The same five rows at 2658282ae: 7 and 8. `git-worktree-recovery` reads `inspectGitWorktreeRecovery`, not `inspectGit`.

## Line counts

| File | Before | After | Budget |
|---|---|---|---|
| `src/setup/git-checks.mjs` | 171 | **191** | <= 150, **not met** |
| `src/setup/terminal-control-checks.mjs` | 149 | 138 | <= 140, met |
| `src/setup/registrations.mjs` | | -13 net (8 +, 21 -) | -12 |
| `bin/fgos.mjs` | | 0 net (one line replaced, two lines) | +1 |

`git-checks.mjs` misses its budget because the binding message rule (one sentence with a next step, facts under `detail`) put three row helpers and their sentences in the file (+20 lines net). About 70 lines of the file are unchanged fix and recovery code. I did not move that code to another file to meet the number, because that file is not in this phase's Files list. Options for the owner: accept 191, or a later change moves the fix half into its own module.

Delta over the phase: src+bin +109 / -113 (net -4); test +95 / -53 (net +42, of which +37 are new cases listed below).

## Tests

Moved, not deleted: all `terminal-config` cases (8) now call `checkTerminalControl`; all `git-transport-config` and `git-publication-refspecs` cases (9 calls in `native-load.test.mjs`) now call `git-repository-config`; the retained-Land case moved from a direct helper call to the journal row; the `event-store-refspec` agreement case uses `git-repository-config`; the id list in `checks.test.mjs` lost six ids and gained one.

Retired: `terminal-control warns when the route cannot be reached instead of crashing doctor`; its condition is owned by `terminal-control warns, without failing, when the route cannot be reached` (same row, same route-down branch). The native-load fixture now installs the origin fetch mapping up front, because the merged row also judges the mapping; that was the one fixture change.

Added (why no existing test owned it): journal row fails with `not initialized ... git-wal-dir` before any WAL exists; native-locks fails with the runbook sentence and `detail`; the three repository rows answer `info: not a Git repository`; journal reports `1 Git operation(s) unresolved` then the retained-Land warning (extends the moved case); `info: <commonDir>: <layout>; ...` assertion on compatible; `detail` row-shape case in `checks.test.mjs`.

Not covered by a test (named gaps, none new): `git-worktree-recovery` pending worktree operations as a failure; `repository-config` "addon lacks transport diagnostics" (needs an old addon).

## Verification (exact output lines)

One-file command (stages the addon), files from the phase plus `registrations.test.mjs` and `architecture.test.mjs`:

```
ℹ tests 214
ℹ pass 213
ℹ fail 0
ℹ skipped 1
```
No `run-tests: ERROR` line. Phase file list alone: 122 tests, 121 pass, 1 skipped. `checks.test.mjs` 52/52; `registrations.test.mjs` + `checks-doctor-config` + `dir-resolution` 137/137.

`rg "git-transport-config|git-trust-topology|git-durability-capability|terminal-config\b" src test` leaves three hits, all the core refusal code `terminal-config-below-floor`, not a row id. `herdr-deadlines.mjs:6` names `terminal-control`. `node scripts/git-one-door-scan.mjs`: 5 undeclared `unresolved-binary` sites, same five as before; census regenerated.

## Docs

Edited because a test pins them: `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (the "Today's registered checks" id list, and `git-transport-config` -> `git-repository-config` in its prose). CHANGELOG `[Unreleased]` line added (old -> new ids, `detail`, 4 calls).

For phase 9 (still name the old ids or the old row shape): `docs/platform/git/spec.md:599-605` (doctor table), `docs/platform/terminal-control/spec.md:141,195`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:282`, `docs/specs/distribution.md:77,349`, and the `detail` row shape in the registry contract.

## F-C6 follow-up (WORK's `createDoctorRun` is not on main; "If not" branch taken)

Wording for the board HARDEN row and the hand-off ledger (owner: HARDEN big lead; trigger: WORK merged; phase 17's close lists it open or done): "Doctor shares one `inspectGit` per run: after WORK lands `createDoctorRun`, make `checkGit(cwd, kind, loaderOptions, run)` read `run.once('git-inspect:<root>:<remote>', ...)` for the four rows and key the `origin` read separately, pass `run` from the Git row registrations in `src/setup/registrations.mjs`, and add a case that counts the native calls (4 now, 5 with a non-origin remote, target 1 plus the origin read)." I could not write the board row from this worktree.

## Other notes

- The census commit touches `packages/git/contracts/mutation-census.v1.json`, which the parallel `publication.rs` lead may also regenerate; whoever merges second re-runs `node scripts/git-one-door-scan.mjs --write-census`.
- OPC message (step 4) not sent from here; the big lead relays it (`git-checks.mjs` reads Git facts, `src/setup`).
- Doctor text output: the `detail` field is JSON-only; messages shortened as intended.

Status: DONE_WITH_CONCERNS
