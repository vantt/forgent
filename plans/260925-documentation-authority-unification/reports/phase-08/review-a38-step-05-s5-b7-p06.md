# Review a38 step-05 seam 5 batch 7, part p06 (test/runner/execution/*)

Scope: 8 files, 0 diffs, 0 parks, 0 crossSeamChangedOnly. 20 references (13 handoff-refs, 7 run-sync) and 46 dynamic tuples in the payload (26 handoff-refs, 3 reviewed, 1 run-posture, 4 run-provider-failover, 12 run-sync). All disposition "preserve".

Method: for each file I grepped the pinned bytes (5eb9dc609) for any docs/ path, *.md, repo-root, import.meta or process.cwd read. Every document-shaped path in these tests is a synthetic fixture built under a temp makeRoot()/repoRoot/worktree. The only real-repo reads are src/runner/execution/run.mjs (run-herdr L18, a source file) and probe-targets.json (run-posture L58, config). No test reads, writes, or compares bytes/wording of a live document under docs/. No Phase 9 patch or park is needed.

## Per file

- test/runner/execution/handoff-refs.test.mjs: ok. 13 refs + 26 tuples reviewed. Preserve is correct (fixtures docs/a.md, docs/out.md and report.md are created in temp roots; the asserted outputs are the runner's own ref lists). nonDocumentUse labels (config-or-metadata, non-document-fs-probe, scalar-pass-through, text-label-join) are true for the rejected tuples.
- test/runner/execution/partial-writes.test.mjs: ok. 0 items (README.md is a temp-repo fixture, not payload-admitted).
- test/runner/execution/patterns/architecture-guard.test.mjs: ok. 0 items, no document path.
- test/runner/execution/patterns/reviewed.test.mjs: ok. 3 tuples, text-label-join (`u-${...}`, `${rigor} ${role}`), true.
- test/runner/execution/run-herdr.test.mjs: ok. 0 items. It reads src/runner/execution/run.mjs (source), not a document.
- test/runner/execution/run-posture.test.mjs: ok. 1 tuple (registry path env var passed as a scalar, true).
- test/runner/execution/run-provider-failover.test.mjs: ok. 4 tuples. The `.fgos` event-store path, unit-summary.json and runs/*/file are state files, not documents. Rejects are true.
- test/runner/execution/run-sync.test.mjs: ok. 7 refs + 12 tuples. docs/never.md, docs/page.md, docs/a.md and docs/x.md are worker-written fixtures in a temp worktree; `.fgos/assignments` is state. Preserve is correct.

## OUTCOME defects

None.

## Record-text notes (not outcome defects)

1. handoff-refs: admission is inconsistent across near-identical fixture literals of 'docs/a.md' in the same tests. Admitted: L192, L257, L329, L340, L341 (document-path-comparison). Rejected: L100, L101, L186, L252, L336 (config-or-metadata), and tuples at L248/L327 for the same fixture. Same passage in L252-257 (rejected at 252, admitted at 257) and L336-341 (rejected at 336, admitted at 340/341). Outcome is identical (preserve, no change, no target), so no outcome defect. Under the stated rule (same passage shares one admission) the cleaner record is REJECT with nonDocumentUse non-document-fs-probe throughout, since the path is a synthetic fixture under a temp root and the comparison is against the runner's own ref echo, not a document's bytes. Suggest harmonizing the labels.
2. run-sync: L180 `commit.files == ['docs/page.md']` is ADMIT/document-path-comparison while L174 (the same test's writeWorker fixture) is REJECT. Same remark as note 1.
3. The admitted items' resolverWitness says treeRetires:false with "not retained live holders", which is fine. The reason text mentions "no repository holder read", which is true.

## Lead-judgment questions

None.

## Counts

Files 8, ok 8, rework 0. Outcome defects 0. Record-text notes 3.

Status: DONE
