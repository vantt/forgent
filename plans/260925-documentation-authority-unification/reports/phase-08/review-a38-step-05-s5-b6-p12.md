# Review p12 (seam 5, judgment test files)

## test/scripts/generate-shipped-path-inventory.test.mjs (pin 5eb9dc609)
Verdict: ok. Items reviewed: 41 (25 references, 16 dynamic tuples; 3 ADMIT references + 6 ADMIT dynamic, rest REJECT). No diff (no patch dispositions), so no diff/rollback review.

Admitted (all genuinely read the real repo at HEAD through classifyPathAttributes({repoRoot: REPO_ROOT, commit:'HEAD'})):
- reference-005051 (L464, docs/decisions/0021-...md): preserve. Retired-decision negative probe (stale-or-dead / nonexistent / retired-decision-citation). Target is the retired numbered corpus, not docs/specs|architect, and the test asserts it stays absent. Preserve is correct. successorNote docs/decisions/index.md present. Same-passage dynamic-033380 (repoRoot: REPO_ROOT) and dynamic-033381 (scope operand) share the outcome. OK.
- reference-005064 (L448, docs/specs/runner.md): park, blocker runner-exists. Test asserts existence, sourceRole platform-specification-or-doctrine and isSafeRewriteTarget true for a real docs/specs file. docs/specs retires, so preserve is barred and a patch has no live target yet. The blockedReason names the exact missing claim (promoted runner spec plus classifier taxonomy co-cut, five assertions at 449-453) and the warning not to turn it into a stale-path case. Same-passage dynamic-033375 and dynamic-033376 share the outcome. OK.
- reference-005072 (L472, docs/specs/platform-foundations.md): park, blocker generated-mirror. Asserts a generated projection exists with generated-projection-non-authority and isSafeRewriteTarget false. Step 7 must bind a surviving generated projection, not the canonical laws holder. This is specific and the generated-copy rule is respected (not hand-patched). Same-passage dynamic-033383 and dynamic-033384 share the outcome. OK.
- pathOperand check for the 6 admitted dynamic tuples: each names the repoRoot / scope operand of the same classifyPathAttributes call that carries the document path as its first argument. These really yield a document path in the passage. OK.

Rejected (all pass the check that no real document path is constructed or read):
- reference-005052..005073 rejects and dynamic-033331/32/49/50/51/09/10/11/18/25/26/27: every one is a string in an in-memory or tmp-dir fixture (extractPathReferences over written tmp files, classifyContractScope pure-string calls, fixtureDir git repos with fake docs/specs/runner.md, join('\n'), path.join(fixtureDir,...)). None reads the repo's docs. nonDocumentUse labels are true. Same-line pairs 005056/005067 (L314) agree, and 005073 and dynamic-033350 (L318) agree.
- reference-005054/005055 (L58/L75, docs/specs/runner.md written into a fixture repo): the fixture's own file is committed and the test asserts on fixture counts only (19 paths, 2 safe targets), not on the real document. Reject is right.

## Record-text notes
- reference-005056/005067 matchedExpression 'docs/specs' (and 005057 'docs/history/merge-standardization/') are directory strings in extraction fixtures. Labels are fine.
- dynamic-033381 and dynamic-033383 pathOperand reads "scope: 'repository-local-contract' })" with the closing "})" included. It is a cosmetic expression-slice artifact, not a wrong label.

## Lead-judgment questions (not outcome defects)
1. L385: the CLI test runs the generator over the real repo at HEAD and asserts only aggregate thresholds (totalUniquePathsCount > 100, summary counts > 0). It names no document path or wording, so it is correctly outside the admitted set. Phase 9 will change the counts but not break the thresholds. No action.
2. L549: the test copies the real domains/coding/AGENTS.md into the fixture (fs.copyFileSync from REPO_ROOT). It is a literal read of a real doctrine document, outside this payload. The fixture asserts nothing about its wording, only that the untracked files are not scanned. If domains/ is not a registered documentation root this is correct. Lead should confirm it is intentionally not in the references. If domains/coding/AGENTS.md ever moves, the copy would throw ENOENT.
3. L113/128/140: docs/journals/... and docs/notes.md fixtures in extraction tests are absent from the payload, as they are in-memory fixture strings. Consistent with the reject rule.

Counts: 41 items. 9 admitted (3 reference plus 6 dynamic: 2 preserve-class groups, 2 park groups), 32 rejected shown, 0 outcome defects, 2 record-text notes, 3 Lead questions.
