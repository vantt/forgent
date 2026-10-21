import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  checkEvidenceRelocation,
  generateManifest,
  scanConsumerTable,
  validateManifest,
} from '../../scripts/check-evidence-relocation.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('../../scripts/check-evidence-relocation.mjs', import.meta.url));
const LEGACY_ROOT = 'docs/architect/agent-coordination/verification/collection1';
const PLATFORM_ROOT = 'docs/platform/agent-coordination/verification/collection1';

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function write(root, rel, content, mode = 0o644) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  fs.chmodSync(full, mode);
  return full;
}

function add(root, ...paths) {
  git(root, ['add', '--', ...paths]);
}

function constitution() {
  return {
    documentKinds: [
      {
        id: 'history',
        placements: [
          { pattern: 'docs/platform/history/**' },
          { pattern: 'docs/platform/<area>/history/**' },
          { pattern: 'docs/platform/<area>/subcomponents/<subcomponent>/history/**' },
          { pattern: 'docs/platform/<area>/reports/**' },
          { pattern: 'docs/history/<feature>/**' },
        ],
      },
      {
        id: 'evidence-payload',
        placements: [
          { pattern: 'docs/platform/<area>/verification/<collection>/**' },
          { pattern: 'docs/platform/<area>/subcomponents/<subcomponent>/verification/<collection>/**' },
        ],
      },
    ],
    areaNameRules: { reserved: [] },
  };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-relocation-test-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.name', 'Evidence Test']);
  git(root, ['config', 'user.email', 'evidence@example.invalid']);
  const files = {
    legacyProof: write(root, `${LEGACY_ROOT}/proof.md`, 'alpha evidence payload\n'),
    platformProof: write(root, `${PLATFORM_ROOT}/proof.md`, 'alpha evidence payload\n'),
    legacyScript: write(root, `${LEGACY_ROOT}/script.sh`, '#!/bin/sh\necho proof\n', 0o755),
    platformScript: write(root, `${PLATFORM_ROOT}/script.sh`, '#!/bin/sh\necho proof\n', 0o755),
  };
  const constitutionPath = 'plans/260925-documentation-authority-unification/minimum-constitution.json';
  write(root, constitutionPath, `${JSON.stringify(constitution(), null, 2)}\n`);
  add(root, 'docs', 'plans');
  const manifest = generateManifest({ repoRoot: root, sourceCommit: '0123456789abcdef0123456789abcdef01234567', generatedBy: 'test' });
  const manifestPath = 'reports/manifest.json';
  const consumerTablePath = 'reports/consumers.json';
  const consumerTable = { version: 1, consumers: [] };
  write(root, manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  write(root, consumerTablePath, `${JSON.stringify(consumerTable, null, 2)}\n`);
  return { root, files, manifest, manifestPath, consumerTable, consumerTablePath };
}

function cleanup(state) {
  fs.rmSync(state.root, { recursive: true, force: true });
}

function check(state, mode, overrides = {}) {
  return checkEvidenceRelocation({
    manifest: state.manifest,
    manifestPath: state.manifestPath,
    consumerTable: state.consumerTable,
    repoRoot: state.root,
    mode,
    constitution: constitution(),
    ...overrides,
  });
}

function removeLegacy(state) {
  fs.unlinkSync(state.files.legacyProof);
  fs.unlinkSync(state.files.legacyScript);
}

function expectViolation(result, type, target = null) {
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((entry) => entry.type === type && (!target || entry.target === target)), JSON.stringify(result.violations, null, 2));
}

test('--before passes a consistent tracked fixture', () => {
  const state = fixture();
  try {
    const result = check(state, 'before');
    assert.equal(result.ok, true);
    assert.equal(result.checkedCount, 2);
  } finally { cleanup(state); }
});

test('--before rejects a missing file on either side', async (t) => {
  for (const target of ['legacy', 'platform']) {
    await t.test(target, () => {
      const state = fixture();
      try {
        fs.unlinkSync(target === 'legacy' ? state.files.legacyProof : state.files.platformProof);
        expectViolation(check(state, 'before'), 'missing-file', target);
      } finally { cleanup(state); }
    });
  }
});

