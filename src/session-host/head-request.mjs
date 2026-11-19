// head-request.mjs -- a head session asks the host for a verb through its one request socket.
//
// A confined head cannot reach herdr, so it cannot start another session itself, and it cannot write the rotation
// files either. Its own run supervisor listens on one socket that the sandbox gets read-only
// (`packages/run-supervisor/contracts/head-request.v1.json`), checks who asks and what the role may ask for, and runs
// the verb outside the sandbox through `fgos internal head-request`, which execs `runHeadRequest` below. Both ends of
// the transport live here: the client the head calls lives in `head-request-client.mjs`; here are the one branch a caller
// uses per verb (`startHead`, `rotateHead`: through the socket when confined, otherwise straight into the use case)
// and the payload entry the supervisor's route child runs. `startHeadSession` stays the one place a head is started
// and `requestRotation` the one entry that asks for a rotation; the socket is only a way to reach them.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CONFINED_MARKER_ENV } from '../config/facade.mjs';
import { HEAD_REQUEST_SOCKET_ENV } from './head-grants.mjs';
import { HEAD_ANSWERED_VERB, HEAD_LAND_VERB, HEAD_QUESTIONS_ACK_VERB, HEAD_QUESTIONS_ANSWER_VERB, HEAD_QUESTIONS_ASK_VERB, HEAD_QUESTIONS_CANCEL_VERB, HEAD_REQUEST_RESULT_VERB, HEAD_RESTORE_VERB, HEAD_ROTATE_VERB, HEAD_RUN_VERB, HEAD_START_VERB, HEAD_STOP_VERB, HEAD_SUPERVISOR_DONE_VERB, HEAD_SUPERVISOR_HANDLED_VERB, HEAD_WORKTREE_CREATE_VERB, MAX_REQUEST_BYTES, PROTOCOL, requestHeadRotate, requestHeadStart } from './head-request-client.mjs';
import { assertHeadArgs, headRoleOf, startHeadSession } from './head-start.mjs';
import { HeadPlanError, isPlanHeadName, planOfHead } from './head-plan.mjs';
import { stopHeadSession } from './head-stop.mjs';
import { spawnDetachedCli } from '../util/spawn-detached-fgos.mjs';
import { judge, observe, selfRecord } from '../native/process-identity.mjs';
import { fgosDirFromRoot } from '../util/fgos-file-registry.mjs';
import { assignmentDir } from '../runner/dispatch/assignment-layout.mjs';
import { canonicalizeWriteEntry, matchesWriteScope } from '../runner/dispatch/write-scope.mjs';
import { readStoredUnitSummary } from '../runner/execution/unit-summary.mjs';
import { unitRunFacts } from '../runner/execution/unit-run-record.mjs';
import { installOnce, replaceDurably } from '../native/door.mjs';
import { markSuccessorAnswered, requestRotation, rotationHolds } from '../session-rotation/rotate.mjs';

const confined = (env) => env[CONFINED_MARKER_ENV] === '1';
// `projectRoot` is a path or a function that finds it; only the unconfined branch resolves it, because the lookup probes
// git and writes under the state root, which a sandbox keeps read-only.
const rootOf = (projectRoot) => (typeof projectRoot === 'function' ? projectRoot() : projectRoot);

/**
 * The one door to start a head, whoever asks. A confined session (`FGOS_CONFINED=1`, which the launch door sets in
 * every sandboxed agent) sends the request through its socket; anyone else calls `startHeadSession` directly. The
 * confinement fact is that marker alone, never the socket variable or a masked path: a confined worker has no socket
 * and is refused `no-request-socket`. `args` is `{ persona, name, beside?, forQuestion?, projectRoot? }`; `projectRoot` (a path or a resolver function) is used only
 * outside the sandbox (the supervisor starts a confined caller's head in its own project).
 */
export async function startHead({ persona, name, beside = null, forQuestion = null, projectRoot } = {}, { env = process.env, ports = {}, request = requestHeadStart } = {}) {
  if (confined(env)) {
    return request({ persona, name, ...(beside ? { beside } : {}), ...(forQuestion ? { forQuestion } : {}) }, { socketPath: env[HEAD_REQUEST_SOCKET_ENV] });
  }
  return startHeadSession({ persona, name, beside, forQuestion, projectRoot: rootOf(projectRoot) }, ports);
}

