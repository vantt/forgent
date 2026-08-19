// test/state/retrospective-doors.test.mjs — tsk-1lv-5 (CONTEXT.md D7/D9/
// D11): the 4-door check (freshness/impact/routing/doc-deferral) running
// inside the existing `retrospective` batch sweep. Split across the four
// pure door functions, the `runFourDoorChecks` aggregator, and the CLI
// integration (`fgos retrospective` logs advisory friction, never blocks
// the delivered -> retrospective transition).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  checkFreshnessDoor,
  checkImpactDoor,
  checkRoutingDoor,
  checkDocDeferralDoor,
  runFourDoorChecks,
} from '../../src/state/retrospective-doors.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-retro-doors-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function initCwd() {
  const cwd = tmpRepoRoot();
  assert.equal(run(cwd, ['init']).status, 0);
  return cwd;
}

// --- checkFreshnessDoor (pure) ---

test('checkFreshnessDoor: flags a docsRef that no longer exists on disk', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item', docsRef: 'docs/history/gone-feature' };
  const findings = checkFreshnessDoor(item, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].door, 'freshness');
  assert.match(findings[0].message, /no longer exists on disk/);
});

test('checkFreshnessDoor: no finding when docsRef and refs all exist', () => {
  const repoRoot = tmpRepoRoot();
  fs.mkdirSync(path.join(repoRoot, 'docs', 'history', 'real-feature'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'history', 'real-feature', 'CONTEXT.md'), '# x\n');
  fs.writeFileSync(path.join(repoRoot, 'real-file.mjs'), '// x\n');
  const item = { id: 'host-item', docsRef: 'docs/history/real-feature', refs: ['real-file.mjs'] };
  assert.deepEqual(checkFreshnessDoor(item, repoRoot), []);
});

test('checkFreshnessDoor: flags a dangling ref path independently of docsRef', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item', refs: ['src/does-not-exist.mjs'] };
  const findings = checkFreshnessDoor(item, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].path, 'src/does-not-exist.mjs');
});

test('checkFreshnessDoor: a bare tsk-*/STR*/ADR*-shaped ref is never treated as a file path -- F7 tsk-1lv regression (refs holds a mix of ids and paths, per command-registry.mjs)', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item', refs: ['tsk-53f', 'tsk-1an-2', 'STR72', 'ADR0030', 'D-ADR0030'] };
  assert.deepEqual(checkFreshnessDoor(item, repoRoot), []);
});

test('checkFreshnessDoor: still flags a dangling real path even when refs also contains id-shaped entries', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item', refs: ['tsk-53f', 'src/does-not-exist.mjs'] };
  const findings = checkFreshnessDoor(item, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].path, 'src/does-not-exist.mjs');
});

// --- checkImpactDoor (pure) ---

test('checkImpactDoor: flags a dangling citation of an old id THIS item declared it supersedes', () => {
  const repoRoot = tmpRepoRoot();
  fs.mkdirSync(path.join(repoRoot, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'specs', 'example.md'), 'still cites OLDID with no acknowledgement\n');
  const item = { id: 'host-item' };
  const decisions = [{ id: 'host-item', text: 'D1: revises OLDID', relation: 'supersedes:OLDID', kind: 'design' }];
  const findings = checkImpactDoor(item, decisions, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].door, 'impact');
});

test('checkImpactDoor: no finding when every citation acknowledges the new id', () => {
  const repoRoot = tmpRepoRoot();
  fs.mkdirSync(path.join(repoRoot, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'specs', 'example.md'), 'OLDID, superseded by host-item\n');
  const item = { id: 'host-item' };
  const decisions = [{ id: 'host-item', text: 'D1: revises OLDID', relation: 'supersedes:OLDID', kind: 'design' }];
  assert.deepEqual(checkImpactDoor(item, decisions, repoRoot), []);
});

test('checkImpactDoor: empty when the item logged no supersedes-relation decisions of its own', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item' };
  const decisions = [{ id: 'host-item', text: 'D1: an ordinary decision', relation: 'none', kind: 'design' }];
  assert.deepEqual(checkImpactDoor(item, decisions, repoRoot), []);
});

