#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const VERSION_RE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*))?$/;

export function parseReleaseVersion(input) {
  const raw = String(input || '').trim();
  const match = VERSION_RE.exec(raw);
  if (!match) {
    throw new Error(`Release version must be semver, with optional leading "v" and prerelease: ${raw || '(empty)'}`);
  }

  const baseVersion = `${match[1]}.${match[2]}.${match[3]}`;
  const prerelease = match[4] || '';
  const tag = prerelease ? `v${baseVersion}-${prerelease}` : `v${baseVersion}`;
  return { baseVersion, prerelease, tag };
}

export function assertIsoDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    throw new Error(`Release date must use YYYY-MM-DD: ${date || '(empty)'}`);
  }
}

export function updatePackageJsonText(text, baseVersion) {
  const parsed = JSON.parse(text);
  parsed.version = baseVersion;
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function updatePackageLockText(text, baseVersion) {
  const parsed = JSON.parse(text);
  parsed.version = baseVersion;
  if (parsed.packages && parsed.packages['']) {
    parsed.packages[''].version = baseVersion;
  }
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

// Rust crates share the npm package's version. The root manifest carries it for
// every workspace member (`version.workspace = true`); the two crates outside
// the workspace carry their own literal. Lockfiles list every path crate.
export const RUST_VERSION_MANIFESTS = ['Cargo.toml', 'apps/fgos-gateway/Cargo.toml', 'herdr-dashboard/Cargo.toml'];
export const RUST_VERSION_LOCKFILES = ['Cargo.lock', 'apps/fgos-gateway/Cargo.lock', 'herdr-dashboard/Cargo.lock'];

// Sets the literal `version` of `[package]` / `[workspace.package]`; a manifest
// that inherits the workspace version has no literal and comes back unchanged.
export function updateCargoManifestText(text, baseVersion) {
  let section = '';
  return text
    .split('\n')
    .map((line) => {
      const header = /^\[([^\]]+)\]\s*$/.exec(line);
      if (header) {
        section = header[1];
        return line;
      }
      if ((section === 'package' || section === 'workspace.package') && /^version\s*=\s*"[^"]*"\s*$/.test(line)) {
        return `version = "${baseVersion}"`;
      }
      return line;
    })
    .join('\n');
}

// Sets the version of every path crate (a package block with no `source`).
export function updateCargoLockText(text, baseVersion) {
  return text
    .split('\n[[package]]\n')
    .map((block, index) => {
      if (index === 0 || /\nsource = /.test(`\n${block}`)) {
        return block;
      }
      return block.replace(/^(name = "[^"]*"\nversion = )"[^"]*"/, `$1"${baseVersion}"`);
    })
    .join('\n[[package]]\n');
}

// Every Rust version literal in the repo that differs from `baseVersion`.
export function findRustVersionDrift(root, baseVersion) {
  const drift = [];
  for (const [files, update] of [
    [RUST_VERSION_MANIFESTS, updateCargoManifestText],
    [RUST_VERSION_LOCKFILES, updateCargoLockText],
  ]) {
    for (const file of files) {
      const filePath = path.join(root, file);
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf8');
        if (update(text, baseVersion) !== text) {
          drift.push(file);
        }
      }
    }
  }
  return drift;
}

export function updateChangelogText(text, tag, date) {
  assertIsoDate(date);

  const unreleasedHeading = '## [Unreleased]';
  const start = text.indexOf(unreleasedHeading);
  if (start === -1) {
    throw new Error('CHANGELOG.md does not contain "## [Unreleased]"');
  }

  const afterHeading = start + unreleasedHeading.length;
  const nextReleaseMatch = /\n## \[[^\]]+\]/.exec(text.slice(afterHeading));
  const nextReleaseOffset = nextReleaseMatch ? afterHeading + nextReleaseMatch.index : text.length;
  const unreleasedBody = text.slice(afterHeading, nextReleaseOffset).trim();
  if (!unreleasedBody) {
    throw new Error('CHANGELOG.md has no Unreleased entries to move into the release heading');
  }

  if (text.includes(`## [${tag}]`)) {
    throw new Error(`CHANGELOG.md already contains a release heading for ${tag}`);
  }

  const before = text.slice(0, afterHeading);
  const after = text.slice(nextReleaseOffset).replace(/^\n+/, '\n');
  return `${before}\n\n## [${tag}] - ${date}\n\n${unreleasedBody}\n${after}`;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text);
}