test('--before rejects changed bytes on either side', async (t) => {
  for (const target of ['legacy', 'platform']) {
    await t.test(target, () => {
      const state = fixture();
      try {
        fs.writeFileSync(target === 'legacy' ? state.files.legacyProof : state.files.platformProof, 'changed\n');
        expectViolation(check(state, 'before'), 'changed-byte', target);
      } finally { cleanup(state); }
    });
  }
});

test('--before rejects unlisted payloads on either side', async (t) => {
  for (const target of ['legacy', 'platform']) {
    await t.test(target, () => {
      const state = fixture();
      try {
        const rel = `${target === 'legacy' ? LEGACY_ROOT : PLATFORM_ROOT}/unlisted.md`;
        write(state.root, rel, 'unlisted\n');
        add(state.root, rel);
        expectViolation(check(state, 'before'), 'unlisted-payload', target);
      } finally { cleanup(state); }
    });
  }
});

test('--before rejects filesystem mode, git mode, git blob, and symlink drift', async (t) => {
  const cases = [
    ['filesystem mode', (state) => fs.chmodSync(state.files.legacyScript, 0o644), 'wrong-mode'],
    ['git mode', (state) => git(state.root, ['update-index', '--chmod=-x', `${LEGACY_ROOT}/script.sh`]), 'wrong-git-mode'],
    ['git blob', (state) => { fs.writeFileSync(state.files.platformProof, 'staged change\n'); add(state.root, `${PLATFORM_ROOT}/proof.md`); }, 'git-blob-mismatch'],
    ['symlink', (state) => { fs.unlinkSync(state.files.platformProof); fs.symlinkSync(state.files.legacyProof, state.files.platformProof); }, 'symlink-payload'],
  ];
  for (const [name, mutate, type] of cases) {
    await t.test(name, () => {
      const state = fixture();
      try { mutate(state); expectViolation(check(state, 'before'), type); } finally { cleanup(state); }
    });
  }
});

test('--before regenerates and enforces the classified consumer table', async (t) => {
  await t.test('unclassified consumer', () => {
    const state = fixture();
    try {
      const rel = 'src/new-reader.mjs';
      write(state.root, rel, `// ${LEGACY_ROOT}/\n`);
      add(state.root, rel);
      expectViolation(check(state, 'before'), 'unclassified-consumer');
    } finally { cleanup(state); }
  });
  await t.test('runtime reader', () => {
    const state = fixture();
    try {
      const rel = 'src/runtime-reader.mjs';
      write(state.root, rel, `// ${LEGACY_ROOT}/\n`);
      add(state.root, rel);
      const consumerTable = { version: 1, consumers: [{ path: rel, classification: 'runtime-reader', matches: ['legacy-root'] }] };
      expectViolation(check(state, 'before', { consumerTable }), 'runtime-reader');
    } finally { cleanup(state); }
  });
  await t.test('collection-name drift', () => {
    const state = fixture();
    try {
      const rel = 'test/consumer.test.mjs';
      write(state.root, rel, '// collection1\n');
      add(state.root, rel);
      const consumerTable = { version: 1, consumers: [{ path: rel, classification: 'synthetic-test', matches: ['legacy-root'] }] };
      expectViolation(check(state, 'before', { consumerTable }), 'consumer-drift');
      assert.deepEqual(scanConsumerTable(state.root, ['collection1']).hits.find((row) => row.path === rel)?.matches, ['collection:collection1']);
    } finally { cleanup(state); }
  });
});

