# Review p01: Step 5 seam 5 judgment files (batch 5), part p01

Pin 5eb9dc609f303fc9d54377f866b5e8caf9a5d129, read-only. Payload: s4-src-p01.json (11 files, 205 items). Standard: L12-72/74/76/77/78/80.
Move-set facts used (step-05-cutover-move-set.json at the pin): docs/decisions/index.md IS in the set (-> docs/knowledge/decisions-index/decision-record.md); docs/tutorials holds only .gitkeep (retained); docs/how-to/author-a-plan-loop-track.md is not in the set; docs/how-to/check-rollup-progress.md is; docs/ui-spec/screens/S01-sign-in.md is (but see L12-80 ruling below).

## Per-file verdicts

| File | Verdict | Items |
|---|---|---|
| test/runner/dead-vocabulary-guard.test.mjs | ok | 32 (15 parks) |
| apps/fgos-gateway/web/src/App.test.tsx | ok | 1 |
| test/runner/dispatch-worker-session.test.mjs | ok (patch) | 1 |
| test/report/capability-plan-lint.test.mjs | ok | 9 |
| test/report/enduser-index.test.mjs | REWORK | 115 (18 parks) |
| test/cli/fgos-approve-3.test.mjs | ok | 8 |
| test/cli/fgos-claim.test.mjs | ok | 1 |
| test/cli/fgos-disconnected-worktree-guard.test.mjs | ok | 1 |
| test/cli/fgos-handoff.test.mjs | ok | 2 |
| test/cli/fgos-iron-law-gate.test.mjs | ok | 1 |
| test/cli/fgos-merge.test.mjs | ok (one Lead question) | 3 |

Counts: 205 items reviewed; 2 OUTCOME defect groups, both in enduser-index; 0 in the other ten files.

## OUTCOME defects (test/report/enduser-index.test.mjs)

