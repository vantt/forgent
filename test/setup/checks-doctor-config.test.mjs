// checks-doctor-config.test.mjs -- config/CLI-wiring/doctor-runtime checks
// tách khỏi checks.test.mjs (tsk-25b), tiếp tục cùng invariant chẻ cơ học D2
// mà tsk-3um/tsk-67g đã lập: mỗi file test/setup/*.test.mjs dưới ~30s để
// `node --test` trải suite ra các core. Thân test bê nguyên văn; chỉ
// import/helper đổi cho khớp phần nào file này thật sự dùng.
import { test } from 'node:test';
import {
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
  DEFAULT_LEVEL,
  DEFAULT_RUNNER_CONFIG,
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
import { DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC } from '../../src/state/events-jsonl-truncation-guard.mjs';
import { DEFAULT_CAPABILITY_SLOTS, DEFAULT_IRON_LAW_LEVEL, PI_EXECUTOR_DEFAULT } from '../../src/setup/registrations.mjs';

// tsk-in1-1 D1: a tool provider is declared directly in
// `runner.executors.<id>` (`.fgos/config.json`), config-edited like every
// other executor, never through a `fgos tool register` event.
function declareExecutor(cwd, id, fields) {
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const cfg = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  cfg.runner ??= {};
  cfg.runner.executors ??= {};
  cfg.runner.executors[id] = fields;
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
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

test('tool-registry-configured passes when no tool-capable executor is declared at all (inactive — a clean skip, never a failure)', () => {
  const cwd = mkTemp('fgos-tool-registry-inactive-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /^inactive/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tool-registry-configured passes when every declared tool is checked present (full)', () => {
  const cwd = mkTemp('fgos-tool-registry-full-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  declareExecutor(cwd, 'echo-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  const check = spawnSync(process.execPath, [FGOS, 'tool', 'check'], { cwd, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /^full/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('tsk-3oa2: tool-registry-configured FAILS when a declared tool is missing or never checked (degraded) -- no longer a silent passed:true', () => {
  const cwd = mkTemp('fgos-tool-registry-degraded-');
  execFileSync('git', ['init', '-q'], { cwd });
  spawnSync(process.execPath, [FGOS, 'init'], { cwd, encoding: 'utf8' });
  declareExecutor(cwd, 'never-checked-tool', { kind: 'tool', for: ['test-capability'], invocations: [{ via: 'cli', command: 'echo', args: [] }] });
  // Deliberately never runs `fgos tool check` -- the tool stays "unknown",
  // which classifyRegistryPosture reports as degraded (never inactive).
  const { passed, message } = checkById('tool-registry-configured').check(cwd);
  assert.equal(passed, false, 'a declared-but-unverified tool must fail the check, not silently pass as before this fix');
  assert.match(message, /^degraded/);
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
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when a detected rc file is missing the source line', () => {
  const homeDir = mkTemp('doctor-shell-missing-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('.bashrc'));
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced passes when every detected rc file already has the source line, and the sourced function actually works', () => {
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
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when the source line is present but the sourced function itself is dead (tsk-2wpi: a text-present source line is not proof the command works)', () => {
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
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = fragileFixture;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.match(message, /fgos --help.*fails/);
    assert.match(message, /_fgos_helper/);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('config-not-stale reports failed/not-configured when the shared file is absent', () => {
  const cwd = mkTemp('doctor-config-absent-');
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /not yet configured/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale passes when the existing config already has every default key', () => {
  const cwd = mkTemp('doctor-config-full-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        ...DEFAULT_RUNNER_CONFIG,
        capabilities: DEFAULT_CAPABILITY_SLOTS,
        modelPolicies: { ...DEFAULT_RUNNER_CONFIG.modelPolicies, 'openai-codex': { lightweight: 'gpt-5.5' } },
        executors: { pi: PI_EXECUTOR_DEFAULT },
      },
      gateBypass: { level: 'off' },
      cleanup: { ttlDays: DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS },
      herdrOrchestrator: DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
      herdrWebDashboard: DEFAULT_HERDR_WEB_DASHBOARD_SETTINGS,
      invariantChecks: { commands: DEFAULT_INVARIANT_CHECK_COMMANDS },
      workerSlots: { ceiling: null },
      gateway: { port: 4170, token: null },
      ironLaw: { level: DEFAULT_IRON_LAW_LEVEL },
      checkpoint: { fallbackIntervalSec: DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC },
    }),
  );
  const { passed } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale fails when the shared file is complete except gateBypass', () => {
  const cwd = mkTemp('doctor-config-no-gatebypass-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: DEFAULT_RUNNER_CONFIG }));
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /gateBypass/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale fails when the existing config is missing a default key', () => {
  const cwd = mkTemp('doctor-config-stale-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { executor: { command: 'claude', args: [] } } }));
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /stale config/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── gate-bypass-configured (docs/history/doctor-fix-gate-bypass/CONTEXT.md
// D1/D3, tsk-2qz-2): the registry's first entry to register all three
// capabilities (check + configDefault + fix). check/fix here are both
// keyed to "is config.gateBypass.level present and a recognized LEVEL",
// deliberately distinct from config-not-stale's generic "key present at
// all" scan above (a malformed-but-present level is never "missing").

// ─── invariant-checks-configured (docs/history/tsk-516-approve-reverify-
// scope/CONTEXT.md D6): same check+configDefault registry shape as
// gate-bypass below. The check deliberately never EXECUTES the configured
// commands — they are arbitrary project-supplied shell strings, and doctor
// is a cheap, side-effect-free diagnosis — so what it can and does answer is
// the misconfiguration that actually bites: a present-but-unusable section
// reads as zero commands at return/merge, silently disabling the gate while
// looking configured.

test('invariant-checks-configured fails when the section is missing entirely', () => {
  const cwd = mkTemp('doctor-invariant-absent-');
  const { passed, message } = checkById('invariant-checks-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /invariantChecks section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('invariant-checks-configured fails when the section is present but yields no runnable command', () => {
  for (const malformed of [{ commands: [] }, { commands: 'not-a-list' }, {}, { commands: ['', '  '] }]) {
    const cwd = mkTemp('doctor-invariant-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ invariantChecks: malformed }));
    const { passed, message } = checkById('invariant-checks-configured').check(cwd);
    assert.equal(passed, false, `malformed: ${JSON.stringify(malformed)}`);
    assert.match(message, /present but yields no runnable command/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('invariant-checks-configured passes and names the configured commands', () => {
  const cwd = mkTemp('doctor-invariant-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ invariantChecks: { commands: ['node --test test/architecture.test.mjs'] } }),
  );
  const { passed, message } = checkById('invariant-checks-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /1 command\(s\)/);
  assert.match(message, /node --test test\/architecture\.test\.mjs/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('worker-slots-ceiling-usable fails when the section is missing entirely', () => {
  const cwd = mkTemp('doctor-slots-absent-');
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /workerSlots section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// The whole point of the check: each of these silently enforces NOTHING,
// because hasWorkerSlotRoom treats anything that is not a positive integer
// as "no ceiling configured" and allows every claim. A project reading its
// own config would believe it is capped.
test('worker-slots-ceiling-usable fails on a ceiling that silently enforces nothing', () => {
  for (const ceiling of ['8', 8.5, 0, -1, true, []]) {
    const cwd = mkTemp('doctor-slots-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling } }));
    const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
    assert.equal(passed, false, `malformed ceiling: ${JSON.stringify(ceiling)}`);
    assert.match(message, /enforces NOTHING/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

// `null` is the one non-number that is not a mistake -- it is exactly what
// `fgos setup` writes, and it means "deliberately unarmed", so it must pass
// while still saying plainly that nothing is being enforced.
test('worker-slots-ceiling-usable passes on the unarmed null fgos setup writes, and says so', () => {
  const cwd = mkTemp('doctor-slots-unarmed-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling: null } }));
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /unarmed/);
  assert.match(message, new RegExp(`recommended: ${DEFAULT_WORKER_SLOT_CEILING}`));
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('worker-slots-ceiling-usable passes and names a real armed ceiling', () => {
  const cwd = mkTemp('doctor-slots-armed-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling: 6 } }));
  const { passed, message } = checkById('worker-slots-ceiling-usable').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /workerSlots\.ceiling = 6/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── advise-execute-capabilities-configured (tsk-2uf-3, docs/history/
// dispatch-activation-and-handoff-redesign/CONTEXT.md D2): same
// generic-scan/dedicated-check split as gateway/workerSlots/invariantChecks
// above -- config-not-stale already catches runner.capabilities (or either
// slot) being wholly ABSENT; this check catches present-but-malformed.

test('advise-execute-capabilities-configured fails when runner.capabilities is missing entirely', () => {
  const cwd = mkTemp('doctor-capabilities-absent-');
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /runner\.capabilities section missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('advise-execute-capabilities-configured fails when a slot is missing or malformed', () => {
  for (const capabilities of [
    { advise: {} }, // execute missing
    { execute: {} }, // advise missing
    { advise: 'not-an-object', execute: {} },
    { advise: [], execute: {} },
    { advise: null, execute: {} },
    {},
  ]) {
    const cwd = mkTemp('doctor-capabilities-malformed-');
    fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { capabilities } }));
    const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
    assert.equal(passed, false, `capabilities: ${JSON.stringify(capabilities)}`);
    assert.match(message, /missing or has a malformed slot for/);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('advise-execute-capabilities-configured passes when both slots are declared', () => {
  const cwd = mkTemp('doctor-capabilities-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ runner: { capabilities: DEFAULT_CAPABILITY_SLOTS } }),
  );
  const { passed, message } = checkById('advise-execute-capabilities-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /declares both "advise" and "execute"/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check fails when the shared file has no gateBypass key at all', () => {
  const cwd = mkTemp('doctor-gatebypass-absent-');
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing or not a recognized level/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check fails when gateBypass.level is present but not a recognized level', () => {
  const cwd = mkTemp('doctor-gatebypass-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'total' } }));
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing or not a recognized level/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured check passes when gateBypass.level is a recognized level', () => {
  const cwd = mkTemp('doctor-gatebypass-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'standard' } }));
  const { passed, message } = checkById('gate-bypass-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /"standard"/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix writes a default level when the shared file has no gateBypass key, preserving other keys', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-absent-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: { timeoutMs: 5000 } }));
  const { changed, message } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, true);
  assert.match(message, new RegExp(`"${DEFAULT_LEVEL}"`));
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.deepEqual(written.gateBypass, { level: DEFAULT_LEVEL });
  assert.deepEqual(written.runner, { timeoutMs: 5000 });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix repairs a malformed level back to the default', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ gateBypass: { level: 'total' } }));
  const { changed } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, true);
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.equal(written.gateBypass.level, DEFAULT_LEVEL);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('gate-bypass-configured fix is idempotent: reports unchanged and never rewrites when level is already valid', () => {
  const cwd = mkTemp('doctor-gatebypass-fix-noop-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  const sharedPath = path.join(cwd, '.fgos', 'config.json');
  fs.writeFileSync(sharedPath, JSON.stringify({ gateBypass: { level: 'heavy' } }));
  const before = fs.statSync(sharedPath).mtimeMs;
  const { changed, message } = fixById('gate-bypass-configured').fix(cwd);
  assert.equal(changed, false);
  assert.match(message, /already "heavy"/);
  assert.equal(fs.statSync(sharedPath).mtimeMs, before);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('fgos doctor --fix (CLI e2e) actually bootstraps gateBypass.level via the real fix', () => {
  const cwd = mkTemp('doctor-cli-fix-gatebypass-');
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(result.status, 0, `fgos doctor --fix failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  const fixedEntry = data.fixed.find((f) => f.id === 'gate-bypass-configured');
  assert.ok(fixedEntry, 'doctor --fix did not report the gate-bypass-configured fix');
  assert.equal(fixedEntry.changed, true);
  const written = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'config.json'), 'utf8'));
  assert.equal(written.gateBypass.level, DEFAULT_LEVEL);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// docs/history/doctor-fix-pretty-status-line/CONTEXT.md D1: a registered
// fix's own contract (register-a-fixable-doctor-check-in-fgos.md step 2)
// has no failing outcome -- `changed: false` means "already correct", not
// "broken". `renderPretty`'s doctor `fixed` lines must render green
// regardless of `changed`, never key that color off `changed` the way a
// `checks` line keys it off `passed`.
test('fgos doctor --fix --pretty (CLI e2e) renders a fix line green even when the fix found nothing to change', () => {
  const cwd = mkTemp('doctor-cli-fix-pretty-noop-');
  execFileSync('git', ['init', '-q'], { cwd, encoding: 'utf8' });
  const first = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(first.status, 0, `fgos doctor --fix failed: ${first.stderr}`);

  const second = spawnSync(process.execPath, [FGOS, 'doctor', '--fix', '--pretty'], { cwd, encoding: 'utf8', env: NO_CLAUDE_ENV });
  assert.equal(second.status, 0, `fgos doctor --fix --pretty failed: ${second.stderr}`);
  const lines = second.stdout.split('\n');
  const fixLine = lines.find((l) => l.includes('fix: gate-bypass-configured'));
  assert.ok(fixLine, 'expected a "fix: gate-bypass-configured" line in --pretty output');
  assert.match(fixLine, /already "/, 'expected the second run to be the already-correct no-op case');
  assert.ok(fixLine.includes('\x1b[32m'), `expected a green mark on an already-correct fix line, got: ${fixLine}`);
  assert.ok(!fixLine.includes('\x1b[31m'), `expected no red mark on an already-correct fix line, got: ${fixLine}`);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── herdr-launcher-configured (tsk-2m5, docs/history/
// stage-status-driving-coordination/): the herdr-launcher's own
// auto-launch toggles. Check-only, no fix (YAGNI -- see registrations.mjs's
// own comment on this) -- `config-not-stale` already catches the whole
// section being MISSING; this check adds the one thing that generic
// staleness scan cannot: a PRESENT but non-boolean toggle value.

test('herdr-launcher-configured check fails when the shared file has no herdrOrchestrator key at all', () => {
  const cwd = mkTemp('doctor-herdr-launcher-absent-');
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-launcher-configured check fails when a toggle is present but not a boolean', () => {
  const cwd = mkTemp('doctor-herdr-launcher-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrOrchestrator: { autoDiscover: 'yes', autoMerge: false, autoRetro: false, autoCleanup: false } }),
  );
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /autoDiscover/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-launcher-configured check passes when every toggle is a boolean', () => {
  const cwd = mkTemp('doctor-herdr-launcher-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrOrchestrator: { autoDiscover: true, autoMerge: false, autoRetro: false, autoCleanup: false } }),
  );
  const { passed, message } = checkById('herdr-launcher-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /autoDiscover=true/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── herdr-web-dashboard-configured (tsk-48w, D14 of docs/history/herdr-
// web-dashboard-plan-realignment/CONTEXT.md): the web dashboard's static-
// serving toggle. Same check-only shape as herdr-launcher-configured
// above -- config-not-stale already catches the whole section missing;
// this check adds the one thing that generic staleness scan cannot: a
// PRESENT but non-boolean value.

test('herdr-web-dashboard-configured check fails when the shared file has no herdrWebDashboard key at all', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-absent-');
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /missing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-web-dashboard-configured check fails when staticServing is present but not a boolean', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-bad-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrWebDashboard: { staticServing: 'yes' } }),
  );
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /staticServing/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('herdr-web-dashboard-configured check passes when staticServing is a boolean', () => {
  const cwd = mkTemp('doctor-herdr-web-dashboard-ok-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.fgos', 'config.json'),
    JSON.stringify({ herdrWebDashboard: { staticServing: true } }),
  );
  const { passed, message } = checkById('herdr-web-dashboard-configured').check(cwd);
  assert.equal(passed, true);
  assert.match(message, /staticServing=true/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness is registered on DOCTOR_CHECKS and always passes', () => {
  const { passed, message } = checkById('config-awareness').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
});

test('config-awareness reports "none" when neither project nor global config exists', () => {
  const homeDir = mkTemp('doctor-awareness-none-home-');
  const cwd = mkTemp('doctor-awareness-none-cwd-');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /no config at either level/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness reports project active with global not present, when only project config exists', () => {
  const homeDir = mkTemp('doctor-awareness-project-only-home-');
  const cwd = mkTemp('doctor-awareness-project-only-cwd-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), '{}');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: project/);
    assert.match(message, /global config not present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness reports project active with global also present, when both exist', () => {
  const homeDir = mkTemp('doctor-awareness-both-home-');
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(homeDir, '.fgos', 'config.json'), '{}');
  const cwd = mkTemp('doctor-awareness-both-cwd-');
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), '{}');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: project/);
    assert.match(message, /global config also present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-awareness falls back to global active with project not present, when only global config exists', () => {
  const homeDir = mkTemp('doctor-awareness-global-only-home-');
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(homeDir, '.fgos', 'config.json'), '{}');
  const cwd = mkTemp('doctor-awareness-global-only-cwd-');
  withHome(homeDir, () => {
    const { passed, message } = checkById('config-awareness').check(cwd);
    assert.equal(passed, true);
    assert.match(message, /active: global/);
    assert.match(message, /project config not present/);
  });
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── main-checkout-hook-wired (tsk-3w8): str65's main-checkout lock only ───
// guards commits when core.hooksPath actually points at .githooks — str88
// removed the automatic `prepare`-lifecycle wiring (pnpm 10+ blocks it for a
// git-hosted dependency), so this doctor check + fgos setup's own wiring
// (below) are the only paths left that keep it honest.

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
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
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
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--pretty'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor against a fresh cwd with no runner config never creates the shared config file (read-only proof)', () => {
  const cwd = mkTemp('doctor-cli-readonly-');
  const homeDir = mkTemp('doctor-cli-readonly-home-');
  const configPath = path.join(cwd, '.fgos', 'config.json');
  assert.equal(fs.existsSync(configPath), false);
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(configPath), false, 'fgos doctor must never create .fgos/config.json');
  const envelope = JSON.parse(result.stdout);
  const configCheck = envelope.data.checks.find((c) => c.id === 'config-not-stale');
  assert.equal(configCheck.passed, false);
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

test('shell-integration-sourced fails on a dead fgos source line even when the live line is present', () => {
  const homeDir = mkTemp('doctor-shell-dead-');
  const gone = path.join(homeDir, 'removed-worktree', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(
    path.join(homeDir, '.bashrc'),
    `source "${integrationScriptPath()}"\nsource "${gone}"\n`,
  );
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes(gone), `message did not name the dead path: ${message}`);
    assert.ok(message.includes('1 dead'), `message did not count the dead lines: ${message}`);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced counts dead lines per rc file across both bash and zsh', () => {
  const homeDir = mkTemp('doctor-shell-dead-both-');
  const live = `source "${integrationScriptPath()}"\n`;
  const gone = path.join(homeDir, 'gone', 'scripts', 'fgos-shell-integration.sh');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `${live}source "${gone}"\n`);
  fs.writeFileSync(path.join(homeDir, '.zshrc'), `${live}source "${gone}"\nsource "${gone}"\n`);
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('3 dead'), `expected 3 dead across both files: ${message}`);
    assert.ok(message.includes(`${path.join(homeDir, '.bashrc')} (1)`), message);
    assert.ok(message.includes(`${path.join(homeDir, '.zshrc')} (2)`), message);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced still passes when every rc file has only the live line', () => {
  const homeDir = mkTemp('doctor-shell-clean-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), `source "${integrationScriptPath()}"\n`);
  // See FGOS_SHELL_INTEGRATION_PROBE_SCRIPT's doc comment (registrations.mjs)
  // and the earlier "...and the sourced function actually works" test for
  // why this points the real-invocation probe at a known-good fixture
  // rather than this repo's own real script.
  const safeFixture = path.join(homeDir, 'safe-fgos.sh');
  fs.writeFileSync(safeFixture, 'fgos() {\n  echo "safe fgos $@"\n}\n');
  const prevHome = process.env.HOME;
  const prevProbe = process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
  process.env.HOME = homeDir;
  process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = safeFixture;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    if (prevProbe === undefined) delete process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT;
    else process.env.FGOS_SHELL_INTEGRATION_PROBE_SCRIPT = prevProbe;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced samples dead paths instead of printing all of them', () => {
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
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('12 dead'), `expected the full count: ${message}`);
    assert.ok(message.includes('(+9 more path(s))'), `expected the remainder note: ${message}`);
    const named = dead.filter((d) => message.includes(d));
    assert.equal(named.length, 3, `expected exactly 3 sampled paths, got ${named.length}`);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
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

