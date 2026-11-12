// The one door a test uses to put a config file on disk. Tests never write
// `.fgos/config.yaml` by hand: when the on-disk format or file name changes,
// this module is the single place that follows.
//
// Project and global config share one layout (`<root>/.fgos/<file>`), so one
// path function and one writer serve both scopes. A fixture is the versioned
// header, a blank line and the value as JSON text (JSON is YAML), which the
// product's strict config reader accepts like a hand-written file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readMachineConfig } from '../../src/config/facade.mjs';
import { parseYaml } from '../../src/util/yaml.mjs';

const CONFIG_FILE = 'config.yaml';
const CONFIG_HEADER = '# @fgos:v1';

const configFilePath = (root) => path.join(root, '.fgos', CONFIG_FILE);

/** Path of the project config under `dir` (a repo or fixture root). */
export function projectConfigPath(dir) {
  return configFilePath(dir);
}

/** Path of the global config under `home` (a fake HOME). */
export function globalConfigPath(home) {
  return configFilePath(home);
}

function writeConfigFile(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${CONFIG_HEADER}\n\n${JSON.stringify(value, null, 2)}\n`);
}

/** The machine keys each project fixture was written with, by project directory, so a read-change-write test sees them again. */
const machineKeysOf = new Map();
const MACHINE_CAPABILITY_KEYS = ['aliases'];

/**
 * Splits a fixture's `value` into what a project file may hold and what only the machine's global file may (the
 * runner keys that decide what program runs and how little it is confined: the default executor, every executor
 * entry, a capability's `aliases`). `machine` is null when the value holds none.
 */
function splitMachineKeys(value) {
  const runner = value?.runner;
  if (!runner || typeof runner !== 'object') return { project: value, machine: null };
  const project = plainConfig(value);
  const machine = { runner: {} };
  for (const key of ['executor', 'executors']) {
    if (runner[key] === undefined) continue;
    machine.runner[key] = plainConfig(runner[key]);
    delete project.runner[key];
  }
  for (const [name, entry] of Object.entries(runner.capabilities ?? {})) {
    for (const key of MACHINE_CAPABILITY_KEYS) {
      if (entry?.[key] === undefined) continue;
      ((machine.runner.capabilities ??= {})[name] ??= {})[key] = plainConfig(entry[key]);
      delete project.runner.capabilities[name][key];
    }
  }
  return { project, machine: Object.keys(machine.runner).length > 0 ? machine : null };
}

const helperHomes = new Set();
const operatorHome = process.env.HOME;
/** The HOME a test already pointed away from the operator's own home, else null. */
function scratchHome() {
  const home = process.env.HOME;
  return home && home !== operatorHome && fs.existsSync(home) ? home : null;
}

/**
 * The home whose global config receives a fixture's machine keys: the HOME a test already pointed at a scratch
 * directory, else a fresh one made under this process's temporary root and made the process's HOME, so a fixture
 * never writes the operator's own global file.
 */
export function machineHome() {
  const home = scratchHome();
  if (home) return home;
  const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-machine-home-'));
  process.env.HOME = fresh;
  process.env.USERPROFILE = fresh;
  helperHomes.add(fresh);
  return fresh;
}

/**
 * The global config `existing` with `machine` laid over it. In a home this helper made, the machine keys of an
 * earlier fixture are removed first, so one test's executors never reach the next; a home a test made keeps its own.
 */
function withMachineKeys(existing, machine, ownHome) {
  const next = plainConfig(existing);
  const runner = (next.runner ??= {});
  if (ownHome) {
    delete runner.executor;
    delete runner.executors;
    for (const [name, entry] of Object.entries(runner.capabilities ?? {})) {
      for (const key of MACHINE_CAPABILITY_KEYS) delete entry[key];
      if (Object.keys(entry).length === 0) delete runner.capabilities[name];
    }
  }
  if (machine.runner.executor !== undefined) runner.executor = machine.runner.executor;
  if (machine.runner.executors !== undefined) runner.executors = { ...runner.executors, ...machine.runner.executors };
  for (const [name, entry] of Object.entries(machine.runner.capabilities ?? {})) {
    runner.capabilities = { ...runner.capabilities, [name]: { ...runner.capabilities?.[name], ...entry } };
  }
  return next;
}

/**
 * Write `value` (a plain object) as the project config under `dir`, creating `.fgos/`. The keys a project file may
 * not hold (see `splitMachineKeys`) go to the machine's global config instead, as in a real setup; the product still
 * refuses a project file that holds them, which `writeRawProjectConfig` is for.
 */
export function writeProjectConfig(dir, value) {
  const { project, machine } = splitMachineKeys(value);
  writeConfigFile(configFilePath(dir), project);
  if (value?.runner) machineKeysOf.set(path.resolve(dir), machine);
  // A value with a runner section replaces the machine keys of the home this helper made, even when it holds none.
  const ownHome = process.env.HOME && helperHomes.has(process.env.HOME);
  if (!machine && !(ownHome && value?.runner)) return;
  const home = machineHome();
  const laid = machine ?? { runner: {} };
  writeConfigFile(configFilePath(home), withMachineKeys(readConfigFile(configFilePath(home)), laid, helperHomes.has(home)));
}

/** Write `value` (a plain object) as the global config under `home`, creating `.fgos/`. */
export function writeGlobalConfig(home, value) {
  writeConfigFile(configFilePath(home), value);
}

/**
 * Write the machine's account pools (`runner.llmAccounts`, `runner.providers.<p>.accounts`) as the accounts file of
 * the global directory `globalDir` (`<globalDir>/private/accounts.yaml`, mode 0600; JSON is YAML). Account pools
 * live only there: a config file that names them is refused.
 */
export function writeAccountsFile(globalDir, runner) {
  const dir = path.join(globalDir, 'private');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, 'accounts.yaml'), `${JSON.stringify({ runner }, null, 2)}\n`, { mode: 0o600 });
}

function writeRaw(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** Write exactly `text` as the project config: malformed content or byte-exact fixtures. */
export function writeRawProjectConfig(dir, text) {
  writeRaw(projectConfigPath(dir), text);
}

/** Path of the retired JSON project config under `dir`, for the tests of what the product does with a legacy file. */
export function legacyProjectConfigPath(dir) {
  return path.join(dir, '.fgos', 'config.json');
}

/** Write exactly `text` as the retired JSON project config. */
export function writeRawLegacyProjectConfig(dir, text) {
  writeRaw(legacyProjectConfigPath(dir), text);
}

/** Write exactly `text` as the global config. */
export function writeRawGlobalConfig(home, text) {
  writeRaw(globalConfigPath(home), text);
}

/** Write exactly `text` as the retired JSON global config under `home`, as a release before the Config component left it. */
export function writeRawLegacyGlobalConfig(home, text) {
  writeRaw(path.join(home, '.fgos', 'config.json'), text);
}

/**
 * Lays the machine keys the project fixture under `dir` was written with into the global config of `home`, for a test
 * that runs the product under a HOME of its own (a fixture's executors are the machine's, not the project file's).
 */
export function moveMachineKeysTo(dir, home) {
  const machine = machineKeysOf.get(path.resolve(dir));
  if (!machine) return;
  writeConfigFile(configFilePath(home), withMachineKeys(readConfigFile(configFilePath(home)), machine, false));
}

/**
 * The project config under `dir` as an ordinary object (parsed through the product's YAML reader), `{}` when the file is absent.
 * The machine keys `writeProjectConfig` laid in the machine home for this project are put back, so a test that reads a fixture,
 * changes it and writes it again sees the whole of what it wrote.
 */
export function readProjectConfig(dir) {
  const project = readConfigFile(projectConfigPath(dir));
  const machine = machineKeysOf.get(path.resolve(dir));
  if (!machine) return project;
  const runner = (project.runner ??= {});
  for (const key of ['executor', 'executors']) if (machine.runner[key] !== undefined) runner[key] = plainConfig(machine.runner[key]);
  for (const [name, entry] of Object.entries(machine.runner.capabilities ?? {})) {
    runner.capabilities = { ...runner.capabilities, [name]: { ...runner.capabilities?.[name], ...plainConfig(entry) } };
  }
  return project;
}

/** The global config under `home` as an ordinary object, `{}` when the file is absent. */
export function readGlobalConfig(home) {
  return readConfigFile(globalConfigPath(home));
}

function readConfigFile(file) {
  if (!fs.existsSync(file)) return {};
  return plainConfig(parseYaml(fs.readFileSync(file, 'utf8'), { filename: file }) ?? {});
}

/** A deep copy of `value` made of ordinary objects, so `deepEqual` against a literal ignores prototypes (the facade returns null-prototype objects). */
export function plainConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

let standardCapabilities;
/** The standard's capability catalog (no machine or project file), read once. */
function standardCapabilityCatalog() {
  standardCapabilities ??= plainConfig(readMachineConfig({ globalDir: path.join(os.tmpdir(), 'fgos-no-machine-config') }).value.runner.capabilities);
  return standardCapabilities;
}

/**
 * A capability entry of a fixture project that only `executors` (one id or a pool, in order) serve, at one tier. The bundled standard also
 * carries seat, role and persona scopes (and `<family>:*` wildcard scopes) with pools of their own, and a scope
 * wins over the capability's pool; the entry restates every scope the standard has for `name` so the fixture's
 * executor serves each seat, never a real CLI the standard names.
 */
export function capabilityServedBy(executors, name, { tier = 'standard', rigor = 'standard' } = {}) {
  const catalog = standardCapabilityCatalog();
  const prefer = [executors].flat().map((executor) => ({ executor }));
  const entry = { prefer, rigor, tier };
  const scopes = [catalog[name], ...Object.entries(catalog).filter(([key]) => key.endsWith(':*') && name.startsWith(key.slice(0, -1))).map(([, value]) => value)];
  for (const group of ['seats', 'roles', 'personas']) {
    for (const scope of scopes) {
      for (const key of Object.keys(scope?.[group] ?? {})) (entry[group] ??= {})[key] = { prefer, tier };
    }
  }
  return entry;
}

/** Whether the project under `dir` holds a config file (the YAML one). */
export function projectConfigExists(dir) {
  return fs.existsSync(projectConfigPath(dir));
}

/** The paths of the project config files present under `dir`: the YAML file and a legacy JSON one, either or both. */
export function existingProjectConfigPaths(dir) {
  return [projectConfigPath(dir), legacyProjectConfigPath(dir)].filter((file) => fs.existsSync(file));
}

/** The bytes of the project config under `dir`, exactly as on disk. */
export function readRawProjectConfig(dir) {
  return fs.readFileSync(projectConfigPath(dir), 'utf8');
}

/** The bytes of the global config under `home`, exactly as on disk. */
export function readRawGlobalConfig(home) {
  return fs.readFileSync(globalConfigPath(home), 'utf8');
}

/** The bytes of the retired JSON global config under `home`, exactly as on disk. */
export function readRawLegacyGlobalConfig(home) {
  return fs.readFileSync(path.join(home, '.fgos', 'config.json'), 'utf8');
}

/** The gateway token file of the global directory `globalDir` (`<globalDir>/private/gateway-token`). */
export function gatewayTokenPath(globalDir) {
  return path.join(globalDir, 'private', 'gateway-token');
}

/** `fs.statSync` of the gateway token file under the global directory `globalDir`. */
export function statGatewayToken(globalDir) {
  return fs.statSync(gatewayTokenPath(globalDir));
}

/** The text of the gateway token file under the global directory `globalDir`. */
export function readGatewayToken(globalDir) {
  return fs.readFileSync(gatewayTokenPath(globalDir), 'utf8');
}

/**
 * Runs `fn` with HOME and USERPROFILE pointing at `home`, then puts both back
 * (a variable that was unset is deleted again, never left as the string
 * "undefined"). Works for a sync or an async `fn`.
 */
export function withHome(home, fn) {
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  const restore = () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  let result;
  try {
    result = fn();
  } catch (err) {
    restore();
    throw err;
  }
  if (result && typeof result.then === 'function') return result.finally(restore);
  restore();
  return result;
}
