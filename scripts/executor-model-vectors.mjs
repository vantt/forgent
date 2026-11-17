#!/usr/bin/env node
// executor-model-vectors.mjs -- the one regenerate path of the Execution contracts' golden vectors:
// packages/execution/contracts/executor-model.v1.json (the executor facts) and bind.v1.json (the bind, the explain
// answer, the pre-admission facts, the seat config slice and its digest, effective rigor).
//
// A vector's inputs (name, fact, entry, runner, machine, args) are written by hand; its `expect` is whatever the
// Node functions answer today, and its `leaseRead` (only for a fact that reads lease state) is what Dispatch's adapter
// reads from the vector's lease state, the input a binder that takes account state as data is handed. This script
// rewrites only those recorded values, through the same evaluator the replay tests use
// (test/helpers/executor-model-vectors.helper.mjs), and keeps the file's one layout: a vector is a line per key. A
// new vector is added with `"expect": null` and recorded by running this script. The Node bind, explain, pre-admission
// and digest answers come through the host route, so those vectors record the Rust bind.
//
//   node scripts/executor-model-vectors.mjs           rewrite the recorded values of both contracts
//   node scripts/executor-model-vectors.mjs --check   exit 1 when any recorded value has drifted, naming the vectors
//   --contract <file>                                 read and write that file only
//
// To re-record: run `node scripts/executor-model-vectors.mjs` from any shell, then `--check`, and review the diff of
// the contracts. The script gives itself the environment of the replay test (the one `scripts/run-tests.mjs` builds:
// only the OS and toolchain variables, no HERDR_*, a private temp root), so the answer does not depend on the shell
// it was started from, its PATH, its HOME or the agent CLIs installed on the machine.
//
// It needs a Seat Binding host (FGOS_HOST_BIN, else built with cargo) and the Git addon, as the replay test does.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { isMainModule } from './lib/is-main-module.mjs';

export const CONTRACT_URL = new URL('../packages/execution/contracts/executor-model.v1.json', import.meta.url);
export const BIND_CONTRACT_URL = new URL('../packages/execution/contracts/bind.v1.json', import.meta.url);

/** Replace this process's environment by the replay test's, the one `buildTestEnv` gives every test run. */
export async function adoptTestEnvironment() {
  const { buildTestEnv } = await import('./run-tests.mjs');
  const testEnv = buildTestEnv(process.env);
  for (const key of Object.keys(process.env)) if (!(key in testEnv)) delete process.env[key];
  Object.assign(process.env, testEnv);
  await import('../test/helpers/process-tmp-root.mjs');
}

const line = (value) => JSON.stringify(value);

/** The file text of a contract: header keys one per line, each vector one key per line. */
export function serialize({ vectors, ...head }) {
  const header = Object.entries(head).map(([key, value]) => ` ${line(key)}: ${line(value)}`).join(',\n');
  const body = vectors.map((vector) => `  {\n${Object.entries(vector).map(([key, value]) => `   ${line(key)}: ${line(value ?? null)}`).join(',\n')}\n  }`).join(',\n');
  return `{\n${header},\n "vectors": [\n${body}\n ]\n}\n`;
}

/** One vector with its recorded values recomputed: `leaseRead` (when the fact reads lease state), then `expect`. */
function recordVector(vector, { evaluateVector, leaseReadOf }) {
  const { expect: _expect, leaseRead: _leaseRead, ...inputs } = vector;
  const leaseRead = leaseReadOf(vector);
  return { ...inputs, ...(leaseRead === undefined ? {} : { leaseRead }), expect: evaluateVector(vector) };
}

/** The contract with every recorded value and the fact list recomputed from today's Node functions. */
export async function recorded(contract) {
  const helper = await import('../test/helpers/executor-model-vectors.helper.mjs');
  const vectors = contract.vectors.map((vector) => recordVector(vector, helper));
  return { ...contract, facts: [...new Set(vectors.map((vector) => vector.fact))], vectors };
}

/** The names of the vectors whose recorded values differ between two versions of a contract. */
const driftedNames = (next, current) => next.vectors
  .filter((vector, index) => !isDeepStrictEqual(vector, current.vectors[index]))
  .map((vector) => vector.name);

async function main(argv) {
  await adoptTestEnvironment();
  const at = argv.indexOf('--contract');
  const contractUrls = at >= 0 ? [pathToFileURL(path.resolve(argv[at + 1]))] : [CONTRACT_URL, BIND_CONTRACT_URL];
  let failed = false;
  for (const contractUrl of contractUrls) {
    const current = JSON.parse(fs.readFileSync(contractUrl, 'utf8'));
    let next;
    try {
      next = await recorded(current);
    } catch (err) {
      console.error(`${current.version} vectors: ${err.message}`);
      failed = true;
      continue;
    }
    if (argv.includes('--check')) {
      const drifted = driftedNames(next, current);
      if (drifted.length > 0 || !isDeepStrictEqual(next.facts, current.facts)) {
        console.error(`${current.version} vectors drifted from the Node functions (run node scripts/executor-model-vectors.mjs):\n${drifted.map((name) => `  ${name}`).join('\n')}`);
        failed = true;
      } else {
        console.log(`${current.version} vectors: ${current.vectors.length} vectors match`);
      }
      continue;
    }
    fs.writeFileSync(contractUrl, serialize(next));
    console.log(`${current.version} vectors: recorded ${next.vectors.length} vectors over ${next.facts.length} facts`);
  }
  if (failed) process.exit(1);
}

if (isMainModule(import.meta.url)) await main(process.argv.slice(2));
