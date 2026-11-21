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
import { readRepoFacts } from '../git/inspect.mjs';
import { fgosDirFromRoot } from '../util/fgos-file-registry.mjs';

const VOCABULARY = JSON.parse(fs.readFileSync(new URL('../../packages/supervision/contracts/plan-vocabulary.v1.json', import.meta.url), 'utf8'));
const PROJECT_PREFIX = VOCABULARY.headName.projectPrefix;
const NAME_MAX = VOCABULARY.headName.max;
const HASH_CHARS = VOCABULARY.headName.hashChars;
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

/**
 * The project handle Identity reports (`fgos identity project`): `handle` of the tracked `.fgos/project.json`, read from this
 * checkout or, in a linked worktree that lacks it, from the main checkout. Throws `plan-not-found` when no handle is minted.
 */
export function projectHandleOf(projectRoot) {
  const candidates = [path.join(fgosDirFromRoot(projectRoot), 'project.json')];
  try {
    const { trustedMainRoot } = readRepoFacts(projectRoot);
    if (trustedMainRoot) candidates.push(path.join(fgosDirFromRoot(trustedMainRoot), 'project.json'));
  } catch { /* not a git checkout: only the first candidate */ }
  for (const file of candidates) {
    let record;
    try { record = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (typeof record?.handle === 'string' && record.handle !== '') return record.handle;
  }
  throw new HeadPlanError('plan-not-found', 'this project has no minted handle (.fgos/project.json), so no head name can be resolved to a plan');
}

const cut = (text, max) => [...text].slice(0, max).join('');

/** The low `chars` hex digits of the FNV-1a 32-bit hash of `text`, the tag `portfolio.rs` `name_tag` writes. */
export function nameTag(text, chars = HASH_CHARS) {
  let hash = 0x811c9dc5;
  for (const byte of Buffer.from(text, 'utf8')) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0').slice(-chars);
}

/** The head name of a plan directory, the rule `portfolio.rs` `head_name` writes: a directory that fits is kept whole, a longer one is cut to leave room for `-` and its tag. */
export function headNameOf(handle, dir) {
  const prefix = cut(handle, PROJECT_PREFIX).replace(/-+$/, '');
  const room = Math.max(0, NAME_MAX - ([...prefix].length + 1));
  if ([...dir].length <= room) return `${prefix}-${dir}`;
  const tag = nameTag(dir);
  return `${prefix}-${cut(dir, Math.max(0, room - (tag.length + 1))).replace(/-+$/, '')}-${tag}`;
}

/** The directory part of a head name that carries a tag (`<prefix>-<cut dir>-<tag>`), or null. */
const taggedDirPrefixOf = (rest) => new RegExp(`^(.+)-[0-9a-f]{${HASH_CHARS}}$`).exec(rest)?.[1] ?? null;

/** The readable subject of a head's tab: a plan directory without its leading date and time (`work-data-model`). */
export const subjectOfDir = (dir) => dir.replace(/^\d{6}-\d{4}-/, '');

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
  const rest = name.slice(prefix.length + 1);
  const handle = ports.handle ?? projectHandleOf(projectRoot);
  const listPlanDirs = ports.listPlanDirs ?? defaultListPlanDirs;
  const readPlan = ports.readPlan ?? defaultReadPlan;
  const liveOf = async (dirs) => {
    const found = [];
    for (const dir of dirs.sort()) {
      const text = await readPlan(projectRoot, dir);
      if (text === null) continue;
      if (!ENDED.has(String(readFrontmatter(text, `plans/${dir}/plan.md`).meta.status ?? ''))) found.push({ dir, text });
    }
    return found;
  };
  // A name is a unique prefix of one live plan directory; a name that ends in a tag (a long directory was cut) is the exact name one directory writes.
  let dirPrefix = rest;
  let live = await liveOf((await listPlanDirs(projectRoot, rest)).filter((d) => d.startsWith(rest)));
  const tagged = taggedDirPrefixOf(rest);
  if (live.length === 0 && tagged !== null) {
    dirPrefix = tagged;
    live = await liveOf((await listPlanDirs(projectRoot, tagged)).filter((d) => d.startsWith(tagged) && headNameOf(handle, d) === name));
  }
  if (live.length === 0) throw new HeadPlanError('plan-not-found', `no plan that is not done or withdrawn starts with ${JSON.stringify(dirPrefix)} at the trunk tip`);
  if (live.length > 1) throw new HeadPlanError('plan-ambiguous', `${live.length} plans start with ${JSON.stringify(dirPrefix)}: ${live.map((p) => p.dir).join(', ')}`);
  return { dir: live[0].dir, footprint: footprintOf(live[0].text, live[0].dir) };
}

