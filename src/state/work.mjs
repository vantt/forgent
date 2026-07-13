// work.mjs — schema and validation for `work` (the single flat work-item
// entity, per D4). Thin lib: no CLI, no FSM transitions (those land in
// phase-1-state-layer-3), no view/state.json writes.
//
// Minimal field set that still answers the six R6 questions:
//   read_first -> refs   | kind of work -> kind        | contract touched -> refs
//   risk       -> risk   | proof of done -> verify      | learning left    -> learn (optional)
// plus id/title/status/deps to identify, name, place-in-FSM, and link work.

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class WorkValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkValidationError';
    this.category = 'validation';
  }
}

// Stable, file/CLI-safe id: lowercase kebab-case, starting with a letter.
const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function requireNonEmptyString(work, field) {
  if (typeof work[field] !== 'string' || !work[field].trim()) {
    throw new WorkValidationError(`work.${field} is required and must be a non-empty string.`);
  }
}

function requireArray(work, field) {
  if (!Array.isArray(work[field])) {
    throw new WorkValidationError(`work.${field} must be an array.`);
  }
}

/**
 * Validate the shape of a single work item: required fields, id format, and
 * that deps is an array of non-empty strings with no self-reference. Does
 * NOT check that deps point at ids that actually exist — that is
 * `validateDeps`, which needs the rest of the store to answer.
 */
export function validateWorkShape(work) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new WorkValidationError('work item must be an object.');
  }

  if (typeof work.id !== 'string' || !ID_PATTERN.test(work.id)) {
    throw new WorkValidationError(
      `work.id must be a stable kebab-case identifier (e.g. "add-login-form"), got: ${JSON.stringify(work.id)}`,
    );
  }
  requireNonEmptyString(work, 'title');
  requireNonEmptyString(work, 'kind');
  requireNonEmptyString(work, 'status');
  requireArray(work, 'deps');
  for (const dep of work.deps) {
    if (typeof dep !== 'string' || !dep) {
      throw new WorkValidationError(`work.deps entries must be non-empty strings, got: ${JSON.stringify(dep)}`);
    }
  }
  requireNonEmptyString(work, 'risk');
  requireArray(work, 'refs');
  requireNonEmptyString(work, 'verify');
  if (work.learn !== undefined && work.learn !== null && typeof work.learn !== 'string') {
    throw new WorkValidationError('work.learn must be a string when present (it is optional).');
  }

  if (work.deps.includes(work.id)) {
    throw new WorkValidationError(`work "${work.id}" cannot list itself as a dep.`);
  }

  return true;
}

/**
 * Validate that every dep of `work` points at an id present in `existingIds`
 * (an Set, or an iterable of ids, already known to the store). Self-reference
 * is already rejected by `validateWorkShape` and is not re-checked here.
 */
export function validateDeps(work, existingIds) {
  const known = existingIds instanceof Set ? existingIds : new Set(existingIds ?? []);
  for (const dep of work.deps) {
    if (!known.has(dep)) {
      throw new WorkValidationError(`work "${work.id}" depends on unknown id "${dep}".`);
    }
  }
  return true;
}

/**
 * Full validation entry point: shape first, then dep-existence when
 * `existingIds` is supplied (omit it to validate shape only, e.g. before the
 * store is known).
 */
export function validateWork(work, existingIds) {
  validateWorkShape(work);
  if (existingIds !== undefined) {
    validateDeps(work, existingIds);
  }
  return true;
}
