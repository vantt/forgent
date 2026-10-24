// checks-doctor-config.test.mjs -- config/CLI-wiring/doctor-runtime checks
// tách khỏi checks.test.mjs (tsk-25b), tiếp tục cùng invariant chẻ cơ học D2
// mà tsk-3um/tsk-67g đã lập: mỗi file test/setup/*.test.mjs dưới ~30s để
// `node --test` trải suite ra các core. Thân test bê nguyên văn; chỉ
// import/helper đổi cho khớp phần nào file này thật sự dùng.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
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
  spawnSync,
  withHome,
} from './helpers/setup-checks-harness.mjs';
import { DEFAULT_WORKER_SLOT_CEILING } from '../../src/state/worker-slots.mjs';
import { writeLocalStatus } from '../../src/state/tool-registry.mjs';
import { writeGlobalConfig, writeProjectConfig, writeRawGlobalConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';

// tsk-in1-1 D1: a tool provider is declared directly in
// `runner.executors.<id>` (`.fgos/config.json`), config-edited like every
// other executor, never through a `fgos tool register` event.
function declareExecutor(cwd, id, fields) {
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const cfg = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
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

// Tool executors are a project's own choice, never a standard value: a project that declares none is inactive. What a
// machine last observed of the declared ones is the local status overlay, which these tests write directly.
const checkedPresent = (cwd, ...ids) => writeLocalStatus(path.join(cwd, '.fgos'), Object.fromEntries(ids.map((id) => [id, { status: 'present' }])));

test('tool-registry-configured passes as inactive on a fresh project: the standard declares no tool executor', () => {
  const cwd = mkTemp('fgos-tool-registry-inactive-');
  execFileSync('git', ['init', '-q'], { cwd });
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^inactive/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured passes when every declared tool is checked present (full)', () => {
  const cwd = mkTemp('fgos-tool-registry-full-');
  execFileSync('git', ['init', '-q'], { cwd });
  declareExecutor(cwd, 'echo-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  checkedPresent(cwd, 'echo-tool');
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.match(message, /^full — 1\/1/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tsk-3oa2: tool-registry-configured FAILS when a declared tool is missing or never checked (degraded) -- no longer a silent passed:true', () => {
  const cwd = mkTemp('fgos-tool-registry-degraded-');
  execFileSync('git', ['init', '-q'], { cwd });
  declareExecutor(cwd, 'never-checked-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  // The declared tool was never checked, so it stays "unknown", which classifyRegistryPosture reports as degraded.
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, false, 'a declared-but-unverified tool must fail the check, not silently pass as before this fix');
  assert.match(message, /^degraded — 0\/1/);
  assert.match(message, /fgos tool check/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('node-version-and-git passes under the current process (real Node, real git)', () => {
  const { passed, message } = checkById('node-version-and-git').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
});

test('shell-integration-sourced passes trivially when no rc files exist', () => {
  const homeDir = mkTemp('doctor-shell-none-');
  withHome(homeDir, () => {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('shell-integration-sourced fails when a detected rc file is missing the source line', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-missing-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  withHome(homeDir, () => {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('.bashrc'));
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('shell-integration-sourced passes when every detected rc file already has the source line, and the sourced function actually works', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-present-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${integrationScriptPath()}"\n`);
  // A disposable fixture with no underscore-prefixed dependency, probed
  // instead of this repo's own real (possibly still-buggy) script -- see
  // FGOS_SHELL_INTEGRATION_PROBE_SCRIPT's own doc comment in
  // registrations.mjs. `hasSourceLine`'s own text check above still reads
  // the real integrationScriptPath() -- only the real-invocation probe is
  // redirected, so this test still proves the file-text half of the check
  // against the real path while proving the invocation half against a
  // known-good fixture.
  const safeFixture = path.join(homeDir, 'safe-fgos.sh');
  fs.writeFileSync(safeFixture, 'fgos() {\n  echo "safe fgos $@"\n}\n');
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    withHome(homeDir, () => {
      const { passed } = checkById('shell-integration-sourced').check(process.cwd());
      assert.equal(passed, true);
    });
  } finally {
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when the source line is present but the sourced function itself is dead (tsk-2wpi: a text-present source line is not proof the command works)', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-broken-fn-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${integrationScriptPath()}"\n`);
  // Mirrors the real pre-fix scripts/fgos-shell-integration.sh shape: a
  // public function whose second line calls a private, underscore-prefixed
  // helper -- exactly the dependency a harness shell-function snapshot can
  // drop.
  const fragileFixture = path.join(homeDir, 'fragile-fgos.sh');
  fs.writeFileSync(
    fragileFixture,
    '_fgos_helper() {\n  echo resolved\n}\n\nfgos() {\n  _fgos_helper >/dev/null || return 1\n  echo "fgos $@"\n}\n',
  );
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = fragileFixture;
  const prevHarness = { CLAUDECODE: process.env.CLAUDECODE, CLAUDE_CODE_SESSION_ID: process.env.CLAUDE_CODE_SESSION_ID };
  delete process.env.CLAUDECODE;
  delete process.env.CLAUDE_CODE_SESSION_ID;
  try {
    withHome(homeDir, () => {
      const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
      assert.equal(passed, false);
      assert.match(message, /fgos --help.*fails/);
      assert.match(message, /_fgos_helper/);
    });
    // Inside an agent harness shell the same dead function is information, not a failure.
    process.env.CLAUDECODE = '1';
    withHome(homeDir, () => {
      const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
      assert.equal(passed, true);
      assert.match(message, /informational, running inside an agent harness shell/);
      assert.match(message, /_fgos_helper/);
    });
  } finally {
    for (const [key, value] of Object.entries(prevHarness)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
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

// A project Workflow naming a capability no entry covers: the shipped Workflows' capabilities are all in the
// standard, so these tests add a Workflow of the project's own.
function writeProjectWorkflow(cwd, capabilities) {
  fs.mkdirSync(path.join(cwd, 'core', 'workflows'), { recursive: true });
  const units = capabilities.map((capability, i) => `      - id: u${i}\n        template:\n          capability: ${capability}\n`).join('');
  fs.writeFileSync(path.join(cwd, 'core', 'workflows', 'mine.yaml'), `id: mine\nsteps:\n  - id: s\n    units:\n${units}`);
}

test('workflow-capabilities-configured passes on the standard alone: every shipped Workflow capability has an entry with a prefer pool', () => {
  const cwd = mkTemp('doctor-workflow-caps-standard-');
  const { passed, message } = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.doesNotMatch(message, /^warning/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('workflow-capabilities-configured names a capability a project Workflow uses that config lacks', () => {
  const cwd = mkTemp('doctor-workflow-caps-');
  writeProjectWorkflow(cwd, ['mine:frame']);
  const { passed, message } = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /mine:frame \(mine\)/);
  assert.doesNotMatch(message, /marketing:write/, 'a registered capability must not be reported');
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('workflow-capabilities-configured accepts a prefix entry, and a bare-verb entry no longer covers a capability', () => {
  const cwd = mkTemp('doctor-workflow-caps-verb-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectWorkflow(cwd, ['mine:critique']);
  const write = (entries) => writeProjectConfig(cwd, { runner: { capabilities: entries } });
  write({ 'mine:*': { description: 'prefix entry', prefer: [{ executor: 'x' }] } });
  assert.doesNotMatch(checkById('workflow-capabilities-configured').check(cwd).message, /mine:critique/);
  write({ critique: { description: 'verb entry', prefer: [{ executor: 'x' }] } });
  assert.match(checkById('workflow-capabilities-configured').check(cwd).message, /no entry for Workflow capabilities: .*mine:critique/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('workflow-capabilities-configured warns, naming each Workflow capability with no prefer pool', () => {
  const cwd = mkTemp('doctor-workflow-caps-nopool-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectWorkflow(cwd, ['mine:propose']);
  writeProjectConfig(cwd, { runner: { capabilities: { 'mine:propose': { description: 'taste-free' } } } });
  const { passed, message } = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(passed, true, 'a taste-free entry is a warning, not a failure');
  assert.match(message, /^warning: .*no "prefer" pool/);
  assert.match(message, /mine:propose/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('workflow-capabilities-configured is clean when each capability resolves to a prefer pool, on its exact entry or its prefix entry', () => {
  const cwd = mkTemp('doctor-workflow-caps-pool-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  writeProjectWorkflow(cwd, ['mine:exact', 'other:viaprefix']);
  writeProjectConfig(cwd, { runner: { capabilities: {
    'mine:exact': { description: 'exact', prefer: [{ executor: 'x' }] },
    'other:*': { description: 'prefix', prefer: [{ executor: 'x' }] },
  } } });
  const { passed, message } = checkById('workflow-capabilities-configured').check(cwd);
  assert.equal(passed, true, message);
  assert.doesNotMatch(message, /^warning/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor --fix (CLI e2e) creates the gateway token file through the real fix, then finds nothing left to repair', () => {
  const cwd = mkTemp('doctor-cli-fix-token-');
  const homeDir = mkTemp('doctor-cli-fix-token-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env });
  assert.equal(result.status, 0, `fgos doctor --fix failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  const fixedEntry = data.fixed.find((f) => f.id === 'gateway-token-configured');
  assert.ok(fixedEntry, 'doctor --fix did not report the gateway-token-configured fix');
  assert.equal(fixedEntry.changed, true);
  const tokenFile = path.join(homeDir, '.fgos', 'private', 'gateway-token');
  assert.equal(fs.statSync(tokenFile).mode & 0o777, 0o600);
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
test('fgos doctor --fix --pretty (CLI e2e) renders a fix line green even when the fix found nothing to change', () => {
  const cwd = mkTemp('doctor-cli-fix-pretty-noop-');
  const homeDir = mkTemp('doctor-cli-fix-pretty-noop-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const first = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env });
  assert.equal(first.status, 0, `fgos doctor --fix failed: ${first.stderr}`);

  const second = spawnSync(process.execPath, [FGOS, 'doctor', '--fix', '--pretty'], { cwd, encoding: 'utf8', env });
  assert.equal(second.status, 0, `fgos doctor --fix --pretty failed: ${second.stderr}`);
  const lines = second.stdout.split('\n');
  const fixLine = lines.find((l) => l.includes('fix: gateway-token-configured'));
  assert.ok(fixLine, 'expected a "fix: gateway-token-configured" line in --pretty output');
  assert.match(fixLine, /0 repaired/, 'expected the second run to be the already-correct no-op case');
  assert.ok(fixLine.includes('\x1b[32m'), `expected a green mark on an already-correct fix line, got: ${fixLine}`);
  assert.ok(!fixLine.includes('\x1b[31m'), `expected no red mark on an already-correct fix line, got: ${fixLine}`);
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

test('main-checkout-hook-wired doctor check reports passed/failed matching mainCheckoutHookWired, with an actionable message', () => {
  const cwd = mkTemp('doctor-hook-check-');
  execFileSync('git', ['init', '-q'], { cwd });
  fs.mkdirSync(path.join(cwd, '.githooks'));
  const before = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(before.passed, false);
  assert.match(before.message, /run fgos setup/);

  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd });
  const after = checkById('main-checkout-hook-wired').check(cwd);
  assert.equal(after.passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('doctor-cli-json-');
  const homeDir = mkTemp('doctor-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok(Array.isArray(envelope.data.checks));
  assert.equal(envelope.data.checks.length, DOCTOR_CHECKS.length);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --pretty prints colored ANSI text, not JSON', () => {
  const cwd = mkTemp('doctor-cli-pretty-');
  const homeDir = mkTemp('doctor-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--pretty'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor against a fresh cwd with no runner config never creates the shared config file (read-only proof)', () => {
  const cwd = mkTemp('doctor-cli-readonly-');
  const homeDir = mkTemp('doctor-cli-readonly-home-');
  const configFiles = ['config.json', 'config.yaml'].map((name) => path.join(cwd, '.fgos', name));
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  for (const file of configFiles) assert.equal(fs.existsSync(file), false, `fgos doctor must never create ${file}`);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.checks.find((c) => c.id === 'config-parse').passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
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

test('shell-integration-sourced fails on a dead fgos source line even when the live line is present', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-dead-');
  const gone = path.join(homeDir, 'removed-worktree', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(
    path.join(homeDir, '.bashrc'),
    `source "${integrationScriptPath()}"\nsource "${gone}"\n`,
  );
  withHome(homeDir, () => {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes(gone), `message did not name the dead path: ${message}`);
    assert.ok(message.includes('1 dead'), `message did not count the dead lines: ${message}`);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('shell-integration-sourced counts dead lines per rc file across both bash and zsh', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-dead-both-');
  const live = `source "${integrationScriptPath()}"\n`;
  const gone = path.join(homeDir, 'gone', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `${live}source "${gone}"\n`);
  fs.writeFileSync(path.join(homeDir, '.zshrc'), `${live}source "${gone}"\nsource "${gone}"\n`);
  withHome(homeDir, () => {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('3 dead'), `expected 3 dead across both files: ${message}`);
    assert.ok(message.includes(`${path.join(homeDir, '.bashrc')} (1)`), message);
    assert.ok(message.includes(`${path.join(homeDir, '.zshrc')} (2)`), message);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('shell-integration-sourced still passes when every rc file has only the live line', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  const homeDir = mkTemp('doctor-shell-clean-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `source "${integrationScriptPath()}"\n`);
  // See FGOS_SHELL_INTEGRATION_PROBE_SCRIPT's doc comment (registrations.mjs)
  // and the earlier "...and the sourced function actually works" test for
  // why this points the real-invocation probe at a known-good fixture
  // rather than this repo's own real script.
  const safeFixture = path.join(homeDir, 'safe-fgos.sh');
  fs.writeFileSync(safeFixture, 'fgos() {\n  echo "safe fgos $@"\n}\n');
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    withHome(homeDir, () => {
      const { passed } = checkById('shell-integration-sourced').check(process.cwd());
      assert.equal(passed, true);
    });
  } finally {
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced samples dead paths instead of printing all of them', { skip: process.platform === 'win32' ? 'bash/zsh rc files are not detected on win32' : false }, () => {
  // Real profiles accumulate these into the hundreds; a check message that
  // names every one scrolls the rest of the doctor report off the screen.
  const homeDir = mkTemp('doctor-shell-dead-many-');
  const dead = Array.from({ length: 12 }, (_, i) =>
    path.join(homeDir, `gone-${i}`, 'scripts', 'fgos-shell-integration.sh'),
  );
  fs.writeFileSync(
    path.join(homeDir, '.bashrc'),
    `source "${integrationScriptPath()}"\n${dead.map((d) => `source "${d}"`).join('\n')}\n`,
  );
  withHome(homeDir, () => {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('12 dead'), `expected the full count: ${message}`);
    assert.ok(message.includes('(+9 more path(s))'), `expected the remainder note: ${message}`);
    const named = dead.filter((d) => message.includes(d));
    assert.equal(named.length, 3, `expected exactly 3 sampled paths, got ${named.length}`);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('no-stuck-merge-abort check passes and fix reports nothing to fix on a clean repo with no MERGE_HEAD', () => {
  const dir = initRepo('checks-no-stuck-merge-clean-');
  try {
    const { passed, message } = checkById('no-stuck-merge-abort').check(dir);
    assert.equal(passed, true);
    assert.match(message, /no merge in progress/);

    const { changed, message: fixMessage } = fixById('no-stuck-merge-abort').fix(dir);
    assert.equal(changed, false);
    assert.match(fixMessage, /nothing to fix/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('no-stuck-merge-abort check fails and fix reports manual command when MERGE_HEAD exists', () => {
  const dir = initRepo('checks-no-stuck-merge-dirty-');
  try {
    const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
    fs.writeFileSync(path.join(dir, '.git', 'MERGE_HEAD'), `${headSha}\n`);

    const { passed, message } = checkById('no-stuck-merge-abort').check(dir);
    assert.equal(passed, false);
    assert.match(message, /merge in progress or stuck/);
    assert.match(message, new RegExp(`fgos main-checkout-reset --sha ${headSha} --confirm`));

    const { changed, message: fixMessage } = fixById('no-stuck-merge-abort').fix(dir);
    assert.equal(changed, false);
    assert.match(fixMessage, /merge in progress or stuck/);
    assert.match(fixMessage, new RegExp(`fgos main-checkout-reset --sha ${headSha} --confirm`));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('tier-vocabulary-dead-keys check passes on clean config', () => {
  const dir = mkTemp('checks-tier-dead-clean-');
  try {
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    writeProjectConfig(dir, {
      runner: {
        defaults: { tier: 'standard' },
        modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', flagship: 'opus', frontier: 'opus' } },
      },
    });
    const { passed, message } = checkById('tier-vocabulary-dead-keys').check(dir);
    assert.equal(passed, true);
    assert.match(message, /no retired tier vocabulary/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('tier-vocabulary-dead-keys check fails when retired keys are present', () => {
  const dir = mkTemp('checks-tier-dead-dirty-');
  try {
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    writeProjectConfig(dir, {
      runner: {
        models: { light: 'haiku' },
        rigorOverrides: { low: 'standard' },
        capabilities: {
          'code:review': { overrides: { tier: 'standard' } },
        },
      },
    });
    const { passed, message } = checkById('tier-vocabulary-dead-keys').check(dir);
    assert.equal(passed, false);
    assert.match(message, /runner\.models/);
    assert.match(message, /runner\.rigorOverrides/);
    assert.match(message, /capabilities\.code:review\.overrides/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('tier-vocabulary-dead-keys names a rigorToTier as retired, whether the global or the project file carries it', () => {
  const dir = mkTemp('checks-tier-dead-rigor-');
  const fakeHome = mkTemp('fake-home-');
  try {
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    fs.mkdirSync(path.join(fakeHome, '.fgos'), { recursive: true });
    const rigorToTier = { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' };
    writeGlobalConfig(fakeHome, { runner: { rigorToTier } });
    withHome(fakeHome, () => {
      writeProjectConfig(dir, { runner: { defaults: { tier: 'standard' } } });
      const global = checkById('tier-vocabulary-dead-keys').check(dir);
      assert.equal(global.passed, false);
      assert.match(global.message, /effective config contains retired key "runner\.rigorToTier".*delete the key/);
      writeGlobalConfig(fakeHome, { runner: {} });
      writeProjectConfig(dir, { runner: { rigorToTier } });
      const { passed, message } = checkById('tier-vocabulary-dead-keys').check(dir);
      assert.equal(passed, false);
      assert.match(message, /effective config contains retired key "runner\.rigorToTier".*delete the key/);
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(fakeHome, { recursive: true, force: true });
  }
});

test('coordination-protocol-dead-vocabulary check fails when minTier is in protocol YAML', () => {
  const dir = mkTemp('checks-coord-proto-dead-');
  try {
    const protoDir = path.join(dir, '.fgos', 'coordination-protocols');
    fs.mkdirSync(protoDir, { recursive: true });
    fs.writeFileSync(path.join(protoDir, 'test-proto.yaml'), 'steps:\n  - id: step1\n    policy:\n      minTier: standard\n');
    const { passed, message } = checkById('coordination-protocol-dead-vocabulary').check(dir);
    assert.equal(passed, false);
    assert.match(message, /minTier/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
