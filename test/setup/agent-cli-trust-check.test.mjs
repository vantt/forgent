import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkAgentCliProjectTrusted } from '../../src/setup/agent-cli-trust.mjs';

const SECRET_LINE = 'api_key = "sk-do-not-print-this-value"';

// A fake HOME and a fake git project, both under the temp dir: the user's real agent CLI configs are
// never read.
function mkFixture() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agent-trust-home-'));
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agent-trust-project-'));
  fs.mkdirSync(path.join(project, '.git'));
  return { home, project: fs.realpathSync(project) };
}

function cleanup({ home, project }) {
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(project, { recursive: true, force: true });
}

function codexHome(home, name, body) {
  const dir = path.join(home, name);
  fs.mkdirSync(dir, { recursive: true });
  if (body !== undefined) fs.writeFileSync(path.join(dir, 'config.toml'), body);
  return dir;
}

function agyHome(home, name, settings) {
  const dir = path.join(home, '.agy-homes', name);
  fs.mkdirSync(path.join(dir, '.gemini', 'antigravity-cli'), { recursive: true });
  if (settings !== undefined) fs.writeFileSync(path.join(dir, '.gemini', 'antigravity-cli', 'settings.json'), JSON.stringify(settings));
  return dir;
}

const codexExecutor = (dir) => ({
  openai: { providerModel: 'openai', invocations: [{ id: 'codex-herdr', adapter: 'herdr-spawn', env: { CODEX_HOME: dir }, interactiveMode: { trustStore: { kind: 'codex-toml' } } }] },
});
const agyExecutor = (dir) => ({
  gemini: { providerModel: 'gemini', invocations: [{ id: 'agy-cli', env: { HOME: dir } }] },
});

function check(fixture, executors) {
  return checkAgentCliProjectTrusted(fixture.project, { loadRunnerConfig: () => ({ executors }), homeDir: fixture.home });
}

test('a project root that is not a git repository is not applicable', () => {
  const fixture = mkFixture();
  try {
    fs.rmSync(path.join(fixture.project, '.git'), { recursive: true });
    const result = check(fixture, codexExecutor(codexHome(fixture.home, '.codex-a')));
    assert.equal(result.passed, true);
    assert.match(result.message, /not applicable.*not a git repository/);
  } finally { cleanup(fixture); }
});

test('a project with no codex or agy executor is not applicable', () => {
  const fixture = mkFixture();
  try {
    const result = check(fixture, { claude: { providerModel: 'claude' } });
    assert.equal(result.passed, true);
    assert.match(result.message, /not applicable: no codex or agy executor/);
  } finally { cleanup(fixture); }
});

test('an unloadable runner config is not applicable and does not throw', () => {
  const fixture = mkFixture();
  try {
    const result = checkAgentCliProjectTrusted(fixture.project, { loadRunnerConfig: () => { throw new Error('boom'); }, homeDir: fixture.home });
    assert.equal(result.passed, true);
    assert.match(result.message, /not applicable.*boom/);
  } finally { cleanup(fixture); }
});

test('a codex home without an entry for the project fails with the exact lines to add, and the file is untouched', () => {
  const fixture = mkFixture();
  try {
    const dir = codexHome(fixture.home, '.codex-a', `${SECRET_LINE}\n[projects."/somewhere/else"]\ntrust_level = "trusted"\n`);
    const before = fs.readFileSync(path.join(dir, 'config.toml'), 'utf8');
    const result = check(fixture, codexExecutor(dir));
    assert.equal(result.passed, false);
    assert.match(result.message, new RegExp(`${path.join(dir, 'config.toml').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(openai/codex-herdr\\) has no entry`));
    assert.ok(result.message.includes(`[projects."${fixture.project}"] trust_level = "trusted"`));
    assert.ok(!result.message.includes('sk-do-not-print'));
    assert.equal(fs.readFileSync(path.join(dir, 'config.toml'), 'utf8'), before);
  } finally { cleanup(fixture); }
});

test('a codex home whose config.toml does not exist fails the same way instead of throwing', () => {
  const fixture = mkFixture();
  try {
    const result = check(fixture, codexExecutor(codexHome(fixture.home, '.codex-missing')));
    assert.equal(result.passed, false);
    assert.match(result.message, /has no entry/);
  } finally { cleanup(fixture); }
});

