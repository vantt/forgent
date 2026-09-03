# Phase 07 - Headless Parity, CLI Stabilization, And Adoption

## Objective

Expose the stabilized coordination foundation through one public CLI/API,
attach a headless driver to the same engine, prove semantic capability parity,
publish examples, and close every preserved intention explicitly.

## Requirements

- **R1 Public CLI.** Add `fgos coordination run --file <request>` and
  `fgos coordination show <id> --json` as one registered verb with subcommands.
  `run` is synchronous in V1 and accepts global trusted `--executor`, `--model`,
  `--tier`; per-actor trusted policy belongs in the request/session file, not
  portable protocol. `show` is read-only. Both return `fgos.v1` envelopes,
  documented exit codes, ids, status, and canonical refs.
- **R2 Request/schema boundary.** Separate portable protocol reference and
  semantic objective/context/constraints from trusted operator policy. Reject
  unknown fields, portable concrete infra, unregistered actor overrides,
  actor-role rewrites, undeclared actor multiplicity, mutation, Work lifecycle
  authority, path escape, and CLI/file conflicts. A trusted request may bind a
  declared SessionActor to Persona/executor/model/tier policy or populate an
  allowed repeated-role slot; it cannot redefine Role responsibility or a
  protocol operation. Governance remains final.
- **R3 Registry/setup/doctor/package/docs.** Register command metadata,
  state/external-effect flags, setup/config merge (only for real defaults),
  doctor checks, architecture manifest, package contents, `--help --json`, IO
  contract, reading map, runner spec, CHANGELOG, and end-user docs. Publish one
  agent-led request, declared consult, research protocol, and Group Cognition
  framework example.
- **R4 Headless adapter.** Add a headless driver/runner entry that submits the
  same validated request to the same `runCoordinationSession` engine and store;
  it may differ only in operator attachment/visibility and invocation lifecycle.
  It cannot fork schemas, planning, protocol, dispatch, evidence, recovery,
  quorum, or budget logic. Do not use herdr in this phase.
- **R5 Capability parity proof.** Execute a deterministic read-only consult
  fixture through interactive and headless doors. Normalize only approved
  volatile/visibility fields and prove equivalent manifest semantics,
  Assignments, policy provenance, Runs/RunResults, evidence, recovery result,
  budgets, errors, and final status. Run matching negative cases through both.
- **R6 External adoption rerun.** From an actual non-fgOS consuming project,
  invoke installed/packed fgOS through the public CLI for agent-led and declared
  coordination. Prove no source-repo cwd/import assumption, project-over-global
  config precedence, local gitignored state, and reproducible evidence export.
- **R7 Canonical closure.** Update implementation metadata/pointers in accepted
  ADRs/contracts/architecture/spec; proposal points to delivered artifacts and
  retains unresolved/deferred rationale. Generate required decision/doc indexes,
  check links/anchors, run install-packaging and full suite.
- **R8 Final Deferral Audit.** Audit AC-I001..009 with proof links and explicit
  status. Keep Mission, more frameworks, organization overlays, AgentMessage,
  AdhocTask, provider scoring/router, telemetry, herdr, and Work-attached
  mutation visible as deferred-preserved with revisit triggers. Decide nothing
  by omission; only a human may reject/supersede an intention.

## Files

Create a coordination use-case under `src/verbs/coordination/` following current
use-case conventions; add the minimal adapter in `bin/fgos.mjs` and command
registry entry. Add headless adapter beside coordination engine or existing
runner integration without copying engine logic. Modify setup/doctor/package/
docs/tests/examples and canonical implementation metadata as required.

Do not add daemon, watch mode unless the accepted headless adapter contract
requires it, herdr/UI, Mission, Work mutation, telemetry backend, organization
SDK, marketplace, or new provider router.

## Tests First

- CLI manifest/help/envelope/exit-code and run/show positive/negative tests.
- Request-vs-protocol-vs-trusted-policy boundary tests.
- `show` has no mutation/external effect; missing/corrupt session diagnostics.
- Shared-engine identity/static import test and semantic parity golden.
- Installed package e2e from a disposable external project with global/project
  config precedence and no source checkout imports.
- End-user docs index and canonical link/metadata checks.

Focused commands:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  test/cli/fgos-manifest.test.mjs \
  'test/cli/*coordination*.test.mjs' \
  'test/runner/coordination-*.test.mjs' \
  test/install-packaging.test.mjs \
  'test/setup/*.test.mjs'
npm test
```

## Proofs And Exit

Record exact public commands, installed package version, external project root
class (not secrets), semantic parity diff, and evidence refs. `coordination show`
must let a stranger understand status without chat history. Final Reviewer and
Red-Team approve or leave an explicit stop gate.

## Risks / Rollback

Public CLI and package surface have the highest compatibility cost. Keep one
verb/use-case and one shared engine. Revert adapters/docs independently; local
session state remains inspectable through the prior internal API during rollback.
