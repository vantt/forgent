# Orient — full mechanics

The full detail behind SKILL.md's Step 1.

Read the claimed item's title, `refs`, `deps`, and — if present — its
`docsRef` (the feature's `docs/history/<feature>/` directory: CONTEXT.md's
locked decisions and plan.md's shape, when either exists). An item that
reached `executing` with no docs history at all is legitimately small
enough that the title and `verify` command are the whole spec — do not
manufacture ceremony it doesn't need.

## Re-check claim status on a non-driven entry

If this session did not arrive here via the `fgos-coding-driving` loop
(which already re-checks claim status fresh right before invoking this
skill) — for example, a session driving stage-by-stage by hand, straight
from `fgos-coding-validating`'s own `fgos plan` call — re-check the
item's live `status` (`fgos list --id <id> --json`) before doing
anything else. Per tsk-40m, a runtime claim stays active unbroken
through `clarify → executing` (the former `releaseClaimOnExecuting` behavior
was retired, so the `planning`→`executing` edge no longer releases claims
back to `todo`). However, if `status` still reads `todo` for any reason,
re-claim (`fgos pick <id>`) before Implementing — proceeding without a
live claim risks `fgos return` refusing later with "is todo,
not doing".

## Reclaim the ball if it isn't yours

Read the item's `holder` from the same `fgos list --id <id> --json` call
(`data.work[id].holder`). If it is set and is anything other than
`implementer`, this session is re-entering an item whose most recent
role-axis call was never closed — most commonly a `review` call a reject
sent back to `doing` without anyone formally returning it, or an
`advise` call whose `awaiting-human` park a prior session's `fgos
answer` already resolved on the status axis without the role axis
following. Close it before doing anything else:

```bash
fgos handoff-return "<id>" --note "reclaiming at Orient — holder was <role>"
```

**Repeat this call, re-reading `data.work[id].holder` fresh each time,
until `holder` reads `implementer`** (a nested call can legitimately sit
two deep, e.g. `reviewer` then `advisor`; one `handoff-return`
only pops the innermost frame). Stop the moment a call refuses with "no
open call" — that is the ordinary end state, not a failure to relay.

(Two separate tool calls per attempt, per SKILL.md's Hard rules.) Skip
this entirely when the item's domain declares no role graph — `holder`
never appears there in the first place.
