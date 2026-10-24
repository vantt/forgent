import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { normalizeAgentName, publishImmutableProof, publishMutableProjection } from '../../src/runner/dispatch/proof-helpers.mjs';

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

// Agent names: herdr refuses a target name it cannot use (1-32 characters, lowercase letters, digits, `-` or `_`,
// starting with a letter), so a name is normalized instead of failing late inside a pane that is already open.

test('agent names are normalized to something herdr accepts as a target', () => {
  assert.equal(normalizeAgentName('FGOS/Work Item 5'), 'fgos-work-item-5');
  assert.equal(normalizeAgentName('---'), 'fgos-agent');
  assert.equal(normalizeAgentName(''), 'fgos-agent');
  assert.ok(normalizeAgentName('x'.repeat(200)).length <= 48);
});


test('a long work id loses its middle, never the suffix that makes it unique', () => {
  const longId = 'tsk-a-very-long-work-item-identifier-indeed-here';
  const first = normalizeAgentName(`fgos-${longId}-${(1700000000000).toString(36)}`);
  const second = normalizeAgentName(`fgos-${longId}-${(1700000000001).toString(36)}`);

  // 32 is herdr's own limit, from its own refusal message. This assertion
  // said 48 and passed while the code was wrong: 48 is not a limit anything
  // has, and the first dispatch of a real capability was refused at 35.
  assert.ok(first.length <= 32, `still within what herdr accepts, got ${first.length}`);
  // Truncating the tail would take the timestamp with it, and herdr addresses
  // agents by name -- two rounds of one item would then be the same agent.
  assert.notEqual(first, second, 'two rounds of the same item are two agents');
  // 24 of the 32-character budget is head, so the recognisable prefix is
  // enough to identify the item; the remaining 8 are a hash of the FULL
  // cleaned string, not a literal tail slice.
  assert.ok(first.startsWith('fgos-tsk-a-very-'), `enough head to recognise the item, got ${first}`);
  assert.match(first.slice(-8), /^[a-f0-9]{8}$/, 'suffix is a hash, not a literal tail slice');
  assert.notEqual(first.slice(-8), second.slice(-8), 'different inputs produce different hash suffixes');
});

test('L11: a literal tail slice would have collided; the hash suffix does not', () => {
  // Two inputs engineered to share the same 16-char head AND the same
  // 16-char tail that the OLD head+tail middle-trim used to keep verbatim --
  // under that scheme both truncated to the exact same 32-character name.
  // Only the middle differs, which a literal slice throws away entirely.
  const head = 'a'.repeat(24);
  const tail = 'b'.repeat(16);
  const first = normalizeAgentName(`${head}1${tail}`);
  const second = normalizeAgentName(`${head}2${tail}`);
  assert.notEqual(first, second, 'a hash of the full string must not collide the way a literal tail slice did');
});

test('a name that already fits is untouched', () => {
  assert.equal(normalizeAgentName('fgos-tsk-1-abc'), 'fgos-tsk-1-abc');
});

test('a real capability id fits -- the name that herdr actually refused', () => {
  // `executeExecutorCli` passes the capability id as the workId, so a dispatch
  // of `fgos-coding-implement` builds `fgos-fgos-coding-implement-<ts36>`:
  // 35 characters, three over what herdr accepts, and refused as
  // `invalid_agent_name` after the pane was already open.
  const name = normalizeAgentName(`fgos-fgos-coding-implement-${(1788794800000).toString(36)}`);
  assert.ok(name.length <= 32, `got ${name.length}: ${name}`);
  assert.match(name, /^[a-z][a-z0-9_-]*$/, "and still matches herdr's own character rule");
});
