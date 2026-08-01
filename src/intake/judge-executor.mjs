// judge-executor.mjs — shared spawn+parse+retry helper. judgeDiscovery
// (discovery.mjs) and judgeDecompose (decompose.mjs) both spawn the nested
// `claude -p` executor via the identical resolveExecutorCommand ->
// spawnSync -> JSON.parse shape, and both are exposed to the same
// nested-session prose-vs-JSON failure mode (a process that exits 0 but
// returns prose instead of JSON). `runRetryingExecutor` is the
// capacity-agnostic core of that pattern (bounded attempts, a
// stricter-instruction suffix on retry, JSON-parse-or-retry, optional
// escalation to a fallback tier) — any capacity dispatch can call it with
// its own `tier`/`maxAttempts`, not just judge calls. `runJudgeExecutor` is
// judge-executor's own thin wrapper over it, preserving its exact prior
// behavior for its two existing callers, plus the judge-specific scout-notes
// capture described below.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
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

// tsk-g18 (Cách B, agent-executor-design report §9): judge's own scout
// output (Bash(rg:*) results) never gets persisted anywhere today — every
// judgeDiscovery/judgeDecompose call re-scouts from scratch even when a
// prior call already ran the identical query on the same item. Fix is
// PARENT-side transcript capture, never a Write grant on the judge process
// itself (that was Cách A, rejected in the design doc — judge stays exactly
// as read-only as before this item). `SCOUT_NOTES_FILENAME` mirrors
// decompose.mjs's `readLockedContext` CONTEXT.md/plan.md convention: one
// committed file under the item's own `docsRef` directory.
const SCOUT_NOTES_FILENAME = 'scout-notes.md';

// Ripgrep output can be large; capped per scout entry so scout-notes.md (and
// the prompt section built from it) stays a bounded, cheap-to-re-read size
// rather than growing unbounded across repeated captures.
const SCOUT_OUTPUT_MAX_CHARS = 4000;

/**
 * Read this item's persisted scout notes, if any — the parent-captured
 * Bash(rg:*) transcript from a prior judge call, written under
 * `docs/history/<docsRef>/scout-notes.md`. Mirrors `readLockedContext`'s
 * exact shape (decompose.mjs): best-effort `fs.readFileSync`, any read
 * error (including ENOENT) folds to `''` — a missing/unreadable file is
 * never an error, just "no notes yet". Presence alone means fresh, same
 * trust-the-committed-artifact stance `readLockedContext` already takes for
 * CONTEXT.md — no separate staleness/mtime check.
 */
export function readScoutNotes(repoRoot, docsRef) {
  if (typeof docsRef !== 'string' || !docsRef.trim()) return '';
  try {
    return fs.readFileSync(path.join(repoRoot, docsRef, SCOUT_NOTES_FILENAME), 'utf8').trim();
  } catch {
    return '';
  }
}

// Parent-side write (never the judge subprocess) — the one new filesystem
// capability this item adds, deliberately scoped to code the judge cannot
// influence beyond what commands it chose to run. Best-effort: a failed
// write (e.g. an unwritable docsRef dir) must never break the judge call
// that produced the entries.
function writeScoutNotes(repoRoot, docsRef, entries) {
  if (typeof docsRef !== 'string' || !docsRef.trim() || !entries.length) return;
  try {
    const dir = path.join(repoRoot, docsRef);
    fs.mkdirSync(dir, { recursive: true });
    const body = entries
      .map((e, i) => `## Scout ${i + 1}\n\n**Command:** \`${e.command}\`\n\n\`\`\`\n${e.output}\n\`\`\``)
      .join('\n\n');
    fs.writeFileSync(path.join(dir, SCOUT_NOTES_FILENAME), `${body}\n`, 'utf8');
  } catch {
    // best-effort only, see comment above
  }
}

