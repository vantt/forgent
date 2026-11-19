// Doctor parity table for the nine confinement rows and their three fixes, and the executor, accounts, run supervisor,
// trust and terminal rows with the socket directory fix: every call the base release answers,
// on a fresh world per entry (a project of each shape, its own HOME, TMPDIR and state root). Only the rows and
// fixes named in `CONFINEMENT_ROWS` / `CONFINEMENT_FIXES` are compared (id, status, passed, fix, message, detail);
// the rows another owner judges are out of this table. `--fix` cases also compare what the run left on disk, and
// the table includes a fix over a fixture with a pending login copy, so a repair that removed what Node kept
// shows. A table of the other bridged rows is added by the phase that ports them.
//
// `cwd`: `repo` (a project with its store), `sub` (a subdirectory), `fresh` (a repository with no fgOS setup at
// all), `outside` (a directory that is no repository), `linked` (a linked worktree of `repo`), `legacy` (a project
// whose config is still the legacy JSON file), `other` (a second project `--dir` can name), `badcfg` (a project whose
// config file cannot be read). A step may name `env` (`$WORLD` is the world's root).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';

import { runCaseOnEntry } from '../harness.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { writeProjectConfig, writeRawGlobalConfig, writeRawLegacyGlobalConfig, writeRawLegacyProjectConfig, writeRawProjectConfig } from '../../helpers/config-fixture.mjs';

export const cases = [];

const call = (args, extra = {}) => ({ args: ['doctor', ...args], ...extra });
const add = (id, steps, extra = {}) => cases.push({ id: `doctor-${id}`, steps, ...extra });

// Reading the rows over the shapes of project they judge.
add('plain', [call([])]);
add('json', [call(['--json'])]);
add('from-a-subdirectory', [call([], { cwd: 'sub' })]);
add('from-a-linked-worktree', [{ do: 'linkedWorktree' }, call([], { cwd: 'linked' })]);
add('fresh-repository-with-no-setup', [call([], { cwd: 'fresh' })]);
add('outside-any-repository', [call([], { cwd: 'outside' })]);
add('legacy-config-project', [call([], { cwd: 'legacy' })]);
add('refused-config', [call([], { cwd: 'badcfg' })]);
add('dir-names-another-project', [{ do: 'otherProject' }, call(['--dir', '$OTHER'])]);

// Policies and readiness over what a capability declares, strict or not.
add('capability-naming-an-unknown-policy', [{ do: 'confinementConfig', runner: { capabilities: { 'code:write': { confinement: { policy: 'no-such-policy' } } } } }, call([])]);
add('capability-with-a-builtin-policy', [{ do: 'confinementConfig', runner: { capabilities: { 'code:write': { confinement: { policy: 'workspace-write' } } } } }, call([])]);
add('capability-with-no-anchor', [{ do: 'confinementConfig', runner: { capabilities: { 'code:write': { confinement: { mode: 'preferred' } } } } }, call([])]);
add('strict-config-with-a-missing-anchor', [{ do: 'confinementConfig', runner: { confinement: { strict: true }, capabilities: { 'code:write': {} } } }, call([])]);
add('custom-policy-that-is-malformed', [{ do: 'confinementConfig', runner: { capabilities: { 'code:write': { confinement: { policy: 'mine' } } }, confinementPolicies: { mine: { contract: 'confinement-policy.v1', controls: { hostWrite: 'sideways' } } } } }, call([])]);
add('herdr-executor-bypassing-without-full-confinement', [{ do: 'confinementConfig', runner: { executors: { 'herdr-agent': { kind: 'agent', invocations: [{ id: 'herdr-agent-cli', via: 'cli', adapter: 'herdr-spawn', command: 'claude', args: [], permissionMode: 'bypass', interactiveMode: { exitCommand: '/exit', kind: 'claude' } }], confinement: { ownWorktree: true } } } } }, call([])]);
add('herdr-executor-with-full-confinement', [{ do: 'confinementConfig', runner: { executors: { 'herdr-agent': { kind: 'agent', invocations: [{ id: 'herdr-agent-cli', via: 'cli', adapter: 'herdr-spawn', command: 'claude', args: [], permissionMode: 'bypass', interactiveMode: { exitCommand: '/exit', kind: 'claude' } }], confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } } } } }, call([])]);

// The machine backend registry and the bwrap rows over what the registry says.
add('backend-registry-missing-then-fixed', [call([]), call(['--fix']), call([]), call(['--fix'])], { disk: true });
add('backend-registry-that-is-not-json-then-fixed', [{ do: 'backendRegistry', text: '{' }, call([]), call(['--fix']), call([])], { disk: true });
add('backend-registry-with-a-disabled-bwrap', [{ do: 'backendRegistry', text: JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: false, executable: '/usr/bin/bwrap' } } }) }, call([])]);
add('backend-registry-with-a-bwrap-that-is-not-there', [{ do: 'backendRegistry', text: JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable: '$WORLD/no-such-bwrap' } } }) }, call([])]);
add('backend-registry-with-no-bwrap-instance', [{ do: 'backendRegistry', text: JSON.stringify({ contract: 'confinement-backend-registry.v1', confinementBackends: {} }) }, call([])]);

