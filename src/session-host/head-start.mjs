// head-start.mjs -- the use case behind a head session's start.
//
// A head session is one long-lived interactive agent for a persona and a name (`head:<persona>-<name>`).
// Starting it is: refuse a bad name, front the live session of that role instead of starting a second one,
// otherwise bind a seat at the persona's tier and launch it as a confined supervised attempt (the same door a
// worker attempt goes through) with the opening text typed visibly into the composer, and remember where it is.
// Identity owns who holds the role: the run supervisor registers the session there, so this module never writes
// it. What the role may write comes from the grant table (`grantOf`). Everything it needs from a layer above
// (binding, the launch, the opening text) comes in through `ports`, whose defaults load the runner lazily; the
// rotation lock is the rotation executor's, so it arrives as `ports.rotationHolds`.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { replaceDurably } from '../native/door.mjs';
import { createSessionHost } from './client.mjs';
import { grantOf } from './head-grants.mjs';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';

const PERSONA_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const NAME_PATTERN = /^[a-z0-9-]{1,32}$/;
const PLACEMENT_FILE = 'placement.json';
const FILE_MODE = 0o600;

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
export const headKeyOf = (persona, name, gen) => `head-${persona}-${name}-${gen}`;

/** The folder the lineage of one persona-name keeps its runtime files in (handoffs, the live placement). */
export const lineageDirOf = (projectRoot, persona, name) => path.join(projectRoot, '.fgos', 'runtime', 'session-rotation', `${persona}-${name}`);

function readPlacement(dir) {
  try {
    const record = JSON.parse(fs.readFileSync(path.join(dir, PLACEMENT_FILE), 'utf8'));
    return record?.placement?.key ? record : null;
  } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return null;
    throw err;
  }
}

function writePlacement(dir, record) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  replaceDurably(dir, PLACEMENT_FILE, `${JSON.stringify(record)}\n`, FILE_MODE);
}

// ---- default ports ------------------------------------------------------------------------------

/**
 * Whether a live session of this machine holds the role: `fgos identity resolve <role>` names exactly one live
 * session or refuses [not-found]. Identity stays the only authority for who is alive; nothing is cached here.
 */
function identityHolder(role, projectRoot) {
  const { bin } = resolveActiveHostBin();
  if (!bin) throw new HeadStartError('identity-unavailable', 'no fgos host binary found to ask Identity who holds the role');
  const res = spawnSync(bin, ['identity', 'resolve', role, '--json'], { cwd: projectRoot, env: routeEnv(), encoding: 'utf8', timeout: 20_000 });
  if (res.error) throw new HeadStartError('identity-unavailable', `Identity did not answer: ${res.error.message}`);
  const text = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  if (res.status === 0) {
    let answer = null;
    try { answer = JSON.parse(res.stdout); } catch { /* the exit code is the answer */ }
    return { live: true, session: answer?.data?.id ?? answer?.id ?? null };
  }
  if (/not-found/.test(text)) return { live: false };
  throw new HeadStartError('identity-unavailable', `Identity refused the lookup of ${role}: ${text.trim().slice(0, 300)}`);
}

/** The opening a head session is typed: its persona section, the skills line the persona carries, and the start ritual. */
async function defaultOpening({ persona, name, projectRoot, pinned, handoff }) {
  const { renderPersonaSection } = await import('../runner/agent-definitions.mjs');
  return openingText({ persona, name, personaLines: renderPersonaSection(persona, { projectRoot, pinnedText: pinned.text }), handoff });
}

/** Pure: the opening text from its parts, so a test reads the exact words a head is given. */
export function openingText({ persona, name, personaLines, handoff = null }) {
  return [
    ...personaLines,
    '',
    `You are the long-lived head session "${name}" (role ${headRoleOf(persona, name)}).`,
    '',
    '# Start ritual',
    handoff
      ? `1. Read the latest handoff of this session first: ${handoff.path}. It describes state as it was; verify it against the repo before acting.`
      : '1. There is no earlier handoff for this session; start from the portfolio.',
    '2. Read the portfolio: `fgos questions` for the owner questions still open, and docs/backlog.md for the work in flight.',
    '3. Say in one line which pending question you resumed, or that none is pending.',
  ].join('\n');
}

/**
 * The binding of a head seat: one interactive seat asked for under the persona, so the crate takes the tier from
 * `runner.personas.<persona>.tier`, else `defaults.tier` (a persona names no model). A head lives in a pane, so the seat is
 * asked for with herdr present: the executor's pane invocation, never its headless one. A refusal throws.
 */
export async function bindHeadSeat({ persona, key, runnerConfig }) {
  const { bind } = await import('../runner/execution/bind.mjs');
  const binding = bind(
    { unit: { id: key, capability: 'execute', rigor: 'standard', writes: [] }, seat: 'producer', role: 'producer', persona, readOnly: true, raiseAuthorized: false },
    { runnerConfig, session: { headless: false, herdrPresent: true, postureAtLaunch: true } },
  );
  if (binding.refused) {
    throw new HeadStartError('bind-refused', `no seat can serve persona "${persona}": ${binding.refused.reason}: ${binding.refused.detail}${binding.refused.fix ? `; ${binding.refused.fix}` : ''}`);
  }
  return binding;
}

/** The launch of a head: one supervised terminal attempt, loaded lazily so this module does not pull in the runner. */
async function defaultLaunch(request) {
  const { launchSessionAttempt } = await import('../runner/dispatch/session-attempt.mjs');
  return launchSessionAttempt(request);
}

