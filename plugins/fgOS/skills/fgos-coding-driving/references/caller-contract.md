# Callers and the anchored-by-open-children contract

## Which existing loops are this loop

| Caller | `id` source | `ceiling` |
|---|---|---|
| `/fgOS:cook` | freshly submitted item, or a child this loop's own anchor report just surfaced | none (safe: `awaiting-approval`/anchor/no-progress are implicit stops) |
| `/fgOS:pick` | one explicitly claimed item | none (same implicit stops) |
| a discovery/exploring-only sweep | the discover pool the discover-next launcher picks from | `stage:planning` |
| a planning-only sweep | the planning-step frontier (the `planning` stage; the legacy `decompose` alias drains through the same pool) | `stage:executing` |
| an execution-only sweep | the execute-step frontier (today's existing frontier default, unchanged) | none needed (`awaiting-approval` is now implicit — an explicit `status:awaiting-approval` ceiling still works identically) |

This table is descriptive, not a retrofit checklist this skill performs —
`cook`/`pick` calling this skill instead of their own inline stage-dispatch
prose is a separate, already-completed step; see each launcher's own
SKILL.md for how it actually calls this skill today.

## Caller contract: what to do with an anchored-by-open-children report

Fan-out is a CAPABILITY a caller opts into, never a second entry point
this skill provides itself — this skill still never resolves an anchor on
its own (see SKILL.md's Hard rules). This is the one place that contract
is written down; every caller in the table above reads it from here,
never keeps its own copy.

When this skill reports **anchored by open children**, the caller already
holds a real candidate set for free: the reported `openChildren` list IS
the item's own children. A caller MAY still drive each child sequentially
— nothing about an anchor report requires concurrency — but when it wants
them run concurrently instead of one at a time, the contract is:

1. Invoke the `fgos-fanout` skill with `parentId` = the item that just
   anchored and `candidateIds` = the reported `openChildren` list,
   unchanged, no re-derivation.
2. Let `fgos-fanout` run to its own stop (every candidate reaches a
   terminal status, or is reported back needing a person) — this skill
   never re-implements or peeks inside that loop; `fgos-fanout` owns it
   completely, the same "the invoked skill does its own job completely"
   stance this skill already holds for a stage-skill.
3. Once `fgos-fanout` returns, invoke THIS skill again on the original
   `parentId`. The anchor either clears (every child reached a terminal
   status, so the parent's own lifecycle continues) or it still reports
   the same or a smaller `openChildren` set (some child came back
   `blocked` or needing a person) — either way, re-entering this skill on
   `parentId` is the same fresh-read discipline every other iteration of
   this loop already follows, never a special case.

### Five callers, one contract

The caller table above lists five readers of this same anchor report.
`/fgOS:pick` and the three pool sweeps carry the contract's default
behavior (drive each child sequentially, no fan-out); `/fgOS:cook` also
inherits it unchanged today — it pushes each open child to the front of
its own queue rather than fanning out concurrently, a deliberate choice
recorded when an earlier fan-out wiring for `cook` was reverted. If a
later session finds one of these "unchanged" rows is a real gap rather
than legitimate scope, that is new evidence for a follow-up item, not a
silent omission.
