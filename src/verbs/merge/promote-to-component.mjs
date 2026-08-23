// promote-to-component.mjs — use case behind
// `fgos promote-to-component --ids a,b,c`.
//
// tsk-3gx-3: Layer 2 action — takes N flat sibling item ids (D2: caller's
// own explicit list, this verb only light-validates, never infers
// grouping), resolves/creates the shared root (D1), retargets each
// member via tsk-3gx-2's engine (gated per member by tsk-3gx-1's
// read-only preflight), and ONLY when a member's own real git merge
// truly succeeds does it set that member's `parent` — never on say-so,
// matching the item's own framing ("CHỈ khi git thành công thật mới set
// field parent"). Records one real decision summarizing every member's
// outcome.
import { listWork, addWork, editWork, addDecision, StoreError } from '../../state/store.mjs';
import { generateId } from '../../intake/classify.mjs';
import { isMainWorktree } from '../../runner/worktree.mjs';
import { resolveIntegrationBranch, retargetMember } from '../../runner/promote-engine.mjs';

/**
 * @param {{dir: string, repoRoot: string}} ctx
 * @param {{ids: string[], rootId: string|undefined, rootTitle: string|undefined, timeoutMs: number|undefined}} options
 */
export async function promoteToComponentUseCase({ dir, repoRoot }, { ids, rootId: rootIdOption, rootTitle, timeoutMs }) {
  if (!isMainWorktree(repoRoot)) {
    throw new StoreError(
      'validation',
      `promote-to-component: refusing to run from "${repoRoot}" — this must run from the main checkout, which a linked worktree structurally is not.`,
    );
  }

  const view = listWork(dir);
  for (const id of ids) {
    const member = view.work[id];
    if (!member) {
      throw new StoreError('validation', `promote-to-component: work "${id}" not found.`);
    }
    if (member.parent) {
      throw new StoreError('validation', `promote-to-component: "${id}" already has parent "${member.parent}" — only flat items (no parent yet) can be promoted.`);
    }
  }
  // D2 light validation: the given ids must form one connected set via
  // deps/mergeAfter (undirected) — never re-deriving WHICH items belong
  // together (that judgment stays outside this action), only confirming
  // the caller's own claim is at least internally consistent.
  const idSet = new Set(ids);
  const adjacency = new Map(ids.map((id) => [id, new Set()]));
  for (const id of ids) {
    const member = view.work[id];
    for (const other of [...(member.deps ?? []), ...(member.mergeAfter ?? [])]) {
      if (idSet.has(other)) {
        adjacency.get(id).add(other);
        adjacency.get(other).add(id);
      }
    }
  }
  const visited = new Set([ids[0]]);
  const queue = [ids[0]];
  while (queue.length > 0) {
    const current = queue.pop();
    for (const neighbor of adjacency.get(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  if (visited.size !== ids.length) {
    throw new StoreError(
      'validation',
      `promote-to-component: ids [${ids.join(', ')}] are not all connected via deps/mergeAfter — not one component.`,
    );
  }

  // D1: reuse an existing member as root (caller-designated via
  // --root-id), or create a fresh milestone-style root item (requires
  // --root-title) — both allowed, caller's choice.
  let rootId = rootIdOption;
  let rootCreated = false;
  if (rootId !== undefined) {
    if (!view.work[rootId]) {
      throw new StoreError('validation', `promote-to-component: --root-id "${rootId}" not found.`);
    }
  } else {
    // Same refusal `requireField` produces in the adapter for every other
    // flag: absent, empty, or bare (parsed as boolean `true`) all mean "no
    // value given" and are a validation error, never passed downstream.
    if (rootTitle === undefined || rootTitle === null || rootTitle === '' || rootTitle === true) {
      throw new StoreError('validation', 'promote-to-component requires --root-id (an existing member to promote) or --root-title (to create a fresh root item).');
    }
    rootId = generateId(rootTitle, Object.keys(view.work));
    // A freshly created root is a pure milestone-style grouping item
    // (tsk-5t3a precedent, no code of its own) — 'light'/'true' mirror
    // that precedent's own minimal, trivially-true shape. 'light' is the
    // floor of coding's declared `risk` vocabulary (DOMAINS.coding's
    // `classification`), the same three values decompose.mjs's heavy-risk
    // gate and priority-formula.mjs's RISK_DISCOUNTS already read.
    addWork(dir, { id: rootId, title: rootTitle, kind: 'feature', status: 'todo', deps: [], refs: [], risk: 'light', verify: 'true' });
    rootCreated = true;
  }

  resolveIntegrationBranch(repoRoot, rootId);

  const results = [];
  for (const id of ids) {
    if (id === rootId) {
      results.push({ id, outcome: 'skipped', reason: 'is-root' });
      continue;
    }
    const member = view.work[id];
    const outcome = await retargetMember(repoRoot, member, rootId, timeoutMs ? { timeoutMs } : {});
    if (outcome.outcome === 'merged') {
      // The real git merge already landed at this point — a rejection
      // here (e.g. a deps+parent graph cycle assertNoUnifiedCycle
      // catches) means the bookkeeping half of "CHỈ khi git thành công
      // thật mới set field parent" failed even though the git half
      // truly succeeded. Report that distinctly rather than either
      // claiming a clean 'merged' or letting the exception abort every
      // remaining member's own processing.
      try {
        editWork(dir, { id, patch: { parent: rootId } });
        results.push(outcome);
      } catch (err) {
        results.push({ id, outcome: 'merged-parent-rejected', reason: err.message });
      }
    } else {
      results.push(outcome);
    }
  }

  const merged = results.filter((r) => r.outcome === 'merged').map((r) => r.id);
  const notMerged = results.filter((r) => r.outcome !== 'merged' && r.outcome !== 'skipped');
  const { event } = addDecision(dir, {
    text: `promote-to-component: root "${rootId}"${rootCreated ? ' (newly created)' : ' (existing member promoted)'} — merged [${merged.join(', ') || 'none'}]${notMerged.length > 0 ? `, not merged: ${notMerged.map((r) => `${r.id} (${r.reason})`).join(', ')}` : ''}`,
    rationale: 'fgos promote-to-component — converges flat siblings into one component before merging to main, per docs/history/promote-to-component/CONTEXT.md',
    id: rootId,
    // Same reasoning as sync-root's own record above: converging
    // siblings into a component is machinery, so this must not read as
    // reflection at the retrospective gate.
    kind: 'engine',
  });

  return { rootId, rootCreated, results, seq: event.seq };
}
