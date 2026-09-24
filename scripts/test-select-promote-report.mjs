// test-select-promote-report.mjs -- pulls every durable compare/nightly
// ledger artifact this repo's CI has ever produced (GitHub's own artifact
// store IS the evidence store; no separate append-log needed) and runs the
// real promoteRules evaluation (scripts/test-select-promote.mjs) against
// the full accumulated history, not just the latest run.
//
// Read-only by default: prints one row per manifest rule showing exactly
// how far real evidence has gotten toward the P3-09 promotion thresholds
// (K>=10 opportunities, N>=3 valid mutants, 100% kill rate, measured
// wall-time ratio). Never mutates test-ownership.mjs itself -- pass
// --apply to let promoteRules write promotions/quarantines for real, and
// only after reading this report's own numbers.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { MANIFEST } from '../test/test-ownership.mjs';
import { promoteRules, computeRuleHash } from './test-select-promote.mjs';

function log(msg) { console.log(msg); }

function sh(cmd, args, execFn = execFileSync) {
  return execFn(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/**
 * Lists every artifact across the whole repo (not scoped to one run) whose
 * name matches one of the two ledger-producing jobs, newest first, across
 * as many pages as `gh api --paginate` returns. Excludes expired entries --
 * `expires_at` in the past means GitHub has already deleted the file.
 */
export function listLedgerArtifacts({ repo, execFn = execFileSync } = {}) {
  const raw = sh('gh', ['api', `repos/${repo}/actions/artifacts`, '--paginate', '--jq', '.artifacts[]'], execFn);
  const now = Date.now();
  const artifacts = raw.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return artifacts.filter((a) =>
    !a.expired
    && new Date(a.expires_at).getTime() > now
    && (a.name === 'nightly-ledger' || a.name.startsWith('compare-ledger-')));
}

/** Downloads one artifact's zip and returns the parsed JSON of `filename`
 * inside it (the only file each of these two artifact kinds ever holds
 * that this report cares about), or null if that file is absent/unparsable
 * (a partial/corrupt upload must not crash the whole report). */
export function downloadLedgerJson(artifact, filename, { repo, execFn = execFileSync } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'promote-report-'));
  try {
    const zipPath = path.join(dir, 'a.zip');
    const bytes = sh('gh', ['api', `repos/${repo}/actions/artifacts/${artifact.id}/zip`], execFn);
    fs.writeFileSync(zipPath, bytes, 'binary');
    sh('unzip', ['-oq', zipPath, '-d', dir], execFn);
    const jsonPath = path.join(dir, filename);
    if (!fs.existsSync(jsonPath)) return null;
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Downloads and parses every listed artifact into the two ledger arrays
 * `promoteRules`/`aggregateRuleEvidence` expect. */
export function collectLedgers(artifacts, opts = {}) {
  const compareLedgers = [];
  const nightlyLedgers = [];
  for (const artifact of artifacts) {
    if (artifact.name === 'nightly-ledger') {
      const parsed = downloadLedgerJson(artifact, 'nightly-ledger.json', opts);
      if (parsed) nightlyLedgers.push(parsed);
    } else {
      const parsed = downloadLedgerJson(artifact, 'ledger.json', opts);
      if (parsed) compareLedgers.push(parsed);
    }
  }
  return { compareLedgers, nightlyLedgers };
}

function formatRow(evaluation, rule) {
  const d = evaluation.details;
  const detail = typeof d === 'object' && d !== null
    ? `opp=${d.failureOpportunities ?? '-'} mutants=${d.validMutants ?? '-'} kill=${typeof d.killRate === 'number' ? (d.killRate * 100).toFixed(0) + '%' : '-'}`
    : String(d ?? '');
  return `${evaluation.eligible ? 'READY' : '.....'}  ${evaluation.currentStatus.padEnd(11)} -> ${evaluation.newStatus.padEnd(11)} ${rule.id.padEnd(28)} ${evaluation.reason.padEnd(28)} ${detail}`;
}

export async function runPromoteReport({ repo, apply = false, manifestPath = path.resolve('test/test-ownership.mjs') } = {}) {
  log(`Listing durable ledger artifacts for ${repo} ...`);
  const artifacts = listLedgerArtifacts({ repo });
  log(`Found ${artifacts.length} non-expired ledger artifact(s) (compare-ledger-*: ${artifacts.filter((a) => a.name.startsWith('compare-ledger-')).length}, nightly-ledger: ${artifacts.filter((a) => a.name === 'nightly-ledger').length}).`);

  const { compareLedgers, nightlyLedgers } = collectLedgers(artifacts, { repo });
  log(`Parsed ${compareLedgers.length} compare ledger(s) and ${nightlyLedgers.length} nightly ledger(s).`);

  const result = promoteRules({ manifest: MANIFEST, manifestPath, compareLedgers, nightlyLedgers, apply });

  log('');
  log(formatRow({ eligible: true, currentStatus: 'STATUS', newStatus: '->NEW', reason: 'REASON', details: null }, { id: 'RULE' }).replace(/READY/, 'STATE'));
  for (const evaluation of result.evaluated) {
    const rule = MANIFEST.find((r) => r.id === evaluation.ruleId);
    log(formatRow(evaluation, rule));
  }
  log('');
  log(`${result.promoted.length} promoted this run, ${result.quarantined.length} quarantined this run (apply=${apply}).`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const repoArg = process.argv.find((a) => a.startsWith('--repo='));
  const repo = repoArg ? repoArg.split('=')[1] : (() => {
    try {
      const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
      const m = remote.match(/[/:]([^/:]+\/[^/.]+?)(?:\.git)?$/);
      return m ? m[1] : null;
    } catch { return null; }
  })();
  if (!repo) {
    console.error('test-select-promote-report: could not resolve owner/repo (pass --repo=owner/repo).');
    process.exit(1);
  }
  runPromoteReport({ repo, apply: process.argv.includes('--apply') }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