/**
 * The one door to ask for a rotation, whoever asks: a confined head sends `session rotate` through its socket, anyone else
 * calls `requestRotation` directly (`projectRoot` is then required). Returns `{ started, ... }` as `requestRotation` does.
 */
export async function rotateHead({ persona, name, reason, stopFacts, projectRoot } = {}, { env = process.env, ports = {}, request = requestHeadRotate } = {}) {
  if (confined(env)) {
    return request({ persona, name, reason, ...(stopFacts ? { stopFacts } : {}) }, { socketPath: env[HEAD_REQUEST_SOCKET_ENV] });
  }
  return requestRotation({ persona, name, reason, stopFacts, projectRoot: rootOf(projectRoot) }, ports);
}

// ---- the payload entry the supervisor's route child runs ------------------------------------------

const emit = (line) => process.stdout.write(`${JSON.stringify({ v: 1, protocol: PROTOCOL, ...line })}\n`);

function readEnvelope(runDir) {
  const envelope = JSON.parse(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8'));
  if (envelope?.v !== 3 || typeof envelope.cwd !== 'string' || envelope.session == null) throw Object.assign(new Error('the envelope is not a session attempt'), { code: 'envelope-invalid' });
  return envelope;
}

const badArgs = (message) => Object.assign(new Error(message), { code: 'bad-args' });

function exactKeys(args, allowed) {
  for (const key of Object.keys(args)) if (!allowed.includes(key)) throw badArgs(`unknown argument ${JSON.stringify(key)}`);
}

/** A lineage verb names `persona` and `name`; they must spell the envelope's own role, so a head acts on its lineage only. */
function ownLineage(args, envelope) {
  if (headRoleOf(args.persona, args.name) !== envelope.session.role) {
    throw Object.assign(new Error(`persona and name do not name this session's role ${envelope.session.role}`), { code: 'role-mismatch' });
  }
}

/** Slightly under the supervisor's 60 s verb bound, so this error, not a kill, is what the head reads. */
const QUESTIONS_TIMEOUT_MS = 55_000;

/**
 * The `questions *` verbs are served by the host: `fgos internal head-questions --run-dir <dir>` reads the envelope
 * itself, takes the asker from it and runs the question use case, so this payload carries the request and nothing
 * else. Returns the route's `data`; a refusal throws with the route's own code.
 */
function callHeadQuestions({ hostBin, runDir, cwd, request }) {
  const run = spawnSync(hostBin, ['internal', 'head-questions', '--run-dir', runDir], {
    input: JSON.stringify({ v: 1, verb: request.verb, args: request.args }), cwd, encoding: 'utf8', timeout: QUESTIONS_TIMEOUT_MS, maxBuffer: MAX_REQUEST_BYTES,
  });
  const lastLine = (run.stdout ?? '').trim().split('\n').filter(Boolean).pop() ?? '';
  let line;
  try { line = JSON.parse(lastLine); } catch { line = null; }
  if (line?.result === 'done') return line.data ?? {};
  if (line?.result === 'error') throw Object.assign(new Error(String(line.message ?? 'refused')), { code: String(line.code ?? 'internal') });
  throw Object.assign(new Error(run.error ? String(run.error.message) : `the questions route ended with exit ${run.status}`), { code: 'internal' });
}

// ---- ticket verbs, `request result`, and the host verbs ---------------------------------------------

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;
const SELF_PATH = fileURLToPath(import.meta.url);
const HOST_VERB_TIMEOUT_MS = 55_000;
const RESULT_WAIT_MAX_S = 50;
const RESULT_POLL_MS = 200;
const RESULT_MAX_CHARS = 20_000;
const LIST_MAX = 50;
const RUNNER_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const STOP_WAIT_MS = 15_000;
const STOP_GRACE_MS = 1_000;

/** A value that becomes one argv token of a host verb must not read as an option: refused `bad-args` when it starts with `-`. */
const noDash = (key, value) => {
  if (typeof value === 'string' && value.startsWith('-')) throw badArgs(`${key} must not start with "-"`);
};
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x !== '');
const roleErr = (message) => Object.assign(new Error(message), { code: 'role-mismatch' });
const personaOf = (envelope) => envelope.session.persona ?? null;

