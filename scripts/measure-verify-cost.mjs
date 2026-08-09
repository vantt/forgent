#!/usr/bin/env node
// measure-verify-cost.mjs — tsk-vms: chi phí verify thực đo từ event log,
// không phải suy đoán (docs/history/tsk-vms-verify-cost-audit/CONTEXT.md).
//
// Đọc trực tiếp `.fgos/events.jsonl` qua `readEvents` (nguồn thật per D3),
// tính 4 câu hỏi item yêu cầu, ghi báo cáo Markdown ra
// `plans/reports/verify-cost-empirical-260807-1540-pick-return-approve-audit-report.md`.
// Đọc-chỉ (read-only), không bao giờ ghi vào `.fgos/`.
//
// Tự assert trước khi ghi báo cáo (fail loud, exit khác 0 nếu vi phạm) —
// đây là báo cáo một lần, không phải hành vi lặp lại cần bộ test riêng.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readEvents } from '../src/state/events.mjs';

// Cùng pattern `git rev-parse --git-common-dir` mà verify-fanout-overlap.mjs
// đã dùng (CONTEXT.md D10) — verify command chạy được y nguyên dù cwd là
// main checkout hay worktree của chính item này (ADR0020: worktree không có
// `.fgos/` riêng).
function resolveMainCheckoutRoot() {
  const gitCommonDir = execFileSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    { encoding: 'utf8' },
  ).trim();
  return path.dirname(gitCommonDir);
}

