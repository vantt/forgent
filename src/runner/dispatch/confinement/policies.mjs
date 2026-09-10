// policies.mjs — canonical confinement policy vocabulary, built-ins,
// validation, and legacy normalization (Phase 01 R1-R4, docs/specs/confinement-authority.md §6.1-§6.2).
//
// Spec is the single source of truth for shapes; this module implements:
//   - BUILTIN_POLICIES: immutable definitions for `host-write-denied` and `workspace-write`
//   - validateConfinementPolicyShape: closed schema check for confinement-policy.v1
//   - validateCapabilityConfinementShape: validation for capability-level confinement configs
//   - validateOverrideConfinementShape: checks that invocation overrides only narrow/harden posture
//   - normalizeLegacyConfinement: converts legacy {privateHome, isolatedSession, ownWorktree} to v1 controls

import net from 'node:net';

export class ConfinementPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfinementPolicyError';
  }
}

/**
 * Built-in policy definitions (spec §6.2).
 * Immutable, versioned definitions owned by fgOS.
 */
export const BUILTIN_POLICIES = Object.freeze({
  'host-write-denied': Object.freeze({
    contract: 'confinement-policy.v1',
    controls: Object.freeze({
      hostWrite: 'deny',
      hostRead: 'allow',
      networkEgress: 'allow',
      process: 'host',
      home: 'host',
      session: 'shared',
      workspace: 'shared',
    }),
    grants: Object.freeze([
      Object.freeze({ resource: 'run-output', access: 'write', scope: 'dispatch' }),
      Object.freeze({ resource: 'private-home', access: 'read-write', scope: 'dispatch' }),
      Object.freeze({ resource: 'executor-credentials', access: 'read', scope: 'dispatch' }),
    ]),
  }),
  'workspace-write': Object.freeze({
    contract: 'confinement-policy.v1',
    controls: Object.freeze({
      hostWrite: 'deny',
      hostRead: 'allow',
      networkEgress: 'allow',
      process: 'host',
      home: 'host',
      session: 'shared',
      workspace: 'shared',
    }),
    grants: Object.freeze([
      Object.freeze({ resource: 'run-output', access: 'write', scope: 'dispatch' }),
      Object.freeze({ resource: 'private-home', access: 'read-write', scope: 'dispatch' }),
      Object.freeze({ resource: 'executor-credentials', access: 'read', scope: 'dispatch' }),
      Object.freeze({ resource: 'workspace', access: 'read-write', scope: 'dispatch' }),
      Object.freeze({ resource: 'workspace-git-metadata', access: 'read-write', scope: 'dispatch' }),
    ]),
  }),
});

export const BUILTIN_POLICY_IDS = Object.freeze(Object.keys(BUILTIN_POLICIES));

export const CONFINEMENT_MODES = Object.freeze(['required', 'preferred', 'unconfined']);

export const CONTROL_AXES = Object.freeze({
  hostWrite: Object.freeze(['deny', 'allow']),
  hostRead: Object.freeze(['deny', 'allow']),
  networkEgress: Object.freeze(['deny', 'filtered', 'allow']),
  process: Object.freeze(['isolated', 'host']),
  home: Object.freeze(['private', 'host']),
  session: Object.freeze(['isolated', 'shared']),
  workspace: Object.freeze(['own', 'shared']),
});

/**
 * Control protection strength order (spec §6.1):
 * hostWrite: deny > allow
 * hostRead: deny > allow
 * networkEgress: deny > filtered > allow
 * process: isolated > host
 * home: private > host
 * session: isolated > shared
 * workspace: own > shared
 */
export const CONTROL_ORDER = Object.freeze({
  hostWrite: Object.freeze({ deny: 2, allow: 1 }),
  hostRead: Object.freeze({ deny: 2, allow: 1 }),
  networkEgress: Object.freeze({ deny: 3, filtered: 2, allow: 1 }),
  process: Object.freeze({ isolated: 2, host: 1 }),
  home: Object.freeze({ private: 2, host: 1 }),
  session: Object.freeze({ isolated: 2, shared: 1 }),
  workspace: Object.freeze({ own: 2, shared: 1 }),
});

export const GRANT_ACCESS_LEVELS = Object.freeze({
  'read-write': 3,
  write: 2,
  read: 1,
});

