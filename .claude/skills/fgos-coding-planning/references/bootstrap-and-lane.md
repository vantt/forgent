# Bootstrap and lane — full mechanics

The full detail behind SKILL.md's Step 1.

## Read CONTEXT.md

Read the item's `docsRef` field to find `docs/history/<feature>/`, then
read that feature's `CONTEXT.md` — the locked decisions are the only
source of truth for what this plan can assume. If a critical-patterns or
prior-learnings doc exists for this product area, read it too; a
precedent already solved beats research.

## Register a freshly-created feature dir's `docsRef` immediately

When `docsRef` is empty — most commonly an item whose discovery verdict
was `clear`, which skips `exploring` and therefore never gets a
`CONTEXT.md`/`docsRef` written for it — this skill still picks a
`docs/history/<feature>/` path of its own (a descriptive feature-slug is
fine; nothing here forces `<feature>` to equal the item id). The moment
that path is decided, BEFORE writing anything into it (`plan.md`,
`RESEARCH.md` from a `fgos-researching` call, etc.), register it on the
item:

```bash
fgos edit "<item-id>" --docs-ref "docs/history/<feature>/"
```

Skip this call when `docsRef` is already set — never overwrite a value
that already points somewhere real. Without it, `fgos approve`'s own
heavy-tier gate has no way to find `plan.md` unless `<feature>` happens
to equal the item id by coincidence — a real refusal one session hit
live, worked around there with a manual `git mv` to the item-id path.
`fgos-coding-exploring`'s own CONTEXT.md-creation step registers `docsRef`
the same way, at the same trigger.

## Reclaim the ball if it isn't yours

Check `data.work[id].holder` (`fgos list --id <id> --json`). If it is set
and not `implementer` — most commonly a mid-planning gap round that
parked via `fgos ask` inside `fgos-coding-exploring` and was `answer`ed
since — reclaim before continuing:

```bash
fgos handoff-return "<id>" --note "reclaiming at Bootstrap — holder was <role>"
```

Repeat, re-reading `holder` fresh each time, until it reads `implementer`
(a nested call can sit two deep). Stop when a call refuses with "no open
call" — the ordinary end state.

Skip when the item's domain declares no role graph.

## Read the lane

Read the lane `fgos-routing`'s own Orient step already decided for this
item (tiny/small/standard/high-risk/spike, plus the flag count and which
flags applied) — carried into this session as prose, never re-derived
here. Record that same count, those same flags, and the lane into
`plan.md` itself using the literal `Mode: <lane>` label (e.g. `Mode:
tiny` or `mode = **standard**`) — **never rename this recorded label to
`Lane:`**, even though this skill's own prose calls the concept "lane"
now: planning stage's own skip-and-advance short-circuit parses this
exact literal token from `plan.md` to skip a real model call on a
`tiny`/`small` item, and has no idea the concept was ever renamed (a real
regression once broke this coupling across 25 of this repo's own
`plan.md` files matching the old `Mode:` token while a lane recorded as
`Lane:` silently fell through to a real, unnecessary model call). Above
`small`, say plainly why a smaller lane would not honestly cover the
item. This is prose in `plan.md` — never a new field on the item, never a
value `stage` takes.

## Direct-entry fallback

`fgos-coding-exploring` and `fgos-coding-validating` can both hand off
straight into this skill without going through `fgos-routing` first,
which means a lane is not guaranteed to already be sitting in this
session's context. Check, in order:

1. Does `plan.md` already record a `Mode:` line from an earlier round (a
   hand-back from `fgos-coding-validating`, or this same item re-entering
   after a mid-planning CONTEXT.md gap) — if so, that recorded lane IS the
   answer, read it, never re-derive past it.
2. Did this session's own Orient step actually hand off a lane in prose —
   if so, use it, same as always.

Only when NEITHER of those holds — nobody has ever decided a lane for
this item — read and apply `fgos-routing`'s own Mode-gate subsection
directly (point at that source instead of restating its thresholds
inline — an earlier version of this fallback did that and silently
dropped the hard-gate flag enumeration and the tiny/small tie-breaker in
the retelling). This is not the "never re-derive" red flag firing — that
rule guards against overriding a lane already decided by either check
above; this is the one case where nobody decided one yet, and this skill
is genuinely the first to see the item.
