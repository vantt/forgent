// Phase 06 R7 (cell P06.2): work-isolation negative contract.
//
// "A request with two concurrent mutating actors sharing one workspace is
// refused before Assignment creation. Coordination may store opaque
// domain-provisioned workspace/resource refs but exposes no branch/
// worktree/merge/approve/Work-transition operation. A static import/API
// test enforces this boundary."
//
// This engine's own answer to the FIRST half of R7 (verified below, not
// just cited): the entire standalone-session slice hardcodes
// `mutation: 'read-only'` (plan.md's Locked Product Decision, module header
// of session-engine.mjs) -- `dispatchPrimaryTask`/`dispatchDeclaredOperation`/
// `recordConsultDisposition` accept NO caller-suppliable `mutation` field at
// all (confirmed by static source scan below, not merely by reading the
// code once); `proposeConsult`/`validateConsultProposal` is the ONE place a
// `mutation` value is caller-visible, and it explicitly REJECTS anything
// other than `'read-only'` before any Assignment is created. Since mutation
// is structurally impossible everywhere in this engine, "two concurrent
// MUTATING actors sharing one workspace" cannot occur at all -- a stronger
// guarantee than merely refusing the specific two-actor collision case,
// and tested as such (attempting the weakest single-actor mutation case
// already proves the stronger claim).
//
// The static import check for the SECOND half (no worktree/merge/approve/
// Work-transition operation reachable via IMPORT) already exists in
// coordination-static.test.mjs (Phase 01); this file adds the missing
// PUBLIC-API/EXPORT-SURFACE half of "a static import/API test enforces this
// boundary" (the phase's own "Tests First" section names both), which
// nothing before this cell checked.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  openStandaloneSession,
  validateConsultProposal,
} from '../../src/runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents } from '../../src/runner/coordination/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const coordinationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/coordination');

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-r7-test-'));
}

// ─── Static public-API/export-surface check: no exported function name from
// src/runner/coordination/** may itself be shaped like a branch/worktree/
// merge/approve/Work-transition operation ──────────────────────────────────

const FORBIDDEN_EXPORT_NAME_SUBSTRINGS = [
  'branch',
  'worktree',
  'merge',
  'approve',
  'reject',
  'claimwork',
  'returnwork',
  'movework',
  'changestage',
  'transitionwork',
  'worklifecycle',
];

function listModuleFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listModuleFiles(full);
    return entry.isFile() && entry.name.endsWith('.mjs') ? [full] : [];
  });
}

function extractExportedNames(source) {
  const names = [];
  // `export function foo(...)`, `export async function foo(...)`, `export const FOO = ...`,
  // `export class Foo ...`
  const declRe = /export\s+(?:async\s+function|function|const|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let match;
  while ((match = declRe.exec(source))) names.push(match[1]);
  // `export { foo, bar as baz };`
  const braceRe = /export\s*\{([^}]+)\}/g;
  while ((match = braceRe.exec(source))) {
    for (const entry of match[1].split(',')) {
      const name = entry.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.push(name);
    }
  }
  return names;
}

test('R7: no exported function/const/class name anywhere in src/runner/coordination/** is shaped like a branch/worktree/merge/approve/Work-transition operation (public-API surface check, distinct from the pre-existing import-only static test)', () => {
  const files = listModuleFiles(coordinationDir);
  const violations = [];
  let totalExports = 0;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const names = extractExportedNames(source);
    totalExports += names.length;
    for (const name of names) {
      const lower = name.toLowerCase();
      for (const forbidden of FORBIDDEN_EXPORT_NAME_SUBSTRINGS) {
        if (lower.includes(forbidden)) {
          violations.push(`${path.relative(coordinationDir, file)} exports "${name}" (matches forbidden substring "${forbidden}")`);
        }
      }
    }
  }

  assert.ok(totalExports > 10, `sanity check: expected to find a real, non-trivial number of exports (found ${totalExports}) -- a suspiciously low count would mean the export scan itself is broken, not that the surface is clean`);
  assert.deepEqual(violations, [], `forbidden Work-lifecycle-shaped exports found:\n${violations.join('\n')}`);
});

