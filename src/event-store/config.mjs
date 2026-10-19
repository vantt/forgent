import { readSharedConfig } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';

// Phase 09 extends the existing eventStore registration with this ONE shape.
export const EVENT_STORE_DEFAULTS = Object.freeze({ seal: Object.freeze({ intervalSec: 300 }), sync: Object.freeze({ intervalSec: 300 }), rebuild: Object.freeze({ maxAttempts: 5 }), remote: 'origin' });
const invalid = name => Object.assign(new Error(`event-store-config: invalid ${name}`), { code: 'event-store-config' });
export function eventStoreConfig(config = {}) {
  const input = config.eventStore === undefined ? {} : config.eventStore;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('eventStore');
  const result = {};
  for (const [name, minimum] of [['seal', 1], ['sync', 0], ['rebuild', 0]]) {
    const section = input[name] === undefined ? {} : input[name];
    if (!section || typeof section !== 'object' || Array.isArray(section)) throw invalid(name);
    const key = name === 'rebuild' ? 'maxAttempts' : 'intervalSec';
    const value = section[key] === undefined ? EVENT_STORE_DEFAULTS[name][key] : section[key];
    if (!Number.isSafeInteger(value) || value < minimum) throw invalid(name);
    result[name] = { [key]: value };
  }
  result.remote = input.remote === undefined ? EVENT_STORE_DEFAULTS.remote : input.remote;
  // Same remote-name alphabet as Git's publication_fetch_mappings.
  if (typeof result.remote !== 'string' || !/^[A-Za-z0-9_-]+$/.test(result.remote)) throw invalid('remote');
  return result;
}
export function readEventStoreConfig(root, globalConfigPath) {
  return eventStoreConfig(mergeWithGlobalConfig(readSharedConfig(root), globalConfigPath));
}
