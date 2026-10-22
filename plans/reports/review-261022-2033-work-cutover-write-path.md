# Review A: WORK lane cutover, Work and porting write path

Branch `work/es-cutover`. The diff reviewed was `c56f1eae3..bf9bdf18d`; `bf9bdf18d` is the hot-lock stderr line, which has been committed since the brief. This was a read-only review. I ran no tests, no cargo and no heavy commands; the evidence comes from reading the code, and the line numbers refer to `bf9bdf18d`.

**Verdict: the branch is not merge-ready. There is one High finding.**

The gate itself holds up: staging, one append per transaction, lock order, the acknowledged-effects error and cache authentication are all correct. The reducer's throw-or-record rule is sound and deterministic, and every finding from the old review's H1 to its L5 is addressed. The remaining blocker is that a recorded conflict is written but nothing ever reads it. As a result, an acknowledged mutation can disappear after a sync without anyone being told, and two idempotence and release paths treat an event that never applied as if it were a durable record.

## High

**H1. Nothing reads `view.conflicts`, and the Land paths treat a conflicted event as a durable record.**
- Where the conflict is written: `replay.mjs:106` is the only place it is written. `rg '\.conflicts\b' src bin` finds no reader in doctor, `events status`, `show` or `list`.
- How it fails:
  1. Machine A runs `fgos approve X`. The Land publishes and the `work.move` to `delivered`, which carries `landSettlement`, is acknowledged.
  2. Machine B moved X concurrently, for example to `parked`.
  3. After a sync, A's delivery folds as a conflict on every clone. X reads as `parked` while its merge is in trunk, and nobody is told.
  4. Re-running approve does not repair it. `store.mjs:893` searches the full history for a matching settlement and returns the conflicted event as `prior` at `:626`, so the command reports success.
  5. `releaseRecordedLand` (`merge.mjs:1427`) and `approve.mjs:128` likewise accept any hashed event that names the operation, including a `blocked` move that later folds as a conflict. The candidate is then released against a result the view never applied.
- This also undermines D-ADR0055. Its review threshold ("a recorded cross-machine conflict that a person had to resolve by hand more than once a month") cannot be observed while conflicts have no reader.
- Fix:
  1. Surface `view.conflicts` in `fgos doctor` (a row with the count and the latest entries) and in `fgos show <id>`, for conflicts whose event concerns that id.
  2. In the `prior` lookup and in the sweep, ignore any event whose `h` is in `view.conflicts`. Read the folded view next to the events; `readWorkState` already returns both.
  3. Add one owning proof in `work-conflicts.test.mjs`: a delivery that becomes a conflict, followed by a retried approve, must not return it as `prior`.

## Medium

**M1. Once two origins exist, every precondition failure is recorded silently, so a real local bug in a multi-machine project is never caught.**
- Location: `replay.mjs:84` and `:98`. The throw fires only when no foreign origin precedes the event. A project that has synced even once has foreign origins before almost every later event, so the throw path is dead in practice on forgent's three machines.
- Example: a future change to `prepareEvents` stamps a wrong `expectedStatus`. Every affected mutation becomes an invisible conflict instead of stopping the fold.
- Why a tighter rule is sound:
  - Throw when every event before E in the order was seen by E. Legacy events count as seen.
  - Seen events always sort before E, so that prefix equals the writer's seen set.
  - A min-key Kahn run (spec §12) restricted to a causally closed prefix emits the same sequence as the run on that set alone.
  - The replayed view is therefore exactly the view the writer decided on, so a failure there is a local bug.
- The rule is strictly stronger than the current one, which throws only when no other origin precedes E. It still records the 3-origin cascade, because A had not seen G's earlier events. Its cost is a per-stream max-seq map compared against `event.seen`.
- Fix: implement that rule and add the vector "foreign event seen, own precondition wrong" to the single-clone throw test.

