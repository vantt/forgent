---
contract: plan-v1
title: "Event-store io errors keep the path and the operation in the invocation-fault log"
status: running
priority: P1
blockedBy: []
base: c3e132e943e1d9fb37053e75849141fc6522aea7
lead: head:lead-forgent-261125-1556-event-3bf82
footprint:
  - plans/261125-1556-event-store-io-errors-keep-path/**
  - packages/event-store/rust/src/lifecycle.rs
  - packages/event-store/rust/tests/lifecycle.rs
  - packages/git/node-addon/src/event_store.rs
  - src/event-store/maintenance.mjs
  - test/event-store/triggers.test.mjs
  - test/event-store/lifecycle.test.mjs
  - test/report/decision-index.test.mjs
  - docs/platform/event-store/spec.md
source:
  - plans/discussions/ds-bevhflpkmn-event-store-io-errors-keep-path/DISCUSSION.md
  - p-cg4w6nn5l6
created: 2026-11-25
---

# Event-store io errors keep the path and the operation

## Outcome

A failed Event Store trigger leaves a record in `.fgos/logs/invocation-faults.jsonl` whose `message` names the error
code, the io kind, the operation and the path (for example
`event-store-io: NotFound: No such file or directory (os error 2) (during open of /…/active.jsonl)`), not the bare
`event-store-io` that today makes the 2740 `event-store-end-trigger` faults untraceable. The `decision-index` CLI tests
print the child's stderr when they fail. With this landed, the follow-up row `p-duxnm52lzh` (end-trigger failure and a
seal child that cannot start) can be traced from the log.

### Facts (prior art and the real gap)

- The row's first half already landed: commit `8fa6edc85` (2026-11-15, "io errors name the operation and the path")
  made `errors::io(operation, path)` (`packages/event-store/rust/src/errors.rs:35`) write
  `"{kind:?}: {error} (during {operation} of {path})"` into `Error.detail`, with its owning unit test
  `io_error_names_operation_and_path`. Reused as is.
- The detail is dropped one layer up: `lifecycle::maintain` (`packages/event-store/rust/src/lifecycle.rs:79`) maps every
  failed step through `code_of`, which returns `error.code.to_string()` only. Both callers record that string as the
  fault message: the host (`apps/fgos/src/invocation_doors.rs:47-87` → `record_fault`) and the Node wrapper
  (`src/event-store/maintenance.mjs:56` via the addon `maintain_event_store`,
  `packages/git/node-addon/src/event_store.rs:575`). So one change in the crate fixes both channels (event-store spec
  §16 "Two callers, one policy").
- No production code branches on the trigger's error string: the host and the Node wrapper only record it; the observe
  readers (`packages/observe/rust/src/metrics_cli/faults.rs`) group by `faultClass`. Only tests pin the bare code:
  `packages/event-store/rust/tests/lifecycle.rs` (`event-store-no-repository`, `event-store-seal-under-state`,
  `event-store-integrity`) and `test/event-store/triggers.test.mjs:218,230` (`event-store-lock-dir-invalid`).
- `test/report/decision-index.test.mjs:164-214` asserts `run(...).status` with no message, so a CI-only failure shows
  `0 !== 1` and nothing else (the 2026-11-15 run 43683728551 case).

### Decision

`Outcome.error` carries the failed `Error`'s own display, `"{code}: {detail}"` (the `#[error]` format of
`errors::Error`), and the bare code only when the detail is empty or the failure has no detail (`ResolveError`
variants other than `Machine`, the unsupported-platform code). The code stays the leading token, so grepping the log by
code still works. Rejected: a new `detail` field on the fault record (a contract change of the observe log for no gain
over one string; RUL104 "tốt hơn, không to hơn"); mapping at each caller (two copies of one rule, against design
principle 1).

The row's third clause ("if the flake recurs, its cause is proven from the log and fixed at the source") is met by the
log carrying the cause; diagnosing the live faults is the follow-up row `p-duxnm52lzh`, a non-goal here (discussion
constraint).

## Acceptance criteria

1. `cargo test -p fgos-event-store --test lifecycle` passes, including one new test that makes a trigger step fail on
   io and asserts the outcome error starts with `event-store-io: `, contains `during ` and the failing path.
2. `node --test test/event-store/triggers.test.mjs test/event-store/lifecycle.test.mjs` passes with the record
   messages asserted as code-led (`^event-store-lock-dir-invalid(: |$)`).
3. `node --test test/report/decision-index.test.mjs` passes, and every `status` assertion on a child run carries the
   child's stderr as its message (read the file: no bare `assert.equal(run(...).status, N)` remains).
4. `npm test` and `cargo test --workspace` green on the combined tree (phase 3).
5. `docs/platform/event-store/spec.md` has a dated line saying a trigger's error is the code and its detail. No
   `CHANGELOG.md` line: the change adds text to a local diagnostic log and changes no command, config or output
   contract, and `CHANGELOG.md` is held by the running plan `261124-0004-heads-operate-without-owner`.

## Non-goals

- Diagnosing or fixing the live `event-store-end-trigger` faults or the seal-child start failure (`p-duxnm52lzh`).
- Any change to `errors::io` or its ~60 call sites (already done in `8fa6edc85`).
- Any new field on the invocation-fault record, or a change to its redaction or size cap.
- Error text of the detached child's own record (`event-store-child`), which already passes its message through.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `lifecycle::maintain`'s `Outcome.error` carries the code and the detail of the first failed step | `event-store-maintain-policy` | Changes the meaning of an existing door's output, no new door; `fgos authority locate "the event-store lifecycle trigger reports its first failure with the error's code and detail"` returns this row. `code_of` is replaced in place, no second path. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Trigger error keeps the detail](phase-01-trigger-error-keeps-detail.md) | - | packages/event-store/rust/src/lifecycle.rs, packages/event-store/rust/tests/lifecycle.rs, packages/git/node-addon/src/event_store.rs, src/event-store/maintenance.mjs, test/event-store/triggers.test.mjs, test/event-store/lifecycle.test.mjs, docs/platform/event-store/spec.md | 1 | ready |
| 2 | [decision-index tests print child stderr](phase-02-decision-index-stderr.md) | - | test/report/decision-index.test.mjs | 1 | ready |
| 3 | [Integration](phase-03-integration.md) | 1, 2 | plans/261125-1556-event-store-io-errors-keep-path/reports/ | 2 | ready |

Contract check: phases 1 and 2 share wave 1 with disjoint footprints; phase 3 depends on both and sits in wave 2. The
hot file (the event-store spec) belongs to phase 1 only; `CHANGELOG.md` is left out (acceptance criterion 5). Capability for every phase: `code:implement`
(phase 3: `code:test`).

## Owner questions

None.

## Risks and rollback

- **The addon is a prebuilt binary.** The Node channel only shows the new text once `packages/git/node-addon` is
  rebuilt. `npm test` rebuilds it (`scripts/run-tests.mjs:44`, `cargo build --release -p fgos-node-addon`); a focused
  `node --test` run needs that build first. Proof point: acceptance criterion 2 fails on a stale addon.
- **Longer fault messages.** A path makes each record longer; the log is capped at 1 MiB and halves itself
  (`packages/observe/rust/src/invocation_fault.rs:27`), so only retention shortens. Low.
- **Paths in the fault log.** The log is a local 0600 file that already records `cwd`; a path is no new exposure.
- **A test pinning the bare code elsewhere.** Phase 1 greps `rg -n "event-store-(io|integrity|lock-dir-invalid|no-repository|seal-under-state)['\"]" test apps packages` and moves each exact match to a code-led match.
- **Rollback:** revert the phase 1 commit; phase 2 is independent and stays.
