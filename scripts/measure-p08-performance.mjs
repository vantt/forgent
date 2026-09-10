#!/usr/bin/env node
// Measures P08's two Decisions-table performance budgets (plan.md, phase-08
// R9) warm on this machine and writes
// plans/260910-1700-rust-host-r1-kernel/reports/p08-performance.json.
// Requires `cargo build -p fgos` (or `cargo build --workspace`) and
// `target/dev-manifest.json` to already exist -- run
// `node scripts/run-rust-dev-host.mjs version` once first if either is
// missing.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const rustBin = path.join(repoRoot, 'target', 'debug', 'fgos');
const nodeBin = path.join(repoRoot, 'bin', 'fgos.mjs');
const devManifestPath = path.join(repoRoot, 'target', 'dev-manifest.json');

if (!fs.existsSync(rustBin)) {
  console.error(`${rustBin} does not exist -- run "cargo build -p fgos" first.`);
  process.exit(1);
}
if (!fs.existsSync(devManifestPath)) {
  console.error(`${devManifestPath} does not exist -- run "node scripts/run-rust-dev-host.mjs version" once first.`);
  process.exit(1);
}

const baseEnv = {
  ...process.env,
  FGOS_ACTIVE_RELEASE_PATH: repoRoot,
  FGOS_ACTIVE_MANIFEST_PATH: devManifestPath,
};

function timeOnce(cmd, args, env) {
  const t0 = performance.now();
  const res = spawnSync(cmd, args, { cwd: repoRoot, env, stdio: 'ignore' });
  const t1 = performance.now();
  if (res.status !== 0 && res.status !== null) {
    throw new Error(`command failed (${res.status}): ${cmd} ${args.join(' ')}`);
  }
  return t1 - t0;
}

function p50(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

const WARMUP = 5;
const SAMPLES = 51;

// Warm up both paths.
for (let i = 0; i < WARMUP; i++) {
  timeOnce(rustBin, ['ready'], baseEnv);
  timeOnce('node', [nodeBin, 'ready'], baseEnv);
  timeOnce(rustBin, ['version'], baseEnv);
}

const rustReadySamples = [];
const nodeReadySamples = [];
for (let i = 0; i < SAMPLES; i++) {
  rustReadySamples.push(timeOnce(rustBin, ['ready'], baseEnv));
  nodeReadySamples.push(timeOnce('node', [nodeBin, 'ready'], baseEnv));
}

const nativeVersionSamples = [];
for (let i = 0; i < SAMPLES; i++) {
  nativeVersionSamples.push(timeOnce(rustBin, ['version'], baseEnv));
}

const rustReadyP50 = p50(rustReadySamples);
const nodeReadyP50 = p50(nodeReadySamples);
const legacyExecOverheadP50 = rustReadyP50 - nodeReadyP50;
const nativeVersionP50 = p50(nativeVersionSamples);

const report = {
  machine: {
    platform: os.platform(),
    arch: os.arch(),
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
    cpuCount: os.cpus().length,
    referenceTarget: 'x86_64-unknown-linux-gnu',
  },
  measuredAt: new Date().toISOString(),
  sampleCount: SAMPLES,
  warmupCount: WARMUP,
  legacyExecOverhead: {
    definition: 'wall time of `fgos <legacy selector>` through the Rust CLI minus direct `node <payload> <selector>`, both warm',
    selector: 'ready',
    rustCliP50Ms: Number(rustReadyP50.toFixed(3)),
    directNodeP50Ms: Number(nodeReadyP50.toFixed(3)),
    overheadP50Ms: Number(legacyExecOverheadP50.toFixed(3)),
    thresholdMs: 25,
    withinThreshold: legacyExecOverheadP50 <= 25,
  },
  nativeVersion: {
    definition: 'wall time of `fgos version` through the native route',
    p50Ms: Number(nativeVersionP50.toFixed(3)),
    thresholdMs: 10,
    withinThreshold: nativeVersionP50 <= 10,
  },
  findings: [],
};

if (!report.legacyExecOverhead.withinThreshold) {
  report.findings.push(
    `legacy exec overhead p50 (${report.legacyExecOverhead.overheadP50Ms}ms) exceeds the ${report.legacyExecOverhead.thresholdMs}ms budget`
  );
}
if (!report.nativeVersion.withinThreshold) {
  report.findings.push(
    `native version p50 (${report.nativeVersion.p50Ms}ms) exceeds the ${report.nativeVersion.thresholdMs}ms budget`
  );
}

const outPath = path.join(
  repoRoot,
  'plans',
  '260910-1700-rust-host-r1-kernel',
  'reports',
  'p08-performance.json'
);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
console.log(`\nwritten to ${outPath}`);
