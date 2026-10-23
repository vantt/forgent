# loop.test time attribution: work/es-cutover (9b5eae9dd) vs main (d72b33938), 2026-10-23 15:12-15:35 Asia/Saigon

Read-only diagnosis. No product code, test or commit touched. Scratch worktree `prof-main` and its cargo dir removed.
Note: origin/main moved to `d72b33938` (docs only) since the A/B at `2cab9c6f1`; irrelevant to runtime.

## Verdict

The ~270 s gap is **not** Node startup, addon load, legacy parsing, lock waits, sleeps, timeouts or a network sync. It is the Event Store native calls the branch makes and main does not, which are almost entirely **git child spawns (~11-13 ms each, bwrap-wrapped) plus fsync (~4-7 ms each, ext4/NVMe)** on the single test thread:

| Mechanism | share of gap | owner of fix |
|---|---|---|
| `EventStore.seal` on every sealOnWrite move: 3 per case | ~47% | owner rule (M3, §16) first; then Git lane (publication, object writes) and WORK store (verify walk) |
| `EventStore.read`: 23 per case, 4.8 git spawns each | ~42% | Git lane (`resolve_head`, driver.rs) and WORK store (read.rs legacy view, memo) |
| `EventStore.append` fsyncs: 6 per case, 4.7 fsync each | ~7% | WORK store (`packages/event-store` fsio) |
| `admitWrites` (1.25 git each), `sealIfDue`, JS fold | ~4% | WORK store, low value |

No bug found (no waited-out timeout, no retry loop, no sync/push/fetch). One item is bug-adjacent waste: 3 spawns per read to observe HEAD for a legacy view that is empty (details in M2).

## Method and load caveat

- Same fixture, same `node --test-name-pattern=<case> test/runner/loop.test.mjs`, both sides, release addon built per side (`CARGO_TARGET_DIR` on ext4). Env vars CLAUDE_CODE_SESSION_ID/CODEX_THREAD_ID/FGOS_SESSION_ID unset.
- Cases: `announce line` (1 item), `runOnce full circle` (1 item, full status path), `bounded drain-run` (3 items, several moves).
- Instruments: wall per case; `strace -f -ttt -T` on execve/exit/clone/fsync/nanosleep/flock; `strace -c -w`; `--cpu-prof`; a preload spy that times every native addon call (`diag-native-spy.cjs`); spy and strace joined on one clock to attribute each git exec and fsync to the addon call that made it.
- **Load was not clean.** 1-min load was 3.0-3.8 in the timing runs, 5-7 in the first strace runs, and 20-28 for ~8 min while another session ran (those runs discarded; one profile triple at load 23-28 only kept for ratios). Other agents' bwrap/git load inflates both sides 1.5-2x and made the same case swing 2.3-4.4 s on main. Treat seconds as +-40%. Ratios and counts are stable.
- The test is **in-process**: it calls the Rust addon directly. There is no per-move `fgos` CLI. Per case there are only 2 Node CLI children (`settle-attempt` 0.4/0.58 s, `finalize-home` 0.2/0.19 s, main/branch, under strace) and 5 Rust host processes (`seat-binding bind` x3 ~10 ms, `supervise` 0.8/1.0 s, `gate`). Branch minus main there is ~0.2 s under strace, ~0.1 s real. Node process count is 13 on both sides.

## Wall time (unstraced, low load, two runs each)

| case | main | branch | B/A |
|---|---|---|---|
| announce | 3.0, 3.3 s | 6.0, 4.5 s | 1.4-2.0 |
| full circle | 3.5, 3.0 s | 6.2, 7.2 s | 1.8-2.4 |
| drain (3 items) | 7.3, 7.9 s | 11.7, 16.8 s | 1.6-2.1 |

Earlier quieter runs: announce 2.3 vs 6.9 s, circle 2.3 vs 4.4 s, drain 7.2 vs 16.7 s. Whole-file A/B was 1.9, consistent.
CPU (`/usr/bin/time`, announce): main user 1.2-1.4 s + sys 1.9-2.4 s; branch user 1.7-2.2 s + sys 3.6-4.7 s. The branch adds mostly **sys** time (process creation, bwrap namespaces), which is why it degrades so much under host load.

## Where the extra time sits (spy, unstraced, circle case, load ~3.3)

Total native time in the test thread: main 1.16 s, branch 4.19 s, so +3.03 s; the wall gap in the same pair was 2.4 vs 5.6 s. Every non-Event-Store native call is the same on both sides (GitInspect 53 vs 51 calls, GitWorktree 3 vs 3, GitScopedCommit 3 vs 3).

