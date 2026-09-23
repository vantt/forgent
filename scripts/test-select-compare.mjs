import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { MANIFEST } from '../test/test-ownership.mjs';
import { computeRuleHash } from './test-select-mutate.mjs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;

function log(msg) { console.log(msg); }
function errFn(msg) { console.error(msg); }

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

import { C4_SELECTOR_RE, checkVerifyForC4 } from '../src/intake/verify-pattern-check.mjs';
export { C4_SELECTOR_RE, checkVerifyForC4 };

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

export function getFailedTestsFromJunit(xmlContent) {
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

/**
 * Reads a `test-marker.json` written alongside a `full.xml`/`related.xml` in
 * the same uploaded artifact directory. Returns null when the file is
 * missing or unparseable -- indistinguishable, from this caller's
 * perspective, from "no trustworthy evidence this run actually completed".
 */
function readMarker(markerPath) {
  if (!fs.existsSync(markerPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch {
    return null;
  }
}

export async function runCompare(options = {}) {
  log("Running compare job logic...");

  const planPath = options.planFile || 'selector-plan.json';
  const baseJunit = options.baseJunit || 'artifacts/base-results/test-results/base.xml';
  const fullJunitUbuntu = options.fullJunitUbuntu || 'artifacts/full-results-ubuntu-latest/full.xml';
  const fullJunitMacos = options.fullJunitMacos || 'artifacts/full-results-macos-latest/full.xml';
  const fullJunitWindows = options.fullJunitWindows || 'artifacts/full-results-windows-latest/full.xml';
  const relatedJunit = options.relatedJunit || 'artifacts/related-results/related.xml';
  const fullMarkerUbuntu = options.fullMarkerUbuntu || 'artifacts/full-results-ubuntu-latest/test-marker.json';
  const fullMarkerMacos = options.fullMarkerMacos || 'artifacts/full-results-macos-latest/test-marker.json';
  const fullMarkerWindows = options.fullMarkerWindows || 'artifacts/full-results-windows-latest/test-marker.json';
  const ledgerOut = options.ledgerOut || 'ledger.json';
  const noExit = options.noExit || false;

  let plan = options.plan || null;
  if (!plan) {
    if (fs.existsSync(planPath)) {
      plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    } else {
      log("No selector-plan.json found, inconclusive.");
      if (noExit) return { error: 'inconclusive', reason: 'no-plan' };
      process.exit(0);
    }
  }

  if (plan.decision === 'full') {
    log("Plan decision was 'full', no comparison needed.");
    if (noExit) return { error: 'no-comparison-needed', decision: 'full' };
    process.exit(0);
  }

  // A full-results junit with no <failure> entries is indistinguishable
  // from "this OS's run crashed before producing any real output" unless
  // its own marker vouches for it -- classifying test cases off an
  // incomplete run's fail list would silently read a crash as "nothing
  // failed here", the exact false-green class TI-01/TI-02b existed to stop.
  const markers = {
    'ubuntu-latest': readMarker(fullMarkerUbuntu),
    'macos-latest': readMarker(fullMarkerMacos),
    'windows-latest': readMarker(fullMarkerWindows),
  };
  const incompleteOses = Object.entries(markers)
    .filter(([, marker]) => !marker || marker.completed !== true)
    .map(([osName]) => osName);
  if (incompleteOses.length > 0) {
    log(`Marker missing or reports completed:false for: ${incompleteOses.join(', ')} -- inconclusive.`);
    if (noExit) return { error: 'inconclusive', reason: 'marker-incomplete', incompleteOses };
    process.exit(0);
  }

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
    const isRedInUbuntu = fullFailsUbuntu.some(t => t.name === test.name);
    const isRedInMacos = fullFailsMacos.some(t => t.name === test.name);
    const isRedInWindows = fullFailsWindows.some(t => t.name === test.name);
    // AC 3: os-specific failure occurs only on macOS/Windows and is green on Ubuntu
    const isOsSpecific = !isRedInUbuntu && (isRedInMacos || isRedInWindows);

    const isRedInBase = baseFails && baseFails.some(t => t.name === test.name);
    const isRedInRelated = relatedFails.some(t => t.name === test.name);
    const isSelected = selectedFiles.has(test.file);
    
    let rerunPassed = false;
    if (!isSelected && !isOsSpecific) {
      try {
        execFileSync('node', ['--test', test.file, `--test-name-pattern=^${escapeRegex(test.name)}$`], { stdio: 'ignore' });
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
    
    caseResults[test.name] = {
      classification,
      file: test.file
    };
    
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

  // AC 7 (Warn C4 cho item.verify): Check if item.verify references test selector
  const c4Warnings = [];
  if (plan.changedPaths) {
    for (const p of plan.changedPaths) {
      const norm = p.replace(/\\/g, '/');
      if (norm.includes('.fgos/') && (norm.endsWith('.jsonl') || norm.endsWith('.json'))) {
        if (fs.existsSync(p)) {
          try {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const record = JSON.parse(trimmed);
                const verifyCmd = record.verify || (record.item && record.item.verify) || (record.patch && record.patch.verify) || (record.payload && record.payload.verify);
                if (verifyCmd) {
                  const warn = checkVerifyForC4(verifyCmd, `"${p}"`);
                  if (warn) {
                    c4Warnings.push(warn);
                    console.warn(warn);
                  }
                }
              } catch {}
            }
          } catch (e) {
            console.error(`Failed to read changed path for C4 check: ${p}`, e);
          }
        }
      }
    }
  }

  const enrichedMatchedRules = (plan.matchedRules || []).map(mr => {
    if (mr.ruleHash) return mr;
    const manifestRule = MANIFEST.find(r => r.id === (mr.ruleId || mr.id));
    const ruleHash = manifestRule ? computeRuleHash(manifestRule) : null;
    return { ...mr, ruleHash };
  });

  const ledger = {
    plan: {
      ...plan,
      matchedRules: enrichedMatchedRules,
    },
    caseResults,
    warnings: c4Warnings,
  };

  fs.writeFileSync(ledgerOut, JSON.stringify(ledger, null, 2));

  if (rulesToQuarantine.size > 0 || quarantineGlobal) {
    updateBreakerState(Array.from(rulesToQuarantine), quarantineGlobal);
  }

  // Comment on PR
  if (PR_NUMBER && GITHUB_TOKEN) {
    try {
      execFileSync('gh', ['pr', 'comment', PR_NUMBER, '--body', `Selector shadow run classification (post-merge check only): completed.`]);
    } catch(e) {}
  }

  if (noExit) {
    return { ledger, rulesToQuarantine: Array.from(rulesToQuarantine), quarantineGlobal, warnings: c4Warnings };
  }
  process.exit(0);
}

const url = typeof process !== 'undefined' && process.argv && process.argv[1] ? process.argv[1] : '';
if (url.endsWith('test-select-compare.mjs')) {
  runCompare().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
