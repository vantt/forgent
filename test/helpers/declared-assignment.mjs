// test/helpers/declared-assignment.mjs — stands in for the Work layer when a test builds a
// declared Assignment. Dispatch's `buildAssignment` is handed the domain and the legal
// operations of the step by its caller; in production the caller is the Work layer
// (src/runner/operation-choice.mjs) reading them from the item's Workflow. A test that
// wants a declared Assignment for `stage`/`operation` resolves them the same way, from the
// real Workflow definition, so what it builds is what production would build.

import { buildAssignment as buildAssignmentCore } from '../../src/runner/dispatch/assignment.mjs';
import { getDomain, operationsForStep, resolveDomainName } from '../../src/state/domain-registry.mjs';

// A test may hand in the Work item it stands for; like the Work layer, this reads the item's id,
// domain, kind and workflow off it and never passes the item itself to dispatch.
export function buildAssignment(params = {}) {
  if (params?.provenance?.kind === 'inline') return buildAssignmentCore(params);
  const { work: item, ...rest } = params;
  const domain = rest.domain ?? resolveDomainName(item?.domain, { onUnrecognized: () => {} });
  const operations = rest.operations ?? operationsForStep(getDomain(domain, { onUnrecognized: () => {} }), rest.stage, item?.kind);
  const workflow = rest.workflow ?? item?.workflow ?? getDomain(domain, { onUnrecognized: () => {} }).defaultWorkflow;
  const workId = rest.workId ?? item?.id;
  return buildAssignmentCore({ ...rest, ...(workId !== undefined ? { workId } : {}), domain, operations, workflow });
}
