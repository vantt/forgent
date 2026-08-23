---
type: how-to
title: How to reuse the shared executor-dispatch-fallback fragment in a new skill
tags: []
source_capture_ids: [tsk-53h]
---
# How to reuse the shared executor-dispatch-fallback fragment in a new skill

Use this when a new in-session skill wants an optional "dispatch to a
configured executor, else reason about it inline" step — the same shape
`fgos-submit-assist`'s classify step already uses — without copy-pasting
that branch logic into the new skill's own `SKILL.md`.

## Before you start

`fgos-submit-assist`'s classify step (`tsk-5l2`) was, until this pattern
was extracted, the only skill in this repo wired through the
executor-dispatch mechanism (`resolveExecutorCli`/`resolveExecutorConfig`,
`src/runner/dispatch.mjs`). A second skill wanting the same
dispatch-with-fallback shape would have had to copy that branch prose by
hand — and the two copies would drift the next time the branching logic
changed. That's why the branch logic now lives in one shared file instead.

## Steps

1. **Wire the config/registration steps first**, following
   `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
   steps 1–3 (unchanged, still skill-agnostic): add a `.fgos/config.json`
   `runner.executors.<id>` entry, declare it as a tool-registry entry too
   (a `capability` field on that same entry, tsk-in1-1 D1 — no longer a
   `fgos tool register` verb call), and confirm it resolves via
   `dispatch.mjs`'s `resolve` CLI subcommand.

2. **Point your `SKILL.md`'s reasoning step at the shared fragment**
   instead of inlining the branch logic:

   ```markdown
   See `../_shared/executor-dispatch-fallback.md`, filling in:
   - `<EXECUTOR_ID>` = your-executor-id
   - `<PROMPT_TEMPLATE>` = your fixed prompt text (verbatim, never re-worded per call)
   - `<INLINE_FALLBACK_HEADING>` = the heading of your own "reason about it yourself" step
   ```

   Mirror the same edit into `.agents/skills/<your-skill>/SKILL.md` — every
   `fgos-*` skill keeps its two trees byte-identical
   (`test/skills/fgos-mirror.test.mjs`), and the shared fragment itself
   lives at both `.claude/skills/_shared/executor-dispatch-fallback.md`
   and its `.agents/skills/_shared/` mirror.

3. **Know what the fragment does on your behalf**, so you can read its
   output correctly (tsk-5tm-3 D5 reduced this to 3 steps — `execute` now
   self-executes or hands back in one call, folding what used to be a
   separate presence check and native-vs-cli/spawn decision into it):
   - **Step A (config check)** — `not-configured` skips straight to your
     inline-fallback heading, byte-identical to before this executor
     existed. `configured` moves to Step B. No separate presence check any
     more (tsk-5tm-1 D1 retired the `needs` field and the gate that
     consulted it) — a missing backend now surfaces as `execute`'s own
     spawn failure, caught by Step C.
   - **Step B (`execute`, self-execute or hand back)** — decide for
     yourself whether you (the assistant reading the fragment) already
     have live Agent/Task tool access right now (never inferred from
     environment or config), then run `node dispatch.mjs execute
     <EXECUTOR_ID> --prompt "..." [--has-live-task-access]`. Prints one of
     two shapes: `{"mechanism":"in-process","agentType":...,"prompt":...}`
     — dispatch has no Task tool of its own, so this is the one case it
     hands back; print `<EXECUTOR_ID> - in-process - <agentType> -
     <model>`, then call your own Agent/Task tool with `subagent_type` =
     `agentType` and the same `<PROMPT_TEMPLATE>` prompt. Or
     `{"mechanism":"out-of-process", ...real result fields}` — dispatch
     already ran it via `EXECUTOR_ADAPTERS`, reusing
     `resolveExecutorConfig`/`resolveExecutorCommand` internally (never a
     second argv-building implementation); print `<EXECUTOR_ID> -
     out-of-process - <provider> - <model>` and read `stdout` — this IS
     the real answer, nothing left to run.
   - **Step C (malformed-response fallback)** — a missing/unparseable/
     unusable response, or an error from Step B's own call, falls back to
     your inline-fallback heading exactly as if the executor were absent;
     never treat a dispatched answer as more trustworthy than your own
     reasoning would have been.

4. **Verify the mirror still holds**:

   ```bash
   node --test test/skills/fgos-mirror.test.mjs
   ```

   This test enumerates `_shared/` (not just `fgos-*`-prefixed
   directories) across both `.claude/skills/` and `.agents/skills/`, so
   the shared fragment's own mirror is structurally enforced the same way
   every skill's is.

## Why a shared fragment, not a second inline copy

> Prefer a single shared skill-facing fragment/reference file that
> consumer `SKILL.md` files point to by path, over each skill
> copy-pasting the branching prose into its own `SKILL.md`. Reason:
> independent copies drift out of sync the next time this pattern's logic
> changes (DRY) — a single referenced source doesn't.

The fragment lives under `.claude/skills/_shared/` — the skill tree the
mirror test already governs — rather than under `docs/how-to/`, since a
skill-facing fragment other `SKILL.md` files point to by relative path
belongs where the mirror machinery scans, not in a location the mirror
test does not check at all.

## Why cli-dispatch and task-dispatch aren't two separate architectures

A live session's task-dispatch (native Agent/Task tool use) can always
fall through to cli-dispatch — a live session always has Bash, so
shelling out to a resolved executor command is always available. The
reverse is conditional, not structural: cli-dispatch (`fgos-runner`, a
bare Node process, never itself inside a Claude Code session) can never
call the Agent/Task tool directly — but if the specific command it spawns
is `claude` itself, that spawned process is a real Claude Code agent
loop, and task-dispatch becomes available again one level down, inside
that worker, gated entirely by whatever `--allowedTools` the spawned
invocation was given.

This nesting property isn't Claude-specific by nature — it's just that
Claude Code is the only harness fgOS currently knows to have it (via
Task/Agent tool). `agy` (a real, installed, multi-provider CLI) has its
own independent persona-dispatch mechanism (`--agent`/`agent.md` files,
a different schema than Claude's `.claude/agents/<name>.md`), and
`codex` has a third, structurally different shape again — no CLI flag
selects the agent at all; persona dispatch happens via prompt text
naming an agent defined in `.codex/agents/<name>.toml`. Any
executor-dispatch design resolving an `agentType` into real invocation
args cannot assume any common flag shape across providers — this is why
Step B's native-vs-cli/spawn decision (applied internally by `execute`,
tsk-5tm-3 D5) is a real branch, not a detail to paper over.

## Related

- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` —
  full decision record (D1–D3) and scout evidence.
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  — the precedent this fragment's branch logic was extracted from;
  still the reference for config-entry/registration steps 1–3.
- `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`
  — Step B's own dispatch-decision mechanism in more depth.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the governing rules behind Step B.
- `.claude/skills/_shared/executor-dispatch-fallback.md` — the fragment
  itself.
