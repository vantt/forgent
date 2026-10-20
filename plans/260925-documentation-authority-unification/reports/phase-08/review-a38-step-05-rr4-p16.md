# Review a38 step-05 rr4 p16

Part: p16 (one file). Pin 95301cb9a. No diff and no rollbackDiff in the payload (all 276 items are preserve or park; none is a patch).

## scripts/generate-doc-inventory.mjs

Verdict: **rework**. Items reviewed: 276 (13 literal references, 263 dynamic tuples). 75 admitted, 201 rejected, 6 parked.

The bulk of the file is fine: formatting, accumulators, guards, joins, root-only defaults, finding path fields and the `.json`/`.md` constant block. The defects below are specific.

### OUTCOME defects

**A. Six parks carry the boilerplate blocker (R4, R9, R7).**
Items 003560 (docs/specs, L339), 003561 (docs/how-to, L328), 003565 (docs/tutorials, L329), 003566 (docs/reference, L330), 003568 (docs/architect, L340), 003570 (docs/explanation, L331).
- Every blockedReason reads "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set". That is the "depends on supplied roots / export parity" boilerplate R4 rules out. It names nothing missing for the passage.
- The passage is a hand-written `DIRECTORY_HEURISTICS` row with a fixed prefix. The same table's rows for docs/ui-spec, docs/history, docs/decisions, docs/distillery and docs/contracts are preserved.
- Dynamic tuple 7737 (`DIRECTORY_HEURISTICS = [`, L323) is also preserve, so the table is preserve as a whole while six of its rows are parked.
- The script is a gate script and R9 applies. phase-08 L59 lists it among the generators, and plan.md calls it the inventory gate tool. Phase-09 and plan.md name no obligation that changes these rows. R9 therefore gives preserve.
- Correction: change all six to preserve with no blockedReason or dependency.
  - For how-to, tutorials, reference and explanation, the retained-root witness is fine.
  - For docs/specs (L339) and docs/architect (L340), both retiring roots, do NOT use a "retained root" witness. Use an explicit frozen-gate-identity witness: this is a Phase 8 gate classification row, preserved under R9, and its meaning is Phase 9's to change.

**B. Document reads and emitted fixed document paths were rejected as formatting (R6).**
- 7557 (L1268): `readBlobAtCommit(commitSha, \`${PHASE_DIR}/transitional-switchboard.json\`, repoRoot)` reads a fixed document via git show. It was rejected as caller-data-formatting and must be ADMIT/preserve.
- 7771 (L760): the same shape for `${PHASE_DIR}/shipped-path-conventions-inventory.json`. Must be ADMIT/preserve.
- 7749 (L56): `git show ${commitSha}:${fileRel}`. R6 says admit `git show <rev>:<docpath>`. It was rejected as caller-data-formatting. Must be ADMIT/preserve (pathOperand `${commitSha}:${fileRel}`). Its callers at L760, L1017 and L1268 already read documents.
- 7625 (L160): `identityScopePathspec()` returns `[...SCAN_ROOTS, ...ADDITIONAL_ROOT_FILES, \`${PHASE_DIR}/transitional-switchboard.json\`]`. This is a fixed document path set, and the sibling roots (7723 and 7724) are admitted. It must be ADMIT/preserve.
- 7664 (L1842): `lines.push(\`- \\\`${INVENTORY_MANIFEST_PATH}\\\`\`)` prints a fixed document path into the generated report header. R6 says a printed path from a fixed literal or root is a document operation. Rejected as caller-data-formatting; must be ADMIT/preserve.
- 7742 (L36): `OUTPUT_PARTS_PREFIXES = OUTPUT_MANIFEST_PATHS.map(p => \`${p.replace(/\.json$/,'')}.parts/\`)` constructs fixed document-directory prefixes. The neighbours 7741 (L35) and 7743 (L37) are admitted. Must be ADMIT/preserve.

