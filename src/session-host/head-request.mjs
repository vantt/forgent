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
import { HEAD_ANSWERED_VERB, HEAD_QUESTIONS_ACK_VERB, HEAD_QUESTIONS_ANSWER_VERB, HEAD_QUESTIONS_ASK_VERB, HEAD_QUESTIONS_CANCEL_VERB, HEAD_RESTORE_VERB, HEAD_ROTATE_VERB, HEAD_START_VERB, MAX_REQUEST_BYTES, PROTOCOL, requestHeadRotate, requestHeadStart } from './head-request-client.mjs';
import { headRoleOf, startHeadSession } from './head-start.mjs';
import { markSuccessorAnswered, requestRotation, rotationHolds } from '../session-rotation/rotate.mjs';

const confined = (env) => env[CONFINED_MARKER_ENV] === '1';
// `projectRoot` is a path or a function that finds it; only the unconfined branch resolves it, because the lookup probes
// git and writes under the state root, which a sandbox keeps read-only.
const rootOf = (projectRoot) => (typeof projectRoot === 'function' ? projectRoot() : projectRoot);

/**
 * The one door to start a head, whoever asks. A confined session (`FGOS_CONFINED=1`, which the launch door sets in
 * every sandboxed agent) sends the request through its socket; anyone else calls `startHeadSession` directly. The
 * confinement fact is that marker alone, never the socket variable or a masked path: a confined worker has no socket
 * and is refused `no-request-socket`. `args` is `{ persona, name, beside?, projectRoot? }`; `projectRoot` (a path or a resolver function) is used only
 * outside the sandbox (the supervisor starts a confined caller's head in its own project).
 */
export async function startHead({ persona, name, beside = null, projectRoot } = {}, { env = process.env, ports = {}, request = requestHeadStart } = {}) {
  if (confined(env)) {
    return request({ persona, name, ...(beside ? { beside } : {}) }, { socketPath: env[HEAD_REQUEST_SOCKET_ENV] });
  }
  return startHeadSession({ persona, name, beside, projectRoot: rootOf(projectRoot) }, ports);
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
        exactKeys(args, ['persona', 'name', 'beside']);
        if (args.beside !== undefined && typeof args.beside !== 'string') throw badArgs('beside must be a string');
        data = await startHeadSession({ persona: args.persona, name: args.name, beside: args.beside ?? null, projectRoot }, {
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
        const hostBin = envelope.hostBin ?? process.env.FGOS_HOST_BIN;
        if (typeof hostBin !== 'string' || hostBin === '') throw Object.assign(new Error('the envelope names no host binary'), { code: 'envelope-invalid' });
        data = await (ports.questions ?? callHeadQuestions)({ hostBin, runDir, cwd: projectRoot, request: { verb: request.verb, args } });
        break;
      }
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

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const at = process.argv.indexOf('--run-dir');
  const runDir = at > 0 ? process.argv[at + 1] : undefined;
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
