// identity-checks.mjs -- the doctor checks of the Identity component's machine
// and project ids, the machine signing key and its pinned peers, the OpenSSH it needs,
// and the setup fixes of the machine id and key
// (docs/platform/identity/spec.md, section 5).
// `registrations.mjs` registers them; the bodies live here.
//
// The checks ask the host (`fgos identity machine|project --json`) instead of
// reading the files, so the one validator of each id's shape stays in the Rust crate.
// The fix mints through the Identity N-API door (`mintMachineId`, the one mint
// `events migrate` also calls), never a second implementation.
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, anything else passes.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
import { mintMachineId, mintMachineKey } from '../util/identity-mint.mjs';
import { FGOS_FILE, resolveFgosFile } from '../state/fgos-file-registry.mjs';

const TIMEOUT_MS = 2000;

/**
 * Asks the host `fgos identity <verb> --json` from `cwd`. Answers `{ data }`, or
 * `{ result }` carrying the doctor result when the host cannot answer:
 * `missing` is the `[reason]` of a refusal the caller maps itself.
 */
const isIdentified = (data) => typeof data?.id === 'string' && typeof data?.handle === 'string';

function askIdentity(cwd, verb, { hostBin, missing, missingResult, valid = isIdentified }) {
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
  if (!valid(data)) {
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
 * pass when this machine holds a signing key, warn when it has none (or the host is older than the key),
 * fail when the host cannot answer. `fgos doctor --fix` mints it; it is never replaced.
 */
export function checkIdentityMachineKey(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'machine', {
    hostBin,
    missing: '[machine-id-missing]',
    missingResult: { passed: true, message: 'warning: no machine id minted yet, so no machine signing key; run `fgos doctor --fix`' },
  });
  if (result) return result;
  if (data.keyFingerprint === undefined) return { passed: true, message: 'warning: the active release does not know the machine signing key: it is older than this payload' };
  if (data.keyFingerprint === null) return { passed: true, message: 'warning: no machine signing key can be read; run `fgos doctor --fix` (and check identity-ssh-keygen)' };
  return { passed: true, message: `machine signing key ${data.keyFingerprint}` };
}

/** identity-machine-key (setup): mint the signing key once; never replaces an existing one. */
export function fixIdentityMachineKey(cwd, options = {}) {
  try {
    const { changed, fingerprint } = mintMachineKey(options.stateRoot ?? resolveStateRoot().stateRoot);
    return { changed, message: changed ? `minted machine signing key ${fingerprint}` : `machine signing key ${fingerprint} already minted` };
  } catch (err) {
    return { changed: false, message: `machine signing key not minted: ${err.message}` };
  }
}

const MIN_OPENSSH = [8, 1];

/** `[major, minor]` of the OpenSSH named in `ssh -V` output, or null. */
export function parseOpensshVersion(text) {
  const match = /OpenSSH_(\d+)\.(\d+)/.exec(text);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** What this machine has: whether `ssh-keygen` starts, and what `ssh -V` prints (it names the same OpenSSH). */
function probeOpenssh() {
  const probe = { keygen: true, versionText: '' };
  try {
    execFileSync('ssh-keygen', ['-?'], { stdio: 'ignore', timeout: TIMEOUT_MS, windowsHide: true });
  } catch (err) {
    // `-?` prints usage and exits non-zero; only a binary that cannot start is missing.
    if (err.code === 'ENOENT') probe.keygen = false;
  }
  // `ssh -V` prints its version on stderr.
  const ssh = spawnSync('ssh', ['-V'], { encoding: 'utf8', timeout: TIMEOUT_MS, windowsHide: true });
  probe.versionText = `${ssh.stdout ?? ''}${ssh.stderr ?? ''}`;
  return probe;
}

/**
 * pass when `ssh-keygen` exists and OpenSSH is 8.1 or later (the first with `-Y sign`/`-Y verify`), the tool
 * that signs and verifies for the Identity component; fail otherwise. No fix: install OpenSSH.
 */
export function checkIdentitySshKeygen({ probe = probeOpenssh } = {}) {
  const { keygen, versionText } = probe();
  if (!keygen) return { passed: false, message: 'ssh-keygen is not installed or not on PATH; install OpenSSH 8.1 or later (the Identity component signs with it)' };
  const version = parseOpensshVersion(versionText);
  if (!version) return { passed: false, message: `cannot read the OpenSSH version from \`ssh -V\` (${String(versionText).trim().slice(0, 100) || 'no output'}); OpenSSH 8.1 or later is needed` };
  if (version[0] < MIN_OPENSSH[0] || (version[0] === MIN_OPENSSH[0] && version[1] < MIN_OPENSSH[1])) {
    return { passed: false, message: `OpenSSH ${version.join('.')} is older than ${MIN_OPENSSH.join('.')}, which has no \`ssh-keygen -Y sign\`; upgrade OpenSSH` };
  }
  return { passed: true, message: `OpenSSH ${version.join('.')}` };
}

/**
 * Always passes: lists the machine keys this machine pinned the first time it saw them, so the owner
 * can compare the fingerprints across machines once. A key claimed again for a pinned machine is refused
 * at verify time (`machine-key-changed`); `fgos identity pins --forget <machine-id>` accepts a re-key.
 */
export function checkIdentityPinnedMachines(cwd, { hostBin } = {}) {
  const { data, result } = askIdentity(cwd, 'pins', {
    hostBin,
    missing: '[pins-unreadable]',
    missingResult: { passed: false, message: 'a pinned machine key file cannot be read; see `fgos identity pins`' },
    valid: (value) => Array.isArray(value?.pins),
  });
  if (result) return result;
  if (data.pins.length === 0) return { passed: true, message: 'no machine pinned yet' };
  const seen = data.pins.filter((pin) => pin.state !== 'confirmed').map((pin) => pin.machineId);
  const unconfirmed = seen.length === 0 ? 'all confirmed' : `${seen.length} seen, not yet confirmed: ${seen.join(', ')}`;
  return { passed: true, message: `${data.pins.length} pinned (${unconfirmed}): ${data.pins.map((pin) => `${pin.machineId} ${pin.fingerprint}`).join('; ')}` };
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

/**
 * Reports the shared directory from its cache only (the Rust identity crate writes it whenever a verb
 * resolves, lists or publishes; nothing is read from the store here). Passes with the counts; warns on
 * entries dropped because their signature did not hold (reason and machine id), on entries of another
 * project than this clone's, and on a machine shown by its id because another machine has its handle.
 * A missing or unreadable cache, or a clone with no project id, passes: there is no shared directory
 * yet. No fix: the owner decides what to do about a forged or misplaced entry.
 */
export function checkIdentitySharedDirectory(cwd) {
  const none = { passed: true, message: 'no shared directory yet' };
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  let projectId;
  let cache;
  try {
    projectId = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'project.json'), 'utf8')).projectId;
    cache = JSON.parse(fs.readFileSync(resolveFgosFile(path.join(root, '.fgos'), FGOS_FILE.IDENTITY_DIRECTORY), 'utf8'));
  } catch {
    return none;
  }
  if (typeof projectId !== 'string' || cache?.v !== 1 || !Array.isArray(cache.entries) || !Array.isArray(cache.dropped)) return none;
  const machines = new Set(cache.entries.map((entry) => entry.machine?.id));
  const summary = `${machines.size} machine(s), ${cache.entries.length} entries, fetched ${cache.fetchedAt ?? 'never'}`;
  const warnings = [];
  if (cache.dropped.length > 0) {
    warnings.push(`${cache.dropped.length} dropped (${cache.dropped.map((drop) => `${drop.reason} from ${drop.machineId}`).join(', ')})`);
  }
  const foreign = cache.entries.filter((entry) => entry.projectId !== projectId);
  if (foreign.length > 0) warnings.push(`${foreign.length} of another project (${[...new Set(foreign.map((entry) => entry.projectId))].join(', ')})`);
  const renamed = [...new Set(cache.entries.filter((entry) => entry.machine?.handle === entry.machine?.id).map((entry) => entry.machine.id))];
  if (renamed.length > 0) warnings.push(`machine handle shared, shown by id: ${renamed.join(', ')} (set one apart with \`fgos identity machine --alias\`)`);
  return { passed: true, message: warnings.length === 0 ? summary : `warning: ${summary}; ${warnings.join('; ')}` };
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
