// discovery.mjs — context-discovery engine for stage clarify (per
// stage-clarify D4/D5/D10/D13). Use-case layer: judges whether a work item
// carries enough real information to leave clarify, and resolves that
// judgement into the store's clarify-loop transitions.
//
// RETARGET (stage-decompose D2, cell 3): a clear verdict now lands the item
// on stage `decompose`, not `executing` — chia-việc (decompose.mjs) is the
// next stop before executing, and it is the one that produces children or
// passes the item through. The clarify-pass settlement (replay.mjs) is
// guarded on `from === 'clarify'`, not the destination, so it still fires
// unchanged.
//
// TÁI DÙNG resolveExecutorCommand + modelForTier from dispatch.mjs (the same
// tier -> model -> argv-substitution path spawnWorker uses) rather than
// spawnWorker itself: spawnWorker hardcodes buildPrompt for the worker's own
// task prompt, which is the wrong shape for a discovery verdict call. This
// module builds its own prompt and spawns directly.
//
// FAIL-SAFE (D4): judgeDiscovery never throws. Any failure — unresolvable
// tier/model, spawn failure, timeout, non-zero exit, unparsable stdout, or a
// missing/non-boolean `clear` field — folds into the same "not clear"
// verdict. The system is never allowed to treat an uncertain judgement as a
// pass.

import fs from 'node:fs';
import path from 'node:path';
import { modelForTier } from '../runner/dispatch.mjs';
import { runJudgeExecutor, JUDGE_STRICT_JSON_SUFFIX, judgeVerifySemanticCorrectness, readScoutNotes } from './judge-executor.mjs';
import { appendJudgeFailLog } from './judge-fail-log.mjs';
import { readLockedContext, resolveContentRoot } from './decompose.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { listWork, moveStage, addDiscovery, addDecision, putInAwaiting, editWork, StoreError } from '../state/store.mjs';
import { getDomain, stageForStep } from '../state/workflow-stage-graphs.mjs';
import { graphMetrics } from '../state/graph-metrics.mjs';
import { rankImpact } from '../state/impact.mjs';
import { computeImpact, computePriority } from '../state/priority-formula.mjs';

const DEFAULT_UNCLEAR_QUESTION =
  'Không phán được rõ ràng — cần người xác nhận thủ công.';

// D10: when a clear verdict carries no `verify` (the model failed to propose
// one despite being asked), this is the fallback the item moves out of
// clarify with — a DIFFERENT string from the retired P14 sentinel
// ("chưa xác định — P15 bổ sung"), so nothing from the old placeholder
// survives past clarify (must_haves truth 3).
// EXPORTED (work-graph-intelligence S2b, wgi-8): the runner-automatic
// discovered-from channel reuses this same clarify-entry placeholder for the
// items it creates from a worker's report — a discovered item enters at stage
// `clarify`, so context-discovery later replaces this sentinel with the real
// verify, exactly as a submitted item does. Shared, never a duplicated literal.
export const FALLBACK_VERIFY = 'chưa xác định — bổ sung thủ công';

// Retired P14 sentinel (D10's comment above) — named here so the D2 guard
// below can compare against it without a bare magic-string literal. Still
// live in production today: `bin/fgos.mjs`'s own SUBMIT_VERIFY_SENTINEL
// (a separate local const, CLI layer never imported from here) carries
// this exact same string as every freshly-submitted item's starting
// verify. Exported (tsk-1ni D2) so a test fixture representing a
// not-yet-clarified item can reference the real sentinel instead of an
// unrelated placeholder literal of its own.
export const RETIRED_P14_PLACEHOLDER = 'chưa xác định — P15 bổ sung';

// tsk-1ni D2: an existing work.verify counts as "real" -- worth protecting
// from judgeDiscovery's own guess -- when it is set and is neither of the
// two known placeholder shapes a verify field can carry pre-clarify.
function hasRealVerify(verify) {
  return typeof verify === 'string' && verify.trim() && verify !== FALLBACK_VERIFY && verify !== RETIRED_P14_PLACEHOLDER;
}

/**
 * `view` is OPTIONAL (per discovery-context P30's backward-compat seam):
 * every call site that has one loaded (resolveDiscovery) passes it so the
 * prompt carries description/ask-answer/prior-verdict context; a caller
 * with no view (old 2-arg unit-test callers) degrades every added section
 * to a "(không có)"/"(chưa ...)" placeholder instead of throwing.
 */
// STR8 (D4): terse mechanical graph/impact context for this item, folded from
// STR43's graphMetrics + STR21's rankImpact — both PURE read-only derives
// over the same view the judge already has. Only called when `view` is
// truthy (see the call site's guard) since graphMetrics(view) hashes the view
// internally and throws on undefined.
// work-item-priority-matrix D3: pulled out of buildGraphContextBlock so
// resolveDiscovery can read the same real number the prompt's prose cites,
// instead of re-deriving it or trusting the model to echo it back.
function blocksForItem(work, view) {
  const ranked = rankImpact(view);
  const entry = ranked.find((r) => r.id === work.id);
  return entry ? entry.blocks : 0;
}

