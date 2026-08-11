// checks-setup-envelope.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
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


// ─── CLI-level tests: real spawned `fgos setup` / `fgos doctor` ───────────

test('fgos setup (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('setup-cli-json-');
  const homeDir = mkTemp('setup-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok('data' in envelope);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup fills a missing default key into an existing ~/.fgos/config.json without touching a key the user already customized (tsk-1ri D1)', () => {
  const cwd = mkTemp('setup-cli-global-config-fill-');
  const homeDir = mkTemp('setup-cli-global-config-fill-home-');
  const globalDir = path.join(homeDir, '.fgos');
  fs.mkdirSync(globalDir, { recursive: true });
  const globalPath = path.join(globalDir, 'config.json');
  const customized = { runner: { ...DEFAULT_RUNNER_CONFIG, executor: { command: 'my-custom-cli', args: ['{prompt}'] } } };
  fs.writeFileSync(globalPath, `${JSON.stringify(customized, null, 2)}\n`);

  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const written = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  assert.equal(written.runner.executor.command, 'my-custom-cli', 'a value the user already customized must never be overwritten');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
