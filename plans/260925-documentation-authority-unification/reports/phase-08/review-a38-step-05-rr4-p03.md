# Review a38 Step 05 seam 4 rr4, part p03 (source files)

Payload: s4-src-p03.json, 9 source files, 105 items (21 literal references, 84 dynamic tuples). No diffs, no rollbackDiffs, no co-cut paths in this part. 21 items are parked (all generators seam). Read pinned bytes of every file beyond the windows where the window did not settle the operation.

## Per-file verdicts

| File | Items | Verdict |
|---|---|---|
| apps/fgos-gateway/src/mcp.rs | 38 (11 ref, 27 dyn) | ok |
| src/report/decision-index.mjs | 14 (4 ref, 10 dyn) | rework (D1) |
| src/report/knowledge-projection.mjs | 9 dyn | ok |
| src/report/authoritative-match.mjs | 2 dyn | ok |
| src/report/enduser-index-generate.mjs | 23 (2 ref, 21 dyn) | rework (D1, D2) |
| src/report/enduser-index.mjs | 7 (3 ref, 4 dyn) | ok (Q1 applies to 009791) |
| src/report/frontmatter.mjs | 6 dyn | ok |
| src/report/item-trace.mjs | 2 dyn | ok |
| src/report/knowledge-resolver.mjs | 4 (1 ref, 3 dyn) | ok with Q2 |

## OUTCOME defects

**D1. R4 and L12-72 p01 N1 (fixed path constant on a retained root parked on a template blocker).**
- dynamic-009761 (decision-index.mjs L18, `path.join(repoRoot,'docs','decisions','index.md')`).
- dynamic-009767 (decision-index.mjs L91, `indexPath = indexPathFor(repoRoot)`).
- dynamic-009768 (enduser-index-generate.mjs L103, `path.join(repoRoot,'docs','enduser-docs-index.json')`).
- dynamic-009769 (enduser-index-generate.mjs L117, `manifestPath = manifestPathFor(repoRoot)`).
- Why: each operand is a fixed literal target set on a retained root. docs/decisions/index.md "preserves" (owner answers L608), and docs/enduser-docs-index.json is a shipped retained file (L12-72 p06, package.json `files`). R4 says a hand-written source whose target set is fixed on a retained root is preserve. The blocker text ("requires bounded generator source rows and final document scan set; source-data identity correction is not yet supplied") is the same sentence on all four and names nothing missing for a constant path. The same `indexPath` flows into the L128 refusal message, which dynamic-009758 already admits and preserves, so one operand has two outcomes.
- Correction: preserve all four with the existing parity obligation (current == candidate) and keep the output-set parity receipt unexecuted. If Lead keeps any of them parked, the blocker must name the specific missing item for that line. For decision-index it is the committed-rows legacy path text rewrite carried from L419 of the owner answers; no such text is in the current reasons.

**D2. R7 (same line, one admission across all items).**
- enduser-index-generate.mjs L36: dynamic-009777 `path.relative(repoRoot, absPath)` is ADMIT parked, but dynamic-009778 `join('/')` on the same expression `path.relative(repoRoot, absPath).split(path.sep).join('/')` is REJECT/text-label-join.
- enduser-index-generate.mjs L76: dynamic-009785 ADMIT parked, dynamic-009786 `join('/')` REJECT.
- The `.join('/')` is the last step of constructing the admitted docPath, not an independent label join. The same file's L36/L76 pair therefore disagrees, while the decision-index L135 and enduser L156 pairs (both reject) agree.
- Correction: admit 009778 and 009786 with 009777 and 009785, giving them the same outcome (pathOperand the full docPath expression). Both are rejected only if Lead rules the whole chain as non-document, which then also contradicts 009777/009785.

## Lead-judgment questions

