import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import {
  discoverWriterFiles,
  findColdWriterFiles,
  mergeAndDedupeEvents,
  verifyCompactionCandidate,
  compactColdWriterFiles,
  DEFAULT_COMPACTION_EVENT_THRESHOLD,
} from '../../src/state/events-compaction.mjs';
import { readAllEventsFromDir, rebuildViewFromDir } from '../../src/state/replay.mjs';

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function hashOf(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

// Builds a real-shaped event: h computed over {seq, ts, type, payload, v, src}
// exactly like appendEventCore (src/state/events.mjs) does, so dedupe-by-hash
// behaves the same way it does on a genuine writer file.
function ev(seq, ts, type, payload, src = 'writer-x') {
  const unhashed = { seq, ts, type, payload, v: 1, src };
  return { ...unhashed, h: hashOf(unhashed) };
}

function writeJsonl(filePath, events) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, events.map((e) => `${JSON.stringify(e)}\n`).join(''), 'utf8');
}

function setMtime(filePath, ms) {
  const d = new Date(ms);
  fs.utimesSync(filePath, d, d);
}

// --- discoverWriterFiles / findColdWriterFiles ------------------------------

test('discoverWriterFiles lists *.jsonl directly under events/, excluding archive/ and baseline-*.jsonl', () => {
  const dir = mkTempDir('compaction-discover-');
  const eventsDir = path.join(dir, 'events');
  fs.mkdirSync(path.join(eventsDir, 'archive'), { recursive: true });
  writeJsonl(path.join(eventsDir, 'writer-a-1.jsonl'), [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'x' })]);
  writeJsonl(path.join(eventsDir, 'baseline-old.jsonl'), [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'y' })]);
  writeJsonl(path.join(eventsDir, 'archive', 'writer-z-1.jsonl'), [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'z' })]);

  const found = discoverWriterFiles(eventsDir).map((f) => f.name).sort();
  assert.deepEqual(found, ['writer-a-1.jsonl']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('discoverWriterFiles returns [] when events/ does not exist yet', () => {
  const dir = mkTempDir('compaction-discover-missing-');
  assert.deepEqual(discoverWriterFiles(path.join(dir, 'events')), []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('findColdWriterFiles only returns files whose mtime is at least idleThresholdMs old', () => {
  const dir = mkTempDir('compaction-cold-');
  const eventsDir = path.join(dir, 'events');
  const coldPath = path.join(eventsDir, 'writer-cold-1.jsonl');
  const hotPath = path.join(eventsDir, 'writer-hot-1.jsonl');
  writeJsonl(coldPath, [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'x' })]);
  writeJsonl(hotPath, [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'y' })]);
  const now = Date.now();
  setMtime(coldPath, now - 100000);
  setMtime(hotPath, now - 10);

  const cold = findColdWriterFiles(eventsDir, { nowMs: now, idleThresholdMs: 50000 }).map((f) => f.name);
  assert.deepEqual(cold, ['writer-cold-1.jsonl']);
  fs.rmSync(dir, { recursive: true, force: true });
});

// --- mergeAndDedupeEvents ----------------------------------------------------

test('mergeAndDedupeEvents sorts by (ts, file, seq), dedupes by h, and resequences 1..N while preserving h', () => {
  const e1 = ev(5, '2026-01-01T00:00:02.000Z', 'c', { id: 'c' }, 'writer-a');
  const e2 = ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'a' }, 'writer-a');
  const e3 = ev(1, '2026-01-01T00:00:01.000Z', 'b', { id: 'b' }, 'writer-b');

  const merged = mergeAndDedupeEvents([
    { name: 'writer-a-1.jsonl', events: [e1, e2] },
    { name: 'writer-b-1.jsonl', events: [e3] },
  ]);

  assert.deepEqual(merged.map((e) => e.type), ['a', 'b', 'c'], 'total order by ts');
  assert.deepEqual(merged.map((e) => e.seq), [1, 2, 3], 'resequenced 1..N over the final order');
  assert.deepEqual(merged.map((e) => e.h), [e2.h, e3.h, e1.h], 'h preserved verbatim, unaffected by reseq');
});

test('mergeAndDedupeEvents dedupes an event carrying the SAME h in two different files, first occurrence wins', () => {
  const shared = ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'a' }, 'writer-a');
  const merged = mergeAndDedupeEvents([
    { name: 'writer-a-1.jsonl', events: [shared] },
    { name: 'writer-b-1.jsonl', events: [shared] }, // same h, e.g. compaction-crash straddle
  ]);
  assert.equal(merged.length, 1, 'the same h across two files collapses to one logical event');
});

// --- verifyCompactionCandidate (TA-D6 gate) ---------------------------------

