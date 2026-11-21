// discussion.mjs -- Discussion frontmatter parser and formatter (D-ADR0082)
import { readFrontmatter, writeFrontmatter } from "../../src/util/yaml.mjs";
import {
  DISCUSSION_REQUIRED_KEYS,
  DISCUSSION_STATUSES,
  DISCUSSION_ID_REGEX,
} from './vocabulary.mjs';

/**
 * Parses a discussion from markdown text.
 */
export function parseDiscussion(text, file = 'DISCUSSION.md') {
  const { meta, body } = readFrontmatter(text, file);

  for (const key of DISCUSSION_REQUIRED_KEYS) {
    if (meta[key] === undefined || meta[key] === null) {
      throw new Error(`${file}: missing required frontmatter key '${key}'`);
    }
  }

  if (typeof meta.id !== 'string' || !DISCUSSION_ID_REGEX.test(meta.id)) {
    throw new Error(`${file}: invalid discussion id '${meta.id}'; must match ${DISCUSSION_ID_REGEX}`);
  }

  if (!DISCUSSION_STATUSES.includes(meta.status)) {
    throw new Error(
      `${file}: unknown status '${meta.status}'; allowed statuses are: ${DISCUSSION_STATUSES.join(', ')}`
    );
  }

  if (!Array.isArray(meta.source)) {
    throw new Error(`${file}: 'source' must be an array of backlog item ids`);
  }

  return {
    id: meta.id,
    title: String(meta.title),
    status: String(meta.status),
    source: meta.source.map(String),
    created: String(meta.created),
    meta,
    body,
  };
}

/**
 * Formats discussion markdown text with frontmatter.
 */
export function formatDiscussion({
  id,
  title,
  status = 'open',
  source = [],
  created = new Date().toISOString().slice(0, 10),
  body = '',
}) {
  if (!id || !DISCUSSION_ID_REGEX.test(id)) {
    throw new Error(`invalid discussion id '${id}'`);
  }
  if (!DISCUSSION_STATUSES.includes(status)) {
    throw new Error(`unknown status '${status}'`);
  }
  if (!Array.isArray(source)) {
    throw new Error(`'source' must be an array`);
  }

  const meta = {
    id,
    title,
    status,
    source,
    created,
  };

  const bodyContent = body.trim() ? `\n\n${body.trim()}\n` : '\n';
  return writeFrontmatter(meta, bodyContent);
}
