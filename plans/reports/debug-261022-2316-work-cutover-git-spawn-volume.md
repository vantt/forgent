# Debug: Work cutover git spawn volume

Branch `work/es-cutover` @ `9aac33a52` vs `origin/main` @ `bc3380c0d`. Diagnosis only, nothing fixed.

## Executive summary

- Root cause: every Work command (read or write) runs a **cold full verified read** of the sealed Event Store history in a fresh process. `walk_inner` issues **one `read_paths_at` per sealed commit**, and the Git driver's `read_paths_at` costs **2 git spawns** (`cat-file -t <rev>` then `cat-file --batch -Z`), each wrapped by bwrap (so 4 execs). Cost is linear in chain length: about `2 x commits + ~25` git processes per command.
- Main has zero cost here: Work on main reads `.fgos/events.jsonl` in-process, 5 git spawns per command (repo resolve only).
- Second cost: every `work.move`/`work.outcome`/`decision`/`gate-approve` seals inline (`EventStore.seal` ~1.0 s, 38 git spawns), and a due `sync` costs 0.05-0.85 s (about 38 spawns).
- The "~2 s `fgos list`" is NOT all branch cost: through the **debug** dev host, 3.8 s elapses before node is even exec'd, identically on main. Branch delta is the store read.
- The "one object probed 96x" is the checked-out HEAD commit (`main`), probed by the legacy-fence read (`pinned_at_head`) on every `read` (4x) and `openStore` (3x), summed over the ~25 store calls of that test. Not a per-event probe. The chain's own commits are each probed once per walk.

## Method

- Fixture: fresh repo, 200 Work items, 40 `work.move`, built in-process by each tree's `src/state/store.mjs` (branch chain: 40 sealed commits for read-only runs; grows to ~76 over the add/move runs). Same seeding and same verbs on both trees.
- Verbs run through the staged Rust host (`FGOS_HOST_BIN`, manifest as `fgos:dev` builds it) from each tree, both **release** and **debug** addon/host. Runs interleaved main/branch.
- Counts: `strace -f -e trace=execve` (git execs) plus a preload that wraps every native addon export and records start/end and JS caller. Each exec is attributed to the innermost native call whose time window contains it. Scripts are in the scratchpad (`diag-*.{sh,mjs,cjs}`), not committed.
- The machine was loaded (load average 4 to 35 from other lanes); the load average was ~29 during the release list/show runs. Counts are exact; use medians/min with that caveat.

## Table 1: per command, same fixture (release build)

| Verb | Tree | git execs | bwrap execs | Native Event Store calls (count / wall) | Median ms (min) |
|---|---|---|---|---|---|
| list | main | 5 | 6 | none (GitInspect.call 1) | 310 (259) at load 29; 174 at load 5 |
| list | branch | 113 | 114 | openStore 1/111, maintenance 2, sealIfDue 2, **read 1/~480-1100**, sync 1/62 | 1367 (1202) at load 29; 617 at load 5 |
| show | main | 5 | 6 | none | 311 (219); 180 |
| show | branch | 113 | 114 | same as list | 1573 (1128); 1106 |
| add | main | 5 | 6 | none | 183 (159) |
| add | branch | 173 | 153 | openStore 98ms, read 1133ms, readInGate, append 32ms, sealIfDue 3, **sync 849ms** | 1434 (925) |
| move | main | 5 | 6 | none | 188 (172) |
| move | branch | 197 | 177 | openStore 206ms, read 1961ms, append 33ms, **seal 1020ms**, sync 42ms | 1954 (1067) |

Branch git exec breakdown for `list` (113): cat-file -t 47, cat-file --batch 42, cat-file --batch-check 7, symbolic-ref 6, rev-parse 4, for-each-ref 2, rev-list 1, var 2, config 2. For `move` (197, chain ~64 to 76): cat-file -t 74, --batch 74, plus seal/sync work (for-each-ref 10, rev-list 5, hash-object 4, show-ref 3, update-ref 3, --batch-check 10).

Debug build (what `npm run fgos:dev` and the debug-built suite use), medians ms, min in brackets where noted:

