// The one in-process door to the combined native addon: locate, verify and load it once per process.
// Lazy: nothing loads at import time. Git, process facts, durable files, canonical JSON and YAML all go through here.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { OWN_PAYLOAD_ROOT, releasePayloadManifest } from '../run-supervisor/payload-root.mjs';
import { resolveActiveHostBin } from '../util/host-bin-path.mjs';
const require = createRequire(import.meta.url);
const verified = new Map(); // file -> identity key verified in this process
let loaded = null; // the one { file, addon } of this process
let own = null;
const helperExes = new WeakMap(); // the release's own `fgos` host beside each loaded addon
const unavailable = (cause) => Object.assign(new Error(`git-addon-unavailable: ${cause}`), { code: 'git-addon-unavailable' });
const safeRelative = (p) => typeof p === 'string' && p && !path.isAbsolute(p) && !p.split(/[\\/]/).some(s => s === '..' || s === '');
/** The verified `fgos` host executable of the release `addon` was loaded from, or null. */
export const nativeHelperExe = (addon) => helperExes.get(addon) ?? null;
/** The typed fields a native port error carries (`cause`, `stderr` bytes, ...), or undefined for an error that is not one. */
const nativeFields = (error) => { try { return JSON.parse(error.message); } catch { return undefined; } };
/** A native port error as its typed fields; an error that is not one keeps its message as the cause. */
export const nativeError = (error) => nativeFields(error) ?? { cause: error.message ?? error.code, stderr: [] };
// A release manifest counts only when its payload is this running payload: a cwd's activation may be another release.
function ownRelease(bin) {
  const found = releasePayloadManifest(bin);
  try {
    const payload = found?.manifest.components?.legacyNode?.root;
    return typeof payload === 'string' && !path.isAbsolute(payload) && !payload.split(/[\\/]/).includes('..')
      && fs.realpathSync(path.join(found.releaseRoot, payload)) === fs.realpathSync(OWN_PAYLOAD_ROOT) ? found : null;
  } catch { return null; }
}
/** Load the addon named by `descriptor`, else this payload's own release: FGOS_HOST_BIN, then the cwd's activation, then
 * `native-addon.json`. `hostBin: null` skips the host lookups. A second, different file in one process is refused by name. */
