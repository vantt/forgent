// dispatch/assignment.mjs — Assignment builder, ID creation, prompt rendering,
// read-only classification, and agent-result validation for Team Dispatch V1
// (Step 01 / Step 03 / Step 04), plus the ADR-006 R1/R4 provenance/inline
// build path (Step 07 Phase 02).
//
// Pure data module:
// - createAssignmentId: deterministic asgn_<work>_<op>_<seq> generator; falls
//   back to a caller.writerId-derived token, then 'nowork', when no workId or
//   missionId is present (ADR-006 R4, the inline no-Work-attached case).
// - buildAssignment: dispatches on shape. The DECLARED shape
//   ({ stage, operation, ... }, unchanged) converts one declared stage
//   operation into an Assignment; refuses operations whose taskSpec file
//   does not resolve on disk (Step 04). The INLINE shape
//   ({ provenance: { kind: 'inline', contract, caller } }, ADR-006 R4)
//   validates an agent-proposed execution contract via
//   ./execution-contract.mjs and builds an Assignment straight from it, no
//   domain/workflow/stage/operation/taskSpec involved -- except that,
//   when a domain is resolvable for the call (a Work with a declared
//   Stage attached, carrying or paired with a domain name), it also
//   conditionally consults that domain's own harness seam
//   (ADR-007 §1/§2) between the generic validator and the normalizer.
//   Both shapes stamp
//   `provenance`/`mutation`/`evidence` via ./assignment-normalizer.mjs
//   (ADR-006 R1/R2); the declared shape additionally stamps
//   `resultKind`/`onAdvance`.
// - renderAssignmentPrompt: renders the standard semantic prompt for workers,
//   including concrete result artifact paths when runDir is supplied (Step 04).
// - isReadOnlyAssignment: classifies assignment as read-only or mutating by
//   reading the `mutation` field stamped once, at build time, by
//   ./assignment-normalizer.mjs (ADR-006 R2/R7 -- no role/operation/
//   missionId/workId re-derivation here).
// - validateAgentResultClaim: validates agent-result.json schema; malformed
//   claims must produce failed/failed, not no-evidence (Step 04).
//
// Rules:
// - Assignment != Work (Assignment does not own lifecycle and receives asgn_* ids).
// - Deeply frozen return objects.
// - Never mutates work state, never creates child work.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DEFAULT_DOMAIN,
  resolveDomainName,
  operationsForStage,
  resolveTaskSpecPath,
} from '../../state/workflow-stage-graphs.mjs';
import { RunnerConfigError } from './config.mjs';
import {
  NORMALIZER_VERSION,
  READ_ONLY_ROLES,
  stampDeclaredAssignment,
  stampInlineAssignment,
} from './assignment-normalizer.mjs';
import { CONTRACT_POLICY_VERSION, validateExecutionContract } from './execution-contract.mjs';

// ADR-007 §1: the domain harness seam. Foundation code (this module) must
// never reference one specific domain's module by a hardcoded, literal
// source-code path -- test/architecture.test.mjs's domain-siloing check
// (core cannot couple to a named domain) forbids that, confirmed
// empirically while building this block. So this discovers every domain's
// own harness module that actually exists on disk, once, at module load,
// entirely off filesystem enumeration -- mirroring
// `workflow-stage-graphs.mjs`'s own `DOMAINS` registry
// (`loadDomainsFromDisk`, same module-load-time `readdirSync` rationale,
// same file). The directory name loaded on each loop pass is always a
// runtime value read off the filesystem, never a source-code literal, so
// no specific domain name is ever hardcoded in this file.
//
// Top-level await, used below to load each discovered harness module:
// by the time any caller can reach `buildAssignment()`/
// `buildInlineAssignment()` further down, this ESM module's own graph has
// already finished loading (Node guarantees full module evaluation before
// an importer can observe its exports) -- so every export below stays a
// plain, synchronous function. No public signature changes.
const DOMAIN_HARNESS_SEAMS = new Map();
{
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const domainsRoot = path.resolve(thisDir, '../../../domains');
  if (fs.existsSync(domainsRoot)) {
    const entries = fs.readdirSync(domainsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const domainName = entry.name;
      const harnessPath = path.join(domainsRoot, domainName, 'harness', 'enrich-and-validate-contract.mjs');
      if (!fs.existsSync(harnessPath)) continue;
      try {
        const harnessModule = await import(pathToFileURL(harnessPath).href);
        if (typeof harnessModule.enrichAndValidateContract === 'function') {
          DOMAIN_HARNESS_SEAMS.set(domainName, harnessModule.enrichAndValidateContract);
        }
      } catch {
        // A domain's own harness module failing to import (syntax error,
        // missing dependency, a throw at import time, etc.) must not take
        // down Assignment building for every other domain or the whole
        // process -- treat it the same as that domain simply not having a
        // harness module yet (an already-legal, tested state below).
      }
    }
  }
}

