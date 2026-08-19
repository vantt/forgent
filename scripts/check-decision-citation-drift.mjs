#!/usr/bin/env node
// check-decision-citation-drift.mjs -- detects two families of citation
// defect across docs/backlog.md, docs/specs/*.md, and any --skills-dir
// roots (recursive, *.md):
// (1) dead-framing: a line cites a decision (ADR<n> or a bare NNNN) which
//     has since been superseded, without naming the superseding decision
//     on the same line (STR72 CoS clause 2, PBI p-2d71dfc3 -- not covered
//     by p-9fb81485, which checks decisions/*.md's own internal
//     backward-pointer pair instead).
// (2) citation-format (tsk-37i D3): a bare ADR<n>/RUL<n> id with no
//     one-line gloss immediately after it, or a D-local id (D<n>) cited
//     anywhere outside its own CONTEXT.md at all (decision 0017 -- a
//     D-local id is never cited outside its home, gloss or not; the only
//     correct fix is inlining the content and deleting the id).
//     Deliberately out of scope (tsk-37i D3, not re-opened here): a bare
//     4-digit id with no `ADR`/`RUL`/`D` prefix at all is not detected by
//     this finding type -- that is the pre-tsk-1lv-4 ADR<n>-prefix
//     convention, superseded by docs/decisions/index.md (generated,
//     tsk-1lv-2/4) now that docs/decisions/000N-*.md itself is retired; a
//     bare 4-digit id is only ever caught here when it cites a superseded
//     decision (finding (1) above already covers that case).
// Detection only -- flags, never fixes. Ratchets against a checked-in
// baseline (tsk-37i D4/D8): --write-baseline snapshots every current
// finding of every kind; a bare run only fails on a finding NOT already
// in the baseline.
//
// tsk-1lv-1 additive exports (below `runCli`): the write-time sweep
// `fgos decision --relation supersedes:<id>|touches:<id>` runs widens
// this file's own citation scan from backlog.md+specs/*.md-only to
// docs/**+src/**+plugins/**, for an arbitrary relation id (not only the
// 4-digit ADR ids `extractCitedIds` above assumes) — see
// `collectWideSourceFiles`/`findWideCitationFindings`. These are pure,
// additive, and never called by this file's own CLI mode above, so the
// existing backlog/specs-only default stays byte-identical.

import fs from 'node:fs';
import path from 'node:path';
import {
  parseFrontmatter,
} from '../src/report/frontmatter.mjs';

const DECISION_ID_PATTERN = /^\d{4}$/;
const DEFAULT_BASELINE_PATH =
  'scripts/check-decision-citation-drift.baseline.json';
const CITATION_RE =
  /\b(ADR|RUL|D)(\d{1,4})\b(\s*(\([^)]*\)))?/g;

export function isDLocalId(id) {
  return typeof id === 'string' && /^D\d+$/.test(id);
}

export function extractCitedIds(line, knownIds) {
  const ids = new Set();
  for (const m of line.matchAll(/ADR(\d{4})/g)) {
    ids.add(m[1]);
  }
  const bareRe = /(?<!ADR)\b(\d{4})\b/g;
  for (const m of line.matchAll(bareRe)) {
    if (knownIds.has(m[1])) ids.add(m[1]);
  }
  return ids;
}

export function findCitationDriftFindings(
  sourceFiles,
  supersededById,
) {
  const knownIds = new Set(supersededById.keys());
  const findings = [];

  for (const { file, lines } of sourceFiles) {
    lines.forEach((line, idx) => {
      const cited = extractCitedIds(line, knownIds);
      for (const id of cited) {
        const supersededBy = supersededById.get(id);
        if (!supersededBy) continue;
        if (cited.has(supersededBy)) continue;

        const ln = idx + 1;
        findings.push({
          kind: 'dead-framing',
          file,
          line: ln,
          text: line.trim(),
          id,
          supersededBy,
          message:
            `${file}:${ln}: cites ${id} ` +
            `(superseded by ${supersededBy}) ` +
            'without acknowledging the supersession',
        });
      }
    });
  }
  return findings;
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

function loadSupersededById(decisionsDir) {
  const nameRe = /^\d{4}-.*\.md$/;
  const files = fs
    .readdirSync(decisionsDir)
    .filter((f) => nameRe.test(f));
  const map = new Map();
  for (const file of files) {
    const id = file.slice(0, 4);
    const full = path.join(decisionsDir, file);
    const content = fs.readFileSync(full, 'utf8');
    const { meta } = parseFrontmatter(content);
    const sb = meta.superseded_by;
    if (
      typeof sb === 'string' &&
      DECISION_ID_PATTERN.test(sb)
    ) {
      map.set(id, sb);
    }
  }
  return map;
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
    sources.push({
      file: path.relative(cwd, backlogPath),
      lines: fs
        .readFileSync(backlogPath, 'utf8')
        .split('\n'),
    });
  }
  if (fs.existsSync(specsDir)) {
    const specFiles = fs
      .readdirSync(specsDir)
      .filter((f) => f.endsWith('.md'));
    for (const file of specFiles) {
      const fullPath = path.join(specsDir, file);
      sources.push({
        file: path.relative(cwd, fullPath),
        lines: fs
          .readFileSync(fullPath, 'utf8')
          .split('\n'),
      });
    }
  }
  for (const dir of skillsDirs) {
    for (const full of collectMarkdownFiles(dir)) {
      sources.push({
        file: path.relative(cwd, full),
        lines: fs.readFileSync(full, 'utf8').split('\n'),
      });
    }
  }
  return sources;
}

