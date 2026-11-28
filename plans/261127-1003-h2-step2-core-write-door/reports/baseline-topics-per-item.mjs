#!/usr/bin/env node
// Baseline for phase 6 step 1: new topics and doc slots per retrospective item.
// Usage: node baseline-topics-per-item.mjs <events-export-dir> [cutoffIso] > out.json
// Reads every *.jsonl under the export directory (one event per line: {type, ts, payload}).
//
// Attribution. The registry events carry no work-item id on topic.register or doc.reserve, and the
// 343 doc.register events are one bulk registration of existing files (sourceCaptureIds hold paths).
// The old retrospective writer opened a topic with topic.register + doc.reserve and then attested
// its item against that slot (doc.attest, captureId = item id). So a topic counts as opened by an
// item when the topic has a doc.reserve and the item is the first retrospective item (by its move
// to cleanup) whose doc.attest names that topic.
//
// Output: per calendar month of the retrospective -> cleanup move, and for the 30-day window
// before cutoffIso (default: the phase 4 land, 2026-11-27T19:38:51Z).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [dir, cutoffArg] = process.argv.slice(2);
if (!dir) {
  console.error('usage: baseline-topics-per-item.mjs <events-export-dir> [cutoffIso]');
  process.exit(2);
}
const cutoff = Date.parse(cutoffArg ?? '2026-11-27T19:38:51Z');
const start = cutoff - 30 * 24 * 3600 * 1000;

function* files(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (name.endsWith('.jsonl')) yield p;
  }
}

const events = [];
for (const f of files(dir)) {
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (typeof e.type !== 'string' || !e.payload) continue;
    events.push(e);
  }
}
const at = (e) => Date.parse(e.payload.at ?? e.ts ?? '');
const topicOf = (docId) => String(docId ?? '').split(':')[0];

const movedAt = new Map();
for (const e of events) {
  if (e.type === 'work.move' && e.payload.from === 'retrospective' && e.payload.to === 'cleanup') {
    movedAt.set(e.payload.id, at(e));
  }
}
const reserved = new Set(events.filter((e) => e.type === 'doc.reserve').map((e) => e.payload.topicId));
const registered = new Set(events.filter((e) => e.type === 'topic.register').map((e) => e.payload.topicId));

const attests = new Map(); // item -> { attests, handoffs, topics:Set }
const rec = (id) => attests.get(id) ?? attests.set(id, { attests: 0, handoffs: 0, topics: new Set() }).get(id);
for (const e of events) {
  const id = e.payload.captureId;
  if (!movedAt.has(id)) continue;
  if (e.type === 'doc.attest') {
    rec(id).attests += 1;
    rec(id).topics.add(topicOf(e.payload.docId));
  } else if (e.type === 'capture.handoff') {
    rec(id).handoffs += 1;
  }
}
const opener = new Map(); // topic -> first item
for (const id of [...attests.keys()].sort((a, b) => movedAt.get(a) - movedAt.get(b))) {
  for (const t of attests.get(id).topics) {
    if (reserved.has(t) && registered.has(t) && !opener.has(t)) opener.set(t, id);
  }
}
const openedBy = new Map();
for (const [t, id] of opener) openedBy.set(id, [...(openedBy.get(id) ?? []), t]);

const bucket = () => ({ items: 0, itemsAttested: 0, attests: 0, handoffs: 0, topicsOpened: 0, itemsOpeningATopic: 0 });
const add = (b, id) => {
  const r = attests.get(id);
  const n = (openedBy.get(id) ?? []).length;
  b.items += 1;
  if (r?.attests) b.itemsAttested += 1;
  b.attests += r?.attests ?? 0;
  b.handoffs += r?.handoffs ?? 0;
  b.topicsOpened += n;
  if (n) b.itemsOpeningATopic += 1;
};
const finish = (b) => ({ ...b, topicsPerItem: b.items ? +(b.topicsOpened / b.items).toFixed(3) : null,
  topicsPerAttestedItem: b.itemsAttested ? +(b.topicsOpened / b.itemsAttested).toFixed(3) : null });

const byMonth = {};
const win = bucket();
for (const [id, t] of movedAt) {
  const m = new Date(t).toISOString().slice(0, 7);
  add((byMonth[m] ??= bucket()), id);
  if (t >= start && t < cutoff) add(win, id);
}
const all = bucket();
for (const id of movedAt.keys()) add(all, id);

console.log(JSON.stringify({
  eventsRead: events.length,
  topicsWithReserve: reserved.size,
  topicsOpenedByARetrospectiveItem: opener.size,
  window: { from: new Date(start).toISOString(), to: new Date(cutoff).toISOString(), ...finish(win) },
  allTime: finish(all),
  byMonth: Object.fromEntries(Object.entries(byMonth).sort().map(([m, b]) => [m, finish(b)])),
  openedBy: Object.fromEntries(openedBy),
}, null, 2));
