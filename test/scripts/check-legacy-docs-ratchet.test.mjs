import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import {
  generateBaseline,
  checkRatchet,
  validateBaselineSchema,
  validateExceptionsSchema,
  canonicalizeExceptionPath,
  classifyFile,
  computeSha256,
  scanFiles,
  DEFAULT_ROOTS,
  DEFAULT_BASELINE_PATH,
  MAINTAINED_PROSE_CLASSES,
  NON_AUTHORITY_PAYLOAD_CLASSES,
} from '../../scripts/check-legacy-docs-ratchet.mjs';

const SCRIPT_PATH = fileURLToPath(
  new URL('../../scripts/check-legacy-docs-ratchet.mjs', import.meta.url)
);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function mkTmpDir(prefix = 'ratchet-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('deterministic generation: generating baseline twice yields byte-for-byte identical content', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    const rootB = path.join(tmp, 'docs/architect');
    fs.mkdirSync(rootA, { recursive: true });
    fs.mkdirSync(rootB, { recursive: true });

    // Create files in random order
    fs.writeFileSync(path.join(rootA, 'zeta.md'), 'Zeta content\n');
    fs.writeFileSync(path.join(rootA, 'alpha.md'), 'Alpha content\n');
    fs.writeFileSync(path.join(rootB, 'beta.json'), '{"beta": 1}\n');
    fs.writeFileSync(path.join(rootB, 'gamma.md'), 'Gamma content\n');

    const base1 = generateBaseline({ repoRoot: tmp, roots: ['docs/specs', 'docs/architect'] });
    const base2 = generateBaseline({ repoRoot: tmp, roots: ['docs/specs', 'docs/architect'] });

    const str1 = JSON.stringify(base1, null, 2);
    const str2 = JSON.stringify(base2, null, 2);

    assert.equal(str1, str2, 'Consecutive generations must be byte-for-byte identical');
    assert.deepEqual(Object.keys(base1.files), [
      'docs/architect/beta.json',
      'docs/architect/gamma.md',
      'docs/specs/alpha.md',
      'docs/specs/zeta.md',
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('class/scope: properly classifies markdown authority, retained sources, and non-markdown evidence', () => {
  assert.equal(classifyFile('docs/specs/runner.md'), 'maintained-authority');
  assert.equal(classifyFile('docs/architect/agent-coordination/contracts/session.md'), 'maintained-authority');
  assert.equal(classifyFile('docs/architect/agent-coordination/proposals/p1.md'), 'retained-source');
  assert.equal(classifyFile('docs/architect/agent-coordination/proof.json'), 'history-evidence');
  assert.equal(classifyFile('docs/architect/agent-coordination/chart.png'), 'history-evidence');

  // F1: Root-aware and case-safe under docs/specs:
  // Every file under docs/specs is maintained authority regardless of extension or case
  assert.equal(classifyFile('docs/specs/spoof.txt'), 'maintained-authority');
  assert.equal(classifyFile('docs/specs/spoof.yml'), 'maintained-authority');
  assert.equal(classifyFile('docs/specs/SPOOF.MD'), 'maintained-authority');
  // Except explicitly enumerated generated projections
  assert.equal(classifyFile('docs/specs/platform-foundations.md'), 'generated');
  assert.equal(classifyFile('docs/specs/platform-foundations.MD'), 'generated');

  // Under docs/architect: Markdown is case-insensitive prose, non-md can be history-evidence
  assert.equal(classifyFile('docs/architect/proposals/p1.MD'), 'retained-source');
  assert.equal(classifyFile('docs/architect/contracts/session.MD'), 'maintained-authority');
  assert.equal(classifyFile('docs/architect/cell-01/proof.json'), 'history-evidence');
});

test('new maintained file: unreviewed new file under legacy root is refused with unreviewed-new-file', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    fs.writeFileSync(path.join(rootA, 'existing.md'), 'Initial\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Add new unreviewed file
    fs.writeFileSync(path.join(rootA, 'brand-new-legacy.md'), 'Should be rejected\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].type, 'unreviewed-new-file');
    assert.match(result.findings[0].message, /brand-new-legacy\.md/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('accounted edit: file modified with valid reviewed exception passes', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const targetFile = path.join(rootA, 'existing.md');
    fs.writeFileSync(targetFile, 'Initial content\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Modify file
    fs.writeFileSync(targetFile, 'Updated content for valid reason\n');
    const newDigest = computeSha256(fs.readFileSync(targetFile));

    const exceptions = {
      version: 1,
      exceptions: [
        {
          path: 'docs/specs/existing.md',
          kind: 'allowed-edit',
          rationale: 'Verified stale standing route correction in Phase 01',
          approvedBy: 'Phase 01 authorization',
          owner: 'tester',
          expectedDigest: newDigest,
          reviewedAt: '2026-09-25',
          revisitTrigger: 'Phase 08 cutover',
        },
      ],
    };

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions,
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, true);
    assert.equal(result.findings.length, 0);
    assert.equal(result.stats.accountedEditsCount, 1);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('unaccounted edit: file modified without exception or with digest mismatch is refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const targetFile = path.join(rootA, 'existing.md');
    fs.writeFileSync(targetFile, 'Initial content\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Modify file without exception
    fs.writeFileSync(targetFile, 'Tampered content\n');

    const resultWithoutException = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(resultWithoutException.clean, false);
    assert.equal(resultWithoutException.findings.length, 1);
    assert.equal(resultWithoutException.findings[0].type, 'unaccounted-edit');

    // Modify file with mismatched digest in exception
    const exceptionsMismatched = {
      version: 1,
      exceptions: [
        {
          path: 'docs/specs/existing.md',
          kind: 'allowed-edit',
          rationale: 'Mismatch test',
          approvedBy: 'Tester',
          owner: 'tester',
          expectedDigest: '0000000000000000000000000000000000000000000000000000000000000000',
          reviewedAt: '2026-09-25',
          revisitTrigger: 'Phase 08 cutover',
        },
      ],
    };

    const resultMismatch = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: exceptionsMismatched,
      roots: ['docs/specs'],
    });

    assert.equal(resultMismatch.clean, false);
    assert.equal(resultMismatch.findings.length, 1);
    assert.equal(resultMismatch.findings[0].type, 'unaccounted-edit');
    assert.match(resultMismatch.findings[0].message, /digest mismatch/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('unexpected deletion: baselined file missing without exception is refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const f1 = path.join(rootA, 'stay.md');
    const f2 = path.join(rootA, 'delete-me.md');
    fs.writeFileSync(f1, 'Staying\n');
    fs.writeFileSync(f2, 'Will be deleted\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    fs.unlinkSync(f2);

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].type, 'unexpected-deletion');
    assert.match(result.findings[0].message, /delete-me\.md/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('malformed baseline: schema validator rejects invalid baseline structures', () => {
  assert.throws(() => validateBaselineSchema(null), /Malformed baseline/);
  assert.throws(() => validateBaselineSchema([]), /Malformed baseline/);
  assert.throws(() => validateBaselineSchema({ version: 2 }), /expected version 1/);
  assert.throws(() => validateBaselineSchema({ version: 1, roots: [] }), /roots must be a non-empty array/);
  assert.throws(() => validateBaselineSchema({ version: 1, roots: ['docs'], files: 'invalid' }), /files must be an object map/);
  assert.throws(
    () =>
      validateBaselineSchema({
        version: 1,
        roots: ['docs'],
        files: {
          'bad/file.md': { digest: 'short', size: 10, fileClass: 'text' },
        },
      }),
    /invalid sha256 digest/
  );
});

test('malformed exception: schema validator rejects invalid exception objects', () => {
  assert.throws(() => validateExceptionsSchema(null), /Malformed exceptions/);
  assert.throws(() => validateExceptionsSchema({ version: 2 }), /expected version 1/);
  assert.throws(() => validateExceptionsSchema({ version: 1, exceptions: 'not-an-array' }), /"exceptions" must be an array/);
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'invalid-kind', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't' }],
      }),
    /invalid kind/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-deletion', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't' }],
      }),
    /deletions are strictly forbidden/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [
          {
            path: 'docs/specs/foo.md',
            kind: 'allowed-edit',
            rationale: 'r1',
            approvedBy: 'a',
            owner: 'o',
            reviewedAt: '2026-09-25',
            revisitTrigger: 't',
            expectedDigest: 'a'.repeat(64),
          },
          {
            path: 'docs/specs/foo.md',
            kind: 'allowed-edit',
            rationale: 'r2',
            approvedBy: 'b',
            owner: 'o',
            reviewedAt: '2026-09-25',
            revisitTrigger: 't',
            expectedDigest: 'b'.repeat(64),
          },
        ],
      }),
    /duplicate exception/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'short' }],
      }),
    /valid 64-char hex expectedDigest/
  );

  // Missing owner
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
      }),
    /missing owner/
  );

  // Missing or invalid reviewedAt
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
      }),
    /missing or invalid reviewedAt/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: 'invalid-date', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
      }),
    /missing or invalid reviewedAt/
  );

  // F4: Reject impossible calendar dates for reviewedAt
  for (const badDate of ['2026-02-30', '2026-13-40', '2026-04-31']) {
    assert.throws(
      () =>
        validateExceptionsSchema({
          version: 1,
          exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: badDate, revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
        }),
      /missing or invalid reviewedAt/
    );
  }

  // Missing lifecycle control (neither expiry nor revisitTrigger)
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', expectedDigest: 'a'.repeat(64) }],
      }),
    /requires at least one lifecycle control/
  );

  // Invalid expiry format or impossible date
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', expiry: 'not-a-date', expectedDigest: 'a'.repeat(64) }],
      }),
    /invalid expiry format/
  );

  // F4: Reject impossible calendar dates for expiry
  for (const badExpiry of ['2026-02-29', '2026-13-01', '2026-04-31', '2026-13-40']) {
    assert.throws(
      () =>
        validateExceptionsSchema({
          version: 1,
          exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', expiry: badExpiry, expectedDigest: 'a'.repeat(64) }],
        }),
      /invalid expiry format/
    );
  }

  // F4: Valid leap year calendar date (2024-02-29) passes
  assert.doesNotThrow(() =>
    validateExceptionsSchema({
      version: 1,
      exceptions: [{ path: 'foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2024-02-29', expiry: '2024-02-29', expectedDigest: 'a'.repeat(64) }],
    })
  );

  // R2: reject duplicate exceptions across ./ and repeated-slash forms
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [
          { path: 'docs/specs/foo.md', kind: 'allowed-edit', rationale: 'r1', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) },
          { path: 'docs/specs/./foo.md', kind: 'allowed-edit', rationale: 'r2', approvedBy: 'b', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'b'.repeat(64) },
        ],
      }),
    /duplicate exception/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [
          { path: 'docs/specs/foo.md', kind: 'allowed-edit', rationale: 'r1', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) },
          { path: 'docs/specs//foo.md', kind: 'allowed-edit', rationale: 'r2', approvedBy: 'b', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'b'.repeat(64) },
        ],
      }),
    /duplicate exception/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [
          { path: 'docs/specs/foo.md', kind: 'allowed-edit', rationale: 'r1', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) },
          { path: './docs/specs/foo.md', kind: 'allowed-edit', rationale: 'r2', approvedBy: 'b', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'b'.repeat(64) },
        ],
      }),
    /duplicate exception/
  );
  // R2: reject traversal and absolute paths
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: '/docs/specs/foo.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
      }),
    /Absolute paths are forbidden/
  );
  assert.throws(
    () =>
      validateExceptionsSchema({
        version: 1,
        exceptions: [{ path: 'docs/specs/../../escape.md', kind: 'allowed-edit', rationale: 'r', approvedBy: 'a', owner: 'o', reviewedAt: '2026-09-25', revisitTrigger: 't', expectedDigest: 'a'.repeat(64) }],
      }),
    /Path traversal is forbidden/
  );
});

