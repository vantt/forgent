// dispatch/mission-lite.mjs — Mission-Lite Brainstorm And Debate for Team Dispatch V1 (Step 07).
//
// Rules:
// - Read-only mission-lite only.
// - Storage under .fgos/missions/<mission-id>/.
// - Creates mission.json and thread.jsonl.
// - Creates read-only assignments with workId: null.
// - Runs role assignments through hardened Assignment/RunResult path.
// - Refuses mutating operations in mission-lite mode.
// - Produces synthesis.md from structured role results.
// - Does NOT create or mutate Work items automatically — only recommends a Work item.
// - No Work lifecycle, no repo mutation, no Job, scheduler, daemon, or mailbox.

import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_DOMAIN } from '../../state/workflow-stage-graphs.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot, fgosDirFromRoot } from '../paths.mjs';
import { RunnerConfigError } from './config.mjs';
import { buildAssignment, isReadOnlyAssignment } from './assignment.mjs';
import { executeAssignment } from './assignment-runner.mjs';

/**
 * Resolve root and missions directory for a given workspace.
 *
 * @param {object} [opts]
 * @param {string} [opts.repoRoot]
 * @param {string} [opts.cwd]
 * @returns {{ root: string, fgosDir: string, missionsDir: string }}
 */
function resolveMissionsDir(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  let root = opts.repoRoot;
  if (!root) {
    root = resolveMainCheckoutRoot(cwd);
    if (!root) {
      root = resolveMainCheckoutRoot(process.cwd());
    }
  }
  if (!root) {
    root = process.cwd();
  }
  const fgosDir = fgosDirFromRoot(cwd);
  const missionsDir = path.join(fgosDir, 'missions');
  return { root, cwd, fgosDir, missionsDir };
}

/**
 * Create a new mission-lite envelope under .fgos/missions/<missionId>/ (Step 07 §4).
 *
 * @param {object} params
 * @param {string} [params.missionId] Optional mission ID; auto-generated if omitted
 * @param {string} params.objective Question or goal for this debate/brainstorm
 * @param {string} [params.mode] Mode name (defaults to 'debate')
 * @param {string[]} [params.constraints] Constraints list
 * @param {string[]} [params.successCriteria] Success criteria list
 * @param {object} [opts] Options ({ repoRoot, cwd })
 * @returns {Readonly<object>} Stored mission.json object
 */
export function createMission(
  {
    missionId,
    objective,
    mode = 'debate',
    constraints = ['read-only', 'no Work lifecycle', 'no repo mutation'],
    successCriteria = [
      'each role writes structured result',
      'synthesis names decision, tradeoffs, and recommended Work item',
    ],
  },
  opts = {},
) {
  if (!objective || typeof objective !== 'string' || objective.trim() === '') {
    throw new RunnerConfigError('createMission requires a non-empty objective string');
  }

  const { missionsDir } = resolveMissionsDir(opts);
  const id = missionId
    ? missionId.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : `mission_debate_${Date.now().toString(36)}`;

  const missionDir = path.join(missionsDir, id);
  const assignmentsDir = path.join(missionDir, 'assignments');
  const resultsDir = path.join(missionDir, 'results');

  fs.mkdirSync(assignmentsDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  const missionPath = path.join(missionDir, 'mission.json');
  const threadPath = path.join(missionDir, 'thread.jsonl');

  const missionObj = {
    missionId: id,
    objective: objective.trim(),
    mode,
    status: 'open',
    createdAt: new Date().toISOString(),
    constraints: Object.freeze([...constraints]),
    successCriteria: Object.freeze([...successCriteria]),
  };

  fs.writeFileSync(missionPath, `${JSON.stringify(missionObj, null, 2)}\n`);

  if (!fs.existsSync(threadPath)) {
    fs.writeFileSync(threadPath, '');
  }

  return Object.freeze(missionObj);
}

/**
 * Read mission.json for a missionId (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} [opts]
 * @returns {Readonly<object>} Mission object
 */
export function getMission(missionId, opts = {}) {
  if (!missionId || typeof missionId !== 'string') {
    throw new RunnerConfigError('getMission requires a non-empty missionId string');
  }

  const { missionsDir } = resolveMissionsDir(opts);
  const missionPath = path.join(missionsDir, missionId, 'mission.json');

  if (!fs.existsSync(missionPath)) {
    throw new RunnerConfigError(`mission "${missionId}" does not exist at ${missionPath}`);
  }

  try {
    const raw = fs.readFileSync(missionPath, 'utf8');
    return Object.freeze(JSON.parse(raw));
  } catch (err) {
    throw new RunnerConfigError(`failed to read mission.json for "${missionId}": ${err.message}`);
  }
}

/**
 * List all missions stored under .fgos/missions/ (Step 07 §4).
 *
 * @param {object} [opts]
 * @returns {Readonly<object>[]} Array of mission objects
 */
export function listMissions(opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  if (!fs.existsSync(missionsDir)) return Object.freeze([]);

  const results = [];
  try {
    const entries = fs.readdirSync(missionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const missionPath = path.join(missionsDir, entry.name, 'mission.json');
        if (fs.existsSync(missionPath)) {
          try {
            const raw = fs.readFileSync(missionPath, 'utf8');
            results.push(JSON.parse(raw));
          } catch {
            // ignore malformed mission files during listing
          }
        }
      }
    }
  } catch {
    // ignore directory read errors
  }

  return Object.freeze(results);
}