function mean(nums) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums) {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function histogram(nums) {
  const buckets = { '1': 0, '2': 0, '3+': 0 };
  for (const n of nums) {
    if (n <= 1) buckets['1'] += 1;
    else if (n === 2) buckets['2'] += 1;
    else buckets['3+'] += 1;
  }
  return buckets;
}

function pct(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/**
 * Fold the raw event array into per-id chronological histories, keyed by
 * the id each `work.move`/`work.friction` event actually names. Pure
 * grouping — no interpretation yet, so a bug in one metric below can never
 * silently corrupt another metric's input.
 */
function groupById(rawEvents) {
  const movesById = new Map();
  const frictionById = new Map();
  for (const event of rawEvents) {
    if (event.type === 'work.move') {
      const id = event.payload?.id;
      if (!id) continue;
      if (!movesById.has(id)) movesById.set(id, []);
      movesById.get(id).push({ seq: event.seq, ts: event.ts, ...event.payload });
    } else if (event.type === 'work.friction') {
      const id = event.payload?.id;
      if (typeof id !== 'string') continue;
      if (!frictionById.has(id)) frictionById.set(id, []);
      frictionById.get(id).push({ seq: event.seq, ts: event.ts, ...event.payload });
    }
  }
  return { movesById, frictionById };
}

/**
 * Câu hỏi (1): vòng pick. Một "vòng pick" = một `work.move` với
 * `to:'doing'`. Tách pick đầu (`from:'todo'`) khỏi pick lại sau blocked
 * (`from:'blocked'`) theo đúng pin term trong CONTEXT.md. Chỉ tính TỚI thời
 * điểm item lần đầu đạt `delivered` cho các id đã từng delivered — id chưa
 * từng delivered được báo riêng, không trộn vào trung bình chính (đúng chữ
 * "cho tới khi delivered" trong yêu cầu gốc).
 */
function measurePicks(movesById) {
  const perItemDelivered = [];
  const perItemNotDelivered = [];
  let firstPickTotal = 0;
  let rePickTotal = 0;
  let runnerRoleClaims = 0;

  for (const [, moves] of movesById) {
    const deliveredIdx = moves.findIndex((m) => m.to === 'delivered');
    const scoped = deliveredIdx >= 0 ? moves.slice(0, deliveredIdx + 1) : moves;

    let firstPick = 0;
    let rePick = 0;
    for (const m of scoped) {
      if (m.to !== 'doing') continue;
      if (m.role === 'runner') runnerRoleClaims += 1;
      if (m.from === 'todo') firstPick += 1;
      else rePick += 1; // from:'blocked' (re-claim) or a legacy/other from
    }
    const total = firstPick + rePick;
    if (total === 0) continue; // id with friction/decision but no claim ever folded here

    if (deliveredIdx >= 0) {
      perItemDelivered.push(total);
      firstPickTotal += firstPick;
      rePickTotal += rePick;
    } else {
      perItemNotDelivered.push(total);
    }
  }

  return {
    delivered: {
      itemCount: perItemDelivered.length,
      mean: mean(perItemDelivered),
      median: median(perItemDelivered),
      min: perItemDelivered.length ? Math.min(...perItemDelivered) : null,
      max: perItemDelivered.length ? Math.max(...perItemDelivered) : null,
      histogram: histogram(perItemDelivered),
      firstPickTotal,
      rePickTotal,
    },
    notDelivered: {
      itemCount: perItemNotDelivered.length,
      mean: mean(perItemNotDelivered),
      median: median(perItemNotDelivered),
    },
    runnerRoleClaims,
  };
}

/**
 * Câu hỏi (2): vòng return. `return` verb luôn chuyển `from:'doing'` sang
 * `to:'blocked'` (reason 'verify-fail') hoặc `to:'awaiting-approval'` — đây
 * là discriminator chính xác, không cần đọc `reason` (bin/fgos.mjs:2312-
 * 2470, đọc trực tiếp khi shape plan).
 */
function measureReturns(movesById) {
  const perItemCounts = [];
  let toBlocked = 0;
  let toAwaitingApproval = 0;

  for (const [, moves] of movesById) {
    let itemReturns = 0;
    for (const m of moves) {
      if (m.from !== 'doing') continue;
      if (m.to === 'blocked') {
        toBlocked += 1;
        itemReturns += 1;
      } else if (m.to === 'awaiting-approval') {
        toAwaitingApproval += 1;
        itemReturns += 1;
      }
    }
    if (itemReturns > 0) perItemCounts.push(itemReturns);
  }

  const total = toBlocked + toAwaitingApproval;
  return {
    total,
    toBlocked,
    toAwaitingApproval,
    pctBlocked: pct(toBlocked, total),
    pctAwaitingApproval: pct(toAwaitingApproval, total),
    perItemMean: mean(perItemCounts),
    perItemMedian: median(perItemCounts),
  };
}

/**
 * Approve rounds: `from:'awaiting-approval'` sang `to:'blocked'` hoặc
 * `to:'delivered'` (bin/fgos.mjs:2645-3230, đọc trực tiếp khi shape plan).
 * `reason` phân loại nguyên nhân blocked thật (merge-conflict/
 * fgos-write-rejected/integration-drift/merge-failed-unclassified/khác).
 */
function measureApproves(movesById) {
  let toBlocked = 0;
  let toDelivered = 0;
  const blockedReasons = {};

  for (const [, moves] of movesById) {
    for (const m of moves) {
      if (m.from !== 'awaiting-approval') continue;
      if (m.to === 'delivered') {
        toDelivered += 1;
      } else if (m.to === 'blocked') {
        toBlocked += 1;
        const reason = m.reason ?? '(không ghi reason)';
        blockedReasons[reason] = (blockedReasons[reason] ?? 0) + 1;
      }
    }
  }

  const total = toBlocked + toDelivered;
  return { total, toBlocked, toDelivered, pctBlocked: pct(toBlocked, total), blockedReasons };
}

/**
 * Câu hỏi (3): nguyên nhân thất bại thật, từ `work.friction.errorClass`.
 * Khi `errorClass === 'verify-miss'`, tách thêm nhãn phụ suy luận từ
 * `detail` (CONTEXT.md: `return` luôn ghi `(exit ${check.status})`, timeout
 * để lại `check.status === null` → chuỗi con "(exit null)"). Nhãn phụ này
 * LÀ suy luận, không phải field gốc — ghi rõ trong báo cáo.
 */
function measureFailureCauses(frictionById) {
  const byErrorClass = {};
  let verifyMissTimeoutInferred = 0;
  let verifyMissRealInferred = 0;
  const dispositions = {};

  for (const [, records] of frictionById) {
    for (const r of records) {
      const errorClass = r.errorClass ?? '(không rõ)';
      byErrorClass[errorClass] = (byErrorClass[errorClass] ?? 0) + 1;
      dispositions[r.disposition ?? '(không rõ)'] = (dispositions[r.disposition ?? '(không rõ)'] ?? 0) + 1;
      if (errorClass === 'verify-miss') {
        if (/\(exit null\)\s*$/.test(r.detail ?? '')) verifyMissTimeoutInferred += 1;
        else verifyMissRealInferred += 1;
      }
    }
  }

  const totalFriction = Object.values(byErrorClass).reduce((a, b) => a + b, 0);
  return { totalFriction, byErrorClass, dispositions, verifyMissTimeoutInferred, verifyMissRealInferred };
}

/**
 * Câu hỏi (4): số lần chạy full verify (`npm test`) trên một item. Mỗi
 * `return` gọi `runGoalCheck` đúng 1 lần (pass hoặc fail đều tính, vì cả
 * hai đều thật sự chạy suite) — đã đếm ở measureReturns. Mỗi `approve`
 * cho item KHÔNG qua `--github` cũng chạy lại `runGoalCheck` một lần trước
 * khi merge (bin/fgos.mjs:3111) — nhưng event log không phân biệt được một
 * `approve --github` (merge server-side, KHÔNG chạy verify cục bộ) khỏi
 * một `approve` nội bộ ở transition `to:'delivered'` (cùng
 * `role:'human'`, không có field phân biệt). Vì runnerRoleClaims đo được ở
 * measurePicks bằng 0 trong dữ liệu thật (không có claim role:'runner'),
 * MỌI item trong log này là pull/legacy-sourced — nhánh `--github` vẫn có
 * thể xảy ra cho một item pull-sourced (review --github không giới hạn
 * nguồn), nên đây vẫn là ước lượng có thể hơi THỪA (không phải thiếu) nếu
 * có approve nào từng qua `--github` — ghi rõ, không giấu.
 */
function measureFullVerifyRuns(returns, approves) {
  const total = returns.total + approves.total;
  return {
    total,
    fromReturn: returns.total,
    fromApprove: approves.total,
    note: 'fromApprove giả định mọi approve chạy lại verify cục bộ (đúng khi không dùng --github); '
      + 'log không phân biệt được approve --github (không chạy verify cục bộ) khỏi approve nội bộ ở '
      + 'transition to:delivered — số liệu này có thể hơi CAO hơn thực tế nếu từng có approve --github, '
      + 'không phải cận dưới.',
  };
}

function buildReport({ totalEvents, picks, returns, approves, causes, fullVerify }) {
  const lines = [];
  lines.push('# Chi phí verify thực đo — pick/return/approve (tsk-vms)');
  lines.push('');
  lines.push(`Nguồn: \`.fgos/events.jsonl\` (${totalEvents} dòng tại thời điểm chạy). Số liệu thật, không suy đoán — xem \`docs/history/tsk-vms-verify-cost-audit/\` cho phương pháp đầy đủ.`);
  lines.push('');

  lines.push('## (1) Số vòng pick trên một item, tới khi delivered');
  lines.push('');
  lines.push(`- Item đã từng delivered: **${picks.delivered.itemCount}**. Trung bình **${picks.delivered.mean?.toFixed(2)}** vòng pick, trung vị **${picks.delivered.median}**, min **${picks.delivered.min}**, max **${picks.delivered.max}**.`);
  lines.push(`- Pick đầu (từ \`todo\`): **${picks.delivered.firstPickTotal}**. Pick lại sau blocked (từ \`blocked\`/khác): **${picks.delivered.rePickTotal}**.`);
  lines.push(`- Phân phối: 1 pick — ${picks.delivered.histogram['1']} item; 2 pick — ${picks.delivered.histogram['2']} item; 3+ pick — ${picks.delivered.histogram['3+']} item.`);
  lines.push(`- Item CHƯA từng delivered (đang mở/blocked/wontfix, không tính vào trung bình trên): **${picks.notDelivered.itemCount}**, trung bình **${picks.notDelivered.mean?.toFixed(2) ?? 'n/a'}** vòng pick tính tới hiện tại.`);
  lines.push(`- Claim với \`role:'runner'\` tìm thấy trong log: **${picks.runnerRoleClaims}** (0 nghĩa là toàn bộ dữ liệu là pull-door thật, xác nhận thực nghiệm CONTEXT.md).`);
  lines.push('');

  lines.push('## (2) Số vòng return, % trả về blocked');
  lines.push('');
  lines.push(`- Tổng vòng return: **${returns.total}** (\`from:'doing'\` → \`blocked\`/\`awaiting-approval'\`).`);
  lines.push(`- Về \`blocked\`: **${returns.toBlocked}** (**${returns.pctBlocked}%**). Về \`awaiting-approval\`: **${returns.toAwaitingApproval}** (**${pct(returns.toAwaitingApproval, returns.total)}%**).`);
  lines.push(`- Trung bình mỗi item có return: **${returns.perItemMean?.toFixed(2)}** vòng, trung vị **${returns.perItemMedian}**.`);
  lines.push('');
  lines.push('### Approve rounds (bổ sung, không nằm trong "return" nhưng cùng vòng đời)');
  lines.push('');
  lines.push(`- Tổng: **${approves.total}**. Về \`delivered\`: **${approves.toDelivered}**. Về \`blocked\`: **${approves.toBlocked}** (**${approves.pctBlocked}%**).`);
  lines.push(`- Nguyên nhân blocked ở approve (từ \`reason\`): ${Object.entries(approves.blockedReasons).map(([k, v]) => `\`${k}\`: ${v}`).join(', ') || '(không có)'}.`);
  lines.push('');

  lines.push('## (3) Phân bổ nguyên nhân thất bại thật (work.friction.errorClass)');
  lines.push('');
  lines.push(`- Tổng bản ghi friction: **${causes.totalFriction}**.`);
  for (const [errorClass, count] of Object.entries(causes.byErrorClass).sort((a, b) => b[1] - a[1])) {
    lines.push(`  - \`${errorClass}\`: ${count} (${pct(count, causes.totalFriction)}%)`);
  }
  lines.push(`- Disposition: ${Object.entries(causes.dispositions).map(([k, v]) => `\`${k}\`: ${v}`).join(', ')}.`);
  lines.push('');
  lines.push(`- **Tách timeout khỏi verify-fail thật trong \`verify-miss\` (suy luận từ \`detail\`, KHÔNG phải field gốc — xem CONTEXT.md):** timeout nghi vấn (\`detail\` khớp \`"(exit null)"\`) — **${causes.verifyMissTimeoutInferred}**; verify-fail thật (\`detail\` có exit code cụ thể) — **${causes.verifyMissRealInferred}**. Tổng hai số này bằng đúng số \`verify-miss\` ở trên (kiểm chứng nội bộ).`);
  lines.push(`- \`worker-timeout\` là một errorClass RIÊNG (không phải từ \`return\`, mà từ một dispatch executor khác) — không cần suy luận, đọc thẳng: ${causes.byErrorClass['worker-timeout'] ?? 0} bản ghi.`);
  lines.push(`- "Worktree lệch" (tsk-2cd) không có tín hiệu cơ học trong log — không đếm được, chỉ đối chiếu định tính bằng id/thời điểm với các bug đã biết (tsk-2cd, tsk-53o).`);
  lines.push('');

  lines.push('## (4) Số lần chạy full verify (npm test) — tổng và ước lượng');
  lines.push('');
  lines.push(`- Tổng số lần chạy full verify trên toàn bộ log: **${fullVerify.total}** (từ return: ${fullVerify.fromReturn}, từ approve: ${fullVerify.fromApprove}).`);
  lines.push(`- ${fullVerify.note}`);
  lines.push('- Thời lượng mỗi lần chạy KHÔNG được suy ra từ chênh lệch timestamp trong log (nhiễu bởi thời gian người suy nghĩ giữa các bước) — dùng khung 161–370s đã biết (mô tả item gốc) làm hệ số nhân định tính, không phải số đo trực tiếp.');
  lines.push('');

  lines.push('## Giới hạn dữ liệu (nêu thẳng, không giấu)');
  lines.push('');
  lines.push('- Heuristic tách timeout dựa trên chuỗi `detail`, không phải field gốc — nếu format `detail` từng đổi ở một phiên bản code cũ, có thể sai lệch nhẹ.');
  lines.push('- Số lần approve chạy verify cục bộ có thể hơi CAO hơn thực tế nếu có approve từng dùng `--github` (log không phân biệt được).');
  lines.push('- "Worktree lệch" không đếm được cơ học từ log — chỉ liệt kê định tính.');
  lines.push('');
  lines.push('## Không thuộc phạm vi báo cáo này');
  lines.push('');
  lines.push('Báo cáo này KHÔNG kết luận về câu hỏi D7 (DISCUSSION.md dòng 34) hay về `parallel.maxRoots`/`maxLeavesPerRoot` trong `.fgos/config.json` — chỉ cung cấp số liệu làm input cho phiên quyết định riêng.');
  lines.push('');

  return lines.join('\n');
}