function buildGraphContextBlock(work, view) {
  const metrics = graphMetrics(view);
  const blocks = blocksForItem(work, view);
  const isStaleBlocked = metrics.staleBlocked.some((entry) => entry.id === work.id);
  const component = metrics.components.find((c) => c.items.includes(work.id));
  const componentSize = component ? component.size : 1;

  return [
    `Item này đang chặn ${blocks} việc khác còn mở (impact/blocks, STR21).`,
    isStaleBlocked
      ? 'Item này đang nằm trong danh sách stale-blocked (chờ dep chưa xong).'
      : 'Item này KHÔNG nằm trong danh sách stale-blocked.',
    `Kích thước nhóm liên thông (component) chứa item này: ${componentSize} item.`,
  ].join('\n');
}

// tsk-4rd (route A, discover-research-recipe D2 "enrich"): `deps` are real
// work-item ids (dep-graph invariant, RUL — never free text like `refs`),
// so their actual title/description can be looked up in `view.work` and
// shown in full — không chỉ liệt kê id — cho model hiểu "task liên đới đã
// làm/chưa làm" thay vì suy đoán từ 1 chuỗi id. `refs` stays a raw list
// (file paths/doc links, not guaranteed work-item ids — no safe lookup).
// Truncated per entry so a heavy fan-in item's dep list stays bounded.
const RELATED_ITEM_DESCRIPTION_MAX_CHARS = 300;

function buildRelatedItemsBlock(work, view) {
  const depIds = Array.isArray(work.deps) ? work.deps : [];
  if (!depIds.length) return '(item này không có dependency nào)';
  if (!view?.work) return '(không có view — không tra được nội dung dependency)';

  return depIds
    .map((id) => {
      const dep = view.work[id];
      if (!dep) return `- ${id}: (không tìm thấy trong store — có thể đã bị xoá/đổi id)`;
      const desc = typeof dep.description === 'string' && dep.description.trim() ? dep.description.trim() : '(không có mô tả)';
      const snippet =
        desc.length > RELATED_ITEM_DESCRIPTION_MAX_CHARS ? `${desc.slice(0, RELATED_ITEM_DESCRIPTION_MAX_CHARS)}…` : desc;
      return `- ${id} [status:${dep.status} stage:${dep.stage ?? '-'}] "${dep.title}"\n  ${snippet}`;
    })
    .join('\n');
}

// tsk-545 (dep of tsk-4rd): buildDiscoveryPrompt asks the model to "propose
// a verify command that actually runs" but never gave it any cwd/repo-layout
// context to know WHERE that command runs from — dogfood-proven failure
// (decision 0018, tsk-1wd, 2026-07-28): a clear verdict's own proposed
// `node --test test/expr/*.test.mjs` came back "no matches found" because
// the real test lived under `dogfood-fixture/` (its own nested
// `package.json`), and goal-check.mjs always spawns `item.verify` from the
// worktree's repoRoot, never a guessed subdirectory. Mechanical (never
// re-derived by the model, same idiom as `buildGraphContextBlock`) — reads
// the real top-level directory listing and flags which of those directories
// carry their OWN `package.json` (the concrete "needs a path prefix" signal)
// so the model sees this fact instead of guessing it. Best-effort:
// `repoRoot` is documented-optional the same way `view` already is
// (`judgeDiscovery`'s old 2-arg unit-test callers never had one before
// tsk-545 either) — a missing/unreadable root degrades to a placeholder,
// never throws.
// Bounded defensively, not just for the pathological test-tmpdir case (a
// shared os.tmpdir() can accumulate hundreds of thousands of leftover
// entries across a long session) — a real monorepo with many workspace
// packages could hit the same failure mode: an unbounded join() here once
// produced a prompt large enough to blow the OS argv length limit,
// `spawnSync` failed outright, and `judgeDiscovery`'s own fail-safe (this
// file's header) silently folded that into "unclear" — the worst possible
// place for a silent size blowup to hide.
const MAX_TOP_LEVEL_DIRS_SHOWN = 40;
const MAX_NESTED_PACKAGES_SHOWN = 15;
// Above this many top-level entries, treat the directory as anomalous
// (almost certainly not a real repo root) and skip the per-entry
// `existsSync` nested-package scan entirely, rather than pay its cost only
// to truncate the result anyway.
const TOP_LEVEL_ANOMALY_THRESHOLD = 500;

