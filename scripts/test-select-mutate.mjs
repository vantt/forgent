import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { mutants } from '../test/test-ownership-mutants.mjs';

function log(msg) { console.log(msg); }
function errFn(msg) { console.error(msg); }

export function classifyMutant(result) {
  if (result.infraError) return 'infra-error';
  if (result.timeout) return 'timeout';
  if (result.syntaxError) return 'invalid-syntax';
  if (result.relatedPassed === false) return 'caught';
  if (result.relatedPassed === true && result.fullPassed === true) return 'equivalent-or-missing-test';
  if (result.relatedPassed === true && result.fullPassed === false) return 'confirmed-miss';
  return 'invalid';
}

export function runNightlyMutations() {
  log("Starting nightly fault-injection mutation tests...");
  const ledger = [];
  
  // Baseline run
  log("Running baseline check...");
  try {
    execFileSync('node', ['scripts/test-select.mjs'], { stdio: 'pipe', encoding: 'utf8' });
  } catch(e) {
    log("Baseline is red! Cannot run mutation testing.");
    return;
  }
  
  for (const mutant of mutants) {
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
        ledger.push({ id: mutant.id, classification: 'invalid' });
        continue;
      }
      
      fs.writeFileSync(targetFile, orig.replace(mutant.find, mutant.replace));
      
      let shadowOut = '';
      try {
        shadowOut = execFileSync('node', ['scripts/test-select.mjs', '--shadow', '--explain'], { cwd: worktreePath, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      } catch (e) {
        shadowOut = e.stdout || '';
      }
      
      let result = { infraError: true };
      try {
        // extract JSON from output (since tests might output something, find the last JSON object)
        const match = shadowOut.match(/\{[^{}]*"comparison"[^]*\}/);
        const jsonStr = match ? match[0] : shadowOut;
        const parsed = JSON.parse(jsonStr);
        if (parsed.comparison) {
          result = {
            relatedPassed: parsed.comparison.relatedStatus === 0,
            fullPassed: parsed.comparison.fullStatus === 0,
            syntaxError: parsed.comparison.fullStatus === 1 && !parsed.comparison.relatedRan
          };
          if (!parsed.comparison.relatedRan && parsed.decision === 'full') {
             result.relatedPassed = true;
          }
        }
      } catch (e) {
        result = { syntaxError: true };
      }
      
      const classification = classifyMutant(result);
      log(`Mutant ${mutant.id} classification: ${classification}`);
      ledger.push({ id: mutant.id, classification });
    } finally {
      try {
        execFileSync('git', ['worktree', 'remove', '-f', worktreePath], { encoding: 'utf8' });
      } catch(e) {}
    }
  }

  fs.writeFileSync('nightly-ledger.json', JSON.stringify(ledger, null, 2));
  log("Mutation testing complete. Ledger written.");
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-mutate.mjs')) {
  runNightlyMutations();
}
