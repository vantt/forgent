// checks-setup-rc-line.test.mjs -- hai test dựng môi trường thật, tách nguyên văn từ
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


test('fgos setup --pretty prints colored ANSI text describing what it did, not JSON', () => {
  const cwd = mkTemp('setup-cli-pretty-');
  const homeDir = mkTemp('setup-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup', '--pretty'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  assert.ok(result.stdout.includes('.fgos/config.json'), 'expected --pretty output to describe the config file it touched');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('setup from a copy of fgos that is not in a git checkout declines the rc write and says why', () => {
  // The `/tmp/tmp.XXXXXXXX` shape observed in the wild: an unpacked copy with
  // no `.git` of its own. Its path is ephemeral, so writing it into a shell
  // profile leaves a `source` line that outlives the directory.
  const copyRoot = mkTemp('checks-nongit-copy-');
  const repoRoot = path.resolve(__dirname, '../..');
  for (const entry of ['bin', 'src', 'scripts', 'domains', 'package.json']) {
    fs.cpSync(path.join(repoRoot, entry), path.join(copyRoot, entry), { recursive: true });
  }
  assert.equal(fs.existsSync(path.join(copyRoot, '.git')), false);

  const homeDir = mkTemp('checks-nongit-home-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, 'echo hi\n');

  const result = spawnSync(process.execPath, [path.join(copyRoot, 'bin', 'fgos.mjs'), 'setup'], {
    cwd: copyRoot,
    encoding: 'utf8',
    env: { ...NO_CLAUDE_ENV, HOME: homeDir },
  });

  assert.equal(result.status, 0, `setup failed: ${result.stderr}`);
  const { data } = JSON.parse(result.stdout);
  assert.deepEqual(data.rcFilesInserted, []);
  assert.deepEqual(data.rcFilesAlreadyConfigured, []);
  assert.ok(
    /not inside a git checkout/.test(data.rcWriteDeclinedReason ?? ''),
    `expected a stated reason, got: ${JSON.stringify(data.rcWriteDeclinedReason)}`,
  );
  // The whole point: nothing was appended to the profile.
  assert.equal(fs.readFileSync(rcFile, 'utf8'), 'echo hi\n');
  // Setup's other work still happened.
  assert.equal(fs.existsSync(path.join(copyRoot, '.fgos', 'config.json')), true);

  fs.rmSync(copyRoot, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