test('canonicalizeExceptionPath: canonicalizes posix relative paths and rejects absolute/traversal paths (R2)', () => {
  assert.equal(canonicalizeExceptionPath('docs/specs/foo.md'), 'docs/specs/foo.md');
  assert.equal(canonicalizeExceptionPath('./docs/specs/foo.md'), 'docs/specs/foo.md');
  assert.equal(canonicalizeExceptionPath('docs/specs/./foo.md'), 'docs/specs/foo.md');
  assert.equal(canonicalizeExceptionPath('docs/specs//foo.md'), 'docs/specs/foo.md');
  assert.equal(canonicalizeExceptionPath('docs/specs///sub//bar.md'), 'docs/specs/sub/bar.md');
  assert.equal(canonicalizeExceptionPath('docs\\specs\\foo.md'), 'docs/specs/foo.md');
  assert.equal(canonicalizeExceptionPath('docs/specs/foo.md/'), 'docs/specs/foo.md');

  assert.throws(() => canonicalizeExceptionPath(''), /Exception path must be a non-empty string/);
  assert.throws(() => canonicalizeExceptionPath('   '), /Exception path must be a non-empty string/);
  assert.throws(() => canonicalizeExceptionPath('/docs/specs/foo.md'), /Absolute paths are forbidden/);
  assert.throws(() => canonicalizeExceptionPath('../escape.md'), /Path traversal is forbidden/);
  assert.throws(() => canonicalizeExceptionPath('docs/specs/../../escape.md'), /Path traversal is forbidden/);
});

