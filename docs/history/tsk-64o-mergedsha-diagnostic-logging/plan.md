# Plan — tsk-64o mergedSha diagnostic logging

Mode: small

Flags counted against `fgos-routing`'s Mode gate: **existing covered
behavior** (touches `src/verbs/merge/approve.mjs`, already covered by
`test/verbs/merge/approve.test.mjs`). No hard-gate flag applies — this adds
a diagnostic append-only log record, it does not touch auth, remove a
validation, or call an external provider. 1 flag → tiny/small; picked
**small** over tiny because the change lands at 3 distinct call sites
across 2 files and needs new test coverage, not a single one-line edit.

Impact-analysis posture: **full** — `fgos tool query --capability
impact-analysis --status present` returned GitNexus `status: present`,
freshly checked this session (2026-08-20). No proof point below leans on
blast-radius evidence beyond this file/its own test — GitNexus posture
noted for completeness per the capability gate, not because a claim here
depends on it.

## Approach

**Chosen path:** extend the existing `approve-fault-log.mjs` durable-log
mechanism (already wired at the one call site that matters,
`moveDeliveredOrRecordFault` in `src/verbs/merge/approve.mjs:74-99`) to
also fire on the **success** branch, not only the `catch` branch — logging
`mergedSha`/`mergedInto` right before the `moveWork` call, unconditionally.
This directly targets the gap `fgos-researching`'s Round 1 confirmed
(`docs/history/tsk-64o-mergedsha-diagnostic-logging/RESEARCH.md`): today
nothing durable is ever written when `moveWork` succeeds, which is exactly
the branch tsk-5dk actually took.

**Why this path, not an alternative:** the task's own description names
this exact shape ("ghi lại giá trị mergedSha ngay trước khi gọi moveWork
... bất kể thành công hay thất bại, không chỉ khi lỗi") — a locked
requirement from the item itself (`discovery` verdict `clear`, no
CONTEXT.md/`exploring` round exists for this item since discovery skipped
straight to `planning`). Alternatives considered and rejected:
- **A new separate log file just for this** — rejected: `approve-fault-log.mjs`
  already has the exact durable-log shape needed (plain
  `fs.appendFileSync`, no `events.lock` sharing, never throws into its
  caller) — reusing it is smaller and keeps one file, not two, as the
  place a person checks after a future recurrence.
- **Writing into `events.jsonl` itself** — rejected: the module's own
  header comment is explicit this is deliberately NOT `events.jsonl`
  (`.fgos/events.jsonl` is the FSM rebuild source; a diagnostic record has
  no business in it) — reusing that same reasoning here, not reopening it.

**Files touched, in order:**
1. `src/cli/approve-fault-log.mjs` — widen `recordApprovePostSuccessFault`'s
   record shape to accept an optional `mergedSha`/`mergedInto` pair (kept
   optional so the existing failure-path call site, which has no merge
   data on some failure branches, is unaffected), OR add one line accepting
   these two fields unconditionally — final field-naming is an
   implementation-detail choice inside Execute, not a plan-time decision
   (Step 6 of `fgos-coding-planning`'s own contract: this is not material —
   it does not change scope, behavior, data shape the item cares about, or
   acceptance criteria, only the internal record's exact key names).
2. `src/verbs/merge/approve.mjs` — 3 call sites (RESEARCH.md Round 1 has
   exact line numbers and citations for each):
   - `moveDeliveredOrRecordFault` (lines 74-99, covers both the
     leaf-into-root call at line 637 and the root-into-main call at line
     793): call the logging function unconditionally, right before line
     85's `moveWork(...)`, passing the already-computed `mergedSha`/
     `mergedInto`.
   - GitHub path (line 358): calls `moveWork` directly, not through
     `moveDeliveredOrRecordFault` — needs its own separate logging call
     right before this line, passing `result.mergeCommit?.oid` and
     `'main'`.
3. `test/verbs/merge/approve.test.mjs` — new assertion(s) that a successful
   local-merge `approve` (both leaf-into-root and root-into-main shapes)
   and a successful `--github` `approve` each produce one new record in
   the diagnostic log carrying the real `mergedSha` that was passed to
   `moveWork`.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `recordApprovePostSuccessFault` shape widen | light | existing failure-path callers still compile/pass unchanged (backward-compatible optional fields); `test/cli/approve-fault-log.test.mjs` if it exists, else covered by approve.test.mjs |
| 3 new unconditional log calls in `approve.mjs` | light | `moveDeliveredOrRecordFault`'s own doc comment already states it "Never throws into its caller" — the new log call must uphold that same contract (never let a log-write failure block or fail a successful `approve`); proven by a test that forces the log write to fail (e.g. read-only `dir`) and asserts `approve` still returns its normal success envelope |
| No regression to existing `approve.test.mjs` suite | light | `npm test -- test/verbs/merge/approve.test.mjs` full run stays green |

No medium/high-risk component — this is additive diagnostic logging on an
already-computed value, no new control-flow branch that changes whether
`approve` succeeds or fails.

## Shape

Single honest piece, no split (see below). Concrete cases to prove at
`fgos-coding-validating`/Execute, scaled to `small`:
- Successful `approve` (leaf-into-root shape) → new log record with the
  real `mergedSha`.
- Successful `approve` (root-into-main shape, the "verify skipped ..."
  fast path tsk-5dk actually went through) → new log record with the real
  `mergedSha`.
- Successful `approve --github` → new log record with
  `result.mergeCommit?.oid` (may legitimately be `undefined` per the
  existing accepted-rough-edge comment at `approve.mjs:353-357` — the log
  call itself must not throw or block success when this is `undefined`).
- Existing failure-path behavior (an `EventLogError` on `moveWork`, e.g.
  `lock-timeout`) — must still record via the SAME mechanism as today,
  unchanged, plus now ALSO carrying `mergedSha`/`mergedInto` (the value was
  already known before the failing call, this plan's whole point is
  capturing it regardless of outcome).
- Full `npm test` stays green (no regression elsewhere).

## Split decision

**No split.** This is one coherent, small change confined to 2 source
files + 1 test file, all inside the same feature (`approve`'s
post-success/failure diagnostic trail). Materializing separate child items
for "widen the log function" vs "call it at 3 sites" would fragment one
unit of work that only makes sense landed together — a partial land (e.g.
only the GitHub-path call site) leaves the log function's shape
half-committed with no caller exercising the new optional fields.

## Verify (the one command that proves this piece done)

```
npm test -- test/verbs/merge/approve.test.mjs
```

This item's own `verify` field already carries this exact command (synced
during `discovery`, `fgos discover --verdict clear --verify ...` — see
`fgos list --id tsk-64o --json`); it is real and distinct, not a
placeholder, so no re-sync is needed here per this skill's own Step 5
contract.

## Assumptions

- The exact field name(s) added to `recordApprovePostSuccessFault`'s
  record shape (`mergedSha`/`mergedInto` vs. something else) is an
  Execute-time implementation detail, not material to this plan — pinned
  here per Step 6's material/grounded/answerable filter rather than raised
  as a CONTEXT.md gap, since CONTEXT.md does not exist for this item
  (discovery verdict was `clear`) and no product-facing behavior hinges on
  the exact key name.
- This plan does NOT attempt to fix or explain the original tsk-5dk
  mystery (why that one real-world approve run under multi-session load
  produced no `mergedSha`) — the item's own description is explicit this
  is unreproducible today and the deliverable is diagnostic instrumentation
  for a FUTURE recurrence, not a root-cause fix. Any actual root cause
  found incidentally while implementing is a bonus, not a requirement this
  plan or its verify command depends on.

## Outstanding questions

None
