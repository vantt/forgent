// WORK-lane deletion: remove this adapter and legacyEvents at Event Store cutover.
// Work discovers exact paths and verifies truncation/compaction before calling.
// Git validates the retired layout and main authority; there is no implicit sweep.
import { createGitScopedCommit } from '../git/scoped-commit.mjs';

export function checkpointLegacyEventFiles(options, { files, message, operationId }, held = [], loaderOptions) {
  return createGitScopedCommit(options, loaderOptions).checkpointTrackedFiles({
    files, message, operationId, legacyEvents: { exactPaths: files },
  }, held);
}
export function commitLegacyEventFiles(options, { files, message, operationId, baseline }, held = [], loaderOptions) {
  return createGitScopedCommit(options, loaderOptions).commit({
    baseline, operationId,
    request: { writes: [], message, cutoverGrant: null, legacyEvents: { exactPaths: files } },
  }, held);
}
