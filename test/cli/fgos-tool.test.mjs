// CLI integration coverage for `fgos tool check/query` (tsk-1dj,
// tool-registry-capability port; tsk-in1-1 D1: `register`/`remove` retired
// — a tool provider is declared directly in `runner.executors.<id>` in
// `.fgos/config.json`, config-edited like every other executor, never
// through the event log). Mirrors take-pick-claim-eligibility.test.mjs's
// self-contained harness shape (own tmpCwd/run/envelopeData) rather than
// growing the already-large fgos.test.mjs, the same topic-scoped split
// fgos-manifest.test.mjs/fgos-help.test.mjs already use in this directory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tool-cli-'));
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
}

function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  return envelope.data;
}

// Tầng A/T2: new events land under `.fgos/events/<writer>-<ts>.jsonl`, not
// the frozen baseline `.fgos/events.jsonl` (TA-D12) -- counts/exposes raw
// lines across both, mirroring test/cli/helpers/fgos-cli-harness.mjs's own
// eventLines (this file keeps its own local copy rather than importing it).
function eventLines(cwd) {
  const lines = [];
  const logPath = path.join(cwd, '.fgos', 'events.jsonl');
  if (fs.existsSync(logPath)) {
    lines.push(...fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean));
  }
  const eventsDir = path.join(cwd, '.fgos', 'events');
  let names = [];
  try {
    names = fs
      .readdirSync(eventsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name);
  } catch {
    names = [];
  }
  for (const name of names) {
    lines.push(...fs.readFileSync(path.join(eventsDir, name), 'utf8').split('\n').filter(Boolean));
  }
  return lines;
}

// Declares a executor directly in `.fgos/config.json`'s `runner.executors`
// — the real, config-edited way a tool provider is declared post-D1, same
// as this project's own `.fgos/config.json` declares `gitnexus`/`herdr`.
function declareExecutor(cwd, id, fields) {
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const cfg = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  cfg.runner ??= {};
  cfg.runner.executors ??= {};
  cfg.runner.executors[id] = fields;
  // tsk-45f D11 (tsk-34n retired the "capability" singular fallback --
  // "for" is the only field read now): "for" is catalog-validated against
  // cfg.runner.capabilities -- declare each entry here so this raw fixture
  // writer keeps producing a loadable config, same as a real executor
  // would need.
  if (Array.isArray(fields.for)) {
    cfg.runner.capabilities ??= {};
    for (const purpose of fields.for) {
      cfg.runner.capabilities[purpose] ??= {};
    }
  }
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

// tsk-in1-4 D5: `kind` is now the agent/tool BAN CHAT axis, not a probe
// mechanism — gitnexus's probe kind/command live on `invocations[0]`
// instead (`via`, matching tool-registry.mjs's own probe-kind naming).
function declareGitnexus(cwd, extra = {}) {
  fs.mkdirSync(path.join(cwd, '.gitnexus'), { recursive: true });
  declareExecutor(cwd, extra.name ?? 'gitnexus', {
    kind: 'tool',
    for: [extra.capability ?? 'Impact Analysis'],
    invocations: [{ via: extra.kind ?? 'mcp', command: extra.command ?? 'mcp:gitnexus' }],
    scanTarget: extra.scan ?? '.gitnexus',
    ...(extra.responsibility ? { responsibility: extra.responsibility } : {}),
    ...(extra.description ? { description: extra.description } : {}),
  });
}

// ─── retirement of register/remove (tsk-in1-1 D1) ───────────────────────────

test('fgos tool register is no longer a valid sub-verb — rejected as unknown, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'register', '--name', 'gitnexus', '--kind', 'mcp', '--capability', 'impact-analysis', '--command', 'mcp:gitnexus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown tool sub-verb "register"/);
});

test('fgos tool remove is no longer a valid sub-verb — rejected as unknown, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'remove', '--name', 'gitnexus']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown tool sub-verb "remove"/);
});

// ─── check ───────────────────────────────────────────────────────────────

test('tool check on a present mcp tool writes "present" to the local status overlay, exit 0, and never appends an event', () => {
  const cwd = tmpCwd();
  declareGitnexus(cwd, { responsibility: 'Verification', description: 'Code-graph blast radius' });
  const before = eventLines(cwd).length;
  const result = run(cwd, ['tool', 'check']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before, 'tool check must never append an event — it writes the local overlay only');
  const data = envelopeData(result.stdout);
  assert.equal(data.checked.gitnexus.status, 'present');
  const overlay = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'runtime', 'tool-status.local.json'), 'utf8'));
  assert.equal(overlay.gitnexus.status, 'present');
});

