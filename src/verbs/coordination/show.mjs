// show.mjs — the use-case behind `fgos coordination show <id> --json`
// (R1). Read-only, by construction: every function it calls
// (readManifest, readSessionEvents, evaluateSessionQuorum,
// deriveSessionPhase, replaySession) is one of session-engine.mjs/
// store.mjs/replay.mjs's own pure-read exports -- none of them ever
// appends an event, writes session.json, or touches an Assignment/Run/
// RunResult. There is no mutation/external-effect code path in this
// module at all (R1's own "show is read-only" requirement, and this
// cell's bug taxonomy: "a show command with any mutation/external-effect
// side path").
//
// Step 09 Phase 02 R5 (MVP4): render the disposition/recheck/
// authorization state `replaySession` already reconstructs (P00.1.md Gap
// #18) instead of only `eventCount`/`assignmentRefs`. Two constraints
// from `thin-launcher-surface-readiness.md`'s "What a launcher would
// still be missing" #3, both still true and both honored below:
//   - recheck lineage in `replaySession`'s shape is artifact-revision-
//     scoped/best-effort, not a guaranteed original->recheck edge -- this
//     module does not attempt to join/render one.
//   - a disposition's targetRef/evidenceRefs carry no session-scope check
//     in `replaySession` itself, and a post-terminal disposition reads
//     indistinguishably from a legitimate one. `isRefOwnedBySession`
//     below is a boolean-returning, byte-for-byte mirror of store.mjs's
//     own (unexported, write-time) `assertDispositionRefOwnedBySession` --
//     duplicated rather than imported because store.mjs sits below this
//     module in the import graph and is on this cell's Do Not Touch list;
//     the SAME segment/asgn_-prefix logic is reused, not reinvented, so
//     this stays a mirror rather than a second, divergent policy.
// `postTerminal` marking mirrors the SAME "neutralize, don't hide"
// posture replay.mjs already applies to authorizations
// (`ignoredAuthorizations`) -- replay.mjs does not apply it to
// dispositions itself (P00.1.md Gap #9), so this module computes it here
// by walking the same raw event log replaySession already returns.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { evaluateSessionQuorum, deriveSessionPhase } from '../../runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents, resolveSessionPaths } from '../../runner/coordination/store.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';

// Same four terminal event kinds `replay.mjs`'s own (unexported)
// `TERMINAL_EVENT_TYPES` uses (`transitionSessionStatus`'s TERMINAL_EVENT_TYPE
// table, store.mjs) -- mirrored here, not imported, for the same
// Do-Not-Touch/no-export reason documented above.
const TERMINAL_EVENT_TYPES = new Set(['session-completed', 'session-partial', 'session-failed', 'session-cancelled']);

// Byte-for-byte mirror of store.mjs's private `assertDispositionRefOwnedBySession`,
// as a boolean check instead of a throw: a render-time gate must not take
// down the whole `show` command over one bad ref, it must mark it.
function isRefOwnedBySession(ref, { coordinationId, assignmentRefs, fgosDir }) {
  if (typeof ref !== 'string') return false;
  for (const segment of ref.split(/[\\/]/).filter(Boolean)) {
    if (segment !== coordinationId && fs.existsSync(path.join(fgosDir, 'coordination', 'sessions', segment, 'session.json'))) {
      return false;
    }
    if (/^asgn_/.test(segment)) {
      const exists = fs.existsSync(path.join(fgosDir, 'assignments', segment, 'assignment.json'));
      if (exists && !assignmentRefs.includes(segment)) return false;
    }
  }
  return true;
}

// Every `activation.mode: driver-authorized` binding declared on the
// FlowDefinition's graph -- read directly off the validated document
// (never re-derived/guessed), matching the exact shape
// `standalone-master-coordination-loop.yaml`'s own graph.nodes[].operations[]
// uses (`ref`/`actor`/`activation`).
function collectDriverAuthorizedBindings(definition) {
  const bindings = [];
  for (const node of definition?.spec?.graph?.nodes ?? []) {
    for (const op of node.operations ?? []) {
      if (op?.activation?.mode === 'driver-authorized') {
        bindings.push({ nodeId: node.id, operationId: op.ref, actorId: op.actor });
      }
    }
  }
  return bindings;
}

// Phase 07 (MVP7): one validated cognitive aggregation, rendered whole.
//
// Every field the `aggregation-validated` event can carry is present on the
// rendered record, always. An optional list the event omitted renders as `[]`
// and an optional scalar as `null` -- never dropped from the object -- so a
// reader can never mistake "this aggregation named no dissent" for "dissent
// exists but `show` does not surface it". That distinction is the whole point
// of an evidence-preserving method: the gaps are the record.
function renderAggregation(record) {
  return {
    aggregationId: record.aggregationId,
    method: record.method,
    outcome: record.outcome,
    // Sources, and the immutability pin each one was validated against.
    sourceResultRefs: [...record.sourceResultRefs],
    artifactRevisionRefs: [...(record.artifactRevisionRefs ?? [])],
    // Dissent and unresolved contributions.
    dissentRefs: [...(record.dissentRefs ?? [])],
    unresolvedContributionRefs: [...(record.unresolvedContributionRefs ?? [])],
    // Failures and omissions: who never answered, who failed, and which
    // declared source operation had no binding to answer it at all.
    missingActors: [...(record.missingActors ?? [])],
    failedActors: [...(record.failedActors ?? [])],
    unboundSourceOperationRefs: [...(record.unboundSourceOperationRefs ?? [])],
    // The aggregate's own output.
    assignmentId: record.assignmentId ?? null,
    runId: record.runId ?? null,
    outputArtifactRef: record.outputArtifactRef ?? null,
    validatedBy: record.validatedBy,
    ts: record.ts,
  };
}

