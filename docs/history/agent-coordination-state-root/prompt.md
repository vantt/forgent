# Master Prompt — State/Root Resolution Foundation Investigation (P0)

## Mission

Investigate and, if justified, fix the recurring mismatch between fgOS state
stores, linked worktrees, and the real repository main checkout. The immediate
symptom is an item visible in a worktree `.fgos` store but invisible to
`fgos approve` from the main checkout; the CLI correctly refuses approval from
any linked worktree.

This is a standalone coordination stream. It may run in parallel with
`docs/history/agent-coordination-foundation/plan.md`, but it must not change
dispatch capability semantics or group-thinking protocol semantics.

## Worktree and branch contract

The repository's real main checkout is `/home/vantt/projects/forgentX`.
Never treat `/home/vantt/projects/forgentX-worker-isolation` (or any other
linked worktree) as main merely because it contains a `.fgos` directory.

The coordinating agent must work on a fresh branch/worktree created from the
current `main` tip, for example:

```text
worktree: /home/vantt/projects/forgentX/.claude/worktrees/agent-coordination-state-root
branch:   fgw/agent-coordination-state-root
base:     main
```

The capability foundation agent uses a separate worktree and branch:

```text
worktree: /home/vantt/projects/forgentX/.claude/worktrees/agent-coordination-foundation
branch:   fgw/agent-coordination-foundation
base:     main
```

Both worktrees must be created after the plan/prompt commits are present on
`main`. Do not share a worktree, branch, or writable checkout between the two
agents. Do not run `fgos approve` from either linked worktree; approval must
run from the real main checkout after review.

The existing `dispatch-visibility-v0` worktree is historical/runtime state
and is not a base for either stream. Do not merge it wholesale, copy its
`.fgos` directory, or clean it until this prompt's investigation identifies
the authoritative state root and a reversible cleanup procedure.

## Operating rules

1. Start with read-only inventory. Do not copy, truncate, reset, stash, or
   delete `.fgos` state.
2. Read `docs/specs/reading-map.md`, the runner/state/distribution specs, and
   the ADR0020 worktree-state doctrine before editing.
3. Trace the existing path resolution and approve guards in:
   `bin/fgos.mjs`, `src/runner/paths.mjs`, `src/runner/worktree.mjs`,
   `src/verbs/merge/approve.mjs`, and state-store/runtime-coordination code.
4. Inventory all open related work before selecting scope. Classify each item
   as root cause, reproducer, dependent, cleanup, or unrelated noise.
5. Before any dispatch, run the existing dispatch `decide` command. For a
   multi-agent investigation, use the existing coordination doors only.
6. If using group-thinking, explicitly select a registered protocol from
   `core/protocol-packs/group-thinking.json`; never invent a protocol id.
7. Keep state migration/recovery separate from source-code repair. A recovery
   action needs explicit evidence of which event files are authoritative and
   a reversible procedure.

## Required inventory (current open candidates)

Re-check status, branch, owner, and latest evidence at execution time. The
following candidates were observed in the current stores and are leads, not
pre-approved scope:

### Direct state/root and worktree candidates

- `tsk-oyc` — worker `.fgos` writes land in a disconnected store;
- `tsk-2u5` — stale worktree index;
- `tsk-25r` — hidden worktree claim/merge/cleanup lifecycle bugs;
- `tsk-4dk` — orphaned/stale worktrees versus work items;
- `tsk-239` — root/aggregator branch drift;
- `tsk-3rg5` — approve blocked by dirty tracked `.fgos`;
- `tsk-5rg` — approve/move state event disappears;
- `tsk-5l0`, `tsk-5ie`, `tsk-21fy`, `tsk-56u` — truncation, sidecar locking,
  silent event loss, and destructive ordinary git operations;
- `tsk-5ypg` — settleClaim whole-item revision/CAS instability;
- `tsk-2s9` — stuck root claim and reclaim path;
- `tsk-1l9`, `tsk-2q8` — delivered/branch/merge resolution inconsistencies.

