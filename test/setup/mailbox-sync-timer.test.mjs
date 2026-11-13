import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { checkMailboxSyncTimer, fixMailboxSyncTimer, renderLaunchd, renderSystemd, schedulerFor, unitStem } from '../../src/setup/mailbox-sync-timer.mjs';

const on = () => ({ intervalSec: 300, remote: 'origin' });
const bin = () => ({ tier: 0, path: '/opt/fgos/bin/fgos' });

function world() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-timer-'));
  const calls = [];
  const run = (command, args) => {
    calls.push([command, ...args].join(' '));
  };
  const scheduler = () => ({ ...schedulerFor({ platform: 'linux', home }), dir: path.join(home, 'units') });
  return { home, calls, run, scheduler };
}

test('the systemd units run the one sync child for this project and remote, repeating at the configured interval', () => {
  const stem = unitStem('/p');
  const files = renderSystemd({ stem, bin: '/opt/fgos/bin/fgos', projectRoot: '/p', remote: 'origin', intervalSec: 300 });
  assert.match(files[`${stem}.service`], /ExecStart="\/opt\/fgos\/bin\/fgos" hook mailbox-sync --dir "\/p" --remote "origin"/);
  assert.match(files[`${stem}.timer`], /OnUnitActiveSec=300/);
  assert.notEqual(unitStem('/p'), unitStem('/q'));
});

test('the launchd agent carries the same arguments and interval', () => {
  const plist = Object.values(renderLaunchd({ stem: 'fgos-mailbox-sync-x', bin: '/b/fgos', projectRoot: '/p', remote: 'origin', intervalSec: 120 }))[0];
  for (const text of ['<string>hook</string>', '<string>mailbox-sync</string>', '<string>/p</string>', '<integer>120</integer>']) assert.ok(plist.includes(text), text);
});

test('a project without cross-machine mail needs no timer, and a platform without a scheduler is said to have none', () => {
  assert.equal(checkMailboxSyncTimer('/p', { schedule: () => null }).passed, true);
  assert.equal(fixMailboxSyncTimer('/p', { schedule: () => null }).fixed, false);
  const none = checkMailboxSyncTimer('/p', { schedule: on, scheduler: () => null, bin });
  assert.equal(none.passed, true);
  assert.match(none.message, /no supported scheduler/);
});

test('doctor fails while the units are missing, the fix writes and enables them, and the check then passes; a changed interval is stale', () => {
  const w = world();
  const options = { schedule: on, scheduler: w.scheduler, bin, run: w.run };
  const before = checkMailboxSyncTimer('/p', options);
  assert.equal(before.passed, false);
  assert.match(before.message, /missing/);
  assert.match(before.message, /fgos doctor --fix/);

  const fixed = fixMailboxSyncTimer('/p', options);
  assert.equal(fixed.fixed, true, fixed.message);
  assert.ok(w.calls.some((call) => call.startsWith('systemctl --user enable --now fgos-mailbox-sync-')), w.calls.join('\n'));
  assert.equal(checkMailboxSyncTimer('/p', options).passed, true);

  const changed = checkMailboxSyncTimer('/p', { ...options, schedule: () => ({ intervalSec: 60, remote: 'origin' }) });
  assert.equal(changed.passed, false);
  assert.match(changed.message, /stale/);
});

test('a timer that is written but refused by the OS is reported, not claimed fixed', () => {
  const w = world();
  const run = (command, args) => {
    if (args.includes('enable')) throw new Error('Failed to connect to bus');
  };
  const result = fixMailboxSyncTimer('/p', { schedule: on, scheduler: w.scheduler, bin, run });
  assert.equal(result.fixed, false);
  assert.match(result.message, /enabling failed: Failed to connect to bus/);
});

test('the timer names the project installation shim when there is one, so an upgrade does not leave it pointing at a removed release', () => {
  const w = world();
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-timer-project-'));
  const shim = path.join(project, '.fgos', 'installation', 'bin', 'fgos');
  fs.mkdirSync(path.dirname(shim), { recursive: true });
  fs.writeFileSync(shim, '#!/bin/sh\n', { mode: 0o755 });
  const result = fixMailboxSyncTimer(project, { schedule: on, scheduler: w.scheduler, bin, run: w.run });
  assert.equal(result.fixed, true, result.message);
  const service = fs.readdirSync(path.join(w.home, 'units')).find((name) => name.endsWith('.service'));
  assert.ok(fs.readFileSync(path.join(w.home, 'units', service), 'utf8').includes(shim));
});

