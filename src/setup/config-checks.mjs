// Doctor rows over the config files themselves (docs/platform/config/spec.md section 11): one check per row of the
// config crate's contract (packages/config/contracts/doctor-rows.v1.json, the one source of ids and descriptions
// for Rust and Node) and one fix per fix id. The door's findings engine decides what is wrong and how severe it
// is; this module only maps a finding to the registry's `{ passed, message }` and a repair to `{ changed, message }`.
// registrations.mjs registers the two lists, so this module never imports the registry back.

import fs from 'node:fs';
import os from 'node:os';
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

// One door call (about 70 ms) serves every row of a doctor run: the rows come from the same read of the files. A run is
// the rows asked in turn until each was asked once; a row asked a second time, another project, home or session class,
// or a memo older than a second (a partial run) reads afresh, so a file changed between two runs is never judged stale.
const MEMO_MAX_AGE_MS = 1000;
let memo = null;

function findingsOf(cwd, row) {
  const key = [cwd, os.homedir(), process.env.FGOS_CONFINED ?? ''].join('\0');
  if (memo === null || memo.key !== key || memo.asked.has(row) || Date.now() - memo.at > MEMO_MAX_AGE_MS) {
    memo = { key, at: Date.now(), asked: new Set(), findings: checkConfig({ projectRoot: cwd }).findings };
  }
  const mine = memo.findings.filter((finding) => finding.row === row);
  memo.asked.add(row);
  if (memo.asked.size === contract.rows.length) memo = null;
  return mine;
}

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
  check: (cwd) => mapFindings(findingsOf(cwd, row.id), row.description),
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
