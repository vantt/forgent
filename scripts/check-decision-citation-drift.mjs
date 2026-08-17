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
//     this finding type -- that is the existing ADR<n>-prefix convention
//     (docs/decisions/0000-index.md), a different, pre-existing rule; a
//     bare 4-digit id is only ever caught here when it cites a superseded
//     decision (finding (1) above already covers that case).
// Detection only -- flags, never fixes. Ratchets against a checked-in
// baseline (tsk-37i D4/D8): --write-baseline snapshots every current
// finding of every kind; a bare run only fails on a finding NOT already
// in the baseline.

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
  const remaining = {};
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
  const baseline = {};
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

function loadBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) return {};
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
