# Review a38 Step 5 rr4 p13

Payload: s4-src-p13.json (2 files, 96 items, no parks, no diffs).

## scripts/doc-alias-resolver.mjs: verdict rework (1 outcome defect)

Items reviewed: 58 (dynamic-007287 to 007344).

OUTCOME defects:
- dynamic-007342, source L87, R6: rejected as caller-data-formatting. The message prints `must be under ${OWNER_ROOT}`, and OWNER_ROOT is the fixed document root 'docs/platform/' (L24). The printed path comes from a fixed document root, so the output changes if that root moves. The tuple must be ADMIT/preserve with a pathOperand of `OWNER_ROOT`. Preserve is correct under R9 because this is a gate script. The L87 `startsWith(OWNER_ROOT)` guard shares the statement, so one admission applies. Contrast 007295 (L128), which prints only caller data `entry.toOwner` and correctly stays REJECT.

Checked and ok:
- ADMIT items: 007291 and 007292 (L117 resolve toOwner, same passage, agree), 007297 (git show revision:refPath), 007298 (readFileSync of the resolved refPath), 007299 (relative-link join), 007307 (DEFAULT_ALIAS_TABLE_PATH literal), 007311 (OWNER_ROOT literal), 007312 and 007313 (L251 table path), 007316 (constitution read). Each pathOperand really yields a document path in the passage.
- REJECT items: every nonDocumentUse is true.
  - scalar pass-through: `repoRoot = null` defaults, `repoRoot: cwd`, `consumerPath`.
  - finding-path-field: splitRef, `path: lineMatch[1]`.
  - guard and accumulator.
  - alias-table key lookups `${refPath}#${heading}` (007308 to 007310, 007344). These are lookup keys, not file reads.
  - error and status text built from caller data.
- All items share the preserve disposition, consistent with R9 for gate bytes frozen in Phase 8.
- The L118 existsSync and the L120 and L149 reads take the ownerPath and refPath operands already admitted at L117 and L147/149. The L118 message tuple (007293) is a separate caller-data operand, so rejecting it is correct (side-by-side rule).

Record-text notes:
- 007300 and 007301 (L185 doc-comment `path:line` text) carry nonDocumentUse=finding-path-field. The true category is comment text. Reject is correct, so this is a label fix only.
- 007296 (L144) is labelled guard. The `.md` and repoRoot guard is correct as reject.
- Most `reason` and `rejectedAsUnrelatedReason` fields end with a "family receipt" sentence in operationChain.containmentAndErrors ("See pinned enclosing function and family receipt"). That is boilerplate in the record text, not an outcome problem.

## scripts/doc-binding-repair.mjs: verdict ok (0 outcome defects)

Items reviewed: 38 (dynamic-007345 to 007382).

- The file does no filesystem or git reads. Its only comment about git show (L155) is an instruction to the package caller, with no item.
- The one ADMIT, 007349 (L131, join of dirname(unit.path) and the link file into a resolved link target), is consistent with the alias-resolver L180 admission, and preserve fits R9.
- The 37 REJECT items are all true non-document uses.
  - text and label joins: join('\n'), labels.join, split/join text revision.
  - guards that compare path fields (`r.path===target.path`).
  - regex construction over text (L110, L113).
  - error and report strings built from caller or unit data: cite() prints `u.path:line#anchor` from unit data with no fixed root, so formatting is correct.
- All items share preserve.

## Lead-judgment question

- 007315 (L260 in doc-alias-resolver): the message `error loading ${tablePath}` prints `path.resolve(cwd, option('--table') ?? DEFAULT_ALIAS_TABLE_PATH)`. By default that is the fixed document literal plans/260925.../alias-table.json, which 007307 and 007312 admit. R6 says a message whose printed path comes from a fixed document literal is admitted. I read it as mixed caller and default data, and the record rejects it as caller-data formatting. I left it as ok. If Lead reads R6 strictly, it flips to ADMIT/preserve with the same outcome (preserve either way), so the effect is only on the admission count. The same applies to 007320 to 007322 and 007325 only if they print a path. They do not.

## Counts

- Items reviewed: 96 (58 + 38).
- Outcome defects: 1 (007342).
- Record-text notes: 2.
- Lead-judgment questions: 1.
- Parks: 0. Diffs: 0. Successor-note cases: none (no retired decision citations).

Status: DONE_WITH_CONCERNS
Summary: Reviewed 96 items in 2 gate scripts. One admission defect (007342, a fixed OWNER_ROOT printed in a message, must be admitted) and one borderline question (007315).
