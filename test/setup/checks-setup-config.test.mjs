// checks-setup-config.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
// test/setup/checks.test.mjs (tsk-67g). Nội dung test không đổi, chỉ chỗ ở đổi.
// Nhóm ở đây cân theo giây, không theo chủ đề: 10 test loại này chiếm 117.6s
// trong 120s của file gốc, nên gom theo chủ đề sẽ đẻ ra nhóm vượt ngưỡng 30s.
import { test } from 'node:test';
import {
  DEFAULT_CLEANUP_LEAF_TTL_DAYS,
  DEFAULT_CLEANUP_TTL_DAYS,
  DEFAULT_HERDR_ORCHESTRATOR_SETTINGS,
  DEFAULT_INVARIANT_CHECK_COMMANDS,
  DEFAULT_LEVEL,
  DEFAULT_RUNNER_CONFIG,
  DOCTOR_CHECKS,
  FGOS,
  FIX_REGISTRATIONS,
  NO_CLAUDE_ENV,
  __dirname,
  addWork,
  appendEvent,
  assert,
  checkById,
  execFileSync,
  fileURLToPath,
  fixById,
  fs,
  initRepo,
  initStore,
  integrationScriptPath,
  mainCheckoutHookWired,
  mkTemp,
  os,
  path,
  resolveMainCheckout,
  spawnSync,
  withHome,
  writeEnduserDoc,
  writeEnduserManifest,
} from './helpers/setup-checks-harness.mjs';
import { DEFAULT_CAPABILITY_SLOTS, PI_EXECUTOR_DEFAULT } from '../../src/setup/registrations.mjs';

const EXPECTED_RUNNER_DEFAULT = {
  ...DEFAULT_RUNNER_CONFIG,
  capabilities: DEFAULT_CAPABILITY_SLOTS,
  modelPolicies: { ...DEFAULT_RUNNER_CONFIG.modelPolicies, 'openai-codex': { lightweight: 'gpt-5.5' } },
  executors: { pi: PI_EXECUTOR_DEFAULT },
};


test('fgos setup wires core.hooksPath to this checkout\'s absolute .githooks path, and reports hooksWired: true', () => {
  const cwd = mkTemp('setup-cli-hooks-');
  const homeDir = mkTemp('setup-cli-hooks-home-');
  execFileSync('git', ['init', '-q'], { cwd });
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.hooksWired, true);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(cwd, '.githooks'), 'must be absolute -- a relative value resolves per-worktree, not to this root (tsk-2u5 D4)');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup initializes ~/.fgos/config.json with the full default shape (tsk-1ri D1) when it does not exist', () => {
  const cwd = mkTemp('setup-cli-global-config-');
  const homeDir = mkTemp('setup-cli-global-config-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  const expectedGlobalPath = path.join(homeDir, '.fgos', 'config.json');
  assert.equal(envelope.data.globalConfigPath, expectedGlobalPath);
  assert.equal(envelope.data.globalConfigCreated, true);
  assert.ok(fs.existsSync(expectedGlobalPath));
  const written = JSON.parse(fs.readFileSync(expectedGlobalPath, 'utf8'));
  // tsk-2uf-3: the registered "runner" config-default now layers the
  // advise/execute capability slots onto DEFAULT_RUNNER_CONFIG (never
  // changing that constant itself, src/setup/registrations.mjs's own
  // `DEFAULT_CAPABILITY_SLOTS` composition) -- written.runner is no longer
  // byte-identical to DEFAULT_RUNNER_CONFIG alone.
  assert.deepEqual(written.runner, EXPECTED_RUNNER_DEFAULT);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
