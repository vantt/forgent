// Event Store doctor row bodies; src/setup/registrations.mjs registers each row through one eventStoreDoctor per run.
import fs from 'node:fs';
import { eventStoreFacts, readEventStoreConfig, prepareStore } from '../event-store/index.mjs';

export function eventStoreSetupContext(cwd, options = {}) {
  const base = { stateRoot: options.stateRoot, trustedMain: options.trustedMain ?? cwd, loaderOptions: options.loaderOptions };
  const initial = eventStoreFacts(cwd, base);
  const config = readEventStoreConfig(initial.trustedMain, options.globalConfigPath, { strict: true });
  const facts = config.remote === 'origin' ? initial : eventStoreFacts(cwd, { ...base, remote: config.remote });
  let observed;
  return { base, config, facts, status() {
    return observed ??= prepareStore(cwd, { ...base, trustedMain: facts.trustedMain, config: { eventStore: config } }).status([], config.remote);
  } };
}
function overlaps(refspec, namespaces) {
  if (refspec.startsWith('^')) return false;
  const source = refspec.replace(/^[+]/, '').split(':')[0];
  return namespaces.some(namespace => {
    const star = source.indexOf('*');
    if (star < 0) return source === namespace || source.startsWith(`${namespace}/`);
    const prefix = source.slice(0, star);
    return namespace.startsWith(prefix) || prefix.startsWith(`${namespace}/`);
  });
}
const pass = message => ({ passed: true, message });
const warn = message => pass(`warning: ${message}`);
const fail = message => ({ passed: false, message });
// A doctor invocation creates one checker and shares its lazy snapshot across
// all registered rows. A fresh invocation never reuses stale process-global data.
export function eventStoreDoctor(cwd, options = {}) {
  // The context is built once per run, a failure included: when no repository or addon is available every row
  // reports its own failure from the one remembered error instead of recomputing the setup nine times.
  let settled;
  const context = () => {
    if (!settled) {
      try { settled = { value: eventStoreSetupContext(cwd, options) }; } catch (error) { settled = { error }; }
    }
    if ('error' in settled) throw settled.error;
    return settled.value;
  };
  const check = kind => checkEventStore(cwd, kind, { ...options, context });
  // The facts the rows judge, read once per run: Git's repository-config row judges the mapping ones.
  check.facts = () => context().facts;
  return check;
}
/** The run's one eventStoreDoctor; without a run, a private one. */
export function eventStoreDoctorOf(cwd, run, options) {
  return run ? run.once(`event-store-doctor:${cwd}`, () => eventStoreDoctor(cwd)) : eventStoreDoctor(cwd, options);
}
/** What is wrong with the Event Store's Git mappings: an unsafe publication refspec, a missing mapping provenance, a remote that moved since setup. */
export function eventStoreMappingProblems(doctor) {
  let facts;
  // Facts that cannot be read are every Event Store row's own failure, from the same remembered error; this judges only what was read.
  try { facts = doctor.facts(); } catch { return []; }
  if (facts.pushRefspecs.some(r => overlaps(r, ['refs/fgos'])) || facts.fetchRefspecs.some(r => overlaps(r, ['refs/fgos/local-events', 'refs/fgos/branch-events']))) return ['unsafe publication refspec: push mappings or local/branch namespace fetch'];
  if (!facts.remoteFact.configured) return [];
  if (!facts.provenance || facts.expectedFetchRefspecs.some(r => !facts.provenance.refspecs.includes(r))) return ['event-store-refspec-missing: no Git mapping provenance; run setup'];
  if (facts.provenance.url !== facts.remoteFact.url) return ['event-store-remote-changed; run setup'];
  return [];
}
export function checkEventStore(cwd, kind, options = {}) {
  try {
    const context = options.context ? options.context() : eventStoreSetupContext(cwd, options);
    const { config, facts } = context;
    if (kind === 'event-store-open-root') {
      const meta = fs.lstatSync(facts.openRoot);
      if (!meta.isDirectory() || meta.isSymbolicLink() || facts.guarantee.exclusion === 'none') return fail(`open root unavailable: ${JSON.stringify(facts.guarantee)}`);
      return pass(`${facts.openRoot}: ${JSON.stringify(facts.guarantee)}`);
    }
    if (kind === 'event-store-machine-id' && facts.machineError) return fail(facts.machineError);
    if (kind === 'event-store-legacy-layout') {
      const result = prepareStore(cwd, { ...context.base, trustedMain: facts.trustedMain, config: { eventStore: config } }).legacyLayout([]);
      return result.passed ? pass('legacy fence, ref and sealed tree match') : fail(result.problems.join('; '));
    }
    const status = context.status();
    switch (kind) {
      case 'event-store-machine-id': return status.machineRefShared ? warn(`event-store-machine-ref-shared: ${facts.machineId}; set git config fgos.machineId <other-id> in one clone`) : pass(facts.machineId);
      case 'event-store-unsealed': {
        // Orphan branch streams are unsealed history nobody will seal: they warn on this row, and a failing age keeps its failure.
        const age = Math.max(0, ...status.streams.map(s => s.oldestUnsealedAgeSec));
        const tooOld = age > 3600;
        const notes = [
          tooOld ? `unsealed events age ${age}s exceeds 3600s` : age > 2 * config.seal.intervalSec && `unsealed events age ${age}s exceeds twice seal interval`,
          status.orphanBranches.length > 0 && `orphan branch streams: ${status.orphanBranches.join(', ')}`,
        ].filter(Boolean);
        return tooOld ? fail(notes.join('; ')) : notes.length ? warn(notes.join('; ')) : pass(`oldest unsealed age ${age}s`);
      }
      case 'event-store-integrity': {
        // A peer's mirror the reader or the last sync refused is history this clone does not see: it fails the row
        // by name. A shared machine ref is the machine-id row's warning.
        const problems = [
          ...status.integrityErrors.map(error => JSON.stringify(error)),
          ...status.skippedMirrors.map(m => `${m.code} ${m.refName}: ${m.detail}`),
          ...status.sync.warnings.filter(w => !w.startsWith('event-store-machine-ref-shared:')).map(w => `sync: ${w}`),
        ];
        return problems.length ? fail(problems.join('; ')) : pass(`verified ${Object.keys(status.refs).length} refs; ${status.deferred.length} deferred events`);
      }
      case 'event-store-sync': {
        if (!facts.remoteFact.configured) return pass('info: no remote configured');
        const push = status.lastPush;
        const pending = status.streams.some(s => (s.stream === 'project' || s.stream.startsWith('project:')) && (s.unsealedCount || s.closedSegmentsPending));
        if (!push?.error && !pending && status.aheadBehind.ahead === 0 && !status.sync.unpublishedSince) return pass('no unpublished events');
        const now = Math.floor(Date.now() / 1000);
        return !push || push.remote !== config.remote || push.error || now - push.time > 86400
          ? warn(`last push: ${JSON.stringify(push)}; ahead/behind: ${JSON.stringify(status.aheadBehind)}`) : pass(`last push ${push.time}; ahead/behind: ${JSON.stringify(status.aheadBehind)}`);
      }
      default: throw new Error(`unknown Event Store check: ${kind}`);
    }
  } catch (error) { return fail(error.message); }
}