function buildRepoLayoutBlock(repoRoot) {
  if (typeof repoRoot !== 'string' || !repoRoot) {
    return '(không có repoRoot — không đọc được cấu trúc thư mục repo)';
  }
  let entries;
  try {
    entries = fs.readdirSync(repoRoot, { withFileTypes: true });
  } catch {
    return '(lỗi đọc cấu trúc thư mục repo — bỏ qua)';
  }
  const topLevelDirs = entries
    .filter((e) => e.isDirectory() && !['node_modules', '.git', '.fgos'].includes(e.name))
    .map((e) => e.name)
    .sort();

  if (topLevelDirs.length > TOP_LEVEL_ANOMALY_THRESHOLD) {
    return `(repoRoot có ${topLevelDirs.length} thư mục cấp 1 — bất thường cho một repo thật, bỏ qua block này thay vì liệt kê)`;
  }

  const nestedPackages = topLevelDirs.filter((name) => {
    try {
      return fs.existsSync(path.join(repoRoot, name, 'package.json'));
    } catch {
      return false;
    }
  });

  const shownTopLevel = topLevelDirs.slice(0, MAX_TOP_LEVEL_DIRS_SHOWN);
  const topLevelSuffix = topLevelDirs.length > shownTopLevel.length ? `, +${topLevelDirs.length - shownTopLevel.length} khác` : '';
  const shownNested = nestedPackages.slice(0, MAX_NESTED_PACKAGES_SHOWN);
  const nestedSuffix = nestedPackages.length > shownNested.length ? `, +${nestedPackages.length - shownNested.length} khác` : '';

  return [
    `Thư mục cấp 1 của repo (đây là cwd thật khi verify chạy — goal-check.mjs luôn spawn \`verify\` từ repoRoot, KHÔNG từ thư mục con nào): ${shownTopLevel.join(', ') || '(trống)'}${topLevelSuffix}.`,
    shownNested.length
      ? `Thư mục con có \`package.json\` RIÊNG (nested package — lệnh test/verify của phần này phải cd/prefix vào đúng thư mục, VD "cd ${shownNested[0]} && npm test", KHÔNG chạy được thẳng từ repoRoot): ${shownNested.join(', ')}${nestedSuffix}.`
      : 'Không có thư mục con nào mang `package.json` riêng — mọi lệnh verify chạy thẳng từ repoRoot là an toàn.',
  ].join('\n');
}

function buildDiscoveryPrompt(work, view, priorScoutNotes, repoRoot) {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';
  const deps = Array.isArray(work.deps) && work.deps.length ? work.deps.join(', ') : '(none)';
  const relatedItems = buildRelatedItemsBlock(work, view);
  const repoLayout = buildRepoLayoutBlock(repoRoot);
  const description =
    typeof work.description === 'string' && work.description.trim() ? work.description : '(không có)';

  // Ask/answer (per replay.mjs:90-98): `view.gates[id]` folds to ONE merged
  // {ask, answer} pair — the LATEST round only, never a history of every
  // round asked. Known limitation (validation-s1.md): a multi-round clarify
  // loop only ever sees the most recent answer here; the full sequence of
  // past verdicts (including earlier questions) is `view.discovery` below.
  const gate = view?.gates?.[work.id];
  const qa = gate
    ? `Câu hỏi gần nhất: ${gate.ask ?? '(không có)'}\nCâu trả lời của người (MỚI NHẤT): ${gate.answer ?? '(chưa trả lời)'}`
    : '(chưa có vòng hỏi-đáp nào với người)';

  const priorVerdicts = Array.isArray(view?.discovery?.[work.id]) ? view.discovery[work.id] : [];
  const history = priorVerdicts.length
    ? priorVerdicts
        .map((v, i) => {
          const bits = [`clear=${v.clear}`];
          if (v.question) bits.push(`hỏi: ${v.question}`);
          if (v.verify) bits.push(`verify: ${v.verify}`);
          return `${i + 1}. ${bits.join(' — ')}`;
        })
        .join('\n')
    : '(chưa phán lần nào)';

  // work-item-priority-matrix D3 (was STR8 D4's intentScore): mechanical
  // graph/impact context for the judge's impactScore — read-only, never
  // re-derived by the model. `view` is documented-optional
  // above (P30 backward-compat, old 2-arg callers pass none); graphMetrics
  // throws on an undefined view (it hashes the view internally), so this
  // follows the exact same guard-on-`view`-truthiness idiom `qa`/`history`
  // already use above rather than calling it unconditionally.
  const graphContext = view ? buildGraphContextBlock(work, view) : '(không có dữ liệu đồ thị — gọi không kèm view)';

  return `# Context-discovery

Bạn đang phán một work item có đủ thông tin để bắt tay THI CÔNG hay chưa.

Title: ${work.title}
Kind: ${work.kind}
Risk: ${work.risk ?? '(none)'}
Refs: ${refs}
Deps: ${deps}

# Ngữ cảnh đồ thị (cơ học, chỉ để tham khảo, không tự suy lại)
${graphContext}

# Cấu trúc thư mục repo (cơ học, để đề xuất verify đúng path chạy-được)
${repoLayout}

# Mô tả đầy đủ (nguyên văn lúc submit)
${description}

# Task liên đới (nội dung thật của từng dependency, không chỉ id)
${relatedItems}

# Hỏi-đáp với người
${qa}

# Các lần phán trước
${history}
${
  priorScoutNotes
    ? `\n# Kết quả scout đã lưu (từ lần phán trước — dùng làm nền, có thể bổ sung thêm nếu bạn thấy chưa đủ)\n${priorScoutNotes}\n`
    : ''
}
# Cách làm việc (theo thứ tự)

