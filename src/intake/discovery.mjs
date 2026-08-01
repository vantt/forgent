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

import path from 'node:path';
import { modelForTier } from '../runner/dispatch.mjs';
import { loadTemplate } from '../runner/prompt-templates.mjs';
import { runJudgeExecutor, JUDGE_STRICT_JSON_SUFFIX, readScoutNotes } from './judge-executor.mjs';
import { readLockedContext } from './decompose.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { listWork, moveStage, addDiscovery, addDecision, putInAwaiting, editWork, StoreError } from '../state/store.mjs';
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

function buildDiscoveryPrompt(work, view, priorScoutNotes) {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';
  const deps = Array.isArray(work.deps) && work.deps.length ? work.deps.join(', ') : '(none)';
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

# Mô tả đầy đủ (nguyên văn lúc submit)
${description}

# Hỏi-đáp với người
${qa}

# Các lần phán trước
${history}
${
  priorScoutNotes
    ? `\n# Kết quả scout đã lưu (LẦN TRƯỚC — dùng lại, KHÔNG rg lại cùng truy vấn)\n${priorScoutNotes}\n`
    : ''
}
${loadTemplate('judge-scout-instructions.txt')}
Câu trả lời của người ở trên là QUYẾT ĐỊNH CUỐI CÙNG — KHÔNG hỏi lại một chủ đề
đã được trả lời. Nếu câu trả lời đã đủ để thi công, verdict phải clear=true kèm
một \`verify\` chạy được thật.

# Câu hỏi
Item này đã đủ rõ để thi công chưa? Nếu đủ, đề xuất một lệnh \`verify\` chạy
được thật để chứng minh việc đã xong. Nếu chưa đủ, nêu MỘT câu hỏi cụ thể cần
người trả lời để làm rõ. Ngoài ra, ƯỚC LƯỢNG (không tính lại số \`blocks\` đã
cho ở trên) mức độ item này LIÊN QUAN tới feature/release khác — có giải
quyết/mở khoá được gì ngoài phạm vi hẹp của chính nó không — bằng một số
nguyên impactScore từ 0 đến 100 (0 = biệt lập, 100 = ảnh hưởng rất rộng);
trường này TÙY CHỌN, không ảnh hưởng đến quyết định clear/unclear.

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"clear": boolean, "question": string (chỉ khi clear=false), "verify": string (chỉ khi clear=true), "impactScore": number nguyên từ 0 đến 100 (tùy chọn)}
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
 */
export function judgeDiscovery(work, cfg, view, scoutContext) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const priorScoutNotes = scoutContext ? readScoutNotes(scoutContext.repoRoot, scoutContext.docsRef) : '';
    const prompt = buildDiscoveryPrompt(work, view, priorScoutNotes);
    const stricterPrompt = prompt + JUDGE_STRICT_JSON_SUFFIX;

    const scout = scoutContext
      ? { repoRoot: scoutContext.repoRoot, docsRef: scoutContext.docsRef, capture: !priorScoutNotes }
      : undefined;
    const verdict = runJudgeExecutor(cfg, model, prompt, stricterPrompt, scout);
    if (!verdict || typeof verdict.clear !== 'boolean') {
      return { clear: false, question: DEFAULT_UNCLEAR_QUESTION };
    }

    // work-item-priority-matrix D3 (was STR8 D4's intentScore): rides on
    // EITHER outcome — it never gates or changes the clear/unclear
    // decision. An invalid/missing value is silently omitted (fail-safe
    // discipline, same as `verify`/`question` above), never thrown, on
    // both return sites below.
    const impactScore = Number.isInteger(verdict.impactScore) ? verdict.impactScore : undefined;

    if (!verdict.clear) {
      const question =
        typeof verdict.question === 'string' && verdict.question.trim()
          ? verdict.question
          : DEFAULT_UNCLEAR_QUESTION;
      const out = { clear: false, question };
      if (impactScore !== undefined) {
        out.impactScore = impactScore;
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
    return out;
  } catch {
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
 */
export function resolveDiscovery(dir, id, cfg, role) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDiscovery: work "${id}" not found.`);
  }

  const repoRoot = path.dirname(dir);
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
    moveStage(dir, {
      id,
      to: 'decompose',
      expectedStage: 'clarify',
      verify: FALLBACK_VERIFY,
      role,
    });
    return { outcome: 'clear', id, verdict: { clear: true, skipped: true } };
  }

  const verdict = judgeDiscovery(work, cfg, view, { repoRoot, docsRef: work.docsRef });
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
    moveStage(dir, {
      id,
      to: 'decompose',
      expectedStage: 'clarify',
      verify: verdict.verify ?? FALLBACK_VERIFY,
      role,
    });
    return { outcome: 'clear', id, verdict };
  }

  // statusAtAsk (claim-lock §5.1): `work.status` read at function entry,
  // before this park — `doing` when a pick claim is held through clarify,
  // `todo` otherwise. answerAwaiting resumes to this same status later.
  putInAwaiting(dir, { id, ask: verdict.question, statusAtAsk: work.status });
  return { outcome: 'unclear', id, verdict };
}