// Leftovers: a confinement temp root open to others, an empty per-dispatch directory, and a login copy a dispatch
// left unapplied (the fix over it keeps it: a pending copy is never deleted for its age).
add('confinement-root-open-to-others-then-fixed', [{ do: 'looseConfinementRoot' }, call([]), call(['--fix']), call([])], { disk: true });
add('pending-login-copy-without-an-inventory', [{ do: 'pendingLoginCopy' }, call([]), call(['--fix']), call([])], { disk: true });
add('fix-twice-is-idempotent', [call(['--fix']), call(['--fix']), call([])], { disk: true });

// Executor and accounts rows over what the runner declares: a family served twice, a tier fallback naming a family
// with no cell, a pool no account backs, an accounts section of the wrong shape, a legacy policy-shaped executor.
add('two-executors-serving-one-family', [{ do: 'confinementConfig', runner: { executors: { a: { kind: 'agent', providerModel: 'fam', invocations: [{ id: 'a-cli', via: 'cli', command: 'claude', args: [] }] }, b: { kind: 'agent', providerModel: 'fam', invocations: [{ id: 'b-cli', via: 'cli', command: 'claude', args: [] }] } } } }, call([])]);
add('tier-fallback-naming-a-family-with-no-cell', [{ do: 'confinementConfig', runner: { tierFallback: { standard: ['nobody'] } } }, call([])]);
add('model-policy-naming-a-pool-no-account-backs', [{ do: 'confinementConfig', runner: { modelPolicies: { standard: { claude: 'sonnet@ghost' } } } }, call([])]);
add('llm-accounts-pool-name-with-an-at-sign', [{ do: 'confinementConfig', runner: { llmAccounts: { 'bad@pool': { one: { credentialStore: { claude: '/tmp/one' } } } } } }, call([])]);
add('executor-hardcoding-a-policy-shaped-flag', [{ do: 'confinementConfig', runner: { executors: { legacy: { kind: 'agent', providerModel: 'fam', invocations: [{ id: 'legacy-cli', via: 'cli', command: 'claude', args: ['--dangerously-skip-permissions'] }] } } } }, call([])]);
add('confined-invocation-reading-a-store-with-no-account', [{ do: 'confinementConfig', runner: { executors: { pane: { kind: 'agent', providerModel: 'fam', invocations: [{ id: 'pane-cli', via: 'cli', adapter: 'herdr-spawn', command: 'claude', args: [], credentialStore: { use: 'claude', homeEnv: 'CLAUDE_CONFIG_DIR' } }] } } } }, call([])]);
add('herdr-executor-naming-an-unknown-kind', [{ do: 'confinementConfig', runner: { executors: { weird: { kind: 'agent', providerModel: 'fam', invocations: [{ id: 'weird-cli', via: 'cli', adapter: 'herdr-spawn', command: 'claude', args: [], interactiveMode: { exitCommand: '/exit', kind: 'notreal' } }] } } } }, call([])]);

// The run supervisor, runtime directory, trust and terminal rows over the machine they read.
add('runtime-socket-directory-fix-twice', [call([]), call(['--fix']), call(['--fix']), call([])], { disk: true });
add('run-supervisor-wait-shorter-than-grace', [{ do: 'confinementConfig', dispatch: { gateKillGraceMs: 5000, cancelWaitMs: 2000 } }, call([])]);
add('terminal-setting-with-a-bad-value', [{ do: 'confinementConfig', terminal: { allocationGraceMs: 'soon' } }, call([])]);
add('workspace-agents-of-the-wrong-shape-and-a-persona-replacing-a-core-one', [{ do: 'agentFile', name: 'wrong-name.yaml', text: 'name: other\ndescription: a persona\n' }, { do: 'agentFile', name: 'typo.yml', text: 'name: typo\ndescription: a persona\n' }, call([]), { do: 'removeAgentFiles' }, { do: 'agentFile', name: 'code-reviewer.yaml', text: 'name: code-reviewer\ndescription: my reviewer\n' }, call([])]);
add('operation-prompt-template-with-a-forbidden-variable', [{ do: 'promptTemplate', name: 'invalid-tmpl', text: 'Forbidden: {forbiddenVar}' }, call([])]);