1. **Làm sạch yêu cầu.** Đọc "Mô tả đầy đủ" ở trên, tự phát biểu lại trong
   đầu cho hoàn chỉnh (đối tượng + hành động + phạm vi). Chỉ viết ra ở
   \`titleProposal\`/\`descriptionProposal\` bên dưới nếu bản gốc thật sự
   thiếu/mơ hồ và bản bạn viết lại RÕ RÀNG tốt hơn — không đổi chỉ để đổi.

2. **Đọc "Task liên đới" ở trên.** Đây là nội dung thật (không chỉ id) của
   từng dependency — dùng để hiểu phần nào của scope đã có người làm/quyết
   định rồi, phần nào chưa.

3. **Tự đánh giá.** Với dữ liệu đã có (mô tả + task liên đới + hỏi-đáp +
   lịch sử phán trước + scout notes nếu có), item đã đủ rõ để thi công
   chưa?

4. **Nếu CHƯA đủ rõ và bạn có công cụ** — TỰ ĐI TÌM THÊM bằng chứng trước
   khi kết luận unclear, chọn công cụ theo loại câu hỏi:
   - Câu hỏi riêng của repo này (code hiện có làm gì, pattern nào đang
     dùng, ai gọi ai) → \`Bash rg\`/Read/Grep/Glob, quét trực tiếp trong repo.
   - Câu hỏi khái niệm/cơ chế/giải pháp kỹ thuật chung (không riêng gì repo
     này — VD một thuật toán, một API bên ngoài, cách làm phổ biến cho một
     vấn đề) → WebSearch/WebFetch, tra cứu ngoài thay vì đoán.
   - Câu hỏi có NHIỀU nhánh độc lập (VD vừa cần hiểu code hiện có, vừa cần
     tra khái niệm ngoài, hoặc 2+ phần code không liên quan nhau) → giao
     việc qua Task cho nhiều subagent chạy SONG SONG thay vì tự làm tuần
     tự từng phần — mỗi subagent nhận đúng một nhánh, gom kết quả lại rồi
     mới phán. Nhánh đơn, phụ thuộc lẫn nhau (bước sau cần kết quả bước
     trước) thì làm tuần tự bình thường, không ép song song.
   Ngân sách: khoảng 5 lượt gọi công cụ nghiên cứu cho 1 lần phán (một lượt
   Task giao song song tính là 1 lượt ở tầng này, dù bên trong nó có thể tự
   gọi thêm) — ưu tiên chất lượng bằng chứng hơn số lượt gọi. CHỈ kết luận
   unclear SAU KHI đã thử tìm thêm, không phải ngay khi thấy thiếu thông
   tin.

5. **Không có tool nào khả dụng** — bỏ qua bước 4, phán trên dữ liệu đã có,
   không tự bịa bằng chứng, không giả vờ đã scout. Không có kết quả tìm
   kiếm cũng là bằng chứng hợp lệ (nghĩa là chưa có gì liên quan) — không
   phải lý do để bỏ qua bước 4.

Câu trả lời của người ở trên (mục "Hỏi-đáp với người") là QUYẾT ĐỊNH CUỐI
CÙNG — KHÔNG hỏi lại một chủ đề đã được trả lời. Nếu câu trả lời đã đủ để
thi công, verdict phải clear=true kèm một \`verify\` chạy được thật.

# Câu hỏi
Item này đã đủ rõ để thi công chưa? Nếu đủ, đề xuất một lệnh \`verify\` chạy
được thật để chứng minh việc đã xong — lệnh này LUÔN chạy từ repoRoot
(xem "Cấu trúc thư mục repo" ở trên), KHÔNG BAO GIỜ từ một thư mục con giả
định; nếu phần liên quan nằm trong thư mục có \`package.json\` riêng, lệnh
phải tự cd/prefix vào đúng thư mục đó. Nếu chưa đủ — VÀ chỉ sau khi đã thử
bước 4 ở trên — nêu MỘT câu hỏi cụ thể cần người trả lời để làm rõ, kèm tóm
tắt ngắn những gì bạn đã thử tìm mà vẫn chưa đủ (để không ai phải scout lại
từ đầu). Ngoài ra, ƯỚC LƯỢNG (không tính lại số \`blocks\` đã cho ở trên)
mức độ item này LIÊN QUAN tới feature/release khác — có giải quyết/mở khoá
được gì ngoài phạm vi hẹp của chính nó không — bằng một số nguyên
impactScore từ 0 đến 100 (0 = biệt lập, 100 = ảnh hưởng rất rộng); trường
này TÙY CHỌN, không ảnh hưởng đến quyết định clear/unclear.

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"clear": boolean, "question": string (chỉ khi clear=false), "verify": string (chỉ khi clear=true), "impactScore": number nguyên từ 0 đến 100 (tùy chọn), "titleProposal": string (tùy chọn, chỉ khi bản gốc thật sự cần sửa), "descriptionProposal": string (tùy chọn, chỉ khi bản gốc thật sự cần sửa)}
`;
}

