import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { MANIFEST } from '../test/test-ownership.mjs';
import { mutants } from '../test/test-ownership-mutants.mjs';
import { REPO_ROOT, buildTestArgv, buildTestEnv } from './run-tests.mjs';
import { getFailedTestsFromJunit } from './test-select-compare.mjs';

function log(msg) { console.log(msg); }
function errFn(msg) { console.error(msg); }

/**
 * Symlinks `node_modules` and, when present, the Rust workspace's `target`
 * directory into a fresh detached worktree. Every rust-host test resolves
 * its own REPO_ROOT from `import.meta.url` (test/rust-host/harness.mjs),
 * which inside a worktree is the worktree's own root -- so without this,
 * every rust-host test in that worktree fails "Compiled Rust binary not
 * found" and pollutes both the mutation full-suite baseline (it's always
 * red) and the mutated run, on any machine where `cargo build` has already
 * run once. `target` is gitignored and never present right after
 * `git worktree add`, and never symlinked when the main checkout has none
 * (Rust genuinely not built here) -- rust-host stays red for its real
 * reason in that case, same as before.
 */
export function symlinkSharedDirs(worktreePath, repoRoot = REPO_ROOT) {
  if (!fs.existsSync(path.join(worktreePath, 'node_modules'))) {
    fs.symlinkSync(path.join(repoRoot, 'node_modules'), path.join(worktreePath, 'node_modules'), 'dir');
  }
  const targetSrc = path.join(repoRoot, 'target');
  if (fs.existsSync(targetSrc) && !fs.existsSync(path.join(worktreePath, 'target'))) {
    fs.symlinkSync(targetSrc, path.join(worktreePath, 'target'), 'dir');
  }
}

