# review-a38-step-02f-map-replay

- Reviewer: reviewer:sonnet-session:a01bb99e3db6c52cb@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached at b7281a9219a7fdf2fa7592c2f4e05ff73b255a4b (author 4d3520d67, accounting b7281a921). No write in the worktree; tracked tree clean.
- Script sha256 (all equal to step-02f-verification.json pins): parser b23d403d..aa4; packet 46d70511..ff; probes bf04d90b..4ff4; replay 12e4f31f..e3c.
- Read-only confirmed: parser/packet/probes/replay have no file writes; the parser only runs `git ls-files`, `git rev-parse`, and a `node` stat/read snippet.

## Replay (env -u CLAUDE_CODE_SESSION_ID, once, ~3.5 min)
Status FAIL, 3 failures, rc 1:
1. Full census differs from the read-only reparse.
2. review-data downstream stale.
3. mapping-review-index downstream stale.

Cause (diffed with parser.build()): exactly 2 of 5,436 entries plus 1 targetChecks key plus the action counts differ.
- `maps-f-00329` (`[roadmap/](roadmap/)` in docs/architect/agent-coordination/documentation-standardization-plan.md) is stored as cutover-patch-only to `docs/platform/agent-coordination/roadmap/`. On the committed bytes it replays as preserve-pending-target ("No unique exact mapping").
- `maps-f-03344` desiredOwner/mechanicalTargetCheck differ.
- Counts differ by one: stored patch-only 1281 / pending-target 567, replay 1280 / 568.
- The target directory `docs/platform/agent-coordination/roadmap/` is not in the committed tree at b7281a921 or a63f38ef4, so `fs.statSync` in the parser's target check fails. It exists in the main checkout (tracked there at its current HEAD). The author census was therefore generated in a tree that is not the committed bytes. The census encodes an executable patch to a nonexistent target. It is the same missing-target class as the mechanical failures.
- My independent check agrees: of all patch-only rows, the only desiredOwner absent from the committed tree is that roadmap directory (`maps-f-00329`).

Everything else matched: all 5,436 entries, files, spans, hashes, overlay controls, and the 9 parser syntax probes. All 44 differential regression probes passed with old-behavior-fails, and all 8 replay negative probes were rejected. Three-part failure is one root cause.

## Defect classes (my own scans over census JSON plus `git show HEAD:` consumer lines)
| Class | Count |
|---|---:|
| prefix/suffix patches (patch.old != complete matched unit) | 0 |
| corrupted keys: `[`/`]`/braces/comma in key | 0 |
| corrupted keys: `repo/docs/`, `docs/architect/docs/`, glued consumer dir | 0 (1 flag, `maps-f-02375`, benign: a preserved verbatim-carriage relative link legitimately resolves to `docs/platform/docs/specs/runner.md`, one of the known-broken carriage links) |
| code `./src` / `../` import keys, import/require tokens as edges | 0 |
| split label/destination edges | 0 (3 bare-token flags `00131/01101/03019` are wrapped links whose label sits on the previous line; one edge each, whole destination replaced) |
| `docs/architect` truncating architecture-map/manifest tokens | 0 |
| trailing `/` lost on directory patches | 0 |
| partial template-placeholder / ellipsis patches | 0 |
| migration-state rows labelled preserve | 0 (78/78 phase9-row-flip) |
| docs/history references not preserved | 0 |
| self-link patches | 0 |
| overlapping edges | 5 pairs, all intentional brace-list expansions (two files in one `{a,b}` unit, both preserve) |
| block-writer: Create:/PERSISTENT STATE/EVIDENCE_DIR/test -s not classed writer | 0 real. `00457/00459/00486/00492` are writer/check; remaining marker hits are the ROSTER_SOURCE reader guard (`00487`), reader paths in the same block (`00485`, `00490/00491` inside a long fence), and Create text near docs/specs/distribution.md refs |

New defects found by me, not in L12-21/22:
- **Image link patch loses `!`** (1 edge, `maps-f-00412`): old `![...](../../vocabulary/...svg)` becomes `[...](../../../../platform/...svg)`, so an embedded image turns into a plain link. Of 1,281 patches, 4 change a structural character: this one drops `!`; `maps-f-00055/00056/00624` drop backticks inside path-text labels (label follows destination by design; cosmetic). The label-follows rewrite also sends `00056` and `00624` (a vocabulary/README.md destination absent in both trees) to the area README. Semantic, for Step 3.
- No other single-edge patch defects found.

## Mutation probes (copies under /tmp/fgos-work, repo untouched)
All nine were detected by my scan and left the baseline classes unchanged: truncated patch.old (prefix), `[` in key, trailing slash stripped from a directory patch, docs/history row turned patch-only, migration-state row turned preserve, key set to bare `docs/architect` on an architecture-map row, writer row `00486` flipped to reader/patch-only, `repo/docs/...` key, placeholder row turned patched. 9/9 detected. Replay's own 8 negative probes: 8/8 rejected.

## Verdict
Mechanical replay on the committed bytes does not pass. The census is author-tree-dependent in one place (roadmap/ directory target, 2 rows, counts 1281/567 vs 1280/568, downstream tables stale). Every L12-21 and L12-22 defect class counts 0, and all 44 differential probes and parser probes pass. Not acceptable for the pilot as committed. Recommended rework: regenerate on clean committed bytes (or land the roadmap target first), re-run the replay to PASS, and fix the image-link patch `!` loss (`maps-f-00412`).

Status: DONE_WITH_CONCERNS
