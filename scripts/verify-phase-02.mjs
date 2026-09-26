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

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PHASE_DIR = 'plans/260925-documentation-authority-unification';
export const PHASE02_JSON = `${PHASE_DIR}/phase-02-doc-inventory.json`;
export const PHASE02_MD = `${PHASE_DIR}/phase-02-doc-inventory.md`;
export const PHASE02_VOCAB = `${PHASE_DIR}/claim-and-disposition-vocabulary.json`;

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
    return execFileSync('git', ['rev-parse', '--verify', `${value}^{commit}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
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
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
  const diffNames = deps.diffNames || (() => execFileSync('git', ['diff', '--name-only', `${baseSha}..${fixedEndSha}`], {
    cwd: worktreeDir,
    encoding: 'utf8',
  }).split('\n').filter(Boolean));

  run('git', ['diff', '--check', `${baseSha}..${fixedEndSha}`]);
  const names = diffNames();

  const forbidden = names.filter((name) => {
    if (name.startsWith('docs/specs/') && name !== 'docs/specs/reading-map.md') return true;
    if (name.startsWith('docs/architect/')) return true;
    if (name.startsWith('docs/platform/') && name !== 'docs/platform/migration-authoring-rules.md') return true;
    return false;
  });
  if (forbidden.length > 0) {
    throw new Error(`Forbidden legacy/platform-authority edit(s) in Phase 02 diff:\n${forbidden.join('\n')}`);
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
  execFileSync('git', ['worktree', 'add', '--detach', tempWorktreeDir, fixedEndSha], { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] });

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

  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: tempWorktreeDir, encoding: 'utf8' }).trim();
    if (head !== fixedEndSha) throw new Error(`Worktree checkout mismatch: HEAD ${head} !== FIXED_END ${fixedEndSha}`);
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: tempWorktreeDir, encoding: 'utf8' }).trim();
    if (status) throw new Error(`Worktree is not clean upon checkout:\n${status}`);
    receipt.checks.worktreeBinding = { passed: true, head };
    console.log('✓ Asserted clean detached worktree exactly at FIXED_END before setup');

    console.log('\n[Setup] Provisioning dependencies in clean worktree (npm install)...');
    runOrThrow('npm', ['install'], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
    const targetSrc = path.join(repoRoot, 'target');
    const targetDest = path.join(tempWorktreeDir, 'target');
    if (fs.existsSync(targetSrc) && !fs.existsSync(targetDest)) fs.symlinkSync(targetSrc, targetDest, 'dir');
    receipt.checks.setup = { passed: true };
    console.log('✓ Dependencies provisioned');

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
    const tmpJson = path.join(os.tmpdir(), `phase02-inventory-${nonce}.json`);
    const tmpMd = path.join(os.tmpdir(), `phase02-inventory-${nonce}.md`);
    try {
      runOrThrow(process.execPath, [
        'scripts/generate-doc-inventory.mjs',
        '--commit', baseSha,
        '--json-out', tmpJson,
        '--md-out', tmpMd,
      ], { cwd: tempWorktreeDir, stdio: ['pipe', 'pipe', 'pipe'] });
      byteCompare(tmpJson, path.join(tempWorktreeDir, PHASE02_JSON), 'Regenerated Phase 02 JSON inventory');
      byteCompare(tmpMd, path.join(tempWorktreeDir, PHASE02_MD), 'Regenerated Phase 02 Markdown inventory');
      const inventory = readJson(tmpJson);
      receipt.artifacts.phase02Json = { path: PHASE02_JSON, ...fileArtifact(tmpJson) };
      receipt.artifacts.phase02Markdown = { path: PHASE02_MD, ...fileArtifact(tmpMd) };
      receipt.artifacts.counts = {
        scannedFiles: inventory.summary?.scannedFilesCount ?? null,
        claims: inventory.summary?.claimCount ?? null,
        consumerEdges: Array.isArray(inventory.consumerEdges) ? inventory.consumerEdges.length : null,
        gaps: inventory.summary?.gapCount ?? null,
        duplicateContentGroups: inventory.summary?.duplicateContentGroupCount ?? null,
        semanticConflictGroups: inventory.summary?.semanticConflictGroupCount ?? null,
      };
      receipt.checks.inventoryByteIdentity = { passed: true, generatedFrom: baseSha };
    } finally {
      for (const p of [tmpJson, tmpMd]) if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    console.log('✓ Phase 02 JSON + Markdown artifacts are byte-identical to immutable-BASE regeneration');

    console.log('\n[Check 3/9] Running Phase 02 inventory gate checker...');
    const gate = runOrThrow(process.execPath, [
      'scripts/check-doc-inventory-gates.mjs',
      '--inventory', PHASE02_JSON,
      '--vocabulary', PHASE02_VOCAB,
      '--json',
    ], { cwd: tempWorktreeDir, encoding: 'utf8' });
    const gateJson = JSON.parse(gate.stdout);
    receipt.checks.inventoryGate = {
      passed: gateJson.clean === true,
      explicitOpenFindings: gateJson.explicitOpenFindings || null,
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
      console.log('\n[Check 9/9] Running full npm test suite...');
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

    console.log('\n===============================================================');
    console.log(' ALL PHASE 02 VERIFICATION CHECKS PASSED CLEANLY');
    console.log('===============================================================');
    return receipt;
  } finally {
    if (!keepWorktree) {
      console.log(`\nCleaning up temporary worktree ${tempWorktreeDir}...`);
      try { execFileSync('git', ['worktree', 'remove', '--force', tempWorktreeDir], { cwd: repoRoot, stdio: 'ignore' }); } catch {}
      if (fs.existsSync(tempWorktreeDir)) fs.rmSync(tempWorktreeDir, { recursive: true, force: true });
      console.log('✓ Temporary worktree removed');
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
