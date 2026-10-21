#!/usr/bin/env node
// test-proof-inventory.mjs -- P00A proof/duplication inventory (ITR-D13,
// ITR-D15). Builds a machine-readable inventory of expensive/duplicated
// test sites with a shared responsibility vocabulary, WITHOUT deleting,
// skipping or rewriting any test. Every entry gets exactly one primary
// responsibility or the explicit 'unknown' -- classification here is
// mechanical (directory convention, static call shape, an unambiguous
// keyword) on purpose: a guessed label would be worse than an honest
// 'unknown', which the plan explicitly allows and does not count as a
// savings/deletion signal.
//
// Two independent inventory sources feed one shared JSON schema:
//   1. static `run(cwd, ['init'])` call sites in an explicit file list
//      (P02's nine-file lease) -- classified by call shape.
//   2. top-N tests/files from an already-captured JUnit profile (see
//      scripts/test-timing.mjs `profile`) -- classified by directory
//      convention/keyword only.
//
// This also implements a warning-only admission check (`--check`): it
// flags NEW violations of three narrow rules in files under a caller-given
// "onboarded" scope, compared against a committed baseline count. It never
// fails on pre-existing debt and never requires annotating the whole
// suite.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { inspectRepo } from './lib/git-ports.mjs';

// Not imported from run-tests.mjs: that module imports this one for the summary it prints.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const RESPONSIBILITIES = Object.freeze([
  'direct-business-proof',
  'fixture-construction',
  'process-contract',
  'git-process-integration',
  'cross-language-packaging',
  'large-state-artifact-boundary',
  'concurrency-timing',
  'unknown',
]);

// -- 1. static `run(cwd, ['init'])` call-site scan (P02 nine-file lease) --

const RUN_INIT_RE = /\brun\(\s*([A-Za-z_$][\w$]*)\s*,\s*\[\s*'init'\s*\]\s*\)/;
const CWD_CTOR_RE = (varName) =>
  new RegExp(`\\b(?:const|let)\\s+(?:\\{[^}]*\\b${varName}\\b[^}]*\\}|${varName})\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\(`);

/**
 * Scans one file's source text for bare `run(cwdVar, ['init'])` call sites.
 * Returns raw site facts only (no classification) so the classifier stays
 * separately testable.
 */
export function scanRunInitSites(fileContent, filePath) {
  const lines = fileContent.split('\n');
  const sites = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = RUN_INIT_RE.exec(line);
    if (!m) continue;
    const cwdVar = m[1];
    // A site "resultUsed" when this same statement assigns/consumes the
    // return value (e.g. `const r = run(cwd, ['init']);` or
    // `assert.equal(run(cwd, ['init']).status, 0)`), as opposed to a bare
    // fire-and-forget `run(cwd, ['init']);` statement.
    const resultUsed = /=\s*run\(|\brun\(\s*[A-Za-z_$][\w$]*\s*,\s*\[\s*'init'\s*\]\s*\)\s*\./.test(line);
    const ctorName = resolveCwdConstructor(lines, i, cwdVar);
    sites.push({
      file: filePath,
      line: i + 1,
      cwdVar,
      resultUsed,
      cwdConstructor: ctorName,
      raw: line.trim(),
    });
  }
  return sites;
}

/**
 * Walks backward from `fromLineIdx` for the nearest `const`/`let` binding
 * of `varName` (plain or destructured `{ cwd }`) and returns the name of
 * the function called on the right-hand side, or null if none is found
 * within the same file (never guessed across file boundaries).
 */
export function resolveCwdConstructor(lines, fromLineIdx, varName) {
  const re = CWD_CTOR_RE(varName);
  for (let i = fromLineIdx; i >= 0; i -= 1) {
    const m = re.exec(lines[i]);
    if (m) return m[1];
  }
  return null;
}

/**
 * Classifies one scanned run-init site into the shared taxonomy. Mechanical
 * only: a discarded result with a non-subdir constructor is
 * fixture-construction (eligible for P02's fast-fixture substitution); a
 * discarded result whose cwd was built via a subdir-named constructor is
 * process-contract (P06 precedent: over-broad replacement broke subdir
 * cases, so cwd/subdir resolution retains the real subprocess); a
 * consumed result needs a human read and is left `unknown` rather than
 * guessed.
 */