// `.agents/skills` (tsk-12v): the canonical dev-skill source, not reached
// by any other root before this. `.claude/skills` needs no entry of its
// own -- its generated wrapper is byte-derived from `.agents/skills` and
// never carries independent citation text (confirmed by direct read).
// `plugins/fgOS/skills` stays in the roots too (it is NOT purely
// redundant: ~35 launcher/orchestrator skills there -- cook/submit/pick/
// etc. -- have no `.agents/skills` counterpart at all). Its ~15 dev-skill
// files ARE byte-identical mirrors of `.agents/skills` (CI-enforced,
// `test/skills/fgos-mirror.test.mjs`), so a stale citation living in one
// of those gets reported once per root -- a known, accepted duplicate
// (never a missed detection, since the mirror's own byte-identity is
// test-enforced) rather than added cross-root exclusion complexity for a
// cosmetic double-count.
const WIDE_SWEEP_ROOTS = ['docs', 'src', 'plugins', 'core/skills', 'domains', '.agents/skills'];
const WIDE_SWEEP_EXTENSIONS = new Set(['.md', '.mjs', '.js']);
const WIDE_SWEEP_SKIP_DIR_NAMES = new Set(['node_modules', '.git']);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively collect `{file, lines}` for every markdown/JS source file
 * under `roots` (repo-root-relative), for the write-time citation sweep
 * `fgos decision --relation supersedes:<id>|touches:<id>` runs (D2/D8's
 * "sweep docs/**+src/**+plugins/**", not just docs/backlog.md+docs/specs/
 * *.md like this file's own CLI mode above). `excludeRelDirs` additionally
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
        const rel = path.relative(cwd, abs);
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
 * that do NOT also mention `supersedingLabel` on the same line — the
 * generalized form of `findCitationDriftFindings` above, for an arbitrary
 * relation id token (a `state.decisions` D-ID or work-item id, not only
 * the 4-digit ADR ids `extractCitedIds`/`DECISION_ID_PATTERN` assume).
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
  const decisionsIdx = argv.indexOf('--decisions-dir');
  const backlogIdx = argv.indexOf('--backlog');
  const specsIdx = argv.indexOf('--specs-dir');
  const baselineIdx = argv.indexOf('--baseline');
  const skillsDirs = [];
  argv.forEach((a, i) => {
    if (a === '--skills-dir') skillsDirs.push(argv[i + 1]);
  });
  return {
    decisionsDir:
      decisionsIdx >= 0
        ? argv[decisionsIdx + 1]
        : 'docs/decisions',
    backlogPath:
      backlogIdx >= 0
        ? argv[backlogIdx + 1]
        : 'docs/backlog.md',
    specsDir:
      specsIdx >= 0 ? argv[specsIdx + 1] : 'docs/specs',
    skillsDirs,
    baselinePath:
      baselineIdx >= 0
        ? argv[baselineIdx + 1]
        : DEFAULT_BASELINE_PATH,
    writeBaseline: argv.includes('--write-baseline'),
  };
}

function runCli(argv, cwd) {
  const {
    decisionsDir,
    backlogPath,
    specsDir,
    skillsDirs,
    baselinePath,
    writeBaseline,
  } = parseArgs(argv);
  const supersededById = loadSupersededById(
    path.resolve(cwd, decisionsDir),
  );
  const sourceFiles = loadSourceFiles(
    path.resolve(cwd, backlogPath),
    path.resolve(cwd, specsDir),
    skillsDirs.map((d) => path.resolve(cwd, d)),
    cwd,
  );
  const driftFindings = findCitationDriftFindings(
    sourceFiles,
    supersededById,
  );
  const formatFindings = findCitationFormatFindings(
    sourceFiles,
  );
  const findings = [...driftFindings, ...formatFindings];
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
    console.log(
      `check-decision-citation-drift: wrote baseline with ` +
        `${findings.length} known finding(s) across ` +
        `${Object.keys(baseline).length} file(s).`,
    );
    return 0;
  }

  if (findings.length === 0) {
    console.log(
      'check-decision-citation-drift: no findings.',
    );
    return 0;
  }

  const baseline = loadBaseline(resolvedBaselinePath);
  const newFindings = findNewFindings(findings, baseline);

  if (newFindings.length === 0) {
    console.log(
      `check-decision-citation-drift: no new findings ` +
        `(${findings.length} baselined).`,
    );
    return 0;
  }
  console.log(
    `check-decision-citation-drift: ` +
      `${newFindings.length} finding(s):`,
  );
  for (const f of newFindings) {
    console.log(`  - ${f.message}`);
  }
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli(
    process.argv.slice(2),
    process.cwd(),
  );
}
