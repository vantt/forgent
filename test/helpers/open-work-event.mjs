// A Work event left in the open log of a repository's store, for tests that prove a lifecycle boundary seals it.
import path from 'node:path';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';

/** Append one Work event (an hour old unless `ageSec` says otherwise) to the project stream of `repoRoot`'s store and
 * leave it unsealed. Returns `openAgeSec()`: how old the oldest unsealed event of the stream still is, 0 once
 * everything is sealed. */
export function leaveOpenWorkEvent(repoRoot, { ageSec = 3600 } = {}) {
  const dir = path.join(repoRoot, '.fgos');
  const { store } = prepareWorkStore(dir, dir);
  store.append('project', [{
    eventType: 'work.add', schemaVersion: 1, payload: { id: 'left-open' }, ts: new Date(Date.now() - ageSec * 1000).toISOString(),
  }], {}, 'fixture', []);
  return () => store.maintenance([]).streams.find((row) => row.stream === 'project').oldestUnsealedAgeSec;
}
