# Phase 9: Periodic review

Decisions: OS-D5 (6), OS-D17 (a read-only, independent Unit started through `fgos run` with a review capability, a
seat other than the supervisor; definition `review-due` on the age of `fgos.review.done` versus
`watcher.reviewIntervalSec`, default 24 hours; skipped only when nothing is open and no new event; fixed brief;
findings become events through the raise door; the reviewer never fixes).

## Inputs

- `core/watcher/definitions/*.query.json` (age-based conditions, for example `plan-ready-waiting`).
- `packages/supervision/rust/src/watcher.rs` (definitions, the action table `wake-supervisor | notify | none`).
- `core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`.
- `fgos convention path --kind report` (report names); `fgos dispatch decide --for review` (the capability exists).
- Plan `261121-2109-component-authority` (the structural model the brief compares with code, when present).

## Footprint

`core/watcher/definitions/review-due.query.json` (new), `core/watcher/briefs/periodic-review.md` (new),
`core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`, `packages/supervision/rust/src/watcher.rs`,
`packages/supervision/rust/tests/watcher.rs`, `packages/supervision/rust/tests/definitions.rs`,
`apps/fgos/src/wiring/supervision.rs`.

## Steps

1. Config: `watcher.reviewIntervalSec` (default 86400, minimum 3600); `actions.review-due: start-review`.
2. Definition `review-due`: raises when the newest `fgos.review.done` record is older than the interval (or absent),
   unless there is no open plan, no open question and no event since that record.
3. New action `start-review` in the watcher's action table: the wiring runs `fgos run "<brief>" --capability review
   --plan <none>` read-only (no `--writes`), with the brief file `core/watcher/briefs/periodic-review.md` as prompt
   input. The brief is fixed: oldest open records versus their frame, open needs-judgement events, the keeper's own
   health (tick lag, refusals), proposed thresholds, and the structural model versus code when the model exists. The
   reviewer writes one report at the path `fgos convention path --kind report` gives and, per finding, one
   `fgos supervisor raise` with a reason code.
4. On the Unit's settle, append `fgos.review.done` with the unit run id; a failed Unit appends nothing, so the next
   tick retries.

## Verify

`cargo test -p fgos-supervision --test watcher --test definitions`. Pass: no record raises `review-due`; a fresh record
does not; an old record with open work raises; an old record with nothing open and no new event does not;
`start-review` invokes the run door read-only with capability `review` (fake run door).

## Rollback

Revert the phase commit; the action and definition leave with it.