export function classifyRunInitSite(site) {
  if (site.resultUsed) {
    return {
      primaryResponsibility: 'unknown',
      disposition: 'retain',
      reason: 'run(...) result is consumed by the caller; whether init itself is asserted needs a manual read, not a guess',
    };
  }
  if (site.cwdConstructor && /subdir/i.test(site.cwdConstructor)) {
    return {
      primaryResponsibility: 'process-contract',
      disposition: 'retain',
      reason: `cwd built via ${site.cwdConstructor}(); fgos init's own cwd/subdir resolution is the fixture location under test (P06 precedent: over-broad fast-fixture replacement broke subdir cases)`,
    };
  }
  return {
    primaryResponsibility: 'fixture-construction',
    disposition: 'optimize-execution',
    reason: 'result discarded; ordinary precondition-only fgos init call with no subdir-cwd construction',
  };
}

export function inventoryRunInitSites(files, { readFile = (f) => fs.readFileSync(f, 'utf8'), repoRoot = REPO_ROOT } = {}) {
  const entries = [];
  for (const relFile of files) {
    const abs = path.join(repoRoot, relFile);
    let content;
    try {
      content = readFile(abs);
    } catch {
      continue; // file absent from this tree; not a guess, just skip
    }
    for (const site of scanRunInitSites(content, relFile)) {
      const cls = classifyRunInitSite(site);
      entries.push({
        testId: `${relFile}::run-init@L${site.line}`,
        file: relFile,
        durationSeconds: null,
        primaryResponsibility: cls.primaryResponsibility,
        invariantId: null,
        productionGuard: null,
        boundary: 'cli-process',
        historicalFaultRefs: [],
        subprocesses: ['fgos init'],
        fixture: site.cwdConstructor,
        overlapCandidates: [],
        evidenceLevel: 'static',
        disposition: cls.disposition,
        note: cls.reason,
      });
    }
  }
  return entries;
}

// -- 2. profile-driven top-N test/file classification --

const DIR_RULES = [
  // Strong, structural signal only: rust-host tests genuinely cross the
  // Rust/Node package boundary by directory convention (see docs/specs
  // and P00's baseline report), not a content guess.
  { test: (dir) => dir === 'rust-host', responsibility: 'cross-language-packaging', reason: 'test/rust-host/** exercises the real Rust binary across the package boundary' },
];

const NAME_KEYWORD_RULES = [
  // Only names that literally say what they are, no inference.
  { test: (name) => /\b(concurrent|concurrently|racing|race\b|idle timeout|lock contention)\b/i.test(name), responsibility: 'concurrency-timing', reason: 'test name explicitly names a concurrency/timing race' },
];

function dirBucket(absFile, repoRoot) {
  const rel = path.relative(path.join(repoRoot, 'test'), absFile);
  const parts = rel.split(path.sep);
  return parts.length > 1 ? parts[0] : '(test root)';
}

export function classifyProfiledTest({ name, file }, { repoRoot = REPO_ROOT } = {}) {
  for (const rule of NAME_KEYWORD_RULES) {
    if (rule.test(name)) return { primaryResponsibility: rule.responsibility, reason: rule.reason };
  }
  const dir = dirBucket(file, repoRoot);
  for (const rule of DIR_RULES) {
    if (rule.test(dir)) return { primaryResponsibility: rule.responsibility, reason: rule.reason };
  }
  return { primaryResponsibility: 'unknown', reason: 'no mechanical directory/keyword signal; needs a manual read, not guessed' };
}

