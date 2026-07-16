// test/install/coexist.test.mjs — harness-marker detection + territory
// manifest (install-coexistence D2/D4/D6). Every "detect" test also proves
// D4's read-only-absolute claim: the marker it found is byte/mtime
// unchanged after detection ran.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { detectHarnesses, buildManifest, writeCoexistenceManifest } from '../../src/install/coexist.mjs';

function tmpRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coexist-'));
}

function statSnapshot(target) {
  const stat = fs.statSync(target);
  const content = stat.isFile() ? fs.readFileSync(target) : null;
  return { mtimeMs: stat.mtimeMs, content };
}

test('no markers present: detected_harnesses is empty, manifest still builds', () => {
  const root = tmpRoot();
  assert.deepEqual(detectHarnesses(root).detected_harnesses, []);
  const manifest = buildManifest(root);
  assert.deepEqual(manifest.detected_harnesses, []);
  assert.equal(manifest.v, 1);
});

test('detects a directory marker (.bee/) and leaves it byte/mtime unchanged', () => {
  const root = tmpRoot();
  const beeDir = path.join(root, '.bee');
  fs.mkdirSync(beeDir);
  fs.writeFileSync(path.join(beeDir, 'state.json'), '{"phase":"idle"}');
  const before = statSnapshot(path.join(beeDir, 'state.json'));

  const { detected_harnesses } = detectHarnesses(root);
  assert.deepEqual(detected_harnesses, [{ name: 'bee', markers: ['.bee'] }]);
  assert.deepEqual(statSnapshot(path.join(beeDir, 'state.json')), before);
});

test('detects multiple directory markers at once (.bee/ and .claude/)', () => {
  const root = tmpRoot();
  fs.mkdirSync(path.join(root, '.bee'));
  fs.mkdirSync(path.join(root, '.claude'));

  const names = detectHarnesses(root).detected_harnesses.map((h) => h.name).sort();
  assert.deepEqual(names, ['bee', 'claude']);
});

test('detects the bee AGENTS.md managed block, merges with the .bee/ dir hit into one entry, and leaves the file byte/mtime unchanged', () => {
  const root = tmpRoot();
  fs.mkdirSync(path.join(root, '.bee'));
  const agentsPath = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Project\n\n<!-- BEE:START -->\nmanaged block\n<!-- BEE:END -->\n');
  const before = statSnapshot(agentsPath);

  const { detected_harnesses } = detectHarnesses(root);
  assert.deepEqual(detected_harnesses, [{ name: 'bee', markers: ['.bee', '<!-- BEE:START -->'] }]);
  assert.deepEqual(statSnapshot(agentsPath), before);
});

test('AGENTS.md present but without the managed block: not detected as a harness, file untouched', () => {
  const root = tmpRoot();
  const agentsPath = path.join(root, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Just a project doc, no managed block here.\n');
  const before = statSnapshot(agentsPath);

  assert.deepEqual(detectHarnesses(root).detected_harnesses, []);
  assert.deepEqual(statSnapshot(agentsPath), before);
});

test('AGENTS.md absent is skipped per D6 — no error recorded, init-side caller unaffected', () => {
  const root = tmpRoot();
  assert.equal(fs.existsSync(path.join(root, 'AGENTS.md')), false);

  const { agentsMdReadError } = detectHarnesses(root);
  assert.equal(agentsMdReadError, null);
  assert.equal(buildManifest(root).agentsMdReadError, undefined);
});

test('AGENTS.md unreadable (a directory instead of a file) records a read error but never throws', () => {
  const root = tmpRoot();
  // A directory named AGENTS.md makes readFileSync throw EISDIR — this
  // stands in for "exists but unreadable" without needing OS-specific
  // permission bits.
  fs.mkdirSync(path.join(root, 'AGENTS.md'));

  const { detected_harnesses, agentsMdReadError } = detectHarnesses(root);
  assert.deepEqual(detected_harnesses, []);
  assert.ok(agentsMdReadError, 'expected a read-error message to be recorded');

  const manifest = buildManifest(root);
  assert.equal(manifest.agentsMdReadError, agentsMdReadError);
});

test('manifest schema: version field, territory with both worktree fields, branches pattern', () => {
  const root = tmpRoot();
  const manifest = buildManifest(root);
  assert.equal(manifest.v, 1);
  assert.equal(manifest.territory.data, '.fgos/');
  assert.equal(manifest.territory.worktrees.descriptor, '<tmpdir>/fgos-worktrees');
  assert.equal(manifest.territory.worktrees.resolved, path.join(os.tmpdir(), 'fgos-worktrees'));
  assert.equal(manifest.territory.branches, 'fgw/*');
});

test('writeCoexistenceManifest writes .fgos/coexistence.json matching buildManifest, and is idempotent across two calls', () => {
  const root = tmpRoot();
  const dataDir = path.join(root, '.fgos');
  fs.mkdirSync(dataDir);
  fs.mkdirSync(path.join(root, '.claude'));

  const first = writeCoexistenceManifest(root, dataDir);
  const manifestPath = path.join(dataDir, 'coexistence.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), first);

  const second = writeCoexistenceManifest(root, dataDir);
  assert.deepEqual(second, first);
  assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), first);
});

test('writeCoexistenceManifest never touches another harness dir\'s contents (mtime/byte check across a real write)', () => {
  const root = tmpRoot();
  const dataDir = path.join(root, '.fgos');
  fs.mkdirSync(dataDir);
  const beeDir = path.join(root, '.bee');
  fs.mkdirSync(beeDir);
  const beeFile = path.join(beeDir, 'state.json');
  fs.writeFileSync(beeFile, '{"phase":"idle"}');
  const before = statSnapshot(beeFile);

  writeCoexistenceManifest(root, dataDir);

  assert.deepEqual(statSnapshot(beeFile), before);
});
