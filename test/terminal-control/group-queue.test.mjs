// Per-group promise queue of the async allocate and release(close): calls of
// one groupKey run one after another, other groups are not held back, and one
// failed call does not stall the next. Against a recording stand-in for the host
// binary: the order and overlap of the calls are the point.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTerminalControl } from '../../src/terminal-control/client.mjs';

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
  const display = { title: 'q' };
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
  const first = tc.allocateAsync({ key: 'fails', groupKey: 'g-fail', display: { title: 'x' } });
  const second = tc.allocateAsync({ key: 'after', groupKey: 'g-fail', display: { title: 'x' } });
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
  const bad = tc.allocateAsync({ key: 'k1', groupKey: 'g-err', display: { title: 'x' } });
  const next = tc.allocateAsync({ key: 'k2', groupKey: 'g-err', display: { title: 'x' } });
  await assert.rejects(bad, (e) => e.code === 'terminal-control-no-host-binary');
  await assert.rejects(next, (e) => e.code === 'terminal-control-no-host-binary');
});
