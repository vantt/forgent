# Test governance phase 3: CLI and rust-host slow files

Branch `chore/test-governance-p3-cli`, rebased on origin/main `277e86669`. Three commits:
`test(rust-host): start fgctl cases from one shared init and restamped releases`,
`test(rust-host): stage one release for the release-tree file and run only the doctor row it proves`,
`test(skills): stop the stranger-pane sleep from holding the spawn pipe`. No product code touched.

## 1. Outcome

Seconds are `duration_ms` of the file run alone with `run-some.mjs`. Each before/after pair ran back to back
(the original file was copied next to the new one and run first), so both runs saw the same load.

| File | Alone before → after | Tests before → after | Change |
|---|---:|---:|---|
| `test/rust-host/fgctl-upgrade.test.mjs` | 178 s → 78 s | 18 → 19 | shared init, restamped candidates, plus one case moved in |
| `test/cli/fgos-merge.test.mjs` | 71 s (not changed) | 62 | not changed, see §5 |
| `test/rust-host/release-tree.test.mjs` | 63 s → 13 s | 4 → 4 | one staged tree, one doctor row |
| `test/cli/fgos-return.test.mjs` | 187 s under load ~20 (not changed) | 58 | not changed: no use-case seam, see §5 |
| `test/rust-host/fgctl-init-download-sources.test.mjs` | 40 s → 36 s | 5 → 5 (4 run, 1 Windows-only) | shared init for 2 cases |
| `test/rust-host/fgctl-init.test.mjs` | 40 s (not changed) | 8 | not changed, see §5 |
| `test/rust-host/fgctl-init-download.test.mjs` | 36 s → 32 s | 8 → 7 | one case moved to fgctl-upgrade |
| `test/skills/terminal-pane-ownership.test.mjs` | 61 s → 0.7 s | 4 → 4 | pipe-holding sleep fixed |

Where the time went:

- **fgctl-upgrade.** 15 of 18 cases ran a full `fgctl init --from A` (runtime tail with doctor, ~5-10 s each) only to reach
  their starting point. Four candidate releases were full `buildRustDistribution` runs (~8-12 s each) that differ
  from A only in the manifest (`releaseVersion`, `stateSchemas`).
- **release-tree.** Three identical release builds, plus the staged `fgos doctor --dir <checkout>`, which takes
  35-90 s. One row, `enduser-docs-index-stale`, takes 35 s of that on this checkout (measured row by row). The case reads only the
  `convention-conformance` row.
- **terminal-pane-ownership.** `spawnSync('bash', ['-c', 'sleep 30 & echo $!'])`: the background sleep held the stdout
  pipe, so each call to `strangerPid` took 30 s. Two calls, 60 s.
- **fgctl-init family.** Almost every case is itself a successful `fgctl init` under a different precondition, so the
  tail is the behaviour under test.

## 2. What moved where

| Case | Was | Now |
|---|---|---|
| 12 fgctl-upgrade cases that start from a workspace at A | own `fgctl init --from A` | `useInitializedWorkspace` in `test/rust-host/fgctl-init-fixture.mjs`: one real init per file, whose proj/state (and optional HOME) copy goes back to the same absolute paths before each case. Cases in a file run one after another. |
| Release B; the bad-write, bad-read, bad-preflight and failing-tail candidates | full builds, or a hand copy-and-redigest repeated in three places | `restampRelease()` / `releaseWithFailingDoctor()` in fgctl-upgrade: A's tree with an edited manifest and `computeArtifactDigest`. A itself is still a real build with an explicit version and state schemas, so the build options keep their only exercise. |
| The two stateSchemas write/read cases | two copies of one body | one `for` loop with the same two titles |
| `download: a local install writes a digest-only pin (a manifest version is not a download tag)` | fgctl-init-download, own init of a release with **no** manifest version | fgctl-upgrade, same title, on the shared install of A (manifest version `0.1.0`). Born in fix `4a1cb41ac` (the manifest version leaked into the pin). The old fixture could not show that leak, because its release had no version. The new one can, and it asserts that precondition. |
| download-sources `committed pin beats "latest"` (first init), `writes the sh and cmd launchers` | own init each | shared init (`ownHome: true`) |
| download in fgctl-upgrade, step 1 | download-init of project A | shared workspace at A. Download-init from a tag is owned by fgctl-init-download `FGCTL_VERSION installs that exact tag`. The checksum refusal, upgrade download, pin tag and teammate steps are unchanged. |
| holder-lock gate in fgctl-upgrade | own init | shared workspace; its TMPDIR, leaky-git PATH and holder scan are unchanged |
| release-tree: deps, R1&R2, R3 | three builds | one build in `before()`, under the unusable inherited `FGOS_HOST_BIN` R1&R2 requires |
| release-tree R1&R2 staged-doctor convention row (born in fix `9e15107a5`) | whole staged `fgos doctor --dir <checkout>` | a child process imports the staged payload's own `src/setup/checks.mjs`, picks `convention-conformance` and runs its `check`, exactly as the doctor loop does, with `FGOS_HOST_BIN` set to the staged host. All assertions are kept. Mutation check: deleting the staged `convention.rules.v1.json` turns the row into `convention check skipped: cutoff cannot be inspected: ENOENT`, which `doesNotMatch(/skipped\|ENOENT/)` refuses. The staged `bin/fgos` door itself is driven by R3 (80+ routes) and by every fgctl tail. |
| `test/rust-host/harness.mjs` | crashed with an unhandled EPIPE when a command exited before reading its stdin (seen in 2 of 3 runs of R3 today, the "R3 under load" flake) | ignores only EPIPE on the child's stdin; the exit and output are still compared |