D1. Real reader of docs/decisions marked preserve on a false "retained" witness. dynamic-021547 (line 374, `path.join(REPO_ROOT,'docs','decisions')`), dynamic-021548 (line 374, `decisionsDir = ...`), dynamic-021549 (line 378, `path.join(decisionsDir, file)`). Reason says "Real retained index/tutorials path". Rule: R4/R7 plus the witness rule. The test at lines 373-383 does `readdirSync(docs/decisions)`, asserts `files.length > 0` and reads each file. The only file at the pin is docs/decisions/index.md, and the move set sends it to docs/knowledge/decisions-index/decision-record.md. So Phase 9 can empty this directory. The same directory is already parked for the same dependency in the adjacent test: dynamic-021542 (line 322) and 004331/004349/021545 (alias membership of dynamic-009788/dynamic-009791). Correction: park 021547/021548/021549 with that dependency (alias membership/ decisions-index holder; the test's `length > 0` and `type: explanation` assertions must move with the holder). Same passage (lines 373-383), so apply one outcome: reference-004308 (line 373 title), reference-004343 (line 376 assertion message), dynamic-021550 (line 380), dynamic-021551 (line 381) are currently preserve and should follow the park. reference-004307 (line 369) and 004305 (line 341) are dated comments and stay preserve.

D2. Same-passage split on the primaryDoc assertion. reference-004332 (line 348, message 'at least one backfilled docs/explanation/ doc must appear via the primary dir') is preserve, but reference-004345 (line 347, the `find` it belongs to) is parked, and the sibling messages in this test (004311/004348 line 330, 004319/004351 line 334, 004331/004349 line 346) are all parked. Rule: R7. Correction: park 004332 with dependency alias-primary-find (same as 004345).

## Lead-judgment questions (not counted as defects)

Q1. Titles that name a moving path: reference-004312 (line 385, title "docs/how-to/check-rollup-progress.md's frontmatter ...") is preserve while its reader dynamic-021552 (line 386) and assertions 004330/004344/021513 are parked, and the move set does move that file. This follows the L12-80 P01 precedent for 004372 (title preserve, co-cut with the parked scan). If that precedent is meant to cover titles generally, add the co-cut note to 004312 (and 004321/004346, line 316 title naming docs/decisions and docs/explanation). If not, park them. I treated it as consistent with the ruling.

Q2. reference-004372 (dead-vocabulary-guard line 447, title contains docs/specs) is preserve with a retiring target, justified only by co-cut with the parked 004373. Verified Lead decision L12-80; no change proposed, but the Phase 9 co-cut must be explicit in the unit that resolves 004373.

Q3. fgos-merge reference-003965 (line 925): a comment points to docs/how-to/add-a-read-only-fgos-verb-and-plugin-skill.md, which does not exist at the pin (already moved; holder docs/knowledge/add-a-read-only-fgos-verb-and-its-plugin-skill/add-a-read-only-fgos-verb-and-plugin-skill.md exists). Preserve is defensible (not a cutover-driven change, the path is not in the move set, dated pitfall note), but a live holder with the same passage normally means a patch. Lead decides whether to patch this stale pointer in Step 5 or leave it.

Q4. App.test.tsx reference-000201 (docs/ui-spec/screens/S01-sign-in.md) is preserve although the move set lists it with a platform holder; this is explicitly settled by L12-80 (seam 6 retention) and the earlier ruling that the ui-spec tree stays. No change.

## Checks that passed

- dispatch-worker-session patch (reference-004380): comment-only, changes the module-header pointer to docs/platform/... proof directory (holder verified byte-identical per the record's holderDirectory), forward/inverse diffs are exact mirrors, no assertion or title delta, source file only. R22 replay is recorded for the patch file. coCutPaths lists CHANGELOG.md although no user-visible output changes (record note, harmless).
- dead-vocabulary-guard: all 15 parks name a passage-specific dependency (gateway roots, P5 scan, recursive walk, component-boundary P7-DOC-GAP-05, docDirs members); same-line items agree (004371/023891/023892 line 539; 004373/023873/023874 line 461; 023896/023901/023902/023903 docDirs). Rejects (text joins, skipDirs, `must remain deleted` paths) are true non-document uses. AGENTS.md/README.md readers preserve correctly (retained roots). docs/history comment pointers admit/preserve uniformly (R16).
- capability-plan-lint: real reader of docs/how-to/author-a-plan-loop-track.md preserve is right (path not in move set); in-memory/tmp rejects are true.
- fgos-approve-3, claim, disconnected-worktree-guard, iron-law-gate, merge history pointers: docs/history comment pointers preserve per R16. handoff reference-003955 (docs/architect/doing-coordination-redesign.md): dated task provenance, tree-retires witness, proposals carrier is Canonical: No, so preserve is valid under R8/L12-80.
- enduser-index rejects: all fixture/tmpdir rejects (docs/how-to/foo.md, hello.md, tmp cwd joins, docs/old, docs/knowledge/sample-purpose) verified true non-document uses. Tutorials and enduser-docs-index.json readers preserve correctly (both retained at the pin). Parks 004311/004319/004320/004330/004331/004344/004345/004347/004348/004349/004351, dynamic-021513/021542-021545/021552 are passage-specific and consistent per line.

## Record-text notes (no outcome change)

- enduser-index dynamic-021507, 021510, 021511, 021512 (`__dirname`, `path.resolve(__dirname,'../..')`, REPO_ROOT, bin/fgos.mjs): outcome (reject, root/script path) is right, but the reason text is the generic "Pure in-memory path fixture or tmpFixtureCwd descendant"; the true use is repo-root/script plumbing (R5 root-only). Relabel.
- enduser-index dynamic-021523/021524 etc. (`.fgos`, main-checkout.lock under a tmp cwd): nonDocumentUse label non-document-fs-probe is acceptable; the reason text says "does not read the repository documentation", which is true.
- dead-vocabulary-guard dynamic-023872/023887/023888 reason text is the generic "Guard source/config plumbing" with the expression pasted in; correct outcome (text joins), wording could name text-label-join.
- fgos-merge reference-003965 matchedExpression spans a line break ("...verb-\n  // and-plugin-skill.md"); the passage is correct, the expression string is a wrapped comment.

Status: DONE_WITH_CONCERNS
Summary: 10 of 11 files are ok; enduser-index needs rework (D1 docs/decisions reader preserve on a false retained witness, with its same-passage title/messages; D2 reference-004332 split from its parked siblings). Four Lead-judgment questions listed.
