// The legacy-node payload root of a release, read from the manifest that sits next to its host binary.
// The controller writes it into the envelope; the attempt step checks it again from the other side.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The payload this module belongs to (the checkout or release tree that holds src/). */
export const OWN_PAYLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function realpathOrNull(p) {
  try { return fs.realpathSync(p); } catch { return null; }
}

/**
 * The legacy-node payload root of the release that holds `hostBin`, read from that release's
 * manifest the way apps/fgos/src/legacy_exec.rs finds it: next to the host binary, never through
 * PATH, the cwd or the active-release variables (the active release may be another one by now).
 */
export function releasePayloadRoot(hostBin) {
  const host = realpathOrNull(hostBin);
  if (!host) return null;
  const up = (n) => { let p = host; for (let i = 0; i < n; i += 1) p = path.dirname(p); return p; };
  const candidates = [
    [up(3), path.join(up(3), 'manifest.json')],
    [up(3), path.join(up(3), 'target', 'dev-manifest.json')],
    [up(2), path.join(up(2), 'manifest.json')],
  ];
  for (const [releaseRoot, manifestPath] of candidates) {
    if (!fs.existsSync(manifestPath)) continue;
    let root;
    try { root = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))?.components?.legacyNode?.root; } catch { continue; }
    if (typeof root !== 'string' || path.isAbsolute(root) || root.split(/[\\/]/).includes('..')) continue;
    return realpathOrNull(path.join(releaseRoot, root));
  }
  return null;
}
