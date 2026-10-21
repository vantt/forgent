# Final review p01 (s4-src-p01): seam 5 closure items

Reviewer: independent read-only. Pins read via `rtk proxy git show`; targets checked in the review worktree (read-only).
Entries: 20 payload entries (3 diff-only). Items reviewed: 92 (items 72 + author-added 11 + 9 diff-bearing patch/diff-only rows counted via diffs: 3 diff entries + 3 patch items). All parks/admits checked against R29/R30/R5/R28.

## Per file

| file | verdict | items |
|---|---|---|
| bin/fgos.mjs (diff entry) | ok | diff only |
| src/runner/merge.mjs (diff entry) | ok | diff only |
| src/runner/worktree.mjs (diff entry) | ok | diff only |
| src/report/knowledge-projection.mjs | ok | 4 |
| src/report/item-trace.mjs | ok | 2 |
| scripts/knowledge-bootstrap.mjs | ok (one Lead question) | 1 + 1 author slot |
| scripts/knowledge-canary.mjs | ok (one Lead question) | 1 |
| scripts/knowledge-migration.mjs | ok | 3 (+9 park rows) |
| AGENTS.md | ok | 1 + 8 park rows + 1 author slot |
| bin/fgos.mjs (judgment) | ok | 20 + 6 author slots |
| packages/work-state/rust/src/work_source.rs | ok | 1 |
| src/runner/loop.mjs | ok | 2 |
| src/runner/merge.mjs (judgment) | ok | 5 + 4 author slots |
| src/runner/operation-choice.mjs | ok | 7 |
| src/runner/paths.mjs | ok | 3 |
| src/runner/work-compat.mjs | ok | 1 |
| src/runner/work-dispatch.mjs | ok | 6 |
| src/runner/worktree.mjs (judgment) | ok | 2 + 1 author slot |
| src/state/cleanup-harness.mjs | ok | 8 |
| src/state/knowledge-registry.mjs | ok | 4 |

## OUTCOME defects

None. Evidence for the changed items:

- R29 (merge.mjs): all eight members are ADMIT/parked on the identical dependency "Phase 9 decision for the legacy decisions-tree writer/reader (native Land)": reference-003747 (L542), 003754 (L419 DECISION_FILE_RE), 003762 and dynamic-012990 (L418 DECISION_INDEX_PATH, same constant), author slots for L1091 target reader, L1092 source reader, L1098 numbered writer, L1104 index writer. The reader/writer split is gone and nothing else in the payload flipped.
- R30 state/registry parks: every changed ADMIT/parked item reads or emits a value that comes from persisted state (registry currentPath/aliases, outcome.docPath, Work.docsRef), and the dependency is consistent per state source. Registry currentPath: knowledge-projection, knowledge-bootstrap, knowledge-migration, bin promote/attest/compound diagnostics, knowledge-registry, cleanup-harness. outcome.docPath: item-trace, Rust work_source.rs, cleanup-harness. Work.docsRef: loop, operation-choice, paths, work-compat, work-dispatch, bin context-render and research exemption. Function-argument rows stay R5 REJECT: bin L1719 and L1814 `existsAtHead(repoRoot, docPath)` (CLI flag built, the registry probe at L1658 is the parked owner). The cat-file rejects 000264 and 001341 are true provenance rejects: the pinned 97c9694a bytes already use `existsAtHead`.
- Patches (the three emitted-message patches, with diffs):
  - bin/fgos.mjs L5108: target `docs/platform/runner/decisions/h-36d872fbb0e5.md` exists, and its heading `### 0020 — Chặn .fgos/ khỏi worktree worker (không khóa, không cô lập)` slugifies to the anchor used. The old `docs/decisions/0020-...md` is already gone, so the patch has a live target. No test asserts that string.
  - merge.mjs L809: new `docs/knowledge/.../fix-fgos-write-rejected-merge-block.md` exists. The registry lists the old path as an alias. `merge.test.mjs` is co-cut, and the e2e assertion matches only the basename, so it still passes.
  - worktree.mjs L1002: new `docs/knowledge/.../tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md` exists. `worktree.test.mjs:735` asserts the old path and is co-cut. Diffs are on SOURCE files, change only the admitted passage, and carry inverse rollback diffs.