const MACHINE_ID_SLUG = os.hostname().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Hook files in the forms earlier releases wrote (an unguarded dispatch entry; a cwd-relative one next to another
// project's decision-question entry): a fix recognises them as fgOS's and replaces them in place.
const EARLIER_CLAUDE_SETTINGS = '{\n  "hooks": {\n    "PreToolUse": [\n      {\n        "matcher": "Agent|Task",\n        "hooks": [\n          {\n            "type": "command",\n            "command": "\\"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos\\" hook dispatch-decide"\n          }\n        ]\n      }\n    ]\n  }\n}\n';
const EARLIER_CODEX_HOOKS = '{\n  "hooks": {\n    "PreToolUse": [\n      {\n        "matcher": ".*",\n        "hooks": [\n          {\n            "type": "command",\n            "command": ".fgos/installation/bin/fgos hook dispatch-decide"\n          }\n        ]\n      },\n      {\n        "matcher": "RequestUserInput|ask.*",\n        "hooks": [\n          {\n            "type": "command",\n            "command": "\\"/other/project/.fgos/installation/bin/fgos\\" hook decision-question"\n          }\n        ]\n      }\n    ]\n  }\n}\n';

const STUBS = {
  fgos: '#!/bin/sh\nexit 0\n',
  agy: '#!/bin/sh\nexit 0\n',
  claude: '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 1.0.0; exit 0; fi\nif [ "$1" = "plugin" ] && [ "$2" = "marketplace" ]; then echo \'[{"name":"fgos-plugins"}]\'; exit 0; fi\nif [ "$1" = "plugin" ] && [ "$2" = "list" ]; then echo \'[{"id":"fgOS@fgos-plugins","enabled":true}]\'; exit 0; fi\nexit 1\n',
  'claude-bare': '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 1.0.0; exit 0; fi\nif [ "$1" = "plugin" ]; then echo \'[]\'; exit 0; fi\nexit 1\n',
};

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g;
const GIT_DIR = '.git';

function makeWorld() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p03par-')));
  const dirs = Object.fromEntries(['repo', 'home', 'tmp', 'state', 'fresh', 'outside', 'legacy', 'mailbox', 'timers', 'badcfg', 'agents', 'older', 'srccheckout', 'pinned', 'badpin'].map((name) => [name, path.join(root, name)]));
  for (const dir of Object.values(dirs)) fs.mkdirSync(dir);
  fs.chmodSync(dirs.state, 0o700);
  fs.writeFileSync(path.join(dirs.state, 'machine-id'), 'parity-machine\n');
  initFixtureRepo(dirs.repo);
  fs.mkdirSync(path.join(dirs.repo, 'sub'));
  initFixtureRepo(dirs.mailbox);
  writeProjectConfig(dirs.mailbox, { mailbox: { enabled: true } });
  initFixtureRepo(dirs.timers);
  writeProjectConfig(dirs.timers, {
    mailbox: { enabled: true, crossMachine: { enabled: true } },
    eventStore: { remote: 'origin', sync: { intervalSec: 300 } },
    dispatch: { probeAccount: { intervalSec: 600 } },
  });
  // The project's installation shim is what a timer unit names, so with one the timer rows reach the unit files.
  const shim = path.join(dirs.timers, '.fgos', 'installation', 'bin', 'fgos');
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const shimOf = (dir) => {
    const file = path.join(dir, '.fgos', 'installation', 'bin', 'fgos');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  };
  const put = (dir, relative, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, relative)), { recursive: true });
    fs.writeFileSync(path.join(dir, relative), text);
  };
  initFixtureRepo(dirs.agents);
  for (const agentDir of ['.claude', '.codex', '.agents', '.omp', '.pi']) fs.mkdirSync(path.join(dirs.agents, agentDir));
  shimOf(dirs.agents);
  initFixtureRepo(dirs.older);
  shimOf(dirs.older);
  put(dirs.older, '.claude/settings.json', EARLIER_CLAUDE_SETTINGS);
  put(dirs.older, '.codex/hooks.json', EARLIER_CODEX_HOOKS);
  initFixtureRepo(dirs.srccheckout);
  put(dirs.srccheckout, 'apps/fgos/Cargo.toml', '[package]\nname = "fgos"\n');
  put(dirs.srccheckout, 'package.json', '{ "name": "fixture", "files": [] }\n');
  const pin = (digest) => JSON.stringify({ schemaVersion: 1, projectRuntime: { policy: 'exact-digest', artifactDigest: digest } });
  initFixtureRepo(dirs.pinned);
  put(dirs.pinned, '.fgos/distribution.json', pin(`sha256:${'a'.repeat(64)}`));
  put(dirs.pinned, '.fgos/installation/activation.json', JSON.stringify({ artifactDigest: `sha256:${'b'.repeat(64)}`, releasePath: '/nowhere', status: 'ready', pinOverrideReason: 'testing the next build' }));
  initFixtureRepo(dirs.badpin);
  put(dirs.badpin, '.fgos/distribution.json', '{ not json');
  initFixtureRepo(dirs.badcfg);
  writeRawProjectConfig(dirs.badcfg, 'mailbox: [unclosed\n');
  initFixtureRepo(dirs.legacy);
  writeRawLegacyProjectConfig(dirs.legacy, '{\n  "runner": { "generatedPaths": [] }\n}\n');
  const git = (...args) => execFileSync('git', ['-C', dirs.fresh, ...args], { stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.writeFileSync(path.join(dirs.fresh, 'seed.txt'), 'seed\n');
  git('add', 'seed.txt');
  git('commit', '-qm', 'seed');
  return { root, ...dirs };
}

function writeAt(dir, relative, text) {
  const file = path.join(dir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function writeTool(dir, name, body) {
  fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
}

/** A PATH directory holding the tools a doctor run needs but the named ones, so a row that asks for one finds it missing. */
function toolPath(world, without) {
  const dir = path.join(world.root, 'toolbin');
  fs.mkdirSync(dir, { recursive: true });
  for (const name of ['git', 'node', 'sh', 'env', 'bwrap', 'curl', 'ssh', 'ssh-keygen', 'sleep', 'uname', 'cat']) {
    if (without.includes(name)) continue;
    for (const base of (process.env.PATH ?? '').split(path.delimiter)) {
      const candidate = path.join(base, name);
      if (fs.existsSync(candidate)) { fs.symlinkSync(candidate, path.join(dir, name)); break; }
    }
  }
  return dir;
}

function act(world, step) {
  switch (step.do) {
    case 'linkedWorktree':
      world.linked = path.join(world.root, 'linked');
      execFileSync('git', ['-C', world.repo, 'worktree', 'add', '-q', '--detach', world.linked, 'HEAD'], { stdio: 'ignore' });
      return null;
    case 'otherProject':
      world.other = path.join(world.root, 'other');
      fs.mkdirSync(world.other);
      initFixtureRepo(world.other);
      return null;
    case 'confinementConfig':
      writeProjectConfig(world.repo, { ...(step.runner ? { runner: step.runner } : {}), ...(step.dispatch ? { dispatch: step.dispatch } : {}), ...(step.terminal ? { terminal: step.terminal } : {}) });
      return null;
    case 'agentFile':
      writeAt(path.join(world.repo, 'fgos', 'agents'), step.name, step.text);
      return null;
    case 'removeAgentFiles':
      fs.rmSync(path.join(world.repo, 'fgos', 'agents'), { recursive: true, force: true });
      return null;
    case 'promptTemplate':
      writeAt(path.join(world.repo, '.fgos', 'prompt-templates'), `${step.name}.md`, step.text);
      return null;
    case 'backendRegistry':
      writeAt(path.join(world.home, '.fgos'), 'confinement-backends.json', step.text.replaceAll('$WORLD', world.root));
      return null;
    case 'looseConfinementRoot': {
      const root = path.join(world.tmp, 'fgos-confinement');
      fs.mkdirSync(path.join(root, 'empty-dispatch'), { recursive: true });
      fs.chmodSync(root, 0o755);
      return null;
    }
    case 'pendingLoginCopy': {
      const copy = path.join(world.home, '.fgos', 'runtime', 'provider-capacity', 'account-locks', 'openai', 'acct', 'pending', '000001577836800-deadbeef');
      writeAt(copy, 'auth.json', '{}');
      return null;
    }
    case 'openLockDirs':
      for (const dir of [path.join(world.repo, '.fgos', 'locks'), path.join(world.state, 'locks')]) fs.chmodSync(dir, 0o775);
      return null;
    case 'remoteProject': {
      world.remote = path.join(world.root, 'remote');
      fs.mkdirSync(world.remote);
      initFixtureRepo(world.remote);
      const bare = path.join(world.root, 'remote.git');
      execFileSync('git', ['init', '--bare', '-q', bare], { stdio: 'ignore' });
      const git = (...args) => execFileSync('git', ['-C', world.remote, ...args], { stdio: 'ignore' });
      git('remote', 'add', 'origin', bare);
      // The pre-wildcard legacy mapping breaks a plain fetch when the remote has no such ref.
      if (step.obsolete) git('config', '--add', 'remote.origin.fetch', '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy');
      return null;
    }
    case 'mergeAndLock': {
      const head = execFileSync('git', ['-C', world.repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      fs.writeFileSync(path.join(world.repo, GIT_DIR, 'MERGE_HEAD'), `${head}\n`);
      fs.writeFileSync(path.join(world.repo, GIT_DIR, 'index.lock'), '');
      return null;
    }
    case 'cloneThisRepository':
      world.clone = path.join(world.root, 'clone');
      execFileSync('git', ['clone', '-q', '--shared', fileURLToPath(new URL('../../../', import.meta.url)), world.clone], { stdio: 'ignore' });
      return null;
    case 'gitConfig':
      return execFileSync('git', ['-C', world[step.cwd], 'config', '--get-all', 'remote.origin.fetch'], { encoding: 'utf8' }).trim();
    case 'stubs':
      fs.mkdirSync(path.join(world.root, 'bin'), { recursive: true });
      for (const name of step.names) fs.writeFileSync(path.join(world.root, 'bin', name), STUBS[name], { mode: 0o755 });
      return null;
    case 'agySettings':
      fs.mkdirSync(path.join(world.home, '.gemini', 'antigravity-cli'), { recursive: true });
      fs.writeFileSync(path.join(world.home, '.gemini', 'antigravity-cli', 'settings.json'), JSON.stringify({ toolPermission: 'always-proceed', permissions: { deny: ['command(regex:^sudo )'] } }));
      return null;
    case 'claudeSettings':
      fs.mkdirSync(path.join(world.home, '.claude'), { recursive: true });
      fs.writeFileSync(path.join(world.home, '.claude', 'settings.json'), step.text);
      return null;
    case 'storeAppeared':
      return `store ${fs.existsSync(path.join(world[step.cwd], '.fgos')) ? 'exists' : 'absent'}`;
    case 'observeAppeared':
      return `observe ${fs.existsSync(path.join(world[step.cwd], '.fgos', 'observe')) ? 'exists' : 'absent'}`;
    case 'brokenProjectConfig':
      writeRawProjectConfig(world.repo, '# @fgos:v1\nrunner: [\n');
      return null;
    case 'unknownKeyProjectConfig':
      writeRawProjectConfig(world.repo, '# @fgos:v1\nunknownKey: 1\n');
      return null;
    case 'strayGlobalFile':
      writeAt(world.home, '.fgos/stray.yaml', '# @fgos:v1\ngateway:\n  token: SENTINEL-9931\n');
      return null;
    case 'looseGlobalConfig':
      writeRawGlobalConfig(world.home, '# @fgos:v1\n');
      fs.chmodSync(path.join(world.home, '.fgos/config.yaml'), 0o666);
      return null;
    case 'driftedDocs':
      writeRawProjectConfig(world.repo, '# @fgos:v1\n\n# @fgos:doc stale text\nrunner:\n  maxParallel: 3\n');
      return null;
    case 'redundantValue':
      writeRawProjectConfig(world.repo, '# @fgos:v1\n\nrunner:\n  maxParallel: 1\n');
      return null;
    case 'legacyGlobalToken':
      writeRawLegacyGlobalConfig(world.home, JSON.stringify({ gateway: { port: 4001, token: 'SENTINEL-9931' } }));
      return null;
    case 'noMachineId':
      fs.rmSync(path.join(world.state, 'machine-id'));
      return null;
    case 'badMachineId':
      fs.writeFileSync(path.join(world.state, 'machine-id'), 'BAD\n');
      return null;
    case 'machineKey':
      fs.mkdirSync(path.join(world.state, 'identity'), { recursive: true, mode: 0o700 });
      execFileSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', 'fgos-machine', '-f', path.join(world.state, 'identity/machine-key')], { stdio: 'ignore' });
      return null;
    case 'pathWithout':
      world.pathWithout = toolPath(world, step.tools ?? []);
      return null;
    case 'fakeOpenssh':
      world.pathWithout = toolPath(world, ['ssh', 'ssh-keygen']);
      writeTool(world.pathWithout, 'ssh', `echo '${step.banner}' >&2`);
      writeTool(world.pathWithout, 'ssh-keygen', 'exit 1');
      return null;
    case 'brokenProjectId':
      writeAt(world.repo, '.fgos/project.json', '{ not json');
      return null;
    case 'pendingActivation':
      writeAt(world.repo, '.fgos/installation/activation.json', JSON.stringify({ status: 'pending' }));
      return null;
    case 'observeDir':
      fs.mkdirSync(path.join(world.repo, '.fgos/observe'), { recursive: true });
      return null;
    case 'symlinkedFriction':
      fs.mkdirSync(path.join(world.repo, '.fgos/observe'), { recursive: true });
      fs.mkdirSync(path.join(world.repo, 'elsewhere'));
      fs.symlinkSync(path.join(world.repo, 'elsewhere'), path.join(world.repo, '.fgos/observe/friction'));
      return null;
    default:
      throw new Error(`unknown action ${step.do}`);
  }
}

const cwdOf = (world, name = 'repo') => ({
  repo: world.repo,
  sub: path.join(world.repo, 'sub'),
  fresh: world.fresh,
  outside: world.outside,
  linked: world.linked,
  legacy: world.legacy,
  other: world.other,
  mailbox: world.mailbox,
  timers: world.timers,
  badcfg: world.badcfg,
  remote: world.remote,
  clone: world.clone,
  agents: world.agents,
  older: world.older,
  srccheckout: world.srccheckout,
  pinned: world.pinned,
  badpin: world.badpin,
})[name] ?? assert.fail(`unknown cwd ${name}`);

/** The release, host binary and manifest an entry runs from, as text to replace. */
function runtimePaths(entry) {
  const env = { ...process.env, ...(entry.env ?? {}) };
  return ['FGOS_ACTIVE_MANIFEST_PATH', 'FGOS_HOST_BIN', 'FGOS_ACTIVE_RELEASE_PATH'].map((name) => env[name]).filter(Boolean);
}

function normaliser(world, entry) {
  const paths = runtimePaths(entry).sort((a, b) => b.length - a.length);
  return (text) => {
    let out = text.replaceAll(world.root, '<WORLD>');
    for (const known of paths) out = out.replaceAll(known, '<RUNTIME>');
    return out
      .replace(/<RUNTIME>(?:\/\.fgos\/runtime\/git-addon\/[0-9a-f]+)?/g, '<RUNTIME>')
      .replace(/\.fgos\/runtime\/git-addon\/[0-9a-f]+/g, '<ADDON>')
      .replace(/\.fgos\/runtime\/dev-host\/[A-Za-z0-9_-]+/g, '<DEVHOST>')
      .replace(/(\bfgos \d+\.\d+\.\d+ \()[0-9a-f]{12}(\))/g, '$1<COMMIT>$2')
      // Where the state root was named from: the host pins it for the Node child, a Node run on its own reads the home.
      .replace(/(stateRoot \S+ \()(?:home|pinned|env)\)/g, '$1<SOURCE>)')
      // A timer unit is named after a hash of the project's path, and every world has its own path.
      .replace(/(fgos-(?:mailbox-sync|account-probe))-[0-9a-f]{8}/g, '$1-<STEM>')
      // The config file's own documentation comment: the base names the retired `setup` verb in the mailbox.enabled sentence.
      .replace('Whether fgos setup and doctor --fix install the mailbox hook rows into this project\'s Claude Code and Codex hook files; false removes the rows they installed.', 'Whether fgos doctor --fix installs the mailbox hook rows into this project\'s Claude Code and Codex hook files; false removes the rows it installed.')
      // A clone of this tree carries the mailbox.enabled sentence of this tree; the base release's schema words it as before.
      .replace('; project:config.yaml:256:3 config-doc-drift mailbox.enabled (drift)', '')
      // The base release words the two provenance problems of the mirror mappings in their older sentences.
      .replace('event-store-refspec-missing: the mirror fetch mappings are not recorded for this remote: the recorded mappings are missing or differ from the wanted set', 'event-store-refspec-missing: no Git mapping provenance; run fgos doctor --fix')
      .replace('event-store-remote-changed: the fetch mapping provenance records another remote URL than the remote has now', 'event-store-remote-changed; run fgos doctor --fix')
      // The hooks row's remedy names the command that wires the hooks path, not the retired `setup`.
      .replace(/run npm run setup:hooks/g, 'run fgos setup')
      // The floor row no longer names the Node version (Node is the bridged rows' runtime, reported by them).
      .replace(/"message": "node v\d+\.\d+\.\d+, git available"/g, '"message": "git available"')
      .replace(/\(node v\d+\.\d+\.\d+, git available\)/g, '(git available)')
      // Text the language runtime writes, not fgOS: a JSON parser's complaint (V8 against serde_json) and a binary that
      // cannot be started (Node's spawnSync ENOENT against the host's PATH lookup). The row around it is compared.
      .replace(/(is not valid JSON: |cannot parse machine backend registry at \\?"[^"\\]*\\?": )(?:Unexpected end of JSON input|[^"()]*? in JSON at position \d+(?: \(line \d+ column \d+\))?|[^"()]*? at line \d+ column \d+)/g, '$1<JSON-PARSE-ERROR>')
      .replace(/spawnSync (\S+) ENOENT/g, '$1: <NOT-STARTED>')
      .replace(/(\S+): not found on PATH/g, '$1: <NOT-STARTED>')
      .replace(UUID, '<UUID>')
      // The machine id a fix mints is random after the host's name.
      .replace(new RegExp(`${MACHINE_ID_SLUG}-[a-z2-7]{6}\\b`, 'g'), '<MACHINE-ID>')
      .replace(ISO, '<TS>')
      .replace(/"(?:data_hash|generated_at)": "[^"]*",?\s*/g, '')
      .replace(/\b[0-9a-f]{64}\b/g, '<H64>')
      .replace(/\b[0-9a-f]{40}\b/g, '<SHA>')
      // The machine signing key a fix mints is random: its fingerprint is not part of what two runs share.
      .replace(/SHA256:[A-Za-z0-9+/]{43}/g, 'SHA256:<FINGERPRINT>')
      .replace(/"pid": \d+/g, '"pid": <PID>')
      // The fault record of a refused call: the host redacts a flag's `=value` in the message as the record writer does for argv.
      .replace(/(--[a-z-]+)=(?:<\d+>|1\b|\/tmp\b)/g, '$1=<V>');
  };
}

/** What a run left on disk, relative to the world: each file's path and normalised text, the Git internals left out. */
function disk(world, norm) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const rel = norm(path.relative(world.root, full));
      // `state/git-*`: what the Node CLI's own start-up git probe caches in the state root; a refused call never gets that far in the host.
      if (entry.name === GIT_DIR || rel.includes('.fgos/runtime') || rel.includes('/fgos-sessions') || /^state\/git-(?:empty-hooks|floor-verdict)/.test(rel)) continue;
      if (entry.isDirectory()) {
        out[`${rel}/`] = null;
        walk(full);
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(full);
        // Key material is random per run; only its presence is part of the state.
        out[rel] = /\/identity\/machine-key(?:\.pub)?$/.test(rel) ? '<key material>' : bytes.length > 200_000 ? `<${bytes.length} bytes>` : norm(bytes.toString('utf8'));
      } else if (entry.isSymbolicLink()) {
        out[rel] = `-> ${norm(fs.readlinkSync(full))}`;
      }
    }
  };
  walk(world.root);
  return out;
}

/** Rows the base release answers and this release no longer has: the row is deleted with the `setup` verb that kept its
 * source line, so both sides are compared without it. */
const RETIRED_ROWS = new Set(['shell-integration-sourced']);
const CONFINEMENT_FIXES = new Set(['confinement-backend-registry-readable', 'confinement-orphaned-resources-reaped', 'credential-copies-retained', 'runtime-socket-dir']);
const CONFINEMENT_ROWS = new Set(['confinement-policies-declared', 'confinement-backend-registry-readable', 'confinement-orphaned-resources-reaped', 'credential-copies-retained', 'confinement-bwrap-platform', 'confinement-probe-freshness', 'confinement-blind-read', 'confinement-strict-readiness', 'confinement-herdr-maturity',
  'executor-family-unique', 'executor-skills-installed', 'tier-fallback', 'model-policy-pools', 'llm-accounts-shape', 'llm-accounts-default-login-home', 'agent-type-names-unique', 'provider-capacity-state', 'executor-profile-warnings', 'session-keep-declared', 'confined-pane-accounts', 'operation-prompt-templates-valid', 'herdr-executor-kinds', 'run-supervisor-route', 'runtime-socket-dir', 'run-attempts-stuck', 'run-supervisor-config', 'terminal-control', 'terminal-allocations', 'trust-store-readable', 'non-claude-trust-stores-readable', 'agent-cli-project-trusted', 'seat-binding-route']);
const RETIRED_PRETTY_LINE = /^[✓✗] shell-integration source line present in detected rc file\(s\)/;

/** The pretty text without the line of a retired row. */
const withoutRetiredLines = (text) => text.split('\n').filter((line) => !RETIRED_PRETTY_LINE.test(line)).join('\n');

/** The base release's Node config loader prints a provider-family warning per executor that declares none, once per load, while
 * the host's bridged child keeps its own stderr; a clone of this repository carries such executors. The warnings belong to the
 * executor policy loader, not to a doctor row, so both sides are compared without them. */
const withoutExecutorPolicyWarnings = (text) => text.split('\n').filter((line) => !/^fgos: executor "[^"]+" declares no "providerModel"/.test(line)).join('\n');

/** The rows of one doctor answer as comparable values, or the raw text when the answer is not the JSON envelope. */
function describe(text, ignoreRows = [], accepted = null, side = 'host') {
  let data;
  try { data = JSON.parse(text).data; } catch { return { text: withoutRetiredLines(text) }; }
  if (!data?.checks) return { text: withoutRetiredLines(text) };
  return {
    // The report's own `ok` and `next` follow every row, whoever judges it; this table compares the rows it names
    // and the fixes of those rows.
    fixed: (data.fixed ?? []).filter((fix) => CONFINEMENT_FIXES.has(fix.id ?? fix)),
    // The compatibility row's `detail.versions` listed the Node addon's own component versions; the host has no addon, so
    // it lists the Git component's (accepted change); the floor in `detail` is compared.
    rows: data.checks.filter(({ id }) => CONFINEMENT_ROWS.has(id) && !RETIRED_ROWS.has(id)).map(({ id, status, passed, fix, message, detail: rawDetail, description }) => {
      if (ignoreRows.includes(id)) return { id, description };
      const detail = id === 'git-component-compatible' && rawDetail ? { ...rawDetail, versions: undefined }
        // How much finished-operation history the journal holds, and since when, depends on when the run was.
        : id === 'git-operation-journal' && rawDetail?.journal ? { ...rawDetail, journal: { ...rawDetail.journal, retainedBytes: '<n>', oldestRetainedAtMs: '<ms>' } } : rawDetail;
      if (accepted?.rows.includes(id)) {
        assert.match(message, accepted[side], `${id}: the ${side} text of the accepted difference`);
        if (accepted.fix) assert.equal(fix, accepted.fix[side], `${id}: the ${side} fix of the accepted difference`);
        return { id, status, passed, fix: accepted.fix ? '<ACCEPTED FIX>' : fix, message: '<ACCEPTED TEXT>', detail, description };
      }
      return { id, status, passed, fix, message, detail, description };
    }),
  };
}

async function runScript(entry, testCase) {
  const world = makeWorld();
  const norm = normaliser(world, entry);
  const outputs = [];
  const children = [];
  try {
    for (const step of testCase.steps) {
      if (step.do) {
        const out = act(world, step);
        if (out !== null) outputs.push({ action: step.do, text: out });
        continue;
      }
      const args = step.args.map((arg) => (arg === '$OTHER' ? world.other : arg));
      const result = await runCaseOnEntry(entry, {
        id: testCase.id,
        args,
        cwd: cwdOf(world, step.cwd),
        env: { HOME: world.home, USERPROFILE: world.home, TMPDIR: world.tmp, FGOS_STATE_ROOT: world.state, XDG_RUNTIME_DIR: path.join(world.root, 'no-runtime-dir'), DBUS_SESSION_BUS_ADDRESS: `unix:path=${path.join(world.root, 'no-bus')}`, FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-parity-claude', NO_COLOR: '1', ...(step.env === 'PATH_WITHOUT' ? { PATH: world.pathWithout } : Object.fromEntries(Object.entries(step.env ?? {}).map(([key, value]) => [key, value.replaceAll('$WORLD', world.root)]))) },
        timeoutMs: 180000,
        modes: ['exact-bytes'],
      });
      assert.equal(result.launchError, null, `${testCase.id}: ${JSON.stringify(result.launchError)}`);
      children.push(...result.spawnedChildren);
      outputs.push({
        args: step.args,
        exit: result.exitCode,
        stdout: describe(norm(result.stdoutText), testCase.ignoreRows, testCase.acceptedText, entry.type === 'node' ? 'base' : 'host'),
        stderr: withoutExecutorPolicyWarnings(norm(result.stderrText)),
      });
    }
    // A run leaves no store above its own tree: a stray `.fgos` there would make a later fixture treat that directory as its project.
    for (let dir = path.dirname(world.root); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, '.fgos')), `${testCase.id}: a run left ${path.join(dir, '.fgos')} above its fixture`);
      if (dir === path.dirname(dir)) break;
    }
    return { outputs, disk: testCase.disk ? disk(world, norm) : null, outsideStore: fs.existsSync(path.join(world.outside, '.fgos')), children };
  } finally {
    fs.rmSync(world.root, { recursive: true, force: true });
  }
}

/** Runs one case on the base release (entry A) and the host (entry B), each on a fresh world, and compares them. */
export async function runPreparedCase(entryA, entryB, testCase) {
  const differences = [];
  try {
    const [base, host] = [await runScript(entryA, testCase), await runScript(entryB, testCase)];
    const same = (left, right, what) => {
      try { assert.deepEqual(left, right); } catch (error) { differences.push(`${what} differ: ${error.message.split('\n').slice(0, 60).join('\n')}`); }
    };
    // Name the rows that differ first: a deep-equal of two whole reports hides them behind skipped lines.
    host.outputs.forEach((output, at) => {
      const rowsOf = (call) => Object.fromEntries((call?.stdout?.rows ?? []).map((row) => [row.id, row]));
      const [mine, theirs] = [rowsOf(output), rowsOf(base.outputs[at])];
      for (const id of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
        if (JSON.stringify(mine[id]) !== JSON.stringify(theirs[id])) differences.push(`row ${id} (call ${at}) host ${JSON.stringify(mine[id])} base ${JSON.stringify(theirs[id])}`);
      }
    });
    same(host.outputs, base.outputs, 'the calls');
    same(host.outsideStore, base.outsideStore, 'whether a .fgos appeared outside any repository');
    if (testCase.disk) same(host.disk, base.disk, 'what the run left on disk');
    // The host starts Node only for the bridged rows: one child for the rows of a call, one more when its fixes ran,
    // and none for a call the host refused.
    const nodeStarts = host.children.filter((child) => path.basename(child.cmd) === 'node').length;
    const ran = host.outputs.filter((output) => output.args && ![4].includes(output.exit));
    // Each fix the host runs itself can split the bridged fixes around it into one more call.
    const hostFixes = JSON.parse(fs.readFileSync(new URL('../../../packages/distribution/contracts/doctor-registry.v1.json', import.meta.url), 'utf8')).inRust.fixes.length;
    const most = ran.reduce((sum, output) => sum + (output.args.includes('--fix') ? 2 + hostFixes : 1), 0);
    if (nodeStarts > most) differences.push(`the host started ${nodeStarts} node children for ${ran.length} answered call(s)`);
    if (ran.length === 0 && nodeStarts > 0) differences.push('a refused call started node');
    if (ran.length > 0 && nodeStarts === 0) differences.push('the bridged rows were judged without the bridge');
  } catch (error) {
    differences.push(String(error.message ?? error));
  }
  return { caseId: testCase.id, passed: differences.length === 0, differences };
}
