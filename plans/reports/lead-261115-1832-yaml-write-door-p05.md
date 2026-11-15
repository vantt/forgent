# Phase lead report: case answer writer (yaml-write-door p05)

Branch `yaml-write-door/p05`, base integration head 09e22e726.

- `renderAnswerFile` (`src/workflow/case-runtime.mjs`) now returns `writeFrontmatter(meta, body, file)`; no fence literal left. Meta is coerced (integers kept, otherwise `String(...)`; `subjectDigest` string, `none` default; `approved` yes/no). JSDoc names the remaining crate-limit refusals as propagating.
- Red commit 1ffcf7207: new case "a malformed round file in the gate inbox does not break the answer view" (fails with `frontmatter-not-round-trip`). Fix b2cb17ff7: green.
- Byte regex at test `:44` unchanged and green. Census regenerated per commit.
- Gate (one file per run, all green): case-runtime (20), fgos-case-doors (6), git-mutation-census, architecture (60), doc-health (8), decision-citation-drift (33), test-proof-inventory (31); one-door scan 0 undeclared. No Rust changed; no full npm test run.
- User-visible CHANGELOG line: none.

## Lessons
- The malformed-round case only reaches the render when a good round folds beside it (the drain renders only folded gates); plan text did not say so.
- Plan red step ("switch writer without coercion") works well as a red pair.
