// The one door for the OS timers fgOS writes per project: a systemd user timer on Linux, a launchd agent
// on macOS. A schedule is a descriptor (what it runs, how often, how doctor words it); render, scheduler,
// owned-unit check and fix are shared by every schedule. Two exist:
//   mailbox-sync   takes mail on a machine nobody is typing on. Mail from another machine reaches a session
//                  only after `fgos hook mailbox-sync` ran there, and the mailbox hook starts that child only
//                  when some session runs a tool; this runs it every `eventStore.sync.intervalSec`.
//   account-probe  sweeps every provider account between runs with `fgos dispatch probe-account --all
//                  --record --leg direct` every `dispatch.probeAccount.intervalSec`.
// `fgos doctor` reports each and `--fix` writes the unit files and enables them. Every unit carries its
// schedule's marker line, and only a unit with that marker is ever removed: `--fix` removes the timer of a
// project that turned its schedule off, and never touches a unit it did not write.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { isConfigRefusal, readConfig } from '../config/facade.mjs';
import { resolveWorkspaceInstallationBin } from './bin-discovery.mjs';

function configValue(projectRoot, sections) {
  try {
    return readConfig({ projectRoot, sections }).value;
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    return null;
  }
}

/**
 * A command word is a plain string (written as is) or `{ value }` (a path or name, quoted where the
 * unit syntax needs it).
 * @typedef {string | { name: string, value: string }} Word
 * @typedef {{
 *   name: string, label: string, marker: string, stemPrefix: string, serviceDescription: string, timerDescription: string,
 *   scheduleOf: (projectRoot: string) => ({ intervalSec: number } & Record<string, unknown>) | null,
 *   command: (found: any, projectRoot: string) => Word[],
 *   serviceVars: () => Record<string, string>,
 *   words: { off: string, orphan: (kind: string, stem: string) => string, active: (kind: string, stem: string, found: any) => string,
 *            broken: (kind: string, state: string, stem: string, dir: string) => string, removed: (kind: string, stem: string) => string, noScheduler: string },
 * }} Schedule
 */

/** @type {Schedule} */
export const MAILBOX_SYNC = {
  name: 'mailbox-sync',
  label: 'mailbox sync',
  marker: 'fgos-managed: mailbox-sync-timer',
  stemPrefix: 'fgos-mailbox-sync',
  serviceDescription: 'fgOS mailbox sync (takes mail from other machines)',
  timerDescription: 'fgOS mailbox sync timer',
  /** The project's cross-machine settings; `null` when the project does not use cross-machine mail. */
  scheduleOf(projectRoot) {
    const value = configValue(projectRoot, ['mailbox', 'eventStore']);
    if (!value || value.mailbox?.crossMachine?.enabled !== true) return null;
    const intervalSec = value.eventStore?.sync?.intervalSec;
    const remote = value.eventStore?.remote;
    if (!Number.isInteger(intervalSec) || intervalSec <= 0 || typeof remote !== 'string' || remote === '') return null;
    return { intervalSec, remote };
  },
  command: (found, projectRoot) => ['hook', 'mailbox-sync', '--dir', { name: 'projectRoot', value: path.resolve(projectRoot) }, '--remote', { name: 'remote', value: found.remote }],
  serviceVars: () => ({}),
  words: {
    off: 'cross-machine mail is not enabled here (or eventStore.sync.intervalSec is 0), so no timer is needed',
    noScheduler: 'mail is taken when a session runs a tool',
    orphan: (kind, stem) => `${kind} timer ${stem} is still installed but cross-machine mail is off here`,
    active: (kind, stem, found) => `${kind} timer ${stem} takes mail every ${found.intervalSec} s, even when no session is running a tool`,
    broken: (kind, state, stem) => `no working ${kind} timer (${state}) for ${stem}: mail from another machine waits until a session there runs a tool`,
    removed: (kind, stem) => `removed ${kind} timer ${stem}: cross-machine mail is off here`,
  },
};

/** The folders a user-level CLI install lands in; a timer's service starts with a bare system PATH. */
function probePath() {
  const dirs = [path.join(os.homedir(), '.local', 'bin'), '/usr/local/bin', '/usr/bin', '/bin'];
  if (process.platform === 'darwin') dirs.splice(1, 0, '/opt/homebrew/bin');
  return dirs.join(':');
}

