// The Node facade over the native `config` namespace (docs/platform/config/spec.md section 12): the one module that
// reads or writes a config file from Node. Each function is one door call plus marshalling: the effective value
// comes from the fgos-config crate (project over global over standard, the accounts layer when unconfined, `command`
// values from the main checkout), never from a JavaScript merge, a cache or a validator in this module. A process
// that cannot load the addon fails every call with the door's own named error; there is no JavaScript fallback.
import os from 'node:os';
import path from 'node:path';
import { fromDoorJson, nativeDoor } from '../native/door.mjs';

/** The variable a confined launch sets to `1` in every worker; the crate's `CONFINED_MARKER` and the launch driver name the same one. */
export const CONFINED_MARKER_ENV = 'FGOS_CONFINED';

/** Ids the door itself reports: a request that breaks the entry's contract, an operating-system error, a main checkout that could not be established, a caught panic. None says anything about a config file. */
const DOOR_IDS = new Set(['config-request-invalid', 'config-io', 'config-trusted-root-unresolved', 'config-internal-error']);

/** A refusal of the door: `code` is the failure id and `refusals` lists every one with its file, 1-based position, path and keyword, never a value. */
export class ConfigDoorError extends Error {
  constructor({ id, keyword, refusals = [], ...own }) {
    const list = refusals.length > 0 ? refusals : [{ id, keyword, ...own }];
    const where = (r) => [r.file ? `${r.file}${Number.isInteger(r.line) ? `:${r.line}:${r.column}` : ''}` : '', r.path ?? ''].filter(Boolean).join(' ');
    super(list.map((r) => [r.id, where(r), r.keyword ? `(${r.keyword})` : ''].filter(Boolean).join(' ')).join('; '));
    Object.assign(this, { name: 'ConfigDoorError', code: id, refusals: list });
  }
}

/** Whether `err` says a config file is unusable (it does not parse, breaks a schema, sits in the wrong scope), as opposed to the door failing: the readers that keep a documented fail-closed value test this, and nothing else swallows an error. */
export const isConfigRefusal = (err) => err instanceof ConfigDoorError && !DOOR_IDS.has(err.code);

const sessionClass = () => (process.env[CONFINED_MARKER_ENV] === '1' ? 'confined' : 'unconfined');

/** One door call. The defaults are computed here, per call: tests and callers override `HOME` after this module loaded. */
function call(entry, { globalDir = path.join(os.homedir(), '.fgos'), class: sessionKind = sessionClass(), ...fields }) {
  const request = { globalDir, class: sessionKind, ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) };
  let text;
  try {
    text = nativeDoor().config[entry](request);
  } catch (err) {
    let failure;
    try { failure = JSON.parse(err.message); } catch { /* the door's own error: the addon is missing or does not match */ }
    throw typeof failure?.id === 'string' ? new ConfigDoorError(failure) : err;
  }
  return fromDoorJson(text, { nullPrototype: true });
}

/**
 * The effective config of a project: `{ value, revisions, accounts, notices, origins? }`. `sections` narrows `value` to those
 * top-level keys; `origins` (paths such as `runner.executor`) adds where each value under them came from
 * (`{ path, layer, role, file, line, column, described }`). Objects have no prototype. A file that is unusable throws a
 * ConfigDoorError; nothing here returns an empty value for a broken file.
 */
export function readConfig({ projectRoot, ...options }) {
  if (typeof projectRoot !== 'string') throw new TypeError('readConfig needs the projectRoot; readMachineConfig reads the machine alone');
  return call('snapshot', { projectRoot, ...options });
}

/** The effective config of the machine alone (global file, accounts when unconfined, standard), never reading a project. */
export const readMachineConfig = (options = {}) => call('snapshot', options);

/** Whether `projectRoot` has a project config file: a YAML file or a legacy JSON one. A migration tombstone is no source. */
export const projectConfigPresent = (projectRoot, options = {}) => readConfig({ ...options, projectRoot, sections: [] }).revisions.project !== 'absent';

/** The bundled standard's value at a dotted path (`runner.modelPolicies.claude.advanced`), reading no file: `{ present, value }`. */
export const readStandardValue = (path) => call('standardValue', { path });

/** The account pools alone, valid with no usable project or global file: `{ present, state, revision, runner }`. */
export const readMachineAccounts = (options = {}) => call('accounts', options);

/** The findings of a project's and the machine's config files with the doctor severity: `{ findings: [{ row, severity, file, line, column, path, fix, detail }] }`; `rows` keeps only the named ones. */
export const checkConfig = (options) => call('check', options);

/** Applies the named repairs (`ids`) a check offered: `{ changed: [{ fix, path }], skipped }`. A confined session is refused. */
export const fixConfig = (options) => call('fix', options);

/** Creates the header-only config file of `target` (`'project'` or `'global'`) when that scope has none: `{ created, file, revision }`, `file` being the name the scope holds now (`config.yaml`, or a legacy `config.json` left alone). */
export const initConfigFile = (options) => call('init', options);
