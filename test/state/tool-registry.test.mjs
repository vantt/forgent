import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  KINDS,
  normalizeCapability,
  toolsFromCapacities,
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

// ─── toolsFromCapacities ─────────────────────────────────────────────────────

test('toolsFromCapacities maps a capability-bearing capacity into a tool-shaped object, normalizing capability — probe kind/command read from invocations[0], not capacity.kind (tsk-in1-4 D5)', () => {
  const capacities = {
    gitnexus: {
      kind: 'tool',
      capability: 'Impact Analysis',
      invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }],
      scanTarget: '.gitnexus',
      responsibility: 'Verification',
      description: 'Code-graph blast radius',
    },
  };
  const tools = toolsFromCapacities(capacities);
  assert.deepEqual(Object.keys(tools), ['gitnexus']);
  assert.equal(tools.gitnexus.name, 'gitnexus');
  assert.equal(tools.gitnexus.kind, 'mcp');
  assert.equal(tools.gitnexus.capability, 'impact-analysis');
  assert.equal(tools.gitnexus.command, 'mcp:gitnexus');
  assert.equal(tools.gitnexus.scanTarget, '.gitnexus');
});

test('toolsFromCapacities skips a capacity declaring no capability (a plain agent/dispatch capacity, e.g. "agy")', () => {
  const capacities = { agy: { kind: 'agent', invocations: [{ via: 'cli', command: 'agy', args: [] }] } };
  assert.deepEqual(toolsFromCapacities(capacities), {});
});

test('toolsFromCapacities skips a capacity whose capability normalizes to empty', () => {
  assert.deepEqual(toolsFromCapacities({ x: { kind: 'tool', capability: '---' } }), {});
});

test('toolsFromCapacities reads "unknown" kind/command when the capacity declares a capability but no invocations at all', () => {
  const tools = toolsFromCapacities({ x: { kind: 'tool', capability: 'foo' } });
  assert.equal(tools.x.kind, undefined);
  assert.equal(tools.x.command, undefined);
});

test('toolsFromCapacities on undefined/empty input returns {}', () => {
  assert.deepEqual(toolsFromCapacities(undefined), {});
  assert.deepEqual(toolsFromCapacities({}), {});
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

test('probeTool on kind mcp/skill resolves "stale" when scanTarget/meta.json lastCommit is behind repoRoot\'s current git HEAD, "present" when it matches (tsk-j7y)', async () => {
  const repoRoot = tmpDir();
  execSync('git init -q', { cwd: repoRoot });
  execSync('git config user.email test@test.local', { cwd: repoRoot });
  execSync('git config user.name test', { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'a.txt'), 'a');
  execSync('git add a.txt && git commit -q -m first', { cwd: repoRoot });
  const firstCommit = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim();

  fs.mkdirSync(path.join(repoRoot, '.gitnexus'));
  fs.writeFileSync(path.join(repoRoot, '.gitnexus', 'meta.json'), JSON.stringify({ lastCommit: firstCommit }));

  const fresh = await probeTool({ kind: 'mcp', scanTarget: '.gitnexus' }, repoRoot);
  assert.equal(fresh, 'present');

  fs.writeFileSync(path.join(repoRoot, 'b.txt'), 'b');
  execSync('git add b.txt && git commit -q -m second', { cwd: repoRoot });

  const stale = await probeTool({ kind: 'mcp', scanTarget: '.gitnexus' }, repoRoot);
  assert.equal(stale, 'stale');
});

test('KINDS no longer includes "http" — 0 real usage confirmed at tsk-in1-1 time (DISCUSSION.md §3 #14)', () => {
  assert.deepEqual(KINDS, ['cli', 'binary', 'mcp', 'skill']);
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
