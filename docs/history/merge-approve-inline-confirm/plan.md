# plan.md — merge-approve-inline-confirm (tsk-ut6)

Mode: tiny

Flags counted (fgos-routing Mode gate): public contracts — 1 (`merge-next`/
`merge-loop`'s own SKILL.md prose is the behavior contract other callers,
e.g. `herdr-plugin`'s auto-merge launcher, rely on when reading these
skills' reported shapes). No auth/authorization/data-model/audit-security/
external-system/cross-platform/existing-covered-behavior/multi-domain
flags apply — `test/cli/fgos-merge.test.mjs` only comments on these files,
it does not assert their prose (`RESEARCH.md` round 1). 0-1 flags → tiny:
two files, one direct prose rewire, no split needed.

## Approach

Reuse, never duplicate (RESEARCH.md round 1): `approve`'s own SKILL.md
already implements the exact inline confirm contract this item wants
("A human answering 'yes' in chat is full approval ... Printing a command
for the person to paste is a failure of this skill, not a handoff") and
already reads its own state fresh, so it needs no changes. The fix is
entirely in `merge-next`/`merge-loop`'s own instructions: replace "point
the user at a slash-command to type" with "invoke the `approve` skill
directly (Skill tool), in the same turn" — the same direct-invocation
mechanism `plugins/fgOS/skills/discover/SKILL.md` already uses to dispatch
into `fgos-coding-driving` (RESEARCH.md round 1 precedent).

Files touched, in order:

1. **`plugins/fgOS/skills/merge-next/SKILL.md`** — Step 3's two bullets
   that currently end in "point them at `/fgOS:approve <id>` as the way to
   take it further" (the single `blocked: "iron-law"` bullet, lines
   ~88-98) and "with the same `/fgOS:approve <id>` handoff as above" (the
   `every ready item is blocked` bullet, lines ~99-106). Both change to:
   report the block/list exactly as today, then invoke the `approve` skill
   directly (Skill tool) for the relevant id — the single `picked` id for
   the first bullet; `skipped[0].id` (the top of the list, the one
   `merge-next` would have picked next) for the second — in the same turn.
   `approve` itself still runs its own Step 4 (blast radius) and Step 5
   (ask once) unchanged; this item only removes the extra manual
   slash-command round-trip between merge-next's report and approve's own
   question. Keep the existing "Do not hand the user a command to type"
   framing (D2) — it already argues for this direction, it was just never
   carried to its own conclusion.
2. **`plugins/fgOS/skills/merge-loop/SKILL.md`** — Step 5/6's closing
   sentence ("Nor does it hand the person a command to type: ... the way
   to land any one of these is `/fgOS:approve <id>`") changes the same
   way, adapted to the batch shape: after Step 6 presents the whole
   gathered Iron Law list with evidence (unchanged — "read together,
   decide together" stays, RESEARCH.md round 1 confirms this is a distinct,
   correct design not touched by this fix), ask ONE combined question —
   which of the listed ids, if any, to land now — then invoke the
   `approve` skill directly for each id the person names. `approve`'s own
   per-item Iron Law confirmation (a different question: has the person
   seen the failing-test-first proof) still runs unchanged for each one.

Not touched: `plugins/fgOS/skills/approve/SKILL.md` (already correct, see
above); `merge-loop`'s own `/loop`-wrapped re-invocation of `merge-next`
(Step 3, `prompt: "/fgOS:merge-next"`) — a separate, unrelated mechanism
(RESEARCH.md round 1); `cook`'s own hard rule never to call
`approve`/`reject`/`review` itself (a different, still-intact guarantee —
this item does not touch `cook`).

## Split

No split. One coherent prose change across two files, same fix, same
review.

## Verify

```
npm test && grep -q 'invoke the `approve` skill directly' plugins/fgOS/skills/merge-next/SKILL.md && grep -q 'invoke the `approve` skill directly' plugins/fgOS/skills/merge-loop/SKILL.md
```

`npm test` catches any suite that does start asserting on these files'
prose in the future; the two greps require both files to actually carry
the new inline-invoke instruction, not just still mention `/fgOS:approve`
anywhere (today's text already does that, so a weaker grep would pass
without the fix landing).

## Outstanding questions

None.
