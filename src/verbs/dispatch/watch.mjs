// watch.mjs -- follow a dispatch Run while somebody else drives it.
//
// The whole point of this door is that the process running it is NOT the
// actor. A run has one driver and any number of watchers, and a watcher
// needs no permission from the driver because it changes nothing: it reads
// the same files the driver writes, and it holds no lease.
//
// Like `show-run`, this is read-only by construction rather than by promise.
// It imports no herdr client and no adapter, so there is no code path from
// here to `agent prompt`, `send-text` or `send-keys` -- not a rule anyone has
// to remember, just an absence.

import fs from 'node:fs';
import path from 'node:path';
import { findRunDir, readRunSnapshot, DispatchObserveError } from './show-run.mjs';

/** How often to look, when the caller does not say. */
export const DEFAULT_WATCH_INTERVAL_MS = 1000;

/** A run in any of these has stopped; there is nothing further to watch. */
const TERMINAL_RUN_STATUSES = Object.freeze(['settled', 'died', 'unknown']);

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** The last few lines the worker's own log has reached, for a person who
 * wants to see movement rather than just a status word. Best-effort: a log
 * that does not exist yet is not a problem worth reporting. */
export function tailLog(runDir, { lines = 5, file = 'stdout.log' } = {}) {
  const full = path.join(runDir, file);
  let text = '';
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch {
    return [];
  }
  return text.split(/\r?\n/).filter(Boolean).slice(-lines);
}

/**
 * Watch until the run stops, the tick budget runs out, or `signal` aborts.
 *
 * `maxTicks` exists so this is bounded in a test and in any automated caller;
 * a person at a terminal leaves it unset and stops it themselves. `onTick`
 * receives each reading -- the default writes one line to stderr, so the
 * returned value stays a clean final snapshot rather than a transcript.
 */
export async function watchRunUseCase(ctx, {
  runId,
  intervalMs = DEFAULT_WATCH_INTERVAL_MS,
  maxTicks = Infinity,
  tailLines = 5,
  onTick,
  signal,
  sleepFn = sleep,
} = {}) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new DispatchObserveError('invalid-run-id', 'dispatch watch requires a runId');
  }
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  const runDir = findRunDir(repoRoot, runId);
  if (!runDir) {
    throw new DispatchObserveError('run-not-found', `no run "${runId}" under ${repoRoot}`, { runId, repoRoot });
  }

  const emit = onTick ?? ((tick) => {
    const where = tick.visibility?.paneId ? ` pane=${tick.visibility.paneId}` : '';
    process.stderr.write(
      `fgos: run=${runId} status=${tick.run.status}${where} visibility=${tick.visibility?.status ?? 'none'} outbox=${tick.outbox.length}\n`,
    );
  });

  let ticks = 0;
  let snapshot = null;
  let stoppedBecause = 'terminal';

  for (;;) {
    snapshot = { ...readRunSnapshot(runDir), tail: tailLog(runDir, { lines: tailLines }) };
    ticks += 1;
    emit(snapshot);

    if (TERMINAL_RUN_STATUSES.includes(snapshot.run.status)) break;
    if (ticks >= maxTicks) { stoppedBecause = 'tick-budget'; break; }
    if (signal?.aborted) { stoppedBecause = 'aborted'; break; }

    await sleepFn(intervalMs);
  }

  // A watcher stopping is not a run ending, and this says which happened.
  return { runId, ticks, stoppedBecause, ...snapshot };
}
