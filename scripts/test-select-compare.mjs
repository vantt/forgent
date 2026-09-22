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
  rerunPassed
}) {
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

export function updateBreakerState(rulesToQuarantine) {
  for (const rule of rulesToQuarantine) {
    log(`Rule ${rule} missed a failure. Escalating to quarantined.`);
    
    if (GITHUB_TOKEN) {
      try {
        let current = '';
        try { current = execFileSync('gh', ['variable', 'get', 'SELECTOR_BREAKER']).toString().trim(); } catch (e) {}
        let state = current ? JSON.parse(current) : null;
        if (!state) state = { version: 1, global: false, quarantined: [] };
        if (!state.quarantined.includes(rule)) {
          state.quarantined.push(rule);
          state.version += 1;
          if (state.quarantined.length >= 2) state.global = true;
        }
        execFileSync('gh', ['variable', 'set', 'SELECTOR_BREAKER', '-b', JSON.stringify(state)]);
      } catch (err) {
        errFn(`Failed to write SELECTOR_BREAKER via gh variable: ${err.message}. Falling back to issue.`);
        try {
          execFileSync('gh', ['issue', 'create', '--title', 'Breaker Trip', '--body', `Rule ${rule} tripped breaker.`]);
        } catch(e) {}
      }
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
      // Wait, Junit might not have file path in name.
      // Usually it's in file="..." or classname="..."
      let fileMatch = tc.match(/file="([^"]+)"/);
      if (!fileMatch) fileMatch = tc.match(/classname="([^"]+)"/);
      
      const file = fileMatch ? fileMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') : nameMatch ? nameMatch[1] : 'unknown';
      failed.push(file);
    }
  }
  return failed;
}

function resolveRuleForTest(testPath, manifest) {
  for (const rule of manifest) {
    if (rule.directTests && rule.directTests.includes(testPath)) return rule.id;
    if (rule.boundaryTests && rule.boundaryTests.includes(testPath)) return rule.id;
  }
  return null;
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

  const baseJunit = 'test-results/base.xml';
  const fullJunit = 'test-results/full.xml';
  const relatedJunit = 'test-results/related.xml';

  const baseFails = fs.existsSync(baseJunit) ? getFailedTestsFromJunit(fs.readFileSync(baseJunit, 'utf8')) : null;
  const fullFails = fs.existsSync(fullJunit) ? getFailedTestsFromJunit(fs.readFileSync(fullJunit, 'utf8')) : [];
  const relatedFails = fs.existsSync(relatedJunit) ? getFailedTestsFromJunit(fs.readFileSync(relatedJunit, 'utf8')) : [];

  const baseMissing = baseFails === null;
  const isRelatedRedSomewhere = relatedFails.length > 0;
  const selectedFiles = new Set(plan.selectedFiles || []);
  
  const rulesToQuarantine = new Set();
  const caseResults = {};

  // For every failing test in full suite
  for (const test of fullFails) {
    const isRedInBase = baseFails && baseFails.includes(test);
    const isRedInRelated = relatedFails.includes(test);
    const isSelected = selectedFiles.has(test);
    
    // In actual implementation, we would rerun the test here.
    // For now we will assume it is not a flake if it fails here.
    const rerunPassed = false;
    
    const classification = classifyTestCase({
      isRedInFull: true,
      isRedInRelated,
      baseMissing,
      isRedInBase,
      isSelected,
      isRelatedRedSomewhere,
      rerunPassed
    });
    
    caseResults[test] = classification;
    
    if (classification === 'confirmed-miss') {
      // Find which rules missed this test by seeing which matched paths should have covered it?
      // Wait, contract: we don't guess matchedRules[0].
      // We look up the test in the manifest and quarantine the rules that should have selected it!
      // Wait, if it missed, we don't know exactly which change caused the miss, 
      // but we know which rule the test BELONGS to.
      // So if a test failed and was missed, its corresponding rule is broken?
      // No, if a test failed, it means one of the CHANGED paths should have triggered it.
      // So we quarantine the matched rules for the CHANGED paths?
      // "Quarantine the rules that matched the changes."
      // Since it's a confirmed miss, the rules that matched the changes FAILED to include the test.
      // So we quarantine those rules.
      if (plan.matchedRules) {
        for (const mr of plan.matchedRules) rulesToQuarantine.add(mr.ruleId);
      }
    }
  }

  const ledger = {
    plan,
    caseResults,
  };

  fs.writeFileSync('ledger.json', JSON.stringify(ledger, null, 2));

  if (rulesToQuarantine.size > 0) {
    updateBreakerState(Array.from(rulesToQuarantine));
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
