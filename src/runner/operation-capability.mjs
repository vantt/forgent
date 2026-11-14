// Canonical operation -> dispatch capability derivation.
// Leaf module shared by coordination binding and assignment policy resolution.

import { hasCapabilityEntry } from './execution/capability-config.mjs';

/**
 * Derive an operation's canonical dispatch capability.
 * Declared policy wins. Work-product operations require the facade's primary
 * capability. Advisory/gate operations prefer a registered domain review
 * capability and otherwise use the generic review capability.
 *
 * @returns {{name: string, source: string}|{name: null, source: 'unbound'}}
 */
export function deriveOperationCapability(operation, facts = {}, runnerConfig) {
  const declared = operation?.policy?.capability;
  if (declared !== undefined) {
    return { name: declared, source: 'declared' };
  }
  if (operation?.result?.kind === 'work-product') {
    if (facts.primaryCapability) {
      return { name: facts.primaryCapability, source: 'facade-primary' };
    }
    return { name: null, source: 'unbound' };
  }

  const domainCapability = facts.domain ? `${facts.domain}:review` : undefined;
  if (domainCapability && hasCapabilityEntry(runnerConfig, domainCapability)) {
    return { name: domainCapability, source: 'domain-review-fallback' };
  }
  return { name: 'review', source: 'generic-review-fallback' };
}
