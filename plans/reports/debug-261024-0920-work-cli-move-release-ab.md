# Work CLI `move` with release-built addons: A/B and what remains

2026-10-24 09:20-09:35 (Asia/Saigon). Read-only measurement. Branch `work/es-cutover` tip `8d9fab669` vs `origin/main` `34a4d328e` (fetched 09:17; main moved from `00c02b2b9` seen at 08:48). Scratch worktrees, target dirs and ext4 fixtures removed afterwards; no process left.

## Sides and proof each loads its own release addon

| | A = origin/main `34a4d328e` | B = work/es-cutover `8d9fab669` |
|---|---|---|
| build | `cargo build --release --locked -p fgos -p fgos-node-addon`, own `CARGO_TARGET_DIR` (28 s each) | same, own target dir |
| addon sha256 / size | `4d95cfab3fb9222b...f3b4` / 12,208,832 B | `cde2fac48b66873c...f68` / 12,368,888 B |
| host sha256 | `3ed5e6082ce0c4438ea1...` | `d94e0e863a07de4a2a93...` |
| addon seen loaded (spy `dlopen`, strace `openat`) | `.fgos/runtime/diag-host/release/fgos.node` | `.fgos/runtime/git-addon/<hash>/fgos.node` (release bytes copied in) |

Each run re-hashes the addon named by `FGOS_ACTIVE_MANIFEST_PATH` and aborts on mismatch (`identity.txt` per run). Run mode: `node bin/fgos.mjs move` with the staged release host env (the same way as the earlier waves), ext4 fixtures, 1 warm + 5 moves per run, A,B,A,B order, session ids unset.

Trap found and removed: B's harness (`test/helpers/work-store-release.mjs` -> `ensureGitAddon`) builds and stages a DEBUG addon (107 MB) and overwrites the host env on import. My first B pass at 09:20 therefore ran the debug addon (print ~410 ms); discarded. Fix: pre-populate the harness staging dir (`.fgos/runtime/git-addon/<hash>/`) with the release files so its fast path reuses them. All numbers below are the second pass.

## Result (median, ms)

| set | side | until result prints | until CLI exits | until seal child gone (probe incl. ~85) | n |
|---|---|---|---|---|---|
| 09:22, load 1.0-1.3 | A | 141 (131-152) | 148 | 148 (inline) | 10 |
| | B | 215 (198-238) | 225 | 670 (658-706) | 10 |
| 09:27-09:32, load 0.4-1.0 (same binaries, 8 runs per side) | A | 148 (137-182) | 154 | 154 | 40 |
| | B | 302 (231-390) | 322 | 768 (712-864) | 40 |

Ratio B/A until print: 1.5x (09:22), 2.0x (later). Debug addon (wave 7): A 230, B 435. Per-run medians were stable inside a set (09:22: A 142/140, B 204/216; later B 293-309). Between the sets the machine changed state: every repo-touching git child (all run through `bwrap`) went from about 4 ms to 15-20 ms, for A and B alike (strace, bwrap exec to exit; repo-less `git var`/`config` stay 4.4 ms). Cause not established (below). A has one repo-touching git, B has seven, so B pays most of it.

Counts (strace, per move, median):

| | git children | fsyncs | other |
|---|---|---|---|
| A CLI | 5 | 0 | 1 `bwrap /bin/true` probe |
| B CLI (to exit) | 11 (15 on the first move of a fixture) | 4 | 1 probe |
| B seal child | 32 | 65 | 1 probe |

Same as the debug run. The child's 65 fsyncs cost 4-5.7 ms each (first 13 ms) = about 340 ms of its ~450 ms; the child is off the print path.

## B CLI split, up to exit (spy marks at the native-call boundary, strace for git/fsync/lock evidence, `--cpu-prof` for JS)

Medians, ms. "quiet" = 09:22 (n=3), "later" = 09:30 (n=20). A column only where A has the phase.

| # | phase | A quiet / later | B quiet / later | git | fsync |
|---|---|---|---|---|---|
| 1 | node exec to JS origin | 2.9 / 3.2 | 2.6 / 9.2 | | |
| 2 | module load (305 vs 310 `.mjs`, cpu 84 vs 94) + host resolution + addon verify + dlopen, origin to dlopen end | 105.9 / 114.2 | 112.7 / 121.1 | | |
|  2a | of which addon verification: read 12 MB + sha256 (`loadNativeAddon` cpu) | ~10 | ~12 | | |
| 3 | git facts (`GitInspect` x2: `var`x2, `config`x2, `rev-parse --show-object-format`) | 23.9 / 31.1 | 20.5 / 24.9 | 5 | 0 |
| 4 | store resolve + open (config read, `resolveEventStore`, `openStore`) | - | 2.1 / 2.9 | 0 | 0 |
| 5 | start trigger `maintenance` + `sealIfDue` | - | 14.9 / 15.8 | 0 | 0 |
| 6 | JS gap into the gate (sessions/config reads, state tx setup) | - | 4.8 / 10.7 | | |
| 7 | `admitWrites` (symbolic-ref, rev-parse HEAD, for-each-ref, cat-file --batch) | - | 13.6 / 47.3 | 4 | 0 |
| 8 | `read` catch-up (for-each-ref, cat-file --batch; checkpoint reused) | - | 7.6 / 30.0 | 2 | 0 |
| 9 | JS gaps: fold, hot-lock tmp write | - | 3.3 / 9.0 | | |
| 10 | `append` (gate + append + fsync) | - | 26.5 / 29.3 | 0 | 4 |
| 11 | persist state.json (tmp + rename), build answer | - | 1.8 / 4.8 | | 0 |
| | **result prints** (harness clock) | 141 / 148 | 215 / 302 | | |
| 12 | spawn seal child (`spawn`) | - | 2.3 / 6.6 | | |
| 13 | end trigger + exit to process gone | 11.2 / 7.7 | 7.9 / 14.6 | | |

