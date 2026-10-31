import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkMailboxClaudeAccept, claudeUserSettings, fixMailboxClaudeAccept, readAccept } from '../../src/setup/mailbox-claude-accept.mjs';

const on = () => ({ state: 'on' });
const world = (settings) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-accept-'));
  const location = { dir, file: path.join(dir, 'settings.json') };
  if (settings !== undefined) fs.writeFileSync(location.file, settings);
  return location;
};

test('the Claude config dir is CLAUDE_CONFIG_DIR, else ~/.claude, and its user settings file is settings.json', () => {
  assert.deepEqual(claudeUserSettings({ env: { CLAUDE_CONFIG_DIR: '/c' }, home: '/h' }), { dir: '/c', file: '/c/settings.json' });
  assert.deepEqual(claudeUserSettings({ env: {}, home: '/h' }), { dir: '/h/.claude', file: '/h/.claude/settings.json' });
});

test('the check passes on accept or a chosen hold, fails with the fix named when the key is absent or another value, and says why when the file cannot be read', () => {
  assert.equal(checkMailboxClaudeAccept('/p', { location: world('{"crossSessionInbound":"accept"}'), optIn: on }).passed, true);
  const held = checkMailboxClaudeAccept('/p', { location: world('{"crossSessionInbound":"hold"}'), optIn: on });
  assert.equal(held.passed, true);
  assert.match(held.message, /by your choice/);
  for (const text of [undefined, '{}', '{"crossSessionInbound":"ask"}']) {
    const result = checkMailboxClaudeAccept('/p', { location: world(text), optIn: on });
    assert.equal(result.passed, false, String(text));
    assert.match(result.message, /fgos doctor --fix/);
  }
  assert.match(checkMailboxClaudeAccept('/p', { location: world('not json'), optIn: on }).message, /cannot be read/);
  assert.equal(checkMailboxClaudeAccept('/p', { location: world(undefined), optIn: () => ({ state: 'off' }) }).passed, true, 'a mailbox that is off needs no accept');
  assert.equal(checkMailboxClaudeAccept('/p', { location: { dir: '/no/such/dir', file: '/no/such/dir/settings.json' }, optIn: on }).passed, true, 'no Claude Code here, nothing to set');
});

test('the fix writes the one key and keeps every other key, never replaces a hold or an unreadable file, and leaves the file private', () => {
  const location = world('{"theme":"dark","hooks":{"a":1}}');
  const fixed = fixMailboxClaudeAccept('/p', { location, optIn: on });
  assert.equal(fixed.fixed, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(location.file, 'utf8')), { theme: 'dark', hooks: { a: 1 }, crossSessionInbound: 'accept' });
  assert.equal(readAccept(location.file).state, 'accept');
  assert.equal(fixMailboxClaudeAccept('/p', { location, optIn: on }).fixed, true, 'a second run changes nothing');

  const fresh = world(undefined);
  assert.equal(fixMailboxClaudeAccept('/p', { location: fresh, optIn: on }).fixed, true);
  assert.equal(fs.statSync(fresh.file).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(fresh.dir), ['settings.json'], 'no temporary file is left');

  const held = world('{"crossSessionInbound":"hold"}');
  assert.equal(fixMailboxClaudeAccept('/p', { location: held, optIn: on }).fixed, false);
  assert.equal(readAccept(held.file).state, 'hold');
  const broken = world('{ nope');
  assert.equal(fixMailboxClaudeAccept('/p', { location: broken, optIn: on }).fixed, false);
  assert.equal(fs.readFileSync(broken.file, 'utf8'), '{ nope');
  assert.equal(fixMailboxClaudeAccept('/p', { location: world(undefined), optIn: () => ({ state: 'off' }) }).fixed, false);
});
