# WORK lead: Event Store read cost, wave 2 (verified checkpoint, once-per-process facts, trigger costs)

Branch `work/es-cutover`, on top of `323721176`. Wave 1 report: `phase-lead-261023-1112-work-event-store-batched-reads.md`.

## What the cost was (found before building)

- The cursor of spec 15 and the certified commits of 11 already existed and already skip certified history, but only inside one process: the Work consumer keeps `{cursor, folded}` in a `WeakMap`, and `state.json` carries the cursor without the folded events. A fresh CLI process therefore always walked from zero. The cost was the walk (rev-list, header and segment reads), not the certification or the fold.
- Reused: `Cursor` (`certified`, `verified_tips`, `cover`), `read_with_view`'s own continuation and `unchanged(tip)` pruning, `descends`/mirror checks, `fgos_durable_file::replace_durably` for the atomic write, `FGOS_FILE` registry for the path. New: only the persisted record and its checks.
- Two further costs were not history at all: write admission (`write_readiness`: HEAD twice, refs, 3 legacy roots) ran at every `openStore`, even for `list`; and every legacy file was one Git process per file (2 before wave 1). A `sync` that failed at fetch never recorded an attempt, so it was "due" on every command.

## Commits (Git side separate for the OPC review)

| Commit | What |
|---|---|
| Event Store crate | `checkpoint.rs` + `read_checkpointed`, `walk::stops_reached`, `walk::blobs` (legacy files one process), seal skips the walk from a certified tip, `write_readiness` takes one HEAD, `SyncRequest.opportunistic`/`Synced.busy`, `maintenance.lastAttempt`, spec, tests |
| Addon glue (`packages/git/node-addon/src/event_store.rs` only) | `checkpoint` on `read`, lazy write admission (`OnceLock`, `admitWrites`), `opportunistic` on `sync`. No change in `packages/git/rust` (driver.rs untouched, so none of the forbidden ranges) |
| Node + report | facade, `readWorkState` / `store.mjs` callers, gate calls `admitWrites` before any gate, maintenance, registry row, tests, CHANGELOG, this report |

No Git mutation was added; `node scripts/git-one-door-scan.mjs --check` shows only main's 5 `unresolved-binary` sites; census untouched.

## Design of the checkpoint

`.fgos/cache/event-history.json` (cache beside `state.json`, ignored by `.gitignore`): `{v, storeId, cursor, events}` of the last complete, undeferred read. A read with no retained history of its own loads it; accepted only if: parses and version/store id/streams/order flag match; no deferred; certified == commits of verified refs; coverage == max seq of its events; every verified ref still exists and its walk meets the certified commit as a parent (a rewritten or foreign history never does); every own-origin event it holds is published (<= receipt) or still in local files; mirror descent passes. Any later error while continuing (hole, bad hash) repeats the read from zero. A rejected file is ignored, reported (`checkpoint.ignored`), and replaced. `fgos rebuild` never uses it, always replaces it. Written only when the read certified commits the starting history did not (not for local-only changes), never for a deferred read, a write failure never fails the read. Delta/fold answers stay relative to the caller's own cursor (an empty caller cursor gets the full sequence and `rebuild-required`).

Residual cost, stated plainly: a process still parses the checkpoint and marshals all events (CPU linear in events held, same class as the 10 MB `state.json` parse). What became O(new) is the Git work. After each seal the next command walks that one new commit (+ the certified boundary header, ~7 spawns).

## Measurements (release host, fixture of wave 1: 200 items, medians of 3, git execs exact, ms noisy: load 4 to 20)

Before = wave 1 tip (host and JS), after = this branch.

| Verb | execs before | after | ms before | after |
|---|---|---|---|---|
| `list` (40 sealed commits) | 27 | 16 | 492 | 374 |
| `show` | 27 | 16 | 578 | 387 |
| `add` | 61 | 20 | 1077 | 473 |
| `move` | 61 | 56 | 1129 | 870 |
| `list`, 400 sealed commits | 36 | 16 | 896 | 450 |
| `show`, 400 sealed commits | 36 | 16 | 822 | 391 |
| `list`, repo with 90 legacy files (15 MB) | 206 | 18 | 1864 | 1047 |

