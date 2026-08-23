---
item: tsk-3qo
---

# RESEARCH: /fgOS:merge-loop stops after 1 item instead of continuing

## Round 1 — 2026-08-23

**Asked:** root cause of `/fgOS:merge-loop` executing exactly one
`/fgOS:merge-next` iteration then stopping, instead of looping until the
frontier is empty or a real stop condition (Iron Law list, same-id-twice)
fires, per its own SKILL.md Step 3-6.

**Checked and found:**

1. `plugins/fgOS/skills/merge-loop/SKILL.md` Step 3: "Invoke the `loop`
   skill with `prompt: \"/fgOS:merge-next\"` ... let it self-pace
   dynamically." Steps 4-6 (read each iteration's envelope, decide
   continue/stop, track a cumulative Iron Law list across iterations,
   report at the end) are written as if they apply on *every* iteration.

2. `plugins/fgOS/skills/merge-next/SKILL.md` — grepped in full for
   `ScheduleWakeup`/`loop`/`continue`: zero hits except one prose mention
   of `/fgOS:merge-loop` as a caller. `merge-next` is a pure single-shot
   verb; it contains no instruction to call `ScheduleWakeup` or to
   re-evaluate a continue/stop decision.

3. `ScheduleWakeup`'s own tool contract (the mechanism `/loop` dynamic
   mode is built on, per its description) states: "Pass the same `/loop`
   prompt back via `prompt` each turn so the next firing repeats the
   task. For an autonomous `/loop` (no user prompt), pass the literal
   sentinel `<<autonomous-loop-dynamic>>` instead — the runtime resolves
   it back to the autonomous-loop instructions at fire time." The
   "resolve back to the calling skill's own instructions" behavior is
   documented as exclusive to the sentinel case. A literal prompt string
   (`"/fgOS:merge-next"`, what `merge-loop` actually passes) is replayed
   verbatim on each wake — equivalent to the user re-typing
   `/fgOS:merge-next` cold. Nothing re-loads `merge-loop/SKILL.md`'s own
   Step 4-6 decision logic on iteration 2+, and nothing in the freshly
   loaded `merge-next/SKILL.md` (finding 2) picks up the slack.

4. Corroborating evidence, commit `c74a7928` (`tsk-4ry`,
   `docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/context-tsk-4ry.md`
   D1-D3): herdr's admin-lane launcher used to relaunch
   `/fgOS:merge-loop`/`retro-loop`/`cleanup-loop` on every poll tick, then
   was changed to launch the single-item `/fgOS:merge-next`/`retro-next`/
   `cleanup-next` skills instead, with herdr's own poll timer re-launching
   each tick. This moved the "keep doing more items" responsibility
   *outside* `merge-loop` entirely, onto an external timer — the one place
   in this codebase that needed guaranteed repeated execution did not
   route through `merge-loop`'s own internal continuation.

5. Second corroborating source,
   `docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md`
   §3 row 4: "\"Pipeline 16 làn\" có thật đang chạy không — rõ — KHÔNG.
   `capacity.dispatch` = 1 event trên ~14.500 ... Song song thật đến từ N
   phiên người/agent: 7-8 item vào `doing` mỗi giờ lúc cao điểm." This
   repo's own real merge throughput has empirically always come from many
   separate single-shot sessions each merging one item, never from one
   `/fgOS:merge-loop` session self-continuing across many items. No
   journal/history hit (`grep -rl "merge-loop" docs/journals/` — zero
   results) records a run that actually advanced past item 1.

6. The exact same "Invoke the loop skill with prompt:
   \"/fgOS:X-next\"\"" pattern (recurring prompt names the single-shot
   verb, never the `-loop` skill itself) appears identically in
   `discover-loop`, `retro-loop`, `cleanup-loop`, and `plan-loop`'s own
   SKILL.md files — confirmed via direct read of all four. This is a
   shared structural pattern across the whole `*-loop` family, not
   something unique to `merge-loop`'s own text.

7. No other skill in `plugins/fgOS/skills/**` was found using `/loop` for
   a genuine multi-step per-iteration decision the way `merge-loop`
   Steps 4-6 describe — there is no existing in-repo precedent to copy
   verbatim for "how does an item's own decision logic survive across
   `/loop` wakes." The fix has to be reasoned from `ScheduleWakeup`'s own
   documented contract (finding 3), not copied from a working sibling.

**Verdict: `clear: true`.**

Root cause: `merge-loop/SKILL.md` Step 3 hands the recurring `/loop`
prompt to `"/fgOS:merge-next"` — the single-shot verb, not itself. Per
`ScheduleWakeup`'s own contract, only a literal prompt string is replayed
on each wake; there is no re-resolution to the *originating* skill's
instructions unless the reserved autonomous sentinel is used instead.
Since `merge-next/SKILL.md` carries zero loop-continuation logic, nothing
after iteration 1 ever evaluates the stop/continue decision or calls
`ScheduleWakeup` again — the loop has no self-perpetuating mechanism past
the first `/fgOS:merge-next` firing. This is independently corroborated by
two real, in-repo pieces of operational history (findings 4-5): the one
caller in this codebase that needed guaranteed multi-item throughput
(herdr's admin lane) explicitly stopped relying on `merge-loop`'s own
continuation, and this repo's actual merge throughput has never come from
a single self-continuing `merge-loop` run.

**Fix direction:** the recurring `prompt` fed into `ScheduleWakeup`/the
native `loop` skill must be `"/fgOS:merge-loop"` (self-referencing), not
`"/fgOS:merge-next"`, so every wake reloads the full `merge-loop/SKILL.md`
text — including Steps 4-6's envelope-read/continue-or-stop/Iron-Law-list
logic — instead of only the single-shot verb. Steps 1-2 (arg parsing,
soft-warn preflight) re-running harmlessly on every iteration is an
accepted, explicitly-already-soft-warn-only cost, not a new risk. Cross-
iteration state (the Iron Law list, same-id-twice tracking) continues to
rely on same-session conversation memory — unchanged from what the
original design already assumed (`docs/history/merge-loop-skill/plan.md`
never describes persisting this list to disk either); this fix does not
add or remove that risk.

**Verify:** this skill is prose-only (no code path), so verify is a
combination of (a) a static text check — `rg` confirms the corrected
self-referencing prompt string is present and the old
`"/fgOS:merge-next"` literal is no longer the value passed to
`ScheduleWakeup`/`loop` — plus (b) an explicit note in the item that real
multi-iteration behavior needs an empirical run (a session invoking
`/fgOS:merge-loop` against a frontier with 2+ ready items, observing it
advance past the first) since no automated test can deterministically
verify multi-turn agent-instruction-following behavior. This mirrors how
`tsk-6av`'s own verify command was structured (`rg`-based static checks
over this same prose file).

**Left open (out of this item's scope, flagged for a follow-up item):**
the identical pattern in `discover-loop`/`retro-loop`/`cleanup-loop`/
`plan-loop` (finding 6) is very likely subject to the same bug, but this
item's own text scopes the fix to `merge-loop` only — filing/fixing the
other four is a separate decision, not silently absorbed here.
