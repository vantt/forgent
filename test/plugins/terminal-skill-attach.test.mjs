import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFakeHerdr } from '../helpers/fake-herdr-pane.mjs';
import { startTerminalHarness } from '../helpers/terminal-host-harness.mjs';

// /fgOS:terminal and /fgOS:terminal-close go through the terminal-control port:
// rename.sh attaches the caller's own pane and labels it, close.sh closes the
// caller's own pane and no other. The port is the real host route against a
// fake herdr binary whose panes belong to this test process.

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skills = path.join(repo, 'plugins/fgOS/skills');
const hostBin = process.env.FGOS_HOST_BIN;

let harness;
let scratch;
let fake;
let binDir;
let allocationsDir;
let renameArgs;

// The fake reports shell_pid 100 for every pane; the ownership guard needs the pane's
// shell to be an ancestor of the script, so the wrapper reports this process instead,
// except for the pane named in FAKE_FOREIGN_PANE.
function installShims() {
  binDir = path.join(scratch, 'bin');
  fs.mkdirSync(binDir);
  fs.symlinkSync(hostBin, path.join(binDir, 'fgos'));
  fs.writeFileSync(
    path.join(binDir, 'herdr'),
    `#!/bin/sh
case "$1 $2" in
  "pane process-info")
    pid=${process.pid}
    [ "$4" = "$FAKE_FOREIGN_PANE" ] && pid=1
    "${fake.herdrBin}" "$@" | sed "s/\\"shell_pid\\":100/\\"shell_pid\\":$pid/" ;;
  *) exec "${fake.herdrBin}" "$@" ;;
esac
`,
    { mode: 0o755 },
  );
}

before(async () => {
  assert.ok(hostBin, 'FGOS_HOST_BIN must name a host built from this checkout');
  harness = await startTerminalHarness();
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-terminal-skill-'));
  fake = createFakeHerdr(path.join(scratch, 'herdr'));
  installShims();
  // A project root whose capability query reports a pane-labeling provider, so the script never
  // reads this checkout's own .fgos/ (a worker worktree has none) or bootstraps a config into it.
  const projectRoot = path.join(scratch, 'project');
  fs.mkdirSync(path.join(projectRoot, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'bin', 'fgos.mjs'), 'console.log(JSON.stringify({ capability: "pane-labeling" }, null, 1));\n');
  renameArgs = ['tsk-x', projectRoot];
  allocationsDir = () => {
    const root = path.join(harness.stateRoot, 'terminal', 'herdr');
    const [incarnation] = fs.existsSync(root) ? fs.readdirSync(root) : [];
    return incarnation ? path.join(root, incarnation, 'allocations') : null;
  };
});

after(() => {
  fake?.cleanup();
  harness?.stop();
  fs.rmSync(scratch, { recursive: true, force: true });
});

function openPane(label) {
  const out = spawnSync(fake.herdrBin, ['tab', 'create', '--label', label], { encoding: 'utf8' });
  return JSON.parse(out.stdout).result.root_pane.pane_id;
}

function run(script, args, env = {}) {
  return spawnSync('bash', [path.join(skills, script), ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${binDir}:${process.env.PATH}`,
      HOME: process.env.HOME,
      FGOS_STATE_ROOT: harness.stateRoot,
      HERDR_SOCKET_PATH: harness.socketPath,
      FGOS_HERDR_BIN: path.join(binDir, 'herdr'),
      FGOS_SESSION_ID: 'sess-skill',
      HERDR_ENV: '1',
      ...env,
    },
  });
}

const records = () => {
  const dir = allocationsDir();
  return dir && fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /^[^.]+[^]*\.json$/.test(f) && !/\.(launch-requested|launched|released)\.json$/.test(f))
    : [];
};

test('rename.sh attaches the caller pane and labels it through the port', () => {
  const pane = openPane('own');
  const r = run('terminal/rename.sh', renameArgs, { HERDR_PANE_ID: pane });
  assert.equal(r.status, 0, r.stderr);
  const dir = allocationsDir();
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'sess-skill.json'), 'utf8'));
  assert.equal(record.origin, 'attached');
  assert.equal(record.paneId, pane);
  const rename = fake.calls().find((c) => c[0] === 'pane' && c[1] === 'rename' && c[2] === pane);
  assert.ok(rename, 'a pane rename reached herdr');
  assert.match(rename[3], /^tsk-x/);
  assert.equal(fake.closedPaneIds().length, 0);
});

test('rename.sh without FGOS_SESSION_ID keys and labels the pane with the writer id the activated host resolves', () => {
  const pane = openPane('host-id');
  const r = run('terminal/rename.sh', renameArgs, { HERDR_PANE_ID: pane, FGOS_SESSION_ID: '', CODEX_THREAD_ID: 'codex-thread-skill' });
  assert.equal(r.status, 0, r.stderr);
  const record = JSON.parse(fs.readFileSync(path.join(allocationsDir(), 'codex-thread-skill.json'), 'utf8'));
  assert.equal(record.paneId, pane);
  const rename = fake.calls().find((c) => c[0] === 'pane' && c[1] === 'rename' && c[2] === pane);
  assert.ok(rename, 'a pane rename reached herdr');
  assert.match(rename[3], /fg\.ssid:codex-thread-skill/);
});

test('rename.sh without herdr does nothing and exits 0', () => {
  const before = records().length;
  const calls = fake.calls().length;
  const r = run('terminal/rename.sh', renameArgs, { HERDR_PANE_ID: 'mock-pane-1', PATH: '/usr/bin:/bin' });
  assert.equal(r.status, 0);
  assert.equal(records().length, before);
  assert.equal(fake.calls().length, calls);
});

test('rename.sh refuses a pane that is not the caller own', () => {
  const foreign = openPane('foreign');
  const calls = fake.calls().filter((c) => c[1] === 'rename').length;
  const r = run('terminal/rename.sh', renameArgs, { HERDR_PANE_ID: foreign, FAKE_FOREIGN_PANE: foreign });
  assert.equal(r.status, 0);
  assert.equal(fake.calls().filter((c) => c[1] === 'rename').length, calls);
});

test('close.sh closes the caller own pane and no other pane', () => {
  const mine = openPane('mine');
  const bystander = openPane('bystander');
  const r = run('terminal-close/close.sh', [], { HERDR_PANE_ID: mine, FGOS_SESSION_ID: 'sess-close' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(fake.closedPaneIds(), [mine]);
  assert.ok(fake.panes()[bystander] && !fake.panes()[bystander].closed);
});

test('close.sh never closes a pane that is not the caller own', () => {
  const foreign = openPane('foreign-2');
  const r = run('terminal-close/close.sh', [], { HERDR_PANE_ID: foreign, FAKE_FOREIGN_PANE: foreign, FGOS_SESSION_ID: 'sess-close-2' });
  assert.equal(r.status, 0);
  assert.ok(!fake.closedPaneIds().includes(foreign));
});

test('close.sh without herdr does nothing and exits 0', () => {
  const closed = fake.closedPaneIds().length;
  const r = run('terminal-close/close.sh', [], { HERDR_PANE_ID: 'mock-pane-1', PATH: '/usr/bin:/bin' });
  assert.equal(r.status, 0);
  assert.equal(fake.closedPaneIds().length, closed);
});

test('the plugin skills no longer call herdr pane rename or close', () => {
  const out = spawnSync('rg', ['herdr pane (rename|close)', skills], { encoding: 'utf8' });
  assert.equal(out.status, 1, out.stdout);
});
