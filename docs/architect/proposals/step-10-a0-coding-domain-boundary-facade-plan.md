# Step 10 A0 - Coding Domain Boundary And Facade Plan

Document type: Detailed architecture and execution plan
Design status: Draft
Implementation: Not started
Last reviewed: 2026-09-05
Canonical for: detailed A0 architecture and execution plan under Step 10 until
accepted or superseded

Related:
- [Step 10 Coding Domain Adoption](step-10-coding-domain-adoption.md)
- [Architect Roadmap](../roadmap.md)
- [Workspace Topology Architecture](../workspace-topology.md)
- [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)
- [System Vision: Trong Mem Ngoai Cung](../system-vision-trong-mem-ngoai-cung.md)

## 1. Purpose

A0 separates Coding Domain harness authority before Step 10 builds on it.

The work is node-only and behavior-preserving. It creates clear boundaries and
facades around existing harnesses so Step 10B can connect `validate-plan` to a
Work-attached CoordinationSession without calling raw coding internals, raw
`.fgos` paths, or topology-sensitive legacy behavior directly.

## 2. Non-Negotiables

- Do not break current behavior.
- Do not open mutating Work-attached CoordinationSession.
- Do not migrate to Rust.
- Do not make broad physical source moves.
- Do not change public CLI semantics.
- Do not let Work Driver Core import coding worktree, merge, verify, or prompt
  internals directly.
- Do not let Agent Coordination import coding repo mutation modules.
- Do not introduce new raw `.fgos` path assumptions.
- Do not let Packaging/Distribution decide coding workflow semantics.

## 3. Behavior-Preserving Migration Rule

A0 is a compatibility-preserving facade insertion:

```txt
new facade first
delegate to old implementation
redirect only the minimum Step 10B-needed path
prove equivalence
leave unwrapped legacy paths running
record blockers instead of breaking behavior
```

After A0, the system must still operate as before. New code should call the new
facades, but old paths may remain until later slices replace their internals
with proof.

## 4. Harness Inventory Taxonomy

A0 must inventory these nine harness families:

| Family | Scan Depth Before Step 10B | Why |
|---|---|---|
| contract enrich/validate | Deep | Step 10B needs declared `validate-plan` contracts. |
| worktree/branch | Topology-risk scan | Not used by read-only Step 10B, but blocks mutating Step 10. |
| merge/catch-up/approval | Topology-risk scan | Must not leak into Agent Coordination or Work Driver Core. |
| claim/occupancy/lease/slot | Deep | Foundation/topology boundary needed before later mutation. |
| goal-check/verify/diff evidence | Deep | Step 10B and later review/implement flows need evidence boundaries. |
| prompt/skill/prose material | Shallow ownership scan | Important for the soft inner operating layer; full projection waits. |
| config/doctor/projection | Topology-risk scan | Branch-local config and projection ownership must not drift. |
| local `fgos` / `fgos-runner` command entry | Deep if touched | New command entry must run under active runtime/shim assumptions. |
| workflow declarations / operation catalog | Deep | Work Driver Core depends on domain-owned declarations. |

Inventory rows must record:

- current files;
- current callers;
- current behavior owner;
- target authority owner;
- whether the target surface is a generic port or Coding Domain Adapter;
- whether it touches Workspace Topology;
- raw root/path assumptions;
- whether it must be wrapped before Step 10B;
- proof needed before Step 10B.

## 5. Owner Classification

Use single authority, multiple consumers.

| Harness Family | Target Owner | Coding Role |
|---|---|---|
| contract enrich/validate | Work Driver Core + Assignment Builder | Coding Domain Adapter supplies constraints. |
| worktree/branch | Workspace & Occupancy Substrate + Coding Domain Adapter | Substrate grants workspace/identity/lease; Coding declares repo policy. |
| merge/catch-up/approval | Coding Domain Adapter + Work Core | Coding owns technical merge policy; Work Core writes lifecycle truth. |
| claim/occupancy/lease/slot | Work Core + Workspace & Occupancy Substrate | Coding declares needs; substrate grants or refuses. |
| goal-check/verify/diff evidence | Coding Domain Adapter + Run Result Evaluator | Coding collects/interprets repo evidence; evaluator owns generic confidence. |
| prompt/skill/prose material | Coding Domain Adapter + Packaging/Projection | Coding owns behavior material; packaging projects it under runtime identity. |
| config/doctor/projection | Platform Support + Workspace Topology + Packaging/Projection | Coding registers defaults/checks/material; it does not write arbitrary paths. |
| local command entry | Host Invocation + Packaging/Distribution | Coding does not resolve binaries or active runtime identity. |
| workflow declarations / operation catalog | Coding Domain + Work Driver Core | Coding owns declarations; Work Driver Core interprets them. |