| native call (branch only) | n | time | git spawns | fsync |
|---|---|---|---|---|
| `EventStore.seal` | 3 | 1.24 s (414 ms each) | 87 (29 each) | 80 (0.34 s) |
| `EventStore.read` | 23 | 1.20 s (52 ms each) | 111 (4.8 each) | 6 |
| `EventStore.append` | 6 | 0.20 s | 0 | 28 (0.13 s) |
| `EventStore.admitWrites` | 8 | 0.05 s | 10 | 0 |
| `EventStore.sealIfDue` | 5 | 0.035 s | 0 | 0 |
| sum | | 2.7 s | 208 | 114 |

Joined strace+spy run (execve and fsync attributed to the call interval): seal 1.52 s / 87 git / 80 fsync; read 1.33 s / 111 git; append 0.25 s / 28 fsync; admitWrites 0.11 s / 10 git. Same-call cost per git spawn is 11-13 ms on both sides.
Branch minus main git execs, announce case: 393 vs 186 (+207), matching 208 above. Biggest deltas: `symbolic-ref --quiet` +48, `for-each-ref` list +25, `for-each-ref` single-ref read +24, `rev-parse --verify --quiet` +24, `cat-file --batch*` +35, `hash-object -w` +12, `rev-list` +13, `show-ref --exists` +9, `update-ref` +9. No `fetch`, `push`, `ls-remote` beyond the one fixture fetch present on both sides; `EventStore.sync` is never called.

Drain case (3 items), same method, noisy load: seal 9 calls 4.8 s, read 54 calls 4.2 s, append 18 calls 0.58 s, admit+sealIfDue 0.26 s, so +9.8 s in-addon against a +10 s wall gap. Mix is the same as in the single-item case.
Extrapolation to the 271 s whole-file gap, assuming the same mix: seal ~125 s, read ~115 s, append ~19 s, rest ~12 s. Not measured on the full file.

## Eliminated

- Node startup / addon load: same 13 Node processes; spy shows `openStore` ~1 ms, `versions` ~0.6 ms.
- Legacy parsing: `legacy_view` is memoized per commit; the cost is the HEAD observation, not parsing (M2).
- Lock waits: `flock` 534 calls, <=6 ms total on both sides.
- Sleeps/timeouts: `clock_nanosleep` 12-22 calls, <=20 ms each, 0.17-0.25 s total, same on both sides. The git wait loop is `poll(pidfd, 10 ms)`; it returns at child exit (1 ms after), so it never waits out the tick.
- Retry loops: append 6, seal 3 = the mutation count; no `catch-up-required` signature (no extra readInGate/read pairs).
- Network sync/fetch/push on commands: none (call list and exec list above).
- fsync by git children: none (`core.fsync` default); all fsyncs are the in-process addon thread's.
- Pure Rust CPU in seal/read is not separately measured (perf is blocked, paranoid=4). Read spawn share: 4.8 spawns x ~5.6 ms (main-side per-spawn cost) = 27 ms of a 52 ms read, so up to half of a read may be Rust-side CPU/IO. See open questions.

## Ranked mechanisms, fixes, expected savings (per single-item case, gap ~3 s)

