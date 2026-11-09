// agy-permissions.test.mjs -- tsk-1xm's agy-permissions-configured doctor row and the agy sub-HOME
// row (src/setup/agy-permissions.mjs), in process, plus one `fgos doctor` wiring proof. Both rows
// only read; that no fgOS verb writes the person's own agy settings is proven in
// test/setup/agent-wiring.test.mjs. Every case overrides HOME.
import '../helpers/process-tmp-root.mjs';
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
import { checkAgyPermissionsConfigured, checkAgySubHomesConfigured, findAgySubHomes } from '../../src/setup/agy-permissions.mjs';

function agySettingsPath(homeDir) {
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

function doctorCheck(result, id) {
  const { data } = JSON.parse(result.stdout);
  const entry = data.checks.find((c) => c.id === id);
  assert.ok(entry, `doctor did not report a "${id}" check`);
  return entry;
}

test('agy-permissions-configured passes with nothing to check when agy is not on PATH, and only warns (never fails, never writes) when agy is there without the settings', () => {
  const homeDir = mkTemp('agy-perms-fresh-home-');
  const absent = checkAgyPermissionsConfigured(homeDir, { agyPresent: false });
  assert.equal(absent.passed, true);
  assert.match(absent.message, /not found on PATH/);
  const bare = checkAgyPermissionsConfigured(homeDir, { agyPresent: true });
  assert.equal(bare.passed, true);
  assert.equal(bare.configured, false);
  assert.match(bare.message, /^warning: .*never sets it for you; `fgos wire-agents` shows the exact edit/);
  assert.deepEqual(fs.readdirSync(homeDir), [], 'the check writes nothing');
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('agy-permissions-configured accepts always-proceed with the person\'s own customized deny list', () => {
  const homeDir = mkTemp('agy-perms-custom-home-');
  const settingsPath = agySettingsPath(homeDir);
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify({ toolPermission: 'always-proceed', permissions: { deny: ['command(regex:^my-own-custom-rule)'] } }));
  const result = checkAgyPermissionsConfigured(homeDir, { agyPresent: true });
  assert.equal(result.configured, true);
  assert.match(result.message, /1 deny rule\(s\) configured/);
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor reports the agy-permissions and agy sub-HOME rows', () => {
  const cwd = mkTemp('agy-perms-doctor-cwd-');
  const homeDir = mkTemp('agy-perms-doctor-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };

  // boundary: the one wiring proof that the doctor verb registers and reports both agy rows.
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(doctorCheck(result, 'agy-permissions-configured').passed, true);
  // With no executor config the sub-HOME row has nothing to check.
  assert.equal(doctorCheck(result, 'agy-sub-homes-configured').passed, true);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('findAgySubHomes also finds the credential homes of the declared gemini accounts, which a confined pane actually runs as', () => {
  const fakeHome = '/home/fakeuser';
  const config = {
    runner: {
      executors: {
        gemini: { invocations: [{ id: 'agy-1', command: 'agy', env: { HOME: '${HOME}/.agy-homes/acc-1' } }] },
      },
      providers: {
        gemini: {
          accounts: {
            'acc-1': { credentialSource: { kind: 'home-files', home: '${HOME}/.agy-homes/acc-1', files: ['x'] } },
            'acc-2': { credentialSource: { kind: 'home-files', home: '${HOME}/.agy-homes/acc-2', files: ['x'] } },
          },
        },
        xai: {
          accounts: { vantt: { credentialSource: { kind: 'home-files', home: '${HOME}/.pi/accounts/grok-vantt', files: ['x'] } } },
        },
      },
    },
  };
  const found = findAgySubHomes('/dummy', { homeDir: fakeHome, config });
  assert.deepEqual(
    found.map((f) => f.resolvedPath).sort(),
    [path.resolve('/home/fakeuser/.agy-homes/acc-1'), path.resolve('/home/fakeuser/.agy-homes/acc-2')].sort(),
    'one entry per home, the xai pi account is not an agy home',
  );
});

test('findAgySubHomes discovers agy sub-HOMEs across single and multi-executor configs and resolves ${HOME}', () => {
  const fakeHome = '/home/fakeuser';
  const config = {
    runner: {
      executor: {
        command: 'agy',
        env: { HOME: '${HOME}/.agy-homes/single-acc' },
      },
      executors: {
        gemini: {
          invocations: [
            { id: 'agy-1', command: 'agy', env: { HOME: '${HOME}/.agy-homes/acc-1' } },
            { id: 'agy-1-dup', command: 'agy', env: { HOME: '${HOME}/.agy-homes/acc-1' } },
            { id: 'agy-2', command: 'agy', env: { HOME: '~/.agy-homes/acc-2' } },
          ],
        },
        openai: {
          invocations: [
            { id: 'codex-1', command: 'codex', env: { CODEX_HOME: '${HOME}/.codex-acc' } },
          ],
        },
      },
    },
  };

  const found = findAgySubHomes('/dummy', { homeDir: fakeHome, config });
  assert.equal(found.length, 3);
  assert.deepEqual(
    found.map((f) => f.resolvedPath).sort(),
    [
      path.resolve('/home/fakeuser/.agy-homes/acc-1'),
      path.resolve('/home/fakeuser/.agy-homes/acc-2'),
      path.resolve('/home/fakeuser/.agy-homes/single-acc'),
    ].sort(),
  );
});

test('checkAgySubHomesConfigured passes when all referenced sub-HOMEs have toolPermission=always-proceed', () => {
  const tempBase = mkTemp('agy-sub-pass-');
  const home1 = path.join(tempBase, 'home1');
  const home2 = path.join(tempBase, 'home2');

  for (const h of [home1, home2]) {
    const sPath = path.join(h, '.gemini', 'antigravity-cli', 'settings.json');
    fs.mkdirSync(path.dirname(sPath), { recursive: true });
    fs.writeFileSync(sPath, JSON.stringify({ toolPermission: 'always-proceed' }));
  }

  const config = {
    runner: {
      executors: {
        gemini: {
          invocations: [
            { id: 'agy-1', command: 'agy', env: { HOME: home1 } },
            { id: 'agy-2', command: 'agy', env: { HOME: home2 } },
          ],
        },
      },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, true);
  assert.match(res.message, /all 2 agy sub-HOME\(s\) configured/);

  fs.rmSync(tempBase, { recursive: true, force: true });
});

test('checkAgySubHomesConfigured fails when a sub-HOME is missing settings.json', () => {
  const tempBase = mkTemp('agy-sub-missing-');
  const homeOk = path.join(tempBase, 'homeOk');
  const homeMissing = path.join(tempBase, 'homeMissing');

  const sPath = path.join(homeOk, '.gemini', 'antigravity-cli', 'settings.json');
  fs.mkdirSync(path.dirname(sPath), { recursive: true });
  fs.writeFileSync(sPath, JSON.stringify({ toolPermission: 'always-proceed' }));

  const config = {
    runner: {
      executors: {
        gemini: {
          invocations: [
            { id: 'agy-1', command: 'agy', env: { HOME: homeOk } },
            { id: 'agy-2', command: 'agy', env: { HOME: homeMissing } },
          ],
        },
      },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, false);
  assert.match(res.message, /missing settings\.json/);
  assert.ok(res.message.includes(homeMissing));

  fs.rmSync(tempBase, { recursive: true, force: true });
});

test('checkAgySubHomesConfigured fails when a sub-HOME has misconfigured toolPermission', () => {
  const tempBase = mkTemp('agy-sub-misconf-');
  const homeBad = path.join(tempBase, 'homeBad');

  const sPath = path.join(homeBad, '.gemini', 'antigravity-cli', 'settings.json');
  fs.mkdirSync(path.dirname(sPath), { recursive: true });
  fs.writeFileSync(sPath, JSON.stringify({ toolPermission: 'request-review' }));

  const config = {
    runner: {
      executors: {
        gemini: {
          invocations: [
            { id: 'agy-1', command: 'agy', env: { HOME: homeBad } },
          ],
        },
      },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, false);
  assert.match(res.message, /misconfigured settings\.json/);
  assert.match(res.message, /request-review/);

  fs.rmSync(tempBase, { recursive: true, force: true });
});

test('checkAgySubHomesConfigured passes when no agy sub-HOMEs are referenced in config', () => {
  const config = {
    runner: {
      executors: {
        claude: { command: 'claude' },
      },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, true);
  assert.match(res.message, /no agy sub-HOMEs referenced/);
});
