// release-targets.mjs -- the one table of platforms a fgOS release is published
// for. The release tree builder, the release packaging script and the
// `rust-host-target-supported` doctor check all read it, so adding a platform
// (a macOS row, say) is one row here, one in the Rust `host_target` table
// (packages/distribution/rust/src/fetch.rs), one in each installer, and one
// release-workflow matrix entry -- not a hunt through scattered conditionals.
//
// PURE: data and lookups only. No fs, no child_process.

/**
 * @typedef {object} ReleaseTarget
 * @property {string} triple         release asset suffix and installer target name
 * @property {string} platform       Node's process.platform
 * @property {string} arch           Node's process.arch
 * @property {string} exeSuffix      suffix of a compiled binary under target/release
 * @property {{os: string, arch: string, libc?: string}} manifestTarget  manifest.json `target`
 */

/** @type {ReleaseTarget[]} */
export const RELEASE_TARGETS = [
  {
    triple: 'x86_64-unknown-linux-gnu',
    platform: 'linux',
    arch: 'x64',
    exeSuffix: '',
    manifestTarget: { os: 'linux', arch: 'x64', libc: 'glibc' },
  },
  {
    triple: 'x86_64-pc-windows-msvc',
    platform: 'win32',
    arch: 'x64',
    exeSuffix: '.exe',
    manifestTarget: { os: 'windows', arch: 'x64' },
  },
];

/** The release target for a host, or null when no release is published for it. */
export function releaseTargetForHost(platform = process.platform, arch = process.arch) {
  return RELEASE_TARGETS.find((t) => t.platform === platform && t.arch === arch) ?? null;
}

/** The release target with this triple, or null. */
export function releaseTargetByTriple(triple) {
  return RELEASE_TARGETS.find((t) => t.triple === triple) ?? null;
}

/**
 * The `target` a release tree built on this host declares. A host with no
 * published release (a developer's macOS machine) still builds a tree for tests
 * and local use; it declares the Linux target, as every tree did before a second
 * target existed.
 */
export function manifestTargetForHost(platform = process.platform, arch = process.arch) {
  const target = releaseTargetForHost(platform, arch) ?? RELEASE_TARGETS[0];
  return { ...target.manifestTarget };
}
