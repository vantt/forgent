import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWorktreeUseCase } from '../../src/verbs/worktree/create.mjs';
import { removeWorktreeUseCase } from '../../src/verbs/worktree/remove.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { fixture } from '../git/worktree-fixture.mjs';

const skip = { skip: process.platform === 'win32' };

function setup() {
  const f = fixture('files', true);
  const ctx = { cwd: f.repoPath, repoRoot: f.repoPath, stateRoot: f.temp, writer: 'fixture' };
  const worker = (name) => createWorktreeUseCase(ctx, { path: `../${name}`, detach: true, base: f.tip }, f.loader).path;
  return { f, ctx, worker };
}

test('worktree remove deletes a clean worktree whose tip is delivered and binds the delivery statement', skip, () => {
  const { f, ctx, worker } = setup();
  try {
    const wt = worker('clean');
    const result = removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'trunk' }, f.loader);
    assert.equal(fs.existsSync(wt), false);
    assert.equal(result.removed, true);
    assert.equal(result.expectedTip, f.tip);
    assert.equal(result.deliveredTo, f.tip);
    assert.equal(result.deliveredToRef, 'refs/heads/trunk');
    const statement = { path: fs.realpathSync(f.temp) + '/clean', expectedTip: f.tip, deliveredTo: { ref: 'refs/heads/trunk', oid: f.tip } };
    assert.equal(result.evidenceDigest, createHash('sha256').update(JSON.stringify(statement)).digest('hex'));
    assert.equal(f.git('worktree', 'list', '--porcelain').includes('clean'), false);
    // An object id is accepted as the delivery target too.
    const second = worker('by-oid');
    assert.equal(removeWorktreeUseCase(ctx, { path: second, deliveredTo: f.tip }, f.loader).deliveredToRef, null);
  } finally { f.cleanup(); }
});

test('worktree remove refuses a dirty worktree and leaves it untouched', skip, () => {
  const { f, ctx, worker } = setup();
  try {
    const wt = worker('dirty');
    fs.writeFileSync(path.join(wt, 'valuable'), 'keep');
    assert.throws(() => removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'trunk' }, f.loader), /dirty/);
    assert.equal(fs.readFileSync(path.join(wt, 'valuable'), 'utf8'), 'keep');
  } finally { f.cleanup(); }
});

test('worktree remove refuses when the tip is not contained in the delivery target', skip, () => {
  const { f, ctx, worker } = setup();
  try {
    const wt = worker('ahead');
    fs.writeFileSync(path.join(wt, 'file'), 'two');
    execFileSync('git', ['-C', wt, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qam', 'two']);
    assert.throws(() => removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'trunk' }, f.loader), /worktree-delivery-unproven/);
    assert.equal(fs.existsSync(wt), true);
    assert.throws(() => removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'no-such-branch' }, f.loader), /does not name an existing/);
    assert.throws(() => removeWorktreeUseCase(ctx, { path: f.temp, deliveredTo: 'trunk' }, f.loader), /not a registered worktree/);
    assert.throws(() => removeWorktreeUseCase(ctx, { path: wt }, f.loader), /requires --delivered-to/);
  } finally { f.cleanup(); }
});

