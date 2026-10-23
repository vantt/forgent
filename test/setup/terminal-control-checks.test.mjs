// The terminal-control doctor checks against the real host
// binary (FGOS_HOST_BIN, built from this checkout) and the fake herdr script
// the Rust driver tests use. Configs are written to temporary workspaces.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkTerminalControl,
  checkTerminalConfig,
  checkTerminalAllocations,
} from '../../src/setup/terminal-control-checks.mjs';
import { createTerminalControl } from '../../src/terminal-control/client.mjs';
import {
  DEFAULT_TERMINAL_CONFIG,
  resolveTerminalConfig,
  retainFailedPaneMsOf,
  terminalRouteConfig,
} from '../../src/terminal-control/config.mjs';
import { READY_TIMEOUT_MS } from '../../src/runner/dispatch/herdr-deadlines.mjs';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS, ensureSharedConfigDefaults } from '../../src/setup/registrations.mjs';
import { writeProjectConfig, writeRawProjectConfig } from '../helpers/config-fixture.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const FAKE_HERDR = path.join(REPO_ROOT, 'packages/terminal-control/rust/tests/fixtures/herdr/fake-herdr.sh');
const POSIX = process.platform !== 'win32';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tc-checks-'));
const socketPath = path.join(scratch, 'herdr.sock');
const log = path.join(scratch, 'herdr.log');
const noGlobal = path.join(scratch, 'no-global-config.json');
let server;
const saved = {};
const ENV_KEYS = ['FGOS_STATE_ROOT', 'FGOS_HERDR_BIN', 'FGOS_HERDR_ANCHOR_PANE', 'FGOS_HOST_BIN', 'HERDR_SOCKET_PATH', 'FAKE_HERDR_LOG', 'FAKE_HERDR_SOCKET'];

before(async () => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  process.env.FGOS_STATE_ROOT = path.join(scratch, 'state');
  delete process.env.FGOS_HERDR_ANCHOR_PANE;
  Object.assign(process.env, { HERDR_SOCKET_PATH: socketPath, FAKE_HERDR_LOG: log, FAKE_HERDR_SOCKET: socketPath, FGOS_HERDR_BIN: FAKE_HERDR });
  server = net.createServer().listen(socketPath);
  await new Promise((resolve) => server.once('listening', resolve));
});

after(() => {
  server?.close();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  fs.rmSync(scratch, { recursive: true, force: true });
});

function workspace(name, terminal) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  if (terminal !== undefined) writeProjectConfig(root, { terminal });
  return root;
}

const configCheck = (root, globalConfigPath = noGlobal) => checkTerminalConfig(root, { globalConfigPath });

// ---- terminal-config ---------------------------------------------------

test('terminal-config passes on defaults and prints every value with its source', () => {
  const r = configCheck(workspace('defaults'));
  assert.equal(r.passed, true);
  assert.match(r.message, /allocationGraceMs=60000 \(default\)/);
  assert.match(r.message, /retainFailedPaneMs=null \(default\)/);
  assert.match(r.message, /layout\.policy="measured-split" \(default\)/);
  assert.match(r.message, /layout\.maxPanesPerTab=8 \(default\)/);
});

test('terminal-config names the source of an override: project over global over default', () => {
  const globalPath = path.join(scratch, 'global-with-terminal.json');
  fs.writeFileSync(globalPath, JSON.stringify({ terminal: { allocationGraceMs: 90000, layout: { minCols: 100 } } }));
  const root = workspace('override', { layout: { minCols: 120 } });
  const r = configCheck(root, globalPath);
  assert.equal(r.passed, true);
  assert.match(r.message, /allocationGraceMs=90000 \(global\)/);
  assert.match(r.message, /layout\.minCols=120 \(project\)/);
  assert.match(r.message, /layout\.minRows=20 \(default\)/);
});

test('terminal-config fails an allocationGraceMs below the ready timeout plus 30 s, and passes the exact bound', () => {
  const bound = READY_TIMEOUT_MS + 30000;
  const bad = configCheck(workspace('grace-low', { allocationGraceMs: bound - 1 }));
  assert.equal(bad.passed, false);
  assert.match(bad.message, new RegExp(`terminal\\.allocationGraceMs = ${bound - 1} .*at least ${bound}`));
  assert.equal(configCheck(workspace('grace-edge', { allocationGraceMs: bound })).passed, true);
});

test('terminal-config fails a retainFailedPaneMs that is neither null nor a positive integer', () => {
  for (const [name, value] of [['zero', 0], ['negative', -5], ['text', 'soon'], ['float', 1.5]]) {
    const r = configCheck(workspace(`retain-${name}`, { retainFailedPaneMs: value }));
    assert.equal(r.passed, false, name);
    assert.match(r.message, /terminal\.retainFailedPaneMs/);
  }
  const ok = configCheck(workspace('retain-ok', { retainFailedPaneMs: 3600000 }));
  assert.equal(ok.passed, true);
  assert.match(ok.message, /retainFailedPaneMs=3600000 \(project\)/);
});

