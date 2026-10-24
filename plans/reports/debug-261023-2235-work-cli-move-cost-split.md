# Work CLI `move` cost split: Work cutover (B) vs main (A)

2026-10-23 (Asia/Saigon). Read-only; nothing committed. Scratch worktree `prof2-main` and its target dir removed.

## Sides and method
- B = work-es `9d30618d4` (`origin/work/es-cutover`), CARGO_TARGET_DIR `work-es-target`.
- A = detached `origin/main` `c9bc0623b` (includes T2), target `prof2-main-target`. Both warmed with `test/cli/fgos-read.test.mjs` (6/6).
- Driver: scratchpad `c1-prof.test.mjs` through `fr.mjs` (the CLI harness fixture `initGitCwd` + `addOk`, one warm move, then 5 alternating `move --to blocked|todo`, each its own `node bin/fgos.mjs` process, the same env as `h.run`). Modes: plain, `--require c1-spy.cjs` (hrtime marks: process origin, dlopen, every native addon call, exit), strace, cpu-prof. CLAUDE_CODE_SESSION_ID, CODEX_THREAD_ID unset (fr.sh); FGOS_SESSION_ID pinned like the harness.
- **Timing samples taken 22:22-22:41 (another lane at load up to 11) are discarded.** All ms below come from the quiet re-measure 22:42:44-22:46 (1-min load 1.0-2.8, recorded per run below). Counts of git children and fsyncs are load independent; re-checked in the quiet strace run: identical (B 49 git / 69 fsync, A 5 git / 0).
- Medians. tmpfs = the harness default (`/tmp` is tmpfs). Logs: scratchpad `c1-final.log`, `c1-pin.out`, `c1-out/`.

Load per measurement (1-min at start): spy A/B 2.84/2.69, 2.55/2.51, 2.47/2.35 (3 reps x 5 moves = 15 per side), plain A/B 2.24/2.22, ext4 spy A/B 2.12/2.03, strace A/B 1.95/1.87, cpuprof 1.74/1.74, pinned/free B pairs 1.05-1.30, A pinned 1.14-1.15.

## Headline (quiet machine)
| measure | A (main) | B (cutover) | B - A |
|---|---|---|---|
| wall per move, spy, tmpfs (15 moves) | 263 ms | 925 ms (886-978) | +662 |
| wall per move, plain (5 moves, load 2.2) | 250 ms | 944 ms | +694 |
| wall per move, spy, ext4 TMPDIR (5, load 2.0-2.1) | 245 ms | 1160 ms | +915 |
| wall per move, whole process pinned to one CPU (`taskset -c 5`, load 1.1) | 226 ms | 380 ms | +154 |
| git children / fsync | 5 / 0 | 49 / 69 | +44 / +69 |

This reproduces the earlier 237 vs 880 (A/B). Two facts change how to read it:
1. **Most of B's time is scheduling latency, not work.** Pinned to one CPU, B drops from 925-940 to 380 ms (three pairs: 860-973 free vs 365-396 pinned); A does not move (250 vs 226). B is a strictly serial chain of 49 `bwrap`+`git` spawns (strace3: fork, bwrap exec, namespace clone, git exec, exit, one after another, no overlap), and on an idle host each hop pays a core wake-up. Per git child: about 3.4 ms pinned, 11-19 ms free on the quiet host. During the other lane's load (cores kept warm) B ran 400-470 ms, which is why the number moves between 400 and 940 ms at the same code; those samples are discarded and only used here as the explanation of the swing. The owner's real number therefore depends on host idleness; counts are the stable currency.
2. **fsync is free on tmpfs, not on disk.** B does 69 fsyncs per move (46 by the addon thread, 23 inside git children: `hash-object -w` tmp object + dirs, `update-ref` locks). On ext4 B is +235 ms over tmpfs (925 -> 1160; seal alone 299 -> about 480 ms). The CLI-harness fixtures hide this.

Both sides run the **debug** addon (the harness stages `target/debug/libfgos_node_addon.so`, 105-107 MB). That inflates the fixed part common to A and B (see phase 2) and any Rust-side CPU in B; release addon is 12 MB.

