// head-grants.mjs -- what a head session's role may write and ask for.
//
// One frozen table keyed by persona and one reader, `grantOf(role)`, which nothing else bypasses: the launch reads
// `writes` (project-relative paths the sandbox binds writable) and the request socket reads `verbs`. A later
// change moves the data into the standard config by changing only the body of `grantOf`.

import path from 'node:path';

/** `head:<persona>-<name>`; the persona and the name may both hold hyphens, so the table decides where they split. */
const ROLE_PATTERN = /^head:([a-z][a-z0-9-]*)$/;

const NONE = Object.freeze({ writes: Object.freeze([]), verbs: Object.freeze([]) });

const GRANTS = Object.freeze({
  secretary: Object.freeze({
    writes: Object.freeze(['plans', 'docs/backlog.md', 'docs/discussions']),
    verbs: Object.freeze(['head start']),
  }),
});

export class HeadGrantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadGrantError';
    this.code = code;
  }
}

/** A write path is relative to the project root and names one exact path: refused by name, never normalized into range. */
function checkWritePath(entry, persona) {
  const where = `grant of persona "${persona}"`;
  if (typeof entry !== 'string' || entry.trim() === '') throw new HeadGrantError('grant-path-invalid', `${where}: a write path must be a non-empty string`);
  if (path.isAbsolute(entry) || /^[A-Za-z]:/.test(entry)) throw new HeadGrantError('grant-path-absolute', `${where}: write path ${JSON.stringify(entry)} is absolute`);
  if (entry.split(/[\\/]/).includes('..')) throw new HeadGrantError('grant-path-climbs', `${where}: write path ${JSON.stringify(entry)} climbs out of the project root`);
  if (/[*?[\]{}]/.test(entry)) throw new HeadGrantError('grant-path-glob', `${where}: write path ${JSON.stringify(entry)} is a glob; name the exact path`);
}

/**
 * The grant of a head role: `{ writes, verbs }`, both frozen arrays. A persona the table does not name holds
 * nothing. A role that is not `head:<persona>-<name>` is refused.
 */
export function grantOf(role) {
  const match = ROLE_PATTERN.exec(typeof role === 'string' ? role : '');
  if (!match || !/-[a-z0-9-]+$/.test(match[1])) {
    throw new HeadGrantError('role-invalid', `${JSON.stringify(role)} is not a head role (head:<persona>-<name>)`);
  }
  const persona = Object.keys(GRANTS)
    .filter((candidate) => match[1].startsWith(`${candidate}-`))
    .sort((a, b) => b.length - a.length)[0];
  if (!persona) return NONE;
  const grant = GRANTS[persona];
  for (const entry of grant.writes) checkWritePath(entry, persona);
  return grant;
}
