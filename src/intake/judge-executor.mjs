// judge-executor.mjs — shared spawn+parse+retry-once helper for the intake
// judge calls (str68 D1/D5). judgeDiscovery (discovery.mjs) and
// judgeDecompose (decompose.mjs) both spawn the nested `claude -p` executor
// via the identical resolveExecutorCommand -> spawnSync -> JSON.parse shape,
// and both are exposed to the same nested-session prose-vs-JSON failure mode
// (a process that exits 0 but returns prose instead of JSON). This helper
// lives once, used by both.

import { spawnSync } from 'node:child_process';
import { resolveExecutorCommand, modelForTier } from '../runner/dispatch.mjs';
import { DEFAULTS } from '../state/work.mjs';

// str68 D2: appended to the retry-only prompt, steering the nested model
// away from a prose/refusal response. Vietnamese to match this area's
// existing prompt language (buildDiscoveryPrompt/buildDecomposePrompt).
export const JUDGE_STRICT_JSON_SUFFIX =
  '\n\nTRẢ LỜI CHỈ BẰNG JSON THUẦN, KHÔNG PROSE, KHÔNG GIẢI THÍCH, KHÔNG HỎI LẠI.';

// str68 nested-judge-fix: total attempts (1 normal + 2 stricter retries),
// raised from 2 (1 normal + 1 retry) — the refusal is probabilistic
// (original str68 report: "đôi khi" = sometimes), not deterministic, so a
// single retry wasn't enough headroom.
const MAX_JUDGE_ATTEMPTS = 3;

function spawnAttempt(cfg, model, prompt) {
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model });
  return spawnSync(command, args, {
    shell: false,
    timeout: cfg?.timeoutMs,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

// tsk-37v: the nested `claude -p` executor routinely wraps an otherwise-valid
// verdict in a markdown code fence (```json ... ``` or ``` ... ```) despite
// JUDGE_STRICT_JSON_SUFFIX asking for none — a habit of the underlying model,
// not a refusal. Stripping it here (before JSON.parse) is a no-op on stdout
// that was never fenced, so this never changes behavior for a clean response.
function stripCodeFence(stdout) {
  const trimmed = stdout.trim();
  const match = trimmed.match(/^```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n?```$/);
  return match ? match[1] : trimmed;
}

// A parse-shaped failure (str68 Terms): exit 0, but stdout does not parse to
// a plain object (JSON.parse throws, or parses to null/an array/a
// primitive). Field-level validation (e.g. "clear" must be boolean) stays
// the caller's job — this only decides whether the attempt is retry-worthy.
function parseVerdict(stdout) {
  try {
    const parsed = JSON.parse(stripCodeFence(stdout));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { parsed: true, verdict: parsed };
    }
    return { parsed: false };
  } catch {
    return { parsed: false };
  }
}

/**
 * Run a judge call attempt against `prompt`, retrying with `stricterPrompt`
 * on a parse-shaped failure only, up to `MAX_JUDGE_ATTEMPTS` total attempts
 * (str68 D2, raised to 3 by str68 nested-judge-fix). A non-parse failure —
 * spawn error, non-zero exit, or timeout — on ANY attempt returns `null`
 * immediately, never retries (str68 D2/D3, unchanged). Each attempt is
 * bounded by the same `cfg.timeoutMs` (str68 D4), not a shared/extended
 * budget. Returns the parsed-but-unvalidated verdict object on success, or
 * `null` once all attempts are exhausted — callers apply their own existing
 * field validation and fail-safe branching to whichever of these two
 * outcomes they get.
 */
export function runJudgeExecutor(cfg, model, prompt, stricterPrompt) {
  for (let attempt = 1; attempt <= MAX_JUDGE_ATTEMPTS; attempt += 1) {
    const result = spawnAttempt(cfg, model, attempt === 1 ? prompt : stricterPrompt);
    if (result.error || result.status !== 0) {
      return null;
    }

    const verdict = parseVerdict(result.stdout);
    if (verdict.parsed) {
      return verdict.verdict;
    }
  }

  return null;
}

// tsk-5q5-1 (D2/D4, docs/history/judge-verdict-evidence-discipline/): neither
// judgeDiscovery nor judgeDecompose ever checked whether a model-proposed
// `verify` actually tests the item's own claim — only that it was a
// non-empty string. This is the second, INDEPENDENT judgment pass that
// catches the semantic case a syntax check cannot: a `verify` that is
// syntactically fine shell but names the wrong target (the confirmed
// tsk-d3c failure). Shared here (not duplicated in discovery.mjs/
// decompose.mjs) for the same reason runJudgeExecutor is shared: both
// callers need the identical spawn/parse/fail-safe shape.
const DEFAULT_VERIFY_DISAGREE_REASON =
  'Không phán được rõ ràng ở vòng kiểm tra thứ hai — cần người xác nhận.';

function buildVerifyCheckPrompt(title, description, proposedVerify) {
  const desc = typeof description === 'string' && description.trim() ? description : '(không có)';
  return `# Kiểm tra độc lập một lệnh verify đã được đề xuất

Một vòng phán KHÁC vừa đề xuất lệnh verify dưới đây để chứng minh việc sau
đã xong. Bạn phán ĐỘC LẬP, không được vin vào "chắc đúng" hay "nghe hợp
lý" — chỉ đồng ý khi lệnh này THẬT SỰ kiểm chứng đúng claim của item, không
chỉ là một lệnh chạy được bất kỳ.

Title: ${title}
Mô tả: ${desc}

# Lệnh verify được đề xuất
${proposedVerify}

# Câu hỏi
Lệnh verify trên có kiểm chứng ĐÚNG claim của item này không — cả về cú
pháp (chạy được thật) LẪN mục tiêu (nhắm đúng thứ item mô tả, không phải
một thứ khác đã hoạt động sẵn)? Nếu không đồng ý, nêu MỘT lý do cụ thể.

# Định dạng trả lời
Trả lời DUY NHẤT bằng một dòng JSON, không kèm chữ nào khác:
{"agrees": boolean, "reason": string (bắt buộc khi agrees=false)}
`;
}

/**
 * Second-pass semantic-correctness check on a model-proposed `verify`
 * string, independent of whichever judge call proposed it. Always returns
 * `{agrees: boolean, reason?: string}` and never throws: ANY failure — spawn
 * error, timeout, non-zero exit, unparsable stdout, or a missing/non-boolean
 * `agrees` field — folds to `{agrees: false, reason: DEFAULT_VERIFY_DISAGREE_REASON}`,
 * matching this codebase's existing fail-safe stance (an uncertain judgement
 * is never treated as a pass, discovery.mjs's own D4).
 */
export function judgeVerifySemanticCorrectness(work, proposedVerify, cfg) {
  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildVerifyCheckPrompt(work?.title, work?.description, proposedVerify);
    const stricterPrompt = prompt + JUDGE_STRICT_JSON_SUFFIX;

    const verdict = runJudgeExecutor(cfg, model, prompt, stricterPrompt);
    if (!verdict || typeof verdict.agrees !== 'boolean') {
      return { agrees: false, reason: DEFAULT_VERIFY_DISAGREE_REASON };
    }

    if (!verdict.agrees) {
      const reason =
        typeof verdict.reason === 'string' && verdict.reason.trim() ? verdict.reason : DEFAULT_VERIFY_DISAGREE_REASON;
      return { agrees: false, reason };
    }

    return { agrees: true };
  } catch {
    return { agrees: false, reason: DEFAULT_VERIFY_DISAGREE_REASON };
  }
}
