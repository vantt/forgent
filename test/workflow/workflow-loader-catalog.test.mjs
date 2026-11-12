// The Workflow loader's one catalog: which definition an id names, project before payload, with the source of each.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadWorkflowWithSource, workflowCatalog } from '../../src/workflow/loader.mjs';

const workflowText = (id, title) => `id: ${id}
title: ${title}
steps:
  - id: only
    units:
      - id: do-it
        template: { capability: execute }
`;

function makeRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-catalog-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  return { root, write };
}

test('a project definition overrides a shipped id, adds its own, and every id names its source', (t) => {
  const project = makeRoot(t);
  const payload = makeRoot(t);
  payload.write('core/workflows/shared.yaml', workflowText('shared', 'shipped'));
  payload.write('core/workflows/shipped-only.yaml', workflowText('shipped-only', 'shipped'));
  project.write('core/workflows/shared.yaml', workflowText('shared', 'project'));
  project.write('core/workflows/mine.yaml', workflowText('mine', 'project'));

  const catalog = workflowCatalog({ projectRoot: project.root, payloadRoot: payload.root });
  assert.deepEqual([...catalog.keys()].sort(), ['mine', 'shared', 'shipped-only']);
  assert.equal(catalog.get('shared').workflow.title, 'project');
  assert.equal(catalog.get('shared').source.root, 'project');
  assert.equal(catalog.get('shared').source.sourcePath, path.join(project.root, 'core/workflows/shared.yaml'));
  assert.equal(catalog.get('shared').overridesShipped, true);
  assert.equal(catalog.get('mine').source.root, 'project');
  assert.equal(catalog.get('mine').overridesShipped, false);
  assert.equal(catalog.get('shipped-only').source.root, 'payload');
  assert.equal(catalog.get('shipped-only').source.sourcePath, path.join(payload.root, 'core/workflows/shipped-only.yaml'));
});

test('without a project the catalog is the running payload alone, and a project that is the payload is read once', (t) => {
  const { root, write } = makeRoot(t);
  write('core/workflows/only.yaml', workflowText('only', 'x'));
  assert.deepEqual([...workflowCatalog({ payloadRoot: root }).values()].map((e) => e.source.root), ['payload']);
  assert.deepEqual([...workflowCatalog({ projectRoot: root, payloadRoot: root }).values()].map((e) => e.source.root), ['project']);
  assert.ok(workflowCatalog().has('coding/feature'), 'the running payload ships coding/feature');
});

test('loadWorkflowWithSource looks an id up in the catalog: the project first, the payload next, an unknown id lists both', (t) => {
  const { root, write } = makeRoot(t);
  write('core/workflows/feature.yaml', workflowText('coding/feature', 'project'));
  assert.equal(loadWorkflowWithSource('coding/feature', { packageRoot: root }).source.root, 'project');
  const shippedOnly = [...workflowCatalog().keys()].find((id) => id !== 'coding/feature');
  assert.equal(loadWorkflowWithSource(shippedOnly, { packageRoot: root }).source.root, 'payload');
  assert.throws(
    () => loadWorkflowWithSource('no-such', { packageRoot: root }),
    (error) => error.message.includes('Workflow "no-such" not found') && error.message.includes('coding/feature') && error.message.includes(shippedOnly),
  );
});

test('a runtime walk stops on a file that cannot be loaded; the doctor walk names it and keeps the rest', (t) => {
  const project = makeRoot(t);
  const payload = makeRoot(t);
  payload.write('core/workflows/ok.yaml', workflowText('ok', 'x'));
  payload.write('core/workflows/bad.json', '{"id": ');
  project.write('core/workflows/locked.yaml', workflowText('locked', 'x'));
  fs.chmodSync(path.join(project.root, 'core', 'workflows', 'locked.yaml'), 0o000);
  // A directory that is not a packaged workflow (no `wf.<name>.yaml` inside) is not a Workflow file.
  fs.mkdirSync(path.join(project.root, 'core', 'workflows', 'notes'), { recursive: true });
  project.write('core/workflows/broken.yaml', 'id: broken\nsteps:\n  - id: a\n   units: [\n');
  project.write('core/workflows/invalid.yaml', 'id: invalid\nsteps: nope\n');

  assert.throws(() => workflowCatalog({ projectRoot: project.root, payloadRoot: payload.root }), /Failed to load core workflow from/);

  const unreadable = [];
  const catalog = workflowCatalog({ projectRoot: project.root, payloadRoot: payload.root, unreadable });
  assert.deepEqual([...catalog.keys()], ['ok']);
  const named = (file) => unreadable.find((line) => line.includes(file));
  assert.match(named('bad.json'), /^payload: core\/workflows\/bad\.json: cannot be parsed: /);
  assert.match(named('broken.yaml'), /^project: core\/workflows\/broken\.yaml: cannot be parsed: .* \(line \d+, column \d+\)$/);
  assert.match(named('invalid.yaml'), /^project: core\/workflows\/invalid\.yaml: cannot be validated: /);
  if (process.getuid?.() === 0) {
    assert.equal(unreadable.length, 3);
  } else {
    assert.equal(unreadable.length, 4);
    assert.match(named('locked.yaml'), /^project: core\/workflows\/locked\.yaml: cannot be read: /);
  }

  const single = [];
  workflowCatalog({ payloadRoot: payload.root, unreadable: single });
  assert.match(single[0], /^core\/workflows\/bad\.json: /, 'a single root needs no prefix');
});