function canonicalizeCidr(value, label) {
  if (typeof value !== 'string' || !value.includes('/')) {
    throw new ConfinementPolicyError(`runner config (${label}) invalid CIDR "${value}".`);
  }
  const parts = value.split('/');
  if (parts.length !== 2) {
    throw new ConfinementPolicyError(`runner config (${label}) invalid CIDR "${value}".`);
  }
  const [ipStr, prefixStr] = parts;
  if (!/^\d+$/.test(prefixStr)) {
    throw new ConfinementPolicyError(`runner config (${label}) invalid CIDR prefix "${prefixStr}".`);
  }
  const prefix = parseInt(prefixStr, 10);

  const octets = ipStr.split('.');
  if (octets.length === 4 && octets.every((o) => /^\d+$/.test(o))) {
    if (prefix < 0 || prefix > 32) {
      throw new ConfinementPolicyError(`runner config (${label}) IPv4 CIDR prefix must be between 0 and 32, got ${prefix}.`);
    }
    const nums = octets.map(Number);
    if (nums.some((n) => n < 0 || n > 255)) {
      throw new ConfinementPolicyError(`runner config (${label}) invalid IPv4 octet in "${value}".`);
    }
    const ip = ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const canonIp = (ip & mask) >>> 0;
    return `${(canonIp >>> 24) & 255}.${(canonIp >>> 16) & 255}.${(canonIp >>> 8) & 255}.${canonIp & 255}/${prefix}`;
  }

  if (net.isIPv6(ipStr)) {
    if (prefix < 0 || prefix > 128) {
      throw new ConfinementPolicyError(`runner config (${label}) IPv6 CIDR prefix must be between 0 and 128, got ${prefix}.`);
    }
    return `${ipStr.toLowerCase()}/${prefix}`;
  }

  throw new ConfinementPolicyError(`runner config (${label}) invalid CIDR "${value}".`);
}

/**
 * Closed schema validation for `NetworkFilterV1` (spec §6.1).
 */
