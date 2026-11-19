// head-plan.mjs -- the plan a lead or planner head belongs to, read at the trunk tip.
//
// One reader for the grant of a head and for the request route's bindings: a head name of persona `lead` or `planner`
// is the project handle cut to the prefix limit, `-`, and the plan directory cut to fill the name limit
// (`packages/supervision/contracts/plan-vocabulary.v1.json` `headName`, the rule `portfolio.rs` `head_name` writes). It is
// resolved back by the unique prefix among the plans that are not `done` or `withdrawn`, and the plan's `footprint`
// comes from `plan.md` as the trunk tip holds it, never from the working file a head may have edited.

import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../util/yaml.mjs';

const VOCABULARY = JSON.parse(fs.readFileSync(new URL('../../packages/supervision/contracts/plan-vocabulary.v1.json', import.meta.url), 'utf8'));
const PROJECT_PREFIX = VOCABULARY.headName.projectPrefix;
const ENDED = new Set(['done', 'withdrawn']);
const PLAN_PERSONAS = new Set(['lead', 'planner']);
const PLANS_DIR = 'plans';
const MAX_PLAN_BYTES = 4 * 1024 * 1024;
const LIST_PAGE = 2000;

export class HeadPlanError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadPlanError';
    this.code = code;
  }
}

/** The project handle of a checkout: its folder name as a head-name segment, before the prefix cut. */
export const projectHandleOf = (projectRoot) => path.basename(projectRoot).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

const cut = (text, max) => [...text].slice(0, max).join('');

// ---- default ports: the trunk tip through Git Inspect --------------------------------------------

async function trunkReader(projectRoot) {
  const { createGitInspect, gitPortOptions } = await import('../git/inspect.mjs');
  const inspect = createGitInspect(gitPortOptions(projectRoot));
  const trunk = inspect.resolveTrunk();
  if (trunk.kind !== 'known') throw new HeadPlanError('plan-not-found', 'the trunk of this project is not known, so no plan can be read at its tip');
  return { inspect, revision: inspect.resolveCommit({ name: trunk.value }) };
}

/** The plan directories under `plans/` at the trunk tip whose name starts with `dirPrefix`, as `plan.md` shows them. */
async function defaultListPlanDirs(projectRoot, dirPrefix) {
  const { inspect, revision } = await trunkReader(projectRoot);
  const dirs = new Set();
  let cursor = null;
  do {
    const page = inspect.listTree({ revision, prefix: `${PLANS_DIR}/${dirPrefix}`, max: LIST_PAGE, ...(cursor ? { cursor } : {}) });
    for (const entry of page.entries) {
      const match = /^plans\/([^/]+)\/plan\.md$/.exec(Buffer.from(entry.path).toString('utf8'));
      if (match) dirs.add(match[1]);
    }
    cursor = page.complete ? null : page.nextCursor;
  } while (cursor);
  return [...dirs];
}

/** The text of `plans/<dir>/plan.md` at the trunk tip, or null when the tip has none. */
async function defaultReadPlan(projectRoot, dir) {
  const { inspect, revision } = await trunkReader(projectRoot);
  const [read] = inspect.pathsAtRevision({ revision, paths: [[...Buffer.from(`${PLANS_DIR}/${dir}/plan.md`)]], maxBlobBytes: MAX_PLAN_BYTES });
  if (read?.value.kind === 'present') return Buffer.from(read.value.bytes).toString('utf8');
  if (read?.value.kind === 'absent') return null;
  throw new HeadPlanError('plan-not-found', `plans/${dir}/plan.md at the trunk tip could not be read: ${read?.value.kind ?? 'no answer'}`);
}

const footprintOf = (text, dir) => {
  const footprint = readFrontmatter(text, `plans/${dir}/plan.md`).meta.footprint;
  return Array.isArray(footprint) ? footprint.filter((entry) => typeof entry === 'string' && entry.trim() !== '') : [];
};

/** The text of a plan's `plan.md` frontmatter `footprint` list, for a caller that holds the file text already. */
export const footprintOfPlanText = (text, dir = '') => footprintOf(text, dir);

/** Whether `persona` and `name` spell a lead or planner head of this project (the handle prefix, `-`, a plan directory prefix); no plan is read. */
export function isPlanHeadName(projectRoot, persona, name, ports = {}) {
  const prefix = cut(ports.handle ?? projectHandleOf(projectRoot), PROJECT_PREFIX).replace(/-+$/, '');
  return PLAN_PERSONAS.has(persona) && typeof name === 'string' && name.startsWith(`${prefix}-`) && name.length > prefix.length + 1;
}

/**
 * The plan a `lead-*` or `planner-*` head belongs to: `{ dir, footprint }`, the footprint read from `plan.md` at the
 * trunk tip. A name that is the handle prefix plus a prefix of exactly one live plan directory resolves; none is
 * `plan-not-found`, more than one `plan-ambiguous`; a persona that does not own a plan is `plan-not-found`.
 *
 * `ports` (for a test): `handle` (the project handle, default the folder name of `projectRoot`),
 * `listPlanDirs(projectRoot, dirPrefix) -> dir[]`, `readPlan(projectRoot, dir) -> text | null`.
 */
export async function planOfHead(projectRoot, persona, name, ports = {}) {
  if (!PLAN_PERSONAS.has(persona)) throw new HeadPlanError('plan-not-found', `persona ${JSON.stringify(persona)} owns no plan (lead and planner do)`);
  const prefix = cut(ports.handle ?? projectHandleOf(projectRoot), PROJECT_PREFIX).replace(/-+$/, '');
  if (typeof name !== 'string' || !name.startsWith(`${prefix}-`) || name.length === prefix.length + 1) {
    throw new HeadPlanError('plan-not-found', `${JSON.stringify(name)} is not a head name of this project (${prefix}-<plan>)`);
  }
  const dirPrefix = name.slice(prefix.length + 1);
  const listPlanDirs = ports.listPlanDirs ?? defaultListPlanDirs;
  const readPlan = ports.readPlan ?? defaultReadPlan;
  const live = [];
  for (const dir of (await listPlanDirs(projectRoot, dirPrefix)).filter((d) => d.startsWith(dirPrefix)).sort()) {
    const text = await readPlan(projectRoot, dir);
    if (text === null) continue;
    if (!ENDED.has(String(readFrontmatter(text, `plans/${dir}/plan.md`).meta.status ?? ''))) live.push({ dir, text });
  }
  if (live.length === 0) throw new HeadPlanError('plan-not-found', `no plan that is not done or withdrawn starts with ${JSON.stringify(dirPrefix)} at the trunk tip`);
  if (live.length > 1) throw new HeadPlanError('plan-ambiguous', `${live.length} plans start with ${JSON.stringify(dirPrefix)}: ${live.map((p) => p.dir).join(', ')}`);
  return { dir: live[0].dir, footprint: footprintOf(live[0].text, live[0].dir) };
}