// ─── Phase 09 P09.3: structural absence of addSessionEdge/topology-overlay/
// Work/git/coding mutation surface through the specialist-slot mechanism
// (current-cell.md item 2, closing Phase 09). A proof of ABSENCE, not a
// runtime refusal: `addSessionEdge`/`addSharedEdge` do not exist anywhere in
// `src/` at all (confirmed by repo-wide grep before writing this test), and
// none of the new MVP9 functions (P09.1 schema, P09.2 runtime) accept a
// caller-suppliable topology-mutation-shaped parameter. This extends the R7
// scan above (which already covers `src/runner/coordination/**` dynamically
// -- every new P09.2 export, e.g. `authorizeSpecialistSlot`/
// `recordSpecialistAuthorization`, is included automatically with zero
// changes needed to that test or this one) to ALSO cover
// `src/runner/definitions/**`, P09.1's own schema-only scope, which the
// original Phase 06 R7 scans never had reason to cover since no
// definitions-side binding surface existed yet. ───────────────────────────

const definitionsDir = path.resolve(coordinationDir, '../definitions');

test('P09.3: no exported function/const/class name anywhere in src/runner/definitions/** is shaped like a branch/worktree/merge/approve/Work-transition operation, and neither src/runner/coordination/** nor src/runner/definitions/** contains the identifier addSessionEdge or addSharedEdge anywhere in source (not merely unexported)', () => {
  const coordinationFiles = listModuleFiles(coordinationDir);
  const definitionsFiles = listModuleFiles(definitionsDir);

  // `src/runner/definitions/**` is a schema/PolicyPatch module, not
  // `src/runner/coordination/**` -- it genuinely exports `mergePolicyStack`
  // (PolicyPatch scope-layer resolution, `minTier`/`preferPersona`/etc.,
  // predates and is unrelated to MVP9), a real false positive for the
  // substring "merge" that `src/runner/coordination/**` never produces
  // (confirmed: it exports nothing matching "merge" today). Named and
  // excluded explicitly, not silently widened.
  const KNOWN_NON_WORK_LIFECYCLE_EXCEPTIONS = new Set(['mergePolicyStack']);

  const violations = [];
  let totalExports = 0;
  for (const file of definitionsFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const names = extractExportedNames(source);
    totalExports += names.length;
    for (const name of names) {
      if (KNOWN_NON_WORK_LIFECYCLE_EXCEPTIONS.has(name)) continue;
      const lower = name.toLowerCase();
      for (const forbidden of FORBIDDEN_EXPORT_NAME_SUBSTRINGS) {
        if (lower.includes(forbidden)) {
          violations.push(`${path.relative(definitionsDir, file)} exports "${name}" (matches forbidden substring "${forbidden}")`);
        }
      }
    }
  }
  assert.ok(totalExports > 5, `sanity check: expected to find a real, non-trivial number of exports from src/runner/definitions/** (found ${totalExports})`);
  assert.deepEqual(violations, [], `forbidden Work-lifecycle-shaped exports found in src/runner/definitions/**:\n${violations.join('\n')}`);

  // A private, unexported mutation helper reachable only internally would
  // still be a real topology-overlay mutation path, so this checks the
  // identifier's presence in source at all, not only the export surface.
  for (const file of [...coordinationFiles, ...definitionsFiles]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!/\baddSessionEdge\b/.test(source), `addSessionEdge must not appear anywhere in ${file}`);
    assert.ok(!/\baddSharedEdge\b/.test(source), `addSharedEdge must not appear anywhere in ${file}`);
  }
});

