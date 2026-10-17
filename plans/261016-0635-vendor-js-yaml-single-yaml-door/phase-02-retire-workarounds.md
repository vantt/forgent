---
phase: 2
title: "Retire hand-rolled YAML readers and parser-unavailable branches"
status: completed
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Retire hand-rolled YAML readers and "parser unavailable" branches

## Goal

Every place that read YAML by regex or line matching, or reported "cannot
evaluate" because `yaml` might be missing, parses once with `parseYaml`, and
reports a parse failure per file as a named problem instead of skipping or
crashing.

## Context (scouted)

| Site | Reads | Callers |
|---|---|---|
| `src/setup/registrations.mjs:896` `extractSkillsFromYamlText` + name regex `:1003-1004,1070-1071` | agent YAML `name`, `skills` | `checkAgentClaimsResolve` paths `:1000-1010`, `:1068-1077` (catch → `continue`, drops the agent) |
| `src/runner/agent-roster.mjs:63-72` (identical copy + name regex) | same | `loadAgentDefs` → `src/runner/work-dispatch.mjs:63` (dispatch path, no try) |
| `src/runner/dispatch/assignment.mjs:636` `parseSimplePersonaYaml` | persona file or pinned text | `renderPersonaSection` `:689-698`; pinned text from `src/workflow/runner.mjs:205`, replayed `src/runner/execution/run.mjs:54-63,437-447`, `src/runner/dispatch/assignment-runner.mjs:2056-2058` |
| `src/runner/agent-definitions.mjs:92` `agentShapeProblem` | `name`, `description` by regex | `:120` (throws in `resolveAgentDefinition`), `agent-listing.mjs:116`, `registrations.mjs:1288` |
| `src/runner/agent-listing.mjs:27-59` `agentRenderWarnings`, `agentDescription` | describe what the old persona renderer drops | `registrations.mjs:1292`, `agent-listing.mjs:115-117` |
| `src/setup/registrations.mjs:2488` `workflowCapabilityUses` | `capability:` lines in workflow YAML/JSON, package root and project `cwd` | `checkWorkflowCapabilitiesConfigured` `:2524,2529` |
| `src/setup/workflow-pool-independence.mjs` `unavailable` branch | — | `:96-97`, `src/setup/blind-steps-proven-pools.mjs:100-101` |

Doctor runs checks without per-check isolation (`bin/fgos.mjs:4135-4137`), so
any throw from these readers aborts the whole doctor run today.

## Files

- Modify: `src/setup/registrations.mjs`, `src/runner/agent-roster.mjs`,
  `src/runner/dispatch/assignment.mjs`, `src/runner/agent-definitions.mjs`,
  `src/runner/agent-listing.mjs`, `src/setup/workflow-pool-independence.mjs`,
  `src/setup/blind-steps-proven-pools.mjs`
- Tests next to each module; fixtures for malformed agent and project workflow files.

## Steps

1. **One agent-definition reader.** In the runner layer (owner:
   `agent-definitions.mjs`, which setup already imports at
   `registrations.mjs:38`), add `readAgentDefinition(text, { filename })` →
   `{ data, error }`, where `data` is the parsed object (or `null`) and `error`
   is `cannot be parsed: <reason> (line L, column C)` from `YAMLException.mark`.
   Derive from `data`: `name` (coerced with `String()`), `skills` (strings only,
   `[]` when absent), `description`.
2. **Skills and names.** Replace both `extractSkillsFromYamlText` copies and the
   three name regexes with the reader. Roster: a file with `error` is skipped
   and its error returned alongside the roster so dispatch can surface it,
   never thrown. Doctor agent-claims checks: an `error` becomes a reported
   problem naming the file, replacing the silent `continue`. Delete the comment
   block at `registrations.mjs:883-895`.
3. **Shape check.** `agentShapeProblem(name, text)` uses the reader: a parse
   error returns the `cannot be parsed …` string; the two existing messages
   stay exactly as they are. Update the doc comment at `agent-definitions.mjs:86-90`.
4. **Persona.** `renderPersonaSection` gets data from `parseYaml`, projected to
   the renderer's shape (`description`, `persona.voice|style|archetype`,
   `decision_boundary.can_decide|must_escalate`; scalars rendered with
   `String()`, arrays of strings). A file read fresh that fails to parse renders
   one visible line `Persona "<ref>" could not be parsed: <reason>` instead of
   silently dropping the section. **Pinned text** that fails to parse falls back
   to `legacyPersonaProjection` (the old `parseSimplePersonaYaml`, renamed,
   module-private, with a comment stating it exists only for text pinned by
   releases before this change and the removal condition). Intended differences
   for fresh files: block scalars render in full, inline `# comments` are
   stripped, numbers normalise (`1e3` → `1000`); list them in CHANGELOG.
5. **Persona lint.** Rewrite `agentRenderWarnings` and `agentDescription` from
   the same parsed data: delete warnings that describe limits the new renderer
   no longer has (multi-line description marker), keep warnings that are still
   true (fields the renderer ignores). `listAgents` shows the full description.
6. **Workflow capabilities.** Parse each file (`JSON.parse` for `.json`,
   `parseYaml` otherwise) and collect every string under a key named
   `capability` at any depth, with an iterative walk and a visited set (self-
   referencing maps from aliases must not loop). Files that fail to parse are
   collected and reported by `checkWorkflowCapabilitiesConfigured` as
   `<file>: cannot be parsed: …`. Before deleting the line matcher, compare old
   and new maps over this repo's `core/workflows` and `domains/*/workflows` in a
   temporary test; a commented-out `capability:` line counted by the old
   matcher is a known intended difference.
7. **Unavailable branch.** Delete `loadWorkflowDefinitions`'s `unavailable`
   return and doc sentence, and the caller branches in
   `workflow-pool-independence.mjs:96-97` and `blind-steps-proven-pools.mjs:100-101`.
8. **Tests.** Malformed `agents/x.yaml` in a fixture project: roster skips it
   and reports, doctor names it, dispatch of other agents works. Malformed
   project workflow: `fgos doctor` still lists every check and names the file.
   Persona: pinned text that js-yaml rejects (`voice: direct: no hedging`)
   renders as before; fresh file with the same content renders the visible
   could-not-parse line; block-scalar description renders in full. Name
   `123` coerces to `"123"`.

## Verification

- Tests of every touched module (`grep -rln "<module>" test`), plus
  `test/runner/agent-definitions.test.mjs`, `test/setup/registrations.test.mjs`,
  `test/setup/checks.test.mjs`.
- Doctor JSON in three environments, diffed check by check: (a) an installed
  release or a copy with `yaml` installed, (b) current HEAD copied without
  `node_modules`, (c) the worktree. Every check that changes between (b) and
  (c) is listed in the phase report as an intended change (newly evaluated
  `workflow-pools-satisfy-independence`, `blind-steps-use-proven-pools`) or fixed.
- `grep -rn "extractSkillsFromYamlText\|parseSimplePersonaYaml\|yaml package is not installed" src` returns nothing.

## Risk and rollback

Each numbered step is its own commit; a regression reverts one step.
