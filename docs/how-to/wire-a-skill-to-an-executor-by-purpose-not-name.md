---
type: how-to
title: How to wire a skill to a executor by purpose, not by name
tags: []
timestamp: 2026-08-09T00:00:00.000Z
source_capture_ids: [tsk-2c1]
---
# How to wire a skill to a executor by purpose, not by name

Use this when the skill dispatching to a executor has no pre-registered
`<EXECUTOR_ID>` to name ahead of time — its prompt is composed at runtime
(e.g. a research fan-out branch, a generated packet), so it only knows
*what it's calling for*, never *which config entry answers it*. Every
other executor-dispatch how-to in this directory
(`wire-a-headless-function-through-an-agent-executor-executor.md`,
`wire-a-skills-classify-step-through-an-agent-executor-executor.md`,
`reuse-the-shared-executor-dispatch-fallback-fragment.md`) assumes the
opposite: a fixed, known `<EXECUTOR_ID>` baked into the consuming skill's
own prose. This is the recipe for the case those don't cover.

## Before you start

This depends on US-027 (binding matches by capability promise, never by
tool name) already being live in `src/runner/dispatch.mjs` — confirm
`EXECUTOR_PURPOSES` and `resolveExecutorIdForPurpose` are exported before
following this recipe.

## The pattern

A executor declares its purpose via `for` (a closed enum,
`EXECUTOR_PURPOSES` — today just `judge`; `gather` was retired at
tsk-5tm-2 D6, see the note below). A caller with no id to name resolves
by that purpose instead:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" decide --for <purpose> --has-live-task-access
```

Prints `{"mechanism": "in-process"|"out-of-process"|"unavailable"[,
"agentType": ..., "executorId": ...]}` — note the third mechanism value,
`unavailable`, that a name-based `decide <executorId>` call never returns:
a purpose with nothing registered against it is a legitimate, expected
state (not every purpose has a executor yet), so this is a real enum value
to branch on, never an error to catch.

- **`unavailable`** — no executor declares this purpose yet. Fall through
  to whatever native/inline path the caller used before this wiring
  existed — no error, no note printed, this is the common/default path
  for a purpose nobody has registered against.
- **`in-process`** / **`out-of-process`** — same handling as the
  name-based recipes, using the `executorId` the result now carries (only
  present on the purpose-resolved path — a name-based `decide
  <executorId>` call keeps its pre-existing exact shape, byte-identical,
  since existing callers already assert on it).

Actually dispatching works the same way, `--for` instead of a positional
id — `execute` self-executes every adapter-resolvable case (never hands
back a bare command for you to run yourself via Bash), except the
`in-process` case above, which hands back `{mechanism:"in-process",
agentType, prompt[, executorId]}` for you to call your own Agent/Task tool
with:

```bash
node "$root/src/runner/dispatch.mjs" execute --for <purpose> --prompt "<the prompt built at runtime>"
```

## Content-permission gate (`carries`, D15)

If the executor you're dispatching to declares `carries` (the content class
it is permitted to receive — `user-text` or `repo-content`, a closed enum),
the caller MUST self-declare what this specific dispatch actually carries,
or `resolveExecutorConfig` throws before any spawn — this is a fail-closed
gate, not an optional hint:

```bash
node "$root/src/runner/dispatch.mjs" execute --for <purpose> --carries repo-content --prompt "<prompt>"
```

`repo-content` is the wider class (it covers `user-text` plus repo
paths/content); a executor declaring `carries: "user-text"` refuses a
`repo-content` dispatch before spawn. Get this wrong and the refusal
surfaces as a `RunnerConfigError` naming the executor and both content
classes — treat it exactly like a malformed dispatch response: fall back
to whatever inline/native path handles the `unavailable` case above,
never treat it as fatal to the whole caller.

## Logging an in-session dispatch

The async claim/dispatch cycle's own `executor.dispatch` audit event
(`src/runner/loop.mjs`) only ever fires from inside a work item's own
claim. A skill dispatching in-session (no claim of its own to attach an
event to) logs through the sibling `log` CLI subcommand instead, same
event `type`, so a downstream reader never needs a second vocabulary:

```bash
node "$root/src/runner/dispatch.mjs" log <executorId from the decide result> --id <the currently claimed item's id> --provider <provider> --command <the resolved command, or "task" for in-process> --model <model>
```

This writes through `appendEvent` (`src/state/events.mjs`), which already
acquires `events.jsonl`'s own cross-process lock internally — no extra
locking needed even when several branches log concurrently (e.g. a
fan-out's independent branches each logging their own dispatch).

## Status: pattern proven, no live consumer today

`fgos-researching`'s gather fan-out (`tsk-2ie5`/`tsk-2c1`) was this
recipe's original real example — wired to `decide --for gather` /
`resolve --for gather --carries repo-content` before every research
branch. `gather` was retired at `tsk-5tm-2` D6: it was the one real
cross-provider path, with no architectural reason on record for needing
cross-provider dispatch at all, and its one documented reason
(parallelizing wall-clock) was already met by native Task-tool dispatch —
`fgos-researching` now dispatches every branch natively, unconditionally
(see that skill's own SKILL.md).

`judge-discovery`/`judge-decompose` both declare `for: "judge"`, but
neither is actually resolved by purpose today — both callers
(`fgos-coding-discovering`, `fgos-coding-planning`) call them by their own
fixed id directly, never `--for judge` (confirmed by grep, `tsk-5tm`
`CONTEXT.md` D10). So this recipe has no live production consumer right
now — the mechanism itself stays proven by direct unit test
(`resolveExecutorIdForPurpose` and the `carries`/`decide`/`execute` CLI
flags, `test/runner/dispatch.test.mjs`), ready for the next producer that
genuinely needs to resolve a executor without a pre-registered id to name.

## Outcome capture

Predicted (tier `standard`, 0 declared deps, first visit) vs. actual: `awaiting-approval`, verify passed on the first attempt, `aheadCount: 2` (`fgos check tsk-2c1`). One real correction surfaced during implementation, not anticipated at planning time: the item's own `verify` command (`npm test && ...`) had to be narrowed twice — once for a pre-existing, already-`wontfix`'d unrelated test failure (`tsk-3f9`, a pinned-vocabulary guard unrelated to this item's footprint), and once for a *second*, previously-unknown case of the same class: a test asserting on the live, shared main-checkout `.fgos/config.json`'s content, which a concurrent session had already mutated mid-implementation (removing `submit-assist-classify`, expected per `tsk-2ie5`'s own description — that migration is meant to land *after* this item, not concurrently with it). Both narrowings used `node --test --test-skip-pattern="..."` rather than editing or weakening the underlying tests themselves.