/** A plain project-relative path: no empty, `.` or `..` segment, not absolute. */
const plainEntry = (p) => typeof p === 'string' && p !== '' && !path.isAbsolute(p) && !p.includes('\\') && !p.includes(',') && !p.split('/').some((seg) => seg === '..');
const plainRelative = (p) => typeof p === 'string' && p !== '' && !path.isAbsolute(p) && !p.includes('\\') && !p.includes(',') && !p.split('/').some((seg) => seg === '' || seg === '.' || seg === '..');
const inGrant = (p, writes) => plainRelative(p) && writes.some((w) => p === w || p.startsWith(`${w.replace(/\/+$/, '')}/`));
const hasGlob = (segment) => segment.includes('*');

/**
 * Whether the footprint entry `f` contains every path the requested write entry `e` can name. A literal `e` is asked of the
 * repo's write-scope matcher itself. A glob `e` is contained when `f` is a plain path above its first glob, when `f` is a
 * plain prefix followed by one trailing `**`, or when `f` is the same entry; a glob that only looks alike (`src/*` against
 * `src/**`) never covers it.
 */
function entryWithin(e, f) {
  const es = canonicalizeWriteEntry(e).split('/');
  const fs_ = canonicalizeWriteEntry(f).split('/');
  if (!es.some(hasGlob)) return matchesWriteScope(es.join('/'), [f]) && matchesWriteScope(`${es.join('/')}/x`, [f]);
  if (es.join('/') === fs_.join('/')) return true;
  const firstGlob = fs_.findIndex(hasGlob);
  const prefix = firstGlob === -1 ? fs_ : fs_.slice(0, firstGlob);
  const openEnded = firstGlob === -1 || (firstGlob === fs_.length - 1 && fs_[firstGlob] === '**');
  return openEnded && prefix.length <= es.length && prefix.every((seg, k) => seg === es[k]);
}

/** Whether the footprint covers a requested write entry (a path, a directory or a glob). */
const covered = (p, footprint) => {
  if (!plainEntry(p)) return false;
  try { return footprint.some((f) => entryWithin(p, f)); } catch { return false; }
};

const planOfCaller = (envelope, projectRoot, ports) => (ports.planOf ?? ((root, persona, name) => planOfHead(root, persona, name, ports.plan ?? {})))(projectRoot, personaOf(envelope), envelope.session.name);

function hostBinOf(envelope) {
  const { hostBin } = envelope;
  if (typeof hostBin !== 'string' || hostBin === '') throw Object.assign(new Error('the envelope names no host binary'), { code: 'envelope-invalid' });
  return hostBin;
}

const lastJsonLine = (text) => {
  for (const line of String(text ?? '').trim().split('\n').reverse()) {
    try { const v = JSON.parse(line); if (v !== null && typeof v === 'object') return v; } catch { /* not the JSON line */ }
  }
  return null;
};

/**
 * Runs one host verb inside the verb limit and returns its JSON `data` (or the whole line). A non-zero exit throws with the
 * line's own `code` (or `host-failed`); `ports.hostCall({ hostBin, cwd, argv })` replaces the process in a test.
 */
function hostCall({ envelope, projectRoot, argv }, ports) {
  const call = { hostBin: hostBinOf(envelope), cwd: projectRoot, argv };
  const run = ports.hostCall ? ports.hostCall(call) : spawnSync(call.hostBin, argv, { cwd: projectRoot, encoding: 'utf8', timeout: HOST_VERB_TIMEOUT_MS, maxBuffer: MAX_REQUEST_BYTES });
  const line = lastJsonLine(run.stdout);
  if (run.status === 0) return line?.data ?? line ?? {};
  const code = line?.code ?? line?.error?.code;
  throw Object.assign(new Error(String(line?.message ?? line?.error?.message ?? run.error?.message ?? `the host verb ended with exit ${run.status}`).slice(0, 500)), { code: /^[a-z][a-z0-9-]*$/.test(code ?? '') ? code : 'host-failed' });
}

// -- tickets

const HEAD_ROLE_PATTERN = /^head:[a-z][a-z0-9-]*$/;
const ticketDirOf = (projectRoot, role) => {
  if (typeof role !== 'string' || !HEAD_ROLE_PATTERN.test(role)) throw Object.assign(new Error(`${JSON.stringify(role)} is not a head role`), { code: 'bad-role' });
  return path.join(fgosDirFromRoot(projectRoot), 'runtime', 'head-tickets', role.replace(/^head:/, ''));
};

function writeTicket(file, ticket, { exclusive = false } = {}) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const bytes = `${JSON.stringify(ticket)}\n`;
  if (!exclusive) {
    replaceDurably(dir, path.basename(file), bytes, 0o600);
  } else if (installOnce(dir, path.basename(file), bytes, 0o600) === 'already-exists') {
    throw Object.assign(new Error(`ticket ${ticket.id} already exists`), { code: 'ticket-used' });
  }
}

