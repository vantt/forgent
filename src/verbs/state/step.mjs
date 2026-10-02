import path from 'node:path';
import { listWork, editWork, StoreError } from '../../state/store.mjs';
import { resolveDiscovery, classificationPatchFromVerdict, assertCallerClassification } from '../../intake/discovery.mjs';
import { resolvePlan, resolveContentRoot } from '../../intake/plan.mjs';
import { getDomain, stepForPhase, discoverableSteps, domainSteps, effectiveStep, resolveDomainName } from '../../state/domain-registry.mjs';
import { chooseStageOperation, executeDriverOperationChoice } from '../../runner/operation-choice.mjs';

export function discoverUseCase({ dir, runnerConfig }, { id, callerVerdict, role = 'session' }) {
  const work = listWork(dir).work[id];
  const step = work?.workflowStep;
  const discoverDomain = getDomain(work?.domain, { onUnrecognized: () => {} });
  const validSteps = discoverableSteps(discoverDomain, work?.kind);
  if (!validSteps.includes(step)) {
    const planTakesIt = step === stepForPhase(discoverDomain, 'plan', work?.kind);
    throw new StoreError(
      'validation',
      `discover: work "${id}" is at step "${step}", not ${validSteps.map((s) => `"${s}"`).join('/')}`
        + (planTakesIt
          ? ` -- use "fgos plan ${id}" instead.`
          : ` -- and "fgos plan" does not serve that step either. No step verb does:`
            + ` "${step}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
            + ` (${JSON.stringify(domainSteps(discoverDomain, work?.kind))}). Run "fgos doctor" and read the`
            + ' work-step-vocabulary check.'),
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
  const step = work?.workflowStep;
  const domain = getDomain(work?.domain, { onUnrecognized: () => {} });
  const planningStep = stepForPhase(domain, 'plan', work?.kind);
  if (step !== planningStep) {
    const discoverTakesIt = discoverableSteps(domain, work?.kind).includes(step);
    throw new StoreError(
      'validation',
      `plan: work "${id}" is at step "${step}", not "${planningStep}"`
        + (discoverTakesIt
          ? ` -- use "fgos discover ${id}" instead.`
          : ` -- and "fgos discover" does not serve that step either. No step verb does:`
            + ` "${step}" is not registered by domain "${resolveDomainName(work?.domain, { onUnrecognized: () => {} })}"`
            + ` (${JSON.stringify(domainSteps(domain, work?.kind))}). Run "fgos doctor" and read the`
            + ' work-step-vocabulary check.'),
    );
  }
  const choice = chooseStageOperation({
    work,
    stage: step,
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
