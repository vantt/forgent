// test/component-authority/render.test.mjs — phase 5: generated ownership views
// stay byte-identical to the model, and a hand edit of a generated block fails
// --check naming the view.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkViews,
  computeViews,
  loadModel,
  main,
  startMarker,
  endMarker,
  writeViews,
} from '../../scripts/component-authority-render.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');

function seedTempRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-ca-render-'));
  const modelDir = path.join(tmp, 'packages', 'component-authority', 'model');
  fs.mkdirSync(path.join(modelDir, 'doors'), { recursive: true });
  fs.writeFileSync(path.join(modelDir, 'components.json'), JSON.stringify([
    {
      id: 'demo',
      meaning: 'demo component',
      layer: 'kernel',
      tier: 0,
      paths: ['packages/demo/'],
      owns: ['demo thing'],
      mustNotOwn: ['other thing'],
      spec: 'docs/platform/demo/spec.md',
      source: ['packages/demo/'],
      status: 'designed',
    },
    {
      id: 'cross',
      meaning: 'cross-area component',
      layer: 'kernel',
      tier: 0,
      paths: ['packages/cross/'],
      owns: ['cross thing'],
      mustNotOwn: [],
      spec: 'docs/platform/component-boundary.md',
      source: ['packages/cross/'],
      status: 'live',
    },
  ], null, 2));
  fs.writeFileSync(path.join(modelDir, 'decision-kinds.json'), '[]');
  fs.writeFileSync(path.join(modelDir, 'contracts.json'), JSON.stringify([
    {
      id: 'CTR-DEMO',
      canonical: 'CTR-DEMO',
      aliases: [],
      meaning: 'demo boundary ↔ other: detail that must not appear as boundary',
      provider: 'demo',
      consumers: ['cross'],
      path: 'packages/demo/contracts/demo.v1.json',
      evidence: [],
      status: 'live',
    },
    {
      id: 'CTR-PLANNED',
      canonical: 'CTR-PLANNED',
      aliases: [],
      meaning: 'planned side ↔ other side: no file yet',
      provider: 'cross',
      consumers: [],
      evidence: [],
      status: 'planned',
    },
    {
      id: 'CTR-NAMED-MISSING',
      canonical: 'CTR-NAMED-MISSING',
      aliases: [],
      meaning: 'named missing ↔ side: path printed even if absent',
      provider: 'cross',
      consumers: [],
      path: 'packages/missing/contracts/x.v1.json',
      evidence: [],
      status: 'planned',
    },
  ], null, 2));
  // Existing path so architecture-map-contracts can backtick it.
  fs.mkdirSync(path.join(tmp, 'packages/demo/contracts'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'packages/demo/contracts/demo.v1.json'), '{}\n', 'utf8');

  const docs = {
    'docs/platform/component-boundary.md': 'component-boundary',
    'docs/platform/README.md': 'readme-owner-table',
    'docs/platform/governance.md': 'governance-holder-table',
    'docs/platform/system-overview/spec.md': ['system-overview-area-map', 'system-overview-shared-entities'],
    'docs/platform/observe/spec.md': 'observe-shared-entities',
    'docs/platform/workflow/spec.md': 'workflow-shared-entities',
    'docs/platform/architecture-map.md': ['architecture-map-components', 'architecture-map-contracts'],
  };

  for (const [rel, views] of Object.entries(docs)) {
    const filePath = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const list = Array.isArray(views) ? views : [views];
    const body = list.map((view) => `${startMarker(view)}\nplaceholder\n${endMarker(view)}`).join('\n\n');
    fs.writeFileSync(filePath, `# seed\n\n${body}\n`, 'utf8');
  }
  return tmp;
}

test('main --check exits 0 on the real repo (required views match the model)', () => {
  assert.equal(main(['--check'], { repoRoot: REPO_ROOT }), 0);
});

