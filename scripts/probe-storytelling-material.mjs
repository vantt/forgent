#!/usr/bin/env node
// probe-storytelling-material.mjs — tsk-1hy: phép thử đọc-thuần gom + lọc
// chất liệu kể chuyện từ .fgos/events.jsonl thật, để biết vỉa đó có thật
// sự dùng được không trước khi cam kết bất kỳ kiến trúc nào
// (docs/history/storytelling-material-probe/CONTEXT.md D1-D9). Là phép
// thử, không phải tính năng — read-only: không ghi .fgos/, không thêm
// event type, không dùng schema store, không đăng ký vào bin/fgos.mjs.
//
// Gom hai vỉa độc lập (D3):
//   (a) event mang question/ask — work.move có payload.ask.
//   (b) decision có rationale xuất hiện đúng MỘT lần, sau khi loại bỏ
//       năm khuôn mẫu đã đo thật từ .fgos/events.jsonl (D4).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readEvents } from '../src/state/events.mjs';

// Cùng pattern `git rev-parse --git-common-dir` mà scripts/measure-verify-
// cost.mjs và scripts/verify-fanout-overlap.mjs đã dùng — verify command
// chạy được y nguyên dù cwd là main checkout hay worktree của item này
// (ADR0020: worktree không có `.fgos/` riêng).
function resolveMainCheckoutRoot() {
  const gitCommonDir = execFileSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { encoding: 'utf8' },
  ).trim();
  return path.dirname(gitCommonDir);
}

// Bốn khuôn mẫu văn bản đã đo thật (CONTEXT.md D4, đọc trực tiếp từ
// `.fgos/events.jsonl` ngày 2026-08-09) — literal exact match, không suy
// đoán. Khuôn mẫu thứ năm ("rỗng") không phải một chuỗi mà là rationale
// hoàn toàn vắng mặt trên event — xử lý riêng trong gatherDecisionVista.
export const BOILERPLATE_RATIONALES = [
  'tsk-27y D2: caller-supplied verdict — session already reasoned live (fgos-exploring), skipping judgeDiscovery subprocess and the readLockedContext trust-signal check',
  'tsk-27y D2/D3: caller-supplied verdict — session already reasoned live (fgos-planning), skipping judgeDecompose subprocess; downstream gates (heavy-risk/blast-radius/footprint-overlap) still apply unconditionally, same as a model verdict',
  'see CONTEXT.md for full scout evidence and reasoning',
  'see CONTEXT.md for the full scout evidence and reasoning',
];

/**
 * Vista (a): raw `work.move` events carrying a non-empty `payload.ask` —
 * the same field `src/state/replay.mjs` folds into `view.gates[id].ask`,
 * read here straight off the raw log instead (D2: this probe never reads
 * the replayed view).
 */
export function gatherAskVista(rawEvents) {
  const asks = [];
  for (const event of rawEvents) {
    if (event.type !== 'work.move') continue;
    const ask = event.payload?.ask;
    if (typeof ask !== 'string' || ask.trim() === '') continue;
    asks.push({ id: event.payload.id, ts: event.ts, ask: ask.trim() });
  }
  return asks;
}

/**
 * Vista (b): raw `decision` events whose `payload.rationale` text appears
 * exactly once across the whole log, after excluding the four named
 * boilerplate strings and the "missing rationale" case (D4). Returns both
 * the singleton list AND the before/after proof counts the item's own
 * acceptance criteria require.
 */
export function gatherDecisionVista(rawEvents) {
  const withRationale = [];
  let missingRationale = 0;

  for (const event of rawEvents) {
    if (event.type !== 'decision') continue;
    const rationale = event.payload?.rationale;
    if (typeof rationale !== 'string' || rationale.trim() === '') {
      missingRationale += 1;
      continue;
    }
    withRationale.push({
      id: event.payload?.id,
      ts: event.ts,
      text: event.payload?.text,
      rationale: rationale.trim(),
    });
  }

  const freq = new Map();
  for (const d of withRationale) {
    freq.set(d.rationale, (freq.get(d.rationale) ?? 0) + 1);
  }

  const boilerplateSet = new Set(BOILERPLATE_RATIONALES);
  const boilerplateCounts = {};
  for (const pattern of BOILERPLATE_RATIONALES) {
    boilerplateCounts[pattern] = freq.get(pattern) ?? 0;
  }
  boilerplateCounts['(missing rationale)'] = missingRationale;

  const singletons = withRationale.filter(
    (d) => freq.get(d.rationale) === 1 && !boilerplateSet.has(d.rationale),
  );

  return {
    totalDecisionEvents: withRationale.length + missingRationale,
    totalWithRationale: withRationale.length,
    distinctRationaleCount: freq.size,
    boilerplateCounts,
    singletons,
  };
}

/** Groups a list of `{id, ...}` records by their `id` field, readable order. */
export function groupById(items) {
  const byId = new Map();
  for (const item of items) {
    const id = item.id ?? '(no id)';
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(item);
  }
  return byId;
}

function formatVistaA(askVista) {
  const lines = [`--- Vista (a): ask/question events (${askVista.length} total) ---`, ''];
  const byId = groupById(askVista);
  for (const [id, entries] of byId) {
    lines.push(`[${id}]`);
    for (const entry of entries) {
      lines.push(`  ${entry.ts}: ${entry.ask}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function formatVistaB(decisionVista) {
  const { totalDecisionEvents, totalWithRationale, distinctRationaleCount, boilerplateCounts, singletons } =
    decisionVista;
  const lines = [
    '--- Vista (b): single-occurrence decision rationales ---',
    '',
    `Before filtering: ${totalDecisionEvents} decision events (${totalWithRationale} carry a rationale, ` +
      `${boilerplateCounts['(missing rationale)']} missing)`,
    `Distinct rationale texts (with rationale present): ${distinctRationaleCount}`,
    'Boilerplate removed:',
  ];
  for (const [pattern, count] of Object.entries(boilerplateCounts)) {
    lines.push(`  x${count}: ${pattern}`);
  }
  lines.push(`After filtering: ${singletons.length} singleton rationales remain`, '');

  const byId = groupById(singletons);
  for (const [id, entries] of byId) {
    lines.push(`[${id}]`);
    for (const entry of entries) {
      lines.push(`  ${entry.ts}: ${entry.rationale}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function formatReport({ logPath, totalEvents, askVista, decisionVista }) {
  return [
    '=== Storytelling-material probe (tsk-1hy) ===',
    `Source: ${logPath} (${totalEvents} events)`,
    '',
    formatVistaA(askVista),
    formatVistaB(decisionVista),
  ].join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const logIdx = args.indexOf('--log');
  const logPath = logIdx >= 0 ? args[logIdx + 1] : path.join(resolveMainCheckoutRoot(), '.fgos', 'events.jsonl');
  const reportIdx = args.indexOf('--report');
  const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : null;

  const rawEvents = readEvents(logPath);
  const askVista = gatherAskVista(rawEvents);
  const decisionVista = gatherDecisionVista(rawEvents);
  const report = formatReport({ logPath, totalEvents: rawEvents.length, askVista, decisionVista });

  console.log(report);

  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report, 'utf8');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