**M2. The approve post-publication fault guard can no longer fire, and its test only proves the test seam.**
- Location: `approve.mjs:101` handles only `EventLogError`. After the cutover nothing in production raises it for a write: the gate raises `HotLockError` (`hot-lock-timeout`), store codes (`event-store-catch-up-busy`, ENOSPC) and `event-store-acked-effects-incomplete`. The only producer left is the test seam at `:89`, so the test of this guard covers the seam and not the real failure.
- Failure: Land has published, then the delivered move times out on the state mutex or loses the catch-up race. Approve throws instead of recording the fault and returning a truthful envelope with `event: null`.
- `EventLogError`'s comment in `event-log.mjs` still says it carries `lock-timeout` from the state gate, which is no longer true (dead documentation).
- The lock-timeout half already existed on main (4.3-S); the cutover removed the last real producer.
- Fix:
  1. Match the write-failure class: `HotLockError` with category `lock-timeout`, `event-store-catch-up-busy`, and I/O codes.
  2. Treat `event-store-acked-effects-incomplete` as success, taking the event from `ackedEvents`.
  3. Drive the test with a real held mutex instead of the env seam (AGENTS.md L5 forbids test-only branches).

**M3. Each mutation and each CLI command still costs O(view) inside the gate and O(history) per command.**
- Inside the gate:
  - `consumer-event-gate.mjs:55` folds the tail even when it is empty, and `cloneTopLevel` (`replay.mjs:23`) copies every work item each time.
  - After the append it folds again.
  - `persist` (`work-event-store.mjs:72`) serializes, hashes and writes the full view, also for transactions that append nothing (`afterApply` always runs).
  - `appendKnowledgeEvent` runs `structuredClone(before)` on the whole view under the mutex (`store.mjs:2070`).
  - With the live view at about 1000 items and 8 MB, these costs fall on every Work mutation while the mutex is held.
- Per command: a fresh process always reads from zero (`work-event-store.mjs:50-51`), and the cache saves only the fold. Spec §15 says the usual verbs read the view "after one `read(cursor)` catch-up". The unit report u1 accepts the cost and does not reconcile it with §15.
- Fix:
  - Skip the fold when the tail is empty.
  - Skip `persist` when nothing was appended and the view came from a matching cache.
  - Validate knowledge events against a narrow copy.
  - Record the §15 gap as an item: verbs that do not need `events` could read with the cache's cursor.

## Low

- **L1.** `work.step` and `work.stage` carry `expectedStatus` (`work-event-store.mjs:94`) even though they never change status (`replay.mjs:494-520`). A concurrent foreign status move therefore drops a step change. The comment at `:86-88` and the test title "expected status only on events that move status" say otherwise, and the test has no step case. Either remove step from `movesStatus` or correct the comment and cover step in the test.
- **L2.** The test named "dropped when foreign history arrives" (`work-gate.test.mjs:218`) appends through the same store and origin. No test checks that a fetched foreign ref invalidates the cache: the cross-clone tests in `work-conflicts.test.mjs` read without `cachePath`. Add one `cachePath` read after `pull` in the cascade test.
- **L3.** Porting (`porting-store.mjs`):
  - `readState` (`:65`) never reads the cache, so the cache is written but never used and every porting call refolds everything.
  - Any deferred or missing foreign porting event refuses every porting mutation until that event arrives.
  - The cross-clone conflict gap (u3 report, §"Porting cross-clone conflict gap") has no backlog row.
  - `extraRoots` (`consumer-event-gate.mjs:35`) grants the transaction write access to the caller's `dir`, which is a tracked directory (`docs/distillery/state`).

  The other porting checks pass: the fold keeps the first add, the cache is untracked, the cursor is only in the cache, and config comes from main.