export function inventoryProfiledTests(topTests, { repoRoot = REPO_ROOT } = {}) {
  return topTests.map((t) => {
    const cls = classifyProfiledTest(t, { repoRoot });
    const relFile = path.relative(repoRoot, t.file).replaceAll('\\', '/');
    return {
      testId: `${relFile}::${t.name}`,
      file: relFile,
      durationSeconds: t.time,
      primaryResponsibility: cls.primaryResponsibility,
      invariantId: null,
      productionGuard: null,
      boundary: null,
      historicalFaultRefs: [],
      subprocesses: [],
      fixture: null,
      overlapCandidates: [],
      evidenceLevel: 'measured',
      disposition: 'retain',
      note: cls.reason,
    };
  });
}

/**
 * Per-file rollup for the top-N files by total profiled time. This is
 * orientation, not a per-test classification: a file mixing many
 * responsibilities is left `unknown` at the file level even though
 * individual tests within it may be classified elsewhere (e.g. via
 * inventoryRunInitSites for the P02 nine files).
 */
export function inventoryProfiledFiles(topFiles, { repoRoot = REPO_ROOT } = {}) {
  return topFiles.map((f) => {
    const relFile = path.relative(repoRoot, f.file).replaceAll('\\', '/');
    const dir = dirBucket(f.file, repoRoot);
    const rule = DIR_RULES.find((r) => r.test(dir));
    return {
      testId: `${relFile}::(file-rollup)`,
      file: relFile,
      durationSeconds: f.totalSeconds,
      testCount: f.count,
      primaryResponsibility: rule ? rule.responsibility : 'unknown',
      invariantId: null,
      productionGuard: null,
      boundary: null,
      historicalFaultRefs: [],
      subprocesses: [],
      fixture: null,
      overlapCandidates: [],
      evidenceLevel: 'static',
      disposition: 'retain',
      note: rule ? rule.reason : 'file mixes tests across responsibilities; no single file-level label without reading each test',
    };
  });
}

// -- 3. warning-only admission check (baseline ratchet) --

