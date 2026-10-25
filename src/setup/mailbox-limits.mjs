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

/** The project's mailbox opt-in (spec §16 item 23, option (b); provisional until the
 * owner answers that item), as one of three outcomes:
 * - `{ state: 'on' }`: the effective `mailbox.enabled` is true;
 * - `{ state: 'off' }`: it is false or absent;
 * - `{ state: 'refused', reason, code, file }`: the Config door refused the project's config, so
 *   the opt-in is unknown. `reason` is `config:<code>`, the word the Rust mailbox names the same
 *   refusal by; `file` is the refused source as Config names it (`project:config.yaml`), or null.
 * Setup leaves the mailbox hook rows exactly as they are on a refusal: a broken file never
 * installs them and never removes them. A failure of the door itself is thrown. */
export function mailboxOptIn(repoRoot) {
  try {
    const on = readConfig({ projectRoot: repoRoot, sections: ['mailbox'] }).value.mailbox?.enabled === true;
    return { state: on ? 'on' : 'off' };
  } catch (err) {
    if (!isConfigRefusal(err)) throw err;
    const file = err.refusals.find((r) => r.file)?.file ?? null;
    return { state: 'refused', reason: `config:${err.code}`, code: err.code, file };
  }
}

/** The refused config of a refused opt-in, as a person reads it: the scope Config names in
 * `file` (`project:config.yaml` is the project config, `global:config.yaml` the global one). */
export function refusedConfigName(optIn) {
  const scope = optIn.file?.split(':')[0];
  return scope === 'project' || scope === 'global' ? `the ${scope} config` : 'a config file';
}

/** The line setup prints for a refused opt-in: the reason word and the refused file. */
export function mailboxRefusalLine(optIn) {
  return `mailbox hook rows left as they are: ${optIn.reason}${optIn.file ? ` in ${optIn.file}` : ''} (${refusedConfigName(optIn)} is refused, so the opt-in is unknown)`;
}
