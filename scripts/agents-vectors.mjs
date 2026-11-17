#!/usr/bin/env node
// agents-vectors.mjs -- the one regenerate path of packages/execution/contracts/agents.v1.json.
//
// A vector's inputs (name, project, install) are written by hand; its `expect` is whatever the Node agent listing
// answers today. This script rewrites only the `expect` values, through the evaluator the replay test uses
// (test/helpers/agents-vectors.helper.mjs), and keeps the file's one layout (the serializer of
// scripts/executor-model-vectors.mjs). A new vector is added with `"expect": null` and recorded by running it.
//
//   node scripts/agents-vectors.mjs           rewrite the `expect` values
//   node scripts/agents-vectors.mjs --check   exit 1 when any `expect` has drifted, naming the vectors
//   --contract <file>                         read and write that file instead of the committed contract
//
// The script gives itself the environment of the replay test (the one `scripts/run-tests.mjs` builds), so the
// answer does not depend on the shell it was started from. It needs the native addon (the YAML door), as the
// replay test does.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { isMainModule } from './lib/is-main-module.mjs';
import { adoptTestEnvironment, serialize } from './executor-model-vectors.mjs';

export const CONTRACT_URL = new URL('../packages/execution/contracts/agents.v1.json', import.meta.url);

/** The contract with every `expect` recomputed from today's Node listing. */
export async function recorded(contract) {
  const { evaluateVector } = await import('../test/helpers/agents-vectors.helper.mjs');
  return { ...contract, vectors: contract.vectors.map((vector) => ({ ...vector, expect: evaluateVector(vector) })) };
}

async function main(argv) {
  await adoptTestEnvironment();
  const at = argv.indexOf('--contract');
  const contractUrl = at >= 0 ? pathToFileURL(path.resolve(argv[at + 1])) : CONTRACT_URL;
  const current = JSON.parse(fs.readFileSync(contractUrl, 'utf8'));
  const next = await recorded(current);
  if (argv.includes('--check')) {
    const drifted = next.vectors.filter((vector, index) => !isDeepStrictEqual(vector.expect, current.vectors[index].expect)).map((vector) => vector.name);
    if (drifted.length > 0) {
      console.error(`agents vectors drifted from the Node listing (run node scripts/agents-vectors.mjs):\n${drifted.map((name) => `  ${name}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`agents vectors: ${current.vectors.length} vectors match`);
    return;
  }
  fs.writeFileSync(contractUrl, serialize(next));
  console.log(`agents vectors: recorded ${next.vectors.length} vectors`);
}

if (isMainModule(import.meta.url)) await main(process.argv.slice(2));
