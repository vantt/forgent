# Review a38 step-05 rr4 p21

Part: s4-src-p21 (3 source files, no diffs, no parks, no retired-decision citations).
Items reviewed: 132 (67 + 18 + 47: 45 dynamic + 2 literal in measure-verify-cost).
Counts: measure-coordination-baseline 67 dynamic; measure-p08-performance 18 dynamic; measure-verify-cost 2 literal (003617, 003618) + 40 dynamic (the third file lists 42 items; payload print showed 40 dynamic, 008324-008363).

## scripts/measure-coordination-baseline.mjs — ok (67 dynamic, all REJECT/preserve)
- No OUTCOME defect. All operands are root/scalar plumbing, sandbox tmp dirs, `.fgos` state (coordination sessions/assignments, event store), `.git` probes, fixture/package-lock JSON, finding path echoes, text joins or caller-data formatting. None constructs a legacy document path.
- CANONICAL_SKILL_PATHS (L17-20) and measureSkills read (L305-314) touch core/skills/**/SKILL.md and domains/coding/skills/**/SKILL.md. These are not census roots (no literal reference exists for them in this file) and do not retire, so reject is defensible.
- Record-text notes: 008242 (L17 skill path list) and 008266/008267 (L305) use `scalar-pass-through`, which hides that these are real skill-file reads. A more truthful label would be "skill source files, not a migrated document root". 008261 `config-or-metadata` on session.json is fine.

## scripts/measure-p08-performance.mjs — ok with one Lead-judgment question (18 dynamic, all REJECT/preserve)
- No hard OUTCOME defect, provided plans/ is not a census root (the L4 comment naming plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json has no census reference, which supports that).
- Lead question Q1: 008308/008309 (L121-127 `outPath = path.join(repoRoot,'plans','260910-1700-rust-host-r1-kernel','reports','p08-performance.json')`, then `writeFileSync`) and 008310 (L130 prints outPath) are rejected as `scalar-pass-through` / `caller-data-formatting`. The path is built from fixed literal segments under plans/ and is written. If plans/ is a document root for R6 (the p08 ruling treats fixed plans/ gate inputs as exact gate identity and admits them), these should be ADMIT/preserve. If plans/ is out of scope, the nonDocumentUse label is false. Please decide the scope and align the labels.
- 008318/008319 print rustBin/devManifestPath under target/: not document paths, fine.

## scripts/measure-verify-cost.mjs — rework (2 literal ADMIT + 40 dynamic)
- OUTCOME DEFECT D1: dynamic-008327 (L270) is REJECT/preserve (`caller-data-formatting`, operand `(${totalEvents} dòng ...`), but it sits in the SAME `lines.push(...)` operation as the ADMIT/preserve literal reference-003617 (`docs/history/tsk-vms-verify-cost-audit/`), which is emitted into the report text. Rule R7: same line/passage, one admission and one disposition across literal and dynamic items. The tuple's own operation excerpt contains the fixed document literal, so this is not a side-by-side independent operation (unlike a count formatter next to a separate path). Correction: 008327 becomes ADMIT/preserve with pathOperand naming the emitted docs/history/tsk-vms-verify-cost-audit/ literal, same disposition as 003617 (retained docs/history convention).
- Lead question Q2 (same class as Q1): 008362/008363 (L372-377 reportPath = join(outputRoot,'plans','reports','verify-cost-empirical-260807-1540-pick-return-approve-audit-report.md'), then mkdir/writeFileSync of the Markdown report) are rejected as `scalar-pass-through`. This writes a Markdown report under a fixed plans/reports path. Same scope decision as Q1; the label is untrue as written, and the L384 console.log of reportPath has no own item.
- Record-text notes:
  - 003617 matchedExpression/sourceSpan carry a stray trailing backslash (`...audit/\`) from the template-literal escape, and its resolverWitness says existsAtPin false. The directory exists (003618 shows CONTEXT.md exists at the pin). The false witness is a regex artifact; it should name docs/history/tsk-vms-verify-cost-audit/ with existsAtPin true.
  - 008325 (L212, a comment mentioning bare `CONTEXT.md`) is labelled `caller-data-formatting`. The operand is a comment mention, so the label should say comment/bare file name. Reject is right (bare name, no path).
  - 008349/008350 (L302 "xem CONTEXT.md" in emitted text) are bare-name mentions, so reject is fine, but the `caller-data-formatting` label is generic.
- All other items checked: .fgos/events.jsonl (008360/008361) is the state event store, git common dir probe (008326), outputRoot/mainCheckoutRoot (008358/008359), all the Vietnamese report-line formatting, joins and thrown error strings reject correctly.

## Extra checks (L12-72)
- Admitted dynamic tuples: none in this part. D1 would add one admitted dynamic tuple, and it needs a pathOperand.
- Rejected tuples: nonDocumentUse is true for all except the label issues noted above (Q1, Q2, the 008242/008266/008267 label nits, 008325).
- Parks: none. Same-passage agreement: violated only at L270 (D1). Retired decision citations: none present.

Status: DONE_WITH_CONCERNS
