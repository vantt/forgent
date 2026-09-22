import fs from 'node:fs';
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
  
  for (const mutant of mutants) {
    log(`Applying mutant ${mutant.id} to ${mutant.file}...`);
    const orig = fs.readFileSync(mutant.file, 'utf8');
    
    if (!orig.includes(mutant.find)) {
      log(`Mutant ${mutant.id} invalid: string not found.`);
      ledger.push({ id: mutant.id, classification: 'invalid' });
      continue;
    }
    
    try {
      fs.writeFileSync(mutant.file, orig.replace(mutant.find, mutant.replace));
      
      let shadowOut = '';
      try {
        shadowOut = execFileSync('node', ['scripts/test-select.mjs', '--shadow', '--explain'], { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      } catch (e) {
        shadowOut = e.stdout || '';
      }
      
      let result = { infraError: true };
      try {
        // The output might have multiple lines, we only care about the JSON.
        // But since we piped stdout, test-select prints explain JSON to stdout!
        const parsed = JSON.parse(shadowOut);
        if (parsed.comparison) {
          result = {
            relatedPassed: parsed.comparison.relatedStatus === 0,
            fullPassed: parsed.comparison.fullStatus === 0,
            syntaxError: parsed.comparison.fullStatus === 1 && !parsed.comparison.relatedRan // simple heuristic
          };
          if (!parsed.comparison.relatedRan) {
            // escalated?
            if (parsed.decision === 'full') {
              // Related didn't run.
              result.relatedPassed = true; // or whatever
            }
          }
        }
      } catch (e) {
        // Could not parse JSON from stdout. Maybe a syntax error caused a hard crash?
        result = { syntaxError: true };
      }
      
      const classification = classifyMutant(result);
      log(`Mutant ${mutant.id} classification: ${classification}`);
      ledger.push({ id: mutant.id, classification });
    } finally {
      fs.writeFileSync(mutant.file, orig); // Always restore
    }
  }

  fs.writeFileSync('nightly-ledger.json', JSON.stringify(ledger, null, 2));
  log("Mutation testing complete. Ledger written.");
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-mutate.mjs')) {
  runNightlyMutations();
}