test('checkImpactDoor: scopes D-local superseded id to item docsRef CONTEXT.md only (tsk-679 regression)', () => {
  const repoRoot = tmpRepoRoot();
  const docsRef = 'docs/history/host-feature';
  fs.mkdirSync(path.join(repoRoot, docsRef), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, docsRef, 'CONTEXT.md'), 'still cites D8 with no acknowledgement\n');
  fs.mkdirSync(path.join(repoRoot, 'docs', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'specs', 'other.md'), 'unrelated document cites D8 here\n');

  const item = { id: 'host-item', docsRef };
  const decisions = [{ id: 'host-item', text: 'D9: revises D8', relation: 'supersedes:D8', kind: 'design' }];
  const findings = checkImpactDoor(item, decisions, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].door, 'impact');
  assert.equal(findings[0].file, 'docs/history/host-feature/CONTEXT.md');
});

// --- checkRoutingDoor (pure) ---

function writeContext(repoRoot, docsRef, lockedTable) {
  const dir = path.join(repoRoot, docsRef);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'CONTEXT.md'),
    ['# CONTEXT', '', '## Locked decisions', '', lockedTable, '', '## Pinned terms', '', '- x', ''].join('\n'),
  );
}

test('checkRoutingDoor: flags a D-ID locked in CONTEXT.md with no matching state.decisions record', () => {
  const repoRoot = tmpRepoRoot();
  writeContext(repoRoot, 'docs/history/host-feature', '| D-ID | Quyết định |\n|---|---|\n| D1 | hand-typed, never logged |');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  const findings = checkRoutingDoor(item, [], repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].dId, 'D1');
});

test('checkRoutingDoor: no finding once the D-ID has a matching state.decisions record for this item', () => {
  const repoRoot = tmpRepoRoot();
  writeContext(repoRoot, 'docs/history/host-feature', '| D-ID | Quyết định |\n|---|---|\n| D1 | properly logged |');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  const decisions = [{ id: 'host-item', text: 'D1: properly logged', kind: 'design' }];
  assert.deepEqual(checkRoutingDoor(item, decisions, repoRoot), []);
});

test('checkRoutingDoor: a D-ID logged for a DIFFERENT item does not count as coverage', () => {
  const repoRoot = tmpRepoRoot();
  writeContext(repoRoot, 'docs/history/host-feature', '| D-ID | Quyết định |\n|---|---|\n| D1 | hand-typed |');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  const decisions = [{ id: 'other-item', text: 'D1: logged for someone else', kind: 'design' }];
  const findings = checkRoutingDoor(item, decisions, repoRoot);
  assert.equal(findings.length, 1);
});

test('checkRoutingDoor: no docsRef, or no CONTEXT.md yet, is a clean empty result (never a crash)', () => {
  const repoRoot = tmpRepoRoot();
  assert.deepEqual(checkRoutingDoor({ id: 'x' }, [], repoRoot), []);
  assert.deepEqual(checkRoutingDoor({ id: 'x', docsRef: 'docs/history/nope' }, [], repoRoot), []);
});

// --- checkDocDeferralDoor (pure) ---

test('checkDocDeferralDoor: flags deferred-to-later prose with no tracked reference nearby', () => {
  const repoRoot = tmpRepoRoot();
  const dir = path.join(repoRoot, 'docs', 'history', 'host-feature');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CONTEXT.md'), 'This part is để sau, nothing tracks it.\n');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  const findings = checkDocDeferralDoor(item, repoRoot);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].door, 'doc-deferral');
});

test('checkDocDeferralDoor: no finding when the deferred prose names a tracked reference on the same line', () => {
  const repoRoot = tmpRepoRoot();
  const dir = path.join(repoRoot, 'docs', 'history', 'host-feature');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CONTEXT.md'), 'This part is để sau, tracked by tsk-abc123.\n');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  assert.deepEqual(checkDocDeferralDoor(item, repoRoot), []);
});

