# Independent recheck 4 — Units 0D, 1A, 1B

Date: 2026-09-21  
Reviewer: independent review-only session  
Final verdict: **BLOCKED**

This report is additive. It does not modify or supersede
`units-0d-1b-independent-recheck-3.md` or the implementer discharge report.

## 1. Current HEAD / dirty state / fingerprint

- Branch: `main`
- HEAD: `a74a265ab0e06983e2beb565edbce4318e8537d7`
- Staged: none at review start.
- Start: 29 tracked dirty paths; tracked diff SHA-256
  `bfd3d3d55a6b57b674b8add9889801be7629aa3756c78df87eea1ed9126a8ed1`;
  porcelain SHA-256
  `e57b6bd114be4ab76688b8b9e6f491ea097db0c0bc323fccc25dadf898e253da`.
- During review the checkout changed to 31 tracked dirty paths. Final observed
  tracked diff SHA-256 became
  `8dc718e405a3718165e05d5a22535a8dbbf0c6f18b9a653f5ce00ecf6b32ded9`;
  porcelain SHA-256 became
  `f479320970378323b476251ad3851c2fff4b40423bf282321c12d2f5ab537f45`.
- New concurrent changes appeared in
  `docs/distillery/comparison-matrix.md`, `docs/distillery/porting-log.md`, and
  `docs/distillery/sources/okf.md`.
- `.fgos/main-checkout.lock` remained a session-token lock. Multiple live
  fgOS/test processes were visible while the checkout changed.

The charter requires stopping when another process writes the checkout or the
fingerprint changes. That condition occurred; no approval/rejection conclusion
about a stable proposed snapshot is possible.

## 2. Files reviewed

- All originally required coordination doctrine/contracts/plans and prior unit
  reports.
- `units-0d-1b-independent-recheck.md`
- `units-0d-1b-recheck-discharge.md`
- `units-0d-1b-independent-recheck-3.md` (preserved unchanged)
- Current legality, projector, precondition, session-engine, store, actions,
  run, close, schema, show source and focused tests.

## 3. Impact / blast radius and index freshness

GitNexus status was current with HEAD `a74a265`, but not with later concurrent
working-tree writes. `detect-changes --scope compare --base-ref main` reported
29 files, 79 symbols, 6 affected processes, risk HIGH.

All requested impact queries returned CRITICAL/highly over-expanded result
sets for most symbols (hundreds of alleged direct callers, including unrelated
setup/runner flows). Text inspection confirms real production reach through
actions, close, run, setup validation, master-loop, group-thinking, and
headless adapters. Because the worktree changed after the graph snapshot, the
impact result is **partial**, not current proof.

## 4. Unit-by-unit verdict

| Unit | Verdict |
|---|---|
| 0D | **blocked** — provisional source review agrees one-source legality is substantially repaired, but snapshot did not remain stable |
| 1A | **blocked** — provisional HIGH fan-out/action-surface issues remain |
| 1B | **blocked** — provisional CRITICAL production-authority/atomicity issues remain |

## 5. Finding matrix

### B-01

ID: B-01  
Severity: **CRITICAL**  
Category: review evidence stability  
Affected unit: 0D / 1A / 1B  
Affected contract: stable checkout and reproducible test evidence  
Source evidence: tracked diff fingerprint changed from `bfd3d3d5…` to
`8dc718e4…`; new distillery paths appeared during this review.  
Test evidence: full `npm test` observed a transient plugin mirror file
`scope-and-reclaim.md.tmp-446134-1789966177219-orirwk5qnq`, causing
`test/skills/fgos-mirror.test.mjs` to fail while another process was writing.
The temp file later disappeared, which itself confirms concurrent mutation.  
Why current proof is insufficient: focused and full results were not produced
from one stable fingerprint.  
Required fix: stop/finish the writer, establish one stable checkout snapshot,
then rerun the entire review and all test gates.  
Blocks Phase 2 implementation: **yes**

### P-01 (provisional)

ID: P-01  
Severity: **CRITICAL**  
Category: second mutation engine / production authority  
Affected unit: 1B  
Affected contract: action composer must use existing validated request and
kernel mutation paths, not direct store mutators  
Source evidence: `executeCoordinationActionUseCase` calls
`createSessionAssignmentLocked`, `authorizeOperationLocked`,
`recordHumanTurnLocked`, `recordContributionLinkLocked`, and
`recordDriverDispositionLocked` directly. It does not call
`validateCoordinationRequest`, `runCoordinationUseCase`,
`dispatchDeclaredOperation`, or `dispatchResearchFanOut`. Dispatch actions
create Assignment records but do not execute a Run.  
Test evidence: integration tests assert store/event creation; they do not prove
executor execution or the existing run kernel path.  
Why current proof is insufficient: direct store writes bypass current dispatch
legality, execution, result-linking, and request validation.  
Required fix: rewire the semantic door to lock-aware versions of the existing
run/dispatch kernel paths and validate the current raw request shape.  
Blocks Phase 2 implementation: **yes**, if reproduced on the stable snapshot

### P-02 (provisional)

ID: P-02  
Severity: **HIGH**  
Category: fan-out / human-turn / authority compatibility  
Affected unit: 1A / 1B  
Affected contract: exact fan-out target, artifact provenance, single driver channel  
Source evidence: fan-out loops raw `createSessionAssignmentLocked` calls and
does not invoke the cohort planner; human-turn defaults revision to an all-zero
SHA-256 instead of hashing artifact bytes; close synthesizes an identity from
`writerId`; unkeyed public close still bypasses the action seam.  
Test evidence: two-process test races two different action kinds/keys; there is
no same-key production fan-out or crash-after-commit proof.  
Why current proof is insufficient: these paths do not establish current kernel
target, provenance, authority, or durable retry semantics.  
Required fix: use the existing kernel doors and add same-key two-process plus
crash/retry tests through those production doors.  
Blocks Phase 2 implementation: **yes**, if reproduced on the stable snapshot

## 6. Tests run and exact results

- Required focused suites: **135 pass, 0 fail**, duration
  `44903.025503ms`.
- Repair-adjacent suites: **206 pass, 0 fail**, duration
  `102526.028601ms`.
- Full `npm test`: **failed** during concurrent checkout mutation. The visible
  failure was `test/skills/fgos-mirror.test.mjs`, caused by a transient extra
  `.tmp-*` file under the plugin mirror. The run is not valid Phase 2 evidence.
- `git diff --check` is deferred because the snapshot became unstable.

## 7. Evidence quality assessment

Focused coordination tests are green, but approval-critical tests still prove
store-level callbacks/helpers rather than the established dispatch/run kernel.
More importantly, all evidence is contaminated by a changing checkout. The
other independent reviewer’s `REQUEST CHANGES` report remains preserved and
is consistent with the provisional source findings above.

## 8. Phase 2 design ready

**Cannot be newly concluded from this unstable snapshot.** Prior stable review
said yes; this review does not supersede it.

## 9. Phase 2 implementation ready

**no evidence of readiness.** Final status is BLOCKED, not an approval.

## 10. Exact remaining gate

Obtain a stable, single-writer checkout; capture one fingerprint; rerun focused,
repair-specific, and full suites; rerun GitNexus; then independently resolve or
confirm P-01/P-02 and the findings in `independent-recheck-3.md`.

## 11. Recommended next action

Let the active writer/test work finish and request another recheck. Do not
clean/reset/delete the transient or unrelated changes as part of this review.

## 12. Final verdict

**BLOCKED**

The checkout changed during review and full-suite evidence was invalidated.
No existing reviewer report was edited or removed.