/**
 * @param {object} ctx `{cwd, repoRoot, packageRoot?}`
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

  // `replaySession` re-validates the whole event log (duplicate/dangling/
  // foreign/out-of-order refs) and can throw on a genuinely inconsistent
  // session -- deliberately NOT let that break `show` wholesale (the
  // manifest/quorum/phase view above already worked before this cell and
  // must keep working): caught and degraded to `null` new-state fields
  // plus a reported `coordinationStateError`, never silently swallowed.
  let coordinationState = null;
  let coordinationStateError = null;
  try {
    coordinationState = replaySession(id, engineOpts);
  } catch (err) {
    coordinationStateError = err instanceof Error ? err.message : String(err);
  }

  let authorizations = null;
  let ignoredAuthorizations = null;
  let dispositions = null;
  let pendingDriverAuthorizations = null;
  let aggregations = null;
  let ignoredAggregations = null;

  if (coordinationState) {
    authorizations = coordinationState.authorizations.map((a) => ({
      authorizationId: a.authorizationId,
      operationId: a.operationId,
      nodeId: a.nodeId,
      targetActorId: a.targetActorId,
      consumed: a.consumedByAssignmentId !== null,
    }));
    // Neutralized (post-terminal) authorizations, per replay.mjs's own
    // "excluded from `authorizations`, reported separately" posture --
    // passed through as-is rather than hidden, so a driver can see why an
    // authorization they issued never dispatched anything.
    ignoredAuthorizations = coordinationState.ignoredAuthorizations.map((a) => ({
      authorizationId: a.authorizationId,
      operationId: a.operationId,
      nodeId: a.nodeId,
      targetActorId: a.targetActorId,
    }));

    // Post-terminal aggregations are reported separately rather than hidden,
    // the SAME "neutralize, don't hide" posture replay.mjs already applies to
    // authorizations: a driver must be able to see that an aggregation they
    // validated arrived after the session had already closed, and therefore
    // informed nothing.
    aggregations = coordinationState.aggregations.map(renderAggregation);
    ignoredAggregations = coordinationState.ignoredAggregations.map(renderAggregation);

    const { fgosDir } = resolveSessionPaths(id, engineOpts);
    const refOwnedOpts = { coordinationId: id, assignmentRefs: coordinationState.assignmentRefs, fgosDir };
    let terminalSeen = false;
    dispositions = [];
    for (const event of coordinationState.events) {
      if (TERMINAL_EVENT_TYPES.has(event.type)) {
        terminalSeen = true;
      } else if (event.type === 'driver-disposition-recorded') {
        dispositions.push({
          targetRef: event.payload.targetRef,
          disposition: event.payload.disposition,
          rationale: event.payload.rationale,
          evidenceRefs: [...event.payload.evidenceRefs],
          ts: event.ts,
          // Marked, not hidden (this cell's Bug Taxonomy): a post-terminal
          // disposition is a real, on-disk record replay does not reject,
          // but it is not authoritative -- the session had already closed.
          postTerminal: terminalSeen,
          targetRefOwnedBySession: isRefOwnedBySession(event.payload.targetRef, refOwnedOpts),
          evidenceRefsOwnedBySession: event.payload.evidenceRefs.map((ref) => isRefOwnedBySession(ref, refOwnedOpts)),
        });
      }
    }

    // Only meaningful for a declared-protocol session (`definitionRef`
    // null on an agent-led session, per session-engine.mjs's own guard) --
    // left `null` rather than `[]` so a caller can distinguish "no
    // FlowDefinition to check" from "checked, nothing pending".
    if (manifest.definitionRef) {
      try {
        const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
        const declaredBindings = collectDriverAuthorizedBindings(definition);
        const authorizedKeys = new Set(authorizations.map((a) => `${a.nodeId}::${a.operationId}`));
        pendingDriverAuthorizations = declaredBindings.filter((b) => !authorizedKeys.has(`${b.nodeId}::${b.operationId}`));
      } catch {
        // Definition file removed/renamed since the session opened, or
        // registered at a different version -- degrade this one field
        // rather than crash the rest of `show`.
        pendingDriverAuthorizations = null;
      }
    }
  }

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
    authorizations,
    ignoredAuthorizations,
    dispositions,
    pendingDriverAuthorizations,
    aggregations,
    ignoredAggregations,
    ...(coordinationStateError !== null ? { coordinationStateError } : {}),
  };
}
