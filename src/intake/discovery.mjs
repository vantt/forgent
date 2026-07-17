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

import { spawnSync } from 'node:child_process';
import { resolveExecutorCommand, modelForTier } from '../runner/dispatch.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { listWork, moveStage, addDiscovery, putInAwaiting, StoreError } from '../state/store.mjs';

const DEFAULT_UNCLEAR_QUESTION =
  'Không phán được rõ ràng — cần người xác nhận thủ công.';

// D10: when a clear verdict carries no `verify` (the model failed to propose
// one despite being asked), this is the fallback the item moves out of
// clarify with — a DIFFERENT string from the retired P14 sentinel
// ("chưa xác định — P15 bổ sung"), so nothing from the old placeholder
// survives past clarify (must_haves truth 3).
const FALLBACK_VERIFY = 'chưa xác định — bổ sung thủ công';

/**
 * `view` is OPTIONAL (per discovery-context P30's backward-compat seam):
 * every call site that has one loaded (resolveDiscovery) passes it so the
 * prompt carries description/ask-answer/prior-verdict context; a caller
 * with no view (old 2-arg unit-test callers) degrades every added section
 * to a "(không có)"/"(chưa ...)" placeholder instead of throwing.
 */
function buildDiscoveryPrompt(work, view) {
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

  return `# Context-discovery

Bạn đang phán một work item có đủ thông tin để bắt tay THI CÔNG hay chưa.

Title: ${work.title}
Kind: ${work.kind}
Risk: ${work.risk ?? '(none)'}
Refs: ${refs}
Deps: ${deps}

# Mô tả đầy đủ (nguyên văn lúc submit)
${description}

# Hỏi-đáp với người
${qa}

# Các lần phán trước
${history}

Câu trả lời của người ở trên là QUYẾT ĐỊNH CUỐI CÙNG — KHÔNG hỏi lại một chủ đề
đã được trả lời. Nếu câu trả lời đã đủ để thi công, verdict phải clear=true kèm
một \`verify\` chạy được thật.

# Câu hỏi
Item này đã đủ rõ để thi công chưa? Nếu đủ, đề xuất một lệnh \`verify\` chạy
được thật để chứng minh việc đã xong. Nếu chưa đủ, nêu MỘT câu hỏi cụ thể cần
người trả lời để làm rõ.

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"clear": boolean, "question": string (chỉ khi clear=false), "verify": string (chỉ khi clear=true)}
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
 */
export function judgeDiscovery(work, cfg, view) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildDiscoveryPrompt(work, view);
    const { command, args } = resolveExecutorCommand(cfg, { prompt, model });

    const result = spawnSync(command, args, {
      shell: false,
      timeout: cfg?.timeoutMs,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.error || result.status !== 0) {
      return { clear: false, question: DEFAULT_UNCLEAR_QUESTION };
    }

    const verdict = JSON.parse(result.stdout);
    if (!verdict || typeof verdict.clear !== 'boolean') {
      return { clear: false, question: DEFAULT_UNCLEAR_QUESTION };
    }

    if (!verdict.clear) {
      const question =
        typeof verdict.question === 'string' && verdict.question.trim()
          ? verdict.question
          : DEFAULT_UNCLEAR_QUESTION;
      return { clear: false, question };
    }

    const out = { clear: true };
    if (typeof verdict.verify === 'string' && verdict.verify.trim()) {
      out.verify = verdict.verify;
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
 * Per D3/D6: the discovery record is written for BOTH outcomes (clear and
 * unclear), never only the failure path. A clear verdict moves the item to
 * `decompose` (stage-decompose D2 retarget — chia-việc is the next stop,
 * not `executing` directly), always carrying a `verify` (D10 — the model's
 * proposal, or `FALLBACK_VERIFY` when it did not supply one — never the
 * retired P14 placeholder). An unclear verdict parks the item in
 * `awaiting-human` with the verdict's question.
 *
 * `actor` (per Phase 3 S3-closeout settlement design) attributes WHO ran
 * this pass — the two call sites disagree, so it is the caller's job to say:
 * the runner's clarify sweep passes `'runner'`, the sync `discover` verb
 * passes `'session'`. Optional; a clear verdict's `moveStage` only stamps it
 * on the settlement record when a caller actually supplies it.
 */
export function resolveDiscovery(dir, id, cfg, actor) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDiscovery: work "${id}" not found.`);
  }

  const verdict = judgeDiscovery(work, cfg, view);
  addDiscovery(dir, { id, ...verdict });

  if (verdict.clear) {
    moveStage(dir, {
      id,
      to: 'decompose',
      expectedStage: 'clarify',
      verify: verdict.verify ?? FALLBACK_VERIFY,
      actor,
    });
    return { outcome: 'clear', id, verdict };
  }

  putInAwaiting(dir, { id, ask: verdict.question });
  return { outcome: 'unclear', id, verdict };
}
