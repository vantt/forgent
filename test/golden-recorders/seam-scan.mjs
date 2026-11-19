#!/usr/bin/env node
// Execution seam scanner: lists every import specifier (static `from '...'`,
// side-effect `import '...'`, dynamic `import('...')`) in *.mjs|*.js|*.cjs files
// under the given roots that resolves into the Execution tier's Node paths,
// from a file outside those paths. Relative specifiers are resolved against the
// importing file's directory; bare specifiers are ignored. Output is JSON:
// { root, roots, targets, count, files, hits: [{ file, line, specifier, target }] }.
// An empty `hits` list means nothing outside the Execution tier reaches into it.
//
// Usage: node test/golden-recorders/seam-scan.mjs [--repo <dir>] [root ...]
// Default roots: src bin scripts. Roots are relative to the repository root.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGETS = [
  'src/runner/execution/',
  'src/runner/dispatch/',
  'src/run-supervisor/',
  'src/verbs/dispatch/',
  'src/runner/dispatch.mjs',
];
const SKIP_DIRS = new Set(['node_modules', '.git', 'target', '.fgos']);
const SOURCE = /\.(mjs|js|cjs)$/;
const SPECIFIER = [
  /\bfrom\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
];

function parseArgs(argv) {
  let repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const roots = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--repo') repo = resolve(argv[(i += 1)]);
    else roots.push(argv[i]);
  }
  return { repo, roots: roots.length ? roots : ['src', 'bin', 'scripts'] };
}

function toPosix(path) {
  return path.split(sep).join('/');
}

function insideTargets(rel) {
  return TARGETS.some((t) => (t.endsWith('/') ? rel.startsWith(t) : rel === t));
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && SOURCE.test(entry.name)) {
      yield full;
    }
  }
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

function scanFile(repo, full) {
  const file = toPosix(relative(repo, full));
  if (insideTargets(file)) return [];
  const text = readFileSync(full, 'utf8');
  const seen = new Set();
  const hits = [];
  for (const pattern of SPECIFIER) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const specifier = match[2];
      if (!specifier.startsWith('.')) continue;
      const target = toPosix(relative(repo, resolve(dirname(full), specifier)));
      if (!insideTargets(target)) continue;
      const at = match.index + match[0].indexOf(specifier);
      const line = lineOf(text, at);
      const key = `${line}:${specifier}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ file, line, specifier, target });
    }
  }
  return hits;
}

const { repo, roots } = parseArgs(process.argv.slice(2));
const hits = [];
for (const root of roots) {
  const base = resolve(repo, root);
  let stat;
  try {
    stat = statSync(base);
  } catch {
    continue;
  }
  const files = stat.isDirectory() ? walk(base) : [base];
  for (const full of files) hits.push(...scanFile(repo, full));
}
hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
const files = new Set(hits.map((h) => h.file)).size;
process.stdout.write(
  `${JSON.stringify({ root: repo, roots, targets: TARGETS, count: hits.length, files, hits }, null, 2)}\n`,
);
