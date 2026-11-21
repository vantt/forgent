// item.mjs -- Backlog item parser, formatter, and write operations (D-ADR0082)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { readFrontmatter, writeFrontmatter } from '../util/yaml.mjs';
import {
  ITEM_REQUIRED_KEYS,
  ITEM_STATUSES,
  ITEM_PRIORITIES,
  ITEM_BODY_SECTIONS,
  BACKLOG_ID_REGEX,
} from './vocabulary.mjs';

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * Mint a random backlog item id: `p-<10 base32>`.
 */
export function mintBacklogId() {
  try {
    const { identityDoor } = import.meta.resolve ? {} : {};
  } catch {
    // fallback
  }
  const bytes = crypto.randomBytes(7);
  let id = '';
  let value = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      id += BASE32_ALPHABET[(value >>> bits) & 31];
      if (id.length === 10) break;
    }
    if (id.length === 10) break;
  }
  return `p-${id}`;
}

/**
 * Converts a title into a kebab-case slug.
 */
export function slugify(title) {
  if (typeof title !== 'string') return 'item';
  const clean = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'item';
}

/**
 * Checks whether a markdown body contains the required section headings.
 */
export function checkBodySections(body) {
  const missing = [];
  const lines = (body || '').split(/\r?\n/);
  const headings = lines.filter((l) => /^#{1,6}\s/.test(l));

  for (const section of ITEM_BODY_SECTIONS) {
    const regex = new RegExp(`^#{1,6}\\s+${section.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (!headings.some((h) => regex.test(h))) {
      missing.push(section);
    }
  }
  return missing;
}

/**
 * Parses a backlog item from markdown text.
 */
export function parseBacklogItem(text, file = 'backlog-item.md') {
  const { meta, body } = readFrontmatter(text, file);

  for (const key of ITEM_REQUIRED_KEYS) {
    if (meta[key] === undefined || meta[key] === null || meta[key] === '') {
      throw new Error(`${file}: missing required frontmatter key '${key}'`);
    }
  }

  if (typeof meta.id !== 'string' || !BACKLOG_ID_REGEX.test(meta.id)) {
    throw new Error(`${file}: invalid backlog id '${meta.id}'; must match ${BACKLOG_ID_REGEX}`);
  }

  if (!ITEM_STATUSES.includes(meta.status)) {
    throw new Error(
      `${file}: unknown status '${meta.status}'; allowed statuses are: ${ITEM_STATUSES.join(', ')}`
    );
  }

  if (!ITEM_PRIORITIES.includes(meta.priority)) {
    throw new Error(
      `${file}: unknown priority '${meta.priority}'; allowed priorities are: ${ITEM_PRIORITIES.join(', ')}`
    );
  }

  const missingSections = checkBodySections(body);
  if (missingSections.length > 0) {
    throw new Error(
      `${file}: missing required body section(s): ${missingSections.join(', ')}`
    );
  }

  return {
    id: meta.id,
    title: String(meta.title),
    status: String(meta.status),
    priority: String(meta.priority),
    area: String(meta.area),
    created: String(meta.created),
    meta,
    body,
  };
}

/**
 * Formats a backlog item into markdown with frontmatter.
 */
export function formatBacklogItem({
  id,
  title,
  status = 'proposed',
  priority = 'P2',
  area = 'general',
  created = new Date().toISOString().slice(0, 10),
  why = '',
  doneWhen = '',
  notes = '',
}) {
  if (!id || !BACKLOG_ID_REGEX.test(id)) {
    throw new Error(`invalid backlog id '${id}'`);
  }
  if (!ITEM_STATUSES.includes(status)) {
    throw new Error(`unknown status '${status}'`);
  }
  if (!ITEM_PRIORITIES.includes(priority)) {
    throw new Error(`unknown priority '${priority}'`);
  }

  const meta = {
    id,
    title,
    status,
    priority,
    area,
    created,
  };

  const body = [
    '',
    '# Why',
    '',
    (why || '').trim() || '...',
    '',
    '# Done when',
    '',
    (doneWhen || '').trim() || '...',
    '',
    '# Notes',
    '',
    (notes || '').trim() || '...',
    '',
  ].join('\n');

  return writeFrontmatter(meta, body);
}

/**
 * Creates a backlog item file safely.
 */
export function createBacklogItem(repoRoot, data) {
  const id = data.id || mintBacklogId();
  const slug = data.slug || slugify(data.title);
  const filename = `${id}-${slug}.md`;
  const relPath = path.join('plans', 'backlog', filename);
  const fullDir = path.join(repoRoot, 'plans', 'backlog');
  const fullPath = path.join(repoRoot, relPath);

  fs.mkdirSync(fullDir, { recursive: true });
  if (fs.existsSync(fullPath)) {
    throw new Error(`backlog item file already exists at ${relPath}`);
  }

  const content = formatBacklogItem({ ...data, id });
  const tmpPath = `${fullPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, fullPath);

  return {
    id,
    slug,
    filename,
    relPath,
    fullPath,
    content,
  };
}

/**
 * Edits an existing backlog item file safely.
 */
export function editBacklogItem(repoRoot, id, updates) {
  const backlogDir = path.join(repoRoot, 'plans', 'backlog');
  if (!fs.existsSync(backlogDir)) {
    throw new Error(`backlog directory not found at plans/backlog`);
  }

  const entries = fs.readdirSync(backlogDir);
  const match = entries.find((e) => e === `${id}.md` || e.startsWith(`${id}-`));
  if (!match) {
    throw new Error(`backlog item '${id}' not found in plans/backlog`);
  }

  const fullPath = path.join(backlogDir, match);
  const existing = fs.readFileSync(fullPath, 'utf8');
  const parsed = parseBacklogItem(existing, match);

  const updatedMeta = { ...parsed.meta, ...updates };

  let why = updates.why;
  let doneWhen = updates.doneWhen;
  let notes = updates.notes;

  if (why === undefined || doneWhen === undefined || notes === undefined) {
    // Extract sections from existing body if not updated
    const lines = parsed.body.split(/\r?\n/);
    let currentSection = null;
    const sections = { why: [], doneWhen: [], notes: [] };

    for (const line of lines) {
      if (/^#{1,6}\s+why\b/i.test(line)) {
        currentSection = 'why';
      } else if (/^#{1,6}\s+done\s+when\b/i.test(line)) {
        currentSection = 'doneWhen';
      } else if (/^#{1,6}\s+notes\b/i.test(line)) {
        currentSection = 'notes';
      } else if (/^#{1,6}\s+/.test(line)) {
        currentSection = null;
      } else if (currentSection) {
        sections[currentSection].push(line);
      }
    }

    if (why === undefined) why = sections.why.join('\n').trim();
    if (doneWhen === undefined) doneWhen = sections.doneWhen.join('\n').trim();
    if (notes === undefined) notes = sections.notes.join('\n').trim();
  }

  const content = formatBacklogItem({
    id: updatedMeta.id,
    title: updatedMeta.title,
    status: updatedMeta.status,
    priority: updatedMeta.priority,
    area: updatedMeta.area,
    created: updatedMeta.created,
    why,
    doneWhen,
    notes,
  });

  const tmpPath = `${fullPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, fullPath);

  return {
    id,
    filename: match,
    relPath: path.join('plans', 'backlog', match),
    fullPath,
    content,
  };
}