// A project whose provisioning leaves ignored bytes: a dependency install (an
// `npm` on PATH that fills node_modules, since the fixture has no registry) and
// a setup command copying an ignored skill directory from the main checkout.
function provisioningSetup() {
  const { f, ctx } = setup();
  fs.writeFileSync(path.join(f.repoPath, '.gitignore'), 'node_modules\n/skills/ak-*\n*.log\n');
  fs.writeFileSync(path.join(f.repoPath, 'package.json'), JSON.stringify({ name: 'fixture', dependencies: { dep: '1.0.0' } }));
  f.git('add', '.gitignore', 'package.json'); f.git('commit', '-qm', 'provisioned project');
  const skill = path.join(f.repoPath, 'skills', 'ak-one');
  fs.mkdirSync(path.join(skill, 'refs'), { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), 'skill');
  fs.writeFileSync(path.join(skill, 'refs', 'guide.md'), 'guide');
  fs.symlinkSync('SKILL.md', path.join(skill, 'link.md'));
  fs.mkdirSync(path.join(f.repoPath, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(f.repoPath, '.fgos', 'config.json'), JSON.stringify({ worktreeSetup: { commands: ['mkdir -p skills && cp -R "$FGOS_REPO_ROOT/skills/ak-one" skills/'] } }));
  const bin = path.join(f.temp, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'npm'), '#!/bin/sh\nmkdir -p node_modules/dep && echo installed > node_modules/dep/index.js\n', { mode: 0o755 });
  const savedPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${savedPath}`;
  const worker = (name) => createWorktreeUseCase(ctx, { path: `../${name}`, detach: true, base: 'trunk' }, f.loader).path;
  const siblings = () => fs.readdirSync(f.temp).filter(n => n.includes('.provisioned-'));
  return { f, ctx, worker, siblings, cleanup() { process.env.PATH = savedPath; f.cleanup(); } };
}

test('worktree remove takes back exactly what create provisioned and removes the checkout', skip, () => {
  const { f, ctx, worker, siblings, cleanup } = provisioningSetup();
  try {
    const wt = worker('provisioned');
    assert.equal(fs.readFileSync(path.join(wt, 'skills', 'ak-one', 'refs', 'guide.md'), 'utf8'), 'guide');
    assert.equal(fs.existsSync(path.join(wt, 'node_modules', 'dep', 'index.js')), true);
    // A dependency directory is regenerable: what a run added inside it goes too.
    fs.writeFileSync(path.join(wt, 'node_modules', 'dep', 'cache.bin'), 'rebuilt');
    const records = path.join(f.temp, 'worktree-provisioning');
    assert.equal(fs.readdirSync(records).length, 1);
    const result = removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'trunk' }, f.loader);
    assert.equal(result.removed, true);
    assert.equal(fs.existsSync(wt), false);
    assert.deepEqual(fs.readdirSync(records), []);
    assert.deepEqual(siblings(), []);
    assert.equal(fs.readFileSync(path.join(f.repoPath, 'skills', 'ak-one', 'SKILL.md'), 'utf8'), 'skill');
  } finally { cleanup(); }
});

test('worktree remove refuses when a worker edited a provisioned copy or left its own ignored bytes, and puts every provisioned byte back', skip, () => {
  const { ctx, f, worker, siblings, cleanup } = provisioningSetup();
  try {
    const edited = worker('edited');
    fs.writeFileSync(path.join(edited, 'skills', 'ak-one', 'SKILL.md'), 'worker edit');
    const foreign = worker('foreign');
    fs.writeFileSync(path.join(foreign, 'skills', 'ak-one', 'refs', 'run.log'), 'worker output');
    for (const wt of [edited, foreign]) {
      assert.throws(() => removeWorktreeUseCase(ctx, { path: wt, deliveredTo: 'trunk' }, f.loader), /worktree-ignored-bytes-preserved/);
      assert.equal(fs.existsSync(path.join(wt, 'node_modules', 'dep', 'index.js')), true);
      assert.equal(fs.readFileSync(path.join(wt, 'skills', 'ak-one', 'refs', 'guide.md'), 'utf8'), 'guide');
      assert.equal(fs.readlinkSync(path.join(wt, 'skills', 'ak-one', 'link.md')), 'SKILL.md');
    }
    assert.equal(fs.readFileSync(path.join(edited, 'skills', 'ak-one', 'SKILL.md'), 'utf8'), 'worker edit');
    assert.equal(fs.readFileSync(path.join(foreign, 'skills', 'ak-one', 'refs', 'run.log'), 'utf8'), 'worker output');
    assert.deepEqual(siblings(), []);
    // Once the worker's own bytes are gone the same record still removes it.
    fs.rmSync(path.join(foreign, 'skills', 'ak-one', 'refs', 'run.log'));
    assert.equal(removeWorktreeUseCase(ctx, { path: foreign, deliveredTo: 'trunk' }, f.loader).removed, true);
  } finally { cleanup(); }
});

test('worktree remove is registered with a required --delivered-to', () => {
  const sub = COMMAND_REGISTRY.find(v => v.name === 'worktree').subcommands.remove;
  assert.deepEqual(sub.parameters.required, ['path', 'delivered-to']);
});

test('CLI adapter removes a provisioned, delivered worktree and reports a missing --delivered-to as a usage error', skip, async () => {
  const { ensureHostBin, REPO_ROOT } = await import('../../scripts/run-tests.mjs');
  const f = fixture('files', true);
  try {
    const built = ensureHostBin({ ...process.env, FGOS_HOST_BIN: '' }, REPO_ROOT);
    fs.mkdirSync(path.join(REPO_ROOT, '.fgos', 'runtime'), { recursive: true });
    const hostDir = fs.mkdtempSync(path.join(REPO_ROOT, '.fgos', 'runtime', 'tmp-worktree-cli-'));
    const host = path.join(hostDir, 'fgos'); fs.copyFileSync(built, host); fs.chmodSync(host, 0o755);
    f.cleanup = ((cleanup) => () => { fs.rmSync(hostDir, { recursive: true, force: true }); cleanup(); })(f.cleanup);
    const manifest = structuredClone(f.loader.descriptor.manifest);
    manifest.entries.fgos = path.relative(REPO_ROOT, host);
    manifest.components.legacyNode = { root: '.', entry: 'bin/fgos.mjs' };
    const manifestPath = path.join(f.temp, 'manifest.json'); fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const env = { ...process.env, FGOS_HOST_BIN: host, FGOS_ACTIVE_MANIFEST_PATH: manifestPath, FGOS_STATE_ROOT: path.join(f.temp, 'fgos') };
    for (const name of ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID']) delete env[name];
    fs.mkdirSync(env.FGOS_STATE_ROOT, { mode: 0o700 });
    // Provisioning copies an ignored skill directory, as this repository's own setup does.
    fs.writeFileSync(path.join(f.repoPath, '.gitignore'), '/skills/ak-*\n');
    f.git('add', '.gitignore'); f.git('commit', '-qm', 'ignore copied skills');
    fs.mkdirSync(path.join(f.repoPath, 'skills', 'ak-one'), { recursive: true });
    fs.writeFileSync(path.join(f.repoPath, 'skills', 'ak-one', 'SKILL.md'), 'skill');
    fs.writeFileSync(path.join(f.repoPath, '.fgos', 'config.json'), JSON.stringify({ worktreeSetup: { commands: ['mkdir -p skills && cp -R "$FGOS_REPO_ROOT/skills/ak-one" skills/'] } }));
    const cli = (...args) => spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), 'worktree', ...args, '--json'], { cwd: f.repoPath, env, encoding: 'utf8' });
    const wt = path.join(f.temp, 'cli-worker');
    const created = cli('create', wt, '--detach');
    assert.equal(created.status, 0, created.stderr);
    assert.equal(fs.readFileSync(path.join(wt, 'skills', 'ak-one', 'SKILL.md'), 'utf8'), 'skill');
    const missing = cli('remove', wt);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stdout + missing.stderr, /requires --delivered-to/);
    assert.equal(fs.existsSync(wt), true);
    const removed = cli('remove', wt, '--delivered-to', 'trunk');
    assert.equal(removed.status, 0, removed.stderr);
    const output = JSON.parse(removed.stdout);
    assert.equal(output.contract, 'fgos.v1'); assert.equal(output.data.removed, true);
    assert.equal(fs.existsSync(wt), false);
  } finally { f.cleanup(); }
});
