// /fgOS:terminal and /fgOS:terminal-close act on HERDR_PANE_ID. That
// variable is inherited env: a shared agent daemon (codex app-server) hands
// its children the pane id of the pane that started the daemon, which may be
// closed or may belong to another session. Both scripts must act only on a
// pane that herdr still knows AND whose shell is an ancestor of the caller.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const renameSh = join(repo, 'plugins/fgOS/skills/terminal/rename.sh');
const closeSh = join(repo, 'plugins/fgOS/skills/terminal-close/close.sh');

// Fake herdr: process-info answers from FAKE_SHELL_PID (or pane_not_found
// when it is "dead"); rename/close are appended to FAKE_HERDR_LOG.
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'fgos-terminal-pane-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'herdr'), `#!/usr/bin/env bash
if [ "$1 $2" = "pane process-info" ]; then
  if [ "$FAKE_SHELL_PID" = dead ]; then
    echo '{"error":{"code":"pane_not_found"}}'; exit 1
  fi
  echo "{\\"result\\":{\\"process_info\\":{\\"pane_id\\":\\"$4\\",\\"shell_pid\\":$FAKE_SHELL_PID}}}"
  exit 0
fi
echo "$*" >> "$FAKE_HERDR_LOG"
`);
  chmodSync(join(bin, 'herdr'), 0o755);
  // Project root whose capability query reports a pane-labeling provider.
  const root = join(dir, 'root');
  mkdirSync(join(root, 'bin'), { recursive: true });
  writeFileSync(join(root, 'bin', 'fgos.mjs'), 'console.log(JSON.stringify({ capability: "pane-labeling" }, null, 1));\n');
  const log = join(dir, 'herdr.log');
  const run = (script, args, shellPid) => spawnSync('bash', [script, ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      HERDR_ENV: '1',
      HERDR_PANE_ID: 'wS:p4YF',
      FGOS_SESSION_ID: 'fg-1',
      FAKE_SHELL_PID: String(shellPid),
      FAKE_HERDR_LOG: log,
    },
  });
  const calls = () => (existsSync(log) ? readFileSync(log, 'utf8') : '');
  return { root, run, calls };
}

// A live pid that is not an ancestor of the spawned script.
function strangerPid(t) {
  const child = spawnSync('bash', ['-c', 'sleep 30 & echo $!'], { encoding: 'utf8' });
  const pid = Number(child.stdout.trim());
  t.after(() => { try { process.kill(pid); } catch {} });
  return pid;
}

test('rename refuses a dead pane and prints why', (t) => {
  const { root, run, calls } = setup(t);
  const r = run(renameSh, ['tsk-1', root], 'dead');
  assert.equal(r.status, 0);
  assert.equal(calls(), '');
  assert.match(r.stderr, /not a live herdr pane/);
});

test('rename refuses a live pane that is not the caller\'s own', (t) => {
  const { root, run, calls } = setup(t);
  const r = run(renameSh, ['tsk-1', root], strangerPid(t));
  assert.equal(r.status, 0);
  assert.equal(calls(), '');
  assert.match(r.stderr, /not this session's pane/);
});

test('rename labels the pane whose shell is an ancestor of the caller', (t) => {
  const { root, run, calls } = setup(t);
  const r = run(renameSh, ['tsk-1', root], process.pid);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(calls(), 'pane rename wS:p4YF tsk-1 | fg.ssid:fg-1\n');
});

test('close refuses a dead pane and a stranger pane, closes its own', (t) => {
  const { run, calls } = setup(t);
  assert.match(run(closeSh, [], 'dead').stderr, /not a live herdr pane/);
  assert.match(run(closeSh, [], strangerPid(t)).stderr, /not this session's pane/);
  assert.equal(calls(), '');
  const r = run(closeSh, [], process.pid);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(calls(), 'pane close wS:p4YF\n');
});
