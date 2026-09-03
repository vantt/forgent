---
type: how-to
title: How to wire a skill through the dispatch decision
tags: []
timestamp: 2026-08-03T14:00:00.000Z
source_capture_ids: [tsk-3ik, tsk-3ik-4]
framework: diataxis
mode: how-to
---

# How to wire a skill through the dispatch decision

Use this when a skill is about to hand work outside the current reasoning
step: a registered executor, a real work item, an ad-hoc assignment, or a
direct Agent/Task-tool call. The skill must ask `dispatch.mjs decide` for
the mechanism instead of choosing for itself.

The governing rule is the Native-First Dispatch Doctrine, as amended by
the later dispatch vocabulary decisions: `rootTask`/`subTask` are not
current dispatch categories, and mechanism values are
`in-process`/`out-of-process`/`unavailable`.

## Decision Call

Call the door that matches what the skill knows:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/src/runner/dispatch.mjs" decide <executorId> [--has-live-task-access]
node "$root/src/runner/dispatch.mjs" decide --for <purpose> [--has-live-task-access]
node "$root/src/runner/dispatch.mjs" decide --work <workId> [--stage <stage>] [--has-live-task-access]
node "$root/src/runner/dispatch.mjs" decide --for <label> --needs-soul [--has-live-task-access]
```

Add `--has-live-task-access` only when the current session actually has an
Agent/Task tool in its own tool manifest. This is a self-declaration by
the caller, never an environment probe.

## Branching

`decide` returns one of three mechanisms:

- `unavailable` - nothing serves this selector. Fall back to the skill's
  own inline path and print no dispatch note.
- `in-process` - call the returned hand-back yourself: use `agentType`
  with your Agent/Task tool, or call the returned `mcpTool` directly. If
  neither is returned, use the skill's normal default for that live call.
- `out-of-process` - run `node "$root/src/runner/dispatch.mjs" execute`.
  Do not run a resolved command yourself through Bash; `execute` invokes
  the configured adapter and returns the real result.

For a worktree-backed item, pass explicit directory flags as
`--cwd <worktree path>` and `--repo-root <main checkout path>`. Do not
pass the main checkout as `--dir`/`--cwd` alone for worker execution.

## Reuse The Shared Fragment

Do not copy this branching prose into a skill. Point the skill's reasoning
step at:

```text
.agents/skills/_shared/executor-dispatch-fallback.md
```

That source is mirrored into `plugins/fgOS/skills/_shared/` by
`npm run build:skills`. `.claude/skills` now contains generated wrappers
only and has no `_shared` directory.

## Notes

`execute` may still hand back an `in-process` result because a passive CLI
cannot call the live Agent/Task or MCP tool on the caller's behalf. Every
adapter-resolvable case self-executes and returns structured JSON with the
result fields.

`judgeDiscovery` and `judgeDecompose` remain outside this pattern in their
headless subprocess path: that path never has live Agent/Task access, so
`decide` would always choose `out-of-process`. Their live-session shortcut
is the caller-supplied verdict path (`fgos discover --verdict ...` /
`fgos plan --verdict ...`), not dispatch-decision wiring.
