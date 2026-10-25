import path from 'node:path';
import { isConfigRefusal, readConfig } from '../config/facade.mjs';

// Phase 09 extends the existing eventStore registration with this ONE shape.
export const EVENT_STORE_DEFAULTS = Object.freeze({ seal: Object.freeze({ intervalSec: 300, coalesceSec: 30 }), sync: Object.freeze({ intervalSec: 300 }), rebuild: Object.freeze({ maxAttempts: 5 }), remote: 'origin' });
const invalid = name => Object.assign(new Error(`event-store-config: invalid ${name}`), { code: 'event-store-config' });
export function eventStoreConfig(config = {}) {
  const input = config.eventStore === undefined ? {} : config.eventStore;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('eventStore');
  const result = {};
  // Every numeric key with its minimum; a section holds one or more keys.
  for (const [name, keys] of [['seal', { intervalSec: 1, coalesceSec: 1 }], ['sync', { intervalSec: 0 }], ['rebuild', { maxAttempts: 0 }]]) {
    const section = input[name] === undefined ? {} : input[name];
    if (!section || typeof section !== 'object' || Array.isArray(section)) throw invalid(name);
    result[name] = {};
    for (const [key, minimum] of Object.entries(keys)) {
      const value = section[key] === undefined ? EVENT_STORE_DEFAULTS[name][key] : section[key];
      if (!Number.isSafeInteger(value) || value < minimum) throw invalid(`${name}.${key}`);
      result[name][key] = value;
    }
  }
  result.remote = input.remote === undefined ? EVENT_STORE_DEFAULTS.remote : input.remote;
  // Same remote-name alphabet as Git's publication_fetch_mappings.
  if (typeof result.remote !== 'string' || !/^[A-Za-z0-9_-]+$/.test(result.remote)) throw invalid('remote');
  return result;
}
/**
 * The Event Store config of the project at `root`, read through the config door; `globalConfigPath` names a global config
 * file whose directory replaces `~/.fgos`.
 *
 * Config files are hand edited, so a half-typed edit is an ordinary state, and the door refuses a file as a whole. A
 * refused file never yields the defaults for a publish decision: a caller that reports on or acts for the user (`strict`:
 * the `events` verbs, doctor) gets the `event-store-config` error with the door's message; any other caller (the write
 * path and the lifecycle triggers) gets a config that never pushes (`sync.intervalSec` 0) when the refusal is not about
 * the `eventStore` section, so a trigger still seals and never publishes against the user's real setting. A refusal that
 * names an `eventStore` value throws for every caller.
 */
export function readEventStoreConfig(root, globalConfigPath, { strict = false } = {}) {
  const globalDir = globalConfigPath ? path.dirname(globalConfigPath) : undefined;
  try {
    return eventStoreConfig(readConfig({ projectRoot: root, globalDir, sections: ['eventStore'] }).value);
  } catch (error) {
    if (!isConfigRefusal(error)) throw error;
    const aboutEventStore = error.refusals.some(({ path: at }) => typeof at === 'string' && (at === 'eventStore' || at.startsWith('eventStore.')));
    if (strict || aboutEventStore) throw Object.assign(new Error(`event-store-config: ${error.message}`), { code: 'event-store-config' });
    return { ...eventStoreConfig({}), sync: { intervalSec: 0 } };
  }
}
