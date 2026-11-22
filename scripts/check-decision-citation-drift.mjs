#!/usr/bin/env node
// check-decision-citation-drift.mjs -- detects citation-format defects
// across backlog, retained specs, recursive platform specs/decisions, and
// --skills-dir roots (recursive, *.md) (tsk-37i D3): a bare ADR<n>/RUL<n>
// id with no one-line gloss immediately after it, or a D-local id (D<n>)
// cited anywhere outside its own CONTEXT.md at all (decision 0017 -- a
// D-local id is never cited outside its home, gloss or not; the only
// correct fix is inlining the content and deleting the id). A bare 4-digit
// id with no `ADR`/`RUL`/`D` prefix is not detected.
// The dead-framing family (a citation of a superseded decision) was retired
// on 2026-11-22: it read `superseded_by` from docs/decisions/NNNN-*.md
// frontmatter, a corpus retired by tsk-1lv-4, so it could never fire.
// Decisions in force come from the documentation area's pkm view instead.
// Detection only -- flags, never fixes. Ratchets against a checked-in
// baseline (tsk-37i D4/D8): --write-baseline snapshots every current
// finding of every kind; a bare run only fails on a finding NOT already
// in the baseline.
//
// tsk-1lv-1 additive exports (below `runCli`): the write-time sweep
// `fgos decision --relation supersedes:<id>` runs widens this file's own
// citation scan from backlog.md+platform specs/decisions only to
// docs/**+src/**+plugins/**, for an arbitrary relation id — see
// `collectWideSourceFiles`/`findWideCitationFindings`. These are pure,
// additive, and never called by this file's own CLI mode above, so the
// existing backlog/platform-specs default stays byte-identical.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { ownedFileSet } from './lib/git-ports.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

const DEFAULT_BASELINE_PATH =
  'scripts/check-decision-citation-drift.baseline.json';
const CITATION_RE =
  /\b(ADR|RUL|D)(\d{1,4})\b(\s*(\([^)]*\)))?/g;

export function isDLocalId(id) {
  return typeof id === 'string' && /^D\d+$/.test(id);
}

// Pure: does a parenthetical (including its own parens, e.g. "(D2, D4)")
// hold a real one-line gloss, or just a short list of other citation
// tokens / punctuation that is not itself a gloss?
export function isGlossed(parenWithBraces) {
  if (!parenWithBraces) return false;
  const inner = parenWithBraces.slice(1, -1).trim();
  if (inner.length === 0) return false;
  if (/^[A-Za-z0-9,/\-\s]{0,15}$/.test(inner)) return false;
  return true;
}

export function findCitationFormatFindings(sourceFiles) {
  const findings = [];
  for (const { file, lines } of sourceFiles) {
    const isOwnContext = file.endsWith('/CONTEXT.md') ||
      file === 'CONTEXT.md';
    let inFence = false;
    lines.forEach((line, idx) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;

      const ln = idx + 1;
      CITATION_RE.lastIndex = 0;
      let m;
      while ((m = CITATION_RE.exec(line)) !== null) {
        const kind = m[1];
        const num = m[2];
        const paren = m[4];

        if (kind === 'D') {
          if (!isOwnContext) {
            findings.push({
              kind: 'd-local-outside-home',
              file,
              line: ln,
              text: line.trim(),
              id: `D${num}`,
              message:
                `${file}:${ln}: cites D-local id D${num} ` +
                'outside its own CONTEXT.md (decision 0017 -- ' +
                'inline the content, delete the id)',
            });
          }
          continue;
        }

        if (!isGlossed(paren)) {
          findings.push({
            kind: 'bare-citation',
            file,
            line: ln,
            text: line.trim(),
            id: `${kind}${num}`,
            message:
              `${file}:${ln}: cites ${kind}${num} with no gloss ` +
              '-- self-contained citation must be ' +
              '"<ID> (<one-line gloss>)"',
          });
        }
      }
    });
  }
  return findings;
}

// Content-keyed (not line-keyed, tsk-3x8 F1): a line inserted or deleted
// earlier in the file shifts every later `line` number, which would make
// an already-baselined finding look "new" under a line-keyed baseline
// (the mechanism check-decision-codes.mjs's own content-keyed baseline
// already avoids). `id` stays in the key alongside `text` because one
// line can carry more than one citation finding (e.g. two ids cited on
// the same line) -- `text` alone would collapse those into one entry.
function findingKey(f) {
  return `${f.kind}:${f.id}:${f.text}`;
}

