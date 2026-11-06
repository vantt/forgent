// cleanup-trust: take back the codex or agy folder-trust entry the controller wrote into an agent's
// trust store before it launched the attempt, so the store does not grow one entry per attempt. The
// controller writes `controller/trust-context.json` only when it wrote such an entry itself; an entry a
// person vouched for is never named there and is never removed. A claude entry is never taken back
// (trust-store.mjs seedTrust): a record of one, left by an older release, is answered `not-removed`. The
// step runs after the receipt, while the supervisor or adopt holds the attempt lock, so it also runs when
// the controller is long gone. Removing an entry that is already gone is a success; a store that cannot
// be read or written keeps the entry, and the step says `remove-failed`.

import fs from 'node:fs';
import path from 'node:path';
import { removeAgyTrust, removeCodexTrust, TrustStoreError } from '../trust-store.mjs';

export const TRUST_CONTEXT_FILE = path.join('controller', 'trust-context.json');

function readContext(runDir) {
  try { return JSON.parse(fs.readFileSync(path.join(runDir, TRUST_CONTEXT_FILE), 'utf8')); } catch { return null; }
}

export async function cleanupTrust({ runDir }) {
  const context = readContext(runDir);
  if (!context) return { result: 'done', detail: { trust: 'none-written' } };
  const { kind, target, projectPath } = context;
  if (typeof kind !== 'string' || typeof target !== 'string' || typeof projectPath !== 'string') {
    return { result: 'done', detail: { trust: 'context-unusable' } };
  }
  let removed;
  try {
    if (kind === 'codex-toml') removed = removeCodexTrust(target, projectPath);
    else if (kind === 'agy' || kind === 'agy-json') removed = removeAgyTrust(target, projectPath);
    else return { result: 'done', detail: { trust: 'not-removed', kind } };
  } catch (err) {
    if (!(err instanceof TrustStoreError)) throw err;
    return { result: 'done', detail: { trust: 'remove-failed', kind, code: err.code } };
  }
  return { result: 'done', detail: { trust: removed ? 'removed' : 'already-gone', kind } };
}