test('generateManifest is deterministic, codepoint-sorted, and represents a moved payload', () => {
  const state = fixture();
  try {
    write(state.root, 'docs/architect/agent-coordination/verification/collection1/P00.1.md', 'upper\n');
    write(state.root, 'docs/architect/agent-coordination/verification/collection1/current.md', 'lower\n');
    add(state.root, 'docs/architect');
    const one = generateManifest({ repoRoot: state.root, sourceCommit: 'fixed', generatedBy: 'test' });
    const two = generateManifest({ repoRoot: state.root, sourceCommit: 'fixed', generatedBy: 'test' });
    assert.deepEqual(one, two);
    const moved = one.entries.filter((entry) => entry.relation === 'moved');
    assert.equal(moved.length, 2);
    assert.ok(moved.every((entry) => entry.after === null));
    assert.ok(one.entries.findIndex((entry) => entry.before.endsWith('/P00.1.md')) < one.entries.findIndex((entry) => entry.before.endsWith('/current.md')));
    assert.deepEqual(exactEntryKeys(one.entries[0]), ['after', 'before', 'bytes', 'collection', 'gitBlob', 'mode', 'relation', 'sha256']);
  } finally { cleanup(state); }
});

function exactEntryKeys(entry) {
  return Object.keys(entry).sort();
}

test('manifest schema rejects unsafe, duplicate, unsorted, and malformed entries', () => {
  const state = fixture();
  try {
    const cases = [
      (manifest) => { manifest.version = 2; },
      (manifest) => { manifest.entries[0].before = '../../../../etc/hostname'; },
      (manifest) => { manifest.entries[0].mode = 'bogus'; },
      (manifest) => { manifest.entries[0].sha256 = 'nope'; },
      (manifest) => { manifest.entries.push(structuredClone(manifest.entries[0])); },
      (manifest) => { manifest.entries.reverse(); },
      (manifest) => { manifest.entries[0].extra = true; },
    ];
    for (const mutate of cases) {
      const manifest = structuredClone(state.manifest);
      mutate(manifest);
      assert.throws(() => validateManifest(manifest), /manifest/i);
    }
  } finally { cleanup(state); }
});

test('--after passes after deletion and excludes only classified history, fixtures, release history, records, and the exact alias table', () => {
  const state = fixture();
  try {
    removeLegacy(state);
    const mention = `see ${LEGACY_ROOT}/ for proof\n`;
    const excluded = [
      'archive/old.md',
      'plans/old/record.md',
      'test/fixtures/record.json',
      'CHANGELOG.md',
      'docs/history/migration/old.md',
      'docs/platform/agent-coordination/history/old.md',
      'docs/platform/agent-coordination/subcomponents/x/history/old.md',
      'docs/platform/agent-coordination/reports/old.md',
      'plans/260925-documentation-authority-unification/alias-table.json',
    ];
    for (const rel of excluded) write(state.root, rel, mention);
    const synthetic = 'test/scripts/synthetic.test.mjs';
    write(state.root, synthetic, mention);
    add(state.root, ...excluded);
    add(state.root, synthetic);
    const consumerTable = { version: 1, consumers: [{ path: synthetic, classification: 'synthetic-test', matches: ['legacy-root'] }] };
    assert.equal(check(state, 'after', { consumerTable }).ok, true);
  } finally { cleanup(state); }
});

test('--after catches directory and template mentions but does not broadly exclude alias-table names or target directories', async (t) => {
  const cases = [
    ['directory', 'docs/how-to/guide.md', `see ${LEGACY_ROOT}/ for proofs\n`],
    ['template', 'docs/how-to/template.md', 'see docs/architect/agent-coordination/verification/<track>/<cell>.md\n'],
    ['alias lookalike', 'docs/how-to/alias-table-notes.md', `see ${LEGACY_ROOT}/\n`],
    ['nested target', 'docs/guide/target/x.md', `see ${LEGACY_ROOT}/\n`],
  ];
  for (const [name, rel, content] of cases) {
    await t.test(name, () => {
      const state = fixture();
      try {
        removeLegacy(state);
        write(state.root, rel, content);
        add(state.root, rel);
        expectViolation(check(state, 'after'), 'maintained-text-legacy-mention');
      } finally { cleanup(state); }
    });
  }
});

