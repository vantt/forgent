// Data only. Consumers retain ownership of their contracts and rebuild code.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { OWN_PAYLOAD_ROOT } from '../run-supervisor/payload-root.mjs';

function invalid(detail) {
  return Object.assign(new Error(`event-store-consumer-registry: ${detail}`), { code: 'event-store-consumer-registry' });
}
function relativePath(value) {
  return typeof value === 'string' && value.length > 0 && !path.isAbsolute(value)
    && !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..');
}

let cached;
/** Read the shipped manifest once; importing a consumer never registers it. */
export function consumers() {
  if (cached) return cached;
  const manifest = JSON.parse(fs.readFileSync(path.join(OWN_PAYLOAD_ROOT, 'packages/event-store/contracts/consumers.v1.json'), 'utf8'));
  if (manifest.v !== 1 || !Array.isArray(manifest.consumers)) throw invalid('unsupported manifest');
  const ids = new Set();
  const files = new Set();
  const caches = new Set();
  const entries = manifest.consumers.map(entry => {
    // A consumer keeps a rebuildable view (cache plus the module that folds it) or none; a registry-only entry
    // registers its streams and has nothing to rebuild. Both fields are present together or absent together.
    const hasView = entry?.cachePath !== undefined;
    if (!entry || typeof entry.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(entry.id)
      || ids.has(entry.id) || !relativePath(entry.contractFile) || files.has(entry.contractFile)
      || hasView !== (entry.rebuildModule !== undefined)
      || (hasView && (!relativePath(entry.cachePath) || caches.has(entry.cachePath) || !relativePath(entry.rebuildModule)))) throw invalid('invalid or duplicate consumer');
    ids.add(entry.id);
    files.add(entry.contractFile);
    if (!hasView) return Object.freeze({ id: entry.id, contractFile: entry.contractFile });
    caches.add(entry.cachePath);
    return Object.freeze({ id: entry.id, contractFile: entry.contractFile, cachePath: entry.cachePath, rebuildModule: entry.rebuildModule });
  });
  cached = Object.freeze(entries);
  return cached;
}

/** Absolute contract paths for Registry::load_files; stream/type data stays in those files. */
export function registryFiles() {
  return consumers().map(entry => path.join(OWN_PAYLOAD_ROOT, entry.contractFile));
}

/** Called by the CLI rebuild route only; normal store loading imports no consumer. */
export function loadRebuildModule(id) {
  const entry = consumers().find(entry => entry.id === id);
  if (!entry) throw invalid(`unknown consumer: ${id}`);
  if (entry.rebuildModule === undefined) throw invalid(`consumer keeps no view to rebuild: ${id}`);
  return import(pathToFileURL(path.join(OWN_PAYLOAD_ROOT, entry.rebuildModule)).href);
}
