// mailbox-wake-probe.test.mjs — the interactive wake probes' logic (scripts/lib/mailbox-wake-probe.mjs):
// the probe table within the owner's ten sessions, the panes, the socket write that never leaves the
// probe's own directory, the queue call, the timer extension, and what a probe reads from records,
// the screen and the focus.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import * as wake from '../../scripts/lib/mailbox-wake-probe.mjs';

const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

test('the probes stay within the owner\'s ten sessions, each with an expected result and a stop condition, and the presence probes start none', () => {
  assert.deepEqual(wake.PROBES.map((p) => p.id), ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10']);
  assert.deepEqual(wake.PROBES.map((p) => p.sessions), [1, 1, 1, 0, 1, 1, 1, 0, 1, 1]);
  assert.equal(wake.sessionsStarted(), 8, 'eight of the owner\'s ten');
  for (const p of wake.PROBES) assert.ok(p.question && p.expected && p.stop, p.id);
  assert.throws(() => wake.probeOf('W4'), /starts no session; it reads W1, W2, W3/);
  assert.throws(() => wake.probeOf('W11'), /no probe W11/);
  assert.equal(wake.probeOf('W7').replaces.includes('--no-daemon'), true, 'the replaced probe says why');
});

test('each probe has its own pane key and label, and a dry pane never shares the real key', () => {
  const panes = wake.PROBES.filter((p) => p.sessions).map((p) => wake.paneOf(p));
  assert.equal(new Set(panes.map((p) => p.key)).size, panes.length);
  assert.deepEqual(wake.paneOf(wake.probeOf('W1')), { group: 'mbx-wake-v7f', key: 'mbx-wake-v7f-w1', label: 'V7f W1 · claude · scoped accept, bypass' });
  assert.deepEqual(wake.paneOf(wake.probeOf('W3'), { dry: true }), { group: 'mbx-wake-v7f-dry', key: 'mbx-wake-v7f-w3-dry', label: 'V7f W3 · claude · scoped accept, bypass, busy' });
});

test('Claude Code\'s inbound setting is scoped to the probe\'s own settings file, only where the probe names one, and the prompting probe asks no bypass', () => {
  assert.equal(wake.claudeSettings(wake.probeOf('W1'), {}).crossSessionInbound, 'accept');
  assert.equal('crossSessionInbound' in wake.claudeSettings(wake.probeOf('W2'), {}), false);
  const bypass = wake.claudeArgs(wake.probeOf('W1'), { settings: '/p/s.json', noMcp: ['--strict-mcp-config'] });
  assert.deepEqual(bypass.slice(0, 9), ['--model', 'haiku', '--effort', 'medium', '--setting-sources', 'project', '--settings', '/p/s.json', '--strict-mcp-config']);
  assert.ok(bypass.includes('--dangerously-skip-permissions'));
  const prompting = wake.claudeArgs(wake.probeOf('W7'), { settings: '/p/s.json', noMcp: [] });
  assert.ok(!prompting.includes('--dangerously-skip-permissions'));
  assert.deepEqual(prompting.slice(prompting.indexOf('--permission-mode'), prompting.indexOf('--permission-mode') + 2), ['--permission-mode', 'default']);
  assert.match(wake.firstPrompt(wake.probeOf('W3')), /Run: ls\. Then Run: sleep 45\./);
  assert.doesNotMatch(wake.firstPrompt(wake.probeOf('W1')), /sleep/);
});

test('the socket comes from the probe\'s own session file and is refused outside the probe directory', () => {
  const dir = scratch('wake-socket-');
  const file = path.join(dir, 'session.json');
  fs.writeFileSync(file, JSON.stringify({ messagingSocketPath: path.join(dir, 'run', 'cc-socks', '7.sock') }));
  assert.equal(wake.socketOf(file, dir), path.join(dir, 'run', 'cc-socks', '7.sock'));
  fs.writeFileSync(file, JSON.stringify({ messagingSocketPath: '/run/user/1000/cc-socks/7.sock' }));
  assert.throws(() => wake.socketOf(file, dir), /outside the probe directory/);
  fs.writeFileSync(file, JSON.stringify({ messagingSocketPath: `${dir}-other/7.sock` }));
  assert.throws(() => wake.socketOf(file, dir), /outside the probe directory/, 'a sibling with the same prefix is outside');
});

test('the socket write sends one user line holding the nudge and nothing else, and a missing socket is a result, never a throw', async () => {
  const dir = scratch('wake-write-');
  const socket = path.join(dir, 's.sock');
  let got = '';
  const server = net.createServer((c) => c.on('data', (d) => { got += d; }));
  await new Promise((resolve) => server.listen(socket, resolve));
  const done = await wake.writeSocket(socket, wake.socketLine());
  await new Promise((resolve) => server.close(resolve));
  assert.equal(done.ok, true);
  assert.deepEqual(got.split('\n').filter(Boolean).map((l) => JSON.parse(l)), [{ type: 'user', message: { role: 'user', content: wake.NUDGE } }]);
  const missing = await wake.writeSocket(path.join(dir, 'none.sock'), wake.socketLine());
  assert.deepEqual([missing.ok, missing.error], [false, 'ENOENT']);
});

test('the queue call names the thread and the nudge; the timer extension delivers the nudge by each CLI\'s turn-starting method and carries no body', () => {
  assert.deepEqual(wake.queueArgs('th-1'), ['queue', '--thread', 'th-1', '--message', wake.NUDGE]);
  const pi = wake.timerExtension('pi', { trigger: '/w/.wake-trigger', log: '/p/ext.log' });
  const omp = wake.timerExtension('omp', { trigger: '/w/.wake-trigger', log: '/p/ext.log' });
  assert.match(pi, /api\.sendUserMessage\(NUDGE\)/);
  assert.match(omp, /api\.sendMessage\(\{[^}]*content: NUDGE[^}]*\}, \{ triggerTurn: true \}\)/);
  for (const text of [pi, omp]) {
    assert.match(text, /"\/w\/\.wake-trigger"/);
    assert.match(text, /fs\.rmSync\(TRIGGER/, 'one trigger, one delivery');
    assert.match(text, new RegExp(`}, ${wake.TIMER_MS}\\);`));
  }
});

