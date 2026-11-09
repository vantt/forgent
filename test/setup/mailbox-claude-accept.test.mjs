import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkMailboxClaudeAccept, claudeUserSettings } from '../../src/setup/mailbox-claude-accept.mjs';

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

test('the check reports accept, a chosen hold and the default without failing and names fgos wire-agents for the edit, fails only on a file it cannot read, and never writes', () => {
  assert.equal(checkMailboxClaudeAccept('/p', { location: world('{"crossSessionInbound":"accept"}'), optIn: on }).passed, true);
  const held = checkMailboxClaudeAccept('/p', { location: world('{"crossSessionInbound":"hold"}'), optIn: on });
  assert.equal(held.passed, true);
  assert.match(held.message, /by your choice/);
  for (const text of [undefined, '{}', '{"crossSessionInbound":"ask"}']) {
    const location = world(text);
    const result = checkMailboxClaudeAccept('/p', { location, optIn: on });
    assert.equal(result.passed, true, String(text));
    assert.match(result.message, /fgOS never sets it; `fgos wire-agents` shows the edit/);
    assert.equal(fs.existsSync(location.file) ? fs.readFileSync(location.file, 'utf8') : undefined, text, 'the check writes nothing');
  }
  const unreadable = checkMailboxClaudeAccept('/p', { location: world('not json'), optIn: on });
  assert.equal(unreadable.passed, false);
  assert.match(unreadable.message, /cannot be read/);
  assert.equal(checkMailboxClaudeAccept('/p', { location: world(undefined), optIn: () => ({ state: 'off' }) }).passed, true, 'a mailbox that is off needs no accept');
  assert.equal(checkMailboxClaudeAccept('/p', { location: { dir: '/no/such/dir', file: '/no/such/dir/settings.json' }, optIn: on }).passed, true, 'no Claude Code here, nothing to set');
});
