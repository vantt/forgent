# Specs and UI carriage verification

Input commit: 111adc51fd047d99121fd9d076eb4794c87045a4. Output commit: runner settlement. Authoring checks only; native sync is explicitly deferred.

D fast: 5 generated file-class validation findings. E fast: the same 5, 566 pending source rows, one contextual identical-owner group, three inherited undisposed predecessor gaps, 136 local reverse-open units. No green or native-equality claim. All 27 source scopes match actual input paths. Raw output: step8-fast-check.json; precise root cause and obligations: step8-open-accounting.json.

Run the committed helpers from the repository root, with scratch/cache only under /tmp/fgos-work/:

```sh
env -u CLAUDE_CODE_SESSION_ID node plans/260925-documentation-authority-unification/reports/phase-06/step8-liveness-scan.mjs
env -u CLAUDE_CODE_SESSION_ID node plans/260925-documentation-authority-unification/reports/phase-06/step8-carriage-author.mjs
env -u CLAUDE_CODE_SESSION_ID node plans/260925-documentation-authority-unification/reports/phase-06/step8-fast-check.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-decision-conservation.test.mjs test/scripts/doc-decision-review.test.mjs test/scripts/doc-review-format.test.mjs
```

The first two helpers are authoring reproduction, not review and not safe to run over reviewed rows: use a disposable copy of the input tree 111adc51fd047d99121fd9d076eb4794c87045a4; they overwrite only this turn's candidate/authoring artifacts. Run the fast-check helper read-only against authored docs (it writes only its report JSON). No helper performs a native registry sync or git mutation. Full native D/E runs at the runner's actual committed tree next turn, with one --scope per source (all 27 arguments in step8-fast-check.json). Both prior registry checks in this fast run use the existing working registry, not a synthetic native registry.

Full source/target digest and heading-payload/line-range conservation assertions pass. Machine byte checks: 2/2. Front matter checks: 18/18. Existing tests: 44/44 pass, 0 fail/cancel/skip/todo; raw log alongside. No production code or tests changed. Stored working registry SHA256 remains b5b11092ccd69cf70bda295c50c614fb5d76a9b18440ae2ca6df3aa68ef96e54 (61217378 bytes), unchanged.
