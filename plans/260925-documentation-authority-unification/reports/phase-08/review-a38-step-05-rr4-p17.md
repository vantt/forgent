# Review a38 step-05 rr4 p17

Part: s4-src-p17 (one file). Pin 95301cb9a. Scope: 34 literal references + 112 dynamic tuples = 146 items. No diff, no rollbackDiff (all outcomes are park or preserve), so no diff checks apply.

## scripts/generate-shipped-path-inventory.mjs — verdict: rework

Items reviewed: 146 (34 literal, 112 dynamic).

### OUTCOME defects

D1. Seven parks carry a boilerplate blocker (R4). Ids: reference-003572 (L814), 003578 (L190), 003584 (L191), 003585 (L192), 003590 (L193), 003586 (L393), 003594 (L394).
- All seven blockedReasons are the same sentence, with only line and expression changed: "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set".
- Nothing in it is specific to the passage. It is the "no bounded artifact/export supplied" shape that R4 rules out.
- The generators-seam blocker applies only to generator inputs/outputs. These are hand-written string literals in classifier prefix tests and in emitted prose.
- Inconsistent with the sibling lines. In the same classifyContractScope function:
  - L201 docs/distillery (003593), a consumer-project-contract prefix test, is preserve.
  - L257–283 docs/specs, docs/history, docs/decisions and the rest are preserve with the frozen-classifier witness (L12-14).
  - L722 (003597) is a fixed document literal in the emitted report text and is preserve.
- L190–193 are the same kind of line as L201. They are consumer-project Diataxis quadrant prefixes classified `consumer-project-contract`.
- L393–394 are the nonexistent-path prefix classifier in classifyPathAttributes, which assigns `sourceRole = 'consumer-knowledge-quadrant'`.
- L814 is emitted prose saying consumer-project contracts "must remain stable".
- Correction: preserve all seven under the frozen-classifier / consumer-convention witness used for 003593 and 003573 (no relocation claimed), with a resolverWitness. Keep a park only if the record names the exact Phase 9 obligation that moves these prefixes. The live-holder rule applies if one exists: docs/how-to and docs/explanation are shipped via package.json files and exist at the pin. docs/tutorials and docs/reference do not exist at the pin.
- The park is not tied to a specific blocker, and the passage is hand-written with a fixed target set.

D2. dynamic-007796 (L100) is REJECT with nonDocumentUse caller-data-formatting. It should be ADMIT.
- The operation is `execFileSync('git', ['show', `${commitSha}:${fileRel}`])`, a real git object read at a rev. R6 names `git show <rev>:<docpath>` as an admit.
- It is not formatting. fileRel is drawn from the SHIPPED_SURFACE_DIRS file set. That same set is admitted at 007798, 007824–007826 and 007843.
- The sibling filesystem read at L557 (007836, `path.resolve(repoRoot, fileRel)` + `readFileSync`) is admitted.
- Correction: ADMIT/preserve, with pathOperand `${commitSha}:${fileRel}` (the fileRel part).

D3. Admitted tuples whose pathOperand yields no document path (R5 / R6 "count-only" reject):
- dynamic-007853 (L641, `literalCurrentPath: 0`): a counter initializer. REJECT, nonDocumentUse accumulator.
- dynamic-007857 (L677, `totalUniquePathsCount: items.length`): a count field. REJECT, nonDocumentUse count-only or config-or-metadata. Count-only messages are rejected elsewhere in this same file (007860–007868).
- dynamic-007827 (L456, the `dirs.commit` pathOperand): a commit sha, a scalar pass-through. REJECT. Its neighbour 007828 (`treeFiles`, L457) is correctly ADMIT.