const readTicketFile = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return null;
    throw err;
  }
};

function spawnRunner({ ticketFile, cwd }) {
  const env = { ...process.env };
  delete env.FGOS_DISPATCH_DEPTH;
  return spawnDetachedCli({ args: ['--ticket', ticketFile], cliPath: SELF_PATH, cwd, env });
}

function spawnStopSelf({ persona, name, projectRoot }) {
  return spawnDetachedCli({ args: ['--stop-self', '--persona', persona, '--name', name, '--project-root', projectRoot, '--wait-pid', String(process.pid)], cliPath: SELF_PATH, cwd: projectRoot });
}

/**
 * Writes the ticket of a long verb and starts its detached runner; answers at once. The request id is the ticket id; a
 * second ticket with the same id is `ticket-used`. The runner (`runTicket`) is the file's only writer after this.
 */
function startTicket({ id, verb, argv, envelope, projectRoot, ports }) {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw badArgs('the request id is not a ticket id');
  const file = path.join(ticketDirOf(projectRoot, envelope.session.role), `${id}.json`);
  const ticket = { id, verb, state: 'running', runner: null, startedAt: new Date().toISOString(), hostBin: hostBinOf(envelope), argv, cwd: projectRoot };
  writeTicket(file, ticket, { exclusive: true });
  const started = (ports.spawnRunner ?? spawnRunner)({ ticketFile: file, cwd: projectRoot });
  if (!started?.pid) {
    writeTicket(file, { ...ticket, state: 'failed', code: 'spawn-failed', endedAt: new Date().toISOString() });
    throw Object.assign(new Error(`the runner of ticket ${id} did not start: ${started?.error ?? 'no pid'}`), { code: 'spawn-failed' });
  }
  // The runner's identity is on the ticket before the reply, so a runner that dies at once still reads `failed`/`runner-gone`.
  const identity = (ports.observe ?? observe)(started.pid);
  const current = readTicketFile(file);
  if (identity && current?.state === 'running' && !current.runner) writeTicket(file, { ...current, runner: identity });
  return { ticket: id, state: 'running' };
}

async function landVerb({ args, envelope, projectRoot, id, ports }) {
  exactKeys(args, ['branch', 'paths', 'tests', 'message']);
  const { branch, paths, tests, message } = args;
  if ((branch === undefined) === (paths === undefined)) throw badArgs('exactly one of branch and paths');
  if (tests !== undefined && !isStringArray(tests)) throw badArgs('tests must be an array of strings');
  if (message !== undefined && (typeof message !== 'string' || message === '')) throw badArgs('message must be a non-empty string');
  noDash('branch', branch);
  noDash('message', message);
  for (const t of tests ?? []) noDash('tests', t);
  for (const p of Array.isArray(paths) ? paths : []) noDash('paths', p);
  const argv = ['land', '--json'];
  const writes = envelope.session.writes ?? [];
  const lead = personaOf(envelope) === 'lead';
  if (branch !== undefined) {
    if (typeof branch !== 'string' || !REF_PATTERN.test(branch)) throw badArgs('branch must be a branch name');
    if (!lead) throw Object.assign(new Error('only a lead lands a branch'), { code: 'land-branch-lead-only' });
    const plan = await planOfCaller(envelope, projectRoot, ports);
    if (plan.footprint.length === 0) throw Object.assign(new Error(`plan ${plan.dir} has no footprint, so a branch has nothing to be held to`), { code: 'write-outside-footprint' });
    argv.push('--branch', branch, '--footprint', plan.footprint.join(','));
  } else {
    if (!isStringArray(paths) || paths.length === 0) throw badArgs('paths must be a non-empty array of strings');
    if (message === undefined) throw badArgs('message is required with paths');
    for (const p of paths) {
      if (!inGrant(p, writes)) throw Object.assign(new Error(`${JSON.stringify(p)} lies outside the paths this role may write`), { code: 'path-outside-grant' });
    }
    argv.push('--paths', paths.join(','), '--message', message);
    if (lead) {
      // The land compares the plan files of its own commit with the trunk tip's footprint; the bound has to reach it.
      const plan = await planOfCaller(envelope, projectRoot, ports);
      if (plan.footprint.length === 0) throw Object.assign(new Error(`plan ${plan.dir} has no footprint, so a land has nothing to be held to`), { code: 'write-outside-footprint' });
      argv.push('--footprint', plan.footprint.join(','));
    }
  }
  for (const t of tests ?? []) argv.push('--test', t);
  return startTicket({ id, verb: HEAD_LAND_VERB, argv, envelope, projectRoot, ports });
}

