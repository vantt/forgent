# Review p05 (seam 5 judgment batch 5), pin 5eb9dc609

Counts: 2 files, 75 items reviewed (loop.test.mjs 73; merge-quoted-paths.test.mjs 2). No diffs/patches/parks in either file (diff null, parked []). Outcome defects: 0.

## test/runner/loop.test.mjs — verdict ok (73 items)

- 5 ADMIT/preserve comment-provenance (004411 L509, 004412 L364: docs/architect, treeRetires witness, carrier is Canonical: No; 004413 L543-544, 004414 L514, 004415 L2084-2085: dated docs/history comment pointers, retained root). Fits R8/R16: dated provenance, witness says tree retires for architect, no retained-witness rest on a retiring tree. No patch target exists for the architect pointers (proposals carrier is non-canonical), so preserve is right.
- 68 REJECT/preserve. Verified against pinned source: every docsRef/plan.md/CONTEXT.md/validate-plan.md/planted-evidence join is rooted in a test-created temp repo (`setup()` -> initTempRepo(), mkTempDir; L1925 mkdtemp) or a worktree of it, or is a metadata string in seeded item data / result.json. None reads or emits a real repository document; no assertion compares to document bytes or wording. The only `docs/` strings in the file are the ones itemised (grep of the pinned file confirms none missed besides the L786-787 note below). Same-line/passage pairs agree (e.g. 3830/3831 literal+dynamic; 3081/3092/3093; 2782-2784; 3481/3482 join and label all reject/preserve). docs/history is retained, so even the docsRef values keep their target.
- state-event-store rejects (027604 `.fgos/assignments`, 027774 events.jsonl) are true.

Record-text notes (label only, outcome right):
- nonDocumentUse `non-document-fs-probe` is used for fixture write/join of document-shaped temp files (docsRef/plan.md, planted-evidence); `test-owned-temp-fixture` style wording would be more accurate. 004416/004417 and dynamic-027750/027751 are relative strings put into result.json (metadata), not fs probes.
- dynamic-027594/027647/027741 labelled `scalar-pass-through` are in-memory plan-text literals (string fixture content), not scalar pass-through.
- 004413/004414/004415 resolverWitness.scope says "test-owned synthetic input/output" for what are comment pointers; reason text (dated comment pointer) is the right description.

## test/runner/merge-quoted-paths.test.mjs — verdict ok (2 items)

- 004418 (L105) and dynamic-027807 (same passage L100-108): both REJECT/preserve, agree. Path is written into a test-created temp repo (initRepo) as fixture; successorNote docs/decisions/index.md present for the retired-decision spelling (R8).

## Lead-judgment questions

1. merge-quoted-paths 004418/027807: the fixture is read by production `nextFreeDecisionId` (src/runner/merge.mjs L536, `git ls-tree ... -- docs/decisions/`, plus DECISION_FILE_RE). If Phase 9 ever changes that scan, this test's literal `docs/decisions/0041-...` fixture must move with it, so it is a coupled fixture, not pure metadata. Outcome is preserve either way today because the owning src passage (003771 and the sibling ls-tree reads) is preserve and docs/decisions is a retired corpus kept readable by the code; accept the reject/preserve, but consider a record-text note naming that coupling. I found no admitted/parked record for the L536 ls-tree read itself in the cli-help-messages records (only 003771 for renumberDecisionFile); that is outside this payload.
2. loop.test.mjs L786-787: comment `tsk-40m (docs/` newline ` * architect/doing-coordination-redesign.md` is the same docs/architect pointer as 004411/004412 but split across two lines, and has no item in the payload (census literal pattern probably missed the line break). If the census should cover it, it needs an author-added source slot with the same preserve/dated-provenance outcome; otherwise a note that it is a split-line twin.

Status: DONE
