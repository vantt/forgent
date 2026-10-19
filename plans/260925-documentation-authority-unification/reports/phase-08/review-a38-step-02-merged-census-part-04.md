# Review a38 step-02 merged census part-04

- Reviewer: reviewer:sonnet-session:a6e41fab8a43ca0bc@2026-10-19
- Worktree HEAD: 0689b862e (author commit ce84b84e7; request step-02-merged-census-587c2a791)
- Part: step-02-review-part-04.json, sha256 8ed3fd633df196a1c23ebbf2f5d6c0008f02c4b162c33505d6c094d468b4c09c, 7 entries


Mechanical: for all 7 entries, file digest, call-site line text and matched-expression column span verified against the worktree; aliasLookup activeTableEntries 0; no write destination on any row (all are readers). Semantic: all 7 functions read in source (registrations.mjs 3955-4215, instruction-registry.mjs 90-110); reader/writer, source (not render) and dynamic vs explicit target classification match what the code does. No consumer edit is proposed; preserve is right; parked reasons are legitimate (concrete registry population needs authorized export). L12-7 respected (no docs/specs or docs/architect consumer patches here). Deep reads: 7/7.

| Entry | Verdict | Note |
|---|---|---|
| setup-033 | ok | Map over registry-view docs (currentPath to docId) inside checkDocAliasBroken; in-memory, no file open. Dynamic registry population, preserve + parity export correct. |
| setup-034 | ok | checkDocNearDuplicate: readdirSync(docs, recursive) then readFileSync of each .md frontmatter; read-only recursive reader over docs/**. Correct class (recursive-reader), preserve. |
| setup-035 | ok | checkDocCurrentPathMissing: git cat-file -e HEAD:<doc.currentPath> per live doc; read-only probe, dynamic set, no writes. Correct. |
| setup-036 | ok | checkDocSourceUnreachable: resolveDocPath(view, captureId) lookup-only alias resolution over path-shaped captureIds; no write. Correct. |
| setup-037 | ok | Explicit unchanged path docs/history/compound-learn-artifact-registry/reports/inventory-data.json, existsSync + readFileSync guarded by try/catch; read-only historical inventory. Correct. |
| setup-038 | ok | Loop over inventory oldPath; skip if on disk, else resolveDocPath lookup; read-only. Correct. |
| setup-039 | ok | instruction-registry.mjs readDecisionIds reads docs/decisions/index.md (generated projection) and compares to rebuilt markdown; read-only, explicit unchanged path. Correct. |

Totals: ok 7, rework 0, needs-Lead-judgment 0.
