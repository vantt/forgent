import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hookSource = fs.readFileSync(path.join(sourceRoot, '.githooks/pre-commit'), 'utf8');
const env = { ...process.env };
delete env.CLAUDE_CODE_SESSION_ID;
delete env.FGOS_SESSION_ID;

function fixture(t, { marker = true } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-root-guard-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repo = path.join(temp, 'repo');
  const host = path.join(temp, 'hook-host');
  fs.mkdirSync(repo);
  const git = (args, cwd = repo) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = (relative, content, cwd = repo) => {
    const destination = path.join(cwd, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  };
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.name', 'Root guard fixture']);
  git(['config', 'user.email', 'root-guard@example.invalid']);
  put('existing.txt', 'existing\n');
  put('.githooks/pre-commit', hookSource);
  put('.fgos/cache/state.json', '{}\n');
  if (marker) put('apps/fgos/Cargo.toml', '[package]\nname="fixture"\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'fixture baseline']);
  for (const relative of ['.githooks/pre-commit', 'src/runner/main-checkout-lock.mjs', 'src/runner/dispatch/process-identity.mjs', 'src/util/session-identity.mjs']) {
    const destination = path.join(host, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, relative), destination);
  }
  fs.chmodSync(path.join(host, '.githooks/pre-commit'), 0o755);
  git(['config', 'core.hooksPath', path.join(host, '.githooks')]);
  const commit = (cwd = repo, extraEnv = {}) => spawnSync('git', ['commit', '-q', '-m', 'guard scenario'], {
    cwd, env: { ...env, ...extraEnv }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000,
  });
  return { temp, repo, host, git, put, commit };
}

function refused(result, file) {
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0, result.stderr);
  assert.ok(result.stderr.includes(file), result.stderr);
}

function passed(result) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
}

