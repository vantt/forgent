// Thin doctor/setup adapter: repository trust, configuration and WAL parsing stay in Rust.
import { randomUUID } from 'node:crypto';
import { loadNativeAddon, nativeError } from '../git/native.mjs';
import { gitFacts, readMergeHead } from '../git/status.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { retentionNote } from './git-retention-note.mjs';
import { eventStoreDoctorOf, eventStoreMappingProblems, eventStoreDoctor } from './event-store-checks.mjs';
import { eventStoreAddonAvailable } from '../event-store/index.mjs';

const transportRemedy = 'For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.';

/**
 * A Git port error as one readable sentence: its cause plus the decoded stderr text. The port serializes its typed
 * fields into the error message, and stderr travels as bytes, so the raw message would print a number array.
 */
export function describeGitError(err) {
  const { cause, stderr } = nativeError(err);
  if (typeof cause !== 'string') return String(err.message);
  const text = Array.isArray(stderr) && stderr.length > 0 ? Buffer.from(stderr).toString('utf8').trim() : '';
  return text ? `${cause}: ${text}` : cause;
}
const noRemoteFix = 'git remote add origin <url> && fgos doctor --fix';
/** Whether the configured remote exists; facts that cannot be read count as configured, so the rows keep judging. */
function remoteConfigured(cwd, run, loaderOptions) {
  try { return (run ? eventStoreDoctorOf(cwd, run, { loaderOptions }) : eventStoreDoctor(cwd, { loaderOptions })).facts().remoteFact.configured; } catch { return true; }
}

// A row is its problems joined into one sentence, or its passing text; the facts it judged go under detail.
const row = (problems, ok, detail, found = problems.filter(Boolean)) => found.length ? { passed: false, message: found.join('; '), detail } : { passed: true, message: ok, detail };

/**
 * One Git doctor row. With a doctor `run`, rows of the run (and the Node-and-Git floor row) share one inspection of the repository for the
 * configured remote; the transport-config row adds one more `inspectGit` only when that remote is not `origin`. Without a run the
 * row inspects alone. Rows judge readiness; open incidents are `fgos git status` and `fgos git recover`, which `git-incidents` points to.
 */