test('checkViews names a view whose generated block was edited by hand', () => {
  const tmp = seedTempRepo();

  // First write fills the blocks from the model.
  writeViews(tmp);
  assert.equal(main(['--check'], { repoRoot: tmp }), 0);

  // Hand-edit one generated block; --check must name that view.
  const boundaryPath = path.join(tmp, 'docs/platform/component-boundary.md');
  const before = fs.readFileSync(boundaryPath, 'utf8');
  const tampered = before.replace(
    `${startMarker('component-boundary')}\n`,
    `${startMarker('component-boundary')}\nHAND EDITED\n`,
  );
  assert.notEqual(tampered, before);
  fs.writeFileSync(boundaryPath, tampered, 'utf8');

  const drift = checkViews(tmp);
  assert.ok(drift.some((entry) => entry.view === 'component-boundary'), `expected component-boundary drift, got ${JSON.stringify(drift)}`);
  assert.equal(main(['--check'], { repoRoot: tmp }), 1);
});

test('checkViews names a required view when its markers are removed', () => {
  const tmp = seedTempRepo();
  writeViews(tmp);
  assert.equal(main(['--check'], { repoRoot: tmp }), 0);

  const readmePath = path.join(tmp, 'docs/platform/README.md');
  fs.writeFileSync(readmePath, '# seed\n\nno markers left\n', 'utf8');

  const drift = checkViews(tmp);
  assert.ok(
    drift.some((entry) => entry.view === 'readme-owner-table' && /no .*readme-owner-table/.test(entry.reason)),
    `expected missing readme-owner-table marker, got ${JSON.stringify(drift)}`,
  );
  assert.equal(main(['--check'], { repoRoot: tmp }), 1);
});

test('writeViews twice is byte-identical', () => {
  const tmp = seedTempRepo();
  writeViews(tmp);
  const afterFirst = new Map();
  for (const rel of [
    'docs/platform/component-boundary.md',
    'docs/platform/README.md',
    'docs/platform/governance.md',
    'docs/platform/system-overview/spec.md',
    'docs/platform/observe/spec.md',
    'docs/platform/workflow/spec.md',
    'docs/platform/architecture-map.md',
  ]) {
    afterFirst.set(rel, fs.readFileSync(path.join(tmp, rel)));
  }
  const { written } = writeViews(tmp);
  assert.equal(written.length, 0);
  for (const [rel, first] of afterFirst) {
    const second = fs.readFileSync(path.join(tmp, rel));
    assert.ok(Buffer.compare(first, second) === 0, `${rel} changed on second write`);
  }
});

test('area map lists cross-area components under (cross-area)', () => {
  const tmp = seedTempRepo();
  writeViews(tmp);
  const areaMap = fs.readFileSync(path.join(tmp, 'docs/platform/system-overview/spec.md'), 'utf8');
  assert.match(areaMap, /\(cross-area\)/);
  assert.match(areaMap, /`cross`/);
  assert.match(areaMap, /\| Area \| Components \|/);
});

test('governance-holder-table is required: missing markers fail --check', () => {
  const views = computeViews(REPO_ROOT);
  const holder = views.find((view) => view.view === 'governance-holder-table');
  assert.ok(holder, 'governance-holder-table view must be defined');
  assert.equal(holder.required, true);

  const tmp = seedTempRepo();
  writeViews(tmp);
  assert.equal(main(['--check'], { repoRoot: tmp }), 0);

  fs.writeFileSync(path.join(tmp, 'docs/platform/governance.md'), '# seed\n\nno markers\n', 'utf8');
  const drift = checkViews(tmp);
  assert.ok(
    drift.some((entry) => entry.view === 'governance-holder-table' && /no .*governance-holder-table/.test(entry.reason)),
    `expected missing governance-holder-table marker, got ${JSON.stringify(drift)}`,
  );
  assert.equal(main(['--check'], { repoRoot: tmp }), 1);
});

