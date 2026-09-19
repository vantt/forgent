import fs from 'node:fs';
import path from 'node:path';

import { resolveWriterIdentity } from '../../util/session-identity.mjs';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../../runner/paths.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../state/fgos-file-registry.mjs';

/**
 * Silently records a coordination schema validation failure to a dedicated telemetry log.
 * Adheres strictly to ADR0020: never creates `.fgos/` if it does not exist, and never throws.
 *
 * @param {string} cwd The caller's current working directory.
 * @param {Error} error The validation error caught during schema parsing.
 * @param {object} raw The raw request payload that failed validation.
 * @returns {string|null} The path written to, or null if no store was found or logging failed.
 */
export function recordCoordinationSchemaFault(cwd, error, raw) {
  try {
    const mainRoot = resolveMainCheckoutRoot(cwd);
    const fgosDir = mainRoot ? fgosDirFromRoot(mainRoot) : null;
    if (!fgosDir || !fs.existsSync(fgosDir)) return null;

    const logPath = resolveFgosFile(fgosDir, FGOS_FILE.COORDINATION_SCHEMA_FAULTS);
    
    // Only capture the structural shape to avoid unbounded log growth or sensitive data leaks.
    // We only need to know WHICH validation rule tripped (error.message) and basic provenance.
    const record = {
      timestamp: Date.now(),
      writer: resolveWriterIdentity(),
      message: error.message,
      kind: raw?.kind,
      hasActors: Boolean(raw?.actors),
      hasSteps: Array.isArray(raw?.steps) ? raw.steps.length : 0,
    };

    fs.appendFileSync(logPath, JSON.stringify(record) + '\n', 'utf-8');
    return logPath;
  } catch (logErr) {
    // Contract: never throw into the caller. A telemetry failure must be completely silent.
    return null;
  }
}