export function validateNetworkFilterShape(filter, label = 'networkFilter') {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new ConfinementPolicyError(`runner config (${label}) must be an object.`);
  }

  const ALLOWED_KEYS = ['defaultAction', 'allow'];
  for (const k of Object.keys(filter)) {
    if (!ALLOWED_KEYS.includes(k)) {
      throw new ConfinementPolicyError(`runner config (${label}) contains unknown key "${k}".`);
    }
  }

  if (filter.defaultAction !== 'deny') {
    throw new ConfinementPolicyError(`runner config (${label}) "defaultAction" must be "deny", got: ${JSON.stringify(filter.defaultAction)}.`);
  }

  if (!Array.isArray(filter.allow)) {
    throw new ConfinementPolicyError(`runner config (${label}) "allow" must be an array of allowlist rules.`);
  }

  const seenRules = new Set();
  filter.allow.forEach((rule, idx) => {
    const ruleLabel = `${label}.allow[${idx}]`;
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}) must be an object.`);
    }

    const ALLOWED_RULE_KEYS = ['protocol', 'destination', 'ports'];
    for (const k of Object.keys(rule)) {
      if (!ALLOWED_RULE_KEYS.includes(k)) {
        throw new ConfinementPolicyError(`runner config (${ruleLabel}) contains unknown key "${k}".`);
      }
    }

    if (rule.protocol !== 'tcp' && rule.protocol !== 'udp') {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}) "protocol" must be "tcp" or "udp", got: ${JSON.stringify(rule.protocol)}.`);
    }

    if (!rule.destination || typeof rule.destination !== 'object' || Array.isArray(rule.destination)) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}) "destination" must be an object.`);
    }

    const ALLOWED_DEST_KEYS = ['kind', 'value'];
    for (const k of Object.keys(rule.destination)) {
      if (!ALLOWED_DEST_KEYS.includes(k)) {
        throw new ConfinementPolicyError(`runner config (${ruleLabel}.destination) contains unknown key "${k}".`);
      }
    }

    if (rule.destination.kind !== 'dns' && rule.destination.kind !== 'cidr') {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}.destination) "kind" must be "dns" or "cidr", got: ${JSON.stringify(rule.destination.kind)}.`);
    }

    if (typeof rule.destination.value !== 'string' || !rule.destination.value.trim()) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}.destination) "value" must be a non-empty string.`);
    }

    // Spec §6.1: DNS is exact normalized name, no wildcards
    if (rule.destination.kind === 'dns' && rule.destination.value.includes('*')) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}.destination) DNS destination "${rule.destination.value}" must not contain wildcard "*".`);
    }

    if (rule.destination.kind === 'cidr') {
      const canonicalVal = canonicalizeCidr(rule.destination.value, `${ruleLabel}.destination`);
      if (Object.isFrozen(rule.destination)) {
        if (rule.destination.value !== canonicalVal) {
          throw new ConfinementPolicyError(`runner config (${ruleLabel}.destination) CIDR must be canonical: got "${rule.destination.value}", expected "${canonicalVal}".`);
        }
      } else {
        rule.destination.value = canonicalVal;
      }
    }

    if (!Array.isArray(rule.ports) || rule.ports.length === 0) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}) "ports" must be a non-empty array of port numbers.`);
    }

    const seenPorts = new Set();
    for (const p of rule.ports) {
      if (!Number.isInteger(p) || p < 1 || p > 65535) {
        throw new ConfinementPolicyError(`runner config (${ruleLabel}) port ${JSON.stringify(p)} must be an integer between 1 and 65535.`);
      }
      if (seenPorts.has(p)) {
        throw new ConfinementPolicyError(`runner config (${ruleLabel}) duplicate port ${p} in allowlist.`);
      }
      seenPorts.add(p);
    }

    const sortedPorts = [...rule.ports].sort((a, b) => a - b);
    const ruleFingerprint = `${rule.protocol}:${rule.destination.kind}:${rule.destination.value}:${sortedPorts.join(',')}`;
    if (seenRules.has(ruleFingerprint)) {
      throw new ConfinementPolicyError(`runner config (${ruleLabel}) duplicate allow rule entry.`);
    }
    seenRules.add(ruleFingerprint);
  });
}

/**
 * Closed schema validation for `ConfinementPolicyV1` (spec §6.1).
 */
export function validateConfinementPolicyShape(policy, label = 'confinement policy') {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new ConfinementPolicyError(`runner config (${label}) must be an object.`);
  }

  const ALLOWED_KEYS = ['contract', 'controls', 'grants', 'networkFilter'];
  for (const k of Object.keys(policy)) {
    if (!ALLOWED_KEYS.includes(k)) {
      throw new ConfinementPolicyError(`runner config (${label}) contains unknown key "${k}". Allowed keys: ${ALLOWED_KEYS.join(', ')}.`);
    }
  }

  if (policy.contract !== 'confinement-policy.v1') {
    throw new ConfinementPolicyError(`runner config (${label}) "contract" must be "confinement-policy.v1", got: ${JSON.stringify(policy.contract)}.`);
  }

  if (!policy.controls || typeof policy.controls !== 'object' || Array.isArray(policy.controls)) {
    throw new ConfinementPolicyError(`runner config (${label}) "controls" must be an object.`);
  }

  const REQUIRED_CONTROLS = Object.keys(CONTROL_AXES);
  for (const k of Object.keys(policy.controls)) {
    if (!REQUIRED_CONTROLS.includes(k)) {
      throw new ConfinementPolicyError(`runner config (${label}.controls) contains unknown control "${k}". Allowed controls: ${REQUIRED_CONTROLS.join(', ')}.`);
    }
  }

  for (const name of REQUIRED_CONTROLS) {
    const val = policy.controls[name];
    if (val === undefined) {
      throw new ConfinementPolicyError(`runner config (${label}.controls) is missing required control "${name}".`);
    }
    const legal = CONTROL_AXES[name];
    if (!legal.includes(val)) {
      throw new ConfinementPolicyError(`runner config (${label}.controls.${name}) must be one of ${legal.join('/')}, got: ${JSON.stringify(val)}.`);
    }
  }

  if (!Array.isArray(policy.grants)) {
    throw new ConfinementPolicyError(`runner config (${label}) "grants" must be an array.`);
  }

  const seenResources = new Set();
  policy.grants.forEach((grant, idx) => {
    const grantLabel = `${label}.grants[${idx}]`;
    if (!grant || typeof grant !== 'object' || Array.isArray(grant)) {
      throw new ConfinementPolicyError(`runner config (${grantLabel}) must be an object.`);
    }

    const ALLOWED_GRANT_KEYS = ['resource', 'access', 'scope'];
    for (const k of Object.keys(grant)) {
      if (!ALLOWED_GRANT_KEYS.includes(k)) {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) contains unknown key "${k}". Allowed keys: ${ALLOWED_GRANT_KEYS.join(', ')}.`);
      }
    }

    if (typeof grant.resource !== 'string' || !grant.resource.trim()) {
      throw new ConfinementPolicyError(`runner config (${grantLabel}) "resource" must be a non-empty string.`);
    }

    if (seenResources.has(grant.resource)) {
      throw new ConfinementPolicyError(`runner config (${grantLabel}) duplicate resource grant for "${grant.resource}".`);
    }
    seenResources.add(grant.resource);

    const LEGAL_ACCESS = Object.keys(GRANT_ACCESS_LEVELS);
    if (!LEGAL_ACCESS.includes(grant.access)) {
      throw new ConfinementPolicyError(`runner config (${grantLabel}) "access" must be one of ${LEGAL_ACCESS.join('/')}, got: ${JSON.stringify(grant.access)}.`);
    }

    if (grant.scope !== 'dispatch') {
      throw new ConfinementPolicyError(`runner config (${grantLabel}) "scope" must be "dispatch", got: ${JSON.stringify(grant.scope)}.`);
    }
  });

  if (policy.controls.networkEgress === 'filtered') {
    if (policy.networkFilter === undefined) {
      throw new ConfinementPolicyError(`runner config (${label}) "networkFilter" is required when networkEgress is "filtered".`);
    }
    validateNetworkFilterShape(policy.networkFilter, `${label}.networkFilter`);
  } else {
    if (policy.networkFilter !== undefined) {
      throw new ConfinementPolicyError(`runner config (${label}) "networkFilter" is only permitted when networkEgress is "filtered".`);
    }
  }
  return policy;
}

