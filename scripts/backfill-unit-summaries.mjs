#!/usr/bin/env node
// Write derived unit summaries only; never migrate or rewrite unit/result/event records.
//
// Default mode fills in missing summaries and leaves every stored summary untouched, reporting
// the ones that differ from what the current writer derives as `stale`. --regenerate replaces
// stale summaries (an older contract version, a wrong derivation) and removes a stored summary
// for a finished unit that no longer has an establishable outcome. Summaries are derived data, so
// regeneration loses nothing; a unit that is still active is never touched in either mode.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildUnitSummary, readStoredUnitSummary, serializeUnitSummary, unitSummarySkipReason, writeUnitSummary,
} from '../src/runner/execution/unit-summary.mjs';

const USAGE = 'usage: node scripts/backfill-unit-summaries.mjs [--dir <repo>] [--dry-run] [--regenerate]';

/** Explicit owner completion links for legacy records, not a guessed workflow join. */
export function readLegacyUnitCompletions(repoRoot) {
  const links = new Map();
  const root = path.join(repoRoot, '.fgos', 'workflow-runs');
  if (!fs.existsSync(root)) return links;
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, 'events.jsonl');
    try { if (!fs.lstatSync(file).isFile()) continue; } catch { continue; }
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let event;
      try { event = JSON.parse(line); } catch { continue; }
      const payload = event.payload;
      if (event.type !== 'unit.complete' || !payload?.unitRunId || !payload.stepId || !payload.unitId) continue;
      const completion = {
        unitRunId: payload.unitRunId,
        workflow: { runId: entry.name, stepId: payload.stepId, unitId: payload.unitId },
        outcome: payload.outcome,
        settledAt: event.ts,
        evidence: { source: 'workflow.unit.complete', file: path.relative(repoRoot, file).split(path.sep).join('/'), seq: event.seq },
      };
      const prior = links.get(payload.unitRunId);
      if (!prior || Date.parse(completion.settledAt) >= Date.parse(prior.settledAt)) links.set(payload.unitRunId, completion);
    }
  }
  return links;
}

function summaryRow(unitRunId, summary, changed) {
  return { unitRunId, changed, workflow: summary.workflow, outcome: summary.outcome,
    seats: summary.seats.length, attempts: summary.seats.reduce((sum, seat) => sum + seat.attempts.length, 0),
    settledAt: summary.settledAt, derivation: summary.derivation ?? null };
}

export function backfillUnitSummaries({ repoRoot = process.cwd(), dryRun = false, regenerate = false } = {}) {
  repoRoot = path.resolve(repoRoot);
  const root = path.join(repoRoot, '.fgos', 'assignments');
  const completions = readLegacyUnitCompletions(repoRoot);
  const report = { repoRoot, dryRun, regenerate, units: 0, changed: 0, unchanged: 0, stale: 0, removed: 0,
    skippedActive: 0, skippedUnsettled: 0, errors: [], summaries: [], staleSummaries: [], removedSummaries: [] };
  if (!fs.existsSync(root)) return report;
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !entry.name.startsWith('unit-run-')) continue;
    const unitDir = path.join(root, entry.name);
    try {
      if (!fs.lstatSync(path.join(unitDir, 'unit.json')).isFile()) continue;
      const options = { dryRun, legacyCompletion: completions.get(entry.name) };
      const stored = readStoredUnitSummary(unitDir);
      report.units += 1;
      if (stored !== null && !regenerate) {
        // Keep what is stored; say whether the current writer would produce something else.
        const summary = buildUnitSummary(unitDir, options);
        const skipped = unitSummarySkipReason(unitDir, summary);
        if (skipped === 'active') {
          report.skippedActive += 1;
        } else if (!skipped && serializeUnitSummary(summary) === stored) {
          report.unchanged += 1;
          report.summaries.push(summaryRow(entry.name, summary, false));
        } else {
          report.stale += 1;
          report.staleSummaries.push({ unitRunId: entry.name, derivedOutcome: skipped ? null : summary.outcome, reason: skipped ?? 'differs' });
        }
        continue;
      }
      const { summary, changed, skipped } = writeUnitSummary(unitDir, options);
      if (skipped === 'unsettled' && stored !== null) {
        // A finished unit whose stored summary the current writer cannot reproduce.
        if (!dryRun) fs.rmSync(path.join(unitDir, 'unit-summary.json'), { force: true });
        report.removed += 1;
        report.removedSummaries.push(entry.name);
        continue;
      }
      if (skipped) {
        report[skipped === 'active' ? 'skippedActive' : 'skippedUnsettled'] += 1;
        continue;
      }
      report[changed ? 'changed' : 'unchanged'] += 1;
      report.summaries.push(summaryRow(entry.name, summary, changed));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      report.errors.push({ unitRunId: entry.name, error: error.message });
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let repoRoot = process.cwd();
  let dryRun = false;
  let regenerate = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--regenerate') regenerate = true;
    else if (args[i] === '--dir' && args[i + 1]) repoRoot = args[++i];
    else {
      console.error(USAGE);
      process.exit(2);
    }
  }
  const report = backfillUnitSummaries({ repoRoot, dryRun, regenerate });
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length > 0) process.exitCode = 1;
}
