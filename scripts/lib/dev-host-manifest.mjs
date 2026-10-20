// The staged dev host's release manifest and environment: one shape for `npm run fgos:dev` and the
// `npm test` environment, so FGOS_ACTIVE_MANIFEST_PATH always names a complete release manifest.
import path from 'node:path';
import { computeArtifactDigest, hashFile, nativeAddonComponent } from '../build-rust-distribution.mjs';

/** Environment of the staged dev host. FGOS_HOST_BIN names the staged host itself, so a Node client
 * under `npm run fgos:dev` resolves the working-tree host and never the activated one. */
export function devHostEnv(baseEnv, { fgosBin, checkoutRoot, manifestPath }) {
  return {
    ...baseEnv,
    FGOS_HOST_BIN: fgosBin,
    FGOS_ACTIVE_RELEASE_PATH: checkoutRoot,
    FGOS_ACTIVE_MANIFEST_PATH: manifestPath,
  };
}

/**
 * The complete release manifest of a dev host: the checkout is the release root, `fgosBin` and
 * `addonFile` are staged files inside it. The one shape every `FGOS_ACTIVE_MANIFEST_PATH` carries.
 */
export function devHostManifest({ checkoutRoot, fgosBin, addonFile }) {
  const relative = (file) => path.relative(checkoutRoot, file).split(path.sep).join('/');
  const binaryRelative = relative(fgosBin);
  const addonRelative = relative(addonFile);
  const nativeAddon = nativeAddonComponent(addonFile, addonRelative, checkoutRoot);
  const legacyNodeDigest = hashFile(path.join(checkoutRoot, 'bin/fgos.mjs'));
  const manifestWithoutDigest = {
    schemaVersion: 1,
    entries: { fgos: binaryRelative },
    capabilities: ['git-wal-v1'],
    components: {
      nativeAddon,
      legacyNode: { root: '.', entry: 'bin/fgos.mjs', digest: legacyNodeDigest },
    },
    requires: { node: '>=18' },
    target: { os: process.platform, arch: process.arch },
    stateSchemas: { read: ['2'], write: ['2'], migrations: [] },
    files: [
      { path: addonRelative, kind: 'file', digest: `sha256:${nativeAddon.digest}`, mode: '644', class: 'immutable-runtime' },
      { path: 'bin/fgos.mjs', kind: 'file', digest: legacyNodeDigest, mode: '755', class: 'legacy-node' },
      { path: binaryRelative, kind: 'file', digest: hashFile(fgosBin), mode: '755', class: 'native-host' },
    ].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
  };
  return { ...manifestWithoutDigest, artifactDigest: computeArtifactDigest(manifestWithoutDigest) };
}
