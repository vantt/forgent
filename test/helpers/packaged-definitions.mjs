// packaged-definitions.mjs - the release's own definition tiers (domain task-specs, workflow stage
// operations) judged against this checkout. A shipped release cannot change after build, so these
// are release tests, not readiness: `npm test` runs them, `fgos doctor` never does. The tiers a
// project supplies stay on their doctor rows (src/setup/registrations.mjs).
import fs from 'node:fs';
import path from 'node:path';

import { effectiveSection, allAgentYamlFiles, readAgentSkills } from '../../src/setup/registrations.mjs';
import { INSTALL_ROOT } from '../../src/runner/agent-definitions.mjs';
import { POLICY_PATCH_FIELDS } from '../../src/runner/dispatch/execution-contract.mjs';
import { RIGOR_VALUES } from '../../src/runner/rigor.mjs';
import { resolveTaskSpecPath } from '../../src/runner/paths.mjs';
import { DOMAINS } from '../../src/state/domain-registry.mjs';
import { stepById } from '../../src/workflow/steps.mjs';

// tsk-2t9c (multi-role team harness, D6/D9 task-spec A-lite convention;
// AGENTS.md's install/setup/doctor gate): every operation a domain's Workflow
// declares names a task-spec id a step-skill will read as read-first material at
// runtime -- a missing file degrades that skill silently, so this makes the gap
// visible. Read-only (RUL9): never writes, never scaffolds a stub (a stub
// contract is worse than an absent one -- it looks authoritative while saying
// nothing).
//
// The domain registry these checks walk is code loaded from this install, and the
// task-spec/agent files it names ship in the same payload. They therefore resolve
// against the install's own root, never the target project's tree -- a plain target
// project carries no domains/ or core/ of its own.

export function checkTaskSpecsResolve(root = INSTALL_ROOT) {
  const missing = [];
  for (const [domainName, domain] of Object.entries(DOMAINS)) {
    for (const wf of Object.values(domain.workflows ?? {})) {
      for (const step of wf.steps ?? []) {
        for (const op of step.operations ?? []) {
          if (!op.taskSpec) continue;
          const specPath = resolveTaskSpecPath(domainName, op.taskSpec, root);
          if (!fs.existsSync(specPath)) {
            missing.push(`${domainName}.operations.${step.id}[${op.id || op.taskSpec}] -> "${op.taskSpec}" (${path.relative(root, specPath)} not found)`);
          }
        }
      }
    }
  }
  const CORE_TASK_SPECS = [
    'fgos-routing',
    'fgos-clarifying',
    'fgos-researching',
    'fgos-lock-fence',
    'fgos-fanout',
    'fgos-indexing',
    'distill',
  ];
  for (const specId of CORE_TASK_SPECS) {
    const specPath = resolveTaskSpecPath('core', specId, root);
    if (!fs.existsSync(specPath)) {
      missing.push(`core.taskSpec -> "${specId}" (${path.relative(root, specPath)} not found)`);
    }
  }
  if (missing.length > 0) {
    return { passed: false, message: `missing task-spec file(s): ${missing.join('; ')} -- run fgos-coding-implement's own task-spec item, or docs/knowledge/how-to-write-a-task-spec/write-a-task-spec.md` };
  }
  return { passed: true, message: 'every domain\'s taskSpecMap entry and operation resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs' };
}

/**
 * Validates the operations each Workflow step declares, across domain workflows (Step 02 / D19).
 *
 * @param {string} [cwd] Project directory (only its shared config is read)
 * @param {object} [domains] Domain registry map (defaults to DOMAINS)
 * @param {string} [root] Root holding the task-specs and agents the registry names (defaults to this install)
 * @returns {string[]} List of problem descriptions, empty if all valid.
 */
