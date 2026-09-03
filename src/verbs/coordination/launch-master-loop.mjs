// launch-master-loop.mjs -- MVP4 (Step 09, Phase 02) R1-R4 thin surface
// launcher for the shipped `standalone-master-coordination-loop` fixture.
//
// This module is a request COMPOSER, never a second dispatch path: the one
// and only place it reaches the runtime is the single `runCoordinationUseCase`
// call in `launchMasterLoopUseCase` below -- the SAME door `fgos coordination
// run --file`/the headless adapter already call (`run.mjs`'s own header
// comment: "the ONLY place a coordination request is turned into engine
// calls"). This module never imports session-engine.mjs/store.mjs/schema.mjs
// (runner-side) directly, and never opens a session, dispatches, authorizes,
// or dispositions on its own.
//
// R2's "no hidden actor/operation choice": the composed request carries
// ONLY the fixture's three `required` first-pass operations (produce-
// candidate / review-candidate / red-team-candidate) -- never an authorize/
// disposition/revise/recheck step. Those three optional bindings are all
// `activation: {mode: driver-authorized}` (confirmed in
// core/coordination-protocols/standalone-master-coordination-loop.yaml and
// frozen in P00.1.md Sec.3); deciding to authorize one is a driver decision
// a person makes after reading this run's own evidence, never something
// this mechanical composer infers or defaults. A follow-up request (hand-
// authored today; see docs/architect/agent-coordination/verification/
// step-09-group-thinking-mvp1-mvp2/thin-launcher-surface-readiness.md's
// "No resume door" gap) is required to reach the revision/recheck phase.
//
// `targetActorId` is deliberately omitted on every step: this fixture binds
// exactly one actor per role at these graph positions, so the engine's own
// `resolveDeclaredOperationActor` (session-engine.mjs) resolves it from the
// declared FlowDefinition -- reading declared content, not choosing it.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';
import { runCoordinationUseCase } from './run.mjs';

export const MASTER_LOOP_PROTOCOL_ID = 'core.coordination-protocol.standalone-master-coordination-loop';

// Descriptive only (fulfills schema.mjs's non-empty expectedOutputs
// requirement) -- never read as an actor/operation choice.
const EXPECTED_OUTPUTS = ['agent-result.json (status, summary)'];

function fail(reason) {
  throw new StoreError('validation', `coordination launch-master-loop: ${reason}`);
}

// The one genuinely launcher-specific check schema.mjs cannot cover (it
// never touches the filesystem): the plan/artifact path must exist on disk
// before a request referencing it is even composed.
function assertPlanPathExists(planPath, cwd) {
  if (typeof planPath !== 'string' || planPath.trim() === '') {
    fail('"planPath" is required and must be a non-empty string');
  }
  const resolved = path.resolve(cwd, planPath);
  if (!fs.existsSync(resolved)) {
    fail(`plan/artifact path "${planPath}" does not exist (resolved to "${resolved}")`);
  }
  return resolved;
}