**C. Admission is split inside one operation (R7).**
- L997: 7793 and 7794 (`targetPath: null`, `targetPaths: []`) are REJECT/finding-path-field, but 7795 (`derived.unresolvedRoot`) is ADMIT. All three are in one `addUnresolved(...)` call. They need one outcome. Pick the passage's real operation. It only records an unresolved root string and null placeholders into a gap finding, so the consistent outcome is REJECT for all three. Alternatively admit all three and name the pathOperand.
- L1945: 7708 (`toSourcePath: ...argv[toIdx+1]`) is ADMIT, but 7709 (`sourcePath: argv[sourceIdx+1]`) is REJECT/finding-path-field. Both are operands of one `carryForwardIdentityRegistry(...)` call that re-reads that path at the commit. The sourcePath operand is a real path input, not a finding field. Make 7709 ADMIT/preserve.

**D. Admitted operands that do not yield a document path (R5/R6).**
- 7761 (L657, `normalizeDocTarget(rawTarget, sourcePath = '')`) and 7765 (L672, `extractLinks(content, sourcePath = '')`) have pathOperand `'') {`. These are scalar parameter defaults. R5 rejects defaults, and 7719 (`sourcePath = null`) is already rejected as scalar-pass-through. Make them REJECT/scalar-pass-through.
- 7626 (L1602): the `byPathAnchor` comparator `(a, b) => compareText(normalizePosix(a.sourcePath), ...)` only sorts. It was admitted with pathOperand `(a, b)`, which is not a path. It is a guard, so REJECT.
- 7559 (L1281, `paths: [...paths].sort()`) and 7646 (L1729, `paths: [...pathsForSha].sort()`) are data fields that only carry path values in conflict and duplicate groups. R5 says finding data fields that carry a path value reject. 7649 (`path: p`) and 7650 in the same groups are already rejected. Make both REJECT/finding-path-field.

### Record-text notes (outcome fine)

- 7777 (L811, the `pathToken` regex): nonDocumentUse `state-event-store` is false. The regex scans content for docs, plans, scripts and other path tokens. The label should be a shape guard or the item should be admitted. This is consistent with the 7788/7791 handling, so relabel at minimum. Admit/reject is borderline; see Lead question 1.
- 7788 (L949): pathOperand `null }` and 7791 (L955): pathOperand `null }` are wrong. The path operand is `normalized` in 7788 and `pattern` in 7791.
- 7699/7702: pathOperand `registryPath }` is a truncated fragment. It should be `registryPath`.
- 7727: pathOperand `rootDocuments || []) {` is a truncated fragment.
- 003567: resolverWitness expression is 'docs/contracts', but the passage text shown is docs/enduser-docs-index.json. This looks like an off-by-one witness. 003571 (L333) also carries a mislabelled own-passage text for docs/doc-registry.
- No retired decision citations are among the items, so no successorNote is required.

### Lead-judgment questions

1. 7551 (`SCAN_ROOTS.some(root => norm === root || norm.startsWith(root + '/'))`, L1232) and 7783 to 7786 (the `roots` set, L936 to L945) are guards on fixed document roots. They are rejected as guard/accumulator. Do they count as probing a document path (R6) or are they pure guards (R5)? The current outcome is defensible. A move of docs would change the scan set, but the SCAN_ROOTS literal itself (7723) is admitted and owns that.
2. Does the 6-park fix need Lead sign-off on a frozen-gate witness for the docs/specs and docs/architect rows? R8 allows a preserve only as "tree retires" provenance, and R9 gives the gate-freeze basis. I recommend R9.

### Counts

- Items: 276 (13 literal, 263 dynamic).
- Outcome defects: A 6 items, B 6 items (7557, 7771, 7749, 7625, 7664, 7742), C 3 items (7793, 7794, 7795 as one group) plus 2 (7708, 7709), D 5 items (7761, 7765, 7626, 7559, 7646). Total about 22 items with wrong outcome.
- Items fine: about 254.
- Record-text notes: 6.