export function loadNativeAddon({ hostBin, descriptor } = {}) {
  let found = descriptor ?? ownRelease(hostBin === undefined ? resolveActiveHostBin({ cwd: process.cwd() }).bin : hostBin);
  let packageDescriptor = false;
  if (!found) {
    try { found = { manifest: JSON.parse(fs.readFileSync(path.join(OWN_PAYLOAD_ROOT, 'native-addon.json'), 'utf8')), releaseRoot: OWN_PAYLOAD_ROOT }; packageDescriptor = true; } catch (err) { if (err.code !== 'ENOENT') throw unavailable(`invalid descriptor: ${err.message}`); }
  }
  if (!found || (!descriptor && !packageDescriptor && !found.manifest.components?.nativeAddon)) throw Object.assign(unavailable('addon not shipped on this channel: onboard this project with `fgctl init`'), { code: 'git-addon-not-shipped' });
  const entry = found.manifest?.components?.nativeAddon;
  if (!entry || !safeRelative(entry.path)) throw unavailable('missing or unsafe addon path');
  if (entry.target !== `${process.platform}-${process.arch}` || entry.napiVersion !== 8 || Number(process.versions.napi) < 8) throw unavailable('target or Node-API mismatch');
  try {
    const root = fs.realpathSync(found.releaseRoot);
    if (fs.lstatSync(path.join(root, entry.path)).isSymbolicLink()) throw unavailable('addon is a symlink');
    const file = fs.realpathSync(path.join(root, entry.path));
    if (!file.startsWith(`${root}${path.sep}`)) throw unavailable('addon escaped release');
    if (loaded && loaded.file !== file) throw new Error(`git-addon-second-load: ${loaded.file} is loaded, ${file} refused`);
    // Hash once per process per file identity; any stat change verifies again.
    const stat = fs.statSync(file, { bigint: true });
    const identity = `${found.manifest.artifactDigest}:${entry.digest}:${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
    if (verified.get(file) !== identity) {
      if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.digest) throw unavailable('digest mismatch');
      verified.set(file, identity);
    }
    if (loaded) return loaded.addon;
    const addon = require(file);
    const helper = found.manifest.entries?.fgos;
    if (safeRelative(helper)) {
      const resolved = fs.realpathSync(path.join(root, helper));
      if (!resolved.startsWith(`${root}${path.sep}`)) throw unavailable('helper escaped release');
      helperExes.set(addon, resolved);
    }
    const v = addon.versions(); // Enforce the process marker before exposing any crate.
    if (v.napi !== entry.napiVersion || typeof v.git !== 'string' || typeof v.eventStore !== 'string' || typeof v.process !== 'number' || typeof v.durableFile !== 'string' || typeof v.canonicalJson !== 'number' || typeof v.holderLock !== 'number' || typeof v.sessionIdentity !== 'number' || typeof v.yaml !== 'number') throw unavailable('combined addon ABI mismatch');
    loaded = { file, addon };
    return addon;
  } catch (err) {
    if (err.message.includes('git-addon-second-load')) throw Object.assign(err, { code: 'git-addon-second-load' });
    throw unavailable(err.message);
  }
}
/** The addon of this process, memoised: the one a descriptor already loaded (the release builder reads a checkout with the
 * addon it just built), else this payload's own release. A process holds one addon, so a second file is refused anyway. */
export const nativeDoor = () => own ??= loaded?.addon ?? loadNativeAddon();
/** The value of a JSON text an addon entry returned. `JSON.parse` defines each key as an own property, so a `__proto__`
 * key stays data; `special` lists `[path, 'nan' | 'inf' | '-inf']` for the floats JSON has no form for. */
export function fromDoorJson(text, { special = [] } = {}) {
  let value = JSON.parse(text);
  for (const [path, word] of special) {
    const restored = word === 'nan' ? NaN : word === 'inf' ? Infinity : -Infinity;
    if (path.length === 0) { value = restored; continue; }
    const parent = path.slice(0, -1).reduce((node, key) => node[key], value);
    Object.defineProperty(parent, path.at(-1), { value: restored, writable: true, enumerable: true, configurable: true });
  }
  return value;
}
const notJson = (cause) => Object.assign(new Error(`canonical-json-not-json: ${cause}`), { code: 'canonical-json-not-json' });
/** The replacer that makes `JSON.stringify` refuse what it would silently turn into `null` or drop from an array. */
function validating(key, value) {
  if (typeof value === 'function') throw new TypeError(`${key === '' ? 'the value' : `"${key}"`} is a function`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError(`${key === '' ? 'the value' : `"${key}"`} is ${value}`);
  if (value === undefined && Array.isArray(this)) throw new TypeError(`array member ${key} is undefined or a hole`);
  return value;
}
/** RFC 8785 bytes of `value`, serialised as `JSON.stringify` does (`toJSON` honoured, an `undefined` member absent) and canonicalised from the text. A hole, an `undefined` array member, a non-finite number, a `bigint` or a function is refused by name. */
export function canonicalJson(value) {
  let text;
  try { text = JSON.stringify(value, validating); } catch (err) { throw notJson(err.message); }
  if (text === undefined) throw notJson('the value has no JSON form');
  try { return nativeDoor().canonicalJson.canonicalJson(text); } catch (err) { throw err.code === 'InvalidArg' ? notJson(err.message) : err; }
}
/** Write `bytes` to `dir/name` durably, replacing any file; `mode` is explicit. A failure removes the retained temporary and carries `installed`. */
export const replaceDurably = (dir, name, bytes, mode) => durable('replaceDurably', dir, name, bytes, mode);
/** Install `bytes` as `dir/name` without replacing: `'created'` or `'already-exists'`. */
export const installOnce = (dir, name, bytes, mode) => durable('installOnce', dir, name, bytes, mode);
function durable(call, dir, name, bytes, mode) {
  if (!Number.isInteger(mode) || mode < 0 || mode > 0o7777) {
    throw Object.assign(new Error(`durable-file-mode-invalid: mode must be an integer from 0 to 0o7777, got ${JSON.stringify(mode)}`), { code: 'durable-file-mode-invalid', installed: 'none' });
  }
  try { return nativeDoor().durableFile[call](dir, name, Buffer.from(bytes), mode); } catch (err) {
    const fields = nativeFields(err) ?? {};
    if (fields.temporary) fs.rmSync(fields.temporary, { force: true });
    if (fields.cause) err.message = `durable-file-${call}: ${fields.cause}`;
    throw Object.assign(err, { installed: fields.installed ?? 'none' });
  }
}
