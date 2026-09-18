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
      `git add package.json package-lock.json CHANGELOG.md`,
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

Updates package.json, package-lock.json, and CHANGELOG.md for a release.
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
