// How full a session's context window is, as a fraction. The status-line sidecar is the primary source: it
// carries the window size and the current usage, and its record for the turn lands shortly AFTER the Stop hook
// fires, so only a record newer than the hook's own timestamp counts as fresh. The transcript is the fallback and
// is one turn behind at Stop, so a fraction from it is reported `stale`.
import fs from 'node:fs';

const FRESH_WAIT_MS = 1500;
const POLL_MS = 100;

const tokensOf = (usage) =>
  ['input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].reduce((sum, key) => sum + (Number.isFinite(usage?.[key]) ? usage[key] : 0), 0);

const msOf = (ts) => (typeof ts === 'number' ? ts : Date.parse(ts));

function readLines(file) {
  try {
    return fs.readFileSync(file, 'utf8').split('\n');
  } catch {
    return [];
  }
}

function parse(line) {
  try {
    return line.trim() ? JSON.parse(line) : null;
  } catch {
    return null;
  }
}

/** Newest sidecar record of `sessionId` (any session when null) whose `ts` is later than `afterTs`, or null. */
export function latestSidecarRecord(sidecarPath, { sessionId = null, afterTs } = {}) {
  if (!Number.isFinite(afterTs)) throw new TypeError('latestSidecarRecord needs afterTs (ms): only a record newer than the Stop hook counts as fresh');
  let found = null;
  for (const line of readLines(sidecarPath)) {
    const record = parse(line);
    if (!record || (sessionId && record.session_id !== sessionId)) continue;
    const ts = msOf(record.ts);
    if (!Number.isFinite(ts) || ts <= afterTs) continue;
    if (!found || ts >= msOf(found.ts)) found = record;
  }
  return found;
}

/** Fraction from one sidecar record, or null when it carries no usage or window. */
export function measureFromSidecarRecord(record) {
  const window = record?.context_window;
  const usage = window?.current_usage;
  const size = window?.context_window_size;
  if (!usage || !Number.isFinite(size) || size <= 0) return null;
  const tokens = tokensOf(usage);
  return { fraction: tokens / size, tokens, windowSize: size, source: 'sidecar', stale: false, sidecarTs: record.ts };
}

/** Fraction from the transcript: the last non-sidechain assistant entry, deduped by `message.id`, over `windowSize`. */
export function measureFromTranscript(transcriptPath, windowSize) {
  if (!Number.isFinite(windowSize) || windowSize <= 0) throw new TypeError('measureFromTranscript needs a positive windowSize');
  const byMessage = new Map();
  for (const line of readLines(transcriptPath)) {
    const entry = parse(line);
    if (!entry || entry.type !== 'assistant' || entry.isSidechain) continue;
    const usage = entry.message?.usage;
    if (!usage) continue;
    byMessage.set(entry.message.id ?? `line-${byMessage.size}`, usage); // a repeated id keeps its last entry; Map keeps first insertion order
  }
  if (byMessage.size === 0) return null;
  const tokens = tokensOf([...byMessage.values()].at(-1));
  return { fraction: tokens / windowSize, tokens, windowSize, source: 'transcript', stale: true, sidecarTs: null };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The context fraction of a session. Waits up to `waitMs` for a sidecar record newer than `afterTs` (the Stop
 * hook's timestamp, ms), else falls back to the transcript and marks the answer stale. Null when neither has data.
 */
export async function measureContext({ sidecarPath, transcriptPath, sessionId = null, afterTs, windowSize, waitMs = FRESH_WAIT_MS, now = Date.now, pollMs = POLL_MS }) {
  if (!Number.isFinite(afterTs)) throw new TypeError('measureContext needs afterTs (ms): only a record newer than the Stop hook counts as fresh');
  const deadline = now() + waitMs;
  for (;;) {
    const fresh = sidecarPath ? measureFromSidecarRecord(latestSidecarRecord(sidecarPath, { sessionId, afterTs })) : null;
    if (fresh) return fresh;
    if (now() >= deadline) break;
    await sleep(pollMs);
  }
  return transcriptPath ? measureFromTranscript(transcriptPath, windowSize) : null;
}
