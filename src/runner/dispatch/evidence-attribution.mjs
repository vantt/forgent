// dispatch/evidence-attribution.mjs — Attribution dimensions and policy evaluation
// for Team Dispatch V1 (Step 08 / DOEA-02 / DOEA-09 / DOEA-12).
//
// Separation Rule:
// - Observation states what changed.
// - Attribution states how strongly evidence ties that change to a Run.
// - Policy decides whether the round may be accepted.
// These dimensions are independent and stored/read independently.

import { matchesWriteScope } from './write-scope.mjs';

export const ATTRIBUTION_LEVELS = Object.freeze(['proven', 'correlated', 'excluded', 'unattributed']);
export const POLICY_DISPOSITIONS = Object.freeze(['allow', 'refuse', 'needs-input', 'not-applicable']);

/**
 * Attribute workspace changes (e.g. pre-launch dirt vs post-run dirt).
 *
 * Rules:
 * - Pre-existing dirt with unchanged hash is "excluded" from this run's attribution.
 * - Post-run dirt without positive observer is at most "correlated".
 * - Adapter/confinement positive attestation can yield "proven" only within declared coverage.
 * - Baseline missing yields "unattributed".
 *
 * @param {object} params
 * @param {string[]} [params.preLaunchDirt] List of dirty file paths prior to launch
 * @param {string[]} [params.postRunDirt] List of dirty file paths after execution
 * @param {Record<string, string>} [params.dirtyBeforeHashes] Pre-launch file hashes (path -> sha256)
 * @param {Record<string, string>} [params.postRunHashes] Post-run file hashes (path -> sha256)
 * @param {object} [params.declaredCoverage] Declared write scope / coverage paths
 * @param {object} [params.adapterAttestation] Positive attestation from adapter/confinement
 * @returns {Array<object>} Attribution records
 */
export function attributeWorkspaceChanges({
  preLaunchDirt = [],
  postRunDirt = [],
  dirtyBeforeHashes = {},
  postRunHashes = {},
  declaredCoverage = null,
  adapterAttestation = null,
} = {}) {
  const records = [];
  const preDirtSet = new Set(preLaunchDirt || []);
  const postDirtSet = new Set(postRunDirt || []);

  const allPaths = Array.from(new Set([...preDirtSet, ...postDirtSet])).sort();

  for (const filePath of allPaths) {
    const wasPre = preDirtSet.has(filePath);
    const isPost = postDirtSet.has(filePath);

    if (wasPre && isPost) {
      const preHash = dirtyBeforeHashes[filePath];
      const postHash = postRunHashes[filePath];

      if (preHash && postHash && preHash === postHash) {
        // Pre-existing dirt unchanged during run -> excluded
        records.push({
          path: filePath,
          firstObserved: 'pre-launch',
          level: 'excluded',
          basis: ['dirty-before-hash-match'],
          coverageMatched: false,
        });
      } else if (preHash && postHash && preHash !== postHash) {
        // Pre-existing dirt mutated during run -> correlated (or proven if covered)
        const isCovered = checkCoverage(filePath, declaredCoverage);
        const hasPositiveAttestation = checkAttestation(filePath, adapterAttestation);
        records.push({
          path: filePath,
          firstObserved: 'pre-launch',
          level: hasPositiveAttestation && isCovered ? 'proven' : 'correlated',
          basis: hasPositiveAttestation && isCovered
            ? ['adapter-confinement-attestation', 'pre-existing-dirt-mutated']
            : ['pre-existing-dirt-mutated', 'pre-post-git-snapshot'],
          coverageMatched: isCovered,
        });
      } else {
        // Hashes missing but present in both -> excluded by default timing unless mutatedDirtyBeforeFiles says otherwise
        records.push({
          path: filePath,
          firstObserved: 'pre-launch',
          level: 'excluded',
          basis: ['pre-launch-git-status'],
          coverageMatched: false,
        });
      }
    } else if (wasPre && !isPost) {
      // Reverted or cleaned during run
      records.push({
        path: filePath,
        firstObserved: 'pre-launch',
        level: 'excluded',
        basis: ['pre-launch-dirt-cleared'],
        coverageMatched: false,
      });
    } else if (!wasPre && isPost) {
      // Clean before launch, dirty after run: new change
      const isCovered = checkCoverage(filePath, declaredCoverage);
      const hasPositiveAttestation = checkAttestation(filePath, adapterAttestation);

      if (hasPositiveAttestation && isCovered) {
        records.push({
          path: filePath,
          firstObserved: 'post-run',
          level: 'proven',
          basis: ['adapter-confinement-attestation'],
          coverageMatched: true,
        });
      } else {
        // Without positive observer, post-run git dirt is at most correlated
        records.push({
          path: filePath,
          firstObserved: 'post-run',
          level: 'correlated',
          basis: ['pre-post-git-snapshot'],
          coverageMatched: isCovered,
        });
      }
    }
  }

  return records;
}

