// Per-group promise queue of the async allocate and release(close): calls of
// one groupKey run one after another, other groups are not held back, and one
// failed call does not stall the next. First against a recording stand-in for
// the host binary (timing is the point), then against the real host binary and
// the fake herdr (nothing splits a pane that is being closed).
import '../helpers/process-tmp-root.mjs';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTerminalControl } from '../../src/terminal-control/client.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const FAKE_HERDR = path.join(REPO_ROOT, 'packages/terminal-control/rust/tests/fixtures/herdr/fake-herdr.sh');

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tc-queue-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

// A host stand-in: logs "start/end <op> <key>" around a pause, answers `ok`.
const recorder = path.join(scratch, 'recording-host.mjs');
const timeline = path.join(scratch, 'timeline.log');
fs.writeFileSync(recorder, `#!${process.execPath}
import fs from 'node:fs';
const op = process.argv[4];
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const key = input.request.key;
fs.appendFileSync(${JSON.stringify(timeline)}, 'start ' + op + ' ' + key + ' ' + (input.request.groupKey ?? '-') + '\\n');
await new Promise((r) => setTimeout(r, 60));
fs.appendFileSync(${JSON.stringify(timeline)}, 'end ' + op + ' ' + key + '\\n');
if (key === 'fails') { console.log(JSON.stringify({ v: 1, protocol: 1, result: 'unknown', reason: 'forced', op })); }
else console.log(JSON.stringify({ v: 1, protocol: 1, op, result: 'slot', slot: { tabId: 't', paneId: 'p-' + key }, origin: 'allocated' }));
`, { mode: 0o755 });

const events = () => (fs.existsSync(timeline) ? fs.readFileSync(timeline, 'utf8').split('\n').filter(Boolean) : []);

test('calls of one group never overlap; another group runs alongside', async () => {
  fs.rmSync(timeline, { force: true });
  const tc = createTerminalControl({ hostBin: recorder });
  const display = { label: 'q' };
  const jobs = [
    ...[1, 2, 3, 4, 5].map((n) => tc.allocateAsync({ key: `a${n}`, groupKey: 'group-a', display })),
    tc.releaseAsync({ key: 'a1', disposition: 'close' }),
    tc.releaseAsync({ key: 'a2', disposition: 'close' }),
    tc.allocateAsync({ key: 'b1', groupKey: 'group-b', display }),
  ];
  await Promise.all(jobs);

  let open = 0;
  let maxOpenInGroupA = 0;
  const groupOf = {};
  for (const e of events()) {
    const [kind, , key, group] = e.split(' ');
    if (kind === 'start' && group) groupOf[key] = group;
    if (!key.startsWith('a')) continue;
    open += kind === 'start' ? 1 : -1;
    maxOpenInGroupA = Math.max(maxOpenInGroupA, open);
  }
  assert.equal(maxOpenInGroupA, 1, 'group-a calls overlapped');

  const order = events().filter((e) => e.startsWith('start')).map((e) => e.split(' ').slice(1, 3).join(' '));
  const groupA = order.filter((e) => / a\d$/.test(e));
  assert.deepEqual(groupA, ['allocate a1', 'allocate a2', 'allocate a3', 'allocate a4', 'allocate a5', 'release a1', 'release a2']);
  const firstB = events().findIndex((e) => e === 'start allocate b1 group-b');
  const lastAEnd = events().map((e) => e).lastIndexOf('end release a2');
  assert.ok(firstB < lastAEnd, 'group-b waited for group-a');
});

test('a failed call does not stall the calls queued behind it', async () => {
  fs.rmSync(timeline, { force: true });
  const tc = createTerminalControl({ hostBin: recorder });
  const first = tc.allocateAsync({ key: 'fails', groupKey: 'g-fail', display: { label: 'x' } });
  const second = tc.allocateAsync({ key: 'after', groupKey: 'g-fail', display: { label: 'x' } });
  assert.equal((await first).result, 'unknown');
  assert.equal((await second).result, 'slot');
});

test('closing a key whose group is unknown is refused, not run outside the queue', async () => {
  const tc = createTerminalControl({ hostBin: recorder });
  await assert.rejects(tc.releaseAsync({ key: 'stranger', disposition: 'close' }), (e) => e.code === 'terminal-control-unknown-group');
  assert.equal((await tc.releaseAsync({ key: 'stranger', disposition: 'close', groupKey: 'g-given' })).result, 'slot');
});

test('a route error rejects its own call and the queue moves on', async () => {
  const tc = createTerminalControl({ hostBin: path.join(scratch, 'missing-host') });
  const bad = tc.allocateAsync({ key: 'k1', groupKey: 'g-err', display: { label: 'x' } });
  const next = tc.allocateAsync({ key: 'k2', groupKey: 'g-err', display: { label: 'x' } });
  await assert.rejects(bad, (e) => e.code === 'terminal-control-no-host-binary');
  await assert.rejects(next, (e) => e.code === 'terminal-control-no-host-binary');
});

test('5 allocates and 2 closes of one group reach herdr one at a time', async () => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  const sock = path.join(scratch, 'herdr.sock');
  const server = net.createServer().listen(sock);
  await new Promise((resolve) => server.once('listening', resolve));
  process.env.FGOS_STATE_ROOT = path.join(scratch, 'state');
  const log = path.join(scratch, 'herdr.log');
  const tc = createTerminalControl({
    hostBin: HOST_BIN,
    herdrBin: FAKE_HERDR,
    // Only the shell is in each pane's foreground, so the closes are provably safe.
    env: { FAKE_HERDR_LOG: log, FAKE_HERDR_SOCKET: sock, HERDR_SOCKET_PATH: sock, FAKE_HERDR_FOREGROUND: 'shell' },
  });
  try {
    const display = { label: 'real-queue' };
    const allocations = [1, 2, 3, 4, 5].map((n) => tc.allocateAsync({ key: `w${n}`, groupKey: 'group-real', display }));
    const closes = [1, 2].map((n) => tc.releaseAsync({ key: `w${n}`, disposition: 'close' }));
    const results = await Promise.all([...allocations, ...closes]);
    for (const r of results.slice(0, 5)) assert.equal(r.result, 'slot');
    // The fake hands out one pane for every split, so a later allocate of the
    // same group may find its record's pane closed; the close itself is what
    // must have come after every allocate, never in between.
    for (const r of results.slice(5)) assert.ok(['released', 'kept-unknown'].includes(r.result), JSON.stringify(r));

    const calls = fs.readFileSync(log, 'utf8').split('\n').filter(Boolean).map((l) => l.replace(/\t+$/, '').split('\t').join(' '));
    const placing = calls.map((c, i) => [c, i]).filter(([c]) => /^(tab create|pane split)/.test(c)).map(([, i]) => i);
    const closing = calls.map((c, i) => [c, i]).filter(([c]) => c.startsWith('pane close')).map(([, i]) => i);
    assert.ok(placing.length >= 1);
    assert.ok(closing.length >= 1, 'a close reached herdr');
    assert.ok(Math.max(...placing) < Math.min(...closing), `a placement came after a close:\n${calls.join('\n')}`);
  } finally {
    server.close();
  }
});