async function runVerb({ args, envelope, projectRoot, id, ports }) {
  exactKeys(args, ['prompt', 'provider', 'capability', 'writes', 'worktree']);
  if (personaOf(envelope) !== 'lead') throw roleErr('only a lead runs');
  if (args.prompt === undefined) throw badArgs('prompt is required');
  for (const key of ['prompt', 'provider', 'capability', 'worktree']) {
    if (args[key] !== undefined && (typeof args[key] !== 'string' || args[key] === '')) throw badArgs(`${key} must be a non-empty string`);
    noDash(key, args[key]);
  }
  if (args.writes !== undefined && !isStringArray(args.writes)) throw badArgs('writes must be an array of strings');
  for (const p of args.writes ?? []) noDash('writes', p);
  const argv = ['run', '--json', args.prompt];
  if (args.writes?.length) {
    const plan = await planOfCaller(envelope, projectRoot, ports);
    for (const p of args.writes) {
      if (!covered(p, plan.footprint)) throw Object.assign(new Error(`${JSON.stringify(p)} is outside the footprint of plan ${plan.dir}`), { code: 'write-outside-footprint' });
    }
    argv.push('--writes', args.writes.join(','));
  }
  if (args.provider !== undefined) argv.push('--provider', args.provider);
  if (args.capability !== undefined) argv.push('--capability', args.capability);
  if (args.worktree !== undefined) argv.push('--worktree', args.worktree);
  return startTicket({ id, verb: HEAD_RUN_VERB, argv, envelope, projectRoot, ports });
}

const unitRunIdOf = (json, depth = 0) => {
  if (json === null || typeof json !== 'object' || depth > 6) return null;
  let found = typeof json.unitRunId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(json.unitRunId) ? json.unitRunId : null;
  for (const value of Object.values(json)) found = unitRunIdOf(value, depth + 1) ?? found;
  return found;
};

/**
 * The detached runner of one ticket (`head-request.mjs --ticket <file>`): records its own process identity, runs the host
 * verb to its end and rewrites the ticket `done` or `failed`. A `land` keeps the host's JSON, a `run` only its unitRunId.
 */
export function runTicket(file, ports = {}) {
  const ticket = readTicketFile(file);
  if (!ticket || ticket.state !== 'running') return null;
  writeTicket(file, { ...ticket, runner: (ports.selfRecord ?? selfRecord)() });
  const env = { ...process.env };
  delete env.FGOS_DISPATCH_DEPTH;
  const run = (ports.exec ?? spawnSync)(ticket.hostBin, ticket.argv, { cwd: ticket.cwd, env, encoding: 'utf8', timeout: RUNNER_TIMEOUT_MS, maxBuffer: MAX_REQUEST_BYTES });
  const line = lastJsonLine(run.stdout);
  const ok = run.status === 0;
  const done = { ...ticket, runner: (ports.selfRecord ?? selfRecord)(), state: ok ? 'done' : 'failed', exit: run.status, endedAt: new Date().toISOString() };
  if (!ok) done.code = /^[a-z][a-z0-9-]*$/.test(line?.code ?? '') ? line.code : `exit-${run.status ?? 'signal'}`;
  if (ticket.verb === HEAD_RUN_VERB) {
    const unitRunId = unitRunIdOf(line);
    if (unitRunId) done.unitRunId = unitRunId;
  } else if (line !== null) {
    done.result = JSON.stringify(line).length > RESULT_MAX_CHARS ? { truncated: true } : line;
  }
  delete done.argv;
  writeTicket(file, done);
  return done;
}

/** The outcome of a run, read from its assignment record through the Unit-run readers: whether it exists, is settled, and its summary outcome. */
function assignmentOf(projectRoot, unitRunId) {
  const fgosDir = fgosDirFromRoot(projectRoot);
  const facts = unitRunFacts(fgosDir, unitRunId);
  const view = { dir: `.fgos/assignments/${unitRunId}`, present: facts.exists, settled: facts.settled };
  if (!facts.exists) return view;
  try {
    const text = readStoredUnitSummary(assignmentDir(fgosDir, unitRunId));
    const summary = text === null ? null : JSON.parse(text);
    if (summary !== null) {
      view.outcome = summary.outcome ?? null;
      if (summary.settledAt) view.settledAt = summary.settledAt;
    }
  } catch { /* an unreadable summary leaves the outcome out: only positive evidence is shown */ }
  return view;
}

