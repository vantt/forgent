#!/usr/bin/env node
// verify-phase-02.mjs -- Authoritative immutable Phase 02 verification runner.
// Enforces that all checks run inside a temporary detached clean worktree created
// exactly at required FIXED_END, while every Phase 02 inventory artifact is
// regenerated from required immutable BASE and byte-compared with committed blobs.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './lib/is-main-module.mjs';
import { HISTORICAL_PLAN_HASHES, verifyMarkdownLinks } from './verify-phase-01.mjs';
import { loadShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import { inspectRepo, statusEntries } from './lib/git-ports.mjs';
import { inspectEntries, inspectPath } from '../src/util/git-paths.mjs';
import { resolveCommitSha } from './lib/doc-git-reads.mjs';
import { createGitWorktree } from '../src/git/worktree.mjs';
import { gitPortOptions } from '../src/git/inspect.mjs';
import { removeWorktree } from '../src/runner/worktree.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PHASE_DIR = 'plans/260925-documentation-authority-unification';
export const PHASE02_JSON = `${PHASE_DIR}/phase-02-doc-inventory.json`;
export const PHASE02_PART_DIR = `${PHASE_DIR}/phase-02-doc-inventory.parts`;
export const PHASE02_MD = `${PHASE_DIR}/phase-02-doc-inventory.md`;
export const PHASE02_IDENTITY_REGISTRY = `${PHASE_DIR}/phase-02-identity-registry.json`;
export const PHASE02_VOCAB = `${PHASE_DIR}/claim-and-disposition-vocabulary.json`;
export const PHASE02_ALLOWED_PATHS = new Set([
  'CHANGELOG.md',
  'scripts/doc-inventory-artifact.mjs',
  'scripts/generate-doc-inventory.mjs',
  'scripts/check-doc-inventory-gates.mjs',
  'scripts/verify-phase-02.mjs',
  'test/scripts/generate-doc-inventory.test.mjs',
  'test/scripts/verify-phase-02.test.mjs',
  `${PHASE_DIR}/plan.md`,
  `${PHASE_DIR}/phase-02-verification.md`,
  `${PHASE_DIR}/phase-02-execution-record.md`,
  PHASE02_JSON,
  PHASE02_MD,
  PHASE02_IDENTITY_REGISTRY,
]);

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
    if (arg === '--base' && i + 1 < argv.length) base = argv[++i];
    else if (arg === '--fixed-end' && i + 1 < argv.length) fixedEnd = argv[++i];
    else if (arg === '--keep-worktree') keepWorktree = true;
    else if (arg === '--skip-full-suite') skipFullSuite = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/verify-phase-02.mjs --base <sha> --fixed-end <sha> [options]\n\nOptions:\n  --base <sha>          Required immutable Phase 01/base commit used to generate Phase 02 inventory\n  --fixed-end <sha>     Required immutable Phase 02 commit to evaluate\n  --keep-worktree       Keep the temporary detached worktree after completion\n  --skip-full-suite     Skip running the full npm test suite\n  --help, -h            Show this help message\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
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

function resolveCommit(repoRoot, value, label) {
  try {
    return resolveCommitSha(value, repoRoot);
  } catch (err) {
    throw new Error(`${label} "${value}" does not resolve to a valid commit: ${err.message}`);
  }
}

function runOrThrow(command, args, options = {}) {
  const res = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (res.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (exit ${res.status}):\n${res.stderr || ''}\n${res.stdout || ''}`);
  }
  return res;
}

function parseNodeTestTotals(output) {
  const pick = (name) => {
    const m = output.match(new RegExp(`(?:ℹ|#) ${name}\\s+(\\d+)`));
    return m ? Number.parseInt(m[1], 10) : null;
  };
  return {
    total: pick('tests'),
    pass: pick('pass'),
    fail: pick('fail'),
    skipped: pick('skipped'),
    todo: pick('todo'),
  };
}

function fileArtifact(filePath) {
  const buf = fs.readFileSync(filePath);
  return { bytes: buf.length, sha256: sha256(buf) };
}

function readJson(filePath) {
  return loadShardedJsonArtifact(filePath, { allowLegacyRawJson: false });
}

function byteCompare(actualPath, expectedPath, label) {
  const actual = fs.readFileSync(actualPath);
  const expected = fs.readFileSync(expectedPath);
  if (!actual.equals(expected)) {
    throw new Error(`${label} is not byte-identical to committed artifact ${expectedPath}`);
  }
}

export function verifyForbiddenPhase02Diff(worktreeDir, baseSha, fixedEndSha, deps = {}) {
  const run = deps.run || ((command, args) => runOrThrow(command, args, { cwd: worktreeDir }));
  const diffNames = deps.diffNames || (() => {
    const port = inspectRepo(worktreeDir);
    return inspectEntries((page) => port.diff({ before: baseSha, after: fixedEndSha, ...page })).map((entry) => inspectPath(entry.path));
  });

  run('git', ['diff', '--check', `${baseSha}..${fixedEndSha}`]);
  const names = diffNames();

  const forbidden = names.filter((name) => {
    if (name.startsWith(`${PHASE02_PART_DIR}/`)) return false;
    return !PHASE02_ALLOWED_PATHS.has(name);
  });
  if (forbidden.length > 0) {
    throw new Error(`Forbidden unrelated edit(s) in Phase 02 remediation diff:\n${forbidden.join('\n')}`);
  }
  return { changedPathCount: names.length, changedPaths: names };
}

export function runPhase02Verification(options, repoRoot = REPO_ROOT) {
  const { base, fixedEnd, keepWorktree = false, skipFullSuite = false } = options;
  console.log('===============================================================');
  console.log(' Phase 02 Authoritative Verification (Immutable Detached Tree)');
  console.log('===============================================================');
  console.log(`Base:      ${base}`);
  console.log(`FIXED_END: ${fixedEnd}`);
  console.log(`Repo root: ${repoRoot}`);

  const baseSha = resolveCommit(repoRoot, base, 'BASE');
  const fixedEndSha = resolveCommit(repoRoot, fixedEnd, 'FIXED_END');
  const fixedEndTree = execFileSync('git', ['rev-parse', `${fixedEndSha}^{tree}`], { cwd: repoRoot, encoding: 'utf8' }).trim();
  console.log(`Resolved BASE commit:      ${baseSha}`);
  console.log(`Resolved FIXED_END commit: ${fixedEndSha}`);
  console.log(`FIXED_END tree hash:       ${fixedEndTree}`);

  const tempWorktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-verify-phase02-'));
  fs.rmdirSync(tempWorktreeDir);
  console.log(`\nCreating detached clean worktree at ${tempWorktreeDir}...`);
  createGitWorktree(gitPortOptions(repoRoot, { mutation: true })).createDetached({
    path: tempWorktreeDir, base: fixedEndSha, operationId: crypto.randomUUID(),
  });

  const receipt = {
    schema: 'fgos.phase02.verification.receipt.v1',
    verifiedAt: new Date().toISOString(),
    baseSha,
    fixedEndSha,
    fixedEndTree,
    worktreePath: tempWorktreeDir,
    checks: {},
    artifacts: {},
    testTotals: {},
  };

  // Record our own setup outputs before creation, including partial failures.
  // Existing checkout bytes remain subject to the guarded removal contract.
  const installedPaths = [];
  try {
    const head = resolveCommitSha('HEAD', tempWorktreeDir);
    if (head !== fixedEndSha) throw new Error(`Worktree checkout mismatch: HEAD ${head} !== FIXED_END ${fixedEndSha}`);
    const initialEntries = statusEntries(inspectRepo(tempWorktreeDir), 'normal');
    const status = initialEntries.length ? JSON.stringify(initialEntries) : '';
    if (status) throw new Error(`Worktree is not clean upon checkout:\n${status}`);
    receipt.checks.worktreeBinding = { passed: true, head };
    console.log('✓ Asserted clean detached worktree exactly at FIXED_END before setup');

    console.log('\n[Setup] Provisioning dependencies in clean worktree (npm ci when lockfile exists)...');
    const npmArgs = fs.existsSync(path.join(tempWorktreeDir, 'package-lock.json')) ? ['ci'] : ['install'];
    const nodeModules = path.join(tempWorktreeDir, 'node_modules');
    if (!fs.lstatSync(nodeModules, { throwIfNoEntry: false })) installedPaths.push(nodeModules);
    runOrThrow('npm', npmArgs, { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
    const postSetupEntries = statusEntries(inspectRepo(tempWorktreeDir), 'none');
    const postSetupStatus = postSetupEntries.length ? JSON.stringify(postSetupEntries) : '';
    if (postSetupStatus) throw new Error(`Tracked files changed after dependency setup:\n${postSetupStatus}`);
    receipt.checks.setup = { passed: true, command: `npm ${npmArgs.join(' ')}` };
    console.log('✓ Dependencies provisioned without tracked-file changes');

    console.log('\n[Check 1/9] Running focused Phase 02 tests...');
    const focused = runOrThrow(process.execPath, [
      '--test',
      'test/scripts/generate-doc-inventory.test.mjs',
      'test/scripts/verify-phase-02.test.mjs',
    ], { cwd: tempWorktreeDir, encoding: 'utf8' });
    const focusedOutput = `${focused.stdout || ''}\n${focused.stderr || ''}`;
    receipt.checks.focusedTests = { passed: true };
    receipt.testTotals.focused = parseNodeTestTotals(focusedOutput);
    console.log('✓ Focused Phase 02 tests passed');

    console.log('\n[Check 2/9] Regenerating Phase 02 inventory from immutable BASE and byte-comparing committed artifacts...');
    const nonce = `${process.pid}-${Date.now()}`;
    const tmpRoot = path.join(os.tmpdir(), `phase02-inventory-${nonce}`);
    const tmpJson = path.join(tmpRoot, PHASE02_JSON);
    const tmpMd = path.join(tmpRoot, PHASE02_MD);
    try {
      runOrThrow(process.execPath, [
        'scripts/generate-doc-inventory.mjs',
        '--commit', baseSha,
        '--identity-registry', PHASE02_IDENTITY_REGISTRY,
        '--json-out', tmpJson,
        '--md-out', tmpMd,
      ], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
      byteCompare(tmpJson, path.join(tempWorktreeDir, PHASE02_JSON), 'Regenerated Phase 02 JSON manifest');
      const manifest = JSON.parse(fs.readFileSync(tmpJson, 'utf8'));
      for (const part of manifest.parts || []) byteCompare(path.join(path.dirname(tmpJson), part.path), path.join(tempWorktreeDir, PHASE_DIR, part.path), `Regenerated Phase 02 shard ${part.path}`);
      byteCompare(tmpMd, path.join(tempWorktreeDir, PHASE02_MD), 'Regenerated Phase 02 Markdown inventory');
      const inventory = readJson(tmpJson);
      const identityRegistryPath = path.join(tempWorktreeDir, PHASE02_IDENTITY_REGISTRY);
      const identityRegistry = JSON.parse(fs.readFileSync(identityRegistryPath, 'utf8'));
      if (identityRegistry.commit !== baseSha) throw new Error(`Phase 02 identity registry commit ${identityRegistry.commit || '<missing>'} does not match immutable BASE ${baseSha}`);
      if (!Array.isArray(identityRegistry.documents) || identityRegistry.documents.length !== inventory.summary.scannedFilesCount) throw new Error(`Phase 02 identity registry document count ${identityRegistry.documents?.length ?? '<missing>'} does not match inventory file count ${inventory.summary.scannedFilesCount}`);
      if (!Array.isArray(identityRegistry.units) || identityRegistry.units.length < inventory.summary.claimCount) throw new Error(`Phase 02 identity registry unit count ${identityRegistry.units?.length ?? '<missing>'} is smaller than inventory claim count ${inventory.summary.claimCount}`);
      receipt.artifacts.phase02IdentityRegistry = { path: PHASE02_IDENTITY_REGISTRY, ...fileArtifact(identityRegistryPath), documents: identityRegistry.documents.length, units: identityRegistry.units.length };
      receipt.artifacts.phase02JsonManifest = { path: PHASE02_JSON, ...fileArtifact(tmpJson) };
      receipt.artifacts.phase02JsonShards = (manifest.parts || []).map((part) => ({ path: `${PHASE_DIR}/${part.path}`, bytes: part.bytes, sha256: part.sha256 }));
      receipt.artifacts.phase02Markdown = { path: PHASE02_MD, ...fileArtifact(tmpMd) };
      receipt.artifacts.counts = {
        scannedFiles: inventory.summary?.scannedFilesCount ?? null,
        claims: inventory.summary?.claimCount ?? null,
        consumerEdges: Array.isArray(inventory.consumerEdges) ? inventory.consumerEdges.length : null,
        gaps: inventory.summary?.gapCount ?? null,
        duplicateContentGroups: inventory.summary?.duplicateContentGroupCount ?? null,
        semanticConflictGroups: inventory.summary?.semanticConflictGroupCount ?? null,
      };
      receipt.checks.inventoryByteIdentity = { passed: true, generatedFrom: baseSha, shardCount: manifest.partCount };
    } finally {
      if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
    console.log('✓ Phase 02 JSON manifest, every shard, and Markdown artifact are byte-identical to immutable-BASE regeneration');

    console.log('\n[Check 3/9] Running Phase 02 inventory gate checker...');
    const gate = runOrThrow(process.execPath, [
      'scripts/check-doc-inventory-gates.mjs',
      '--inventory', PHASE02_JSON,
      '--vocabulary', PHASE02_VOCAB,
      '--identity-registry', PHASE02_IDENTITY_REGISTRY,
      '--json',
    ], { cwd: tempWorktreeDir, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 });
    const gateJson = JSON.parse(gate.stdout);
    const open = gateJson.explicitOpenFindings || {};
    receipt.checks.inventoryGate = {
      passed: gateJson.clean === true,
      explicitOpenFindingCounts: {
        gaps: open.gapCount ?? null,
        fileGaps: open.fileGapCount ?? null,
        claimIdentityGaps: open.claimIdentityGapCount ?? null,
        duplicateContentGroups: open.duplicateContentGroupCount ?? null,
        semanticConflictGroups: open.semanticConflictGroupCount ?? null,
      },
    };
    console.log('✓ Inventory gate checker passed');

    console.log('\n[Check 4/9] Running legacy docs ratchet...');
    runOrThrow(process.execPath, ['scripts/check-legacy-docs-ratchet.mjs'], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
    receipt.checks.legacyRatchet = { passed: true };
    console.log('✓ Legacy ratchet passed');

    console.log('\n[Check 5/9] Running docs/citation/ownership checks...');
    const docTests = fs.readdirSync(path.join(tempWorktreeDir, 'test/docs')).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join('test/docs', f));
    const docs = runOrThrow(process.execPath, ['--test', ...docTests, 'test/scripts/check-decision-citation-drift.test.mjs', 'test/scripts/test-ownership-lint.test.mjs'], { cwd: tempWorktreeDir, encoding: 'utf8' });
    runOrThrow(process.execPath, ['scripts/check-decision-citation-drift.mjs'], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
    runOrThrow(process.execPath, ['scripts/test-ownership-lint.mjs'], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
    receipt.checks.docsCitationOwnership = { passed: true };
    receipt.testTotals.docsCitationOwnership = parseNodeTestTotals(`${docs.stdout || ''}\n${docs.stderr || ''}`);
    console.log('✓ Docs/citation/ownership checks passed');

    console.log('\n[Check 6/9] Verifying changed-Markdown links against committed FIXED_END tree...');
    const linkCheck = verifyMarkdownLinks(tempWorktreeDir, baseSha, fixedEndSha);
    receipt.checks.markdownLinks = { passed: true, blobsChecked: linkCheck.checkedBlobsCount };
    console.log(`✓ Changed Markdown link targets exist (${linkCheck.checkedBlobsCount} blob(s) checked)`);

    console.log('\n[Check 7/9] Checking historical plan preservation...');
    for (const [expectedHash, relPath] of HISTORICAL_PLAN_HASHES) {
      const actual = sha256(fs.readFileSync(path.join(tempWorktreeDir, relPath)));
      if (actual !== expectedHash) throw new Error(`Historical plan file mismatch for ${relPath}: expected ${expectedHash}, got ${actual}`);
    }
    receipt.checks.historicalPlans = { passed: true, filesVerified: HISTORICAL_PLAN_HASHES.length };
    console.log(`✓ Historical plan files preserved (${HISTORICAL_PLAN_HASHES.length})`);

    console.log('\n[Check 8/9] Checking BASE..FIXED_END diff and forbidden legacy edits...');
    receipt.checks.diffScope = { passed: true, ...verifyForbiddenPhase02Diff(tempWorktreeDir, baseSha, fixedEndSha) };
    console.log('✓ Diff check and forbidden legacy edit checks passed');

    if (!skipFullSuite) {
      console.log('\n[Check 9/9] Building clean-worktree Rust release binaries, then running full npm test suite...');
      const target = path.join(tempWorktreeDir, 'target');
      if (!fs.lstatSync(target, { throwIfNoEntry: false })) installedPaths.push(target);
      const rustBuild = runOrThrow('cargo', ['build', '--release', '--workspace'], {
        cwd: tempWorktreeDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 80 * 1024 * 1024,
      });
      receipt.checks.rustReleaseBuild = {
        passed: true,
        command: 'cargo build --release --workspace',
        outputSha256: sha256(Buffer.from(`${rustBuild.stdout || ''}\n${rustBuild.stderr || ''}`)),
      };
      const logPath = path.join(os.tmpdir(), `phase02-full-suite-${Date.now()}.log`);
      const startedAt = new Date().toISOString();
      const full = spawnSync('npm', ['test'], { cwd: tempWorktreeDir, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 });
      const endedAt = new Date().toISOString();
      const out = `${full.stdout || ''}\n${full.stderr || ''}`;
      fs.writeFileSync(logPath, out);
      if (full.status !== 0) throw new Error(`Full test suite failed (exit ${full.status}). Output saved to ${logPath}`);
      receipt.checks.fullSuite = { passed: true, exitCode: full.status, startedAt, endedAt, logPath, logSha256: sha256(fs.readFileSync(logPath)) };
      receipt.testTotals.fullSuite = parseNodeTestTotals(out);
      console.log(`✓ Full npm test suite passed; log ${logPath}`);
    } else {
      receipt.checks.fullSuite = { skipped: true };
      console.log('\n[Check 9/9] Skipped full npm test suite (--skip-full-suite)');
    }

    const finalEntries = statusEntries(inspectRepo(tempWorktreeDir), 'none');
    const finalStatus = finalEntries.length ? JSON.stringify(finalEntries) : '';
    if (finalStatus) throw new Error(`Tracked files changed after verification checks:\n${finalStatus}`);
    receipt.checks.cleanAfterChecks = { passed: true, ignoredGeneratedDepsAccountedFor: true };

    console.log('\n===============================================================');
    console.log(' ALL PHASE 02 VERIFICATION CHECKS PASSED CLEANLY');
    console.log('===============================================================');
    return receipt;
  } finally {
    if (!keepWorktree) {
      console.log(`\nCleaning up temporary worktree ${tempWorktreeDir}...`);
      try {
        // Remove only our regenerable outputs; other dirt still refuses removal.
        for (const installed of installedPaths) fs.rmSync(installed, { recursive: true, force: true });
        removeWorktree(repoRoot, tempWorktreeDir);
        console.log('✓ Temporary worktree removed');
      } catch (err) {
        console.warn(`Temporary worktree retained at ${tempWorktreeDir}: ${err.message}`);
      }
    } else {
      console.log(`\nNotice: Worktree retained at ${tempWorktreeDir} (--keep-worktree)`);
    }
  }
}

export function runCli(argv, cwd = process.cwd()) {
  try {
    const options = parseArgs(argv);
    const receipt = runPhase02Verification(options, cwd);
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