/**
 * Judge whether `work` is clear enough for stage `executing` by calling the
 * real model configured for its tier (per D4) — never a mechanical
 * classifier. Always returns `{clear: boolean, question?: string, verify?:
 * string}` and never throws: any failure resolves to `{clear: false,
 * question: DEFAULT_UNCLEAR_QUESTION}` (fail-safe, D4). `question` is always
 * present when `clear` is false (even when the model omits one) — the
 * downstream `putInAwaiting` edge requires a non-empty `ask`.
 *
 * `view` (per discovery-context P30) is OPTIONAL — it is the same state view
 * `resolveDiscovery` already has loaded (listWork), threaded through so the
 * prompt can carry description/ask-answer/prior-verdict context. Omitting it
 * (old 2-arg calls) still works: `buildDiscoveryPrompt` degrades every added
 * section to a placeholder instead of throwing.
 *
 * `scoutContext` (tsk-g18, optional, additive): `{ repoRoot, docsRef }` —
 * when supplied, this call reads any already-persisted scout notes
 * (`readScoutNotes`) for the prompt and, when none exist yet, captures this
 * call's own `Bash(rg:*)` transcript and persists it (Cách B — the judge
 * process itself never gains a Write grant; the parent, this function via
 * `runJudgeExecutor`, does the writing). Omitted (every pre-tsk-g18 caller,
 * including every existing test) keeps this function byte-identical.
 *
 * `fgosDir` (tsk-2yp, optional, additive): passed straight through to
 * `runJudgeExecutor` alongside the hardcoded `'judge-discovery'` capacity id
 * — lets an operator route this call through `capacities.judge-discovery`
 * (tsk-62v precedence) instead of always `executors.judge`. Omitted (every
 * pre-tsk-2yp caller) keeps this function byte-identical: no configured
 * capacity means resolution falls through to `executors.judge` regardless.
 */
export function judgeDiscovery(work, cfg, view, scoutContext, fgosDir) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const priorScoutNotes = scoutContext ? readScoutNotes(scoutContext.repoRoot, scoutContext.docsRef) : '';
    const prompt = buildDiscoveryPrompt(work, view, priorScoutNotes, scoutContext?.repoRoot);
    const stricterPrompt = prompt + JUDGE_STRICT_JSON_SUFFIX;

    // tsk-4rd (route A): capture is now ALWAYS attempted when a
    // scoutContext is given, never gated on `!priorScoutNotes`. Before this,
    // a thin first-round scout note got reused forever — every later
    // discover call on the same item saw the exact same (possibly
    // insufficient) evidence, which is the direct cause of a stale item
    // getting the same "unclear" verdict round after round (dogfood
    // observed: 15-round discover-loop run, 0 cleared, 4 parked). Each
    // call's own transcript now overwrites scout-notes.md with THIS round's
    // fresh evidence (`writeScoutNotes` already overwrites wholesale) — a
    // round that finds nothing new just leaves the file as the prior
    // round's evidence, since `runJudgeExecutor` only writes when it
    // actually captured entries.
    const scout = scoutContext ? { repoRoot: scoutContext.repoRoot, docsRef: scoutContext.docsRef, capture: true } : undefined;
    // tsk-4rd (route A, discussion point 4 "đo trước khi ép"): the recipe
    // prompt (buildDiscoveryPrompt) NAMES a ~5-call research budget but
    // nothing enforces it — before adding a hard cap (--max-turns or
    // similar), measure real usage first. `scoutCaptureOut` is the mutable
    // out-param `runJudgeExecutor` now optionally accepts (its own comment
    // explains the threading) — after the call, `.entries.length` is
    // exactly the count of scoutable tool calls (`extractScoutTranscript`'s
    // widened set: Bash(rg:*)/Read/Grep/Glob/WebSearch/WebFetch/Task/Agent)
    // this particular attempt made, whether or not it ended up unclear.
    const scoutCaptureOut = scoutContext ? {} : undefined;
    const failDetailOut = {};
    const verdict = runJudgeExecutor(cfg, model, prompt, stricterPrompt, scout, 'judge-discovery', fgosDir, scoutCaptureOut, failDetailOut);
    if (!verdict || typeof verdict.clear !== 'boolean') {
      // tsk-5d2 D1-D3: debug-only, never load-bearing on the fallback
      // returned below. `verdict === null` means judge-executor already
      // knows which of its two branches fired (`failDetailOut.reason`);
      // a non-null-but-wrong-shape verdict is this function's OWN
      // fail-safe branch (B3), logged with the parsed object itself.
      if (verdict === null) {
        appendJudgeFailLog(fgosDir, work?.id, failDetailOut);
      } else {
        appendJudgeFailLog(fgosDir, work?.id, { reason: 'shape-invalid', verdict: JSON.stringify(verdict) });
      }
      return { clear: false, question: DEFAULT_UNCLEAR_QUESTION };
    }

    // work-item-priority-matrix D3 (was STR8 D4's intentScore): rides on
    // EITHER outcome — it never gates or changes the clear/unclear
    // decision. An invalid/missing value is silently omitted (fail-safe
    // discipline, same as `verify`/`question` above), never thrown, on
    // both return sites below.
    const impactScore = Number.isInteger(verdict.impactScore) ? verdict.impactScore : undefined;

    // Mechanical (never model-supplied, unlike impactScore/titleProposal
    // above) — rides on either outcome the same way regardless, purely for
    // `addDiscovery`'s existing spread to persist per call so real usage
    // across the backlog can be read back later (`view.discovery[id]`)
    // before deciding whether discussion point 4's hard cap is even needed.
    const researchToolCallCount = Array.isArray(scoutCaptureOut?.entries) ? scoutCaptureOut.entries.length : undefined;

    // tsk-4rd (route A, recipe step 1 "làm sạch yêu cầu"): PROPOSALS only —
    // rides on either outcome exactly like `impactScore`, never gates
    // clear/unclear, and is never applied to `work.title`/`work.description`
    // by this function. Auto-overwriting a user-authored field is a product
    // decision this item didn't make (review-audit-self-decision: don't
    // silently undo a user decision) — `resolveDiscovery`'s existing
    // `addDiscovery(dir, { id, ...verdict })` spread already persists
    // whichever of these two fields are present, visible via
    // `view.discovery[id]`/`fgos show <id>`, for a person to read and apply
    // by hand (`fgos edit <id> --title/--description`) — no separate write.
    const titleProposal =
      typeof verdict.titleProposal === 'string' && verdict.titleProposal.trim() ? verdict.titleProposal.trim() : undefined;
    const descriptionProposal =
      typeof verdict.descriptionProposal === 'string' && verdict.descriptionProposal.trim()
        ? verdict.descriptionProposal.trim()
        : undefined;

    if (!verdict.clear) {
      const question =
        typeof verdict.question === 'string' && verdict.question.trim()
          ? verdict.question
          : DEFAULT_UNCLEAR_QUESTION;
      const out = { clear: false, question };
      if (impactScore !== undefined) {
        out.impactScore = impactScore;
      }
      if (titleProposal !== undefined) {
        out.titleProposal = titleProposal;
      }
      if (descriptionProposal !== undefined) {
        out.descriptionProposal = descriptionProposal;
      }
      if (researchToolCallCount !== undefined) {
        out.researchToolCallCount = researchToolCallCount;
      }
      return out;
    }

    const out = { clear: true };
    if (typeof verdict.verify === 'string' && verdict.verify.trim()) {
      out.verify = verdict.verify;
    }
    if (impactScore !== undefined) {
      out.impactScore = impactScore;
    }
    if (titleProposal !== undefined) {
      out.titleProposal = titleProposal;
    }
    if (descriptionProposal !== undefined) {
      out.descriptionProposal = descriptionProposal;
    }
    if (researchToolCallCount !== undefined) {
      out.researchToolCallCount = researchToolCallCount;
    }
    return out;
  } catch (err) {
    // tsk-5d2 D1-D3: same debug-only, non-load-bearing logging — the
    // returned fallback below is unchanged from before this item.
    appendJudgeFailLog(fgosDir, work?.id, { reason: 'outer-exception', message: err?.message, stack: err?.stack });
    return { clear: false, question: DEFAULT_UNCLEAR_QUESTION };
  }
}