/** What `request result` shows of a ticket; a running one whose runner is judged dead reads failed, `runner-gone`. */
function viewOf(ticket, projectRoot, { withResult, judgeRunner }) {
  let { state, code } = ticket;
  if (state === 'running' && ticket.runner && judgeRunner(ticket.runner) === 'dead') { state = 'failed'; code = 'runner-gone'; }
  const view = { id: ticket.id, verb: ticket.verb, state, startedAt: ticket.startedAt };
  if (ticket.endedAt) view.endedAt = ticket.endedAt;
  if (ticket.exit !== undefined) view.exit = ticket.exit;
  if (code) view.code = code;
  if (ticket.unitRunId) {
    view.unitRunId = ticket.unitRunId;
    view.assignment = assignmentOf(projectRoot, ticket.unitRunId);
  }
  if (withResult && ticket.result !== undefined) view.result = ticket.result;
  return view;
}

/** The tickets of `role` under `projectRoot`: one ticket by `id` (waiting up to `wait` seconds while it runs), or the recent list. */
export async function requestResult({ projectRoot, role, id, wait }, ports = {}) {
  return readTickets({ args: { ...(id !== undefined ? { id } : {}), ...(wait !== undefined ? { wait } : {}) }, envelope: { session: { role } }, projectRoot, ports });
}

async function readTickets({ args, envelope, projectRoot, ports }) {
  exactKeys(args, ['id', 'wait']);
  if (args.wait !== undefined && !(typeof args.wait === 'number' && Number.isFinite(args.wait) && args.wait >= 0)) throw badArgs('wait must be a number of seconds');
  if (args.id !== undefined && typeof args.id !== 'string') throw badArgs('id must be a string');
  const dir = ticketDirOf(projectRoot, envelope.session.role);
  const judgeRunner = ports.judge ?? judge;
  if (args.id === undefined) {
    let names = [];
    try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.json')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
    const tickets = names.map((n) => readTicketFile(path.join(dir, n))).filter(Boolean)
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, LIST_MAX)
      .map((t) => viewOf(t, projectRoot, { withResult: false, judgeRunner }));
    return { tickets };
  }
  const file = path.join(dir, `${args.id}.json`);
  const unknown = () => Object.assign(new Error(`this role has no ticket ${JSON.stringify(args.id)}`), { code: 'ticket-unknown' });
  if (!ID_PATTERN.test(args.id)) throw unknown();
  const sleep = ports.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const until = Date.now() + Math.min(args.wait ?? 0, RESULT_WAIT_MAX_S) * 1000;
  for (;;) {
    const ticket = readTicketFile(file);
    if (!ticket) throw unknown();
    const view = viewOf(ticket, projectRoot, { withResult: true, judgeRunner });
    if (view.state !== 'running' || Date.now() >= until) return view;
    await sleep(RESULT_POLL_MS);
  }
}

// -- worktree create, session stop

function worktreeCreate({ args, envelope, projectRoot, ports }) {
  exactKeys(args, ['path', 'branch', 'base']);
  if (personaOf(envelope) !== 'lead') throw roleErr('only a lead creates worktrees');
  if (typeof args.path !== 'string' || args.path === '' || args.path.startsWith('-')) throw badArgs('path must be a path');
  if (typeof args.branch !== 'string' || !REF_PATTERN.test(args.branch)) throw badArgs('branch is required: a detached worktree is not this door\'s');
  if (args.base !== undefined && (typeof args.base !== 'string' || !REF_PATTERN.test(args.base))) throw badArgs('base must be a ref');
  const argv = ['worktree', 'create', args.path, '--branch', args.branch, ...(args.base ? ['--base', args.base] : []), '--json'];
  try {
    const answer = hostCall({ envelope, projectRoot, argv }, ports);
    return Object.keys(answer).length > 0 ? answer : { created: true };
  } catch (err) {
    if (err.code === 'host-failed') err.code = 'worktree-create-failed';
    throw err;
  }
}

