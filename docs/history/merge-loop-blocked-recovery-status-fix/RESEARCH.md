---
type: research
title: RESEARCH — merge-loop stale `proposed` status reference
timestamp: 2026-08-12T16:52:00.000Z
---

# RESEARCH — tsk-3q8

## Round 1 (2026-08-12) — verify claimed stale status name

**Asked:** does `plugins/fgOS/skills/merge-loop/SKILL.md` playbook
`verify-fail-post-merge` step 5 (around line 204-206) really tell the
caller to run `fgos move <id> --to proposed` as the FSM recovery door out
of `blocked`, and is `proposed` a real status in
`src/state/status-fsm.mjs`'s `TRANSITIONS` table?

**Checked:**
- `plugins/fgOS/skills/merge-loop/SKILL.md:204-206` (read directly): step
  5 reads verbatim `fgos move <id> --to proposed` (the FSM's `blocked ->
  proposed` recovery door for this exact reason), then run
  `/fgOS:merge-next` again` — confirms the item description's quote is
  exact.
- `rg -n "proposed" src/state/status-fsm.mjs`: only hit is a comment at
  line 46 referencing historical wording ("needs to return to `proposed`
  directly") inside a comment block about `blocked -> awaiting-approval`
  (fan-out-parallel D18) — `proposed` never appears as a `from`/`to` value
  in the actual `TRANSITIONS` array.
- `rg -n "blocked" src/state/status-fsm.mjs` lines 101-149: the real
  `TRANSITIONS` entries out of `blocked` are `{from:'blocked', to:'todo'}`,
  `{from:'blocked', to:'doing'}`, `{from:'blocked', to:'awaiting-approval'}`,
  `{from:'blocked', to:'delivered'}`, `{from:'blocked', to:'wontfix'}` —
  five doors, none named `proposed`. Matches the exact error message quoted
  in the item description ("valid targets from blocked are: todo, doing,
  awaiting-approval, delivered, wontfix").
- `docs/decisions/0006-trang-thai-proposed.md`: confirms `proposed` was a
  real status once (added 0006, `doing -> proposed`, `proposed -> done`,
  `proposed -> todo`), frontmatter shows `superseded_by: 0024`.
- `docs/history/status-proposed-rename/` exists (`CONTEXT.md`, `plan.md`),
  and `scripts/migrate-status-proposed-to-awaiting-approval.mjs` exists at
  repo root scripts/ — corroborates `proposed` was renamed to
  `awaiting-approval` repo-wide at some point after 0006, and
  `merge-loop/SKILL.md` line 204-206 was never updated to match.

**Found:** claim fully confirmed. `proposed` is dead terminology from a
superseded decision (0006 → 0024, migrated by
`migrate-status-proposed-to-awaiting-approval.mjs`); the live FSM's only
recovery door out of `blocked` relevant to `verify-fail-post-merge`'s retry
step is `awaiting-approval`. No contradiction found anywhere.

**Still open:** none. The fix is a straight two-line text substitution:
line 204-206 of `plugins/fgOS/skills/merge-loop/SKILL.md`, replacing
`proposed` with `awaiting-approval` in both the `fgos move` command and
the FSM door name described in the parenthetical. No other logic in the
playbook changes.

**Verdict:** clear. Verify: `rg -n "proposed" plugins/fgOS/skills/merge-loop/SKILL.md` returns no match after the edit (the file's only other historical mentions of "proposed" wording, if any, are unrelated to this playbook step).
