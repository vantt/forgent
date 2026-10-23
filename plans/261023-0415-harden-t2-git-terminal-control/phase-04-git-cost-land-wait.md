---
phase: 04
title: "Git cost: patterned list_refs (F-C4), gitPortOptions reuse (F-C5), F-C3 kept by evidence; the Land wait moves into the Land port"
status: pending
depends_on: [02]
parallel: "with phase 03 (disjoint files); with phase 06"
effort: ~1.5d
net_size: "Node −18 / Rust +45 / tests +10 (estimate)"
---

# Phase 04 — Git cost and the Land wait

## Context

Arbitration D1 step 4, §2.1 "Fewer children" and "Land waits in Rust", §3 verdict 2, D9 (no repository handle cache, `PATH` stays in the key: those are A2/A4, phases 13/15). Speed seat F-C3, F-C4, F-C5 (fix shapes, census per add: 6 `for-each-ref`, 2 `git var`). **F-C6 is phase 7** (D-T2-4). [plan.md](plan.md) D-T2-5 (no loans on the async path; explicit port state), D-T2-9 below.

**D-T2-9 (F-C3 closes "kept by evidence"; reported to the big lead as a reversal of an arbitration line).** <!-- Updated: Red Team 2026-10-23 -->
- `driver.rs:636-660` asks `git var GIT_CONFIG_SYSTEM` and `git var GIT_CONFIG_GLOBAL`. Its own comment gives the reason: "origin records alone cannot reveal a missing system/global file that appears later, and a custom Git prefix must never be guessed".
- `config_paths` feeds both the floor key (`:1334`) and the staleness stamp of the repository config cache (`validated_config`, `:686-700`). An absent global file that appears later, carrying for example a `url.*.insteadOf`, must therefore still invalidate the cache.
- The `--show-origin` listing names only files that exist.
- Deriving the paths by hand re-implements git's lookup. The driver also strips every `GIT_*` variable from git's environment (`driver.rs:193-204`), so a hand derivation would have to copy that rule. It would also lose the fail-closed refusal `git-config-paths-unavailable` when `HOME` is unset (`:651-653`).
- The saving is one or two children **once per process**: `CONFIG_SOURCES` caches the answer (`:625-633`).
- Therefore both children stay. F-C3 closes "kept by evidence", and this phase's F-C3 slice is empty. `PATH` stays in the key (D9).
- The big lead carries this reversal to the owner in the next batch, as a one-line note with this evidence.

## Requirements

### F-C3

Kept by evidence (D-T2-9). No change. The report says so.

### F-C4 (`driver.rs:2294-2377` `list_refs`)

- Pass patterns to `for-each-ref` so git lists only the requested namespace. `for-each-ref` patterns match literally from the start **up to a slash** or by fnmatch, so a prefix that does not end at a `/` (e.g. `refs/heads/fo`) would miss refs: pass, per prefix, the prefix itself when it ends with `/` or names a full ref, else its parent directory (`refs/heads/`), and **keep the in-process prefix filter** (`:2326`) and the cursor rule unchanged. ≤ 256 prefixes already bounded (`:2302`).
- `WalReader::read_ref` (`:1859-1914`) is not touched (kept on purpose).
- Test: extend `packages/git/rust/tests/inspect.rs` owner of ref listing (`inspect_real_repositories_byte_paths_pages_and_optional_locks`, `:15`) with "a listing of one namespace returns exactly its refs, including a prefix that does not end at a slash, and pages the same way" (one case).

### F-C5 (`src/git/inspect.mjs:27-37`)

- `gitPortOptions(repoPath, { mutation, inspect })`: when the caller already holds an inspect port for that repository, reuse it (`inspect.resolveRepo()`); otherwise build one as today. Callers that already hold one (`rg -n "gitPortOptions\(" src` — at least `src/runner/repo-locks.mjs:82-94`; the lead lists all with file:line in the report) pass it. No cache, no new state (D9).

### Land wait (`src/git/land.mjs`, `packages/git/node-addon/src/git/land.rs`) <!-- Updated: Red Team 2026-10-23 -->

**Step 0 is a spike that decides the slice before any Node change.** Confirm that the `LandSession` (`packages/git/rust/src/land.rs:100-106`, holding `LockScope<'static>`), the driver and the repository handle can move to a worker thread. If any is not `Send`, the lead stops with `BLOCKED` (D-T2-5).

napi needs no new feature: the addon's `napi8` feature includes `napi4` (napi-rs 2.16 feature chain), which provides `AsyncTask` and deferred promises. `packages/git/node-addon/Cargo.toml` stays unchanged; the spike confirms this.

**The port's state.** `GitLand` holds an explicit `Idle | Pending | Open(LandSession)` state, replacing `Option<LandSession>` (`node-addon/src/git/land.rs:11-17`):
- `prepare` and `publish` while `Pending` refuse with `land-call-pending`;
- `prepare` while `Open` refuses with `land-session-already-open`, as today;
- `close()` while `Pending` marks the call cancel-on-settle. When it settles, the session it produced is dropped, so the target's slot is released at once and never held until process exit.

