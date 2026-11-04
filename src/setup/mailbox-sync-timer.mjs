// The timer that takes mail on a machine nobody is typing on. Mail from another machine reaches a
// session only after `fgos hook mailbox-sync` ran there (it fetches the Event Store refs, takes the
// mail into the record and nudges a waiting session), and the mailbox hook starts that child only
// when some session of the machine runs a tool. A machine that is idle gets no hook, so its mail
// waits without an upper bound. This registers one OS timer per project that runs the same child
// every `eventStore.sync.intervalSec`: a systemd user timer on Linux, a launchd agent on macOS.
// `fgos doctor` reports it and `--fix` writes the unit files and enables them; `--fix` on a
// project that does not use cross-machine mail removes nothing, and a project that turns it off
// leaves its timer for the person to remove (the unit names are printed).
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { isConfigRefusal, readConfig } from '../config/facade.mjs';
import { resolveFgosBin } from './bin-discovery.mjs';

/** The project's cross-machine settings; `null` when the project does not use cross-machine mail. */
export function crossMachineSchedule(projectRoot) {
  let value;
  try {
    value = readConfig({ projectRoot, sections: ['mailbox', 'eventStore'] }).value;
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    return null;
  }
  if (value.mailbox?.crossMachine?.enabled !== true) return null;
  const intervalSec = value.eventStore?.sync?.intervalSec;
  const remote = value.eventStore?.remote;
  if (!Number.isInteger(intervalSec) || intervalSec <= 0 || typeof remote !== 'string' || remote === '') return null;
  return { intervalSec, remote };
}

/** One short stable name per project root, so two projects never share a unit. */
export function unitStem(projectRoot) {
  return `fgos-mailbox-sync-${crypto.createHash('sha256').update(path.resolve(projectRoot)).digest('hex').slice(0, 8)}`;
}

const quote = (text) => `"${String(text).replace(/(["\\])/g, '\\$1')}"`;

/** The two systemd user units. The service runs the child once; the timer repeats it. */
export function renderSystemd({ stem, bin, projectRoot, remote, intervalSec }) {
  return {
    [`${stem}.service`]: [
      '[Unit]',
      'Description=fgOS mailbox sync (takes mail from other machines)',
      '',
      '[Service]',
      'Type=oneshot',
      `ExecStart=${quote(bin)} hook mailbox-sync --dir ${quote(path.resolve(projectRoot))} --remote ${quote(remote)}`,
      '',
    ].join('\n'),
    [`${stem}.timer`]: [
      '[Unit]',
      'Description=fgOS mailbox sync timer',
      '',
      '[Timer]',
      'OnBootSec=60',
      `OnUnitActiveSec=${intervalSec}`,
      '',
      '[Install]',
      'WantedBy=timers.target',
      '',
    ].join('\n'),
  };
}

const xml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The launchd agent: the same child on a fixed interval. */
export function renderLaunchd({ stem, bin, projectRoot, remote, intervalSec }) {
  const args = [bin, 'hook', 'mailbox-sync', '--dir', path.resolve(projectRoot), '--remote', remote];
  return {
    [`dev.fgos.${stem}.plist`]: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      `  <key>Label</key><string>dev.fgos.${stem}</string>`,
      '  <key>ProgramArguments</key>',
      '  <array>',
      ...args.map((arg) => `    <string>${xml(arg)}</string>`),
      '  </array>',
      `  <key>StartInterval</key><integer>${intervalSec}</integer>`,
      '  <key>RunAtLoad</key><true/>',
      '</dict>',
      '</plist>',
      '',
    ].join('\n'),
  };
}

/** Where the files go and how the OS is told, or `null` on a platform without a supported scheduler. */
export function schedulerFor({ platform = process.platform, home = os.homedir(), uid = process.getuid?.() } = {}) {
  if (platform === 'linux') {
    return {
      kind: 'systemd',
      dir: path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'systemd', 'user'),
      render: renderSystemd,
      enabled: (stem, run) => run('systemctl', ['--user', 'is-enabled', `${stem}.timer`]),
      enable: (stem, run) => {
        run('systemctl', ['--user', 'daemon-reload']);
        run('systemctl', ['--user', 'enable', '--now', `${stem}.timer`]);
      },
    };
  }
  if (platform === 'darwin') {
    return {
      kind: 'launchd',
      dir: path.join(home, 'Library', 'LaunchAgents'),
      render: renderLaunchd,
      enabled: (stem, run) => run('launchctl', ['print', `gui/${uid}/dev.fgos.${stem}`]),
      enable: (stem, run, dir) => {
        const file = path.join(dir, `dev.fgos.${stem}.plist`);
        try {
          run('launchctl', ['bootout', `gui/${uid}/dev.fgos.${stem}`]);
        } catch {
          // not loaded yet
        }
        run('launchctl', ['bootstrap', `gui/${uid}`, file]);
      },
    };
  }
  return null;
}