- Same-passage agreement: registry projection 009806-009809, loop 012848/012849, work-dispatch 013331/013332, cleanup-harness pairs, bin L2071 (001360/001361 plus the author slot) and bin L2107 (001367/001368) all share one admission and one disposition.
- Retired decision citation: worktree 003783 `docs/decisions/0022` is a comment preserve with an explicit successor note (`docs/platform/runner/decisions/h-36d872fbb0e5.md#0022-...`). The target is not under docs/specs or docs/architect, so the "retained witness" bar does not apply.

## Record-text notes (no outcome impact)

1. Several ADMIT items carry a stale `rejectedAsUnrelatedReason` and/or a REJECT-style role label from their former reject: bin 001356, 001360, 001361, 001363, 001454 (stale `rejectedAsUnrelatedReason`); knowledge-projection 009808 and 009809 and work_source.rs 006213 (role `non-document-operation` / `non-document-formatting` while ADMIT/parked). Clear the stale fields or relabel the roles.
2. blockedReason text has a garbled caller declaration spliced in: bin 001316 ("in async function runVerb(...) {"), 001327 and 001345 ("in const retiredTopics = ..."), knowledge-registry 015583 ("in const oldDocs = ..."). Reword to the actual diagnostic site.
3. bin 001356, 001365, 001369/70 and reference-000226/227/271/272 use the generic dependency label "bin/fgos.mjs — CLI item/registry document operations" while their sibling slots use "Authorized persisted Work.docsRef / content-root / item-context export". Same-passage parked outcome is consistent, but use one label per state source. The same applies to src/runner/operation-choice.mjs rows 013081/013113/013132/013140/013166/013167/013170, which use a file-level label.
4. knowledge-migration parks 008156/008157/008173/008174/008186/008188 have `dependency: null` with a specific blockedReason. Fill the dependency field.
5. bin dynamic-001635, merge dynamic-013025 and worktree dynamic-013447 reasons say "Executable data/message/file operation..." and do not carry the "target/diff owned by reference-000228 / exact owner edge" wording that L12-87 p02 says joined patches state. 013025 and 013447 do name the registry currentPath. Add the owner-edge wording.
6. bin: `author-seam8-bin-head-doc-probe` (L1658) and dynamic-001319 (L1661) sit on the same passage with different dependency names ("Bounded registry currentPath / committed HEAD export for doc promote" vs "Authorized registry docs currentPath / aliases / lifecycle export"). The outcome is the same (parked on the registry currentPath export); align the name.

## Lead-judgment questions

1. Park index gaps in the payload's `parked` list: knowledge-projection dynamic-009807/009808/009809 and work_source.rs dynamic-006213 have disposition `parked` but no matching park row (the other parked items in the same files have one). Confirm that the park record file carries these rows, or add them.
2. scripts/knowledge-bootstrap.mjs `author-s4-fix2-a440ba62f0b352d2`: the operand `inventoryDataPath` is a function parameter, and the file's own main block builds the value from a fixed literal (`path.join(repoRoot, 'docs/history/.../inventory-data.json')`). Under R5/R30 (a function-argument path with an in-code construction owner is REJECT) it would reject as scalar pass-through. The record has ADMIT/preserve, which is the opposite of the L1719/L1814 treatment in bin. Outcome (preserve) is harmless, so I did not call it a defect. Confirm admit vs reject, and if reject, move the preserve to the main-block literal.
3. scripts/knowledge-canary.mjs dynamic-008115: `activeDoc.currentPath` is read from a throwaway sandbox registry built in the same function from the fixed literal `docs/worktree-reclaim/guide.md`. R5 rejects "synthetic fixture formatting"; the R30 sweep chose ADMIT/park on registry export. The blocker text itself says "without reading live state", so the registry-export dependency may not be real here. Confirm it is intended to stay parked.

Counts: payload entries 20; items with outcomes checked about 85 (72 items + 11 author slots + 3 patch items counted in those); outcome defects 0; record-text notes 6; Lead questions 3.

Status: DONE_WITH_CONCERNS
