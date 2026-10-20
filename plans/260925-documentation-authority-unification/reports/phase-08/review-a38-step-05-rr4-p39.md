# Review a38 Step 5 rr4 p39

Pin aa8d34374. Payload: s4-src-p39.json (2 files, 74 items, no diffs, no parks).

## src/setup/terminal-control-checks.mjs
Verdict: ok. Items reviewed: 35 (dynamic-015252..015286), all REJECT/preserve.
- Operands are path.resolve(repoRoot) pass-through into resolveTerminalConfig, the fgosDirOf `.fgos` / resolveStateRoot terminal state dir (state, not documents), and err/`${dir}`/herdr/anchor-pane message formatting. None construct or read a document path. The only docs path in the file (line 2, spec.md header comment) is not among these dynamic tuples.
- nonDocumentUse labels (scalar-pass-through, state-event-store, caller-data-formatting, text-label-join, guard) are true for each passage.
- Same-line items agree (L140 x3, L23 x2, L95 x3 all REJECT/preserve). No diff, so nothing to check on source-file or rollback.
- OUTCOME defects: none.

## src/setup/workflow-pool-independence.mjs
Verdict: ok. Items reviewed: 39 (dynamic-015287..015325), all REJECT/preserve.
- workflowDefinitionFiles / readWorkflowDefinitionFiles (L37-51, 73-84) read core/workflows and domains/*/workflows .yaml/.yml/.json definition files. These are configuration inputs, not census document roots, and `docs/` does not appear anywhere in the file. Rejecting them is right.
- workflowRoots (L93-94) is root-only path.resolve comparison, and the JSDoc roots items (L65-66) are type annotations. Both are rejects.
- The pool-evaluation messages (L120-197) are text and label joins and caller-data formatting. They print no fixed document path.
- Same-line items agree (L169, L172, L175, L44, L51, L94 groups).
- OUTCOME defects: none.

## Record-text notes
- dynamic-015304, 015305, 015316, 015317, 015321, 015322, 015324 use nonDocumentUse "config-or-metadata". The label is true. Workflow definitions are config, and the file-pattern/root-metadata operands carry no document path. Prefer a more specific label (workflow-definition-config) only if the vocabulary allows it.
- dynamic-015311 has role non-document-infrastructure while its same-line siblings 015310 and 015312 have non-document-message. The outcome is identical (REJECT/preserve), so this is only a role-label inconsistency.

## Lead-judgment questions
None.

## Counts
Files 2, items 74, REJECT 74, ADMIT 0, parks 0, diffs 0, OUTCOME defects 0.
