#!/usr/bin/env node
/**
 * Packages this host's release assets, exactly as the release workflow ships them.
 *
 * Needs `cargo build --release --workspace` to have run on this host. Writes into
 * --out (default dist/), for the one target this host builds:
 *
 *   fgos-<version>-<target>.tar.gz    the release tree (bin/, libexec/, manifest.json)
 *   fgctl-<version>-<target>.tar.gz   the fgctl binary alone
 *   install.sh, install.ps1           the installers, copied unchanged
 *   SHA256SUMS                        a sha256sum-style line per tar.gz above
 *
 * Usage: node scripts/package-release-assets.mjs --version <tag> [--out <dir>]
 *
 * The one place the asset names, the archive layout and the checksum file are
 * defined, so a release, the CI consumer proof and a local dry run can never
 * package differently.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, buildRustDistribution } from './build-rust-distribution.mjs';
import { releaseBinaryPath } from '../src/util/release-binary-path.mjs';
import { releaseTargetForHost } from '../src/util/release-targets.mjs';

const TAG_PATTERN = /^[A-Za-z0-9._+-]+$/;

/** Asset file name for `kind` (`fgos` or `fgctl`), release `version` and `target`. */
export function assetName(kind, version, target) {
  return `${kind}-${version}-${target}.tar.gz`;
}

/** `sha256sum`-style lines (`<hash>  <name>`), one per file, sorted by name. */
export function checksumLines(files) {
  return [...files]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((f) => `${f.sha256}  ${f.name}\n`)
    .join('');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The tar to archive with. On Windows the bsdtar in System32 is what every
 * consumer extracts with and, unlike a GNU tar earlier on PATH (Git for
 * Windows), takes Windows paths.
 */
function tarExecutable() {
  if (process.platform === 'win32' && process.env.SystemRoot) {
    const system = path.join(process.env.SystemRoot, 'System32', 'tar.exe');
    if (fs.existsSync(system)) return system;
  }
  return 'tar';
}

/** Runs tar from `cwd` with relative paths only (no drive letters for a GNU tar to misread). */
function tarCreate(cwd, archive, sourceDir, entries) {
  const result = spawnSync(tarExecutable(), ['-czf', archive, '-C', sourceDir, ...entries], {
    cwd,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`tar failed (exit ${result.status}) creating ${archive}`);
  }
}

function toPosixRelative(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

export function packageReleaseAssets({ version, outDir = path.join(REPO_ROOT, 'dist'), repoRoot = REPO_ROOT } = {}) {
  if (!version || !TAG_PATTERN.test(version)) {
    throw new Error(`--version <tag> is required and may hold only letters, digits, '.', '_', '+' and '-' (got ${JSON.stringify(version)})`);
  }
  const target = releaseTargetForHost();
  if (!target) {
    throw new Error(`no release is published for ${process.arch}-${process.platform}`);
  }

  const out = path.resolve(outDir);
  fs.mkdirSync(out, { recursive: true });
  const treeDir = path.join(out, 'tree');
  buildRustDistribution({ outDir: treeDir, repoRoot });

  const fgosAsset = assetName('fgos', version, target.triple);
  tarCreate(out, fgosAsset, 'tree', ['.']);

  const releaseDir = path.join(repoRoot, 'target', 'release');
  const fgctlBin = releaseBinaryPath(releaseDir, 'fgctl');
  if (!fs.existsSync(fgctlBin)) {
    throw new Error(`Compiled fgctl not found at ${fgctlBin}. Run "cargo build --release --workspace" first.`);
  }
  const fgctlAsset = assetName('fgctl', version, target.triple);
  tarCreate(out, fgctlAsset, toPosixRelative(out, path.dirname(fgctlBin)), [path.basename(fgctlBin)]);

  for (const installer of ['install.sh', 'scripts/install.ps1']) {
    fs.copyFileSync(path.join(repoRoot, installer), path.join(out, path.basename(installer)));
  }

  const checksummed = [fgosAsset, fgctlAsset].map((name) => ({ name, sha256: sha256File(path.join(out, name)) }));
  fs.writeFileSync(path.join(out, 'SHA256SUMS'), checksumLines(checksummed));
  return { outDir: out, target: target.triple, assets: [fgosAsset, fgctlAsset, 'install.sh', 'install.ps1', 'SHA256SUMS'] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  let version = null;
  let outDir;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) version = args[++i];
    else if (args[i] === '--out' && args[i + 1]) outDir = args[++i];
    else {
      console.error(`Unrecognized argument: ${args[i]}`);
      console.error('Usage: node scripts/package-release-assets.mjs --version <tag> [--out <dir>]');
      process.exit(1);
    }
  }
  try {
    const result = packageReleaseAssets({ version, ...(outDir ? { outDir } : {}) });
    console.log(`Packaged ${result.target} assets into ${result.outDir}:`);
    for (const name of result.assets) console.log(`  ${name}`);
  } catch (err) {
    console.error(`Packaging failed: ${err.message}`);
    process.exit(1);
  }
}