test('verifyCompactionCandidate passes when the candidate is exactly the deduped merge of the originals', () => {
  const e1 = ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a');
  const e2 = ev(1, '2026-01-01T00:00:01.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-b');
  const originalEntries = [
    { name: 'writer-a-1.jsonl', events: [e1] },
    { name: 'writer-b-1.jsonl', events: [e2] },
  ];
  const candidate = mergeAndDedupeEvents(originalEntries);

  const result = verifyCompactionCandidate(originalEntries, candidate);
  assert.equal(result.ok, true);
  assert.equal(result.totalEvents, 2);
});

test('verifyCompactionCandidate fails with hash-set-mismatch when the candidate is missing an original event', () => {
  const e1 = ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a');
  const e2 = ev(1, '2026-01-01T00:00:01.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-a');
  const originalEntries = [{ name: 'writer-a-1.jsonl', events: [e1, e2] }];
  const candidate = mergeAndDedupeEvents([{ name: 'writer-a-1.jsonl', events: [e1] }]); // e2 silently dropped

  const result = verifyCompactionCandidate(originalEntries, candidate);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'hash-set-mismatch');
});

test('verifyCompactionCandidate fails with count-mismatch when the candidate has a fabricated extra event with a novel h', () => {
  const e1 = ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a');
  const fabricated = ev(2, '2026-01-01T00:00:05.000Z', 'work.add', { id: 'ghost', title: 'G', status: 'todo' }, 'writer-a');
  const originalEntries = [{ name: 'writer-a-1.jsonl', events: [e1] }];
  const candidate = [...mergeAndDedupeEvents(originalEntries), fabricated];

  const result = verifyCompactionCandidate(originalEntries, candidate);
  assert.equal(result.ok, false);
  // A novel h on either side is caught by the hash-set check first (a
  // strict superset/subset mismatch), which is the more specific finding.
  assert.equal(result.reason, 'hash-set-mismatch');
});

test('verifyCompactionCandidate fails with view-mismatch when hash-set and count both match but the candidate\'s events differ in a way that changes the folded view', () => {
  const e1 = ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a');
  const e2 = ev(1, '2026-01-01T00:00:01.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-a');
  const originalEntries = [{ name: 'writer-a-1.jsonl', events: [e1, e2] }];
  // Same h's, same count, but the move's payload is corrupted (to === 'delivered'
  // instead of 'doing') while keeping the SAME h (simulating a torn/corrupted
  // write that the hash-set/count checks alone would miss).
  const corruptedMove = { ...e2, payload: { ...e2.payload, to: 'delivered' } };
  const candidate = [e1, corruptedMove];

  const result = verifyCompactionCandidate(originalEntries, candidate);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'view-mismatch');
});

// --- compactColdWriterFiles (integration) -----------------------------------

