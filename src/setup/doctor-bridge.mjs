// doctor-bridge.mjs -- the one door the Rust host uses to reach the doctor rows whose layers Node still owns.
//
// The host (apps/fgos/src/wiring/doctor/bridge.rs) starts this file as a script with the payload's own Node,
// writes one request on stdin and reads one line per result on stdout. It is no verb, no route and no
// `fgos internal` entry. The request and the lines are the contract
// packages/distribution/contracts/doctor-bridge.v1.json. Which rows and fixes come here, and in which order, is
// the registry's (packages/distribution/contracts/doctor-registry.v1.json); the level of a row, the fix of a
// failing row, `ok` and `next` are the host's. This module runs bodies and reports what they said.
//
// A body may print (a child it starts can too): every write to this process's stdout from a body goes to
// stderr, and a result line is recognised by its prefix, so stray output can never be read as a result. Each
// result is written as soon as it exists, so a crash keeps the results already produced. Deleted with the last
// row Node owns.
//
// Two more requests share the door until the Work layer moves. `work-store-init` is the Work store `fgos init`
// creates (the Event Store rebuild of the project's `.fgos`): it answers with an `end` line of count 0, or with a
// `refusal` line carrying the error's text and its category. `work-dispatch-hint` is the Work lookup of
// `fgos dispatch decide --work <id> [--stage <stage>]` (`resolveWorkForDispatch`): it answers with one `hint`
// line (the hint object, or null when the Work store holds no such item) and an `end` line of count 1, or with a
// `refusal` line. `work-questions` is the read of what waits for the owner outside the question store: the open
// Workflow gates (`readCaseProjection`) and the `fgos ask` items of the Work view (the awaiting-human items). It
// answers with one `data` line (`{gates, asks}`) and an `end` line of count 1, or with a `refusal` line.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fgosDirFromRoot } from '../util/fgos-file-registry.mjs';

/** The prefix of a result line; anything else on stdout is not a result. */
export const RESULT_PREFIX = '\u001eFGOS-DOCTOR-BRIDGE ';

/** Reads the request from `input`: `{ phase: 'fix' | 'check' | 'work-store-init' | 'work-dispatch-hint' | 'work-questions', ids: [...], dir }` (a `work-dispatch-hint` also carries `workId` and an optional `stage`), or throws what is wrong with it. */
export function parseRequest(text) {
  let request;
  try { request = JSON.parse(text); } catch (error) { throw new Error(`the request is not JSON (${error.message})`); }
  const { phase, ids, dir, workId, stage } = request ?? {};
  const noIds = phase === 'work-store-init' || phase === 'work-dispatch-hint' || phase === 'work-questions';
  if (phase !== 'fix' && phase !== 'check' && !noIds) throw new Error('the request names no phase (fix, check, work-store-init, work-dispatch-hint or work-questions)');
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || id === '') || (noIds && ids.length > 0)) throw new Error('the request names no list of ids');
  if (typeof dir !== 'string' || dir === '') throw new Error('the request names no project directory');
  if (phase !== 'work-dispatch-hint') return { phase, ids, dir };
  if (typeof workId !== 'string' || workId === '') throw new Error('the request names no work item');
  if (stage !== undefined && stage !== null && typeof stage !== 'string') throw new Error('the request names a stage that is not text');
  return { phase, ids, dir, workId, ...(typeof stage === 'string' ? { stage } : {}) };
}

/** One result line: the prefix, the JSON, a newline, written in one call so nothing lands inside it. */
export function resultLine(kind, body) {
  return `${RESULT_PREFIX}${JSON.stringify({ kind, ...body })}\n`;
}

/** A refusal line: the error's text, and its category when it carries one (the host turns it into the exit status). */
function refusalLine(error) {
  return resultLine('refusal', { message: error.message, ...(typeof error.category === 'string' && { category: error.category }) });
}

/**
 * Runs one request. `write` receives each result line; `runBridged` is the body map of the registry
 * (src/setup/registrations.mjs) and `initStore` creates the Work store of a `.fgos` directory. Ends with an `end`
 * line carrying the count and the version of the Node that ran it (the host judges that version against the release's
 * `requires.node`, so it starts no Node of its own to ask), so the host can tell a finished call from one that stopped. A refusal (a malformed
 * request, an id with no body) is one `refusal` line.
 */
