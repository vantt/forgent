# Why `/fgOS:cleanup-next` keeps exit-code classification instead of a driver call

When `/fgOS:retro-next` was rewritten to hand its picked item to
`fgos-coding-driving` instead of hand-rolling its own sequencing (see
`docs/explanation/why-retro-next-shrank-to-a-launcher.md`), the sibling
launcher `/fgOS:cleanup-next` was deliberately left with a different
shape — not because it was missed, but because the same fix does not
apply to it.

## Why `cleanup-next` is not a driver-call candidate

`cleanup-next` invokes no skill at all. It picks a TTL-pre-filtered item
(`pickNextCleanupItem`, `src/state/cleanup-pool.mjs`) and runs the `fgos
cleanup <id>` CLI verb as a real subprocess, classifying the outcome by
that subprocess's own exit code (`EXIT_CODES`, `src/state/store.mjs:
65-73`). There is nothing for a driver to drive: `skillMap` (`src/state/
workflow-stage-graphs.mjs`) deliberately registers no skill for the
`cleanup` position — decision record `0027` D5's own words, "pure
harness, no skill ever loads for it." Invoking `fgos-coding-driving` here
would resolve nothing and stop immediately on its first iteration —
ceremony with no value, not a real dispatch.

`retro-next`'s old exit-code branch was a genuine defect: it invoked an
in-session skill (`fgos-coding-compounding`) via the Skill tool, which returns
control in-session with no subprocess exit code to read at all — the
exit-code classification there was reading a signal that no longer
existed. `cleanup-next`'s exit-code branch has no such defect: it really
does run a subprocess, so a real exit code genuinely exists to classify.

## What changed here, deliberately small

Two things, vocabulary alignment only:

1. **The `lock-timeout` outcome (exit `7`) now emits the shared marker
   line verbatim:**

   ```text
   stop-reason: lock-timeout
   ```

   replacing prose-only wording ("Report this plainly and distinctly from
   every other outcome"). This is the same channel `fgos-coding-driving`
   and every other launcher already use for this one category (`tsk-1c6`
   D2/D4) — so `/fgOS:cleanup-loop` reads a line instead of inferring the
   one loop-stopping condition from prose.

2. **The skill now states explicitly, in its own text, why the exit-code
   branch stays**: "this launcher runs a real subprocess" — unlike
   `retro-next`, which invokes a skill in-session and reads the driver's
   relayed stop line instead. This note exists specifically so a later
   session does not "fix" this into a driver call by pattern-matching on
   `retro-next`'s own rewrite, or add a `verbMap` so the driver could run
   `fgos cleanup` itself — either would add a mechanism, the opposite of
   what routing launchers through the shared driver is actually for.

## The general lesson

Two launchers can look similar (both pick-one-item-and-act) while needing
opposite fixes: `retro-next` needed the driver because it was invoking an
in-session skill with no real exit code; `cleanup-next` needed to *keep*
its exit-code branch because it genuinely runs a subprocess. Aligning
vocabulary (the shared `stop-reason` marker line) does not mean aligning
mechanism — the two launchers' underlying dispatch stays deliberately
different, and this item exists partly to record why, so the difference
survives a future refactor that might otherwise "unify" them by mistake.