test('P09.3: authorizeSpecialistSlot/recordSpecialistAuthorization/resolveLiveSpecialistBindings accept no caller-suppliable "mutation"/"edge"/"topologyOverlay"/"overlay" parameter (static source scan of their own parameter destructuring) -- the specialist-slot mechanism introduces no new topology-mutation surface', () => {
  const sessionEngineSource = fs.readFileSync(path.join(coordinationDir, 'session-engine.mjs'), 'utf8');
  const storeSource = fs.readFileSync(path.join(coordinationDir, 'store.mjs'), 'utf8');
  const forbiddenParamNames = ['mutation', 'edge', 'topologyOverlay', 'overlay', 'addSessionEdge', 'addSharedEdge'];

  for (const [label, source, fnName] of [
    ['session-engine.mjs', sessionEngineSource, 'authorizeSpecialistSlot'],
    ['session-engine.mjs', sessionEngineSource, 'resolveLiveSpecialistBindings'],
    ['store.mjs', storeSource, 'recordSpecialistAuthorization'],
  ]) {
    const fnStart = source.indexOf(`export function ${fnName}(`);
    assert.ok(fnStart >= 0, `expected to find "${fnName}" exported from ${label}`);
    const window = source.slice(fnStart, fnStart + 1200);
    const paramsBlock = window.slice(window.indexOf('('), window.indexOf(') {') + 1);
    for (const forbidden of forbiddenParamNames) {
      assert.ok(
        !new RegExp(`\\b${forbidden}\\b`, 'i').test(paramsBlock),
        `"${fnName}" (${label}) must not destructure a caller-suppliable "${forbidden}" field -- found in: ${paramsBlock}`,
      );
    }
  }
});

// ─── Phase 10 P10.9: extend the SAME static-scan methodology to
// `src/verbs/coordination/**` -- the group-thinking Protocol Pack's own
// public-surface directory (`group-thinking-pack.mjs`, P10.1/P10.5), which
// the original Phase 06 R7 scan (src/runner/coordination/**) and the P09.3
// extension (src/runner/definitions/**) never had reason to cover, since
// neither existed when those scans were written. Verified as a genuine gap
// before writing this test: no existing test in this repo walks
// `src/verbs/coordination/**` for forbidden-shaped export names (confirmed
// by `grep -rln "FORBIDDEN_EXPORT_NAME_SUBSTRINGS\|listModuleFiles" test/`
// returning only this file, `coordination-static.test.mjs` (import-only,
// scoped to `src/runner/coordination`), `deliberation-static.test.mjs`
// (scoped to `src/runner/deliberation`), and `team-cognition-static.test.mjs`
// (scoped to `src/runner/team-cognition`) -- none scan the verbs-side
// public-surface directory at all). ─────────────────────────────────────

const verbsCoordinationDir = path.resolve(coordinationDir, '../../verbs/coordination');

test('P10.9: no exported function/const/class name anywhere in src/verbs/coordination/** (the group-thinking Protocol Pack\'s own public-surface directory, plus run.mjs/show.mjs/launch-master-loop.mjs) is shaped like a branch/worktree/merge/approve/Work-transition operation, and it contains neither addSessionEdge nor addSharedEdge anywhere in source', () => {
  const files = listModuleFiles(verbsCoordinationDir);
  const violations = [];
  let totalExports = 0;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const names = extractExportedNames(source);
    totalExports += names.length;
    for (const name of names) {
      const lower = name.toLowerCase();
      for (const forbidden of FORBIDDEN_EXPORT_NAME_SUBSTRINGS) {
        if (lower.includes(forbidden)) {
          violations.push(`${path.relative(verbsCoordinationDir, file)} exports "${name}" (matches forbidden substring "${forbidden}")`);
        }
      }
    }
    assert.ok(!/\baddSessionEdge\b/.test(source), `addSessionEdge must not appear anywhere in ${file}`);
    assert.ok(!/\baddSharedEdge\b/.test(source), `addSharedEdge must not appear anywhere in ${file}`);
  }

  assert.ok(totalExports > 5, `sanity check: expected to find a real, non-trivial number of exports from src/verbs/coordination/** (found ${totalExports})`);
  assert.deepEqual(violations, [], `forbidden Work-lifecycle-shaped exports found in src/verbs/coordination/**:\n${violations.join('\n')}`);
});

// ─── Behavioral: mutation is structurally impossible everywhere in this
// engine, so "two concurrent mutating actors" cannot occur -- proven at
// every entry point that has ANY mutation-adjacent surface at all ────────

