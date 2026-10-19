import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureGitAddon } from '../helpers/git-addon.mjs';
const built = ensureGitAddon();
const probe = fileURLToPath(new URL('./gate-probe.mjs', import.meta.url));

test('real append/readInGate run under the hot-lock process guard', { skip: process.platform !== 'linux' }, () => {
  const result = spawnSync(process.execPath, [probe, built.manifest], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /ES_GATE_BEGIN\nES_GATE_END/);
});

for (const mode of [[], ['--recover']]) test(`strace observes zero process creation calls in the append/readInGate window ${mode.join(' ')}`, { skip: process.platform !== 'linux' }, t => {
  const version = spawnSync('strace', ['-V'], { encoding: 'utf8' });
  if (version.error?.code === 'ENOENT') { t.skip('strace unavailable'); return; }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-strace-'));
  try {
    const log = path.join(temp, 'trace');
    const result = spawnSync('strace', ['-f', '-e', 'trace=process,write', '-s', '256', '-o', log, process.execPath, probe, built.manifest, ...mode], { encoding: 'utf8' });
    if (/^strace: .*ptrace.*(?:not permitted|denied)/mi.test(result.stderr)) { t.skip('sandbox denies strace/ptrace'); return; }
    assert.equal(result.status, 0, result.stderr);
    const trace = fs.readFileSync(log, 'utf8');
    const begin = trace.indexOf('ES_GATE_BEGIN');
    const end = trace.indexOf('ES_GATE_END', begin);
    assert.ok(begin >= 0 && end > begin, 'both gate markers must be traced');
    assert.doesNotMatch(trace.slice(begin, end), /\b(?:clone|clone3|fork|vfork|execve|execveat)\(/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