/**
 * Read `id` from the store at `dir`, judge it via `judgeDiscovery`, and
 * resolve the verdict — the ONE function both the sync `discover` verb and
 * the async runner sweep call (D5/D13), so the clarify-loop logic never
 * duplicates.
 *
 * TRUST SIGNAL (tsk-ozl D1-D3): before judging blind, check whether the
 * item already carries a committed, non-empty CONTEXT.md under its
 * `docsRef` (`readLockedContext`, shared with decompose.mjs's own
 * locked-context read). When it does, decisions are already locked and
 * approved — re-judging via the model can only re-derive a possibly
 * contradicting verdict, including re-asking a question the human just
 * answered by writing CONTEXT.md in the first place (confirmed live,
 * tsk-ozl 2026-07-31: exactly this happened). Skip the model call, log a
 * `discovery skip:` decision for the audit trail (mirrors
 * `logDecomposeVerdict`'s pattern in decompose.mjs), and advance the item
 * directly — same content-based signal for BOTH the sync `session` caller
 * and the runner's RUL19 sweep (`role: 'runner'`), never a role branch: a
 * sweep that finds a real committed CONTEXT.md on an untouched item trusts
 * it too, which also covers the crashed-mid-explore-session case RUL19
 * exists to catch.
 *
 * Per D3/D6: the discovery record is written for BOTH outcomes (clear and
 * unclear), never only the failure path. A clear verdict moves the item to
 * `decompose` (stage-decompose D2 retarget — chia-việc is the next stop,
 * not `executing` directly), always carrying a `verify` (D10 — the model's
 * proposal, or `FALLBACK_VERIFY` when it did not supply one — never the
 * retired P14 placeholder). An unclear verdict parks the item in
 * `awaiting-human` with the verdict's question.
 *
 * `role` (per Phase 3 S3-closeout settlement design) attributes WHO ran
 * this pass — the two call sites disagree, so it is the caller's job to say:
 * the runner's clarify sweep passes `'runner'`, the sync `discover` verb
 * passes `'session'`. Optional; a clear verdict's `moveStage` only stamps it
 * on the settlement record when a caller actually supplies it.
 *
 * `callerVerdict` (tsk-27y D1/D2, optional, additive): `{clear: boolean,
 * question?, verify?}` — when supplied (`fgos discover --verdict ...`),
 * used INSTEAD of calling `judgeDiscovery`, checked before the
 * `readLockedContext` trust-signal above (explicit beats heuristic — the
 * whole point of this protocol: a live session that already reasoned about
 * clarity, fgos-exploring, should never fall through to either a blind
 * subprocess judge or a second heuristic guess). Omitted (every pre-tsk-27y
 * caller, including the runner sweep at `loop.mjs`, which calls
 * through argv-less, in-process) keeps this function byte-identical to
 * before.
 */
