// mailbox-limits.mjs — the one Node reader of the mailbox's config section
// (docs/platform/agent-mailbox/spec.md §12), for setup: the hook rows' timeout,
// and whether the project opted in to the hook rows. Both read through the Config
// door (src/config/facade.mjs); setup copies no value into the project config.

import { isConfigRefusal, readConfig, readStandardValue } from '../config/facade.mjs';

/** Seconds a CLI should allow one mailbox hook call before it cuts it: the
 * hook's own failure ceiling (`mailbox.hook.budgetMs`, the bundled standard's
 * value), rounded up, plus two seconds, so the CLI never kills the hook before
 * its own watchdog does. */
export function mailboxHookTimeoutSec() {
  const { present, value } = readStandardValue('mailbox.hook.budgetMs');
  if (!present || !Number.isInteger(value)) throw new Error('mailbox.hook.budgetMs is missing from the bundled config standard');
  return Math.ceil(value / 1000) + 2;
}

/** Whether the project opted in to the mailbox hook rows: the effective
 * `mailbox.enabled` (spec §16 item 23, option (b)). Provisional until the owner
 * answers that item: false, or a project config the Config door refuses, means
 * not enabled, so a broken file never installs hook rows; a failure of the door
 * itself is thrown. */
export function mailboxEnabled(repoRoot) {
  try {
    return readConfig({ projectRoot: repoRoot, sections: ['mailbox'] }).value.mailbox?.enabled === true;
  } catch (err) {
    if (isConfigRefusal(err)) return false;
    throw err;
  }
}