export function checkGit(cwd, kind, loaderOptions, run) {
  try {
    const { root, remote, stateRoot, native, facts } = gitFacts(cwd, false, loaderOptions, run);
    if (facts.notARepository && kind !== 'git-component-compatible') return { passed: true, message: 'info: not a Git repository' };
    switch (kind) {
      case 'git-component-compatible': {
        const detail = { versions: native.versions(), floor: facts.floor };
        return row([
          !compatibleGitContracts(detail.versions, facts.floor) && 'the Git addon, its contract versions or the Git feature floor do not match this release; upgrade the active release or its Git binary',
          !eventStoreAddonAvailable(loaderOptions) && 'the Event Store facade exports of the addon are missing; upgrade the active release',
        ],
          facts.notARepository ? 'the Git addon, its contracts and the Git feature floor are compatible' : `info: ${facts.commonDir}: ${facts.layout}; ${facts.durability}`, detail);
      }
      case 'git-repository-config': {
        const keys = facts.untrustedTransportConfig;
        if (!Array.isArray(keys)) return row(['Git addon lacks transport diagnostics; upgrade the active release']);
        const reserved = facts.reservedLegacyRefs ?? [];
        const obsolete = facts.obsoleteFetchMapping || (remote !== 'origin' && native.inspectGit(stateRoot, cwd, root, 'origin').obsoleteFetchMapping);
        const hasRemote = remoteConfigured(cwd, run, loaderOptions);
        const result = row([
          keys.length && `repository-transport-config-untrusted: ${keys.join(', ')}; Publication/Remote transfers refuse these settings. ${transportRemedy}`,
          hasRemote && !native.gitFetchMappings(remote).every(r => facts.fetchRefspecs.includes(r)) && 'the required fetch mapping is missing; run fgos doctor --fix (git-publication-refspecs)',
          obsolete && 'obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)',
          reserved.length && `reserved legacy mirror refs detected: ${reserved.join(', ')}; inspect and remove the foreign refs at their source and these mirrors`,
          ...eventStoreMappingProblems(eventStoreDoctorOf(cwd, run, { loaderOptions })),
        ], 'repository transport settings and fetch mappings are as fgOS expects', { fetchRefspecs: facts.fetchRefspecs, untrustedTransportConfig: keys, reservedLegacyRefs: reserved });
        // Nothing to fetch from: the mappings are installed once a remote exists, so a local-only project is not red for it.
        return hasRemote || !result.passed ? result : { ...result, status: 'skip', fixCommand: noRemoteFix, message: `no Git remote "${remote}" configured, so there is no fetch mapping to install; add one when the project has a remote` };
      }
      case 'git-operation-journal': {
        const { journal } = facts;
        const fenceMissing = journal.initialized && facts.activationFence === false;
        // Every WAL-writing door refuses without the controller's activation fence, so a WAL without it is a hard stop.
        return row([
          fenceMissing && 'git-fence-missing: the Git WAL exists but the controller activation fence does not, so every Git write refuses; run `fgctl upgrade` for the active release (it places the fence)',
          !journal.initialized && 'the Git WAL is not initialized; run `fgos doctor --fix` (git-wal-dir)',
          journal.initialized && !journal.complete && 'the Git WAL listing is incomplete; inspect it with `fgos git status`',
          journal.errors.length && `${journal.errors.length} Git WAL error(s); inspect them with \`fgos git status\``,
        ], 'the Git WAL is readable', { journal });
      }
      case 'git-incidents': {
        const { journal, nativeLocks } = facts;
        const merge = readMergeHead(root);
        const note = retentionNote(journal);
        const open = [journal.pendingCount && `${journal.pendingCount} pending Git operation(s)`, nativeLocks.length && `${nativeLocks.length} native lock(s)`, merge && 'a merge in progress'].filter(Boolean);
        const retention = note?.startsWith('warning:') ? `; ${note}` : '';
        return { passed: true, message: open.length
          ? `warning: ${open.join(', ')}; run \`fgos git status\` (\`fgos git recover\` settles interrupted operations)${retention}`
          : `no pending Git operation, native lock or merge in progress; worktree and retained-Land findings: \`fgos git status\`${retention}`, detail: { pendingCount: journal.pendingCount, nativeLocks: nativeLocks.length, mergeInProgress: merge } };
      }
      default: throw new Error(`unknown Git check: ${kind}`);
    }
  } catch (err) {
    if (kind === 'git-repository-config' && /repository-config-untrusted: credential\.helper/.test(err.message)) return { passed: false, message: `${describeGitError(err)}; ${transportRemedy}` };
    return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel: onboard this project with `fgctl init`' : describeGitError(err) };
  }
}
/** The Git binary fgos-git runs and its floor verdict; Git is only ever spawned by the driver. */
export function gitFloor(cwd, loaderOptions, run) {
  return gitFacts(cwd, false, loaderOptions, run).facts.floor;
}
/** The repository as the fixes found it, or null when there is none to fix. */
function readBefore(cwd, loaderOptions) {
  const { facts: before, ...ctx } = gitFacts(cwd, false, loaderOptions);
  return before.notARepository ? null : { ...ctx, before };
}
const noRepository = { changed: false, message: 'not a Git repository' };
const initializeWal = (cwd) => {
  const found = readBefore(cwd);
  if (!found) return noRepository;
  found.native.initializeGitWal(found.stateRoot, cwd, found.root);
  return { changed: !found.before.journal.initialized, message: 'Git WAL initialized and trusted' };
};
const installFetchMapping = (cwd, loaderOptions) => {
  const found = readBefore(cwd, loaderOptions);
  if (!found) return noRepository;
  const { root, remote, stateRoot, native, before } = found;
  const repairs = [];
  const hasRemote = remoteConfigured(cwd, undefined, loaderOptions);
  if (hasRemote && (!native.gitFetchMappings(remote).every(r => before.fetchRefspecs.includes(r)) || before.obsoleteFetchMapping)) repairs.push(remote);
  if (remote !== 'origin' && native.inspectGit(stateRoot, cwd, root, 'origin').obsoleteFetchMapping) repairs.push('origin');
  for (const target of repairs) native.ensureGitFetchMapping(stateRoot, cwd, root, target, native.gitFetchMappings(target), `setup-${randomUUID()}`);
  return { changed: repairs.length > 0, message: repairs.length ? `installed fgOS fetch mappings and repaired obsolete legacy mapping: ${repairs.join(', ')}` : hasRemote ? 'no fetch mapping change needed' : `no Git remote "${remote}" configured, so there is no fetch mapping to install` };
};
const attemptFix = (cwd, fix) => {
  try { return fix(cwd); } catch (err) { return { changed: false, message: `warning: Git setup refused: ${describeGitError(err)}` }; }
};
export const fixGitDriverDirectories = (cwd, loaderOptions) => attemptFix(cwd, () => {
  // No config read here: the door refuses while these directories are unsafe, and this is what makes them safe.
  const native = loadNativeAddon(loaderOptions);
  return { changed: native.prepareGitDriverDirectories(resolveStateRoot().stateRoot), message: 'fgOS Git driver directories are current-user-owned and safely permissioned' };
});
/** A fix that first makes the driver directories safe, then runs its own repair. */
const afterDriverDirectories = (cwd, loaderOptions, fix) => {
  const prepared = fixGitDriverDirectories(cwd, loaderOptions);
  const result = attemptFix(cwd, fix);
  return { ...result, changed: prepared.changed || result.changed };
};
export const fixGitWal = (cwd) => afterDriverDirectories(cwd, undefined, initializeWal);
export const fixGitFetchMapping = (cwd, loaderOptions) => afterDriverDirectories(cwd, loaderOptions, () => installFetchMapping(cwd, loaderOptions));
export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported;
}
