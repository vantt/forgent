# Review: Step 8 owner queue and owed repoint accounting

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792047735364-5c1a0eb5@2026-10-15
Review mode: ordinary
Request commit: 3c9b16c2c
Content commit: 1276467f37a99d19aff05808d42fafbf40341449

No sensitivity result is requested or supplied (ordinary review, none fabricated). This is a separate non-source accounting channel: the rows below apply no source verdict, approve no truth, retirement, promotion or cutover. Claim cells are entry IDs (or the real claim IDs where the request names them). Source digest cells are the digests printed in the request, recomputed by me; Target digest is none unless the request prints one. Seed for the hand-recomputed digest sample: 8841 (random.Random(8841).sample over the 44 entries of my five requests picked triage-10, triage-03, triage-14, a39-generated-route and generation-4; each recomputed independently with jq -c piped to sha256sum, all equal; the report entry also recomputed). The review worktree was read only at 2107c4761 (docs bytes equal the content commit).

## Scope and method

One entry (owner-queue.md as committed plus step8-owed-repoints.json). I confirmed the shown content equals owner-queue.md at HEAD and the owed JSON equals step8-owed-repoints.json. For the 249 captured references I checked every path and line against the worktree text (248 exact, one two-line comment at NeedsAnswer.tsx 7 to 8 as the queue says), and the 81 relative-link raw strings against their source files (81 of 81 present). I then searched the repo for the full paths of all 27 sources outside plans, archive, docs/platform and .fgos: every hit outside docs/history and CHANGELOG.md is in the list. I confirmed every consumer the request names is present (authority.mjs, backend-registry.mjs, policies.mjs and request.mjs line 2, registrations.mjs 5175, p04 and p05 tests line 3, routing-handoff-contract.md 88 section 9.2, errors.ts 3 citing herdr lines 259 to 260 which are the gateway-unreachable edge case, App.tsx 24, App.test.tsx 6, Taskboard.tsx 9 and 439, TaskDetail.tsx 9 and 487, NeedsAnswer.tsx 7). The tool-root claim is true: config.mjs finds the root by spec.config.yaml and surface_dirs lists screens, modals, components and flows, schema/ is required, and the candidate layout has none of that. Limits: I did not judge whether each cited section still exists after the split.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| owner-queue | rework | deep: the obligations and references are accurate, but three statements are stale or incomplete. (1) Row ui-generated-source-classification still says open validation blocker and that the Lead should land the generated role; A39 landed it in b4d758676 (switchboard now classifies all five generated files as generated, D and E report no file-class finding), so mark it resolved with that commit. (2) Row specs-ui-predecessor-gaps says three undisposed predecessors; the native sync found two already carry reviewed accounting (s4 successors and s5 boundary gaps shards) and one, the dashboard claim_7d5937c7, is pending, so restate it. (3) Neither owner-queue.md nor step8-owed-repoints.json records that the Observe candidate rebased the two links (../reference/discussion-quality-rubric.md and ../how-to/compare-discussion-setups-with-metrics-eval.md to ../../ at observe spec line 71), and both relativeLinks entries still say preserved verbatim; correct those two entries and add a queue line, and state whether the 78 line hits (24 files) in docs/history and CHANGELOG.md citing these sources are queued or deliberately excluded as dated records | 235cabcd3815b5b040fbdf26fdce45ec761152b73f1e7e12ad3148c884b9c1fc | none |

## Notes

The fixes are small edits to the queue and the owed JSON; the evidence digest will change and the entry should be re-requested. Nothing here reopens a decision: no obligation was found to be wrong, only status and completeness.

Unresolved: the docs/history and CHANGELOG.md exclusion needs an explicit statement by the author or Lead.
