# Review step 10 re-review tools part 1 (helper and scan changes)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792093168554-f28af963@2026-10-16
Review mode: ordinary
Request commit: c939e9a51560a124e3723ba69ce39a202a1b7efc
Content commit: 345f15d95663260976200be66d1b9a6c648bcd6d

## Scope and method

Request reviewed: review-request-step10-tools-01-345f15d95.md (3 tool-fix-and-regression-tests entries; md blocks equal the json sidecar; every currentSHA256 equals the committed file). Read-only worktree at c939e9a51; no sensitivity pack requested or made. Item rows with the entry id as first cell; the target digest is the sha256 of the first listed file of the entry.

Checks: read each script and test in full at HEAD and the diff 4a18f35ff to 345f15d95; ran the exact seven-file node --test command with TMPDIR in my scratch dir and CLAUDE_CODE_SESSION_ID unset: tests 88, pass 88, fail 0, equal to the pack's testResults and to step10-sync345-tests.log; probed doc-link-pass in scratch with four inputs; reproduced the liveness scan's new assertion outside the script. I did not use the fgos CLI. The seven-file run left an untracked file reanchor.json in the worktree root, created at 03:17:53 while I was running; its content is a list of s3-host-invocation-boundary-gaps rows that none of these tests write, so I believe it comes from another reviewer working in the same worktree and I did not touch it; it was gone again by the end of my review.

Seed and sample: all 3 entries read in full; no Weak-exact or Judgment rows exist in this request.

Result: 3 ok, 0 rework, 0 hold.

## Item table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| tool-binding-and-rationale | ok | deep: scripts/doc-binding-repair.mjs (new, 53 lines) read in full with its 9 tests. bindByContent binds by the prior target digest, falls back to prior text, then source text, resolves repeats by reviewed ancestry and then by occurrence order only when prior and current repeat counts are equal, and throws otherwise, so a stale positional anchor is never reused (tests: inserted paragraph, repeated footers, stale anchor with ancestry, stale anchor without ancestry rejected); updateRationale keeps the reviewed text when owner and digests (prefix-tolerant, 16 or more chars) are unchanged and demands specific text otherwise; targetCollisions and replayLinks do what the tests show. I ran the 7-file command and got 88 tests 88 pass 0 fail, the same as step10-sync345-tests.log. Limits seen, not defects: bindByContent compares u.text which the extractor does not emit, so callers must supply text (without it the text fallback would match every unit and only a single-unit file would bind wrongly), and replayLinks replays destination edits only, not label edits. | none | 63259380fd91b8efe493a6201f427bf7648147caf0b0c9b7e0f04ce149428938 |
| tool-per-cell-link-semantics | ok | deep: scripts/doc-link-pass.mjs diff read in full: bare legacy removed from the relationship pattern, the link-label rule moved from whole-cell protection to per-link (relation.test(label)), prose relationship only when a colon-ended prefix names source, row and column rules kept; two new tests (prose destination and bare legacy name do not protect, a relationship label protects only its own link in a cell) pass in my run of the 88 tests; I probed it in scratch: a column headed Legacy source protects only that column, a link labelled source-notes is retained, a label that is itself a raw path containing the word original is also retained (the safe direction, not a conservation risk, but slightly broader than the stated 'raw destinations excluded'). | none | 90c4821cac2f9e9e5a039cfa42af6ac896dd0acc38d8a8374c9e0c96af302555 |
| tool-registered-liveness-tuples | ok | deep: step9-liveness-scan.mjs diff read in full: the sync commit now comes from working-identity-registry.json commit (345f15d95, an ancestor-or-equal of HEAD; the old fixed 63fa6f152 is its ancestor) and the fixed 495 units and 166 headings assertion is replaced by equality of the extractor output for docs/specs/runner.md with the registry's 497 unit tuples of anchor and digest; I reproduced that equality independently (497 of 497, 167 headings, equal). The unchanged doc-runner-liveness test runs the real script into a scratch dir and passes in my run. The pack lists the test file with an empty diff, which is accurate (unchanged). | none | 179aae7a0b6f377352003bdd70d59898036da7099625d63946c11a7f96568d6c |

## Notes

- The three systemic defects of the previous round map to these tools: positional anchors (bindByContent plus the repeated-footer tests), swapped cells (replayLinks plus the per-cell relation rule), false boilerplate rationales (updateRationale). The data results of those tools were checked in the anchors, links and documents reports, where a whole-corpus sweep found 0 of 9185 digest-carrying rows pointing at a wrong unit.
- Optional hardening for the author: make bindByContent throw when units lack a text field, and let replayLinks accept label edits.
- Worktree hygiene: git status --short in the review worktree was empty at the end of my review (the foreign reanchor.json seen mid-review had been removed by its owner).

Unresolved: none.