test('dotfiles: unreviewed dotfile under legacy root is detected and refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    fs.writeFileSync(path.join(rootA, 'regular.md'), 'Content\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Add hidden dotfile
    fs.writeFileSync(path.join(rootA, '.hidden.md'), 'Hidden\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    const finding = result.findings.find((f) => f.path.includes('.hidden.md'));
    assert.ok(finding, 'Must find unreviewed dotfile');
    assert.equal(finding.type, 'unreviewed-new-file');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('non-regular entries: FIFOs and sockets under legacy roots are refused as forbidden-entry (R4)', (t) => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    fs.writeFileSync(path.join(rootA, 'regular.md'), 'Content\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // 1. Deterministic socket test (Node.js net.createServer without external binaries)
    const socketPath = path.join(rootA, 'test.sock');
    let server;
    let socketCreated = false;
    try {
      server = net.createServer();
      server.listen(socketPath);
      socketCreated = fs.existsSync(socketPath) && fs.statSync(socketPath).isSocket();
    } catch {
      // Platform doesn't support unix sockets
    }

    if (socketCreated) {
      const sockResult = checkRatchet({
        repoRoot: tmp,
        baseline,
        exceptions: { version: 1, exceptions: [] },
        roots: ['docs/specs'],
      });
      assert.equal(sockResult.clean, false);
      const sockFinding = sockResult.findings.find((f) => f.path.includes('test.sock'));
      assert.ok(sockFinding, 'Must detect socket');
      assert.equal(sockFinding.type, 'forbidden-entry');
      assert.match(sockFinding.message, /socket/);
      server.close();
      fs.rmSync(socketPath, { force: true });
    }

    // 2. FIFO test (with explicit t.skip if mkfifo is unavailable, never silently passing)
    const pipePath = path.join(rootA, 'test.fifo');
    const mkfifoRes = spawnSync('mkfifo', [pipePath]);
    if (mkfifoRes.status === 0 && fs.existsSync(pipePath)) {
      const fifoResult = checkRatchet({
        repoRoot: tmp,
        baseline,
        exceptions: { version: 1, exceptions: [] },
        roots: ['docs/specs'],
      });

      assert.equal(fifoResult.clean, false);
      const fifoFinding = fifoResult.findings.find((f) => f.path.includes('test.fifo'));
      assert.ok(fifoFinding, 'Must detect FIFO');
      assert.equal(fifoFinding.type, 'forbidden-entry');
      assert.match(fifoFinding.message, /fifo/);
      fs.rmSync(pipePath, { force: true });
    } else if (!socketCreated) {
      t.skip('Both mkfifo and unix domain sockets are unavailable on this platform');
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('symlink identity: replacing a symlink with regular file of identical bytes is refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const targetFile = path.join(rootA, 'target.md');
    fs.writeFileSync(targetFile, 'Same bytes\n');

    const linkPath = path.join(rootA, 'link.md');
    fs.symlinkSync('target.md', linkPath);

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });
    assert.equal(baseline.files['docs/specs/link.md'].isSymlink, true);

    // Replace symlink with regular file containing identical bytes
    fs.unlinkSync(linkPath);
    fs.writeFileSync(linkPath, 'Same bytes\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    const finding = result.findings.find((f) => f.path === 'docs/specs/link.md');
    assert.ok(finding, 'Must detect symlink identity change');
    assert.equal(finding.type, 'symlink-identity-mismatch');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('symlink target: retargeting a symlink to another file of equal bytes is refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const targetA = path.join(rootA, 'targetA.md');
    const targetB = path.join(rootA, 'targetB.md');
    fs.writeFileSync(targetA, 'Identical bytes\n');
    fs.writeFileSync(targetB, 'Identical bytes\n');

    const linkPath = path.join(rootA, 'link.md');
    fs.symlinkSync('targetA.md', linkPath);

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Retarget symlink to targetB
    fs.unlinkSync(linkPath);
    fs.symlinkSync('targetB.md', linkPath);

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    const finding = result.findings.find((f) => f.path === 'docs/specs/link.md');
    assert.ok(finding, 'Must detect symlink target change');
    assert.equal(finding.type, 'symlink-target-mismatch');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('tree escape: symlink pointing outside repository root or directory symlink is refused', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });

    const escapeLink = path.join(rootA, 'escape.md');
    fs.symlinkSync('../../../outside.md', escapeLink);

    const baseline = {
      $schema: 'https://forgent.dev/schemas/legacy-root-baseline.v1.json',
      version: 1,
      roots: ['docs/specs'],
      fileCount: 0,
      files: {},
    };

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    const escapeFinding = result.findings.find((f) => f.path === 'docs/specs/escape.md');
    assert.ok(escapeFinding, 'Must detect tree escape');
    assert.equal(escapeFinding.type, 'tree-escape');

    // Directory symlink test
    fs.unlinkSync(escapeLink);
    const dirTarget = path.join(tmp, 'external-dir');
    fs.mkdirSync(dirTarget);
    const dirLink = path.join(rootA, 'dir-symlink');
    fs.symlinkSync(dirTarget, dirLink);

    const resultDir = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(resultDir.clean, false);
    const dirFinding = resultDir.findings.find((f) => f.path === 'docs/specs/dir-symlink');
    assert.ok(dirFinding, 'Must detect directory symlink');
    assert.equal(dirFinding.type, 'forbidden-entry');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('classification: includes curated generated projections alongside maintained authority', () => {
  assert.equal(classifyFile('docs/specs/platform-foundations.md'), 'generated');
  assert.equal(classifyFile('docs/specs/runner.md'), 'maintained-authority');
  assert.equal(classifyFile('docs/architect/agent-coordination/contracts/session.md'), 'maintained-authority');
  assert.equal(classifyFile('docs/architect/agent-coordination/proposals/p1.md'), 'retained-source');
  assert.equal(classifyFile('docs/architect/agent-coordination/proof.json'), 'history-evidence');
});

test('CLI: exits 0 on clean tree and exits 1 on finding', () => {
  const tmp = mkTmpDir();
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    fs.writeFileSync(path.join(rootA, 'spec.md'), 'Clean spec\n');

    const baseFile = path.join(tmp, 'baseline.json');
    const excFile = path.join(tmp, 'exceptions.json');

    // 1. Write baseline via CLI
    const writeRes = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--write-baseline', '--repo-root', tmp, '--roots', 'docs/specs', '--baseline', baseFile],
      { encoding: 'utf8' }
    );
    assert.equal(writeRes.status, 0, `write-baseline failed: ${writeRes.stderr}`);
    assert.ok(fs.existsSync(baseFile));

    // 2. Check clean baseline via CLI
    const checkRes = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--repo-root', tmp, '--roots', 'docs/specs', '--baseline', baseFile, '--exceptions', excFile],
      { encoding: 'utf8' }
    );
    assert.equal(checkRes.status, 0, `check failed: ${checkRes.stderr}`);
    assert.match(checkRes.stdout, /clean/);

    // 3. Add illegal file
    fs.writeFileSync(path.join(rootA, 'unauthorized.md'), 'Nope\n');

    const failRes = spawnSync(
      process.execPath,
      [SCRIPT_PATH, '--repo-root', tmp, '--roots', 'docs/specs', '--baseline', baseFile, '--exceptions', excFile],
      { encoding: 'utf8' }
    );
    assert.equal(failRes.status, 1, 'CLI should exit 1 on unauthorized file');
    assert.match(failRes.stderr, /unreviewed-new-file/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('live self-check: repository baseline and ratchet verify cleanly', () => {
  const baselinePath = path.resolve(REPO_ROOT, DEFAULT_BASELINE_PATH);
  assert.ok(fs.existsSync(baselinePath), 'Checked-in baseline must exist');

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  assert.equal(baseline.fileCount, 994);

  const res = spawnSync(
    process.execPath,
    [SCRIPT_PATH, '--repo-root', REPO_ROOT],
    { encoding: 'utf8' }
  );
  assert.equal(res.status, 0, `Live check failed: ${res.stderr}\n${res.stdout}`);
  assert.match(res.stdout, /clean/);
});

test('policy-aware: permits edited and new generated projections without exception', () => {
  const tmp = mkTmpDir('gen-proj-test-');
  try {
    const rootA = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootA, { recursive: true });
    const genFile = path.join(rootA, 'platform-foundations.md');
    fs.writeFileSync(genFile, 'Initial generated projection\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });
    assert.equal(baseline.files['docs/specs/platform-foundations.md'].fileClass, 'generated');

    // Modify the generated projection
    fs.writeFileSync(genFile, 'Updated generated projection bytes\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, true, 'Editing generated projection must not fail ratchet');
    assert.equal(result.findings.length, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('policy-aware: permits new and edited history-evidence payloads without exception', () => {
  const tmp = mkTmpDir('evidence-test-');
  try {
    const rootB = path.join(tmp, 'docs/architect');
    fs.mkdirSync(rootB, { recursive: true });
    const evFile = path.join(rootB, 'evidence.json');
    fs.writeFileSync(evFile, '{"evidence": 1}\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/architect'] });
    assert.equal(baseline.files['docs/architect/evidence.json'].fileClass, 'history-evidence');

    // 1. Edit existing history-evidence file
    fs.writeFileSync(evFile, '{"evidence": 2, "updated": true}\n');

    // 2. Add new history-evidence file (.png, .csv, non-.md)
    fs.writeFileSync(path.join(rootB, 'chart.png'), 'fake-png-binary-data');
    fs.writeFileSync(path.join(rootB, 'report.json'), '{"report": "ok"}');

    // 3. Nested non-markdown proof payloads under docs/architect (F1)
    const proofDir = path.join(rootB, 'cell-01');
    fs.mkdirSync(proofDir, { recursive: true });
    fs.writeFileSync(path.join(proofDir, 'proof.json'), '{"proof": 1}');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/architect'],
    });

    assert.equal(result.clean, true, 'New and edited history-evidence payloads must not fail ratchet');
    assert.equal(result.findings.length, 0);

    // Edit proof.json
    fs.writeFileSync(path.join(proofDir, 'proof.json'), '{"proof": 2, "updated": true}');
    const resultAfterEdit = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/architect'],
    });
    assert.equal(resultAfterEdit.clean, true, 'Edited proof.json must not fail ratchet');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('maintained controls: blocks unreviewed new maintained-authority and retained-source files', () => {
  const tmp = mkTmpDir('maint-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    const rootArch = path.join(tmp, 'docs/architect/proposals');
    fs.mkdirSync(rootSpecs, { recursive: true });
    fs.mkdirSync(rootArch, { recursive: true });
    fs.writeFileSync(path.join(rootSpecs, 'base.md'), 'Base spec\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs', 'docs/architect'] });

    // 1. Add new maintained-authority file under docs/specs/
    fs.writeFileSync(path.join(rootSpecs, 'new-authority.md'), '# New spec\n');

    // 2. Add new retained-source file under docs/architect/proposals/
    fs.writeFileSync(path.join(rootArch, 'new-proposal.md'), '# New proposal\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs', 'docs/architect'],
    });

    assert.equal(result.clean, false, 'Unreviewed new maintained files must be refused');
    assert.equal(result.findings.length, 2);
    for (const f of result.findings) {
      assert.equal(f.type, 'unreviewed-new-file');
      assert.match(f.message, /new maintained file under legacy root refused by ratchet/);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('maintained controls: blocks unaccounted edits to maintained-authority and retained-source', () => {
  const tmp = mkTmpDir('maint-edit-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    const rootArch = path.join(tmp, 'docs/architect/proposals');
    fs.mkdirSync(rootSpecs, { recursive: true });
    fs.mkdirSync(rootArch, { recursive: true });
    const specFile = path.join(rootSpecs, 'spec.md');
    const propFile = path.join(rootArch, 'prop.md');
    fs.writeFileSync(specFile, 'Initial spec\n');
    fs.writeFileSync(propFile, 'Initial proposal\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs', 'docs/architect'] });

    // Modify both without exceptions
    fs.writeFileSync(specFile, 'Modified spec without exception\n');
    fs.writeFileSync(propFile, 'Modified proposal without exception\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs', 'docs/architect'],
    });

    assert.equal(result.clean, false, 'Unaccounted edits to maintained files must be refused');
    assert.equal(result.findings.length, 2);
    for (const f of result.findings) {
      assert.equal(f.type, 'unaccounted-edit');
      assert.match(f.message, /maintained file \(class: (maintained-authority|retained-source)\) modified under legacy root/);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('safety: detects and refuses class spoofing attempts in baseline', () => {
  const tmp = mkTmpDir('spoof-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    const fileA = path.join(rootSpecs, 'authority.md');
    fs.writeFileSync(fileA, '# Authority spec\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Attacker modifies baseline to falsely claim this is history-evidence to bypass edit ratchet
    baseline.files['docs/specs/authority.md'].fileClass = 'history-evidence';

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false, 'Class spoofing in baseline must be refused');
    const finding = result.findings.find((f) => f.type === 'file-class-mismatch');
    assert.ok(finding, 'Must detect file-class-mismatch');
    assert.match(finding.message, /file class mismatch \(baseline: history-evidence, classified: maintained-authority\)/);

    // Editing a spoofed baseline entry must also fail closed with unaccounted-edit
    fs.writeFileSync(fileA, '# Authority spec edited by attacker\n');
    const result2 = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });
    assert.equal(result2.clean, false, 'Editing a spoofed entry must fail closed');
    assert.ok(result2.findings.some((f) => f.type === 'file-class-mismatch'));
    assert.ok(result2.findings.some((f) => f.type === 'unaccounted-edit'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('messages: ensure messages do not call non-authority payloads maintained authority', () => {
  const tmp = mkTmpDir('msg-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    fs.writeFileSync(path.join(rootSpecs, 'base.md'), 'Base\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Add new maintained markdown
    fs.writeFileSync(path.join(rootSpecs, 'new-auth.md'), 'New authority\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false);
    const f = result.findings[0];
    assert.equal(f.type, 'unreviewed-new-file');
    assert.match(f.message, /new maintained file under legacy root/);
    assert.match(f.message, /class: maintained-authority/);
    assert.doesNotMatch(f.message, /non-authority/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('expired exceptions: exceptions past expiry date are flagged with expired-exception', () => {
  const tmp = mkTmpDir('exp-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    const target = path.join(rootSpecs, 'spec.md');
    fs.writeFileSync(target, 'Initial\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Modify file
    fs.writeFileSync(target, 'Modified\n');
    const digest = computeSha256(fs.readFileSync(target));

    const exceptions = {
      version: 1,
      exceptions: [
        {
          path: 'docs/specs/spec.md',
          kind: 'allowed-edit',
          rationale: 'Temporary exception that has expired',
          approvedBy: 'Lead',
          owner: 'lead-dev',
          expectedDigest: digest,
          reviewedAt: '2026-08-01',
          expiry: '2026-08-15',
        },
      ],
    };

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions,
      roots: ['docs/specs'],
      today: '2026-09-25',
    });

    assert.equal(result.clean, false, 'Expired exception must fail ratchet');
    const expFinding = result.findings.find((f) => f.type === 'expired-exception');
    assert.ok(expFinding, 'Must report expired-exception finding');
    assert.match(expFinding.message, /exception expired on 2026-08-15/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('unused exceptions: exceptions with no matching on-disk edit or new file are flagged with unused-exception', () => {
  const tmp = mkTmpDir('unused-exc-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    const target = path.join(rootSpecs, 'spec.md');
    fs.writeFileSync(target, 'Initial\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Do NOT modify file, but provide an allowed-edit exception
    const exceptions = {
      version: 1,
      exceptions: [
        {
          path: 'docs/specs/spec.md',
          kind: 'allowed-edit',
          rationale: 'Stale exception for unedited file',
          approvedBy: 'Lead',
          owner: 'lead-dev',
          expectedDigest: computeSha256('Different bytes\n'),
          reviewedAt: '2026-09-25',
          revisitTrigger: 'Phase 08',
        },
        {
          path: 'docs/specs/nonexistent-file.md',
          kind: 'allowed-new-file',
          rationale: 'Stale exception for file that never got created',
          approvedBy: 'Lead',
          owner: 'lead-dev',
          expectedDigest: computeSha256('Nonexistent\n'),
          reviewedAt: '2026-09-25',
          revisitTrigger: 'Phase 08',
        },
      ],
    };

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions,
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false, 'Unused exceptions must fail ratchet');
    const unusedFindings = result.findings.filter((f) => f.type === 'unused-exception');
    assert.equal(unusedFindings.length, 2, 'Must report 2 unused-exception findings');
    assert.match(unusedFindings[0].message, /exception in ledger is unused/);
    assert.match(unusedFindings[1].message, /exception in ledger is unused/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('root-aware and case-safe: blocks docs/specs/*.txt, *.yml, *.MD from bypassing ratchet (F1)', () => {
  const tmp = mkTmpDir('root-aware-case-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    fs.writeFileSync(path.join(rootSpecs, 'existing.md'), '# Initial\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    // Add .txt, .yml, .MD under docs/specs/
    fs.writeFileSync(path.join(rootSpecs, 'spoof.txt'), 'text payload\n');
    fs.writeFileSync(path.join(rootSpecs, 'spoof.yml'), 'yaml: payload\n');
    fs.writeFileSync(path.join(rootSpecs, 'SPOOF.MD'), '# Upper case md\n');

    const result = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: { version: 1, exceptions: [] },
      roots: ['docs/specs'],
    });

    assert.equal(result.clean, false, 'Non-.md and uppercase .MD under docs/specs must not bypass ratchet');
    assert.equal(result.findings.length, 3);
    for (const f of result.findings) {
      assert.equal(f.type, 'unreviewed-new-file');
      assert.match(f.message, /class: maintained-authority/);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('expiry boundary: explicitly tests active vs expired on expiry date (F4)', () => {
  const tmp = mkTmpDir('exp-boundary-test-');
  try {
    const rootSpecs = path.join(tmp, 'docs/specs');
    fs.mkdirSync(rootSpecs, { recursive: true });
    const target = path.join(rootSpecs, 'spec.md');
    fs.writeFileSync(target, 'Initial\n');

    const baseline = generateBaseline({ repoRoot: tmp, roots: ['docs/specs'] });

    fs.writeFileSync(target, 'Modified\n');
    const digest = computeSha256(fs.readFileSync(target));

    const makeExceptions = (expiryDate) => ({
      version: 1,
      exceptions: [
        {
          path: 'docs/specs/spec.md',
          kind: 'allowed-edit',
          rationale: 'Testing boundary',
          approvedBy: 'Lead',
          owner: 'lead-dev',
          expectedDigest: digest,
          reviewedAt: '2026-08-01',
          expiry: expiryDate,
        },
      ],
    });

    // Case 1: today < expiry (e.g. today 2026-08-14, expiry 2026-08-15) -> ACTIVE (clean: true)
    const resultBefore = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: makeExceptions('2026-08-15'),
      roots: ['docs/specs'],
      today: '2026-08-14',
    });
    assert.equal(resultBefore.clean, true, 'Exception must be active when today < expiry');
    assert.equal(resultBefore.findings.length, 0);

    // Case 2: today === expiry (e.g. today 2026-08-15, expiry 2026-08-15) -> EXPIRED (clean: false)
    const resultOn = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: makeExceptions('2026-08-15'),
      roots: ['docs/specs'],
      today: '2026-08-15',
    });
    assert.equal(resultOn.clean, false, 'Exception must expire on its expiry date (today >= expiry)');
    assert.ok(resultOn.findings.some((f) => f.type === 'expired-exception'));

    // Case 3: today > expiry (e.g. today 2026-08-16, expiry 2026-08-15) -> EXPIRED (clean: false)
    const resultAfter = checkRatchet({
      repoRoot: tmp,
      baseline,
      exceptions: makeExceptions('2026-08-15'),
      roots: ['docs/specs'],
      today: '2026-08-16',
    });
    assert.equal(resultAfter.clean, false, 'Exception must remain expired when today > expiry');
    assert.ok(resultAfter.findings.some((f) => f.type === 'expired-exception'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