**Q1. The rest of the enduser-index-generate generator parks.** 009774, 009775, 009776, 009777, 009779, 009780, 009781, 009782, 009783, 009784, 009785, 009787, 009788 and enduser-index.mjs 009791 share the same template blocker.
- Their roots are `docs/<quadrant>` (QUADRANTS constant), `docs/knowledge` and the alias `decisions`. They are fixed on retained roots, and the source code already scans docs/knowledge. Under R4 the same logic as D1 points to preserve with the parity receipt.
- The one candidate for a real park is the `decisions` alias (009788, 009791). The corpus behind docs/decisions retired and only the generated index.md remains, so whether the alias stays in the scan set is a real open fact. If parked, the blocker must say that, not the template sentence.
- Recommendation: preserve the retained-root scans, keep only the `decisions` alias parked with a blocker naming the alias question. This is a judgment on how far R4 reaches into "generator inputs", so I did not call every one a defect.

**Q2. Admission consistency of string-equality path lookups.**
- knowledge-resolver.mjs 009810/009811/009812 (`d.currentPath === path`, `d.aliases.includes(path)`) are ADMIT/document-identity-lookup and parked. The module is a pure function with no file I/O. It compares strings from the registry view and constructs, reads, probes and emits no path.
- enduser-index.mjs 009792 (`outcome.docPath === docPath`) is the same kind of comparison and is REJECT/guard.
- One of the two is wrong under R5/R6. Aliases are lookup-only, which supports the admission of the resolver; the registry contents are state data, so the park is real if admitted. I lean to admit-and-park for the resolver (it is the alias lookup door) and reject for 009792 only if Lead rules its comparison a pure guard, but they should be stated as one rule. Lead to decide.

## Record-text notes

- dynamic-009812: `pathOperand` is the whole predicate `path || (Array.isArray(d.aliases) && d.aliases.includes(path))`, which yields a boolean. It should name the lookup key `path` (or `d.aliases`).
- dynamic-000766 and dynamic-000772: `nonDocumentUse` is `finding-path-field` for a Rust type token and a `use std::path::PathBuf;` import. Should be a type/import category (config-or-metadata like 000765).
- dynamic-000770 (`message.join("\n")`): `nonDocumentUse` is `scalar-pass-through`; 000769 uses `text-label-join` for the identical construct. Align to `text-label-join`.
- mcp.rs L130 and L132: the error messages print `contract_path.display()` from the fixed `docs/contracts/...` literal (R6 emitted message). There is no tuple for them. The 000200/000767 preserve covers the passage, and its parity obligation should mention the two messages explicitly.
- mcp.rs comment references 000196-000199 are REJECT while the comparable comment provenance in the report files is ADMIT/preserve. All outcomes are preserve and the targets (docs/contracts, docs/history) are retained, so no outcome effect.
- reference-003701 is correctly labelled a pattern (existsAtPin false); fine.

## Checks that passed

- All 6 mcp.rs fixture tuples (000777/778, 000782/783, 000787/788) and the admitted reader (000200, 000767/768) are real document path operations. docs/contracts is a retained root, so preserve is justified. The `temp_dir().join(format!(...))` roots, `PathBuf` fields, `lines.join`/`message.join` and the YAML fixture bodies construct no document path, so the rejects are true.
- decision-index 009758 (refusal message with `${indexPath}`) is correctly admitted under R6. 009759/009760 (returned `path` field and `.join('/')`), 009762-009766 are true non-document uses.
- knowledge-projection: all 9 rejects are caller-data formatting of registry fields into generated markdown, with no fixed document root.
- authoritative-match (adapter name error) and frontmatter (delimiter and scalar formatting) and item-trace (`docPath` field pass-through): all true rejects. `.fgos/events.jsonl` (009770) is a state event-store probe, true reject.
- Retired-decision citations: none of the 21 literal references cites a retired 00NN decision file, so no successorNote is owed. 003697, 003698 and 003702 point into docs/specs or docs/architect, preserve only as dated provenance with an explicit "tree retires" witness, and no live holder exists in docs/platform or docs/knowledge (grep of docs/platform and docs/knowledge found none). That matches L12-72 on 003698.
- No diff exists, so there is no diff-on-source or rollback issue.

## Counts

105 items reviewed; 21 parked, 84 preserve. Admitted: 21 ref (mcp.rs 7, other files 14) and 33 dyn; rejected 4 ref (mcp.rs comments) and 51 dyn. OUTCOME defects: 2 (6 items across D1, 4+... listed: 009761, 009767, 009768, 009769, 009778, 009786). Lead questions: 2. Record-text notes: 6.

Status: DONE_WITH_CONCERNS