test('governance holder row uses readFirst/facts overrides when set', () => {
  const tmp = seedTempRepo();
  const modelDir = path.join(tmp, 'packages', 'component-authority', 'model');
  fs.writeFileSync(path.join(modelDir, 'decision-kinds.json'), JSON.stringify([
    {
      id: 'demo-kind',
      canonical: 'decision-kind:demo-kind',
      aliases: ['demo-scope'],
      meaning: 'demo decisions',
      owner: 'demo',
      narrative: 'docs/platform/demo/decisions/',
      readFirst: 'docs/platform/demo/contracts/special.md#anchor-one',
      facts: 'docs/platform/demo/contracts/special.md#anchor-one',
    },
  ], null, 2));
  fs.mkdirSync(path.join(tmp, 'docs/platform/demo/decisions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs/platform/demo/decisions/.keep'), '', 'utf8');
  fs.mkdirSync(path.join(tmp, 'docs/platform/demo/contracts'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs/platform/demo/contracts/special.md'), '# special\n', 'utf8');
  fs.writeFileSync(path.join(tmp, 'docs/platform/demo/spec.md'), '# demo\n', 'utf8');
  fs.writeFileSync(path.join(tmp, 'docs/platform/demo/README.md'), '# demo readme\n', 'utf8');

  writeViews(tmp);
  const text = fs.readFileSync(path.join(tmp, 'docs/platform/governance.md'), 'utf8');
  const block = text.match(
    new RegExp(`${startMarker('governance-holder-table')}([\\s\\S]*?)${endMarker('governance-holder-table')}`),
  );
  assert.ok(block, 'governance-holder-table block missing');
  assert.match(
    block[1],
    /\| demo-scope → demo \| `docs\/platform\/demo\/contracts\/special\.md#anchor-one` \| `docs\/platform\/demo\/contracts\/special\.md#anchor-one` \| `docs\/platform\/demo\/decisions\/` \|/,
  );
  assert.doesNotMatch(block[1], /docs\/platform\/demo\/README\.md/);
  assert.doesNotMatch(block[1], /docs\/platform\/demo\/spec\.md/);
});

test('loadModel reads components, decision kinds, contracts and door files', () => {
  const model = loadModel(REPO_ROOT);
  assert.ok(Array.isArray(model.components) && model.components.length > 0);
  assert.ok(Array.isArray(model.decisionKinds) && model.decisionKinds.length > 0);
  assert.ok(Array.isArray(model.contracts) && model.contracts.length > 0);
  assert.ok(Array.isArray(model.doors) && model.doors.length > 0);
});

test('architecture-map-components lists model component rows with owns columns', () => {
  const tmp = seedTempRepo();
  writeViews(tmp);
  const text = fs.readFileSync(path.join(tmp, 'docs/platform/architecture-map.md'), 'utf8');
  assert.match(text, new RegExp(`${startMarker('architecture-map-components')}[\\s\\S]*${endMarker('architecture-map-components')}`));
  assert.match(text, /\| Component \| Parent \| Layer \| Tier \| Status \| Owns \| Must not own \| Owner doc \|/);
  assert.match(text, /\| `demo` \|/);
  assert.match(text, /demo thing/);
  assert.match(text, /other thing/);
});

test('architecture-map-contracts prints id boundary contract provider consumers status path', () => {
  const tmp = seedTempRepo();
  writeViews(tmp);
  const text = fs.readFileSync(path.join(tmp, 'docs/platform/architecture-map.md'), 'utf8');
  const block = text.match(
    new RegExp(`${startMarker('architecture-map-contracts')}([\\s\\S]*?)${endMarker('architecture-map-contracts')}`),
  );
  assert.ok(block, 'architecture-map-contracts block missing');
  const body = block[1];
  assert.match(body, /\| ID \| Boundary \| Contract \| Provider \| Consumers \| Status \| Path \|/);
  // Boundary before ": "; Contract cell is only the text after ": " (boundary shown once).
  assert.match(
    body,
    /\| `CTR-DEMO` \| demo boundary ↔ other \| detail that must not appear as boundary \| `demo` \| `cross` \| live \| `packages\/demo\/contracts\/demo\.v1\.json` \|/,
  );
  // Planned row with no path → em dash.
  assert.match(
    body,
    /\| `CTR-PLANNED` \| planned side ↔ other side \| no file yet \| `cross` \| — \| planned \| — \|/,
  );
  // Named path prints as-is even when the file is absent (contracts.test owns live/designed existence).
  assert.match(
    body,
    /\| `CTR-NAMED-MISSING` \| named missing ↔ side \| path printed even if absent \| `cross` \| — \| planned \| `packages\/missing\/contracts\/x\.v1\.json` \|/,
  );
});
