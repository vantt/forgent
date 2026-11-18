// head-grants.mjs -- what a head session's role may write and ask for.
//
// One frozen table keyed by persona and one reader, `grantOf(role)`, which nothing else bypasses: the launch reads
// `writes` (project-relative paths the sandbox binds writable) and `mailbox`, and the request socket reads `verbs`. A later
// change moves the data into the standard config by changing only the body of `grantOf`.

/**
 * The variable that names a head's request socket inside its sandbox. The launch sets it for a role whose grant has
 * verbs and the client in `head-request.mjs` reads it; it lives here, beside the verbs, so neither imports the other.
 */
export const HEAD_REQUEST_SOCKET_ENV = 'FGOS_HEAD_REQUEST_SOCKET';

/** `head:<persona>-<name>`; the persona and the name may both hold hyphens, so the table decides where they split. */
const ROLE_PATTERN = /^head:([a-z][a-z0-9-]*)$/;

const NONE = Object.freeze({ writes: Object.freeze([]), verbs: Object.freeze([]), mailbox: false });

/**
 * The verb a head binds its agent's own session with (the supervisor moves the role from the attempt to it in
 * Identity, so the head resolves as its CLI session), the one verb the supervisor answers itself.
 */
export const HEAD_BIND_SESSION_VERB = 'head bind session';

/**
 * Every head may bind its agent session, rotate itself, report its first turn as a successor and take its role back
 * after a failed rotation; only the secretary may also start sessions.
 */
const HEAD_VERBS = Object.freeze([HEAD_BIND_SESSION_VERB, 'head rotate', 'head answered', 'head restore role']);

/** `mailbox`: the sandbox binds the project's mailbox lock and record writable, so the head can send and receive mail. */
const GRANTS = Object.freeze({
  secretary: Object.freeze({
    writes: Object.freeze(['plans', 'docs/backlog.md', 'docs/discussions']),
    verbs: Object.freeze(['head start', ...HEAD_VERBS]),
    mailbox: true,
  }),
  shaper: Object.freeze({ writes: Object.freeze([]), verbs: HEAD_VERBS, mailbox: false }),
});

export class HeadGrantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadGrantError';
    this.code = code;
  }
}

/**
 * The grant of a head role: `{ writes, verbs, mailbox }`, two frozen arrays and a boolean. A persona the table does not name holds
 * nothing. A role that is not `head:<persona>-<name>` is refused.
 *
 * The persona matches a table key exactly. A caller that knows the persona passes it, which is the only exact
 * reading: `head:secretary-x-y` could be persona `secretary` with name `x-y` or persona `secretary-x` with name `y`.
 * Without it the persona is the text before the first hyphen, so a persona with a hyphen holds nothing. What a
 * `writes` path may be is the confinement shape's rule (`validateWorkspacePaths`), checked where the sandbox is built.
 */
export function grantOf(role, persona = null) {
  const match = ROLE_PATTERN.exec(typeof role === 'string' ? role : '');
  if (!match || !/-[a-z0-9-]+$/.test(match[1])) {
    throw new HeadGrantError('role-invalid', `${JSON.stringify(role)} is not a head role (head:<persona>-<name>)`);
  }
  const named = persona ?? match[1].slice(0, match[1].indexOf('-'));
  if (persona !== null && !match[1].startsWith(`${persona}-`)) {
    throw new HeadGrantError('role-invalid', `${JSON.stringify(role)} does not belong to persona ${JSON.stringify(persona)}`);
  }
  return Object.hasOwn(GRANTS, named) ? GRANTS[named] : NONE;
}
