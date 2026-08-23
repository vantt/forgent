---
item: tsk-3qo
timestamp: 2026-08-23T14:20:00.000Z
---

# plan: fix /fgOS:merge-loop stopping after 1 item

## Mode

**tiny.** Flag count against `fgos-routing`'s hard-gate list (auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, removing a validation): **0**. The fix touches
exactly one file (`plugins/fgOS/skills/merge-loop/SKILL.md`), is prose
only (no `src/` code path, so it does not trip `src/runner/`'s Iron Law
module rule the way `tsk-6av`/`tsk-3mv` did), does not change
`merge-next`'s JSON envelope shape (the only real public contract this
area exposes), and is one direct, well-evidenced task: point the
recurring `/loop` prompt at `merge-loop` itself instead of `merge-next`.

## Graph signal

`fgos graph --json`: `tsk-3qo` is its own isolated component (no deps, no
dependents) — same shape as `tsk-3mv`'s own predecessor item in this same
area. No `topUnblock`/`criticalPath` leverage to weigh; ordering is not a
factor here.

## Approach

**Chosen path:** in `plugins/fgOS/skills/merge-loop/SKILL.md` Step 3,
change the recurring prompt passed to the native `loop` skill from the
literal string `"/fgOS:merge-next"` to the self-referencing
`"/fgOS:merge-loop"`. Add one short clause explaining why (citing
`ScheduleWakeup`'s own documented contract: a literal prompt is replayed
verbatim on every wake, with no re-resolution to an *originating* skill's
instructions outside the reserved autonomous sentinel) so a future reader
does not "simplify" it back to the verb name. No change to Steps 1-2, 4-6,
Step 5 (Iron Law evidence gather), or Step 6 (report) — their prose
already describes the right per-iteration behavior; they simply were
never being *reloaded* on iteration 2+, and self-referencing fixes that
directly. `RESEARCH.md` round 1 (this feature dir) is the evidence trail
for why this specific one-line change is the fix, not a rewrite of the
surrounding steps.

**Alternatives rejected:**
- *Have `merge-loop` call `ScheduleWakeup` directly itself every
  iteration, bypassing the generic `loop` skill entirely.* Rejected:
  duplicates a working native mechanism (`loop`) for no functional gain —
  the self-referencing prompt gets the same result (full `SKILL.md`
  reload on every wake) by using `loop` as designed, per RESEARCH.md
  finding 3. Reuse over reinvention.
- *Embed the continue/stop decision logic directly into
  `merge-next/SKILL.md`* so the single-shot verb itself knows to keep
  looping. Rejected: `merge-next` is documented and used elsewhere
  (`fgOS:merge-next`'s own description, herdr's admin-lane launcher per
  `tsk-4ry`) as a genuine single-shot, no-loop-awareness verb; giving it
  loop-continuation logic would break that contract for every other
  caller and duplicate `merge-loop`'s own Step 4-6 in a second place.
- *Fix all five `*-loop` skills (`discover-loop`/`retro-loop`/
  `cleanup-loop`/`plan-loop` share the identical pattern, RESEARCH.md
  finding 6) in this same item.* Rejected: this item's own submitted text
  explicitly scopes the fix to `merge-loop` only and asks for the sibling
  risk to be *noted*, not silently absorbed — expanding scope here would
  contradict that explicit boundary. Flagged below as a follow-up
  candidate instead.

**Files touched:** `plugins/fgOS/skills/merge-loop/SKILL.md` only (Step 3
paragraph).

**Risk map:** the only way this specific one-line change could be wrong
is if the native `loop` skill's actual re-fire behavior differs from what
`ScheduleWakeup`'s own tool contract documents (RESEARCH.md finding 3) —
i.e., if a self-referencing prompt does *not* reload full `SKILL.md` text
on wake the way a fresh `/fgOS:merge-loop` invocation does. That can only
be confirmed by an actual multi-item run, not by static text inspection.
Proof point for `fgos-coding-validating`: this plan does not claim that
run has already happened — it is named as an open verification step, not
asserted as done (see Outstanding questions).

## Shape

Single direct edit, no split:

1. In `merge-loop/SKILL.md` Step 3 ("Start the loop"), replace the
   sentence "Invoke the `loop` skill with `prompt: \"/fgOS:merge-next\"`"
   with a version that passes `prompt: "/fgOS:merge-loop"` instead, and add
   one clause citing why (self-reference reloads this skill's own Step 4-6
   decision logic on every wake; a bare verb name does not — see
   `RESEARCH.md`).
2. Leave every other step's prose untouched — Steps 4-6 already describe
   the correct per-iteration behavior; they were just never being
   reloaded.
3. No new file, no new CLI verb, no change to `merge-next/SKILL.md` or any
   `src/` module.

## Outstanding questions

None on the fix itself. One verification step is explicitly open, not a
gap in the plan: `fgos-coding-validating` (or a later empirical check)
should note that this fix's actual multi-iteration behavior can only be
confirmed by a real run against a frontier with 2+ ready items — the
static `rg` verify check (below) proves the text change landed, not that
the native `loop` mechanism behaves as `ScheduleWakeup`'s contract
documents. This is named honestly rather than asserted as proven, per
RESEARCH.md's own verify section.

## Verify

Already synced onto the item at `discovery` (`fgos discover --verdict
clear --verify ...`), unchanged by this plan:

```bash
npm test && rg -q --hidden 'prompt: "/fgOS:merge-loop"' plugins/fgOS/skills/merge-loop/SKILL.md && ! rg -Fq --hidden 'prompt: "/fgOS:merge-next"' plugins/fgOS/skills/merge-loop/SKILL.md
```

## Action / footprint

- `action`: this `plan.md`.
- `footprint`: `plugins/fgOS/skills/merge-loop/SKILL.md`.

## Follow-up (not this item)

`discover-loop`/`retro-loop`/`cleanup-loop`/`plan-loop` share the
identical "pass the `-next` verb as the recurring `/loop` prompt" pattern
(RESEARCH.md finding 6) and are very likely subject to the same bug. Left
as a separate future item, not folded in here.