async function defaultRunnerConfig(projectRoot) {
  const { loadRunnerConfigForDir } = await import('../runner/dispatch/config.mjs');
  return loadRunnerConfigForDir(projectRoot);
}

/** The generation a start without one takes: the first whose attempt directory does not exist yet. */
function nextGeneration(projectRoot, persona, name) {
  let gen = 1;
  while (fs.existsSync(path.join(projectRoot, '.fgos', 'assignments', headKeyOf(persona, name, gen)))) gen += 1;
  return gen;
}

async function defaultPin({ persona, projectRoot }) {
  const { pinPersona } = await import('../runner/agent-definitions.mjs');
  return pinPersona(persona, { projectRoot });
}

async function defaultHandoff({ persona, name, projectRoot }) {
  const { readLatestHandoff } = await import('../session-rotation/handoff-store.mjs');
  return readLatestHandoff({ fgosDir: path.join(projectRoot, '.fgos'), persona, name });
}

// ---- the use case -------------------------------------------------------------------------------

/**
 * Starts the head session of `persona` and `name`, or fronts the live one.
 *
 * `gen` is the generation of the lineage (a rotation successor is the next one; absent, the first unused one); `beside`
 * is the live key of the session whose tab the successor opens next to. `ports` (all optional, for the rotation
 * executor and for tests): `host` (Session Host client, for fronting), `identity({ role, projectRoot }) -> { live }`,
 * `pin`, `handoff`, `opening`, `runnerConfig(projectRoot)`, `bind({ persona, key, runnerConfig })`,
 * `launch(request) -> { placement, runDir }`, `rotationHolds({ persona, name }) -> boolean`.
 *
 * Returns `{ already: true, role, key, fronted }` for a role a live session holds, else
 * `{ already: false, role, key, placement, runDir, cli }`. A refusal throws `HeadStartError` with a code.
 */
export async function startHeadSession({ persona, name, projectRoot, beside = null, gen = null } = {}, ports = {}) {
  if (!PERSONA_PATTERN.test(persona ?? '')) throw new HeadStartError('bad-persona', `persona must be an agent name (a-z, 0-9, hyphen; starts with a letter), got ${JSON.stringify(persona)}`);
  if (!NAME_PATTERN.test(name ?? '')) throw new HeadStartError('bad-name', `name must be 1 to 32 characters of a-z, 0-9 and hyphen, got ${JSON.stringify(name)}`);
  if (typeof projectRoot !== 'string' || projectRoot === '') throw new HeadStartError('bad-project-root', 'projectRoot is required');
  if (gen !== null && (!Number.isInteger(gen) || gen < 1)) throw new HeadStartError('bad-generation', `gen must be a positive integer, got ${JSON.stringify(gen)}`);

  const role = headRoleOf(persona, name);
  if (ports.rotationHolds?.({ persona, name })) {
    throw new HeadStartError('rotation-in-progress', `a rotation of ${persona}-${name} holds its lock; start nothing until it ends`);
  }

  const lineageDir = lineageDirOf(projectRoot, persona, name);
  const host = ports.host ?? createSessionHost();
  const holder = (ports.identity ?? ((ask) => identityHolder(ask.role, ask.projectRoot)))({ role, projectRoot });
  if ((await holder).live) {
    // One live head per persona-name: bring it to the front. Terminal Control offers no lookup by key prefix, so the
    // live key was kept in the lineage folder when it was placed.
    const known = readPlacement(lineageDir);
    if (!known) throw new HeadStartError('placement-unknown', `${role} is live but its placement is not recorded under ${lineageDir}; front it by hand`);
    const answer = host.front(known.placement);
    if (answer.result !== 'fronted') throw new HeadStartError('front-refused', `${role} is live but could not be fronted: ${answer.code ?? answer.result}${answer.detail ? ` (${answer.detail})` : ''}`);
    return { already: true, role, key: known.placement.key, fronted: true };
  }

  const generation = gen ?? nextGeneration(projectRoot, persona, name);
  const key = headKeyOf(persona, name, generation);
  let grant;
  try { grant = grantOf(role, persona); } catch (err) { throw new HeadStartError('grant-invalid', err.message); }
  const pinned = await (ports.pin ?? defaultPin)({ persona, projectRoot });
  const handoff = await (ports.handoff ?? defaultHandoff)({ persona, name, projectRoot });
  const text = await (ports.opening ?? defaultOpening)({ persona, name, projectRoot, pinned, handoff });
  const runnerConfig = await (ports.runnerConfig ?? defaultRunnerConfig)(projectRoot);
  const binding = await (ports.bind ?? bindHeadSeat)({ persona, key, runnerConfig });

  const request = {
    binding, runnerConfig, key, role, grant, opening: text, ceilingMs: HEAD_HARD_CEILING_MS,
    env: { FGOS_HEAD_ROLE: role, FGOS_HEAD_GEN: String(generation) },
    projectRoot, beside, display: { id: name, title: persona },
  };
  let launched;
  try {
    launched = ports.launch ? await ports.launch(request) : await defaultLaunch(request);
  } catch (err) {
    throw new HeadStartError('start-refused', `${role} was not started: ${err.message}`, { cause: err, refusal: err.refusal ?? null });
  }
  writePlacement(lineageDir, { role, gen: generation, placement: launched.placement, persona: pinned.name ?? persona, startedAt: new Date().toISOString() });
  return { already: false, role, key: launched.placement.key, placement: launched.placement, runDir: launched.runDir, cli: binding.cli ?? null };
}
