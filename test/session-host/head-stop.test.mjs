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
import { readLatestHandoff } from '../../src/session-rotation/handoff-store.mjs';
import { recordStopTrace } from '../../src/session-rotation/rotate.mjs';
import { runHeadRequest } from '../../src/session-host/head-request.mjs';
import { ensureGitAddon } from '../helpers/git-addon.mjs';

ensureGitAddon();

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
  const waited = [];
  const host = { ...hostOf(), retireAsync: async (placement, how, extra) => { order.push('retire'); return hostOf().retireAsync(placement, how, extra); } };
  const answer = await stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'plan done' }, {
    host, ...endedHead(order), identity: () => ({ live: true }), now: () => new Date('2026-11-19T01:02:03Z'),
    supervisorAlive: (runDir) => { order.push(`alive:${runDir}`); return true; },
    closed: (runDir) => { waited.push(runDir); return true; },
  });
  assert.deepEqual(answer, { stopped: true });
  // An alive supervisor is asked to stop the head and the attempt's close is awaited, as before.
  assert.deepEqual(order, ['alive:/run/2', 'end:/run/2', 'retire']);
  assert.deepEqual(waited, ['/run/2']);
  const record = readHeadPlacement(dir);
  assert.equal(record.retiredAt, '2026-11-19T01:02:03.000Z');
  assert.deepEqual([record.gen, record.runDir, record.retiredReason], [2, '/run/2', 'plan done']);
});

test('a head whose run supervisor is gone is settled through adopt instead of being asked to stop, and its pane is retired', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const order = [];
  const adopted = [];
  const host = hostOf();
  const answer = await stopHeadSession({ persona: 'lead', name: 'x', projectRoot }, {
    host,
    identity: () => ({ live: true }),
    supervisorAlive: (runDir) => { order.push(`alive:${runDir}`); return false; },
    adopt: async (runDir) => { adopted.push(runDir); order.push(`adopt:${runDir}`); },
    // A gone supervisor can neither be asked to stop nor close the attempt; either call is the bug this proves absent.
    end: () => assert.fail('a head whose supervisor is gone is never asked to stop'),
    closed: () => assert.fail('a head whose supervisor is gone is not waited on'),
    now: () => new Date('2026-11-19T01:02:03Z'),
  });
  assert.deepEqual(answer, { stopped: true });
  assert.deepEqual(order, ['alive:/run/2', 'adopt:/run/2']);
  assert.deepEqual(adopted, ['/run/2']);
  assert.deepEqual(host.closes, [{ key: 'head-lead-x-1', how: 'close', groupKey: 'g1' }]);
  assert.equal(readHeadPlacement(dir).retiredAt, '2026-11-19T01:02:03.000Z');
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

test('a lead holding the short role lead:<LANE> with no head lineage is refused no-supervisor and its pane is never closed plain', async (t) => {
  const { projectRoot, dir } = lineage(t);
  // The host refuses a plain close while an agent is the pane's foreground (session-host spec 8.2).
  const closes = [];
  const host = { closes, retireAsync: async (placement) => { closes.push(placement.key); return { result: 'refused', code: 'agent-foreground' }; } };
  const asked = [];
  const identity = ({ role }) => { asked.push(role); return { live: true, record: { ids: { terminal: { key: 'slot-winci' } } } }; };
  const answer = await stopHeadSession({ role: 'lead:WINCI', projectRoot, reason: 'plan done' }, { host, identity, ...endedHead() });
  assert.deepEqual(answer, { stopped: false, reason: 'no-supervisor' });
  assert.deepEqual(asked, ['lead:WINCI']);
  assert.deepEqual(closes, []);
  assert.equal(readHeadPlacement(dir).retiredAt, undefined, 'an unrelated lineage is never stamped');
});

test('a short-role lead whose named lineage has no run directory is refused no-supervisor', async (t) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-stop-'));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  writeHeadPlacement(lineageDirOf(projectRoot, 'lead', 'y'), { role: 'head:lead-y', gen: 1, placement: { host: 'terminal', key: 'k' }, persona: 'lead', startedAt: '2026-11-19T00:00:00Z' });
  const host = hostOf();
  const identity = () => ({ live: true, record: { ids: { head: { persona: 'lead', name: 'y', gen: 1 } } } });
  assert.deepEqual(await stopHeadSession({ role: 'lead:WINCI', projectRoot }, { host, identity, ...endedHead() }), { stopped: false, reason: 'no-supervisor' });
  assert.deepEqual(host.closes, []);
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

// Sleep extends the stop effect; these cases belong here, not in a second CLI scenario suite.
test('a sleep stamps every sleep field and writes its handoff before asking the supervisor to stop', async (t) => {
  const { projectRoot, dir } = lineage(t);
  recordStopTrace(dir, { fraction: 0.2 });
  recordStopTrace(dir, { fraction: 0.45 });
  recordStopTrace(dir, { fraction: null });
  fs.appendFileSync(path.join(dir, 'stop-trace.jsonl'), '{torn');
  const wakeAt = '2026-11-27T01:00:00+07:00';
  const plan = 'plans/example';
  const identity = () => ({ live: true, record: { ids: { cliSession: { id: 'cli123456' } } } });
  await stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'sleep', wakeAt, plan, phase: '02' }, {
    host: hostOf(), identity, closed: () => true, now: () => new Date('2026-11-26T12:00:00Z'),
    end: () => {
      assert.deepEqual(Object.fromEntries(['wakeAt', 'plan', 'phase', 'contextFraction', 'cliSessionId', 'retiredReason'].map((k) => [k, readHeadPlacement(dir)[k]])), {
        wakeAt, plan, phase: '02', contextFraction: 0.45, cliSessionId: 'cli123456', retiredReason: 'sleep',
      });
      const latest = readLatestHandoff({ fgosDir: path.join(projectRoot, '.fgos'), persona: 'lead', name: 'x' });
      assert.equal(latest.rotate, 'sleep');
      assert.match(latest.text, /- plan: plans\/example/);
      assert.match(latest.text, /- phase: 02/);
      assert.ok(latest.text.includes(wakeAt));
      assert.equal(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).length, 1);
      return true;
    },
  });
});