// Occurrence-count consumption (tsk-6at), not membership: a file can
// legitimately carry two or more findings whose kind/id/text are all
// identical (a repeated citation phrase, a templated table row). Baseline
// membership alone (`.includes`) would treat every such repeat as
// "already known" forever, silently missing a genuinely new Nth
// occurrence once at least one had ever been baselined. Consuming one
// baseline occurrence per matching finding restores the per-occurrence
// accounting the old line-keyed formula got for free.
export function findNewFindings(findings, baseline) {
  // Object.create(null) (tsk-1pf): a plain `{}` literal would let a
  // source file path literally equal to "__proto__" return
  // Object.prototype itself from `remaining[f.file]` below (truthy, not
  // undefined), which then throws on `.get()`/`.set()`.
  const remaining = Object.create(null);
  for (const [file, keys] of Object.entries(baseline)) {
    const counts = new Map();
    for (const key of keys) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    remaining[file] = counts;
  }
  return findings.filter((f) => {
    const counts = remaining[f.file];
    if (!counts) return true;
    const key = findingKey(f);
    const left = counts.get(key) || 0;
    if (left > 0) {
      counts.set(key, left - 1);
      return false;
    }
    return true;
  });
}

export function baselineFromFindings(findings) {
  // Object.create(null) (tsk-1pf): same __proto__ guard as findNewFindings
  // above -- `baseline[f.file] = []` on a plain `{}` would reassign the
  // prototype instead of creating a normal property.
  const baseline = Object.create(null);
  for (const f of findings) {
    if (!baseline[f.file]) baseline[f.file] = [];
    baseline[f.file].push(findingKey(f));
  }
  return baseline;
}

function collectMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(current) {
    for (const entry of fs.readdirSync(current, {
      withFileTypes: true,
    })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md')
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function loadSourceFiles(
  backlogPath,
  specsDir,
  skillsDirs,
  cwd,
) {
  const sources = [];
  if (fs.existsSync(backlogPath)) {
    const backlogFiles = fs.statSync(backlogPath).isDirectory()
      ? collectMarkdownFiles(backlogPath).sort()
      : [backlogPath];
    for (const full of backlogFiles) {
      sources.push({
        file: path.relative(cwd, full).replaceAll('\\', '/'),
        lines: fs.readFileSync(full, 'utf8').split('\n'),
      });
    }
  }
  // Read set under the platform root: area specs, decision narratives and the
  // platform foundations; retired history trees are never scanned.
  for (const full of collectMarkdownFiles(specsDir)) {
    const rel = `/${path.relative(specsDir, full).replaceAll('\\', '/')}`;
    if (rel.split('/').includes('history')) continue;
    if (!(rel.endsWith('/spec.md') || rel.includes('/decisions/') ||
          rel === '/platform-foundations.md')) continue;
    const file = path.relative(cwd, full).replaceAll('\\', '/');
    sources.push({ file, lines: fs.readFileSync(full, 'utf8').split('\n') });
  }
  // Files git ignores belong to another tool (installed skill kits), not to this repository.
  const owned = ownedFileSet(cwd);
  const isOwned = (full) => !owned || owned.has(path.relative(cwd, full).replaceAll('\\', '/'));
  for (const dir of skillsDirs) {
    for (const full of collectMarkdownFiles(dir).filter(isOwned)) {
      sources.push({
        file: path.relative(cwd, full).replaceAll('\\', '/'),
        lines: fs.readFileSync(full, 'utf8').split('\n'),
      });
    }
  }
  return sources;
}

// The sweep reads the sources a citation is written in, never a generated
// render of them: `.agents/skills` and `.claude/skills` are projections of
// `core/skills` and `domains/*/skills`. `plugins/fgOS/skills` stays because it
// also carries launcher skills that have no source under those two roots; its
// copies of the dev-skills are byte-identical mirrors (`test/skills/fgos-mirror.test.mjs`),
// so a stale citation in one is still found, once per root.
const WIDE_SWEEP_ROOTS = ['docs', 'src', 'plugins', 'core/skills', 'domains'];
const WIDE_SWEEP_EXTENSIONS = new Set(['.md', '.mjs', '.js']);
const WIDE_SWEEP_SKIP_DIR_NAMES = new Set(['node_modules', '.git']);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively collect `{file, lines}` for every markdown/JS source file
 * under `roots` (repo-root-relative), for the write-time citation sweep
 * `fgos decision --relation supersedes:<id>|touches:<id>` runs (D2/D8's
 * "sweep docs/**+src/**+plugins/**", not just plans/backlog/+the platform
 * specs like this file's own CLI mode above). `excludeRelDirs` additionally
 * skips any file whose repo-relative path starts with one of the given
 * prefixes — the "feature's own docs/history dir" self-citation carve-out
 * (round 3 DISCUSSION: a feature citing its own in-flight D-IDs in its own
 * history folder is not stale framing).
 */
export function collectWideSourceFiles(cwd, { roots = WIDE_SWEEP_ROOTS, excludeRelDirs = [] } = {}) {
  const isExcluded = (relPath) =>
    excludeRelDirs.some((prefix) => relPath === prefix || relPath.startsWith(`${prefix}/`));
  const sources = [];

  for (const root of roots) {
    const absRoot = path.join(cwd, root);
    if (!fs.existsSync(absRoot)) continue;
    const stack = [absRoot];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const abs = path.join(current, entry.name);
        const rel = path.relative(cwd, abs).replaceAll('\\', '/');
        if (entry.isDirectory()) {
          if (WIDE_SWEEP_SKIP_DIR_NAMES.has(entry.name) || isExcluded(rel)) continue;
          stack.push(abs);
          continue;
        }
        if (!entry.isFile()) continue;
        if (!WIDE_SWEEP_EXTENSIONS.has(path.extname(entry.name))) continue;
        if (isExcluded(rel)) continue;
        sources.push({ file: rel, lines: fs.readFileSync(abs, 'utf8').split('\n') });
      }
    }
  }
  return sources;
}

/**
 * Pure: whole-word literal citations of `targetId` across `sourceFiles`
 * that do NOT also mention `supersedingLabel` on the same line, for an
 * arbitrary relation id token (a `state.decisions` D-ID or work-item id).
 */
export function findWideCitationFindings(sourceFiles, targetId, supersedingLabel, homeFile) {
  let effectiveSourceFiles = sourceFiles;
  if (isDLocalId(targetId)) {
    if (!homeFile) return [];
    effectiveSourceFiles = sourceFiles.filter((s) => s.file === homeFile);
  }
  const pattern = new RegExp(`(?<![\\w-])${escapeRegExp(targetId)}(?![\\w-])`);
  const findings = [];
  for (const { file, lines } of effectiveSourceFiles) {
    lines.forEach((line, idx) => {
      if (!pattern.test(line)) return;
      if (supersedingLabel && line.includes(supersedingLabel)) return;
      const ln = idx + 1;
      findings.push({
        kind: 'dangling-citation',
        file,
        line: ln,
        id: targetId,
        supersededBy: supersedingLabel ?? null,
        message:
          `${file}:${ln}: cites ${targetId} without acknowledging it is ` +
          `superseded by ${supersedingLabel ?? '(unspecified)'}`,
      });
    });
  }
  return findings;
}

function loadBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) return Object.create(null);
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function parseArgs(argv) {
  const backlogIdx = argv.indexOf('--backlog');
  const specsIdx = argv.indexOf('--specs-dir');
  const baselineIdx = argv.indexOf('--baseline');
  const skillsDirs = [];
  argv.forEach((a, i) => {
    if (a === '--skills-dir') skillsDirs.push(argv[i + 1]);
  });
  return {
    backlogPath:
      backlogIdx >= 0
        ? argv[backlogIdx + 1]
        : 'plans/backlog',
    specsDir:
      specsIdx >= 0 ? argv[specsIdx + 1] : 'docs/platform',
    skillsDirs,
    baselinePath:
      baselineIdx >= 0
        ? argv[baselineIdx + 1]
        : DEFAULT_BASELINE_PATH,
    writeBaseline: argv.includes('--write-baseline'),
  };
}

