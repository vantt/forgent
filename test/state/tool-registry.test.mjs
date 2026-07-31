import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {
  ToolRegistryError,
  KINDS,
  normalizeCapability,
  validateToolRegistration,
  probeTool,
  readLocalStatus,
  writeLocalStatus,
  resolvedStatus,
  classifyRegistryPosture,
} from '../../src/state/tool-registry.mjs';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tool-registry-'));
}

// ─── normalizeCapability ────────────────────────────────────────────────────

test('normalizeCapability folds different spellings to the same kebab-case string', () => {
  assert.equal(normalizeCapability('Impact Analysis'), 'impact-analysis');
  assert.equal(normalizeCapability('impact_analysis'), 'impact-analysis');
  assert.equal(normalizeCapability('impact-analysis'), 'impact-analysis');
});

test('normalizeCapability returns "" for non-string or content-free input', () => {
  assert.equal(normalizeCapability(undefined), '');
  assert.equal(normalizeCapability(null), '');
  assert.equal(normalizeCapability('   '), '');
  assert.equal(normalizeCapability('---'), '');
});

// ─── validateToolRegistration ───────────────────────────────────────────────

const VALID_MCP = { name: 'gitnexus', kind: 'mcp', capability: 'impact-analysis', command: 'mcp:gitnexus', scanTarget: '.gitnexus' };

test('validateToolRegistration accepts a well-formed mcp registration and normalizes capability', () => {
  const record = validateToolRegistration(VALID_MCP, []);
  assert.equal(record.name, 'gitnexus');
  assert.equal(record.kind, 'mcp');
  assert.equal(record.capability, 'impact-analysis');
  assert.equal(record.scanTarget, '.gitnexus');
});

test('validateToolRegistration rejects a duplicate name', () => {
  assert.throws(() => validateToolRegistration(VALID_MCP, ['gitnexus']), ToolRegistryError);
});

test('validateToolRegistration rejects an out-of-domain kind', () => {
  assert.throws(() => validateToolRegistration({ ...VALID_MCP, kind: 'sql' }, []), ToolRegistryError);
});

test(`validateToolRegistration accepts every kind in ${KINDS.join('/')}`, () => {
  for (const kind of KINDS) {
    const scanRequired = kind === 'mcp' || kind === 'skill';
    const fields = { name: `tool-${kind}`, kind, capability: 'x', command: 'x', ...(scanRequired ? { scanTarget: '.x' } : {}) };
    assert.doesNotThrow(() => validateToolRegistration(fields, []));
  }
});

test('validateToolRegistration rejects an empty capability', () => {
  assert.throws(() => validateToolRegistration({ ...VALID_MCP, capability: '---' }, []), ToolRegistryError);
});

test('validateToolRegistration rejects a missing --command', () => {
  const { command, ...rest } = VALID_MCP;
  assert.throws(() => validateToolRegistration(rest, []), ToolRegistryError);
});

test('validateToolRegistration requires --scan for kind mcp/skill (not on PATH)', () => {
  const { scanTarget, ...rest } = VALID_MCP;
  assert.throws(() => validateToolRegistration(rest, []), ToolRegistryError);
});

test('validateToolRegistration does NOT require --scan for kind cli/binary/http', () => {
  assert.doesNotThrow(() => validateToolRegistration({ name: 'linter', kind: 'cli', capability: 'lint', command: 'eslint' }, []));
});

// ─── probeTool ───────────────────────────────────────────────────────────────