// ---- the task of a head: a plan for a lead, a discussion for a planner or shaper ------------------------

const DISCUSSION_PERSONAS = new Set(['planner', 'shaper']);
const DISCUSSION_ROOTS = ['docs/discussions', 'plans/discussions'];
const DISCUSSION_FILE = 'DISCUSSION.md';

/** The feature directories of `root` (a path relative to the project) that hold a DISCUSSION.md. */
function defaultListDiscussionDirs(projectRoot, root) {
  let entries;
  try { entries = fs.readdirSync(path.join(projectRoot, root), { withFileTypes: true }); } catch { return []; }
  return entries.filter((e) => e.isDirectory() && fs.existsSync(path.join(projectRoot, root, e.name, DISCUSSION_FILE))).map((e) => e.name).sort();
}

/**
 * The discussion a `planner-*` or `shaper-*` head belongs to: `{ kind: 'discussion', dir, path }`, the path relative to the
 * project. The name is the feature directory or a prefix of it, with the project handle prefix and `-` optional in front.
 * A directory spelled exactly wins over longer ones that merely start with it; none is `discussion-not-found`, more than
 * one `task-ambiguous`. `ports` (for a test): `handle`, `listDiscussionDirs(projectRoot, root) -> dir[]`.
 */
export function discussionOfHead(projectRoot, persona, name, ports = {}) {
  if (!DISCUSSION_PERSONAS.has(persona)) throw new HeadPlanError('discussion-not-found', `persona ${JSON.stringify(persona)} owns no discussion (planner and shaper do)`);
  const handle = ports.handle ?? (() => { try { return projectHandleOf(projectRoot); } catch { return null; } })();
  const prefix = handle === null ? null : cut(handle, PROJECT_PREFIX).replace(/-+$/, '');
  const key = prefix !== null && typeof name === 'string' && name.startsWith(`${prefix}-`) && name.length > prefix.length + 1 ? name.slice(prefix.length + 1) : name;
  const list = ports.listDiscussionDirs ?? defaultListDiscussionDirs;
  const found = [];
  for (const root of DISCUSSION_ROOTS) {
    for (const dir of list(projectRoot, root)) if (typeof key === 'string' && key !== '' && dir.startsWith(key)) found.push({ dir, root });
  }
  const exact = found.filter((f) => f.dir === key);
  const hits = exact.length > 0 ? exact : found;
  if (hits.length === 0) throw new HeadPlanError('discussion-not-found', `no discussion directory starts with ${JSON.stringify(key)} under ${DISCUSSION_ROOTS.join(' or ')}`);
  if (hits.length > 1) throw new HeadPlanError('task-ambiguous', `${hits.length} discussions start with ${JSON.stringify(key)}: ${hits.map((h) => `${h.root}/${h.dir}`).join(', ')}`);
  return { kind: 'discussion', dir: hits[0].dir, path: `${hits[0].root}/${hits[0].dir}/${DISCUSSION_FILE}` };
}

/**
 * The task a head name is bound to, or null for a persona that has none (secretary, supervisor): a lead's live plan
 * (`{ kind: 'plan', dir, path, footprint }`) or a planner's or shaper's discussion. A bound persona whose name matches
 * nothing throws `HeadPlanError`. `ports` as for `planOfHead` and `discussionOfHead`.
 */
export async function taskOfHead(projectRoot, persona, name, ports = {}) {
  if (persona === 'lead') {
    const plan = await (ports.planOfHead ?? planOfHead)(projectRoot, persona, name, ports);
    return { kind: 'plan', dir: plan.dir, path: `${PLANS_DIR}/${plan.dir}/plan.md`, footprint: plan.footprint };
  }
  if (DISCUSSION_PERSONAS.has(persona)) return discussionOfHead(projectRoot, persona, name, ports);
  return null;
}
