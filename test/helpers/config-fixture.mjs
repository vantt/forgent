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

/** Write `value` (a plain object) as the project config under `dir`, creating `.fgos/`. */
export function writeProjectConfig(dir, value) {
  writeConfigFile(configFilePath(dir), value);
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

/** The project config under `dir` as an ordinary object (parsed through the product's YAML reader), `{}` when the file is absent. */
export function readProjectConfig(dir) {
  return readConfigFile(projectConfigPath(dir));
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
