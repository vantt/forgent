// mailbox-limits.mjs — the one Node reader of the mailbox's limits contract
// (packages/mailbox/contracts/limits.v1.json, docs/platform/agent-mailbox/spec.md §12),
// for the two setup consumers: the config section `fgos setup` registers, and
// the hook rows' timeout. The Rust loader embeds the same file; the committed
// fixture packages/mailbox/contracts/fixtures/config/mailbox-section.v1.json
// is the one drift proof between the two readers.

import { readFileSync } from 'node:fs';

const LIMITS_CONTRACT = new URL('../../packages/mailbox/contracts/limits.v1.json', import.meta.url);

/** The readers whose keys reach the mailbox's Rust limits; a `harness` key is
 * measured outside the product and never configured. */
const PRODUCT_READERS = new Set(['core', 'hook']);

function contractKeys() {
  return JSON.parse(readFileSync(LIMITS_CONTRACT, 'utf8')).keys;
}

/** The `mailbox` config section with every product key at its contract
 * default, nested by its dotted name below `mailbox`. */
export function mailboxConfigShape() {
  const section = {};
  for (const entry of contractKeys().filter((k) => PRODUCT_READERS.has(k.reader))) {
    const parts = entry.key.split('.').slice(1);
    let node = section;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = entry.default;
  }
  return section;
}

/** Seconds a CLI should allow one mailbox hook call before it cuts it: the
 * hook's own failure ceiling (`mailbox.hook.budgetMs`), rounded up, plus two
 * seconds, so the CLI never kills the hook before its own watchdog does. */
export function mailboxHookTimeoutSec() {
  const budget = contractKeys().find((k) => k.key === 'mailbox.hook.budgetMs').default;
  return Math.ceil(budget / 1000) + 2;
}
