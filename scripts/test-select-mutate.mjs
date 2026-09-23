import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { MANIFEST } from '../test/test-ownership.mjs';
import { mutants } from '../test/test-ownership-mutants.mjs';

function log(msg) { console.log(msg); }
function errFn(msg) { console.error(msg); }

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

export function runNightlyMutations(options = {}) {
  log("Starting nightly fault-injection mutation tests...");
  const ledger = [];
  const manifest = options.manifest || MANIFEST;
  const rawMutants = options.mutants || mutants;
  const enrichedMutants = generateMutantPayloads(rawMutants, manifest);
  const ledgerOut = options.ledgerOut || 'nightly-ledger.json';
  
  // Baseline run
  log("Running baseline check...");
  try {
    execFileSync('node', ['scripts/test-select.mjs'], { stdio: 'pipe', encoding: 'utf8' });
  } catch(e) {
    log("Baseline is red! Cannot run mutation testing.");
    return ledger;
  }
  
  for (const mutant of enrichedMutants) {
    log(`Applying mutant ${mutant.id} to ${mutant.file}...`);
    
    // Create detached worktree
    const baseDir = path.join(os.tmpdir(), 'fgos-mutations');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    const worktreePath = fs.mkdtempSync(path.join(baseDir, `mutant-${mutant.id}-`));
    
    try {
      execFileSync('git', ['worktree', 'add', '--detach', worktreePath, 'HEAD'], { encoding: 'utf8' });
      
      const targetFile = path.join(worktreePath, mutant.file);
      const orig = fs.readFileSync(targetFile, 'utf8');
      
      if (!orig.includes(mutant.find)) {
        log(`Mutant ${mutant.id} invalid: string not found.`);
        ledger.push({
          id: mutant.id,
          ruleId: mutant.ruleId,
          ruleHash: mutant.ruleHash,
          boundary: mutant.boundary,
          origin: mutant.origin || 'authored',
          classification: 'invalid'
        });
        continue;
      }
      
      fs.writeFileSync(targetFile, orig.replace(mutant.find, mutant.replace));
      
      // Symlink node_modules
      if (!fs.existsSync(path.join(worktreePath, 'node_modules'))) {
        fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(worktreePath, 'node_modules'), 'dir');
      }

      let shadowOut = '';
      let exitCode = 0;
      try {
        shadowOut = execFileSync('node', ['scripts/test-select.mjs', '--explain'], { cwd: worktreePath, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      } catch (e) {
        shadowOut = e.stdout || '';
        exitCode = e.status;
      }
      
      let result = { infraError: true };
      try {
        const match = shadowOut.match(/\{[^{}]*"decision"[^]*\}/);
        const jsonStr = match ? match[0] : shadowOut;
        const parsed = JSON.parse(jsonStr);
        if (parsed.decision) {
          result = {
            relatedPassed: exitCode === 0,
            fullPassed: false,
            syntaxError: false
          };
          if (parsed.decision === 'full') {
            result.relatedPassed = exitCode === 0;
          }
          // AC 5: run full ONLY if related passed
          if (result.relatedPassed) {
            try {
              execFileSync('node', ['scripts/run-tests.mjs'], { cwd: worktreePath, stdio: 'ignore' });
              result.fullPassed = true;
            } catch (err) {
              result.fullPassed = false;
            }
          }
        }
      } catch (e) {
        result = { syntaxError: true };
      }
      
      const classification = classifyMutant(result);
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
        execFileSync('git', ['worktree', 'remove', '-f', worktreePath], { encoding: 'utf8' });
      } catch(e) {}
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
