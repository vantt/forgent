# Review a38 — Step 4 wave 1, part 20 (L12-10 mandatory controls)

Pin: ef62747ddb0952d3cf1a3558f5ea650e77fcbe7e. Payload: step-04-wave1-p20.json (22 files, 43 slots). All 22 files read whole from the pin (all under 320 lines). Nothing run beyond python3 readers and `git show`/`git cat-file`.

## Verdict: all 22 files ok, 0 rework, 43/43 slots reviewed

Checks done and result:

1. Every slot is preserve. All 43 slots carry advisoryClass preserve, file-level preCutoverAction and cutoverAction preserve, and "no record diff". No patch and no parked slot in this part.
2. No conversion of external-project plan topology. No slot targets plans/. No `plans/` string occurs in any of the 22 files. `docs/history/<feature>/plan.md`, `CONTEXT.md`, `RESEARCH.md` and `DISCUSSION.md` conventions are untouched.
3. 13 conventions vs 9 historical references are distinguished correctly.
   - 13 literal-plan-convention files: fgos-coding-planning/SKILL.md and references/verify-sync-and-gap.md, fgos-coding-validating/SKILL.md and references/gate-auto-approve-mechanics.md, each in domains source, .agents render and plugins render (12), plus domains/coding/task-specs/shape-plan.md (1). These use the `<feature>` placeholder, which is the writer or reader convention for the target project.
   - 9 named-historical-plan-reference files: _shared/capability-catalog.md, executor-dispatch-fallback.md and planning-capability-awareness.md, each in core, .agents and plugins. These cite concrete feature dirs: agent-coordination-foundation, agent-executor-generalized-capacity-helper and two-layer-dispatch. Their slot kind is historical-citation.
   - gate-auto-approve-mechanics.md is classed as a convention file because of the `<feature>/plan.md` token (L14 or L15). Its two gate-bypass/CONTEXT.md slots (L65 or L66, cols 224 and 333) are correctly typed historical-citation inside a literal `fgos decision` command template. Preserving them is right: they are emitted text for other projects, and the cited path exists at the pin.
4. Source and render copies agree. Every .agents and plugins file differs from its source by exactly one line, the added generated-header comment. .agents and plugins copies are byte-identical to each other. Every render slot has renderOnly true, surface render-joins, and sourceOwner equal to the real owner. Owners are core/skills/_shared/* for the _shared cluster and domains/coding/skills/* for the planning and validating skills. This matches L12-58(3): joins only, no render diff.
5. Slot mapping is exact. Every slot's binding (1-based columns, line, text) resolves in the pinned file to its matchedExpression. All 22 file digests equal the pinned bytes. The full set of `docs/history/...` occurrences per file is 1:1 with the slots (counts match in all 22 files: 43 in total, none missing, none extra).
6. Cited targets exist at the pin: docs/history/agent-coordination-foundation/plan.md, agent-executor-generalized-capacity-helper/CONTEXT.md, two-layer-dispatch/DISCUSSION.md, gate-bypass/CONTEXT.md. Nothing here needs a dead-link park.
7. Cross-check with records: the two domains source files that have step04 records (step04-002: verify-sync-and-gap.md skills-055/056, gate-auto-approve-mechanics.md skills-059/060/061) are all preserve. This agrees with the p20 slots. Their line numbers differ from p20 (render shifts by one line), as expected.

## OUTCOME defects
None.

## Occurrences with no slot (outside L12-10 scope, informational)
- Bare `plan.md`, `CONTEXT.md`, `DISCUSSION.md` mentions (about 60 per planning/validating file) are prose names, not paths. They are carried as companionBareNames metadata only, correctly without slots. `RESEARCH.md` never occurs in the 22 files.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` (verify-sync-and-gap.md L16/17), `docs/how-to/preserve-` followed by `shell-escapes-when-transcribing-a-verify-command.md` (a line-wrapped path, L49/50), `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` (executor-dispatch-fallback.md, wrapped across lines 239/240 in core and 311/312 in the end note), and `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md` (L292) have no slot in p20. They are not L12-10 items. All of those targets are absent at the pin, so they are dead-link candidates for the docs/how-to and docs/decisions classes. The step-02c inventory contains the write-verify path (7 hits), but I found no step-04 record covering these files for them. The wrapped-line forms (preserve-/shell-escapes and 0026-...) are not in the step-02 census or step-02c inventory edges at all, so line-wrapped paths may be missed by the census.

## Record-text notes (not rework)
- Slot kind labels are slightly coarse. validating/SKILL.md L16 and gate-auto-approve L15 `docs/history/<feature>/plan.md` are labelled reader-convention. That is fine. The `--plan` flag is a reader use.
- The control text for the 12 .agents and plugins files says "preserve all four sibling document conventions", but only plan.md, CONTEXT.md and (for one file) DISCUSSION.md exist in them. RESEARCH.md has no occurrence. Harmless.

## Lead-judgment questions
1. Are the wrapped or dead docs/how-to and docs/decisions references above covered by some other step 3 or step 4 class? If not, they are a census gap, not an L12-10 defect. The gap is unrelated to this part's controls.

## Counts
- Set L12-10-mandatory-controls: 22 files reviewed, 0 rework, 43 slots reviewed.
- Stratum: all mandatory (13 convention files, 9 historical-reference files). Rework 0%.

Status: DONE
Summary: All 22 L12-10 files and 43 slots are correct preserves. The 13 convention and 9 historical-reference files are classified properly, nothing is converted to plans/, and source and render copies differ only by the generated header.
