import { registerGitHandover } from '../holder-lock/native-handover.mjs';
// Loading and byte verification only. Git/Event Store policy stays in Rust.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { OWN_PAYLOAD_ROOT, releasePayloadManifest } from '../run-supervisor/payload-root.mjs';
const require = createRequire(import.meta.url);
let handover;
export function withNativeLocks(addon, handles, call) {
  if (!handover) handover = registerGitHandover(addon);
  return handover(handles, call);
}
const unavailable = (cause) => Object.assign(new Error(`git-addon-unavailable: ${cause}`), { code: 'git-addon-unavailable' });
export function loadNativeAddon({ hostBin = process.env.FGOS_HOST_BIN, descriptor } = {}) {
  let found = descriptor ?? releasePayloadManifest(hostBin);
  let packageDescriptor = false;
  if (!descriptor && found) {
    try {
      const payload = found.manifest.components?.legacyNode?.root;
      if (typeof payload !== 'string' || path.isAbsolute(payload) || payload.split(/[\\/]/).includes('..')
        || fs.realpathSync(path.join(found.releaseRoot, payload)) !== fs.realpathSync(OWN_PAYLOAD_ROOT)) found = null;
    } catch { found = null; }
  }
  if (!found) {
    try { found = { manifest: JSON.parse(fs.readFileSync(path.join(OWN_PAYLOAD_ROOT, 'native-addon.json'), 'utf8')), releaseRoot: OWN_PAYLOAD_ROOT }; packageDescriptor = true; } catch (err) { if (err.code !== 'ENOENT') throw unavailable(`invalid descriptor: ${err.message}`); }
  }
  if (!found || (!descriptor && !packageDescriptor && !found.manifest.components?.nativeAddon)) throw Object.assign(unavailable('this npm/legacy Node channel does not ship the required Event Store native addon; fgos init cannot initialize this channel. Install and activate a complete fgctl release containing components.nativeAddon, then run fgos init again'), { code: 'git-addon-not-shipped' });
  const entry = found?.manifest?.components?.nativeAddon;
  if (!entry || typeof entry.path !== 'string' || path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).some(p => p === '..' || p === '')) throw unavailable('missing or unsafe addon path');
  if (entry.target !== `${process.platform}-${process.arch}` || entry.napiVersion !== 8 || Number(process.versions.napi) < 8) throw unavailable('target or Node-API mismatch');
  try {
    const root = fs.realpathSync(found.releaseRoot);
    const file = fs.realpathSync(path.join(root, entry.path));
    if (!file.startsWith(`${root}${path.sep}`)) throw unavailable('addon escaped release');
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== entry.digest) throw unavailable('digest mismatch');
    const addon = require(file);
    const helper = found.manifest.entries?.fgos;
    if (typeof helper === 'string' && helper && !path.isAbsolute(helper) && !helper.split(/[\\/]/).includes('..')) {
      const resolved = fs.realpathSync(path.join(root, helper));
      if (!resolved.startsWith(`${root}${path.sep}`)) throw unavailable('helper escaped release');
      addon.helperExe = resolved;
    }
    const versions = addon.versions(); // Enforce the process marker before exposing either crate.
    if (versions.napi !== entry.napiVersion || typeof versions.git !== 'string' || typeof versions.eventStore !== 'string') throw unavailable('combined addon ABI mismatch');
    if (!handover) handover = registerGitHandover(addon);
    return addon;
  } catch (err) {
    if (err.message.includes('git-addon-second-load')) throw Object.assign(err, { code: 'git-addon-second-load' });
    throw unavailable(err.message);
  }
}