export function resolveDiscovery(dir, id, cfg, role, callerVerdict) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDiscovery: work "${id}" not found.`);
  }

  let verdict;
  if (callerVerdict) {
    verdict = { clear: callerVerdict.clear === true };
    if (verdict.clear) {
      if (typeof callerVerdict.verify === 'string' && callerVerdict.verify.trim()) {
        verdict.verify = callerVerdict.verify;
      }
    } else {
      verdict.question =
        typeof callerVerdict.question === 'string' && callerVerdict.question.trim()
          ? callerVerdict.question
          : DEFAULT_UNCLEAR_QUESTION;
    }
    addDecision(dir, {
      id,
      text: `discovery caller-supplied: clear=${verdict.clear}`,
      source: 'resolveDiscovery',
      rationale:
        'tsk-27y D2: caller-supplied verdict — session already reasoned live (fgos-exploring), skipping judgeDiscovery subprocess and the readLockedContext trust-signal check',
    });
  } else {
    // repoRoot (tsk-1ni D1): resolved to the item's own worktree when one
    // exists, never the raw state root -- see resolveContentRoot's own
    // comment in decompose.mjs. Reused below for BOTH readLockedContext's
    // own read AND judgeDiscovery's scoutContext (readScoutNotes/
    // writeScoutNotes) -- same variable, same bug, same fix.
    const stateRoot = path.dirname(dir);
    const repoRoot = resolveContentRoot(stateRoot, id, work.docsRef);
    const lockedContext = readLockedContext(repoRoot, work.docsRef);
    if (lockedContext) {
      addDecision(dir, {
        id,
        text: 'discovery skip: trusted committed CONTEXT.md, no model call',
        source: 'resolveDiscovery',
        rationale:
          'docsRef points at a non-empty CONTEXT.md (D2 trust signal, tsk-ozl) — skipping judgeDiscovery to avoid re-judging a decision already locked and approved',
      });
      addDiscovery(dir, { id, clear: true });
      // Real verify (tsk-19j D1/D11, closes gap 2): `gates[id].contextApprove.
      // verify` is the real command fgos-exploring's own Gate recorded for
      // this item when it approved CONTEXT.md — preferred over the retired
      // placeholder whenever a Track A approve record actually exists (an item
      // that never went through that Gate, e.g. from before this item, keeps
      // today's fallback unchanged). tsk-1ni D2: work.verify wins over both
      // when it is already real -- same guard, same rationale, as the
      // real-judge branch below (plan.md: "both call moveStage with a
      // verify value today, both get the guard").
      moveStage(dir, {
        id,
        to: stageForStep(getDomain(work.domain), 'Divide'),
        expectedStage: stageForStep(getDomain(work.domain), 'Clarify'),
        verify: hasRealVerify(work.verify) ? work.verify : (view.gates?.[id]?.contextApprove?.verify ?? FALLBACK_VERIFY),
        role,
      });
      return { outcome: 'clear', id, verdict: { clear: true, skipped: true } };
    }

    verdict = judgeDiscovery(work, cfg, view, { repoRoot, docsRef: work.docsRef }, dir);
  }

  addDiscovery(dir, { id, ...verdict });

  // work-item-priority-matrix D6/D7 (was STR8 D4's intentScore -> work.intent):
  // a SECOND standard-door write, never merged into moveStage's or
  // putInAwaiting's payload below — scored on EITHER outcome (an unclear
  // verdict still gets scored if the judge produced one; the item just
  // doesn't advance stage). D7: `intent` is retired IN PLACE — this is the
  // rough clarify-stage pass computing `priority` instead (effort is not
  // yet known here, so it defaults to EFFORT_FLOOR inside computePriority;
  // `decompose`'s refined pass recomputes once effort/blast-radius are
  // known, per plan.md Phase B). Wrapped in its own try/catch so a
  // write-door rejection (e.g. a legacy item shape editWork's validateWork
  // rejects) never aborts the clarify/unclear resolution that follows —
  // same file-level fail-safe discipline this module's header states for
  // judgeDiscovery itself.
  try {
    const impact = computeImpact({
      blocks: blocksForItem(work, view),
      semanticRelatedness: Number.isInteger(verdict.impactScore) ? verdict.impactScore : 0,
    });
    const priority = computePriority({ impact, urgent: work.urgent, risk: work.risk });
    editWork(dir, { id, patch: { priority }, role });
  } catch {
    // Swallowed intentionally — see comment above.
  }

  if (verdict.clear) {
    // tsk-5q5-1 (D2/D4): a model-proposed `verify` never rode into the
    // item's record unchecked before — only "is it a non-empty string"
    // (D10's own FALLBACK_VERIFY case has nothing to check, since it's a
    // fixed system string, not a model claim). A second, independent judge
    // call checks whether the proposal actually proves THIS item's claim,
    // not just that it's syntactically a command. Disagreement parks the
    // item exactly like an unclear first-pass verdict does — an uncertain
    // judgement is never treated as a pass (discovery.mjs's own D4 above).
    if (typeof verdict.verify === 'string' && verdict.verify.trim()) {
      // tsk-5cf D1a: thread the immediately-prior round's own disagreement
      // text back into this round's prompt, the same "give the judge its
      // own prior context" shape buildDiscoveryPrompt already uses for
      // view.discovery[id] (line ~223 above) -- gates[id].ask is a single
      // most-recent-value slot (replay.mjs's ask/answer fold: only a FRESH
      // ask overwrites it, an answer never clears it), so this is always
      // exactly the last round's own reason, never a stale one from a much
      // earlier dispute this round already moved past.
      const priorRejection = view?.gates?.[id]?.ask;
      const secondPass = judgeVerifySemanticCorrectness(work, verdict.verify, cfg, priorRejection);
      if (!secondPass.agrees) {
        // tsk-5cf D1b: a caller that already reasoned live through this
        // exact disagreement (e.g. a session that judged the second pass's
        // objections themselves inconsistent across rounds) can force past
        // it explicitly -- never silent: always logged with the disagreement
        // reason it overrode, per the "never silently overridden" stance
        // docs/explanation/judge-verdict-second-pass-semantic-check.md
        // already states for this exact two-judge-disagreement path.
        if (callerVerdict?.force === true) {
          // tsk-nfa D1: --force overrides the verify dispute only, never a
          // park state. An item already `awaiting-human` here means a PRIOR
          // discover call parked it (this dispute, or an unclear verdict) --
          // continuing on to moveStage below would advance stage while
          // status stays parked, and fgos return's `status !== 'doing'`
          // guard (bin/fgos.mjs) then refuses with no obvious way out.
          // Refuse here instead, pointing at the real resume path: status
          // changes stay exclusively behind the ask/answer door
          // (putInAwaiting/answerAwaiting, src/state/store.mjs), never a
          // synthetic answer manufactured by --force itself.
          if (work.status === 'awaiting-human') {
            throw new StoreError(
              'validation',
              `discover --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
            );
          }
          addDecision(dir, {
            id,
            text: `discover --force overrode a disputed verify: "${verdict.verify}"`,
            source: 'resolveDiscovery',
            rationale: `second pass disagreed: ${secondPass.reason}`,
          });
        } else {
          const ask =
            `Đề xuất verify bị nghi ngờ (chưa ghi vào clarify->decompose, cần xác nhận) — ` +
            `vòng 1 đề xuất: ${verdict.verify}\n` +
            `vòng 2 (kiểm tra độc lập) không đồng ý: ${secondPass.reason}`;
          // statusAtAsk (claim-lock §5.1): same rule as the unclear branch
          // below — read at function entry, before this park.
          putInAwaiting(dir, { id, ask, statusAtAsk: work.status });
          return { outcome: 'verify-disputed', id, verdict, secondPass };
        }
      }
    }

    // tsk-1ni D2: never let judgeDiscovery's own guess overwrite a verify
    // a prior stage already locked (e.g. fgos-validating's planApprove,
    // reached because this item's stage never got moved off clarify before
    // later stages ran) -- only the model's guess fills an empty/placeholder
    // field, same "locked beats fresh guess" trust the D1 skip-and-advance
    // path above already gives a committed CONTEXT.md.
    const verify = hasRealVerify(work.verify) ? work.verify : (verdict.verify ?? FALLBACK_VERIFY);

    moveStage(dir, {
      id,
      to: stageForStep(getDomain(work.domain), 'Divide'),
      expectedStage: stageForStep(getDomain(work.domain), 'Clarify'),
      verify,
      role,
    });
    return { outcome: 'clear', id, verdict };
  }

  // tsk-wcl: `putInAwaiting` always attempts a real `awaiting-human` status
  // transition (moveWork), and status-fsm.mjs has no self-transition edge for it —
  // calling it on an item that is ALREADY `awaiting-human` (re-running
  // `fgos discover <id>` directly on a still-parked item, bypassing the
  // pool picker that normally never re-selects a parked item) throws
  // StoreError and the whole call dies, losing this round's verdict
  // entirely. `addDiscovery` above already recorded the fresh verdict
  // unconditionally — only the redundant re-park is guarded here, so a
  // second consecutive unclear call on an already-parked item still
  // succeeds (with the item staying parked, its discovery history gaining
  // the new entry) instead of throwing.
  //
  // statusAtAsk (claim-lock §5.1): `work.status` read at function entry,
  // before this park — `doing` when a pick claim is held through clarify,
  // `todo` otherwise. answerAwaiting resumes to this same status later.
  if (work.status !== 'awaiting-human') {
    putInAwaiting(dir, { id, ask: verdict.question, statusAtAsk: work.status });
  }
  return { outcome: 'unclear', id, verdict };
}
