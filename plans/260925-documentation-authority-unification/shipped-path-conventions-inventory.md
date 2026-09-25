# Shipped Path Conventions Inventory

```txt
Document type: Inventory
Audience: Architect, maintainer, reviewer, agent
Purpose: Separate repository-local contracts from consumer-project contracts across shipped surfaces
Design status: Accepted (Phase 01)
Implementation: Implemented (Phase 01)
Phase: 01 Deliverable 7
Last reviewed: 2026-09-25
Related:
- `plans/260925-documentation-authority-unification/shipped-path-conventions-inventory.json`
- `plans/260925-documentation-authority-unification/plan.md` §3 Decision 11
```

## 1. Boundary Principle

> **Locked Program Decision 11 (plan.md §3):** Self-hosted paths and shipped conventions
> are separate contracts. Rewriting this repository must not silently impose its topology
> on projects that consume fgOS (Missions #1 and #2).

During documentation unification, changing an internal platform documentation route (such as
retiring `docs/specs/runner.md` in favor of `docs/platform/runner/spec.md` at Phase 08 cutover)
must **never** inadvertently alter or break path contracts that consumer projects rely upon.

## 2. Summary Statistics

- **Surfaces Scanned:** core, domains, plugins/fgOS, .agents/skills, .fgos/instructions/effective
- **Total Shipped Files Scanned:** 251
- **Total Unique Referenced Paths:** 183
- **Consumer-Project Contracts:** 69
- **Repository-Local Contracts:** 107
- **Mixed Repository-Local and Consumer Contracts:** 7
- **Unclassified Paths:** 0
- **Path Existence:** 149 existing on disk, 34 nonexistent (examples, placeholders, patterns, retired citations)
- **Safe Rewrite Targets:** 92 verified repo-local files
- **Non-Target Examples & Placeholders:** 91 references (must not be rewritten merely because contractScope is repository-local)

## 3. Consumer-Project Contracts

These paths represent conventions expected to exist or be created in user/consumer repositories:

| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |
|---|:---:|---|---|---|---|---|
| `.agents/skills` | 6 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.agents/skills/_shared/catchup-self-recovery.md` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.agents/skills/_shared/coding-worker-contract.md` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.agents/skills/fgos-coding-implement/SKILL.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills` | 6 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/fgos-coding-implement/SKILL.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/fgos-routing/SKILL.md` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` | 1 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Agent skill definitions and wrappers deployed to consumer workspaces |
| `.claude/worktrees` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Harness worktree isolate directory convention |
| `.fgos/assignments` | 3 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/config.json` | 21 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/coordination/sessions` | 3 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/coordination/sessions/code-panel` | 3 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/events.jsonl` | 10 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/events.lock` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/installation/bin/fgos` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/logs` | 5 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `.fgos/main-checkout.lock` | 5 | `example-or-placeholder` | `nonexistent` | `consumer-workspace-pattern` | `pattern-placeholder` | Runtime work-state, configuration, coordination, and session storage in consumer workspaces |
| `core/coordination-protocols` | 2 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/architecture-advisory-panel-v1.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/declared-consult.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/deliberation-delphi-chain.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/deliberation-nominal-group-chain.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/deliberation-rfc-chain.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/group-cognition-framework.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/group-thinking-delphi-feedback-lite.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/group-thinking-nominal-group-lite.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/group-thinking-rfc-review-lite.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/independent-research-fan-out-fan-in-gated.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/independent-research-fan-out-fan-in.yaml` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/coordination-protocols/standalone-master-coordination-loop.yaml` | 4 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/protocol-packs/group-thinking.json` | 7 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Core multi-agent coordination protocol definitions and packs shipped with fgOS platform |
| `core/skills/_shared/private-cell-worktree.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Canonical core skill definitions and shared fragments shipped for harness/workspace operation |
| `core/skills/fgos-group-thinking/SKILL.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Canonical core skill definitions and shared fragments shipped for harness/workspace operation |
| `core/skills/fgos-panel/SKILL.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Canonical core skill definitions and shared fragments shipped for harness/workspace operation |
| `docs/distillery` | 9 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/comparison-matrix.md` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/deep-dives` | 5 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/porting-log.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/sources` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/state` | 4 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/state/porting` | 2 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/distillery/taxonomy.txt` | 1 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Project-local reference-learning distillery area |
| `docs/enduser-docs-index.json` | 5 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/explanation` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` | 2 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/author-a-plan-loop-track.md` | 6 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` | 3 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/fix-fgos-write-rejected-merge-block.md` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md` | 6 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/run-a-coordination-session.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/use-fgos-architecture-panel.md` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md` | 3 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/how-to/write-verify-for-a-skill-prose-change.md` | 6 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/reference` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/reference-learning-system.md` | 2 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `docs/tutorials` | 3 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Diataxis end-user knowledge quadrants and tag index authored in consumer projects |
| `plugins/fgOS/skills` | 12 | `literal-current-path` | `exists` | `shipped-surface-contract` | `resolved` | Client plugins providing slash commands in user harnesses |
| `plugins/fgOS/skills/_shared/catchup-self-recovery.md` | 1 | `generated-mirror` | `exists` | `generated-mirror-entry` | `resolved` | Client plugins providing slash commands in user harnesses |
| `plugins/fgOS/skills/submit/SKILL.md` | 4 | `generated-mirror` | `exists` | `generated-mirror-entry` | `resolved` | Client plugins providing slash commands in user harnesses |
| `plugins/fgOS/skills/terminal/rename.sh` | 3 | `generated-mirror` | `exists` | `generated-mirror-entry` | `resolved` | Client plugins providing slash commands in user harnesses |
| `plugins/packages/open` | 1 | `example-or-placeholder` | `nonexistent` | `consumer-knowledge-quadrant` | `pattern-placeholder` | Client plugins providing slash commands in user harnesses |

## 4. Repository-Local Contracts

These paths are internal to the fgOS platform codebase. They are split into real verified files eligible for rewrite and illustrative non-target examples:

### 4.1 Verified Repository-Local Files (Safe Rewrite Targets)

These paths exist on disk within fgOS and are eligible to be safely transformed during Phase 07 preparation:

| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |
|---|:---:|---|---|---|---|---|
| `bin/fgos.mjs` | 5 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `docs/architect/agent-coordination/contracts` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/agent-coordination/contracts/coordination-session.md` | 6 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/agent-coordination/contracts/flow-definition.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/agent-coordination/playbooks/prompts/master-coordinator.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/agent-coordination/verification` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/architect/knowledge-registry-redesign.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/backlog.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/decisions` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history` | 53 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/agent-coordination-foundation/plan.md` | 9 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/claude-named-executor/RESEARCH.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/commit-time-fgos-deletion-guard` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/discover-decompose-skill-wrapper-verdict-routing/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/dispatch-activation-and-handoff-redesign/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/fgos-cleanup-loop/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/fgos-retro-loop/CONTEXT.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/fgos-terminal-pane-rename/CONTEXT.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/gate-bypass/CONTEXT.md` | 7 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/iron-law-gate-human-ux/CONTEXT.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/merge-standardization/CONTEXT.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/orchestrator-worker-slots/DISCUSSION.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/pi-executor-runtime-capacity/RESEARCH.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/retro-next-shared-driving/CONTEXT.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/self-contained-id-references/CONTEXT.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/self-contained-id-references/DISCUSSION.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/tsk-5gd/RESEARCH.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/tsk-5tm-3/iron-law-evidence.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/two-layer-dispatch/DISCUSSION.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/history/worktree-manual-merge-fgos-blob-safety-net` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/id-systems-audit.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/operator-runbook-herdr-cockpit.md` | 1 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/platform-foundations.md` | 2 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/platform/packaging-distribution/code-panel-rollout-plan.md` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/specs` | 3 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/specs/reading-map.md` | 4 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/specs/runner.md` | 15 | `literal-current-path` | `exists` | `platform-specification-or-doctrine` | `resolved` | Internal fgOS platform specification, architecture, decision history, or governance |
| `scripts/check-decision-citation-drift.baseline.json` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `scripts/check-decision-citation-drift.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `scripts/write-wrapper-script.mjs` | 6 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/cli/command-registry.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/evolve/iron-law.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/intake` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/intake/classify.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/intake/discovery.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/intake/plan.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/intake/risk-keywords.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/report/capability-plan-lint.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/report/enduser-index.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/claim-port.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/coordination/session-engine.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/definitions/protocol-loader.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/definitions/schema.mjs` | 5 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/deliberation/schema.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/dispatch.mjs` | 27 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/dispatch/assignment-policy.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/dispatch/assignment.mjs` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/dispatch/resolve.mjs` | 6 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/loop.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/main-checkout-lock.mjs` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/merge.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/paths.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/worker-log.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/worktree.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/setup/registrations.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/cleanup-harness.mjs` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/cleanup-pool.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/discover-pool.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/gate-bypass.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/graph-harness.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/graph-metrics.mjs` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/plan-pool.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/postland-drift.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/retro-pool.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/status-fsm.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/store.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/tool-registry.mjs` | 1 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/work.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/state/workflow-stage-graphs.mjs` | 11 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/util/session-identity.mjs` | 4 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/verbs/coordination` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/verbs/coordination/group-thinking-pack.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/verbs/coordination/run.mjs` | 7 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/verbs/coordination/schema.mjs` | 14 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/verbs/coordination/show.mjs` | 3 | `literal-current-path` | `exists` | `internal-implementation` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |

### 4.2 Illustrative Examples and Non-Target References

These paths are illustrative examples, hypothetical modules, placeholders, or retired citations referenced inside shipped skills and documentation (e.g., `src/foo.mjs`, `src/auth.mjs`, `scripts/distill.mjs`, `src/runner/retry.mjs`, `test/parser.test.mjs`). Even though their path syntax is repository-local, they do NOT exist on disk and MUST NEVER be labeled or treated as safe rewrite targets merely because contractScope is repository-local:

| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |
|---|:---:|---|---|---|---|---|
| `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md` | 3 | `stale-or-dead` | `nonexistent` | `retired-decision-citation` | `stale-retired` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` | 6 | `stale-or-dead` | `nonexistent` | `retired-decision-citation` | `stale-retired` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/metadata` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS platform specification, architecture, decision history, or governance |
| `docs/notes.md` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS platform specification, architecture, decision history, or governance |
| `scripts/distill.mjs` | 5 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/auth.mjs` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/foo.mjs` | 6 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/parser.mjs` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/runner/retry.mjs` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `src/x.mjs` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `test/parser.test.mjs` | 3 | `example-or-placeholder` | `nonexistent` | `illustrative-example` | `example-not-target` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `test/runner/assignment-policy.test.mjs` | 1 | `test-evidence-reference` | `exists` | `test-suite-or-fixture` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `test/runner/coordination-driver-authorization.test.mjs` | 1 | `test-evidence-reference` | `exists` | `test-suite-or-fixture` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `test/runner/coordination-group-thinking-rfc-review-lite.test.mjs` | 1 | `test-evidence-reference` | `exists` | `test-suite-or-fixture` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |
| `test/runner/coordination-nominal-group-lite.test.mjs` | 1 | `test-evidence-reference` | `exists` | `test-suite-or-fixture` | `resolved` | Internal fgOS implementation code, CLI binaries, tests, or scripts |

## 5. Mixed Repository-Local and Consumer Contracts

These paths serve dual roles: active repository-local doctrine or platform truth for fgOS, and templates or shared conventions for consumer workspaces:

| Path | Occurrences | Reference Kind | Existence | Source Role | Resolution | Scope & Rationale |
|---|:---:|---|---|---|---|---|
| `core/instructions/platform-laws.md` | 1 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Platform operating law definitions: authoritative platform source truth projected into consumer workspace instructions |
| `domains/coding/AGENTS.md` | 3 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |
| `domains/coding/harness/enrich-and-validate-contract.mjs` | 1 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |
| `domains/coding/instructions/verification-discipline.md` | 3 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |
| `domains/coding/registry.yaml` | 1 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |
| `domains/coding/task-specs/judge-ambiguity.md` | 3 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |
| `domains/coding/workflows/feature.yaml` | 1 | `literal-current-path` | `exists` | `mixed-platform-and-consumer-doctrine` | `resolved` | Dual role: active repository-local doctrine for fgOS self-hosting coding domain and template/convention for consumer projects |

## 7. Migration Safeguards

1. Phase 07 consumer preparation must only rewrite verified repository-local files (`isSafeRewriteTarget: true`). Illustrative examples and placeholders (`scripts/distill.mjs`, `src/auth.mjs`, `src/foo.mjs`, `src/runner/retry.mjs`, `test/parser.test.mjs`, `src/parser.mjs`, `src/x.mjs`, `docs/notes.md`, `docs/metadata`) must never be treated as safe rewrite targets merely because contractScope is repository-local.
2. Shipped skill templates and plugin wrappers that refer to consumer-project contracts (`.fgos/`, `docs/how-to/`, `domains/`, `core/skills/`) must remain stable.
3. Mixed contracts (`domains/coding/AGENTS.md`, `core/instructions/platform-laws.md`) require explicit separation before modification.
4. Any skill that cites a repo-local spec as a self-hosting aid must be evaluated for abstraction into a provider or runtime inspection door rather than hardcoding repository paths.
