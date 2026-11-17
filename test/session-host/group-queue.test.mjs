// Per-group promise queue of the Session Host client's async open and retire(close): calls of
// one groupKey run one after another, other groups are not held back, and one
// failed call does not stall the next. Against a recording stand-in for the host
// binary: the order and overlap of the calls are the point.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSessionHost } from '../../src/session-host/client.mjs';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-sh-queue-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

// A host stand-in: logs "start/end <op> <key>" around a pause, answers `ok`.
const recorder = path.join(scratch, 'recording-host.mjs');
const timeline = path.join(scratch, 'timeline.log');
fs.writeFileSync(recorder, `#!${process.execPath}
import fs from 'node:fs';
const op = process.argv[4];
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const key = input.request.key ?? input.request.placement.key;
fs.appendFileSync(${JSON.stringify(timeline)}, 'start ' + op + ' ' + key + ' ' + (input.request.groupKey ?? '-') + '\\n');
await new Promise((r) => setTimeout(r, 60));
fs.appendFileSync(${JSON.stringify(timeline)}, 'end ' + op + ' ' + key + '\\n');
if (key === 'fails') { console.log(JSON.stringify({ v: 1, protocol: 1, result: 'unknown', code: 'placement-unknown', detail: 'forced', op })); }
else if (op === 'open') console.log(JSON.stringify({ v: 1, protocol: 1, op, result: 'placed', placement: { host: 'terminal', key } }));
else console.log(JSON.stringify({ v: 1, protocol: 1, op, result: 'retired' }));
`, { mode: 0o755 });

const events = () => (fs.existsSync(timeline) ? fs.readFileSync(timeline, 'utf8').split('\n').filter(Boolean) : []);

test('calls of one group never overlap; another group runs alongside', async () => {
  fs.rmSync(timeline, { force: true });
  const host = createSessionHost({ hostBin: recorder });
  const display = { title: 'q' };
  const jobs = [
    ...[1, 2, 3, 4, 5].map((n) => host.openAsync({ host: 'terminal', key: `a${n}`, groupKey: 'group-a', cwd: '/w', display })),
    host.retireAsync({ host: 'terminal', key: 'a1' }, 'close'),
    host.retireAsync({ host: 'terminal', key: 'a2' }, 'close'),
    host.openAsync({ host: 'terminal', key: 'b1', groupKey: 'group-b', cwd: '/w', display }),
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
  assert.deepEqual(groupA, ['open a1', 'open a2', 'open a3', 'open a4', 'open a5', 'retire a1', 'retire a2']);
  const firstB = events().findIndex((e) => e === 'start open b1 group-b');
  const lastAEnd = events().map((e) => e).lastIndexOf('end retire a2');
  assert.ok(firstB < lastAEnd, 'group-b waited for group-a');
});

test('a failed call does not stall the calls queued behind it', async () => {
  fs.rmSync(timeline, { force: true });
  const host = createSessionHost({ hostBin: recorder });
  const first = host.openAsync({ host: 'terminal', key: 'fails', groupKey: 'g-fail', cwd: '/w' });
  const second = host.openAsync({ host: 'terminal', key: 'after', groupKey: 'g-fail', cwd: '/w' });
  assert.equal((await first).result, 'unknown');
  assert.equal((await second).result, 'placed');
});

test('closing a key whose group is unknown is refused, not run outside the queue', async () => {
  const host = createSessionHost({ hostBin: recorder });
  const stranger = { host: 'terminal', key: 'stranger' };
  await assert.rejects(host.retireAsync(stranger, 'close'), (e) => e.code === 'session-host-unknown-group');
  assert.equal((await host.retireAsync(stranger, 'close', { groupKey: 'g-given' })).result, 'retired');
});

test('a route error rejects its own call and the queue moves on', async () => {
  const host = createSessionHost({ hostBin: path.join(scratch, 'missing-host') });
  const bad = host.openAsync({ host: 'terminal', key: 'k1', groupKey: 'g-err', cwd: '/w' });
  const next = host.openAsync({ host: 'terminal', key: 'k2', groupKey: 'g-err', cwd: '/w' });
  await assert.rejects(bad, (e) => e.code === 'session-host-no-host-binary');
  await assert.rejects(next, (e) => e.code === 'session-host-no-host-binary');
});
