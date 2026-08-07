#!/usr/bin/env node
// verify-fanout-overlap.mjs — D10 (docs/history/execution-fanout/CONTEXT.md):
// proves REAL execution fan-out happened, not just that the fgos-fanout
// skill file exists. Finds a parent that decomposed into >=2 children with
// mutually disjoint declared footprints, where at least two of those
// children's `doing` windows genuinely overlap in wall-clock time, both
// reached `awaiting-approval`, and neither child was ever itself parked on
// a person (`awaiting-human`) along the way — only the parent/root's own
// gate is ever allowed to ask. Reads the real `.fgos/events.jsonl` (never
// synthetic data) plus the live work view for parent/footprint linkage.
//
// Exit 0 + a PASS line naming the real pair and the real overlap duration
// when found; exit 1 + a FAIL line explaining why when no such pair exists
// yet in this repo's own history. This is a proof-of-occurrence check, not
// a smoke test — a green run means fan-out genuinely happened at least
// once, not that the mechanism merely looks correct on paper.

import path from 'node:path';
import { readEvents } from '../src/state/events.mjs';
import { listWork } from '../src/state/store.mjs';
import { footprintOverlapAmong } from '../src/state/graph-metrics.mjs';

const repoRoot = process.argv[2] ?? process.cwd();
const dotFgosDir = path.join(repoRoot, '.fgos');

const view = listWork(dotFgosDir);
const rawEvents = readEvents(path.join(dotFgosDir, 'events.jsonl'));

// id -> ordered list of its own work.move events ({ from, to, ts })
const movesById = new Map();
for (const event of rawEvents) {
  if (event.type !== 'work.move') continue;
  const id = event.payload?.id;
  if (!id) continue;
  if (!movesById.has(id)) movesById.set(id, []);
  movesById.get(id).push({ from: event.payload.from, to: event.payload.to, ts: event.ts });
}

// Every closed `doing` window for `id`: a `to: 'doing'` entry paired with
// whichever move next carries `from: 'doing'` (regardless of destination —
// the destination is checked separately by reachedAwaitingApproval below).
// A `doing` entry with no matching exit (still open at log's end, or the
// item was reclaimed mid-`doing` with no logged exit) contributes no
// interval — an unclosed window is never counted as proof of overlap.
function doingIntervals(id) {
  const moves = movesById.get(id) ?? [];
  const intervals = [];
  let openStart = null;
  for (const move of moves) {
    if (move.to === 'doing') {
      openStart = move.ts;
    } else if (openStart !== null && move.from === 'doing') {
      intervals.push({ start: Date.parse(openStart), end: Date.parse(move.ts) });
      openStart = null;
    }
  }
  return intervals;
}

function reachedAwaitingApproval(id) {
  return (movesById.get(id) ?? []).some((move) => move.to === 'awaiting-approval');
}

function everParkedOnHuman(id) {
  return (movesById.get(id) ?? []).some((move) => move.to === 'awaiting-human');
}

function intervalsOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

// parentId -> its children (real `parent` linkage, live work view)
const childrenByParent = new Map();
for (const item of Object.values(view.work ?? {})) {
  if (!item.parent) continue;
  if (!childrenByParent.has(item.parent)) childrenByParent.set(item.parent, []);
  childrenByParent.get(item.parent).push(item);
}

let found = null;
for (const [parentId, children] of childrenByParent) {
  if (children.length < 2) continue;

  // Disjoint-footprint candidates only (D10 "footprint rời nhau"): a child
  // that conflicts with ANY sibling's declared footprint is excluded.
  const conflicts = footprintOverlapAmong(children);
  const conflicted = new Set();
  for (const conflict of conflicts) {
    conflicted.add(conflict.a);
    conflicted.add(conflict.b);
  }
  const disjointChildren = children.filter(
    (child) => !conflicted.has(child.id) && Array.isArray(child.footprint) && child.footprint.length > 0,
  );

  outer: for (let i = 0; i < disjointChildren.length; i += 1) {
    for (let j = i + 1; j < disjointChildren.length; j += 1) {
      const a = disjointChildren[i];
      const b = disjointChildren[j];
      if (!reachedAwaitingApproval(a.id) || !reachedAwaitingApproval(b.id)) continue;
      if (everParkedOnHuman(a.id) || everParkedOnHuman(b.id)) continue;

      for (const aInterval of doingIntervals(a.id)) {
        for (const bInterval of doingIntervals(b.id)) {
          if (!intervalsOverlap(aInterval, bInterval)) continue;
          const overlapMs = Math.min(aInterval.end, bInterval.end) - Math.max(aInterval.start, bInterval.start);
          found = { parentId, a: a.id, b: b.id, overlapMs };
          break outer;
        }
      }
    }
  }
  if (found) break;
}

if (!found) {
  console.error(
    'FAIL: no real fan-out overlap found in .fgos/events.jsonl -- no parent has >=2 disjoint-footprint '
      + 'children whose `doing` windows genuinely overlap in wall-clock time, both reaching '
      + 'awaiting-approval, with neither ever parked on a person.',
  );
  process.exit(1);
}

console.log(
  `PASS: ${found.a} and ${found.b} (children of ${found.parentId}) had genuinely overlapping `
    + `\`doing\` windows -- ${(found.overlapMs / 1000).toFixed(1)}s of real wall-clock overlap. Both `
    + 'reached awaiting-approval; neither was ever parked on a person.',
);
process.exit(0);
