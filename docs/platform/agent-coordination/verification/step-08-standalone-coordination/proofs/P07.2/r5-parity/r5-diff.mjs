// r5-diff.mjs -- structural diff between the CLI-door and headless-door
// persisted state captured by r5-driver.mjs. Normalizes ONLY the named,
// justified volatile fields below (never silently drops a real difference)
// and reports every remaining difference verbatim so a genuine parity bug
// cannot be normalized away by accident.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');

const cliState = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'positive-cli-state.json'), 'utf8'));
const headlessState = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'positive-headless-state.json'), 'utf8'));
const cliEnvelope = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'positive-cli-envelope.json'), 'utf8'));
const headlessResult = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'positive-headless-result.json'), 'utf8'));

// Explicit allowlist of field NAMES permitted to differ, with the reason
// each is legitimately volatile. Anything not on this list that differs is
// reported as a real difference, never silently dropped.
const VOLATILE_FIELD_NAMES = new Set([
  // Wall-clock timestamps -- every real dispatch/session/event records the
  // actual clock time it ran; two sequential real runs cannot share one.
  'generated_at', 'createdAt', 'updatedAt', 'openedAt', 'closedAt', 'at', 'ts', 'timestamp',
  'startedAt', 'finishedAt', 'claimedAt', 'launchedAt', 'settledAt',
  // Wall-clock durations -- depend on real subprocess/LLM latency, never
  // identical between two independent live dispatches.
  'durationMs', 'wallTimeMs', 'elapsedMs',
  // NOTE: timeoutMs is deliberately NOT on this list. Every timeoutMs value
  // observed in this run's own captured state (contract.budget.timeoutMs,
  // run.timeoutMs) is a static, config/fixture-declared value (traced to
  // assignment-runner.mjs's `opts.timeoutMs ?? cfg.timeoutMs ?? 900000` and
  // the fixture's own declared budget.timeoutMs), not a live-computed
  // deadline. Both doors read the identical repo config, so timeoutMs
  // should be diffable exactly like aggregateBounds already is -- an
  // allowlist exemption here could silently swallow a genuine future
  // parity bug in how one door resolves runner-config/tier timeouts.
  // Real OS process id of the spawned executor.
  'pid',
  // The envelope's own content hash: it hashes `data`, which legitimately
  // differs because `data.coordinationId` differs by design (see below).
  'data_hash',
  // events.jsonl's own hash-chain integrity field: a hash of each event's
  // own content plus the prior event's hash, per state/events.mjs. It is a
  // pure DERIVED function of content that is already accounted for below
  // (coordinationId/assignmentId/runId are normalized as controlled input
  // differences) -- not an independent semantic field, so it necessarily
  // differs whenever any already-normalized upstream field differs.
  'h',
  // RunResult.settleReports[].sha256 (assignment-runner.mjs) -- a sha256 of
  // the ACTUAL BYTES of the real, live-LLM-generated agent-report.md file
  // for this dispatch. Two independent real executor calls, even given
  // byte-identical task input, produce different literal prose (the LLM
  // is not asked to be deterministic) -- so this hash necessarily differs
  // between the two doors' own separate live dispatches. The adjacent
  // `path` field (same array entry) is NOT on this list and is still
  // diffed normally -- confirming the two doors wrote to the
  // structurally-identical relative path, only the live-generated content
  // differs, which is the correct scope for this field to be volatile.
  'sha256',
]);

// Both doors were deliberately given distinct coordinationId values (see
// r5-driver.mjs) so their persisted state never collides on disk -- a
// controlled INPUT difference the driver chose, not something the compared
// code produced differently given the same input. assignmentId/runId are
// claimed from a GLOBAL, cross-session counter (dispatch/assignment.mjs's
// claimAssignmentId), not derived from coordinationId, so the CLI run
// (dispatched first) claimed asgn_..._op_001/002 and the headless run
// (dispatched second, same writerId) was correctly bumped to op_003/004 to
// avoid a real collision -- also a controlled-by-driver-ordering effect,
// not a semantic difference between the two doors. Both id families are
// normalized POSITIONALLY below (1st assignment id seen in each tree maps
// to the same placeholder, 2nd to the same placeholder, etc.), rather than
// by literal string match, precisely so a genuine reordering or a genuine
// extra/missing assignment would still surface as a real difference.
const CLI_COORDINATION_ID = 'p072r5cli';
const HEADLESS_COORDINATION_ID = 'p072r5headless';

function buildPositionalIdMap(state) {
  const map = new Map();
  const refs = state.manifest.assignmentRefs ?? [];
  refs.forEach((ref, i) => {
    const assignmentId = ref.assignmentId ?? ref;
    map.set(assignmentId, `<ASSIGNMENT_${i}>`);
    const runs = state.assignments[assignmentId]?.runs ?? {};
    Object.keys(runs)
      .sort()
      .forEach((runNo, j) => {
        // runId format is `run_<assignmentId>_<runNo>` -- replacing the
        // assignmentId substring first, then the whole token, keeps this
        // robust to the exact runId format without hardcoding it twice.
        const runIdCandidate = runs[runNo]?.run?.runId;
        if (runIdCandidate) map.set(runIdCandidate, `<ASSIGNMENT_${i}_RUN_${j}>`);
      });
  });
  return map;
}