test('turning cross-machine mail off makes doctor name the leftover timer and --fix remove only the unit files carrying the marker', () => {
  const w = world();
  const options = { schedule: on, scheduler: w.scheduler, bin, run: w.run };
  assert.equal(fixMailboxSyncTimer('/p', options).fixed, true);
  const units = path.join(w.home, 'units');
  const foreign = path.join(units, 'someone-elses.timer');
  fs.writeFileSync(foreign, '[Timer]\n');

  const off = { ...options, schedule: () => null };
  const found = checkMailboxSyncTimer('/p', off);
  assert.equal(found.passed, false);
  assert.match(found.message, /still installed/);

  const removed = fixMailboxSyncTimer('/p', off);
  assert.equal(removed.fixed, true, removed.message);
  assert.ok(w.calls.some((call) => call.includes('disable --now fgos-mailbox-sync-')), w.calls.join('\n'));
  assert.deepEqual(fs.readdirSync(units), ['someone-elses.timer']);
  assert.equal(checkMailboxSyncTimer('/p', off).passed, true);
});

test('a unit file without the marker is never removed, even under this project\'s unit name', () => {
  const w = world();
  const units = path.join(w.home, 'units');
  fs.mkdirSync(units, { recursive: true });
  const stem = unitStem('/p');
  fs.writeFileSync(path.join(units, `${stem}.timer`), '[Timer]\nOnBootSec=1\n');
  const result = fixMailboxSyncTimer('/p', { schedule: () => null, scheduler: w.scheduler, bin, run: w.run });
  assert.equal(result.fixed, false);
  assert.ok(fs.existsSync(path.join(units, `${stem}.timer`)));
});

test('a unit is never written with "%", a newline or another control character in the project root, the binary or the remote', () => {
  const stem = 'fgos-mailbox-sync-x';
  const ok = { stem, bin: '/b/fgos', projectRoot: '/p', remote: 'origin', intervalSec: 60 };
  for (const render of [renderSystemd, renderLaunchd]) {
    assert.doesNotThrow(() => render(ok));
    for (const field of ['bin', 'projectRoot', 'remote']) {
      for (const bad of ['/x%h', '/x\nExecStartPost=/bin/sh', '/x\u0007', '/x\u007f']) {
        assert.throws(() => render({ ...ok, [field]: bad }), new RegExp(`refuses ${field}`), `${render.name} ${field} ${JSON.stringify(bad)}`);
      }
    }
  }
});

test('an unsafe project path leaves the timer unwritten and doctor says why, as a warning', () => {
  const w = world();
  const dir = path.join(w.home, 'proj%x');
  const check = checkMailboxSyncTimer(dir, { schedule: on, scheduler: w.scheduler, bin, run: w.run });
  assert.equal(check.passed, true);
  assert.match(check.message, /^warning: no mailbox sync timer: .*projectRoot/);
  const fix = fixMailboxSyncTimer(dir, { schedule: on, scheduler: w.scheduler, bin, run: w.run });
  assert.equal(fix.fixed, false);
  assert.equal(fs.existsSync(path.join(w.home, 'units')), false, 'nothing was written');
});

test('without the project shim the timer names only the activated release host, never a checkout script, a project-local install or PATH', () => {
  const w = world();
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-timer-proj-'));
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(project, 'bin', 'fgos.mjs'), '');
  fs.mkdirSync(path.join(project, 'node_modules', '.bin'), { recursive: true });
  fs.writeFileSync(path.join(project, 'node_modules', '.bin', 'fgos'), '#!/bin/sh\n', { mode: 0o755 });
  const none = checkMailboxSyncTimer(project, { schedule: on, scheduler: w.scheduler, run: w.run });
  assert.equal(none.passed, true);
  assert.match(none.message, /no activated fgos host resolves here/);
  const release = path.join(project, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(release, 'bin', 'fgos'), '#!/bin/sh\n', { mode: 0o755 });
  fs.mkdirSync(path.join(project, '.fgos', 'installation'), { recursive: true });
  fs.writeFileSync(path.join(project, '.fgos', 'installation', 'activation.json'), JSON.stringify({ status: 'ready', releasePath: release }));
  assert.equal(fixMailboxSyncTimer(project, { schedule: on, scheduler: w.scheduler, run: w.run }).fixed, true);
  const text = fs.readdirSync(path.join(w.home, 'units')).map((name) => fs.readFileSync(path.join(w.home, 'units', name), 'utf8')).join('\n');
  assert.ok(text.includes(path.join(release, 'bin', 'fgos')));
  assert.ok(!text.includes('fgos.mjs') && !text.includes('node_modules'));
  fs.rmSync(project, { recursive: true, force: true });
});
