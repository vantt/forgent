// head-start.mjs -- the use case behind a head session's start.
//
// A head session is one long-lived interactive agent for a persona and a name (`head:<persona>-<name>`).
// Starting it is: refuse a bad name, front the live session of that role instead of starting a second one,
// otherwise bind a seat at the persona's tier and launch it as a confined supervised attempt (the same door a
// worker attempt goes through) with the opening text typed visibly into the composer, and remember where it is.
// Identity owns who holds the role: the run supervisor registers the session there, so this module never writes
// it. What the role may write comes from the permission table's cage size (`grantOf`). Everything it needs from a layer above
// (binding, the launch, the opening text) comes in through `ports`, whose defaults load the runner lazily; the
// rotation lock is the rotation executor's, so it arrives as `ports.rotationHolds`.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { replaceDurably } from '../native/door.mjs';
import { createSessionHost } from './client.mjs';
import { grantOf, headPersonas } from './head-grants.mjs';
import { discussionBranchOf, discussionWorktreeOf, subjectOfDir, taskOfHead } from './head-plan.mjs';
import { inspectEntries, inspectPath } from '../util/git-paths.mjs';
import { installationDir, resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { fgosDirFromRoot } from '../util/fgos-file-registry.mjs';
import { listAssignmentRuns, loadRunnerConfigForDir } from '../native/execution-door.mjs';

const PERSONA_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const NAME_PATTERN = /^[a-z0-9-]{1,32}$/;
const PLACEMENT_FILE = 'placement.json';
const FILE_MODE = 0o600;
const QUESTION_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

/** How long a head session may live before its supervisor ends it, whatever it is doing (7 days). */
export const HEAD_HARD_CEILING_MS = 7 * 24 * 60 * 60 * 1000;

export class HeadStartError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'HeadStartError';
    this.code = code;
    Object.assign(this, extra);
  }
}

export const headRoleOf = (persona, name) => `head:${persona}-${name}`;
/** The subject a head's tab shows after its role: the plan or discussion directory without its date, or the head name when the persona owns no task. */
export const subjectOfHead = (persona, name, task) => (task?.dir ? subjectOfDir(task.dir) : name);
export const headKeyOf = (persona, name, gen) => `head-${persona}-${name}-${gen}`;

/** The folder the lineage of one persona-name keeps its runtime files in (handoffs, the live placement). */
export const lineageDirOf = (projectRoot, persona, name) => path.join(fgosDirFromRoot(projectRoot), 'runtime', 'session-rotation', `${persona}-${name}`);

/** The record of where the live head of a lineage was placed (`{ role, gen, placement, runDir, persona, startedAt }`; `runDir` is the session attempt's directory), or null. */
export function readHeadPlacement(dir) {
  try {
    const record = JSON.parse(fs.readFileSync(path.join(dir, PLACEMENT_FILE), 'utf8'));
    return record?.placement?.key ? record : null;
  } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return null;
    throw err;
  }
}

export function writeHeadPlacement(dir, record) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  replaceDurably(dir, PLACEMENT_FILE, `${JSON.stringify(record)}\n`, FILE_MODE);
}

// ---- default ports ------------------------------------------------------------------------------

/**
 * Whether a live session of this machine holds the role: `fgos identity resolve <role>` names exactly one live
 * session or refuses [not-found]. Identity stays the only authority for who is alive; nothing is cached here.
 * Returns `{ live: true, session, record }` (`record` is Identity's whole answer, with the session's identifiers in
 * `record.ids`) or `{ live: false }`.
 */
export function identityHolder(role, projectRoot) {
  const { bin } = resolveActiveHostBin();
  if (!bin) throw new HeadStartError('identity-unavailable', 'no fgos host binary found to ask Identity who holds the role');
  const res = spawnSync(bin, ['identity', 'resolve', role, '--json'], { cwd: projectRoot, env: routeEnv(), encoding: 'utf8', timeout: 20_000 });
  if (res.error) throw new HeadStartError('identity-unavailable', `Identity did not answer: ${res.error.message}`);
  const text = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  if (res.status === 0) {
    let answer = null;
    try { answer = JSON.parse(res.stdout); } catch { /* the exit code is the answer */ }
    const record = answer?.data ?? answer ?? null;
    return { live: true, session: record?.id ?? null, record };
  }
  if (/not-found/.test(text)) return { live: false };
  // Identity already rescans an ambiguous answer under its own lock, so this one is real or a take still in flight:
  // a caller that can wait treats it as transient by its own code.
  if (/ambiguous/.test(text)) throw new HeadStartError('identity-ambiguous', `Identity found more than one holder of ${role}: ${text.trim().slice(0, 300)}`);
  throw new HeadStartError('identity-unavailable', `Identity refused the lookup of ${role}: ${text.trim().slice(0, 300)}`);
}