test('probeTool on kind cli/binary resolves "present" when the command is on PATH, "missing" otherwise', async () => {
  const dir = tmpDir();
  const binName = process.platform === 'win32' ? 'fgos-test-tool.cmd' : 'fgos-test-tool';
  const binPath = path.join(dir, binName);
  fs.writeFileSync(binPath, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(binPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${dir}${path.delimiter}${originalPath}`;
  try {
    const present = await probeTool({ kind: 'cli', command: binName.replace('.cmd', '') === binName ? binName : binName }, process.cwd());
    assert.equal(present, process.platform === 'win32' ? 'present' : 'present');
    const missing = await probeTool({ kind: 'cli', command: 'fgos-definitely-not-a-real-binary-xyz' }, process.cwd());
    assert.equal(missing, 'missing');
  } finally {
    process.env.PATH = originalPath;
  }
});

test('probeTool on kind mcp/skill resolves by scanning scanTarget on disk, relative to repoRoot', async () => {
  const repoRoot = tmpDir();
  fs.mkdirSync(path.join(repoRoot, '.gitnexus'));
  const present = await probeTool({ kind: 'mcp', scanTarget: '.gitnexus' }, repoRoot);
  assert.equal(present, 'present');
  const missing = await probeTool({ kind: 'skill', scanTarget: '.c3' }, repoRoot);
  assert.equal(missing, 'missing');
});

test('probeTool on kind mcp/skill with no scanTarget resolves "unknown"', async () => {
  const status = await probeTool({ kind: 'mcp' }, process.cwd());
  assert.equal(status, 'unknown');
});

test('probeTool on kind http resolves "present" when something is listening, "missing" otherwise', async () => {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const present = await probeTool({ kind: 'http', command: `127.0.0.1:${port}` }, process.cwd());
    assert.equal(present, 'present');
  } finally {
    server.close();
  }
  const missing = await probeTool({ kind: 'http', command: '127.0.0.1:1' }, process.cwd());
  assert.equal(missing, 'missing');
});

// ─── local status overlay ────────────────────────────────────────────────────

test('readLocalStatus on a missing file returns {} (never checked yet)', () => {
  assert.deepEqual(readLocalStatus(tmpDir()), {});
});

test('readLocalStatus on a corrupt file returns {} (disposable local cache, never fatal)', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'tool-status.local.json'), 'not json{{{');
  assert.deepEqual(readLocalStatus(dir), {});
});

test('writeLocalStatus then readLocalStatus round-trips', () => {
  const dir = tmpDir();
  const status = { gitnexus: { status: 'present', checkedAt: '2026-07-31T00:00:00.000Z' } };
  writeLocalStatus(dir, status);
  assert.deepEqual(readLocalStatus(dir), status);
});

test('resolvedStatus reads "unknown" for a registered tool with no local entry — never "missing" (US-027)', () => {
  assert.equal(resolvedStatus('gitnexus', {}), 'unknown');
});

test('resolvedStatus reads the local overlay\'s status when present', () => {
  assert.equal(resolvedStatus('gitnexus', { gitnexus: { status: 'missing' } }), 'missing');
});

// ─── classifyRegistryPosture (degrade ladder) ───────────────────────────────

test('classifyRegistryPosture: zero registered tools is "inactive"', () => {
  assert.deepEqual(classifyRegistryPosture({}, {}), { posture: 'inactive', registeredCount: 0, presentCount: 0, missingCount: 0, unknownCount: 0 });
});

test('classifyRegistryPosture: every registered tool present is "full"', () => {
  const tools = { gitnexus: { name: 'gitnexus' } };
  const localStatus = { gitnexus: { status: 'present' } };
  const result = classifyRegistryPosture(tools, localStatus);
  assert.equal(result.posture, 'full');
  assert.equal(result.presentCount, 1);
});

test('classifyRegistryPosture: registered but not present (missing or unknown) is "degraded" — never "inactive"', () => {
  const tools = { gitnexus: { name: 'gitnexus' }, c3: { name: 'c3' } };
  const missingResult = classifyRegistryPosture(tools, { gitnexus: { status: 'missing' }, c3: { status: 'present' } });
  assert.equal(missingResult.posture, 'degraded');
  assert.equal(missingResult.missingCount, 1);

  // Registered, never checked on this machine (no local entry at all) — this
  // is the core US-027 distinction the deep-dive calls out: it must classify
  // as degraded (unknown), never as if the tool were absent from the
  // registry entirely (that is "inactive", a zero-registration state).
  const uncheckedResult = classifyRegistryPosture(tools, {});
  assert.equal(uncheckedResult.posture, 'degraded');
  assert.equal(uncheckedResult.unknownCount, 2);
});
