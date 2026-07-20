// judge-executor.mjs — shared spawn+parse+retry-once helper for the intake
// judge calls (str68 D1/D5). judgeDiscovery (discovery.mjs) and
// judgeDecompose (decompose.mjs) both spawn the nested `claude -p` executor
// via the identical resolveExecutorCommand -> spawnSync -> JSON.parse shape,
// and both are exposed to the same nested-session prose-vs-JSON failure mode
// (a process that exits 0 but returns prose instead of JSON). This helper
// lives once, used by both.

import { spawnSync } from 'node:child_process';
import { resolveExecutorCommand } from '../runner/dispatch.mjs';

// str68 D2: appended to the retry-only prompt, steering the nested model
// away from a prose/refusal response. Vietnamese to match this area's
// existing prompt language (buildDiscoveryPrompt/buildDecomposePrompt).
export const JUDGE_STRICT_JSON_SUFFIX =
  '\n\nTRẢ LỜI CHỈ BẰNG JSON THUẦN, KHÔNG PROSE, KHÔNG GIẢI THÍCH, KHÔNG HỎI LẠI.';

function spawnAttempt(cfg, model, prompt) {
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model });
  return spawnSync(command, args, {
    shell: false,
    timeout: cfg?.timeoutMs,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

// A parse-shaped failure (str68 Terms): exit 0, but stdout does not parse to
// a plain object (JSON.parse throws, or parses to null/an array/a
// primitive). Field-level validation (e.g. "clear" must be boolean) stays
// the caller's job — this only decides whether the attempt is retry-worthy.
function parseVerdict(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { parsed: true, verdict: parsed };
    }
    return { parsed: false };
  } catch {
    return { parsed: false };
  }
}

/**
 * Run a single judge call attempt against `prompt`, retrying exactly once
 * with `stricterPrompt` on a parse-shaped failure only (str68 D2). A
 * non-parse failure — spawn error, non-zero exit, or timeout — on either
 * attempt returns `null` immediately, never retries (str68 D2/D3). Each
 * attempt is bounded by the same `cfg.timeoutMs` (str68 D4), not a
 * shared/extended budget. Returns the parsed-but-unvalidated verdict object
 * on success, or `null` once both attempts are exhausted — callers apply
 * their own existing field validation and fail-safe branching to whichever
 * of these two outcomes they get.
 */
export function runJudgeExecutor(cfg, model, prompt, stricterPrompt) {
  const first = spawnAttempt(cfg, model, prompt);
  if (first.error || first.status !== 0) {
    return null;
  }

  const firstResult = parseVerdict(first.stdout);
  if (firstResult.parsed) {
    return firstResult.verdict;
  }

  const second = spawnAttempt(cfg, model, stricterPrompt);
  if (second.error || second.status !== 0) {
    return null;
  }

  const secondResult = parseVerdict(second.stdout);
  return secondResult.parsed ? secondResult.verdict : null;
}
