// domains/coding/harness/enrich-and-validate-contract.mjs — the coding
// domain's ONE pure harness seam (ADR-007 §1).
//
// `enrichAndValidateContract(contract, { domain, work })` is a pure
// function: no fs, no store writes, no network, no executor/provider/tier
// selection, no dispatch, no Work-lifecycle write. `compileDispatchPlan`
// stays the sole execution chooser (ADR-007 §1 hard boundary) -- this
// module never sets an executor id.
//
// Called by the foundation (`buildInlineAssignment`,
// src/runner/dispatch/assignment.mjs) only when a Work item with a
// declared Stage is attached to an inline Assignment build. Against that
// Work's Stage, it:
//   - requires `contract.supports` to name an operation id legal in
//     `operationsForStage(domain, work.stage)` -- rejects (fail-closed)
//     otherwise. This is the ADR-007 §3 guarantee, mechanically enforced
//     here: a declared Stage Operation must use the declared path; inline
//     may not replace or extend it.
//   - appends CONTEXT.md/plan.md context references under `work.docsRef`,
//     mirroring `buildDeclaredAssignment`'s own `work.docsRef` branch
//     (src/runner/dispatch/assignment.mjs) -- same relative-path
//     construction (`work.docsRef`, `<docsRef>/plan.md`,
//     `<docsRef>/CONTEXT.md`), deliberately NOT calling
//     `src/runner/paths.mjs`'s `resolveContentRoot` (which shells out to
//     git and reads the filesystem to find the item's real content root)
//     -- that would break this function's purity.
//   - appends a repository read-only scope constraint: this is a
//     read-only-only slice, ADR-006 §6 still applies to inline.
//   - when the (already-validated) contract's `evidence.required` is
//     `'reported'`, appends a concrete `agent-report.md` expected-output
//     instruction, mirroring `buildDeclaredAssignment`'s own
//     `derivedExpectedOutputs` for `validate-plan`/`review-item` -- a
//     worker gets the same kind of concrete instruction, not a bare
//     policy statement.
//   - derives `policy` (role/tier hints) from the matched operation's own
//     declared `policy`, via `mergeHarnessPolicy` below -- the same merge
//     shape `buildDeclaredAssignment`'s `mergedPolicy` already uses.
//     `policy` is returned as a SEPARATE top-level field, not folded into
//     the returned `contract` -- `policy` is not, and per ADR-006 §4 never
//     will be, one of `execution-contract.mjs`'s `ACCEPTED_CONTRACT_FIELDS`
//     (that field set is the wire contract an agent proposes; `policy` is
//     host-side guidance the harness adds afterward, same layering as
//     `buildDeclaredAssignment`'s own `mergedPolicy`).

import path from 'node:path';
import { RunnerConfigError } from '../../../src/runner/dispatch/config.mjs';
import { operationsForStage } from '../../../src/state/workflow-stage-graphs.mjs';

function fail(reason) {
  throw new RunnerConfigError(`enrich-and-validate-contract: ${reason}`);
}

const REPOSITORY_READ_ONLY_SCOPE_CONSTRAINT = 'scope: repository (read-only)';
const AGENT_REPORT_EXPECTED_OUTPUT = 'agent-report.md (reviewer findings and evaluation)';

/**
 * Merge an operation's declared policy hints with an optional caller
 * override -- the same merge shape `buildDeclaredAssignment`'s own
 * `mergedPolicy` uses (`src/runner/dispatch/assignment.mjs`):
 * `{...opPolicy, ...callerPolicy}`, with an `_fromYaml` marker stamped
 * when the tier (`policy.model`) came from the operation's own YAML
 * declaration and the caller did not itself override it.
 *
 * Exported separately (rather than inlined) so this merge/marker behavior
 * is directly unit-testable without depending on a real workflow YAML
 * operation declaring `policy.model` (none does today -- the same
 * situation `test/runner/assignment-policy.test.mjs` already documents
 * for the declared-path equivalent).
 *
 * @param {object} [opPolicy] The matched operation's own declared `policy`
 * @param {object} [callerPolicy] An optional caller-supplied override
 * @returns {Readonly<object>|undefined} `undefined` when neither side has anything to contribute
 */
export function mergeHarnessPolicy(opPolicy, callerPolicy) {
  if (!opPolicy && !callerPolicy) return undefined;
  const combined = { ...(opPolicy || {}), ...(callerPolicy || {}) };
  if (opPolicy?.model && !callerPolicy?.model) {
    combined._fromYaml = true;
  }
  if (Array.isArray(combined.fallbackExecutors)) {
    combined.fallbackExecutors = Object.freeze([...combined.fallbackExecutors]);
  }
  return Object.freeze(combined);
}

