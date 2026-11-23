// identity-ids-unique.mjs -- the id registries of this checkout carry no repeated id:
// no two backlog rows share an id, no `D-ADR` number is headed with two different
// titles, and no two decision files share a number. The safety net behind the mint door
// (`fgos identity mint <kind>`): a second writer that bypassed it shows up here, never
// as a silent clash. Owned proof: test/scripts/doc-health.test.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../src/util/yaml.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

// The YAML door needs the native addon; a missing addon must fail loudly here,
// never surface as swallowed parse errors.
ensureAddonForScript();

const MAX_REGISTRY_BYTES = 8 * 1024 * 1024;

function readText(file) {
  try {
    const stat = fs.statSync(file);
    return stat.isFile() && stat.size <= MAX_REGISTRY_BYTES ? fs.readFileSync(file, 'utf8') : null;
  } catch {
    return null;
  }
}

/**
 * Reads an item's frontmatter id, status, and recorded original id if any.
 * One shared reader for backlog checks; an item that cannot be parsed throws.
 */
export function readBacklogItemIdentity(text, file = 'backlog item') {
  const { meta, body } = readFrontmatter(text, file);
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error(`${file}: frontmatter is not a mapping`);
  }
  const id = typeof meta.id === 'string' && meta.id.trim() ? meta.id.trim() : null;
  if (!id) {
    throw new Error(`${file}: missing required frontmatter key 'id'`);
  }
  const status = typeof meta.status === 'string' && meta.status.trim() ? meta.status.trim() : null;
  // Only a line of its own counts; a prose or backtick mention inside a sentence does not.
  const origMatch = /^Original id:\s*(\S+?)\.?\s*$/m.exec(body ?? '');
  const originalId = origMatch ? origMatch[1] : null;
  return { id, status, originalId, meta, body };
}

/**
 * Every Markdown file under `dir`, any depth; a directory that does not exist yields none.
 * Directories named in `skip` are not entered: relocated history repeats decisions that
 * the area specs already carry, so it must not count as a second definition.
 */
function markdownFilesUnder(dir, skip = []) {
  const files = [];
  const pending = [dir];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue; // a checkout without the platform tree has no decisions to scan
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) { if (!skip.includes(entry.name)) pending.push(full); }
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  }
  return files;
}

/** The id registries of one checkout: backlog rows, `D-ADR` headings, decision file numbers. */
function readIdRegistries(root) {
  const backlogIds = [];
  const parseErrors = [];
  // The backlog keeps one file per item; its id is the frontmatter id and its original id if recorded.
  const itemsDir = path.join(root, 'plans/backlog');
  for (const file of markdownFilesUnder(itemsDir)) {
    const text = readText(file);
    if (text === null) {
      parseErrors.push(`${path.relative(root, file)}: could not read file`);
      continue;
    }
    try {
      const item = readBacklogItemIdentity(text, file);
      if (item.id) backlogIds.push(item.id);
      if (item.originalId) backlogIds.push(item.originalId);
    } catch (err) {
      parseErrors.push(`${path.relative(root, file)}: failed to read backlog item: ${err.message}`);
    }
  }
  // One decision may be recorded in several area specs; it is the same decision while every
  // heading gives it the same short title, and two titles under one number are two decisions.
  const adrTitles = new Map();
  for (const file of markdownFilesUnder(path.join(root, 'docs/platform'), ['history'])) {
    for (const line of (readText(file) ?? '').split('\n')) {
      const heading = /^#+\s+(D-ADR\d{4})\s*(?:\(([^)]*)\))?/.exec(line);
      if (!heading) continue;
      const titles = adrTitles.get(heading[1]) ?? new Set();
      titles.add((heading[2] ?? '').trim());
      adrTitles.set(heading[1], titles);
    }
  }
  const fileNumbers = [];
  try {
    for (const name of fs.readdirSync(path.join(root, 'docs/decisions'))) {
      const number = /^(\d{4})-/.exec(name)?.[1];
      if (number) fileNumbers.push(number);
    }
  } catch {
    // the decision corpus is retired in most checkouts
  }
  return { backlogIds, adrTitles, fileNumbers, parseErrors };
}

const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

/**
 * No two backlog rows share an id, no `D-ADR` number is headed with two different titles,
 * and no two decision files share a number.
 */
export function checkIdentityIdsUnique(root) {
  const { backlogIds, adrTitles, fileNumbers, parseErrors } = readIdRegistries(root);
  const problems = [
    ...(parseErrors ?? []),
    ...duplicates(backlogIds).map((id) => `backlog id ${id} is used by more than one row`),
    ...[...adrTitles].filter(([, titles]) => titles.size > 1).map(([id, titles]) => `${id} is headed with different titles (${[...titles].map((t) => JSON.stringify(t)).join(', ')})`),
    ...duplicates(fileNumbers).map((number) => `decision file number ${number} is used by more than one file`),
  ];
  if (problems.length > 0) {
    return { passed: false, message: `${problems.join('; ')} -- ids that travel between machines come from \`fgos identity mint <kind>\`; renumber the later one` };
  }
  return { passed: true, message: `${backlogIds.length} backlog ids, ${adrTitles.size} D-ADR numbers and ${fileNumbers.length} decision files, none repeated` };
}
