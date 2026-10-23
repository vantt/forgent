# Phase 4 lead report: Git cost and the Land wait

Branch `harden/t2-p04-git-cost`, cut from `harden/t2-git-terminal-control` at `635af1aef`. Git-area commits for OPC review:

| SHA | Subject |
|---|---|
| `b7d229142` | perf(git): list only the requested ref namespace |
| `901e2b3fb` | perf(git): reuse a held inspect port when building mutation port options |
| `cca48c63a` | refactor(git): Land waits for its locks inside the native port without blocking the event loop |
| `9477257d2` | chore(git): regenerate the mutation census (hashes only) |

## Per item

**F-C3: kept by evidence, no change.** The two `git var` children stay (`driver.rs` comment on origin records and later-appearing system/global files; fail-closed `git-config-paths-unavailable`). `PATH` stays in the key.

**F-C4 (`list_refs`).** `for-each-ref` now receives patterns. Deviation from the phase text, with reason: the phase says "prefix itself or its parent directory". That cannot tell a full ref from a partial prefix, and the parent directory re-lists a namespace for every single-ref read (the case F-C4 exists for). Instead, per prefix: a prefix ending in `/` is passed as is (git matches it literally up to a slash); any other prefix is passed as `p*` and `p*/**` (git matches patterns with WM_PATHNAME, so both forms are needed; checked empirically against `/usr/bin/git`). RefName forbids glob characters, so the two patterns select exactly the refs that start with those bytes. The in-process prefix filter, the cursor rule and the `git-operations` exclusion are unchanged. `WalReader::read_ref` and `read_paths_at` untouched.
- Proof: `tests/inspect.rs::listing_one_namespace_returns_exactly_its_refs_and_pages_the_same_way` (files backend, namespace, non-slash prefix, paging at 2). No existing case covered a patterned listing or a prefix that stops inside a name.
- Cost: git alone, 1300 refs, p50 per listing 7.56 ms unpatterned vs 0.86 ms for a single-ref pattern (40 runs, scratch repo, ext4).

**F-C5 (`gitPortOptions`).** `gitPortOptions(repo, { mutation, inspect })` resolves through a held inspect port when given one; no cache, no state. `createWorktreeCheckoutSync(..., { waitMs, inspect })` forwards it. Callers of `gitPortOptions(` (40 sites, `rg -n "gitPortOptions\(" src scripts`): only `src/workflow/unit-handoff.mjs:342` (`createWorkflowWorktree`, which already holds `workflowInspect(repoRoot)`) holds an inspect port for the same repository when it builds mutation options, so it is the one caller that passes it. The speed seat named `repo-locks.mjs:82-94`; that function has no held port itself (it now accepts one). Every other mutation-option site builds its port from scratch.
- Proof: `test/git/inspect.test.mjs` "mutation port options reuse an inspect port the caller already holds".

**Land wait.**
- Step 0 spike: `GitDriver`, `RepoHandle`, `LandSession` and `LockScope` are `Send`/`Sync` as needed (the addon compiled with the driver and repo in an `Arc` moved to a worker). No `Cargo.toml` change; napi4 deferred promises come with the existing `napi8` feature.
- Thread choice: a dedicated std thread per call completing a `JsDeferred`, not `AsyncTask`. A waiting Land (up to its whole `waitMs`) would otherwise occupy one of the 4 libuv pool threads; four waiting Lands would stall fs work. One short-lived thread per Land call costs nothing next to the git work it waits for.
- Port state in `packages/git/node-addon/src/git/land.rs`: `Idle | Pending { closed } | Open(Box<LandSession>)`. `prepare`/`publish` while pending refuse `land-call-pending`; `prepare` while open refuses `land-session-already-open`; `recover` refuses both; `close()` while pending marks cancel-on-settle (the produced session is dropped at once, the prepare promise rejects `land-session-closed`); a publish that settles after a close keeps its receipt and drops the session. A panicking worker leaves the port idle (`land-worker-failed`).
- Loans stay synchronous: with held handles and `waitMs` 0, one attempt runs on the calling thread and the promise is resolved at once; held handles with `waitMs > 0` refuse `land-wait-with-held-locks`. `registerNativeHandover` and its guard are untouched.
- Facade: `src/git/land.mjs` lost `lockUnavailable`, `within` and the error re-parse in the same commit as the native path (one commit, so no interval has two retry paths). It forwards `waitMs ?? 0`. `rg -n "lockUnavailable|function within" src/git` finds nothing.
- Proofs: both owning witnesses kept and retargeted. The same-process-holder case now also asserts `ticks >= 5` (was `>= 1` with a comment that it would rise once the wait ran off the loop). New: "a second call or a close while a Land waits is answered by name and leaves no slot held" and "a Land that waits refuses to do so while the caller lends held locks".
- `test/git/recovery.test.mjs` (three cases) called `land.prepare(...)` without `await`. That only worked because the first attempt used to run synchronously inside the async function; they now `await` it. This file is listed under another phase's ownership; the edit is the 12-line retarget forced by this change.

