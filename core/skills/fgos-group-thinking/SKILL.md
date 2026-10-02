---
name: fgos-group-thinking
user-invocable: false
description: >-
  Launch, resume, or render replay for named discussion Workflows
  (`delphi`, `nominal-group`, `group-cognition`, `architecture-advisory`)
  and CollaborationPattern presets (`rfc`, `consult`, `research-fan-out`).
  This is the execution door for named workflows and discussion presets.
  Use fgos-panel for a person's
  natural-language panel/review/compare/red-team request; use this skill
  when a preset, workflow, or operator already selected the discussion shape.
  Examples: "run the delphi workflow for this decision", "start nominal-group
  workflow", "run rfc preset for this proposal", "resume workflow run wf_xyz".
---

# fgos-group-thinking

This is a core-facing execution gate, not the end-user vocabulary surface.
[`fgos-panel`](../fgos-panel/SKILL.md) accepts natural language, selects a
use-case preset, and routes directly to a named Workflow or CollaborationPattern
preset. Never ask a person to supply a workflow ID or protocol ID merely because
this lower layer executes named definitions.

Discussion patterns in fgOS are represented as:
1. **Discussion Workflows** in `core/workflows/*.yaml`, executed by the
   Workflow Runner (`src/workflow/runner.mjs`) and CLI (`fgos workflow`):
   - `delphi`: Multi-round Delphi deliberation (blind proposals -> feedback synthesis -> second round -> final consensus)
   - `nominal-group`: Nominal Group Technique (silent generation -> round-robin sharing -> voting/ranking -> final ranking)
   - `group-cognition`: Group cognition (sense-making -> dialectical inquiry -> action synthesis)
   - `architecture-advisory`: Architecture advisory panel (framing -> 3-panelist shaping -> critique with red-team -> synthesis -> explanation)
2. **Single-Unit CollaborationPattern Presets** in `src/runner/execution/patterns/presets.mjs`:
   - `rfc`: Reviewed collaboration pattern (1 critique round with red-team)
   - `consult`: Solo advisor pattern (`pattern: solo`, role: `advisor`)
   - `research-fan-out`: Panel pattern (`pattern: panel`, 3 members)
   - `code-change`: Reviewed code implementation pattern
## Role split: coordinates research, is never the researcher

This skill coordinates multiple contributions — deliberation, independent
research passes, cross-provider review, synthesis — across several
actors through a registered Workflow or CollaborationPattern. It never replaces
[`fgos-researching`](../fgos-researching/SKILL.md) (the single-agent
"turn one question into one grounded finding" workflow) and never becomes
a second research engine of its own: it has no research logic, no
repo/web-search step, and no finding format of its own. A single research
question stays with `fgos-researching`; this skill only enters when
several agents' contributions genuinely need coordinating — e.g. several
research passes need synthesizing, or the same question needs
cross-provider review.

## 1. Discover available Workflows & Presets

Workflows are declared in `core/workflows/*.yaml` and validated by
`src/workflow/definition.mjs`. Use the Workflow loader to list registered workflows:

```bash
fgos workflow start --help
```

Single-unit collaboration pattern presets are defined in
`src/runner/execution/patterns/presets.mjs` (`consult`, `research-fan-out`, `rfc`, `code-change`).

## 2. Start a Discussion Workflow

Launch a named workflow using the unified `fgos workflow start` command:

```bash
fgos workflow start <workflowId>
```

Examples:
```bash
fgos workflow start delphi
fgos workflow start nominal-group
fgos workflow start group-cognition
fgos workflow start architecture-advisory
```

The Workflow Runner parses the YAML definition, resolves unit capability bindings
via `src/runner/execution/bind.mjs`, and executes steps sequentially or in parallel
according to declared DAG dependencies (`dependsOn`).

## 3. Check Status and Handle Gates

Check current workflow progress, step states, and parked gates:

```bash
fgos workflow status <workflowRunId>
```

When a workflow pauses at an interactive gate (such as `voting-ranking` in
`nominal-group.yaml`), answer the gate to resume execution:

```bash
fgos workflow answer <workflowRunId> --step <stepId> --answer "<answer text>"
```

To resume an interrupted or parked workflow without an explicit answer:

```bash
fgos workflow resume <workflowRunId>
```

## 4. Run Single-Unit Collaboration Presets

Single-unit presets (`consult`, `research-fan-out`, `rfc`) execute directly
via their resolved CollaborationPattern:

```bash
fgos run --pattern <preset>
```

## Invariants and Safety

- **Single Authority:** `src/workflow/runner.mjs` is the sequencer; `src/runner/execution/bind.mjs` is the binding authority; `src/runner/execution/run.mjs` is the unit execution door.
- **Inputs & Visibility:** Step inputs and pane isolation enforce visibility boundaries (e.g. blind proposals in `delphi` round 1, silent generation in `nominal-group`).
- **No Protocol IDs:** Presets and routes identify workflows and patterns strictly by their canonical names (`delphi`, `nominal-group`, `group-cognition`, `rfc`, etc.).
## The gate, and why it holds
This gate forwards requests directly to the Workflow Runner or unit execution
subsystem. It guarantees that:
1. Workflow IDs are validated against discovered YAML definitions in `core/workflows/*.yaml` or `domains/<domain>/workflows/*.yaml`.
2. All steps and units satisfy G2 constraints (no infrastructure leaks such as hardcoded executors, models, or tiers in workflow definitions).
3. Human gates park deterministically until explicitly answered via `fgos workflow answer`.
4. Completed runs emit structured artifacts and events for replay and verification.
