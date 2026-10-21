import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { publishImmutableProof, publishMutableProjection } from '../../src/runner/dispatch/proof-helpers.mjs';

test('a mutable projection replaces its file whole, an immutable proof is created once', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-helpers-'));
  const projection = path.join(dir, 'projection.json');
  publishMutableProjection(projection, { n: 1 });
  publishMutableProjection(projection, { n: 2 });
  assert.deepEqual(JSON.parse(fs.readFileSync(projection, 'utf8')), { n: 2 });
  const proof = path.join(dir, 'proof.json');
  assert.equal(publishImmutableProof(proof, { n: 1 }), true);
  assert.equal(publishImmutableProof(proof, { n: 2 }), false);
  assert.deepEqual(JSON.parse(fs.readFileSync(proof, 'utf8')), { n: 1 });
});

test('separate processes racing to publish one immutable proof: exactly one wins and nothing else is left in the directory', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-helpers-race-'));
  const proof = path.join(dir, 'proof.json');
  const module = new URL('../../src/runner/dispatch/proof-helpers.mjs', import.meta.url).href;
  const results = await Promise.all([1, 2, 3, 4].map((n) => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e',
      `import { publishImmutableProof } from ${JSON.stringify(module)};
       console.log(JSON.stringify({ n: ${n}, won: publishImmutableProof(${JSON.stringify(proof)}, { n: ${n} }) }));`], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.once('exit', () => resolve(JSON.parse(out)));
  })));
  const winners = results.filter((r) => r.won);
  assert.equal(winners.length, 1, JSON.stringify(results));
  assert.deepEqual(JSON.parse(fs.readFileSync(proof, 'utf8')), { n: winners[0].n });
  assert.deepEqual(fs.readdirSync(dir), ['proof.json']);
});
