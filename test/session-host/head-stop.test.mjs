// The owning proof of the end of a head session on purpose: the head is ended through its own supervisor, its pane is retired through Session Host, `retiredAt` lands in
// the lineage's placement.json (what the head-state source reads as `retired`), and a role nobody holds stops nothing.
// Who may ask is the request route's rule, proven in head-request.test.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lineageDirOf, readHeadPlacement, writeHeadPlacement } from '../../src/session-host/head-start.mjs';
import { stopHeadSession } from '../../src/session-host/head-stop.mjs';

function lineage(t, placement = { host: 'terminal', key: 'head-lead-x-1', groupKey: 'g1' }) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-stop-'));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  const dir = lineageDirOf(projectRoot, 'lead', 'x');
  writeHeadPlacement(dir, { role: 'head:lead-x', gen: 2, placement, runDir: '/run/2', persona: 'lead', startedAt: '2026-11-19T00:00:00Z' });
  return { projectRoot, dir };
}

// An ended head: the supervisor was asked to stop it and has closed its attempt; `order` records who ran when.
const endedHead = (order = []) => ({ end: (runDir) => { order.push(`end:${runDir}`); return true; }, closed: () => true, sleep: async () => {} });

const hostOf = (answer = { result: 'retired' }) => {
  const closes = [];
  return { closes, retireAsync: async (placement, how, extra) => { closes.push({ key: placement.key, how, groupKey: extra.groupKey }); return answer; } };
};

test('stopping a live head ends it through its supervisor, retires its pane, stamps retiredAt in the lineage placement and keeps the rest of the record', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const order = [];
  const host = { ...hostOf(), retireAsync: async (placement, how, extra) => { order.push('retire'); return hostOf().retireAsync(placement, how, extra); } };
  const answer = await stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'plan done' }, { host, ...endedHead(order), identity: () => ({ live: true }), now: () => new Date('2026-11-19T01:02:03Z') });
  assert.deepEqual(answer, { stopped: true });
  assert.deepEqual(order, ['end:/run/2', 'retire']);
  const record = readHeadPlacement(dir);
  assert.equal(record.retiredAt, '2026-11-19T01:02:03.000Z');
  assert.deepEqual([record.gen, record.runDir, record.retiredReason], [2, '/run/2', 'plan done']);
});

test('a group key the placement does not carry falls back to its slot key', async (t) => {
  const { projectRoot } = lineage(t, { host: 'terminal', key: 'head-lead-x-1' });
  const host = hostOf();
  await stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host, ...endedHead(), identity: () => ({ live: true }) });
  assert.equal(host.closes[0].groupKey, 'head-lead-x-1');
});

test('a pane that will not close is refused by name and keeps the retired stamp of the requested stop', async (t) => {
  const { projectRoot, dir } = lineage(t);
  await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host: hostOf({ result: 'refused', code: 'busy' }), ...endedHead(), identity: () => ({ live: true }) }), (err) => err.code === 'retire-refused');
  assert.ok(readHeadPlacement(dir).retiredAt);
});

test('retiredAt is on disk before the supervisor is asked to end the head, so a head stopping its own role keeps the stamp', async (t) => {
  const { projectRoot, dir } = lineage(t);
  let stampWhenEnded;
  await stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host: hostOf(), identity: () => ({ live: true }), closed: () => true, sleep: async () => {}, end: () => { stampWhenEnded = readHeadPlacement(dir).retiredAt; return true; } });
  assert.ok(stampWhenEnded);
});

test('a head that does not end after its stop request is refused stop-not-ended, keeps its pane and the retired stamp of the requested stop', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const host = hostOf();
  await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host, identity: () => ({ live: true }), end: () => true, closed: () => false, sleep: async () => {}, waitMs: 0 }), (err) => err.code === 'stop-not-ended');
  assert.deepEqual(host.closes, []);
  assert.ok(readHeadPlacement(dir).retiredAt);
});

test('a stop request that cannot be written is refused stop-not-ended and leaves no retired stamp', async (t) => {
  const { projectRoot, dir } = lineage(t);
  await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host: hostOf(), identity: () => ({ live: true }), end: () => false }), (err) => err.code === 'stop-not-ended');
  assert.equal(readHeadPlacement(dir).retiredAt, undefined);
});

test('a role no live session holds stops nothing, whether or not a placement is recorded', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const host = hostOf();
  assert.deepEqual(await stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host, identity: () => ({ live: false }) }), { stopped: false, reason: 'not-live' });
  assert.deepEqual(await stopHeadSession({ persona: 'lead', name: 'never-started', projectRoot }, { host, identity: () => ({ live: true }) }), { stopped: false, reason: 'not-live' });
  assert.deepEqual(host.closes, []);
  assert.equal(readHeadPlacement(dir).retiredAt, undefined);
});

test('a lead holding the short role lead:<LANE> is resolved through Identity and its pane retired, with no stamp when it has no head placement', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const host = hostOf();
  const asked = [];
  const identity = ({ role }) => { asked.push(role); return { live: true, record: { ids: { terminal: { key: 'slot-winci' } } } }; };
  const answer = await stopHeadSession({ role: 'lead:WINCI', projectRoot, reason: 'plan done' }, { host, identity, ...endedHead() });
  assert.deepEqual(answer, { stopped: true, retiredAt: null });
  assert.deepEqual(asked, ['lead:WINCI']);
  assert.deepEqual(host.closes, [{ key: 'slot-winci', how: 'close', groupKey: 'slot-winci' }]);
  assert.equal(readHeadPlacement(dir).retiredAt, undefined, 'an unrelated lineage is never stamped');
});

test('a short-role lead whose Identity record names a head lineage ends through that head supervisor and gets the stamp', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const host = hostOf();
  const order = [];
  const identity = () => ({ live: true, record: { ids: { head: { persona: 'lead', name: 'x', gen: 2 } } } });
  const answer = await stopHeadSession({ role: 'lead:WINCI', projectRoot }, { host, identity, ...endedHead(order), now: () => new Date('2026-11-19T01:02:03Z') });
  assert.deepEqual(answer, { stopped: true });
  assert.deepEqual(order, ['end:/run/2']);
  assert.equal(readHeadPlacement(dir).retiredAt, '2026-11-19T01:02:03.000Z');
});

test('a short role nobody holds stops nothing, a holder naming no placement is reported, and a role that is not a lead short role is refused', async (t) => {
  const { projectRoot } = lineage(t);
  const host = hostOf();
  assert.deepEqual(await stopHeadSession({ role: 'lead:GONE', projectRoot }, { host, identity: () => ({ live: false }) }), { stopped: false, reason: 'not-live' });
  assert.deepEqual(await stopHeadSession({ role: 'lead:WINCI', projectRoot }, { host, identity: () => ({ live: true, record: {} }) }), { stopped: false, reason: 'no-placement' });
  await assert.rejects(stopHeadSession({ role: 'supervisor:x', projectRoot }, { host, identity: () => ({ live: true }) }), (err) => err.code === 'bad-role');
  assert.deepEqual(host.closes, []);
});
