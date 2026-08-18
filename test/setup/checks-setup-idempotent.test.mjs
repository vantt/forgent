// checks-setup-idempotent.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
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


test('fgos setup run twice does not rewrite an already-complete ~/.fgos/config.json (tsk-1ri D2, fill-missing-only)', () => {
  const cwd = mkTemp('setup-cli-global-config-repeat-');
  const homeDir = mkTemp('setup-cli-global-config-repeat-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir };
  const first = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env });
  assert.equal(first.status, 0, first.stderr);
  const globalPath = JSON.parse(first.stdout).data.globalConfigPath;
  const mtimeBefore = fs.statSync(globalPath).mtimeMs;

  const second = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env });
  assert.equal(second.status, 0, second.stderr);
  const envelope = JSON.parse(second.stdout);
  assert.equal(envelope.data.globalConfigCreated, false);
  assert.deepEqual(envelope.data.globalConfigAddedKeys, []);
  assert.equal(fs.statSync(globalPath).mtimeMs, mtimeBefore, 'must not rewrite a file that already has every default key');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('setup from a real checkout still writes the rc line and reports no declined reason', () => {
  const homeDir = mkTemp('checks-git-home-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const cwd = initRepo('checks-git-cwd-');

  const result = spawnSync(process.execPath, [FGOS, 'setup'], {
    cwd,
    encoding: 'utf8',
    env: { ...NO_CLAUDE_ENV, HOME: homeDir },
  });

  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.equal(data.rcWriteDeclinedReason, undefined);
  assert.deepEqual(data.rcFilesInserted, [path.join(homeDir, '.bashrc')]);
  assert.ok(fs.readFileSync(path.join(homeDir, '.bashrc'), 'utf8').includes('fgos-shell-integration.sh'));

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
