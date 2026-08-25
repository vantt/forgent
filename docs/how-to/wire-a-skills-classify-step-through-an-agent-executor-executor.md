---
type: how-to
title: How to wire an existing skill's inline-reasoning step through an agent-executor executor
tags: []
timestamp: 2026-08-01T11:45:00.000Z
source_capture_ids: [tsk-5l2-3]
---

# How to wire an existing skill's inline-reasoning step through an agent-executor executor

Use this when a skill currently reasons about something entirely inline
(no subprocess call) and you want to give it an *optional* path to
dispatch that same judgment to a different, cheaper, or more diverse
model instead — while keeping today's inline behavior byte-identical when
nothing is configured.

## Before you start

- This assumes `.fgos/config.json`'s `runner.executors` schema and
  `dispatch.mjs`'s
  `resolveExecutorConfig`/`resolveExecutorCommand` already exist
  (`tsk-62v`) — this how-to is about wiring a *consumer* skill through an
  existing executor, not building the executor mechanism itself.
- The skill being wired must be a **task-dispatch** consumer (an in-session
  skill that shells out via Bash), not the headless runner's own
  cli-dispatch (`spawnWorker`) — those already get executor-aware
  resolution automatically.

## Steps

1. **Add the executor to `.fgos/config.json`'s `runner.executors`** — `kind: "agent"`
   (tsk-in1-4 D5: `kind` is now the agent/tool BAN CHAT axis, not a
   dispatch mechanism — the CLI mechanism itself lives on
   `invocations[].via`, see step 2), a real installed command (probed on
   the machine at build time, never hardcoded from a design doc's
   example), and a `tier` that resolves to *some* model via the existing
   `models` map (real example: `tsk-5l2-2`'s
   `executors.submit-assist-classify` entry, command `agy`, since
   migrated to `kind: "agent"` per D5).

   If the executor resolves to a non-Claude command (cross-provider),
   also set `allowCrossProvider: true` — absent or `false` makes
   `resolveExecutorConfig` refuse at resolve time (`tsk-32n` D1/D2/D3,
   kind-independent since tsk-in1-4 D5/D9,
   `docs/reference/executor-cross-provider-governance.md`). This
   superseded an earlier, never-implemented `sensitiveData` field this
   doc originally suggested here — that name had inverted polarity
   against the restrictive-by-default requirement (absent reading as
   "not sensitive" = allowed, backwards). Real precedent:
   `allowCrossProvider: true` on `submit-assist-classify`, since the
   routed content there is only a short free-text ask, never repo/code
   content.

2. **Declare the real command as a tool-registry entry too** (tsk-in1-1
   D1: no longer a `fgos tool register` verb call — add a `capability`
   field directly onto the SAME `runner.executors.<executorId>` entry
   step 1 just wrote in `.fgos/config.json`), so `fgos tool query` can
   confirm presence — this is also what makes `AGENTS.md`'s
   install/setup/doctor gate catch the new dependency for free, with no
   new doctor check written by hand. The dispatch mechanism itself
   (tsk-in1-4 D5/D8: `invocations[].via`, not a top-level field) carries
   the real command:

   ```json
   "executors": {
     "<executorId>": {
       "kind": "agent",
       "capability": "<executorId>",
       "invocations": [
         { "via": "cli", "adapter": "cli-spawn", "command": "<realCommand>", "args": ["{prompt}"] }
       ],
       ...
     }
   }
   ```
   ```
   fgos tool check
   ```

   (the object key doubles as the id both `fgos tool query` and
   `resolveExecutorConfig` read — no separate `--name` to keep in sync.
   `resolveExecutorConfig` itself never gates on this presence
   automatically, though — that automatic check was retired at
   `tsk-5tm-1` D1; a caller wanting a real presence gate asks for it
   explicitly with `fgos tool query --status present` at its own call
   site, same as `docs/reference/forgentx-tool-registry-configuration.md`
   describes.)