function checkCoverage(filePath, declaredCoverage) {
  if (!declaredCoverage) return false;
  const paths = declaredCoverage.paths || declaredCoverage.writeScope || [];
  if (!Array.isArray(paths) || paths.length === 0) return false;
  return matchesWriteScope(filePath, paths);
}

function checkAttestation(filePath, adapterAttestation) {
  if (!adapterAttestation) return false;
  const attested = adapterAttestation.writtenPaths || adapterAttestation.attestedPaths || [];
  if (!Array.isArray(attested)) return false;
  return attested.includes(filePath);
}

/**
 * Attribute worker claim evidence references.
 * Worker-provided evidenceRefs are untrusted claims; correlated by default.
 *
 * @param {object} agentClaim
 * @param {object} [opts]
 * @returns {Array<object>}
 */
export function attributeClaimEvidenceRefs(agentClaim, opts = {}) {
  const refs = Array.isArray(agentClaim?.evidenceRefs) ? agentClaim.evidenceRefs : [];
  return refs.map((ref) => {
    return {
      ref,
      level: 'correlated',
      basis: ['worker-claim-ref'],
    };
  });
}

/**
 * Evaluate safety and attribution policy.
 *
 * A before/after snapshot of a checkout shows what changed there, never who
 * changed it: the checkout may be shared with other sessions that write and
 * commit while a run is in flight. So every finding resting on correlated
 * evidence is reported as a warning and the run is accepted. Only a write
 * proven to belong to the run -- attested by a run-bound observer within its
 * coverage -- is refused. Policy refusal preserves execution and assessment
 * facts; it does not erase completed execution or substantive findings.
 *
 * @param {object} params
 * @param {Array<object>} [params.attributions] Attribution records from attributeWorkspaceChanges
 * @param {boolean} [params.isReadOnly] Whether the operation is read-only
 * @param {string[]} [params.writeScope] Allowed write scope paths
 * @param {string[]} [params.mutatedDirtyBeforeFiles] Files that were dirty before and changed content during the run
 * @param {boolean} [params.contradictoryClaim] Whether worker claim contradicts independent evidence
 * @returns {{ disposition: 'allow'|'refuse', code: string|null, reason?: string, warnings: Array<object> }}
 */
export function evaluateAttributionPolicy({
  attributions = [],
  isReadOnly = false,
  writeScope = null,
  mutatedDirtyBeforeFiles = [],
  contradictoryClaim = false,
} = {}) {
  const warnings = [];

  if (contradictoryClaim) {
    return {
      disposition: 'refuse',
      code: 'contradictory-worker-claim',
      reason: 'Worker claim contradicts independent evidence',
      warnings,
    };
  }

  const postRun = attributions.filter((a) => a.firstObserved === 'post-run');
  const proven = postRun.filter((a) => a.level === 'proven');
  const correlated = postRun.filter((a) => a.level === 'correlated');

  if (isReadOnly && proven.length > 0) {
    return {
      disposition: 'refuse',
      code: 'read-only-mutation',
      reason: `Read-only operation wrote: ${proven.map((a) => a.path).join(', ')}`,
      warnings,
    };
  }

  const inScope = (p) => matchesWriteScope(p, writeScope);
  const hasScope = Array.isArray(writeScope) && writeScope.length > 0;
  if (hasScope) {
    const provenOutside = proven.filter((a) => !inScope(a.path));
    if (provenOutside.length > 0) {
      return {
        disposition: 'refuse',
        code: 'outside-write-scope',
        reason: `Run wrote outside its allowed write scope: ${provenOutside.map((a) => a.path).join(', ')}`,
        warnings,
      };
    }
  }

  if (Array.isArray(mutatedDirtyBeforeFiles) && mutatedDirtyBeforeFiles.length > 0) {
    warnings.push({
      code: 'mutated-dirty-before-correlated',
      level: 'correlated',
      basis: ['dirty-before-hash-changed'],
      paths: [...mutatedDirtyBeforeFiles],
    });
  }
  if (isReadOnly && correlated.length > 0) {
    warnings.push({
      code: 'read-only-mutation-correlated',
      level: 'correlated',
      basis: ['pre-post-git-snapshot'],
      paths: correlated.map((a) => a.path),
    });
  } else if (hasScope) {
    const outside = correlated.filter((a) => !inScope(a.path));
    if (outside.length > 0) {
      warnings.push({
        code: 'outside-write-scope-correlated',
        level: 'correlated',
        basis: ['pre-post-git-snapshot'],
        paths: outside.map((a) => a.path),
      });
    }
  }

  return { disposition: 'allow', code: null, warnings };
}
