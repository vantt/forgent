# Review p15 (seam 5 judgment files, batch 6)

Pin 5eb9dc609. Payload: 8 test/state files, 198 items (46 references + 152 dynamic tuples). All preserve; no parks, no patches, no diffs, no co-cut sets. Admitted: 9 comment-provenance references. Rejected: 189 fixture/probe/scalar items.

## Verdicts
| File | Verdict | Items |
|---|---|---|
| test/state/decision-relation.test.mjs | ok | 32 (1 admit, 31 reject: 14 literals, 18 dynamic) |
| test/state/events-jsonl-truncation-guard.test.mjs | ok | 1 (admit) |
| test/state/frontier.test.mjs | ok | 1 (admit) |
| test/state/gate-bypass.test.mjs | ok | 4 (3 admit, 1 reject) |
| test/state/hot-lock-known-exec-sites.test.mjs | ok | 5 (all reject) |
| test/state/knowledge-bootstrap.test.mjs | ok | 77 (all reject) |
| test/state/knowledge-registry.test.mjs | ok | 75 (2 admit, 73 reject) |
| test/state/porting-store.test.mjs | ok | 3 (1 admit, 2 reject) |

OUTCOME defects: none.

## Evidence per file
- decision-relation: every `docs/...` string and every `path.join(cwd, 'docs', ...)` is a file written under `mkdtempSync(os.tmpdir())` or an in-memory `{file, lines}` fixture; the sweep (`collectWideSourceFiles`, `findWideCitationFindings`, CLI `decision`) runs on that tmp root. Nothing reads a real repo document and no document wording is compared. Same-passage items agree (one operation = reject/preserve). Line 100 `docs/decisions`/`docs/specs` is prose inside an assertion string. The `.agents/skills` default-roots test (L165-176) is tmp-only and has no docs literal.
- events-jsonl-truncation-guard L102, frontier L438-439, gate-bypass L1/L30-31/L267, porting-store L43: comment pointers into `docs/history/**` (retained root). admit/preserve is uniform with R16. The split-line pointers (frontier, gate-bypass 005244, 005243) are correctly one item each.
- gate-bypass dynamic 037911, porting-store 038335/038336: `os.tmpdir()` mkdtemp; reject is true.
- hot-lock-known-exec-sites: `repo` is `fs.realpathSync(fs.mkdtempSync(os.tmpdir()))` passed as argv to the child script (L134). The `docs/history/heavy/plan.md` write/commit is inside that tmp git repo, and only drives product `assertPlanEvidence` against the fixture. `getMainFgosDir = sitesAt(...)` is a scalar counter. Rejects are true.
- knowledge-bootstrap: `bootstrapRegistry(tmpDir, dataPath)` with `dataPath` in tmpDir. The script's real default `docs/history/.../inventory-data.json` (script L250) sits in its main entry and is not exercised by the test. `oldPath`/`currentPath` values are inventory/state data, not read from disk. Rejects are true.
- knowledge-registry: all `currentPath`/`newPath`/`badPaths` strings are state-store payloads in a tmpDir store; the `docs/` prefix rule is string-only (src L77). The two text-label joins and the `currentPath: bad` pass-through are accurate. 005270/005271 (L515, L359) cite `docs/architect/knowledge-registry-redesign.md`: preserve with an explicit "docs/architect tree retires" witness is correct. The only other holder at the worktree is `docs/platform/proposals/knowledge-registry-redesign.md`, which is a self-declared non-canonical carrier, so no live holder exists and patch is not warranted (consistent with the L12-80 ruling).

## Record-text notes (not outcome defects)
1. decision-relation reference-005222 (L6 `docs/specs/*.md-only`): the reason says "pending source-grounded S2 holder check" and has no "docs/specs tree retires" witness. The text is a dated description of the old sweep scope, so preserve is right; add the explicit tree-retires/dated-provenance witness (R8) and drop the "pending" wording.
2. Dynamic-tuple `pathOperand` is absent everywhere (no admitted dynamic tuples), so nothing to check there; all 152 dynamic tuples are rejects with a true `nonDocumentUse`. The label `non-document-fs-probe` is used for tmp-root `path.join` constructions, which is loose (they are tmp fixture path constructions, not probes). Label only.
3. gate-bypass 005243 `matchedExpression` is the truncated prefix `docs/history/coding-planning-` (the path wraps L267-268). Same-line wrap, no outcome effect.

## Lead-judgment questions
None. The product-side readers that these fixtures exercise (decision citation sweep over `docs/**` and `docs/history/<id>/CONTEXT.md`, `assertPlanEvidence` over `docs/history/<id>/plan.md`) are owned by other seams; their tests here use tmp roots so they stay green regardless of cutover.

## Counts
Files 8, items 198 (admit 9, reject 189), parks 0, patches 0, outcome defects 0, record-text notes 3, Lead questions 0.

Status: DONE
Summary: All 198 items in 8 test/state files are correctly classified: fixtures and tmp roots reject, the 9 docs/history and docs/architect comment pointers admit/preserve correctly. No outcome defects, three minor record-text notes.