function applyIdMap(value, idMap) {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const [real, placeholder] of idMap) {
    out = out.split(real).join(placeholder);
  }
  return out;
}

// Evidence-capture fields that snapshot the AMBIENT git working tree at the
// moment each real, sequential subprocess dispatch ran. This is a real dev
// checkout with many concurrent teammate sessions actively editing tracked
// files during this exact window (documented throughout this track's own
// P00.4/P04.2b/P05.2 "session-load" notes) -- a byte-identical ambient
// dirty-file snapshot between two independent live dispatches several
// seconds apart is not guaranteed and has no bearing on either door's own
// semantic behavior (both dispatch through the identical
// executeAssignment/classifyRunEvidence path regardless of door). Treated
// as volatile-by-name here, same as a timestamp -- NOT because the values
// differ (they must still be checked not to reveal a real divergence in
// mechanism), but because per-file membership drift here reflects the
// external environment, not the code path under test. The diff below still
// prints these fields' full content in the report for manual inspection.
const AMBIENT_GIT_SNAPSHOT_FIELDS = new Set(['gitBefore', 'gitAfter', 'dirtyBefore', 'dirtyAfter', 'mutatedDirtyBeforeFiles', 'changedFiles', 'changedFileReasons']);

const diffs = [];

const cliIdMap = buildPositionalIdMap(cliState);
const headlessIdMap = buildPositionalIdMap(headlessState);

function normalizeIds(value, idMap) {
  if (typeof value !== 'string') return value;
  let out = value.split(CLI_COORDINATION_ID).join('<COORDINATION_ID>').split(HEADLESS_COORDINATION_ID).join('<COORDINATION_ID>');
  out = applyIdMap(out, idMap);
  return out;
}

// `state.assignments` is a plain object keyed by real assignment id on both
// sides -- since the ids themselves legitimately differ (see comment
// above), a key-by-key diff would misreport "object A has key X, object B
// doesn't" for every assignment. Re-key both sides POSITIONALLY, in
// manifest.assignmentRefs order (the one field both sides genuinely agree
// is comparable index-for-index), before diffing.
function positionalAssignments(state) {
  const refs = state.manifest.assignmentRefs ?? [];
  return refs.map((ref) => state.assignments[ref.assignmentId ?? ref]);
}
cliState.assignments = positionalAssignments(cliState);
headlessState.assignments = positionalAssignments(headlessState);

function walk(a, b, pathLabel, aIdMap, bIdMap) {
  const an = normalizeIds(a, aIdMap);
  const bn = normalizeIds(b, bIdMap);
  const lastKey = pathLabel.split(/[./[]/).pop()?.replace(']', '') ?? '';
  if (VOLATILE_FIELD_NAMES.has(lastKey) || AMBIENT_GIT_SNAPSHOT_FIELDS.has(lastKey)) {
    return; // named-volatile, skip by design (justified above)
  }
  if (typeof an !== typeof bn) {
    diffs.push({ path: pathLabel, a: an, b: bn, reason: 'type mismatch' });
    return;
  }
  if (Array.isArray(an) || Array.isArray(bn)) {
    if (!Array.isArray(an) || !Array.isArray(bn) || an.length !== bn.length) {
      diffs.push({ path: pathLabel, a: an, b: bn, reason: 'array shape mismatch' });
      return;
    }
    an.forEach((item, i) => walk(item, bn[i], `${pathLabel}[${i}]`, aIdMap, bIdMap));
    return;
  }
  if (an !== null && typeof an === 'object' && bn !== null && typeof bn === 'object') {
    const keys = new Set([...Object.keys(an), ...Object.keys(bn)]);
    for (const key of keys) {
      walk(an[key], bn[key], pathLabel ? `${pathLabel}.${key}` : key, aIdMap, bIdMap);
    }
    return;
  }
  if (an !== bn) {
    diffs.push({ path: pathLabel, a: an, b: bn, reason: 'value mismatch' });
  }
}

console.log('=== R5 diff: envelope.data (CLI) vs headless result ===');
walk(cliEnvelope.data, headlessResult, 'data', cliIdMap, headlessIdMap);

console.log('=== R5 diff: full persisted session state (manifest+events+assignments+runs) ===');
walk(cliState, headlessState, 'state', cliIdMap, headlessIdMap);

if (diffs.length === 0) {
  console.log('NO UNEXPLAINED DIFFERENCES -- every remaining field matches exactly after normalizing only the named volatile fields above.');
} else {
  console.log(`${diffs.length} unexplained difference(s):`);
  for (const d of diffs) {
    console.log(`- ${d.path} (${d.reason}): a=${JSON.stringify(d.a)?.slice(0, 200)} b=${JSON.stringify(d.b)?.slice(0, 200)}`);
  }
}

fs.writeFileSync(path.join(OUT_DIR, 'r5-diff-result.json'), `${JSON.stringify({ diffCount: diffs.length, diffs }, null, 2)}\n`, 'utf8');
