#!/usr/bin/env node
// herdr-cockpit-notify.mjs — the "dashboard + attention" pane of the herdr
// operator cockpit (P40/D d3dbe7f5): polls the real fgOS CLI (`fgos list
// --json`, an external process — this file never imports src/state or
// src/runner directly, same chrome-only boundary the whole cockpit keeps)
// and fires exactly one native `herdr notification show` the first time an
// item is observed in `awaiting-human`.
//
// HARD RULE (D d3dbe7f5): this file must never call herdr's agent-detection
// API (`herdr agent start`, any `agent_status`/`--source detection` read).
// Every real status signal comes from fgOS's own event log via `fgos list`.

import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Pure: given the set of ids currently believed to be `awaiting-human`
 * (from the PREVIOUS poll) and this poll's work items, returns which ids are
 * newly awaiting-human (never notified about while continuously in that
 * status) and the full current awaiting-human id set. The caller REPLACES
 * its seen-set with `currentAwaitingHumanIds` every cycle — an item that
 * leaves `awaiting-human` and later re-enters it is treated as new again.
 */
export function detectNewAwaitingHuman(previouslySeenIds, items) {
  const seen = previouslySeenIds instanceof Set ? previouslySeenIds : new Set(previouslySeenIds ?? []);
  const currentAwaitingHumanIds = new Set(items.filter((item) => item.status === 'awaiting-human').map((item) => item.id));
  const newlyAwaiting = [...currentAwaitingHumanIds].filter((id) => !seen.has(id));
  return { newlyAwaiting, currentAwaitingHumanIds };
}

/** Pure: one compact status line — counts per status, only non-zero shown. */
export function formatStatusLine(items) {
  const counts = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  const parts = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}=${count}`);
  const time = new Date().toLocaleTimeString();
  return parts.length ? `[${time}] ${parts.join(' ')}` : `[${time}] (no items)`;
}

function pollOnce(repoRoot) {
  const result = spawnSync(process.execPath, [path.join(repoRoot, 'bin', 'fgos.mjs'), 'list', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0 || !result.stdout) {
    throw new Error(`fgos list --json failed (status ${result.status}): ${result.stderr}`);
  }
  const parsed = JSON.parse(result.stdout);
  return Object.values(parsed.data.work ?? {});
}

function notify(id, item) {
  try {
    spawnSync('herdr', [
      'notification', 'show', 'fgOS: cần bạn',
      '--body', `${id}: ${item.title}`,
      '--sound', 'request',
    ]);
  } catch (err) {
    // observability must never crash the dashboard pane
    console.error(`herdr-cockpit-notify: notification failed for "${id}": ${err.message}`);
  }
}

async function runLoop({ repoRoot, intervalMs }) {
  let seenIds = new Set();
  for (;;) {
    try {
      const items = pollOnce(repoRoot);
      console.log(formatStatusLine(items));
      const { newlyAwaiting, currentAwaitingHumanIds } = detectNewAwaitingHuman(seenIds, items);
      seenIds = currentAwaitingHumanIds;
      const byId = new Map(items.map((item) => [item.id, item]));
      for (const id of newlyAwaiting) notify(id, byId.get(id));
    } catch (err) {
      console.error(`herdr-cockpit-notify: poll failed: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

function parseIntervalSeconds(argv) {
  const idx = argv.indexOf('--interval');
  const value = idx >= 0 ? Number(argv[idx + 1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : 5;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const intervalSeconds = parseIntervalSeconds(process.argv.slice(2));
  const repoRoot = path.resolve(import.meta.dirname, '..');
  runLoop({ repoRoot, intervalMs: intervalSeconds * 1000 });
}