const ADMISSION_RULES = [
  {
    id: 'new-fixture-only-init-without-reason',
    // A brand-new `run(cwd, ['init'])`/`run(cwd, ['init', ...])` call with
    // no adjacent `// boundary:` marker comment on the same or previous line.
    test: (line, prevLine) => /\brun\(\s*[A-Za-z_$][\w$]*\s*,\s*\[\s*'init'/.test(line) && !/\/\/\s*boundary:/.test(line) && !/\/\/\s*boundary:/.test(prevLine ?? ''),
    message: 'new fgos init call site with no `// boundary:` reason marker',
  },
  {
    id: 'new-real-provider-network-without-marker',
    test: (line, prevLine) => /\b(fetch|https?\.request|WebSocket)\(/.test(line) && !/\/\/\s*provider-boundary:/.test(line) && !/\/\/\s*provider-boundary:/.test(prevLine ?? ''),
    message: 'new real network call with no `// provider-boundary:` reason marker',
  },
];

/**
 * Scans `changedLines` (from a unified diff's added lines, one per array
 * entry as `{ file, line, text, prevText }`) for new admission-rule
 * violations. Returns only violations not already present in `baseline`
 * (an array of `{ ruleId, file, line }` previously accepted). Warning-only:
 * callers decide whether a violation is fatal.
 */
export function checkAdmission(changedLines, baseline = []) {
  const baselineKeys = new Set(baseline.map((b) => `${b.ruleId}::${b.file}::${b.line}`));
  const violations = [];
  for (const { file, line, text, prevText } of changedLines) {
    for (const rule of ADMISSION_RULES) {
      if (!rule.test(text, prevText)) continue;
      const key = `${rule.id}::${file}::${line}`;
      if (baselineKeys.has(key)) continue;
      violations.push({ ruleId: rule.id, file, line, message: rule.message });
    }
  }
  return violations;
}

/** The zero-context patch of the work tree against `baseRef`, limited to `files`, read through Git Inspect. */
function worktreePatch(files, { baseRef, cwd }) {
  const inspect = inspectRepo(cwd);
  const before = inspect.resolveCommit({ name: baseRef });
  if (typeof before !== 'string') throw new Error(`unknown revision ${baseRef}`);
  return inspect.diffText({ before, worktree: true, paths: files, context: 0 });
}

/**
 * Builds `{ file, line, text, prevText }` rows for every added line in the
 * work tree's diff against `baseRef`, restricted to onboarded files. Only
 * additions are checked (never pre-existing debt).
 */
export function addedLinesFromGitDiff(scopeFiles, { baseRef = 'HEAD', cwd = REPO_ROOT, readPatch = worktreePatch } = {}) {
  if (scopeFiles.length === 0) return [];
  const raw = readPatch(scopeFiles, { baseRef, cwd });
  const rows = [];
  let currentFile = null;
  let nextLine = null;
  let prevText = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      prevText = null;
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      rows.push({ file: currentFile, line: nextLine, text: line.slice(1), prevText });
      prevText = line.slice(1);
      nextLine += 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // deletions don't advance the new-file line counter
    } else if (!line.startsWith('\\')) {
      prevText = null;
    }
  }
  return rows;
}

// -- 4. suite shape: test() calls, cross-file clones, the summary `npm test` prints --
//
// One proof per behaviour (design principle 8): a test body copied byte for byte
// into a second file proves nothing the first copy does not. Clones present when
// the check landed sit in the baseline and are reported until they are deleted;
// a clone that is not in the baseline fails the run.

export const SUITE_BASELINE_PATH = path.join(REPO_ROOT, 'test', 'suite-baseline.json');
const TEST_CALL_RE = /^[ \t]*(?:test|it)\(/gm;

/**
 * Index of the `)` closing the `(` at `open`, and of the first comma at the
 * call's own depth (the end of the title argument). Skips strings, template
 * literals, comments and regex literals. Null when the call never closes.
 */
export function closingParen(src, open) {
  let depth = 0;
  let firstComma = -1;
  let prev = '(';
  let i = open;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i += 1;
      while (i < src.length && src[i] !== c) i += src[i] === '\\' ? 2 : 1;
    } else if (c === '`') {
      i += 1;
      let interpolation = 0;
      while (i < src.length && !(src[i] === '`' && interpolation === 0)) {
        if (src[i] === '\\') i += 1;
        else if (src[i] === '$' && src[i + 1] === '{') { interpolation += 1; i += 1; }
        else if (src[i] === '}' && interpolation > 0) interpolation -= 1;
        i += 1;
      }
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    } else if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    } else if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev)) {
      // A slash after an operator opens a regex literal, never a division.
      i += 1;
      let inClass = false;
      while (i < src.length && src[i] !== '\n' && !(src[i] === '/' && !inClass)) {
        if (src[i] === '\\') i += 1;
        else if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        i += 1;
      }
    } else if (c === '(' || c === '[' || c === '{') {
      depth += 1;
    } else if (c === ')' || c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) return { end: i, firstComma };
    } else if (c === ',' && depth === 1 && firstComma < 0) {
      firstComma = i;
    }
    if (!/\s/.test(c)) prev = c === '"' || c === "'" || c === '`' || c === '/' ? 'a' : c;
    i += 1;
  }
  return null;
}

/**
 * Every top-level-of-line `test(` / `it(` call in one file, with its title and
 * body (the arguments after the title) stripped of all whitespace. A call the
 * scanner cannot close still counts, with `body: null`.
 */
export function scanTestCalls(source, file) {
  const calls = [];
  TEST_CALL_RE.lastIndex = 0;
  let m;
  while ((m = TEST_CALL_RE.exec(source)) !== null) {
    const open = m.index + m[0].length - 1;
    const line = source.slice(0, m.index).split('\n').length;
    const span = closingParen(source, open);
    if (!span || span.firstComma < 0) {
      calls.push({ file, line, title: null, body: null });
      continue;
    }
    calls.push({
      file,
      line,
      title: source.slice(open + 1, span.firstComma).replace(/\s+/g, ''),
      body: source.slice(span.firstComma + 1, span.end).replace(/\s+/g, ''),
    });
  }
  return calls;
}