export function findWorkflowStageOperationProblems(cwd = process.cwd(), domains = DOMAINS, root = INSTALL_ROOT) {
  const problems = [];

  const agentFiles = allAgentYamlFiles(root);
  const { agentSkillsMap, problems: agentFileProblems } = readAgentSkills(agentFiles);
  problems.push(...agentFileProblems);
  const allProvidedSkills = new Set();
  for (const skillsSet of agentSkillsMap.values()) {
    for (const s of skillsSet) allProvidedSkills.add(s);
  }

  const knownExecutors = new Set([
    ...Object.keys(effectiveSection(cwd, 'runner')?.executors || {}),
    // executor-provider-naming (2026-09-17): executors are now named by
    // provider, not bin -- 'agy'/'codex'/'pi'/'pi-grok'/'codex-pi' no
    // longer exist as separate ids ('agy' merged into 'gemini'; 'codex'
    // and 'pi' merged into one 'openai' executor, since providerModel is
    // executor-scoped, not per-bin; 'pi-grok' renamed to 'xai'; 'codex-pi'
    // retired as a duplicate of 'pi').
    'claude',
    'gemini',
    'openai',
    'xai',
    'glm',
    'gitnexus',
    'herdr',
  ]);

  for (const [domainName, domain] of Object.entries(domains)) {
    if (!domain) continue;

    const workflows = Object.entries(domain.workflows ?? {});

    for (const [wfName, wf] of workflows) {
      if (!wf) continue;

      // The Workflow definition's own steps carry the operations (validated for
      // shape at load by src/workflow/definition.mjs); this check adds what the
      // loader cannot know: task-spec files, roleGraph roles/edges, skills.
      const operationMap = Object.fromEntries(
        (wf.steps ?? []).filter((step) => step.operations !== undefined).map((step) => [step.id, step.operations]),
      );

      for (const [stage, ops] of Object.entries(operationMap)) {
        if (!Array.isArray(ops)) {
          const msg = `${domainName}.${wfName}.${stage}.operations: must be an array of operation objects`;
          if (!problems.includes(msg)) {
            problems.push(msg);
          }
          continue;
        }

        let primaryCount = 0;
        let primaryOp = null;
        const seenOpIds = new Set();

        for (const op of ops) {
          if (!op || typeof op !== 'object' || Array.isArray(op)) {
            problems.push(`${domainName}.${wfName}.${stage}: operation item must be a non-null object`);
            continue;
          }

          const opLabel = op.id || '?';

          if (!op.id || typeof op.id !== 'string' || op.id.trim() === '') {
            problems.push(`${domainName}.${wfName}.${stage}: operation id must be a non-empty string`);
          } else if (seenOpIds.has(op.id)) {
            problems.push(`${domainName}.${wfName}.${stage}: duplicate operation id "${op.id}"`);
          } else {
            seenOpIds.add(op.id);
          }

          if (!op.taskSpec || typeof op.taskSpec !== 'string' || op.taskSpec.trim() === '') {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> taskSpec must be a non-empty string`);
          } else {
            const specPath = resolveTaskSpecPath(domainName, op.taskSpec, root);
            if (!fs.existsSync(specPath)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> taskSpec "${op.taskSpec}" (${path.relative(root, specPath)} not found)`);
            }
          }

          if (domain.roleGraph && Array.isArray(domain.roleGraph.roles)) {
            if (!op.role || typeof op.role !== 'string' || op.role.trim() === '') {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role must be a non-empty string in roleGraph.roles [${domain.roleGraph.roles.join(', ')}]`);
            } else if (!domain.roleGraph.roles.includes(op.role)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role "${op.role}" not in roleGraph.roles [${domain.roleGraph.roles.join(', ')}]`);
            }
          } else if (op.role !== undefined && (typeof op.role !== 'string' || op.role.trim() === '')) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> role must be a non-empty string`);
          }

          if (!Array.isArray(op.skills) || op.skills.some((s) => typeof s !== 'string')) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skills must be an array of strings`);
          } else if (op.skills.length === 0) {
            problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skills must be a non-empty array of skill names`);
          } else {
            for (const skill of op.skills) {
              if (typeof skill !== 'string' || skill.trim() === '') {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skill name must be a non-empty string`);
              } else if (agentSkillsMap.size > 0 && !allProvidedSkills.has(skill)) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> skill "${skill}" not provided by any registered agent-type`);
              }
            }
          }

          if (op.reason && domain.roleGraph?.edges) {
            const stageEdges = domain.roleGraph.edges[stage];
            if (!Array.isArray(stageEdges) || stageEdges.length === 0) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> reason "${op.reason}" has no declared edges for stage "${stage}" in roleGraph`);
            } else {
              const matchingEdge = stageEdges.find((e) => e.reason === op.reason && (!op.role || e.to === op.role));
              if (!matchingEdge) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> reason "${op.reason}" (target role "${op.role}") does not match any legal roleGraph edge at stage "${stage}"`);
              }
            }
          }

          if (op.dispatch !== undefined) {
            if (!['assignment', 'human-only'].includes(op.dispatch)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> invalid dispatch mode "${op.dispatch}" (allowed: assignment, human-only)`);
            }
            if (op.dispatch === 'human-only') {
              if (op.policy?.preferExecutor) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> dispatch: human-only operation must not declare executor policy (preferExecutor)`);
              }
            }
          }

          if (op.primary) {
            primaryCount++;
            primaryOp = op;
          }

          if (op.policy !== undefined) {
            if (typeof op.policy !== 'object' || op.policy === null || Array.isArray(op.policy)) {
              problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy must be an object`);
            } else {
              // M12: reads the ONE allow-list PolicyPatch validation itself
              // enforces (schema.mjs's POLICY_PATCH_FIELDS) instead of a
              // second, hand-copied Set that had already drifted (missing
              // preferInvocation/repeatMode).
              const disallowedKeys = Object.keys(op.policy).filter((k) => !POLICY_PATCH_FIELDS.has(k));
              if (disallowedKeys.length > 0) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy contains disallowed key(s) [${disallowedKeys.join(', ')}] (allowed: ${[...POLICY_PATCH_FIELDS].join(', ')})`);
              }
              if (op.policy.rigor && !RIGOR_VALUES.includes(op.policy.rigor)) {
                problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.rigor "${op.policy.rigor}" not in recognized rigors [${RIGOR_VALUES.join(', ')}]`);
              }
              if (op.policy.preferPersona) {
                if (typeof op.policy.preferPersona !== 'string' || (agentSkillsMap.size > 0 && !agentSkillsMap.has(op.policy.preferPersona))) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.preferPersona "${op.policy.preferPersona}" not a recognized agent-type`);
                }
              }
              if (op.policy.preferExecutor) {
                if (typeof op.policy.preferExecutor !== 'string' || (knownExecutors.size > 0 && !knownExecutors.has(op.policy.preferExecutor))) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.preferExecutor "${op.policy.preferExecutor}" is not a recognized executor`);
                }
              }
              if (op.policy.visibility !== undefined) {
                if (!['headless', 'visible'].includes(op.policy.visibility)) {
                  problems.push(`${domainName}.${wfName}.${stage}.operations[${opLabel}] -> policy.visibility "${op.policy.visibility}" must be "headless" or "visible"`);
                }
              }
            }
          }
        }

        if (primaryCount > 1) {
          problems.push(`${domainName}.${wfName}.${stage}: has ${primaryCount} operations marked primary: true (at most one allowed)`);
        }

        const stageSkill = stepById(wf, stage)?.skill;
        if (primaryOp) {
          if (stageSkill && Array.isArray(primaryOp.skills) && primaryOp.skills.length > 0 && !primaryOp.skills.includes(stageSkill)) {
            problems.push(`${domainName}.${wfName}.${stage}: primary operation skills [${primaryOp.skills.join(', ')}] does not include step skill "${stageSkill}"`);
          }
        }
      }
    }
  }

  return problems;
}

export function checkDomainWorkflowOperationsCoverage(cwd, root = INSTALL_ROOT) {
  const problems = findWorkflowStageOperationProblems(cwd, DOMAINS, root);
  if (problems.length === 0) {
    return {
      passed: true,
      message: "every step operation across domain workflows resolves to valid task-specs, roles, skills, and legal roleGraph edges",
    };
  }
  return {
    passed: false,
    message: `${problems.length} workflow step operation problem(s): ${problems.join('; ')}`,
  };
}