## 6. Work Driver And Adapter Boundary

Work Driver Core is reusable platform core. It interprets domain-declared
workflows and operations. It must be able to drive future non-coding domains
such as marketing by loading their declarations and adapters.

Naming:

```txt
Domain Adapter Port
  generic platform-facing port owned by Work Driver Core

Coding Domain Adapter
  Coding Domain's implementation of that port
```

Keep in Work Driver Core only logic that knows:

- Work item;
- domain id;
- stage/status;
- operation declaration;
- dispatch kind;
- result envelope;
- generic retry/block/human-gate policy.

Move behind Coding Domain Adapter facades any logic that knows:

- coding stage names;
- `plan.md`;
- git diff/status;
- worktree branch naming such as `fgw/<id>`;
- verify commands;
- merge/catch-up;
- file footprint/globs;
- AGENTS/skills/prompt material;
- language/framework/code semantics.

## 7. Topology-Touching Rule

A0 must not treat Workspace Topology or Packaging/Distribution as later
cleanup. It must resolve topology concerns immediately for:

- contract enrich/validate;
- claim/occupancy/lease/slot;
- workflow operation catalog;
- local command entry when touched.

A0 must at least inventory and flag blockers for:

- worktree/branch;
- merge/catch-up/approval;
- config/doctor/projection;
- goal-check/verify/diff evidence.

Prompt/skill/prose material is ownership-level in A0; full projection and
runtime materialization wait for packaging/projection slices.

For Step 10B, the minimum topology posture is:

```txt
effect = read-only
workspace = current-readonly
occupancy = none or read-lease
mutates = []
```

If an A0 change touches worker creation, claim, event, projection, local command
entry, or domain asset placement, it must consume `TopologyContext` and align
with runtime identity/activation instead of introducing another raw `.fgos`
path.

## 8. Minimal Facades Before Step 10B

Step 10B requires only the minimum facades needed by `validate-plan`.

Generic Domain Adapter Port:

```txt
describeOperation(work, operationId, context)
enrichOperationContract(baseContract, domainContext)
```

Coding Domain Adapter facades:

```txt
describeCodingOperation(...)
enrichCodingOperationContract(...)
planCodingWorkspaceNeeds(...)
collectCodingEvidence(...)
interpretCodingEvidence(...)
resolveCodingPromptMaterial(...)
```

Workspace & Occupancy substrate calls:

```txt
resolveTopology(...)
planWorkspaceUse(...)
requestOccupancy(...)
releaseOccupancy(...)
```

`requestOccupancy` and `releaseOccupancy` may be documented as next-step
contracts or implemented as read-only/no-op placeholders if Step 10B naturally
needs audit visibility. A0 must not implement mutating footprint claims.

## 9. Detailed Work Breakdown

### A0.0 Baseline

Record current behavior before changing call paths:

- relevant test pass/fail state;
- current `validate-plan` path;
- current interactive and headless runner path;
- current raw `.fgos`/root/path assumptions in the nine harness families.

Existing failures are baseline facts, not regressions.

### A0.1 Inventory

Create the harness inventory table using the taxonomy in this plan.

### A0.2 Owner Map

Classify each harness family by target owner and note any mixed-owner files or
call paths.

### A0.3 Generic Ports

Define the minimal Domain Adapter Port shape Work Driver Core may call for
`validate-plan`.

### A0.4 Coding Domain Adapter Facades

Create the minimal Node facade layer for Coding Domain Adapter behavior. The
facades may delegate to existing implementation.

### A0.5 Topology Posture

Make `validate-plan` declare read-only workspace needs without creating a
worker worktree, mutation lease, merge authority, or projection write.

### A0.6 Narrow Call-Path Redirect

Redirect only the Step 10B-needed contract/evidence/prompt path through the new
facades. Do not redirect implement, merge, return, approve, fan-out, or
worktree creation in A0.

### A0.7 Forbidden Dependency Tests

Add static tests or equivalent checks for forbidden imports.

### A0.8 Facade Contract Tests

Prove that the new facades expose the same needed `validate-plan` contract
shape as the legacy path, with read-only workspace posture and evidence
expectations.

### A0.9 Readiness Report

Record:

- what was wrapped;
- what remained legacy;
- topology blockers before mutation;
- whether Step 10B may start.

## 10. Implementation Execution Plan

