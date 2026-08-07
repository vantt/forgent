---
type: how-to
title: How to reuse the shared capacity-dispatch-fallback fragment in a new skill
tags: []
source_capture_ids: [tsk-53h]
---
# How to reuse the shared capacity-dispatch-fallback fragment in a new skill

Use this when a new in-session skill wants an optional "dispatch to a
configured capacity, else reason about it inline" step — the same shape
`fgos-submit-assist`'s classify step already uses — without copy-pasting
that branch logic into the new skill's own `SKILL.md`.

## Before you start

`fgos-submit-assist`'s classify step (`tsk-5l2`) was, until this pattern
was extracted, the only skill in this repo wired through the
capacity-dispatch mechanism (`resolveCapacityCli`/`resolveExecutorConfig`,
`src/runner/dispatch.mjs`). A second skill wanting the same
dispatch-with-fallback shape would have had to copy that branch prose by
hand — and the two copies would drift the next time the branching logic
changed. That's why the branch logic now lives in one shared file instead.

## Steps

1. **Wire the config/registration steps first**, following
   `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
   steps 1–3 (unchanged, still skill-agnostic): add a `.fgos/config.json`/
   `.fgos-runner.json` `runner.capacities.<id>` entry, `fgos tool register`
   it, and confirm it resolves via `dispatch.mjs`'s `resolve` CLI
   subcommand.

2. **Point your `SKILL.md`'s reasoning step at the shared fragment**
   instead of inlining the branch logic:

   ```markdown
   See `../_shared/capacity-dispatch-fallback.md`, filling in:
   - `<CAPACITY_ID>` = your-capacity-id
   - `<PROMPT_TEMPLATE>` = your fixed prompt text (verbatim, never re-worded per call)
   - `<INLINE_FALLBACK_HEADING>` = the heading of your own "reason about it yourself" step
   ```

   Mirror the same edit into `.agents/skills/<your-skill>/SKILL.md` — every
   `fgos-*` skill keeps its two trees byte-identical
   (`test/skills/fgos-mirror.test.mjs`), and the shared fragment itself
   lives at both `.claude/skills/_shared/capacity-dispatch-fallback.md`
   and its `.agents/skills/_shared/` mirror.

3. **Know what the fragment does on your behalf**, so you can read its
   output correctly:
   - **Step A (config check)** — `not-configured` skips straight to your
     inline-fallback heading, byte-identical to before this capacity
     existed. `configured` moves to Step B.
   - **Step B (presence check)** — empty `providers` (registered but not
     present) prints one visible note, then falls through to your
     inline-fallback heading too. Exactly one present provider moves to
     Step B.5.
   - **Step B.5 (native-vs-cli/spawn decision, tsk-3ik-3, Native-First
     Dispatch Doctrine)** — decide for yourself whether you (the assistant
     reading the fragment) already have live Agent/Task tool access right
     now (never inferred from environment or config), then run
     `node dispatch.mjs decide <CAPACITY_ID> [--has-live-task-access]`.
     `mechanism: "cli-spawn"` proceeds to Step C. `mechanism: "native"`
     skips Step C entirely — print the announce line
     `<CAPACITY_ID> - native - <agentType> - <model>`, then call your own
     Agent/Task tool directly with `subagent_type` = the JSON's `agentType`
     and the same `<PROMPT_TEMPLATE>` prompt Step C would have built.
   - **Step C (cli-spawn dispatch)** — resolves real command/args via
     `dispatch.mjs`'s own `resolveExecutorConfig` (never a second
     argv-building implementation), prints the announce line
     `<CAPACITY_ID> - cli-spawn - <provider> - <model>`, then runs it.
   - **Step D (malformed-response fallback)** — a missing/unparseable/
     unusable response falls back to your inline-fallback heading exactly
     as if the capacity were absent; never treat a dispatched answer as
     more trustworthy than your own reasoning would have been.

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
shelling out to a resolved capacity command is always available. The
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
capacity-dispatch design resolving an `agentType` into real invocation
args cannot assume any common flag shape across providers — this is why
Step B.5's native-vs-cli/spawn decision is a real branch, not a detail
to paper over.

## Related

- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` —
  full decision record (D1–D3) and scout evidence.
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-capacity.md`
  — the precedent this fragment's branch logic was extracted from;
  still the reference for config-entry/registration steps 1–3.
- `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`
  — Step B.5's own dispatch-decision mechanism in more depth.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  — Native-First Dispatch Doctrine, the governing rules behind Step B.5.
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — the fragment
  itself.
