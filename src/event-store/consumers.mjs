// Data only. Consumers retain ownership of their contracts and rebuild code.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { OWN_PAYLOAD_ROOT } from '../run-supervisor/payload-root.mjs';

function available() {
  if (process.platform !== 'linux') {
    throw Object.assign(new Error('event-store-unsupported-platform'), { code: 'event-store-unsupported-platform' });
  }
}
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
  available();
  if (cached) return cached;
  const manifest = JSON.parse(fs.readFileSync(path.join(OWN_PAYLOAD_ROOT, 'packages/event-store/contracts/consumers.v1.json'), 'utf8'));
  if (manifest.v !== 1 || !Array.isArray(manifest.consumers)) throw invalid('unsupported manifest');
  const ids = new Set();
  const files = new Set();
  const entries = manifest.consumers.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(entry.id)
      || ids.has(entry.id) || !relativePath(entry.contractFile) || files.has(entry.contractFile)
      || !relativePath(entry.cachePath) || !relativePath(entry.rebuildModule)) throw invalid('invalid or duplicate consumer');
    ids.add(entry.id);
    files.add(entry.contractFile);
    return Object.freeze({ id: entry.id, contractFile: entry.contractFile, cachePath: entry.cachePath, rebuildModule: entry.rebuildModule });
  });
  cached = Object.freeze(entries);
  return cached;
}

/** Absolute contract paths for Registry::load_files; stream/type data stays in those files. */
export function registryFiles() {
  available();
  return consumers().map(entry => path.join(OWN_PAYLOAD_ROOT, entry.contractFile));
}

/** Called by the CLI rebuild route only; normal store loading imports no consumer. */
export function loadRebuildModule(id) {
  available();
  const entry = consumers().find(entry => entry.id === id);
  if (!entry) throw invalid(`unknown consumer: ${id}`);
  return import(pathToFileURL(path.join(OWN_PAYLOAD_ROOT, entry.rebuildModule)).href);
}