/** The terminal slot key of a session's Identity record (`ids.terminal.key`), or null when it names none. */
export function slotKeyOf(record) {
  const key = record?.ids?.terminal?.key;
  return typeof key === 'string' && key !== '' ? key : null;
}

/** The opening a head session is typed: its persona section, the skills line the persona carries, and the start ritual. */
/** The opening a head receives, composed by the start-context composer (the one producer of start text). */
async function defaultOpening({ projectRoot, request }) {
  const { composeStart, startText } = await import('../util/start-context.mjs');
  return startText(composeStart(projectRoot, request));
}

/** The start request of a head: who it is, the CLI it runs on, and what it starts with. */
export function headStartRequest({ persona, name, projectRoot, cli, handoff = null, forQuestion = null, task = null }) {
  const facts = { sessionType: 'head', persona, project: path.basename(path.resolve(projectRoot)), agentCli: cli, agentLifecycle: handoff ? 'rotate' : 'start' };
  // The bound item's domain, decided at intake; a head with no domain gets no domain fact, never a default.
  if (task?.domain) facts.domain = task.domain;
  const payloads = [{ kind: 'session', name }];
  if (task?.path) payloads.push({ kind: 'task', path: task.path, itemKind: task.kind === 'plan' ? 'plan' : 'discussion' });
  if (handoff?.path) payloads.push({ kind: 'handoff', path: handoff.path });
  if (forQuestion) payloads.push({ kind: 'for-question', questionId: forQuestion });
  return { facts, payloads, delivery: 'opening' };
}

/**
 * The binding of a head seat: one interactive seat asked for under the persona, so the crate takes the tier from
 * `runner.personas.<persona>.tier`, else `defaults.tier` (a persona names no model). A head lives in a pane, so the seat is
 * asked for with herdr present: the executor's pane invocation, never its headless one. A refusal throws.
 */
export async function bindHeadSeat({ persona, key, runnerConfig, runtimeDir }) {
  const { bind } = await import('../runner/execution/bind.mjs');
  const { readAccountStateOverlay } = await import('../runner/dispatch/provider-capacity.mjs');
  let accountState = null;
  try {
    accountState = readAccountStateOverlay({ runtimeDir });
  } catch {
    // An unreadable lease state stays what it is today, the config-only view. Do not invent a fallback.
    accountState = null;
  }
  const binding = bind(
    { unit: { id: key, capability: 'execute', rigor: 'standard', writes: [] }, seat: 'producer', role: 'producer', persona, readOnly: true, raiseAuthorized: false },
    { runnerConfig, session: { headless: false, herdrPresent: true, postureAtLaunch: true }, ...(accountState ? { accountState } : {}) },
    { headLaunch: true },
  );
  if (binding.refused) {
    throw new HeadStartError('bind-refused', `no seat can serve persona "${persona}": ${binding.refused.reason}: ${binding.refused.detail}${binding.refused.fix ? `; ${binding.refused.fix}` : ''}`, { refusal: binding.refused, reason: binding.refused.reason });
  }
  return binding;
}

/** The launch of a head: one supervised terminal attempt, launched by the host's engine. */
async function defaultLaunch(request) {
  const { launchSessionInHost } = await import('../native/execution-door.mjs');
  return launchSessionInHost(request);
}

async function defaultRunnerConfig(projectRoot) {
  return loadRunnerConfigForDir(projectRoot);
}

const realpathOrSelf = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };

/**
 * The worktree of a shaper's discussion: reuses `path` when Git lists it on `branch`, refuses `shaper-worktree-mismatch`
 * when it is registered on another branch, else asks the host's worktree door to create it on `branch` from the trunk tip.
 * The worktree list is read through Git Inspect. Returns `{ path, branch, created }`.
 */
