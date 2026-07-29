# CONTEXT: /fgOS:merge-loop skill

Item: `tsk-1sm`. Depends on `tsk-4j9` ("Chuẩn hóa merge") — still `status: todo`,
`stage: executing`, unmerged, on branch `fgw/tsk-4j9`. The frontier already
gates on `deps`, so this item cannot reach `executing`/be merged before
`tsk-4j9` lands; no separate decision needed to enforce that.

## Feature boundary

Add one new thin wrapper skill, `plugins/fgOS/skills/merge-loop/SKILL.md`,
alongside the existing `merge-list/` and `merge-next/` skill dirs (found on
`fgw/tsk-4j9`, not yet on `main`). It packages the existing `/loop` (ck-loop)
skill plus the existing `/fgOS:merge-next` skill into one command that
repeatedly merges ready items, encoding the stop rules a person would
otherwise have to remember to state every time they call `/loop
/fgOS:merge-next` themselves.

No new CLI verb in `bin/fgos.mjs`. No changes to `merge-next`/`merge-list`/
`approve` mechanics. Classified as a mutation/operational skill (STR88's
grouping: `docs/backlog.md:127`), not a read-only one like `merge-list`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Pre-flight before the first `/loop` call is **soft-warn only**: the skill reminds the user the working tree should be clean, then proceeds regardless. It does not hard-refuse to start. Grounding: `merge next`/`approve` already gate per-attempt via `isWorkingTreeClean` (`src/runner/merge.mjs:169`, checked on branch `fgw/tsk-4j9`) — a dirty tree at loop start is already caught downstream on the very first iteration, so an upfront hard refuse would be a redundant duplicate gate, not a new safety property. |
| D2 | On a safety stop (Iron Law trip, or the same picked id blocked 2 consecutive turns) the skill reports via a **plain chat message only**, in the current conversation. It does **not** call `fgos ask <id>` to park the blocked item into `awaiting-human`. |

## Stop rules (already specified verbatim by the requester, not renegotiated here)

Read `merge next`'s JSON envelope (`data` field, verified against the actual
skill body at `fgw/tsk-4j9:plugins/fgOS/skills/merge-next/SKILL.md`) each
iteration:

- `{picked: null, reason: "nothing ready to merge"}` — frontier empty. Stop
  the loop (`ScheduleWakeup({stop: true})`), no error, nothing to report.
- `{picked: <id>, approve: {...}}` reaching `done` — normal, continue
  looping (schedule next dynamic wakeup).
- `{picked: <id>, approve: {blocked, reason: "merge-conflict" | ...}}` —
  normal on the *first* occurrence for that id; if the *same* id is picked
  and blocked again on the very next iteration in a row, that is the
  "2 consecutive turns" trigger — stop (D2: chat message only).
- `{picked: <id>, blocked: "iron-law", ...}` — counts toward the same
  same-id/2-consecutive-turns rule as merge-conflict/verify-fail (per the
  requester's own wording grouping all three under one stop condition).
  Never auto-run `--acknowledge-iron-law` on the skill's own authority.

## Canonical references

- `plugins/fgOS/skills/merge-next/SKILL.md` (branch `fgw/tsk-4j9`) — exact
  output envelope shapes cited above.
- `plugins/fgOS/skills/merge-list/SKILL.md` (branch `fgw/tsk-4j9`) — sibling
  read-only skill this new skill sits next to.
- `src/runner/merge.mjs:169` (`isWorkingTreeClean`, branch `fgw/tsk-4j9`) —
  grounds D1.
- `docs/backlog.md:127` (STR88) — mutation vs read/check grouping this item
  cites for its own classification.
- `~/.claude/skills/ck-loop/SKILL.md` — the existing `/loop` dynamic
  self-pacing mechanism this skill must recurse into (D6 of `tsk-4j9`'s own
  CONTEXT.md: "cải tiến process có sẵn tại chỗ, không xây đường song song").

## Deferred / out of scope (not asked, marked here per Socratic-lock rule)

- Any stop condition beyond the three the requester already enumerated
  (e.g. an overall iteration cap, or alternating-between-two-bad-ids
  detection) — scope creep beyond what was asked; leave to a future item if
  it surfaces in practice.
- Whether `tsk-4j9`'s `kind: "bug"` mislabels a feature — item classification
  is not this skill's concern.

## Open questions for planning

None outstanding — the requester's own description already pins the
implementation shape (recurse into `/loop`, no new CLI verb, exact stop
JSON shapes). `fgos-planning` still owns deciding whether this is small
enough for a single pass or needs its own split, and the concrete
implementation steps.
