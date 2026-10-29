// Doctor rows over the config files themselves (docs/platform/config/spec.md section 11): one check per row of the
// config crate's contract (packages/config/contracts/doctor-rows.v1.json, the one source of ids and descriptions
// for Rust and Node) and one fix per fix id. The door's findings engine decides what is wrong and how severe it
// is; this module only maps a finding to the registry's `{ passed, message }` and a repair to `{ changed, message }`.
// registrations.mjs registers the two lists, so this module never imports the registry back.

import fs from 'node:fs';
import { checkConfig, fixConfig, ConfigDoorError } from '../config/facade.mjs';

const contract = JSON.parse(fs.readFileSync(new URL('../../packages/config/contracts/doctor-rows.v1.json', import.meta.url), 'utf8'));

// The machine files row keeps the id the gateway token row has always had, so nothing that names it changes.
const ROW_IDS = { 'config-machine-files': 'gateway-token-configured' };
const FIX_IDS = { 'create-machine-files': 'gateway-token-configured' };
const DESCRIPTIONS = { 'config-machine-files': 'the gateway token file ~/.fgos/private/gateway-token exists, is 0600 and holds one line' };

/** A refusal of the door (a file that is unusable, a request it cannot serve) or a process that cannot load the addon at all: the failures a doctor row reports as its own failure, with the door's message, instead of ending the run. */
export const isConfigDoorFailure = (err) => err instanceof ConfigDoorError || (typeof err?.code === 'string' && err.code.startsWith('git-addon-'));

const rowId = (row) => ROW_IDS[row] ?? row;
const fixId = (fix) => FIX_IDS[fix] ?? `config-${fix}`;

/** The door's findings for a project: one read (about 70 ms) per doctor run, shared by every row that judges the config files. A row called without a run reads for itself. */
export const checkConfigOnce = (cwd, run) => (run
  ? run.once(`config-check:${cwd}`, () => checkConfig({ projectRoot: cwd }))
  : checkConfig({ projectRoot: cwd }));

const findingsOf = (cwd, run, row) => checkConfigOnce(cwd, run).findings.filter((finding) => finding.row === row);

// `file:line:column row path`, then the finding's own text; never a value (the door puts none in a finding).
const describe = ({ row, file, line, column, path, detail }) => [
  file ? `${file}${Number.isInteger(line) ? `:${line}:${column}` : ''}` : '',
  row,
  path ?? '',
  detail ? `(${detail})` : '',
].filter(Boolean).join(' ');

function mapFindings(findings, description) {
  if (findings.length === 0) return { passed: true, message: 'no finding' };
  const failing = findings.filter((finding) => finding.severity === 'fail');
  const lines = (failing.length > 0 ? failing : findings).map(describe).join('; ');
  const repair = findings.some((finding) => typeof finding.fix === 'string') ? ' -- fgos doctor --fix repairs it' : '';
  if (failing.length > 0) return { passed: false, message: `${description} ${lines}${repair}` };
  return { passed: true, message: `warning: ${lines}${repair}` };
}

/** The doctor checks: `{ id, description, check }`, one per contract row. */
export const CONFIG_CHECKS = contract.rows.map((row) => ({
  id: rowId(row.id),
  description: DESCRIPTIONS[row.id] ?? row.description,
  check: (cwd, run) => mapFindings(findingsOf(cwd, run, row.id), row.description),
}));

/** The doctor fixes: `{ id, fix }`, one per contract fix id; a confined session or a refused file repairs nothing and says why. */
export const CONFIG_FIXES = contract.fixes.map((fix) => ({
  id: fixId(fix),
  fix: (cwd) => {
    try {
      const { changed } = fixConfig({ projectRoot: cwd, ids: [fix] });
      return { changed: changed.length > 0, message: `${changed.length} repaired` };
    } catch (err) {
      if (isConfigDoorFailure(err)) return { changed: false, message: err.message };
      throw err;
    }
  },
}));
