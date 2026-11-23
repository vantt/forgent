import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { parseArgs as parseCliArgs } from '../src/cli/parse-args.mjs';

export function countXmlCases(xmlPath) {
  if (!fs.existsSync(xmlPath)) return 0;
  const content = fs.readFileSync(xmlPath, 'utf8');
  // Simple regex to count testcases
  const matches = content.match(/<testcase\b/g);
  return matches ? matches.length : 0;
}

/** The marker's flags, read by the CLI's own parser (`--flag value`; a bare flag reads as `true`). */
export function readMarkerArgs(argv) {
  const { flags } = parseCliArgs(argv);
  const text = (value, fallback) => (typeof value === 'string' ? value : fallback);
  const parsed = typeof flags['exit-code'] === 'string' ? parseInt(flags['exit-code'], 10) : NaN;
  return {
    runType: text(flags.type, 'full'),
    xmlPath: text(flags.xml, 'test-results/full.xml'),
    planPath: text(flags.plan, null),
    exitCode: Number.isNaN(parsed) ? null : parsed,
  };
}

// The name the marker tests import.
export { readMarkerArgs as parseArgs };

/**
 * A run only counts as `completed` when there is actual evidence it ran to a
 * real conclusion: a junit file exists, it reports at least one case, the
 * job itself ended in `success` or `failure` (never `cancelled`/`skipped`/an
 * unset `unknown` default), and a real exit code was actually recorded --
 * a crash before any test executes, a workflow cancellation, or a caller
 * that never passed `--exit-code` at all, must never read back as a
 * quietly-passing empty run.
 */
export function buildMarker({ runType, xmlPath, planPath, exitCode, jobStatus, env = process.env }) {
  let plannedFiles = 0;
  if (planPath && fs.existsSync(planPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      if (plan.selectedFiles) plannedFiles = plan.selectedFiles.length;
    } catch {
      // Malformed plan file: leave plannedFiles at 0 rather than crash marker writing.
    }
  }

  const xmlExists = fs.existsSync(xmlPath);
  const reportedCases = countXmlCases(xmlPath);
  const completed =
    xmlExists && reportedCases > 0 && exitCode !== null && (jobStatus === 'success' || jobStatus === 'failure');

  return {
    sha: env.GITHUB_SHA || 'unknown',
    runType,
    os: process.platform,
    node: process.version,
    plannedFiles,
    reportedCases,
    exitCode,
    completed,
    timestamp: new Date().toISOString(),
  };
}

export function writeMarker(outDir, marker) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'test-marker.json'), JSON.stringify(marker, null, 2));
}

function main(argv) {
  const { runType, xmlPath, planPath, exitCode } = readMarkerArgs(argv);
  const jobStatus = process.env.JOB_STATUS || 'unknown';
  const marker = buildMarker({ runType, xmlPath, planPath, exitCode, jobStatus });
  writeMarker('test-results', marker);
  console.log(`Wrote test-marker.json for runType: ${marker.runType}`);
}

if (isMainModule(import.meta.url)) {
  main(process.argv.slice(2));
}
