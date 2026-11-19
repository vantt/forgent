// The terminal config readers the dispatch route and the retained-pane sweep use: only explicitly set values
// reach the route, and an unreadable config never stops a dispatch.
import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  resolveTerminalConfig,
  retainFailedPaneMsOf,
  terminalRouteConfig,
} from '../../src/terminal-control/config.mjs';
import { writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tc-config-'));
const noGlobal = path.join(scratch, 'no-global-config.json');

after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

function workspace(name, terminal) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  if (terminal !== undefined) writeProjectConfig(root, { terminal });
  return root;
}

// ---- the config reaches the route --------------------------------------

test('terminalRouteConfig carries only explicitly set values, so the Rust core owns its own defaults', () => {
  assert.deepEqual(terminalRouteConfig(workspace('route-defaults'), { globalConfigPath: noGlobal }), {});
  const root = workspace('route-set', { allocationGraceMs: 90000, retainFailedPaneMs: 1000, layout: { policy: 'measured-split', minCols: 100, maxPanesPerTab: 4 } });
  assert.deepEqual(terminalRouteConfig(root, { globalConfigPath: noGlobal }), { allocationGraceMs: 90000, policy: 'measured-split', minCols: 100, maxPanesPerTab: 4 });
  assert.equal(retainFailedPaneMsOf(root, { globalConfigPath: noGlobal }), 1000);
  assert.equal(retainFailedPaneMsOf(workspace('retain-default'), { globalConfigPath: noGlobal }), null);
});

test('an unreadable config gives the route no settings and no retain time instead of stopping a dispatch', () => {
  const root = workspace('route-broken');
  writeRawProjectConfig(root, '{ not json');
  assert.deepEqual(terminalRouteConfig(root, { globalConfigPath: noGlobal }), {});
  assert.equal(retainFailedPaneMsOf(root, { globalConfigPath: noGlobal }), null);
});

test('resolveTerminalConfig treats an explicit null as a set value', () => {
  const { entries } = resolveTerminalConfig(workspace('null-set', { retainFailedPaneMs: null }), { globalConfigPath: noGlobal });
  assert.deepEqual(entries.find((e) => e.name === 'retainFailedPaneMs'), { name: 'retainFailedPaneMs', value: null, source: 'project' });
});
