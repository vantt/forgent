# Review a38 step-05 rr4 p04 (seam 4 sources)

Payload: s4-src-p04.json, 20 files, 79 items (57 + 10 + 5 reference/dynamic items shown below). Pin 95301cb9.

## Per file

| File | Verdict | Items |
|---|---|---|
| src/setup/instruction-projections.mjs | rework (D1; see also Q1) | 57 |
| core/agents/{code-reviewer, council-assumptions, council-feedback-loops, council-ship-maintain, debugger, docs-manager, fgos-placeholder, fullstack-developer, planner, researcher}.yaml (10 files) | ok | 1 each = 10 |
| core/skills/_shared/capability-catalog.md | ok | 1 |
| core/skills/_shared/executor-dispatch-fallback.md | ok | 4 |
| core/skills/_shared/planning-capability-awareness.md | ok | 1 |
| core/skills/_shared/catchup-self-recovery.md | ok (diff reviewed, no items in payload) | 0 |
| core/skills/_shared/fgos-cli-fallback.md | ok (no items, no doc refs at pin) | 0 |
| core/skills/distill/SKILL.md, references/consult-protocol.md, deep-dive-protocol.md, extract-rules.md | not reviewable (payload has 0 items, see Q2) | 0 |

## OUTCOME defects

**D1. src/setup/instruction-projections.mjs, 9 parked ADMIT items: 013890, 013891 (L247), 013892 (L252), 013893 (L262), 013899, 013900 (L281), 013912, 013913 (L332), 013920 (L60).**
- Rule: R4 (park only with a real blocker specific to this passage; a hand-written source whose target set is fixed on a retained root => preserve) and R7.
- The pathOperand is correct: `options.destinationPath ?? PORTABLE_AGENTS_DESTINATION` yields root `AGENTS.md`. The L60 `path.join(cursor, part)` lstat walk also covers it. The admissions are right.
- The blockedReason is the same sentence for all nine, with only the operand text swapped: "requires composed canonical instruction/skill/agent inputs and resulting generated destination inventory after source patches; final source bytes are not assembled". That is the boilerplate R4 rules out ("depends on supplied roots / export parity", "no bounded artifact/export supplied"). It does not name what is missing for this passage.
- The path operations resolve to a fixed document, root AGENTS.md. That document is not relocated in Phase 9, and no patch changes the operand. Nothing is missing for the path operations themselves.
- Platform-laws content flowing into the managed block is Step 7's composition. It changes the rendered text, not any path operand here.
- Correction: preserve all nine, naming the fixed destination `AGENTS.md` as the retained root. Keep the generators-seam coupling only if the Lead rules that parked generator outputs must wait for Step 7 (see Q1). In that case the blocker must name the specific Step 7 obligation: regenerate the managed block together with the patched core/instructions/platform-laws.md. It must not use the generic sentence.

## Admission and disposition checks (no defect)

- instruction-projections rejects (48 items) hold:
  - `.fgos/installation/projections/ledger.json` (L18) and `.fgos/instructions/effective/<key>.json` (EFFECTIVE_INSTRUCTIONS_DIR in instruction-composition.mjs L43) are state paths. Rejected as state-event-store: 013884, 013925, 013927, 013878, 013886, 013887, 013894, 013896, 013897/8, 013901/2, 013910/11, 013914/15.
  - Error-metadata `filePath`, label formatting, `lines.join`, `sources.join`, and the scalar returns and defaults (L30, L71, L90, L98, L159) are caller-data formatting, scalar pass-through or text join. The `filePath` values are mixed (ledger, cursor, destination), so there is no fixed document root.
  - L36 `split(path.sep).join('/')` is path-string normalization, not a document read.
- Same-line pairs agree: 013890/91, 013899/900, 013912/13 are both ADMIT/parked. 013897/98 and 013910/11 are both REJECT/preserve. L247 and L332 are consistent.
- The ten agent YAMLs: the one tuple per file is the `tool-scope:` key, a tool-name list. REJECT config-or-metadata is correct and matches across all ten.
- capability-catalog L5, planning-capability-awareness L7, executor-dispatch-fallback L12, L33, L151, L224: ADMIT/preserve against docs/history/** (retained external-project convention, owner-answers L12-10/26). The targets exist at pin (agent-coordination-foundation/plan.md confirmed). They join Step 4 priors physically, with the same disposition. Passages are single-item each.
- executor-dispatch-fallback diff (L292 how-to to docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md):
  - It is a source file and changes only that passage.
  - The target exists at pin and the rollback is the exact inverse. It matches the inherited Step 4 hunk in step04-030.jsonl.
  - The two docs/decisions/0026 citations (L239, L311) are not in this payload. They are inherited Step 3/4 slots.
- catchup-self-recovery diff (L47 docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md to docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md):
  - The target exists at pin and the old path does not.
  - It is a source file, one passage, with an exact inverse. This is the live-holder patch required by owner-answers L12-72, G1-G3.

## Record-text notes

- N1. The ten agent YAMLs' `rejectedAsUnrelatedReason` says "Exact own operand 'scope:'" and the witness is `tool-scope:`. The operand text comes from a pattern and is a substring of the key. The text is honest but odd. Consider "tool-scope list key" for clarity.
- N2. capability-catalog and the other history preserves cite a "decision corpus identity" resolverWitness rule string that is generic. The passage itself is a navigation pointer to retained docs/history, so the label is acceptable.

## Lead-judgment questions

- Q1. Is a "generators seam" park the intended outcome for the AGENTS.md destination operations in instruction-projections.mjs (D1)? The p01 review accepted it. The R4 text says the seam blocker applies to generator inputs and outputs. These operations are the generator's own output door. If the park stays, the nine blockedReason strings must name the exact Step 7 obligation rather than the generic sentence.
- Q2. The preserved messages 013905 (L305) and 013908 (L322), plus 013906 (L315) and 013909 (L323) for ledger, print `computed.destinationRelativePath`. That path derives from the fixed default `AGENTS.md`. Under R6 ("printed path comes from a fixed document literal/root") the destination-printing messages 013905 and 013908 could be admitted. They are rejected as caller-data-formatting because options.destinationPath can override. The outcome is preserve either way, so only the admission label differs. Lead should decide whether the destination-printing messages stay REJECT (the override makes it caller data) or become ADMIT/preserve. Same-passage items 013904/013907 at L304 and L321 are scalar and unaffected.
- Q3. The four distill files (SKILL.md L58 and L119 docs/distillery, consult-protocol L22 docs/reference-learning-system.md and L30, L49, deep-dive-protocol L27, extract-rules L76) and fgos-cli-fallback carry 0 items in this payload, and catchup-self-recovery carries 0 items beside its diff. The owner-answers say author-added source slots own them. Those slots were not in my payload, so I could not verify them. Lead should confirm the slots are covered by another part. The catchup-self-recovery patch itself was verified from the diff above.

## Counts

Files 20. Items reviewed 79: 70 rejects/preserves + 9 admits parked (instruction-projections), 10 config rejects (agents), 7 admit/preserve (history references), plus 2 source diffs checked. OUTCOME defects: 1 (D1, 9 items). Record-text notes: 2. Lead questions: 3.
