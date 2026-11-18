import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readLatestHandoff, redactText, writeHandoff, VERIFY_LINE } from '../../src/session-rotation/handoff-store.mjs';

const fgosDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rot-store-'));
const base = { persona: 'miu', name: 'main', sessionId: 'abcdef1234567', rotate: 'soft', portfolio: ['docs/backlog.md'], delta: 'did x' };
const dirOf = (d) => path.join(d, 'runtime', 'session-rotation', 'miu-main');

test('a handoff starts with the verify line, names its file by minute and session, and is read back as latest', () => {
  const d = fgosDir();
  const r = writeHandoff({ fgosDir: d, ...base, now: new Date('2026-11-17T15:04:00Z') });
  assert.equal(r.file, '261117-1504-abcdef12.md');
  const latest = readLatestHandoff({ fgosDir: d, persona: 'miu', name: 'main' });
  assert.equal(latest.text.split('\n')[0], VERIFY_LINE);
  assert.match(latest.text, /docs\/backlog\.md/);
  assert.doesNotMatch(latest.text, /Pending question/);
});

test('a hard handoff carries the last assistant message and the pending question verbatim', () => {
  const d = fgosDir();
  writeHandoff({ fgosDir: d, ...base, rotate: 'hard', lastAssistantMessage: 'Shall I proceed?\n  yes/no', pendingQuestion: 'Pick A or B', now: new Date() });
  const { text } = readLatestHandoff({ fgosDir: d, persona: 'miu', name: 'main' });
  assert.match(text, /Shall I proceed\?\n {2}yes\/no/);
  assert.match(text, /Pick A or B/);
});

test('an existing handoff file is never overwritten', () => {
  const d = fgosDir();
  const now = new Date('2026-11-17T15:04:00Z');
  const first = writeHandoff({ fgosDir: d, ...base, now });
  const before = fs.readFileSync(first.path, 'utf8');
  assert.throws(() => writeHandoff({ fgosDir: d, ...base, delta: 'other', now }), { code: 'handoff-exists' });
  assert.equal(fs.readFileSync(first.path, 'utf8'), before);
});

test('latest.json points at the newest file and leaves no temporary behind', () => {
  const d = fgosDir();
  writeHandoff({ fgosDir: d, ...base, now: new Date('2026-11-17T15:04:00Z') });
  writeHandoff({ fgosDir: d, ...base, sessionId: 'zzzzzzzz9', now: new Date('2026-11-17T15:09:00Z') });
  assert.equal(readLatestHandoff({ fgosDir: d, persona: 'miu', name: 'main' }).file, '261117-1509-zzzzzzzz.md');
  assert.deepEqual(fs.readdirSync(dirOf(d)).filter((f) => !f.endsWith('.md') && f !== 'latest.json'), []);
});

test('only the newest keep handoffs remain', () => {
  const d = fgosDir();
  for (let m = 0; m < 13; m++) writeHandoff({ fgosDir: d, ...base, keep: 10, now: new Date(Date.UTC(2026, 10, 17, 15, m)) });
  const files = fs.readdirSync(dirOf(d)).filter((f) => f.endsWith('.md')).sort();
  assert.equal(files.length, 10);
  assert.equal(files[0], '261117-1503-abcdef12.md');
});

test('secret-shaped values are redacted before anything is written', () => {
  const d = fgosDir();
  const secret = 'sk-ant-abcdefghijklmnop1234';
  writeHandoff({ fgosDir: d, ...base, delta: `key ${secret} and API_TOKEN=hunter2value and Bearer abcdefghijklmnop12345`, now: new Date() });
  const { text } = readLatestHandoff({ fgosDir: d, persona: 'miu', name: 'main' });
  assert.doesNotMatch(text, /sk-ant|hunter2|abcdefghijklmnop12345/);
  assert.match(text, /\[redacted\]/);
  assert.equal(redactText('plain text stays'), 'plain text stays');
});

test('no handoff reads as null and an unsafe persona name is refused', () => {
  assert.equal(readLatestHandoff({ fgosDir: fgosDir(), persona: 'miu', name: 'main' }), null);
  assert.throws(() => writeHandoff({ fgosDir: fgosDir(), ...base, persona: '../x' }), TypeError);
});

test('latest.json and the hard handoff carry exactly what the Rust hook reader contract names', () => {
  const contract = JSON.parse(fs.readFileSync(new URL('../../packages/session-host/contracts/rotation-files.v1.json', import.meta.url), 'utf8'));
  const d = fgosDir();
  writeHandoff({ fgosDir: d, ...base, rotate: 'hard', pendingQuestion: 'Which database?', now: new Date('2026-11-17T15:04:00Z') });
  const pointer = JSON.parse(fs.readFileSync(path.join(dirOf(d), 'latest.json'), 'utf8'));
  assert.deepEqual(Object.keys(pointer).sort(), Object.keys(contract.files['latest.json'].shape).sort());
  assert.match(readLatestHandoff({ fgosDir: d, persona: 'miu', name: 'main' }).text, /\n## Pending question \(verbatim\)\n\nWhich database\?\n/);
});
