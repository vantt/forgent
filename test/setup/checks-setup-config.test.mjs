// checks-setup-config.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
// test/setup/checks.test.mjs (tsk-67g). Nội dung test không đổi, chỉ chỗ ở đổi.
// Nhóm ở đây cân theo giây, không theo chủ đề: 10 test loại này chiếm 117.6s
// trong 120s của file gốc, nên gom theo chủ đề sẽ đẻ ra nhóm vượt ngưỡng 30s.
import '../helpers/process-tmp-root.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
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


test('fgos setup wires core.hooksPath to this checkout\'s absolute .githooks path, and reports hooksWired: true', () => {
  const cwd = mkTemp('setup-cli-hooks-');
  const homeDir = mkTemp('setup-cli-hooks-home-');
  initFixtureRepo(cwd);
  fs.mkdirSync(path.join(cwd, '.githooks'));
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.hooksWired, true);
  const hooksPath = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
  assert.equal(hooksPath, path.join(cwd, '.githooks'), 'must be absolute -- a relative value resolves per-worktree, not to this root (tsk-2u5 D4)');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