export async function defaultEnsureWorktree({ projectRoot, path: worktreePath, branch }) {
  const ensured = await ensureDiscussionWorktree({ projectRoot, path: worktreePath, branch });
  linkInstallation(projectRoot, worktreePath);
  return ensured;
}

/**
 * Makes `<worktree>/.fgos/installation` a link to the project's, so the project hooks (which run `${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos`)
 * answer from inside the worktree. A link to the same target is kept; anything else there is refused `shaper-worktree-installation-conflict`.
 * A project without an installation gets no link.
 */
function linkInstallation(projectRoot, worktreePath) {
  const target = installationDir(projectRoot);
  if (!fs.existsSync(target)) return;
  const link = installationDir(worktreePath);
  let existing = null;
  try { existing = fs.lstatSync(link); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  if (existing) {
    if (existing.isSymbolicLink() && realpathOrSelf(link) === realpathOrSelf(target)) return;
    throw new HeadStartError('shaper-worktree-installation-conflict', `${link} exists and is not a link to ${target}; it was not replaced`);
  }
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(target, link, 'dir');
}

async function ensureDiscussionWorktree({ projectRoot, path: worktreePath, branch }) {
  const { createGitInspect, gitPortOptions } = await import('../git/inspect.mjs');
  const inspect = createGitInspect(gitPortOptions(projectRoot));
  const want = realpathOrSelf(worktreePath);
  const row = inspectEntries((page) => inspect.listWorktrees(page)).find((entry) => realpathOrSelf(inspectPath(entry.path)) === want);
  if (row) {
    const have = row.branch?.startsWith('refs/heads/') ? row.branch.slice('refs/heads/'.length) : null;
    if (have !== branch) throw new HeadStartError('shaper-worktree-mismatch', `${worktreePath} is a worktree on ${have ?? 'a detached head'}, not on ${branch}`);
    return { path: worktreePath, branch, created: false };
  }
  const trunk = inspect.resolveTrunk();
  if (trunk.kind !== 'known') throw new HeadStartError('shaper-worktree-failed', 'the trunk of this project is not known, so the discussion worktree has no base');
  const { bin } = resolveActiveHostBin();
  if (!bin) throw new HeadStartError('shaper-worktree-failed', 'no fgos host binary found to create the discussion worktree');
  // The worktree door canonicalizes the destination's parent, so it must exist; only that directory is made here.
  fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
  const res = spawnSync(bin, ['worktree', 'create', worktreePath, '--branch', branch, '--base', trunk.value, '--json'], { cwd: projectRoot, env: routeEnv(), encoding: 'utf8', timeout: 120_000 });
  if (res.error || res.status !== 0) {
    throw new HeadStartError('shaper-worktree-failed', `the worktree ${worktreePath} was not created: ${res.error?.message ?? `${res.stdout ?? ''}${res.stderr ?? ''}`.trim().slice(0, 300)}`);
  }
  return { path: worktreePath, branch, created: true };
}

const ROLE_REFUSAL_CODES = new Set(['head-role-not-bound', 'head-role-held']);

/**
 * The role-binding refusal the head's supervisor published for this key (`start-refused.json` of the attempt's run),
 * as `{ code, why }`, or null when it refused nothing of the kind. The supervisor binds the role in Identity before
 * the agent exists, so a head that could not hold it never starts. Only the newest run under the key is read: it is
 * the launch that just failed, so a note an earlier run left is never taken for this one's.
 */
export function roleRefusalOf(projectRoot, key) {
  const latest = [...listAssignmentRuns(fgosDirFromRoot(projectRoot))]
    .filter((run) => run.assignmentId === key)
    .sort((a, b) => (a.attempt < b.attempt ? -1 : a.attempt > b.attempt ? 1 : 0))
    .at(-1);
  if (latest === undefined) return null;
  try {
    const note = JSON.parse(fs.readFileSync(path.join(latest.runDir, 'start-refused.json'), 'utf8'));
    if (ROLE_REFUSAL_CODES.has(note?.code)) return { code: note.code, why: String(note.why ?? '') };
  } catch { /* no note in this run */ }
  return null;
}

/** The generation a start without one takes: the first whose attempt directory does not exist yet. */
export function nextHeadGeneration(projectRoot, persona, name) {
  let gen = 1;
  while (fs.existsSync(path.join(fgosDirFromRoot(projectRoot), 'assignments', headKeyOf(persona, name, gen)))) gen += 1;
  return gen;
}

/** The persona names with the ones that hold a head grant first: the refusal message is cut, and these are the ones the caller wanted. */
export function personasHeadsFirst(names) {
  const sorted = [...new Set(names)].sort();
  const heads = headPersonas();
  return [...sorted.filter((name) => heads.includes(name)), ...sorted.filter((name) => !heads.includes(name))];
}

async function defaultPin({ persona, projectRoot }) {
  const { pinPersona, AgentNotFoundError, scanAgentTiers } = await import('../runner/agent-definitions.mjs');
  try {
    return pinPersona(persona, { projectRoot });
  } catch (err) {
    if (!(err instanceof AgentNotFoundError)) throw err;
    const known = personasHeadsFirst(scanAgentTiers({ projectRoot }).flatMap((tier) => tier.entries.map((entry) => entry.name)));
    throw new HeadStartError('persona-not-found', `no persona named "${persona}"; known personas: ${known.join(', ') || '(none)'}`, { cause: err, known });
  }
}

async function defaultHandoff({ persona, name, projectRoot }) {
  const { readLatestHandoff } = await import('../session-rotation/handoff-store.mjs');
  return readLatestHandoff({ fgosDir: fgosDirFromRoot(projectRoot), persona, name });
}

// ---- the use case -------------------------------------------------------------------------------

export function assertHeadArgs({ persona, name, projectRoot, gen = null, forQuestion = null }) {
  if (!PERSONA_PATTERN.test(persona ?? '')) throw new HeadStartError('bad-persona', `persona must be an agent name (a-z, 0-9, hyphen; starts with a letter), got ${JSON.stringify(persona)}`);
  if (!NAME_PATTERN.test(name ?? '')) throw new HeadStartError('bad-name', `name must be 1 to 32 characters of a-z, 0-9 and hyphen, got ${JSON.stringify(name)}`);
  if (typeof projectRoot !== 'string' || projectRoot === '') throw new HeadStartError('bad-project-root', 'projectRoot is required');
  if (forQuestion !== null && !QUESTION_ID_PATTERN.test(forQuestion ?? '')) throw new HeadStartError('bad-question', `forQuestion must be a question id (letters, digits, dot, underscore, hyphen; at most 64), got ${JSON.stringify(forQuestion)}`);
  if (gen !== null && (!Number.isInteger(gen) || gen < 1)) throw new HeadStartError('bad-generation', `gen must be a positive integer, got ${JSON.stringify(gen)}`);
}

export const STATUS_LINE_COMMAND = 'fgos hook session-rotation --event status-line';

export function isClaudeCodeBinding(binding, runnerConfig) {
  const cli = (binding?.cli ?? '').toLowerCase();
  if (cli) {
    if (cli === 'claude') return true;
    if (['codex', 'pi', 'agy', 'omp', 'gemini'].includes(cli)) return false;
  }
  const family = (binding?.family ?? '').toLowerCase();
  if (family) {
    if (family === 'claude') return true;
    if (['codex', 'pi', 'agy', 'openai', 'gemini'].includes(family)) return false;
  }
  const executorId = binding?.executor ?? 'claude';
  const exec = runnerConfig?.executors?.[executorId];
  if (exec) {
    const prov = (exec.providerModel || exec.provider || '').toLowerCase();
    if (prov) {
      if (prov === 'claude') return true;
      if (['codex', 'pi', 'agy', 'openai', 'gemini'].includes(prov)) return false;
    }
    if (exec.command) {
      const base = path.basename(String(exec.command)).toLowerCase();
      if (base === 'claude') return true;
      if (['codex', 'pi', 'agy'].includes(base)) return false;
    }
    if (Array.isArray(exec.invocations) && exec.invocations.length > 0) {
      const inv = exec.invocations.find((i) => !binding?.invocation || i.id === binding?.invocation) ?? exec.invocations[0];
      if (inv?.command) {
        const base = path.basename(String(inv.command)).toLowerCase();
        if (base === 'claude') return true;
        if (['codex', 'pi', 'agy'].includes(base)) return false;
      }
    }
  }
  return executorId === 'claude';
}

export function mergeStatusLineSettings(args = []) {
  const result = [...args];
  const STATUS_LINE = {
    type: 'command',
    command: STATUS_LINE_COMMAND,
  };
  const idx = result.findIndex((a) => a === '--settings' || (typeof a === 'string' && a.startsWith('--settings=')));
  if (idx >= 0) {
    if (result[idx].startsWith('--settings=')) {
      const raw = result[idx].slice('--settings='.length);
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch {}
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsed.statusLine = STATUS_LINE;
        result[idx] = `--settings=${JSON.stringify(parsed)}`;
      }
    } else if (idx + 1 < result.length) {
      const raw = result[idx + 1];
      let parsed = null;
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        parsed = { ...raw };
      } else if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw); } catch {}
      }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parsed.statusLine = STATUS_LINE;
        result[idx + 1] = JSON.stringify(parsed);
      }
    }
  } else {
    result.push('--settings', JSON.stringify({ statusLine: STATUS_LINE }));
  }
  return result;
}

