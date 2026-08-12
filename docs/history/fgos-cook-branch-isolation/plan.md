# plan.md — tsk-hes: /fgOS:cook branch isolation

Mode: tiny

No `CONTEXT.md` for this feature: discovery's own evidence round
(`RESEARCH.md` in this same directory) was sufficient to render a `clear`
verdict, so `exploring` was skipped per the discover verb's own edge
(`clear` → straight to `planning`). This plan cites `RESEARCH.md`
directly in place of a locked `CONTEXT.md`.

Flag count for the lane above: 0 of {auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain}
apply. This is a single skill-prose file, one direct task, replicating an
already-shipped precedent exactly (`RESEARCH.md`'s tsk-5qs finding) — 0–1
flags → tiny.

## Approach

**Chosen path:** apply the same claim-before-write fix `tsk-5qs` already
shipped for `fgos-coding-shaping` (commit `6abea4bc`) to `/fgOS:cook`'s own
Step 2, scoped to `plugins/fgOS/skills/cook/SKILL.md` only, per this
item's own description and `tsk-5qs`'s D1 (which named this exact
follow-up as real and deliberately out of its own scope — see
`RESEARCH.md`).

Concretely: after Step 1 (`submit`) returns the root id and pushes it onto
the queue, Step 2's queue-drain claims that id (`fgos pick <id>` +
`EnterWorktree`) **before** its first call to `fgos-coding-driving` for
that id, mirroring `/fgOS:pick`'s own step 2/4 sequencing exactly.
`fgos-coding-driving`'s own claim-timing hard rule already reads
`status == doing` before claiming and skips its own claim in that case
(`.claude/skills/fgos-coding-driving/SKILL.md`, confirmed in `RESEARCH.md`)
— so this is additive to the driver's contract, not a change to it. Same
treatment applies when Step 2 pushes a reported open-child id onto the
front of the queue after an anchor: that child gets claimed the same way,
right before its own first `fgos-coding-driving` invocation, on its own
queued turn.

**Alternatives rejected:**
- *Reopen `fgos-coding-driving`'s own default claim-timing rule (D9)* —
  explicitly out of scope per this item's own description ("Fix scoped to
  `/fgOS:cook` only") and matches `tsk-5qs`'s D1 boundary; a wider default
  change affects every caller in the driver's own table, a materially
  bigger blast radius this item does not need.
- *Also touch `/fgOS:discover`* — the item description explicitly excludes
  it ("not `/fgOS:discover`... both separate flows/items"); `RESEARCH.md`
  confirms `/fgOS:discover`'s own step 2 already claims via `fgos take`
  (no worktree) today, a related but distinct gap left for a separate item.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `plugins/fgOS/skills/cook/SKILL.md` prose edit | light — precedent-matched, single file, no code path | `verify` below (grep-based, per `docs/how-to/write-verify-for-a-skill-prose-change.md`) |
| Stale-noise cost (item sits `doing` through discovery/exploring/planning, surfaces in `/fgOS:stale`'s advisory) | light — cosmetic only, `/fgOS:stale` is explicitly read-only/advisory and never reclaims a claim; identical cost already paid by `/fgOS:pick` and `fgos-coding-shaping` in production (`RESEARCH.md`) | none needed — not a correctness risk, already-accepted precedent covers it |

Impact-analysis capability gate (`CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` → GitNexus registered,
`status: "present"` (full posture, freshly checked this session). Not
applicable to either risk-map row above — this item edits skill-prose
only, no symbol/function/code path, so no blast-radius proof point
applies (same conclusion `tsk-5qs`'s own `CONTEXT.md` recorded for the
identical situation).

**Files touched:** `plugins/fgOS/skills/cook/SKILL.md` only.

**Order:** single file, single edit — no ordering question. No split (see
below).

## Shape

Edit `plugins/fgOS/skills/cook/SKILL.md`:

1. Replace the Hard rules bullet currently reading *"This skill still
   never claims before stage `executing`..."* with the opposite contract:
   Step 2's queue-drain claims the front-of-queue id (`fgos pick <id>` +
   `EnterWorktree`) before its first `fgos-coding-driving` invocation for
   that id — citing `fgos-coding-shaping`'s own D4 precedent
   (`docs/history/fgos-coding-shaping-branch-isolation/CONTEXT.md`) the
   same way that skill's own hard rules now do.
2. In Step 2 itself, insert the claim (`fgos pick <id>` + `EnterWorktree`)
   immediately before the first `fgos-coding-driving` invocation for the
   id at the front of the queue — and again for any id pushed onto the
   front of the queue via an anchor report, before ITS first invocation.
   Fall back exactly the way `/fgOS:pick`'s own step 4 does if
   `EnterWorktree` is unavailable or refuses (print the path, tell the
   user to open a new session there) — same fallback pattern, no new one
   invented.
3. Update the "Known gap (fixed)" section's closing sentence ("This
   skill's own sequencing is unaffected...") since the sequencing IS now
   affected — replace with a short note pointing at this item
   (`docs/history/fgos-cook-branch-isolation/`) as the follow-up that
   changed it, without restating tsk-hes's own id inside the skill prose
   itself (`review-audit-self-decision` rule: no plan IDs/finding codes in
   stable code/prose artifacts — cite the invariant, not the ticket).

No split: one file, one coherent prose edit, matches `tsk-5qs`'s own
shape exactly (also a single-skill-file fix).

## Verify

```
npm test && grep -q "EnterWorktree" plugins/fgOS/skills/cook/SKILL.md && grep -q "fgos pick" plugins/fgOS/skills/cook/SKILL.md && ! grep -q "never claims before stage" plugins/fgOS/skills/cook/SKILL.md
```

POSITIVE (`EnterWorktree`, `fgos pick` present) proves the new claim
mechanism is really in the file; NEGATIVE (old "never claims before
stage" sentence gone) proves the old contract was actually replaced, not
left alongside a new one — per `docs/how-to/write-verify-for-a-skill-
prose-change.md`'s two-sided shape. Same command discovery already
proposed and locked via `fgos discover --verify`.

## Outstanding questions

None