/**
 * Shape check for capability-level confinement configuration (spec §6.1).
 */
export function validateCapabilityConfinementShape(confinement, label = 'capability confinement') {
  if (!confinement || typeof confinement !== 'object' || Array.isArray(confinement)) {
    throw new ConfinementPolicyError(`runner config (${label}) must be an object.`);
  }

  const mode = confinement.mode;
  if (!CONFINEMENT_MODES.includes(mode)) {
    throw new ConfinementPolicyError(`runner config (${label}) "mode" must be one of ${CONFINEMENT_MODES.join('/')}, got: ${JSON.stringify(mode)}.`);
  }

  if (mode === 'unconfined') {
    const ALLOWED_KEYS = ['mode', 'allowInvocationOverride'];
    for (const k of Object.keys(confinement)) {
      if (!ALLOWED_KEYS.includes(k)) {
        throw new ConfinementPolicyError(`runner config (${label}) contains disallowed key "${k}" for mode "unconfined".`);
      }
    }
    if (confinement.allowInvocationOverride !== undefined && confinement.allowInvocationOverride !== false) {
      throw new ConfinementPolicyError(`runner config (${label}) "allowInvocationOverride" must be false or omitted when mode is "unconfined".`);
    }
    if (confinement.policy !== undefined) {
      throw new ConfinementPolicyError(`runner config (${label}) "policy" is forbidden when mode is "unconfined".`);
    }
  } else {
    // required or preferred
    const ALLOWED_KEYS = ['mode', 'policy', 'allowInvocationOverride'];
    for (const k of Object.keys(confinement)) {
      if (!ALLOWED_KEYS.includes(k)) {
        throw new ConfinementPolicyError(`runner config (${label}) contains unknown key "${k}".`);
      }
    }
    if (typeof confinement.policy !== 'string' || !confinement.policy.trim()) {
      throw new ConfinementPolicyError(`runner config (${label}) "policy" must be a non-empty string when mode is "${mode}".`);
    }
    if (confinement.allowInvocationOverride !== undefined && typeof confinement.allowInvocationOverride !== 'boolean') {
      throw new ConfinementPolicyError(`runner config (${label}) "allowInvocationOverride" must be a boolean when present.`);
    }
  }
  return confinement;
}