export function withHeadSettings(runnerConfig, binding) {
  if (!isClaudeCodeBinding(binding, runnerConfig)) {
    return runnerConfig;
  }
  const executorId = binding?.executor ?? 'claude';
  const exec = runnerConfig?.executors?.[executorId];
  if (!exec || !Array.isArray(exec.invocations) || exec.invocations.length === 0) {
    return runnerConfig;
  }
  const invocationId = binding?.invocation;
  const hasMatch = invocationId
    ? exec.invocations.some((inv) => inv?.id === invocationId)
    : true;
  if (!hasMatch) {
    return runnerConfig;
  }
  const cfg = structuredClone(runnerConfig);
  const targetExec = cfg.executors[executorId];
  for (const inv of targetExec.invocations) {
    if (!invocationId || inv?.id === invocationId) {
      inv.args = mergeStatusLineSettings(inv.args);
    }
  }
  return cfg;
}

/**
 * Binds a seat and launches the head of `persona` and `name` as a confined supervised attempt: the one launch path
 * of a head, with no check of who holds the role and no record of where it went. `startHeadSession` calls it for a
 * start; the rotation executor calls it for a successor while the predecessor still holds the role, and records the
 * placement itself once the predecessor is gone.
 *
 * `gen` is the generation of the lineage (absent: the first unused one); `forQuestion` is the id of an owner question the
 * new head continues (one more opening line); `beside` is the live key of the session whose
 * tab the new one opens next to. `ports` as for `startHeadSession` (`taskOfHead(projectRoot, persona, name) -> { dir, path } | null`, `planOfHead(projectRoot, persona, name) -> { dir }` for a lead, `pin`, `handoff`, `opening`, `runnerConfig`, `bind`,
 * `launch`, `ensureWorktree({ projectRoot, path, branch }) -> { path }` for a shaper's discussion worktree). Returns `{ role, gen, key, placement, runDir, cli, persona }`; a refusal throws `HeadStartError`.
 */
