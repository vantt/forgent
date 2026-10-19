// workflow-case-checks.mjs — doctor checks and the repair of the worktree binding records of Workflow cases
// (docs/specs/workflow.md RUL-WF-27). Bodies live here; `registrations.mjs` registers them.
//
// The ledger is the truth (L3); a binding record is a view of it. The check reads every record and every
// ledger that has a `binding` event and says where they disagree; the fix settles what a crash left
// (commits a pending record whose event exists, removes one with none), writes the sentinel that marks
// the directory as the real one, and rebuilds a missing record of an open case from its ledger.

import fs from 'node:fs';
import path from 'node:path';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import {
  bindingsDir,
  bindingKeyOf,
  commitBinding,
  createPendingBinding,
  ensureBindingsSentinel,
  listBindingRecords,
  repairCaseBindings,
  SENTINEL_NAME,
} from '../workflow/case-bindings.mjs';
import { tryAcquireAdvanceLock } from '../workflow/case-lock.mjs';
import { projectCase } from '../workflow/case-projection.mjs';
import { readWorkflowEvents } from '../workflow/store.mjs';

const MAX_LISTED = 5;

function rootOf(cwd) {
  return resolveMainCheckoutRoot(cwd) ?? cwd;
}

/** Cases whose ledger has a `binding` event: `{ caseId, events }`. A ledger that cannot be read is reported, not skipped. */
function casesWithBindings(root) {
  const runsDir = path.join(root, '.fgos', 'workflow-runs');
  if (!fs.existsSync(runsDir)) return { cases: [], unreadable: [] };
  const cases = [];
  const unreadable = [];
  for (const name of fs.readdirSync(runsDir)) {
    if (name.startsWith('.') || !fs.statSync(path.join(runsDir, name)).isDirectory()) continue;
    try {
      const events = readWorkflowEvents({ repoRoot: root, workflowRunId: name });
      if (events.some((e) => e.type === 'binding')) cases.push({ caseId: name, events });
    } catch (err) {
      unreadable.push(`${name}: ${err.message}`);
    }
  }
  return { cases, unreadable };
}

/** The bindings a ledger says are held now, by identity key: the last `binding` event of each key. */
function boundByLedger(events, caseId) {
  const latest = new Map();
  for (const e of events) if (e.type === 'binding' && e.payload?.caseId === caseId) latest.set(e.payload.key ?? e.payload.worktreeRoot, e.payload);
  return [...latest.values()].filter((b) => b.state === 'bound');
}

const listed = (items) => (items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join('; ')}; and ${items.length - MAX_LISTED} more` : items.join('; '));

/** Doctor check `workflow-case-binding-sentinel`: a bindings directory carries the host's sentinel. */
export function checkWorkflowCaseBindingSentinel(cwd) {
  const dir = bindingsDir(rootOf(cwd));
  if (!fs.existsSync(dir)) return { passed: true, message: 'info: no worktree has been bound by a Workflow case here' };
  if (!fs.existsSync(path.join(dir, SENTINEL_NAME))) {
    return { passed: false, message: `${dir} has no ${SENTINEL_NAME} sentinel, so a reader cannot tell it from a masked view; run fgos doctor --fix` };
  }
  return { passed: true, message: 'bindings directory is marked as the real one' };
}

/** Doctor check `workflow-case-bindings`: every binding record matches the ledger of its case, and the other way round. */
export function checkWorkflowCaseBindings(cwd) {
  const root = rootOf(cwd);
  const problems = [];
  const { cases, unreadable } = casesWithBindings(root);
  for (const item of unreadable) problems.push(`ledger unreadable (${item})`);
  const byCase = new Map(cases.map((c) => [c.caseId, c]));

  for (const { key, record } of listBindingRecords(root)) {
    if (!record) { problems.push(`record ${key} does not parse (binding-unsettled)`); continue; }
    if (record.state !== 'committed') { problems.push(`record ${key} of case ${record.caseId} is ${record.state} (binding-unsettled)`); continue; }
    const owner = byCase.get(record.caseId);
    const projection = owner ? projectCase(owner.events) : null;
    const held = owner ? boundByLedger(owner.events, record.caseId).some((b) => b.generation === record.generation && (b.key ?? b.worktreeRoot) === key) : false;
    if (!owner || !held) problems.push(`record ${key} names case ${record.caseId} generation ${record.generation}, which its ledger does not show as bound`);
    else if (!projection.open) problems.push(`record ${key} belongs to closed case ${record.caseId} and is still held; unbind it once the attempt is quiet`);
  }

  const files = new Set(listBindingRecords(root).map((r) => r.key));
  for (const { caseId, events } of cases) {
    if (!projectCase(events).open) continue;
    for (const b of boundByLedger(events, caseId)) {
      if (!files.has(b.key ?? '')) problems.push(`case ${caseId} is bound to ${b.worktreeRoot} on its ledger but has no record; run fgos doctor --fix`);
    }
  }
  return problems.length === 0
    ? { passed: true, message: `${files.size} binding record(s) match their ledgers` }
    : { passed: false, message: listed(problems) };
}

/** Fix `workflow-case-bindings`: sentinel, crash leftovers, missing records rebuilt from open cases' ledgers. */
export function fixWorkflowCaseBindings(cwd) {
  const root = rootOf(cwd);
  const actions = [];
  if (fs.existsSync(bindingsDir(root)) && !fs.existsSync(path.join(bindingsDir(root), SENTINEL_NAME)) && ensureBindingsSentinel(root)) actions.push('wrote the sentinel');
  const { cases } = casesWithBindings(root);
  for (const { caseId } of cases) {
    // A binder that is alive holds `advance`; settling a record under it would race that binder.
    const hold = tryAcquireAdvanceLock(root, caseId);
    if (hold === null) { actions.push(`skipped ${caseId}: its advance lock is held`); continue; }
    try {
      for (const done of repairCaseBindings({ mainRoot: root, caseId })) actions.push(`${done.action} record ${done.key}`);
      const events = readWorkflowEvents({ repoRoot: root, workflowRunId: caseId });
      if (!projectCase(events).open) continue;
      const existing = new Set(listBindingRecords(root).map((r) => r.key));
      for (const b of boundByLedger(events, caseId)) {
        if (existing.has(b.key) || !fs.existsSync(b.worktreeRoot) || bindingKeyOf(b.worktreeRoot) !== b.key) continue;
        const made = createPendingBinding({ mainRoot: root, caseId, generation: b.generation, worktree: b.worktreeRoot, commonDir: b.commonDir ?? null, ref: b.ref ?? null });
        if (made.created && commitBinding({ mainRoot: root, key: made.key, caseId, generation: b.generation }).committed) actions.push(`rebuilt record ${made.key}`);
      }
    } finally {
      hold.release();
    }
  }
  return { changed: actions.length > 0, message: actions.length > 0 ? actions.join('; ') : 'no binding record needed repair' };
}
