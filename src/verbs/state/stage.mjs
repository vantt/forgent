import path from 'node:path';
import { listWork, editWork, StoreError } from '../../state/store.mjs';
import { resolveDiscovery, classificationPatchFromVerdict, assertCallerClassification } from '../../intake/discovery.mjs';
import { resolvePlan, resolveContentRoot } from '../../intake/plan.mjs';
import { getDomain, stageForStep, discoverableStages, resolveDomainName } from '../../state/workflow-stage-graphs.mjs';
import { chooseStageOperation, executeDriverOperationChoice } from '../../runner/dispatch/operation-choice.mjs';

export function discoverUseCase({ dir, runnerConfig }, { id, callerVerdict, role = 'session' }) {
  const work = listWork(dir).work[id];
  const stage = work?.stage;
  const discoverDomain = getDomain(work?.domain, { onUnrecognized: () => {} });
  const validStages = discoverableStages(discoverDomain);
  if (!validStages.includes(stage)) {
    const planStage = stageForStep(discoverDomain, 'Divide');
    const planTakesIt = stage === planStage
      || (stage === 'decompose' && discoverDomain.stages?.includes('decompose'));
    throw new StoreError(
      'validation',
      `discover: work "${id}" is at stage "${stage}", not ${validStages.map((s) => `"${s}"`).join('/')}`
        + (planTakesIt
          ? ` -- use "fgos plan ${id}" instead.`
          : ` -- and "fgos plan" does not serve that stage either. No stage verb does:`
            + ` "${stage}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
            + ` (${JSON.stringify(discoverDomain.stages)}). Run "fgos doctor" and read the`
            + ' work-stage-vocabulary check.'),
    );
  }
  assertCallerClassification(work, callerVerdict);
  const result = resolveDiscovery(dir, id, runnerConfig, role, callerVerdict);
  const classificationPatch = classificationPatchFromVerdict(result.outcome, callerVerdict);
  if (Object.keys(classificationPatch).length === 0) return result;
  editWork(dir, { id, patch: classificationPatch, role });
  return { ...result, classification: classificationPatch };
}

export async function planUseCase({ dir, repoRoot = path.dirname(dir), runnerConfig }, { id, callerVerdict, validate = false, direct = false, role = 'session' }) {
  const work = listWork(dir).work[id];
  const stage = work?.stage;
  const domain = getDomain(work?.domain, { onUnrecognized: () => {} });
  const planningStage = stageForStep(domain, 'Divide');
  const legacyPlanStage = domain.stages?.includes('decompose') && planningStage !== 'decompose' ? 'decompose' : undefined;
  if (stage !== planningStage && stage !== legacyPlanStage) {
    const discoverTakesIt = discoverableStages(domain).includes(stage);
    throw new StoreError(
      'validation',
      `plan: work "${id}" is at stage "${stage}", not "${planningStage}"${legacyPlanStage ? ` (or legacy "${legacyPlanStage}")` : ''}`
        + (discoverTakesIt
          ? ` -- use "fgos discover ${id}" instead.`
          : ` -- and "fgos discover" does not serve that stage either. No stage verb does:`
            + ` "${stage}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
            + ` (${JSON.stringify(domain.stages)}). Run "fgos doctor" and read the`
            + ' work-stage-vocabulary check.'),
    );
  }
  const choice = chooseStageOperation({
    work,
    stage: work.stage,
    domain: domain.name ?? work.domain,
    workflow: work.workflow,
    repoRoot,
  });
  const shouldValidate = !direct && (validate || choice.operation === 'validate-plan' || !callerVerdict);

  let validatedVerdict;
  if (shouldValidate) {
    let validateChoice = choice;
    if (validateChoice.operation !== 'validate-plan') {
      validateChoice = {
        dispatch: 'assignment',
        operation: 'validate-plan',
        taskSpecName: 'validate-plan',
      };
    }
    if (validateChoice.dispatch === 'assignment' && validateChoice.operation === 'validate-plan') {
      const contentRoot = resolveContentRoot(repoRoot, work.id, work.docsRef);
      const outcome = await executeDriverOperationChoice(work, validateChoice, {
        cwd: contentRoot,
        repoRoot,
        runnerConfig,
        work,
      });

      if (!outcome.canAdvanceEdge) {
        if (outcome.nextOperation === 'shape-plan') {
          throw new StoreError('validation', `plan: validation for "${id}" returned NOT READY -- routing back to shape-plan.`);
        }
        throw new StoreError('validation', `plan: validation for "${id}" did not report READY (${outcome.reason}) -- cannot advance Work.`);
      }
      validatedVerdict = outcome.verdictPayload ?? { verdict: 'pass-through', reason: 'Plan validated READY by planning.validate-plan' };
    }
  }

  const finalVerdict = callerVerdict ?? validatedVerdict;
  return resolvePlan(dir, id, runnerConfig, role, finalVerdict);
}
