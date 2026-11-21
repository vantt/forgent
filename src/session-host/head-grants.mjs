// head-grants.mjs -- what a head session's role may write and ask for.
//
// One frozen table keyed by persona and one reader, `grantOf(role)`, which nothing else bypasses: the launch reads
// `writes` (project-relative paths: a directory the sandbox binds writable, a file it keeps read-only that only the
// request socket's `session write` replaces), `mailbox` and `peers`, and the request socket reads `verbs` and `writes`.
// A later change moves the data into the standard config by changing only the body of `grantOf`.

/**
 * The variable that names a head's request socket inside its sandbox. The launch sets it for a role whose grant has
 * verbs and the client in `head-request.mjs` reads it; it lives here, beside the verbs, so neither imports the other.
 */
export const HEAD_REQUEST_SOCKET_ENV = 'FGOS_HEAD_REQUEST_SOCKET';

/** `head:<persona>-<name>`; the persona and the name may both hold hyphens, so the table decides where they split. */
const ROLE_PATTERN = /^head:([a-z][a-z0-9-]*)$/;

const NONE = Object.freeze({ writes: Object.freeze([]), verbs: Object.freeze([]), mailbox: false, peers: false });

/**
 * The verb a head binds its agent's own session with (the supervisor moves the role from the attempt to it in
 * Identity, so the head resolves as its CLI session), the one verb the supervisor answers itself.
 */
export const HEAD_BIND_SESSION_VERB = 'session bind session';

/**
 * Every head may bind its agent session, rotate itself, report its first turn as a successor and take its role back
 * after a failed rotation; only the secretary may also start sessions and write its granted file (the backlog).
 */
const HEAD_VERBS = Object.freeze([HEAD_BIND_SESSION_VERB, 'session rotate', 'session answered', 'session restore role']);

/**
 * Every head may list the open owner questions (a read the sandbox cannot make itself: the event store is masked) and
 * ask, acknowledge and cancel its own through the socket (`head-request.v1.json`); answering is the owner's, and only
 * the secretary, which carries the owner's reply, may do it. The shared list is the one place these four are named.
 */
// The read-only subset a rotation successor may use before it holds the role is `SUCCESSOR_READ_VERBS` in
// packages/run-supervisor/rust/src/head_request.rs; keep it inside these verbs.
export const QUESTION_VERBS = Object.freeze(['questions list', 'questions ask', 'questions ack', 'questions cancel']);
/** The verb only the secretary head holds: it records the owner's answer with source `secretary`. */
export const QUESTION_ANSWER_VERB = 'questions answer';

/**
 * `mailbox`: the sandbox binds the project's mailbox lock and record writable, so the head can send and receive mail.
 * `peers`: the head keeps the host pid space and reads the machine's session sockets and registry, so it can list and
 * message the other agent sessions of its machine (Claude Code's SendMessage); owner decision 2026-11-18, secretary only.
 */
const frozen = (writes, verbs) => Object.freeze({ writes: Object.freeze(writes), verbs: Object.freeze(verbs), mailbox: false, peers: false });
/** The verbs that land a branch or paths and read a unit's result; every head that lands asks for results too. */
const LAND_VERBS = Object.freeze(['land', 'request result']);
/**
 * The two coordinators (secretary and supervisor) both raise coordination events, wake the supervisor, run one unit for an urgent chore
 * (the secretary's is read-only unless it writes into a linked worktree, held to `secretary.run.*`) and record
 * coordination evidence (`fgos.coordination.*` kinds only).
 */
const COORDINATION_VERBS = Object.freeze(['supervisor raise', 'supervisor wake', 'run', 'metrics record']);
/** What the secretary reads of the supervision portfolio; the supervisor holds these too. */
const PORTFOLIO_READ_VERBS = Object.freeze(['supervisor plans', 'supervisor queue', 'slots']);

const GRANTS = Object.freeze({
  secretary: Object.freeze({
    writes: Object.freeze(['plans', 'docs/backlog.md', 'docs/discussions', 'plans/backlog/*']),
    // Miu orders and stops heads, raises work on the queue and wakes the supervisor; she never closes an event, types into a pane, reads a session or tunes the watcher. A path land is limited to her granted writes (portfolio files).
    verbs: Object.freeze(['session start', 'session stop', 'session write', ...HEAD_VERBS, ...QUESTION_VERBS, QUESTION_ANSWER_VERB, ...LAND_VERBS, ...PORTFOLIO_READ_VERBS, ...COORDINATION_VERBS]),
    mailbox: true,
    peers: true,
  }),
  // A shaper writes one discussion file and parks owner questions; it neither answers them nor starts sessions. It lands too: a path land is limited to the grant's writes, and fgos-shaping commits the discussion every round.
  shaper: Object.freeze({ ...frozen(['docs/discussions'], [...HEAD_VERBS, ...QUESTION_VERBS, ...LAND_VERBS]), mailbox: true }),
  planner: frozen(['plans', 'docs/discussions'], [...HEAD_VERBS, ...QUESTION_VERBS, ...LAND_VERBS]),
  // `session write` replaces its read-only backlog file. It goes on site (`session read`, `session type` into a stuck
  // session), tunes the watcher, prunes settled evidence, and reaches sessions by mailbox and peers.
  supervisor: Object.freeze({
    ...frozen(['plans', 'docs/backlog.md', 'plans/backlog/*'], ['session start', 'session stop', 'session write', ...HEAD_VERBS, ...QUESTION_VERBS, ...LAND_VERBS, ...PORTFOLIO_READ_VERBS, 'supervisor handled', 'supervisor done', 'session read', 'session type', 'watcher tune', ...COORDINATION_VERBS, 'metrics prune']),
    mailbox: true,
    peers: true,
  }),
});
/** A lead's verbs; its writes are its plan dir, which the caller resolves (this module reads no files). No `session start`. */
const LEAD_VERBS = Object.freeze([...HEAD_VERBS, ...QUESTION_VERBS, 'run', 'land', 'worktree create', 'request result']);

/** Every persona that holds a head grant: the table's keys and `lead`, whose grant is its plan directory. */
export const HEAD_PERSONAS = Object.freeze([...Object.keys(GRANTS), 'lead']);

export class HeadGrantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'HeadGrantError';
    this.code = code;
  }
}

/**
 * The grant of a head role: `{ writes, verbs, mailbox, peers }`, two frozen arrays and two booleans. A persona the table does not name holds
 * nothing. A role that is not `head:<persona>-<name>` is refused. A `lead` needs `{ planDir }` (the directory name under
 * `plans/`, resolved by the caller) and writes only that directory; without it `HeadGrantError('plan-not-found')`.
 *
 * The persona matches a table key exactly. A caller that knows the persona passes it, which is the only exact
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
  if (named === 'lead') {
    if (typeof planDir !== 'string' || planDir === '') throw new HeadGrantError('plan-not-found', `${JSON.stringify(role)} is a lead and has no plan directory, so it has nothing to write`);
    return Object.freeze({ writes: Object.freeze([`plans/${planDir}`]), verbs: LEAD_VERBS, mailbox: false, peers: false });
  }
  return Object.hasOwn(GRANTS, named) ? GRANTS[named] : NONE;
}
