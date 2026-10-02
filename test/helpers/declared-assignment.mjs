// test/helpers/declared-assignment.mjs — stands in for the Work layer when a test builds a
// declared Assignment. Dispatch's `buildAssignment` is handed the domain and the legal
// operations of the step by its caller; in production the caller is the Work layer
// (src/runner/operation-choice.mjs) reading them from the item's Workflow. A test that
// wants a declared Assignment for `stage`/`operation` resolves them the same way, from the
// real Workflow definition, so what it builds is what production would build.

import { buildAssignment as buildAssignmentCore } from '../../src/runner/dispatch/assignment.mjs';
import { getDomain, operationsForStep, resolveDomainName } from '../../src/state/domain-registry.mjs';

export function buildAssignment(params = {}) {
  if (params?.provenance?.kind === 'inline') return buildAssignmentCore(params);
  const domain = params.domain ?? resolveDomainName(params.work?.domain, { onUnrecognized: () => {} });
  const operations = params.operations ?? operationsForStep(getDomain(domain, { onUnrecognized: () => {} }), params.stage, params.work?.kind);
  const workflow = params.workflow ?? params.work?.workflow ?? getDomain(domain, { onUnrecognized: () => {} }).defaultWorkflow;
  return buildAssignmentCore({ ...params, domain, operations, workflow });
}
