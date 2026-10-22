// mailbox-limits.mjs — the one Node reader of the mailbox's limits contract
// (packages/mailbox/contracts/limits.v1.json, docs/platform/agent-mailbox/spec.md §12),
// for setup: the hook rows' timeout, and whether the project opted in to the
// hook rows. The Rust loader embeds the same file; setup copies none of its
// values into the project config.

import { readFileSync } from 'node:fs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';

const LIMITS_CONTRACT = new URL('../../packages/mailbox/contracts/limits.v1.json', import.meta.url);

function contractKeys() {
  return JSON.parse(readFileSync(LIMITS_CONTRACT, 'utf8')).keys;
}

/** Seconds a CLI should allow one mailbox hook call before it cuts it: the
 * hook's own failure ceiling (`mailbox.hook.budgetMs`), rounded up, plus two
 * seconds, so the CLI never kills the hook before its own watchdog does. */
export function mailboxHookTimeoutSec() {
  const budget = contractKeys().find((k) => k.key === 'mailbox.hook.budgetMs').default;
  return Math.ceil(budget / 1000) + 2;
}

/** Whether the project opted in to the mailbox hook rows: `mailbox.enabled` in its
 * .fgos/config.json (spec §16 item 23, option (b)). Provisional until the owner answers
 * that item: absent, false or an unreadable config means not enabled. */
export function mailboxEnabled(repoRoot) {
  return readSharedConfigOrEmpty(repoRoot)?.mailbox?.enabled === true;
}
