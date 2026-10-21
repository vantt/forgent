# Review a38 step-05 seam 5 batch 7, part p07

Payload: 38 files (all preserve, no diffs, no parks, no crossSeamChangedOnly). Only 3 files carry entries; the other 35 carry none.

## Per file

- test/runner/execution/run.test.mjs: verdict ok. 94 items + 25 authorAddedReferences = 119 reviewed. 108 rejects and 11 admits, all preserve.
  - Every reject names a nonDocumentUse that is true: tmp-repo fixture paths, .fgos state/event store, text labels (`docs:write`, "Write docs"), fs probes under tmp dirs. The persona file at fgos/agents/*.yaml is written by the test into its own tmp repo, so it is not a repo document.
  - The 11 admits (document-path-comparison: `docs/a.md`, `docs/new.md`, `docs/wip.md`, `docs/in.md` in deepEqual assertions) are synthetic fixture strings. Admit with preserve and target null is acceptable and conservative; no holder is read.
- test/runner/execution/unit.test.mjs: ok. 1 item + 3 authorAddedReferences = 4 reviewed; all reject/preserve, true uses (inputs labels, writes-scope strings).
- test/runner/write-scope.test.mjs: ok. 10 items + 29 authorAddedReferences = 39 reviewed. These are pure string matching of `docs/...` scope patterns against a matcher function, with no document read. 28 rejects and 1 admit (line 116 `docs/`), all preserve.
- The other 35 files: nothing to review; see the OUTCOME defect for the one file that needed entries.

## OUTCOME defect

1. test/runner/fanout-batch-runner-commit.test.mjs line 159 (dynamic-027077): rejected as nonDocumentUse "root-only", reason "No actual documentation authority lookup".
   - The operand is `fs.readFileSync(new URL('../../core/skills/fgos-fanout/references/wave-dispatch-mechanics.md', import.meta.url))`, followed by `assert.match(skill, /^node src\/runner\/fanout-batch\.mjs "<batch-comma-separated>" --has-live-task-access$/m)` on line 160. This reads a real repo markdown file and asserts its wording. It is a consumer under the parity rule for tests.
   - The file exists at HEAD and the move set has no `core/skills` entry, so the target is live and not retiring.
   - Correction: change admission to ADMIT, role document-path-comparison or real-file consumer, pathOperand = the new URL(...) expression, disposition preserve with target `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md` (a source file; its renders follow it). The receipt should say the assertion owns the command line text in that doc. The outcome (preserve) probably stays; the defect is the admission and its false "root-only" label.
   - This entry is missing from my payload even though its operand mentions docs, which suggests the Lead scope filter keyed on the string `docs` and missed this `.md` under `core/skills`. Other batch-7 rejects with `.md` operands were checked and are tmp-repo or state paths.

## Record-text notes

- run.test.mjs is internally inconsistent on the same kind of fixture string. Lines 716, 720, 769, 775, 1030 (`inputs: ['docs/a.md', ...]`, `expected = ['docs/a.md', ...]`) are rejected as config-or-metadata. Lines 1037 and 1047 (`deepEqual(refs, ['docs/a.md', ...])`) are admitted as document-path-comparison. Likewise `writeScopedWorker` files `docs/in.md` are rejected at 1639 to 1895 but admitted at 1646, 1649, 1674, 1715 and 1738. Outcomes agree (preserve), so this is not an outcome defect, but pick one label for the same fixture family.
- The "config-or-metadata" label on `docs/...` literals in write-scope.test.mjs and run.test.mjs is loose. "scalar/fixture string" would be more accurate. The reject itself is right.

## Lead-judgment questions

- Is `core/skills/**` reference markdown a document set for the L12-72 admission rule? The workflow-skill docs are sources for generated renders. If yes, defect 1 stands. If skill sources are out of the doc set, the reject stands but the reason text should say so instead of "root-only".

## Counts

38 files, 162 entries reviewed (items 105 + authorAddedReferences 57), 1 outcome defect (admission), 2 record-text notes, 1 Lead question. No parks, patches or diffs to check.

Status: DONE_WITH_CONCERNS