## Phase table, A (main), per move, quiet, tmpfs
| # | phase | wall ms | git children | fsync |
|---|---|---|---|---|
| 1 | process spawn + Node boot + ESM module load + `main` start (no Rust host exec; no Node children) | 2.7 + about 105 (cpu-prof: `main()` starts at +105 of 247) | 0 | 0 |
| 1b | `main` JS up to first native call | about 70 (rest of the 175 ms to first native; incl. phase 2) | 0 | 0 |
| 2 | addon load: `loadNativeAddon` sha256s the whole 105 MB debug file (73 ms, cpu-prof) + dlopen 0.8 + `versions` 0.4 | about 75 | 0 | 0 |
| 3 | store open + catch-up read | none (A has no Event Store native calls) | 0 | 0 |
| 4 | gate, append, fsync | JS only (events.jsonl append; within 16 ms of JS gaps) | 0 | 0 (tmpfs; A's append path has no counted fsync) |
| 5 | post gate | none | 0 | 0 |
| 6 | exit | last native to exit 4.8, exit to parent 6.1 | 0 | 0 |
| | native `GitInspect.call` x2 (repo facts: `var` x2, `config --null` x2, `rev-parse --show-object-format`) | 54 | 5 | 0 |
| | total | 263 (spy) / 250 (plain) | 5 | 0 |

## Phase table, B (cutover), per move, quiet, tmpfs
| # | phase | wall ms | git children (kinds) | fsync |
|---|---|---|---|---|
| 1 | spawn + Node boot + module load to first native | 10.7 + 181 (same as A within noise) | 0 | 0 |
| 2 | addon load (same digest cost as A, 76 ms cpu-prof; dlopen 0.9) | in the 181 | 0 | 0 |
| - | `GitInspect.call` x2 (identical to A) | 41 | 5 | 0 |
| 3a | `resolveEventStore` 0.3, `openStore` 0.4, first `maintenance` (dir listing + first-line reads) 12-16 | about 14 | 0 | 0 |
| 3b | `admitWrites` (legacy-migration admission: HEAD observe, refs list, tree inventory of 3 legacy roots) | 148 | 9 (symbolic-ref, rev-parse, for-each-ref, 3x `cat-file -t` + 3x `cat-file --batch-check`) | 0 |
| 3c | `read` (catch-up: refs list, walk of commits the previous process sealed) | 167 | 9 (for-each-ref, 2 rev-list, `cat-file --batch-check` x2, `cat-file --batch` x4) | 0 |
| 4 | `readInGate` 0.2, fold, `append` 14, cache persist (JS) | about 17 | 0 | 4 + 2 (cache) |
| 5 | `seal` (sealOnWrite, immediately after the gate): segment close/rotate dirs, publication ceremony, object writes, verification walk | 299 | 26 (7 for-each-ref, 4 hash-object -w, 3 update-ref, 1 show-ref, 1 rev-list --objects, 2 rev-list, 8 cat-file) | 63 (40 addon, 23 git children) |
| 5b | second `maintenance` 1, `sealIfDue` x2 1.3 (no sync attempt; none is due) | about 3 | 0 | 0 |
| 6 | exit | last native to exit 0.5, exit to parent 15 | 0 | 0 |
| | JS gaps between natives (locks, fold, persist) | 37 (A: 16) | | |
| | total | 925 (spy) / 944 (plain) | 49 | 69 |

Pinned to one CPU (load 1.1, 10 moves): wall 380, admit 31, read 32, append 11, seal 59, maintenance 9+, JS gaps 14, `GitInspect` 24, node to first native 187. So the same work costs about 3.4 ms per git child instead of 11-19.

No Node-side child process is spawned in either side (`execFileSync`/`spawnSync` count 0); no Rust host exec; no sync, fetch or push (`EventStore.sync` is never called; `sealIfDue` runs twice and is a no-op); no `FGOS_DEBUG` / `FGOS_TRACE` style timing env exists (grep found none; `withConsumerState` has an `onTiming` option that no production caller passes).

## Where B's extra time goes (free, quiet: +662 ms over A)
| item | extra ms | git | fsync | class | owner |
|---|---|---|---|---|---|
| seal: its own git ceremony + object writes + fsyncs | about 300 (tmpfs; about 480 on ext4) | 26 | 63 | split below | |
| - of which ceremony+object writes (for-each-ref x7, 4 hash-object, 3 update-ref, show-ref, rev-list --objects) and dir fsyncs | about 190 | 16 | 63 | **Inherent** to seal per command (spec §16), count reducible by the Git lane | Git lane (publication/driver), spec §16 for the policy |
| - of which post-publish verification walk (rev-list x2, cat-file x8) re-reads what the seal just wrote | about 110 | 10 | 0 | **Overhead**, durability unchanged (the CAS and the bytes check already prove the write) | WORK store (`seal.rs`, `walk.rs`) |
| admitWrites: 9 spawns to answer "is a legacy file tracked at HEAD?", re-asked every process (per-process memo only) | 148 | 9 | 0 | **Overhead** | WORK store (`legacy_import.rs`), Git lane for `resolve_head` |
| read: catch-up walk of the commit the previous process sealed (rev-list x2, cat-file x6) + refs list | 167 | 9 | 0 | **Overhead** (same commit was just verified by the previous seal; the checkpoint file does not cover it) | WORK store (`read.rs`, `checkpoint.rs`) |
| fsync work on a real disk (69, 23 of them inside git children) | 0 on tmpfs, about 235 on ext4 | | 69 | **Inherent** for 46 addon fsyncs at the current layout; 23 git-child fsyncs from git's own defaults | WORK store `fsio.rs`; Git lane for git config |
| first maintenance listing + open | 14 | 0 | 0 | **Overhead** (a directory listing on every command, plus a second call after the seal) | WORK store consumer (`maintenance.mjs`, `bin/fgos.mjs:5216`) |
| JS: gate fold, persist, locks | +21 | 0 | 6 | inherent | Work consumer |
| spawn chain latency (idle host), inside all rows above | about +510 of the 662 (free 925 vs pinned 380 less 150 work) | | | **Not work**: host effect on a serial spawn chain; falls with the count of spawns | Git lane (driver spawns) + owner rule |

Inherent vs overhead on pinned numbers (work only, +154 ms over A): seal about 59 (inherent about 40, verification walk about 19), admit 31 (overhead), read 32 (overhead), append+persist 11 (inherent), maintenance 9 (overhead), JS 6. So about 95 of 154 ms are overhead that cuts without changing durability; on the free quiet host those spawn counts are worth about 3x (11-19 ms each).

## Fix ideas and expected saving per move
Savings in two columns: pinned (work) and free quiet host (about 11-15 ms per avoided spawn; use the second for the owner's machine on an idle box; tmpfs, no disk).

| # | idea | spawns/fsync cut | save pinned | save free quiet | owner |
|---|---|---|---|---|---|
| 1 | Drop the post-publish verification walk on the opportunistic seal: after CAS the code already re-reads the ref and compares `events.jsonl` blob bytes (`seal.rs` "ref or published bytes differ"); keep the full walk for explicit `seal`/doctor. Store owner must confirm the safety argument. | -10 git | about 19 | about 110-140 | WORK store |
| 2 | Make admission O(1) spawn: one `ls-tree -r HEAD -- <3 roots>` replaces 6 `cat-file` probes; or skip the inventory when `refs/fgos/events/*` already exist and re-check only when HEAD moved (cache HEAD+answer in a stat-fingerprinted file). Must keep "events.jsonl re-appears at HEAD after an old-branch merge is refused". | -6 to -8 git | 20-25 | about 90-120 | WORK store (`legacy_import.rs`); HEAD observe is Git lane (`driver.rs resolve_head`: 2 spawns, could be one `rev-parse HEAD` plus `symbolic-ref` as one `git rev-parse --symbolic-full-name HEAD`) |
| 3 | Do not walk the commit the previous process just sealed: have the seal write the checkpoint (`EVENT_HISTORY`) so the next read continues from it (the read already reuses a matching checkpoint; make seal its writer when it certified new commits). | -5 to -7 git | 15-20 | about 70-100 | WORK store (`read.rs`, `checkpoint.rs`) |
| 4 | Fewer spawns inside the publication ceremony: 4 `hash-object -w --stdin` -> one `hash-object --stdin-paths` / one `fast-import`; 7 `for-each-ref` -> one listing reused across `recover_publications`, `read_ref`, CAS; merge pin/CAS/release `update-ref` into one `update-ref --stdin` transaction. | -8 to -10 git, about -15 git-child fsync | 25-30 | about 100-140 | Git lane (`publication.rs`, `driver.rs`); wait for T2 release owner |
| 5 | Spawn once and keep it: one persistent `cat-file --batch` for all object reads in a process instead of a fresh one per call (4 + 6 + 2 `--batch` spawns now). | -6 to -8 git | 18-25 | about 80-110 | Git lane |
| 6 | Spawn latency itself: bwrap per read-only git costs about 2 ms over plain git (earlier microbench 3.65 vs 1.63 ms) and the chain runs strictly serially; for the pure-read plumbing (`cat-file`, `rev-list`, `for-each-ref`, `symbolic-ref`) start children in parallel where independent (admit's 6 `cat-file`). Or in-process ref/HEAD reads (read `HEAD`, loose + packed refs with a double read) for the 3-4 spawns of pure ref lookups. | -4 to -6 | 12-18 | about 60-90 | Git lane |
| 7 | Skip the pre-gate `maintenance` listing when the command is about to seal anyway (the post-gate seal makes it redundant) and call it once. | 0 spawns | about 9 | about 14 | WORK store consumer / CLI (`bin/fgos.mjs`) |
| 8 | Owner rule: a CLI `move` seals at once (spec §16). Option: on an interactive CLI the append is already fsync-durable; seal only when the open batch is older than `seal.intervalSec` (as `sealIfDue` does) or at a session boundary, so the process pays admit + read + append only. Saves all of the seal: 26 git, 63 fsync. Changes the unsealed window from one command to the interval; needs the decision-question template. | -26 git, -63 fsync | about 59 | about 300 (tmpfs), about 480 (ext4) | **Owner rule** |
| 9 | Replace the 63 fsyncs of a seal at the addon: batch directory fsyncs (the same `.git/fgos/events/project` is fsynced 8 times, `.git/fgos/git/operations/<id>` 7 times, parent dirs repeatedly) to one per directory per seal. | about -25 fsync | 0 tmpfs | about 75 on ext4 | WORK store `fsio.rs` (durability argument L7 must hold) |

Items 1-3 together (WORK-store only, no Git-lane change, durability unchanged): -21 to -25 git children. Pinned that is about 55-65 ms of the 154; free quiet about 270-360 ms, taking B from about 925 to about 570-650 ms. Adding 4-5 (Git lane) reaches about 400-450 ms. Only item 8 brings B near A (about 500-600 ms free, about 320 pinned) because the seal is inherent while it runs per command.

## Elimination
- Not Node startup, module load or addon load: identical on both sides (175-181 ms to first native; both pay the 73 ms digest of the 105 MB debug addon; a release addon is 12 MB).
- Not a Rust host exec, not host resolution (no child at all before the first native call), not legacy parsing, not a network sync, no retry (append 1, seal 1, read 1, admit 1, readInGate 1 per move; no `catch-up-required` loop), no waited-out timeout (the child wait is a pidfd poll).
- Not load alone: the same code ran 380 ms pinned, 400-470 ms while another lane kept cores busy (discarded samples), 925 ms free on the quiet host.

## Notes and unresolved
- The 925 ms is for the harness path on tmpfs with a debug addon. A release addon lowers the Rust-side part (not measured separately: perf is blocked, paranoid=4; pinned spawn-bound calls leave at most a few ms per call as Rust CPU).
- Why a quiet host is 2.5x slower than a busy one (idle states / frequency ramp: governor powersave, intel_pstate active, EPP balance_performance, 24 cores) is inferred from the pinned experiment, not proven per core; a `cpupower`/C-state run would confirm. Needs a decision whether the 1.2x bar is judged on a pinned or a free run.
- Earlier report counted git children as never fsyncing; 23 of 69 fsyncs are inside git children (`hash-object -w` objects, `update-ref` locks), seen in the strace.
- Old samples (22:22-22:41) kept only as discarded evidence in `c1-old/`.

Status: DONE
