// The owning proof of the end of a head session on purpose: the pane is closed through Session Host, `retiredAt` lands in
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

const hostOf = (answer = { result: 'retired' }) => {
  const closes = [];
  return { closes, retireAsync: async (placement, how, extra) => { closes.push({ key: placement.key, how, groupKey: extra.groupKey }); return answer; } };
};

test('stopping a live head closes its pane, stamps retiredAt in the lineage placement and keeps the rest of the record', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const host = hostOf();
  const answer = await stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'plan done' }, { host, identity: () => ({ live: true }), now: () => new Date('2026-11-19T01:02:03Z') });
  assert.deepEqual(answer, { stopped: true });
  assert.deepEqual(host.closes, [{ key: 'head-lead-x-1', how: 'close', groupKey: 'g1' }]);
  const record = readHeadPlacement(dir);
  assert.equal(record.retiredAt, '2026-11-19T01:02:03.000Z');
  assert.deepEqual([record.gen, record.runDir, record.retiredReason], [2, '/run/2', 'plan done']);
});

test('a group key the placement does not carry falls back to its slot key', async (t) => {
  const { projectRoot } = lineage(t, { host: 'terminal', key: 'head-lead-x-1' });
  const host = hostOf();
  await stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host, identity: () => ({ live: true }) });
  assert.equal(host.closes[0].groupKey, 'head-lead-x-1');
});

test('a pane that will not close is refused by name and leaves no retired stamp', async (t) => {
  const { projectRoot, dir } = lineage(t);
  await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, { host: hostOf({ result: 'refused', code: 'busy' }), identity: () => ({ live: true }) }), (err) => err.code === 'retire-refused');
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