export function computeRuleHash(rule) {
  if (!rule) return null;
  // Deterministic normalized hash: excludes status, sorts arrays
  const normalized = {
    id: rule.id,
    pattern: rule.pattern,
    directTests: [...(rule.directTests || [])].sort(),
    boundaryTests: [...(rule.boundaryTests || [])].sort(),
    coverageSet: [...(rule.coverageSet || [])].sort()
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export function generateMutantPayload(mutant, manifest = MANIFEST) {
  if (!mutant) return null;
  const rule = manifest.find(r => r.id === mutant.ruleId || r.pattern === mutant.file || r.pattern === mutant.ruleId);
  // Per AC 5: Mutants lacking boundary metadata must be rejected/omitted, not given fabricated defaults
  const boundary = mutant.boundary || (rule && rule.boundary) || null;
  if (!boundary) {
    return null;
  }
  const ruleHash = computeRuleHash(rule);
  return {
    ...mutant,
    ruleId: rule ? rule.id : mutant.ruleId,
    ruleHash,
    boundary,
    origin: mutant.origin || 'authored'
  };
}

export function generateMutantPayloads(mutantsList = mutants, manifest = MANIFEST) {
  return mutantsList
    .map(m => generateMutantPayload(m, manifest))
    .filter(m => m !== null);
}

export function classifyMutant(result) {
  if (result.infraError) return 'infra-error';
  if (result.timeout) return 'timeout';
  if (result.syntaxError) return 'invalid-syntax';
  if (result.relatedPassed === false) return 'caught';
  if (result.relatedPassed === true && result.fullPassed === true) return 'equivalent-or-missing-test';
  if (result.relatedPassed === true && result.fullPassed === false) return 'confirmed-miss';
  return 'invalid';
}

/**
 * The rule's own directTests + boundaryTests, deduplicated -- this is the
 * "related" set a mutant on this rule's pattern must be judged against, per
 * the manifest itself, never rediscovered through the git-diff selector
 * (selectTests()/test-select.mjs's CLI answers "what changed since a base
 * ref", which is always empty/refuse on an already-committed HEAD with no
 * local diff -- exactly the condition a nightly run always starts from).
 */
export function relatedFilesForRule(rule) {
  if (!rule) return [];
  const files = new Set([...(rule.directTests || []), ...(rule.boundaryTests || [])]);
  return [...files];
}

const SYNTAX_ERROR_PATTERN = /SyntaxError|Unexpected token|Unexpected end of input/;

// One full-suite run on CI takes ~10 min; anything far past that is a hang,
// reported as "could not run" rather than blocking the nightly job.
const FULL_SUITE_TIMEOUT_MS = 40 * 60 * 1000;

/**
 * Runs the whole suite in `cwd` (the same `run-tests.mjs` door `npm test`
 * uses) with a junit report, and returns the names of the failing test
 * cases. `ran: false` means there is no usable answer at all: the run timed
 * out, or it wrote no report.
 */
export function runFullSuite({ cwd, spawn = spawnSync, timeoutMs = FULL_SUITE_TIMEOUT_MS } = {}) {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mutate-full-'));
  const reportPath = path.join(reportDir, 'full.xml');
  try {
    const result = spawn(process.execPath, [
      'scripts/run-tests.mjs', '--test-reporter=junit', `--test-reporter-destination=${reportPath}`,
    ], { cwd, stdio: 'ignore', timeout: timeoutMs, env: buildTestEnv() });
    if (result.signal || result.error || !fs.existsSync(reportPath)) return { ran: false, failed: new Set() };
    const xml = fs.readFileSync(reportPath, 'utf8');
    if (!xml.includes('<testcase')) return { ran: false, failed: new Set() };
    return { ran: true, failed: new Set(getFailedTestsFromJunit(xml).map((f) => f.name)) };
  } finally {
    fs.rmSync(reportDir, { recursive: true, force: true });
  }
}

/**
 * Runs `node --test` against an explicit file list inside `cwd`, capturing
 * stdout/stderr (unlike run-tests.mjs's own runSelectedTests, built for
 * `stdio: 'inherit'` CLI use) so a mutation that breaks JS syntax can be
 * told apart from one a real assertion just caught.
 */
export function runRelatedCaptured(files, { cwd, spawn = spawnSync } = {}) {
  const relFiles = files.map((f) => path.relative(cwd, f));
  const result = spawn(process.execPath, buildTestArgv(relFiles, []), {
    cwd,
    encoding: 'utf8',
    env: buildTestEnv(),
  });
  return {
    status: result.status ?? 1,
    signal: result.signal || null,
    stderr: result.stderr || '',
  };
}

/**
 * Applies one mutant inside an already-prepared (git worktree) directory
 * and classifies the outcome. `runRelated`/`runFull`/`fullBaseline` are injectable so
 * every classification branch (the 6 rows classifyMutant covers) can be
 * exercised with a fake runner, without spawning a real worktree or test
 * process per case.
 *
 * Baseline (the rule's own related tests, run BEFORE mutation) must pass
 * first: without it, a rule whose related test was already red for an
 * unrelated reason would silently misclassify every mutant against it as
 * "caught" -- a false positive that never proves the mutant did anything.
 */
export function classifyOneMutant({
  mutant,
  rule,
  worktreePath,
  runRelated = runRelatedCaptured,
  runFull = runFullSuite,
  fullBaseline = () => new Set(),
}) {
  const relatedFiles = relatedFilesForRule(rule);
  if (relatedFiles.length === 0) {
    return { classification: 'invalid', reason: `rule "${mutant.ruleId}" has no related test files` };
  }
  const worktreeRelatedFiles = relatedFiles.map((f) => path.join(worktreePath, f));

  const targetFile = path.join(worktreePath, mutant.file);
  const orig = fs.readFileSync(targetFile, 'utf8');
  if (!orig.includes(mutant.find)) {
    return { classification: 'invalid', reason: 'mutant find string not found in target file' };
  }

  const baseline = runRelated(worktreeRelatedFiles, { cwd: worktreePath });
  if (baseline.status !== 0) {
    return { classification: 'infra-error', reason: 'baseline (unmutated) related tests are already red for this rule' };
  }

  fs.writeFileSync(targetFile, orig.replace(mutant.find, mutant.replace));

  let result;
  try {
    const related = runRelated(worktreeRelatedFiles, { cwd: worktreePath });
    if (related.signal) {
      result = { timeout: true };
    } else if (related.status !== 0 && SYNTAX_ERROR_PATTERN.test(related.stderr)) {
      result = { syntaxError: true };
    } else {
      result = { relatedPassed: related.status === 0, fullPassed: false };
      // AC 5: run full ONLY if related passed. The full suite is judged
      // against its own unmutated baseline: a test that is already red on
      // the clean HEAD (an unbuilt Rust binary, an unrelated flake) says
      // nothing about this mutant, so only a NEW failure counts as the
      // selector having missed it.
      if (result.relatedPassed) {
        const baseline = fullBaseline();
        const full = baseline ? runFull({ cwd: worktreePath }) : null;
        if (!baseline || !full.ran) {
          result = { infraError: true };
        } else {
          result.fullPassed = ![...full.failed].some((name) => !baseline.has(name));
        }
      }
    }
  } catch {
    result = { infraError: true };
  }

  return { classification: classifyMutant(result) };
}

export function runNightlyMutations(options = {}) {
  log("Starting nightly fault-injection mutation tests...");
  const ledger = [];
  const manifest = options.manifest || MANIFEST;
  const rawMutants = options.mutants || mutants;
  const enrichedMutants = generateMutantPayloads(rawMutants, manifest);
  const ledgerOut = options.ledgerOut || 'nightly-ledger.json';
  const runRelated = options.runRelated || runRelatedCaptured;
  const runFull = options.runFull || runFullSuite;
  const execFileFn = options.execFileFn || execFileSync;

  // Failing test names of the full suite on the clean HEAD, computed once and
  // only if some mutant survives its related tests. `null` = the baseline run
  // itself produced no usable answer, so no mutant can be judged against it.
  let baselineCache;
  const fullBaseline = () => {
    if (baselineCache !== undefined) return baselineCache;
    const baseDir = path.join(os.tmpdir(), 'fgos-mutations');
    fs.mkdirSync(baseDir, { recursive: true });
    const baselinePath = fs.mkdtempSync(path.join(baseDir, 'baseline-'));
    try {
      execFileFn('git', ['worktree', 'add', '--detach', baselinePath, 'HEAD'], { encoding: 'utf8' });
      symlinkSharedDirs(baselinePath);
      const full = runFull({ cwd: baselinePath });
      baselineCache = full.ran ? full.failed : null;
      log(full.ran
        ? `Full-suite baseline on clean HEAD: ${full.failed.size} test(s) already failing.`
        : 'Full-suite baseline on clean HEAD produced no report; surviving mutants are infra-error.');
    } catch (err) {
      log(`Full-suite baseline could not run: ${err.message}`);
      baselineCache = null;
    } finally {
      try { execFileFn('git', ['worktree', 'remove', '-f', baselinePath], { encoding: 'utf8' }); } catch {}
    }
    return baselineCache;
  };

  for (const mutant of enrichedMutants) {
    log(`Applying mutant ${mutant.id} to ${mutant.file}...`);
    const rule = manifest.find((r) => r.id === mutant.ruleId);

    // Create detached worktree
    const baseDir = path.join(os.tmpdir(), 'fgos-mutations');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    const worktreePath = fs.mkdtempSync(path.join(baseDir, `mutant-${mutant.id}-`));

    try {
      execFileFn('git', ['worktree', 'add', '--detach', worktreePath, 'HEAD'], { encoding: 'utf8' });
      symlinkSharedDirs(worktreePath);

      const { classification, reason } = classifyOneMutant({ mutant, rule, worktreePath, runRelated, runFull, fullBaseline });
      if (reason) log(`Mutant ${mutant.id}: ${reason}`);
      log(`Mutant ${mutant.id} classification: ${classification}`);
      ledger.push({
        id: mutant.id,
        ruleId: mutant.ruleId,
        ruleHash: mutant.ruleHash,
        boundary: mutant.boundary,
        origin: mutant.origin || 'authored',
        classification
      });
    } finally {
      try {
        execFileFn('git', ['worktree', 'remove', '-f', worktreePath], { encoding: 'utf8' });
      } catch (e) {}
    }
  }

  fs.writeFileSync(ledgerOut, JSON.stringify(ledger, null, 2));
  log("Mutation testing complete. Ledger written.");
  return ledger;
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-mutate.mjs')) {
  runNightlyMutations();
}
