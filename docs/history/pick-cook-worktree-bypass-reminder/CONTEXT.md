---
type: clarify-context
title: Direct branch checkout on main checkout instead of worktree (tsk-4hk)
tags: []
timestamp: 2026-08-03T09:12:00.000Z
source_capture_ids: [tsk-4hk]
---

# Feature boundary

tsk-4hk records a process incident: a session checked out an `fgw/*` work
branch directly on the main checkout (instead of via `/fgOS:pick`'s
`EnterWorktree` flow) twice, which mixed that branch's tree with 14
unrelated retro-loop items and someone else's code. The mixup was
untangled with no data loss — everything landed on two separate branches,
`fgw/retro-loop-docs-260802` and `fgw/dispatch-terminology-rename-260803`
— at the cost of cleanup time only.

This item's own boundary is: (1) write a journal entry recording the
incident, its mechanism, and its resolution, and (2) add a short reminder
note to the two skills whose own worktree flow this bypassed, so the next
session reads the warning before repeating the mistake. It is NOT a code
fix, NOT a new `doctor` check, and NOT a retroactive cleanup of the two
branches (already resolved before this item was even submitted).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Deliverable is a new dated entry under `docs/journals/`, not a `docs/history/<feature>/CONTEXT.md`-style feature-decision doc. This repo already has the matching convention for exactly this shape of item — a resolved incident writeup with no code fix — e.g. `docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md` (same theme: worktree/checkout mishap). This `CONTEXT.md` is only `fgos-coding-exploring`'s own mechanical clarify-stage artifact; the actual reader-facing deliverable planning/executing produce is the journal entry. |
| D2 | Scope includes a concrete safeguard: add a short reminder note to `plugins/fgOS/skills/pick/SKILL.md` and `plugins/fgOS/skills/cook/SKILL.md`, warning against checking out an `fgw/*` branch directly on the main checkout instead of using the `EnterWorktree`/pick worktree flow. No `fgos doctor` check, no code-level gate — a documented reminder line only (user's own choice: "(b) note nhắc pick/cook"). |
| D3 | The journal entry must quote the concrete reflog lines as mechanism evidence, not just paraphrase the user's own narrative: `HEAD@{29}: moving from main to fgw/retro-loop-docs-260802` and `HEAD@{15}: moving from fgw/dispatch-terminology-rename-260803 to main` (both from `git reflog show HEAD` in the main checkout, captured 2026-08-03). |

# Pinned terms

- "Sự cố dọc đường" (incident found along the way): a process mistake
  discovered and resolved during other work, not a production bug and not
  requiring a hotfix — the item exists purely to record it and reduce
  recurrence risk.

# Scout evidence

- `git reflog show HEAD` in `/home/vantt/projects/forgentX` (main checkout)
  confirms the exact mechanism: `HEAD@{29}: checkout: moving from main to
  fgw/retro-loop-docs-260802` and `HEAD@{15}: checkout: moving from
  fgw/dispatch-terminology-rename-260803 to main` — a direct `git
  checkout` of a work branch onto the main checkout's HEAD, not a worktree.
- `git branch -a` confirms both branches exist and are intact:
  `fgw/dispatch-terminology-rename-260803` (local),
  `fgw/retro-loop-docs-260802` (local + `origin/fgw/retro-loop-docs-260802`).
- `docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md` is the
  closest existing analog: same journal format (Date/Severity/Component/
  Status header, What Happened / technical detail sections), same theme
  (worktree/checkout mishap), same resolved-no-further-code-fix shape.
- `fgos tool query --capability impact-analysis --status present` returned
  GitNexus `present` (full posture) — not load-bearing here since this
  item touches only markdown (two `SKILL.md` reminder notes + one journal
  entry), no application code.

# Canonical references

- `docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md` —
  format to follow for the new journal entry.
- `plugins/fgOS/skills/pick/SKILL.md` step 4 — the `EnterWorktree` flow
  this incident bypassed.
- `plugins/fgOS/skills/cook/SKILL.md` — the other entry point that also
  claims items into worktrees and should carry the same reminder.

# Outstanding questions deferred to planning

- Exact wording and placement of the reminder note inside each `SKILL.md`
  (which section, how prominent) is an implementation choice for
  `fgos-coding-planning`/`fgos-coding-implement`, not locked here.
- Exact journal entry filename (`docs/journals/<timestamp>-<slug>-tsk-4hk.md`)
  and full prose are also left to planning/executing — only its required
  content (D1, D3) is locked.
