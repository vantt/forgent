// CLI integration coverage for `fgos tool register/check/query/remove`
// (tsk-1dj, tool-registry-capability port). Mirrors take-pick-claim-
// eligibility.test.mjs's self-contained harness shape (own tmpCwd/run/
// envelopeData) rather than growing the already-large fgos.test.mjs, the
// same topic-scoped split fgos-manifest.test.mjs/fgos-help.test.mjs already
// use in this directory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
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

function eventLines(cwd) {
  const logPath = path.join(cwd, '.fgos', 'events.jsonl');
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
}

function registerGitnexus(cwd, extra = {}) {
  fs.mkdirSync(path.join(cwd, '.gitnexus'), { recursive: true });
  return run(cwd, [
    'tool', 'register',
    '--name', extra.name ?? 'gitnexus',
    '--kind', extra.kind ?? 'mcp',
    '--capability', extra.capability ?? 'Impact Analysis',
    '--command', extra.command ?? 'mcp:gitnexus',
    '--scan', extra.scan ?? '.gitnexus',
    ...(extra.responsibility ? ['--responsibility', extra.responsibility] : []),
    ...(extra.description ? ['--description', extra.description] : []),
  ]);
}

// ─── register ────────────────────────────────────────────────────────────

test('tool register creates exactly one tool.register event and folds into view.tools, exit 0', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = registerGitnexus(cwd, { responsibility: 'Verification', description: 'Code-graph blast radius' });
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const data = envelopeData(result.stdout);
  assert.equal(data.tool.name, 'gitnexus');
  assert.equal(data.tool.kind, 'mcp');
  // Capability is normalized to kebab-case regardless of how it was typed.
  assert.equal(data.tool.capability, 'impact-analysis');
  assert.equal(data.tool.responsibility, 'Verification');
});

test('tool register with a duplicate --name is rejected as validation, exit 4, no extra event written', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  const before = eventLines(cwd).length;
  const result = registerGitnexus(cwd);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('tool register with an out-of-domain --kind is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = registerGitnexus(cwd, { kind: 'sql' });
  assert.equal(result.status, 4);
});

test('tool register for kind mcp/skill without --scan is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'register', '--name', 'gitnexus', '--kind', 'mcp', '--capability', 'impact-analysis', '--command', 'mcp:gitnexus']);
  assert.equal(result.status, 4);
});

test('tool register for kind cli does not require --scan', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'register', '--name', 'linter', '--kind', 'cli', '--capability', 'lint', '--command', 'eslint']);
  assert.equal(result.status, 0);
});

// ─── remove ──────────────────────────────────────────────────────────────

test('tool remove deletes the registration, exit 0, and a subsequent query no longer lists it', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  const result = run(cwd, ['tool', 'remove', '--name', 'gitnexus']);
  assert.equal(result.status, 0);
  const query = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.deepEqual(query.providers, []);
});

test('tool remove on a name that was never registered is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'remove', '--name', 'ghost']);
  assert.equal(result.status, 4);
});

// ─── check ───────────────────────────────────────────────────────────────

test('tool check on a present mcp tool writes "present" to the local status overlay, exit 0, and never appends an event', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['tool', 'check']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before, 'tool check must never append an event — it writes the local overlay only');
  const data = envelopeData(result.stdout);
  assert.equal(data.checked.gitnexus.status, 'present');
  const overlay = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'tool-status.local.json'), 'utf8'));
  assert.equal(overlay.gitnexus.status, 'present');
});

test('tool check on a missing mcp tool (scan target absent) still exits 0 — absence is a fact, never a CLI error', () => {
  const cwd = tmpCwd();
  run(cwd, ['tool', 'register', '--name', 'c3', '--kind', 'skill', '--capability', 'impact-analysis', '--command', 'skill:c3', '--scan', '.c3']);
  const result = run(cwd, ['tool', 'check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.checked.c3.status, 'missing');
});

test('tool check --name only probes the named tool, leaving other registered tools\' overlay entries untouched', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  run(cwd, ['tool', 'register', '--name', 'c3', '--kind', 'skill', '--capability', 'impact-analysis', '--command', 'skill:c3', '--scan', '.c3']);
  run(cwd, ['tool', 'check']); // seeds both
  const before = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'tool-status.local.json'), 'utf8'));
  fs.mkdirSync(path.join(cwd, '.c3'), { recursive: true }); // now present, but we only re-check gitnexus below
  const result = run(cwd, ['tool', 'check', '--name', 'gitnexus']);
  assert.equal(result.status, 0);
  const after = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'tool-status.local.json'), 'utf8'));
  assert.equal(after.c3.checkedAt, before.c3.checkedAt, 'c3 must not have been re-probed');
});

test('tool check --name on an unregistered name is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['tool', 'check', '--name', 'ghost']);
  assert.equal(result.status, 4);
});

test('tool check on kind http resolves present/missing via a real TCP probe', async () => {
  const cwd = tmpCwd();
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    run(cwd, ['tool', 'register', '--name', 'svc', '--kind', 'http', '--capability', 'x', '--command', `127.0.0.1:${port}`]);
    const result = run(cwd, ['tool', 'check', '--name', 'svc']);
    assert.equal(envelopeData(result.stdout).checked.svc.status, 'present');
  } finally {
    server.close();
  }
});

// ─── query ───────────────────────────────────────────────────────────────

test('tool query with no tools registered for a capability returns an empty provider set, not an error', () => {
  const cwd = tmpCwd();
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.deepEqual(data.providers, []);
});

test('tool query --capability normalizes the same way register does, so different spellings still match', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd, { capability: 'impact_analysis' });
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'Impact Analysis']).stdout);
  assert.equal(data.providers.length, 1);
  assert.equal(data.providers[0].name, 'gitnexus');
});

test('tool query on a registered tool that was never checked on this machine reports status "unknown" — never "missing" (US-027)', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.equal(data.providers[0].status, 'unknown');
});

test('tool query --status present filters out a registered-but-not-present tool after a real check', () => {
  const cwd = tmpCwd();
  run(cwd, ['tool', 'register', '--name', 'c3', '--kind', 'skill', '--capability', 'impact-analysis', '--command', 'skill:c3', '--scan', '.c3']);
  run(cwd, ['tool', 'check']); // c3's scan target does not exist -> missing
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis', '--status', 'present']).stdout);
  assert.deepEqual(data.providers, []);
});

test('tool query returns multiple complementary providers for the same capability (deep-dive: gitnexus + c3 both serve impact-analysis)', () => {
  const cwd = tmpCwd();
  registerGitnexus(cwd);
  run(cwd, ['tool', 'register', '--name', 'c3', '--kind', 'skill', '--capability', 'impact-analysis', '--command', 'skill:c3', '--scan', '.c3']);
  const data = envelopeData(run(cwd, ['tool', 'query', '--capability', 'impact-analysis']).stdout);
  assert.deepEqual(data.providers.map((p) => p.name).sort(), ['c3', 'gitnexus']);
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
