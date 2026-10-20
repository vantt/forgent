# Review A38 - Step 4 wave 2, part 26 (set step04-016)

Pin dc24ce645. Both files were read whole from the pinned blobs (pre-commit 579 lines, ci.yml 333 lines). I enumerated every docs/`.md`/CONTEXT/ADR/plans token in each file and compared it with the record.

## .githooks/pre-commit - set step04-016, stratum mandatory re-review - verdict ok

Slots reviewed: 3 (class6-l-000008; class6-l-000009 as a two-line pair of slots), plus 5 stepFiveExcluded entries.

- class6-l-000008, line 14 `docs/history/main-checkout-lock-worktree-commit-scope/CONTEXT.md`: preserve, null target. This is a comment citing named history evidence ("see ... CONTEXT.md D1/D2/D7"). The file exists at the pin. Preserve is correct.
- class6-l-000009 (original lines 342/343, now source lines 355-356): two slots, both preserve. The reference is wrapped across the two comment lines: `docs/history/stale-worktree-index-guard/` then `// CONTEXT.md`. The logical reference `docs/history/stale-worktree-index-guard/CONTEXT.md` exists at the pin. Both slots carry the wrapped span, so there is no missed continuation. Preserve is correct.
- stepFiveExcluded (the wave 1 requirement for the refuse() messages): lines 491 and 523 (`docs/how-to/fix-fgos-write-rejected-merge-block.md`) are listed, each twice (census id plus pinned twin). Both sit inside `refuse(\`commit refused: ...\`)` template strings, which are runtime output. Reason L12-60(1) is correct. The path is dead at the pin: it is not in the tree and was migrated earlier by commit 7557f0f88. That is Step 5's output parity to resolve, not a Step 4 slot.
- Line 36 `const HOW_TO_DOC = 'docs/how-to-parallel-lanes.md (workshop root, one level up from repo/)'` is excluded under L12-60(3) as an outside-repository workshop path. It is used at line 145 in stderr output. The path is missing in the repo, and its own text says "workshop root, one level up from repo/", so the exclusion is right. It is runtime as well.
- Other tokens (`.md` in the ROOT_FILE_ALLOWLIST, `plans/(?:reports|journals)/...md` regex at line 435, ADR0020 mentions in comments/messages) are not doc edges or are executable. No missed edge.

OUTCOME defects: none.

## .github/workflows/ci.yml - set step04-016, stratum mandatory re-review - verdict ok

Slots reviewed: 1 (class6-l-000012); stepFiveExcluded is empty (correct, since no runtime string cites a doc path).

- class6-l-000012, line 63 col 21-48 `docs/distribution-vision.md`: preserve, null target. The source passage is `# Full suite (docs/distribution-vision.md tsk-49r D1): already includes test/install-packaging.test.mjs (...) and test/setup/doctor-fresh-run.test.mjs (the fresh-runner fgos doctor proof, D4)`. The reason now comes from this line: "names CI install-packaging and fresh-runner-doctor historical D1/D4 proof". It no longer carries text from another file, which fixes the wave 1 problem. The file `docs/distribution-vision.md` exists at the pin. Owner-answers L12-21..(3) retains it in place unless an alias retires it, and the aliases file shows no alias for it. Preserve is correct. A new copy of the vision exists at `docs/platform/packaging-distribution/history/distribution-vision.md`, but a preserve of the retained original is the rule.
- Line 272 `(plan.md)` is a bare filename, so it is not an edge.

OUTCOME defects: none.

Record-text note (not rework): the class6-l-000012 reason ends with the clause "not a session-merge exemption". Nothing in the line-63 comment says that. It looks like a leftover from the wave 1 text. The disposition and the remaining reason are right. Dropping the clause would be tidier.

Lead-judgment questions: none. The assignment text says "park reason", but the slot is correctly `preserve`; no park is warranted because the retained path is live.

Counts: set step04-016 / mandatory stratum: reviewed 2 files, rework 0 (0 of 2 = 0%, within the 3% limit).

Status: DONE
Summary: pre-commit's history citations preserve (including the wrapped pair), and its refuse() path strings are Step 5 exclusions. The ci.yml line-63 reason is now derived from its own comment, and the preserve is correct. I found no outcome defects.
