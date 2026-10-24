// checks-setup-config.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
// test/setup/checks.test.mjs (tsk-67g). Nội dung test không đổi, chỉ chỗ ở đổi.
// Nhóm ở đây cân theo giây, không theo chủ đề: 10 test loại này chiếm 117.6s
// trong 120s của file gốc, nên gom theo chủ đề sẽ đẻ ra nhóm vượt ngưỡng 30s.
import '../helpers/process-tmp-root.mjs';
import { initFixtureRepo } from '../helpers/git-fixture.mjs';
import { legacyProjectConfigPath, writeRawLegacyProjectConfig, projectConfigExists } from '../helpers/config-fixture.mjs';
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
  writeEnduserDoc,
  writeEnduserManifest,
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

test('fgos setup creates a header-only config.yaml for the project and for the machine, holding no standard value', () => {
  const cwd = mkTemp('setup-cli-global-config-');
  const homeDir = mkTemp('setup-cli-global-config-home-');
  initFixtureRepo(cwd);
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const { data } = JSON.parse(result.stdout);
  const expected = { project: path.join(cwd, '.fgos', 'config.yaml'), global: path.join(homeDir, '.fgos', 'config.yaml') };
  assert.equal(data.configPath, expected.project);
  assert.equal(data.configCreated, true);
  assert.equal(data.globalConfigPath, expected.global);
  assert.equal(data.globalConfigCreated, true);
  for (const file of Object.values(expected)) {
    const body = fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'));
    assert.deepEqual(body, [], `${file} must hold the header only`);
  }
  assert.equal('configAddedKeys' in data || 'globalConfigAddedKeys' in data || 'tierLadderComment' in data, false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup leaves an existing legacy config.json alone and creates no config.yaml beside it', () => {
  const cwd = mkTemp('setup-cli-legacy-config-');
  const homeDir = mkTemp('setup-cli-legacy-config-home-');
  initFixtureRepo(cwd);
  writeRawLegacyProjectConfig(cwd, '{}\n');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const { data } = JSON.parse(result.stdout);
  assert.equal(data.configPath, legacyProjectConfigPath(cwd));
  assert.equal(data.configCreated, false);
  assert.equal(projectConfigExists(cwd), false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
