// agy-permissions.test.mjs -- real-CLI-subprocess coverage for tsk-1xm's
// agy-permissions-configured doctor check/fix (src/setup/agy-permissions.mjs),
// mirroring checks-setup-idempotent.test.mjs's own spawnSync-a-real-`fgos`
// harness style (a mocked fs write would never prove the CLI wiring itself
// works). Every case overrides HOME so this never touches the real machine's
// ~/.gemini/antigravity-cli/settings.json.
import { test } from 'node:test';
import {
  FGOS,
  NO_CLAUDE_ENV,
  assert,
  fs,
  mkTemp,
  path,
  spawnSync,
} from './helpers/setup-checks-harness.mjs';

function agySettingsPath(homeDir) {
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

function doctorCheck(result, id) {
  const { data } = JSON.parse(result.stdout);
  const entry = data.checks.find((c) => c.id === id);
  assert.ok(entry, `doctor did not report a "${id}" check`);
  return entry;
}

test('fgos doctor reports agy-permissions-configured as failing when agy has no settings.json yet', () => {
  const cwd = mkTemp('agy-perms-fresh-cwd-');
  const homeDir = mkTemp('agy-perms-fresh-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const check = doctorCheck(result, 'agy-permissions-configured');
  assert.equal(check.passed, false);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --fix provisions toolPermission always-proceed + a non-empty permissions.deny, then the check passes', () => {
  const cwd = mkTemp('agy-perms-fix-cwd-');
  const homeDir = mkTemp('agy-perms-fix-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir };

  const fixed = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env });
  assert.equal(fixed.status, 0, fixed.stderr);
  const fixedCheck = doctorCheck(fixed, 'agy-permissions-configured');
  assert.equal(fixedCheck.passed, true);

  const settings = JSON.parse(fs.readFileSync(agySettingsPath(homeDir), 'utf8'));
  assert.equal(settings.toolPermission, 'always-proceed');
  assert.ok(Array.isArray(settings.permissions?.deny) && settings.permissions.deny.length > 0);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --fix run twice does not rewrite an already-configured agy settings.json (fill-missing-only)', () => {
  const cwd = mkTemp('agy-perms-idempotent-cwd-');
  const homeDir = mkTemp('agy-perms-idempotent-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir };

  const first = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env });
  assert.equal(first.status, 0, first.stderr);
  const mtimeBefore = fs.statSync(agySettingsPath(homeDir)).mtimeMs;

  const second = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env });
  assert.equal(second.status, 0, second.stderr);
  const secondFixEntry = JSON.parse(second.stdout).data.fixed.find((f) => f.id === 'agy-permissions-configured');
  assert.equal(secondFixEntry.changed, false);
  assert.equal(fs.statSync(agySettingsPath(homeDir)).mtimeMs, mtimeBefore, 'must not rewrite a file that already has both keys');

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --fix never touches an existing trustedWorkspaces list or an already-customized denylist', () => {
  const cwd = mkTemp('agy-perms-preserve-cwd-');
  const homeDir = mkTemp('agy-perms-preserve-home-');
  const settingsPath = agySettingsPath(homeDir);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  const customSettings = {
    trustedWorkspaces: ['/home/example/my-project'],
    toolPermission: 'always-proceed',
    permissions: { deny: ['command(regex:^my-own-custom-rule)'] },
  };
  fs.writeFileSync(settingsPath, JSON.stringify(customSettings, null, 2));

  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--fix'], { cwd, encoding: 'utf8', env: { ...NO_CLAUDE_ENV, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const check = doctorCheck(result, 'agy-permissions-configured');
  assert.equal(check.passed, true);

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.deepEqual(settings.trustedWorkspaces, ['/home/example/my-project']);
  assert.deepEqual(settings.permissions.deny, ['command(regex:^my-own-custom-rule)']);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
