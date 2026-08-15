import type { ApiClient } from './client'

// D9 (docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md): the
// gateway has no SSE/WebSocket, only GET /state/digest's cheap-poll
// `data_hash` -- this helper is the poll-driven half of that pattern. A
// caller holds the returned digest and calls `poll` again on its own
// interval; `changed` tells it whether a full re-fetch of a read endpoint
// is worth doing.

export interface PollResult {
  dataHash: string
  changed: boolean
}

/**
 * Calls GET /state/digest once and compares against `previousDataHash`
 * (pass `undefined` on the first call -- always reports `changed: true`
 * then, since there is nothing to compare against yet).
 */
export async function pollStateDigest(client: ApiClient, previousDataHash?: string): Promise<PollResult> {
  const digest = await client.stateDigest()
  return {
    dataHash: digest.data_hash,
    changed: previousDataHash === undefined || digest.data_hash !== previousDataHash,
  }
}
