#!/usr/bin/env node
// verify-phase-01.mjs -- Authoritative Phase 01 verification runner.
// Enforces that ALL checks run inside a temporary detached clean worktree created
// from required FIXED_END commit SHA (or consume committed blobs), asserting that
// the checked-out commit equals FIXED_END, and never running silently against caller checkout.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const HISTORICAL_PLAN_HASHES = [
  ['55911a8ff77da199b47c9c9453888832448794a3cb88c8484468598e32ffae83', 'plans/260825-1841-knowledge-registry/plan.md'],
  ['f375d8a9d7608dd09d1cceb48e0b1c66c52b8677aedeaf98b9be45d258240f0a', 'plans/260825-1841-knowledge-registry/phase-01-registry-domain-model.md'],
  ['9ff04f56d309fda44ccccc55656914897b9080b8b731932cc1c72492e51b4fca', 'plans/260825-1841-knowledge-registry/phase-02-resolver-alias.md'],
  ['0e31b46314cbb6cc17ea537e180d582112019fd6cc4baee1f62b1bb355bf906d', 'plans/260825-1841-knowledge-registry/phase-03-classifier-inventory.md'],
  ['e86185117f678b3e97fb67ccd4ff58187cc261f576aee3ee6b909dfc35efabe6', 'plans/260825-1841-knowledge-registry/phase-04-bootstrap-registry.md'],
  ['1f381e129d30a3429eba6c34de483c4eaa7c229746bd8c9d8298e9273030093b', 'plans/260825-1841-knowledge-registry/phase-05-registry-verbs.md'],
  ['b457fe0ef3d5d3b8602ffc7e04413da92fb4d1cf10cd0f9b1308bd20684a79a0', 'plans/260825-1841-knowledge-registry/phase-06-attest-gate.md'],
  ['6ddcf3f8ee364e3da5d7c0f90815152b26cca905c5c2f15cb978cae7dad626ae', 'plans/260825-1841-knowledge-registry/phase-07-consumers-resolver.md'],
  ['bee1e02cd6181ac7fdd2360e5d0b323b312428dede03cca799dcf9707fde8c7d', 'plans/260825-1841-knowledge-registry/phase-08-projections-doctor.md'],
  ['c3efd7511ec59c55d48dac188d42d0397d3f9eea66bcdc2f8b966b4464c3d4c6', 'plans/260825-1841-knowledge-registry/phase-09-writer-skill.md'],
  ['9c25b20d750bc0cb3d02fd4c606fe9d605ce16cbff04ec8eba7968f9802fffef', 'plans/260825-1841-knowledge-registry/phase-10-writer-canary.md'],
  ['7cb5bcef217ba2184f7c1c4e25974d8699d14ff2f8a9ba923c344cf9a4bfdc8b', 'plans/260825-1841-knowledge-registry/phase-11-migration.md'],
  ['bd5e832946acb415f96eb4fcdfde1f5c06810dd435a0f4cf292bb208c793057b', 'plans/260825-1841-knowledge-registry/phase-12-deprecate-compound.md'],
];

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function parseArgs(argv) {
  let base = process.env.BASE || null;
  let fixedEnd = process.env.FIXED_END || null;
  let keepWorktree = false;
  let skipFullSuite = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base' && i + 1 < argv.length) {
      base = argv[++i];
    } else if (arg === '--fixed-end' && i + 1 < argv.length) {
      fixedEnd = argv[++i];
    } else if (arg === '--keep-worktree') {
      keepWorktree = true;
    } else if (arg === '--skip-full-suite') {
      skipFullSuite = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/verify-phase-01.mjs --base <sha> --fixed-end <sha> [options]

Options:
  --base <sha>          Required base commit (e.g. tag documentation-authority-phase-00-20260925 peel)
  --fixed-end <sha>     Required immutable commit to evaluate
  --keep-worktree       Keep the temporary detached worktree after completion
  --skip-full-suite     Skip running the full npm test suite (for quick validation)
  --help, -h            Show this help message
`);
      process.exit(0);
    }
  }

  if (!base || typeof base !== 'string' || base.trim() === '') {
    throw new Error('Error: --base <sha> (or BASE environment variable) must be explicitly provided');
  }
  if (!fixedEnd || typeof fixedEnd !== 'string' || fixedEnd.trim() === '') {
    throw new Error('Error: --fixed-end <sha> (or FIXED_END environment variable) must be explicitly provided');
  }

  return { base: base.trim(), fixedEnd: fixedEnd.trim(), keepWorktree, skipFullSuite };
}

export function verifyMarkdownLinks(worktreeDir, baseSha, fixedEndSha) {
  const diffOut = execFileSync('git', ['diff', '--name-only', `${baseSha}..${fixedEndSha}`], {
    cwd: worktreeDir,
    encoding: 'utf8',
  });
  const changedFiles = diffOut.split('\n').map((l) => l.trim()).filter(Boolean);
  const mdFiles = changedFiles.filter((p) => p.toLowerCase().endsWith('.md'));

  const treeOut = execFileSync('git', ['ls-tree', '-r', '--name-only', fixedEndSha], {
    cwd: worktreeDir,
    encoding: 'utf8',
  });
  const treeFiles = new Set(treeOut.split('\n').filter(Boolean));
  const treeDirs = new Set();
  for (const f of treeFiles) {
    const parts = f.split('/');
    for (let i = 1; i < parts.length; i++) {
      treeDirs.add(parts.slice(0, i).join('/'));
    }
  }

  function normpath(p) {
    let norm = path.posix.normalize(p);
    if (norm.length > 1 && norm.endsWith('/')) {
      norm = norm.slice(0, -1);
    }
    return norm;
  }

  function targetExistsInTree(targetPath) {
    const norm = normpath(targetPath);
    return treeFiles.has(norm) || treeDirs.has(norm);
  }

  const errors = [];
  const linkRegex = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;

  for (const filePath of mdFiles) {
    try {
      execFileSync('git', ['cat-file', '-e', `${fixedEndSha}:${filePath}`], {
        cwd: worktreeDir,
        stdio: 'pipe',
      });
    } catch {
      continue;
    }

    const content = execFileSync('git', ['show', `${fixedEndSha}:${filePath}`], {
      cwd: worktreeDir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const parentDir = path.posix.dirname(filePath);
    const lines = content.split('\n');
    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1];
      for (const match of line.matchAll(linkRegex)) {
        const rawTarget = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, '');
        if (
          rawTarget.startsWith('http://') ||
          rawTarget.startsWith('https://') ||
          rawTarget.startsWith('mailto:') ||
          rawTarget.startsWith('#')
        ) {
          continue;
        }
        const targetFile = rawTarget.split('#')[0];
        if (!targetFile) continue;

        const resolvedTarget = normpath(path.posix.join(parentDir, targetFile));
        if (!targetExistsInTree(resolvedTarget)) {
          errors.push(`${filePath}:${lineNum}: missing link target "${rawTarget}" in ${fixedEndSha} tree`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Markdown link validation failed with ${errors.length} broken link(s):\n${errors.join('\n')}`);
  }

  return { checkedBlobsCount: mdFiles.length };
}

