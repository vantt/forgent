// chain.mjs -- `fgos coordination chain <track>`: a real, read-only way to
// see "what's done, what's next" across a whole chain of cell-sessions,
// reconstructed ENTIRELY from each matching session's own persisted event
// log through the SAME read door `fgos coordination show` already uses
// (`showCoordinationUseCase`) -- never a new persisted plan/status object.
//
// No cache/index file is ever written under `.fgos/` by this module -- a
// hard negative requirement, not a missed optimization. Correctness over
// speed for v1: any real performance concern belongs in a named Gap, not a
// reason to add a cache.
//
// Every function this module calls is one of store.mjs's own read-only
// exports (`resolveCoordinationPaths`, `readManifest`) or show.mjs's own
// `showCoordinationUseCase` -- it never appends an event, opens/resumes a
// session for writing, dispatches an Assignment, authorizes an operation,
// records a disposition, or closes a session. This is verified by a static
// import-list check in this module's own test file (never asserted only in
// prose).
import fs from 'node:fs';
import { resolveCoordinationPaths, readManifest } from '../../runner/coordination/store.mjs';
import { showCoordinationUseCase } from './show.mjs';

const ACTIVE_STATUS = 'active';

function trackPrefix(track) {
  return `${track}--`;
}

// List every session id under `.fgos/coordination/sessions/` that is a
// genuine member of `<track>`: starts with the EXACT `<track>--` prefix AND
// its remainder (the would-be cellId) contains no further `--` of its own.
// This is deliberately stricter than a raw directory-name prefix match:
// `probe--other-track--cellC` DOES start with the raw string "probe--", but
// its remainder "other-track--cellC" carries its own `--`-delimited
// boundary -- exactly the shape a genuinely different track's own session
// id ("other-track--cellC") would carry if it were merely PREFIXED by
// "probe--" coincidentally. A loose `startsWith` match alone would silently
// misfile it as track "probe"'s own cell "other-track--cellC"; this scan
// excludes it entirely instead, so it belongs to neither "probe" (it is not
// a flat cellId under that track) nor is silently misrendered under it.
function listMatchingSessionIds(track, opts) {
  const { sessionsDir } = resolveCoordinationPaths(opts);
  if (!fs.existsSync(sessionsDir)) return [];
  const prefix = trackPrefix(track);
  return fs
    .readdirSync(sessionsDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory() || !entry.name.startsWith(prefix)) return false;
      const remainder = entry.name.slice(prefix.length);
      return remainder !== '' && !remainder.includes('--');
    })
    .map((entry) => entry.name);
}

// A plain-text hint naming the concrete next action for one cell's own
// `show` output -- built ONLY from fields `showCoordinationUseCase` already
// derives (`pendingDriverAuthorizations`, `quorum.missing`), never a new
// replay/derivation of its own.
function describeNextActionForCell(cellId, sessionShow) {
  const { coordinationId, pendingDriverAuthorizations, quorum } = sessionShow;
  const showHint = `Run \`fgos coordination show ${coordinationId}\` for detail.`;
  if (Array.isArray(pendingDriverAuthorizations) && pendingDriverAuthorizations.length > 0) {
    const names = pendingDriverAuthorizations.map((b) => `${b.nodeId}/${b.operationId}`).join(', ');
    return `Cell "${cellId}" (session "${coordinationId}") has ${pendingDriverAuthorizations.length} declared operation(s) still awaiting driver authorization: ${names}. ${showHint}`;
  }
  if (quorum && Array.isArray(quorum.missing) && quorum.missing.length > 0) {
    return `Cell "${cellId}" (session "${coordinationId}") is still waiting on: ${quorum.missing.join(', ')}. ${showHint}`;
  }
  return `Cell "${cellId}" (session "${coordinationId}") is open with no declared operation awaiting authorization and no missing actor. ${showHint}`;
}

// One rendered cell record: cell id (parsed from the session id after the
// `<track>--` prefix), status, phase, last disposition (if any),
// pendingDriverAuthorizations, and its Assignment ids -- everything a
// stranger needs to understand one cell's own status without opening its
// session by hand.
//
// Fault-isolated per cell: a broken/corrupt/unreadable session -- ANY
// cause, not specifically `--cwd` (Phase 01 R8, store.mjs's
// `resolveCoordinationPaths`, fixed session/read storage to always be
// governed by `repoRoot`, never raw `cwd`, so `--cwd` alone can no longer
// diverge a session's storage/read location the way this comment used to
// assume) -- must never take down every OTHER cell's own render. On a read failure
// this returns a degraded record carrying `renderError` (which read step
// failed, plus the error message) instead of throwing -- the caller
// excludes it from `activeCell`/`nextAction` computation (no `status`
// field means it never matches `ACTIVE_STATUS`) but keeps it listed.
function renderCell(track, sessionId, ctx, engineOpts) {
  const cellId = sessionId.slice(trackPrefix(track).length);
  let manifest;
  try {
    manifest = readManifest(sessionId, engineOpts);
  } catch (err) {
    return { cellId, sessionId, renderError: { step: 'readManifest', message: err.message } };
  }
  let show;
  try {
    show = showCoordinationUseCase(ctx, { id: sessionId });
  } catch (err) {
    return { cellId, sessionId, createdAt: manifest.createdAt, renderError: { step: 'showCoordinationUseCase', message: err.message } };
  }
  const dispositions = Array.isArray(show.dispositions) ? show.dispositions : [];
  return {
    cellId,
    sessionId,
    createdAt: manifest.createdAt,
    status: show.status,
    phase: show.phase,
    lastDisposition: dispositions.length > 0 ? dispositions[dispositions.length - 1] : null,
    pendingDriverAuthorizations: show.pendingDriverAuthorizations,
    assignmentRefs: show.assignmentRefs,
    quorum: show.quorum,
  };
}

/**
 * @param {object} ctx `{cwd, repoRoot, packageRoot?}`
 * @param {object} options `{track}`
 * @returns {object} The `fgos.v1` data payload: `{track, cells, activeCell,
 *   nextAction}` -- `cells` sorted by creation order
 *   (`manifest.createdAt`, never filesystem birthtime), `activeCell` the
 *   cell id of the most-recently-created session still `active` (or
 *   `null` if none -- a track that has not opened its first cell yet is a
 *   legitimate state, not an error), `nextAction` a plain-text hint for
 *   that active cell (or `null` when there is none). A cell whose own
 *   session read failed renders as `{cellId, sessionId, renderError:
 *   {step, message}}` (no `status`, so it is never picked as `activeCell`)
 *   instead of throwing out of the whole call -- every other cell in the
 *   track still renders normally.
 */
export function chainCoordinationUseCase(ctx, { track }) {
  if (typeof track !== 'string' || track.trim() === '') {
    throw new TypeError('chainCoordinationUseCase: "track" is required and must be a non-empty string');
  }
  const engineOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };
  const sessionIds = listMatchingSessionIds(track, engineOpts);

  const cells = sessionIds
    .map((sessionId) => renderCell(track, sessionId, ctx, engineOpts))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));

  const activeCells = cells.filter((cell) => cell.status === ACTIVE_STATUS);
  const activeCellRecord = activeCells.length > 0 ? activeCells[activeCells.length - 1] : null;

  let nextAction = null;
  if (activeCellRecord !== null) {
    const activeShow = showCoordinationUseCase(ctx, { id: activeCellRecord.sessionId });
    nextAction = describeNextActionForCell(activeCellRecord.cellId, activeShow);
  }

  return {
    track,
    cells,
    activeCell: activeCellRecord !== null ? activeCellRecord.cellId : null,
    nextAction,
  };
}