/** Bodies that occur in more than one file, keyed by a short hash of the body. */
export function findCloneGroups(calls) {
  const byBody = new Map();
  for (const call of calls) {
    if (!call.body) continue;
    if (!byBody.has(call.body)) byBody.set(call.body, []);
    byBody.get(call.body).push(call);
  }
  const groups = [];
  for (const [body, members] of byBody) {
    const files = [...new Set(members.map((c) => c.file))].sort();
    if (files.length < 2) continue;
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 16);
    groups.push({ hash, files, members: members.map(({ file, line, title }) => ({ file, line, title })) });
  }
  return groups.sort((a, b) => a.files.join().localeCompare(b.files.join()) || a.members[0].line - b.members[0].line);
}

/** Titles used in more than one file: a warning, since a shared title is not always a clone. */
export function findSharedTitles(calls) {
  const files = new Map();
  for (const call of calls) {
    if (!call.title) continue;
    if (!files.has(call.title)) files.set(call.title, new Set());
    files.get(call.title).add(call.file);
  }
  return [...files].filter(([, set]) => set.size > 1).map(([title, set]) => ({ title, files: [...set].sort() }));
}

export function readSuiteBaseline(baselinePath = SUITE_BASELINE_PATH) {
  if (!fs.existsSync(baselinePath)) return { sha: null, files: null, tests: null, wallSeconds: null, knownClones: [] };
  return { knownClones: [], ...JSON.parse(fs.readFileSync(baselinePath, 'utf8')) };
}

/** The ref new admission-rule violations are measured against: where this branch left main. */
export function admissionBaseRef({ cwd = REPO_ROOT } = {}) {
  const inspect = inspectRepo(cwd);
  const head = inspect.resolveCommit({ name: 'HEAD' });
  for (const ref of ['origin/main', 'main']) {
    // A ref absent in this clone resolves to null; try the next one.
    const tip = head && inspect.resolveCommit({ name: ref });
    const base = tip && inspect.compareCommits({ left: head, right: tip }).mergeBase;
    if (base) return base;
  }
  return 'HEAD';
}

function formatWall(seconds) {
  return typeof seconds === 'number' ? `${Math.round(seconds)} s` : '? s';
}

/**
 * What `npm test` prints after the run: the suite size line against the
 * committed baseline, clone and shared-title findings, and new admission-rule
 * violations. `status` is 1 only for a clone the baseline does not list.
 */
export function suiteReport({
  files,
  wallSeconds = null,
  cwd = REPO_ROOT,
  baselinePath = SUITE_BASELINE_PATH,
  readFile = (f) => fs.readFileSync(f, 'utf8'),
  admission = () => checkAdmission(addedLinesFromGitDiff(['test'], { baseRef: admissionBaseRef({ cwd }), cwd })),
} = {}) {
  const calls = files.flatMap((file) => scanTestCalls(readFile(path.resolve(cwd, file)), path.relative(cwd, path.resolve(cwd, file)).replaceAll('\\', '/')));
  const baseline = readSuiteBaseline(baselinePath);
  const lines = [];
  const at = baseline.sha ? ` at ${baseline.sha.slice(0, 9)}` : '';
  const base = baseline.tests === null ? 'no baseline' : `baseline ${baseline.files} / ${baseline.tests} / ${formatWall(baseline.wallSeconds)}${at}`;
  lines.push(`suite: ${files.length} files, ${calls.length} test() calls, ${formatWall(wallSeconds)} wall (${base})`);

  const clones = findCloneGroups(calls);
  const known = new Set(baseline.knownClones.map((c) => c.hash));
  const newClones = clones.filter((g) => !known.has(g.hash));
  const present = new Set(clones.map((g) => g.hash));
  const gone = baseline.knownClones.filter((c) => !present.has(c.hash));
  for (const group of newClones) {
    lines.push(`suite: ERROR: byte-identical test body in ${group.files.length} files; keep one, delete the others:`);
    for (const m of group.members) lines.push(`  ${m.file}:${m.line}`);
  }
  if (clones.length - newClones.length > 0) lines.push(`suite: warning: ${clones.length - newClones.length} known cross-file clone(s) still listed in ${path.relative(cwd, baselinePath)}`);
  if (gone.length > 0) lines.push(`suite: ${gone.length} baselined clone(s) are gone; shrink the baseline with \`node scripts/test-proof-inventory.mjs --write-baseline\``);
  const shared = findSharedTitles(calls);
  if (shared.length > 0) lines.push(`suite: warning: ${shared.length} test title(s) appear in more than one file (\`node scripts/test-proof-inventory.mjs --duplicates\` lists them)`);
  let violations = [];
  try {
    violations = admission();
  } catch (err) {
    // Warning-only rules: a checkout git cannot diff (no commit yet, no git) skips them.
    lines.push(`suite: warning: admission rules not checked: ${String(err.message).split('\n')[0]}`);
  }
  for (const v of violations) lines.push(`suite: warning: ${v.file}:${v.line} [${v.ruleId}] ${v.message}`);
  return { lines, status: newClones.length > 0 ? 1 : 0, calls, clones, newClones, gone, shared, violations };
}

