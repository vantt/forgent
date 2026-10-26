# Code review A: Event Store phase 09, Work and porting write path

Branch `es/p09-cutover`, worktree `es-p09-reva`, diff `83ad16aca..dbb5305a1`. This was a read-only review: I changed no repository files.

**Verdict for my area: not merge-ready.** The gate shape, staging and claim correctness are sound. One High finding in the reducer conflict rule must be fixed first. Two Medium findings show that the latency proof does not yet measure the real cost of a command.

## How I reviewed

I read the phase file, the seven lead reports (0905 to 1050) and Event Store spec §11, §12, §13, §15, §16 and §17. Then I read the full diff of `consumer-event-gate.mjs`, `work-event-store.mjs`, `hot-lock.mjs`, `store.mjs`, `runtime-coordination.mjs`, `claim-port.mjs`, `loop.mjs`, `porting-store.mjs`, `replay.mjs`, `event-store/{native,config,maintenance}.mjs` and `node-addon/src/event_store.rs`. I also read the Rust `read.rs`, `cursor.rs` and `open_read.rs` paths that the gate relies on, and the tests `work-gate`, `v-auth-01`, `work-conflicts` and the bench seed.

I could not run tests. The worktree is read-only to me, and the native addon is not built, so the test helper tries `cargo build` into the worktree and fails with EROFS. Every finding below comes from reading the code. The one empirical fact I used is the size of the main checkout's live view, `/home/vantt/projects/forgent/.fgos/state.json`: 1042 items, 8.2 MB.

## Checked and correct

- **§13 gate shape.** Catch-up happens outside the mutex (`readState`, then `beforeGate`). Inside the mutex, `ownOrigin` and `readInGate` fold only the own tail. The `seen` check raises `catch-up-required`. The callback checks preconditions, `commitEvents` makes exactly one `store.append` with `tx.cursor.cover`, and the code folds the result, advances the cursor and writes the cache last through `afterApply`. Error codes match `result-codes.v1.json`. `catch-up-required` and `seq-recovery-conflict` leave the gate and retry (the latter after a seal, at most once). `stale-cursor`, ENOSPC and validation errors are rethrown without applying anything.
- **D12 staging.** `commit()` (`hot-lock.mjs:385-394`) runs `commitEvents` before any staged effect. If the append throws, `staging` stays true and no effect is applied, so a refused or killed append leaves no partial effects. `readText`, `readJson`, `exists` and `list` see staged writes, unlinks and renames. Full readers (`readWorkState`, `currentView`, `readAllEvents`) and the claim readers called without `tx` refuse to run under the mutex. In-gate claim and slot reads in `claim-port.mjs:226-237`, `acquireClaimTx`, `releaseClaimTx` and settle all go through `tx`. The async-callback check now runs before commit.
- **Claims.** Settle re-reads the claim through `tx` and compares `claimId`. The drift evidence is computed before the gate and bound to the item revision checked inside it (`store.mjs`, settle `beforeGate`). In the release-then-reacquire case, the staged unlink is visible to `acquireClaimTx`, and effects apply in order. A stale settle is refused.
- **Lock order.** The native append runs under `[...heldRanks, 60]`. Seal, sealIfDue, sealAll, promote, sync and full reads all go through `outsideGate`. I found no inversion against the 4.3-S hot mutex. Porting uses `porting-events` (also rank 60) as a separate mutex, and nested entry is refused.
- **Porting.** It uses the same gate function (`withConsumerState`) and has no second mechanism.
- **Config.** `readEventStoreConfig` reads only the `eventStore` subtree, as the coordinator decided.
- **Rebuild.** It installs only when the own tail is empty, and is bounded by `maxAttempts` with the old cache kept.

## Critical

None.

## High

