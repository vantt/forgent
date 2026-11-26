# Phase 1: Rule units and pointers

Capability: `code:implement`, then `code:review`.

## Inputs

- `plans/discussions/ds-que32ftgg6-ready-plan-runs-unattended/DISCUSSION.md` §6 (U1-U7 text, placement table) and §4
  (D1, D4, D5). Copy the meaning of U1-U7 faithfully; U7 keeps the owner's full explanation (§6, "kept in full so it
  is not misread").
- `plan.md` of this plan, section "The Unattended run section": the section shape the units describe and phase 2 checks.
- Unit format: `core/instructions/rul104-better-not-bigger.md` (core unit frontmatter) and
  `domains/coding/instructions/coding-verification-discipline.md` (domain unit with `when: domain: [coding]`).
- Prior art for adding a core unit and regenerating its projections: commit `8780e3ee37` (added
  `core/instructions/product-priority-order.md`, regenerated AGENTS.md and the skill surfaces). Repeat its regeneration
  commands (`npm run build:skills` and the instruction projection it used), never hand-edit a generated file.
- Current restated text to replace: `core/skills/_shared/plan-contract.md`,
  `domains/coding/skills/fgos-coding-planning/SKILL.md`, `domains/coding/skills/fgos-coding-validating/SKILL.md`,
  `core/skills/fgos-lead/SKILL.md`.

## Footprint

`core/instructions/ready-plan-runs-unattended.md` (new), `domains/coding/instructions/coding-footprint-tracing.md`
(new), `core/skills/_shared/plan-contract.md`, `domains/coding/skills/fgos-coding-planning/SKILL.md`,
`domains/coding/skills/fgos-coding-validating/SKILL.md`, `core/skills/fgos-lead/SKILL.md`, and the generated
surfaces `AGENTS.md`, `.fgos/instructions/effective/**`, `.agents/skills/**`, `.claude/skills/**`,
`plugins/fgOS/skills/**` (regenerated only).

## Steps

1. Write `core/instructions/ready-plan-runs-unattended.md`: kind `procedure`, owner `core`, scope `repo`, no `when:`
   (reaches every agent today; selection by role waits for ACE, plan non-goals). Body: U2 (host steps as `fgos` argv
   plus executor; the table of doors is data read at plan time with `fgos can-i`, not text in the unit; `deny` or
   no door means not `ready`; a lead requests supervisor rows with `supervisor raise --kind coordination-help`; the
   full gate runs through `fgos release check --worktree <path>` called by the lead), U3 (fixed cleanup: lead lists,
   supervisor removes through `worktree remove --delivered-to`, unmerged and dirty go in the closing report), U4
   (`[core]` / `[debt-ok]` marks, unmarked means `core`, debt recorded by the lead in its closing report and opened as a
   backlog row by the secretary), U5 (the five beyond-the-rule classes ask once, batched, before `ready`; only the
   touched phases wait), U6 (what the check enforces), U7 (the split lens, in full). Name the section shape from
   `plan.md`. Keep the unit short: rule text, not rationale; cite the discussion for why.
2. Write `domains/coding/instructions/coding-footprint-tracing.md`: kind `procedure`, owner `coding`,
   `when: domain: [coding]`. Body: U1 only (new entry point: copy the file set of the nearest earlier commit that
   added the same kind of entry point, found with `git log -S`, then add what the drift checks name; changed or deleted
   symbol or path: every reference `rg` and the impact tool return; generated files named as hot files and
   regenerated; run-time widening goes through the widen door). It lists no files.
3. In `plan-contract.md`, add "Unattended run" to the §3 body list (between Phases and Owner questions) with the shape
   from `plan.md`, add the acceptance mark rule, and point at the two units for the rule itself. Add the date-gate
   sentence matching phase 2's constant.
4. In `fgos-coding-planning` and `fgos-coding-validating` SKILL.md, replace any restated part of U1-U7 with one-line
   pointers to the units; in validating, add that it resolves each host-step argv with `fgos can-i` and treats `deny`
   as not `ready` (U2), and judges U1 trace completeness (U6). In `fgos-lead` SKILL.md, add one line each: run the
   full gate through `fgos release check --worktree <path>` before the final land; at close follow U3 and U4 from the
   core unit.
5. Regenerate every projection per the prior-art commit and confirm the diff of generated files comes only from
   steps 1-4.

## Verify

- `jq -r '.. | .id? // empty' .fgos/instructions/effective/rules.json | rg -x 'ready-plan-runs-unattended|coding-footprint-tracing'`
  prints both ids.
- `rg -n "cost of waiting vs cost of being wrong" core/skills domains/coding/skills` returns only pointer lines (no
  restated U7), and `rg -c "debt-ok" core/skills/_shared/plan-contract.md` is small (shape and pointer only).
- `npm run build:skills` leaves no diff afterwards (generated surfaces in sync).
- The test files that guard instruction composition and skill projection pass (find them through the prior-art
  commit's verify; run them with `node --test`).

Pass: all of the above green, and a reviewer confirms U1-U7 say what §6 says.

## Rollback

Revert the phase commit; the projections return with it.