test('terminal-config prints the refusal the core names for a limit below the measured floor, and passes the floor itself', () => {
  for (const [key, value, named] of [['minCols', 39, 'layout.minCols=39 < 40'], ['minRows', 7, 'layout.minRows=7 < 8']]) {
    const r = configCheck(workspace(`floor-${key}`, { layout: { [key]: value } }));
    assert.equal(r.passed, false, `${key}=${value}`);
    assert.ok(r.message.includes(named) && r.message.includes('terminal-config-below-floor'), r.message);
  }
  assert.equal(configCheck(workspace('floor-ok', { layout: { minCols: 40, minRows: 8 } })).passed, true);
});

test('terminal-config reports the Node rules and the core refusal in one message', () => {
  const r = configCheck(workspace('many', { allocationGraceMs: 10, layout: { minCols: 1 } }));
  assert.equal(r.passed, false);
  assert.match(r.message, /terminal\.allocationGraceMs/);
  assert.match(r.message, /layout\.minCols=1 < 40/);
});

test('terminal-config warns, without failing, when the route cannot be reached', () => {
  const createClient = (config) => createTerminalControl({ hostBin: path.join(scratch, 'no-such-host'), config });
  const r = checkTerminalConfig(workspace('route-down'), { globalConfigPath: noGlobal, createClient });
  assert.equal(r.passed, true);
  assert.match(r.message, /^warning: the terminal-control route did not answer/);
});

test('terminal-config fails by name on a config file that does not parse', () => {
  const root = workspace('broken');
  writeRawProjectConfig(root, '{ not json');
  const r = configCheck(root);
  assert.equal(r.passed, false);
  assert.match(r.message, /terminal\.\* unreadable/);
});

// ---- terminal-control --------------------------------------------------

