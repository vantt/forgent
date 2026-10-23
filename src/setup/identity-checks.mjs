// identity-checks.mjs -- the doctor checks of the Identity component's machine
// and project ids and the setup fix of the machine id
// (docs/platform/identity/spec.md, section 5).
// `registrations.mjs` registers them; the bodies live here.
//
// The checks ask the host (`fgos identity machine|project --json`) instead of
// reading the files, so the one validator of each id's shape stays in the Rust crate.
// The fix mints through the Identity N-API door (`mintMachineId`, the one mint
// `events migrate` also calls), never a second implementation.
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, anything else passes.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { mintMachineId } from '../util/identity-mint.mjs';

const TIMEOUT_MS = 2000;

/**
 * Asks the host `fgos identity <verb> --json` from `cwd`. Answers `{ data }`, or
 * `{ result }` carrying the doctor result when the host cannot answer:
 * `missing` is the `[reason]` of a refusal the caller maps itself.
 */
function askIdentity(cwd, verb, { hostBin, missing, missingResult }) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const bin = hostBin ?? resolveActiveHostBin({ fgosDir: path.join(root, '.fgos'), cwd }).bin;
  if (!bin) return { result: { passed: true, message: `warning: no host binary to ask for the ${verb} id -- run fgctl init/repair, or set FGOS_HOST_BIN` } };
  const env = { ...process.env };
  delete env.FGOS_INVOCATION_RECORD_PATH;
  let stdout;
  try {
    stdout = execFileSync(bin, ['identity', verb, '--json'], {
      cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: TIMEOUT_MS, killSignal: 'SIGKILL', windowsHide: true,
    });
  } catch (err) {
    const stderr = String(err.stderr ?? '').trim();
    if (err.status === 65 && stderr.includes(missing)) return { result: missingResult };
    if (err.status === 4) {
      return { result: { passed: true, message: `warning: ${bin} has no "identity ${verb}" subcommand: the active release is older than this payload` } };
    }
    return { result: { passed: false, message: `${bin} identity ${verb} failed (${err.code ?? `exit ${err.status}`})${stderr ? `: ${stderr.slice(0, 300)}` : ''}` } };
  }
  let data;
  try {
    data = JSON.parse(stdout).data;
  } catch {
    return { result: { passed: false, message: `${bin} identity ${verb} printed something that is not JSON` } };
  }
  if (typeof data?.id !== 'string' || typeof data?.handle !== 'string') {
    return { result: { passed: false, message: `${bin} identity ${verb} printed an unexpected answer: ${stdout.slice(0, 200)}` } };
  }
  return { data };
}

/** pass when the machine id is minted and valid, warn when it is absent, fail when it is unreadable. */
export function checkIdentityMachineId(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'machine', {
    hostBin,
    missing: '[machine-id-missing]',
    missingResult: { passed: true, message: 'warning: no machine id minted yet; run `fgos doctor --fix`' },
  });
  return result ?? { passed: true, message: `machine ${data.id}, handle ${data.handle}${data.alias ? ' (alias)' : ''}` };
}

/**
 * pass when this repository carries a valid project id, warn when it has none, fail when the
 * file is unreadable. There is no fix: the id is minted once by hand on one machine, committed,
 * and pulled everywhere else (a fix on every machine would mint one id per clone).
 */
export function checkIdentityProjectId(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'project', {
    hostBin,
    missing: '[project-id-missing]',
    missingResult: { passed: true, message: 'warning: no project id yet; run `fgos identity project --init` once on one machine, commit, pull elsewhere' },
  });
  return result ?? { passed: true, message: `project ${data.id}, handle ${data.handle}` };
}

/** identity-machine-id (setup): mint the machine id once; never replaces an existing one. */
export function fixIdentityMachineId(cwd, options = {}) {
  try {
    const { changed, machineId } = mintMachineId(options.stateRoot ?? resolveStateRoot().stateRoot);
    return { changed, message: changed ? `minted machine id ${machineId}` : `machine id ${machineId} already minted` };
  } catch (err) {
    return { changed: false, message: `machine id not minted: ${err.message}` };
  }
}

const MAX_REGISTRY_BYTES = 8 * 1024 * 1024;

function readText(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() && stat.size <= MAX_REGISTRY_BYTES ? fs.readFileSync(file, 'utf8') : null;
  } catch {
    return null;
  }
}

/** The id registries of one checkout: backlog rows, `D-ADR` headings, decision file numbers. */
function readIdRegistries(root) {
  const backlogIds = [];
  for (const line of (readText(path.join(root, 'docs/backlog.md')) ?? '').split('\n')) {
    const id = /^\|\s*([^|\s][^|]*?)\s*\|/.exec(line)?.[1];
    if (id && id !== 'ID' && !/^-+$/.test(id)) backlogIds.push(id);
  }
  // One decision may be recorded in several area specs; it is the same decision while every
  // heading gives it the same short title, and two titles under one number are two decisions.
  const adrTitles = new Map();
  const specsDir = path.join(root, 'docs/specs');
  const documents = [path.join(root, 'docs/platform-foundations.md')];
  try {
    for (const name of fs.readdirSync(specsDir)) if (name.endsWith('.md')) documents.push(path.join(specsDir, name));
  } catch {
    // a checkout without specs has no decisions to scan
  }
  for (const file of documents) {
    for (const line of (readText(file) ?? '').split('\n')) {
      const heading = /^#+\s+(D-ADR\d{4})\s*(?:\(([^)]*)\))?/.exec(line);
      if (!heading) continue;
      const titles = adrTitles.get(heading[1]) ?? new Set();
      titles.add((heading[2] ?? '').trim());
      adrTitles.set(heading[1], titles);
    }
  }
  const fileNumbers = [];
  try {
    for (const name of fs.readdirSync(path.join(root, 'docs/decisions'))) {
      const number = /^(\d{4})-/.exec(name)?.[1];
      if (number) fileNumbers.push(number);
    }
  } catch {
    // the decision corpus is retired in most checkouts
  }
  return { backlogIds, adrTitles, fileNumbers };
}

const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

/**
 * identity-ids-unique: no two backlog rows share an id, no `D-ADR` number is headed with two
 * different titles, and no two decision files share a number. The safety net behind the mint
 * door: a second writer that bypassed it shows up here, never as a silent clash.
 */
export function checkIdentityIdsUnique(cwd) {
  // The registries are tracked documents, so the checkout the command runs in is the one to read.
  const { backlogIds, adrTitles, fileNumbers } = readIdRegistries(cwd);
  const problems = [
    ...duplicates(backlogIds).map((id) => `backlog id ${id} is used by more than one row`),
    ...[...adrTitles].filter(([, titles]) => titles.size > 1).map(([id, titles]) => `${id} is headed with different titles (${[...titles].map((t) => JSON.stringify(t)).join(', ')})`),
    ...duplicates(fileNumbers).map((number) => `decision file number ${number} is used by more than one file`),
  ];
  if (problems.length > 0) {
    return { passed: false, message: `${problems.join('; ')} -- ids that travel between machines come from \`fgos identity mint <kind>\`; renumber the later one` };
  }
  return { passed: true, message: `${backlogIds.length} backlog ids, ${adrTitles.size} D-ADR numbers and ${fileNumbers.length} decision files, none repeated` };
}
