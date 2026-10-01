// src/workflow/plan-source.mjs — Translates an AgentKit plan into an ephemeral Workflow definition
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { validateWorkflow } from './definition.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return { frontmatter: {}, body: content };
  try {
    const frontmatter = YAML.parse(match[1]) || {};
    const body = content.slice(match[0].length).trim();
    return { frontmatter, body };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Translate an AgentKit plan directory or plan.md into a validated Workflow definition.
 *
 * @param {string} planPath Directory containing plan.md or direct path to plan.md
 * @param {object} [options]
 * @param {string} [options.phasesRange] e.g. "1..3" or "all"
 * @returns {Readonly<object>} Validated Workflow definition
 */
export function translatePlanToWorkflow(planPath, options = {}) {
  const resolved = path.resolve(planPath);
  let planDir = resolved;
  let mainPlanFile = resolved;

  if (fs.statSync(resolved).isDirectory()) {
    mainPlanFile = path.join(resolved, 'plan.md');
  } else {
    planDir = path.dirname(resolved);
  }

  if (!fs.existsSync(mainPlanFile)) {
    throw new RunnerConfigError(`Plan file not found at "${mainPlanFile}"`);
  }

  const mainContent = fs.readFileSync(mainPlanFile, 'utf8');
  const { frontmatter: planFm } = parseFrontmatter(mainContent);

  const planSlug = path.basename(planDir);
  const planTitle = planFm.title || planSlug;
  const workflowId = `plan/${planSlug}`;

  // Find phase files: phase-*.md
  const phaseFiles = fs.readdirSync(planDir)
    .filter((f) => /^phase-\d+.*\.md$/i.test(f))
    .sort();

  const steps = [];

  if (phaseFiles.length === 0) {
    // Single-phase or flat plan
    steps.push({
      id: 'step-1',
      title: planTitle,
      units: [
        {
          id: 'step-1-u1',
          template: {
            capability: 'code:implement',
            objective: planTitle,
            writes: [],
          },
        },
      ],
    });
  } else {
    for (const file of phaseFiles) {
      const filePath = path.join(planDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter: phaseFm } = parseFrontmatter(content);

      const m = /^phase-(\d+)/i.exec(file);
      const phaseNum = m ? Number.parseInt(m[1], 10) : steps.length + 1;
      const stepId = `phase-${String(phaseNum).padStart(2, '0')}`;
      const phaseTitle = phaseFm.title || `Phase ${phaseNum}`;

      // Calculate step dependencies
      const dependsOn = [];
      if (Array.isArray(phaseFm.dependencies)) {
        for (const dep of phaseFm.dependencies) {
          const depNum = typeof dep === 'number' ? dep : Number.parseInt(String(dep), 10);
          if (!Number.isNaN(depNum)) {
            dependsOn.push(`phase-${String(depNum).padStart(2, '0')}`);
          }
        }
      } else if (steps.length > 0) {
        // Sequential default
        dependsOn.push(steps[steps.length - 1].id);
      }

      // Check if phase requires human review/gate (e.g. status or gate)
      const gate = phaseFm.gate === 'human' || phaseFm.requiresReview === true
        ? { kind: 'human', question: `Approve execution of ${phaseTitle}?` }
        : null;

      steps.push({
        id: stepId,
        title: phaseTitle,
        dependsOn,
        gate,
        units: [
          {
            id: `${stepId}-u1`,
            template: {
              capability: phaseFm.capability || 'code:implement',
              objective: phaseTitle,
              writes: Array.isArray(phaseFm.writes) ? phaseFm.writes : [],
              rigor: phaseFm.rigor || 'standard',
            },
          },
        ],
      });
    }
  }

  const rawWorkflow = {
    id: workflowId,
    title: planTitle,
    description: `Generated Workflow from plan ${planSlug}`,
    steps,
  };

  return validateWorkflow(rawWorkflow);
}