/**
 * Enrich and validate an agent-proposed inline execution contract against
 * a Work item's declared Stage (ADR-007 §1/§3). Pure: returns a new,
 * frozen `{ contract, policy? }` or throws `RunnerConfigError`. Never
 * mutates `contract` or `work`.
 *
 * @param {object} contract An execution contract already validated by
 *   `execution-contract.mjs`'s `validateExecutionContract` (this function
 *   runs strictly after that generic validator, per ADR-007 §1's ordering).
 * @param {object} params
 * @param {string} params.domain Domain name (e.g. `'coding'`)
 * @param {object} params.work The Work item this inline Assignment is
 *   attached to -- required; there is no declared Stage to validate
 *   `contract.supports` against without one.
 * @returns {Readonly<{contract: Readonly<object>, policy?: Readonly<object>}>}
 */
export function enrichAndValidateContract(contract, { domain, work } = {}) {
  if (!contract || typeof contract !== 'object') {
    fail('contract must be a non-null object');
  }
  if (!work || typeof work !== 'object') {
    fail('work is required -- there is no declared Stage to validate contract.supports against without one');
  }
  if (!work.stage || typeof work.stage !== 'string') {
    fail(`work "${work.id ?? '(unknown)'}" has no declared stage -- cannot validate contract.supports`);
  }

  const resolvedWorkflow = work.workflow ?? 'feature';
  const stageOps = operationsForStage(domain, work.stage, { kind: resolvedWorkflow });
  const matchedOp = stageOps.find((o) => o.id === contract.supports);

  if (!matchedOp) {
    fail(
      `contract.supports ${JSON.stringify(contract.supports)} is not a legal operation for stage "${work.stage}" in domain "${domain}" (declared operations: [${stageOps.map((o) => o.id).join(', ')}]) -- ADR-007 §3: inline may not replace or extend the declared Stage path`,
    );
  }

  // ADR-007 §1: "adds contextRefs (CONTEXT.md, plan.md)" -- mirrors
  // buildDeclaredAssignment's own work.docsRef branch's relative-path
  // construction exactly, appended (not replacing) whatever the agent
  // already proposed, de-duplicated by exact string match.
  const contextRefs = Array.isArray(contract.contextRefs) ? [...contract.contextRefs] : [];
  if (work.docsRef) {
    for (const ref of [work.docsRef, path.join(work.docsRef, 'plan.md'), path.join(work.docsRef, 'CONTEXT.md')]) {
      if (!contextRefs.includes(ref)) contextRefs.push(ref);
    }
  }

  // ADR-007 §1: "adds an allowed-scope constraint (repository read
  // scope)" -- ADR-006 §6 still applies to inline; this slice is
  // read-only-only.
  const constraints = Array.isArray(contract.constraints) ? [...contract.constraints] : [];
  if (!constraints.includes(REPOSITORY_READ_ONLY_SCOPE_CONSTRAINT)) {
    constraints.push(REPOSITORY_READ_ONLY_SCOPE_CONSTRAINT);
  }

  // ADR-007 §1: "sets the coding read-only evidence rule: reported
  // evidence requires an agent-report.md artifact" -- mirrors
  // buildDeclaredAssignment's derivedExpectedOutputs concrete-instruction
  // shape for validate-plan/review-item.
  const expectedOutputs = Array.isArray(contract.expectedOutputs) ? [...contract.expectedOutputs] : [];
  if (contract.evidence?.required === 'reported' && !expectedOutputs.includes(AGENT_REPORT_EXPECTED_OUTPUT)) {
    expectedOutputs.push(AGENT_REPORT_EXPECTED_OUTPUT);
  }

  // ADR-007 §1: "writes role→tier hints into policy" -- the inline wire
  // contract carries no `policy` field of its own to merge as an override
  // (execution-contract.mjs's ACCEPTED_CONTRACT_FIELDS deliberately never
  // includes one, ADR-006 §4/Watch-Fors) -- so this is `matchedOp.policy`
  // alone, through the same merge/marker shape as the declared path.
  const policy = mergeHarnessPolicy(matchedOp.policy, undefined);

  return Object.freeze({
    contract: Object.freeze({
      ...contract,
      contextRefs: Object.freeze(contextRefs),
      constraints: Object.freeze(constraints),
      expectedOutputs: Object.freeze(expectedOutputs),
    }),
    ...(policy ? { policy } : {}),
  });
}