No test was retired. `git log -S` on every moved title: the regression witnesses (`4a1cb41ac`, `9e15107a5`,
`3ac50db7d`/`8527120a5` for the Reviewer and Red-team cases) all keep their case and assertions.

## 3. Gates

Before is the controller's shared gate on clean origin/main `406a81f98`. After is this branch rebased on
`406a81f98` for npm. Main then moved to `277e86669`, which changes only Rust tests, the mutation census and plans. The
branch was rebased onto it, and cargo and the coverage map ran there.

- npm before: `suite: 582 files, 8078 test() calls, 530 s wall (baseline 581 / 8084 / 202 s at 21a4fdc29)`;
  8724 tests, 2 fail (a Land admission budget case, concurrent createSession), both outside this lane.
- npm after: `suite: 582 files, 8077 test() calls, 562 s wall (baseline 581 / 8084 / 202 s at 21a4fdc29)`,
  `suite: this change against 406a81f98: +3 -4 test() calls, 0 new CLI/host spawn site(s), 0 without a reason`.
  8724 tests, 3 fail, none in a touched file. Each file passed on a rerun alone: `test/runner/loop.test.mjs` 104/0
  ("real concurrency", a known flake), `test/scripts/run-test-canary.test.mjs` 24/0 (wrapper-overhead median under
  load), `test/holder-lock/fences-stop-check.test.mjs` 8/0 (60 s cutover case under load). Suite wall times were taken
  on a machine shared with other suites and do not compare.
- cargo before: 1243 passed, 0 failed. cargo after: 1243 passed, 0 failed.
- `--cli-cost`: not required. No new CLI/host/fgctl spawn site (the suite line says 0), and nothing that every CLI
  call loads was changed. The one new child process (release-tree's doctor row) carries a `// boundary:` reason.

## 4. Coverage

Before: the controller's `cov-p3base.json` (clean `406a81f98`). After: this branch on `277e86669` (copied to `scratchpad/p3-cli/cov-after.json`; the `plans/260922-…` dir was deleted). `cov-compare.mjs`: 332 sources before, 332 after, `lostLastCoveringTest: []`, 0 sources with fewer covering files.

## 5. Files not improved, and why

- **`test/cli/fgos-merge.test.mjs`** has use-case seams (`src/verbs/merge/{merge,review,sync-root,promote-to-component}.mjs`).
  The cost is in the use case itself, though. A probe of the sync-root happy path, run 2× through the CLI and 2×
  through `syncRootUseCase` directly: fixture 12-18 ms, setup 300-400 ms (one CLI `take`, ~215 ms), verb through the
  CLI 1051-1114 ms, verb direct 881-946 ms. Moving a case saves about 0.2-0.4 s of ~1.4 s. Across the file that is
  roughly 15-25% (71 s → ~55 s), and it would mean rewriting ~45 cases plus an in-process replacement for the
  CLI `take`/`move` fixture steps in a shared harness other files use. I decided not to make that trade inside this
  batch. If the owner wants it anyway, the seams are there; the likely next cost is the real Land/verify work per case.
- **`test/cli/fgos-return.test.mjs`**: `return` is implemented inline in `bin/fgos.mjs` (`case 'return'`, ~300
  lines); there is no use-case function to call. By the plan's rule that stops the file. The cases cost about 3-4 s
  each under load, spread evenly (take, commit, return with a real verify, worktree for branch-source); no fixed
  sleep or polling was found.
- **`test/rust-host/fgctl-init.test.mjs`**: every case except two refusals is a full successful `fgctl init` under its
  own precondition (v1 lock file, tombstone, a released kernel holder, 24 concurrent inits, pin reconcile), so the
  tail is the behaviour under test. Merging preconditions into one init would make one test prove several
  behaviours; I did not. It benefits from the shared-fixture helper only if a later case starts from an existing workspace.
- **fgctl-init-download(-sources)**: gained only one init each (~4 s); the other cases are inits from different sources.

## 6. Ideas, not done (RUL104)

- Run cases inside an fgctl file concurrently (`node:test` `concurrency`). The cases already use separate dirs, except
  the restored shared workspace, which would need one per concurrent case. This would shorten the suite tail (H2's concern)
  without less CPU. Benefit: shorter wall for the files that end the suite. Needs the owner's choice because it changes how
  the suite schedules load.
- A doctor row selector (`fgos doctor --check <id>`) would let release-tree keep the real `bin/fgos` door for its one
  row. That is a product feature, so it is out of this lane.

## 7. Unresolved questions

- fgos-merge: accept the decision in §5, or move its business cases anyway for ~15-25%?