### M1. Seal on every status move: ~1.3-1.5 s (47%); 3 seals x ~29 git + ~27 fsync
Per seal (user's breakdown, scaled): publication ceremony 15 git (~190 ms), verify walk after publish 7 git (~90 ms), object writes 4 git (~50 ms), other ~3 git, fsync ~110 ms.
- **Owner rule (M3, spec §16):** the runner is a long-lived process whose poll loop already seals what is due (`runWatch` seals on every poll and on stop; test at `loop.test.mjs:1891`) and the append is already fsync-durable. Sealing right after each gate release inside one `runOnce` is the only reason for 3 seals/item. Option: let runner-originated moves (`role: runner`) coalesce into one seal at the end of the dispatch (or leave to `sealIfDue`). Saves 2 of 3 seals = ~0.9-1.0 s per case (~30% of the gap). Loss budget changes (unsealed window grows from one gate to one dispatch); needs an owner decision under the decision-question template. Interactive CLI moves keep immediate seal.
- **Git lane, after HARDEN T2 releases `publication.rs`/`driver.rs`:** the ceremony is 15 spawns for 2 ref updates (candidate pin, CAS, release); object writes are 4 separate `hash-object -w --stdin` spawns (one `hash-object --stdin-paths` or one persistent `cat-file --batch`/`fast-import` process would do). Target: 29 -> ~15 spawns per seal, ~0.15 s per seal, ~0.45 s per case. This is T2 territory; do not start before the owner of T2 agrees.
- **WORK store (`packages/event-store/rust`, walk.rs/publish.rs):** the post-publish verification walk (7 git: `rev-list` x~4, `cat-file --batch*`) re-reads what the seal just wrote; skipping or bounding it on the opportunistic path saves ~90 ms per seal (~0.27 s per case). Needs a safety judgment by the store owner.

### M2. Reads re-spawn git: ~1.2-1.3 s (42%); 23 reads x (1 `list_refs` + 3 `resolve_head` + 0.8 other)
Only 6 of the 23 reads belong to a mutation (`withConsumerState.readState`); 17 are read-only queries (`listWork`, `readyWork`, `currentView`).
- `resolve_head` = `symbolic-ref`, `rev-parse --verify`, `symbolic-ref` again (race check), called by `legacy_view` at `packages/event-store/rust/src/read.rs:382` on every read ("HEAD is observed anew on every call"), after `fence::authority` -> `resolve_repo`. On a store with no legacy history this buys nothing. That is 69 of the 111 read spawns.
  - **Git lane** (`resolve_head` is in `packages/git/rust/src/driver.rs:2086`, HARDEN T2's file): observe HEAD in-process (read `HEAD` and the ref file/packed-refs, double-read for the race check) with zero spawns; or one spawn instead of three. Saves ~0.75 s per case (~25% of the gap), ~35 ms per read.
  - **WORK store** alternative that does not touch driver.rs: in `read.rs`, skip the HEAD observation when the refs listing shows `refs/fgos/legacy` already pinned/absent and the repo's legacy import is settled, or memoize `legacy_view` by a stat fingerprint of `HEAD` plus its target ref file. Same saving, but must keep the "HEAD moved to a commit with tracked legacy files" case correct; store owner to confirm.
- **WORK store:** a read that finds nothing changed still spawns `for-each-ref` (1) plus the head observation. A stat-based refs fingerprint (`packed-refs` mtime/size, `refs/fgos` dir mtimes) checked in-process before spawning would collapse the 17 query reads to ~0 spawns; saves up to ~0.4-0.5 s per case more. Riskier (stale-view correctness across processes); needs the store's cursor/CAS story reviewed.
- **Work consumer code (`src/state`, `src/event-store`):** reduce redundant query reads within one `runOnce` (memo exists, keyed by query since the last commit). Check whether the 17 query reads can be served from the view `withConsumerState` already folded. Saves part of ~0.4 s.

### M3. Append fsync count: ~0.2-0.25 s (7%); 28 fsync / 6 appends = 4.7 per append
Directories fsynced under `.git/fgos/events/project` (25 + 13 + 9 + 7 per case: file, `active.jsonl`, `closed`, parent dirs). `packages/event-store/rust/src/fsio.rs` is the owner. An append that fsyncs the segment file once and its directory only on create/rotate would be ~2 per append: saves ~0.1 s per case. Durability argument must be kept (L7); low value, do last.

### Low: admitWrites 8 calls (10 git, ~0.05-0.1 s) and per-spawn overhead
`admitWrites` runs at every `withConsumerState`; cache the "no migration pending" answer per process when the refs listing is unchanged. Also each git spawn costs ~2 ms for bwrap over plain (node microbench: bwrap git 3.65 ms vs plain git 1.63 ms); not a branch-specific cost, so not ranked.

## Bug vs cost

No bug: no timeout waited out, no retry loop, no per-command sync attempt, no blocked lock. The closest item is M2's 3-spawn HEAD observation on every read for a legacy view that is empty on migrated stores; it is waste by design (recorded intent: "observed anew on every call"), not a defect. Event Store call counts equal the number of mutations and reads the Work code issues.

## Open questions

- Rust-side CPU/IO inside `read`/`seal` (JSON, sha256, chain verify, checkpoint file) is unseparated from spawn time; read per-spawn cost in the store (~10.8 ms) is about 2x the same primitive on main's `GitInspect` (~5.6 ms) in the spy run. Could be real Rust work or load noise. A Rust-level timer in `read`/`seal` (or `perf` once `perf_event_paranoid` allows) would settle it before anyone commits to M2/M1 savings estimates.
- Measured on one machine (fg-server2, ext4 NVMe, fsync ~4-7 ms). Another disk changes the fsync share (M1 fsync, M3); the spawn share is CPU/sys bound and scales with host load.
- Whole-file split is extrapolated, not measured; the file was not run under spy.
- Interaction with the owner's seal rule and HARDEN T2 ownership of `driver.rs`/`publication.rs` needs a decision on sequencing; this report does not assume the answer.

## Artifacts (scratchpad, not committed)

`/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/`: `p-prof.mjs`, `p-spy.mjs`, `p-comb.mjs`, `p-attr.py` (spy+strace join), `p-git2.py` (git subcommand delta), `p-fcat.py` (fsync by path), `spy-*`, `comb-*`, `pq-*.trace`.