3. **Give the skill a way to dispatch through the real command/args without
   a second argv-building implementation.** `dispatch.mjs`'s own
   `decide`/`execute` CLI pair, both already built on the same
   `resolveExecutorConfig`/`resolveExecutorCommand` cli-dispatch uses:
   `node src/runner/dispatch.mjs decide <executorId>` to learn the
   mechanism first, then `node src/runner/dispatch.mjs execute <executorId>
   --prompt <text>` to actually self-execute it and hand back the real
   result as JSON. task-dispatch skills invoke this exact `decide`→`execute`
   pair, never a parallel prompt/argv builder of their own, and never run a
   resolved command themselves through Bash.

4. **In the skill's own `SKILL.md`, point at the shared fragment instead
   of inlining the branch logic.** `.agents/skills/_shared/executor-
   dispatch-fallback.md` (tsk-53h) carries the current `decide`/`execute`
   branch and malformed-response fallback, generalized from this exact wiring
   (`submit-assist-classify`, the fragment's own real precedent). Reference
   it by relative path from the consuming `SKILL.md`
   (`../_shared/executor-dispatch-fallback.md`) and fill in its three
   parameters: `<EXECUTOR_ID>` (this executor's id), `<PROMPT_TEMPLATE>`
   (this skill's own fixed prompt), and `<INLINE_FALLBACK_HEADING>` (this
   skill's own "reason about it yourself" heading). Do not re-copy the
   branch prose into the new skill's own file — that is exactly the drift
   risk the shared fragment exists to remove.

   Edit the canonical source under `core/skills/` or `domains/*/skills/`,
   then run `npm run build:skills`. The build assembles `.agents/skills/`,
   generates `.claude/skills/` wrappers, and mirrors dev skills plus
   `_shared/` into `plugins/fgOS/skills/`.

5. **Verify the dispatch actually works, live, once.** Since a prose
   skill's own branching can never be executed by the test suite (no
   test in this repo unit-tests a skill's runtime behavior — only the
   mirror-identity check above is structural), the acceptance proof for
   the "configured and present" path is a real, one-time manual run of
   step 3's `execute` command, confirmed to produce a sane, parseable
   response. Real example (`tsk-5l2-3`, verified 2026-08-01) — the
   underlying command `execute` itself runs on your behalf:

   ```
   $ agy -p "Classify this backlog ask's tier ... Ask: \"clean up the leftover console.log statements in the auth module\"" --model gemini-3.5-flash-low
   tier: light
   kind: chore
   risk: medium
   reasoning: Deleting leftover console.log statements is a minor maintenance task, but touching the sensitive auth module elevates the risk.
   ```

## Why this exists

An executor's config and presence-check machinery (steps 1-3) already has
real unit-test coverage from whichever item built the mechanism itself
(`tsk-62v`/`tsk-5l2-1`/`tsk-5l2-2`) — but wiring a *specific skill's prose*
through it (step 4) sits in a genuine, structural test-coverage gap: no
skill's runtime behavior is unit-tested anywhere in this repo today, only
its mirror-identity. Knowing that ceiling up front (rather than
discovering it mid-review) is what lets step 5 stand in as the real
acceptance proof instead of a weaker placeholder.

## Related

- `docs/history/agent-executor-submit-assist-classify/CONTEXT.md` /
  `plan.md` — the locked decisions (D1-D8) this exact wiring followed,
  including the governance (D7) and malformed-output (D8) calls named in
  steps 1 and 4 above.
- `.agents/skills/_shared/executor-dispatch-fallback.md` — the shared
  fragment step 4 now points at, generalized from this exact wiring
  (`tsk-53h`).
- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` /
  `plan.md` — the locked decisions behind extracting step 4 into that
  shared fragment.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — real gaps hit while returning the sibling items `tsk-5l2-1`/`tsk-5l2-2`
  that built the executor mechanism this how-to wires a skill through.
