---
authoritative_for: executor dispatch manual in-session logging gap, Step B.5 executor-dispatch-fallback.md
---

# Why manual out-of-process dispatches went unlogged, and how Step B.5 fixes it

`src/runner/dispatch.mjs` has always exposed `logExecutorDispatch` (and its
CLI form, `dispatch.mjs log <executorId> --id <id> --provider <p> --command
<c> [--model <m>]`), which appends an `executor.dispatch` event to
`.fgos/events.jsonl`. It exists specifically for "an IN-SESSION executor
call... that has no claim of its own to attach to" — but until tsk-3kl,
nothing ever called it from that path.

## The gap

Two different dispatch paths exist in fgOS:

- **Automatic**, driven by the runner loop (`src/runner/loop.mjs`) — this
  path already calls `appendEvent(..., { type: 'executor.dispatch', ... })`
  directly for every claim/dispatch cycle.
- **Manual, in-session**, driven by a live skill following Step A ("decide")
  / Step B ("execute out-of-process") of the shared fragment
  `.agents/skills/_shared/executor-dispatch-fallback.md` — six skills cite
  this fragment (`fgos-coding-implement`, `fgos-coding-validating`,
  `fgos-fanout`, `fgos-coding-planning`, `fgos-coding-exploring`,
  `fgos-researching`). Step B already has every field
  `logExecutorDispatch` needs (`executorId`, `provider`, `command`, `model`)
  in the final JSON line `dispatch.mjs execute` returns — but no step ever
  passed them to `dispatch.mjs log`.

Concretely: tsk-1up's own Implement step dispatched successfully
out-of-process via `agy` (commit `ccdd71e4`) and left no `executor.dispatch`
record until one was written back by hand afterward (seq 19519). With no
reader of `executor.dispatch` events either (no dashboard, no push
notification consumes them today), the only way to find out a manual
dispatch happened at all was to infer it from a git commit.

## The fix

A new **Step B.5 — log the dispatch** section now sits in
`.agents/skills/_shared/executor-dispatch-fallback.md` (and its
byte-identical mirror at `plugins/fgOS/skills/_shared/executor-dispatch-
fallback.md`), immediately after Step B's own JSON result is read:

```bash
node "$root/src/runner/dispatch.mjs" log <EXECUTOR_ID> --id "<id>" \
  --provider "<provider>" --command "<command>" [--model "<model>"]
```

Every field comes straight from Step B's own result — nothing new to
resolve, and `<id>` is whatever item the calling session already has
claimed. Because the fix lives in the shared fragment rather than in each
of the six consuming skills, every future consumer of the fragment gets the
logging call automatically, with no per-skill edit needed.

The call is mechanical bookkeeping only, never a gate: a failure (thrown
`RunnerConfigError`, spawn failure, timeout) falls straight through to Step
C exactly as if the call had not been made — the dispatch itself already
succeeded regardless of whether the log call did.

## What this does not fix

`executor.dispatch` events written this way still have no reader — no
dashboard surfaces them, no push notification fires off them. The record is
now durable and queryable directly from `.fgos/events.jsonl`, but building
a consumer for it was explicitly out of scope for this fix.

## Verifying the fragment still carries it

`test/skills/fgos-mirror.test.mjs` proves the two fragment copies stay
byte-identical, but only a mirror check — it does not positively prove
Step B.5 exists in either copy (a change that touches neither file, or
reverts both, still passes it). To positively confirm:

```bash
grep -qF '## Step B.5 — log the dispatch' .agents/skills/_shared/executor-dispatch-fallback.md \
  && grep -qF 'dispatch.mjs" log ' .agents/skills/_shared/executor-dispatch-fallback.md
```
