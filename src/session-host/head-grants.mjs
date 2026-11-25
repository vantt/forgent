// head-grants.mjs -- the cage size of a head session's role: what it may write and which machine doors it binds.
//
// What a head persona may ASK for is the permission table of the session-host crate
// (`packages/session-host/contracts/head-permissions.v1.json`, decided by `fgos_session_host::permissions` inside the
// run supervisor, with the persona of the digest-protected envelope). This module is the thin Node port to the part
// of that table the launch reads: `grantOf(role)` asks the addon's `sessionHost.grantOf` for `{ writes, mailbox,
// peers }` (project-relative paths the sandbox binds writable or keeps read-only behind `session write`, the mailbox
// record, the peer sessions), until the launch of a head is ported and nothing in Node needs it.

import { nativeDoor } from '../native/door.mjs';

/**
 * The variable that names a head's request socket inside its sandbox. The launch sets it for a persona the permission
 * table names and the client in `head-request-client.mjs` reads it; it lives here so neither imports the other.
 */
export const HEAD_REQUEST_SOCKET_ENV = 'FGOS_HEAD_REQUEST_SOCKET';

/** `head:<persona>-<name>`; the persona and the name may both hold hyphens, so the table decides where they split. */
const ROLE_PATTERN = /^head:([a-z][a-z0-9-]*)$/;

const NONE = Object.freeze({ writes: Object.freeze([]), mailbox: false, peers: false });

/** Every persona that holds a head permission table entry, in the table's order: the ones a head can be. */
export const headPersonas = () => Object.freeze([...nativeDoor().sessionHost.personas()]);

/** Whether `persona` holds a head permission table entry, so its head gets a request socket. */
export const holdsHeadTable = (persona) => typeof persona === 'string' && headPersonas().includes(persona);

export class HeadGrantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadGrantError';
    this.code = code;
  }
}

/**
 * The cage size of a head role: `{ writes, mailbox, peers }`, a frozen array and two booleans. A persona the table does
 * not name holds nothing. A role that is not `head:<persona>-<name>` is refused. A `lead` needs `{ planDir }` (the
 * directory name under `plans/`, resolved by the caller) and writes only that directory; without it
 * `HeadGrantError('plan-not-found')`.
 *
 * The persona matches a table persona exactly. A caller that knows the persona passes it, which is the only exact
 * reading: `head:secretary-x-y` could be persona `secretary` with name `x-y` or persona `secretary-x` with name `y`.
 * Without it the persona is the text before the first hyphen, so a persona with a hyphen holds nothing. What a
 * `writes` path may be is the confinement shape's rule (`validateWorkspacePaths`), checked where the sandbox is built.
 */
export function grantOf(role, persona = null, { planDir = null } = {}) {
  const match = ROLE_PATTERN.exec(typeof role === 'string' ? role : '');
  if (!match || !/-[a-z0-9-]+$/.test(match[1])) {
    throw new HeadGrantError('role-invalid', `${JSON.stringify(role)} is not a head role (head:<persona>-<name>)`);
  }
  const named = persona ?? match[1].slice(0, match[1].indexOf('-'));
  if (persona !== null && !match[1].startsWith(`${persona}-`)) {
    throw new HeadGrantError('role-invalid', `${JSON.stringify(role)} does not belong to persona ${JSON.stringify(persona)}`);
  }
  const cage = nativeDoor().sessionHost.grantOf(named);
  if (cage === null) return NONE;
  if (named === 'lead') {
    if (typeof planDir !== 'string' || planDir === '') throw new HeadGrantError('plan-not-found', `${JSON.stringify(role)} is a lead and has no plan directory, so it has nothing to write`);
    return Object.freeze({ writes: Object.freeze([`plans/${planDir}`]), mailbox: cage.mailbox, peers: cage.peers });
  }
  return Object.freeze({ writes: Object.freeze([...cage.writes]), mailbox: cage.mailbox, peers: cage.peers });
}
