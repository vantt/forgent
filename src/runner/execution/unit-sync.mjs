// unit-sync.mjs — a Unit's `syncBase`: the runner merges a base ref into the unit's branch.
//
// The worker never runs git (its gitdir is read-only), so the merge is the runner's, through the
// trusted git of commit-unit-work.mjs. The record lives in unit.json#sync:
//   { ref, sha, status: 'pending'|'up-to-date'|'merged'|'conflicted'|'failed', head?, conflicts?,
//     mergeStaged?, commit?, reason?, error? }
// `sha` is resolved once, before the unit run exists, and a resume merges that sha, never the ref
// again. A conflicted merge stays open for the worker; the open MERGE_HEAD equal to `sha` over
// `head` is how the runner tells its own merge from anyone else's.

import fs from 'node:fs';

import { RunnerConfigError } from '../dispatch/config.mjs';
import { matchesWriteScope } from '../dispatch/write-scope.mjs';
import { commitOnBranch, finishSyncMerge, resolveSyncBase, startSyncMerge, syncMergeState } from './commit-unit-work.mjs';

/**
 * The sync record of a new unit run, checked before the run exists: the unit must run in a linked
 * worktree (a merge never lands in the main checkout) and its ref must name a commit.
 */
export function seedSync(unit, { worktree, mainRoot }) {
  if (unit.syncBase === undefined) return null;
  if (fs.realpathSync(worktree) === fs.realpathSync(mainRoot)) {
    throw new RunnerConfigError(`unit.syncBase "${unit.syncBase}" needs a linked worktree: the runner never merges into the main checkout`);
  }
  const sha = resolveSyncBase({ worktree, repoRoot: mainRoot, ref: unit.syncBase });
  if (!sha) throw new RunnerConfigError(`unit.syncBase "${unit.syncBase}" names no commit in this repository`);
  return { ref: unit.syncBase, sha, status: 'pending' };
}

/**
 * Before a resume: a merge the run left open must still be open (or concluded, by hand or by an
 * earlier round), never silently restarted over what a person did to it.
 */
export function assertSyncResumable(unitRunId, unitRecord, mainRoot) {
  const sync = unitRecord.sync;
  // A clean merge commit that holds more than the merge stays on the branch; a person takes it off.
  if (sync?.status === 'failed' && sync.reason === 'committed-set-mismatch' && sync.commit?.sha
    && commitOnBranch(unitRecord.worktree, sync.commit.sha, mainRoot)) {
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": ${sync.error} (unexpected: ${(sync.unexpected ?? []).join(', ') || 'none'}; missing: ${(sync.missing ?? []).join(', ') || 'none'}); inspect it and take it off the branch by hand (git reset --hard ${sync.head} drops it with its files), then resume`);
  }
  if (sync?.status !== 'conflicted') return;
  const { state, mergeHead, head } = syncMergeState({ worktree: unitRecord.worktree, repoRoot: mainRoot, sync });
  if (state === 'in-progress') return;
  if (state === 'done') {
    sync.status = 'merged';
    sync.commit = { by: 'outside' };
    return;
  }
  const what = state === 'not-started'
    ? 'was aborted in the worktree'
    : `is no longer in progress (MERGE_HEAD ${mergeHead ?? 'none'}, HEAD ${head})`;
  throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": the merge of ${sync.ref} (${sync.sha}) it left for the worker ${what}; start a new run`);
}

/**
 * The scope a writing seat of this unit may write now: the stored `writeScope`, plus the conflicted
 * paths it does not cover while, and only while, a merge of this run is open for the worker
 * (`sync.status === 'conflicted'`). `writeScope` itself never holds them.
 */
export function effectiveWriteScope(unitRecord) {
  const scope = unitRecord.writeScope ?? unitRecord.unit?.writes ?? [];
  return unitRecord.sync?.status === 'conflicted' ? [...scope, ...(unitRecord.sync.scopeAdded ?? [])] : scope;
}

/**
 * Run the merge a pending (or failed) sync still owes. Returns null when the unit goes on to its
 * pattern, or the outcome that ends the run here: a refusal, or `pass` for a sync-only unit whose
 * merge needed no worker. A conflicted merge widens the effective scope by the conflicted paths it does
 * not already cover.
 */
