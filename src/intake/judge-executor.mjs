// judge-executor.mjs — shared spawn+parse+retry helper. judgeDiscovery
// (discovery.mjs) and judgeDecompose (decompose.mjs) both spawn the nested
// `claude -p` executor via the identical resolveExecutorCommand ->
// spawnSync -> JSON.parse shape, and both are exposed to the same
// nested-session prose-vs-JSON failure mode (a process that exits 0 but
// returns prose instead of JSON). `runRetryingExecutor` is the
// capacity-agnostic core of that pattern (bounded attempts, a
// stricter-instruction suffix on retry, JSON-parse-or-retry) — any capacity
// dispatch can call it with its own `tier`/`maxAttempts`, not just judge
// calls. `runJudgeExecutor` is judge-executor's own thin wrapper over it,
// preserving its exact prior behavior for its two existing callers.

import { spawnSync } from 'node:child_process';
import { resolveExecutorCommand } from '../runner/dispatch.mjs';

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

// `tier` reuses the existing generic `cfg.executors` string-keyed lookup
// (`resolveExecutorConfig`, dispatch.mjs) as a synthetic role key — a repo
// can grant a tier its own `executors.<tier>` block (e.g. `Bash(rg:*)` for
// scout capability) without touching the worker's own
// `cfg.executor`/`cfg.executors[<real tier>]` blocks. A tier absent from
// `cfg.executors` falls back to `cfg.executor`.
function spawnAttempt(cfg, model, prompt, tier) {
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model, tier });
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
 * Run a call attempt against `prompt` through `tier`'s resolved executor,
 * retrying with `stricterPrompt` on a parse-shaped failure only, up to
 * `maxAttempts` total attempts. A non-parse failure — spawn error, non-zero
 * exit, or timeout — on ANY attempt returns `null` immediately, never
 * retries. Each attempt is bounded by the same `cfg.timeoutMs`, not a
 * shared/extended budget. Returns the parsed-but-unvalidated verdict object
 * on success, or `null` once all attempts are exhausted (whether from
 * exhausting parse-shaped retries, or from an immediate non-parse failure on
 * any single attempt) — callers apply their own field validation, and any
 * escalation/fallback step, to whichever of these two outcomes they get.
 *
 * Capacity-agnostic: `tier` selects which `cfg.executors.<tier>` (or the
 * global `cfg.executor`) attempts spawn through, so any capacity dispatch
 * can call this directly with its own tier and attempt budget — it is not
 * hardcoded to judge calls.
 */
export function runRetryingExecutor(cfg, model, prompt, stricterPrompt, { tier, maxAttempts }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnAttempt(cfg, model, attempt === 1 ? prompt : stricterPrompt, tier);
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

/**
 * judge-executor's own call into `runRetryingExecutor` — `tier: 'judge'`,
 * `maxAttempts: MAX_JUDGE_ATTEMPTS` (str68 D2, raised to 3 by str68
 * nested-judge-fix's probabilistic-refusal headroom). Same exported name and
 * signature judgeDiscovery/judgeDecompose already call; behavior is
 * unchanged from before this extraction.
 */
export function runJudgeExecutor(cfg, model, prompt, stricterPrompt) {
  return runRetryingExecutor(cfg, model, prompt, stricterPrompt, {
    tier: 'judge',
    maxAttempts: MAX_JUDGE_ATTEMPTS,
  });
}
