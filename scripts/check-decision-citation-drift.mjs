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