// Parses a `claude -p --output-format stream-json` NDJSON transcript:
// `assistant` events carry `tool_use` blocks (captures each `Bash` call
// whose command starts with `rg`), the matching `user` event's
// `tool_result` block carries that call's output, and the terminal `result`
// event carries the judge's actual final answer (what plain-stdout capture
// would have returned outright). Any line that isn't valid JSON, or doesn't
// match one of these shapes, is skipped rather than thrown on — a
// transcript format mismatch degrades to "no scout entries captured", never
// a crash.
function extractScoutTranscript(stdout) {
  const entries = [];
  const pendingRgCallById = new Map();
  let finalResult;

  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (event?.type === 'assistant' && Array.isArray(event.message?.content)) {
      for (const block of event.message.content) {
        if (block?.type === 'tool_use' && block.name === 'Bash' && typeof block.input?.command === 'string') {
          pendingRgCallById.set(block.id, block.input.command);
        }
      }
    } else if (event?.type === 'user' && Array.isArray(event.message?.content)) {
      for (const block of event.message.content) {
        if (block?.type === 'tool_result' && pendingRgCallById.has(block.tool_use_id)) {
          const command = pendingRgCallById.get(block.tool_use_id);
          pendingRgCallById.delete(block.tool_use_id);
          if (/^\s*rg\b/.test(command)) {
            const output = typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '');
            entries.push({ command, output: output.slice(0, SCOUT_OUTPUT_MAX_CHARS) });
          }
        }
      }
    } else if (event?.type === 'result' && typeof event.result === 'string') {
      finalResult = event.result;
    }
  }

  return { entries, finalResult };
}