test('a turn started only when a record after the fire carries the nudge and a model output follows it; bookkeeping records and earlier records do not count', () => {
  const t = (s) => new Date(1_000_000 + s * 1000).toISOString();
  const nudge = (s, type = 'user') => ({ type, timestamp: t(s), message: { role: 'user', content: wake.NUDGE } });
  const reply = (s) => ({ type: 'assistant', timestamp: t(s), message: { role: 'assistant', content: [{ type: 'text', text: 'hi' }] } });
  assert.deepEqual(wake.turnAfter([nudge(1), reply(3)], 1_000_000 + 2_000), { started: false, carriedBy: null, repliedAt: null, latencyMs: null }, 'before the fire');
  assert.deepEqual(wake.turnAfter([{ type: 'queue-operation', timestamp: t(3), content: wake.NUDGE }, reply(4)], 1_000_000 + 2_000).started, false);
  const started = wake.turnAfter([nudge(3), reply(5)], 1_000_000 + 2_000);
  assert.deepEqual(started, { started: true, carriedBy: 'user:user:prompt', repliedAt: 1_000_000 + 5_000, latencyMs: 3_000 });
  assert.equal(wake.turnAfter([nudge(3)], 1_000_000 + 2_000).started, false, 'no model output yet');
  const codex = [{ type: 'response_item', timestamp: t(4), payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: wake.NUDGE }] } }, { type: 'response_item', timestamp: t(6), payload: { type: 'function_call', arguments: '{}' } }];
  assert.deepEqual([wake.turnAfter(codex, 1_000_000 + 2_000).carriedBy, wake.turnAfter(codex, 1_000_000 + 2_000).latencyMs], ['response_item:message:user', 4_000]);
});

test('a probe reads a dialog from the screen, the focus from herdr, the presence in force at the fire, and meets the bar only with a turn, no dialog and no focus change', () => {
  assert.match(wake.dialogOn('…\nHeld message from another session  [Deny]  [Deliver]\n'), /Held message/);
  assert.match(wake.dialogOn(' Trust project folder?\n → Trust'), /project/, 'pi\'s trust question');
  assert.equal(wake.dialogOn('READY\n> '), null);
  assert.deepEqual(wake.focusedPanes({ result: { panes: [{ pane_id: 'w1:p2', focused: true }, { pane_id: 'w1:p3', focused: false }] } }), ['w1:p2']);
  assert.equal(wake.statusAt([{ at: 1, status: 'busy' }, { at: 5, status: 'idle' }], 6), 'idle');
  assert.equal(wake.statusAt([{ at: 1, status: 'busy' }, { at: 5, status: 'idle' }], 4), 'busy');
  assert.equal(wake.statusAt([{ at: 5, status: 'idle' }], 1), null);
  const base = { started: true, dialog: null, focusBefore: ['w1:p2'], focusAfter: ['w1:p2'] };
  assert.deepEqual(wake.verdict(base), { started: true, dialog: null, focusChanged: false, typedInput: false, meetsBar: true });
  assert.equal(wake.verdict({ ...base, dialog: 'Held message' }).meetsBar, false);
  assert.equal(wake.verdict({ ...base, focusAfter: ['w1:p9'] }).meetsBar, false);
  assert.equal(wake.verdict({ ...base, started: false }).meetsBar, false);
});
