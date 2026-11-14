import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ACCOUNT_PROBE, MAILBOX_SYNC, checkManagedTimer, fixManagedTimer, renderLaunchd, renderSystemd, schedulerFor, unitStem } from '../../src/setup/managed-timer.mjs';

const bin = () => ({ tier: 0, path: '/opt/fgos/bin/fgos' });

// Each schedule with a "set" reading, the same reading at another interval, and the unit name it writes.
const SCHEDULES = [
  { schedule: MAILBOX_SYNC, on: () => ({ intervalSec: 300, remote: 'origin' }), other: () => ({ intervalSec: 60, remote: 'origin' }), stemPrefix: 'fgos-mailbox-sync-' },
  { schedule: ACCOUNT_PROBE, on: () => ({ intervalSec: 300 }), other: () => ({ intervalSec: 60 }), stemPrefix: 'fgos-account-probe-' },
];

function world() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-timer-'));
  const calls = [];
  const run = (command, args) => {
    calls.push([command, ...args].join(' '));
  };
  const scheduler = () => ({ ...schedulerFor({ platform: 'linux', home }), dir: path.join(home, 'units') });
  return { home, calls, run, scheduler };
}

test('the mailbox systemd units run the one sync child for this project and remote, repeating at the configured interval, with no environment line', () => {
  const stem = unitStem('/p');
  const files = renderSystemd({ stem, bin: '/opt/fgos/bin/fgos', words: MAILBOX_SYNC.command({ remote: 'origin' }, '/p'), vars: MAILBOX_SYNC.serviceVars(), intervalSec: 300, schedule: MAILBOX_SYNC });
  assert.match(files[`${stem}.service`], /ExecStart="\/opt\/fgos\/bin\/fgos" hook mailbox-sync --dir "\/p" --remote "origin"/);
  assert.match(files[`${stem}.timer`], /OnUnitActiveSec=300/);
  assert.match(files[`${stem}.service`], /^# fgos-managed: mailbox-sync-timer$/m);
  assert.doesNotMatch(files[`${stem}.service`], /Environment=/);
  assert.notEqual(unitStem('/p'), unitStem('/q'));
});

test('the account probe units run the direct leg only for this project and carry the PATH the provider CLIs are found on', () => {
  const stem = unitStem('/p', ACCOUNT_PROBE);
  assert.match(stem, /^fgos-account-probe-[0-9a-f]{8}$/);
  const files = renderSystemd({ stem, bin: '/opt/fgos/bin/fgos', words: ACCOUNT_PROBE.command({ intervalSec: 21600 }, '/p'), vars: ACCOUNT_PROBE.serviceVars(), intervalSec: 21600, schedule: ACCOUNT_PROBE });
  assert.match(files[`${stem}.service`], /ExecStart="\/opt\/fgos\/bin\/fgos" dispatch probe-account --all --record --leg direct --dir "\/p"/);
  assert.match(files[`${stem}.service`], /^Environment="PATH=[^"]*\.local\/bin[^"]*"$/m);
  assert.match(files[`${stem}.service`], /^# fgos-managed: account-probe-timer$/m);
  assert.match(files[`${stem}.timer`], /OnUnitActiveSec=21600/);
});

test('the launchd agent carries the same arguments and interval, and the environment only when the schedule has one', () => {
  const mail = Object.values(renderLaunchd({ stem: 'fgos-mailbox-sync-x', bin: '/b/fgos', words: MAILBOX_SYNC.command({ remote: 'origin' }, '/p'), intervalSec: 120, schedule: MAILBOX_SYNC }))[0];
  for (const text of ['<string>hook</string>', '<string>mailbox-sync</string>', '<string>/p</string>', '<integer>120</integer>']) assert.ok(mail.includes(text), text);
  assert.ok(!mail.includes('EnvironmentVariables'));
  const probe = Object.values(renderLaunchd({ stem: 'fgos-account-probe-x', bin: '/b/fgos', words: ACCOUNT_PROBE.command({}, '/p'), vars: { PATH: '/a:/b' }, intervalSec: 120, schedule: ACCOUNT_PROBE }))[0];
  for (const text of ['<string>probe-account</string>', '<string>direct</string>', '<key>PATH</key><string>/a:/b</string>']) assert.ok(probe.includes(text), text);
});

test('the account probe schedule is off until dispatch.probeAccount.intervalSec is a positive integer', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-schedule-'));
  assert.equal(ACCOUNT_PROBE.scheduleOf(project), null);
});

for (const { schedule, on, other, stemPrefix } of SCHEDULES) {
  test(`${schedule.name}: a project that does not use it needs no timer, and a platform without a scheduler is said to have none`, () => {
    assert.equal(checkManagedTimer(schedule, '/p', { found: () => null }).passed, true);
    assert.equal(fixManagedTimer(schedule, '/p', { found: () => null }).fixed, false);
    const none = checkManagedTimer(schedule, '/p', { found: on, scheduler: () => null, bin });
    assert.equal(none.passed, true);
    assert.match(none.message, /no supported scheduler/);
  });

  test(`${schedule.name}: doctor fails while the units are missing, the fix writes and enables them, and the check then passes; a changed interval is stale`, () => {
    const w = world();
    const options = { found: on, scheduler: w.scheduler, bin, run: w.run };
    const before = checkManagedTimer(schedule, '/p', options);
    assert.equal(before.passed, false);
    assert.match(before.message, /missing/);
    assert.match(before.message, /fgos doctor --fix/);

    const fixed = fixManagedTimer(schedule, '/p', options);
    assert.equal(fixed.fixed, true, fixed.message);
    assert.ok(w.calls.some((call) => call.startsWith(`systemctl --user enable --now ${stemPrefix}`)), w.calls.join('\n'));
    assert.equal(checkManagedTimer(schedule, '/p', options).passed, true);

    const changed = checkManagedTimer(schedule, '/p', { ...options, found: other });
    assert.equal(changed.passed, false);
    assert.match(changed.message, /stale/);
  });

  test(`${schedule.name}: a timer that is written but refused by the OS is reported, not claimed fixed`, () => {
    const w = world();
    const run = (command, args) => {
      if (args.includes('enable')) throw new Error('Failed to connect to bus');
    };
    const result = fixManagedTimer(schedule, '/p', { found: on, scheduler: w.scheduler, bin, run });
    assert.equal(result.fixed, false);
    assert.match(result.message, /enabling failed: Failed to connect to bus/);
  });

  test(`${schedule.name}: the timer names the project installation shim when there is one, so an upgrade does not leave it pointing at a removed release`, () => {
    const w = world();
    const project = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-timer-project-'));
    const shim = path.join(project, '.fgos', 'installation', 'bin', 'fgos');
    fs.mkdirSync(path.dirname(shim), { recursive: true });
    fs.writeFileSync(shim, '#!/bin/sh\n', { mode: 0o755 });
    const result = fixManagedTimer(schedule, project, { found: on, scheduler: w.scheduler, bin, run: w.run });
    assert.equal(result.fixed, true, result.message);
    const service = fs.readdirSync(path.join(w.home, 'units')).find((name) => name.endsWith('.service'));
    assert.ok(fs.readFileSync(path.join(w.home, 'units', service), 'utf8').includes(shim));
  });

  test(`${schedule.name}: turning it off makes doctor name the leftover timer and --fix remove only the unit files carrying the marker`, () => {
    const w = world();
    const options = { found: on, scheduler: w.scheduler, bin, run: w.run };
    assert.equal(fixManagedTimer(schedule, '/p', options).fixed, true);
    const units = path.join(w.home, 'units');
    const foreign = path.join(units, 'someone-elses.timer');
    fs.writeFileSync(foreign, '[Timer]\n');

    const off = { ...options, found: () => null };
    const found = checkManagedTimer(schedule, '/p', off);
    assert.equal(found.passed, false);
    assert.match(found.message, /still installed/);

    const removed = fixManagedTimer(schedule, '/p', off);
    assert.equal(removed.fixed, true, removed.message);
    assert.ok(w.calls.some((call) => call.includes(`disable --now ${stemPrefix}`)), w.calls.join('\n'));
    assert.deepEqual(fs.readdirSync(units), ['someone-elses.timer']);
    assert.equal(checkManagedTimer(schedule, '/p', off).passed, true);
  });

  test(`${schedule.name}: a unit file without the marker is never removed, even under this project's unit name`, () => {
    const w = world();
    const units = path.join(w.home, 'units');
    fs.mkdirSync(units, { recursive: true });
    const stem = unitStem('/p', schedule);
    fs.writeFileSync(path.join(units, `${stem}.timer`), '[Timer]\nOnBootSec=1\n');
    const result = fixManagedTimer(schedule, '/p', { found: () => null, scheduler: w.scheduler, bin, run: w.run });
    assert.equal(result.fixed, false);
    assert.ok(fs.existsSync(path.join(units, `${stem}.timer`)));
  });
}

test('one schedule never removes the units of the other, even for the same project', () => {
  const w = world();
  const mail = { found: SCHEDULES[0].on, scheduler: w.scheduler, bin, run: w.run };
  assert.equal(fixManagedTimer(MAILBOX_SYNC, '/p', mail).fixed, true);
  const probeOff = { found: () => null, scheduler: w.scheduler, bin, run: w.run };
  assert.equal(fixManagedTimer(ACCOUNT_PROBE, '/p', probeOff).fixed, false);
  assert.equal(fs.readdirSync(path.join(w.home, 'units')).length, 2);
});
