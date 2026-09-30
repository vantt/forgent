# Reviewer recheck — P04.1 writerId-hijack fix (HIGH-1) + resume-against-broken-session (LOW-1)

Track: step-09-mvp3-to-mvp5. Cell: P04.1. Branch: step-09-mvp3-to-mvp5.

## What was rechecked

Independently re-verified the Fixer's fix against the actual current
`src/verbs/coordination/run.mjs` diff (not the Fixer's report prose):

1. `findExistingManifest(coordinationId, writerId, engineOpts)`
   (`run.mjs:130-146`) asserts `manifest.provenanceRoot.writerId !==
   writerId` and throws `CoordinationError('validation', ...)` before
   returning a manifest. Both call sites — agent-led (`run.mjs:249-251`)
   and declared-protocol (`run.mjs:303-305`) — invoke it as the first
   action of their branch, strictly before any dispatch/authorize/
   disposition call.
2. Checked for a bypass via absent/null `request.writerId`: not
   constructible — `schema.mjs:474-475` requires
   `isNonEmptyString(raw.writerId)` inside `validateCoordinationRequest`,
   which runs before `findExistingManifest` is ever reached. Checked the
   other side too: `manifest.provenanceRoot.writerId` is always a
   non-empty string for any resumable session, since it was set from the
   same required field at open time (`store.mjs:237`). No
   `undefined !== undefined` false-negative path exists.
3. Read the HIGH regression test in full
   (`test/verbs/coordination-run-driver-steps.test.mjs:690-750`) — it
   genuinely asserts zero side effects from the rejected attempt
   (`assignmentRefs.length` unchanged, `.fgos/assignments` dir count
   unchanged, `operation-authorized` event count unchanged), then proves
   the gate is identity-specific (a legitimate resume under the real
   `writerId` still completes normally).
4. Read both LOW regression tests in full (lines 752-790 of the same
   file) — malformed-JSON and missing-`session.json` shapes are both
   genuinely constructed on disk and both assert fail-closed with the
   correct `CoordinationError` category/message, never a silent fresh
   open.
5. Re-read `run.mjs` end to end for new inconsistencies — none found; the
   step-processing loop and close/quorum tail are unchanged, only
   `findExistingManifest`'s signature and internal check are new.
6. `git status --porcelain` confirms scope: only `run.mjs` +
   `coordination-run-driver-steps.test.mjs` +
   `coordination-run-live-proof.test.mjs` (plus this track's own
   Coordinator-owned docs and unrelated concurrent-session noise).

## Tests run (foreground)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/runner/coordination*.test.mjs' 'test/verbs/coordination*.test.mjs'
-> tests 367 / pass 367 / fail 0
```

Matches the Fixer's own reported count (364 baseline + 3 new).

## Verdict

- HIGH-1 (writerId hijack via resume): **CONFIRMED-RESOLVED**
- LOW-1 (resume-against-broken-session test coverage): **CONFIRMED-RESOLVED**
- Final: **APPROVE**

Full recheck writeup appended as `### Reviewer Recheck` at the end of
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P04.1.md`
(nested under the existing `## Review (Reviewer)` section).

## Unresolved questions

None.