## Verification (CARGO_TARGET_DIR on ext4, `--no-fail-fast`)

```
cargo test -p fgos-git --lib                  69 passed, 1 failed (a_failed_read_names_the_layout_cause_whichever_read_hits_it: expected remaining red)
tests/inspect                                  7 passed
tests/land                                    18 passed
tests/land_crash_matrix                       15 passed, 2 ignored
tests/publication                             32 passed, 2 failed (publication_names_a_busy_wal_like_every_other_port, a_borrow_that_is_unavailable_has_one_cause_name_whichever_check_finds_it: expected remaining reds)
tests/recovery_matrix                         14 x 1 passed
tests/refs_remote                              2 x 1 passed
tests/worktree                                 9 passed
tests/sequence                                 7 passed
cargo test -p fgos-event-store                all binaries ok
cargo test -p fgos-node-addon                 ok (0 tests)
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings   clean
Node: test/git/*.test.mjs (23 files) + runner/worktree-admin-multiprocess + runner/land-vs-manual-commit + holder-lock/facade-multiprocess + test/setup/git-checks: all pass after the recovery.test.mjs retarget
```

The only reds are the three expected ones. One earlier full Node run showed the three `recovery.test.mjs` cases red before the retarget (cause above); they are green now.

## Re-measure (release addon, `t2-p04-measure` scratch on ext4, both trees staged the same way; load 4.5 to 5.4 from other leads)

Contained children per add, strace marginal (n=3 minus n=1)/2:

| door | before (`635af1aef`) | after |
|---|---|---|
| `addWorktreeSync` | 11.5 | 11.5 |
| `createWorkflowWorktree` | 12.5 | 12.5 |

The speed seat's 19 no longer holds on the track tip (11.5 here; the drop predates this phase). This phase does not change the count: F-C4 keeps one `for-each-ref` per read and makes each one cheap (7.56 to 0.86 ms at 1300 refs); F-C5 saves nothing measurable because the second resolution is already answered from the driver's own config stamp cache. The phase's "expected 19 to at most 15" does not apply and F-C5 shows no child saving; per-add children are 6 `for-each-ref`, 4 `symbolic-ref`, 4 `rev-parse`, 2 `config`, 1 each `cat-file`, `ls-files`, `worktree`.

Add p50 (12 adds per round, 3 interleaved rounds, ms): before 269 / 282 / 301, after 269 / 262 / 284; min 231 / 240 / 258 against 218 / 209 / 239. Machine load made p50 noisy; the direction is a 10 to 30 ms gain at the minimum, not the 184 ms figure of the speed seat (that ran on a quiet machine, different state). fsyncs per add are unchanged (about 22 by the same method).

## Delta lines (HARDEN commits, `635af1aef..HEAD`)

- Rust src: +180 / -53 = +127 (addon `land.rs` +162/-44, `driver.rs` +18/-9). The phase estimate was +45; the explicit state machine, worker and cancel-on-settle account for the difference.
- Rust tests: +58 (`tests/inspect.rs`).
- Node src: +14 / -27 = -13 (`land.mjs` -14, `inspect.mjs` ±0, `repo-locks.mjs` ±0, `unit-handoff.mjs` +1).
- Node tests: +49 / -9 = +40 (land.test.mjs +27/-3, inspect.test.mjs +16, recovery.test.mjs +6/-6).
- JSON contract: census hashes only (+10/-10).

Test-cost line: added 4 cases (listing, held-port options, pending-state, held-lock refusal), retired 0, new CLI/host spawns 0. Children per add: unchanged (see above).

## Notes for other phases

- `docs/platform/git/spec.md` line 393 still says both waits are "spaced single native attempts awaited on the event loop". That is false now: the wait is one native attempt loop on its own thread. Phase 9 owns the spec; it needs that sentence and a line for `land-call-pending`, `land-session-closed`, `land-wait-with-held-locks`. CHANGELOG: the Node API is unchanged for callers; no entry needed beyond the spec.
- `driver.rs` hunk touched only `list_refs`; no overlap with WORK's `read_paths_at` or MAIL's `:415-450,1543+`.
- Scratch removed: `t2-p04-base` worktree and target, measure directory.

Status: DONE