export async function placeHead({ persona, name, projectRoot, beside = null, gen = null, forQuestion = null } = {}, ports = {}) {
  assertHeadArgs({ persona, name, projectRoot, gen, forQuestion });
  const role = headRoleOf(persona, name);
  const generation = gen ?? nextHeadGeneration(projectRoot, persona, name);
  const key = headKeyOf(persona, name, generation);
  let grant;
  let task = null;
  try {
    // The task is resolved here, before anything is launched or recorded (a start and a rotation take the same path). A lead writes only its plan directory, because the grant table reads no files.
    task = await (ports.taskOfHead ?? ((root, p, n) => taskOfHead(root, p, n, { planOfHead: ports.planOfHead })))(projectRoot, persona, name);
    grant = grantOf(role, persona, { planDir: persona === 'lead' ? task.dir : null });
  } catch (err) { throw new HeadStartError(persona === 'lead' ? 'grant-invalid' : (err.code ?? 'task-not-found'), err.message); }
  // A shaper works in its own linked worktree on the discussion branch; a rotation successor finds it registered and reuses it.
  let workdir = null;
  if (persona === 'shaper') {
    const wanted = { projectRoot, path: discussionWorktreeOf(projectRoot, task.dir), branch: discussionBranchOf(task.dir) };
    const ensured = await (ports.ensureWorktree ?? defaultEnsureWorktree)(wanted);
    workdir = ensured?.path ?? wanted.path;
  }
  const pinned = await (ports.pin ?? defaultPin)({ persona, projectRoot });
  const handoff = await (ports.handoff ?? defaultHandoff)({ persona, name, projectRoot });
  const runnerConfig = await (ports.runnerConfig ?? defaultRunnerConfig)(projectRoot);
  const binding = await (ports.bind ?? bindHeadSeat)({ persona, key, runnerConfig, runtimeDir: ports.runtimeDir });
  const startRequest = headStartRequest({ persona, name, projectRoot, cli: binding.cli ?? 'claude', handoff, forQuestion, task });
  const text = await (ports.opening ?? defaultOpening)({ projectRoot, request: startRequest, pinned });
  const launchRunnerConfig = withHeadSettings(runnerConfig, binding);

  const request = {
    binding, runnerConfig: launchRunnerConfig, key, role, grant, opening: text, ceilingMs: HEAD_HARD_CEILING_MS,
    // The sandbox gives every launch a private writable tmpfs at /tmp (bwrap driver `--tmpfs /tmp`), so /tmp is the head's own scratch, not the shared one.
    env: { TMPDIR: '/tmp', FGOS_HEAD_ROLE: role, FGOS_HEAD_PROJECT_ROOT: path.resolve(projectRoot), FGOS_HEAD_PERSONA: persona, FGOS_HEAD_NAME: name, FGOS_HEAD_GEN: String(generation) },
    projectRoot, beside, display: { role: persona, title: subjectOfHead(persona, name, task) },
    ...(workdir ? { workdir } : {}),
  };
  let launched;
  try {
    launched = ports.launch ? await ports.launch(request) : await defaultLaunch(request);
  } catch (err) {
    const unbound = roleRefusalOf(projectRoot, key);
    if (unbound) throw new HeadStartError(unbound.code, `${role} was not started: ${unbound.why}`, { cause: err });
    throw new HeadStartError('start-refused', `${role} was not started: ${err.message}`, { cause: err, refusal: err.refusal ?? null });
  }
  return { role, gen: generation, key: launched.placement.key, placement: launched.placement, runDir: launched.runDir, cli: binding.cli ?? null, persona: pinned.name ?? persona };
}