function assertInvariants({ totalEvents, causes, returns, wcLCount }) {
  if (totalEvents <= 0) throw new Error('measure-verify-cost: totalEvents phải > 0 — log rỗng hay đường dẫn sai?');
  if (totalEvents !== wcLCount) {
    throw new Error(`measure-verify-cost: readEvents trả ${totalEvents} sự kiện nhưng file có ${wcLCount} dòng — lệch, dừng lại thay vì báo cáo số sai.`);
  }
  const sumByErrorClass = Object.values(causes.byErrorClass).reduce((a, b) => a + b, 0);
  if (sumByErrorClass !== causes.totalFriction) {
    throw new Error(`measure-verify-cost: tổng errorClass (${sumByErrorClass}) khác totalFriction (${causes.totalFriction}) — có bản ghi bị rơi khi group-by.`);
  }
  const verifyMissTotal = causes.byErrorClass['verify-miss'] ?? 0;
  if (causes.verifyMissTimeoutInferred + causes.verifyMissRealInferred !== verifyMissTotal) {
    throw new Error('measure-verify-cost: tách timeout/verify-fail thật không cộng khớp tổng verify-miss.');
  }
  for (const p of [returns.pctBlocked, returns.pctAwaitingApproval]) {
    if (p !== null && p !== undefined && (p < 0 || p > 100)) {
      throw new Error(`measure-verify-cost: phần trăm ngoài khoảng [0,100]: ${p}`);
    }
  }
}