After the change `list` is 16 at 40 and at 400 commits: the history-dependent part is gone. `add` drops because the old end trigger re-ran a failing sync (sealing the stream each time) on every command; now one attempt per interval. `move` keeps one seal (29 spawns, was 34): 15 are Git's publication ceremony (candidate pin, CAS, release), 7 the verification walk after publish, 4 object writes. `list` floor now: 5 resolve the main checkout (Node side), 4 per read (HEAD 3 + tips 1), 7 for the legacy inventory of an unfenced HEAD.

`test/runner/loop.test.mjs` single case (`announce line`, strace): driver git execs 409 (wave 1 tip, my counting) -> 387. Reads 119 -> 111, seals 98 -> 87, admission 10 once. That test makes 23 reads in one process; each pays HEAD (3) + tips (1), so it is bounded by read count, not by history.

Whole file, solo, `FGOS_TEST_FILE_TIMEOUT_MS=900000`, coordinator's go: start 12:51:05 load 5.24, end 12:58:20 load 3.51, **435 s wall, 99/99 pass** (wave 1: 451 s; main about 295 s).

## Tests added (one owning proof each)

- `packages/event-store/rust/tests/checkpoint.rs`: second process reads only commits added after the checkpoint (3 reads: 2 new + certified boundary; 0 when nothing new; rebuild reads all); mismatched or corrupt checkpoint ignored and rewritten (truncated, other store, other version, wrong coverage, cut-out event, ref replaced by unrelated history), and the rewrite serves the next process; lost own event voids it; concurrent readers/writers leave one valid file and no temp files; deferred read writes none.
- `offline_sync.rs`: opportunistic sync returns `busy` without waiting while the seal lock is held, writes no attempt record, runs once released (try-lock proof).
- `legacy_reader.rs`: nine legacy files are one Git request.
- Node wiring: `work-gate.test.mjs` (checkpoint reuse/rebuild/damaged wiring), `facade.test.mjs` (admission is outside the gate and never by a read; gate write without it refused). Existing tests that appended in the gate now call `admitWrites` first like the consumer gate does (`facade`, `gate-probe`, `native-load`, `store-hardening` shape of `maintenance`, benchmark worker).
- Not added: a test for the skipped empty walk in seal (efficiency only, no behaviour change; existing seal suites cover results, spawn counts above).
- Proof runs: `cargo test --locked -p fgos-event-store` all green; clippy `-D warnings` on event-store, node-addon, work-state clean; focused Node `test/event-store test/state test/cli test/git`: 2639 tests, 2572 pass, 0 fail (2 skipped, 65 todo, pre-existing).

## Not done, and why

- Repository facts across calls: HEAD (`symbolic-ref` x2 + `rev-parse`) is re-observed per read. It is a Git-owned guard (`resolve_head`, driver.rs, next to HARDEN's ranges), and no cheaper observation of "HEAD did not change" exists without a Git change. Dedupe inside a call was done (admission used HEAD twice). Suggested Git-lane follow-up: one-process HEAD observation (`for-each-ref` with `%(HEAD)` and a detached fallback) would cut 3 to 1 per read.
- `read_paths_at` single path still has its `-t` probe (wave 1 note stands).
- Legacy CPU: with 33k legacy events `fgos list` still spends ~700 ms parsing, ordering and marshalling them every command; not a Git cost, not history of sealed commits. Candidate for its own item (cache by pinned legacy oid).

## Decision questions for the owner

1. **Seal before the answer.** What: `move` and the other sealOnWrite verbs seal (about 0.5 s) before the result is printed. Cause: the gate seals right after release, inside the verb. Options: (a) leave as is (spec 16 "right after the gate"); (b) seal after the result is written, still by the appending process, flushed at the next gate or maintenance or command end: result 0.5 s earlier but the process still exits at the same time, and a long single verb widens the loss window; (c) detach seal/push into a background process: exit earlier too, but adds a process model. Recommendation: (a) now; revisit (c) only if exit latency matters, since (b) changes the visible latency only for interactive output. I did not change 16.
2. **Post-publish walk in seal** (7 of 29 spawns): equal result can be computed in memory when the tip was certified. It would drop the read-after-write walk of spec 10 step 2.4. Recommendation: keep it (integrity over 60 ms).

Status: DONE_WITH_CONCERNS