/**
 * Validate an invocation-level confinement override (spec §6.1).
 * Override can only harden posture or narrow grants; downgrades are rejected.
 */
export function validateOverrideConfinementShape(
  override,
  basePolicy = null,
  label = 'invocation confinement override',
  baseMode = 'preferred',
) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    throw new ConfinementPolicyError(`runner config (${label}) must be an object.`);
  }

  const ALLOWED_OVERRIDE_KEYS = ['controls', 'networkFilter', 'grants', 'mode'];
  for (const k of Object.keys(override)) {
    if (!ALLOWED_OVERRIDE_KEYS.includes(k)) {
      throw new ConfinementPolicyError(`runner config (${label}) contains unknown key "${k}".`);
    }
  }

  if (override.mode !== undefined) {
    if (override.mode !== 'required' && override.mode !== 'preferred') {
      throw new ConfinementPolicyError(`runner config (${label}) "mode" override must be "required" or "preferred", got: ${JSON.stringify(override.mode)}.`);
    }
    if (baseMode === 'required' && override.mode === 'preferred') {
      throw new ConfinementPolicyError(`runner config (${label}) cannot downgrade mode from "required" to "preferred".`);
    }
  }

  if (override.controls !== undefined) {
    if (!override.controls || typeof override.controls !== 'object' || Array.isArray(override.controls)) {
      throw new ConfinementPolicyError(`runner config (${label}) "controls" must be an object.`);
    }
    for (const [axis, val] of Object.entries(override.controls)) {
      if (!CONTROL_AXES[axis]) {
        throw new ConfinementPolicyError(`runner config (${label}.controls) unknown control axis "${axis}".`);
      }
      if (!CONTROL_AXES[axis].includes(val)) {
        throw new ConfinementPolicyError(`runner config (${label}.controls.${axis}) must be one of ${CONTROL_AXES[axis].join('/')}, got: ${JSON.stringify(val)}.`);
      }
      if (basePolicy?.controls?.[axis]) {
        const baseRank = CONTROL_ORDER[axis][basePolicy.controls[axis]];
        const overrideRank = CONTROL_ORDER[axis][val];
        if (overrideRank < baseRank) {
          throw new ConfinementPolicyError(
            `runner config (${label}.controls.${axis}) override downgrade: "${val}" is less protective than base policy "${basePolicy.controls[axis]}".`,
          );
        }
      }
    }
  }

  if (override.grants !== undefined) {
    if (!Array.isArray(override.grants)) {
      throw new ConfinementPolicyError(`runner config (${label}) "grants" must be an array.`);
    }
    const baseGrantsByResource = new Map(
      (basePolicy?.grants || []).map((g) => [g.resource, g]),
    );

    const LEGAL_ACCESS = Object.keys(GRANT_ACCESS_LEVELS);
    const seenResources = new Set();

    for (const [idx, grant] of override.grants.entries()) {
      const grantLabel = `${label}.grants[${idx}]`;
      if (!grant || typeof grant !== 'object' || Array.isArray(grant)) {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) must be an object.`);
      }

      const ALLOWED_GRANT_KEYS = ['resource', 'access', 'scope'];
      for (const k of Object.keys(grant)) {
        if (!ALLOWED_GRANT_KEYS.includes(k)) {
          throw new ConfinementPolicyError(`runner config (${grantLabel}) contains unknown key "${k}". Allowed keys: ${ALLOWED_GRANT_KEYS.join(', ')}.`);
        }
      }

      if (typeof grant.resource !== 'string' || !grant.resource.trim()) {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) "resource" must be a non-empty string.`);
      }

      if (seenResources.has(grant.resource)) {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) duplicate resource grant for "${grant.resource}".`);
      }
      seenResources.add(grant.resource);

      if (!LEGAL_ACCESS.includes(grant.access)) {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) "access" must be one of ${LEGAL_ACCESS.join('/')}, got: ${JSON.stringify(grant.access)}.`);
      }

      if (grant.scope !== 'dispatch') {
        throw new ConfinementPolicyError(`runner config (${grantLabel}) "scope" must be "dispatch", got: ${JSON.stringify(grant.scope)}.`);
      }

      if (basePolicy) {
        const baseGrant = baseGrantsByResource.get(grant.resource);
        if (!baseGrant) {
          throw new ConfinementPolicyError(`runner config (${grantLabel}) override cannot add new grant for "${grant.resource}".`);
        }
        if (GRANT_ACCESS_LEVELS[grant.access] > GRANT_ACCESS_LEVELS[baseGrant.access]) {
          throw new ConfinementPolicyError(
            `runner config (${grantLabel}) override cannot widen access for "${grant.resource}" from "${baseGrant.access}" to "${grant.access}".`,
          );
        }
      }
    }
  }

  const effectiveNetworkEgress = override.controls?.networkEgress ?? basePolicy?.controls?.networkEgress;
  if (override.controls?.networkEgress === 'filtered') {
    if (!override.networkFilter) {
      throw new ConfinementPolicyError(`runner config (${label}) "networkFilter" is required when networkEgress is "filtered".`);
    }
    validateNetworkFilterShape(override.networkFilter, `${label}.networkFilter`);
  } else if (override.networkFilter !== undefined) {
    if (effectiveNetworkEgress !== 'filtered') {
      throw new ConfinementPolicyError(`runner config (${label}) "networkFilter" is only permitted when networkEgress is "filtered".`);
    }
    validateNetworkFilterShape(override.networkFilter, `${label}.networkFilter`);
  }

  if (override.networkFilter && basePolicy?.networkFilter) {
    const baseRules = (basePolicy.networkFilter.allow || []).map((r) => ({
      protocol: r.protocol,
      kind: r.destination?.kind,
      value: r.destination?.value,
      ports: new Set(r.ports || []),
    }));

    for (const [idx, rule] of override.networkFilter.allow.entries()) {
      const ruleLabel = `${label}.networkFilter.allow[${idx}]`;
      const matchingBase = baseRules.find(
        (b) =>
          b.protocol === rule.protocol &&
          b.kind === rule.destination.kind &&
          b.value === rule.destination.value,
      );
      if (!matchingBase) {
        throw new ConfinementPolicyError(
          `runner config (${ruleLabel}) override cannot add rule with destination "${rule.destination.value}" (${rule.protocol}) not in base policy.`,
        );
      }
      for (const p of rule.ports) {
        if (!matchingBase.ports.has(p)) {
          throw new ConfinementPolicyError(
            `runner config (${ruleLabel}) override cannot add port ${p} not permitted by base policy.`,
          );
        }
      }
    }
  }

  return override;
}

