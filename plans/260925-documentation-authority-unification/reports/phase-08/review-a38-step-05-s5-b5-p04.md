# Review p04 — seam 5 judgment files (batch 5), 8 files, 98 items

Scope: payload s4-src-p04.json. None of the 8 files carries a diff, rollback diff or park. Every item is preserve, so no disposition defect exists. The findings below are admission-consistency defects (R6/R7). They do not change any outcome.

## Per-file verdicts

| file | verdict | items |
|---|---|---|
| test/report/context-render.test.mjs | ok | 22 (10 literal, 12 dynamic) |
| test/report/decision-index.test.mjs | ok | 7 |
| test/report/knowledge-resolver.test.mjs | ok | 31 |
| test/runner/assignment-dispatch.test.mjs | ok | 5 |
| test/runner/assignment.test.mjs | rework (admission only) | 8 |
| test/runner/claim-port.test.mjs | ok | 7 |
| test/runner/dispatch.test.mjs | rework (admission only) | 11 |
| test/runner/driver-rununit.test.mjs | rework (admission only) | 7 |

Counts: 98 items reviewed (47 literal references, 51 dynamic tuples); 0 patches, 0 parks, 98 preserves. Admitted: 21. Rejected: 77.

## OUTCOME defects (admission wrong; disposition stays preserve)

1. test/runner/assignment.test.mjs, reference-004363, L150. `assert.match(prompt, /- docs\/history\/tsk-456\/plan\.md/)` asserts the product-rendered prompt contains the document path.
   - It sits in the same test as reference-004361 (L139), which is ADMIT as a fixed document path passed to the product and compared.
   - Rule: R7, plus R6 (document path emitted into worker context). It should be ADMIT/preserve with the same document-path-comparison role.
   - Its reason text is generic scalar boilerplate that does not describe the passage.

2. test/runner/dispatch.test.mjs, reference-004391, L230. `assert.match(prompt, /# Files to read first ... docs\/history\/my-feature\/plan\.md and \.\.\.\/CONTEXT\.md .../)` asserts the product-emitted prompt names the docs/history plan and CONTEXT convention.
   - The same test passes docsRef at L229 (reference-004386, ADMIT). reference-004384 (L237, `prompt1.includes('docs/history/my-feature/plan.md')`) is ADMIT for the identical kind of assertion.
   - Rule: R7/R6. It should be ADMIT/preserve.

3. test/runner/dispatch.test.mjs, reference-004382, L280. `assert.match(prompt, /docs\/specs\/widget\.md/)` asserts the emitted prompt carries the work item's ref docs/specs/widget.md. It is rejected as scalar-pass-through.
   - A document-path ref put into worker context and asserted on the output is the same operation as the admitted 004384/004389/004390.
   - Rule: R6. Either all of these admit, or the admitted ones must give a reason that distinguishes them. The record gives none.
   - If it is admitted, the preserve witness must name the fixture as a fake path (docs/specs/widget.md does not exist) and must not say "retained", because docs/specs/** retires.
   - 004383 (L130, the fixture definition in sampleWork) can stay metadata-reject.

4. test/runner/driver-rununit.test.mjs, reference-004392, L22. `const DOCS_REF = 'docs/history/driver-rununit-fixture'` feeds `inputDigests.rel === \`${DOCS_REF}/plan.md\`` (L139, L171, L345, L396), asserting the product-emitted input digest path. It also feeds the fixture plan.md write and docsRef on the work item.
   - It is rejected as "fixture path metadata ... no asserted emitted navigation in this passage". That is false: the passage-level assertions compare an emitted docs/history/<ref>/plan.md rel.
   - Rule: R6/R7. It should be ADMIT/preserve. The docs/history convention is retained, so the preserve witness is sound.

## Lead-judgment questions

Q1. assignment.test.mjs, reference-004362 (L51) and 004364 (L68). contextRefs: ['docs/history/tsk-123/plan.md'] is rejected as an in-memory frozen-assignment fixture, only checked with deepEqual and never rendered.
   - L12-72 p04 D2 ruled that contextRefs plan.md/CONTEXT.md construction is ADMIT/preserve.
   - The reason text defends the reject, and the outcome is preserve either way, so I left it as ok.
   - Please confirm that "stored, not rendered" is meant to be a real exception to R6's "document paths put into worker context".

Q2. dispatch.test.mjs, reference-004381 (L2475). The retired citation docs/decisions/0026-...md carries successorNote docs/decisions/index.md.
   - index.md is a live generated projection. Its D-ADR0026 row only says the narrative moved to docs/specs/runner.md, which retires.
   - R8 asks for a successor on the live retired-decision-history holder. The candidate heading `### 0026 — Native-First Dispatch Doctrine` exists at docs/platform/runner/decisions/h-36d872fbb0e5.md:583 at the review worktree.
   - Is index.md acceptable for a numbered ADR? The 0000-index precedent used index.md because the index itself is retired. A numbered ADR 0026 arguably should cite the h-36d872fbb0e5 heading, as 0027 cites retired-decision-history.md#12-adr-0027. The disposition is unaffected.

Q3. assignment.test.mjs, dynamic-023508/023509 (L284/L288). `writes: ['docs']` is emitted as `Write scope: docs, ...` in the prompt and rejected as scalar-pass-through. docs/ survives the cutover, so it is cutover-neutral. R6 admits document paths put into worker context, so confirm that a bare document-root scope token is intentionally not a document path.

## Record-text notes (no outcome change)

- context-render reference-004292 (L183): its reason says "no ... asserted emitted navigation in this passage", yet L195 in the same test asserts the emitted path (004300). Narrow the wording to the `--docs-ref` input line.
- context-render reference-004301 and dynamics 021447, 021448, 021450, 021454, 021455, 021456, 021460 and 021461 use nonDocumentUse labels config-or-metadata / non-document-fs-probe. The real basis is test-owned tmp root (R21): initCwd/tmpRepoRoot is mkdtemp under os.tmpdir().
- dispatch.test.mjs 004381 resolverWitness scope reads "test-owned synthetic input/output" for a comment citation of a retired file. That is the wrong scope text.
- Spot checks that hold:
  - knowledge-resolver 004354 (docs/architect comment) has an explicit treeRetires true witness and a Canonical: No carrier.
  - All claim-port, dispatch and decision-index comment pointers are dated provenance on live or generated paths.
  - decision-index dynamics read a tmp cwd.
  - The knowledge-resolver registry fixtures are pure in-memory.
  - The driver-rununit `.git/hooks` and worktree probes are tmp-repo infrastructure.

## Mechanical items

The mechanical/neutral (R19/R21) tuples in this payload were checker-verified and are out of scope. I spot-checked the tmp roots of the context-render, decision-index, assignment-dispatch and claim-port tests and found none clearly wrong.

Status: DONE_WITH_CONCERNS
Summary: 98 items in 8 files. No patch, park or disposition defect, since every item is preserve. Four admission-consistency defects (R6/R7) in assignment.test.mjs, dispatch.test.mjs and driver-rununit.test.mjs, plus three Lead questions.