- **L4.** The new warning in `hot-lock.mjs` names `hot-lock-release-stuck` for every `releaseError`, so an EISDIR or EPERM unlink failure is reported under the wrong code. Print `releaseError.code` instead. In a long-lived process (gateway, runner) the leftover record names a live process, so every later transaction waits until `hot-lock-timeout` until that process exits. On Linux this is reachable only through non-retryable unlink errors.
- **L5.** `result-codes.v1.json` lacks codes this layer raises: `event-store-full-read-under-state`, `event-store-incomplete-history` and `work-replay-precondition`.
- **L6.** In `releaseRecordedLand`, `candidates.length` (`merge.mjs:1422`) sits outside the `try`, so "never throws" depends on the port always returning a `candidates` array. A retained candidate with no Work record is never released, and it forces a full history read at the end of every Land verb from then on.
- **L7.** The static regex test `staging-returns.test.mjs:25` duplicates the runtime refusal proof at `work-gate.test.mjs:108` and hard-codes a count of 17 (design principle 8). Keep only its census half.

## Checked and correct

- **Reducer determinism:** the result depends only on the canonical order; `origins`, `preconditionHeads` and `conflicts` are fold state, and the capacity `against` uses sorted keys. A legitimate multi-machine history cannot throw. With no foreign origin before E, the prefix is E's own sequential stream, which E saw in full. The 3-origin cascade test does prove convergence of three clones that pulled in different orders, from a cold fold. It does not prove the same for cache reads (L2).
- **Gate:** catch-up happens outside the mutex; the in-gate tail check rejects tail events decided on a different view (`:50-53`). There is exactly one `store.append` per transaction, under `[...heldRanks, 60]`. Seals, sequence recovery and opportunistic seals run outside the gate. Async callbacks are refused before commit, and porting's `porting-events` mutex cannot nest with `state`.
- **Acknowledged effects:** `tx.acked` is set immediately after the append returns. Any later throw, including a fold or `persist` failure, becomes `event-store-acked-effects-incomplete` carrying `ackedEvents`. That code is not in the retry set (`consumer-event-gate.mjs:86-93`), and the test checks one callback call for both the effect failure and the cache failure. No path re-runs a callback after an acknowledgement.
- **Cache:**
  - Authentication: a cache is used only when its schema version, revision, `cover`, `streams`, `deferred`, `projectOrder` and `legacyDigest` all match the fresh read. Seal metadata is excluded on purpose.
  - After an append: the stored cursor is `advance(candidate.cursor)`, so a crash between the append and `persist` only causes a refold.
  - No stale view is served: every cache hit is checked against a read made after the cache was written.
- **`withStateTx` release:** a failed release never replaces the result or the error. An object error carries `releaseFailure`, and a committed result returns with a warning (`hot-lock-tx.test.mjs:171`).
- **Old review findings:**
  - Old M3: `prepareEvents` keeps a per-id map, and `precondition` is stripped from folded payloads.
  - Old M5: the acknowledged-effects error now exists.
  - Old L1: there is a separate mutation budget.
  - Old L2: there is no `tx.eventStore`.
  - Old L3: `list` returns files only, and `exists` uses the read guard.
  - Old L5: config comes from main, and only a `SyntaxError` degrades to `{}`. Callers that need tolerance, such as `gate-kill-grace.mjs:47`, still catch other errors themselves.
- **Land acknowledgement:** it is `work-event:<h>`. Since `h` covers the origin and the sequence, it is unique across machines. An event without `h` produces an empty acknowledgement, which Land refuses (`land.rs:103`). The sweep is bounded to 10,000 entries, every failure becomes a warning, and it runs only at the end of the four Land verbs, never in a dispatched worker.

## Unresolved questions

1. Who resolves recorded conflicts, and through which verb? H1 needs a surface, and the owner may also want a repair door.
2. M3: is reading the full history from zero on every CLI call accepted as the shipped behaviour, despite the wording of §15? If so, §15 should say so.
3. L1: is dropping a step change on a concurrent status move intended?

Status: DONE_WITH_CONCERNS
Summary: Gate, staging, acknowledged-effects, cache and release handling are correct, and the reducer rule is sound and deterministic. The branch is not merge-ready, because recorded conflicts are never read, so acknowledged mutations vanish silently after a sync, and the Land idempotence and release paths count a conflicted event as a durable record (H1).
Concerns/Blockers: H1 before merge; M1 to M3 should be fixed or turned into items in the same landing.