/**
 * Starts the head session of `persona` and `name`, or fronts the live one.
 *
 * `ports` (all optional, for the rotation executor and for tests): `host` (Session Host client, for fronting),
 * `identity({ role, projectRoot }) -> { live, record }` (`record.ids.terminal.key` is the slot a live head is fronted by), `rotationHolds({ persona, name }) -> boolean`, and those of `placeHead`.
 *
 * Returns `{ already: true, role, key, fronted }` for a role a live session holds, else
 * `{ already: false, role, key, placement, runDir, cli }`. A refusal throws `HeadStartError` with a code.
 */
export async function startHeadSession({ persona, name, projectRoot, beside = null, gen = null, forQuestion = null } = {}, ports = {}) {
  assertHeadArgs({ persona, name, projectRoot, gen, forQuestion });
  const role = headRoleOf(persona, name);
  if (ports.rotationHolds?.({ persona, name })) {
    throw new HeadStartError('rotation-in-progress', `a rotation of ${persona}-${name} holds its lock; start nothing until it ends`);
  }

  const lineageDir = lineageDirOf(projectRoot, persona, name);
  const host = ports.host ?? createSessionHost();
  const holder = await (ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot)))({ role, projectRoot });
  if (holder.live) {
    // One live head per persona-name: bring it to the front. Its slot key is in its Identity record (the
    // `terminal` group its supervisor wrote), so the head that holds the role is the one fronted.
    const key = slotKeyOf(holder.record);
    if (!key) throw new HeadStartError('placement-unknown', `${role} is live but its Identity record names no terminal slot (a head started before its supervisor recorded one); front it by hand`);
    const answer = host.front({ host: 'terminal', key });
    if (answer.result !== 'fronted') throw new HeadStartError('front-refused', `${role} is live but could not be fronted: ${answer.code ?? answer.result}${answer.detail ? ` (${answer.detail})` : ''}`);
    return { already: true, role, key, fronted: true };
  }

  const placed = await placeHead({ persona, name, projectRoot, beside, gen, forQuestion }, ports);
  writeHeadPlacement(lineageDir, { role, gen: placed.gen, placement: placed.placement, runDir: placed.runDir, persona: placed.persona, startedAt: new Date().toISOString() });
  return { already: false, role, key: placed.key, placement: placed.placement, runDir: placed.runDir, cli: placed.cli };
}
