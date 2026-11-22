#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const manifestPath = path.join(repoRoot, 'docs', 'architecture-manifest.json');
const modelDir = path.join(repoRoot, 'packages', 'component-authority', 'model');

if (!fs.existsSync(manifestPath)) {
  console.error(`manifest-model-compare: manifest not found at ${manifestPath}`);
  process.exit(1);
}

const original = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const layersPath = path.join(modelDir, 'layers.json');
const tiersPath = path.join(modelDir, 'tiers.json');
const filesPath = path.join(modelDir, 'files.json');
const componentsPath = path.join(modelDir, 'components.json');
const doorsDir = path.join(modelDir, 'doors');

const layersData = JSON.parse(fs.readFileSync(layersPath, 'utf8'));
const tiersData = JSON.parse(fs.readFileSync(tiersPath, 'utf8'));
const filesData = JSON.parse(fs.readFileSync(filesPath, 'utf8'));
const componentsData = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));

const doorFiles = fs.readdirSync(doorsDir).filter((f) => f.endsWith('.json')).sort();
const modelDoors = doorFiles.map((file) => JSON.parse(fs.readFileSync(path.join(doorsDir, file), 'utf8')));

const reconstructed = {
  contract: layersData.contract ?? 'architecture-manifest.v1',
  map: 'docs/platform/architecture-map.md',
  layers: layersData.layers,
  rules: layersData.rules,
  components: componentsData.filter((c) => c.id !== 'component-authority').map((c) => c.id),
  domains: layersData.domains,
  tierNames: layersData.tierNames,
  tiers: tiersData.tiers,
  tierExceptions: tiersData.tierExceptions ?? [],
  doors: modelDoors,
  files: filesData,
};

const differences = [];

function deepEqual(a, b, keyPath) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) {
    differences.push(`${keyPath}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      differences.push(`${keyPath}: expected array, got ${typeof b}`);
      return false;
    }
    if (a.length !== b.length) {
      differences.push(`${keyPath}.length: expected ${a.length}, got ${b.length}`);
    }
    const max = Math.max(a.length, b.length);
    let ok = a.length === b.length;
    for (let i = 0; i < max; i++) {
      if (!deepEqual(a[i], b[i], `${keyPath}[${i}]`)) ok = false;
    }
    return ok;
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    const allKeys = new Set([...aKeys, ...bKeys]);
    let ok = true;
    for (const k of allKeys) {
      if (!(k in a)) {
        differences.push(`${keyPath}.${k}: missing in original`);
        ok = false;
      } else if (!(k in b)) {
        differences.push(`${keyPath}.${k}: missing in reconstructed`);
        ok = false;
      } else {
        if (!deepEqual(a[k], b[k], `${keyPath}.${k}`)) ok = false;
      }
    }
    return ok;
  }
  differences.push(`${keyPath}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
  return false;
}

// Compare top-level sections
for (const key of ['contract', 'map', 'layers', 'rules', 'components', 'domains', 'tierNames', 'tiers', 'tierExceptions', 'files']) {
  deepEqual(original[key], reconstructed[key], key);
}

// Compare doors by job
const origDoorsByJob = new Map();
for (const door of original.doors || []) {
  if (origDoorsByJob.has(door.job)) {
    differences.push(`original.doors duplicate job "${door.job}"`);
  }
  origDoorsByJob.set(door.job, door);
}

const modelDoorsByJob = new Map();
for (const door of modelDoors) {
  if (modelDoorsByJob.has(door.job)) {
    differences.push(`model.doors duplicate job "${door.job}"`);
  }
  modelDoorsByJob.set(door.job, door);
}

for (const [job, origDoor] of origDoorsByJob) {
  if (!modelDoorsByJob.has(job)) {
    differences.push(`doors["${job}"]: missing in model`);
  } else {
    deepEqual(origDoor, modelDoorsByJob.get(job), `doors["${job}"]`);
  }
}

for (const [job] of modelDoorsByJob) {
  if (!origDoorsByJob.has(job)) {
    differences.push(`doors["${job}"]: missing in original manifest`);
  }
}

if (differences.length > 0) {
  console.error(`manifest-model-compare: found ${differences.length} difference(s):`);
  for (const diff of differences) {
    console.error(`  - ${diff}`);
  }
  process.exit(1);
}

const summary = [
  'manifest-model-compare: 0 differences found.',
  `Verified against docs/architecture-manifest.json:`,
  `- contract: ${reconstructed.contract}`,
  `- layers: ${reconstructed.layers.join(', ')}`,
  `- rules: ${reconstructed.rules.join(', ')}`,
  `- domains: ${reconstructed.domains.join(', ')}`,
  `- components: ${reconstructed.components.join(', ')}`,
  `- tierNames: ${Object.keys(reconstructed.tierNames).length} tiers`,
  `- tiers: ${Object.keys(reconstructed.tiers).length} prefixes`,
  `- tierExceptions: ${reconstructed.tierExceptions.length} exceptions`,
  `- doors: ${reconstructed.doors.length} door rows`,
  `- files: ${Object.keys(reconstructed.files).length} mapped files`,
].join('\n');

console.log(summary);
