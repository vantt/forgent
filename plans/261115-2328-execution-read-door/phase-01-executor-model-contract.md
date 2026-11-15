# Phase 01: the executor-model contract (Execution owns it)

Start after: S4 on main, plan approved. Wave 1, parallel with 02 and 03. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F1, F2, F3. Worktree `erd-p01`, report slug `erd-p01-executor-model-contract`. Effort: 1.5d.

## Context

No contract names the executor entry, the facts derived from it, the bind answer (`BIND_CONTRACT_VERSION`
`v1alpha1`) or the decide answer (F3). The program's S5 entry condition is "executor-model contract written
(Execution owns it)". Every Rust phase after this one is proven against this contract's vectors, and every Node twin
that stays until S6a reads the same vectors (D7).

## Requirements

1. `docs/platform/runner/contracts/executor-model.md` (new, Execution area; English, BA-grade, tech-agnostic):
   - the executor entry (`kind` agent/tool, `command`, `adapter`, `agentType`, `providerModel`, `supports.{skills,
     reasoningEffort}`, `invocations[] {id, via, adapter, command, credentialStore}`, `permissionMode`, `confinement`,
     `args`, `for`), pointing at `core/config-schema/runner.schema.yaml` for field syntax (link, do not copy);
   - the derived facts, each with one definition: family, mechanism (`in-process`/`out-of-process`, the
     `hasLiveTaskAccess` rule), credential-store CLI, rendered effort levels per CLI, default invocation and posture
     carrying, governance refusal, missing CLI, tool `for` entries and probe result (`present`/`missing`/`stale`);
   - the bind request and answer (binding fields and provenance keys from `bind.mjs:492-548`, refusals from
     `bind.mjs:118-129,412-427`), the walk chain, the explain answer (`explain.mjs:58-121`), the decide answer
     (`decide.mjs:215-240`) and the hook verdict (`dispatch/hook.mjs:41-75`);
   - who decides what: Seat Binding ranks (unchanged); Execution derives executor facts and composes the bind;
     Dispatch owns launch and the account-state adapter of Seat Binding's port (`provider-capacity`; it hands its read to bind as an overlay, D4);
   - the version: the binding keeps `contractVersion` `v1alpha1` (its consumers read it from run records); the route
     request gains protocol 2 (phase 09).
2. `packages/execution/contracts/executor-model.v1.json`: `version`, `about`, then `vectors` for each derived fact
   (`{ name, entry, runner?, machine?, expect }`), recorded from today's Node functions (record with a scratch script
   under `.fgos/runtime/tmp/`, never committed). Cover every family `familyOf` names, every `via`/`adapter`, every
   credential store, every CLI with effort levels, `kind: tool`, `agentType` executors, governance by provider and by
   executor, posture with and without a usable backend.
3. `packages/execution/contracts/bind.v1.json`: request and answer shapes plus `vectors` for bind (incl. walk,
   overrides, persona chain, refusals), explain, decide (each selector form incl. `--work` with a given hint and
   `--assignment` with a given record), and hook verdict. Record from Node today.
4. Node twin proof: `test/runner/dispatch/executor-model-vectors.test.mjs` (new) reads `executor-model.v1.json` and runs
   each vector against the Node functions that stay until S6a (`familyOf`, `credentialStoreOf`, `renderedEffortLevels`,
   `decideExecutorDispatchMechanism`, `resolvePostureInvocation`). Title states the behaviour: "Node launch code derives
   the same executor facts as the executor-model contract". Green at once (it documents today); it is the twin proof
   until S6a deletes those functions.
5. `docs/platform/component-boundary.md`: one row, Execution owns the executor model and bind composition
   (`packages/execution`), Seat Binding keeps ranking. `docs/platform/runner/spec.md` "Pointers" (subcomponent
   `h-f34e0d170d89`): one line to the contract. `docs/reading-map.md`: one row for the contract and
   `packages/execution/contracts/`.

## Files

- Create: `docs/platform/runner/contracts/executor-model.md`, `packages/execution/contracts/executor-model.v1.json`,
  `packages/execution/contracts/bind.v1.json`, `test/runner/dispatch/executor-model-vectors.test.mjs`.
- Modify: `docs/platform/component-boundary.md`, `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md`,
  `docs/reading-map.md`, `test/suite-baseline.json` (regenerated), mutation census (regenerated).
- Delete: none. Tests retired: none.
- Net size: about +350 doc lines, +1 500 vector lines (JSON), +60 test lines.

## Steps

1. Read the Node functions named in Requirements 1 end to end; write the doc.
2. Record vectors with a scratch script; review every vector by hand against the code path (a vector is evidence,
   not a snapshot of a bug: a vector that records a bug is marked `"knownDefect": "<why>"`, keeps today's expected output, and is reported for a backlog row; S5 fixes no
   behaviour while porting).
3. Write the Node twin test; run it and the gates.

## Acceptance

- Both JSON files parse; every derived fact named in the doc has at least one vector; the Node twin test passes.
- `doc-health` and decision-citation-drift green; reading-map row resolves.

## Risks / rollback

- Vectors that freeze a defect (M x M): marked and reported; the port keeps the behaviour; 12 proposes the backlog row.
- `docs/reading-map.md` collides with MAIL shards p02 (one different row; rebase). Revert = one commit.