export function runPendingSync(unitRecord, mainRoot, persist) {
  const sync = unitRecord.sync;
  if (!sync || !['pending', 'failed'].includes(sync.status)) {
    const done = sync?.status === 'merged' || sync?.status === 'up-to-date';
    return done && unitRecord.unit.syncOnly && !unitRecord.bindings?.['producer/1'] ? syncOnlyPass(sync) : null;
  }
  // Only a run that already marked this sync as started (and died before recording its result)
  // may find its own merge open; a first start never takes over a merge someone else opened.
  const adoptOpenMerge = sync.status === 'pending' && sync.started === true;
  sync.started = true;
  persist();
  const result = startSyncMerge({ worktree: unitRecord.worktree, repoRoot: mainRoot, ref: sync.ref, sha: sync.sha, adoptOpenMerge });
  unitRecord.sync = result;
  persist();
  if (result.status === 'failed') {
    // Git failing, or a commit that landed holding the wrong set, is a failure; anything else (a
    // pre-commit hook's `hook-refused` included) refused to start, and left no merge open.
    const outcome = ['git-error', 'committed-set-mismatch'].includes(result.reason) ? 'execution-failure' : 'policy-refusal';
    return { outcome, results: [{ outcome, role: 'producer', round: 1, refused: { reason: result.reason, detail: result.error } }] };
  }
  if (result.status === 'conflicted') {
    // In scope only while the merge is open (effectiveWriteScope); writeScope is left as declared.
    const scope = unitRecord.writeScope ?? unitRecord.unit.writes ?? [];
    result.scopeAdded = result.conflicts.filter((p) => !matchesWriteScope(p, scope));
    persist();
    return null;
  }
  return unitRecord.unit.syncOnly ? syncOnlyPass(result) : null;
}

/** A sync-only unit that needed no worker: its one result is the runner's merge commit (or none). */
function syncOnlyPass(sync) {
  const commit = sync.commit?.sha
    ? { status: 'committed', sha: sync.commit.sha, subject: sync.commit.subject, outOfScope: [], preExistingInScope: [] }
    : { status: 'no-changes', outOfScope: [], preExistingInScope: [] };
  return { outcome: 'pass', results: [{ outcome: 'pass', role: 'sync', round: 0, commit }] };
}

/** What a writing seat is told about a merge left open for it; empty when there is none. */
export function syncBrief(sync) {
  if (sync?.status !== 'conflicted') return '';
  return [
    '',
    '## Merge to finish',
    `The runner merged \`${sync.ref}\` (${sync.sha.slice(0, 12)}) into this branch and git stopped on conflicts in:`,
    ...sync.conflicts.map((p) => `- ${p}`),
    'Edit each of these files so that no conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`, `|||||||`) is left, keeping what both sides meant. They are in your write scope.',
    'Never run git yourself (no `git add`, `git merge --continue`, `git merge --abort`, `git commit`): the runner concludes the merge commit after your round passes, and refuses it while a marker is left.',
  ].join('\n');
}

/**
 * The runner commit of a passing writing round of a unit with a sync: first conclude the merge
 * left open for the worker, then commit the rest of the round as usual (`commitWork`). The result
 * is the round's commit record with the merge's own under `sync`.
 */
export function commitRoundWithSync(unitRecord, mainRoot, commitWork, excludePaths) {
  const sync = unitRecord.sync;
  if (sync?.status !== 'conflicted') return commitWork();
  const merge = finishSyncMerge({ worktree: unitRecord.worktree, repoRoot: mainRoot, sync });
  if (merge.status === 'failed') {
    const { status, reason, error, ...detail } = merge;
    return { status, reason, error, ...detail, outOfScope: [], preExistingInScope: [...excludePaths], sync: merge };
  }
  sync.status = 'merged';
  sync.commit = merge.status === 'committed' ? { sha: merge.sha, subject: merge.subject, files: merge.files } : { by: 'outside' };
  return { ...commitWork(), sync: merge };
}

/** The sync part of runUnit's result. */
export function syncSummary(sync) {
  if (!sync) return undefined;
  const { started: _started, mergeStaged: _staged, ...rest } = sync;
  return rest;
}