test('terminal-control prints driver, capabilities and server incarnation from the real route', { skip: !POSIX }, () => {
  const r = checkTerminalControl();
  assert.equal(r.passed, true, r.message);
  assert.doesNotMatch(r.message, /^(warning|info):/);
  assert.match(r.message, /driver herdr, \d+ capabilities \(.*layout\.geometry.*server\.incarnation.*\)/);
  assert.match(r.message, new RegExp(`server pid ${process.pid} at ${socketPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});

test('terminal-control warns, without failing, when herdr is not on the machine', { skip: !POSIX }, () => {
  const prev = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = '/no/such/herdr-binary';
  try {
    const r = checkTerminalControl();
    assert.equal(r.passed, true);
    assert.match(r.message, /^warning: terminal mode unsupported: herdr is not usable \(\/no\/such\/herdr-binary\); direct mode unaffected$/);
  } finally {
    process.env.FGOS_HERDR_BIN = prev;
  }
});

test('terminal-control says on Windows that the terminal mode depends on a herdr build that does not exist', { skip: !POSIX }, () => {
  const prev = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = '/no/such/herdr-binary';
  try {
    const r = checkTerminalControl({ platform: 'win32' });
    assert.equal(r.passed, true);
    assert.match(r.message, /^warning: terminal mode unsupported: Windows has no herdr build, and terminal-control runs on herdr only; direct mode unaffected$/);
  } finally {
    process.env.FGOS_HERDR_BIN = prev;
  }
});

test('terminal-control gives an info line, not a failure, when herdr cannot report pane geometry', { skip: !POSIX }, () => {
  const wrapper = path.join(scratch, 'herdr-without-layout.sh');
  fs.writeFileSync(wrapper, `#!/bin/sh\nif [ "$1" = pane ] && [ "$2" = layout ]; then exit 1; fi\nexec "${FAKE_HERDR}" "$@"\n`, { mode: 0o755 });
  const prev = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = wrapper;
  try {
    const r = checkTerminalControl();
    assert.equal(r.passed, true, r.message);
    assert.match(r.message, /^info: driver herdr, \d+ capabilities/);
    assert.doesNotMatch(r.message, /layout\.geometry/);
    assert.match(r.message, /fixed split and only maxPanesPerTab applies/);
  } finally {
    process.env.FGOS_HERDR_BIN = prev;
  }
});

test('terminal-control warns when the route cannot be reached instead of crashing doctor', () => {
  const r = checkTerminalControl({ terminalControl: createTerminalControl({ hostBin: path.join(scratch, 'no-such-host') }) });
  assert.equal(r.passed, true);
  assert.match(r.message, /^warning: the terminal-control route did not answer/);
});

test('terminal-control keeps the FGOS_HERDR_ANCHOR_PANE diagnosis: empty and unresolvable fail, a resolvable pane is verified', { skip: !POSIX }, () => {
  const anchorHerdr = path.join(scratch, 'herdr-anchor.sh');
  fs.writeFileSync(anchorHerdr, `#!/bin/sh\nif [ "$1" = pane ] && [ "$2" = get ]; then\n  if [ "$3" = valid-pane-42 ]; then echo '{"id":"valid-pane-42"}'; exit 0; fi\n  echo 'error: pane not found' >&2; exit 1\nfi\nexec "${FAKE_HERDR}" "$@"\n`, { mode: 0o755 });
  const prevBin = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = anchorHerdr;
  try {
    const empty = checkTerminalControl({ env: { ...process.env, FGOS_HERDR_ANCHOR_PANE: '   ' } });
    assert.equal(empty.passed, false);
    assert.match(empty.message, /FGOS_HERDR_ANCHOR_PANE is empty/);

    const ghost = checkTerminalControl({ env: { ...process.env, FGOS_HERDR_ANCHOR_PANE: 'ghost-pane-999' } });
    assert.equal(ghost.passed, false);
    assert.match(ghost.message, /FGOS_HERDR_ANCHOR_PANE="ghost-pane-999" cannot be resolved/);

    const valid = checkTerminalControl({ env: { ...process.env, FGOS_HERDR_ANCHOR_PANE: 'valid-pane-42' } });
    assert.equal(valid.passed, true, valid.message);
    assert.match(valid.message, /anchor pane "valid-pane-42" verified/);
  } finally {
    process.env.FGOS_HERDR_BIN = prevBin;
  }
});

// ---- terminal-allocations ----------------------------------------------

const realClient = (config, herdrBin = FAKE_HERDR) => createTerminalControl({
  hostBin: HOST_BIN,
  herdrBin,
  env: { FAKE_HERDR_LOG: log, FAKE_HERDR_SOCKET: socketPath, HERDR_SOCKET_PATH: socketPath },
  ...(config ? { config } : {}),
});

test('terminal-allocations passes when nothing is stuck', { skip: !POSIX }, () => {
  const r = checkTerminalAllocations(workspace('alloc-empty'), { globalConfigPath: noGlobal, terminalControl: realClient() });
  assert.equal(r.passed, true, r.message);
  assert.match(r.message, /^no slot older than 60000 ms is stuck/);
});

test('terminal-allocations warns about a slot that was allocated and never launched, and closes nothing', { skip: !POSIX }, () => {
  // The recorded fixture of a pane that runs nothing but its shell.
  const bareShell = path.join(scratch, 'herdr-bare-shell.sh');
  const fixtures = path.dirname(FAKE_HERDR);
  fs.writeFileSync(bareShell, `#!/bin/sh\nif [ "$1" = pane ] && [ "$2" = process-info ]; then cat "${fixtures}/pane-process-info-shell.json"; exit 0; fi\nexec "${FAKE_HERDR}" "$@"\n`, { mode: 0o755 });
  const tc = realClient({ allocationGraceMs: 0 }, bareShell);
  const slot = tc.allocate({ key: 'doctor-stuck-slot', groupKey: 'doctor-group', display: { label: 'stuck', role: 'worker' } });
  assert.equal(slot.result, 'slot');
  const before = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
  const root = workspace('alloc-stuck', { allocationGraceMs: 0 });
  const r = checkTerminalAllocations(root, { globalConfigPath: noGlobal, terminalControl: tc });
  assert.equal(r.passed, true);
  assert.match(r.message, /^warning: 1 slot\(s\) need a person; nothing was closed: doctor-stuck-slot: a slot was allocated but never launched/);
  const closes = (fs.readFileSync(log, 'utf8').slice(before.length).match(/pane\tclose|pane close/g) ?? []).length;
  assert.equal(closes, 0, 'the scan must not close anything');
});

test('terminal-allocations says it did not scan when terminal mode is unsupported', { skip: !POSIX }, () => {
  const tc = createTerminalControl({ hostBin: HOST_BIN, herdrBin: '/no/such/herdr-binary' });
  const r = checkTerminalAllocations(workspace('alloc-unsupported'), { globalConfigPath: noGlobal, terminalControl: tc });
  assert.equal(r.passed, true);
  assert.match(r.message, /^(info|warning): /);
  assert.doesNotMatch(r.message, /need a person/);
});

// ---- setup: config default ---------------------------------------------

test('setup config-merge adds terminal.* when missing and leaves a project value alone', () => {
  const fresh = workspace('merge-fresh');
  const { addedKeys } = ensureSharedConfigDefaults(fresh);
  assert.ok(addedKeys.some((k) => k.startsWith('terminal')), addedKeys.join(','));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fresh, '.fgos', 'config.json'), 'utf8')).terminal, DEFAULT_TERMINAL_CONFIG);

  const tuned = workspace('merge-tuned', { allocationGraceMs: 120000, layout: { minCols: 100 } });
  ensureSharedConfigDefaults(tuned);
  const after = JSON.parse(fs.readFileSync(path.join(tuned, '.fgos', 'config.json'), 'utf8')).terminal;
  assert.equal(after.allocationGraceMs, 120000);
  assert.equal(after.layout.minCols, 100);
  assert.equal(after.layout.minRows, 20, 'a missing nested key is filled');
});

test('the three checks are registered and setup has no terminal directory fix', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  for (const id of ['terminal-control', 'terminal-config', 'terminal-allocations']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('herdr-available'), 'the old check id is gone');
  assert.ok(!FIX_REGISTRATIONS.some((f) => f.id === 'terminal-dir'), 'the store creates its own directory');
});

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
