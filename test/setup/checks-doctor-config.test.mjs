// checks-doctor-config.test.mjs -- config/CLI-wiring/doctor-runtime checks
// tách khỏi checks.test.mjs (tsk-25b), tiếp tục cùng invariant chẻ cơ học D2
// mà tsk-3um/tsk-67g đã lập: mỗi file test/setup/*.test.mjs dưới ~30s để
// `node --test` trải suite ra các core. Thân test bê nguyên văn; chỉ
// import/helper đổi cho khớp phần nào file này thật sự dùng.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import {
  DOCTOR_CHECKS,
  FGOS,
  NO_CLAUDE_ENV,
  assert,
  checkById,
  execFileSync,
  fixById,
  fs,
  initRepo,
  integrationScriptPath,
  mainCheckoutHookWired,
  mkTemp,
  path,
  resolveMainCheckout,
  runHostDoctor,
  spawnSync,
  withHome,
} from './helpers/setup-checks-harness.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../../src/state/worker-slots.mjs';
import { writeGlobalConfig, writeProjectConfig, writeRawGlobalConfig, writeRawProjectConfig, readProjectConfig, statGatewayToken, gatewayTokenPath } from '../helpers/config-fixture.mjs';

// tsk-in1-1 D1: a tool provider is declared directly in
// `runner.executors.<id>` (`.fgos/config.json`), config-edited like every
// other executor, never through a `fgos tool register` event.
function declareExecutor(cwd, id, fields) {
  const cfg = readProjectConfig(cwd);
  cfg.runner ??= {};
  cfg.runner.executors ??= {};
  cfg.runner.executors[id] = fields;
  // A project config in the seat-binding schema: the loader refuses one that has no marker.
  cfg.runner.patterns = { ...cfg.runner.patterns, seatBinding: { schema: 1 } };
  // tsk-45f D11 (tsk-34n retired the "capability" singular fallback --
  // "for" is the only field read now): "for" is catalog-validated against
  // cfg.runner.capabilities -- declare each entry here so this raw fixture
  // writer keeps producing a loadable config, same as a real executor
  // would need.
  if (Array.isArray(fields.for)) {
    cfg.runner.capabilities ??= {};
    for (const purpose of fields.for) {
      cfg.runner.capabilities[purpose] ??= {};
    }
  }
  writeProjectConfig(cwd, cfg);
}

// Tool executors are a project's own choice, never a standard value: a project that declares none is inactive. The
// declared ones are probed live: a cli tool on PATH, an mcp tool by its scanTarget on disk.

