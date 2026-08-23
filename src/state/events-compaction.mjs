// events-compaction.mjs -- Tầng A/T6 (TA-D5/TA-D13): gộp per-writer files
// under `.fgos/events/` whose writer has gone cold/idle into one
// `baseline-<ts>.jsonl`, so the directory doesn't grow unbounded forever
// (D5). Runs under the same cross-process `events.lock` every other
// mutation/refresh holds (TA-D14), so a compaction can never straddle a
// concurrent append.
//
// Domain tier (not kernel, unlike its siblings events.mjs/events-jsonl-
// truncation-guard.mjs/events-jsonl-contiguity.mjs): the verify gate below
// needs `foldEvents` (replay.mjs, domain tier) to prove a compaction never
// changes the folded view -- a kernel-tier module cannot reach that
// (one-way-down layering, docs/architecture-manifest.json), and this
// module's whole reason to exist IS that fold-level proof, not just raw
// file mechanics.
//
// SAFETY (per TA-D13, the whole point of T1's content-hash identity): a
// crash between writing `baseline-<ts>.jsonl` and archiving the originals
// leaves BOTH coexisting under `.fgos/events/` -- replay's dedupe-by-hash
// (replay.mjs's `readAllEventsFromDir`) makes that straddle harmless, a
// double-apply becomes structurally impossible rather than a discipline to
// maintain. Never deletes anything: a break in the verify gate deletes only
// the just-written CANDIDATE baseline file (nothing existed before this
// attempt started), never an original.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readEvents, withEventsLock } from './events.mjs';
import { foldEvents } from './replay.mjs';

// D5: not yet measured against real write speed (same caveat
// DEFAULT_CHECKPOINT_EVENT_THRESHOLD's own doc comment carries) -- a
// starting point, config key `checkpoint.compactionEventThreshold`
// override once real production data exists. Deliberately its OWN key,
// separate from `checkpoint.eventThreshold` (T5's periodic-commit
// trigger): compaction is a much heavier, rarer operation than a commit.
export const DEFAULT_COMPACTION_EVENT_THRESHOLD = 500;

// A writer file is a compaction CANDIDATE only once nothing has appended to
// it in this long -- conservatively longer than any plausible single
// working session, so an active writer's file is never swept mid-use. Not
// yet measured against real usage; revisit alongside the event threshold
// above once real production data exists.
export const DEFAULT_IDLE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

function formatCompactTs(date) {
  return date.toISOString().replace(/[-:]/g, '').replace('.', '');
}

/**
 * Every real per-writer file directly under `${eventsDirPath}` -- `*.jsonl`,
 * non-recursive (`archive/` is a subdirectory, structurally never included),
 * EXCLUDING anything already named `baseline-*.jsonl` (a past compaction's
 * own output is a closed unit, never itself re-compacted -- YAGNI: no
 * recursive/cascading compaction in this task's scope).
 */