/**
 * Append a thread message to .fgos/missions/<missionId>/thread.jsonl (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} message Semantic message object
 * @param {object} [opts]
 */
export function appendThreadMessage(missionId, message, opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  const threadPath = path.join(missionsDir, missionId, 'thread.jsonl');
  const line = `${JSON.stringify(message)}\n`;
  fs.appendFileSync(threadPath, line, 'utf8');
}

/**
 * Read thread messages from .fgos/missions/<missionId>/thread.jsonl (Step 07 §4).
 *
 * @param {string} missionId
 * @param {object} [opts]
 * @returns {object[]} Array of parsed message objects
 */
export function readThreadMessages(missionId, opts = {}) {
  const { missionsDir } = resolveMissionsDir(opts);
  const threadPath = path.join(missionsDir, missionId, 'thread.jsonl');
  if (!fs.existsSync(threadPath)) return [];

  const raw = fs.readFileSync(threadPath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim() !== '');
  const messages = [];
  for (const line of lines) {
    try {
      messages.push(JSON.parse(line));
    } catch {
      // ignore bad JSON lines
    }
  }
  return messages;
}

/**
 * Create a read-only role assignment for a mission-lite objective (Step 07 §5).
 * Assignments created in mission-lite always have `workId: null`.
 * Mutating operations (e.g. implement-item) are refused.
 *
 * @param {object} params
 * @param {string} params.missionId Target mission ID
 * @param {string} [params.stage] Stage name (e.g. 'planning' or 'exploring')
 * @param {string} params.operation Operation ID (e.g. 'validate-plan', 'resolve-question')
 * @param {string} [params.role] Role override (e.g. 'researcher', 'reviewer', 'advisor')
 * @param {string} [params.objective] Specific assignment objective
 * @param {string[]} [params.contextRefs] Context references
 * @param {string[]} [params.expectedOutputs] Expected output descriptions
 * @param {object} [params.policy] Dispatch policy overrides
 * @param {string} [params.createdBy] Identity of creator
 * @param {object} [opts] Workspace options
 * @returns {Readonly<object>} Stored Assignment object
 */