test('tool-registry-configured passes as inactive on a fresh project: the standard declares no tool executor', () => {
  const cwd = mkTemp('fgos-tool-registry-inactive-');
  initializeWorkRepository(cwd);
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^inactive/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured passes as full when every declared tool is found live', () => {
  const cwd = mkTemp('fgos-tool-registry-full-');
  initializeWorkRepository(cwd);
  declareExecutor(cwd, 'echo-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: process.execPath, args: [] }] });
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^full — 1\/1/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured fails as degraded naming each status when a declared tool is missing, stale or cannot be probed', () => {
  const cwd = mkTemp('fgos-tool-registry-degraded-');
  initializeWorkRepository(cwd);
  declareExecutor(cwd, 'gone-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'fgos-no-such-tool-binary', args: [] }] });
  declareExecutor(cwd, 'no-target-tool', { kind: 'tool', for: ['other-capability'], invocations: [{ via: 'mcp', command: 'mcp:t' }] });
  declareExecutor(cwd, 'stale-tool', { kind: 'tool', for: ['third-capability'], scanTarget: '.stale-index', invocations: [{ via: 'mcp', command: 'mcp:s' }] });
  fs.mkdirSync(path.join(cwd, '.stale-index'));
  // An index is stale only against a HEAD that resolves.
  execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'seed'], { cwd });
  fs.writeFileSync(path.join(cwd, '.stale-index', 'meta.json'), JSON.stringify({ lastCommit: '0'.repeat(40) }));
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, false, 'a declared tool that is not there must fail the check');
  assert.match(message, /^degraded — 0\/3 tool\(s\) present \(1 stale, 1 missing, 1 cannot be probed\)/);
  assert.match(message, /fgos dispatch decide --for/);
  assert.doesNotMatch(message, /fgos tool/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured counts a tool serving two capabilities once', () => {
  const cwd = mkTemp('fgos-tool-registry-two-for-');
  initializeWorkRepository(cwd);
  declareExecutor(cwd, 'two-tool', { kind: 'tool', for: ['one-capability', 'two-capability'], invocations: [{ via: 'cli', command: process.execPath, args: [] }] });
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^full — 1\/1/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('executor-profile-warnings warns, without failing, that a prefer on a tool-served capability is ignored', () => {
  const cwd = mkTemp('fgos-tool-prefer-ignored-');
  initializeWorkRepository(cwd);
  declareExecutor(cwd, 'echo-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: process.execPath, args: [] }] });
  const cfg = readProjectConfig(cwd);
  cfg.runner.capabilities['test-capability'].prefer = ['echo-tool'];
  writeProjectConfig(cwd, cfg);
  const { passed, message } = checkById('executor-profile-warnings').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^warning:/);
  assert.match(message, /tool-purpose-prefer-ignored\.test-capability/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('worker-slots-ceiling-usable passes on the standard alone (unarmed null), and says so', () => {
  const cwd = mkTemp('doctor-slots-standard-');
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /unarmed/);
  assert.match(message, new RegExp(`recommended: ${DEFAULT_WORKER_SLOT_CEILING}`));
  fs.rmSync(cwd, { recursive: true, force: true });
});

// The whole point of the check: each of these silently enforces NOTHING,
// because hasWorkerSlotRoom treats anything that is not a positive integer
// as "no ceiling configured" and allows every claim. A project reading its
// own config would believe it is capped. The schema already refuses a string,
// a fraction, a boolean and a list; these two are integers it admits.
test('worker-slots-ceiling-usable fails on a ceiling that silently enforces nothing', () => {
  for (const ceiling of [0, -1]) {
    const cwd = mkTemp('doctor-slots-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    writeProjectConfig(cwd, { workerSlots: { ceiling } });
    const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
    assert.equal(passed, false, `malformed ceiling: ${JSON.stringify(ceiling)}`);
    assert.match(message, /enforces NOTHING/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('worker-slots-ceiling-usable passes and names a real armed ceiling', () => {
  const cwd = mkTemp('doctor-slots-armed-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectConfig(cwd, { workerSlots: { ceiling: 6 } });
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /workerSlots\.ceiling = 6/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// A project Workflow of the project's own, naming the capabilities given.
function writeProjectWorkflow(cwd, capabilities) {
  fs.mkdirSync(path.join(cwd, 'core', 'workflows'), { recursive: true });
  const units = capabilities.map((capability, i) => `      - id: u${i}\n        template:\n          capability: ${capability}\n`).join('');
  fs.writeFileSync(path.join(cwd, 'core', 'workflows', 'mine.yaml'), `id: mine\nsteps:\n  - id: s\n    units:\n${units}`);
}

test('workflow-capabilities-configured passes on the standard alone, and a capability with no row is a label that passes', () => {
  const cwd = mkTemp('doctor-workflow-caps-label-');
  assert.equal(checkById('workflow-capabilities-configured').check(cwd).passed, true);
  writeProjectWorkflow(cwd, ['mine:frame']);
  const { passed, message } = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.doesNotMatch(message, /warning|mine:frame/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('workflow-capabilities-configured fails only for a tool ability whose tool is not present, naming it and the Workflow', () => {
  const cwd = mkTemp('doctor-workflow-caps-tool-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectWorkflow(cwd, ['impact-analysis', 'mine:frame']);
  assert.equal(checkById('workflow-capabilities-configured').check(cwd).passed, true, 'no tool executor names it: a label');
  declareExecutor(cwd, 'gone-graph', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'cli', command: 'fgos-no-such-tool-binary', args: [] }] });
  const failed = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(failed.passed, false);
  assert.match(failed.message, /impact-analysis \(mine from project\)/);
  assert.doesNotMatch(failed.message, /mine:frame/);
  declareExecutor(cwd, 'graph', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'cli', command: process.execPath, args: [] }] });
  const served = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(served.passed, true, served.message);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor --fix (CLI e2e) creates the gateway token file through the real fix, then finds nothing left to repair', () => {
  const cwd = mkTemp('doctor-cli-fix-token-');
  const homeDir = mkTemp('doctor-cli-fix-token-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const result = runHostDoctor(['--fix'], { cwd, env });
  assert.equal(result.status, 0, `fgos doctor --fix failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  const fixedEntry = data.fixed.find((f) => f.id === 'gateway-token-configured');
  assert.ok(fixedEntry, 'doctor --fix did not report the gateway-token-configured fix');
  assert.equal(fixedEntry.changed, true);
  assert.equal(statGatewayToken(path.join(homeDir, '.fgos')).mode & 0o777, 0o600);
  assert.equal(data.checks.find((c) => c.id === 'gateway-token-configured').passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

// docs/history/doctor-fix-pretty-status-line/CONTEXT.md D1: a registered
// fix's own contract (register-a-fixable-doctor-check-in-fgos.md step 2)
// has no failing outcome -- `changed: false` means "already correct", not
// "broken". `renderPretty`'s doctor `fixed` lines must render green
// regardless of `changed`, never key that color off `changed` the way a
// `checks` line keys it off `passed`.
test('fgos doctor --fix --pretty (CLI e2e) prints plain text, not JSON, and marks a fix line passed even when the fix found nothing to change (no colour codes when piped)', () => {
  const cwd = mkTemp('doctor-cli-fix-pretty-noop-');
  const homeDir = mkTemp('doctor-cli-fix-pretty-noop-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  // The token file as the fix leaves it, so this run's fix has nothing to change; the fix creating it is the test above.
  const tokenFile = gatewayTokenPath(path.join(homeDir, '.fgos'));
  fs.mkdirSync(path.dirname(tokenFile), { recursive: true, mode: 0o700 });
  fs.writeFileSync(tokenFile, `${'a'.repeat(64)}\n`, { mode: 0o600 });

  const second = runHostDoctor(['--fix', '--pretty'], { cwd, env });
  assert.equal(second.status, 0, `fgos doctor --fix --pretty failed: ${second.stderr}`);
  assert.throws(() => JSON.parse(second.stdout), 'expected --pretty output to NOT be valid JSON');
  const lines = second.stdout.split('\n');
  const fixLine = lines.find((l) => l.includes('fix: gateway-token-configured'));
  assert.ok(fixLine, 'expected a "fix: gateway-token-configured" line in --pretty output');
  assert.match(fixLine, /0 repaired/, 'expected the second run to be the already-correct no-op case');
  assert.ok(fixLine.includes('✓'), `expected a passed mark on an already-correct fix line, got: ${fixLine}`);
  assert.ok(!fixLine.includes('✗'), `expected no failed mark on an already-correct fix line, got: ${fixLine}`);
  assert.ok(!second.stdout.includes('\x1b['), 'piped --pretty output must carry no ANSI escape codes');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('mainCheckoutHookWired is false in a cwd with no .git at all, and never throws', () => {
  const cwd = mkTemp('doctor-hook-no-git-');
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is false in a real git repo whose core.hooksPath is unset', () => {
  const cwd = mkTemp('doctor-hook-unset-');
  execFileSync('git', ['init', '-q'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is false when core.hooksPath points somewhere other than .githooks', () => {
  const cwd = mkTemp('doctor-hook-other-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', 'some-other-dir'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true once core.hooksPath is set to .githooks', () => {
  const cwd = mkTemp('doctor-hook-wired-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true when core.hooksPath is an absolute path resolving to repoRoot/.githooks', () => {
  const cwd = mkTemp('doctor-hook-absolute-');
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'core.hooksPath', path.join(cwd, '.githooks')], { cwd });
  assert.equal(mainCheckoutHookWired(cwd), true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('mainCheckoutHookWired is true from inside a linked worktree when the main checkout has an absolute core.hooksPath, not just from the main checkout itself', () => {
  const mainCheckout = mkTemp('doctor-hook-absolute-worktree-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainCheckout });
  fs.writeFileSync(path.join(mainCheckout, 'file.txt'), 'x');
  execFileSync('git', ['add', 'file.txt'], { cwd: mainCheckout });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: mainCheckout });
  execFileSync('git', ['config', 'core.hooksPath', path.join(mainCheckout, '.githooks')], { cwd: mainCheckout });

  const worktreeDir = mkTemp('doctor-hook-absolute-worktree-linked-');
  fs.rmdirSync(worktreeDir);
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt-branch', worktreeDir], { cwd: mainCheckout });

  assert.equal(mainCheckoutHookWired(worktreeDir), true, 'must resolve against the main checkout root, not the worktree cwd it was called from');

  execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: mainCheckout });
  fs.rmSync(mainCheckout, { recursive: true, force: true });
});

test('fgos doctor (no flags) on a fresh cwd prints the envelope JSON with every check, and never creates the shared config file (read-only proof)', () => {
  const cwd = mkTemp('doctor-cli-readonly-');
  const homeDir = mkTemp('doctor-cli-readonly-home-');
  const configFiles = ['config.json', 'config.yaml'].map((name) => path.join(cwd, '.fgos', name));
  const result = runHostDoctor([], { cwd, env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  for (const file of configFiles) assert.equal(fs.existsSync(file), false, `fgos doctor must never create ${file}`);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  // The host answers the registry's rows; a Node body exists for each row the registry does not give to Rust.
  const registry = JSON.parse(fs.readFileSync(new URL('../../packages/distribution/contracts/doctor-registry.v1.json', import.meta.url), 'utf8'));
  const configRows = JSON.parse(fs.readFileSync(new URL('../../packages/config/contracts/doctor-rows.v1.json', import.meta.url), 'utf8')).rows;
  const group = registry.groups.config;
  const registryIds = registry.rows.flatMap((entry) => (entry.group === 'config'
    ? configRows.map((row) => group.idMap[row.id] ?? row.id)
    : [entry.id]));
  assert.deepEqual(envelope.data.checks.map((c) => c.id), registryIds);
  for (const id of registryIds.filter((rowId) => !registry.inRust.rows.includes(rowId))) {
    assert.ok(DOCTOR_CHECKS.some((c) => c.id === id), `${id} is judged by Node and has no registered body`);
  }
  assert.equal(envelope.data.checks.find((c) => c.id === 'config-parse').passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor in a git repo that is not set up for fgOS writes no .fgos and starts no events child', async () => {
  const cwd = mkTemp('doctor-cli-unset-repo-');
  const homeDir = mkTemp('doctor-cli-unset-repo-home-');
  const realCwd = fs.realpathSync(cwd);
  try {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd });
    const result = runHostDoctor(['--json'], { cwd, env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
    assert.equal(result.status, 0, result.stderr);
    // A detached publish child outlives doctor, so give it a bounded window to show up in the process table.
    const deadline = Date.now() + 3000;
    let children = '';
    while (Date.now() < deadline && !children) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const table = spawnSync('ps', ['-eo', 'args'], { encoding: 'utf8' }).stdout ?? '';
      children = table.split('\n').filter((line) => /\bevents\b/.test(line) && (line.includes(cwd) || line.includes(realCwd))).join('\n');
    }
    assert.equal(children, '', 'doctor must not start an events child');
    assert.equal(fs.existsSync(path.join(cwd, '.fgos')), false, `doctor left ${fs.readdirSync(cwd).join(',')} with a .fgos behind: ${fs.existsSync(path.join(cwd, '.fgos')) ? fs.readdirSync(path.join(cwd, '.fgos')).join(',') : ''}`);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('resolveMainCheckout from inside a linked worktree resolves the main checkout, not the worktree', () => {
  const main = initRepo('checks-main-');
  const wt = path.join(mkTemp('checks-wt-parent-'), 'wt');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'side', wt], { cwd: main });

  // The distinction the dead-source-line bug turned on: --show-toplevel would
  // report the worktree itself here, which is why each worktree used to earn
  // its own shell-profile line.
  assert.equal(
    fs.realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: wt, encoding: 'utf8' }).trim()),
    fs.realpathSync(wt),
  );
  assert.equal(fs.realpathSync(resolveMainCheckout(wt)), fs.realpathSync(main));

  execFileSync('git', ['worktree', 'remove', '--force', wt], { cwd: main });
  fs.rmSync(main, { recursive: true, force: true });
});

test('resolveMainCheckout returns null outside a git checkout entirely', () => {
  const plain = mkTemp('checks-plain-');
  assert.equal(resolveMainCheckout(plain), null);
  fs.rmSync(plain, { recursive: true, force: true });
});

test('integrationScriptPath returns a path that actually exists on disk', () => {
  const resolved = integrationScriptPath();
  assert.notEqual(resolved, null, 'this test runs from a git checkout, so a path must resolve');
  assert.equal(fs.existsSync(resolved), true, `${resolved} does not exist`);
});

test('integrationScriptPath names the main checkout even when this copy runs from a linked worktree', () => {
  // Proves the fix at the level the bug lived at: the path handed to a shell
  // profile must outlive the worktree the command happened to run from.
  const resolved = integrationScriptPath();
  const owningCheckout = resolveMainCheckout(path.dirname(resolved));
  assert.equal(fs.realpathSync(path.join(owningCheckout, 'scripts')), fs.realpathSync(path.dirname(resolved)));
});

// ─── D1/D5: dead source lines are reported as a failed check ────────────────

