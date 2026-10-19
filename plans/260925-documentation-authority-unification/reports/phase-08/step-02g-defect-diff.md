# Parser defect diff against step 02f

Author measurement only; independent review is pending. All counts overlap and are not error-rate denominators. Every class lists its measurement predicate, all old/new IDs and source-span joined examples in `step-02g-review-data.json`. No consumer patch was applied. The 02f census and all pilot reviews remain unchanged.

## L12-23: new defect classes

| Defect class | Before → after |
|---|---:|
| committed-tree-target-existence | 1 → 0 |
| image-link-marker | 1 → 0 |
| path-label-backticks | 3 → 0 |
| inherited-carriage-live-body | 311 → 0 |
| explicit-carriage-region | 52 → 0 |
| operative-read-whole-phrase | 68 → 0 |
| table-final-row-source-locator | 1 → 0 |
| same-path-general-directory-mirror | 27 → 0 |
| retained-root-file | 58 → 0 |
| migration-source-column | 23 → 0 |
| already-moved-successor-note | 24 → 0 |
| migration-target-doc-row-flip | 1 → 0 |
| read-first-column-exact-spec | 1 → 0 |

The tree check counts executable patches to targets absent from the committed input tree, rather than checking a filesystem snapshot. `maps-f-00329` now has no executable patch or nonexistent directory owner; its source-column context is preserved. `maps-f-03344` uses the same committed-tree resolution. Source bytes and target files/directories are read at inputHEAD with explicit repository cwd. No consumer bytes depend on the shell cwd.

Carriage means explicit evidence in the current file: carriage headings, retained Source Detail/complete-source-unit sections, and framed History snapshots under the file's title with current History/retained-snapshot metadata. It never means an inherited `conserved-source-context` flag or merely a `/history/` path. Fenced headings cannot prematurely end the region. Non-history conservation bodies without such framing are live. The live-body comparison measures inherited rows now eligible for a cutover patch; the explicit-region comparison measures prior action/patch errors, not every reclassification. All variants remain mandatory review.

Source-column protection extends to migration plans/ledgers (including current-source columns in plan sections 4.5/6) and legacy-file audit columns. A current-source column in a live component navigation table remains navigation. Headers are recognized by Markdown separators and stay active through the final row. Whole reading directives retain `[human labels]`, `Read the`, and `read it first`; read-only/read-map and incidental Vietnamese runtime reads do not trigger operative routing. “Đọc gì trước” is an operative column and resolves work-state to its exact spec.

Moved-file discovery uses only committed knowledge blobs, with exact basename or a unique truncated-basename continuation; the ruled coding/code name drift gets a lookup note. Decision 0026 routes to the runner decision history, 0027 to work-state's retired decision history. A live consumer remains parked for Step 3 exact-patch approval; successor notes are never executable substitutions. Retained root references, including file:line locators, preserve their current topology.

## L12-21 regression predicates, measured against 02f

| Defect class | Before → after |
|---|---:|
| partial-reference-patch | 0 → 0 |
| corrupted-reference-key | 0 → 0 |
| split-markdown-link | 0 → 0 |
| evidence-prefix-or-suffix-patch | 0 → 0 |
| prefix-inside-longer-token | 0 → 0 |
| code-token-as-path | 0 → 0 |
| unexpanded-brace-list | 0 → 0 |
| provenance-rewritten | 21 → 0 |
| migration-cell-path-substitution | 1 → 0 |
| generated-hand-patch | 0 → 0 |
| operative-read-to-area-portal | 2 → 0 |
| self-link-patch | 0 → 0 |
| verbatim-carriage-patch | 32 → 0 |
| authoritative-for-key-rewrite | 0 → 0 |
| reading-map-wrong-owner | 0 → 0 |
| evidence-wrong-mirror | 2 → 0 |
| live-writer-treated-as-navigation | 0 → 0 |
| checker-scope-treated-as-navigation | 0 → 0 |
| external-citation-with-fgos-owner | 0 → 0 |
| ui-compiler-self-reference-rewritten | 0 → 0 |
| roadmap-without-semantic-disposition | 0 → 0 |
| template-placeholder-rewritten | 0 → 0 |

## L12-22 regression predicates, measured against 02f

| Defect class | Before → after |
|---|---:|
| block-context-writer | 0 → 0 |
| migration-before-inherited-provenance | 1 → 0 |
| directory-trailing-slash | 0 → 0 |
| whole-template-placeholder | 0 → 0 |
| same-path-directory-mirror | 0 → 0 |
| retained-docs-history | 0 → 0 |
| deleted-target-successor-note | 0 → 0 |
| migration-plan-source-locator | 20 → 0 |
| retired-handoff-checkpoint-write | 0 → 0 |
| observe-exact-spec | 0 → 0 |
| carriage-without-alias-and-link-check-exclusion | 40 → 0 |
| code-snippet-relative-specifier | 0 → 0 |

Comparisons against both 02c and 02e are also retained, with all 197 chronological overlay controls and final effective hashes propagated to mappings, exceptions, sample and resolved review parts. Counts of a contextual class can change after a better boundary rule; zero is a mechanical author result, not semantic acceptance. The read-only replay checks all downstream artifacts and the pilot crosswalk. Phase 9 must exclude verbatim carriage regions from its link check, preserving carriage without aliases (21 already-broken links in the prior review); no checker or vocabulary is changed here.
