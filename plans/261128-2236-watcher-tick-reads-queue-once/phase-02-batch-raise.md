# Phase 2: Batch raise with one fold

Honors D2 (fold once per tick, batch raise, single raise a batch of one, per-row path deleted, semantics unchanged)
and D4 (one owning test of the one-read property). Criterion 2. Capability: `code:implement`.

## Inputs

- `plans/discussions/ds-r42bvbzode-watcher-tick-cpu/DISCUSSION.md` §4 D2, §6.
- `packages/supervision/rust/src/queue.rs`: `raise` (`:216`), `retrying` (`:229`), `append` (`:286`, already takes a
  slice of `EventInput`), `fold` (`:327`).
- `packages/supervision/rust/src/watcher.rs`: `EventSink` (`:124-139`), the raise loop in `tick` (`:397-460`),
  `run_action` (`:510`).
- `apps/fgos/src/wiring/supervision.rs:3044` (`raise_event`, the `fgos supervisor raise` door).
- `packages/supervision/rust/tests/queue.rs` (raise semantics, real store) and
  `packages/supervision/rust/tests/watcher.rs` (`World` is the test `EventSink`, `:177`).
- `docs/platform/supervision/spec.md` (the queue and tick sections; §8 Lịch sử quyết định).
- Prior art: no batch raise ever existed (`git log -S raise_many`, `-S raise_all`: nothing; DISCUSSION C5).

## Files it may write

- `packages/supervision/rust/src/queue.rs`
- `packages/supervision/rust/src/watcher.rs`
- `packages/supervision/rust/tests/queue.rs`
- `packages/supervision/rust/tests/watcher.rs`
- `apps/fgos/src/wiring/supervision.rs`
- `docs/platform/supervision/spec.md`
- `changelog.d/261128-2236-watcher-tick-reads-queue-once.md`

## Steps

1. Impact first: run `fgos dispatch decide --for impact-analysis --json`; with GitNexus present and fresh, run
   `impact` upstream on `Queue.raise`, `EventSink.raise` and `tick`, and cross-check with
   `rg -n '\.raise\(' packages/supervision apps/fgos`. Expected callers: the tick, `raise_event` in the wiring, the
   two test files. Any other caller moves in this phase too (L10).
2. `queue.rs`: replace `raise(&self, event: RaisedEvent) -> Result<Raised, QueueError>` with
   `raise(&self, events: Vec<RaisedEvent>) -> Result<Vec<Raised>, QueueError>`, one answer per input, input order.
   Validate every event first (a bad one refuses `bad-event`, nothing written). Inside `retrying`: fold once; walk the
   batch keeping a set of ids seen in this batch; an id in the fold or already seen answers `Duplicate`, else `New`;
   append all `New` payloads in one `append` call (extend `append` to take a list of `(event_type, payload)` and build
   the `EventInput` slice; `mark_handled` keeps calling it with its own events). An empty batch, or one with no `New`
   event, writes nothing. A `stale-view` refusal retries the whole batch from a new fold, as today.
3. `watcher.rs`: `EventSink::raise` takes the batch with the same signature. In `tick`, first build the events from
   the rows (the unmeasured / no-subject / stuck handling stays per row, before the batch), call `raise` once, then
   walk rows and answers together in row order doing exactly what the per-row match did: `New` -> `raised += 1`, run
   the action, keep the oldest event routed to a wake; `Duplicate` -> `duplicate += 1`, retry `StartReview`. An `Err`
   from the batch adds one error per event in the batch (today each failed row added one), and no action runs.
4. `apps/fgos/src/wiring/supervision.rs` `raise_event`: call `raise(vec![event])` and take the single answer. Output,
   coordination record and refusals unchanged.
5. Tests, one owning proof each (principle 8):
   - `tests/watcher.rs`: make `World` count `raise` calls and the events per call; add one test, titled by its
     behaviour ("a tick with many answered rows raises them in one queue call"): N > 1 rows from the definitions,
     assert exactly one `raise` call carrying N events, and that counts and the wake choice equal the rows' answers.
     Adapt `World::raise` to the batch signature; existing tick tests keep their assertions.
   - `tests/queue.rs`: move the existing single-raise cases to the batch form (a batch of one) without asserting
     less; add the batch cases: an id already raised answers `Duplicate`; an id twice in one batch is appended once
     and answers `New` then `Duplicate`; an empty batch writes nothing; one bad event refuses `bad-event` and writes
     nothing. Prove "one fold per batch" here only if the real store makes it observable cheaply; otherwise the
     watcher test owns the one-read property, and say so in the test's comment.
6. `docs/platform/supervision/spec.md`: where the spec says the queue raises one event per row, say it raises the
   tick's rows as one batch with one fold; add a §8 decision-history row citing `ds-r42bvbzode` D2 (DoD question 6).
   Grow the existing section; do not add a document (`fgos doc locate` first).
7. `changelog.d/261128-2236-watcher-tick-reads-queue-once.md` per `changelog.d/README.md`: the watcher tick reads the
   supervision queue once per tick, so a full tick stops growing with the number of answered rows.
8. Commit message describes the behaviour (no plan ids).

## Verify

`cargo test -p fgos-supervision --test watcher --test queue` and `cargo test -p fgos` (the wiring crate) green; then
`cargo test --workspace` and `npm test` before handing to phase 4. Pass: the new watcher test fails on the per-row
loop (check by running it against the old loop once) and passes on the batch.

## Rollback

`git revert` the phase commit; the per-row raise comes back whole.