// The other genuinely launcher-specific check: `protocolRef` (schema.mjs)
// carries only `id`, no version field at all, so nothing downstream ever
// compares a caller's expected fixture version against what is actually
// registered. Optional: when the caller does not name a version, this is a
// no-op and the launcher trusts whatever is registered, same posture
// `run.mjs` already has for every other request.
function assertFixtureVersionMatches(ctx, expectedFixtureVersion) {
  if (expectedFixtureVersion === undefined) return;
  let definition;
  try {
    definition = loadCoordinationProtocol(MASTER_LOOP_PROTOCOL_ID, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
  } catch (err) {
    fail(`fixture "${MASTER_LOOP_PROTOCOL_ID}" could not be loaded to verify --fixture-version ("${expectedFixtureVersion}"): ${err.message}`);
  }
  if (definition.metadata.version !== expectedFixtureVersion) {
    fail(
      `fixture "${MASTER_LOOP_PROTOCOL_ID}" is registered at version "${definition.metadata.version}", not the expected "${expectedFixtureVersion}" -- refusing a mismatched fixture version`,
    );
  }
}

/**
 * Compose (never dispatch) a `kind: "declared-protocol"` request targeting
 * `standalone-master-coordination-loop`'s required first pass only. Every
 * other field this function does not explicitly set (Work lifecycle keys,
 * `primaryRole`/`task`, `actors[].role`, a second `authorizedBy` identity,
 * etc.) simply never appears in the object it returns -- there is no
 * passthrough/spread of caller-supplied JSON anywhere in this function, so
 * there is no channel for a caller to smuggle one in through this surface.
 * The returned object is still re-validated end to end by
 * `validateCoordinationRequest` inside `runCoordinationUseCase` exactly like
 * any hand-authored request file -- this function narrows what CAN be
 * expressed, it does not replace that validation.
 *
 * @param {{cwd: string, packageRoot?: string}} ctx
 * @param {object} params
 * @param {string} params.planPath Plan/artifact path (resolved against `ctx.cwd`); must exist on disk.
 * @param {string} params.objective Session objective; also folded into the produce step's own objective text (the only field a raw filesystem path can safely travel in -- `contextRefs` entries must satisfy `schema.mjs`'s safe-id/`$ref:` charset, which an arbitrary path does not).
 * @param {string} params.writerId Trusted driver/operator identity.
 * @param {string} [params.coordinationId] Explicit session id; omitted lets `openSession` auto-generate one.
 * @param {object} [params.aggregateBounds] Forwarded verbatim to the request; validated by `schema.mjs`.
 * @param {string[]} [params.contextRefs] Extra context refs granted to the produce step alongside the plan-path-derived objective text; validated by `schema.mjs`'s existing safe-ref check (this is what makes a forbidden context ref, e.g. a raw path, fail actionably).
 * @param {string} [params.expectedFixtureVersion] If given, must match the registered fixture's `metadata.version` or this call fails before composing anything.
 * @returns {object} A raw request object, not yet passed through `validateCoordinationRequest`.
 */
export function buildMasterLoopRequest(ctx, params = {}) {
  const { planPath, objective, writerId, coordinationId, aggregateBounds, contextRefs = [], expectedFixtureVersion } = params;
  const resolvedPlanPath = assertPlanPathExists(planPath, ctx.cwd);
  assertFixtureVersionMatches(ctx, expectedFixtureVersion);

  const planDescriptor = path.relative(ctx.cwd, resolvedPlanPath) || resolvedPlanPath;
  const produceObjective = `${objective}\n\nSource plan/artifact: ${planDescriptor}`;

  return {
    kind: 'declared-protocol',
    objective,
    writerId,
    ...(coordinationId !== undefined ? { coordinationId } : {}),
    ...(aggregateBounds !== undefined ? { aggregateBounds } : {}),
    protocolRef: { id: MASTER_LOOP_PROTOCOL_ID },
    steps: [
      {
        type: 'operation',
        as: 'produce',
        operationId: 'produce-candidate',
        objective: produceObjective,
        expectedOutputs: EXPECTED_OUTPUTS,
        contextRefs,
      },
      {
        type: 'operation',
        as: 'review',
        operationId: 'review-candidate',
        objective: `Review the candidate produced from ${planDescriptor}.`,
        expectedOutputs: EXPECTED_OUTPUTS,
        contextRefs: ['$ref:produce'],
      },
      {
        type: 'operation',
        as: 'red-team',
        operationId: 'red-team-candidate',
        objective: `Red-team the candidate produced from ${planDescriptor}.`,
        expectedOutputs: EXPECTED_OUTPUTS,
        contextRefs: ['$ref:produce'],
      },
    ],
  };
}

/**
 * Compose, then run, through the ONE existing runtime door (R2). Never
 * opens a session, dispatches, authorizes, or dispositions itself -- it
 * only builds a request object and hands it to `runCoordinationUseCase`,
 * identical in shape to what `fgos coordination run --file` would accept
 * from a hand-authored file.
 *
 * @param {object} ctx Same shape `runCoordinationUseCase` takes: `{cwd, repoRoot, runnerConfig?, timeoutMs?, packageRoot?}`.
 * @param {object} params `buildMasterLoopRequest`'s own params, plus optional `cliExecutor`/`cliModel`/`cliTier` trusted global policy (forwarded verbatim, same as `fgos coordination run`'s own `--executor`/`--model`/`--tier`).
 * @returns {Promise<object>} The `fgos.v1` data payload `runCoordinationUseCase` returns.
 */
export async function launchMasterLoopUseCase(ctx, params = {}) {
  const { cliExecutor, cliModel, cliTier, ...requestParams } = params;
  const requestObject = buildMasterLoopRequest(ctx, requestParams);
  return runCoordinationUseCase(ctx, { requestObject, cliExecutor, cliModel, cliTier });
}
