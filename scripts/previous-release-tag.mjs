#!/usr/bin/env node
/**
 * Resolves the release the external-consumer proof upgrades from: the newest
 * published release that precedes the candidate (a release published later, such
 * as a hotfix of an older line or a newer version, is never the one to upgrade from). Only tags that parse as release
 * versions count, so `archive/*`, phase markers and other non-release tags never
 * qualify. Prints the tag; the proof logs it, so a wrong pick is visible.
 *
 * Usage: node scripts/previous-release-tag.mjs --candidate <tag> [--repo <owner/name>]
 * Exit:  0 tag printed; 3 no earlier release exists (the first release); 1 the release
 *        list could not be read (the proof must fail, never skip).
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReleaseVersion } from './prepare-release.mjs';

export const EXIT_NO_PREVIOUS = 3;

// Semver precedence: base version numerically, then a release outranks its own
// prerelease, then prerelease fields left to right (numeric below alphanumeric).
function compareReleases(a, b) {
  const [pa, pb] = [a, b].map((version) => {
    const { baseVersion, prerelease } = parseReleaseVersion(version);
    return { base: baseVersion.split('.').map(Number), pre: prerelease ? prerelease.split(/[.-]/) : null };
  });
  for (let i = 0; i < 3; i += 1) {
    if (pa.base[i] !== pb.base[i]) return pa.base[i] - pb.base[i];
  }
  if (!pa.pre || !pb.pre) return Number(!pa.pre) - Number(!pb.pre);
  for (let i = 0; i < Math.min(pa.pre.length, pb.pre.length); i += 1) {
    const [x, y] = [pa.pre[i], pb.pre[i]];
    const [xNum, yNum] = [/^\d+$/.test(x), /^\d+$/.test(y)];
    if (xNum && yNum && Number(x) !== Number(y)) return Number(x) - Number(y);
    if (xNum !== yNum) return xNum ? -1 : 1;
    if (!xNum && x !== y) return x < y ? -1 : 1;
  }
  return pa.pre.length - pb.pre.length;
}

const isReleaseTag = (name) => {
  try {
    return parseReleaseVersion(name).tag === name;
  } catch {
    return false;
  }
};

// A pull-request proof packages the product's own version as `v<version>-assets-check`, which is the
// unreleased `v<version>` for ordering; every other candidate orders as itself.
const ASSETS_CHECK_SUFFIX = /-assets-check$/;

/**
 * The newest release tag in `tags` that precedes `candidate`, or `null` when none does.
 * Throws when `candidate` is not a release version.
 */
export function previousReleaseTag(tags, candidate) {
  parseReleaseVersion(candidate);
  const position = candidate.replace(ASSETS_CHECK_SUFFIX, '');
  const earlier = tags.filter((tag) => isReleaseTag(tag) && tag !== candidate && compareReleases(tag, position) < 0);
  return earlier.sort(compareReleases).at(-1) ?? null;
}

function publishedReleaseTags(repo) {
  const args = ['release', 'list', '--limit', '200', '--json', 'tagName', '--jq', '.[].tagName'];
  if (repo) args.push('--repo', repo);
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function main(argv) {
  const opts = { candidate: '', repo: process.env.GITHUB_REPOSITORY || '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--candidate') opts.candidate = argv[++i] || '';
    else if (argv[i] === '--repo') opts.repo = argv[++i] || '';
    else throw new Error(`Unexpected argument: ${argv[i]}`);
  }
  if (!opts.candidate) throw new Error('Usage: previous-release-tag.mjs --candidate <tag> [--repo <owner/name>]');
  let tags;
  try {
    tags = publishedReleaseTags(opts.repo);
  } catch (err) {
    throw new Error(`Cannot list the published releases (gh release list): ${err.stderr?.toString().trim() || err.message}`);
  }
  const previous = previousReleaseTag(tags, opts.candidate);
  if (!previous) {
    console.error(`No release earlier than ${opts.candidate} among ${tags.length} published release(s)`);
    return EXIT_NO_PREVIOUS;
  }
  console.log(previous);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
