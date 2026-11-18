// agy-permissions.test.mjs -- the agy sub-HOME row (src/setup/agy-permissions.mjs), in process, plus one
// `fgos doctor` wiring proof that the host reports it and the agy permissions row. The agy permissions row itself
// is owned by packages/distribution/rust/src/agent_config.rs; that no fgOS verb writes the person's own agy
// settings is proven in test/setup/agent-wiring.test.mjs. Every case overrides HOME.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import {
  FGOS,
  NO_CLAUDE_ENV,
  assert,
  fs,
  mkTemp,
  path,
  runHostDoctor,
  spawnSync,
} from './helpers/setup-checks-harness.mjs';
import { checkAgySubHomesConfigured, findAgySubHomes } from '../../src/setup/agy-permissions.mjs';

function agySettingsPath(homeDir) {
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

function doctorCheck(result, id) {
  const { data } = JSON.parse(result.stdout);
  const entry = data.checks.find((c) => c.id === id);
  assert.ok(entry, `doctor did not report a "${id}" check`);
  return entry;
}

test('fgos doctor reports the agy-permissions and agy sub-HOME rows', () => {
  const cwd = mkTemp('agy-perms-doctor-cwd-');
  const homeDir = mkTemp('agy-perms-doctor-home-');
  const env = { ...NO_CLAUDE_ENV, HOME: homeDir, USERPROFILE: homeDir };

  // boundary: the one wiring proof that the doctor verb registers and reports both agy rows.
  const result = runHostDoctor([], { cwd, env });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(doctorCheck(result, 'agy-permissions-configured').passed, true);
  // With no executor config the sub-HOME row has nothing to check.
  assert.equal(doctorCheck(result, 'agy-sub-homes-configured').passed, true);

  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('findAgySubHomes also finds the agy login homes of the gemini pool of runner.llmAccounts, which a confined pane actually runs as', () => {
  const fakeHome = '/home/fakeuser';
  const config = {
    runner: {
      executors: {
        gemini: { invocations: [{ id: 'agy-1', command: 'agy', env: { HOME: '${HOME}/.agy-homes/acc-1' } }] },
      },
      llmAccounts: {
        gemini: {
          'acc-1': { credentialStore: { agy: '${HOME}/.agy-homes/acc-1' } },
          'acc-2': { credentialStore: { agy: '${HOME}/.agy-homes/acc-2', pi: '${HOME}/.pi/accounts/acc-2' } },
        },
        xai: {
          vantt: { credentialStore: { pi: '${HOME}/.pi/accounts/grok-vantt' } },
        },
      },
    },
  };
  const found = findAgySubHomes('/dummy', { homeDir: fakeHome, config });
  assert.deepEqual(
    found.map((f) => f.resolvedPath).sort(),
    [path.resolve('/home/fakeuser/.agy-homes/acc-1'), path.resolve('/home/fakeuser/.agy-homes/acc-2')].sort(),
    'one entry per home: the agy store of a gemini account, not its pi store and not another pool',
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

test('checkAgySubHomesConfigured passes when every referenced sub-HOME exists, whether an executor or a gemini account names it', () => {
  const tempBase = mkTemp('agy-sub-pass-');
  const home1 = path.join(tempBase, 'home1');
  const home2 = path.join(tempBase, 'home2');
  fs.mkdirSync(home1, { recursive: true });
  fs.mkdirSync(home2, { recursive: true });

  const config = {
    runner: {
      executors: { gemini: { invocations: [{ id: 'agy-1', command: 'agy', env: { HOME: home1 } }] } },
      llmAccounts: { gemini: { second: { credentialStore: { agy: home2 } } } },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, true);
  assert.match(res.message, /all 2 agy sub-HOME\(s\) exist/);
  // The home holds no settings.json: a run passes its settings per invocation, so none is demanded.

  fs.rmSync(tempBase, { recursive: true, force: true });
});

test('checkAgySubHomesConfigured fails when a referenced sub-HOME does not exist', () => {
  const tempBase = mkTemp('agy-sub-missing-');
  const homeOk = path.join(tempBase, 'homeOk');
  const homeMissing = path.join(tempBase, 'homeMissing');
  fs.mkdirSync(homeOk, { recursive: true });

  const config = {
    runner: {
      executors: { gemini: { invocations: [{ id: 'agy-1', command: 'agy', env: { HOME: homeOk } }] } },
      llmAccounts: { gemini: { gone: { credentialStore: { agy: homeMissing } } } },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, false);
  assert.match(res.message, /not a directory/);
  assert.ok(res.message.includes(homeMissing));
  assert.ok(!res.message.includes(homeOk));

  fs.rmSync(tempBase, { recursive: true, force: true });
});

test('checkAgySubHomesConfigured passes when no agy sub-HOMEs are referenced in config', () => {
  const config = {
    runner: {
      executors: {
        claude: { invocations: [{ id: 'claude-cli', via: 'cli', command: 'claude' }]},
      },
    },
  };

  const res = checkAgySubHomesConfigured('/dummy', { config });
  assert.equal(res.passed, true);
  assert.match(res.message, /no agy sub-HOMEs referenced/);
});