/** The baseline for the current tree: sizes, HEAD and every clone present now. Keeps the old wall time unless one is given. */
export function buildSuiteBaseline({ files, cwd = REPO_ROOT, sha, wallSeconds, previous = {}, readFile = (f) => fs.readFileSync(f, 'utf8') }) {
  const calls = files.flatMap((file) => scanTestCalls(readFile(path.resolve(cwd, file)), path.relative(cwd, path.resolve(cwd, file)).replaceAll('\\', '/')));
  return {
    sha,
    files: files.length,
    tests: calls.length,
    wallSeconds: wallSeconds ?? previous.wallSeconds ?? null,
    knownClones: findCloneGroups(calls).map(({ hash, files: cloneFiles }) => ({ hash, files: cloneFiles })),
  };
}

// -- CLI entrypoint --

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const { discoverTestFiles } = await import('./run-tests.mjs');
  if (args[0] === '--write-baseline') {
    const wallIdx = args.indexOf('--wall-seconds');
    const sha = inspectRepo(REPO_ROOT).resolveCommit({ name: 'HEAD' });
    const baseline = buildSuiteBaseline({
      files: discoverTestFiles(),
      sha,
      wallSeconds: wallIdx === -1 ? undefined : Number(args[wallIdx + 1]),
      previous: readSuiteBaseline(),
    });
    fs.writeFileSync(SUITE_BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`wrote ${path.relative(REPO_ROOT, SUITE_BASELINE_PATH)}: ${baseline.files} files, ${baseline.tests} test() calls, ${baseline.knownClones.length} known clone(s)`);
  } else if (args[0] === '--duplicates') {
    const report = suiteReport({ files: discoverTestFiles(), admission: () => [] });
    for (const group of report.clones) {
      console.log(`clone ${group.hash}${report.newClones.includes(group) ? ' (new)' : ''}:`);
      for (const m of group.members) console.log(`  ${m.file}:${m.line} ${m.title}`);
    }
    for (const { title, files } of report.shared) console.log(`title ${title}: ${files.join(', ')}`);
  } else if (args[0] === '--check') {
    const scopeIdx = args.indexOf('--scope');
    const scopeFiles = scopeIdx === -1 ? [] : args[scopeIdx + 1].split(',');
    const baselineIdx = args.indexOf('--baseline');
    const baselinePath = baselineIdx === -1 ? null : args[baselineIdx + 1];
    const baseline = baselinePath && fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : [];
    const changed = addedLinesFromGitDiff(scopeFiles);
    const violations = checkAdmission(changed, baseline);
    if (violations.length > 0) {
      console.log(`WARNING: ${violations.length} new admission-check violation(s):`);
      for (const v of violations) console.log(`  ${v.file}:${v.line} [${v.ruleId}] ${v.message}`);
    } else {
      console.log('No new admission-check violations.');
    }
    process.exitCode = 0; // warning-only: never fails the build in this track
  } else {
    console.error('Usage: node scripts/test-proof-inventory.mjs --check --scope <files> [--baseline <path>] | --duplicates | --write-baseline [--wall-seconds <s>]');
    process.exitCode = 1;
  }
}
