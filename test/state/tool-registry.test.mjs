import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  KINDS,
  normalizeCapability,
  toolsFromExecutors,
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

// ─── toolsFromExecutors ─────────────────────────────────────────────────────

test('toolsFromExecutors maps a "for"-bearing executor into a tool-shaped object, normalizing capability — probe kind/command read from invocations[0], not executor.kind (tsk-in1-4 D5)', () => {
  const executors = {
    gitnexus: {
      kind: 'tool',
      for: ['Impact Analysis'],
      invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }],
      scanTarget: '.gitnexus',
      responsibility: 'Verification',
      description: 'Code-graph blast radius',
    },
  };
  const tools = toolsFromExecutors(executors);
  assert.deepEqual(Object.keys(tools), ['gitnexus']);
  assert.equal(tools.gitnexus.name, 'gitnexus');
  assert.equal(tools.gitnexus.kind, 'mcp');
  assert.equal(tools.gitnexus.capability, 'impact-analysis');
  assert.equal(tools.gitnexus.command, 'mcp:gitnexus');
  assert.equal(tools.gitnexus.scanTarget, '.gitnexus');
});

test('toolsFromExecutors skips a executor declaring no "for" (a plain agent/dispatch executor, e.g. "agy")', () => {
  const executors = { agy: { kind: 'agent', invocations: [{ via: 'cli', command: 'agy', args: [] }] } };
  assert.deepEqual(toolsFromExecutors(executors), {});
});

test('toolsFromExecutors skips a kind:"agent" executor even when it DOES declare "for" -- the real regression found live: tsk-34n D3 gave "agy" its own "for" (so capabilities.<name>.prefer can resolve it), and without this gate every agent-kind executor that migrated to "for" would incorrectly show up as tool-registry-probeable', () => {
  const executors = { agy: { kind: 'agent', for: ['fgos-coding-implement'], invocations: [{ via: 'cli', command: 'agy', args: [] }] } };
  assert.deepEqual(toolsFromExecutors(executors), {});
});

test('toolsFromExecutors skips a executor whose "for"[0] normalizes to empty', () => {
  assert.deepEqual(toolsFromExecutors({ x: { kind: 'tool', for: ['---'] } }), {});
});

test('toolsFromExecutors reads "unknown" kind/command when the executor declares "for" but no invocations at all', () => {
  const tools = toolsFromExecutors({ x: { kind: 'tool', for: ['foo'] } });
  assert.equal(tools.x.kind, undefined);
  assert.equal(tools.x.command, undefined);
});

test('toolsFromExecutors on undefined/empty input returns {}', () => {
  assert.deepEqual(toolsFromExecutors(undefined), {});
  assert.deepEqual(toolsFromExecutors({}), {});
});

// ─── toolsFromExecutors: "for" is the only accepted input (tsk-34n --
// retires tsk-45f D11's own "capability" (singular) back-compat fallback) ──

test('toolsFromExecutors reads "for"\'s first entry as the capability', () => {
  const tools = toolsFromExecutors({ x: { kind: 'tool', for: ['impact-analysis', 'other-capability'] } });
  assert.equal(tools.x.capability, 'impact-analysis');
});

test('toolsFromExecutors no longer reads the legacy "capability" (singular) field at all -- a executor declaring only it (no "for") is skipped, same as one declaring neither', () => {
  const tools = toolsFromExecutors({ x: { kind: 'tool', capability: 'impact-analysis' } });
  assert.deepEqual(tools, {});
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
  fs.mkdirSync(path.join(dir, 'runtime'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'runtime', 'tool-status.local.json'), 'not json{{{');
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