function assertCleanGitStatus(repoRoot, execFile = execFileSync) {
  let out;
  try {
    out = execFile('git', ['-C', repoRoot, 'status', '--porcelain'], { encoding: 'utf8' });
  } catch (err) {
    throw new Error(`Unable to read git status before preparing release: ${err.message}`);
  }
  if (out.trim()) {
    throw new Error('Refusing to prepare a release with a dirty working tree. Commit or stash existing changes first.');
  }
}

export function prepareRelease({
  repoRoot = process.cwd(),
  version,
  date = new Date().toISOString().slice(0, 10),
  dryRun = false,
  skipCleanCheck = false,
  execFile = execFileSync,
} = {}) {
  const { baseVersion, tag } = parseReleaseVersion(version);
  assertIsoDate(date);
  const root = path.resolve(repoRoot);

  if (!skipCleanCheck) {
    assertCleanGitStatus(root, execFile);
  }

  const packagePath = path.join(root, 'package.json');
  const packageLockPath = path.join(root, 'package-lock.json');
  const changelogPath = path.join(root, 'CHANGELOG.md');

  const updates = [
    [packagePath, updatePackageJsonText(readText(packagePath), baseVersion)],
    [packageLockPath, updatePackageLockText(readText(packageLockPath), baseVersion)],
    [changelogPath, updateChangelogText(readText(changelogPath), tag, date)],
  ];

  for (const [files, update] of [
    [RUST_VERSION_MANIFESTS, updateCargoManifestText],
    [RUST_VERSION_LOCKFILES, updateCargoLockText],
  ]) {
    for (const file of files) {
      const filePath = path.join(root, file);
      if (fs.existsSync(filePath)) {
        updates.push([filePath, update(readText(filePath), baseVersion)]);
      }
    }
  }

  if (!dryRun) {
    for (const [filePath, nextText] of updates) {
      writeText(filePath, nextText);
    }
  }

  return {
    tag,
    baseVersion,
    date,
    dryRun,
    changedFiles: updates.map(([filePath]) => path.relative(root, filePath)),
    nextCommands: [
      `git add ${updates.map(([filePath]) => path.relative(root, filePath)).join(' ')}`,
      `git commit -m "chore: prepare ${tag}"`,
      `git tag ${tag}`,
      `git push origin HEAD ${tag}`,
    ],
  };
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    skipCleanCheck: false,
    date: new Date().toISOString().slice(0, 10),
    version: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--skip-clean-check') {
      opts.skipCleanCheck = true;
    } else if (arg === '--date') {
      opts.date = argv[++i];
    } else if (arg.startsWith('--date=')) {
      opts.date = arg.slice('--date='.length);
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (!opts.version) {
      opts.version = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/prepare-release.mjs <vX.Y.Z[-pre.N]> [--date YYYY-MM-DD] [--dry-run]

Updates package.json, package-lock.json, CHANGELOG.md and the Rust crate versions
(Cargo.toml, the Cargo.lock files) for a release.
The script refuses a dirty working tree unless --skip-clean-check is passed.
It never creates or pushes the git tag; it prints the exact commands to run next.`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }
  if (!opts.version) {
    throw new Error('Missing release version. Example: npm run release:prepare -- v0.2.0');
  }

  const result = prepareRelease(opts);
  const mode = result.dryRun ? 'would update' : 'updated';
  console.log(`Release ${result.tag} (${result.date}) ${mode}:`);
  for (const file of result.changedFiles) {
    console.log(`- ${file}`);
  }
  console.log('\nNext commands:');
  for (const command of result.nextCommands) {
    console.log(command);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
