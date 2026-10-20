// workflow-pool-independence.mjs — doctor check: can each Workflow unit's capability pool
// supply the distinct provider families its collaboration pattern requires, and where is it short?
//
// A `reviewed` unit needs every checker on a family different from the producer's: that is a hard
// rule. When the capability's `prefer` pool cannot supply a second family, bind() refuses the role
// as an independence violation at run time, after the producer already ran and was paid for. This
// check finds that before any run and fails.
//
// A `panel` unit only PREFERS a different family per seat: bind() spreads the seats over the pool's
// families and lets seats share one when families run out, so a short pool is never a failure. It
// is reported as a note naming the seats that would share, so degraded independence stays visible.
//
// A `debate` unit prefers a different family per side (a note when they share) but its judge must
// differ from both sides: a pool that cannot seat such a judge fails here, not after the sides ran.
//
// The verdict is never recomputed here: each unit is driven through the runner's own pattern code
// with a role runner that only calls bind() (src/runner/execution/dry-bind.mjs). Nothing is
// dispatched and nothing is written. What bind() treats as available (governance, posture) is what
// counts as runnable; a provider that is out of quota, or an agent CLI blocked on a trust prompt,
// is invisible to bind() and is not reported here.

import fs from 'node:fs';
import path from 'node:path';

import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { detectHerdrPresent } from '../runner/execution/run.mjs';
import { resolvePattern } from '../runner/execution/patterns/presets.mjs';
import { describeYamlError, parseYaml } from '../util/yaml.mjs';

// Patterns whose roles are bound against each other's provider family.
const INDEPENDENCE_PATTERNS = new Set(['panel', 'reviewed', 'debate']);

// bind() refuses with these when there is no candidate pool to walk at all.
const NO_POOL_REASONS = new Set(['headless-no-executor', 'no-candidate']);

function workflowDefinitionFiles(root) {
  const dirs = [];
  const core = path.join(root, 'core', 'workflows');
  if (fs.existsSync(core)) dirs.push({ dir: core, prefix: '', relDir: 'core/workflows' });
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    for (const d of fs.readdirSync(domainsDir, { withFileTypes: true })) {
      const dir = path.join(domainsDir, d.name, 'workflows');
      if (d.isDirectory() && fs.existsSync(dir)) dirs.push({ dir, prefix: `${d.name}/`, relDir: `domains/${d.name}/workflows` });
    }
  }
  const files = [];
  for (const { dir, prefix, relDir } of dirs) {
    for (const file of fs.readdirSync(dir).sort()) {
      if (/\.(ya?ml|json)$/i.test(file)) {
        files.push({ file: path.join(dir, file), rel: `${relDir}/${file}`, fileId: `${prefix}${file.replace(/\.[^.]+$/, '')}` });
      }
    }
  }
  return files;
}

/**
 * The one reader of Workflow definition files. Every `core/workflows` and `domains/*\/workflows` file
 * `.yaml`, `.yml` or `.json` under each root is read and parsed (JSON.parse for `.json`, the YAML door
 * otherwise). A file that cannot be read or parsed is left out of `files` and named in `unreadable` as
 * `<file>: cannot be read: <reason>` or `<file>: cannot be parsed: <reason>`; the file is prefixed with its
 * root's label (`package: ...`, `project: ...`) when more than one root is scanned.
 *
 * @param {Array<{ root: string, label: string }>} roots
 * @returns {{ files: Array<{ fileId: string, rel: string, root: string, raw: unknown }>, unreadable: string[] }}
 */
export function readWorkflowDefinitionFiles(roots) {
  const files = [];
  const unreadable = [];
  for (const { root, label } of roots) {
    for (const { file, rel, fileId } of workflowDefinitionFiles(root)) {
      const named = roots.length > 1 ? `${label}: ${rel}` : rel;
      let body;
      try {
        body = fs.readFileSync(file, 'utf8');
      } catch (err) {
        unreadable.push(`${named}: cannot be read: ${err.message}`);
        continue;
      }
      try {
        files.push({ fileId, rel, root, raw: file.endsWith('.json') ? JSON.parse(body) : parseYaml(body, { filename: rel }) });
      } catch (err) {
        unreadable.push(`${named}: cannot be parsed: ${file.endsWith('.json') ? err.message : describeYamlError(err)}`);
      }
    }
  }
  return { files, unreadable };
}

