// workflow-pool-independence.mjs — doctor check: can each Workflow unit's capability pool supply the
// distinct provider families its collaboration pattern needs?
//
// A `panel` unit needs its panelists and a synthesizer on provider families that differ from each
// other; a `reviewed` unit needs every checker on a family different from the producer's. When the
// capability's `prefer` pool cannot supply that many families, bind() refuses the role as an
// independence violation at run time, after the earlier roles already ran and were paid for. This
// check finds that before any run.
//
// The verdict is never recomputed here: each unit is driven through the runner's own pattern code
// with a role runner that only calls bind() (src/runner/execution/dry-bind.mjs). Nothing is
// dispatched and nothing is written. What bind() treats as available (governance, posture) is what
// counts as runnable; a provider that is out of quota, or an agent CLI blocked on a trust prompt,
// is invisible to bind() and is not reported here.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { detectHerdrPresent } from '../runner/execution/run.mjs';
import { resolvePattern } from '../runner/execution/patterns/presets.mjs';

// Patterns whose roles are bound against each other's provider family.
const INDEPENDENCE_PATTERNS = new Set(['panel', 'reviewed']);

// bind() refuses with these when there is no candidate pool to walk at all.
const NO_POOL_REASONS = new Set(['headless-no-executor', 'no-candidate']);

function workflowDefinitionFiles(root) {
  const dirs = [];
  const core = path.join(root, 'core', 'workflows');
  if (fs.existsSync(core)) dirs.push([core, '']);
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    for (const d of fs.readdirSync(domainsDir, { withFileTypes: true })) {
      const dir = path.join(domainsDir, d.name, 'workflows');
      if (d.isDirectory() && fs.existsSync(dir)) dirs.push([dir, `${d.name}/`]);
    }
  }
  const files = [];
  for (const [dir, prefix] of dirs) {
    for (const file of fs.readdirSync(dir).sort()) {
      if (/\.(ya?ml|json)$/i.test(file)) files.push({ file: path.join(dir, file), fallbackId: `${prefix}${file.replace(/\.[^.]+$/, '')}` });
    }
  }
  return files;
}

/** Workflow definitions under `roots` (package root, then the project), each as { id, steps }.
 * The YAML parser is loaded lazily: `fgos setup` runs from copies that have no installed
 * dependencies, and a missing parser must read as "cannot evaluate", not as a crash. */
export function loadWorkflowDefinitions(roots) {
  let YAML;
  try {
    YAML = createRequire(import.meta.url)('yaml');
  } catch (err) {
    return { unavailable: `the yaml package is not installed here (${err.code ?? err.message})` };
  }
  const workflows = new Map();
  const unreadable = [];
  for (const root of roots) {
    for (const { file, fallbackId } of workflowDefinitionFiles(root)) {
      try {
        const body = fs.readFileSync(file, 'utf8');
        const raw = file.endsWith('.json') ? JSON.parse(body) : YAML.parse(body);
        const id = typeof raw?.id === 'string' && raw.id ? raw.id : fallbackId;
        if (!workflows.has(id)) workflows.set(id, { id, steps: Array.isArray(raw?.steps) ? raw.steps : [] });
      } catch (err) {
        unreadable.push(`${path.basename(file)} (${err.message})`);
      }
    }
  }
  return { workflows, unreadable };
}

/**
 * @param {string} cwd Project root (its own core/ and domains/ workflows are checked too).
 * @param {object} options
 * @param {string} options.packageRoot Root holding the shipped core/ and domains/.
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 * @returns {Promise<{ passed: boolean, message: string }>}
 */
export async function checkWorkflowPoolsSatisfyIndependence(cwd, { packageRoot, loadRunnerConfig }) {
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `runner config not loadable here, Workflow pools not evaluated: ${err.message}` };
  }
  const roots = path.resolve(cwd) === path.resolve(packageRoot) ? [packageRoot] : [packageRoot, cwd];
  const loaded = loadWorkflowDefinitions(roots);
  if (loaded.unavailable) {
    return { passed: true, message: `Workflow definitions not evaluated: ${loaded.unavailable}` };
  }

  const session = { headless: true, herdrPresent: detectHerdrPresent() };
  const problems = [];
  let evaluated = 0;
  for (const wf of loaded.workflows.values()) {
    for (const step of wf.steps) {
      for (const u of step?.units ?? []) {
        const template = u?.template ?? {};
        const patternName = resolvePattern(template.pattern).patternName;
        if (!INDEPENDENCE_PATTERNS.has(patternName) || typeof template.capability !== 'string') continue;
        evaluated += 1;
        const unit = {
          id: u.id,
          objective: template.objective ?? '',
          capability: template.capability,
          rigor: template.rigor,
          writes: template.writes ?? [],
          pattern: template.pattern,
        };
        try {
          const { roles } = await simulateUnitBindings(unit, runnerConfig, { session });
          // A capability with no prefer pool at all is refused the same way for any pattern; that gap
          // belongs to workflow-capabilities-configured and says nothing about independence.
          const refused = roles.filter((r) => r.refused && !NO_POOL_REASONS.has(r.refused.reason));
          if (refused.length === 0) continue;
          const bound = roles.filter((r) => r.executor).map((r) => `${r.role}=${r.executor}`).join(', ');
          problems.push(
            `${wf.id}/${step.id}/${u.id} (${patternName}, capability "${template.capability}"): `
            + `${refused.map((r) => `${r.role} refused for ${r.refused.reason}: ${r.refused.detail}`).join('; ')}`
            + `${bound ? ` [bound before refusal: ${bound}]` : ''}`,
          );
        } catch (err) {
          problems.push(`${wf.id}/${step.id}/${u.id}: could not be evaluated (${err.message})`);
        }
      }
    }
  }
  if (problems.length > 0) {
    return {
      passed: false,
      message: `capability prefer pools cannot supply the independent provider families these Workflow units need: ${problems.join(' | ')} -- add a prefer entry on another provider family under runner.capabilities, or choose a pattern that needs fewer`,
    };
  }
  const unreadableNote = loaded.unreadable.length > 0 ? `; unreadable definitions skipped: ${loaded.unreadable.join(', ')}` : '';
  return {
    passed: true,
    message: evaluated === 0
      ? `no panel or reviewed Workflow unit to evaluate${unreadableNote}`
      : `every panel/reviewed Workflow unit (${evaluated}) binds all its roles with independent provider families${unreadableNote}`,
  };
}