### Distribution/install candidates that may affect root resolution

- `tsk-1fp`, `tsk-1ax`, `tsk-21p`, `tsk-5b5`, `tsk-4vh`.

### Coordination/dispatch candidates that may be dependencies, not P0 scope

- `tsk-4lc`, `tsk-49o`, `tsk-492`, `tsk-9tu`, `tsk-5x7-1`;
- `tsk-371`, `tsk-5qj`, `tsk-3xk`, `tsk-3bf`, `tsk-47l`, `tsk-63z`,
  `tsk-3ru`, `tsk-1zk`.

The inventory must also report duplicates caused by separate `.fgos` stores;
do not count the same item twice merely because two checkouts list it.

## Master-coordination procedure

### Pass 1 — observe

- identify the canonical repository main checkout using Git structure, not
  process cwd;
- identify every state root consulted by submit/take/pick/return/review/approve;
- reproduce the mismatch from main and linked worktree without mutation;
- capture exact command, cwd, resolved state root, repo root, branch, and item
  visibility.

### Pass 2 — think as a team

Run one bounded group-thinking round through the existing coordination door.
Use RFC-review-lite for a proposed root-cause/fix review, or Nominal-Group-Lite
for independent hypotheses; the coordinating agent must name the selected
registered protocol explicitly and preserve the replay id. Assign different
actors to inspect CLI path resolution, state storage, worktree guards,
distribution/install behavior, and operational recovery. Use per-actor
executor/model/tier overrides where configured so the review is genuinely
cross-provider and replayable.

### Pass 3 — decide scope

Produce a decision table:

| Finding | Class | Do now? | Reason/evidence | Owning task |
|---|---|---:|---|---|
| state root split | root cause or symptom | yes/no | reproducible evidence | existing/new |
| linked-worktree approve refusal | invariant or defect | yes/no | guard contract | existing/new |
| distribution path drift | dependency or unrelated | yes/no | install/doctor evidence | existing/new |
| event loss/CAS/truncation | adjacent integrity risk | yes/no | incident evidence | existing/new |

Do not expand into a general distribution or isolation rewrite without a
proven causal link to the state-root incident.

### Pass 4 — implement the smallest justified fix

If a fix is justified:

- preserve ADR0020's rule that linked worktrees do not carry independent
  authoritative `.fgos` state;
- make state-root and repo-root resolution explicit and testable;
- keep approve's main-checkout safety guard intact;
- add regression tests for main checkout, linked worktree, explicit `--dir`,
  and cross-process/session invocation;
- add setup/doctor registration if a new config/default/dependency is added;
- update `CHANGELOG.md` for user-visible behavior.

If no safe bounded fix is justified, produce a recovery/runbook proposal and
park implementation rather than mutating state.

## Acceptance criteria

- one canonical state root is identified for a repository installation;
- a work item created/claimed from a linked worktree is visible to the
  correct main-checkout approve path without manual event copying;
- approve still refuses to land from any linked worktree;
- recovery from the current `tsk-46f` shape is documented and reversible;
- tests prove no duplicate or silently divergent event log is selected;
- all related open tasks are mapped to root cause/dependency/cleanup and a
  recommendation (`do now`, `defer`, `merge`, or `retire`) is recorded;
- final result is replayable through the existing coordination/master prompt
  surface, with evidence linked to commands and commits.

## Explicit non-goals

- no new Work lifecycle primitive for capability;
- no provider/model/tier policy redesign;
- no new group-thinking protocol;
- no broad distribution cleanup without causal proof;
- no raw `git reset`, stash, checkout, event-log rewrite, or destructive
  state copying.

## Required handback

Return:

1. inventory table with current statuses and deduplicated task ids;
2. reproduced path-resolution trace;
3. selected group-thinking protocol and replay/coordination id, if used;
4. root-cause decision and do-now/defer boundary;
5. commit(s), tests, recovery instructions, and remaining risks;
6. an explicit `[DONE]` or `[BLOCKED]` conclusion.