export function discoverWriterFiles(eventsDirPath) {
  let names = [];
  try {
    names = fs
      .readdirSync(eventsDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl') && !entry.name.startsWith('baseline-'))
      .map((entry) => entry.name);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return names.map((name) => ({ name, path: path.join(eventsDirPath, name) }));
}

/** `discoverWriterFiles` narrowed to files whose mtime is at least
 * `idleThresholdMs` old as of `nowMs` -- the "writer đã chết/idle" signal
 * (TA-D5): the writer's own file is never touched again once its session
 * ends, so a long-untouched file is the practical proxy for a dead/idle
 * writer this module uses (no cross-tier reach into the session registry
 * or a live-pid check needed for that). */
export function findColdWriterFiles(eventsDirPath, { nowMs = Date.now(), idleThresholdMs = DEFAULT_IDLE_THRESHOLD_MS } = {}) {
  const cutoff = nowMs - idleThresholdMs;
  return discoverWriterFiles(eventsDirPath).filter(({ path: filePath }) => {
    try {
      return fs.statSync(filePath).mtimeMs <= cutoff;
    } catch {
      return false; // vanished between discovery and stat -- not ours to compact
    }
  });
}

/**
 * TA-D7 (total order) + TA-D13 (dedupe-by-hash) applied to an explicit,
 * already-read set of files (`entries`: `[{name, events}]`), then
 * resequenced 1..N over the final order (same precedent
 * `events-jsonl-contiguity.mjs`'s `fixContiguity` already uses for a
 * comparable dedupe+reflow) so the compacted file's own `seq` stays a
 * clean per-file ordinal (TA-D1) instead of colliding across what used to
 * be several independent writers' own counters. `h`/`src`/`ts`/`type`/
 * `payload`/`v` are copied through verbatim -- `h` is a PERMANENT identity
 * stamped once at original append time (TA-D9), never recomputed here, so
 * resequencing `seq` cannot and does not change it. A local reimplementation
 * on purpose, not `replay.mjs`'s `readAllEventsFromDir` -- that function is
 * scoped to a whole `.fgos` dir (baseline-0 + every writer file); this one
 * merges an explicit, caller-chosen subset (the cold files only).
 */
export function mergeAndDedupeEvents(entries) {
  const tagged = [];
  for (const { name, events } of entries) {
    for (const ev of events) tagged.push({ ev, file: name });
  }
  tagged.sort((a, b) => {
    if (a.ev.ts !== b.ev.ts) return a.ev.ts < b.ev.ts ? -1 : 1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.ev.seq ?? 0) - (b.ev.seq ?? 0);
  });

  const seen = new Set();
  const deduped = [];
  for (const { ev, raw } of tagged.map((t) => ({ ...t, raw: JSON.stringify(t.ev) }))) {
    const key = typeof ev.h === 'string' && ev.h ? `h:${ev.h}` : `line:${raw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(ev);
  }

  return deduped.map((ev, i) => ({ ...ev, seq: i + 1 }));
}

/**
 * TA-D6: the verify gate -- proves compacting `originalEntries` (the cold
 * files, as read BEFORE the attempt) into `candidateEvents` (the freshly
 * written `baseline-<ts>.jsonl`, read back) changes nothing real:
 * - **hash-set**: the exact same set of `h` identities survives (TA-D9) --
 *   nothing silently dropped, nothing fabricated.
 * - **count**: same number of (deduped) events on both sides.
 * - **deep-equal view**: folding both sides (`foldEvents`) yields the
 *   IDENTICAL state view -- the real thing every other check here is a
 *   structural proxy for.
 * Never mutates, never throws on a break -- a break IS the expected
 * finding this function exists to surface (same posture as every other
 * check in this Tầng A cell).
 */
export function verifyCompactionCandidate(originalEntries, candidateEvents) {
  const before = mergeAndDedupeEvents(originalEntries);
  const beforeHashes = new Set(before.map((ev) => ev.h));
  const afterHashes = new Set(candidateEvents.map((ev) => ev.h));

  if (beforeHashes.size !== afterHashes.size || [...beforeHashes].some((h) => !afterHashes.has(h))) {
    return { ok: false, reason: 'hash-set-mismatch', beforeCount: beforeHashes.size, afterCount: afterHashes.size };
  }
  if (before.length !== candidateEvents.length) {
    return { ok: false, reason: 'count-mismatch', beforeCount: before.length, afterCount: candidateEvents.length };
  }
  const beforeView = foldEvents(before);
  const afterView = foldEvents(candidateEvents);
  if (JSON.stringify(beforeView) !== JSON.stringify(afterView)) {
    return { ok: false, reason: 'view-mismatch' };
  }
  return { ok: true, reason: 'clean', totalEvents: before.length };
}

function readConfigThreshold(repoRoot) {
  try {
    const sharedConfigPath = path.join(repoRoot, '.fgos', 'config.json');
    if (!fs.existsSync(sharedConfigPath)) return null;
    const cfg = JSON.parse(fs.readFileSync(sharedConfigPath, 'utf8'));
    const value = cfg?.checkpoint?.compactionEventThreshold;
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}

/** `git mv` the file at `srcPath` to `destPath` (both absolute); falls back
 * to a plain rename + `git add` if the source isn't tracked yet (a cold
 * file that never got its periodic checkpoint commit, e.g. right after
 * `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` in a test or a very fast idle
 * window) -- the move itself must never fail just because git doesn't
 * know about the file yet. */
function moveIntoArchive(srcPath, destPath, repoRoot) {
  const relSrc = path.relative(repoRoot, srcPath);
  const relDest = path.relative(repoRoot, destPath);
  try {
    execFileSync('git', ['mv', relSrc, relDest], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    fs.renameSync(srcPath, destPath);
    try {
      execFileSync('git', ['add', relDest], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      // best-effort -- the file is still safely moved on disk either way,
      // never deleted, per this module's own "never deletes anything" rule
    }
  }
}

/**
 * The main entry (TA-D5/TA-D6/TA-D13). `dir` is the `.fgos` directory
 * (same convention `store.mjs`'s own `paths(dir)` uses). Runs entirely
 * under `events.lock` (anchored off `${dir}/events.jsonl`, same TA-D14
 * whole-directory scope every other critical section here shares) so a
 * concurrent append can never land mid-compaction.
 *
 * Returns `{compacted: false, reason: 'no-cold-files' | 'below-threshold' |
 * 'gate-red', ...}` on a no-op/refusal, or `{compacted: true, baseline,
 * archived, totalEvents}` on success. Never wired into
 * `runOpportunisticMainCheckoutChecks` (T5) by this task -- deliberately a
 * standalone, explicitly-invoked operation until a real trigger cadence is
 * measured (same "ngưỡng chọn sau khi đo" deferral the thresholds above
 * carry).
 */
export function compactColdWriterFiles(dir, { nowMs = Date.now(), idleThresholdMs = DEFAULT_IDLE_THRESHOLD_MS, eventThreshold = null, repoRoot = null } = {}) {
  const eventsDirPath = path.join(dir, 'events');
  const archiveDirPath = path.join(eventsDirPath, 'archive');
  const realRepoRoot = repoRoot || path.dirname(dir);
  const lockAnchor = path.join(dir, 'events.jsonl');

  return withEventsLock(lockAnchor, () => {
    const coldFiles = findColdWriterFiles(eventsDirPath, { nowMs, idleThresholdMs });
    if (coldFiles.length === 0) {
      return { compacted: false, reason: 'no-cold-files' };
    }

    const entries = coldFiles.map(({ name, path: filePath }) => ({ name, events: readEvents(filePath) }));
    const totalEvents = entries.reduce((sum, e) => sum + e.events.length, 0);

    const effectiveThreshold = eventThreshold ?? readConfigThreshold(realRepoRoot) ?? DEFAULT_COMPACTION_EVENT_THRESHOLD;
    if (totalEvents < effectiveThreshold) {
      return { compacted: false, reason: 'below-threshold', totalEvents, threshold: effectiveThreshold };
    }

    const merged = mergeAndDedupeEvents(entries);
    const compactTs = formatCompactTs(new Date(nowMs));
    const baselineName = `baseline-${compactTs}.jsonl`;
    const baselinePath = path.join(eventsDirPath, baselineName);
    fs.writeFileSync(baselinePath, merged.map((ev) => `${JSON.stringify(ev)}\n`).join(''), 'utf8');

    const verify = verifyCompactionCandidate(entries, readEvents(baselinePath));
    if (!verify.ok) {
      // Gate đỏ -- không archive gì (TA-D6): full rollback, only the
      // just-written candidate is removed; every original cold file is
      // untouched, exactly as this attempt found them.
      fs.rmSync(baselinePath, { force: true });
      return { compacted: false, reason: 'gate-red', verify };
    }

    fs.mkdirSync(archiveDirPath, { recursive: true });
    const archivedNames = [];
    for (const { name, path: filePath } of coldFiles) {
      moveIntoArchive(filePath, path.join(archiveDirPath, name), realRepoRoot);
      archivedNames.push(name);
    }

    // Manifest (TA-D6's own doctor check reads this back to re-verify a
    // past compaction retroactively -- see events-compaction-verified in
    // src/setup/registrations.mjs).
    const manifestPath = path.join(archiveDirPath, `${compactTs}.manifest.json`);
    fs.writeFileSync(manifestPath, `${JSON.stringify({ baseline: baselineName, originals: archivedNames })}\n`, 'utf8');

    return { compacted: true, baseline: baselineName, archived: archivedNames, totalEvents: verify.totalEvents };
  });
}
