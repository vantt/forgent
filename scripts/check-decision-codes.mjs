#!/usr/bin/env node
// check-decision-codes.mjs -- detects a test/it/describe name that embeds
// an internal decision code (str##/D#/RUL##/STR##/tsk-xxx) instead of
// describing the invariant in plain words
// (review-audit-self-decision.md, Stable Code Artifacts). Ratchets
// against a checked-in baseline so it only blocks NEW occurrences going
// forward, never the pre-existing backlog a separate cleanup effort
// still owns (docs/history/decision-code-check-enforcement/CONTEXT.md
// D1).

import fs from 'node:fs';
import path from 'node:path';

const DECISION_CODE_RE =
  /^\s*(test|it|describe)\(\s*['"].*\b(str[0-9]{2,3}|D[0-9]{1,2}\b|RUL[0-9]{2,3}|STR[0-9]{2,3}|tsk-[0-9a-z]{3})\b/;

const DEFAULT_TEST_DIR = 'test';
const DEFAULT_BASELINE_PATH =
  'scripts/check-decision-codes.baseline.json';
const DEFAULT_EXCLUDE = new Set(['next-doc-id.test.mjs']);

export function findDecisionCodeFindings(files) {
  const findings = [];
  for (const { file, lines } of files) {
    lines.forEach((line, idx) => {
      const m = line.match(DECISION_CODE_RE);
      if (!m) return;
      const ln = idx + 1;
      findings.push({
        file,
        line: ln,
        code: m[2],
        text: line.trim(),
        message:
          `${file}:${ln}: test name embeds decision code ` +
          `"${m[2]}" -- describe the invariant in plain words instead`,
      });
    });
  }
  return findings;
}

// Occurrence-count consumption (tsk-1pf, porting tsk-6at's own fix for
// the sibling check-decision-citation-drift.mjs): a file can legitimately
// carry two or more findings with identical text (a repeated test-name
// pattern). Membership alone (`.includes`) would treat every such repeat
// as "already known" forever, missing a genuinely new Nth occurrence.
export function findNewFindings(findings, baseline) {
  const remaining = Object.create(null);
  for (const [file, texts] of Object.entries(baseline)) {
    const counts = new Map();
    for (const text of texts) {
      counts.set(text, (counts.get(text) || 0) + 1);
    }
    remaining[file] = counts;
  }
  return findings.filter((f) => {
    const counts = remaining[f.file];
    if (!counts) return true;
    const left = counts.get(f.text) || 0;
    if (left > 0) {
      counts.set(f.text, left - 1);
      return false;
    }
    return true;
  });
}

export function baselineFromFindings(findings) {
  // Object.create(null) (tsk-1pf): a plain `{}` literal would let a
  // source file path literally equal to "__proto__" reassign the
  // object's own prototype instead of creating a normal property.
  const baseline = Object.create(null);
  for (const f of findings) {
    if (!baseline[f.file]) baseline[f.file] = [];
    baseline[f.file].push(f.text);
  }
  return baseline;
}

function collectTestFiles(dir, exclude) {
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, {
      withFileTypes: true,
    })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.test.mjs') &&
        !exclude.has(entry.name)
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function loadSourceFiles(testDir, cwd, exclude) {
  return collectTestFiles(testDir, exclude).map((full) => ({
    file: path.relative(cwd, full),
    lines: fs.readFileSync(full, 'utf8').split('\n'),
  }));
}

function loadBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) return Object.create(null);
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function parseArgs(argv) {
  const testDirIdx = argv.indexOf('--test-dir');
  const baselineIdx = argv.indexOf('--baseline');
  return {
    testDir: testDirIdx >= 0 ? argv[testDirIdx + 1] : DEFAULT_TEST_DIR,
    baselinePath:
      baselineIdx >= 0 ? argv[baselineIdx + 1] : DEFAULT_BASELINE_PATH,
    writeBaseline: argv.includes('--write-baseline'),
  };
}

function runCli(argv, cwd) {
  const { testDir, baselinePath, writeBaseline } = parseArgs(argv);
  const resolvedTestDir = path.resolve(cwd, testDir);
  const resolvedBaselinePath = path.resolve(cwd, baselinePath);
  const sourceFiles = loadSourceFiles(
    resolvedTestDir,
    cwd,
    DEFAULT_EXCLUDE,
  );
  const findings = findDecisionCodeFindings(sourceFiles);

  if (writeBaseline) {
    const baseline = baselineFromFindings(findings);
    fs.writeFileSync(
      resolvedBaselinePath,
      JSON.stringify(baseline, null, 2) + '\n',
    );
    console.log(
      `check-decision-codes: wrote baseline with ` +
        `${findings.length} known violation(s) across ` +
        `${Object.keys(baseline).length} file(s).`,
    );
    return 0;
  }

  const baseline = loadBaseline(resolvedBaselinePath);
  const newFindings = findNewFindings(findings, baseline);

  if (newFindings.length === 0) {
    console.log(
      `check-decision-codes: no new findings ` +
        `(${findings.length} baselined).`,
    );
    return 0;
  }
  console.log(
    `check-decision-codes: ${newFindings.length} new finding(s):`,
  );
  for (const f of newFindings) {
    console.log(`  - ${f.message}`);
  }
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
