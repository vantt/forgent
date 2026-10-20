# Review a38 step-05 rr4 p24

Part: p24 (one file, 127 items: 10 literal references, 117 dynamic tuples; no diff, no rollback; 3 parks, rest preserve).

## scripts/propose-doc-decisions.mjs (pin 95301cb9)

Verdict: rework. Items reviewed: 127.

### OUTCOME defects

D1. Parks 003627 (L107), 003629 (L158 col 42), 003632 (L158 col 81) are boilerplate parks. Rule: R4 and R9.
- The blocker text is "requires final composed candidate document input set ... current caller artifacts do not pin that candidate set". That is the boilerplate-type "depends on supplied set" sentence. It names nothing missing for these passages.
- L107 is a `startsWith('docs/architect/')` guard. L158 is a `startsWith` plus a `replace('docs/architect/', 'docs/platform/')` mapping.
- This is the plan's own migration gate script. Literal 003633 (L169) and dynamic 008555 are the same kind of `docs/architect/` literal in the same file, and both are preserve (frozen gate identity). R9 makes gate path operations preserve unless a named Phase 9 obligation applies. None is named.
- Correction: preserve all three with the same frozen-gate rule as 003633. Alternatively, cite an exact Phase 9 obligation; the current text does not.

D2. Root-only operands are admitted. Rule: R5 (resolve/parent of a root and scalar pass-through reject).
- 008570 (L238, `repoRoot: context.repoRoot`) and 008604 (L562, `repoRoot: context.repoRoot`) are admitted with pathOperand `context.repoRoot`. This is a root passed through an options object. It constructs and reads no document path. 008646 (`const root = context.repoRoot`) is correctly rejected as root-only.
- 008632 (L661), 008640 (L677), 008650 and 008651 (L703) are `path.resolve(cwd, values.get('--repo-root') || '.')`. This is a resolve of a root with a default, so R5 rejects it.
- Correction: REJECT all six with nonDocumentUse root-only. The same-line `resolve('--inventory')` operands 008631 and 008639 stay admitted. They are separate operands with their own operations; R7 uses actual operation intervals.

D3. Temp-dir scratch paths are admitted as document paths: 008608, 008609 (L589), 008610 (L591), 008611, 008612 (L592). Rule: R5/R6.
- These are `path.join(os.tmpdir(), 'fgos-work')`, `mkdtemp 'doc-review-'`, and temp `source` and `target` files.
- The code writes document text into scratch files only so `git diff --no-index` can run. No document path is constructed or read, so the pathOperand does not yield a document path.
- Correction: REJECT with a non-document use of temp scratch. R5 lists out/clone/cargo dirs as the analogue. Use the nearest allowed category.

### Record-text notes

- 003624, 003626, 003628, 003631 (L11 RECONCILIATION list) and 003630 carry the generic witness "retained non-authority registry/config or historical source identity". 003625 and 003633 carry the sharper "exact frozen migration gate identity". Consider one consistent R9 witness for the whole file. The outcomes (preserve) are fine.
- The 003625 (`docs/specs/`) and 003633 (`docs/architect/`) preserves rest on "frozen gate identity; Phase 9 owns gate retirement" and not on a "retained tree" witness. This is acceptable under R9.
- 003627, 003629 and 003632 have reason text "L12-71: navigation" while being gate-path guards. This is moot once the parks become preserves.
- All 117 dynamic tuples have a nonDocumentUse or pathOperand, and no successorNote is needed (no retired decision citation).

### Lead-judgment questions

Q1. 008654 (L704, `.split(path.sep).join('/')`) is rejected as text-label-join. 008652 and 008653 are the other two items on the same `reportPath = path.relative(repoRoot, resolve('--verdicts')).split(path.sep).join('/')` expression, and both are admitted. The join is part of one expression that builds the repo-relative review-report path. Under R7 the same operation should share one admission. Recommend ADMIT/preserve with pathOperand = the full expression. The nonDocumentUse "text-label-join" is not true for this item.

Q2. CLI-argument-only operands (`resolve(option)`, `path.resolve(cwd, input)`, `resolve('--out')`, and so on, items 008628-008645, 008647, 008652-008658) are admitted and preserved. They carry no fixed document root. They read or write caller-chosen inventory, shard, verdict and report files. Prior seam rulings (p09: "path resolution admit/preserve") support keeping them. Confirm this is the intended reading and not an R6 "caller data only" reject. I did not treat it as a defect.

### Counts

- Reviewed: 127.
- Outcome defects: 3 groups, covering 14 items.
  - Parks to preserve: 003627, 003629, 003632.
  - Admit to reject: 008570, 008604.
  - Admit to reject (root resolve): 008632, 008640, 008650, 008651.
  - Admit to reject (temp scratch): 008608-008612.
- Other items confirmed correct: the 63 rejects (guard, accumulator, finding-path-field, caller-data-formatting, text-label-join, root-only 008646) are true non-document uses, and the remaining admits read or write document paths.