/** The asker of an answered owner question holds `role`: the host's `questions --answered --json` rows carry `asker.roles`. A host failure surfaces with its own code. */
function askerAnswered({ envelope, projectRoot, role, ports }) {
  if (ports.askerAnswered) return ports.askerAnswered(role);
  const rows = hostCall({ envelope, projectRoot, argv: ['questions', '--answered', '--json'] }, ports);
  const list = Array.isArray(rows) ? rows : (rows.questions ?? []);
  return Array.isArray(list) && list.some((q) => Array.isArray(q?.asker?.roles) && q.asker.roles.includes(role));
}

async function stopVerb({ args, envelope, projectRoot, ports }) {
  exactKeys(args, ['persona', 'name', 'reason']);
  if (args.reason !== undefined && (typeof args.reason !== 'string' || args.reason.length > 200)) throw badArgs('reason must be a string of at most 200 characters');
  assertHeadArgs({ persona: args.persona, name: args.name, projectRoot });
  const role = headRoleOf(args.persona, args.name);
  const planHead = () => {
    try { return isPlanHeadName(projectRoot, args.persona, args.name, ports.plan ?? {}); } catch (err) {
      if (err instanceof HeadPlanError) return false; // a project without a handle has no plan heads; the other rules still apply
      throw err;
    }
  };
  const allowed = role === envelope.session.role || planHead() || askerAnswered({ envelope, projectRoot, role, ports });
  if (!allowed) throw roleErr(`${role} is not a lead or planner of this project, the asker of an answered question, or this session's own role`);
  return stopHeadSession({ persona: args.persona, name: args.name, projectRoot, reason: args.reason ?? null }, ports.stop ?? {});
}

/** The detached stop of the caller's own session: waits until the route that started it has exited, so the reply is out first. */
export async function runStopSelf({ persona, name, projectRoot, waitPid }, ports = {}) {
  const sleep = ports.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const watched = waitPid ? (ports.observe ?? observe)(waitPid) : null;
  const alive = ports.alive ?? (() => watched !== null && (ports.judge ?? judge)(watched) !== 'dead');
  const until = Date.now() + STOP_WAIT_MS;
  while (watched !== null && alive() && Date.now() < until) await sleep(100);
  await sleep(STOP_GRACE_MS);
  return stopHeadSession({ persona, name, projectRoot, reason: 'supervisor-done' }, ports.stop ?? {});
}

/**
 * Runs the verb of one request for the attempt in `runDir`, in this attempt's project: `session start`, `session rotate`,
 * `session answered`, `session restore role` (which only checks its arguments: the supervisor registers the role) or a
 * `questions *` verb (served by the host route, `ports.questions` replacing it in a test). Returns `{ exit, line }`: the one JSON line to print, `{result: 'done', data}` or
 * `{result: 'error', code, message}`, and the exit code (0 done, 70 error). Who may ask and for what was decided by
 * the supervisor before it ran this; the verb arguments are re-checked here because they come from the sandbox.
 * `session rotate` returns at once (the rotation runs detached); `session answered` is the one verb of a successor that does
 * not hold the role yet: it records the answer, and the supervisor moves the role after this line says done.
 */
