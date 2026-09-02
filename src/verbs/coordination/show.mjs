// show.mjs — the use-case behind `fgos coordination show <id> --json`
// (R1). Read-only, by construction: every function it calls
// (readManifest, readSessionEvents, evaluateSessionQuorum,
// deriveSessionPhase) is one of session-engine.mjs/store.mjs's own
// pure-read exports -- none of them ever appends an event, writes
// session.json, or touches an Assignment/Run/RunResult. There is no
// mutation/external-effect code path in this module at all (R1's own
// "show is read-only" requirement, and this cell's bug taxonomy: "a show
// command with any mutation/external-effect side path").
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { evaluateSessionQuorum, deriveSessionPhase } from '../../runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents } from '../../runner/coordination/store.mjs';

/**
 * @param {object} ctx `{cwd, repoRoot}`
 * @param {object} options `{id}`
 * @returns {object} The `fgos.v1` data payload -- a stranger-readable
 *   session status summary (this cell's own acceptance criterion: "show
 *   must let a stranger understand status without chat history").
 */
export function showCoordinationUseCase(ctx, { id }) {
  const engineOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };
  let manifest;
  try {
    manifest = readManifest(id, engineOpts);
  } catch (err) {
    if (err instanceof CoordinationError && err.category === 'not-found') {
      throw new StoreError('validation', `coordination show: no session "${id}" found under .fgos/coordination/sessions/ (${err.message})`);
    }
    // 'corrupt-log'/'schema-version-mismatch' etc. are real, distinct
    // diagnostics (R1's own "missing/corrupt session diagnostics"
    // requirement) -- propagated as-is so `corrupt-log` keeps its own
    // documented exit code (5, src/state/store.mjs's EXIT_CODES) instead
    // of being flattened into a generic validation refusal.
    throw err;
  }
  const events = readSessionEvents(id, engineOpts);
  const quorum = evaluateSessionQuorum(id, engineOpts);
  const phase = deriveSessionPhase(id, engineOpts);

  return {
    coordinationId: manifest.coordinationId,
    status: manifest.status,
    phase,
    objective: manifest.objective,
    definitionRef: manifest.definitionRef,
    workRef: manifest.workRef,
    createdAt: manifest.createdAt,
    completedAt: manifest.completedAt,
    provenanceRoot: manifest.provenanceRoot,
    actors: manifest.actors ?? [],
    assignmentRefs: manifest.assignmentRefs,
    aggregateBounds: manifest.aggregateBounds,
    partialPolicy: manifest.partialPolicy ?? null,
    quorum,
    eventCount: events.length,
  };
}
