import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import {
  DOCTOR_CHECKS,
  checkObserveDirWritable,
  checkObserveFrictionMigrated,
  checkObserveHostResolvable,
} from '../../src/setup/registrations.mjs';

function mkTempDir() {
  const dir = path.join(tmpdir(), 'fgos-doctor-observe-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  return dir;
}

test('observe doctor checks are registered in DOCTOR_CHECKS', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('observe-dir-writable'));
  assert.ok(ids.includes('observe-friction-migrated'));
  assert.ok(ids.includes('observe-host-resolvable'));
});

test('observe-dir-writable passes and creates .fgos/observe', () => {
  const cwd = mkTempDir();
  try {
    const res = checkObserveDirWritable(cwd);
    assert.equal(res.passed, true);
    assert.ok(fs.existsSync(path.join(cwd, '.fgos', 'observe')));
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-friction-migrated passes when no legacy friction exists', () => {
  const cwd = mkTempDir();
  try {
    // Empty events.jsonl
    fs.writeFileSync(path.join(cwd, '.fgos', 'events.jsonl'), '', 'utf8');
    const res = checkObserveFrictionMigrated(cwd);
    assert.equal(res.passed, true);
    assert.match(res.message, /no legacy work\.friction records/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-friction-migrated fails when legacy friction exists but no observe/friction dir', () => {
  const cwd = mkTempDir();
  try {
    const event = {
      seq: 1,
      ts: '2026-09-29T10:00:00Z',
      type: 'work.friction',
      payload: { id: 'tsk-1', layer: 'state', errorClass: 'err' },
    };
    fs.writeFileSync(path.join(cwd, '.fgos', 'events.jsonl'), JSON.stringify(event) + '\n', 'utf8');

    const res = checkObserveFrictionMigrated(cwd);
    assert.equal(res.passed, false);
    assert.match(res.message, /friction migration not run/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-friction-migrated fails when unmigrated records exist past cursor', () => {
  const cwd = mkTempDir();
  try {
    const event1 = {
      seq: 1,
      ts: '2026-09-29T10:00:00Z',
      type: 'work.friction',
      payload: { id: 'tsk-1' },
    };
    const event2 = {
      seq: 2,
      ts: '2026-09-29T10:05:00Z',
      type: 'work.friction',
      payload: { id: 'tsk-2' },
    };
    fs.writeFileSync(
      path.join(cwd, '.fgos', 'events.jsonl'),
      JSON.stringify(event1) + '\n' + JSON.stringify(event2) + '\n',
      'utf8'
    );

    const frictionDir = path.join(cwd, '.fgos', 'observe', 'friction');
    fs.mkdirSync(frictionDir, { recursive: true });

    // Only seq 1 is migrated
    const migrationMarker = { v: 1, type: 'migration', from: 'work.friction', count: 1, resolved: 0, ts: '...' };
    const migratedRecord = {
      v: 1,
      type: 'friction-recorded',
      legacy: { src: 'events.jsonl', seq: 1 },
    };
    fs.writeFileSync(
      path.join(frictionDir, 'shard.jsonl'),
      JSON.stringify(migrationMarker) + '\n' + JSON.stringify(migratedRecord) + '\n',
      'utf8'
    );

    const res = checkObserveFrictionMigrated(cwd);
    assert.equal(res.passed, false);
    assert.match(res.message, /1 legacy work\.friction record\(s\) newer than cursor/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-friction-migrated passes when all legacy records are migrated', () => {
  const cwd = mkTempDir();
  try {
    const event1 = {
      seq: 1,
      ts: '2026-09-29T10:00:00Z',
      type: 'work.friction',
      payload: { id: 'tsk-1' },
    };
    fs.writeFileSync(path.join(cwd, '.fgos', 'events.jsonl'), JSON.stringify(event1) + '\n', 'utf8');

    const frictionDir = path.join(cwd, '.fgos', 'observe', 'friction');
    fs.mkdirSync(frictionDir, { recursive: true });

    const migrationMarker = { v: 1, type: 'migration', from: 'work.friction', count: 1, resolved: 0, ts: '...' };
    const migratedRecord = {
      v: 1,
      type: 'friction-recorded',
      legacy: { src: 'events.jsonl', seq: 1 },
    };
    fs.writeFileSync(
      path.join(frictionDir, 'shard.jsonl'),
      JSON.stringify(migrationMarker) + '\n' + JSON.stringify(migratedRecord) + '\n',
      'utf8'
    );

    const res = checkObserveFrictionMigrated(cwd);
    assert.equal(res.passed, true);
    assert.match(res.message, /all 1 legacy work\.friction record\(s\) migrated/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-host-resolvable verifies host binary status', () => {
  const originalHostBin = process.env.FGOS_HOST_BIN;
  try {
    // 1. Invalid/failing host binary fails
    const dummyScript = path.join(tmpdir(), 'failing-host-bin-' + Math.random().toString(36).slice(2) + '.sh');
    fs.writeFileSync(dummyScript, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    try {
      process.env.FGOS_HOST_BIN = dummyScript;
      const resUnavailable = checkObserveHostResolvable('/tmp');
      assert.equal(resUnavailable.passed, false);
    } finally {
      if (fs.existsSync(dummyScript)) fs.unlinkSync(dummyScript);
    }

    // 2. Built host binary passes
    const builtHost = path.resolve('target', 'debug', 'fgos');
    if (fs.existsSync(builtHost)) {
      process.env.FGOS_HOST_BIN = builtHost;
      const resPass = checkObserveHostResolvable(process.cwd());
      assert.equal(resPass.passed, true);
      assert.match(resPass.message, /resolved and verified/);
    }
  } finally {
    if (originalHostBin !== undefined) {
      process.env.FGOS_HOST_BIN = originalHostBin;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});