**The calls.**
- `prepare(args)` and `publish(evidence, waitMs)` return a **Promise**. They run the existing Rust `prepare_land_wait` / `publish_land_wait` (`land.rs:316,722`) with the caller's real `waitMs`, off the JS thread.
- The Rust loop already decides which failure is retryable and for how long.
- The wait runs on napi's `AsyncTask` only if the lead shows a waiting Land cannot starve the libuv pool (4 threads by default). Otherwise it runs on a dedicated thread that completes a deferred promise. The report says which, and why.

**Loans stay synchronous; the handover guard is not touched.**
- No production caller passes held handles to Land: `src/runner/merge.mjs:907,951` and `src/workflow/runner.mjs:605,611` call `prepare`/`publish` without them.
- So the asynchronous path takes **no loans**. A `prepare` given held handles runs one synchronous attempt, exactly as today with `waitMs: 0`. A non-zero `waitMs` together with held handles refuses with `land-wait-with-held-locks`.
- `registerNativeHandover` (`src/holder-lock/index.mjs:683-705`) and its synchronous-call invariant stay as they are. No borrow is held across an await.

**Facade.**
- In `src/git/land.mjs`, delete `lockUnavailable` (`:5-7`) and `within` (`:13-19`) as the **last** commit of the slice, after the native promise path is green.
- `prepare` and `publish` forward `waitMs` and return the port's promise.
- Callers (all already `await`): `src/runner/merge.mjs:907,951`, `src/workflow/runner.mjs:605,611`, `scripts/git/e3-bench.mjs:368`, `test/git/land-fixture.mjs:21`, `test/git/land-recovery.test.mjs`, `test/git/land.test.mjs`.

**Tests.**
- Owning proofs, kept and only retargeted:
  - `test/git/land.test.mjs:179` "prepare waits only for its own full destination slot…";
  - `test/git/land.test.mjs:236` "a Land waiting for admission keeps its process running, so a session closed in the same process admits it within the budget".
- Add to `test/git/land.test.mjs`, the owner of Land facade behaviour: "a second call or a close while a Land waits is answered by name and leaves no slot held". No existing test covers a pending state, because none existed.

## Files

**Create**: none. **Modify**: `packages/git/rust/src/driver.rs` (`list_refs` and its inline test only), `packages/git/rust/tests/inspect.rs`, `packages/git/node-addon/src/git/land.rs`, `src/git/{land.mjs,inspect.mjs}`, the `gitPortOptions` callers that hold an inspect port, `test/git/land.test.mjs`. **Delete**: `lockUnavailable`, `within` in `src/git/land.mjs`. **Tests to retire**: none (TEST's N1 witnesses are retargeted, not removed).

MAIL's branch edits `driver.rs:415-450,1543+`; this phase's hunk is `:2294-2377` — board note before merge.

## Steps

1. Branch `harden/t2-p04-git-cost-land-wait` after phase 2 merged.
2. F-C3: none (kept by evidence; the note goes to the big lead).
3. F-C4 case → patterns → commit `perf(git): list only the requested ref namespace`.
4. F-C5 → commit `perf(git): reuse a held inspect port when building mutation port options`.
5. Land: spike (step 0) → port state and promise → pending-state case → land tests → facade deletes last → commit `refactor(git): Land waits for its locks inside the native port without blocking the event loop`.
6. OPC review. Board note to MAIL.
7. Measure: per-add contained child census (strace marginal n3−n1, speed seat method) before/after on a scratch repo on ext4; expected 19 → ≤ 15. Report.

## Verification (exact)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-p04-target
cargo test -p fgos-git --lib -- driver::list_refs
cargo test -p fgos-git --test inspect --test land --test land_crash_matrix --test publication
cargo test -p fgos-event-store
cargo test -p fgos-node-addon
cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
```

Node (one-file command): `test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/lock-handover.test.mjs test/git/inspect.test.mjs test/runner/land-vs-manual-commit.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/holder-lock/facade-multiprocess.test.mjs`.

`rg -n "lockUnavailable|function within" src/git` → nothing.

## Net size

Node −18 (`land.mjs` −14, `inspect.mjs` ±2, callers −5). Rust +45 (addon promise plumbing and port state +40, `list_refs` +5). Tests +10.

## Test-cost line

Added 2 cases (listing, pending state); retired 0; per worktree add ≈ −4 contained children.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A `LandSession` produced after `close()` holds the slot | M × H | Cancel-on-settle in the port state; pending-state case |
| A waiting Land occupies a libuv pool thread and stalls fs work | M × M | Dedicated thread or proof of no starvation (step 5 requirement) |
| Pattern semantics miss refs | M × H | Directory-boundary patterns plus the kept in-process filter; the listing case covers a non-slash prefix |

## Rollback

Revert per commit. No on-disk format change.

## Done when

All listed tests green; the pending-state case green; the child census shows the drop; OPC verdict recorded; `land.mjs` has no retry logic.