**H1. The reducer can throw `work-replay-precondition` for a legitimate 3-machine history, which would break every Work read on every clone.**
- Location: `src/state/replay.mjs:82-88`.
- The rule throws when the event that invalidated a precondition (`against`) was seen by the replayed event. This assumes that seeing an event means it had the same effect then as in the final order. That is false: whether a seen event is applied or recorded as a conflict can change when a late, unseen event sorts earlier.
- Example with 3 machines (A, S, G) and item X in `todo`:
  1. G, offline, moves X `todo→blocked` (ts 1), then `blocked→todo` (ts 2.5).
  2. A moves X `todo→doing` (event E, ts 2).
  3. S moves X `todo→parked` (ts 3) without seeing E.
  4. A syncs S. In A's view E applies and S is recorded as a conflict, so A then moves X `doing→done`, expecting `doing`.
  5. After G syncs, the final order is G1, E, G2, S, A. E is now a conflict (blocked), S applies (todo→parked), and A's precondition fails with `against = S`, which A had seen.
  6. The reducer throws. The fold is deterministic, so every clone fails every Work verb, and there is no repair verb.
- This fits the spec's 3-machine target. `work-conflicts.test.mjs` covers only a crossing CAS.
- Fix: record a conflict whenever the failure is not provably caused by observed history, rather than throwing. The simplest version records a conflict, with reason `expected-status` and `against` as the head, whenever any event between this event's seen frontier and the head is unseen by it. Keep the throw only for same-origin events in a single-clone history. Add this 3-origin vector to `work-conflicts.test.mjs`.

## Medium

**M1. Every command and every mutation reads the whole history; the cache saves only the fold, and misses after every seal.**
- Locations: `work-event-store.mjs:24` and `:36`, and the porting `readState`.
- `store.read({streams:['project']})` never passes the cache cursor or `folded`. Every catch-up therefore walks all refs from the roots and decodes all legacy and sealed events, with no pruning by `certified`. This differs from spec §11 and §15 ("after one read(cursor) catch-up").
- Cache reuse also needs `isDeepStrictEqual(cachedCursor, read.cursor)`. The read cursor includes `certified` and `mirror_tips` (`read.rs:329-356`), which change at every seal. `advance()` updates only `cover`, so after every sealOnWrite mutation (move, decision, outcome, gate approval) the next command refolds from zero.
- Correctness is unaffected. The cost is O(history) per CLI call, which part (b) end-to-end will pay.
- Fix: pass the cached cursor into `read` (the coverage walk), and compare only `cover` and `streams`/`deferred`, refreshing `certified` and tips from the read result.

**M2. Work inside the gate grows with the size of the view, but the latency proof uses a tiny new store.**
- Locations: `work-event-store.mjs:58` (`structuredClone(tx.view)` on every append batch) and `replay.mjs:13-24` (`cloneTopLevel` copies every work item on each `foldEvents` call, which runs for the tail, once per staged event in `prepareEvents`, and for the acknowledged events). On top of that, `persist` serializes, hashes and writes the full view inside the gate.
- The main checkout's live view is 1042 items and 8.2 MB.
- `v-spawn-bench --store-increment` starts from a new store and adds 200 small items per level, so a part (a) pass would not show real-repository cost.
- Fix:
  - Seed the bench with a view of realistic size, for example a copy of the live history or about 1000 items with real payloads.
  - In `prepareEvents`, keep a per-id `{exists, status}` map instead of cloning the whole view.
  - Fold staged events once.

**M3. Every `work.*` event carries a precondition, so a concurrent status move silently drops records that do not depend on status, and the precondition shows up in views.**
- Location: `work-event-store.mjs:60-66`.
- `expectedStatus` is attached to `work.edit`, `work.attempt`, `work.outcome` (a land result), `work.gate-approve`, `work.call-summary`, `work.handoff` and `work.resolve-park-reason`. A concurrent foreign status change therefore turns an unrelated edit, a settlement attempt or a land outcome into a conflict, and it is not applied.
- `work.discovery` gets a precondition keyed by its discovery id, not a work id.
- The `precondition` field also leaks into the view and its revision through payload spreads: `replay.mjs:467` (outcomes), the discovery fold near `:629` and park resolutions near `:710`.
- The spec text allows this behaviour, but it costs data. Fix: attach `expectedStatus` only to status-transition events (`work.move` and its answer form, and `work.step` if needed), attach existence only to the others, and strip `precondition` in the folds that spread payloads. This is the owner's call if they meant all events to be affected.