// `tier` reuses the existing generic `cfg.executors` string-keyed lookup
// (`resolveExecutorConfig`, dispatch.mjs) as a synthetic role key — a repo
// can grant a tier its own `executors.<tier>` block (e.g. `Bash(rg:*)` for
// scout capability) without touching the worker's own
// `cfg.executor`/`cfg.executors[<real tier>]` blocks. A tier absent from
// `cfg.executors` falls back to `cfg.executor`.
//
// `scoutCapture` (tsk-g18, optional): non-null only when the caller wants
// this attempt's transcript captured (no fresh scout-notes.md yet). Adds
// `--output-format stream-json --verbose` to the resolved args, parses the
// NDJSON transcript, stashes any captured `Bash(rg:*)` entries onto
// `scoutCapture.entries` for the caller to persist, and replaces `stdout`
// with the transcript's terminal `result` text (falling back to the raw
// stdout when no `result` event was found) so every downstream consumer
// (`parseVerdict`) keeps reading a single JSON-verdict string exactly as
// before — `null`/omitted `scoutCapture` skips all of this, byte-identical
// to pre-tsk-g18 behavior.
function spawnAttempt(cfg, model, prompt, tier, scoutCapture) {
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model, tier });
  const finalArgs = scoutCapture ? [...args, '--output-format', 'stream-json', '--verbose'] : args;
  const result = spawnSync(command, finalArgs, {
    shell: false,
    timeout: cfg?.timeoutMs,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (!scoutCapture || result.error || result.status !== 0 || typeof result.stdout !== 'string') {
    return result;
  }

  const { entries, finalResult } = extractScoutTranscript(result.stdout);
  scoutCapture.entries = entries;
  return typeof finalResult === 'string' ? { ...result, stdout: finalResult } : result;
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

// Run bounded attempts against `tier`'s resolved executor, retrying with
// `stricterPrompt` on a parse-shaped failure only, up to `maxAttempts`
// total attempts. A non-parse failure — spawn error, non-zero exit, or
// timeout — on ANY attempt returns `null` immediately, never retries. Each
// attempt is bounded by the same `cfg.timeoutMs`, not a shared/extended
// budget. `scoutCapture`, when given, is threaded to every attempt exactly
// like `spawnAttempt` itself expects — the same mutable object accumulates
// whichever attempt's transcript entries last ran. Returns the
// parsed-but-unvalidated verdict object on success, or `null` once all
// attempts are exhausted (whether from exhausting parse-shaped retries, or
// from an immediate non-parse failure on any single attempt) — the two
// failure origins are indistinguishable on purpose, so a caller wrapping
// this in escalation never needs a failure-type field to decide whether to
// fall back.
function runBoundedAttempts(cfg, model, prompt, stricterPrompt, tier, maxAttempts, scoutCapture) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnAttempt(cfg, model, attempt === 1 ? prompt : stricterPrompt, tier, scoutCapture);
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
 * Run `runBoundedAttempts` against `tier`, and — when the base attempts
 * return `null` and the caller declared `escalateTier` — make exactly one
 * further attempt against `escalateTier`'s resolved executor before giving
 * up. The escalation attempt reuses `stricterPrompt` (already biased toward
 * a clean-JSON response) and defaults to the same `model` unless
 * `escalateModel` is given; it is single-shot, not its own bounded retry
 * loop. Returns the parsed-but-unvalidated verdict object on success (from
 * either the base attempts or the escalation attempt), or `null` once both
 * are exhausted — callers still apply their own field validation.
 *
 * Capacity-agnostic: `tier`/`escalateTier` select which `cfg.executors.<id>`
 * (or the global `cfg.executor`) attempts spawn through, so any capacity
 * dispatch can call this directly with its own tier and attempt budget, and
 * opt into escalation only by passing `escalateTier` — it is not hardcoded
 * to judge calls, and a caller that never passes `escalateTier` sees no
 * change in behavior. `scoutCapture` (optional, additive) is threaded
 * through both the base attempts and the escalation attempt identically to
 * `tier`/`model` — today only `runJudgeExecutor`'s own wrapper ever sets it,
 * and it never also sets `escalateTier`, so the two features never actually
 * interact in practice; threading it uniformly just avoids a second,
 * escalation-only code path.
 */
export function runRetryingExecutor(
  cfg,
  model,
  prompt,
  stricterPrompt,
  { tier, maxAttempts, escalateTier, escalateModel, scoutCapture },
) {
  const verdict = runBoundedAttempts(cfg, model, prompt, stricterPrompt, tier, maxAttempts, scoutCapture);
  if (verdict !== null) {
    return verdict;
  }

  if (!escalateTier) {
    return null;
  }

  const result = spawnAttempt(cfg, escalateModel ?? model, stricterPrompt, escalateTier, scoutCapture);
  if (result.error || result.status !== 0) {
    return null;
  }
  const escalated = parseVerdict(result.stdout);
  return escalated.parsed ? escalated.verdict : null;
}

/**
 * judge-executor's own call into `runRetryingExecutor` — `tier: 'judge'`,
 * `maxAttempts: MAX_JUDGE_ATTEMPTS` (str68 D2, raised to 3 by str68
 * nested-judge-fix's probabilistic-refusal headroom). Same exported name and
 * signature judgeDiscovery/judgeDecompose already call; behavior is
 * unchanged from before the tsk-418 extraction.
 *
 * `scout` (tsk-g18, optional, additive): `{ repoRoot, docsRef, capture }`.
 * Omitted (every pre-tsk-g18 caller) keeps this function byte-identical to
 * before. When supplied with `capture: true` (the caller found no existing
 * scout-notes.md for this item), each attempt spawns with transcript
 * capture on; on whichever attempt actually produces a parsed verdict, any
 * captured `Bash(rg:*)` entries are persisted to
 * `docs/history/<docsRef>/scout-notes.md`. `capture: false` (fresh notes
 * already exist) spawns exactly like a pre-tsk-g18 call — no transcript
 * capture, no write — since there is nothing new worth persisting.
 */
export function runJudgeExecutor(cfg, model, prompt, stricterPrompt, scout) {
  const capture = scout?.capture ? {} : null;

  const verdict = runRetryingExecutor(cfg, model, prompt, stricterPrompt, {
    tier: 'judge',
    maxAttempts: MAX_JUDGE_ATTEMPTS,
    scoutCapture: capture,
  });

  if (verdict !== null && capture?.entries?.length) {
    writeScoutNotes(scout.repoRoot, scout.docsRef, capture.entries);
  }

  return verdict;
}
