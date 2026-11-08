// src/workflow/case-inherit.mjs — what a new case may take over from a closed case of the same plan
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A successor case starts from the same request on the same commit; making it reach `decisions-locked` and
// `plan-validated` again spends dispatches on answers already given. A milestone is taken over only when
// nothing it was reached on has moved: the source case is closed, ran the same guide on the same request and
// the same base commit, reached the milestone for real, and the milestone is a non-delivery one that no `must`
// row binds to a tree or a person. The taken-over milestones travel on `case.opened`, with where they came
// from, so the new ledger shows what was inherited and from which case.

import fs from 'node:fs';
import path from 'node:path';

import { isDeliveryMilestone, readCaseProjection } from './case-projection.mjs';
import { eventsFilePath, readWorkflowEvents } from './store.mjs';
import { runsRoot } from '../runner/execution/case-run-paths.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';

/** Milestones a case may take over: produced by an activity that writes nothing, and named by no `must` row. */
function inheritableMilestones(guide) {
  const bound = new Set((guide?.must ?? []).map((row) => row.subject).filter(Boolean));
  const produced = new Set((guide?.activities ?? []).filter((a) => a.effects === 'none').flatMap((a) => a.produces ?? []));
  return [...produced].filter((id) => id !== 'request-received' && !bound.has(id) && !isDeliveryMilestone(guide, id));
}

// A ledger is only worth parsing when its raw bytes carry both marks of a closed case; a Playbook run,
// the largest ledgers on disk, carries neither, and the cases it cannot be are never parsed.
const CLOSED_CASE_MARKS = ['"type":"case.opened"', '"type":"case.closed"'];

/**
 * The cases `inheritFrom` may be asked about, newest first: those whose ledger carries `case.opened` and
 * `case.closed`. A directory that is no case (the bindings directory, a stray one) has no such ledger.
 *
 * @param {string} mainRoot
 * @returns {string[]} case ids
 */
export function inheritCandidates(mainRoot) {
  let entries;
  try {
    entries = fs.readdirSync(runsRoot(mainRoot), { withFileTypes: true });
  } catch {
    return [];
  }
  const closedLooking = (id) => {
    try {
      const bytes = fs.readFileSync(eventsFilePath(mainRoot, id));
      return CLOSED_CASE_MARKS.every((mark) => bytes.includes(mark));
    } catch {
      return false;
    }
  };
  return entries
    .filter((d) => d.isDirectory() && closedLooking(d.name))
    .map((d) => ({ id: d.name, at: fs.statSync(path.join(runsRoot(mainRoot), d.name)).mtimeMs }))
    .sort((a, b) => b.at - a.at)
    .map((d) => d.id);
}

const refuse = (code, detail) => new RunnerConfigError(`--inherit ${detail}`, { code });

/**
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {string} params.fromCaseId the closed case to take milestones from
 * @param {object} params.guide the guide the new case runs
 * @param {string} params.guideSha256 digest of that guide as `case.opened` records it
 * @param {string} params.requestDigest digest of the new case's request
 * @param {string | null} params.baseCommit the commit the new case starts on
 * @returns {{ fromCase: string, baseCommit: string, requestDigest: string, milestones: Array<{ milestone: string, subjectDigest: string | null, receipts: object[], outcome: string | null }> }}
 * @throws {RunnerConfigError} `inherit-source-unknown`, `inherit-source-open`, `inherit-guide-differs`,
 *   `inherit-request-differs`, `inherit-base-differs` or `inherit-nothing`
 */
export function inheritFrom({ mainRoot, fromCaseId, guide, guideSha256, requestDigest, baseCommit }) {
  // The four conditions are read off the ledger's own events; the digests a full projection takes of a
  // case's reports are computed only for a case that passed all four.
  let events;
  try {
    events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: fromCaseId });
  } catch {
    throw refuse('inherit-source-unknown', `names case "${fromCaseId}", which does not exist`);
  }
  const opened = events.find((e) => e.type === 'case.opened')?.payload;
  if (!opened) throw refuse('inherit-source-unknown', `names case "${fromCaseId}", which does not exist`);
  if (!events.some((e) => e.type === 'case.closed')) throw refuse('inherit-source-open', `case "${fromCaseId}" is still open; close it first, so what it reached is final`);
  if (opened.guide?.sha256 !== guideSha256) throw refuse('inherit-guide-differs', `case "${fromCaseId}" ran another guide or another version of it`);
  if (opened.requestDigest !== requestDigest) throw refuse('inherit-request-differs', `case "${fromCaseId}" served another request`);
  if (!baseCommit || opened.baseCommit !== baseCommit) {
    throw refuse('inherit-base-differs', `case "${fromCaseId}" started on ${opened.baseCommit ?? 'an unrecorded commit'}, this one starts on ${baseCommit ?? 'no commit'}`);
  }
  const { projection } = readCaseProjection(mainRoot, fromCaseId);
  const milestones = inheritableMilestones(guide)
    .map((id) => ({ id, entry: projection.milestones[id] }))
    .filter(({ entry }) => entry?.state === 'achieved' && entry.digest)
    .map(({ id, entry }) => ({ milestone: id, subjectDigest: entry.digest, receipts: entry.receipts ?? [], outcome: entry.outcome ?? null }));
  if (milestones.length === 0) throw refuse('inherit-nothing', `case "${fromCaseId}" reached no milestone that may be taken over`);
  return { fromCase: fromCaseId, baseCommit, requestDigest, milestones };
}