test('source checkout refuses newly staged root additions, copies and renames but accepts nested files', (t) => {
  const f = fixture(t);
  f.put('scratch.cjs', 'scratch\n');
  f.git(['add', 'scratch.cjs']);
  refused(f.commit(), 'scratch.cjs');
  assert.equal(f.git(['show', 'HEAD:existing.txt']), 'existing');
  f.git(['reset', '-q']);
  f.put('copied.txt', 'existing\n');
  f.git(['add', 'copied.txt']);
  refused(f.commit(), 'copied.txt');
  f.git(['reset', '-q']);
  f.git(['mv', 'existing.txt', 'renamed.txt']);
  refused(f.commit(), 'renamed.txt');
  f.git(['reset', '--hard', '-q']);
  f.put('src/new.mjs', 'export const value = 1;\n');
  f.git(['add', 'src/new.mjs']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:src/new.mjs']), 'export const value = 1;');
});

test('existing non-allowlisted root modifications and deletions remain permitted', (t) => {
  const f = fixture(t);
  f.put('existing.txt', 'modified\n');
  f.git(['add', 'existing.txt']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:existing.txt']), 'modified');
  f.git(['rm', 'existing.txt']);
  passed(f.commit());
  assert.equal(f.git(['ls-tree', '--name-only', 'HEAD', 'existing.txt']), '');
});

test('allowlisted new root file is accepted', (t) => {
  const f = fixture(t);
  f.put('README.md', '# Fixture\n');
  f.git(['add', 'README.md']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:README.md']), '# Fixture');
});

test('unrelated repository sharing the absolute hook is not root guarded', (t) => {
  const f = fixture(t, { marker: false });
  f.put('seed.txt', 'unrelated\n');
  f.git(['add', 'seed.txt']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:seed.txt']), 'unrelated');
});

test('linked fgw branch is guarded before the hook-home early exit', (t) => {
  const f = fixture(t);
  const worktree = path.join(f.temp, 'worktree');
  f.git(['worktree', 'add', '-q', '-b', 'fgw/root-guard', worktree]);
  f.put('scratch.cjs', 'worker scratch\n', worktree);
  f.git(['add', 'scratch.cjs'], worktree);
  refused(f.commit(worktree), 'scratch.cjs');
  assert.equal(f.git(['log', '-1', '--format=%s'], worktree), 'fixture baseline');
});

test('allowlist changes cannot authorize root additions in the same commit and work after separately landing', (t) => {
  const f = fixture(t);
  const expanded = hookSource.replace("'rustfmt.toml',", "'rustfmt.toml', 'approved.cjs',");
  f.put('.githooks/pre-commit', expanded);
  f.put('README.md', '# Allowed but cannot accompany allowlist edit\n');
  f.git(['add', '.githooks/pre-commit', 'README.md']);
  refused(f.commit(), 'README.md');
  f.git(['reset', '-q', '--', 'README.md']);
  passed(f.commit());
  // Simulate the absolute main hook advancing only after the separate commit.
  fs.writeFileSync(path.join(f.host, '.githooks/pre-commit'), expanded, { mode: 0o755 });
  f.put('approved.cjs', 'legitimate new root entry\n');
  f.git(['add', 'approved.cjs']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:approved.cjs']), 'legitimate new root entry');
});

test('merge commits skip only root guarding and continue to reject staged fgOS deletions', (t) => {
  const f = fixture(t);
  f.git(['checkout', '-q', '-b', 'incoming']);
  f.git(['config', '--unset', 'core.hooksPath']);
  f.put('incoming.cjs', 'already integrated incoming root\n');
  f.git(['add', 'incoming.cjs']);
  f.git(['commit', '-q', '-m', 'incoming root']);
  f.git(['config', 'core.hooksPath', path.join(f.host, '.githooks')]);
  f.git(['checkout', '-q', 'main']);
  f.git(['merge', '--no-commit', '--no-ff', 'incoming']);
  f.git(['rm', '.fgos/cache/state.json']);
  refused(f.commit(), '.fgos/cache/state.json');
  f.git(['restore', '--source=HEAD', '--staged', '--worktree', '.fgos/cache/state.json']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:incoming.cjs']), 'already integrated incoming root');
  assert.equal(f.git(['rev-list', '--parents', '-1', 'HEAD']).split(' ').length, 3);
});

test('comment decoys cannot hide a real allowlist edit accompanying an allowed root addition', (t) => {
  const f = fixture(t);
  const declaration = hookSource.match(/^const ROOT_FILE_ALLOWLIST = new Set\(\[\n[\s\S]*?^\]\);/m)[0];
  const expanded = hookSource.replace("'rustfmt.toml',", "'rustfmt.toml', 'approved.cjs',");
  f.put('.githooks/pre-commit', expanded.replace('\n', `\n/*\n${declaration}\n*/\n`));
  f.put('README.md', '# Allowed root cannot authorize an allowlist edit\n');
  f.git(['add', '.githooks/pre-commit', 'README.md']);
  refused(f.commit(), 'README.md');
  assert.equal(f.git(['log', '-1', '--format=%s']), 'fixture baseline');
});

test('unrelated hook edits may accompany an already allowlisted root addition', (t) => {
  const f = fixture(t);
  f.put('.githooks/pre-commit', `${hookSource}\n// unrelated contributor comment\n`);
  f.put('README.md', '# Legitimate addition\n');
  f.git(['add', '.githooks/pre-commit', 'README.md']);
  passed(f.commit());
  assert.equal(f.git(['show', 'HEAD:README.md']), '# Legitimate addition');
});

test('Convention hook warns without blocking and forwards only direct added or renamed Markdown paths', (t) => {
  const f = fixture(t);
  f.git(['config', '--unset', 'core.hooksPath']);
  f.put('plans/reports/old.md', '# old report\n');
  f.git(['add', 'plans/reports/old.md']);
  f.git(['commit', '-qm', 'seed report']);
  f.git(['config', 'core.hooksPath', path.join(sourceRoot, '.githooks')]);

  f.git(['mv', 'plans/reports/old.md', 'plans/reports/-đổi-tên.md']);
  f.put('plans/journals/tạp chí.md', '# journal\n');
  f.put('plans/example/reports/nested-bad.md', '# nested\n');
  f.put('plans/reports/not-markdown.txt', 'not Markdown\n');
  f.git(['add', 'plans/reports/-đổi-tên.md', 'plans/journals/tạp chí.md', 'plans/example/reports/nested-bad.md', 'plans/reports/not-markdown.txt']);

  const argsLog = path.join(f.temp, 'host-args.json');
  const host = path.join(f.temp, 'fake-host.mjs');
  fs.writeFileSync(host, `#!/usr/bin/env node
import fs from 'node:fs';
fs.writeFileSync(process.env.ARGS_LOG, JSON.stringify(process.argv.slice(2)));
const separator = process.argv.indexOf('--');
const paths = separator === -1 ? [] : process.argv.slice(separator + 1);
const violations = paths.map((path) => ({ path, code: 'pattern-mismatch', message: 'bad fixture name' }));
process.stdout.write(JSON.stringify({ contract: 'fgos.v1', data: { checked: paths.length, violations } }));
`, { mode: 0o755 });

  const result = f.commit(f.repo, { FGOS_HOST_BIN: host, ARGS_LOG: argsLog });
  passed(result);
  assert.match(result.stderr, /warning: convention plans\/reports\/-đổi-tên\.md: pattern-mismatch/);
  assert.match(result.stderr, /warning: convention plans\/journals\/tạp chí\.md: pattern-mismatch/);
  const args = JSON.parse(fs.readFileSync(argsLog, 'utf8'));
  assert.deepEqual(args.slice(args.indexOf('--') + 1), [
    'plans/journals/tạp chí.md',
    'plans/reports/-đổi-tên.md',
  ]);
  assert.equal(args.includes('plans/example/reports/nested-bad.md'), false);
  assert.equal(args.includes('plans/reports/not-markdown.txt'), false);
});

test('Convention hook ignores modifications to pre-existing scoped files', (t) => {
  const f = fixture(t);
  f.git(['config', '--unset', 'core.hooksPath']);
  f.put('plans/reports/old-bad.md', '# old report\n');
  f.git(['add', 'plans/reports/old-bad.md']);
  f.git(['commit', '-qm', 'seed old report']);
  f.git(['config', 'core.hooksPath', path.join(sourceRoot, '.githooks')]);
  f.put('plans/reports/old-bad.md', '# modified\\n');
  f.git(['add', 'plans/reports/old-bad.md']);

  const host = path.join(f.temp, 'must-not-run');
  fs.writeFileSync(host, '#!/bin/sh\\nexit 99\\n', { mode: 0o755 });
  const result = f.commit(f.repo, { FGOS_HOST_BIN: host });
  passed(result);
  assert.doesNotMatch(result.stderr, /convention/);
});

test('Convention hook pass-skips a missing client in a copied hook fixture', (t) => {
  const f = fixture(t);
  f.put('plans/reports/bad.md', '# bad report\n');
  f.git(['add', 'plans/reports/bad.md']);
  const result = f.commit();
  passed(result);
  assert.match(result.stderr, /warning: convention check skipped \(client-load-error\)/);
});

test('Convention hook pass-skips an old host with one warning', (t) => {
  const f = fixture(t);
  f.git(['config', 'core.hooksPath', path.join(sourceRoot, '.githooks')]);
  f.put('plans/reports/bad.md', '# bad report\n');
  f.git(['add', 'plans/reports/bad.md']);
  const host = path.join(f.temp, 'old-host');
  fs.writeFileSync(
    host,
    "#!/bin/sh\necho 'fgos: unknown verb \"convention\". Usage: fgos <command> [args...]' >&2\nexit 4\n",
    { mode: 0o755 },
  );
  const result = f.commit(f.repo, { FGOS_HOST_BIN: host });
  passed(result);
  assert.match(result.stderr, /warning: convention check skipped \(host-version-mismatch\)/);
  assert.equal(result.stderr.match(/host-version-mismatch/g)?.length, 1);
});