export function runPhase01Verification(options, repoRoot = REPO_ROOT) {
  const { base, fixedEnd, keepWorktree = false, skipFullSuite = false } = options;

  console.log('===============================================================');
  console.log(' Phase 01 Authoritative Verification (Isolated Clean Worktree)');
  console.log('===============================================================');
  console.log(`Base:      ${base}`);
  console.log(`FIXED_END: ${fixedEnd}`);
  console.log(`Repo root: ${repoRoot}`);

  // 1. Resolve and validate commit SHAs
  let baseSha;
  let fixedEndSha;
  try {
    baseSha = execFileSync('git', ['rev-parse', '--verify', `${base}^{commit}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`BASE "${base}" does not resolve to a valid commit: ${err.message}`);
  }

  try {
    fixedEndSha = execFileSync('git', ['rev-parse', '--verify', `${fixedEnd}^{commit}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`FIXED_END "${fixedEnd}" does not resolve to a valid commit: ${err.message}`);
  }

  console.log(`Resolved BASE commit:      ${baseSha}`);
  console.log(`Resolved FIXED_END commit: ${fixedEndSha}`);

  const fixedEndTree = execFileSync('git', ['rev-parse', `${fixedEndSha}^{tree}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  console.log(`FIXED_END tree hash:       ${fixedEndTree}`);

  // 2. Create temporary clean detached worktree at FIXED_END
  const tempWorktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-verify-phase01-'));
  fs.rmdirSync(tempWorktreeDir);

  console.log(`\nCreating detached clean worktree at ${tempWorktreeDir}...`);
  execFileSync('git', ['worktree', 'add', '--detach', tempWorktreeDir, fixedEndSha], {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const receipt = {
    verifiedAt: new Date().toISOString(),
    baseSha,
    fixedEndSha,
    fixedEndTree,
    worktreePath: tempWorktreeDir,
    checks: {},
  };

  try {
    // 3. Assert worktree invariants
    const worktreeHead = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    }).trim();

    if (worktreeHead !== fixedEndSha) {
      throw new Error(`Worktree checkout mismatch: HEAD (${worktreeHead}) does not equal FIXED_END (${fixedEndSha})`);
    }

    const porcelain = execFileSync('git', ['status', '--porcelain'], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    }).trim();

    if (porcelain !== '') {
      throw new Error(`Worktree is not clean upon checkout: status entries:\n${porcelain}`);
    }
    console.log('✓ Asserted: worktree HEAD strictly equals FIXED_END and checkout is clean');

    // 4. Provision dependencies inside the isolated worktree
    console.log('\n[Setup] Provisioning dependencies in clean worktree (npm install)...');
    execFileSync('npm', ['install'], {
      cwd: tempWorktreeDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const targetSrc = path.join(repoRoot, 'target');
    if (fs.existsSync(targetSrc) && !fs.existsSync(path.join(tempWorktreeDir, 'target'))) {
      fs.symlinkSync(targetSrc, path.join(tempWorktreeDir, 'target'), 'dir');
    }
    console.log('✓ Dependencies provisioned');

    // 5. Check 1: Focused Ratchet and Shipped Inventory Tests
    console.log('\n[Check 1/7] Running focused tests inside worktree...');
    const focusedRes = spawnSync(
      process.execPath,
      [
        '--test',
        'test/scripts/check-legacy-docs-ratchet.test.mjs',
        'test/scripts/generate-shipped-path-inventory.test.mjs',
      ],
      { cwd: tempWorktreeDir, encoding: 'utf8' }
    );
    if (focusedRes.status !== 0) {
      throw new Error(`Focused tests failed (exit code ${focusedRes.status}):\n${focusedRes.stderr}\n${focusedRes.stdout}`);
    }
    console.log('✓ Focused tests passed cleanly (check-legacy-docs-ratchet + generate-shipped-path-inventory)');
    receipt.checks.focused = { passed: true };

    // 6. Check 2: Live ratchet self-check and determinism
    console.log('\n[Check 2/7] Running live ratchet self-check and inventory determinism inside worktree...');
    const ratchetRes = spawnSync(process.execPath, ['scripts/check-legacy-docs-ratchet.mjs'], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    });
    if (ratchetRes.status !== 0) {
      throw new Error(`Live ratchet self-check failed:\n${ratchetRes.stderr}\n${ratchetRes.stdout}`);
    }
    console.log('✓ Live ratchet self-check clean');

    const baselineNonce = `${process.pid}-${Date.now()}`;
    const tmpBaseline1 = path.join(os.tmpdir(), `legacy-baseline1-${baselineNonce}.json`);
    const tmpBaseline2 = path.join(os.tmpdir(), `legacy-baseline2-${baselineNonce}.json`);
    try {
      for (const outputPath of [tmpBaseline1, tmpBaseline2]) {
        execFileSync(
          process.execPath,
          ['scripts/check-legacy-docs-ratchet.mjs', '--write-baseline', '--baseline', outputPath],
          { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] }
        );
      }
      const baseline1 = fs.readFileSync(tmpBaseline1);
      const baseline2 = fs.readFileSync(tmpBaseline2);
      if (!baseline1.equals(baseline2)) {
        throw new Error('Legacy baseline generation is not deterministic at FIXED_END');
      }
      receipt.checks.baselineDeterminism = { passed: true, sha256: sha256(baseline1) };
      console.log('✓ Legacy baseline generation is deterministic at FIXED_END');
    } finally {
      for (const tmpPath of [tmpBaseline1, tmpBaseline2]) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    }

    // Deterministic inventory generation (MUST explicitly pass fixedEndSha)
    const nonce = `${process.pid}-${Date.now()}`;
    const tmpInv1 = path.join(os.tmpdir(), `inv1-${nonce}.json`);
    const tmpInv2 = path.join(os.tmpdir(), `inv2-${nonce}.json`);
    const tmpMd1 = path.join(os.tmpdir(), `inv1-${nonce}.md`);
    const tmpMd2 = path.join(os.tmpdir(), `inv2-${nonce}.md`);
    try {
      execFileSync(
        process.execPath,
        ['scripts/generate-shipped-path-inventory.mjs', '--commit', fixedEndSha, '--json-out', tmpInv1, '--md-out', tmpMd1],
        { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      execFileSync(
        process.execPath,
        ['scripts/generate-shipped-path-inventory.mjs', '--commit', fixedEndSha, '--json-out', tmpInv2, '--md-out', tmpMd2],
        { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const json1 = fs.readFileSync(tmpInv1);
      const json2 = fs.readFileSync(tmpInv2);
      const md1 = fs.readFileSync(tmpMd1);
      const md2 = fs.readFileSync(tmpMd2);
      if (!json1.equals(json2) || !md1.equals(md2)) {
        throw new Error('Deterministic inventory check failed: consecutive JSON/Markdown runs produced different bytes');
      }

      const inventoryDir = path.join(tempWorktreeDir, 'plans/260925-documentation-authority-unification');
      const committedJson = fs.readFileSync(path.join(inventoryDir, 'shipped-path-conventions-inventory.json'));
      const committedMd = fs.readFileSync(path.join(inventoryDir, 'shipped-path-conventions-inventory.md'));
      if (!json1.equals(committedJson) || !md1.equals(committedMd)) {
        throw new Error('Committed shipped-path-conventions inventory JSON/Markdown do not match freshly generated artifacts for FIXED_END');
      }
      console.log('✓ Shipped inventory JSON/Markdown are deterministic and byte-identical to committed artifacts');
      receipt.checks.inventoryDeterminism = {
        passed: true,
        jsonSha256: sha256(json1),
        markdownSha256: sha256(md1),
      };
    } finally {
      for (const tmpPath of [tmpInv1, tmpInv2, tmpMd1, tmpMd2]) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    }

    // 7. Check 3: Affected tests (docs tests, decision citation drift, ownership lint)
    console.log('\n[Check 3/7] Running affected tests inside worktree...');
    const docTests = fs
      .readdirSync(path.join(tempWorktreeDir, 'test/docs'))
      .filter((f) => f.endsWith('.test.mjs'))
      .map((f) => path.join('test/docs', f));

    const affectedRes = spawnSync(
      process.execPath,
      ['--test', ...docTests, 'test/scripts/check-decision-citation-drift.test.mjs'],
      { cwd: tempWorktreeDir, encoding: 'utf8' }
    );
    if (affectedRes.status !== 0) {
      throw new Error(`Affected tests failed:\n${affectedRes.stderr}\n${affectedRes.stdout}`);
    }

    const ownershipRes = spawnSync(process.execPath, ['scripts/test-ownership-lint.mjs'], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    });
    if (ownershipRes.status !== 0) {
      throw new Error(`Ownership lint failed:\n${ownershipRes.stderr}\n${ownershipRes.stdout}`);
    }
    console.log('✓ Affected docs/citation/ownership tests passed cleanly');
    receipt.checks.affected = { passed: true };

    // 8. Check 4: Changed-markdown relative link verification across BASE..FIXED_END
    console.log('\n[Check 4/7] Verifying changed-markdown relative links across committed range...');
    const linkCheck = verifyMarkdownLinks(tempWorktreeDir, baseSha, fixedEndSha);
    console.log(`✓ All relative links in ${linkCheck.checkedBlobsCount} changed Markdown blob(s) exist in ${fixedEndSha} tree`);
    receipt.checks.markdownLinks = { passed: true, blobsChecked: linkCheck.checkedBlobsCount };

    // 9. Check 5: Historical Knowledge-Registry plan byte-identity check
    console.log('\n[Check 5/7] Checking byte-identity of historical plan files...');
    for (const [expectedHash, relPath] of HISTORICAL_PLAN_HASHES) {
      const fullPath = path.join(tempWorktreeDir, relPath);
      const actualHash = sha256(fs.readFileSync(fullPath));
      if (actualHash !== expectedHash) {
        throw new Error(`Historical plan file mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
      }
    }
    console.log('✓ All 13 historical knowledge-registry plan files verified byte-identical');
    receipt.checks.historicalPlans = { passed: true, filesVerified: 13 };

    // 10. Check 6: Git diff cleanliness and scope boundary
    console.log('\n[Check 6/7] Checking git diff cleanliness across BASE..FIXED_END...');
    const diffCheckRes = spawnSync('git', ['diff', '--check', `${baseSha}..${fixedEndSha}`], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    });
    if (diffCheckRes.status !== 0) {
      throw new Error(`Git diff check reported errors:\n${diffCheckRes.stderr}\n${diffCheckRes.stdout}`);
    }

    // Assert forbidden paths were not modified
    const diffNames = execFileSync('git', ['diff', '--name-only', `${baseSha}..${fixedEndSha}`], {
      cwd: tempWorktreeDir,
      encoding: 'utf8',
    }).split('\n').filter(Boolean);

    for (const name of diffNames) {
      if (name.startsWith('docs/specs/') && name !== 'docs/specs/reading-map.md') {
        throw new Error(`Forbidden edit to docs/specs: ${name}`);
      }
      if (name.startsWith('docs/architect/')) {
        throw new Error(`Forbidden edit to docs/architect: ${name}`);
      }
    }
    console.log('✓ Git diff check passed cleanly and scope boundaries verified');
    receipt.checks.scopeBoundary = { passed: true };

    // 11. Check 7: Full suite (npm test)
    if (!skipFullSuite) {
      console.log('\n[Check 7/7] Running full test suite (npm test) inside clean worktree...');
      const logPath = path.join(os.tmpdir(), `phase01-full-suite-${Date.now()}.log`);
      const testStart = new Date().toISOString();

      const testRes = spawnSync('npm', ['test'], {
        cwd: tempWorktreeDir,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      });

      const testEnd = new Date().toISOString();
      const testOutput = (testRes.stdout || '') + '\n' + (testRes.stderr || '');
      fs.writeFileSync(logPath, testOutput);

      if (testRes.status !== 0) {
        throw new Error(`Full test suite failed (exit ${testRes.status}). Output saved to ${logPath}`);
      }

      const logSha = sha256(fs.readFileSync(logPath));
      console.log(`✓ Full test suite passed (exit code 0). Log written to ${logPath} (SHA: ${logSha})`);

      // Extract test totals from log output
      // node:test outputs summary like:
      // ℹ tests 7760
      // ℹ pass 7684
      // ℹ fail 0
      // ℹ cancelled 0
      // ℹ skipped 8
      // ℹ todo 68
      const testsMatch = testOutput.match(/ℹ tests\s+(\d+)/);
      const passMatch = testOutput.match(/ℹ pass\s+(\d+)/);
      const failMatch = testOutput.match(/ℹ fail\s+(\d+)/);
      const skipMatch = testOutput.match(/ℹ skipped\s+(\d+)/);
      const todoMatch = testOutput.match(/ℹ todo\s+(\d+)/);

      receipt.checks.fullSuite = {
        passed: true,
        exitCode: testRes.status,
        startTime: testStart,
        endTime: testEnd,
        logPath,
        logSha256: logSha,
        totals: {
          total: testsMatch ? parseInt(testsMatch[1], 10) : null,
          pass: passMatch ? parseInt(passMatch[1], 10) : null,
          fail: failMatch ? parseInt(failMatch[1], 10) : 0,
          skipped: skipMatch ? parseInt(skipMatch[1], 10) : 0,
          todo: todoMatch ? parseInt(todoMatch[1], 10) : 0,
        },
      };
    } else {
      console.log('\n[Check 7/7] Skipped full test suite (--skip-full-suite)');
      receipt.checks.fullSuite = { skipped: true };
    }

    console.log('\n===============================================================');
    console.log(' ALL VERIFICATION CHECKS PASSED CLEANLY');
    console.log('===============================================================');
    return receipt;
  } finally {
    if (!keepWorktree) {
      console.log(`\nCleaning up temporary worktree ${tempWorktreeDir}...`);
      try {
        execFileSync('git', ['worktree', 'remove', '--force', tempWorktreeDir], {
          cwd: repoRoot,
          stdio: 'ignore',
        });
      } catch {}
      if (fs.existsSync(tempWorktreeDir)) {
        try {
          fs.rmSync(tempWorktreeDir, { recursive: true, force: true });
        } catch {}
      }
      console.log('✓ Temporary worktree removed');
    } else {
      console.log(`\nNotice: Worktree retained at ${tempWorktreeDir} (--keep-worktree)`);
    }
  }
}

export function runCli(argv, cwd = process.cwd()) {
  try {
    const options = parseArgs(argv);
    const receipt = runPhase01Verification(options, cwd);
    console.log('\nVerification receipt JSON:');
    console.log(JSON.stringify(receipt, null, 2));
    return 0;
  } catch (err) {
    console.error(`\nVerification FAILED: ${err.message}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