test('--after reports every payload integrity failure branch', async (t) => {
  const cases = [
    ['remaining legacy', () => {}, 'remaining-legacy-file'],
    ['changed byte', (state) => { removeLegacy(state); fs.writeFileSync(state.files.platformProof, 'changed\n'); }, 'changed-byte'],
    ['wrong mode', (state) => { removeLegacy(state); fs.chmodSync(state.files.platformScript, 0o644); }, 'wrong-mode'],
    ['wrong git mode', (state) => { removeLegacy(state); git(state.root, ['update-index', '--chmod=-x', `${PLATFORM_ROOT}/script.sh`]); }, 'wrong-git-mode'],
    ['wrong git blob', (state) => { removeLegacy(state); fs.writeFileSync(state.files.platformProof, 'staged\n'); add(state.root, `${PLATFORM_ROOT}/proof.md`); }, 'git-blob-mismatch'],
    ['missing platform', (state) => { removeLegacy(state); fs.unlinkSync(state.files.platformProof); }, 'missing-file'],
    ['unlisted platform', (state) => { removeLegacy(state); const rel = `${PLATFORM_ROOT}/unlisted.md`; write(state.root, rel, 'x\n'); add(state.root, rel); }, 'unlisted-payload'],
    ['stray legacy', (state) => { removeLegacy(state); const rel = `${LEGACY_ROOT}/stray.md`; write(state.root, rel, 'x\n'); add(state.root, rel); }, 'remaining-legacy-file'],
    ['platform symlink', (state) => { removeLegacy(state); fs.unlinkSync(state.files.platformProof); fs.symlinkSync(state.files.platformScript, state.files.platformProof); }, 'symlink-payload'],
  ];
  for (const [name, mutate, type] of cases) {
    await t.test(name, () => {
      const state = fixture();
      try { mutate(state); expectViolation(check(state, 'after'), type); } finally { cleanup(state); }
    });
  }
});

test('--after reports tracked-file read errors', () => {
  const state = fixture();
  try {
    removeLegacy(state);
    const rel = 'docs/how-to/unreadable.md';
    const full = write(state.root, rel, 'tracked\n');
    add(state.root, rel);
    fs.unlinkSync(full);
    fs.mkdirSync(full);
    expectViolation(check(state, 'after'), 'maintained-text-read-error');
  } finally { cleanup(state); }
});

test('CLI uses repo-root for relative manifest exclusion', () => {
  const state = fixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-relocation-cwd-'));
  try {
    removeLegacy(state);
    add(state.root, state.manifestPath, state.consumerTablePath);
    const run = spawnSync(process.execPath, [SCRIPT_PATH, '--manifest', state.manifestPath, '--after', '--consumer-table', state.consumerTablePath, '--repo-root', state.root], { cwd: outside, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
  } finally { fs.rmSync(outside, { recursive: true, force: true }); cleanup(state); }
});

test('CLI distinguishes configuration errors from policy violations without a stack trace', () => {
  const state = fixture();
  try {
    const badPath = 'reports/bad.json';
    write(state.root, badPath, '{"version":2,"entries":[]}\n');
    const bad = spawnSync(process.execPath, [SCRIPT_PATH, '--manifest', badPath, '--before', '--consumer-table', state.consumerTablePath, '--repo-root', state.root], { encoding: 'utf8' });
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /ERROR:/);
    assert.doesNotMatch(bad.stderr, /\n\s+at /);
    const conflict = spawnSync(process.execPath, [SCRIPT_PATH, '--manifest', state.manifestPath, '--before', '--after', '--repo-root', state.root], { encoding: 'utf8' });
    assert.equal(conflict.status, 2);
    const unknown = spawnSync(process.execPath, [SCRIPT_PATH, '--wat', '--repo-root', state.root], { encoding: 'utf8' });
    assert.equal(unknown.status, 2);
    fs.writeFileSync(state.files.platformProof, 'changed\n');
    const violation = spawnSync(process.execPath, [SCRIPT_PATH, '--manifest', state.manifestPath, '--before', '--consumer-table', state.consumerTablePath, '--repo-root', state.root], { encoding: 'utf8' });
    assert.equal(violation.status, 1);
  } finally { cleanup(state); }
});
