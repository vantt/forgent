---
type: how-to
title: How to wire an existing skill's inline-reasoning step through an agent-executor capacity
tags: []
timestamp: 2026-08-01T11:45:00.000Z
source_capture_ids: [tsk-5l2-3]
---

# How to wire an existing skill's inline-reasoning step through an agent-executor capacity

Use this when a skill currently reasons about something entirely inline
(no subprocess call) and you want to give it an *optional* path to
dispatch that same judgment to a different, cheaper, or more diverse
model instead — while keeping today's inline behavior byte-identical when
nothing is configured.

## Before you start

- This assumes `.fgos/config.json`'s `runner.capacities` schema and
  `dispatch.mjs`'s
  `resolveExecutorConfig`/`resolveExecutorCommand` already exist
  (`tsk-62v`) — this how-to is about wiring a *consumer* skill through an
  existing capacity, not building the capacity mechanism itself.
- The skill being wired must be a **task-dispatch** consumer (an in-session
  skill that shells out via Bash), not the headless runner's own
  cli-dispatch (`spawnWorker`) — those already get capacity-aware
  resolution automatically.

## Steps

1. **Add the capacity to `.fgos/config.json`'s `runner.capacities`** — `kind: "cli"`,
   `adapter: "cli-spawn"`, a real installed command (probed on the
   machine at build time, never hardcoded from a design doc's example),
   and a `tier` that resolves to *some* model via the existing `models`
   map (real example: `tsk-5l2-2`'s
   `capacities.submit-assist-classify` entry, `tier: "light"`, command
   `agy`).

   If the capacity resolves to a non-Claude `kind: "cli"` command
   (cross-provider), also set `allowCrossProvider: true` — absent or
   `false` makes `resolveExecutorConfig` refuse at resolve time
   (`tsk-32n` D1/D2/D3, `docs/reference/capacity-cross-provider-governance.md`).
   This superseded an earlier, never-implemented `sensitiveData` field
   this doc originally suggested here — that name had inverted polarity
   against the restrictive-by-default requirement (absent reading as
   "not sensitive" = allowed, backwards). Real precedent:
   `allowCrossProvider: true` on `submit-assist-classify`, since the
   routed content there is only a short free-text ask, never repo/code
   content.

2. **Register the real command** so `fgos tool query` can confirm
   presence — this is also what makes `AGENTS.md`'s install/setup/doctor
   gate catch the new dependency for free, with no new doctor check
   written by hand:

   ```
   fgos tool register --name <capacityId> --kind cli --capability <capacityId> --command <realCommand>
   fgos tool check
   ```

   (`--name` must equal the capacity's own id in the config —
   `resolveExecutorConfig`'s presence check looks up
   `tools[capacityId]` by that exact key.)

3. **Give the skill a way to resolve the real command/args without a
   second argv-building implementation.** If `dispatch.mjs` has no CLI
   entry point yet, add a thin one that calls the same
   `resolveExecutorConfig`/`resolveExecutorCommand` cli-dispatch already
   uses, printing `{command,args,provider,model}` as JSON (real example:
   `node src/runner/dispatch.mjs resolve <capacityId> --prompt <text>`,
   added in `tsk-5l2-1`). task-dispatch skills invoke this exact CLI, never a
   parallel prompt/argv builder of their own.

4. **In the skill's own `SKILL.md`, point at the shared fragment instead
   of inlining the branch logic.** `.claude/skills/_shared/capacity-
   dispatch-fallback.md` (tsk-53h) already carries the four-way branch —
   config check, presence check, configured-and-present dispatch, and the
   malformed-response fallback — generalized from this exact wiring
   (`submit-assist-classify`, the fragment's own real precedent). Reference
   it by relative path from the consuming `SKILL.md`
   (`../_shared/capacity-dispatch-fallback.md`) and fill in its three
   parameters: `<CAPACITY_ID>` (this capacity's id), `<PROMPT_TEMPLATE>`
   (this skill's own fixed prompt), and `<INLINE_FALLBACK_HEADING>` (this
   skill's own "reason about it yourself" heading). Do not re-copy the
   branch prose into the new skill's own file — that is exactly the drift
   risk the shared fragment exists to remove.

   Update **every** mirrored copy together
   (`.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`,
   and `.claude/skills/_shared/`/`.agents/skills/_shared/` if the fragment
   itself changes — `test/skills/fgos-mirror.test.mjs` enforces
   byte-identical content across both trees for `fgos-*` skills and for
   `_shared/`, and fails loudly if only one side is edited).

5. **Verify the dispatch actually works, live, once.** Since a prose
   skill's own branching can never be executed by the test suite (no
   test in this repo unit-tests a skill's runtime behavior — only the
   mirror-identity check above is structural), the acceptance proof for
   the "configured and present" path is a real, one-time manual run of
   step 3's resolve command followed by actually invoking the resolved
   command with a real prompt, confirmed to produce a sane, parseable
   response. Real example (`tsk-5l2-3`, verified 2026-08-01):

   ```
   $ agy -p "Classify this backlog ask's tier ... Ask: \"clean up the leftover console.log statements in the auth module\"" --model gemini-3.5-flash-low
   tier: light
   kind: chore
   risk: medium
   reasoning: Deleting leftover console.log statements is a minor maintenance task, but touching the sensitive auth module elevates the risk.
   ```

## Why this exists

A capacity's config and presence-check machinery (steps 1-3) already has
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
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — the shared
  fragment step 4 now points at, generalized from this exact wiring
  (`tsk-53h`).
- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` /
  `plan.md` — the locked decisions behind extracting step 4 into that
  shared fragment.
- `docs/how-to/diagnose-a-blocked-return-from-an-unrelated-verify-failure.md`
  — real gaps hit while returning the sibling items `tsk-5l2-1`/`tsk-5l2-2`
  that built the capacity mechanism this how-to wires a skill through.
