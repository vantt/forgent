#!/usr/bin/env node
// checks-vectors.mjs -- the one regenerate path of packages/execution/contracts/checks.v1.json (the doctor rows
// that read the runner config and the machine it names: generated paths, confinement, git write grants, capability
// serves sets, omp natives, agy sub-HOMEs, tool registry posture).
//
// A vector's inputs (name, row, runner, machine) are written by hand; its `expect` is whatever the Node judge
// answers today, through the evaluator a replay uses (test/helpers/checks-vectors.helper.mjs). A vector marked
// `handRecorded` keeps the answer written in it. A new vector is added with `"expect": null` and recorded by
// running this script.
//
//   node scripts/checks-vectors.mjs           rewrite the recorded values of the contract
//   node scripts/checks-vectors.mjs --check   exit 1 when any recorded value has drifted, naming the vectors
//   --contract <file>                         read and write that file instead of the committed contract
//
// The script gives itself the environment of the replay test (the one `scripts/run-tests.mjs` builds), so the
// answer does not depend on the shell it was started from.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { isMainModule } from './lib/is-main-module.mjs';
import { adoptTestEnvironment, serialize } from './executor-model-vectors.mjs';

export const CONTRACT_URL = new URL('../packages/execution/contracts/checks.v1.json', import.meta.url);

/** The contract with every recorded `expect` recomputed from today's Node judges. */
export async function recorded(contract) {
  const { evaluateVector } = await import('../test/helpers/checks-vectors.helper.mjs');
  return { ...contract, vectors: contract.vectors.map((vector) => ({ ...vector, expect: evaluateVector(vector) })) };
}

async function main(argv) {
  await adoptTestEnvironment();
  const at = argv.indexOf('--contract');
  const url = at >= 0 ? pathToFileURL(path.resolve(argv[at + 1])) : CONTRACT_URL;
  const current = JSON.parse(fs.readFileSync(url, 'utf8'));
  const next = await recorded(current);
  if (argv.includes('--check')) {
    const drifted = next.vectors.filter((vector, i) => !isDeepStrictEqual(vector, current.vectors[i])).map((vector) => vector.name);
    if (drifted.length > 0) {
      console.error(`${current.version} vectors drifted from the Node judges (run node scripts/checks-vectors.mjs):\n${drifted.map((name) => `  ${name}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`${current.version} vectors: ${current.vectors.length} vectors match`);
    return;
  }
  fs.writeFileSync(url, serialize(next));
  console.log(`${current.version} vectors: recorded ${next.vectors.length} vectors`);
}

if (isMainModule(import.meta.url)) await main(process.argv.slice(2));
