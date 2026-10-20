# review-a38-step-05-s4-p04 (part src-p04, 44 file entries, pin 95301cb9a)

Counts: 104 items reviewed (25 admitted literal refs preserve, 1 admitted literal ref patch, 4 admitted dynamic tuples parked, 74 rejected dynamic tuples). 9 whole-file diffs reviewed. 2 OUTCOME defects, 2 files rework.

## Per-file verdicts

### core/skills/distill/scripts/migrate-porting-state-backfill.mjs — REWORK (13 items)
Items: reference-000288, 000289, 000290, 000291 (preserve); dynamic-001816..001819 (ADMIT, parked); dynamic-001820..001824 (reject).

DEFECT 1 (dynamic-001816, 001817, 001818, 001819; source lines 20-22; rule L12-71 "same-passage literal and dynamic tuple share one outcome", and "park names a real blocker").
- Passage lines 17-25 holds the literal refs docs/distillery/porting-log.md (000288 at L3, 000290 at L21) and docs/distillery/state (000289 at L22, 000291 at L2). All are preserve (retained, docs/distillery exists at the pin and is not relocated).
- The dynamic tuples built from the same passage (`path.join(ROOT, "docs/distillery/porting-log.md")`, `path.join(ROOT, "docs/distillery/state")`, `STORE_DIR = path.join(ROOT...)`, `ROOT = process.cwd()`) are parked with only the generic text "depends on supplied roots/view or external target". blockedCategory is null.
- The target set is fully fixed. ROOT is the cwd and the two joined literals are the same retained distillery paths. No supplied view, no state export, and no moving document is involved, so no real blocker exists.
- Correction: give the four tuples the same outcome as the literals, preserve, with the same retained-convention witness and parity current == candidate. If the author wants to park them, the literals must park with a named blocker. Also, `ROOT = process.cwd()` (001816) builds no document path by itself. Reject it or fold it into the join chain as a non-path input, rather than parking it as a path-operation.

Rejects 001820-001824: fine. They are error text, a status=count summary, and a console.log summary. The record names the non-document use only through the role label and source witness (record-text note, not an outcome defect).

### core/skills/fgos-clarifying/SKILL.md — ok (0 items, diff)
### core/skills/fgos-researching/SKILL.md — ok (0 items, diff)
### domains/coding/skills/fgos-coding-discovering/SKILL.md — ok (0 items, diff)
### domains/coding/skills/fgos-coding-shaping/SKILL.md — ok (0 items, diff)
Each one-line diff swaps the RUL45 pointer docs/specs/runner.md for docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules. I checked that the file and the "## Business Rules" heading exist and that RUL45 is carried in the new spec (line 78, under the heading at line 25). The diffs are on source files, and the rollback is the exact line-inverse. The .agents, .claude and plugins/fgOS copies of these skills are generated and follow the source, which is correct.

### core/skills/fgos-indexing/SKILL.md and core/task-specs/fgos-indexing.md — ok (0 items, diff)
Both swap docs/specs/reading-map.md for docs/reading-map.md#5-detailed-product-and-source-map. The end-user-docs pointer bullet (docs/how-to/, tutorials, reference, explanation) is at docs/reading-map.md line 157, inside section 5, so the pointer is live. The src code has no reading-map consumer, only this prose.

### domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md — ok (diff)
### domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md — ok (2 refs, diff)
The diffs repoint docs/how-to/* to docs/knowledge/*. The targets exist at the review HEAD: preserve-shell-escapes-when-transcribing-a-verify-command.md and write-verify-for-a-skill-prose-change.md. The line-wrapped path in the new text stays readable, as the original did. reference-002280 and 002281 (docs/history/<feature>/plan.md at L64 and L68) are preserve with a Step 4 join and are outside the diff hunks (L13 and L46). The docs/history convention is retained and is not under docs/specs or docs/architect.

### plugins/fgOS/skills/cleanup-loop/SKILL.md — ok (3 refs, diff)
- 002337 (L21) and 002338 (L60) are inherited preserves of docs/history/fgos-cleanup-loop/CONTEXT.md. The target exists.
- 002339 (L31) is a patch to docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md. The target exists and the hunk matches the diff. plugins/fgOS/skills/cleanup-loop has no render header, so it is a source file, not a generated output.

### domains/coding/harness/enrich-and-validate-contract.mjs — REWORK (7 items)
DEFECT 2 (dynamic-002092 and dynamic-002093; source line 128; rule "an admitted tuple must construct a document path", and runtime-emitted strings are user-visible output).
- Both were REJECTED as non-document-infrastructure. The operands are `path.posix.join(work.docsRef, 'plan.md')` and `path.posix.join(work.docsRef, 'CONTEXT.md')`.
- They build the document paths `<docsRef>/plan.md` and `<docsRef>/CONTEXT.md`. docsRef is the item's docs/history/<feature> folder. They are pushed into `contract.contextRefs`, which are handed to workers as reading references. The header comment (L19-26) says so explicitly: "appends CONTEXT.md/plan.md context references under work.docsRef ... same relative-path construction".
- This is a dynamic document-path construction and a runtime-emitted output, so it cannot be a rejection.
- Correction: ADMIT both. Disposition preserve (the docs/history/<feature> convention is retained, same family as the Step 4 preserves of docs/history/<feature>/plan.md). Record parity current == candidate on the emitted contextRefs string set, and tie them to the same-convention construction in `buildDeclaredAssignment` (src/runner/dispatch/assignment.mjs).
- Other rejects in this file are fine: 002090 and 002091 (error text), 002094 (error prefix), 002095 and 002096 (the scope constraint string).

### core/skills/instruction-audit/scripts/instruction-audit.mjs — ok (49 rejects), with a Lead-judgment question below
I read the whole function body (lines 1-432). It audits agent-instruction surfaces (CLAUDE.md, AGENTS.md, .claude/rules, hooks, GEMINI.md, cursor and copilot files) under a caller `--root`. No path under docs/ is built. The rest of the rejects (formatting strings, hook paths, `foreignPaths`, `hooks.${event}` labels, `join()` serialization) are correct.

### Entries with no items and no diff — ok, nothing to review here
core/skills/fgos-routing/SKILL.md, domains/coding/skills/_shared/coding-cell-policy.md, and the coding exploring, implement, knowledge, planning and validating files and references that have no items or windows. docs/backlog.md has six author-added parks (author-s4-08912b8301b10321, a20431be6e7a6997, f02a917bdfe98c52, 033b8befd0b861df, 84005ca08befe2c0, 26fc8d2f9269bc9a) but no items or windows in this slice, so I did not review them. docs/transitional-switchboard.md has no items and no windows. Both are hand-maintained sources, which the request says change only through Step 3 row-flip custody and Step 7. I did not review their records in this part.

### Remaining files — ok
- fgos-coding-planning/SKILL.md (002278, 002279) and fgos-coding-validating/SKILL.md (002282): preserve with Step 4 join. Two refs and one ref respectively.
- gate-auto-approve-mechanics.md: 002283 (L14), 002284 and 002285 (L65, same passage and both preserve).
- coding task-spec shape-plan.md: 002286 is a preserve. It has no join. The `Mode: <lane>` line is a token contract, not a path, and the docs/history/<feature>/plan.md convention is retained.
- marketing agents yaml (4 files): 'scope:' rejects are correct.
- dogfood-fixture list: 002304 preserve (see Lead question 2).
- fgOS plugin skills answer, ask, approve, cleanup-next, coding-shape-distill, coding-shape, conflicts and deliver: refs are inherited preserves of docs/history/* (the targets exist at the pin).
- Rejects of `${CLAUDE_PROJECT_DIR}`, `repoRoot`, `fgosDir = repoRoot + '/.fgos'`, the `root=$(git rev-parse ...)` shell fragment, and the error and prose scraps are correct. They are project-root or `.fgos` state resolution, not document paths.

## Record-text notes (not outcome defects)
1. Many rejects use the role label "declarative-agent/task/config-metadata" for env-var, state-dir and prose-scrap operands. The label is odd but harmless. A plainer reason such as "project root / state dir, no document path" would name the actual non-document use. The rejectedAsUnrelatedReason text repeats the reason string.
2. Parked tuples 001816-001819 carry blockedCategory null and a generic blockedReason. If any park survives defect 1, it should name a real blocker.
3. Several preserves share one generic witness text, "retained external-project convention ... no relocation claimed". It would be more precise to name docs/history and docs/distillery as retained conventions.

## Lead-judgment questions
1. instruction-audit.mjs rejects as non-document-infrastructure the tuples that read instruction documents: `path.join(ROOT, f)` for CLAUDE.md, AGENTS.md and .claude/rules, `nestedAgentsFiles`, and `claudeImports`. `claudeImports` follows `@import` targets to arbitrary files, which could be anywhere under docs/. If root instruction documents count as document paths, these would need admit/preserve. I judge that they do not (they are fixed root names and a caller-supplied root, not migrating docs), so I kept the rejects. The `claudeImports` pair (`path.resolve(path.dirname(file), raw)` and the HOME join) is the borderline. The Lead decides whether to keep them rejected or admit them.
2. reference-002304 preserves `docs/decisions/0018-moc-mvp2-fgos.md`, which does not exist at the pin (corpus retired). It is consistent with the 6 other docs/decisions preserves elsewhere in seam 4, and is a dated-provenance pointer in a live skill. The Lead should confirm that a dead pointer to a retired corpus is intended as preserve rather than a repoint or park.

Status: DONE_WITH_CONCERNS
Summary: 104 items and 9 diffs reviewed in part p04. Two files need rework: migrate-porting-state-backfill.mjs (four dynamic tuples parked against same-passage preserved literals, with no real blocker) and enrich-and-validate-contract.mjs (dynamic-002092 and dynamic-002093 build docsRef/plan.md and CONTEXT.md contextRefs and must be admitted, not rejected). All other files are ok, with two Lead-judgment questions.
