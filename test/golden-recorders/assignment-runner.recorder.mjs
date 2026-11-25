#!/usr/bin/env node
// Assignment-runner golden recorder (live parts only): records the seat-binding
// config digest the live seat-binding client computes. Dead sources
// (assignment-runner.mjs, cli.mjs, direct-launch.mjs) were dropped; their fixtures
// stay under packages/execution/contracts/assignment-runner/ and are owned by
// packages/execution/engine/tests/assignment_runner.rs.
// Run: node test/golden-recorders/assignment-runner.recorder.mjs [--out <dir>]

process.env.TZ = 'UTC';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const outDir = path.resolve(repo, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'packages/execution/contracts/assignment-runner');
fs.mkdirSync(outDir, { recursive: true });
const write = (name, body) => fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);

await import('../../src/native/door.mjs');
const seatClient = await import(path.join(repo, 'src', 'seat-binding', 'client.mjs'));

const digestInputs = [
  {},
  { executors: { a: { kind: 'agent', command: 'claude', args: ['{prompt}'] } } },
  { capabilities: { 'code:implement': { tier: 'standard', maxTier: 'high', prefer: ['a'], ignored: 1 } }, roles: { producer: { tier: 'high', pool: 'main', note: 'x' } } },
  { capabilities: { 'code:implement': { tier: 'high' } }, roles: { producer: { tier: 'high', pool: 'main' } }, personas: { reviewer: { tier: 'low', prefer: ['b'] } } },
  { runner: { capabilities: { 'code:review': { tier: 'low' } } } },
];
write('replay-digest.v1.json', { contract: 'assignment-runner-replay-digest.v1', cases: digestInputs.map((runnerConfig) => ({ runnerConfig, digest: seatClient.digest({ runner: runnerConfig }) })) });
console.log(`replay-digest.v1.json -> ${outDir}`);
