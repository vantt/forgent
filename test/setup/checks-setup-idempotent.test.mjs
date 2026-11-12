// checks-setup-idempotent.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
// test/setup/checks.test.mjs (tsk-67g). Nội dung test không đổi, chỉ chỗ ở đổi.
// Nhóm ở đây cân theo giây, không theo chủ đề: 10 test loại này chiếm 117.6s
// trong 120s của file gốc, nên gom theo chủ đề sẽ đẻ ra nhóm vượt ngưỡng 30s.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  DEFAULT_LEVEL,
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
} from './helpers/setup-checks-harness.mjs';


test('setup from a real checkout still writes the rc line and reports no declined reason', { skip: process.platform === 'win32' }, () => {
  const homeDir = mkTemp('checks-git-home-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const cwd = initRepo('checks-git-cwd-');

  const result = spawnSync(process.execPath, [FGOS, 'setup'], {
    cwd,
    encoding: 'utf8',
    env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir },
  });

  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.equal(data.rcWriteDeclinedReason, undefined);
  assert.deepEqual(data.rcFilesInserted, [path.join(homeDir, '.bashrc')]);
  assert.ok(fs.readFileSync(path.join(homeDir, '.bashrc'), 'utf8').includes('fgos-shell-integration.sh'));

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
