#!/usr/bin/env node
// decide-vectors.mjs -- the one regenerate path of packages/execution/contracts/decide.v1.json.
//
// A vector's inputs (name, fact, runner, machine, args) are written by hand; its `expect` is whatever the Node code
// that answers `fgos dispatch decide` and the dispatch hook gives today. This script rewrites only the `expect`
// values, through the evaluator the replay test uses (test/helpers/decide-vectors.helper.mjs), in the layout of the
// executor-model vectors. A new vector is added with `"expect": null` and recorded by running this script.
//
//   node scripts/decide-vectors.mjs           rewrite the `expect` values
//   node scripts/decide-vectors.mjs --check   exit 1 when any `expect` has drifted, naming the vectors
//   --contract <file>                         read and write that file instead of the committed contract
//
// It runs in the replay test's environment (scripts/run-tests.mjs buildTestEnv), so the answer does not depend on
// the shell it was started from. It needs a Seat Binding host and the Git addon, as the replay test does.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { isMainModule } from './lib/is-main-module.mjs';
import { adoptTestEnvironment, serialize } from './executor-model-vectors.mjs';

export const CONTRACT_URL = new URL('../packages/execution/contracts/decide.v1.json', import.meta.url);

/** The contract with every `expect` and the fact list recomputed from today's Node code. */
export async function recorded(contract) {
  const { evaluateDecideVector } = await import('../test/helpers/decide-vectors.helper.mjs');
  const vectors = [];
  for (const vector of contract.vectors) vectors.push({ ...vector, expect: await evaluateDecideVector(vector) });
  return { ...contract, facts: [...new Set(vectors.map((vector) => vector.fact))], vectors };
}

async function main(argv) {
  await adoptTestEnvironment();
  const at = argv.indexOf('--contract');
  const contractUrl = at >= 0 ? pathToFileURL(path.resolve(argv[at + 1])) : CONTRACT_URL;
  const current = JSON.parse(fs.readFileSync(contractUrl, 'utf8'));
  const next = await recorded(current);
  if (argv.includes('--check')) {
    const drifted = next.vectors.filter((vector, index) => !isDeepStrictEqual(vector.expect, current.vectors[index].expect)).map((vector) => vector.name);
    if (drifted.length > 0 || !isDeepStrictEqual(next.facts, current.facts)) {
      console.error(`decide vectors drifted from the Node code (run node scripts/decide-vectors.mjs):\n${drifted.map((name) => `  ${name}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`decide vectors: ${current.vectors.length} vectors match`);
    return;
  }
  fs.writeFileSync(contractUrl, serialize(next));
  console.log(`decide vectors: recorded ${next.vectors.length} vectors over ${next.facts.length} facts`);
}

if (isMainModule(import.meta.url)) await main(process.argv.slice(2));
