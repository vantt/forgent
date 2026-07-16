// discovery.mjs — context-discovery engine for stage clarify (per
// stage-clarify D4/D5/D10/D13). Use-case layer: judges whether a work item
// carries enough real information to move into `stage: executing`, and
// resolves that judgement into the store's clarify-loop transitions.
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
// one despite being asked), this is the fallback the item moves into
// `executing` with — a DIFFERENT string from the retired P14 sentinel
// ("chưa xác định — P15 bổ sung"), so nothing from the old placeholder
// survives past clarify (must_haves truth 3).
const FALLBACK_VERIFY = 'chưa xác định — bổ sung thủ công';

function buildDiscoveryPrompt(work) {
  const refs = Array.isArray(work.refs) && work.refs.length ? work.refs.join(', ') : '(none)';
  const deps = Array.isArray(work.deps) && work.deps.length ? work.deps.join(', ') : '(none)';

  return `# Context-discovery

Bạn đang phán một work item có đủ thông tin để bắt tay THI CÔNG hay chưa.

Title: ${work.title}
Kind: ${work.kind}
Risk: ${work.risk ?? '(none)'}
Refs: ${refs}
Deps: ${deps}

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
 */
export function judgeDiscovery(work, cfg) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildDiscoveryPrompt(work);
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
 * `executing`, always carrying a `verify` (D10 — the model's proposal, or
 * `FALLBACK_VERIFY` when it did not supply one — never the retired P14
 * placeholder). An unclear verdict parks the item in `awaiting-human` with
 * the verdict's question.
 */
export function resolveDiscovery(dir, id, cfg) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolveDiscovery: work "${id}" not found.`);
  }

  const verdict = judgeDiscovery(work, cfg);
  addDiscovery(dir, { id, ...verdict });

  if (verdict.clear) {
    moveStage(dir, {
      id,
      to: 'executing',
      expectedStage: 'clarify',
      verify: verdict.verify ?? FALLBACK_VERIFY,
    });
    return { outcome: 'clear', id, verdict };
  }

  putInAwaiting(dir, { id, ask: verdict.question });
  return { outcome: 'unclear', id, verdict };
}
