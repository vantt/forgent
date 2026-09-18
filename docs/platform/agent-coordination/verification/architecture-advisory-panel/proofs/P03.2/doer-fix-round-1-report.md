# Cell P03.2 — Fix Round 1 (Doer Report)

Responds to `reviewer-findings.json`/`reviewer-report.md` (0 HIGH, 3 MEDIUM,
3 LOW, 2 info; verdict: protocol sound, no runtime safety defect). Per the
Coordinator's own instruction, this round addresses R1/R2/R3 (the three
MEDIUM findings) only — R4-R8 (LOW/info) are not in scope for this round and
were not touched.

Commit: `556e5bf9` (`core/coordination-protocols/architecture-advisory-panel-v1.yaml`,
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`).
No kernel file touched.

## R2 — `revise-explanation` real test coverage (fixed)

Added `over-cap reopen (explanation): revise-explanation admits exactly 2
invocations (activation.maxInvocations) and refuses the 3rd`, mirroring the
existing `revise-synthesis` over-cap test exactly: drives the full chain to
`explain-recommendation`, then authorizes+dispatches `revise-explanation`
twice (each producing a genuinely new, distinct Assignment — asserted
against the original `explain-recommendation`'s own id), then asserts a
third authorization is refused with the `maxInvocations` message and writes
zero new events. Closes with a `replaySession` reconstruction proving all
three Assignments (original + two reopens) coexist, distinct and readable.

**Verified the fix actually closes the phantom-shaped gap, not just adds a
passing test:** temporarily removed `activation.maxInvocations: 2` from
`revise-explanation`'s own binding in the YAML, re-ran the conformance
suite — the new test failed exactly as expected (12 pass, 1 fail:
the new test, alone) — then restored the file byte-for-byte
(`diff` confirmed identical) and re-ran to confirm 13/13 green again. This
is the same "prove the test would fail without the fix" discipline this
track's own Fix Rounds already use elsewhere (e.g. P03.1 Fix Round 1).

The two open questions the Reviewer raised were answered by the
Coordinator before this round started: `revise-explanation` is a real,
needed capability (both P01.2 and P01.3's real dialogue sessions revised
BOTH synthesis and explanation), so it is kept and proven, not dropped.

## R1 — stale operator guidance in the shipped YAML (fixed)

Rewrote the `grantedContextRefs`/`human-turn:` decision paragraph in the
FlowDefinition's own header comment. The prior text told a driver a
`disposition` step "may cite `human-turn:<turnId>` today" as step (1) of an
"intended sequence", and attributed the avoidance of `grantedContextRefs`
to that channel being merely "unchecked". Both are corrected:

- The charset check (`SAFE_ID_RE`, `src/verbs/coordination/schema.mjs`)
  refuses BOTH reserved namespaces (`human-turn:` and `contribution:`), in
  ALL THREE ref fields (`authorize.grantedContextRefs`,
  `disposition.targetRef`, `disposition.evidenceRefs`), for EVERY protocol
  — not merely `grantedContextRefs`, and not merely "unchecked". This
  matches the Reviewer's own live probe against the real validator exactly.
- Named the gap `tsk-44p` explicitly in the comment (per the Coordinator's
  own answer: no separate blocker-list entry needed beyond citing the
  already-filed id).
- Also updated the adjacent "Specialists" paragraph to name `tsk-3xk` for
  the sibling missing `specialist-authorize` step type (R8), since both
  gaps block the same class of door and the Reviewer's own report groups
  them together; this is a doc-accuracy addition, not new scope.
- Stated plainly that the ONLY channel available today to document which
  human turn authorizes a reopen is the `authorize` step's own free-text
  `reason` field — matching what the conformance test and doer-report.md
  already did correctly (the drift was in the YAML alone, exactly as R1
  found).

Reloaded the definition after editing (`loadCoordinationProtocol`) to
confirm the comment-only edit did not break normalization — it did not.

## R3 — tighten two under-specified rejection predicates (fixed)

Both `err instanceof CoordinationError` (no message check) predicates are
now pinned to their real, verified error messages:

- **Specialist dispatch refusal** (line ~566, now
  `/is bound to specialist slot "specialist-answer-slot" -- no specialist
  is currently authorized/`): live-probed the real message via a direct
  `dispatchDeclaredOperation` call before pinning it, confirming it is
  produced by `resolveDeclaredOperationActor`'s own `unboundSlotMatch`
  branch (session-engine.mjs), not the generic
  "no unconsumed operation-authorized event" message a missing plain
  authorization would produce. This message is intrinsically slot-gate-
  specific — it cannot be produced by a missing operation authorization —
  so pinning it achieves the isolation R3 asked for.
  - **Deviation from R3's literal recommendation, disclosed rather than
    silently taken:** the Reviewer's suggested mechanic — "additionally
    authorize the OPERATION but not the SLOT in the negative arm" — is not
    achievable as written. `authorizeDeclaredOperation` resolves the actor
    through the SAME `resolveDeclaredOperationActor` function `dispatchDeclaredOperation`
    uses, so attempting to authorize the operation before the slot is
    authorized throws the identical `unboundSlotMatch` error at the
    authorize call itself — there is no code path that lets an operation
    be authorized against an unauthorized specialist slot. Confirmed by
    reading `authorizeDeclaredOperation`'s own body (it calls
    `resolveDeclaredOperationActor` at the same point). The message-pinning
    fix achieves the SAME test-power goal (this test can no longer pass for
    a different underlying reason) through the mechanism the code actually
    supports.
- **Never-recorded human-turn disposition refusal** (line ~857, now
  `/names human turn "turn_never_recorded", which coordination session
  ".*" never recorded/`): pinned to `assertDispositionRefOwnedBySession`'s
  own message (store.mjs), read directly from source before pinning.

## Tests

New/updated conformance suite:
`test/verbs/coordination-architecture-advisory-panel-conformance.test.mjs`
— **13/13 pass** (was 12; +1 for R2), including the message-pinned R3
predicates and the R2 regression-proof described above.

Focused command
(`test/runner/coordination-*.test.mjs`, `test/verbs/coordination-*.test.mjs`,
`test/cli/coordination.test.mjs`, `test/architecture.test.mjs`):
**757/757 pass, 0 fail** (up from 756 — the one new test), zero
regressions. Every pre-existing RFC-Review-Lite/Nominal-Group-Lite/
Delphi-Feedback-Lite/standalone-master-coordination-loop conformance test
inside that same glob still green, byte-identical behavior.

## Impact Analysis / detect_changes

No kernel symbol touched (YAML comment + test-file edits only). Staged
`detect-changes` (`--scope staged`, only this round's 2 files staged,
resolved against the real indexed repo
`/home/vantt/projects/forgentX` per `gitnexus list`): **"No changes
detected."** Consistent with a prose-comment edit plus test-body edits
inside already-indexed files producing no new top-level symbol for
GitNexus's own extractor to report (the same class of result the R2 fix
round's own test-body-only changes would be expected to produce); not a
sign the diff was skipped — `git diff --stat` for this commit
(`556e5bf9`) confirms exactly the 2 intended files, 150
insertions/27 deletions, matching this round's own described scope.

## Unresolved Questions

None carried forward from this round. The Reviewer's own two open
questions were both answered by the Coordinator before this round began
(keep `revise-explanation`; no separate blocker-list entry for R1/R8
beyond the already-filed `tsk-44p`/`tsk-3xk`).

Status: DONE
Summary: Fixed all three MEDIUM findings (R1 stale YAML guidance, R2
missing revise-explanation coverage, R3 weak rejection predicates);
13/13 new-suite pass, 757/757 focused-suite pass, zero regressions, no
kernel change.
Concerns/Blockers: None. R4-R8 (LOW/info) intentionally left untouched,
per the Coordinator's own scope instruction for this round.
