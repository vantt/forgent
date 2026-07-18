#!/usr/bin/env node
// next-doc-id.mjs — next-free-integer generator for doc id systems that use
// a bare `<PREFIX><n>` sequence (STR, RUL, ADR; see repo/docs/id-systems-audit.md
// §gen-id). Scans a file's raw text for every occurrence of a caller-supplied
// pattern and returns one greater than the highest number found.

import fs from 'node:fs';
import path from 'node:path';

/**
 * Pure: given file content and a regex pattern string with exactly one
 * capture group (e.g. 'STR(\\d+)'), returns the next free integer — one
 * greater than the highest matched number, or 1 if there are zero matches
 * (a valid base case, not an error). Leading zeros (ADR0001) are parsed as
 * decimal integers, not corrupted.
 */
export function nextFreeId(text, pattern) {
  const regex = new RegExp(pattern, 'g');
  let max = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const n = Number.parseInt(match[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
}

function parseArgs(argv) {
  const fileIdx = argv.indexOf('--file');
  const patternIdx = argv.indexOf('--pattern');
  const file = fileIdx >= 0 ? argv[fileIdx + 1] : undefined;
  const pattern = patternIdx >= 0 ? argv[patternIdx + 1] : undefined;
  if (!file || !pattern) {
    throw new Error('usage: next-doc-id.mjs --file <path> --pattern <regex-string>');
  }
  return { file, pattern };
}

function runCli(argv, cwd) {
  const { file, pattern } = parseArgs(argv);
  const text = fs.readFileSync(path.resolve(cwd, file), 'utf8');
  console.log(String(nextFreeId(text, pattern)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
