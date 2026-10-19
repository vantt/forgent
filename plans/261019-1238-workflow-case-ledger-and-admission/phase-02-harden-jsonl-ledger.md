# Phase 02 — Harden the JSONL ledger in place (F11)

## Context

- Spec RUL-WF-24, §5.5 (JSONL under `advance`, fsync before release, fail-closed reader, explicit trailing-line recovery), R4, R5, battery 21, §11.2 "Append fsync trước khi nhả `advance`".
- Code: `src/workflow/store.mjs:75-94` (`appendWorkflowEvent`: `seq = existing.length + 1`, `appendFileSync`, no fsync), `:106-122` (`readWorkflowEvents` swallows every bad line, comment says "trailing"); callers `src/workflow/runner.mjs:390` (loop helper), `:1243` (`recordGateAnswer`, under `advance` via `answerWorkflow`); `createWorkflowRun` `store.mjs:28` (seq 1).
- No Event Store, no lock re-rank, no Rust (owner 2026-10-19 12:20).

## Requirements

- RUL-WF-24: every ledger append goes through one door that **proves** it holds `advance`: `appendWorkflowEvent` takes the hold handle returned by `acquireAdvanceLock` (`runner.mjs:865`) and refuses without it (structural, not a comment). `createWorkflowRun` stays the exclusive-create of the run directory + first line + fsync (the run's `advance` lock cannot exist before its directory).
- Append: open, write one line, `fsync` the file (and the directory on first create), close — before the caller releases `advance`.
- Reader fails closed: any non-empty line that does not parse, or a `seq` gap/duplicate, throws `RunnerConfigError` with code `workflow-ledger-corrupt` naming file and line. Exception: a final line without a trailing newline is "unterminated", reported as `workflow-ledger-unterminated`, never silently dropped.
- Explicit recovery path: `recoverWorkflowLedgerTail({ hold })` (requires the `advance` hold) truncates only an unterminated final line, appends a `ledger.recovered` event with the dropped byte count, fsyncs. Called by whoever acquires `advance` when the reader reports `workflow-ledger-unterminated` (today: the loop helper and answer path).
- R5: `projectWorkflowState` stays a pure fold over events; no wall-clock reads inside the fold (verify; move any into callers).

## Files

- Modify `src/workflow/store.mjs`, `src/workflow/runner.mjs` (pass the hold at `:390`, `:1243`; `acquireAdvanceLock` returns `{ release, hold }` or the hold object carries `release`), `src/workflow/index.mjs` only if the export list changes.
- Tests: `test/workflow/workflow-store-ledger.test.mjs` (new) or extend the existing store test if one exists (phase 00 names it).

## Steps

1. Re-grep callers of `appendWorkflowEvent`/`readWorkflowEvents` (phase 00 fact 3).
2. Add the hold parameter; move the two callers; no other writer exists (assert in test by grepping `src/` for `appendFileSync` on `events.jsonl` paths).
3. fsync append; fail-closed reader; recovery function; wire recovery at the two `advance` acquisition sites.
4. Confirm the 92 stored runs read without error (big-lead scratch check; phase 00 found 0 corrupt lines).

## Tests (battery → test)

- 21: mid-file corrupt line → `workflow-ledger-corrupt`; unterminated tail → `workflow-ledger-unterminated`; recovery under `advance` drops only the tail and records `ledger.recovered`; recovery without hold refused.
- Append without hold refused; seq duplicate detected.
- fsync before release is not observable without power loss; it is proven by review of the one append function (open → write → fsync → close, then return) plus a structural test that no other `src/` code writes `events.jsonl` (grep-based, like the A4 guard). No test-only branch or spy hook in production code.
- Regression: phase 01 guard, `test/workflow/*.test.mjs`.

## Risks / rollback

- Risk (M×M): a playbook path appends outside `advance` today (e.g. an early event before the lock). Mitigation: step 2's grep plus the structural hold parameter makes it a load-time failure in tests, not a silent one.
- Risk: fsync cost on long panels — one fsync per event, events are coarse (per step/unit), acceptable.
- Rollback: revert the commit; ledger format unchanged (only `ledger.recovered` is new and the old reader ignores nothing it cannot parse).

## Done when

Battery 21 tests green, guard green, full `npm test` green.
