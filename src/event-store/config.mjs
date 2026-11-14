import path from 'node:path';
import { ConfigDoorError, isConfigRefusal, readEventStoreSection, validateEventStoreSection } from '../config/facade.mjs';

// The Event Store config section is read and validated by the config crate (its minimums, its defaults from the bundled
// standard, its refusal rule); the two functions below keep their signatures and error shape for every caller.
/** `event-store-config`: the one error code of a config that breaks the section's rules or is refused. */
function configError(error) {
  if (!(error instanceof ConfigDoorError) || !isConfigRefusal(error)) return error;
  const [first] = error.refusals;
  const message = first.id === 'event-store-config' ? `event-store-config: invalid ${first.keyword}` : `event-store-config: ${error.message}`;
  return Object.assign(new Error(message), { code: 'event-store-config' });
}
/** The door's answer as plain objects, in the order every caller has always seen the keys. */
const plain = ({ seal, sync, rebuild, remote }) => ({ seal: { ...seal }, sync: { ...sync }, rebuild: { ...rebuild }, remote });
/** The section of `config.eventStore` (every key set) over the bundled standard; throws `event-store-config` for a value that breaks a rule. */
export function eventStoreConfig(config = {}) {
  try {
    return plain(validateEventStoreSection(config));
  } catch (error) {
    throw configError(error);
  }
}
/**
 * The Event Store config of the project at `root`, read through the config door; `globalConfigPath` names a global config
 * file whose directory replaces `~/.fgos`.
 *
 * A refused config file never yields the defaults for a publish decision: a caller that reports on or acts for the user
 * (`strict`: the `events` verbs, doctor) gets the `event-store-config` error with the door's message; any other caller (the
 * write path and the lifecycle triggers) gets a config that never pushes (`sync.intervalSec` 0) when the refusal is not
 * about the `eventStore` section. A refusal that names an `eventStore` value throws for every caller. The rule itself is
 * the config crate's.
 */
export function readEventStoreConfig(root, globalConfigPath, { strict = false } = {}) {
  const globalDir = globalConfigPath ? path.dirname(globalConfigPath) : undefined;
  try {
    return plain(readEventStoreSection({ projectRoot: root, globalDir, strict }));
  } catch (error) {
    throw configError(error);
  }
}