/** @type {Schedule} */
export const ACCOUNT_PROBE = {
  name: 'account-probe',
  label: 'account probe',
  marker: 'fgos-managed: account-probe-timer',
  stemPrefix: 'fgos-account-probe',
  serviceDescription: 'fgOS account probe (calls each provider account directly and records what it found)',
  timerDescription: 'fgOS account probe timer',
  /** `null` while `dispatch.probeAccount.intervalSec` is 0 (the default) or unset. */
  scheduleOf(projectRoot) {
    const intervalSec = configValue(projectRoot, ['dispatch'])?.dispatch?.probeAccount?.intervalSec;
    return Number.isInteger(intervalSec) && intervalSec > 0 ? { intervalSec } : null;
  },
  // The direct leg only: a timer has no herdr session, so the harness leg would open no pane it could use.
  command: (_found, projectRoot) => ['dispatch', 'probe-account', '--all', '--record', '--leg', 'direct', '--dir', { name: 'projectRoot', value: path.resolve(projectRoot) }],
  // The probe call reads PATH to find the provider CLIs (provider-credential-probe.mjs PROBE_ENV_ALLOW); nothing secret.
  serviceVars: () => ({ PATH: probePath() }),
  words: {
    off: 'the account probe is not scheduled here (dispatch.probeAccount.intervalSec is 0), so no timer is needed',
    noScheduler: 'run fgos dispatch probe-account --all --record by hand',
    orphan: (kind, stem) => `${kind} timer ${stem} is still installed but dispatch.probeAccount.intervalSec is 0 here`,
    active: (kind, stem, found) => `${kind} timer ${stem} probes every account every ${found.intervalSec} s`,
    broken: (kind, state, stem) => `no working ${kind} timer (${state}) for ${stem}: no account is probed between runs`,
    removed: (kind, stem) => `removed ${kind} timer ${stem}: the account probe is off here`,
  },
};

/** One short stable name per project root, so two projects never share a unit. */
export function unitStem(projectRoot, schedule = MAILBOX_SYNC) {
  return `${schedule.stemPrefix}-${crypto.createHash('sha256').update(path.resolve(projectRoot)).digest('hex').slice(0, 8)}`;
}

/** A unit file is read by a scheduler that expands `%` (systemd specifiers) and ends a line at a control
 * character, so a value holding either would change what the unit runs. The values are refused, never escaped. */
export function refuseUnsafeUnitValues(values) {
  for (const [name, value] of Object.entries(values)) {
    if (/[%\u0000-\u001f\u007f]/.test(String(value))) {
      throw new Error(`the timer refuses ${name}: it holds "%" or a control character`);
    }
  }
}

/** Every value a unit would carry that a person or a path decides: the binary, the named command words
 * and the service variables. */
function unitValues({ bin, words, vars }) {
  const named = Object.fromEntries(words.filter((w) => typeof w !== 'string').map((w) => [w.name, w.value]));
  return { bin, ...named, ...vars };
}

const quote = (text) => `"${String(text).replace(/(["\\])/g, '\\$1')}"`;
const systemdWords = (words) => words.map((w) => (typeof w === 'string' ? w : quote(w.value))).join(' ');
const plainWords = (words) => words.map((w) => (typeof w === 'string' ? w : w.value));