B minus A until print, quiet: 74 ms = gate 29 (rows 6-9) + start trigger and store open 17 + append and persist 28 + module load 7 - git facts 3 - answer build 4. Later: 154 ms = gate 97 + 19 + 34 + 7 - 6.

Evidence for rows 5 and 10: every acquisition of the append lock ends in `settle_release` (`packages/holder-lock/rust/src/driver/flock.rs:352`), which reads `/proc/locks` to EOF. The first read after a quiet moment costs the kernel 6-18 ms (a stand-alone loop with 150 ms gaps: 5.8 ms typical, up to 12; strace `-T` on the CLI: 18.2 ms at start, 9.7 ms at append, the other reads 0.1-0.2 ms). The CLI takes the lock 5 times and reads the table 5 times; two cold reads are on the print path (start trigger, append), a third and fourth run after the answer. The start trigger does no git and no fsync, so its 15 ms is that read plus 1 ms. `append` = 13.4 + 0.02 + 5.3 + 0.02 ms of fsync (`events/` dir, `project/` dir, `active.jsonl`, `project/` dir again) + about 8 ms cold read.

## Remaining B items: owner class, idea, expected saving (print path unless noted)

| item | ms (quiet / later) | class | one concrete idea | expected |
|---|---|---|---|---|
| Gate git children: 6 repo-touching `bwrap git` calls (admit 4 + read 2). `read`'s ref listing and object read repeat `admitWrites`'s | 21 / 77 (29 / 97 with gaps) | Git lane (driver/refs; Event Store is the caller) | one ref snapshot per command shared by admit and read; read `HEAD` and the loose ref natively instead of `symbolic-ref` + `rev-parse` | -4 git: -15 / -60 |
| Cold `/proc/locks` read in lock-release settlement, twice on the print path | ~22 / ~22 (+ ~10 after print) | Git lane (holder-lock flock driver `settle_release`) | take the private shared-lock probe first; a successful probe already proves the description is gone, read the table only when it fails | -20 |
| Start trigger on a CLI Work command: opens the lock and lists/headers open streams although the command hands its seal to a child that certifies everything open | 17 / 19 | owner WORK store (consumer lifecycle policy in `src/event-store/maintenance.mjs`, call in `bin/fgos.mjs`) | skip the start trigger for a command that hands a seal to the child (the child, or `doctor event-store-unsealed`, covers a tail a killed child left) | -15 |
| Append fsyncs: 4 per event | 19 / 19 | owner Event Store (inherent for `active.jsonl`, 5 ms) | skip the two directory fsyncs when no entry was created (the 13 ms is a journal flush that moves to the file fsync) | -0 to -8, mostly inherent |
| Addon verification: read + sha256 of 12 MB in every process | 10-12 / 10-12 (A pays it too) | Git lane (`src/native/door.mjs`) | trust a `(dev, ino, size, mtime, ctime)` key recorded when the release is staged; hash only when the key differs | -10 both sides |
| Git facts: 5 git children per process (A too) | 20-24 / 25-31 | Git lane | one `rev-parse` call plus a native config read | -10 to -20 both sides (more in the later regime) |
| JS gaps and repeated config/manifest reads (`~/.fgos/config.json` x4, manifest x5) | 8 / 20 | owner WORK store | read the config once per command | -3 to -5 |
| Extra imports for the store (+5 files, +10 ms cpu) | 7 / 7 | inherent (move needs the store) | none worth the code | 0 |
| Process start + 305-module load (A too) | ~95 | inherent to the payload | Node compile cache for the payload; not tested here | untested |
| Seal child spawn + end trigger, after print | 10 / 21 | inherent | none | 0 |
| Seal child (off print path): 32 git, 65 fsync, about 450 ms | - | owner Event Store (seal) + Git lane (object writes) | batch the per-object fsyncs of one seal | off-path, -200 ms of child and of the loss window |

If the first three ideas land: B print 215 -> about 165 (quiet) and 302 -> about 207 (later) against A 141 / 148, leaving B 1.2x and 1.4x.

## Unresolved

1. Why a repo-touching sandboxed git costs 4 ms at 09:22 and 15-20 ms from 09:27 inside the CLI. Stand-alone replays of the same bwrap argv on a fixture repo: Python 2.5 ms, Node `spawnSync` 11 ms median (3.4 min). In the CLI the git spawns are plain `clone(SIGCHLD)` forks of the node process, the `bwrap /bin/true` probe is `clone3(CLONE_VM|CLONE_VFORK)`. Suspect: fork of the large node process under machine state (other lanes' sandboxes). Not proven. Test: spawn the git calls the way the probe does, and compare in one quiet and one busy window.
2. `sealMs` still contains about 85 ms of the harness's own receipt probe (as in the previous report).
3. The first-set raw rows file was overwritten by a later script run; the 09:22 figures above are copied from the run output before that (A print 136/144/131/142/142 and 144/136/140/139/152; B 238/204/198/203/217 and 235/214/199/216/228).

Scripts (scratch, not committed): `rel-*.sh`, `rel-measure*.mjs`, `rel-stage-harness.mjs`, `c2-spy.cjs`, `rel-phase.py` under the session scratchpad.

Status: DONE_WITH_CONCERNS
