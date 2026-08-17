#!/usr/bin/env node
// check-decision-citation-drift.mjs — detects a
// docs/backlog.md row or docs/specs/*.md prose line that
// cites a decision (`ADR<n>` or a bare `NNNN`) which has
// since been superseded, without also naming the
// superseding decision on the same line (STR72 CoS clause
// 2, PBI p-2d71dfc3 — not covered by p-9fb81485, which
// checks decisions/*.md's own internal backward-pointer
// pair instead). Detection only — flags dead framing,
// never fixes it.
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

function loadSourceFiles(backlogPath, specsDir) {
  const sources = [];
  if (fs.existsSync(backlogPath)) {
    sources.push({
      file: path.relative(process.cwd(), backlogPath),
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
        file: path.relative(process.cwd(), fullPath),
        lines: fs
          .readFileSync(fullPath, 'utf8')
          .split('\n'),
      });
    }
  }
  return sources;
}

const WIDE_SWEEP_ROOTS = ['docs', 'src', 'plugins'];
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
export function findWideCitationFindings(sourceFiles, targetId, supersedingLabel) {
  const pattern = new RegExp(`(?<![\\w-])${escapeRegExp(targetId)}(?![\\w-])`);
  const findings = [];
  for (const { file, lines } of sourceFiles) {
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

function parseArgs(argv) {
  const decisionsIdx = argv.indexOf('--decisions-dir');
  const backlogIdx = argv.indexOf('--backlog');
  const specsIdx = argv.indexOf('--specs-dir');
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
  };
}

function runCli(argv, cwd) {
  const {
    decisionsDir,
    backlogPath,
    specsDir,
  } = parseArgs(argv);
  const supersededById = loadSupersededById(
    path.resolve(cwd, decisionsDir),
  );
  const sourceFiles = loadSourceFiles(
    path.resolve(cwd, backlogPath),
    path.resolve(cwd, specsDir),
  );
  const findings = findCitationDriftFindings(
    sourceFiles,
    supersededById,
  );

  if (findings.length === 0) {
    console.log(
      'check-decision-citation-drift: no findings.',
    );
    return 0;
  }
  console.log(
    `check-decision-citation-drift: ` +
      `${findings.length} finding(s):`,
  );
  for (const f of findings) {
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
