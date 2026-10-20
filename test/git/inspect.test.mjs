import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createGitInspect } from '../../src/git/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';
const built = ensureGitAddon();
const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
const bytes = p => [...Buffer.from(p)];

test('Inspect marshals real byte paths, explicit absence, reads, pages and snapshots', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p02-inspect-node-'));
  const repoPath = path.join(temp, 'repo'); fs.mkdirSync(repoPath);
  const git = (...args) => execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init', '-q', '--initial-branch=trunk'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
    const name = process.platform === 'win32' ? Buffer.from('strange [name]') : Buffer.from([0x61,0xff,0x0a,0x09,0x5b,0x2a,0x5d]);
    const weird = Buffer.concat([Buffer.from(repoPath + path.sep), name]);
    fs.writeFileSync(weird, Buffer.from([1,0,255,10])); git('add', '.'); git('commit', '-qm', 'first');
    const first = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(repoPath, 'new'), 'second'); git('add', '.'); git('commit', '-qm', 'second'); const second = git('rev-parse', 'HEAD');
    const port = createGitInspect({ stateRoot: temp, repoPath, trustedMain: repoPath }, loader);
    assert.equal(port.resolveRepo().trustedMainRoot, repoPath);
    assert.equal(port.resolveRef({ name: 'refs/heads/trunk' }).oid, second);
    assert.deepEqual(port.resolveRef({ name: 'refs/heads/absent' }), { kind: 'absent' });
    assert.deepEqual(port.resolveTrunk(), { kind: 'known', value: 'refs/heads/trunk' });
    assert.deepEqual(port.ancestry({ ancestor: first, descendant: second }), { answer: 'yes' });
    assert.deepEqual(port.ancestry({ ancestor: second, descendant: first }), { answer: 'no' });
    assert.deepEqual(port.compareContent({ before: first, after: second }), { equal: false });
    assert.deepEqual(port.diff({ before: first, after: second }).entries[0].path, bytes('new'));
    assert.equal(port.diffText({ before: first, after: second }), execFileSync('git', ['-C', repoPath, 'diff', '--no-relative', '--no-ext-diff', '--no-textconv', first, second, '--'], { encoding: 'utf8' }));
    assert.throws(() => port.diffText({ before: first, after: second, maxBytes: 16 }), /git-output-limit/);
    assert.throws(() => port.diffText({ before: first, after: second, maxBytes: 0 }), /invalid-diff-bound/);
    git('config', 'diff.external', 'false');
    assert.throws(() => port.diffText({ before: first, after: second }), /repository-config-untrusted/);
    git('config', '--unset', 'diff.external');
    assert.equal(port.lastPathCommitTime({files: ['new']}), Number(git('log', '-1', '--format=%ct', '--', 'new')));
    assert.equal(port.lastPathCommitTime({files: ['absent']}), null);
    assert.throws(() => port.lastPathCommitTime({files: ['../outside']}), /invalid-literal-path/);
    const blob = git('rev-parse', 'HEAD:new');
    const objects = port.readObjects({ oids: [blob, '1'.repeat(40)], maxBytes: 4096 });
    assert.deepEqual(objects, [{ kind: 'present', objectType: 'blob', bytes: bytes('second') }, { kind: 'missing' }]);
    const paths = port.pathsAtRevision({ revision: first, paths: [[...name], bytes('absent')], maxBlobBytes: 4096 });
    assert.deepEqual(paths[0].value.bytes, [1,0,255,10]); assert.equal(paths[1].value.kind, 'absent');
    fs.writeFileSync(weird, 'dirty'); fs.writeFileSync(path.join(repoPath, 'untracked'), 'new');
    const lock = path.join(repoPath, '.git', 'index.lock'); fs.writeFileSync(lock, 'foreign');
    const index = fs.readFileSync(path.join(repoPath, '.git', 'index'));
    const firstPage = port.status({ untracked: 'all', maxEntries: 1 }); assert.equal(firstPage.complete, false);
    const secondPage = port.status({ untracked: 'all', maxEntries: 1, cursor: firstPage.nextCursor }); assert.equal(secondPage.complete, true);
    assert.deepEqual(firstPage.entries[0].path, [...name]);
    assert.deepEqual(fs.readFileSync(path.join(repoPath, '.git', 'index')), index); assert.equal(fs.readFileSync(lock, 'utf8'), 'foreign');
    assert.throws(() => port.status(), /missing string: untracked/);
    assert.equal(port.listWorktrees().entries[0].branch, 'refs/heads/trunk');
    if (process.platform !== 'win32') {
      const snapshot = port.snapshotWrites({ paths: [bytes('missing')], maxBytes: 4096 });
      assert.equal(snapshot.head, second); assert.equal(snapshot.files.find(f => Buffer.from(f.path).toString() === 'missing').fingerprint.kind, 'missing');
      assert.throws(() => port.snapshotWrites({ paths: [bytes('../outside')], maxBytes: 4096 }), /invalid-literal-path/);
    }
    const hot = path.join(temp, '.fgos'); fs.mkdirSync(hot);
    withStateTx(hot, () => assert.throws(() => port.resolveRepo(), { code: 'exec-under-hot-lock' }));
    const outside = path.join(temp, 'outside'); fs.mkdirSync(outside);
    const nonRepo = createGitInspect({ stateRoot: temp, repoPath: outside, trustedMain: outside }, loader);
    assert.deepEqual(nonRepo.resolveRepo(), { notARepository: true });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

// A session with no env id resolves to a process (`source: pid`, an integer id); every Git port's
// writer is a string, so the door that hands the writer to a port must give text for that answer.
test('a Git port writer is text when the session identity is a process id', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-git-writer-'));
  const repoPath = path.join(temp, 'repo'); fs.mkdirSync(repoPath);
  try {
    execFileSync('git', ['-C', repoPath, 'init', '-q', '--initial-branch=main']);
    const env = { ...process.env, FGOS_HOST_BIN: built.hostBin, FGOS_ACTIVE_MANIFEST_PATH: built.manifest, XDG_STATE_HOME: path.join(temp, 'state') };
    for (const name of ['FGOS_SESSION_ID', 'CODEX_THREAD_ID', 'CLAUDE_CODE_SESSION_ID', 'FGOS_STATE_ROOT']) delete env[name];
    const out = execFileSync(process.execPath, ['--input-type=module', '-'], { cwd: root, env, encoding: 'utf8', input: `
import path from 'node:path';
import { gitPortOptions, gitWriter } from './src/git/inspect.mjs';
import { createGitSync } from './src/git/index.mjs';
import { resolveWriterIdentity } from './src/util/session-identity.mjs';
const repo = ${JSON.stringify(repoPath)};
const identity = resolveWriterIdentity(path.join(repo, '.fgos'));
const options = gitPortOptions(repo, { mutation: true });
createGitSync(options);
console.log(JSON.stringify({ identity, writer: options.writer, door: gitWriter(path.join(repo, '.fgos')) }));
` });
    const { identity, writer, door } = JSON.parse(out);
    assert.equal(identity.source, 'pid');
    assert.equal(typeof identity.id, 'number');
    assert.equal(writer, String(identity.id));
    assert.equal(door, writer);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