| Verb | main | branch | git execs main / branch |
|---|---|---|---|
| list | 3992 (3893) | 5239 (5042) | 5 / 113 |
| show | 3952 (3873) | 4892 (4760) | 5 / 113 |
| add | 3978 | 6972 (5305) | 5 / 209 |
| move | 3922 | 7343 (6654) | 5 / 221 |

The ~3.9 s floor on main is the debug host: strace shows the host binary starts at t0 and node is exec'd at t0+3.79 s (artifact digest of the 121 MB debug host and 89 MB debug addon). It is present on main, so it is not a regression. Branch delta on debug is +1.0 to +3.4 s.

## Q2: where each extra spawn comes from

Attribution (`list`, branch, release): of 113 git execs, **95 are inside `EventStore.read`**, 13 inside `openStore`, 5 in `GitInspect.call` (`resolveRepo`, exists on main too).

1. **Sealed-chain walk, per commit (dominant, ~85 of 95).** `packages/event-store/rust/src/walk.rs:145` `port.read_paths_at(repo, &commit.oid, ["seal.json","events.jsonl"])` inside the per-commit loop of `walk_inner` (`walk.rs:92`). Git side `packages/git/rust/src/driver.rs:2378` `read_paths_at` spends `cat-file -t <rev>` (`driver.rs:2393`, "validate the root separately") then `cat-file --batch -Z` (`driver.rs:2421`) per call. Measured: 41 distinct oids -> 44 `-t` + 42 `--batch`. The commit headers and bodies were already fetched in batch by `walk_commits` (`rev-list --stdin`, `cat-file --batch-check`, `--batch`, driver.rs:3454/3484, 1 page per 256 commits), so only the blobs are per-commit.
2. **Legacy fence at HEAD, constant per call, and the "96x" object.** `packages/event-store/rust/src/read.rs:186` (`read_legacy` -> `fence.rs:42` `pinned_at_head` -> `read_paths_at(HEAD, ".fgos/events")`), plus `consumer_inventory_at`. It costs `cat-file -t <HEAD oid>` + `--batch` each time; observed `-t` on HEAD oid 4x in `read`, 3x in `openStore`, 14x across an `add`. In the loop.test.mjs test it sums over every store call of the test (the proofs lead's 96). Oid verified: `77fe3c1` / `a1be544` is `refs/heads/main`.
3. **`openStore` (13 spawns):** ref resolution and own-origin discovery (`symbolic-ref` x4, `rev-parse` x2, `for-each-ref`, batch-check x3, the HEAD probes). The extra `symbolic-ref` (70 vs 20) and `for-each-ref` (38 vs 13) in the test come from here and from seal/sync, per store open and per call.
4. **`seal` (38 spawns, ~1 s) and `sync` (38 spawns, 0.05-0.85 s):** `EventStore.seal` is called inline after any lifecycle event (`src/state/consumer-event-gate.mjs:81`, opportunistic) and `sealIfDue`/`sync` from `src/event-store/maintenance.mjs:40`. Each re-reads refs (`for-each-ref` x8), re-walks (`rev-list` x4, batch) and publishes (`hash-object`, `update-ref`, `show-ref`).
5. **Not the Work consumer:** `src/state/work-event-store.mjs` calls `store.read` once per command (`:18`, via `readWorkState:51`), `readInGate` once, `append` once. Consumer-event-gate re-reads only on `catch-up-required`. No loop of reads; the multiplier is inside the Rust walk.

Why the cache does not help: `readWorkState` (`work-event-store.mjs:48-70`) calls `store.read` unconditionally and only afterwards compares the cached view's cursor to `read.cursor` (`:64-66`). The in-process `retained` cursor (`:48`) is empty in every fresh CLI process. On the Rust side `read.rs:254` `have_history` needs the retained folded events (`req.folded`), which the saved view does not carry, so the certified-skip (`read.rs:276` `unchanged`) never triggers for a cold process.

## Q3: where the `fgos list` time goes

Release, branch, ~40-commit chain (load 5): total 617 ms = host 3 ms + node start/imports ~60 ms + GitInspect 44 + openStore 111 + maintenance ~30 + **read ~350-480** + sync-trigger 62. On a 76-commit chain the same command is ~1.2-1.4 s. Main: 174 ms total. Debug: add the 3.8 s host digest on both trees; the branch delta over main is then +1.0 to +1.3 s for list/show (same order as release). The earlier "2.15 s" figure is therefore mostly host start plus the store read, not a separate phase (not reproduced exactly; load differed). The fold, triggers (`maintenance` 20-40 ms) and `getMainFgosDir` are not material (not separately visible in native-call timings; sum of non-native time ~100 ms in release).

## Q4: fix options

| # | Option | Layer / owner | Cost | Effect |
|---|---|---|---|---|
| 1 | One `cat-file --batch -Z` for **all** commits of a walk page: collect `seal.json`/`events.jsonl` paths for the whole page and call `read_paths_at` once per page (or add a `read_paths_at_many(commits, paths)` to the Inspect port); also drop `cat-file -t` where the batch output header already says `commit`/`missing` | `packages/event-store` walk.rs (call site) + `packages/git` driver.rs (port) : GIT/ES lane | Small-medium (about 1 to 2 days; port signature change moves every caller and tests, L10) | 2N -> ~3 spawns per page: list 113 -> ~25. Biggest and safest win; keeps the verify-everything semantics |
| 2 | Skip the redundant `cat-file -t` in `read_paths_at` (`driver.rs:2393`) for roots that came from the same command's `walk_commits` | `packages/git` : GIT/ES | Small (hours) | Halves the per-commit cost alone (113 -> ~70); subsumed by 1 |
| 3 | Persist the verified certificate set + verified tips across processes (the cursor `certified`/`verified_tips`) and accept it after a cheap re-observation of refs (spec section 15); skip walking certified commits | `packages/event-store` read.rs + store cache : GIT/ES; the consumer passes the cached cursor in : WORK | Medium-large, trust-model decision (cursor in a cache file is not authenticated; spec would need a rule) | Cold read becomes O(new commits); list approx 30 spawns |
| 4 | Memoise the legacy-fence/HEAD probe within a command (read, openStore, sync share `authority`+`pinned_at_head`) | `packages/event-store` fence.rs/read.rs : GIT/ES | Small | Removes ~7-14 spawns per command and the "96x" |
| 5 | Verbs that only need the cache (`list`, `show`, `ready`, ...) read the saved view first and verify cheaply (ref tip equals cached cursor tip) instead of a full read | `src/state/work-event-store.mjs` / `store.mjs` reader: WORK, needs spec section 15 sign-off from ES | Medium; touches the "a cache never establishes coverage" rule, so needs a decision, not a patch | Read verbs near main cost; mutations still verify |
| 6 | Cache sealed-segment decode by commit oid in a per-process map | `packages/event-store` : GIT/ES | Small but useless for CLI (one read per process); helps gateway/runner/tests that reopen stores | Test suite only |
| 7 | Defer inline `seal` (1 s, 38 spawns) off the mutation hot path, or seal asynchronously | `consumer-event-gate.mjs:81`, ES seal : WORK policy + ES | Medium; changes the durability promise of lifecycle events | `move` 1.9 s -> ~0.9 s |
| 8 | Run `sync` trigger detached instead of foreground | `src/event-store/maintenance.mjs`: WORK/ES | Small | Removes 0.05-0.85 s from the command that finds it due |

## Recommendation

Do 1 (with 2) and 4 first in the GIT/ES lane: pure batching, no semantic change, predicted `list` ~113 -> ~25 git processes and a chain-length-independent read, which also repairs the loop.test.mjs per-test 11.7 s. Decide 3/5 (cross-process certified cursor, spec section 15) as a separate owner decision; it is the only route to a read that is not O(history), but it touches the trust model. 7/8 are WORK-policy follow-ups after that. Re-measure with `diag`-style counts: git execs for `list` on a 40-commit chain should be below ~30, and `move` below ~80.

## Unresolved questions

- Why the chain was 64 commits in one fixture and 40 in another with the same seeding: `sealIfDue` seals open segments by wall-clock interval (seeding speed decides). Counts scale with chain length either way.
- Debug-host 3.8 s digest check not investigated further (same on main; belongs to the host/distribution owner).
- Remote mirror refs (`refs/fgos/remotes/...`) are walked a second time per mirror tip (`read.rs:312-325`); the fixture had no remote, so that multiplier (up to 2x) is not measured.