export function createMissionAssignment(
  {
    missionId,
    stage = 'planning',
    operation,
    role,
    objective,
    contextRefs = [],
    expectedOutputs = [],
    policy,
    createdBy,
  },
  opts = {},
) {
  const mission = getMission(missionId, opts);
  const { root, cwd, missionsDir } = resolveMissionsDir(opts);
  const missionDir = path.join(missionsDir, missionId);
  const assignmentsDir = path.join(missionDir, 'assignments');

  const assignment = buildAssignment({
    workId: null,
    missionId,
    domain: opts.domain ?? DEFAULT_DOMAIN,
    stage,
    operation,
    role,
    objective: objective ?? mission.objective,
    contextRefs,
    expectedOutputs,
    policy,
    createdBy,
    options: {
      repoRoot: root,
      cwd,
      assignmentsDir,
    },
  });

  // Step 07 §7: Refuse mutating operations in mission-lite.
  if (!isReadOnlyAssignment(assignment)) {
    throw new RunnerConfigError(
      `cannot create mutating assignment "${assignment.operation}" (role: "${assignment.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
  }

  const assignmentPath = path.join(assignmentsDir, `${assignment.assignmentId}.json`);
  fs.writeFileSync(assignmentPath, `${JSON.stringify(assignment, null, 2)}\n`);

  appendThreadMessage(
    missionId,
    {
      type: 'TASK',
      assignmentId: assignment.assignmentId,
      toRole: assignment.role,
      objective: assignment.objective,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return assignment;
}

/**
 * Execute a mission-lite assignment through the hardened Assignment/RunResult path (Step 07 §7).
 *
 * @param {string} missionId Mission ID
 * @param {string|object} assignmentOrId Assignment ID or Assignment object
 * @param {object} [opts] Execution options (cwd, repoRoot, cliOverride, runnerConfig, timeoutMs)
 * @returns {Promise<Readonly<object>>} Stored RunResult object
 */
export async function runMissionAssignment(missionId, assignmentOrId, opts = {}) {
  getMission(missionId, opts);
  const { root, cwd, missionsDir } = resolveMissionsDir(opts);
  const missionDir = path.join(missionsDir, missionId);

  let assignment = typeof assignmentOrId === 'string' ? null : assignmentOrId;
  const assignmentId = typeof assignmentOrId === 'string' ? assignmentOrId : assignmentOrId?.assignmentId;

  if (!assignment) {
    const assignmentPath = path.join(missionDir, 'assignments', `${assignmentId}.json`);
    if (!fs.existsSync(assignmentPath)) {
      throw new RunnerConfigError(`assignment "${assignmentId}" not found in mission "${missionId}"`);
    }
    assignment = Object.freeze(JSON.parse(fs.readFileSync(assignmentPath, 'utf8')));
  }

  // Step 07 §7: Refuse mutating operations in mission-lite.
  if (!isReadOnlyAssignment(assignment)) {
    throw new RunnerConfigError(
      `cannot execute mutating operation "${assignment.operation}" (role: "${assignment.role}") in mission-lite mode — mission-lite is strictly read-only`,
    );
  }

  const runResult = await executeAssignment(assignment, {
    ...opts,
    repoRoot: root,
    cwd,
    isMissionLite: true,
  });

  // Persist result under .fgos/missions/<mission-id>/results/<assignment-id>.json
  const resultPath = path.join(missionDir, 'results', `${assignment.assignmentId}.json`);
  fs.writeFileSync(resultPath, `${JSON.stringify(runResult, null, 2)}\n`);

  appendThreadMessage(
    missionId,
    {
      type: 'RESULT',
      assignmentId: assignment.assignmentId,
      status: runResult.status,
      confidence: runResult.confidence,
      resultRef: `results/${assignment.assignmentId}.json`,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return runResult;
}

/**
 * Produce synthesis.md report for a mission-lite brainstorm/debate (Step 07 §8).
 *
 * Contract:
 * - Synthesis names recommendation, tradeoffs, risks, and recommended next Work item.
 * - Cites role result refs (results/<assignment-id>.json).
 * - Excludes or explicitly labels no-evidence / failed role results as unsupported (does not treat as consensus).
 * - Does NOT create or modify Work items in the store.
 *
 * @param {string} missionId Target mission ID
 * @param {object} params Synthesis inputs
 * @param {string} params.decisionRecommendation Clear decision recommendation text
 * @param {string} params.tradeoffs Key tradeoffs analyzed across roles
 * @param {string} params.risks Identified risks
 * @param {object} params.recommendedWorkItem Recommended work item scope ({ title, verify, description })
 * @param {string} [params.evidenceQualityNote] Optional evidence quality note
 * @param {string} [params.synthesizerRole] Role producing synthesis (defaults to 'driver')
 * @param {object} [opts] Workspace options
 * @returns {Readonly<object>} Synthesis result object containing synthesisPath, content, and recommendedWorkItem
 */
export function synthesizeMission(
  missionId,
  {
    decisionRecommendation,
    tradeoffs,
    risks,
    recommendedWorkItem,
    evidenceQualityNote,
    synthesizerRole = 'driver',
  },
  opts = {},
) {
  const mission = getMission(missionId, opts);
  const { missionsDir } = resolveMissionsDir(opts);
  const missionDir = path.join(missionsDir, missionId);
  const resultsDir = path.join(missionDir, 'results');
  const assignmentsDir = path.join(missionDir, 'assignments');

  if (!decisionRecommendation || typeof decisionRecommendation !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty decisionRecommendation string');
  }
  if (!tradeoffs || typeof tradeoffs !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty tradeoffs string');
  }
  if (!risks || typeof risks !== 'string') {
    throw new RunnerConfigError('synthesizeMission requires a non-empty risks string');
  }
  if (!recommendedWorkItem || typeof recommendedWorkItem !== 'object' || !recommendedWorkItem.title) {
    throw new RunnerConfigError('synthesizeMission requires a recommendedWorkItem object with a title property');
  }

  // Load all assignments and results in mission storage
  const roleInputs = [];
  const noEvidenceRoles = [];

  if (fs.existsSync(assignmentsDir)) {
    const asgnFiles = fs.readdirSync(assignmentsDir).filter((f) => f.endsWith('.json'));
    for (const file of asgnFiles) {
      try {
        const asgn = JSON.parse(fs.readFileSync(path.join(assignmentsDir, file), 'utf8'));
        const resPath = path.join(resultsDir, file);
        let res = null;
        if (fs.existsSync(resPath)) {
          res = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        }

        const resultRef = `results/${asgn.assignmentId}.json`;
        const hasEvidence = res && res.status === 'done' && (res.confidence === 'reported' || res.confidence === 'verified');

        if (!hasEvidence) {
          noEvidenceRoles.push(asgn.role);
        }

        roleInputs.push({
          assignmentId: asgn.assignmentId,
          role: asgn.role,
          operation: asgn.operation,
          resultRef,
          status: res?.status ?? 'missing',
          confidence: res?.confidence ?? 'none',
          hasEvidence,
          summary: res?.agentClaim?.summary ?? 'No summary provided',
        });
      } catch {
        // ignore malformed files
      }
    }
  }

  // Build inputs section lines
  const inputLines = [];
  if (roleInputs.length > 0) {
    for (const input of roleInputs) {
      const statusLabel = input.hasEvidence
        ? `status: ${input.status}, confidence: ${input.confidence}`
        : `UNSUPPORTED / NO EVIDENCE (status: ${input.status}, confidence: ${input.confidence})`;
      inputLines.push(`- ${input.role} (${input.operation}): ${input.resultRef} [${statusLabel}] — ${input.summary}`);
    }
  } else {
    inputLines.push('- (no role results registered)');
  }

  // Evidence Quality Section
  let evidenceQualityText = evidenceQualityNote ?? '';
  if (!evidenceQualityText) {
    if (noEvidenceRoles.length > 0) {
      evidenceQualityText = `Caution: Results from role(s) [${noEvidenceRoles.join(', ')}] produced no-evidence or failed, and were excluded from consensus support per Step 07 runtime rules. Decision is based on supported role evidence only.`;
    } else {
      evidenceQualityText = `All ${roleInputs.length} role assignment(s) produced valid structured claims with reported/verified evidence. Consensus is well supported.`;
    }
  }

  // Format synthesis.md according to Step 07 §8 contract
  const synthesisContent = [
    '# Mission Synthesis',
    '',
    '## Question',
    mission.objective,
    '',
    '## Inputs',
    ...inputLines,
    '',
    '## Decision Recommendation',
    decisionRecommendation.trim(),
    '',
    '## Tradeoffs',
    tradeoffs.trim(),
    '',
    '## Risks',
    risks.trim(),
    '',
    '## Recommended Work Item',
    `- Title: ${recommendedWorkItem.title}`,
    `- Verify: ${recommendedWorkItem.verify ?? 'npm test'}`,
    `- Description: ${recommendedWorkItem.description ?? recommendedWorkItem.title}`,
    ...(recommendedWorkItem.kind ? [`- Kind: ${recommendedWorkItem.kind}`] : []),
    ...(recommendedWorkItem.risk ? [`- Risk: ${recommendedWorkItem.risk}`] : []),
    '',
    '## Evidence Quality',
    evidenceQualityText.trim(),
    '',
  ].join('\n');

  const synthesisPath = path.join(missionDir, 'synthesis.md');
  fs.writeFileSync(synthesisPath, synthesisContent, 'utf8');

  // Update mission.json status to completed
  const updatedMission = {
    ...mission,
    status: 'completed',
    synthesizerRole,
    synthesizedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(missionDir, 'mission.json'), `${JSON.stringify(updatedMission, null, 2)}\n`);

  appendThreadMessage(
    missionId,
    {
      type: 'SYNTHESIS',
      synthesizerRole,
      synthesisRef: 'synthesis.md',
      recommendedWorkItemTitle: recommendedWorkItem.title,
      createdAt: new Date().toISOString(),
    },
    opts,
  );

  return Object.freeze({
    missionId,
    synthesisPath,
    synthesisContent,
    recommendedWorkItem: Object.freeze({ ...recommendedWorkItem }),
  });
}
