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

test('main --check exits 0 on the real repo (required views match the model)', () => {
  assert.equal(main(['--check'], { repoRoot: REPO_ROOT }), 0);
});

test('checkViews names a view whose generated block was edited by hand', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-ca-render-'));
  // Minimal model: one component, no doors, empty decision kinds.
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
  ], null, 2));
  fs.writeFileSync(path.join(modelDir, 'decision-kinds.json'), '[]');

  const docs = {
    'docs/platform/component-boundary.md': 'component-boundary',
    'docs/platform/README.md': 'readme-owner-table',
    'docs/platform/system-overview/spec.md': ['system-overview-area-map', 'system-overview-shared-entities'],
    'docs/platform/observe/spec.md': 'observe-shared-entities',
    'docs/platform/workflow/spec.md': 'workflow-shared-entities',
  };

  for (const [rel, views] of Object.entries(docs)) {
    const filePath = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const list = Array.isArray(views) ? views : [views];
    const body = list.map((view) => `${startMarker(view)}\nplaceholder\n${endMarker(view)}`).join('\n\n');
    fs.writeFileSync(filePath, `# seed\n\n${body}\n`, 'utf8');
  }

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

test('governance-holder-table is optional: missing markers do not fail --check', () => {
  const views = computeViews(REPO_ROOT);
  const holder = views.find((view) => view.view === 'governance-holder-table');
  assert.ok(holder, 'governance-holder-table view must be defined');
  assert.equal(holder.required, false);
  if (!holder.present) {
    // Expected during phase 5 while DOCOS reviews the preview.
    assert.equal(checkViews(REPO_ROOT).some((entry) => entry.view === 'governance-holder-table'), false);
  }
});

test('loadModel reads components, decision kinds and door files', () => {
  const model = loadModel(REPO_ROOT);
  assert.ok(Array.isArray(model.components) && model.components.length > 0);
  assert.ok(Array.isArray(model.decisionKinds) && model.decisionKinds.length > 0);
  assert.ok(Array.isArray(model.doors) && model.doors.length > 0);
});