**M4. Porting writes a machine-local cursor into a tracked file, and its cache and config paths diverge.**
- Location: `porting-store.mjs:60`.
- It writes `{...view, cursor}` to `<dir>/porting/state.json`. For forgent that is `docs/distillery/state/porting/state.json`, which is tracked (`git ls-files` confirms). Every porting mutation then dirties the tree with machine-specific origins and oids.
- The consumer registry declares `cachePath: .fgos/porting/state.json`, so `fgos rebuild` refreshes a different file from the one the public API writes.
- The porting `readState` never reads its cache, so the cache is write-only.
- `prepareWorkStore` and `readEventStoreConfig` take `path.dirname(dir)` (`docs/distillery`), so the porting gate ignores the project's `eventStore` config and uses defaults.
- `project:porting` has no conflict rule across clones.
- Fix:
  - Stop tracking the derived view, or write it without `cursor`.
  - Align the registry `cachePath` with the API's view location.
  - Resolve config from the main checkout root.
  - Record the porting cross-clone conflict gap as an item.

**M5. After an acknowledged append, an effect or cache-write failure is reported to the caller as a plain failure.**
- Locations: `hot-lock.mjs:389-392` and `consumer-event-gate.mjs:69-79`.
- If an effect throws after the events are durable (for example EIO on the claim unlink, or ENOSPC on the cache write), the remaining effects and `persist` are skipped and the error is rethrown. To the caller this looks the same as a refused mutation.
- A caller that retries duplicates events that have no idempotence guard (`addDecision`, `addOutcome`, `recordGateApprove`). Settle duplicates through the same-writer drift reconciliation.
- The gate's own comment says acknowledged mutations are never turned into refusals, but this path does exactly that.
- Fix: catch post-acknowledgement failures and either return the hydrated result with a diagnostic, or throw a distinct code (for example `event-store-acked-effects-incomplete`) that carries the acknowledged events. Test this with an injected effect failure.

## Low

- **L1.** Ordinary mutations reuse `rebuild.maxAttempts` as their retry budget and, when it runs out, fail with `event-store-rebuild-busy`, which is the wrong name (`consumer-event-gate.mjs:25`, `:82`). A sequence-recovery retry also uses up an attempt.
- **L2.** `tx.eventStore` is still exposed (`hot-lock.mjs:295`), so a callback could call `append` directly and bypass staging and the one-append rule. Nothing uses it; delete it (RUL104).
- **L3.** `tx.exists` and `tx.list` use the write guard instead of the read guard (`hot-lock.mjs:331`, `:336`). `tx.list` also does not filter out directories, so `readClaims(dir, tx)` behaves differently from the version without `tx`, which keeps only files.
- **L4.** V-AUTH-01 symlinks each worktree's `.fgos` to main (`v-auth-01.test.mjs:72`). It therefore never exercises the real layout, where each linked worktree has its own `.fgos`, writes through `extraRoots` and reads config from the worktree. Add a variant without the symlink.
- **L5.** The Work gate reads config from the worktree root (`path.dirname(dir)`), while `maintainEventStore` reads it from `trustedMain`. `readSharedConfigOrEmpty` also swallows every error, EACCES included, not just parse errors.
- **L6.** `runWatch` calls the full `maintainEventStore` on every poll iteration (`loop.mjs:1786`), and that includes `status()`. Calling `sealIfDue` alone would be enough there.

## Tests

The new tests use real stores, real Git and real processes. I found no mocks and no production test switches. Gaps that matter: no case with 3 or more origins where conflicts cascade (H1); no assertion that the cache is actually reused after an append or seal (M1); no realistic view size in the latency harness (M2); no failure injected after acknowledgement (M5); and V-AUTH-01 uses symlinks (L4).

## Unresolved questions

- M3: does the owner intend status-independent `work.*` events to be dropped on a concurrent status change, as the spec text currently allows?
- M4: is `docs/distillery/state/porting/state.json` meant to stay tracked after the cutover (phase 10 owns the distillery spec)?

Status: DONE_WITH_CONCERNS
Summary: The gate, staging, claim and lock-order design is correct, but the branch is not merge-ready: a reachable 3-machine history makes the reducer throw on every clone (H1). Full-history reads on every command and a latency proof run on a tiny store (M1, M2) leave the latency budget unproven.
