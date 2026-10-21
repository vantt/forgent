import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  checkEvidenceRelocation,
  generateManifest,
} from '../../scripts/check-evidence-relocation.mjs';
import { computeSha256 } from '../../scripts/check-legacy-docs-ratchet.mjs';

const SCRIPT_PATH = fileURLToPath(
  new URL('../../scripts/check-evidence-relocation.mjs', import.meta.url)
);

function mkTmpDir(prefix = 'evidence-relocation-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createFixtureTree(root) {
  const file1Content = 'alpha evidence payload content\n';
  const file2Content = '#!/bin/sh\necho executable-evidence\n';

  const archDir = path.join(
    root,
    'docs/architect/agent-coordination/verification/collection1'
  );
  const platDir = path.join(
    root,
    'docs/platform/agent-coordination/verification/collection1'
  );

  fs.mkdirSync(archDir, { recursive: true });
  fs.mkdirSync(platDir, { recursive: true });

  const archFile1 = path.join(archDir, 'proof.md');
  const platFile1 = path.join(platDir, 'proof.md');
  const archFile2 = path.join(archDir, 'script.sh');
  const platFile2 = path.join(platDir, 'script.sh');

  fs.writeFileSync(archFile1, file1Content, 'utf8');
  fs.writeFileSync(platFile1, file1Content, 'utf8');
  fs.chmodSync(archFile1, 0o644);
  fs.chmodSync(platFile1, 0o644);

  fs.writeFileSync(archFile2, file2Content, 'utf8');
  fs.writeFileSync(platFile2, file2Content, 'utf8');
  fs.chmodSync(archFile2, 0o755);
  fs.chmodSync(platFile2, 0o755);

  const manifest = {
    version: 1,
    sourceCommit: '0123456789abcdef0123456789abcdef01234567',
    generatedBy: 'test',
    entries: [
      {
        collection: 'collection1',
        before:
          'docs/architect/agent-coordination/verification/collection1/proof.md',
        after:
          'docs/platform/agent-coordination/verification/collection1/proof.md',
        sha256: computeSha256(Buffer.from(file1Content, 'utf8')),
        bytes: Buffer.byteLength(file1Content, 'utf8'),
        mode: '100644',
        gitBlob: 'abcdef0123456789abcdef0123456789abcdef01',
        relation: 'identical-mirror',
      },
      {
        collection: 'collection1',
        before:
          'docs/architect/agent-coordination/verification/collection1/script.sh',
        after:
          'docs/platform/agent-coordination/verification/collection1/script.sh',
        sha256: computeSha256(Buffer.from(file2Content, 'utf8')),
        bytes: Buffer.byteLength(file2Content, 'utf8'),
        mode: '100755',
        gitBlob: '1234567890abcdef1234567890abcdef12345678',
        relation: 'identical-mirror',
      },
    ],
  };

  const manifestPath = path.join(root, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return {
    root,
    manifest,
    manifestPath,
    archFile1,
    platFile1,
    archFile2,
    platFile2,
  };
}

test('--before passes on a consistent fixture', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath } = createFixtureTree(tmp);
    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(result.ok, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.checkedCount, 2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--before rejects a missing legacy file and a missing platform file', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, archFile1, platFile2 } =
      createFixtureTree(tmp);

    // Delete legacy file 1
    fs.unlinkSync(archFile1);
    const resLegacyMissing = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(resLegacyMissing.ok, false);
    assert.ok(
      resLegacyMissing.violations.some(
        (v) =>
          v.type === 'missing-file' &&
          v.target === 'legacy' &&
          v.path === manifest.entries[0].before
      )
    );

    // Restore file 1, delete platform file 2
    fs.writeFileSync(archFile1, 'alpha evidence payload content\n', 'utf8');
    fs.unlinkSync(platFile2);
    const resPlatMissing = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(resPlatMissing.ok, false);
    assert.ok(
      resPlatMissing.violations.some(
        (v) =>
          v.type === 'missing-file' &&
          v.target === 'platform' &&
          v.path === manifest.entries[1].after
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--before rejects a changed byte in either file', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, platFile1 } = createFixtureTree(tmp);
    fs.writeFileSync(platFile1, 'tampered content\n', 'utf8');

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some(
        (v) =>
          v.type === 'changed-byte' &&
          v.target === 'platform' &&
          v.path === manifest.entries[0].after
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--before rejects an unlisted platform payload', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath } = createFixtureTree(tmp);
    const unlisted = path.join(
      tmp,
      'docs/platform/agent-coordination/verification/collection1/unlisted.md'
    );
    fs.writeFileSync(unlisted, 'unlisted payload\n', 'utf8');

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some(
        (v) =>
          v.type === 'unlisted-payload' &&
          v.path ===
            'docs/platform/agent-coordination/verification/collection1/unlisted.md'
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--before rejects a wrong mode', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, archFile2 } = createFixtureTree(tmp);
    // archFile2 was 100755, remove executable bit
    fs.chmodSync(archFile2, 0o644);

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'before',
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some(
        (v) =>
          v.type === 'wrong-mode' &&
          v.target === 'legacy' &&
          v.path === manifest.entries[1].before
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--after passes on a post-deletion fixture', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, archFile1, archFile2 } =
      createFixtureTree(tmp);

    // Delete legacy files (post-deletion state)
    fs.unlinkSync(archFile1);
    fs.unlinkSync(archFile2);

    // Add maintained text that does NOT mention legacy paths
    const howto = path.join(tmp, 'docs/how-to/guide.md');
    fs.mkdirSync(path.dirname(howto), { recursive: true });
    fs.writeFileSync(howto, '# Guide\nAll clear, clean documentation.\n', 'utf8');

    // Add excluded files that mention legacy path (history, archive, alias table)
    const archiveFile = path.join(tmp, 'archive/old-plan.md');
    fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
    fs.writeFileSync(
      archiveFile,
      'Old reference: docs/architect/agent-coordination/verification/collection1/proof.md\n',
      'utf8'
    );

    const historyFile = path.join(tmp, 'docs/history/migration-log.md');
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
    fs.writeFileSync(
      historyFile,
      'Historical record: architect/agent-coordination/verification/collection1/proof.md\n',
      'utf8'
    );

    const aliasFile = path.join(tmp, 'alias-table.json');
    fs.writeFileSync(
      aliasFile,
      '{"from": "docs/architect/agent-coordination/verification/collection1/proof.md"}',
      'utf8'
    );

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'after',
    });
    assert.equal(result.ok, true);
    assert.equal(result.violations.length, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--after rejects a remaining legacy file', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, archFile2 } = createFixtureTree(tmp);
    // Delete only one legacy file; archFile1 remains
    fs.unlinkSync(archFile2);

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'after',
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some(
        (v) =>
          v.type === 'remaining-legacy-file' &&
          v.path === manifest.entries[0].before
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('--after rejects a maintained-text mention of a legacy path', () => {
  const tmp = mkTmpDir();
  try {
    const { manifest, manifestPath, archFile1, archFile2 } =
      createFixtureTree(tmp);
    fs.unlinkSync(archFile1);
    fs.unlinkSync(archFile2);

    const howto = path.join(tmp, 'docs/how-to/guide.md');
    fs.mkdirSync(path.dirname(howto), { recursive: true });
    fs.writeFileSync(
      howto,
      '# Guide\nSee docs/architect/agent-coordination/verification/collection1/proof.md for details.\n',
      'utf8'
    );

    const result = checkEvidenceRelocation({
      manifest,
      manifestPath,
      repoRoot: tmp,
      mode: 'after',
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some(
        (v) =>
          v.type === 'maintained-text-legacy-mention' &&
          v.path === 'docs/how-to/guide.md'
      )
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI runs --before and --after with correct exit codes', () => {
  const tmp = mkTmpDir();
  try {
    const { manifestPath, archFile1, archFile2 } = createFixtureTree(tmp);

    // CLI --before on valid fixture -> exit 0
    const runBefore = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--manifest', manifestPath, '--before', '--repo-root', tmp],
      { encoding: 'utf8' }
    );
    assert.equal(runBefore.status, 0);
    assert.match(runBefore.stdout, /PASS: before mode verified/);

    // CLI --after on pre-deletion fixture -> exit 1
    const runAfterPre = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--manifest', manifestPath, '--after', '--repo-root', tmp],
      { encoding: 'utf8' }
    );
    assert.equal(runAfterPre.status, 1);
    assert.match(runAfterPre.stderr, /FAIL: after mode found/);
    fs.unlinkSync(archFile1);
    fs.unlinkSync(archFile2);

    // CLI --after on post-deletion fixture -> exit 0
    const runAfterPost = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--manifest', manifestPath, '--after', '--repo-root', tmp],
      { encoding: 'utf8' }
    );
    assert.equal(runAfterPost.status, 0);
    assert.match(runAfterPost.stdout, /PASS: after mode verified/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
