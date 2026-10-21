// process-identity.mjs — the thin Node client of process facts. Every judgement, observation and signal is the
// Rust crate's (`packages/process/rust`, vectors `packages/process/contracts/process-facts.judge.v1.json`),
// reached through the in-process door (`src/native/door.mjs`). No /proc read, no cache, no JS fallback.
import { nativeDoor } from '../../native/door.mjs';

const NAMED = { 'git-addon-unavailable': 'process-door-unavailable', 'git-addon-not-shipped': 'process-door-not-shipped' };
function facts() {
  try { return nativeDoor().process; } catch (err) {
    const code = NAMED[err.code];
    if (!code) throw err;
    const cause = code === 'process-door-not-shipped' ? 'onboard this project with fgctl init' : err.message.replace(/^git-addon-unavailable: /, '');
    throw Object.assign(new Error(`${code}: ${cause}`), { code, cause: err });
  }
}

/** 'alive' | 'dead' | 'unknown' for a recorded `{host?, bootId?, pidNs?, pid, startTime}`. */
export const judge = (record) => facts().judge(record);
/** One look at `pid`: `{kind: 'live', host, bootId?, pidNs, pid, startTime}` (a full identity) | `{kind: 'absent' | 'zombie'}` | `{kind: 'unreadable', cause}`. */
export const observe = (pid) => facts().observe(pid);
/** This process's identity `{host, bootId?, pidNs, pid, startTime}`. */
export const selfRecord = () => facts().selfRecord();
/** Signal ('term' | 'kill' | 'int') the process `record` names, only if it is still that process. */
export const signalByIdentity = (record, signal) => facts().signalByIdentity(record, signal);
/** Every live process with `{pid, tuple, exe, cwd, cmdline, env, unreadable}`, or 'unsupported'. */
export const scan = (filter) => facts().scan(filter);
/** 'dead' only when the judge proves it; alive and unknown are both 'held' (a record this observer cannot disprove is never reclaimed). */
export const resolveHolderLiveness = (record) => (judge(record) === 'dead' ? 'dead' : 'held');

// Legacy names, forwarders until their last importer moves to the exports above.
export const getBootId = () => selfRecord().bootId ?? 'unknown-boot';
export const getProcessStartTime = (pid) => { const seen = observe(pid); return seen.kind === 'live' ? seen.startTime : null; };
export const getPidNs = () => selfRecord().pidNs;
export const pidExists = (pid) => observe(pid).kind !== 'absent';
export const localObserver = selfRecord;
export const observeProcess = (pid) => observe(pid);