/** The roots a doctor check reads Workflow definitions from: the package, then the project when it is another folder. */
export function workflowRoots(cwd, packageRoot) {
  const roots = [{ root: packageRoot, label: 'package' }];
  if (path.resolve(cwd) !== path.resolve(packageRoot)) roots.push({ root: cwd, label: 'project' });
  return roots;
}

/**
 * Workflow definitions under `roots`, each as { id, steps }; the first definition of an id wins. Files
 * that cannot be read or parsed are named in `unreadable` (see readWorkflowDefinitionFiles).
 */
export function loadWorkflowDefinitions(roots) {
  const { files, unreadable } = readWorkflowDefinitionFiles(roots);
  const workflows = new Map();
  for (const { fileId, raw } of files) {
    const id = typeof raw?.id === 'string' && raw.id ? raw.id : fileId;
    if (!workflows.has(id)) workflows.set(id, { id, steps: Array.isArray(raw?.steps) ? raw.steps : [] });
  }
  return { workflows, unreadable };
}

/**
 * A check's verdict with the Workflow files it could not evaluate added: the normal message stands, the
 * named problems are appended, and any unreadable file fails the check.
 */
export function withUnreadableDefinitions(result, unreadable) {
  if (unreadable.length === 0) return result;
  return {
    passed: false,
    message: `${result.message}; Workflow definitions that cannot be read or parsed, so they are not evaluated: ${unreadable.join('; ')}`,
  };
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
  const loaded = loadWorkflowDefinitions(workflowRoots(cwd, packageRoot));
  return withUnreadableDefinitions(await evaluatePools(loaded.workflows, runnerConfig), loaded.unreadable);
}

async function evaluatePools(workflows, runnerConfig) {
  const session = { headless: true, herdrPresent: detectHerdrPresent() };
  const problems = [];
  const sharing = [];
  let evaluated = 0;
  for (const wf of workflows.values()) {
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
          pattern: template.params ? { pattern: template.pattern, params: template.params } : template.pattern,
          ...(template.seats ? { seats: template.seats } : {}),
        };
        try {
          const { seats } = await simulateUnitBindings(unit, runnerConfig, { session });
          // A capability with no prefer pool at all is refused the same way for any pattern; that gap
          // belongs to workflow-capabilities-configured and says nothing about independence.
          const refused = seats.filter((r) => r.refused && !NO_POOL_REASONS.has(r.refused.reason));
          const sharers = seats.filter((r) => r.sharesFamilyWith?.length > 0);
          if (refused.length === 0 && sharers.length > 0) {
            sharing.push(`${wf.id}/${step.id}/${u.id} (${patternName}, capability "${template.capability}"): ${sharers.map((r) => `${r.seat}=${r.executor} shares a family with ${r.sharesFamilyWith.join(', ')}`).join('; ')}`);
          }
          if (refused.length === 0) continue;
          const bound = seats.filter((r) => r.executor).map((r) => `${r.seat}=${r.executor}`).join(', ');
          problems.push(
            `${wf.id}/${step.id}/${u.id} (${patternName}, capability "${template.capability}"): `
            + `${refused.map((r) => `${r.seat} refused for ${r.refused.reason}: ${r.refused.detail}`).join('; ')}`
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
  const sharingNote = sharing.length > 0
    ? `; panel seats share a provider family because the pool has fewer families than seats (a preference, not a failure; add a prefer entry on another family to spread them): ${sharing.join(' | ')}`
    : '';
  return {
    passed: true,
    message: evaluated === 0
      ? 'no panel or reviewed Workflow unit to evaluate'
      : `every panel/reviewed Workflow unit (${evaluated}) binds all its roles${sharingNote || ' with independent provider families'}`,
  };
}
