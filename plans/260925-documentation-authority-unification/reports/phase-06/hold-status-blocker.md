# Hold review-status contract blocker

Date: 2026-10-07
Executor: codex-session:1@2026-10-07
State: stopped for an owner amendment; not ready for full tooling review
Last green tool/conservation commit: `789870507`

## Conflict and stop basis

The phase file's Shared rules / Decision shards and review says `--apply-review` leaves both `rework` and `hold` rows `pending`. Its terms table defines a hold as `unknown-blocking` with `reviewStatus: blocking`. The frozen vocabulary defines blocking as an unknown disposition or ambiguous identity, and pending as a proposed disposition awaiting review.

The existing invariant in `scripts/check-doc-inventory-gates.mjs` (`applyDecisions`, the `decision-blocking-status-mismatch` checks) requires unknown-blocking to remain blocking. Following the review procedure literally changes an unresolved held row to pending and produces a fatal finding. At batch close this finding is not an allowed hold-list conservation count; checks D and E cannot accept the row.

Changing the invariant would be a frozen-semantic change not authorized by the tooling table. Changing the review procedure requires an owner contract amendment. The executor stops under the owner's explicit frozen-rule stop instruction; no gate or vocabulary rule is weakened. This is not the full tooling ready-for-review checkpoint, and no independent review is claimed.

## Reproduction

Executed command:

```sh
env -u CLAUDE_CODE_SESSION_ID node /tmp/phase06/hold-status-probe.mjs
```

Exit 1. The fixture has one unknown-blocking row, originally blocking, with a different fixture author/reviewer identity. The actual exported `applyReviewVerdicts` receives verdict hold and emits pending. Passing that output to the actual exported `applyDecisions` produces exactly one finding:

```text
inputStatus: blocking
holdStatus: pending
decision-blocking-status-mismatch: disposition unknown-blocking needs reviewStatus blocking, found pending
```

No real shard is changed, no actual approval is issued, and no real reviewer session is impersonated. The scratch probe uses deterministic fixture identities and has no document writes. The same branch also affects verdict rework on an unknown-blocking row; that case is INFERENCE from the shared implementation, not separately exercised.

## Recommended amendment

Keep the frozen invariant. Amend only the review procedure/tool contract:

> For verdict hold or rework, unknown-blocking rows retain reviewStatus blocking; rows with another disposition retain reviewStatus pending. In both cases record the review note without reviewedBy/reviewedAt. A held unknown-blocking row goes to the hold list and owner queue.

Then add a failing-before/passing-after regression for the observed hold case, implement the exception in `applyReviewVerdicts`, and prove the held output passes the unchanged decision gate. No change to `loadPreviousRegistries`, vocabulary definitions or source extraction is needed.

Alternative: allow pending unknown-blocking in the gate. Not recommended: it changes the frozen status invariant and requires broader authorization. No alternative is selected by the executor.

## Reachable work already committed

| Tool | Red test commit | Implementation commit |
|---|---|---|
| Repeated decision inputs | `73416e048` | `8dcf162c4` |
| Evidence mirror proof | `abc229123` | `b40b5af29` |
| Exact-carry proposal/summary | `1f147b961` | `db5ef01d4` |
| Independent review packs/verdicts | `de2c92e81` | `b828e4896` |
| Coverage/rebind/snapshot | `7e94480f0` | `789870507` |

The hold edge above remains a contract blocker in review application; the implementation is not represented as fully reviewed or finished tooling.

After `789870507`, `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` (46 files expanded with Node) passes 803/803, default concurrency. The suite does not yet cover this discovered conflicting hold edge. Log: `/tmp/phase06/helper-suite-after-commit.log`.

Both A1 D invocations after that commit exit 0, have 0 fatal findings and parsed JSON exactly equal to the baseline:

```sh
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --previous-registry plans/260925-documentation-authority-unification/reports/identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --json
node scripts/check-doc-inventory-gates.mjs --inventory /tmp/phase06/doc-inventory.json --identity-registry /tmp/phase06/identity-registry.json --previous-registry plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json --decisions plans/260925-documentation-authority-unification/pilot/decisions --json
```

Scoped strict E is due at batch close, not this unfinished tooling checkpoint: UNPROVEN. It will use both A1 prior-registry proofs.

Isolation A: no disallowed own paths. B: all five extractor blobs equal baseline. C: no area-status changes. Ratchet: exit 0, 995 files, 24 accounted edits, 1 accounted new file. Placement: exit 0, 446 files, 445 matched, 0 leftover/ambiguous/evidence-without-index, 1 recorded exception. Candidate status: unchanged baseline 5 findings (3 missing promotion fields, 2 unresolved links).

## Owner/reviewer routing and next step

Owner queue: `hold-review-status` is the only open question. Archive/delete decisions: none authored. Real conflicts: no new conflict resolution authored; SC-1 remains owner-resolved, correction deferred to its authorized batch. Claim holds: none authored. Promoted-document edits: none. No main checkout writes, push, PR, merge or authority flip occurred.

For this blocker, review the phase file's hold definition and review procedure, the frozen vocabulary's review statuses, `scripts/propose-doc-decisions.mjs::applyReviewVerdicts`, `scripts/check-doc-inventory-gates.mjs::applyDecisions`, and `test/scripts/doc-decision-review.test.mjs`. The later full independent tooling review must also include all new decision tests, additive pilot schema changes and remaining tools; no full review report is requested yet.

Next: owner commits a narrow amendment in `owner-answers.md`; the executor fixes and proves the review-status edge, updates progress, then resumes sequentially with corpus-rule tooling and all remaining tools/maps. Only after full acceptance does the executor stop at ready-for-review and request `review-tooling.md` from a different session.
