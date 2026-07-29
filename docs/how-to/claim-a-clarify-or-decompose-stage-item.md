---
type: how-to
title: How to claim an item that is still at stage `clarify` or `decompose`
tags: []
timestamp: 2026-07-29T03:25:44.000Z
source_capture_ids: [tsk-1ab-1]
---
# How to claim an item that is still at stage `clarify` or `decompose`

Use this when you need to start `fgos-exploring` or `fgos-planning` work on
an item that has not yet reached the frontier (`fgos ready`) — i.e. its
`stage` is `clarify` or `decompose`, not `executing`.

## Before you start

- You need the item's id (`fgos list` shows every item's `stage`).
- This applies to a fresh session about to do clarify/decompose work, not
  to resuming an item you already claimed.

## Steps

1. **Use `fgos pick --id <id>`, never `fgos take --id <id>`.** Only `pick`
   accepts an item outside the frontier:

   ```
   fgos pick --id <id>
   ```

   `pick` also stands up the item's isolated `fgw/<id>` worktree as part of
   the same call — useful even if you plan to do clarify/decompose work
   directly on the id without a separate worktree, since it is the only
   claim verb that does not reject on stage.

2. **Do not follow `fgos-routing`'s own literal `take` example for this
   case.** That skill's "Claim" section currently reads `fgos take --role
   session [--id <id>]` — this is broken for a `clarify`/`decompose` item;
   see "Why this exists" below.

## Why this exists

`take` and `pick` both delegate the actual claim write to the same
`claimWork` (`src/runner/claim-port.mjs`, unified per `tsk-53f` D1) — but
each verb gates *before* that call with its own separate eligibility
check, and the two checks disagree for an item outside the frontier:

- `take --id <id>` (`bin/fgos.mjs:1233-1237`) hard-rejects a `todo` item
  that is not in `readyWork()` (the frontier — `executing`-stage-only by
  definition):

  > `"take: "${id}" is todo but not in the frontier yet (stage/deps/lineage) — take only opens the same set the runner would dispatch (D1)."`

- `pick --id <id>` (`bin/fgos.mjs:1272-1285`) has no such check. The
  comment right above it confirms this is intentional:

  > `"the frontier-membership guard removed below was a hard check at THIS verb layer, never an FSM law"` — `bin/fgos.mjs:1266-1267`

`plugins/fgOS/skills/cook/SKILL.md` already found this the hard way and
worked around it in its own flow:

> `"Claiming only works at stage executing. Verified empirically against this repo: fgos take --actor session --id <id> on a clarify-stage item is rejected — ... This skill follows the verified behavior — no claim before executing — rather than that prose; reconciling fgos-routing itself is a separate, out-of-scope fix."` — `plugins/fgOS/skills/cook/SKILL.md:36-39,133-134`

`fgos-routing` itself was never updated to match — it still tells a reader
to `take --id <id>` for exactly the case that call rejects.

## Real example

`tsk-1ab` was claimed via `pick tsk-1ab` while still at stage `clarify`
(no `--id` needed here since it was already the frontier-adjacent target
of an earlier `/fgOS:pick tsk-1ab` invocation). The claim event:

> `{"id":"tsk-1ab","from":"todo","to":"doing", ...}` — real claim event,
> seq 502, item stage `clarify` at claim time (confirmed via `fgos list`
> immediately after: `"stage": "clarify"`).

Had the same claim been attempted with `fgos take --id tsk-1ab` instead,
the `bin/fgos.mjs:1233-1237` guard above would have rejected it outright,
since `tsk-1ab` was `todo` and not yet in `readyWork()`.

## Related

- `docs/decisions/0022-fgos-choke-point-survey.md` — the fuller survey this
  finding came out of (`tsk-1ab`), including two other confirmed
  choke-points (`isWorkingTreeClean` duplication, `createWorktree` call-site
  divergence) and candidates checked and ruled out.
- `plugins/fgOS/skills/cook/SKILL.md`'s "Known gap" section — the prior,
  narrower workaround for this same divergence.
- `plans/reports/choke-point-investigation-260728-1717-claim-worktree-report.md`
  (`tsk-53f`) — the original claim/worktree-isolation choke-point this
  survey's D2 explicitly re-verified rather than reused.