test('tool check on a missing mcp tool (scan target absent) still exits 0 — absence is a fact, never a CLI error', () => {
  const cwd = tmpCwd();
  declareExecutor(cwd, 'c3', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'mcp', command: 'skill:c3' }], scanTarget: '.c3' });
  const result = run(cwd, ['tool', 'check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.checked.c3.status, 'missing');
});

test('tool check --name only probes the named tool, leaving other declared tools\' overlay entries untouched', () => {
  const cwd = tmpCwd();
  declareGitnexus(cwd);
  declareExecutor(cwd, 'c3', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'mcp', command: 'skill:c3' }], scanTarget: '.c3' });
  run(cwd, ['tool', 'check']); // seeds both
  const before = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'runtime', 'tool-status.local.json'), 'utf8'));
  fs.mkdirSync(path.join(cwd, '.c3'), { recursive: true }); // now present, but we only re-check gitnexus below
  const result = run(cwd, ['tool', 'check', '--name', 'gitnexus']);
  assert.equal(result.status, 0);
  const after = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'runtime', 'tool-status.local.json'), 'utf8'));
  assert.equal(after.c3.checkedAt, before.c3.checkedAt, 'c3 must not have been re-probed');
});

test('tool check --name on an undeclared executor id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'check', '--name', 'ghost']);
  assert.equal(result.status, 4);
});

test('tool check on a executor with no "capability" field (a plain agent/dispatch executor, e.g. "agy") is never treated as a tool', () => {
  const cwd = tmpCwd();
  declareExecutor(cwd, 'agy', { kind: 'agent', invocations: [{ via: 'cli', command: 'agy', args: [] }] });
  const result = run(cwd, ['tool', 'check']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).checked, {});
});

// ─── query ───────────────────────────────────────────────────────────────

test('tool query with no tool declared for a capability returns an empty provider set, not an error', () => {
  const cwd = tmpCwd();
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.deepEqual(data.providers, []);
});

test('tool query --capability normalizes the same way the declared executor\'s own capability does, so different spellings still match', () => {
  const cwd = tmpCwd();
  declareGitnexus(cwd, { capability: 'impact_analysis' });
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'Impact Analysis']).stdout);
  assert.equal(data.providers.length, 1);
  assert.equal(data.providers[0].name, 'gitnexus');
});

test('tool query on a declared tool that was never checked on this machine reports status "unknown" — never "missing" (US-027)', () => {
  const cwd = tmpCwd();
  declareGitnexus(cwd);
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.equal(data.providers[0].status, 'unknown');
});

test('tool query --status present filters out a declared-but-not-present tool after a real check', () => {
  const cwd = tmpCwd();
  declareExecutor(cwd, 'c3', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'mcp', command: 'skill:c3' }], scanTarget: '.c3' });
  run(cwd, ['tool', 'check']); // c3's scan target does not exist -> missing
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis', '--status', 'present']).stdout);
  assert.deepEqual(data.providers, []);
});

test('tool query returns multiple complementary providers for the same capability (deep-dive: gitnexus + c3 both serve impact-analysis)', () => {
  const cwd = tmpCwd();
  declareGitnexus(cwd);
  declareExecutor(cwd, 'c3', { kind: 'tool', for: ['impact-analysis'], invocations: [{ via: 'mcp', command: 'skill:c3' }], scanTarget: '.c3' });
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.deepEqual(data.providers.map((p) => p.name).sort(), ['c3', 'gitnexus']);
});

test('tool query never lists a executor with no "capability" field (a plain agent/dispatch executor, e.g. "agy")', () => {
  const cwd = tmpCwd();
  declareExecutor(cwd, 'agy', { kind: 'agent', invocations: [{ via: 'cli', command: 'agy', args: [] }] });
  const data = envelopeData(run(cwd, ['tool', 'query']).stdout);
  assert.deepEqual(data.providers, []);
});

// ─── manifest sanity ─────────────────────────────────────────────────────

test('fgos tool with an unknown sub-verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'bogus']);
  assert.equal(result.status, 4);
});

test('fgos tool with no sub-verb at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool']);
  assert.equal(result.status, 4);
});
