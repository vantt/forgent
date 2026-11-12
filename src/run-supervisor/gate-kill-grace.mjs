// `dispatch.gateKillGraceMs`: how long the gate waits between SIGTERM and SIGKILL when it stops an
// agent, and `dispatch.cancelWaitMs`: how long a controller asked to stop waits for the receipts of its
// attempts. The `dispatch` section schema owns the type, the minimum and the standard value of both; this
// module only reads the effective value through the config facade (project over global over standard).
// Setup never writes either key (an older release that does not know a key would refuse the whole file).

import path from 'node:path';
import { readConfig, readMachineConfig } from '../config/facade.mjs';

export const GATE_KILL_GRACE_KEY = 'dispatch.gateKillGraceMs';
export const CANCEL_WAIT_KEY = 'dispatch.cancelWaitMs';

/**
 * The `dispatch` section of the effective config with the layer of each key (`{ value, origins }`, as the
 * facade returns it). Without `projectRoot` it is the machine alone; `globalConfigPath` names a global
 * config file whose directory replaces `~/.fgos`. A config file the door refuses throws.
 */
export function readDispatchConfig({ projectRoot, globalConfigPath } = {}) {
  const options = { globalDir: globalConfigPath ? path.dirname(globalConfigPath) : undefined, sections: ['dispatch'], origins: ['dispatch'] };
  return projectRoot ? readConfig({ projectRoot, ...options }) : readMachineConfig(options);
}

/** `{ value, source }` of a `dispatch` key from a `readDispatchConfig` result; `source` is the layer that set it (`project`, `global` or `standard`). */
function dispatchSetting(snapshot, key) {
  const layer = snapshot.origins.find((origin) => origin.path === `dispatch.${key}`)?.layer;
  const value = snapshot.value?.dispatch?.[key];
  if (layer === undefined || value === undefined) throw new Error(`the config door returned no value for dispatch.${key}`);
  return { value, source: layer };
}

/** The grace and where it came from, from a `readDispatchConfig` result. */
export const resolveGateKillGrace = (snapshot) => dispatchSetting(snapshot, 'gateKillGraceMs');

/** The cancel wait and where it came from, from a `readDispatchConfig` result. */
export const resolveCancelWait = (snapshot) => dispatchSetting(snapshot, 'cancelWaitMs');

/** The grace for the project at `projectRoot`; a config file the door refuses throws the door's refusal. */
export const readGateKillGraceMs = ({ projectRoot } = {}) => resolveGateKillGrace(readDispatchConfig({ projectRoot })).value;

/** `dispatch.cancelWaitMs` of the project rooted at `projectRoot`; a config file the door refuses throws the door's refusal. */
export const readCancelWaitMs = ({ projectRoot } = {}) => resolveCancelWait(readDispatchConfig({ projectRoot })).value;
