// reject.mjs — use case behind `fgos reject <id> --reason "..."`.
//
// The thinnest of the merge cluster; extracted anyway so a stranger finds
// every merge-cluster verb's real logic in one folder rather than six here
// and one still inline in the CLI adapter (tsk-49i D3/D4).
import { listWork, moveWork, StoreError } from '../../state/store.mjs';

/**
 * @param {{dir: string}} ctx - what the adapter resolved from the environment
 * @param {{id: string, reason: string}} options - already-parsed flags
 * @returns the `fgos.v1` data payload; the adapter wraps the envelope
 */
export function rejectUseCase({ dir }, { id, reason }) {
  const item = listWork(dir).work[id];
  if (!item) {
    throw new StoreError('validation', `reject: work "${id}" not found.`);
  }
  if (item.status !== 'awaiting-approval') {
    throw new StoreError('precondition', `reject: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to reject.`);
  }
  const { event } = moveWork(dir, { id, to: 'todo', expectedStatus: 'awaiting-approval', reason, role: 'human' });
  return { id, from: 'awaiting-approval', to: 'todo', reason, seq: event.seq };
}
