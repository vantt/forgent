// Dormant check bodies; registration is the phase 09 cutover's responsibility.
import fs from 'node:fs';
import { eventStoreFacts, eventStoreAddonAvailable, readEventStoreConfig, prepareStore } from '../event-store/index.mjs';

export function eventStoreSetupContext(cwd, options = {}) {
  const base = { stateRoot: options.stateRoot, trustedMain: options.trustedMain ?? cwd, loaderOptions: options.loaderOptions };
  const initial = eventStoreFacts(cwd, base);
  const config = readEventStoreConfig(initial.trustedMain, options.globalConfigPath);
  const facts = config.remote === 'origin' ? initial : eventStoreFacts(cwd, { ...base, remote: config.remote });
  return { base, config, facts };
}
function privateMapping(refspec) {
  const source = refspec.replace(/^[+^]/, '').split(':')[0];
  return ['refs/fgos/local-events', 'refs/fgos/branch-events'].some(namespace => {
    const star = source.indexOf('*');
    if (star < 0) return source === namespace || source.startsWith(`${namespace}/`);
    const prefix = source.slice(0, star);
    return namespace.startsWith(prefix) || prefix.startsWith(`${namespace}/`);
  });
}
const pass = message => ({ passed: true, message });
const warn = message => pass(`warning: ${message}`);
const fail = message => ({ passed: false, message });
export function checkEventStore(cwd, kind, options = {}) {
  try {
    if (kind === 'event-store-native-addon') return eventStoreAddonAvailable(options.loaderOptions)
      ? pass('Event Store facade exports present; ABI evidence: git-component-compatible') : fail('Event Store facade exports missing; see git-component-compatible');
    const { base, config, facts } = eventStoreSetupContext(cwd, options);
    if (kind === 'event-store-git-version') return facts.floor.supported && facts.floor.probes.every(p => p.passed) ? pass(JSON.stringify(facts.floor)) : fail(JSON.stringify(facts.floor));
    if (kind === 'event-store-open-root') {
      const meta = fs.lstatSync(facts.openRoot);
      if (!meta.isDirectory() || meta.isSymbolicLink() || facts.guarantee.exclusion === 'none') return fail(`open root unavailable: ${JSON.stringify(facts.guarantee)}`);
      return pass(`${facts.openRoot}: ${JSON.stringify(facts.guarantee)}`);
    }
    if (kind === 'event-store-refspec') {
      if (facts.pushRefspecs.length || facts.fetchRefspecs.some(privateMapping)) return fail('unsafe publication refspec: push mappings or local/branch namespace fetch');
      if (!facts.remoteFact.configured) return pass('info: no remote configured');
      if (facts.expectedFetchRefspecs.some(r => !facts.fetchRefspecs.includes(r))) return fail('event-store-refspec-missing; run setup');
      if (!facts.provenance || facts.expectedFetchRefspecs.some(r => !facts.provenance.refspecs.includes(r))) return fail('event-store-refspec-missing: no Git mapping provenance; run setup');
      if (facts.provenance.url !== facts.remoteFact.url) return fail('event-store-remote-changed; run setup');
      return pass('Git fetch mapping and pinned URL match');
    }
    if (kind === 'event-store-machine-id' && facts.machineError) return fail(facts.machineError);
    const store = prepareStore(cwd, { ...base, trustedMain: facts.trustedMain, config: { eventStore: config } });
    const status = store.status([], config.remote);
    switch (kind) {
      case 'event-store-machine-id': return status.machineRefShared ? warn(`event-store-machine-ref-shared: ${facts.machineId}; set git config fgos.machineId <other-id> in one clone`) : pass(facts.machineId);
      case 'event-store-unsealed': {
        const age = Math.max(0, ...status.streams.map(s => s.oldestUnsealedAgeSec));
        return age > 3600 ? fail(`unsealed events age ${age}s exceeds 3600s`) : age > 2 * config.seal.intervalSec ? warn(`unsealed events age ${age}s exceeds twice seal interval`) : pass(`oldest unsealed age ${age}s`);
      }
      case 'event-store-integrity': return status.integrityErrors.length ? fail(JSON.stringify(status.integrityErrors)) : pass(`verified ${Object.keys(status.refs).length} refs; ${status.deferred.length} deferred events`);
      case 'event-store-sync': {
        if (!facts.remoteFact.configured) return pass('info: no remote configured');
        const push = status.lastPush;
        const now = Math.floor(Date.now() / 1000);
        return !push || push.remote !== config.remote || push.error || now - push.time > 86400
          ? warn(`last push: ${JSON.stringify(push)}; ahead/behind: ${JSON.stringify(status.aheadBehind)}`) : pass(`last push ${push.time}; ahead/behind: ${JSON.stringify(status.aheadBehind)}`);
      }
      case 'event-store-orphan-branches': return status.orphanBranches.length ? warn(`orphan branch streams: ${status.orphanBranches.join(', ')}`) : pass('no orphan branch streams');
      default: throw new Error(`unknown Event Store check: ${kind}`);
    }
  } catch (error) { return fail(error.message); }
}
