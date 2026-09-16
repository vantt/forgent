import { editWork, addDecision, StoreError } from '../../state/store.mjs';

export const EDIT_EMPTY_PATCH_MESSAGE =
  'edit requires at least one field to change: --title/--description/--kind/--risk/--verify/--tier/--refs/--deps/--footprint/--acceptance/--priority/--intent/--docs-ref/--parent/--urgent/--impact/--effort/--merge-after/--superseded-by/--duplicates/--domain-fields/--verify-from-children/--verify-from-targets.';

export function editUseCase({ dir }, { id, patch, role = 'human' }) {
  if (!patch || Object.keys(patch).length === 0) {
    throw new StoreError('validation', EDIT_EMPTY_PATCH_MESSAGE);
  }
  if (role !== 'human' && role !== 'session') {
    throw new StoreError('validation', `edit --role must be "human" or "session" (got "${role}").`);
  }
  const { event } = editWork(dir, { id, patch, role });
  if (patch.priority !== undefined) {
    addDecision(dir, {
      id,
      text: `priority set to ${patch.priority} via edit --priority`,
      source: 'edit',
      kind: 'priority-override',
      rationale: "tsk-sq9: mark this as a human override so plan.mjs's refined pass does not silently overwrite it",
    });
  }
  return { id, fields: Object.keys(patch), seq: event.seq };
}
