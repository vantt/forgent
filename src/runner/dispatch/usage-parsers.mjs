/**
 * Pure token usage parsers for runner dispatch adapters.
 *
 * Captures token usage from raw worker output for adapters that report it,
 * returning a normalized usage shape for RunResult:
 * {
 *   inputTokens: number | null,
 *   outputTokens: number | null,
 *   totalTokens: number | null,
 *   cacheReadTokens?: number | null,
 *   cacheCreationTokens?: number | null,
 *   source: string
 * } | null
 */

/**
 * Parse token usage from pi runner stdout (--mode json).
 * Pi emits JSON lines. Each assistant `message_end` event contains `usage`
 * for that specific turn (not cumulative).
 * We fold message_end events across all turns and deduplicate by responseId.
 *
 * @param {string|Buffer} stdoutContent
 * @returns {object|null}
 */
export function parsePiUsage(stdoutContent) {
  if (!stdoutContent) return null;
  const text = typeof stdoutContent === 'string' ? stdoutContent : stdoutContent.toString('utf8');
  if (!text.trim()) return null;

  const lines = text.split('\n');
  const seenResponseIds = new Set();
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let foundTurns = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('{')) continue;
    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (event?.type === 'message_end' && event.message?.role === 'assistant') {
      const responseId = event.message.responseId ?? event.message.id;
      if (responseId) {
        if (seenResponseIds.has(responseId)) continue;
        seenResponseIds.add(responseId);
      }

      const u = event.message.usage;
      if (u && typeof u === 'object') {
        foundTurns++;
        inputTokens += typeof u.input === 'number' ? u.input : 0;
        outputTokens += typeof u.output === 'number' ? u.output : 0;
        cacheReadTokens += typeof u.cacheRead === 'number' ? u.cacheRead : 0;
        cacheCreationTokens += typeof u.cacheWrite === 'number' ? u.cacheWrite : 0;
        if (typeof u.totalTokens === 'number') {
          totalTokens += u.totalTokens;
        } else {
          totalTokens += (typeof u.input === 'number' ? u.input : 0) + (typeof u.output === 'number' ? u.output : 0);
        }
      }
    }
  }

  if (foundTurns === 0) return null;

  return Object.freeze({
    inputTokens,
    outputTokens,
    totalTokens,
    cacheReadTokens,
    cacheCreationTokens,
    source: 'pi',
  });
}

/**
 * Parse token usage from codex-cli runner stderr.
 * Codex CLI prints `tokens used\n<N>` at the very end of stderr.
 * We anchor strictly to the last 2 non-empty lines to prevent false matches
 * against tool outputs (e.g. grep results containing "tokens used").
 *
 * @param {string|Buffer} stderrContent
 * @returns {object|null}
 */
export function parseCodexCliUsage(stderrContent) {
  if (!stderrContent) return null;
  const text = typeof stderrContent === 'string' ? stderrContent : stderrContent.toString('utf8');
  if (!text.trim()) return null;

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return null;

  const secondToLast = lines[lines.length - 2].toLowerCase();
  const lastLine = lines[lines.length - 1];

  if (secondToLast === 'tokens used' && /^[\d,]+$/.test(lastLine)) {
    const total = parseInt(lastLine.replace(/,/g, ''), 10);
    if (!Number.isNaN(total) && total >= 0) {
      return Object.freeze({
        inputTokens: null,
        outputTokens: null,
        totalTokens: total,
        cacheReadTokens: null,
        cacheCreationTokens: null,
        source: 'codex-cli',
      });
    }
  }

  return null;
}

/**
 * Claude tokens are captured via Observe transcript processing.
 *
 * @returns {object}
 */
export function parseClaudeUsage() {
  return Object.freeze({
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    cacheReadTokens: null,
    cacheCreationTokens: null,
    source: 'transcript',
  });
}

/**
 * Herdr tokens are unavailable through herdr runner output.
 *
 * @returns {object}
 */
export function parseHerdrUsage() {
  return Object.freeze({
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    cacheReadTokens: null,
    cacheCreationTokens: null,
    source: 'unavailable-herdr',
  });
}

/**
 * Parse usage for a given adapter and output files.
 *
 * @param {string} adapter Adapter key or executor name
 * @param {object} [streams]
 * @param {string|Buffer} [streams.stdout]
 * @param {string|Buffer} [streams.stderr]
 * @returns {object|null}
 */
export function parseUsageForAdapter(adapter, { stdout, stderr } = {}) {
  try {
    const normalized = typeof adapter === 'string' ? adapter.toLowerCase() : '';
    if (normalized.includes('herdr')) {
      return parseHerdrUsage();
    }
    if (normalized.includes('claude')) {
      return parseClaudeUsage();
    }
    if (normalized === 'pi' || normalized.includes('-pi') || normalized.startsWith('pi-')) {
      return parsePiUsage(stdout);
    }
    if (normalized === 'codex-cli' || normalized.includes('codex')) {
      // First try codex stderr tail
      const fromStderr = parseCodexCliUsage(stderr);
      if (fromStderr) return fromStderr;
      // If it ran under pi wrapper
      return parsePiUsage(stdout);
    }
    return Object.freeze({
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      cacheReadTokens: null,
      cacheCreationTokens: null,
      source: 'unsupported',
    });
  } catch {
    return Object.freeze({
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      cacheReadTokens: null,
      cacheCreationTokens: null,
      source: 'unrecognized',
    });
  }
}
