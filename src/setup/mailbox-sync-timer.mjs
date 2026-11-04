// The timer that takes mail on a machine nobody is typing on. Mail from another machine reaches a
// session only after `fgos hook mailbox-sync` ran there (it fetches the Event Store refs, takes the
// mail into the record and nudges a waiting session), and the mailbox hook starts that child only
// when some session of the machine runs a tool. A machine that is idle gets no hook, so its mail
// waits without an upper bound. This registers one OS timer per project that runs the same child
// every `eventStore.sync.intervalSec`: a systemd user timer on Linux, a launchd agent on macOS.
// `fgos doctor` reports it and `--fix` writes the unit files and enables them. Every unit carries
// a marker line, and only a unit with that marker is ever removed: `--fix` removes the timer of a
// project that turned cross-machine mail off or set `eventStore.sync.intervalSec` to 0, and never
// touches a unit it did not write.
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

/** The line every unit file this module writes carries; a file without it is not ours to remove. */
export const MARKER = 'fgos-managed: mailbox-sync-timer';

const quote = (text) => `"${String(text).replace(/(["\\])/g, '\\$1')}"`;

/** The two systemd user units. The service runs the child once; the timer repeats it. */
export function renderSystemd({ stem, bin, projectRoot, remote, intervalSec }) {
  return {
    [`${stem}.service`]: [
      `# ${MARKER}`,
      '[Unit]',
      'Description=fgOS mailbox sync (takes mail from other machines)',
      '',
      '[Service]',
      'Type=oneshot',
      `ExecStart=${quote(bin)} hook mailbox-sync --dir ${quote(path.resolve(projectRoot))} --remote ${quote(remote)}`,
      '',
    ].join('\n'),
    [`${stem}.timer`]: [
      `# ${MARKER}`,
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
      `<!-- ${MARKER} -->`,
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
      disable: (stem, run) => {
        run('systemctl', ['--user', 'disable', '--now', `${stem}.timer`]);
        run('systemctl', ['--user', 'daemon-reload']);
      },
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
      disable: (stem, run) => run('launchctl', ['bootout', `gui/${uid}/dev.fgos.${stem}`]),
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

// The only two programs this module starts, each named where it is called. They run with a
// cleared environment plus the few variables a per-user service manager needs to find its bus.
function minimalEnv() {
  const keep = ['HOME', 'USER', 'LOGNAME', 'XDG_RUNTIME_DIR', 'DBUS_SESSION_BUS_ADDRESS'];
  return { PATH: '/usr/local/bin:/usr/bin:/bin', ...Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]])) };
}

const defaultRun = (command, args) => {
  const options = { stdio: 'pipe', timeout: 15000, env: minimalEnv() };
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

/** The unit files of this project's timer that carry our marker, by name. */
function ownedUnits(scheduler, stem) {
  const names = scheduler.render({ stem, bin: 'x', projectRoot: 'x', remote: 'x', intervalSec: 1 });
  return Object.keys(names).filter((name) => {
    try {
      return fs.readFileSync(path.join(scheduler.dir, name), 'utf8').includes(MARKER);
    } catch {
      return false;
    }
  });
}

function plan(cwd, { schedule, scheduler, bin }) {
  const found = schedule();
  if (!found) {
    const chosen = scheduler();
    const owned = chosen ? ownedUnits(chosen, unitStem(cwd)) : [];
    if (owned.length > 0) return { orphan: { chosen, stem: unitStem(cwd), owned } };
    return { skip: 'cross-machine mail is not enabled here (or eventStore.sync.intervalSec is 0), so no timer is needed' };
  }
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
  if (p.orphan) {
    return { passed: false, message: `${p.orphan.chosen.kind} timer ${p.orphan.stem} is still installed but cross-machine mail is off here (fgos doctor --fix removes it; only files with the ${MARKER} marker are touched)` };
  }
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
  if (p.orphan) return removeOwned(p.orphan, run);
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

/** Disables the timer and deletes the unit files that carry our marker; any other file stays. */
function removeOwned({ chosen, stem, owned }, run) {
  try {
    chosen.disable(stem, run);
  } catch {
    // not loaded: the files are still removed
  }
  for (const name of owned) fs.rmSync(path.join(chosen.dir, name), { force: true });
  return { fixed: true, message: `removed ${chosen.kind} timer ${stem}: cross-machine mail is off here` };
}
