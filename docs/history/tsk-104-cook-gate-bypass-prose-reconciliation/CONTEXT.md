# CONTEXT: cook's stale "never auto-approve" prose contradicts gate-bypass

Item: `tsk-104`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0.** Root cause confirmed by reading `plugins/fgOS/skills/cook/
  SKILL.md` in full: two places overclaim "always ask" —
  - frontmatter `description` (:6-11): "Pauses for real human approval at
    every dev-skill gate ... never auto-approved."
  - Hard rules (:27-31): "Never auto-approve a gate."
  Both contradict `.claude/skills/fgos-coding-exploring`/`fgos-coding-planning`/
  `fgos-coding-validating`'s own Gate sections (`:269-271,313-321` /
  `:282-284,313-314` / `:177,210-213`), which check `canAutoApprove`/
  `canAutoApproveValidate` first and skip the question when it returns
  true (`docs/history/gate-bypass/CONTEXT.md` D1-D6). Confirmed live this
  session repeatedly: `readGateBypassLevel` returns a configured level,
  and `canAutoApprove`/`canAutoApproveValidate` legitimately return `true`
  for real items (e.g. `tsk-2ew`, `tsk-3k2`, `tsk-2wpi` in this very scan
  cleared their plan/validate gates without a question).
- **D1.** Which side is authoritative, by git history: cook's hard rule
  shipped in `94f314e` (2026-07-28, the commit that created `cook`);
  gate-bypass shipped the NEXT DAY in `8aaacee` (2026-07-29) with its own
  decision record, a fail-closed implementation (`docs/history/gate-
  bypass/CONTEXT.md` D1-D5), and a structured audit trail
  (`fgos gate-approve --actor bypass`). Cook's line is stale prose
  written before gate-bypass existed, never updated after — not a
  deliberate policy choice to always ask regardless of configuration.
- **D2.** `plugins/fgOS/skills/cook/SKILL.md`'s OWN downstream flow
  description (`:118-121`) is already accurate and needs no change:
  "Every real gate a stage-skill hits along the way ... still surfaces
  exactly as before — the driver invokes those skills unchanged, it does
  not swallow or pre-answer their own gates." This is correct: cook's own
  driver never bypasses anything itself — the auto-approve logic lives
  entirely INSIDE each dev-skill's own Gate section, which cook's driver
  faithfully invokes either way. Only the frontmatter description and the
  Hard rules bullet (D0) contradict this already-correct passage — the
  fix is bringing the top of the file in line with what the bottom
  already says, not inventing new behavior.
- **D3.** No `.agents/skills/**` mirror needed: confirmed
  `plugins/fgOS/skills/cook` has no `.agents` counterpart (same as this
  scan's `tsk-2ew` finding for the whole `plugins/fgOS/skills/**` tree).

## Outstanding questions

None
