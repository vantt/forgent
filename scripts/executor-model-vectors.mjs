#!/usr/bin/env node
// executor-model-vectors.mjs -- the one regenerate path of packages/execution/contracts/executor-model.v1.json.
//
// A vector's inputs (name, fact, entry, runner, machine, args) are written by hand; its `expect` is whatever the
// Node functions that derive the executor facts answer today. This script rewrites only the `expect` values, through
// the same evaluator the replay test uses (test/helpers/executor-model-vectors.helper.mjs), and keeps the file's one
// layout: a vector is a line per key. A new vector is added with `"expect": null` and recorded by running this script.
//
//   node scripts/executor-model-vectors.mjs           rewrite the `expect` values
//   node scripts/executor-model-vectors.mjs --check   exit 1 when any `expect` has drifted, naming the vectors
//
// It needs the same machine facts as the replay test: a Seat Binding host (FGOS_HOST_BIN, else built with cargo) and
// the Git addon.

import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { ensureHostBin } from './lib/git-addon-stage.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

export const CONTRACT_URL = new URL('../packages/execution/contracts/executor-model.v1.json', import.meta.url);

const line = (value) => JSON.stringify(value);

/** The file text of a contract: header keys one per line, each vector one key per line. */
export function serialize({ vectors, ...head }) {
  const header = Object.entries(head).map(([key, value]) => ` ${line(key)}: ${line(value)}`).join(',\n');
  const body = vectors.map((vector) => `  {\n${Object.entries(vector).map(([key, value]) => `   ${line(key)}: ${line(value ?? null)}`).join(',\n')}\n  }`).join(',\n');
  return `{\n${header},\n "vectors": [\n${body}\n ]\n}\n`;
}

/** The contract with every `expect` and the fact list recomputed from today's Node functions. */
export async function recorded(contract) {
  const { evaluateVector } = await import('../test/helpers/executor-model-vectors.helper.mjs');
  const vectors = contract.vectors.map((vector) => ({ ...vector, expect: evaluateVector(vector) }));
  return { ...contract, facts: [...new Set(vectors.map((vector) => vector.fact))], vectors };
}

async function main(argv) {
  process.env.FGOS_HOST_BIN = ensureHostBin(process.env);
  const current = JSON.parse(fs.readFileSync(CONTRACT_URL, 'utf8'));
  const next = await recorded(current);
  if (argv.includes('--check')) {
    const drifted = next.vectors.filter((vector, index) => !isDeepStrictEqual(vector.expect, current.vectors[index].expect)).map((vector) => vector.name);
    if (drifted.length > 0 || !isDeepStrictEqual(next.facts, current.facts)) {
      console.error(`executor-model vectors drifted from the Node functions (run node scripts/executor-model-vectors.mjs):\n${drifted.map((name) => `  ${name}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`executor-model vectors: ${current.vectors.length} vectors match`);
    return;
  }
  fs.writeFileSync(CONTRACT_URL, serialize(next));
  console.log(`executor-model vectors: recorded ${next.vectors.length} vectors over ${next.facts.length} facts`);
}

if (isMainModule(import.meta.url)) await main(process.argv.slice(2));