test('a sleep without measured context or CLI binding stores nulls and can resolve a short-role lineage', async (t) => {
  const { projectRoot, dir } = lineage(t);
  await stopHeadSession({ role: 'lead:LANE', projectRoot, reason: 'sleep', wakeAt: '2026-11-27T01:00:00Z' }, {
    host: hostOf(), ...endedHead(), identity: () => ({ live: true, record: { ids: { head: { persona: 'lead', name: 'x', gen: 2 } } } }),
  });
  const record = readHeadPlacement(dir);
  assert.deepEqual([record.contextFraction, record.cliSessionId, record.plan, record.phase], [null, null, null, null]);
  assert.equal(readLatestHandoff({ fgosDir: path.join(projectRoot, '.fgos'), persona: 'lead', name: 'x' }).rotate, 'sleep');
});

test('a failed sleep handoff restores the exact placement and never asks the head to stop', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const file = path.join(dir, 'placement.json');
  const before = fs.readFileSync(file, 'utf8');
  // A real unwritable handoff target: installation cannot turn a directory into an immutable markdown file.
  fs.mkdirSync(path.join(dir, '261126-1200-headlead.md'));
  const host = hostOf();
  await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'sleep', wakeAt: '2026-11-27T01:00:00Z' }, {
    host, identity: () => ({ live: true }), now: () => new Date('2026-11-26T12:00:00Z'),
    end: () => assert.fail('a refused handoff must not stop the head'),
  }), { code: 'handoff-not-written' });
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(fs.existsSync(path.join(dir, 'latest.json')), false);
  assert.deepEqual(host.closes, []);
});

test('sleep requires an RFC 3339 wake time and wake-at is refused for every other stop reason before any write', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const before = fs.readFileSync(path.join(dir, 'placement.json'), 'utf8');
  const invalid = [undefined, '', true, 'tomorrow', '2026-11-27', '2026-11-27T01:00:00', '2026-02-30T01:00:00Z', '2026-11-27T24:00:00Z', '2026-11-27T01:00:00+24:00'];
  for (const wakeAt of invalid) {
    await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'sleep', wakeAt }), { code: 'wake-at-invalid' });
  }
  for (const reason of [null, 'manual']) {
    await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason, wakeAt: '2026-11-27T01:00:00Z' }), { code: 'wake-at-invalid' });
    for (const extra of [{ plan: 'plans/example' }, { phase: '02' }]) {
      await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason, ...extra }, {
        identity: () => assert.fail('sleep-only flags must be refused before looking up a holder'),
      }), { code: 'bad-args' });
    }
  }
  for (const extra of [{ plan: 'plans/../elsewhere' }, { plan: true }, { phase: 'two' }, { phase: 2 }]) {
    await assert.rejects(stopHeadSession({ persona: 'lead', name: 'x', projectRoot, reason: 'sleep', wakeAt: '2026-11-27T01:00:00Z', ...extra }), { code: 'bad-args' });
  }
  assert.equal(fs.readFileSync(path.join(dir, 'placement.json'), 'utf8'), before);
});

test('the confined stop payload carries sleep arguments through its existing authorization branch', async (t) => {
  const { projectRoot, dir } = lineage(t);
  const runDir = path.join(projectRoot, 'request-run');
  fs.mkdirSync(runDir);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: projectRoot, session: { role: 'head:lead-x', persona: 'lead', name: 'x' } }));
  const response = await runHeadRequest({ runDir, request: { verb: 'session stop', args: { persona: 'lead', name: 'x', reason: 'sleep', wakeAt: '2026-11-27T01:00:00Z', plan: 'plans/example', phase: '02' } } }, {
    stop: { host: hostOf(), ...endedHead(), identity: () => ({ live: true }) },
  });
  assert.deepEqual(response, { exit: 0, line: { result: 'done', data: { stopped: true } } });
  assert.equal(readHeadPlacement(dir).phase, '02');
});

test('a short role nobody holds stops nothing, and a role that is not a lead short role is refused', async (t) => {
  const { projectRoot } = lineage(t);
  const host = hostOf();
  assert.deepEqual(await stopHeadSession({ role: 'lead:GONE', projectRoot }, { host, identity: () => ({ live: false }) }), { stopped: false, reason: 'not-live' });
  await assert.rejects(stopHeadSession({ role: 'supervisor:x', projectRoot }, { host, identity: () => ({ live: true }) }), (err) => err.code === 'bad-role');
  await assert.rejects(stopHeadSession({ role: `lead:${'a'.repeat(65)}`, projectRoot }, { host, identity: () => ({ live: true }) }), (err) => err.code === 'bad-role');
  assert.deepEqual(host.closes, []);
});
