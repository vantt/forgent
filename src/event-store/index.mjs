// Public Event Store door. Consumers own policy, gates, reducers and caches.
export { decodeLegacyFiles, prepareStore, openStore, eventStoreFacts, ensureEventStoreRefspecs, eventStoreAddonAvailable, mintEventStoreMachineId } from './native.mjs';
export { consumers, registryFiles, loadRebuildModule } from './consumers.mjs';
export { EVENT_STORE_DEFAULTS, eventStoreConfig, readEventStoreConfig } from './config.mjs';