test('checkDocDeferralDoor: ordinary prose with neither pattern is untouched', () => {
  const repoRoot = tmpRepoRoot();
  const dir = path.join(repoRoot, 'docs', 'history', 'host-feature');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CONTEXT.md'), 'Nothing deferred here at all.\n');
  const item = { id: 'host-item', docsRef: 'docs/history/host-feature' };
  assert.deepEqual(checkDocDeferralDoor(item, repoRoot), []);
});

// --- runFourDoorChecks (aggregator) ---

test('runFourDoorChecks: returns all four keys, each an array, even when every door is clean', () => {
  const repoRoot = tmpRepoRoot();
  const item = { id: 'host-item' };
  const result = runFourDoorChecks(item, { decisions: [] }, repoRoot);
  assert.deepEqual(Object.keys(result).sort(), ['docDeferral', 'freshness', 'impact', 'routing']);
  for (const key of Object.keys(result)) assert.ok(Array.isArray(result[key]));
});

// --- CLI: `fgos retrospective` runs the doors, advisory, never blocking ---

test('CLI: retrospective logs advisory friction for a freshness-door gap but still transitions the item', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, [
      'add', '--id', 'host-item', '--title', 'Host', '--kind', 'task', '--risk', 'light',
      '--verify', 'npm test', '--description', 'fixture', '--docs-ref', 'docs/history/gone-feature',
    ]).status,
    0,
  );
  // Force the item straight to delivered via direct state moves the same
  // way other CLI-level tests in this suite reach a status without
  // re-running the whole real lifecycle (a plain move chain is sufficient
  // here -- this test is about the door/friction wiring, not FSM legality
  // elsewhere already covered). `doing -> awaiting-approval` refuses
  // without real proof (return's own job) unless forced with
  // --skip-return-guard, exactly the escape hatch it exists for.
  assert.equal(run(cwd, ['move', 'host-item', '--to', 'doing', '--expect', 'todo']).status, 0);
  assert.equal(run(cwd, ['move', 'host-item', '--to', 'awaiting-approval', '--expect', 'doing', '--skip-return-guard', 'test fixture']).status, 0);
  assert.equal(run(cwd, ['move', 'host-item', '--to', 'delivered', '--expect', 'awaiting-approval']).status, 0);

  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.count, 1);
  assert.equal(data.swept[0].id, 'host-item');
  assert.ok(data.swept[0].doorFindings, 'expected doorFindings on the swept entry');
  assert.ok(data.swept[0].doorFindings.freshness >= 1);

  // The transition itself is never blocked by the door finding.
  const show = run(cwd, ['list', '--id', 'host-item']);
  const view = JSON.parse(show.stdout).data;
  assert.equal(view.work['host-item'].status, 'retrospective');

  // The friction is real and queryable.
  const frictionLines = fs
    .readFileSync(path.join(cwd, '.fgos', 'events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .filter((e) => e.type === 'work.friction' && e.payload.id === 'host-item');
  assert.equal(frictionLines.length, 1);
  assert.equal(frictionLines[0].payload.errorClass, 'retrospective-door-freshness');
  assert.equal(frictionLines[0].payload.disposition, 'advisory');
});

test('CLI: retrospective logs no friction and no doorFindings key for a clean item', () => {
  const cwd = initCwd();
  assert.equal(
    run(cwd, ['add', '--id', 'clean-item', '--title', 'Clean', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--description', 'fixture']).status,
    0,
  );
  assert.equal(run(cwd, ['move', 'clean-item', '--to', 'doing', '--expect', 'todo']).status, 0);
  assert.equal(run(cwd, ['move', 'clean-item', '--to', 'awaiting-approval', '--expect', 'doing', '--skip-return-guard', 'test fixture']).status, 0);
  assert.equal(run(cwd, ['move', 'clean-item', '--to', 'delivered', '--expect', 'awaiting-approval']).status, 0);

  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.swept[0].id, 'clean-item');
  assert.equal('doorFindings' in data.swept[0], false);

  const frictionLines = fs
    .readFileSync(path.join(cwd, '.fgos', 'events.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .filter((e) => e.type === 'work.friction' && e.payload.id === 'clean-item');
  assert.equal(frictionLines.length, 0);
});