/**
 * Normalizes legacy `{ privateHome, isolatedSession, ownWorktree }` flags
 * into a canonical `ConfinementPolicyV1` shape at the normalization boundary (spec §6.2).
 */
export function normalizeLegacyConfinement(confinement, label = 'confinement') {
  if (!confinement || typeof confinement !== 'object' || Array.isArray(confinement)) {
    return null;
  }

  const isLegacy =
    confinement.privateHome !== undefined ||
    confinement.isolatedSession !== undefined ||
    confinement.ownWorktree !== undefined;

  if (!isLegacy) {
    return null;
  }

  const privateHome = Boolean(confinement.privateHome);
  const isolatedSession = Boolean(confinement.isolatedSession);
  const ownWorktree = Boolean(confinement.ownWorktree);

  return {
    contract: 'confinement-policy.v1',
    controls: {
      hostWrite: 'allow',
      hostRead: 'allow',
      networkEgress: 'allow',
      process: 'host',
      home: privateHome ? 'private' : 'host',
      session: isolatedSession ? 'isolated' : 'shared',
      workspace: ownWorktree ? 'own' : 'shared',
    },
    grants: [
      ...(privateHome ? [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }] : []),
    ],
  };
}

/**
 * Resolve a policy by ID from built-ins or custom user policies.
 */
export function resolveConfinementPolicy(policyId, customPolicies = {}) {
  if (typeof policyId !== 'string' || !policyId.trim()) {
    return null;
  }
  if (BUILTIN_POLICIES[policyId]) {
    return BUILTIN_POLICIES[policyId];
  }
  if (customPolicies && typeof customPolicies === 'object' && customPolicies[policyId]) {
    return customPolicies[policyId];
  }
  return null;
}