// The only two programs this module starts, each named where it is called.
const defaultRun = (command, args) => {
  const options = { stdio: 'pipe', timeout: 15000 };
  if (command === 'systemctl') return execFileSync('systemctl', args, options);
  if (command === 'launchctl') return execFileSync('launchctl', args, options);
  throw new Error(`mailbox sync timer does not start ${command}`);
};

function stateOf({ scheduler, files, stem, run }) {
  for (const [name, text] of Object.entries(files)) {
    let have;
    try {
      have = fs.readFileSync(path.join(scheduler.dir, name), 'utf8');
    } catch {
      return 'missing';
    }
    if (have !== text) return 'stale';
  }
  try {
    scheduler.enabled(stem, run);
  } catch {
    return 'disabled';
  }
  return 'ok';
}

function isExecutable(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function plan(cwd, { schedule, scheduler, bin }) {
  const found = schedule();
  if (!found) return { skip: 'cross-machine mail is not enabled here, so no timer is needed' };
  const chosen = scheduler();
  if (!chosen) return { skip: `no supported scheduler on ${process.platform}; mail is taken when a session runs a tool` };
  // The project's installation shim outlives an upgrade; a release path would not.
  const shim = path.join(cwd, '.fgos', 'installation', 'bin', 'fgos');
  const resolved = isExecutable(shim) ? { path: shim } : bin(cwd);
  if (!resolved) return { skip: 'no fgos binary resolves here, so the timer cannot name one' };
  const stem = unitStem(cwd);
  return { chosen, stem, files: chosen.render({ stem, bin: resolved.path, projectRoot: cwd, ...found }), found };
}

export function checkMailboxSyncTimer(
  cwd,
  { schedule = () => crossMachineSchedule(cwd), scheduler = () => schedulerFor(), bin = (dir) => resolveFgosBin(dir), run = defaultRun } = {},
) {
  const p = plan(cwd, { schedule, scheduler, bin });
  if (p.skip) return { passed: true, message: p.skip };
  const state = stateOf({ scheduler: p.chosen, files: p.files, stem: p.stem, run });
  if (state === 'ok') {
    return { passed: true, message: `${p.chosen.kind} timer ${p.stem} takes mail every ${p.found.intervalSec} s, even when no session is running a tool` };
  }
  return {
    passed: false,
    message: `no working ${p.chosen.kind} timer (${state}) for ${p.stem}: mail from another machine waits until a session there runs a tool (fgos doctor --fix writes it under ${p.chosen.dir})`,
  };
}

/** Writes the unit files and enables them; leaves any other unit as it was. */
export function fixMailboxSyncTimer(
  cwd,
  { schedule = () => crossMachineSchedule(cwd), scheduler = () => schedulerFor(), bin = (dir) => resolveFgosBin(dir), run = defaultRun } = {},
) {
  const p = plan(cwd, { schedule, scheduler, bin });
  if (p.skip) return { fixed: false, message: `skipped: ${p.skip}` };
  fs.mkdirSync(p.chosen.dir, { recursive: true });
  for (const [name, text] of Object.entries(p.files)) {
    const file = path.join(p.chosen.dir, name);
    const temp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temp, text, { mode: 0o644 });
    fs.renameSync(temp, file);
  }
  try {
    p.chosen.enable(p.stem, run, p.chosen.dir);
  } catch (err) {
    return { fixed: false, message: `wrote ${Object.keys(p.files).join(', ')} under ${p.chosen.dir}, but enabling failed: ${err.message.split('\n')[0]}` };
  }
  return { fixed: true, message: `enabled ${p.chosen.kind} timer ${p.stem} (every ${p.found.intervalSec} s); remove the files under ${p.chosen.dir} to undo` };
}
