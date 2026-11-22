// The assignment layout as a session-host caller reads it: one call each of the native addon's `execution`
// namespace, through the Execution door. The layout rules (nested ids, run directories, the depth barrier, symlinks
// never followed) are `fgos-execution::assignment_layout`'s.
export { assignmentDir, listAssignmentRuns } from '../../native/execution-door.mjs';