export async function runHeadRequest({ runDir, request }, ports = {}) {
  try {
    const envelope = readEnvelope(runDir);
    const args = request?.args;
    if (args === null || typeof args !== 'object' || Array.isArray(args)) throw badArgs('args must be an object');
    const projectRoot = envelope.cwd;
    let data;
    switch (request?.verb) {
      case HEAD_START_VERB:
        exactKeys(args, ['persona', 'name', 'beside', 'forQuestion']);
        if (args.beside !== undefined && typeof args.beside !== 'string') throw badArgs('beside must be a string');
        if (args.forQuestion !== undefined && typeof args.forQuestion !== 'string') throw badArgs('forQuestion must be a string');
        data = await startHeadSession({ persona: args.persona, name: args.name, beside: args.beside ?? null, forQuestion: args.forQuestion ?? null, projectRoot }, {
          rotationHolds: (lineage) => rotationHolds({ projectRoot, ...lineage }), ...ports,
        });
        break;
      case HEAD_ROTATE_VERB: {
        exactKeys(args, ['persona', 'name', 'reason', 'stopFacts']);
        ownLineage(args, envelope);
        data = requestRotation({ persona: args.persona, name: args.name, reason: args.reason, stopFacts: args.stopFacts, projectRoot }, ports.rotation ?? {});
        break;
      }
      case HEAD_ANSWERED_VERB:
        exactKeys(args, ['persona', 'name', 'sessionId', 'rotationId', 'message']);
        ownLineage(args, envelope);
        data = markSuccessorAnswered({ projectRoot, persona: args.persona, name: args.name, key: envelope.unitRunId, sessionId: args.sessionId, rotationId: args.rotationId, message: args.message });
        break;
      case HEAD_RESTORE_VERB:
        exactKeys(args, ['persona', 'name']);
        ownLineage(args, envelope);
        data = {};
        break;
      case HEAD_QUESTIONS_ASK_VERB:
      case HEAD_QUESTIONS_ACK_VERB:
      case HEAD_QUESTIONS_CANCEL_VERB:
      case HEAD_QUESTIONS_ANSWER_VERB: {
        const { hostBin } = envelope;
        if (typeof hostBin !== 'string' || hostBin === '') throw Object.assign(new Error('the envelope names no host binary'), { code: 'envelope-invalid' });
        const call = { hostBin, runDir, cwd: projectRoot, request: { verb: request.verb, args } };
        data = ports.questions ? await ports.questions(call) : callHeadQuestions(call);
        break;
      }
      case HEAD_LAND_VERB:
        data = await landVerb({ args, envelope, projectRoot, id: request.id, ports });
        break;
      case HEAD_RUN_VERB:
        data = await runVerb({ args, envelope, projectRoot, id: request.id, ports });
        break;
      case HEAD_REQUEST_RESULT_VERB:
        data = await readTickets({ args, envelope, projectRoot, ports });
        break;
      case HEAD_WORKTREE_CREATE_VERB:
        data = worktreeCreate({ args, envelope, projectRoot, ports });
        break;
      case HEAD_STOP_VERB:
        data = await stopVerb({ args, envelope, projectRoot, ports });
        break;
      case HEAD_SUPERVISOR_HANDLED_VERB:
        exactKeys(args, ['event']);
        if (typeof args.event !== 'string' || !ID_PATTERN.test(args.event)) throw badArgs('event must be an event id');
        data = hostCall({ envelope, projectRoot, argv: ['supervisor', 'handled', args.event, '--json'] }, ports);
        break;
      case HEAD_SUPERVISOR_DONE_VERB:
        exactKeys(args, []);
        data = hostCall({ envelope, projectRoot, argv: ['supervisor', 'done', '--json'] }, ports);
        if (data?.done === true) {
          // The caller ends its own session after this route has printed its line (the stop waits for this process to exit).
          const { persona, name } = envelope.session;
          const started = (ports.spawnStop ?? spawnStopSelf)({ persona, name, projectRoot });
          if (started?.pid) data = { ...data, stopping: true };
        }
        break;
      default:
        throw Object.assign(new Error(`unknown verb ${JSON.stringify(request?.verb)}`), { code: 'unknown-verb' });
    }
    return { exit: 0, line: { result: 'done', data } };
  } catch (err) {
    return { exit: 70, line: { result: 'error', code: String(err?.code ?? 'internal'), message: String(err?.message ?? err).slice(0, 500) } };
  }
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('the request is over the size limit');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const flagValue = (name) => {
  const at = process.argv.indexOf(name);
  return at > 0 ? process.argv[at + 1] : undefined;
};

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  if (process.argv.includes('--ticket')) {
    const file = flagValue('--ticket');
    if (!file) process.exitCode = 2; else runTicket(path.resolve(file));
  } else if (process.argv.includes('--stop-self')) {
    const [persona, name, projectRoot] = [flagValue('--persona'), flagValue('--name'), flagValue('--project-root')];
    if (!persona || !name || !projectRoot) process.exitCode = 2;
    else {
      try { await runStopSelf({ persona, name, projectRoot, waitPid: Number(flagValue('--wait-pid')) || 0 }); } catch (err) {
        process.stderr.write(`session stop of ${persona}-${name} failed: ${err.message}\n`);
        process.exitCode = 70;
      }
    }
  } else {
    const runDir = flagValue('--run-dir');
    if (!runDir) {
      process.stderr.write('usage: head-request.mjs --run-dir <attemptDir>\n');
      process.exitCode = 2;
    } else {
      let request;
      try { request = await readStdin(); } catch (err) {
        emit({ result: 'error', code: 'bad-frame', message: String(err.message).slice(0, 500) });
        process.exitCode = 70;
      }
      if (request !== undefined) {
        const { exit, line } = await runHeadRequest({ runDir: path.resolve(runDir), request });
        emit(line);
        process.exitCode = exit;
      }
    }
  }
}