/**
 * Sanitize a string token for use in assignment / run IDs.
 * Lowercases and replaces non [a-zA-Z0-9_-] characters with '_'.
 */
function sanitizeToken(token) {
  if (!token || typeof token !== 'string') return '';
  return token.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Generate a deterministic assignment id: asgn_<safe-work-id>_<safe-operation-id>_<seq>
 *
 * @param {object} params
 * @param {string} [params.workId] Work item id (e.g. 'tsk-abc')
 * @param {string} [params.missionId] Mission id (e.g. 'mission_001')
 * @param {string} [params.stage] Stage name
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {{writerId?: string}} [params.caller] Inline caller provenance (ADR-006 R4);
 *   `caller.writerId` names the id when neither `workId` nor `missionId` is present
 *   (the inline, no-Work-attached case) instead of the bare 'nowork' literal.
 * @param {string[]|Set<string>} [params.existingIds] Existing assignment IDs to avoid collision
 * @param {string} [params.assignmentsDir] Directory containing existing assignment folders
 * @returns {string} e.g. 'asgn_tsk_abc_validate_plan_001'
 */
export function createAssignmentId({ workId, missionId, stage, operation, caller, existingIds = [], assignmentsDir }) {
  const safeWork = workId
    ? sanitizeToken(workId)
    : missionId
      ? sanitizeToken(missionId)
      : caller?.writerId
        ? sanitizeToken(String(caller.writerId))
        : 'nowork';
  const safeOp = sanitizeToken(operation || stage || 'op');
  const prefix = `asgn_${safeWork}_${safeOp}_`;

  const existingSet = Array.isArray(existingIds) ? new Set(existingIds) : new Set(existingIds || []);

  if (assignmentsDir && fs.existsSync(assignmentsDir)) {
    try {
      const entries = fs.readdirSync(assignmentsDir);
      for (const entry of entries) {
        if (typeof entry === 'string' && entry.startsWith(prefix)) {
          existingSet.add(entry);
        }
      }
    } catch {
      // ignore
    }
  }

  let maxSeq = 0;
  existingSet.forEach((id) => {
    if (typeof id === 'string' && id.startsWith(prefix)) {
      const suffix = id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let seqStr = String(nextSeq).padStart(3, '0');
  let candidateId = `${prefix}${seqStr}`;

  if (assignmentsDir) {
    while (fs.existsSync(path.join(assignmentsDir, candidateId))) {
      nextSeq += 1;
      seqStr = String(nextSeq).padStart(3, '0');
      candidateId = `${prefix}${seqStr}`;
    }
  }

  return candidateId;
}

// Same retry ceiling as mission-lite.mjs's own independent claim loop
// (MAX_ASSIGNMENT_CLAIM_ATTEMPTS = 8) -- kept as a separate local constant
// rather than importing mission-lite's, since mission-lite.mjs is a
// deliberately untouched call site (out of scope for this fix) and this
// value is a retry-count tuning knob, not a shared invariant that would
// drift if the two ever diverged.
const MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS = 8;

/**
 * Atomically claim a collision-free assignmentId for an inline call site
 * that must NOT hand-roll a write of `assignment.json`'s content (ADR-006
 * R3.5-style constraint) -- unlike `createMissionAssignment`'s own claim
 * loop (which additionally opens `assignment.json` with `wx` to persist the
 * content it claims), this only reserves the id.
 *
 * `createAssignmentId`'s own directory scan (above) is check-then-act: two
 * genuinely concurrent callers can both compute the same candidate id
 * before either one's directory exists on disk. `fs.mkdirSync(dir)`
 * (no `{ recursive: true }`) is atomic at the OS level -- it throws EEXIST
 * if the directory already exists -- so it doubles as the claim: on
 * success the id is genuinely reserved (no need to write anything inside
 * it; `executeAssignment()`'s own lazy first-write, which already does
 * `fs.mkdirSync(runsDir, { recursive: true })` before checking for
 * `assignment.json`, tolerates the directory pre-existing and just writes
 * into it). On EEXIST, rebuild: the losing attempt's own claimed-but-empty
 * directory is still on disk, so the next `buildCandidate()` call's
 * `createAssignmentId` scan sees it and advances past it to a fresh id.
 *
 * @param {() => object} buildCandidate Builds a fresh candidate Assignment
 *   each call (must re-derive `assignmentId` from current disk state, e.g.
 *   by passing `options.assignmentsDir` through to `buildAssignment`).
 * @param {string} assignmentsDir Directory the candidate ids are claimed under.
 * @returns {object} The claimed (already frozen) Assignment.
 */
export function claimAssignmentId(buildCandidate, assignmentsDir) {
  // `assignmentsDir` is only created once `buildCandidate()` has produced a
  // legal candidate at least once -- a caller whose contract fails
  // validation (e.g. a mutating contract, ADR-006 R3.2) must throw with
  // zero filesystem side effects, matching this door's pre-claim behavior
  // exactly (no `.fgos/assignments` directory ever created for a rejected
  // contract).
  let assignmentsDirEnsured = false;
  for (let attempt = 0; attempt < MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS; attempt += 1) {
    const assignment = buildCandidate();
    if (!assignmentsDirEnsured) {
      fs.mkdirSync(assignmentsDir, { recursive: true });
      assignmentsDirEnsured = true;
    }
    const assignmentDir = path.join(assignmentsDir, assignment.assignmentId);
    try {
      fs.mkdirSync(assignmentDir);
      return assignment;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // Another writer already claimed this exact id -- retry with a fresh candidate.
    }
  }
  throw new RunnerConfigError(
    `claimAssignmentId could not claim a unique assignmentId under "${assignmentsDir}" after ${MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS} attempts -- persistent assignmentId collisions`,
  );
}

/**
 * Convert one selected stage operation into an immutable Assignment object (Step 03).
 *
 * @param {object} params
 * @param {object} [params.work] Optional work item
 * @param {string} [params.workId] Work item id (if work object omitted)
 * @param {string} [params.missionId] Optional mission id for mission-lite
 * @param {string} [params.domain] Domain name (defaults to work.domain or 'coding')
 * @param {string} [params.workflow] Workflow name (defaults to 'feature')
 * @param {string} params.stage Stage name (e.g. 'planning')
 * @param {string} params.operation Operation id (e.g. 'validate-plan')
 * @param {string} [params.objective] Concise semantic request
 * @param {string[]} [params.contextRefs] List of context file/work references
 * @param {string[]} [params.expectedOutputs] List of expected output artifacts or verdicts
 * @param {string[]} [params.expectedFiles] Declared footprint (repo-relative paths) the
 *   assigned helper is expected to touch — used by `scoped-subtask` to refuse undeclared
 *   or caller-overlapping file mutations (Step 06 Slice 6.4). Optional; omitted/empty means
 *   no footprint was declared.
 * @param {object} [params.policy] Optional caller-supplied policy overrides
 * @param {string} [params.role] Optional role override
 * @param {string} [params.reason] Optional roleGraph handoff reason
 * @param {string} [params.createdBy] Identity of creator
 * @param {object} [params.options] Optional execution / lookup options
 * @returns {Readonly<object>} Frozen Assignment object
 */
// `buildInlineAssignment`'s actual accepted top-level params (kept in sync
// with its destructuring signature below: `{ provenance, work, workId,
// createdBy, options }`). Any OTHER top-level key on `params` when
// `provenance.kind === 'inline'` is a declared-shape field silently riding
// along -- rejected below by whitelist rather than by naming each declared
// field individually, so this closes the whole class of bug (any
// declared-only field, present or future) instead of needing a new named
// exception every time another one is discovered.
const INLINE_ASSIGNMENT_PARAM_WHITELIST = new Set(['provenance', 'work', 'workId', 'createdBy', 'options']);

export function buildAssignment(params = {}) {
  if (params?.provenance?.kind === 'inline') {
    const conflicting = Object.keys(params).filter((key) => !INLINE_ASSIGNMENT_PARAM_WHITELIST.has(key));
    if (conflicting.length > 0) {
      throw new RunnerConfigError(
        `buildAssignment: inline provenance cannot be combined with declared-shape field(s): ${conflicting.join(', ')}`,
      );
    }
    return buildInlineAssignment(params);
  }
  return buildDeclaredAssignment(params);
}

function buildDeclaredAssignment({
  work,
  workId,
  missionId,
  domain,
  workflow,
  stage,
  operation,
  objective,
  contextRefs = [],
  expectedOutputs = [],
  expectedFiles = [],
  policy,
  role,
  reason,
  createdBy,
  options = {},
}) {
  if (!stage || typeof stage !== 'string') {
    throw new RunnerConfigError('buildAssignment requires a non-empty stage name');
  }
  if (!operation || typeof operation !== 'string') {
    throw new RunnerConfigError('buildAssignment requires a non-empty operation id');
  }

  const resolvedDomain = resolveDomainName(domain ?? work?.domain ?? DEFAULT_DOMAIN);
  const resolvedWorkflow = workflow ?? work?.workflow ?? 'feature';
  const resolvedWorkId = work?.id ?? workId ?? null;
  const resolvedMissionId = missionId ?? options.missionId ?? null;

  const stageOps = operationsForStage(resolvedDomain, stage, { kind: resolvedWorkflow });
  const matchedOp = stageOps.find((o) => o.id === operation);

  if (!matchedOp) {
    throw new RunnerConfigError(
      `unknown operation "${operation}" for stage "${stage}" in domain "${resolvedDomain}" (declared operations: [${stageOps.map((o) => o.id).join(', ')}])`,
    );
  }

  if (!matchedOp.taskSpec) {
    throw new RunnerConfigError(`operation "${operation}" in stage "${stage}" declares no taskSpec`);
  }

  // Step 04 §5.6: refuse runtime dispatch when the taskSpec file does not resolve
  // to an existing file on disk. This prevents synthetic compatibility operations
  // (e.g. 'decompose') from being treated as dispatchable assignments when no
  // task-spec file exists. Pass `options.allowSyntheticCompatibilityOperation: true`
  // only when the caller explicitly accepts a compatibility-mode dispatch.
  if (!options.allowSyntheticCompatibilityOperation) {
    const checkRoot = options.repoRoot ?? options.cwd ?? process.cwd();
    const taskSpecAbsPath = resolveTaskSpecPath(resolvedDomain, matchedOp.taskSpec, { cwd: checkRoot });
    if (!fs.existsSync(taskSpecAbsPath)) {
      throw new RunnerConfigError(
        `operation "${operation}" in stage "${stage}": taskSpec file does not exist: ${taskSpecAbsPath} — refuse runtime dispatch for missing taskSpec`,
      );
    }
  }

  const targetRole = role ?? matchedOp.role ?? 'implementer';
  const dispatchMode = matchedOp.dispatch ?? 'assignment';
  const opReason = reason ?? matchedOp.reason ?? undefined;

  let mergedPolicy;
  if (matchedOp.policy || policy) {
    const combined = { ...(matchedOp.policy || {}), ...(policy || {}) };
    if (matchedOp.policy?.model && !policy?.model) {
      combined._fromYaml = true;
    }
    if (Array.isArray(combined.fallbackExecutors)) {
      combined.fallbackExecutors = Object.freeze([...combined.fallbackExecutors]);
    }
    mergedPolicy = Object.freeze(combined);
  }

  const existingIds = options.existingIds ?? [];
  const assignmentId = createAssignmentId({
    workId: resolvedWorkId,
    missionId: resolvedMissionId,
    stage,
    operation: matchedOp.id,
    existingIds,
    assignmentsDir: options.assignmentsDir,
  });

  const defaultObjective = objective ?? `Execute ${stage}.${matchedOp.id} operation`;

  const frozenSkills = Array.isArray(matchedOp.skills)
    ? Object.freeze([...matchedOp.skills])
    : Object.freeze([]);

  const derivedContextRefs = Array.isArray(contextRefs) ? [...contextRefs] : [];
  if (work) {
    if (work.docsRef && derivedContextRefs.length === 0) {
      derivedContextRefs.push(work.docsRef);
      derivedContextRefs.push(path.join(work.docsRef, 'plan.md'));
      derivedContextRefs.push(path.join(work.docsRef, 'CONTEXT.md'));
    }
    if (Array.isArray(work.refs)) {
      for (const r of work.refs) {
        if (r && !derivedContextRefs.includes(r)) derivedContextRefs.push(r);
      }
    }
  }

  const derivedExpectedOutputs = Array.isArray(expectedOutputs) ? [...expectedOutputs] : [];
  if (derivedExpectedOutputs.length === 0) {
    if (operation === 'validate-plan') {
      derivedExpectedOutputs.push('agent-result.json (verdict: READY | NOT READY | READY WITH CONSTRAINTS)');
      derivedExpectedOutputs.push('agent-report.md (reviewer findings and evaluation)');
    } else if (operation === 'review-item') {
      derivedExpectedOutputs.push('agent-result.json (verdict: APPROVED | REJECT, evidenceRefs: [candidate diff ref, verify result ref])');
      derivedExpectedOutputs.push('agent-report.md (reviewer findings and evaluation)');
    }
  }

  const frozenContextRefs = Object.freeze([...derivedContextRefs]);
  const frozenExpectedOutputs = Object.freeze([...derivedExpectedOutputs]);
  const frozenExpectedFiles = Object.freeze(
    Array.isArray(expectedFiles) ? expectedFiles.filter((f) => typeof f === 'string' && f.trim() !== '') : [],
  );

  // ADR-006 R1/R2: stamp provenance + the normalized mutation/evidence
  // snapshot. Declared legality (workflow/stage/operation + taskSpec
  // resolution) already ran above; this only records WHICH validators ran
  // and what the normalizer derived from role/operation -- it does not
  // change any branch above (Step 02-06 golden behavior is unaffected).
  const stamped = stampDeclaredAssignment({ role: targetRole, operation: matchedOp.id });
  const provenanceValidators = Object.freeze([
    'workflow-stage-graph-legality',
    ...(options.allowSyntheticCompatibilityOperation ? [] : ['task-spec-existence']),
  ]);

  const assignment = {
    assignmentId,
    workId: resolvedWorkId,
    ...(resolvedMissionId ? { missionId: resolvedMissionId } : {}),
    domain: resolvedDomain,
    workflow: resolvedWorkflow,
    stage,
    operation: matchedOp.id,
    role: targetRole,
    dispatch: dispatchMode,
    taskSpec: matchedOp.taskSpec,
    skills: frozenSkills,
    objective: defaultObjective,
    contextRefs: frozenContextRefs,
    expectedOutputs: frozenExpectedOutputs,
    expectedFiles: frozenExpectedFiles,
    ...(opReason ? { reason: opReason } : {}),
    ...(mergedPolicy ? { policy: mergedPolicy } : {}),
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(createdBy ? { createdBy } : {}),
    provenance: Object.freeze({
      kind: 'declared',
      contractPolicyVersion: CONTRACT_POLICY_VERSION,
      normalizerVersion: NORMALIZER_VERSION,
      validators: provenanceValidators,
      declared: Object.freeze({
        domain: resolvedDomain,
        workflow: resolvedWorkflow,
        stage,
        operation: matchedOp.id,
        taskSpec: matchedOp.taskSpec,
      }),
    }),
    mutation: stamped.mutation,
    evidence: stamped.evidence,
    resultKind: stamped.resultKind,
    ...(stamped.onAdvance ? { onAdvance: stamped.onAdvance } : {}),
  };

  return Object.freeze(assignment);
}

/**
 * Convert an agent-proposed inline execution contract into an immutable
 * Assignment object (ADR-006 R4, second `buildAssignment()` accepted shape).
 *
 * Unlike the declared path, no domain/workflow/stage/operation/taskSpec
 * legality exists to check -- the contract itself IS the request, validated
 * against ADR-006 §4's minimum field set by `execution-contract.mjs`
 * (`mutation: 'mutating'` and any session/coordination field are rejected
 * fail-closed there, ADR-006 §6). `provenance.inline.caller.writerId` is
 * whatever the caller passed in; ADR-006 R1 says that value is expected to
 * come from `resolveWriterIdentity()` (src/util/session-identity.mjs) --
 * this module does not call it itself, since resolving a writer identity is
 * a caller-side (session-aware) concern, not a build-time (pure) one.
 *
 * @param {object} params
 * @param {object} params.provenance `{ kind: 'inline', contract, caller }`
 * @param {object} [params.work] Optional work item to attach (not required for inline)
 * @param {string} [params.workId] Optional work item id (if work object omitted)
 * @param {string} [params.createdBy] Identity of creator
 * @param {object} [params.options] Optional execution / lookup options
 * @returns {Readonly<object>} Frozen Assignment object
 */
function buildInlineAssignment({ provenance, work, workId, createdBy, options = {} }) {
  const { contract: rawContract, caller } = provenance ?? {};

  validateExecutionContract({ contract: rawContract, caller });

  // ADR-007 §1/§2: the domain harness seam fires ONLY when a domain is
  // resolvable for this call, on a Work at a declared Stage -- a work
  // attached with its own `domain` field, or an explicit `options.domain`
  // supplied alongside that same attached work. A standalone inline call
  // (no work, e.g. mission-lite's own shape) or a work with no `.stage`
  // yet skips the seam entirely and passes on generic validation alone
  // (the `validateExecutionContract` call above) -- this is the actual
  // evidence the foundation boundary does not depend on any domain.
  // Deliberately NOT the declared path's `resolveDomainName(... ??
  // DEFAULT_DOMAIN)` silent fold: an inline Work with no explicit
  // `domain`/`options.domain` skips rather than assuming 'coding'.
  const resolvedDomain = work?.stage ? (work.domain ?? options.domain) : undefined;
  // Seam enforcement -- including the ADR-007 §3 `contract.supports`
  // legality check below -- is per-domain opt-in, gated on that domain
  // actually having shipped a harness/enrich-and-validate-contract.mjs
  // file on disk (see DOMAIN_HARNESS_SEAMS above). A domain with a
  // declared Stage graph but no harness module still resolves a domain
  // here, but `.get()` returns undefined and the seam is silently
  // skipped for it -- by design (ADR-007 §4: "no registry... yet,
  // additional seams require a second real consumer"), not a bug.
  const harnessSeam = resolvedDomain ? DOMAIN_HARNESS_SEAMS.get(resolvedDomain) : undefined;

  let contract = rawContract;
  let harnessPolicy;
  if (harnessSeam) {
    // A call-time throw from the harness (as opposed to an import-time
    // failure, which IS isolated by the DOMAIN_HARNESS_SEAMS discovery
    // loop's own try/catch above) propagates uncaught to the caller of
    // buildAssignment() -- intentional: an unexpected bug in a harness
    // must surface, not be silently swallowed.
    const enriched = harnessSeam(rawContract, { domain: resolvedDomain, work });
    contract = enriched.contract;
    harnessPolicy = enriched.policy;

    // A harness is forbidden from weakening any field `validateExecutionContract`
    // already checked once above, against the raw pre-seam contract -- but
    // nothing enforced that until now. Re-run the same generic validator
    // against the post-seam contract, closing the gap for every field at
    // once (role/objective/budget/capabilities/contextRefs/constraints/
    // expectedOutputs), not just the two fields `stampInlineAssignment`
    // below re-checks (mutation/evidence.required).
    validateExecutionContract({ contract, caller });
  }

  const stamped = stampInlineAssignment(contract);

  const resolvedWorkId = work?.id ?? workId ?? null;

  const existingIds = options.existingIds ?? [];
  const assignmentId = createAssignmentId({
    workId: resolvedWorkId,
    caller,
    existingIds,
    assignmentsDir: options.assignmentsDir,
  });

  const frozenContextRefs = Object.freeze([...contract.contextRefs]);
  const frozenExpectedOutputs = Object.freeze([...contract.expectedOutputs]);
  const frozenConstraints = Object.freeze([...contract.constraints]);
  const frozenCapabilities = Object.freeze(Array.isArray(contract.capabilities) ? [...contract.capabilities] : []);
  const frozenBudget = Object.freeze({ ...contract.budget });
  const frozenEvidence = Object.freeze({ ...contract.evidence });

  const frozenContract = Object.freeze({
    objective: contract.objective,
    contextRefs: frozenContextRefs,
    constraints: frozenConstraints,
    expectedOutputs: frozenExpectedOutputs,
    mutation: contract.mutation,
    evidence: frozenEvidence,
    role: contract.role,
    capabilities: frozenCapabilities,
    budget: frozenBudget,
    ...(contract.supports !== undefined ? { supports: contract.supports } : {}),
  });

  const frozenCaller = Object.freeze({
    writerId: caller.writerId,
    ...(caller.parentAssignmentId ? { parentAssignmentId: caller.parentAssignmentId } : {}),
  });

  const assignment = {
    assignmentId,
    workId: resolvedWorkId,
    role: contract.role,
    dispatch: 'assignment',
    objective: contract.objective,
    contextRefs: frozenContextRefs,
    expectedOutputs: frozenExpectedOutputs,
    expectedFiles: Object.freeze([]),
    createdAt: options.createdAt ?? new Date().toISOString(),
    ...(createdBy ? { createdBy } : {}),
    ...(harnessPolicy ? { policy: harnessPolicy } : {}),
    provenance: Object.freeze({
      kind: 'inline',
      contractPolicyVersion: CONTRACT_POLICY_VERSION,
      normalizerVersion: NORMALIZER_VERSION,
      validators: Object.freeze(harnessSeam ? ['execution-contract-schema', 'domain-harness-seam'] : ['execution-contract-schema']),
      inline: Object.freeze({ contract: frozenContract, caller: frozenCaller }),
    }),
    mutation: stamped.mutation,
    evidence: stamped.evidence,
  };

  return Object.freeze(assignment);
}

/**
 * Render standard prompt text for an Assignment (Step 03 / Step 04).
 * Keeps prompt references as refs rather than embedding large file contents.
 * When `options.runDir` is supplied, the prompt includes concrete result artifact
 * paths so the worker knows exactly where to write agent-result.json and
 * agent-report.md (Step 04 §5.1).
 *
 * @param {object} assignment Assignment object
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.runDir] Absolute path to the run directory for this attempt.
 *   When present, result artifact paths are included in the prompt.
 * @returns {string} Prompt string
 */
export function renderAssignmentPrompt(assignment, options = {}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('renderAssignmentPrompt requires an assignment object');
  }

  // ADR-006 R8: an inline Assignment (provenance.kind === 'inline') never
  // carries stage/operation/domain/taskSpec (buildInlineAssignment sets
  // none of these, ADR-006 R4) -- guard each declared-only line instead of
  // rendering it unconditionally, so a real worker sees a clean prompt
  // instead of literal "Stage operation: undefined.undefined" /
  // "Task-spec: domains/coding/task-specs/undefined.md" text. Declared
  // Assignments always have all four fields set (buildDeclaredAssignment
  // requires stage/operation and refuses a missing taskSpec), so this is a
  // value-preserving no-op for them.
  const taskSpecRelPath = assignment.taskSpec
    ? resolveTaskSpecPath(assignment.domain, assignment.taskSpec, options)
    : null;

  const lines = [
    `Assignment: ${assignment.assignmentId}`,
    `Work: ${assignment.workId || '(none)'}`,
    ...(assignment.missionId ? [`Mission: ${assignment.missionId}`] : []),
    ...(assignment.stage && assignment.operation ? [`Stage operation: ${assignment.stage}.${assignment.operation}`] : []),
    `Role: ${assignment.role}`,
    ...(taskSpecRelPath ? [`Task-spec: ${taskSpecRelPath}`] : []),
    `Objective: ${assignment.objective}`,
  ];

  lines.push('Context refs:');
  if (assignment.contextRefs && assignment.contextRefs.length > 0) {
    for (const ref of assignment.contextRefs) {
      lines.push(`- ${ref}`);
    }
  } else {
    lines.push('- (none)');
  }

  lines.push('Expected outputs:');
  if (assignment.expectedOutputs && assignment.expectedOutputs.length > 0) {
    for (const output of assignment.expectedOutputs) {
      lines.push(`- ${output}`);
    }
  } else {
    lines.push('- (none)');
  }

  // Step 04 §5.1: include concrete result artifact paths when runDir is known.
  // Prefer absolute paths so the worker is unambiguous across worktrees.
  if (options.runDir) {
    const agentResultPath = path.join(options.runDir, 'agent-result.json');
    const agentReportPath = path.join(options.runDir, 'agent-report.md');
    lines.push('Result artifact:');
    lines.push(`- Write structured JSON to ${agentResultPath}`);
    lines.push(`- Optional human-readable report: ${agentReportPath}`);
    lines.push('- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.');
  }

  return lines.join('\n');
}

/**
 * Classify an assignment as read-only or mutating (Step 04 §5.4 / ADR-006 R7).
 *
 * Reads the `mutation` field stamped once, at build time, by
 * `assignment-normalizer.mjs` (`stampDeclaredAssignment` for the declared
 * shape, `stampInlineAssignment` for the inline shape) — every Assignment
 * built via `buildAssignment()` carries this field. Does not re-derive
 * classification from `role`/`operation`/`missionId`/`workId` here; that
 * classification happens exactly once, at build time.
 *
 * @param {object} assignment Assignment object
 * @returns {boolean} true when the assignment is read-only
 */
// Roles whose Assignments must only ever produce verdict/report artifacts,
// never a Work-lifecycle edge or a repo mutation (Step 04 §5.4).
// Hoisted to module scope (was function-local) so a dispatch-time executor
// resolution can also gate on it directly.
//
// Defined in assignment-normalizer.mjs (ADR-006 R2 single source of truth
// for the declared mutation mapping) and re-exported here unchanged so this
// module's public surface is unaffected.
export { READ_ONLY_ROLES };

export function isReadOnlyAssignment(assignment) {
  if (!assignment || typeof assignment !== 'object') return false;
  return assignment.mutation === 'read-only';
}

// Allowed status values for agent-result.json (Step 04 §5.2).
const ALLOWED_AGENT_CLAIM_STATUSES = new Set(['done', 'blocked', 'failed', 'no-evidence']);

/**
 * Validate the parsed content of agent-result.json (Step 04 §5.2).
 *
 * Returns `{ valid: true }` when the claim passes all requirements.
 * Returns `{ valid: false, reason: string }` when the claim is invalid.
 *
 * Allowed statuses: done | blocked | failed | no-evidence.
 * Required for all statuses: status (allowed string), summary (non-empty string).
 * Additional required fields:
 * - blocked: requires `blocker` (non-empty string).
 * - failed: requires `error` (non-empty string).
 * - done: requires at least one of evidenceRefs (non-empty array), or
 *   the caller must verify companion artifact / post-run delta separately.
 *   The validator does NOT inspect the filesystem; it only checks the JSON fields.
 *
 * Malformed JSON or invalid schema must produce failed/failed, not no-evidence.
 *
 * @param {unknown} value Parsed agent-result.json content
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateAgentResultClaim(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, reason: 'agent-result.json must be a JSON object' };
  }

  const { status, summary } = value;

  if (!status || typeof status !== 'string' || !ALLOWED_AGENT_CLAIM_STATUSES.has(status)) {
    return {
      valid: false,
      reason: `agent-result.json status must be one of [${[...ALLOWED_AGENT_CLAIM_STATUSES].join(', ')}]; got: ${JSON.stringify(status)}`,
    };
  }

  if (!summary || typeof summary !== 'string' || summary.trim() === '') {
    return { valid: false, reason: 'agent-result.json requires a non-empty summary string' };
  }

  if (status === 'blocked') {
    const { blocker } = value;
    if (!blocker || typeof blocker !== 'string' || blocker.trim() === '') {
      return { valid: false, reason: 'agent-result.json with status "blocked" requires a non-empty blocker string' };
    }
  }

  if (status === 'failed') {
    const { error } = value;
    if (!error || typeof error !== 'string' || error.trim() === '') {
      return { valid: false, reason: 'agent-result.json with status "failed" requires a non-empty error string' };
    }
  }

  if (value.evidenceRefs !== undefined) {
    if (!Array.isArray(value.evidenceRefs)) {
      return { valid: false, reason: 'agent-result.json evidenceRefs must be an array if provided' };
    }
    for (const ref of value.evidenceRefs) {
      if (typeof ref !== 'string' || ref.trim() === '') {
        return { valid: false, reason: 'agent-result.json evidenceRefs items must be non-empty strings' };
      }
    }
  }

  return { valid: true };
}
