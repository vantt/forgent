// Merges the junit reports of the test shards into one full.xml and proves the shards that ran are exactly the
// discovered suite. Usage: node scripts/merge-test-shards.mjs --dir <shards-dir> --out <dir>
// The shards-dir holds one `test-shard-*` directory per shard, each with `shard-<k>-of-<n>.xml`, `shard-<k>-of-<n>.files.json`
// (the files the shard was given) and `test-marker.json`.
// `--manifest k/n --out <file>` writes that shard's file list instead.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { REPO_ROOT } from './lib/git-addon-stage.mjs';
import { checkShardSet, parseShard, junitFiles, junitSeconds, junitUnattributable, measuredImbalance, mergeJunit, repoRelative } from './lib/test-shards.mjs';
import { discoverTestFiles, selectShard } from './run-tests.mjs';

const SHARD_XML = /^shard-(\d+)-of-(\d+)\.xml$/;

function readMarker(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function readManifest(file) {
  try {
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(list) && list.every((f) => typeof f === 'string') ? new Set(list) : null;
  } catch {
    return null;
  }
}

/** The repo-relative files shard `spec` (`k/n`) is given: the partition `npm test -- --shard=k/n` runs. */
export async function shardManifest(spec, { repoRoot = REPO_ROOT } = {}) {
  const shard = parseShard(spec);
  const { readSuiteBaseline } = await import('./test-proof-inventory.mjs');
  return selectShard(discoverTestFiles(), shard, readSuiteBaseline().fileCpu, repoRoot).map((f) => repoRelative(repoRoot, f));
}

/**
 * Merges every shard report under `dir` into `<out>/full.xml`. Returns `{ problems, exitCode }`; problems is empty
 * only when each shard completed and together they ran every discovered file exactly once. `imbalance` is the
 * slowest shard's measured test seconds over the mean (the number the shard balance is judged by), or null.
 */
export function mergeShards({ dir, out, repoRoot = REPO_ROOT, discovered = discoverTestFiles().map((f) => repoRelative(REPO_ROOT, f)) }) {
  const problems = [];
  const shards = [];
  const reports = [];
  const seconds = [];
  let exitCode = 0;
  const dirs = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('test-shard-')).map((e) => e.name).sort() : [];
  for (const name of dirs) {
    const xmls = fs.readdirSync(path.join(dir, name)).filter((f) => SHARD_XML.test(f)).sort();
    if (xmls.length !== 1) {
      problems.push(`${name} holds ${xmls.length} shard reports, expected 1`);
      continue;
    }
    const [, index, total] = SHARD_XML.exec(xmls[0]);
    const xml = fs.readFileSync(path.join(dir, name, xmls[0]), 'utf8');
    const manifest = readManifest(path.join(dir, name, `shard-${index}-of-${total}.files.json`));
    if (!manifest) problems.push(`${name} has no readable shard-${index}-of-${total}.files.json`);
    const marker = readMarker(path.join(dir, name, 'test-marker.json'));
    if (!marker || marker.completed !== true) problems.push(`${name} has no completed test-marker.json`);
    exitCode = Math.max(exitCode, Number.isInteger(marker?.exitCode) ? marker.exitCode : 1);
    shards.push({ index: Number(index), total: Number(total), files: junitFiles(xml, repoRoot), manifest, unattributable: junitUnattributable(xml) });
    reports.push(xml);
    seconds.push({ index: Number(index), seconds: junitSeconds(xml) });
  }
  problems.push(...checkShardSet(discovered, shards));
  if (reports.length > 0) {
    try {
      const merged = mergeJunit(reports);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, 'full.xml'), merged);
    } catch (err) {
      problems.push(err.message);
    }
  }
  return { problems, exitCode: problems.length > 0 ? exitCode || 1 : exitCode, imbalance: measuredImbalance(seconds) };
}

if (isMainModule(import.meta.url)) {
  const argv = process.argv.slice(2);
  let dir = null;
  let out = null;
  let manifest = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--manifest') manifest = argv[++i];
    if (argv[i] === '--dir') dir = argv[++i];
    if (argv[i] === '--out') out = argv[++i];
  }
  if (manifest && out) {
    try {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, `${JSON.stringify(await shardManifest(manifest), null, 1)}\n`);
    } catch (err) {
      console.error(`merge-test-shards: ERROR: ${err.message}`);
      process.exit(1);
    }
    process.exit(0);
  }
  if (!dir || !out) {
    console.error('merge-test-shards: ERROR: usage: --dir <shards-dir> --out <dir>');
    process.exit(2);
  }
  const { problems, exitCode, imbalance } = mergeShards({ dir, out });
  for (const problem of problems) console.error(`merge-test-shards: ERROR: ${problem}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `exit_code=${exitCode}\n`);
  if (imbalance) console.log(`merge-test-shards: imbalance max/mean = ${imbalance.ratio.toFixed(2)} (shard ${imbalance.slowest} slowest)`);
  if (problems.length === 0) console.log(`merge-test-shards: ${fs.readdirSync(dir).filter((d) => d.startsWith('test-shard-')).length} shards cover every test file exactly once`);
  process.exit(problems.length > 0 ? 1 : 0);
}
