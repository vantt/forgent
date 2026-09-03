# Reviewer report — P04.1 (MVP5 resume live proof)

Cell: P04.1. Track: step-09-mvp3-to-mvp5. Base: 52a1db76.

## Verdict: BLOCK

Full findings, evidence, and code citations are in the `## Review
(Reviewer)` section appended to
`docs/architect/agent-coordination/verification/step-09-mvp3-to-mvp5/P04.1.md`.
This report is a short pointer/summary; the file above is authoritative.

## Summary

Independently re-derived every load-bearing claim in the Doer's report
from the actual diff and engine code (not from the report's prose alone):
`findExistingManifest` genuinely reaches the same
`dispatchDeclaredOperation`/`authorizeDeclaredOperation`/
`recordDriverDisposition` doors (no parallel path), the `not-found`
detection correctly distinguishes a genuinely-new id from a broken
session (verified via the closed set of `CoordinationError` categories),
`aggregateBounds` inertness on resume is real (verified by grepping every
enforcement site plus a non-vacuous test), and R5's three new tests are
non-vacuous. Ran both the scoped coordination suite (364/364 pass) and
the full suite (5194 tests; only the recorded baseline failure plus one
confirmed load-induced flake, `test/report/enduser-index.test.mjs`,
re-verified 19/19 pass in isolation) myself, in the foreground.

While this review was in progress, an independent Red-Team pass (also
appended to the same `P04.1.md` file) live-reproduced a genuine
authorization-bypass: a resumed request carrying a `writerId` different
from the session's own `manifest.provenanceRoot.writerId` reaches
`dispatchDeclaredOperation` for an ordinary `operation`/`fan-out` step and
silently consumes the ORIGINAL driver's still-unconsumed
`driver-authorized` grant under the caller's spoofed identity — no
authorizationId/invocationKey knowledge required, only the
`coordinationId` and the protocol's public operation/actor names. Before
this cell, this request shape was impossible to construct (any second
call to an existing `coordinationId` died at `openSession`'s "already
exists" guard before reaching a single dispatch call, regardless of
`writerId`). I independently re-verified the underlying mechanism (no
`writerId` check anywhere in `dispatchDeclaredOperation`'s authorization
resolution or in `createSessionAssignment`) and concur with Red-Team's
severity call. My own review had flagged this exact code path (the R5
"related question" on writer-identity asymmetry the dispatch explicitly
asked me to assess) but, based on the Doer's own "pre-existing, not new"
framing, had originally scored it LOW rather than HIGH — revised in an
addendum in the same file once Red-Team's live proof landed.

## Findings (revised, final)

- **HIGH-1** (concurring with Red-Team): missing caller-identity check at
  the resume boundary lets a foreign `writerId` dispatch into — and
  consume authorized-but-unspent grants from — someone else's session.
  Fix: assert `request.writerId === manifest.provenanceRoot.writerId`
  when `findExistingManifest` resolves an existing manifest, before any
  step is processed. Small, `run.mjs`-only, no new engine plumbing or
  contract-level decision needed.
- **LOW-1**: resume-against-a-broken-session (corrupted `session.json`,
  dangling/foreign ref) is proven correct by code inspection (the closed
  `CoordinationError` category set) but has no direct test. Non-blocking;
  Red-Team's own separate section in the same file already exercised this
  live and confirmed it holds.

## Scope confirmation

`git status --porcelain` / `git diff --stat`: only
`src/verbs/coordination/run.mjs`, `test/verbs/coordination-run-driver-steps.test.mjs`,
`test/verbs/coordination-run-live-proof.test.mjs`, and one `CHANGELOG.md`
line changed in this cell's own scope (plus `P04.1.md` itself). No diff
to `session-engine.mjs`/`store.mjs`/`replay.mjs`/`schema.mjs`. All other
modified/untracked paths in the working tree match the dispatch's own
"other concurrent sessions, confirmed harmless" list.

Status: DONE
Summary: BLOCK — resume mechanics are sound (verified independently: same doors, no dup Assignment/invocationKey/disposition loss, aggregateBounds inertness, clean concurrent-resume), but concur with Red-Team's HIGH-1 (live-reproduced foreign-writerId authorization hijack through the new resume door) after re-verifying the underlying code myself; fix is small and well-scoped. 1 HIGH, 0 MEDIUM, 1 LOW.