test('a codex entry that is present but not trusted fails and says so', () => {
  const fixture = mkFixture();
  try {
    const dir = codexHome(fixture.home, '.codex-a', `[projects."${fixture.project}"]\ntrust_level = "untrusted"\n`);
    const result = check(fixture, codexExecutor(dir));
    assert.equal(result.passed, false);
    assert.match(result.message, /has an entry that is not trusted/);
  } finally { cleanup(fixture); }
});

test('a trusted codex entry passes without printing any other content of the file', () => {
  const fixture = mkFixture();
  try {
    const dir = codexHome(fixture.home, '.codex-a', `${SECRET_LINE}\n[projects."${fixture.project}"]\ntrust_level = "trusted"\n`);
    const result = check(fixture, codexExecutor(dir));
    assert.equal(result.passed, true, result.message);
    assert.ok(!result.message.includes('sk-do-not-print'));
  } finally { cleanup(fixture); }
});

test('two codex homes are each checked: one trusted and one not fails naming only the untrusted one', () => {
  const fixture = mkFixture();
  try {
    const good = codexHome(fixture.home, '.codex-good', `[projects."${fixture.project}"]\ntrust_level = "trusted"\n`);
    const bad = codexHome(fixture.home, '.codex-bad', '');
    const executors = { ...codexExecutor(good), second: { invocations: [{ id: 'codex-cli', env: { CODEX_HOME: bad } }] } };
    const result = check(fixture, executors);
    assert.equal(result.passed, false);
    assert.ok(result.message.includes(path.join(bad, 'config.toml')));
    assert.ok(!result.message.includes(path.join(good, 'config.toml')));
  } finally { cleanup(fixture); }
});

test('an agy sub-HOME that does not list the project fails; one that lists it passes', () => {
  const fixture = mkFixture();
  try {
    const bad = agyHome(fixture.home, 'bad', { toolPermission: 'always-proceed', trustedWorkspaces: ['/somewhere/else'] });
    const failed = check(fixture, agyExecutor(bad));
    assert.equal(failed.passed, false);
    assert.match(failed.message, /does not list .* in trustedWorkspaces/);
    assert.ok(failed.message.includes(`add "${fixture.project}" to the "trustedWorkspaces" array`));

    const good = agyHome(fixture.home, 'good', { trustedWorkspaces: [fixture.project] });
    const passed = check(fixture, agyExecutor(good));
    assert.equal(passed.passed, true, passed.message);
  } finally { cleanup(fixture); }
});

test('an agy sub-HOME with no settings.json fails instead of throwing', () => {
  const fixture = mkFixture();
  try {
    const result = check(fixture, agyExecutor(agyHome(fixture.home, 'empty')));
    assert.equal(result.passed, false);
  } finally { cleanup(fixture); }
});

test('the registered check reads the project config and the overridden HOME, never the real one', () => {
  const fixture = mkFixture();
  const realHome = process.env.HOME;
  try {
    const dir = codexHome(fixture.home, '.codex-reg');
    fs.mkdirSync(path.join(fixture.project, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(fixture.project, '.fgos', 'config.json'), JSON.stringify({ runner: { executor: { command: 'claude', args: [] }, timeoutMs: 1000, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, modelPolicies: { openai: { nano: 'm', mini: 'm', standard: 'm', advanced: 'm', flagship: 'm', frontier: 'm' } }, executors: { openai: { kind: 'agent', providerModel: 'openai', invocations: [{ id: 'codex-cli', via: 'cli', command: 'codex', args: [], env: { CODEX_HOME: dir } }] } } } }));
    process.env.HOME = fixture.home;
    const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-cli-project-trusted');
    const result = entry.check(fixture.project);
    assert.equal(result.passed, false, result.message);
    assert.ok(result.message.includes(path.join(dir, 'config.toml')), result.message);
    assert.ok(!result.message.includes(path.join(realHome, '.codex')), result.message);
  } finally {
    process.env.HOME = realHome;
    cleanup(fixture);
  }
});
