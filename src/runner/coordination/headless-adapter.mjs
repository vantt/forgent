// headless-adapter.mjs — R4's headless driver/runner entry. Its ENTIRE job
// is operator attachment/visibility/invocation lifecycle: unlike
// `bin/fgos.mjs`'s `coordination run` (which reads argv/flags, writes a
// `fgos.v1` envelope to stdout, and sets `process.exitCode`), this module
// is a plain importable async function a headless caller (a test, an MCP
// tool, an embedding process, another Node script -- never a terminal) can
// call in-process: it never touches stdin/stdout/stderr, never sets
// `process.exitCode`, and accepts an in-memory request object directly
// (no forced file round-trip) in addition to a file path.
//
// It calls the EXACT SAME `runCoordinationUseCase` the interactive CLI
// calls -- imported once, used directly, never re-implemented or wrapped
// in a way that could silently diverge. `__runCoordinationEngineEntryPoint`
// is re-exported purely so a test can assert, by reference identity
// (`===`), that this really is the same function object the CLI verb
// module exports -- not a lookalike, not a re-derived copy (this track's
// own "single execution core" static-test precedent,
// test/runner/coordination-static.test.mjs).
//
// Per R4: this module cannot fork schemas, planning, protocol, dispatch,
// evidence, recovery, quorum, or budget logic -- and it does not: every
// line below is either import wiring or an invocation-lifecycle concern
// (accepting an object vs. a path, returning instead of printing). It does
// not use herdr.
import { runCoordinationUseCase } from '../../verbs/coordination/run.mjs';

export { runCoordinationUseCase as __runCoordinationEngineEntryPoint };

/**
 * Headless invocation of one coordination request. Identical validated-
 * request-to-engine-call mapping as `fgos coordination run --file`
 * (`runCoordinationUseCase`, called directly, unmodified) -- differs ONLY
 * in how the request arrives and how the result leaves:
 * - accepts `request` as either an in-memory object (no file needed for a
 *   caller that already has one) or a string path (same file-based door
 *   the CLI itself uses);
 * - returns the structured result object directly to its caller instead of
 *   wrapping it in an `fgos.v1` envelope and writing it to stdout;
 * - throws the same errors the interactive path would raise (uncaught, no
 *   `process.exitCode` side effect) -- the host process decides what to do
 *   with them, exactly matching the "attachment" half of R4's scope.
 *
 * @param {object|string} request A parsed request object, or a path to a request JSON file.
 * @param {object} [options]
 * @param {object} [options.ctx] `{cwd, repoRoot, runnerConfig?, timeoutMs?, packageRoot?}`, forwarded unchanged to `runCoordinationUseCase`.
 * @param {string} [options.executor] Global trusted `--executor` equivalent.
 * @param {string} [options.model] Global trusted `--model` equivalent.
 * @param {string} [options.tier] Global trusted `--tier` equivalent.
 * @returns {Promise<object>} The same data shape `fgos coordination run` wraps in its `fgos.v1` envelope.
 */
export async function runCoordinationHeadless(request, options = {}) {
  const ctx = options.ctx ?? {};
  return runCoordinationUseCase(ctx, {
    ...(typeof request === 'string' ? { requestPath: request } : { requestObject: request }),
    cliExecutor: options.executor,
    cliModel: options.model,
    cliTier: options.tier,
  });
}