D4. The same operand gets different admissions on different lines. SHIPPED_SURFACE_DIRS used as the scan-dir default or fallback:
- ADMIT at L454 (007824), L455 (007825/6) and L608 (007843).
- REJECT scalar-pass-through at L612 (007847/8) and L615 (007850/1), which are `dirs = options.dirs || SHIPPED_SURFACE_DIRS`.
- All choose the document dir set that is scanned. Correction: ADMIT/preserve L612 and L615 with pathOperand SHIPPED_SURFACE_DIRS (or reject the whole group). This is not an R7 same-passage conflict, but it is an inconsistent operand rule.
- Related: dynamic-007839 (L586, `sortedPaths = [...pathMap.keys()].sort()`) is ADMIT. Its accumulator `pathMap` (007835) and its output field `path: p` (007840, R5's own example) are REJECT. Correction: REJECT, or admit all three.

### Record-text notes

N1. 007806 (PATH_REGEX, L21) has nonDocumentUse/role `state-event-store`. This is false: it is a path-extraction regex with no .fgos events access. The REJECT is right. Use a text-pattern or no-path-read label.

N2. The finding-path-field label is wrong on comment lines and regex lines:
- 007815 (L347, a doc comment)
- 007830 (L521, a comment above a regex)
- 007838 (L573, a comment)
The REJECTs are right.

N3. 007844 (L609, `typeof repoRoot === 'object'`) and 007849 (L613) are labelled accumulator but are type guards. 007817, 007846 and 007837 correctly use root-only.

N4. 007796 should not carry `caller-data-formatting` as its label (see D2).

N5. 003597 (L722): the witness "frozen classifier" fits poorly. The line is emitted prose that narrates a Phase 08 cutover, so a dated-narrative / fixed document literal in emitted output witness is more accurate. The outcome (preserve) is fine.

N6. 003574, 003576, 003583 and 003589 (docs/history, docs/decisions) cite the L12-10/26 "retained" witness. They sit in the same boolean `if` as the docs/specs and docs/architect items, which carry the frozen-classifier witness. The outcome is the same (preserve), so this is not a defect. The targets are not under docs/specs or docs/architect.

### Checks that passed

- Every admitted literal reference is a real document literal. Preserves resting on the frozen-classifier witness (docs/specs, docs/architect, docs/specs/runner.md, docs/specs/platform-foundations.md) do not use a "retained" witness for the retiring trees.
- 003602 and 003604 (retired decisions 0021 and 0026, existsAtPin false) carry a successorNote. Both heading anchors exist in docs/platform/runner/decisions/h-36d872fbb0e5.md (L211, L583).
- L255–283 literals and tuples in the one `if` condition share one outcome (preserve).
- Rejects confirmed true:
  - git rev-parse of a sha (007852), the error and console messages (007858, 007901, 007904, 007905), and the count messages (007860–007868).
  - The item.path table-row serializations (007870–007895 and similar), the joins (007797, 007799, 007831, 007900, 007907), the guards and the scope strings.
  - The root/cwd defaults (007816, 007817, 007837, 007842, 007845/6, 007881, 007908).

### Lead-judgment questions

Q1. 007902/007903 (L840–841, `path.resolve(cwd, argv[--json-out/--md-out])`, then `writeFileSync`): admitted as a write to a document path. The destination comes only from caller argv, with no fixed document root. That could be read as caller-data (R6, reject). It is admitted while the same-line printed message (007904/5) is rejected. Decide whether a caller-chosen output file is a document path write. If not, reject both, and the D2-style consistency note does not apply.

Q2. 007859 (L727, `Surfaces Scanned: ${inventory.surfacesScanned.join(', ')}`): REJECT, but surfacesScanned is the fixed SHIPPED_SURFACE_DIRS set that the file admits elsewhere as a document set. If that set is a document set, the emitted message prints a fixed document root (R6 admit). Decide how to treat it, together with D4.

Q3. 003573–003601 classifier preserves: acceptable under L12-14 deferred classifier repair. Phase 9 must still address the docs/specs and docs/architect prefixes when those trees retire, or the generator's output changes meaning.

## Counts

- Items 146: 34 literal (27 preserve, 7 park) and 112 dynamic (28 ADMIT, 84 REJECT).
- OUTCOME defects: 4 groups covering 7 + 1 + 3 + 6 items (D1: 7 parks, D2: 1, D3: 3, D4: 6 = 007847/8, 007850/1, 007839, and the related 007835/007840 pair if admitted).
- Record-text notes: 6.
- Lead questions: 3.