/** The two systemd user units. The service runs the child once; the timer repeats it. */
export function renderSystemd({ stem, bin, words, vars = {}, intervalSec, schedule }) {
  refuseUnsafeUnitValues(unitValues({ bin, words, vars }));
  return {
    [`${stem}.service`]: [
      `# ${schedule.marker}`,
      '[Unit]',
      `Description=${schedule.serviceDescription}`,
      '',
      '[Service]',
      'Type=oneshot',
      ...Object.entries(vars).map(([name, value]) => `Environment=${quote(`${name}=${value}`)}`),
      `ExecStart=${quote(bin)} ${systemdWords(words)}`,
      '',
    ].join('\n'),
    [`${stem}.timer`]: [
      `# ${schedule.marker}`,
      '[Unit]',
      `Description=${schedule.timerDescription}`,
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
export function renderLaunchd({ stem, bin, words, vars = {}, intervalSec, schedule }) {
  refuseUnsafeUnitValues(unitValues({ bin, words, vars }));
  const args = [bin, ...plainWords(words)];
  const environment = Object.entries(vars);
  return {
    [`dev.fgos.${stem}.plist`]: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<!-- ${schedule.marker} -->`,
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      `  <key>Label</key><string>dev.fgos.${stem}</string>`,
      '  <key>ProgramArguments</key>',
      '  <array>',
      ...args.map((arg) => `    <string>${xml(arg)}</string>`),
      '  </array>',
      ...(environment.length === 0
        ? []
        : ['  <key>EnvironmentVariables</key>', '  <dict>', ...environment.map(([name, value]) => `    <key>${xml(name)}</key><string>${xml(value)}</string>`), '  </dict>']),
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
  throw new Error(`a managed timer does not start ${command}`);
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
function ownedUnits(scheduler, stem, schedule) {
  const names = scheduler.render({ stem, bin: 'x', words: [], intervalSec: 1, schedule });
  return Object.keys(names).filter((name) => {
    try {
      return fs.readFileSync(path.join(scheduler.dir, name), 'utf8').includes(schedule.marker);
    } catch {
      return false;
    }
  });
}

/** The host binary of the release this project has activated; never a checkout script, a project-local
 * install or whatever `fgos` the PATH holds. */
function activatedHostBin(cwd) {
  const found = resolveWorkspaceInstallationBin(cwd);
  return found ? { path: found } : null;
}

function plan(cwd, { schedule, scheduler, bin, found: lookup }) {
  const found = lookup();
  if (!found) {
    const chosen = scheduler();
    const owned = chosen ? ownedUnits(chosen, unitStem(cwd, schedule), schedule) : [];
    if (owned.length > 0) return { orphan: { chosen, stem: unitStem(cwd, schedule), owned } };
    return { skip: schedule.words.off };
  }
  const chosen = scheduler();
  if (!chosen) return { skip: `no supported scheduler on ${process.platform}; ${schedule.words.noScheduler}` };
  // The project's installation shim outlives an upgrade; a release path would not.
  const shim = path.join(cwd, '.fgos', 'installation', 'bin', 'fgos');
  const resolved = isExecutable(shim) ? { path: shim } : bin(cwd);
  if (!resolved) return { skip: 'no activated fgos host resolves here, so the timer cannot name one' };
  const stem = unitStem(cwd, schedule);
  try {
    const files = chosen.render({ stem, bin: resolved.path, words: schedule.command(found, cwd), vars: schedule.serviceVars(), intervalSec: found.intervalSec, schedule });
    return { chosen, stem, files, found };
  } catch (err) {
    return { refused: err.message };
  }
}

function resolveOptions(cwd, schedule, overrides) {
  return {
    schedule,
    found: () => schedule.scheduleOf(cwd),
    scheduler: () => schedulerFor(),
    bin: activatedHostBin,
    run: defaultRun,
    ...overrides,
  };
}

/** Doctor's reading of one schedule's timer for this project. `overrides.found` replaces the config read. */
export function checkManagedTimer(schedule, cwd, overrides = {}) {
  const { run, ...planOptions } = resolveOptions(cwd, schedule, overrides);
  const p = plan(cwd, planOptions);
  if (p.orphan) {
    return { passed: false, message: `${schedule.words.orphan(p.orphan.chosen.kind, p.orphan.stem)} (fgos doctor --fix removes it; only files with the ${schedule.marker} marker are touched)` };
  }
  if (p.skip) return { passed: true, message: p.skip };
  if (p.refused) return { passed: true, message: `warning: no ${schedule.label} timer: ${p.refused}` };
  const state = stateOf({ scheduler: p.chosen, files: p.files, stem: p.stem, run });
  if (state === 'ok') return { passed: true, message: schedule.words.active(p.chosen.kind, p.stem, p.found) };
  return { passed: false, message: `${schedule.words.broken(p.chosen.kind, state, p.stem)} (fgos doctor --fix writes it under ${p.chosen.dir})` };
}

/** Writes the unit files and enables them; leaves any other unit as it was. */
export function fixManagedTimer(schedule, cwd, overrides = {}) {
  const { run, ...planOptions } = resolveOptions(cwd, schedule, overrides);
  const p = plan(cwd, planOptions);
  if (p.orphan) return removeOwned(p.orphan, schedule, run);
  if (p.skip) return { fixed: false, message: `skipped: ${p.skip}` };
  if (p.refused) return { fixed: false, message: `skipped: ${p.refused}` };
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
function removeOwned({ chosen, stem, owned }, schedule, run) {
  try {
    chosen.disable(stem, run);
  } catch {
    // not loaded: the files are still removed
  }
  for (const name of owned) fs.rmSync(path.join(chosen.dir, name), { force: true });
  return { fixed: true, message: schedule.words.removed(chosen.kind, stem) };
}