test('R7: proposeConsult refuses a non-read-only mutation value BEFORE any Assignment is created (zero Assignments, zero new events as a result) -- checked BEFORE even primaryAssignmentId membership is resolved, so a fake/nonexistent id is enough to isolate this one check', () => {
  const tempDir = mkTempDir();
  openStandaloneSession({ coordinationId: 'coord_r7_mutation', objective: 'x', writerId: 'writer-1', primaryRole: 'researcher' }, { cwd: tempDir });

  const manifestBefore = readManifest('coord_r7_mutation', { cwd: tempDir });
  const eventsBefore = readSessionEvents('coord_r7_mutation', { cwd: tempDir }).length;

  for (const mutation of ['mutating', 'write', 'read-write', 'MUTATING', '']) {
    assert.throws(
      () =>
        validateConsultProposal(
          'coord_r7_mutation',
          {
            primaryAssignmentId: 'asgn_does_not_need_to_be_real_for_this_check',
            role: 'researcher',
            objective: 'attempt a mutating consult',
            evidenceRequired: 'reported',
            mutation,
          },
          { cwd: tempDir },
        ),
      (err) => err instanceof CoordinationError && /rejected -- the whole standalone-session slice is read-only/.test(err.message),
      `expected mutation=${JSON.stringify(mutation)} to be rejected`,
    );
  }

  const manifestAfter = readManifest('coord_r7_mutation', { cwd: tempDir });
  const eventsAfter = readSessionEvents('coord_r7_mutation', { cwd: tempDir }).length;
  assert.equal(manifestAfter.assignmentRefs.length, manifestBefore.assignmentRefs.length, 'no new Assignment was created by any rejected mutation attempt');
  assert.equal(eventsAfter, eventsBefore, 'no new event of any kind was appended by any rejected mutation attempt');
});

test('R7: dispatchPrimaryTask/dispatchDeclaredOperation/recordConsultDisposition accept NO caller-suppliable "mutation" parameter at all (static source scan of their own parameter destructuring) -- mutation is hardcoded read-only, not merely defaulted', () => {
  const sessionEnginePath = path.join(coordinationDir, 'session-engine.mjs');
  const source = fs.readFileSync(sessionEnginePath, 'utf8');

  for (const fnName of ['dispatchPrimaryTask', 'dispatchDeclaredOperation', 'recordConsultDisposition']) {
    const fnStart = source.indexOf(`export async function ${fnName}(`);
    assert.ok(fnStart >= 0, `expected to find "${fnName}" exported from session-engine.mjs`);
    // Grab the parameter destructuring block: from the function's opening
    // paren through its matching closing paren of the SECOND-level `{...}`
    // params object (bounded scan window, generous enough for any of these
    // 3 functions' real signatures, never the whole function body).
    const window = source.slice(fnStart, fnStart + 1500);
    const paramsBlockMatch = window.match(/\(\s*coordinationId,\s*\{([\s\S]*?)\},\s*opts/);
    assert.ok(paramsBlockMatch, `expected to find "${fnName}"'s destructured params block`);
    assert.ok(!/\bmutation\b/.test(paramsBlockMatch[1]), `"${fnName}" must not destructure a caller-suppliable "mutation" field -- found one in: ${paramsBlockMatch[1]}`);
  }
});

test('R7: buildReadOnlyContract (the shared contract builder every dispatch entry point uses) hardcodes mutation: \'read-only\' as a literal, never a variable/parameter', () => {
  const sessionEnginePath = path.join(coordinationDir, 'session-engine.mjs');
  const source = fs.readFileSync(sessionEnginePath, 'utf8');
  const fnStart = source.indexOf('function buildReadOnlyContract(');
  assert.ok(fnStart >= 0);
  const fnBody = source.slice(fnStart, fnStart + 800);
  assert.match(fnBody, /mutation:\s*'read-only'/, 'buildReadOnlyContract must hardcode the literal string \'read-only\', not forward a caller-suppliable value');
});
