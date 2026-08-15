#!/usr/bin/env node
// check-locked-decisions-heading-drift.mjs — detects a docs/history/<feature>/
// CONTEXT.md that owns a real D-ID decisions table under a heading other than
// the literal "## Locked decisions". src/intake/plan.mjs slices that table
// with the literal-English regex /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i,
// both to check a decompose child's cited D-IDs are real and to extract
// footprint paths. Any other heading text — translated, numbered, wrong
// heading level — makes the slice come back empty, which silently disables
// both checks instead of erroring. Detection only — flags drift, never
// fixes it.

import fs from 'node:fs';
import path from 'node:path';

const D_ID_PATTERN = /\bD\d+\b/g;
const CANONICAL_SECTION = /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i;
const HEADING_LINE = /^(#{1,6})\s*(.+)$/;

// Loose on purpose, same discipline PATH_TOKEN_PATTERN in plan.mjs uses:
// mechanical text matching, no judge call. Matches the English word and the
// Vietnamese phrase (both its "chốt" and "khoá" endings) case-insensitively.
const DECISION_LIKE_HEADING = /decision|quy.t.*.nh/i;

function findHeadings(text) {
  const lines = text.split('\n');
  const headings = [];
  lines.forEach((line, idx) => {
    const m = HEADING_LINE.exec(line);
    if (m) headings.push({ idx, level: m[1].length, title: m[2].trim() });
  });
  return { lines, headings };
}

// A heading's own body is every line up to the next heading at the SAME OR
// SHALLOWER level (a deeper heading, e.g. a "### D1" row under "## Locked
// decisions", is a child of it, not a sibling that ends it) — the same
// nesting CANONICAL_SECTION's own "next \n##" boundary already assumes.
function bodyFor(lines, headings, i) {
  const h = headings[i];
  let end = lines.length;
  for (let j = i + 1; j < headings.length; j += 1) {
    if (headings[j].level <= h.level) {
      end = headings[j].idx;
      break;
    }
  }
  return lines.slice(h.idx + 1, end).join('\n');
}

/**
 * @param {{file: string, content: string}[]} sourceFiles
 * @returns {{file: string, heading: string}[]} one finding per file that owns
 *   a real decisions table under a non-canonical heading
 */
export function findLockedDecisionsHeadingDriftFindings(sourceFiles) {
  const findings = [];

  for (const { file, content } of sourceFiles) {
    const canonMatch = CANONICAL_SECTION.exec(content);
    const canonSlice = canonMatch ? canonMatch[1] : '';
    D_ID_PATTERN.lastIndex = 0;
    if (canonSlice.trim() && D_ID_PATTERN.test(canonSlice)) continue; // reader already sees it fine

    const { lines, headings } = findHeadings(content);
    // Skip the file's own first heading: it is the document title, not a
    // content section — a title that happens to read "<slug> — locked
    // decisions" must not be mistaken for the table itself (a real corpus
    // case: the title's own intro paragraph cites another feature's D-ID in
    // passing, which is not this file's own decisions table).
    const candidates = headings
      .map((h, i) => ({ ...h, i }))
      .slice(1)
      .filter((h) => DECISION_LIKE_HEADING.test(h.title));

    for (const h of candidates) {
      const body = bodyFor(lines, headings, h.i);
      D_ID_PATTERN.lastIndex = 0;
      if (D_ID_PATTERN.test(body)) {
        findings.push({ file, heading: h.title });
        break; // one finding per file is enough to report the drift
      }
    }
  }

  return findings;
}

function loadSourceFiles(docsHistoryDir, cwd) {
  const root = path.resolve(cwd, docsHistoryDir);
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(root, entry.name, 'CONTEXT.md');
    if (fs.existsSync(full)) {
      files.push({
        file: path.relative(cwd, full),
        content: fs.readFileSync(full, 'utf8'),
      });
    }
  }
  return files;
}

function parseArgs(argv) {
  const idx = argv.indexOf('--docs-history-dir');
  return {
    docsHistoryDir: idx >= 0 ? argv[idx + 1] : 'docs/history',
  };
}

function runCli(argv, cwd) {
  const { docsHistoryDir } = parseArgs(argv);
  const sourceFiles = loadSourceFiles(docsHistoryDir, cwd);
  const findings = findLockedDecisionsHeadingDriftFindings(sourceFiles);

  if (findings.length === 0) {
    console.log('check-locked-decisions-heading-drift: no findings.');
    return 0;
  }
  console.log(`check-locked-decisions-heading-drift: ${findings.length} finding(s):`);
  for (const f of findings) {
    console.log(
      `  - ${f.file}: owns a decisions table under "${f.heading}" instead of "## Locked decisions"`,
    );
  }
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
