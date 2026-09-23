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
//     below is a boolean-returning, rule-for-rule mirror of store.mjs's
//     own (unexported, write-time) `assertDispositionRefOwnedBySession` --
//     duplicated rather than imported because store.mjs sits below this
//     module in the import graph and is on this cell's Do Not Touch list;
//     the SAME segment/asgn_-prefix logic is reused, not reinvented, so
//     this stays a mirror rather than a second, divergent policy. Every
//     rule the write door gains has to be mirrored here in the same
//     commit, or the two silently disagree about a ref shape only one of
//     them recognizes (MVP8's `contribution:` namespace and Phase 03.1's
//     `human-turn:` namespace are two such).
// `postTerminal` marking mirrors the SAME "neutralize, don't hide"
// posture replay.mjs already applies to authorizations
// (`ignoredAuthorizations`) -- replay.mjs does not apply it to
// dispositions itself (P00.1.md Gap #9), so this module computes it here
// by walking the same raw event log replaySession already returns.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError, CONTRIBUTION_REF_PREFIX, HUMAN_TURN_REF_PREFIX, SCHEMA_VERSION_3 } from '../../runner/coordination/schema.mjs';
import { evaluateSessionQuorum, deriveSessionPhase } from '../../runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents, resolveSessionPaths } from '../../runner/coordination/store.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';
import { loadDefinitionForSession } from '../../runner/coordination/session-engine.mjs';
import {
  getAuthoritativeSettledAssignmentIds,
  computeDagSharedCwdCaveats,
} from '../../runner/coordination/dag-declaration.mjs';
import { resolveNodeCwd } from './dag-scheduler.mjs';
import { interpretRunResult } from '../../runner/dispatch/run-result.mjs';
import { evaluateDriverAuthorizedBindings } from '../../runner/coordination/legality-facts.mjs';

// Same four terminal event kinds `replay.mjs`'s own (unexported)
// `TERMINAL_EVENT_TYPES` uses (`transitionSessionStatus`'s TERMINAL_EVENT_TYPE
// table, store.mjs) -- mirrored here, not imported, for the same
// Do-Not-Touch/no-export reason documented above.
const TERMINAL_EVENT_TYPES = new Set(['session-completed', 'session-partial', 'session-failed', 'session-cancelled']);

// Rule-for-rule mirror of store.mjs's private `assertDispositionRefOwnedBySession`,
// as a boolean check instead of a throw: a render-time gate must not take
// down the whole `show` command over one bad ref, it must mark it.
function isRefOwnedBySession(ref, { coordinationId, assignmentRefs, fgosDir, contributionIds = new Set(), humanTurnIds = new Set() }) {
  if (typeof ref !== 'string') return false;
  // Phase 08 (MVP8): a ref in the reserved `contribution:` namespace names a
  // deliberation contribution, which has no `.fgos/` directory for the segment
  // scan below to resolve. It is owned iff THIS session's own log linked it --
  // the same question the write door asks, mirrored here so the two cannot
  // disagree about a ref shape only one of them recognizes.
  if (ref.startsWith(CONTRIBUTION_REF_PREFIX)) {
    return contributionIds.has(ref.slice(CONTRIBUTION_REF_PREFIX.length));
  }
  // Phase 03.1: the SAME mirror obligation, for the `human-turn:` namespace
  // store.mjs's `assertDispositionRefOwnedBySession` added -- owned iff THIS
  // session's own log recorded the turn.
  if (ref.startsWith(HUMAN_TURN_REF_PREFIX)) {
    return humanTurnIds.has(ref.slice(HUMAN_TURN_REF_PREFIX.length));
  }
  // A BARE id of one of this session's own contributions targets nothing; the
  // write door refuses that near-miss outright, so the mirror must not render
  // it as an owned ref.
  if (contributionIds.has(ref)) return false;
  // Same near-miss discipline, for a bare human turn id.
  if (humanTurnIds.has(ref)) return false;
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
// uses (`ref`/`actor`/`activation`) -- now evaluated via shared legality-facts.mjs.

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

// Phase 09 (MVP9): render one `specialist-authorized` record -- the same
// shape `replaySession`'s own `specialistAuthorizations`/
// `ignoredSpecialistAuthorizations` entries carry, so a caller of `show`
// never has to reconstruct it from raw events.
function renderSpecialistAuthorization(record) {
  return {
    specialistAuthorizationId: record.specialistAuthorizationId,
    slotId: record.slotId,
    specialistActorId: record.specialistActorId,
    role: record.role,
    capabilities: [...record.capabilities],
    reason: record.reason,
    triggerEvidenceRefs: [...record.triggerEvidenceRefs],
    allowedContextRefs: [...record.allowedContextRefs],
    maxAssignments: record.maxAssignments,
    expiresAfterRound: record.expiresAfterRound,
    authorizedBy: record.authorizedBy,
    ts: record.ts,
  };
}

// Phase 03.1 (Architecture Advisory Panel track): render one
// `human-turn-recorded` record -- the "person-attributed turns" section.
// Rendered as its OWN labelled section, never merged into `dispositions` or
// any other driver-authored list: a human turn is transcribed BY the driver
// but ATTRIBUTED TO a person, which is a distinct provenance shape from
// every other event this module renders.
function renderHumanTurn(record) {
  return {
    turnId: record.turnId,
    turnOrdinal: record.turnOrdinal,
    channel: record.channel,
    artifactRef: record.artifactRef,
    revision: record.revision,
    externalRef: record.externalRef,
    attributedTo: record.attributedTo,
    recordedBy: record.recordedBy,
    respondsToRefs: [...(record.respondsToRefs ?? [])],
    ts: record.ts,
  };
}

function readJsonObjectFile(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new CoordinationError(
      'corrupt-log',
      `coordination show: ${label} at ${filePath} is truncated or malformed (${err.message})`,
    );
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CoordinationError(
      'corrupt-log',
      `coordination show: ${label} at ${filePath} is truncated or malformed (not a JSON object)`,
    );
  }
  return parsed;
}

