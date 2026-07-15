// envelope.mjs — fgos.v1 output envelope (contract C1, per architecture-map.md
// §7). Pure: no filesystem, no network, no knowledge of .fgos/.

import { createHash } from 'node:crypto';

const CONTRACT = 'fgos.v1';

/**
 * Wrap `data` in the fgos.v1 envelope: `{contract, generated_at, data_hash, data}`.
 * `data_hash` is the sha256 hex digest of `JSON.stringify(data)`, so a caller
 * can tell "did the data change?" without diffing the payload.
 */
export function wrapEnvelope(data) {
  const dataHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return {
    contract: CONTRACT,
    generated_at: new Date().toISOString(),
    data_hash: dataHash,
    data,
  };
}