This section turns A0 into concrete implementation work. It is still
behavior-preserving: every code task below either records the current state,
adds a facade that delegates to the current implementation, or adds proof that
the new boundary does not change existing behavior.

### A0.0 Baseline Capture

Goal: know exactly what "unchanged behavior" means before any facade redirect.

Deliverables:

- `docs/architect/proposals/step-10-a0-baseline-and-inventory.md` with:
  - current test command results;
  - current `validate-plan` call path;
  - current interactive skill loop path;
  - current headless runner loop path;
  - current raw `.fgos`/workspace/root assumptions;
  - known pre-existing failures, if any.

Files to inspect first:

- `docs/specs/reading-map.md`;
- `docs/specs/runner.md`;
- `docs/specs/work.md`, if present;
- `docs/specs/distribution.md`;
- `docs/architect/workspace-topology.md`;
- `docs/architect/packaging-distribution/runtime-identity-and-activation.md`;
- `domains/coding/AGENTS.md`;
- `.agents/skills/fgos-coding-validating/SKILL.md`;
- `.agents/skills/fgos-coding-driving/SKILL.md`;
- `.agents/skills/fgos-routing/SKILL.md`;
- `.agents/skills/fgos-coding-implement/SKILL.md`;
- `src/runner/**`;
- `bin/fgos.mjs`;
- `bin/fgos-runner.mjs`;
- relevant tests under `test/**`.

Commands:

```sh
npm test
rg -n "validate-plan|validating|plan.md|goal-check|verify|worktree|claim|occupancy|\\.fgos|fgos-runner|dispatch|operationsForStage" src bin test docs domains .agents/skills
```

Acceptance:

- baseline records enough file/call-path evidence that A0 can later prove no
  behavior regression;
- broad `rg` output is reduced into curated rows, not pasted raw;
- pre-existing dirty worktree state is noted but not modified.

### A0.1 Harness Inventory Artifact

Goal: produce the nine-family inventory that future code changes must obey.

Deliverables:

- same baseline/inventory doc gets a `Harness Inventory` table with one row per
  family:
  - contract enrich/validate;
  - worktree/branch;
  - merge/catch-up/approval;
  - claim/occupancy/lease/slot;
  - goal-check/verify/diff evidence;
  - prompt/skill/prose material;
  - config/doctor/projection;
  - local `fgos` / `fgos-runner` command entry;
  - workflow declarations / operation catalog.

Each row must include:

- current files;
- current callers;
- current behavior owner;
- target authority owner;
- generic port or Coding Domain Adapter surface;
- topology touchpoints;
- raw root/path assumptions;
- Step 10B wrap requirement;
- proof required.

Acceptance:

- every family has at least one concrete file/caller finding or an explicit
  "not found yet" note;
- topology risks are not collapsed into generic "later cleanup";
- `contract enrich/validate`, `claim/occupancy`, and `workflow declarations`
  are classified as Work/Driver/Foundation-facing, not merely coding-local.

### A0.2 Owner Map And Boundary Decisions

Goal: make ownership executable before adding modules.

Deliverables:

- `Owner Map` section in the baseline/inventory doc;
- list of mixed-owner files or call paths that must remain legacy until a
  later slice;
- list of forbidden dependency rules to encode in tests.

Decision rules:

- Work Core owns Work lifecycle truth.
- Work Driver Core owns generic workflow interpretation.
- Coding Domain owns coding declarations and Coding Domain Adapter
  implementations.
- Agent Coordination owns session/assignment/run/evidence ledger behavior, not
  coding repo mutation.
- Dispatch/Run owns executor selection and Run/RunResult recording.
- Workspace/Occupancy substrate owns topology and leases.
- Packaging/Projection owns runtime material projection, not coding workflow
  semantics.

Acceptance:

- no file is described as having two ultimate owners for the same contract;
- when legacy code is mixed, the target owner is still named;
- Step 10B dependencies are clearly separated from mutating Step 10 blockers.

### A0.3 Generic Domain Adapter Port Skeleton

Goal: define the smallest platform-facing port Work Driver Core needs for
read-only `validate-plan`.

Likely implementation shape:

```txt
src/runner/domain-adapters/
  port.mjs
  registry.mjs
```

Initial exported behavior:

```txt
describeOperation({ work, operationId, context })
enrichOperationContract({ baseContract, work, operationId, domainContext })
```

Rules:

- port types must be domain-neutral;
- no coding stage names in generic validation beyond opaque operation ids;
- no git, worktree, merge, `plan.md`, prompt, or skill paths in generic port;
- registry may hardcode the coding adapter for this transitional slice if it
  remains explicitly marked temporary.