function readRunResultForAssignment(fgosDir, assignmentId, runId) {
  if (!assignmentId || !runId) return null;
  const prefix = `run_${assignmentId}_`;
  const attemptStr = runId.startsWith(prefix) ? runId.slice(prefix.length) : '01';
  const runsDir = path.join(fgosDir, 'assignments', assignmentId, 'runs', attemptStr);
  const resultPath = path.join(runsDir, 'result.json');
  if (fs.existsSync(resultPath)) {
    const parsed = readJsonObjectFile(resultPath, `RunResult "${runId}"`);
    return interpretRunResult(parsed);
  }
  return null;
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
      throw new CoordinationError('not-found', `coordination show: no session "${id}" found under .fgos/coordination/sessions/ (${err.message})`);
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
  let specialistAuthorizations = null;
  let ignoredSpecialistAuthorizations = null;
  let humanTurns = null;
  let ignoredHumanTurns = null;

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

    // Phase 09 (MVP9): specialist-slot bindings, rendered the same way
    // authorizations are -- a driver must be able to see WHO is currently
    // bound to a slot and why a post-terminal authorization never took
    // effect, without opening events.jsonl by hand.
    specialistAuthorizations = coordinationState.specialistAuthorizations.map(renderSpecialistAuthorization);
    ignoredSpecialistAuthorizations = coordinationState.ignoredSpecialistAuthorizations.map(renderSpecialistAuthorization);

    // Phase 03.1: person-attributed turns, rendered the same way
    // authorizations/specialist authorizations are -- a driver must be able
    // to see who a recorded turn is attributed to and why a post-terminal
    // one never informed the session, without opening events.jsonl by hand.
    humanTurns = coordinationState.humanTurns.map(renderHumanTurn);
    ignoredHumanTurns = coordinationState.ignoredHumanTurns.map(renderHumanTurn);

    const { fgosDir } = resolveSessionPaths(id, engineOpts);
    const refOwnedOpts = {
      coordinationId: id,
      assignmentRefs: coordinationState.assignmentRefs,
      fgosDir,
      // Only the contributions/turns replay ACCEPTED count -- a post-terminal
      // one (`ignoredContributions`/`ignoredHumanTurns`) informed nothing and
      // owns no ref.
      contributionIds: new Set(coordinationState.contributions.map((record) => record.contributionId)),
      humanTurnIds: new Set(coordinationState.humanTurns.map((record) => record.turnId)),
    };
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
        const definition = loadDefinitionForSession(manifest, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
        const { pending } = evaluateDriverAuthorizedBindings(definition, authorizations);
        pendingDriverAuthorizations = pending;
      } catch (err) {
        if (err.category === 'corrupt-log') throw err;
        // Definition file removed/renamed since the session opened, or
        // registered at a different version -- degrade this one field
        // rather than crash the rest of `show`.
        pendingDriverAuthorizations = null;
      }
    }
  }

  const isDag = manifest.schemaVersion === SCHEMA_VERSION_3 && Boolean(coordinationState?.dag?.declaration);
  const schemaMode = isDag ? 'dag' : 'legacy-non-dag';

  let dag = null;
  let actionHint = manifest.status === 'active' ? `Session "${id}" is active.` : `Session "${id}" is ${manifest.status}.`;

  if (coordinationState) {
    const { fgosDir } = resolveSessionPaths(id, engineOpts);
    if (isDag && coordinationState.dag?.declaration) {
      const declaration = coordinationState.dag.declaration;
      const declaredNodes = declaration.nodes ?? [];

      const nodeCwds = new Map();
      for (const node of declaredNodes) {
        const nodeAssignments = coordinationState.assignments.filter((a) => a.dagNodeId === node.id);
        nodeCwds.set(node.id, resolveNodeCwd(node, nodeAssignments, fgosDir, ctx.cwd ?? engineOpts.cwd));
      }

      const settledAssignmentIds = getAuthoritativeSettledAssignmentIds(coordinationState.events);
      const dagCaveats = computeDagSharedCwdCaveats({
        declaredNodes,
        getNodeCwd: (id) => nodeCwds.get(id),
      });

      const renderedNodes = declaredNodes.map((node) => {
        const nodeAssignments = coordinationState.assignments.filter((a) => a.dagNodeId === node.id);
        const assignmentIds = nodeAssignments.map((a) => a.assignmentId);
        const materialized = assignmentIds.length > 0;
        const settled = nodeAssignments.some((a) => settledAssignmentIds.has(a.assignmentId));

        const dependencies = node.dependsOn.map((depId) => {
          const depAssignments = coordinationState.assignments.filter((a) => a.dagNodeId === depId);
          const depSettled = depAssignments.some((a) => settledAssignmentIds.has(a.assignmentId));
          return { id: depId, settled: depSettled };
        });
        const dependenciesSettled = dependencies.every((d) => d.settled);
        const blockedBy = dependencies.filter((d) => !d.settled).map((d) => d.id);

        const nodeResults = coordinationState.results.filter((r) => assignmentIds.includes(r.assignmentId));
        const latestResult = nodeResults.length > 0 ? nodeResults[nodeResults.length - 1] : null;
        const runResult = latestResult ? readRunResultForAssignment(fgosDir, latestResult.assignmentId, latestResult.runId) : null;
        const runResultStatus = runResult ? (runResult.status ?? (settled ? 'done' : null)) : (settled ? 'done' : null);
        const runResultConfidence = runResult?.confidence ?? null;

        const sharedCwdCaveat = dagCaveats.get(node.id) ?? null;

        const refused = !materialized && manifest.status !== 'active';
        const pending = !materialized && dependenciesSettled && !refused;
        const blocked = !materialized && !dependenciesSettled && !refused;

        let schedulerOutcome;
        if (settled) {
          if (sharedCwdCaveat !== null) {
            schedulerOutcome = 'recheck-required';
          } else {
            schedulerOutcome = 'settled';
          }
        } else if (refused) {
          schedulerOutcome = 'refused';
        } else if (blocked) {
          schedulerOutcome = 'blocked';
        } else if (pending) {
          schedulerOutcome = 'pending';
        } else if (materialized) {
          schedulerOutcome = 'materialized';
        } else {
          schedulerOutcome = 'pending';
        }

        let nodeActionHint;
        if (schedulerOutcome === 'pending') {
          nodeActionHint = 'Ready to execute. Dependencies are settled.';
        } else if (schedulerOutcome === 'blocked') {
          nodeActionHint = `Blocked waiting on dependency: ${blockedBy.join(', ')}.`;
        } else if (schedulerOutcome === 'recheck-required') {
          nodeActionHint = 'Settled with caveat: recheck required before closure.';
        } else if (schedulerOutcome === 'settled') {
          if (runResultStatus === 'failed') {
            nodeActionHint = 'Settled with failure. Dependent operations may proceed with settled failure evidence.';
          } else {
            nodeActionHint = 'Settled cleanly.';
          }
        } else if (schedulerOutcome === 'refused') {
          nodeActionHint = 'Refused because session is terminal.';
        } else if (schedulerOutcome === 'materialized') {
          nodeActionHint = 'Materialized and currently in flight.';
        } else {
          nodeActionHint = 'Declared.';
        }

        return {
          nodeId: node.id,
          displayLabel: node.displayLabel,
          declared: true,
          sessionStatus: manifest.status,
          sessionPhase: phase,
          schedulerOutcome,
          runResultStatus,
          runResultConfidence,
          schemaMode: 'dag',
          dependsOn: [...node.dependsOn],
          dependenciesSettled,
          blockedBy,
          actionHint: nodeActionHint,
          caveated: sharedCwdCaveat !== null,
          sharedCwdCaveat,
          sharedCwdVerdictCaveat: sharedCwdCaveat,
          assignmentIds,
          materialized,
          settled,
          refused,
          pending,
          blocked,
        };
      });

      const counts = {
        settled: renderedNodes.filter((n) => n.schedulerOutcome === 'settled' || n.schedulerOutcome === 'recheck-required').length,
        settledFailed: renderedNodes.filter((n) => (n.schedulerOutcome === 'settled' || n.schedulerOutcome === 'recheck-required') && n.runResultStatus === 'failed').length,
        refused: renderedNodes.filter((n) => n.schedulerOutcome === 'refused').length,
        blocked: renderedNodes.filter((n) => n.schedulerOutcome === 'blocked').length,
        pending: renderedNodes.filter((n) => n.schedulerOutcome === 'pending').length,
        deferred: renderedNodes.filter((n) => n.schedulerOutcome === 'deferred').length,
      };

      dag = {
        kind: 'dag',
        schemaMode: 'dag',
        declaration,
        requestFingerprint: declaration?.requestFingerprint ?? null,
        continuationPolicy: declaration?.continuationPolicy ?? null,
        nodes: renderedNodes,
        counts,
      };

      const pendingLabels = renderedNodes.filter((n) => n.schedulerOutcome === 'pending').map((n) => n.displayLabel || n.nodeId);
      const blockedLabels = renderedNodes.filter((n) => n.schedulerOutcome === 'blocked').map((n) => `${n.displayLabel || n.nodeId} (waiting on ${n.blockedBy.join(', ')})`);
      const caveatedLabels = renderedNodes.filter((n) => n.caveated || n.schedulerOutcome === 'recheck-required').map((n) => n.displayLabel || n.nodeId);
      if (pendingLabels.length > 0) {
        actionHint = `Resume DAG session "${id}": ready node(s) [${pendingLabels.join(', ')}].`;
      } else if (blockedLabels.length > 0) {
        actionHint = `DAG session "${id}": blocked waiting on [${blockedLabels.join(', ')}].`;
      } else if (caveatedLabels.length > 0) {
        actionHint = `DAG session "${id}": caveated node(s) [${caveatedLabels.join(', ')}] require recheck before closure.`;
      } else {
        actionHint = `DAG session "${id}": all ${renderedNodes.length} node(s) settled.`;
      }
    } else {
      dag = {
        kind: 'legacy-non-dag',
        schemaMode: 'legacy-non-dag',
        nodes: [],
      };
    }
  }

  return {
    coordinationId: manifest.coordinationId,
    status: manifest.status,
    sessionStatus: manifest.status,
    phase,
    sessionPhase: phase,
    schemaMode,
    actionHint,
    dag,
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
    specialistAuthorizations,
    ignoredSpecialistAuthorizations,
    humanTurns,
    ignoredHumanTurns,
    ...(coordinationStateError !== null ? { coordinationStateError } : {}),
  };
}