export function runCli(argv, cwd, log = console.log) {
  const {
    backlogPath,
    specsDir,
    skillsDirs,
    baselinePath,
    writeBaseline,
  } = parseArgs(argv);
  const sourceFiles = loadSourceFiles(
    path.resolve(cwd, backlogPath),
    path.resolve(cwd, specsDir),
    skillsDirs.map((d) => path.resolve(cwd, d)),
    cwd,
  );
  const findings = findCitationFormatFindings(
    sourceFiles,
  );
  const resolvedBaselinePath = path.resolve(
    cwd,
    baselinePath,
  );

  if (writeBaseline) {
    const baseline = baselineFromFindings(findings);
    fs.writeFileSync(
      resolvedBaselinePath,
      JSON.stringify(baseline, null, 2) + '\n',
    );
    log(
      `check-decision-citation-drift: wrote baseline with ` +
        `${findings.length} known finding(s) across ` +
        `${Object.keys(baseline).length} file(s).`,
    );
    return 0;
  }

  if (findings.length === 0) {
    log(
      'check-decision-citation-drift: no findings.',
    );
    return 0;
  }

  const baseline = loadBaseline(resolvedBaselinePath);
  const newFindings = findNewFindings(findings, baseline);

  if (newFindings.length === 0) {
    log(
      `check-decision-citation-drift: no new findings ` +
        `(${findings.length} baselined).`,
    );
    return 0;
  }
  log(
    `check-decision-citation-drift: ` +
      `${newFindings.length} finding(s):`,
  );
  for (const f of newFindings) {
    log(`  - ${f.message}`);
  }
  return 1;
}

if (isMainModule(import.meta.url)) {
  // Staged here, never at module scope: bin/fgos.mjs imports this file and must not build Rust on every start.
  ensureAddonForScript();
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
