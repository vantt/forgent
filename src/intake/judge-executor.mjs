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

// tsk-wo5: every judge attempt previously spawned with `cfg.timeoutMs`
// unmodified — the runner's own global default (900000ms, dispatch.mjs),
// meant for the main worker process, not a bounded judge call. A caller
// with its own much shorter wall-clock budget (an interactive session's
// own ~120s default tool-call timeout, the exact ceiling tsk-wo5's own
// repro cited) could get killed by THAT external timeout instead of ever
// seeing this codebase's own already-existing clean fail-safe (a timeout
// kill fails the attempt immediately, no retry — runBoundedAttempts below
// — and every caller already folds a null verdict into a defined
// unclear/disagree outcome) — silence, not signal. 90000ms sits
// comfortably under that ~120s ceiling while staying generous relative to
// a normal judge call's actual latency, so the bound fires (and hands back
// the existing clean fail-safe) before an external caller's own timeout
// would silently kill the whole process instead.
export const DEFAULT_JUDGE_TIMEOUT_MS = 90000;

// Judge calls are bounded by the SMALLEST of: an explicit top-level
// `cfg.judgeTimeoutMs` override, the global `cfg.timeoutMs`, and
// DEFAULT_JUDGE_TIMEOUT_MS itself — never a plain override that could only
// ever loosen the bound. `judgeTimeoutMs` is its own top-level field, never
// nested under `cfg.executors.judge` — `resolveExecutorConfig`
// (dispatch.mjs) already treats `cfg.executors[tier]`'s mere PRESENCE as a
// full executor override (falling through the `byCapacity ?? perTier ??
// cfg.executor` chain), requiring `command`/`args` whenever set; a
// timeoutMs-only object there would fail that shape validation outright,
// not just get ignored. This is what keeps an existing caller-supplied
// `cfg.timeoutMs` shorter than the built-in default (e.g. a test forcing a
// fast, deterministic timeout) fully respected, while a caller that never
// thought about judge calls at all (the pre-tsk-wo5 default: only the
// global 900000ms) gets capped down to the built-in bound instead of
// inheriting that unbounded value.
export function resolveJudgeTimeoutMs(cfg) {
  const candidates = [cfg?.judgeTimeoutMs, cfg?.timeoutMs, DEFAULT_JUDGE_TIMEOUT_MS].filter(
    (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
  );
  return Math.min(...candidates);
}

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
// tsk-4rd (route A, discover-research-recipe): scout capture used to only
// recognize `Bash(rg:*)` — the sole tool the judge executor was ever
// granted. `executors.judge`/`capacities.judge-discovery` can now widen
// `--allowedTools` to Read/Grep/Glob/WebSearch/WebFetch/Task, so a scout
// pass may legitimately use any of those instead of `rg` — this set names
// which tool_use blocks count as scout evidence worth persisting.
// `Bash` stays filtered to `rg` only (a `git add`/`git commit` call is an
// action, not evidence); every other name in the set is captured
// unconditionally, since none of them are ever actions on this executor.
const SCOUTABLE_NON_BASH_TOOL_NAMES = new Set(['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'Task', 'Agent']);

function isScoutableToolUse(block) {
  if (block?.type !== 'tool_use') return false;
  if (block.name === 'Bash') return typeof block.input?.command === 'string' && /^\s*rg\b/.test(block.input.command);
  return SCOUTABLE_NON_BASH_TOOL_NAMES.has(block.name);
}

// One-line label for a captured tool_use, used as the entry's `command` in
// scout-notes.md — a real shell command for Bash(rg:*) (unchanged from
// before), or `<ToolName> <json input>` for every other scoutable tool, so
// the persisted note stays readable without needing the raw transcript.
function describeToolUse(block) {
  if (block.name === 'Bash') return block.input.command;
  try {
    return `${block.name} ${JSON.stringify(block.input)}`;
  } catch {
    return block.name;
  }
}

function extractScoutTranscript(stdout) {
  const entries = [];
  const pendingCallById = new Map();
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
        if (isScoutableToolUse(block)) {
          pendingCallById.set(block.id, describeToolUse(block));
        }
      }
    } else if (event?.type === 'user' && Array.isArray(event.message?.content)) {
      for (const block of event.message.content) {
        if (block?.type === 'tool_result' && pendingCallById.has(block.tool_use_id)) {
          const command = pendingCallById.get(block.tool_use_id);
          pendingCallById.delete(block.tool_use_id);
          const output = typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '');
          entries.push({ command, output: output.slice(0, SCOUT_OUTPUT_MAX_CHARS) });
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
//
// `capacityId`/`fgosDir` (tsk-2yp, optional): threaded straight into
// `resolveExecutorCommand`'s own capacity-aware precedence
// (`capacities.<capacityId>` > `executors.<tier>` > `executor`, tsk-62v).
// Both omitted (every pre-tsk-2yp caller) resolves exactly as before —
// `capacityId` absent skips the capacity lookup entirely, `fgosDir` absent
// skips the `kind: "cli"` presence check.
function spawnAttempt(cfg, model, prompt, tier, scoutCapture, capacityId, fgosDir) {
  const { command, args } = resolveExecutorCommand(cfg, { prompt, model, tier, capacityId, fgosDir });
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
// failure origins are indistinguishable on purpose for the RETURN VALUE, so
// a caller wrapping this in escalation never needs a failure-type field to
// decide whether to fall back. `capacityId`/`fgosDir` (tsk-2yp, optional) are
// threaded to every attempt exactly like `scoutCapture` — same
// mutable-object-style pass-through to `spawnAttempt`.
//
// `failDetail` (tsk-5d2, optional): the same mutable-object out-param
// convention `scoutCapture` already uses — when given, stashes WHICH of the
// two distinguishable null-causing branches fired plus its raw evidence,
// for a caller to persist via `appendJudgeFailLog` (judge-fail-log.mjs).
// This is purely additive debug reporting: it never changes which branch
// runs or what this function returns. `reason: 'non-parse-exit'` (spawn
// error/timeout/non-zero exit on the attempt that stopped the loop) or
// `reason: 'parse-exhausted'` (every attempt produced unparsable stdout) —
// the two return-`null` origins the caller-facing contract above
// deliberately keeps indistinguishable in the RETURN VALUE stay fully
// distinguishable here, in the out-param, for debugging.
function runBoundedAttempts(cfg, model, prompt, stricterPrompt, tier, maxAttempts, scoutCapture, capacityId, fgosDir, failDetail) {
  const parseAttempts = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnAttempt(cfg, model, attempt === 1 ? prompt : stricterPrompt, tier, scoutCapture, capacityId, fgosDir);
    if (result.error || result.status !== 0) {
      if (failDetail) {
        failDetail.reason = 'non-parse-exit';
        failDetail.attempt = attempt;
        failDetail.status = result.status ?? null;
        failDetail.signal = result.signal ?? null;
        failDetail.error = result.error?.message;
        failDetail.stderr = typeof result.stderr === 'string' ? result.stderr : undefined;
      }
      return null;
    }

    const verdict = parseVerdict(result.stdout);
    if (verdict.parsed) {
      return verdict.verdict;
    }
    parseAttempts.push({ attempt, stdout: typeof result.stdout === 'string' ? result.stdout : '' });
  }

  if (failDetail) {
    failDetail.reason = 'parse-exhausted';
    failDetail.attempts = parseAttempts;
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

// tsk-12t D1/D2/D4: mechanical pre-check for the documented `node --test`/
// `--test-name-pattern` reporter-format trap
// (docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md) --
// Node's default reporter never prints a TAP-style `# pass`/`# fail` line,
// so a verify grepping for that shape can never correctly detect pass/fail
// regardless of what the tested code does. Runs BEFORE the LLM spawn below
// (D4 — cheaper than relying on a second-pass LLM judge to catch a known
// syntactic anti-pattern every round) and is gated on BOTH the
// wrong-reporter grep shape AND a reference to `node --test`/
// `--test-name-pattern` (D2) — scoped to the how-to doc's own documented
// trap, not a bare ban on any TAP-style text (a legitimate verify for a
// different TAP-consuming tool must not false-positive here).
const KNOWN_BAD_VERIFY_PATTERN_DOC = 'docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md';
const NODE_TEST_REFERENCE_RE = /node\s+--test\b|--test-name-pattern\b/;
const WRONG_REPORTER_GREP_RE = /\^#\s*(pass|fail)\b/;

function matchesKnownBadVerifyPattern(proposedVerify) {
  return (
    typeof proposedVerify === 'string' &&
    NODE_TEST_REFERENCE_RE.test(proposedVerify) &&
    WRONG_REPORTER_GREP_RE.test(proposedVerify)
  );
}

function buildVerifyCheckPrompt(title, description, proposedVerify, priorRejection) {
  const desc = typeof description === 'string' && description.trim() ? description : '(không có)';
  const priorSection =
    typeof priorRejection === 'string' && priorRejection.trim()
      ? `\n# Vòng trước đã từ chối một đề xuất verify khác cho CHÍNH item này\n${priorRejection.trim()}\n\nĐề xuất mới dưới đây được viết để sửa đúng theo lý do từ chối ở trên. Đừng` +
        ` tự mâu thuẫn với chính lý do vòng trước của bạn: nếu đề xuất mới đã sửa` +
        ` đúng điểm bị chê, hãy đồng ý; chỉ từ chối tiếp nếu có lý do CỤ THỂ KHÁC,` +
        ` không lặp lại hoặc đảo ngược tiêu chí đã nêu ở vòng trước.\n`
      : '';
  return `# Kiểm tra độc lập một lệnh verify đã được đề xuất

Một vòng phán KHÁC vừa đề xuất lệnh verify dưới đây để chứng minh việc sau
đã xong. Bạn phán ĐỘC LẬP, không được vin vào "chắc đúng" hay "nghe hợp
lý" — chỉ đồng ý khi lệnh này THẬT SỰ kiểm chứng đúng claim của item, không
chỉ là một lệnh chạy được bất kỳ.

Title: ${title}
Mô tả: ${desc}
${priorSection}
# Lệnh verify được đề xuất
${proposedVerify}

# Bối cảnh: lệnh này được đề xuất TRƯỚC KHI code tồn tại
Lệnh verify trên được đề xuất ở giai đoạn shaping (clarify hoặc decompose)
— TRƯỚC KHI bất kỳ dòng code nào cho việc này được viết. Chỉ chấm hai
thứ: (1) cú pháp — lệnh có chạy được thật không, và (2) mục tiêu — lệnh
có nhắm đúng thứ item mô tả không. KHÔNG được đòi hỏi bằng chứng chỉ có
thể tồn tại SAU KHI code đã viết xong (ví dụ: đòi xem git diff, đòi biết
code đã đổi chưa, đòi chạy thử code hiện chưa tồn tại) — đó là một câu
hỏi sai chỗ ở giai đoạn này, không phải một lý do từ chối hợp lệ.

Nếu không đồng ý, lý do phải nêu một tiêu chí CỤ THỂ và MỚI — không được
lặp lại hoặc diễn đạt lại dưới hình thức khác một lý do đã nêu ở vòng
trước (nếu có).

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
 * `{agrees: boolean, reason?: string, mechanical?: true}` and never throws:
 * ANY failure — spawn error, timeout, non-zero exit, unparsable stdout, or a
 * missing/non-boolean `agrees` field — folds to `{agrees: false, reason:
 * DEFAULT_VERIFY_DISAGREE_REASON}`, matching this codebase's existing
 * fail-safe stance (an uncertain judgement is never treated as a pass,
 * discovery.mjs's own D4).
 *
 * tsk-12t D1/D3: a disagreement sourced from `matchesKnownBadVerifyPattern`
 * above (not the LLM) carries `mechanical: true` — a syntactic fact, not a
 * judgement call — so callers can tell it apart from an LLM-sourced
 * disagreement and refuse to let `--force` override it (D6).
 */
export function judgeVerifySemanticCorrectness(work, proposedVerify, cfg, priorRejection) {
  if (matchesKnownBadVerifyPattern(proposedVerify)) {
    return {
      agrees: false,
      mechanical: true,
      reason:
        `Verify dùng "node --test"/"--test-name-pattern" nhưng grep theo dòng TAP kiểu ` +
        `"^# pass"/"^# fail" — reporter mặc định của Node KHÔNG BAO GIỜ in dòng này ` +
        `(xem ${KNOWN_BAD_VERIFY_PATTERN_DOC}). Sửa lại theo cách doc đó hướng dẫn: grep ` +
        `dòng checkmark kèm mô tả test cụ thể, không dựa vào số đếm pass/fail gộp.`,
    };
  }

  try {
    const tier = work?.tier ?? DEFAULTS.tier;
    const model = modelForTier(cfg, tier);
    const prompt = buildVerifyCheckPrompt(work?.title, work?.description, proposedVerify, priorRejection);
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
 *
 * `capacityId`/`fgosDir` (tsk-2yp, optional, additive): threaded through
 * identically to `scoutCapture` — resolved on both the base attempts and the
 * escalation attempt via `resolveExecutorCommand`'s own
 * `capacities.<capacityId>` > `executors.<tier>` > `executor` precedence
 * (tsk-62v). Note the same precedence applies on the escalation attempt too:
 * a `capacityId` whose config entry declares its own `command`/`adapter`
 * wins over `escalateTier` there as well, same as it wins over `tier` on the
 * base attempts — today's only caller (`runJudgeExecutor`) never sets
 * `escalateTier`, so this never actually happens in practice.
 *
 * `failDetail` (tsk-5d2, optional, additive): threaded to `runBoundedAttempts`
 * identically to `scoutCapture`, and also populated on an escalation-attempt
 * failure (unreachable today — no caller sets `escalateTier` — but kept
 * symmetric so the out-param is never silently empty on a path that could
 * theoretically null out).
 */
export function runRetryingExecutor(
  cfg,
  model,
  prompt,
  stricterPrompt,
  { tier, maxAttempts, escalateTier, escalateModel, scoutCapture, capacityId, fgosDir, failDetail },
) {
  const verdict = runBoundedAttempts(cfg, model, prompt, stricterPrompt, tier, maxAttempts, scoutCapture, capacityId, fgosDir, failDetail);
  if (verdict !== null) {
    return verdict;
  }

  if (!escalateTier) {
    return null;
  }

  const result = spawnAttempt(cfg, escalateModel ?? model, stricterPrompt, escalateTier, scoutCapture, capacityId, fgosDir);
  if (result.error || result.status !== 0) {
    if (failDetail) {
      failDetail.reason = 'non-parse-exit';
      failDetail.attempt = 'escalation';
      failDetail.status = result.status ?? null;
      failDetail.signal = result.signal ?? null;
      failDetail.error = result.error?.message;
      failDetail.stderr = typeof result.stderr === 'string' ? result.stderr : undefined;
    }
    return null;
  }
  const escalated = parseVerdict(result.stdout);
  if (escalated.parsed) {
    return escalated.verdict;
  }
  if (failDetail) {
    failDetail.reason = 'parse-exhausted';
    failDetail.attempts = [{ attempt: 'escalation', stdout: typeof result.stdout === 'string' ? result.stdout : '' }];
  }
  return null;
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
 *
 * `capacityId`/`fgosDir` (tsk-2yp, optional, additive): lets a caller opt
 * this call into capacity-aware dispatch (`capacities.<capacityId>` ahead of
 * `executors.judge`, tsk-62v) instead of always resolving straight to
 * `executors.judge` (Claude). `judgeDiscovery`/`judgeDecompose` pass
 * `'judge-discovery'`/`'judge-decompose'`. Both omitted (every
 * pre-tsk-2yp caller) resolves exactly as before — no `capacities` entry
 * configured for those ids means `resolveExecutorConfig` falls through to
 * `executors.judge` regardless, so this is a no-op until an operator
 * actually adds one.
 */
// tsk-4rd (route A, discussion point 4 "đo trước khi ép"): `scoutCaptureOut`
// is an OPTIONAL trailing out-param (9th, additive — same threading
// convention `capacityId`/`fgosDir` already used, see
// docs/how-to/wire-a-headless-function-through-an-agent-executor-capacity.md
// step 1) a caller can supply as `{}` to read `.entries` back after this
// call returns, without this function's own return shape changing (still a
// bare verdict — `judgeDecompose`/every test/`runWatch` reads that
// unchanged). When given, it is used AS the mutable capture object instead
// of a throwaway `{}`, so it still ends up with the same `.entries` the
// throwaway would have had; omitted (every pre-existing caller) is
// byte-identical. This exists so `judgeDiscovery` can measure how many
// research tool calls a discover pass actually made — observability only,
// no cap enforced here.
//
// `failDetailOut` (tsk-5d2, optional, 10th trailing out-param, same
// convention as `scoutCaptureOut`): a caller supplies `{}` to read back
// which fail-safe branch fired (`.reason`) plus its raw evidence, after a
// `null` return. Threaded straight to `runRetryingExecutor`'s own
// `failDetail` option; omitted (every pre-tsk-5d2 caller) is
// byte-identical.
export function runJudgeExecutor(cfg, model, prompt, stricterPrompt, scout, capacityId, fgosDir, scoutCaptureOut, failDetailOut) {
  const capture = scout?.capture ? (scoutCaptureOut ?? {}) : null;
  // tsk-wo5: every attempt below spawns bounded by this judge-specific
  // timeout (DEFAULT_JUDGE_TIMEOUT_MS/resolveJudgeTimeoutMs above), never
  // the raw global `cfg.timeoutMs` — only `timeoutMs` is overridden, every
  // other field (executor/executors/capacities/models) passes through
  // unchanged.
  const judgeCfg = { ...cfg, timeoutMs: resolveJudgeTimeoutMs(cfg) };

  const verdict = runRetryingExecutor(judgeCfg, model, prompt, stricterPrompt, {
    tier: 'judge',
    maxAttempts: MAX_JUDGE_ATTEMPTS,
    scoutCapture: capture,
    capacityId,
    fgosDir,
    failDetail: failDetailOut,
  });

  if (verdict !== null && capture?.entries?.length) {
    writeScoutNotes(scout.repoRoot, scout.docsRef, capture.entries);
  }

  return verdict;
}
