# Review 4: packaging rationale follow-up

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:11@2026-10-14
Review mode: ordinary
Request commit: a7619af4a
Content commit: 478c54d67

## Scope and method

Three rationale-only rows in s4-packaging-distribution-architecture.json, as requested after review-4-packaging-followup.md (which asked each rationale to name the labelled status notes added to the target).

- Shard diff: parsed the shard at d57231686, 478c54d67 and a7619af4a. For each of the three claims the only changed field between d57231686 and 478c54d67 is `rationale`, and the row is identical at 478c54d67 and a7619af4a. Recomputed compact sorted-JSON SHA256 of each current row equals the request's current-decision hash (b1ddbf1e..., 251c3e11..., d03eb21b...), and the before hash equals the request's before hash. Other changed rows in the shard are only the 12 applied-review rows (review fields), not in this group.
- Docs trees: `git diff` on docs is empty for d57231686 to 478c54d67 and 478c54d67 to a7619af4a, so no target or source text changed.
- Digests: ran extractMarkdownConservationUnits (scripts/generate-doc-inventory.mjs) over the committed source and target files; textDigest of all six units equals the request's unit digests.
- Anchors: `list-doc-anchors.mjs --check` returned ok for all three source and all three target anchors.
- Truthfulness: diffed the source section against the target section. Differences are exactly (a) heading depth ## to ####, (b) the Retained dated design status note inserted before "During preparation" (block 25, prepended), (c) the Status note appended at the end of the "In that context" paragraph (block 27). The init.rs:431-446 citation matches the preflight_candidate doc comment (static, never runs candidate code, env-var bootstrap context never honored).
- Worktree `git status --short` is empty.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_e4bf9b812f0b787bcf56246677865361 | ok | Rationale now names both labelled notes with correct placement and dates; target diff is heading depth plus those two notes only; only rationale changed vs d57231686. | 57af5b1c65fd1dda38b5e2fa7e5231049f66141d34f71578f2509b78a4994305 | 32761eb7cc5ab63a191f4a707e6e56cf65a32c3dd5d605aa5558346377edfb40 |
| claim_3673677485dd4449067c9e5074623e1a | ok | Rationale truthfully says the Retained dated design note is prepended to block 25 and says source design versus static preflight; source sentence kept verbatim; only rationale changed. | a1e7ae9c98f45bb7c6b136fec8f222dffea7be454b7288a802983db5a7e43599 | 273e89aa19e81dcc743483fe3e51606dcf949278cadecb37a885aa39014cec2b |
| claim_107a23bb29dcf6db15e2471d7e77590b | ok | Rationale truthfully says the Status note is appended after the permission and must-not text (same paragraph, inline) and that the must-not obligation is retained; source sentences verbatim; only rationale changed. | ccb205fdc5120e6287ab2067b178cb8c998e156c606d0282c8d7e02821feece0 | 6fbabae72e49d14c8ea861f42ffc8ee4180d3b83c968871b6ea38ace19b92d9a |

Minor non-blocking observation: in row 1 the second note is described as "after the candidate permission paragraph"; it sits inline at the end of that paragraph, not as a separate block. Accurate enough, no change required.