export async function serve(text, { write, runBridged, initStore, workHint, workQuestions, nodeVersion = process.version }) {
  let request;
  try { request = parseRequest(text); } catch (error) { write(resultLine('refusal', { message: error.message })); return 2; }
  if (request.phase === 'work-store-init') {
    try { await initStore(fgosDirFromRoot(request.dir)); } catch (error) { write(refusalLine(error)); return 2; }
    write(resultLine('end', { count: 0, nodeVersion }));
    return 0;
  }
  if (request.phase === 'work-dispatch-hint') {
    let hint;
    try { hint = await workHint({ workId: request.workId, stage: request.stage, fgosDir: fgosDirFromRoot(request.dir) }); } catch (error) { write(refusalLine(error)); return 2; }
    write(resultLine('hint', { hint: hint ?? null }));
    write(resultLine('end', { count: 1, nodeVersion }));
    return 0;
  }
  if (request.phase === 'work-questions') {
    let data;
    try { data = await workQuestions({ dir: request.dir }); } catch (error) { write(refusalLine(error)); return 2; }
    write(resultLine('data', { data }));
    write(resultLine('end', { count: 1, nodeVersion }));
    return 0;
  }
  let count = 0;
  try {
    await runBridged(request, (result) => {
      count += 1;
      write(resultLine(request.phase === 'fix' ? 'fix' : 'row', result));
    });
  } catch (error) {
    write(refusalLine(error));
    return 2;
  }
  write(resultLine('end', { count, nodeVersion }));
  return 0;
}

/**
 * What waits for the owner outside the question store, read from the Work layer: `gates` are the open Workflow
 * gates of the running and parked cases (a case whose ledger cannot be read is listed as one unreadable gate, never
 * dropped) and `asks` are the awaiting-human items of the Work view (`fgos ask`). Reads only.
 * @param {{ dir: string }} params the project root
 * @param {{ runsRoot, isCaseId, readCaseProjection, listWork }} reads the Work layer's own readers
 */
export function readWorkQuestions({ dir }, { runsRoot, isCaseId, readCaseProjection, listWork }) {
  const base = runsRoot(dir);
  const runIds = fs.existsSync(base)
    ? fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().filter(isCaseId)
    : [];
  const gates = runIds.flatMap((runId) => {
    let read;
    try {
      read = readCaseProjection(dir, runId, { retryTail: true });
    } catch (err) {
      return [{ ref: `workflow:${runId}`, question: `unreadable workflow case: ${err?.message ?? String(err)}`, answerDoor: `fgos workflow status ${runId}` }];
    }
    if (!['running', 'parked'].includes(read.state.status)) return [];
    return (read.projection.openGates ?? []).map((g) => ({
      ref: `workflow:${runId}#${g.stepId}`,
      question: String(g.question ?? ''),
      answerDoor: `fgos workflow answer ${runId} --step ${g.stepId} --answer "<answer>"`,
    }));
  });
  const view = listWork(fgosDirFromRoot(dir));
  const asks = Object.values(view.work ?? {})
    .filter((item) => item.status === 'awaiting-human')
    .map((item) => ({
      ref: `work:${item.id}`,
      title: String(item.title ?? ''),
      question: String(view.gates?.[item.id]?.ask ?? ''),
      answerDoor: `fgos answer ${item.id} --text "<answer>"`,
    }))
    .sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
  return { gates, asks };
}

/** Writes every byte of `bytes` to `fd`, waiting out a full pipe instead of dropping the rest of a long line. */
function writeAll(fd, bytes) {
  let offset = 0;
  while (offset < bytes.length) {
    try {
      offset += fs.writeSync(fd, bytes, offset);
    } catch (error) {
      if (error.code !== 'EAGAIN') throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
    }
  }
}

async function main() {
  // Result lines go through the real stdout descriptor; everything a body prints through the stream goes to stderr.
  const write = (line) => writeAll(1, Buffer.from(line));
  process.stdout.write = (...args) => process.stderr.write(...args);
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  // The rows' bodies load only for the requests that run rows.
  const text = Buffer.concat(chunks).toString('utf8');
  let runsRows = true;
  try { runsRows = ['fix', 'check'].includes(parseRequest(text).phase); } catch { /* serve answers a malformed request */ }
  let runBridged;
  if (runsRows) {
    const rows = await import('./registrations.mjs');
    runBridged = rows.runBridged;
  }
  // Loaded only for the one request that needs the store.
  const initStore = async (dir) => (await import('../state/store.mjs')).initStore(dir);
  // Loaded only for the one request that needs the Work layer.
  const workHint = async (params) => (await import('../runner/work-dispatch.mjs')).resolveWorkForDispatch(params);
  // Loaded only for the one request that reads what waits for the owner in the Work layer.
  const workQuestions = async (params) => {
    const [paths, projection, store] = await Promise.all([
      import('../runner/execution/case-run-paths.mjs'),
      import('../workflow/case-projection.mjs'),
      import('../state/store.mjs'),
    ]);
    return readWorkQuestions(params, { runsRoot: paths.runsRoot, isCaseId: paths.isCaseId, readCaseProjection: projection.readCaseProjection, listWork: store.listWork });
  };
  process.exitCode = await serve(text, { write, runBridged, initStore, workHint, workQuestions });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`doctor bridge: ${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
