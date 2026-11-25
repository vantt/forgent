#!/usr/bin/env node
// Assignment golden recorder (live parts only): records tier-cell from the live
// src/runner/dispatch/tier-cell.mjs. Dead sources (assignment, normalizer, brief,
// work-item-input, assignment-layout-twin, execution-contract) were dropped; their
// fixtures stay under packages/execution/contracts/assignment/ and are owned by
// packages/execution/engine/tests/assignment.rs.
// Usage: node test/golden-recorders/assignment.recorder.mjs [--out <dir>]

process.env.TZ = 'UTC';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/assignment');
const tierCell = await import(path.join(repo, 'src/runner/dispatch/tier-cell.mjs'));

const plain = (v) => JSON.parse(JSON.stringify(v ?? null));
const attempt = (fn) => {
  try { return { ok: plain(fn()) }; } catch (error) { return { error: { name: error?.name, code: error?.code ?? null, message: error?.message } }; }
};
const write = (name, value) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
};

const cells = [
  'gpt-5', ['a', 'b'], { model: 'm', pool: 'p', effort: 'high' }, [{ model: 'm' }, 'n'], [], '', ' ', { model: '' }, { model: 'm', pool: '' },
  { model: 'm', extra: 1 }, { model: 'm', effort: 'ultra' }, 7, null, [null], { pool: 'p' }, { model: 'm', effort: 'max', pool: 'q' },
].map((cell) => ({ cell, family: 'claude', result: attempt(() => tierCell.parseTierCell(cell, 'claude')) }));
write('tier-cell.json', { effortValues: [...tierCell.REASONING_EFFORT_VALUES], cells });
console.log(`tier-cell.json -> ${outDir}`);
