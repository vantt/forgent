// Subprocess fixture: markers delimit only append/readInGate, after setup.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-gate-'));
try {
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '-q', repo]);
  execFileSync('git', ['-C', repo, 'config', 'fgos.machineId', 'gate-machine']);
  const state = path.join(temp, 'state'); fs.mkdirSync(state, { mode: 0o700 });
  fs.mkdirSync(path.join(repo, '.git/fgos/events/locks'), { recursive: true, mode: 0o700 });
  const hot = path.join(repo, '.fgos'); fs.mkdirSync(hot);
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const loaderOptions = { descriptor: { manifest, releaseRoot: root } };
  const native = loadNativeAddon(loaderOptions);
  const resolved = native.resolveEventStore(repo, state, repo);
  const contract = path.join(temp, 'contract.json');
  fs.writeFileSync(contract, JSON.stringify({ v: 1, types: [{ type: 'example.created', domain: 'example', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
  const store = openStore(resolved, resolved.machineId, [contract], loaderOptions);
  const event = { eventType: 'example.created', schemaVersion: 1, payload: {}, ts: '2026-10-19T00:00:00.000Z' };
  const recovering = process.argv.includes('--recover');
  if (recovering) {
    store.append('project', [event], {}, 'gate-writer', []);
    const stream = path.join(repo, '.git/fgos/events/project');
    fs.unlinkSync(path.join(stream, 'hwm.json'));
    fs.appendFileSync(path.join(stream, 'active.jsonl'), '{torn');
  }
  // The gate never asks Git for write admission; its consumer settles it before entering.
  store.admitWrites([]);
  withStateTx(hot, () => {
    assert.throws(() => execFileSync(process.execPath, ['-e', '']), { code: 'exec-under-hot-lock' });
    fs.writeSync(2, 'ES_GATE_BEGIN\n');
    const result = store.append('project', [event], {}, 'gate-writer', [60]);
    assert.equal(result.ack.lastSeq, recovering ? 2 : 1);
    assert.equal(store.readInGate(result.ack.origin, 'project', 0).events.length, recovering ? 2 : 1);
    fs.writeSync(2, 'ES_GATE_END\n');
  }, { prefetched: { writer: 'gate-writer' } });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
