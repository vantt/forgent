import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;

function log(msg) { console.log(msg); }
function errFn(msg) { console.error(msg); }

export function classifyTestCase({
  isRedInFull,
  isRedInRelated,
  baseMissing,
  isRedInBase,
  isSelected,
  isRelatedRedSomewhere,
  rerunPassed,
  isOsSpecific
}) {
  if (isOsSpecific) return 'os-specific';
  if (!isRedInFull && isRedInRelated) return 'related-only-fail';
  if (!isRedInFull && !isRedInRelated) return 'pass';
  
  if (isRedInFull && baseMissing) return 'base-missing';
  if (isRedInFull && !baseMissing && isRedInBase) return 'baseline-failing';
  
  if (isRedInFull && !baseMissing && !isRedInBase && isSelected && isRedInRelated) return 'caught';
  if (isRedInFull && !baseMissing && !isRedInBase && isSelected && !isRedInRelated) return 'selected-but-divergent';
  
  if (isRedInFull && !baseMissing && !isRedInBase && !isSelected && isRelatedRedSomewhere) return 'omitted-failing-test';
  
  if (isRedInFull && !baseMissing && !isRedInBase && !isSelected && !isRelatedRedSomewhere) {
    return rerunPassed ? 'rerun-pass' : 'confirmed-miss';
  }
  
  return 'unknown';
}

export function updateBreakerState(rulesToQuarantine, global = false) {
  if (GITHUB_TOKEN) {
    try {
      let current = '';
      try { current = execFileSync('gh', ['variable', 'get', 'SELECTOR_BREAKER']).toString().trim(); } catch (e) {}
      let state = current ? JSON.parse(current) : null;
      if (!state) state = { version: 1, global: false, quarantined: [] };
      let changed = false;
      if (global && !state.global) {
        state.global = true;
        changed = true;
        log('Unattributed miss detected. Escalating to global quarantine.');
      }
      for (const rule of rulesToQuarantine) {
        log(`Rule ${rule} missed a failure. Escalating to quarantined.`);
        if (!state.quarantined.includes(rule)) {
          state.quarantined.push(rule);
          changed = true;
          if (state.quarantined.length >= 2) state.global = true;
        }
      }
      if (changed) {
        state.version += 1;
        execFileSync('gh', ['variable', 'set', 'SELECTOR_BREAKER', '-b', JSON.stringify(state)]);
      }
    } catch (err) {
      errFn(`Failed to write SELECTOR_BREAKER via gh variable: ${err.message}. Falling back to issue.`);
      try {
        execFileSync('gh', ['issue', 'create', '--title', 'Breaker Trip', '--body', `Miss tripped breaker. Global: ${global}. Rules: ${rulesToQuarantine.join(', ')}`]);
      } catch(e) {}
    }
  }
}

function getFailedTestsFromJunit(xmlContent) {
  const failed = [];
  const testcases = xmlContent.split('<testcase');
  for (let i = 1; i < testcases.length; i++) {
    const tc = testcases[i];
    if (tc.includes('<failure')) {
      const nameMatch = tc.match(/name="([^"]+)"/);
      let fileMatch = tc.match(/file="([^"]+)"/);
      if (!fileMatch) fileMatch = tc.match(/classname="([^"]+)"/);
      const name = nameMatch ? nameMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      let filePath = fileMatch ? fileMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'unknown';
      const repoRoot = process.cwd();
      if (filePath.startsWith(repoRoot)) {
        filePath = filePath.substring(repoRoot.length + 1).replace(/\\/g, '/');
      }
      failed.push({ name, file: filePath });
    }
  }
  return failed;
}


export async function runCompare() {
  log("Running compare job logic...");
  
  let plan = {};
  if (fs.existsSync('selector-plan.json')) {
    plan = JSON.parse(fs.readFileSync('selector-plan.json', 'utf8'));
  } else {
    log("No selector-plan.json found, inconclusive.");
    process.exit(0);
  }

  if (plan.decision === 'full') {
    log("Plan decision was 'full', no comparison needed.");
    process.exit(0);
  }

  const baseJunit = 'artifacts/base-results/test-results/base.xml';
  const fullJunitUbuntu = 'artifacts/full-results-ubuntu-latest/full.xml';
  const fullJunitMacos = 'artifacts/full-results-macos-latest/full.xml';
  const fullJunitWindows = 'artifacts/full-results-windows-latest/full.xml';
  const relatedJunit = 'artifacts/related-results/related.xml';

  const baseFails = fs.existsSync(baseJunit) ? getFailedTestsFromJunit(fs.readFileSync(baseJunit, 'utf8')) : null;
  const fullFailsUbuntu = fs.existsSync(fullJunitUbuntu) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitUbuntu, 'utf8')) : [];
  const fullFailsMacos = fs.existsSync(fullJunitMacos) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitMacos, 'utf8')) : [];
  const fullFailsWindows = fs.existsSync(fullJunitWindows) ? getFailedTestsFromJunit(fs.readFileSync(fullJunitWindows, 'utf8')) : [];
  const relatedFails = fs.existsSync(relatedJunit) ? getFailedTestsFromJunit(fs.readFileSync(relatedJunit, 'utf8')) : [];

  // Combine all OS failures for iteration
  const allFullFailsMap = new Map();
  [...fullFailsUbuntu, ...fullFailsMacos, ...fullFailsWindows].forEach(f => {
    allFullFailsMap.set(f.name, f);
  });
  const fullFails = Array.from(allFullFailsMap.values());

  const baseMissing = baseFails === null;
  const isRelatedRedSomewhere = relatedFails.length > 0;
  const selectedFiles = new Set(plan.selectedFiles || []);
  
  const rulesToQuarantine = new Set();
  let quarantineGlobal = false;
  const caseResults = {};

  // For every failing test in full suite
  for (const test of fullFails) {
    const isRedInBase = baseFails && baseFails.some(t => t.name === test.name);
    const isRedInRelated = relatedFails.some(t => t.name === test.name);
    const isSelected = selectedFiles.has(test.file);
    
    let rerunPassed = false;
    if (!isSelected) {
      try {
        const { execSync } = require('child_process');
        execSync(`node --test "${test.file}" --test-name-pattern="^${test.name}$"`, { stdio: 'ignore' });
        rerunPassed = true;
      } catch (e) {
        rerunPassed = false;
      }
    }
    
    const classification = classifyTestCase({
      isRedInFull: true,
      isRedInRelated,
      baseMissing,
      isRedInBase,
      isSelected,
      isRelatedRedSomewhere,
      rerunPassed,
      isOsSpecific
    });
    
    caseResults[test.name] = classification;
    
    if (classification === 'confirmed-miss') {
      if (plan.matchedRules && plan.matchedRules.length > 0) {
        plan.matchedRules.forEach(mr => {
          if (mr.status !== 'quarantined') rulesToQuarantine.add(mr.ruleId);
        });
      } else {
        quarantineGlobal = true;
      }
    }
  }

  const ledger = {
    plan,
    caseResults,
  };

  fs.writeFileSync('ledger.json', JSON.stringify(ledger, null, 2));

  if (rulesToQuarantine.size > 0 || quarantineGlobal) {
    updateBreakerState(Array.from(rulesToQuarantine), quarantineGlobal);
  }

  // Comment on PR
  if (PR_NUMBER && GITHUB_TOKEN) {
    try {
      execFileSync('gh', ['pr', 'comment', PR_NUMBER, '--body', `Selector shadow run classification (post-merge check only): completed.`]);
    } catch(e) {}
  }

  process.exit(0);
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-compare.mjs')) {
  runCompare();
}