test('compactColdWriterFiles is a no-op when there are no cold files', () => {
  const dir = mkTempDir('compaction-noop-nocold-');
  const eventsDir = path.join(dir, 'events');
  writeJsonl(path.join(eventsDir, 'writer-hot-1.jsonl'), [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'x' })]);
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');

  const result = compactColdWriterFiles(dir, { idleThresholdMs: 1000 * 60 * 60 * 24 });
  assert.equal(result.compacted, false);
  assert.equal(result.reason, 'no-cold-files');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('compactColdWriterFiles is a no-op when cold event count is below the threshold', () => {
  const dir = mkTempDir('compaction-noop-belowthreshold-');
  const eventsDir = path.join(dir, 'events');
  const coldPath = path.join(eventsDir, 'writer-cold-1.jsonl');
  writeJsonl(coldPath, [ev(1, '2026-01-01T00:00:00.000Z', 'a', { id: 'x' })]);
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');
  const now = Date.now();
  setMtime(coldPath, now - 1000 * 60 * 60 * 48);

  const result = compactColdWriterFiles(dir, { nowMs: now, idleThresholdMs: 1000 * 60 * 60 * 24, eventThreshold: 5 });
  assert.equal(result.compacted, false);
  assert.equal(result.reason, 'below-threshold');
  assert.equal(fs.existsSync(coldPath), true, 'the cold file must be left exactly as found');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('compactColdWriterFiles archives cold files into events/archive/, writes a baseline + manifest, and the whole-dir view is deep-equal before/after', () => {
  const dir = mkTempDir('compaction-success-');
  const eventsDir = path.join(dir, 'events');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');

  const coldAPath = path.join(eventsDir, 'writer-a-1.jsonl');
  const coldBPath = path.join(eventsDir, 'writer-b-1.jsonl');
  writeJsonl(coldAPath, [
    ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a'),
    ev(2, '2026-01-01T00:00:02.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-a'),
  ]);
  writeJsonl(coldBPath, [ev(1, '2026-01-01T00:00:01.000Z', 'work.add', { id: 'b', title: 'B', status: 'todo' }, 'writer-b')]);

  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });

  const viewBefore = rebuildViewFromDir(dir);

  const now = Date.now();
  setMtime(coldAPath, now - 1000 * 60 * 60 * 48);
  setMtime(coldBPath, now - 1000 * 60 * 60 * 48);

  const result = compactColdWriterFiles(dir, { nowMs: now, idleThresholdMs: 1000 * 60 * 60 * 24, eventThreshold: 2, repoRoot: dir });
  assert.equal(result.compacted, true);
  assert.equal(result.totalEvents, 3);
  assert.deepEqual(result.archived.sort(), ['writer-a-1.jsonl', 'writer-b-1.jsonl']);

  assert.equal(fs.existsSync(coldAPath), false, 'original moved out of events/');
  assert.equal(fs.existsSync(coldBPath), false);
  assert.equal(fs.existsSync(path.join(eventsDir, 'archive', 'writer-a-1.jsonl')), true, 'original preserved under archive/, never deleted');
  assert.equal(fs.existsSync(path.join(eventsDir, 'archive', 'writer-b-1.jsonl')), true);
  assert.equal(fs.existsSync(path.join(eventsDir, result.baseline)), true, 'the new baseline is a live file under events/');

  const manifestFiles = fs.readdirSync(path.join(eventsDir, 'archive')).filter((f) => f.endsWith('.manifest.json'));
  assert.equal(manifestFiles.length, 1);
  const manifest = JSON.parse(fs.readFileSync(path.join(eventsDir, 'archive', manifestFiles[0]), 'utf8'));
  assert.equal(manifest.baseline, result.baseline);
  assert.deepEqual(manifest.originals.sort(), ['writer-a-1.jsonl', 'writer-b-1.jsonl']);

  const viewAfter = rebuildViewFromDir(dir);
  assert.deepEqual(viewAfter, viewBefore, 'compaction must never change the folded view');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('compactColdWriterFiles gate-red: a torn/corrupted write of the candidate baseline is caught, nothing gets archived, and the candidate file itself is removed', () => {
  const dir = mkTempDir('compaction-gatered-');
  const eventsDir = path.join(dir, 'events');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');

  const coldPath = path.join(eventsDir, 'writer-a-1.jsonl');
  writeJsonl(coldPath, [
    ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a'),
    ev(2, '2026-01-01T00:00:02.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-a'),
  ]);
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });

  const now = Date.now();
  setMtime(coldPath, now - 1000 * 60 * 60 * 48);

  // Predict the exact candidate path (deterministic given nowMs) and
  // monkey-patch fs.writeFileSync to write a TORN (truncated) version of it
  // only -- simulating an I/O-level corruption the gate must still catch.
  const compactTs = new Date(now).toISOString().replace(/[-:]/g, '').replace('.', '');
  const candidatePath = path.join(eventsDir, `baseline-${compactTs}.jsonl`);
  const originalWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = function patched(target, content, ...rest) {
    if (target === candidatePath) {
      return originalWriteFileSync.call(fs, target, '', ...rest); // torn write -- drops everything
    }
    return originalWriteFileSync.call(fs, target, content, ...rest);
  };
  let result;
  try {
    result = compactColdWriterFiles(dir, { nowMs: now, idleThresholdMs: 1000 * 60 * 60 * 24, eventThreshold: 2, repoRoot: dir });
  } finally {
    fs.writeFileSync = originalWriteFileSync;
  }

  assert.equal(result.compacted, false);
  assert.equal(result.reason, 'gate-red');
  assert.equal(fs.existsSync(candidatePath), false, 'the failed candidate baseline is removed, not left behind');
  assert.equal(fs.existsSync(coldPath), true, 'the original cold file is untouched -- gate đỏ, không archive gì');
  assert.equal(fs.existsSync(path.join(eventsDir, 'archive')), false, 'archive/ is never even created on a red gate');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('crash-mid-compaction: baseline-<ts>.jsonl and its originals coexisting (archive step never ran) still folds correctly, thanks to dedupe-by-hash', () => {
  const dir = mkTempDir('compaction-crash-mid-');
  const eventsDir = path.join(dir, 'events');
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');

  const e1 = ev(1, '2026-01-01T00:00:00.000Z', 'work.add', { id: 'a', title: 'A', status: 'todo' }, 'writer-a');
  const e2 = ev(2, '2026-01-01T00:00:02.000Z', 'work.move', { id: 'a', from: 'todo', to: 'doing' }, 'writer-a');
  writeJsonl(path.join(eventsDir, 'writer-a-1.jsonl'), [e1, e2]); // the "original" -- crash left this in place, never archived
  const merged = mergeAndDedupeEvents([{ name: 'writer-a-1.jsonl', events: [e1, e2] }]);
  writeJsonl(path.join(eventsDir, 'baseline-20260823T000000000Z.jsonl'), merged); // the candidate, already written before the crash

  const events = readAllEventsFromDir(dir);
  assert.equal(events.length, 2, 'dedupe-by-hash collapses the straddle -- never double-counted');
  const view = rebuildViewFromDir(dir);
  assert.equal(view.work.a.status, 'doing');
  fs.rmSync(dir, { recursive: true, force: true });
});