Acceptance:

- Work Driver-facing code can call the generic port without importing coding
  internals;
- current behavior is unchanged until A0.6 redirects the narrow path.

### A0.4 Coding Domain Adapter Facade

Goal: create the coding-owned adapter layer while preserving legacy behavior.

Likely implementation shape:

```txt
src/domains/coding/
  adapter.mjs
  operations.mjs
  evidence.mjs
  workspace-needs.mjs
  prompt-material.mjs
```

Initial facade responsibilities:

```txt
describeCodingOperation(...)
enrichCodingOperationContract(...)
planCodingWorkspaceNeeds(...)
collectCodingEvidence(...)
interpretCodingEvidence(...)
resolveCodingPromptMaterial(...)
```

Migration rule:

- delegate to existing implementation whenever possible;
- do not move large legacy modules;
- do not change CLI output;
- do not change stage transitions;
- do not create worker worktrees;
- do not create or release mutation leases.

Acceptance:

- coding-specific facts live behind `src/domains/coding/**` or another clearly
  coding-owned path;
- legacy implementation still works through old callers;
- new adapter path can serve `validate-plan` metadata.

### A0.5 Read-Only Topology Posture

Goal: make `validate-plan` explicitly declare its workspace needs without
performing workspace mutation.

Contract shape:

```txt
operationId = validate-plan
effect = read-only
workspace = current-readonly
occupancy = none or read-lease
mutates = []
projections = none
workerWorkspace = not-created
```

Implementation rule:

- if a topology resolver already exists, consume its typed context;
- if not, create only a minimal read-only posture object or document a blocker;
- do not add new raw `.fgos` path calculations;
- do not decide final physical placement for config, events, claims, or
  projection roots inside Coding Domain.

Acceptance:

- `validate-plan` contract declares read-only posture;
- posture is visible to Step 10B's CoordinationSession bridge;
- no host-visible projection write is introduced.

### A0.6 Narrow Validate-Plan Call-Path Redirect

Goal: route only the Step 10B-needed path through the new port/facade.

Allowed redirect:

```txt
Work Driver / planning validation contract builder
  -> generic Domain Adapter Port
  -> Coding Domain Adapter
  -> legacy validate-plan behavior
```

Forbidden in A0:

- redirecting implement;
- redirecting merge/catch-up/approval;
- redirecting `fgos return`;
- redirecting fan-out;
- changing worktree creation;
- changing claim acquisition;
- changing Work lifecycle writes.

Acceptance:

- one read-only validation path uses the new boundary;
- all mutating paths remain legacy;
- equivalence test proves the needed contract shape did not regress.

### A0.7 Forbidden Dependency Tests

Goal: prevent the boundary from decaying immediately.

Likely implementation shape:

```txt
test/architecture/
  step10-a0-boundary.test.mjs
```

Rules to encode:

- Work Driver Core does not import coding worktree/merge/verify modules
  directly;
- Agent Coordination does not import coding repo mutation modules;
- Coding Domain Adapter does not import Work state writers directly;
- Packaging/Distribution does not import coding workflow semantics;
- new A0 code does not introduce raw `.fgos/runtime/claims` placement.

Acceptance:

- test fails on a direct forbidden import;
- test is narrow enough not to require immediate large source moves;
- known legacy exceptions, if any, are named and scoped.

### A0.8 Facade Contract Tests

Goal: prove Step 10B can consume `validate-plan` through the new facade.

Likely implementation shape:

```txt
test/runner/
  domain-adapter-validate-plan.test.mjs
```

Required assertions:

- generic port can describe `validate-plan`;
- Coding Domain Adapter enriches the operation;
- effect is `read-only`;
- workspace posture is `current-readonly`;
- mutation list is empty;
- evidence expectation is present;
- prompt/skill material resolves without projection write;
- evidence interpretation fixture returns a generic result envelope.

Acceptance:

- tests pass without creating a worker worktree;
- tests pass without writing Work state;
- tests pass without requiring a live CoordinationSession.

### A0.9 Readiness Report And Gate

Goal: decide whether Step 10B can start.

Deliverables:

- `Step 10B Readiness` section in the baseline/inventory doc;
- updated `step-10-coding-domain-adoption.md` progress table if A0 reaches
  implementation-ready;
- updated `roadmap.md` if A0 evidence changes sequence or blockers.

Gate questions:

- Can Work Driver build a `validate-plan` contract through the generic port?
- Can Coding Domain Adapter enrich it without leaking repo mutation authority?
- Is the topology posture explicitly read-only?
- Are topology/packaging blockers for mutation named?
- Are legacy paths still operational?
- Are forbidden dependency tests active?

Exit:

```txt
Step 10B may start only if all gate questions answer yes.
Otherwise A0 records named blockers and remains incomplete.
```

## 11. Concrete Task List

Use these task ids when implementing A0.

| Task | Type | Output | Blocks |
|---|---|---|---|
| A0-T01 | Docs/evidence | Baseline + inventory doc shell | all later A0 tasks |
| A0-T02 | Discovery | Curated call-path map for `validate-plan` | A0-T03, A0-T06 |
| A0-T03 | Discovery | Nine-family harness inventory | A0-T04, A0-T07 |
| A0-T04 | Architecture | Owner map + legacy exception list | A0-T05, A0-T07 |
| A0-T05 | Code | Generic Domain Adapter Port skeleton | A0-T06, A0-T08 |
| A0-T06 | Code | Coding Domain Adapter facade delegating legacy behavior | A0-T08 |
| A0-T07 | Code/test | Forbidden dependency checks | A0-T09 |
| A0-T08 | Code/test | `validate-plan` facade contract tests | A0-T09 |
| A0-T09 | Integration | Narrow read-only call-path redirect | A0-T10 |
| A0-T10 | Proof/docs | Readiness report + roadmap/proposal update | Step 10B |

Recommended execution order:

```txt
A0-T01 -> A0-T02 -> A0-T03 -> A0-T04
       -> A0-T05 -> A0-T06
       -> A0-T07 + A0-T08
       -> A0-T09 -> A0-T10
```

Parallelizable inside A0:

| Lane | Can run after | Notes |
|---|---|---|
| Inventory expansion for non-validate harnesses | A0-T01 | Can proceed while port skeleton is designed. |
| Forbidden dependency test design | A0-T04 | Can be written before facade implementation if legacy exceptions are scoped. |
| Facade contract fixture design | A0-T02 | Can proceed before redirect. |
| Topology blocker review | A0-T03 | Can proceed in parallel with Coding Domain Adapter facade. |

Do not start A0-T09 until A0-T05, A0-T06, and A0-T08 exist. The redirect is
the first point where runtime behavior can change, so it must be late and
narrow.

## 12. Required Proof

A0 proof has four groups.

Boundary/import tests:

- Work Driver Core does not import coding worktree/merge/verify modules
  directly;
- Agent Coordination does not import coding repo mutation modules;
- Coding Domain Adapter does not import Work state writers directly;
- Packaging/Distribution does not import coding workflow semantics.

Facade contract tests:

- generic Domain Adapter Port can describe/enrich `validate-plan`;
- Coding Domain Adapter returns operation metadata for `validate-plan`;
- `validate-plan` contract includes `effect=read-only`;
- `validate-plan` contract includes evidence expectation;
- `validate-plan` contract includes workspace needs.

Topology safety tests:

- topology-touching facade accepts `TopologyContext` or workspace posture;
- no new raw `.fgos/runtime/claims` path appears in A0 code;
- local command entry is not newly resolved from ambient `PATH`;
- read-only `validate-plan` does not create worker worktree or mutation lease.

Step 10B readiness fixture:

- Work Driver can build a `validate-plan` operation contract through a generic
  port;
- Coding Domain Adapter enriches it;
- workspace needs resolve to `current-readonly`;
- prompt/skill material resolves without projection write;
- evidence adapter can interpret a reviewer result fixture.

## 13. Out Of Scope

- actual CoordinationSession `validate-plan` run;
- mutating Assignment;
- worktree branch creation;
- merge/catch-up;
- footprint conflict;
- crash/resume;
- Rust migration;
- broad physical source movement.

## 14. Exit Criteria

A0 is complete when:

- the nine-family inventory exists;
- every family has a target owner;
- the minimal generic ports and Coding Domain Adapter facades needed by Step
  10B are named and implemented or explicitly marked as blockers;
- topology-touching behavior introduced or changed by A0 goes through
  `TopologyContext` or is named as blocked;
- forbidden dependency checks exist;
- facade contract tests exist;
- current behavior is preserved;
- Step 10B can start without rediscovering harness ownership.

## 15. Roadmap Maintenance

Detailed A0 work must preserve the high-level A0-G Step 10 shape. If evidence
from A0 changes the sequence, scope, or exit criteria of Step 10, update both
the Step 10 proposal and the project-level Architect Roadmap in the same
review.