function main() {
  // Đọc `.fgos/events.jsonl` LUÔN từ main checkout (state thật, chia sẻ,
  // không tồn tại riêng trong worktree — ADR0020). Nhưng GHI báo cáo (sản
  // phẩm của item này) vào `process.cwd()` — đây là checkout của CHÍNH
  // branch `fgw/<id>` (worktree hiện tại, hoặc ephemeral checkout mà
  // `fgos return` dựng lên khi verify chạy lại) — để file báo cáo nằm
  // trong diff/commit của item, không lặng lẽ rớt vào main checkout dùng
  // chung của mọi session khác.
  const mainCheckoutRoot = resolveMainCheckoutRoot();
  const outputRoot = process.argv[2] ?? process.cwd();
  const logPath = path.join(mainCheckoutRoot, '.fgos', 'events.jsonl');
  const rawEvents = readEvents(logPath);
  const wcLCount = fs.readFileSync(logPath, 'utf8').split('\n').filter((l) => l !== '').length;

  const { movesById, frictionById } = groupById(rawEvents);
  const picks = measurePicks(movesById);
  const returns = measureReturns(movesById);
  const approves = measureApproves(movesById);
  const causes = measureFailureCauses(frictionById);
  const fullVerify = measureFullVerifyRuns(returns, approves);

  assertInvariants({ totalEvents: rawEvents.length, causes, returns, wcLCount });

  const report = buildReport({ totalEvents: rawEvents.length, picks, returns, approves, causes, fullVerify });
  const reportPath = path.join(
    outputRoot,
    'plans',
    'reports',
    'verify-cost-empirical-260807-1540-pick-return-approve-audit-report.md',
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf8');
  if (report.trim().length === 0) {
    throw new Error('measure-verify-cost: báo cáo rỗng — dừng lại, không ghi file rỗng ra đĩa.');
  }

  console.log(JSON.stringify({ reportPath, totalEvents: rawEvents.length, picks: picks.delivered, returns, approves, fullVerify }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
