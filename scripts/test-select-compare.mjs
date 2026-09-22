import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;

function log(msg) { console.log(msg); }
function err(msg) { console.error(msg); }

// Simple XML parser for JUnit to extract failing test names
function getFailedTestsFromJunit(xmlContent) {
  const failed = [];
  const testcases = xmlContent.split('<testcase');
  for (let i = 1; i < testcases.length; i++) {
    const tc = testcases[i];
    if (tc.includes('<failure')) {
      const nameMatch = tc.match(/name="([^"]+)"/);
      if (nameMatch) failed.push(nameMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    }
  }
  return failed;
}

// C1 Classification Logic
export function classifyCompare(baseGreen, relatedGreen, fullFails, relatedFails) {
  if (!baseGreen) return 'inconclusive'; // base failed or missing
  
  const fullFailSet = new Set(fullFails);
  const relatedFailSet = new Set(relatedFails);
  
  if (fullFailSet.size === 0 && relatedFailSet.size === 0) return 'equivalent-or-suite-gap';
  if (fullFailSet.size > 0 && relatedFailSet.size === 0) return 'confirmed-miss'; // missed by related
  if (fullFailSet.size === 0 && relatedFailSet.size > 0) return 'related-only-fail'; // related failed, full passed (flaky)
  
  return 'inconclusive';
}

export function updateBreakerState(ruleId, state) {
  if (!state) state = { version: 1, global: false, quarantined: [] };
  if (!state.quarantined.includes(ruleId)) {
    state.quarantined.push(ruleId);
    state.version += 1;
    if (state.quarantined.length >= 2) state.global = true;
  }
  return state;
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

  const baseGreen = baseFails && baseFails.length === 0;
  const relatedGreen = relatedFails.length === 0;

  const classification = classifyCompare(baseGreen, relatedGreen, fullFails, relatedFails);
  log(`Classification: ${classification}`);

  const ledger = {
    plan,
    baseGreen,
    fullFails,
    relatedFails,
    classification
  };

  fs.writeFileSync('ledger.json', JSON.stringify(ledger, null, 2));

  if (classification === 'confirmed-miss' && plan.matchedRules && plan.matchedRules.length > 0) {
    const rule = plan.matchedRules[0].ruleId;
    log(`Rule ${rule} missed a failure. Escalating to quarantined.`);
    
    // Simulate updating variable
    if (GITHUB_TOKEN) {
      try {
        let current = '';
        try { current = execFileSync('gh', ['variable', 'get', 'SELECTOR_BREAKER']).toString().trim(); } catch (e) {}
        let state = current ? JSON.parse(current) : null;
        state = updateBreakerState(rule, state);
        execFileSync('gh', ['variable', 'set', 'SELECTOR_BREAKER', '-b', JSON.stringify(state)]);
      } catch (err) {
        err(`Failed to write SELECTOR_BREAKER via gh variable: ${err.message}. Falling back to issue.`);
        try {
          execFileSync('gh', ['issue', 'create', '--title', 'Breaker Trip', '--body', `Rule ${rule} tripped breaker.`]);
        } catch(e) {}
      }
    }
  }

  // Comment on PR
  if (PR_NUMBER && GITHUB_TOKEN) {
    try {
      execFileSync('gh', ['pr', 'comment', PR_NUMBER, '--body', `Selector shadow run classification (post-merge check only): **${classification}**`]);
    } catch(e) {}
  }

  process.exit(0);
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-compare.mjs')) {
  runCompare();
}
