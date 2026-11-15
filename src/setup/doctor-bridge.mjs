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

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The prefix of a result line; anything else on stdout is not a result. */
export const RESULT_PREFIX = '\u001eFGOS-DOCTOR-BRIDGE ';

/** Reads the request from `input`: `{ phase: 'fix' | 'check', ids: [...], dir }`, or throws what is wrong with it. */
export function parseRequest(text) {
  let request;
  try { request = JSON.parse(text); } catch (error) { throw new Error(`the request is not JSON (${error.message})`); }
  const { phase, ids, dir } = request ?? {};
  if (phase !== 'fix' && phase !== 'check') throw new Error('the request names no phase (fix or check)');
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || id === '')) throw new Error('the request names no list of ids');
  if (typeof dir !== 'string' || dir === '') throw new Error('the request names no project directory');
  return { phase, ids, dir };
}

/** One result line: the prefix, the JSON, a newline, written in one call so nothing lands inside it. */
export function resultLine(kind, body) {
  return `${RESULT_PREFIX}${JSON.stringify({ kind, ...body })}\n`;
}

/**
 * Runs one request. `write` receives each result line; `runBridged` is the body map of the registry
 * (src/setup/registrations.mjs). Ends with an `end` line carrying the count, so the host can tell a finished
 * call from one that stopped. A refusal (a malformed request, an id with no body) is one `refusal` line.
 */
export async function serve(text, { write, runBridged }) {
  let request;
  try { request = parseRequest(text); } catch (error) { write(resultLine('refusal', { message: error.message })); return 2; }
  let count = 0;
  try {
    await runBridged(request, (result) => {
      count += 1;
      write(resultLine(request.phase === 'fix' ? 'fix' : 'row', result));
    });
  } catch (error) {
    write(resultLine('refusal', { message: error.message }));
    return 2;
  }
  write(resultLine('end', { count }));
  return 0;
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
  const { runBridged } = await import('./registrations.mjs');
  process.exitCode = await serve(Buffer.concat(chunks).toString('utf8'), { write, runBridged });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`doctor bridge: ${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
