// events-jsonl-truncation-guard.mjs -- tsk-cgg (docs/history/
// events-jsonl-git-tracked-truncation/CONTEXT.md D1): detects a
// stash/checkout/reset/clean-style silent truncation of the shared
// `.fgos/events.jsonl`, a failure class the sibling `events-jsonl-
// contiguity.mjs` (tsk-3wq) is structurally blind to. That module only
// inspects the CURRENT file's own internal self-consistency (duplicate/
// gapped `seq`); a truncate-then-reappend always renumbers forward from
// the cut point, producing a log that is perfectly contiguous and
// therefore invisible to any content-only check.
//
// This module closes that gap with an external high-water-mark: the last
// line's `seq` AND a content hash, persisted in a gitignored sidecar next
// to the log (never itself git-tracked, so a git operation on the log
// can't also revert the mark). On every check, if the file has grown back
// past the old mark's `seq`, the mark's own `seq` position is looked up in
// the CURRENT file and its content re-hashed -- a truncate-then-reappend
// always reuses that `seq` for a DIFFERENT event, so a content mismatch at
// that position is the direct structural signature of this failure class,
// catching it even after the log has regrown past the old mark (proven
// against a synthetic repro of the real incident during `fgos-coding-validating`,
// see plan.md's feasibility matrix -- a seq-only mark would miss exactly
// this case).
//
// Lives under src/state/ alongside events.mjs and events-jsonl-
// contiguity.mjs, for the same reason as that module: src/setup/
// registrations.mjs -- a shipped, packaged module -- imports this at
// runtime; scripts/events-jsonl-truncation-guard.mjs is the thin CLI
// wrapper around this file, not the other way around.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { recordMainCheckoutGuardWarning } from "./main-checkout-guard-warnings.mjs";

function lastNonEmptyLine(raw) {
  const lines = raw.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.length > 0 ? lines[lines.length - 1] : null;
}

function hashLine(line) {
  return crypto.createHash("sha256").update(line).digest("hex");
}

/**
 * Pure core: compute the current high-water-mark from raw log text. Hashes
 * the raw line text itself (never a re-parsed/re-serialized form) so the
 * hash is stable regardless of key order -- matches `fixContiguity`'s own
 * dedup precedent of comparing raw lines, not reparsed objects. Returns
 * `null` for an empty/line-less log (nothing to mark yet).
 */
export function computeGuardMark(raw) {
  const line = lastNonEmptyLine(raw);
  if (line === null) return null;
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch (err) {
    throw new Error(`events-jsonl-truncation-guard: last line does not parse as JSON -- refusing to mark a malformed log: ${err.message}`);
  }
  if (typeof parsed.seq !== "number") return null; // pre-Phase-2 legacy tail, nothing to mark
  return { seq: parsed.seq, hash: hashLine(line) };
}

/**
 * Pure core: check `raw` (current log text) against `storedMark` (the
 * `{seq, hash}` last persisted, or `null` on first run). Never mutates,
 * never throws on the expected finding -- mirrors `checkContiguity`'s own
 * "a break IS the finding this function exists to surface" posture.
 *
 * - `storedMark === null` (bootstrap: no sidecar yet, or a legacy tail with
 *   no seq) -- always `ok`, mark is simply the current tip. This is what
 *   keeps a healthy pre-existing repo's real history from being
 *   misread as one giant regression on its very first run.
 * - current tip's `seq` lower than `storedMark.seq` -- an obvious
 *   regression, unconditional break.
 * - current tip's `seq` at or past `storedMark.seq` -- look up the line
 *   AT `storedMark.seq` in the current file. Missing entirely, or present
 *   with different content than `storedMark.hash` recorded, is a break:
 *   the structural signature of a truncate-then-reappend, still caught
 *   even after the log has regrown past the old mark.
 */
export function checkTruncationGuard(raw, storedMark) {
  const currentMark = computeGuardMark(raw);

  if (storedMark === null) {
    return { ok: true, reason: "bootstrap", message: "no prior mark -- recording the current tip as the first mark", mark: currentMark };
  }

  if (currentMark === null) {
    // Log went from having a marked seq tail to having none at all --
    // as unambiguous a truncation as they come.
    return { ok: false, reason: "log-emptied", message: `log no longer has a seq'd tail (was seq ${storedMark.seq})`, mark: currentMark };
  }

  if (currentMark.seq < storedMark.seq) {
    return {
      ok: false,
      reason: "regressed",
      message: `current tip seq ${currentMark.seq} is lower than the last recorded mark (seq ${storedMark.seq}) -- the log went backwards`,
      mark: currentMark,
    };
  }

  const entries = raw
    .split("\n")
    .filter((l) => l !== "")
    .map((line) => {
      try {
        return { line, parsed: JSON.parse(line) };
      } catch {
        return { line, parsed: null };
      }
    });
  const atMark = entries.find((e) => e.parsed && e.parsed.seq === storedMark.seq);

  if (!atMark) {
    return {
      ok: false,
      reason: "mark-seq-missing",
      message: `no line in the current log carries seq ${storedMark.seq} (the last recorded mark) even though the tip has grown to seq ${currentMark.seq} -- the position was renumbered out from under the mark`,
      mark: currentMark,
    };
  }

  const atMarkHash = hashLine(atMark.line);
  if (atMarkHash !== storedMark.hash) {
    return {
      ok: false,
      reason: "content-mismatch",
      message: `seq ${storedMark.seq} now points at a different event than the last recorded mark -- the log was truncated and reappended past this position (git stash/checkout/reset/clean on the shared, git-tracked .fgos/events.jsonl is the known cause; see docs/how-to/resolve-an-events-jsonl-truncation.md)`,
      mark: currentMark,
    };
  }

  return { ok: true, reason: "clean", message: `mark still holds at seq ${storedMark.seq}, tip now at seq ${currentMark.seq}`, mark: currentMark };
}

/** Read the persisted mark from `guardPath`. Missing, unreadable, or
 * malformed sidecar is treated as bootstrap (`null`), never a hard
 * failure -- matches `checkContiguity`'s "never throws on the expected
 * finding" posture; a lost/corrupt sidecar is itself a legitimate reason
 * to re-bootstrap from the current tip rather than crash `fgos doctor`. */
export function readGuardMark(guardPath) {
  let raw;
  try {
    raw = fs.readFileSync(guardPath, "utf8");
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.seq === "number" && typeof parsed.hash === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Persist `mark` to `guardPath`. `mark === null` (an empty/legacy log)
 * writes nothing -- there is no mark yet to advance to. */
export function writeGuardMark(guardPath, mark) {
  if (mark === null) return;
  fs.mkdirSync(path.dirname(guardPath), { recursive: true });
  fs.writeFileSync(guardPath, `${JSON.stringify(mark)}\n`, "utf8");
}

/** Read-only: run `checkTruncationGuard` against real files on disk,
 * never writing the sidecar. Unlocked read of the log -- mirrors
 * `checkEventsJsonlContiguity`'s own precedent (a report that races a
 * concurrent append at worst reads a slightly stale snapshot, never a
 * torn/corrupt one; `appendEvent`'s own lock still protects the file
 * itself from a torn write). */
export function checkEventsJsonlTruncationGuard(logPath, guardPath) {
  const raw = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
  const storedMark = readGuardMark(guardPath);
  return checkTruncationGuard(raw, storedMark);
}

/** Read-modify-write: runs the same check, and when it passes (bootstrap
 * or clean), advances the persisted mark forward to the log's current
 * tip -- this IS the mechanism (an external mark that only a clean check
 * ever gets to move). Never advances the mark on a break, so the failing
 * mark stays pointed at the last known-good position for whoever
 * investigates. */
export function advanceEventsJsonlTruncationGuard(logPath, guardPath) {
  const report = checkEventsJsonlTruncationGuard(logPath, guardPath);
  if (report.ok && report.mark !== null) {
    writeGuardMark(guardPath, report.mark);
  }
  return report;
}

export const PERIODIC_CHECKPOINT_INTERVAL_SEC = 900; // 15 minutes
// D2/D5 (docs/history/tsk-1vc-silent-eventlog-loss-detection/CONTEXT.md):
// measured, not guessed. Live main checkout observed 22816->23069 (253
// events) across 2026-08-21T03:19:20Z-05:36:51Z (~137.5min) during this
// item's own multi-session investigation window -- ~1.84 events/min
// average, ~27.6 events per old 15min interval. 50 sits above that average
// (fires less often than the old timer under typical load) but comfortably
// below what a real burst produces (the same investigation observed
// checkpoint commits landing every 5-15min during busy stretches), so a
// genuine high-risk burst still checkpoints sooner than the old fixed
// timer would have -- the self-tuning property D2 asked for. A starting
// point from one observed window, not a permanent constant; revisit with
// real production data via the .fgos/config.json `checkpoint.eventThreshold`
// override once more of it exists.
export const DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50;

/**
 * Calculates the number of uncommitted appended events in logPath relative to git HEAD.
 * Returns 0 if logPath does not exist.
 */
export function getUncommittedEventCount(logPath, repoRoot) {
  if (!fs.existsSync(logPath)) return 0;
  const relPath = path.relative(repoRoot, logPath) || ".fgos/events.jsonl";
  let diskLines = 0;
  try {
    const rawDisk = fs.readFileSync(logPath, "utf8");
    diskLines = rawDisk.split("\n").filter((l) => l.trim() !== "").length;
  } catch {
    return 0;
  }

  let committedLines = 0;
  try {
    const rawCommitted = execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    committedLines = rawCommitted.split("\n").filter((l) => l.trim() !== "").length;
  } catch {
    committedLines = 0;
  }

  return Math.max(0, diskLines - committedLines);
}

/**
 * Runs opportunistic checks immediately after main checkout lock acquisition:
 * D1: Advance truncation guard and record warning on break; refuse mark advancement & periodic commit on break (never throws/blocks).
 * D2: Event-count-based / time-based periodic auto-commit of .fgos/events.jsonl if dirty (never throws/blocks).
 *
 * @param {string} dir - .fgos directory or repo root
 * @param {string} [repoRoot] - optional repository root (defaults to parent of dir if dir is .fgos)
 * @param {Object} [opts] - optional options for testing
 * @param {number} [opts.nowSec] - mock current timestamp (unix seconds)
 * @param {number} [opts.intervalSec] - override periodic threshold seconds (default 900)
 * @param {number} [opts.eventThreshold] - override event count threshold (default from config or 50)
 * @param {string} [opts.rawLog] - mock raw log text for testing
 */
export function runOpportunisticMainCheckoutChecks(
  dir,
  repoRoot = null,
  {
    nowSec = null,
    intervalSec = PERIODIC_CHECKPOINT_INTERVAL_SEC,
    eventThreshold = null,
    rawLog = null,
  } = {}
) {
  if (process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS === "1") return;
  const fgosDir = path.basename(dir) === ".fgos" ? dir : path.join(dir, ".fgos");
  const realRepoRoot = repoRoot || (path.basename(dir) === ".fgos" ? path.dirname(dir) : dir);

  let breakFlagged = false;

  // D1: Detect and warn. Refuse mark advancement / periodic commit on break.
  try {
    const logPath = path.join(fgosDir, "events.jsonl");
    const guardPath = path.join(fgosDir, "events-jsonl.truncation-guard.json");
    if (rawLog !== null) {
      const storedMark = readGuardMark(guardPath);
      const report = checkTruncationGuard(rawLog, storedMark);
      if (report.ok && report.mark !== null) {
        writeGuardMark(guardPath, report.mark);
      } else if (!report.ok) {
        recordMainCheckoutGuardWarning(fgosDir, report);
        breakFlagged = true;
      }
    } else if (fs.existsSync(logPath)) {
      const report = advanceEventsJsonlTruncationGuard(logPath, guardPath);
      if (report && report.ok === false) {
        recordMainCheckoutGuardWarning(fgosDir, report);
        breakFlagged = true;
      }
    }
  } catch {
    // Non-blocking: swallow error
  }

  // D1 Fail-closed: refuse periodic auto-commit when an unacknowledged break is flagged
  if (breakFlagged) return;

  // D2: Event-count-based (or time-based) periodic auto-commit
  try {
    const logPath = path.join(fgosDir, "events.jsonl");
    if (fs.existsSync(logPath)) {
      const relPath = path.relative(realRepoRoot, logPath) || ".fgos/events.jsonl";
      const statusOut = execFileSync("git", ["status", "--porcelain", "--", relPath], {
        cwd: realRepoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();

      if (statusOut.length > 0) {
        let lastCommitSec = null;
        try {
          const logOut = execFileSync("git", ["log", "-1", "--format=%ct", "--", relPath], {
            cwd: realRepoRoot,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          }).trim();
          if (logOut) {
            const parsed = parseInt(logOut, 10);
            if (!Number.isNaN(parsed)) {
              lastCommitSec = parsed;
            }
          }
        } catch {
          lastCommitSec = null;
        }

        // Kernel tier cannot import the domain-tier config reader
        // (src/config/shared-config-file.mjs) -- read the shared config
        // file directly with fs, same pattern this file already uses for
        // every other .fgos/* path (architecture.test.mjs's one-way-down
        // layering check, caught live during tsk-1vc-2's own implementation).
        let configThreshold = null;
        try {
          const sharedConfigPath = path.join(realRepoRoot, ".fgos", "config.json");
          if (fs.existsSync(sharedConfigPath)) {
            const cfg = JSON.parse(fs.readFileSync(sharedConfigPath, "utf8"));
            configThreshold = cfg?.checkpoint?.eventThreshold;
          }
        } catch {
          // ignore -- falls through to the item default below, same as a
          // missing/unparseable config file always has
        }

        const effectiveEventThreshold =
          eventThreshold !== null
            ? eventThreshold
            : typeof configThreshold === "number"
            ? configThreshold
            : DEFAULT_CHECKPOINT_EVENT_THRESHOLD;

        const uncommittedEvents = getUncommittedEventCount(logPath, realRepoRoot);
        const currentTimeSec = nowSec !== null ? nowSec : Math.floor(Date.now() / 1000);

        const eventThresholdMet = effectiveEventThreshold !== null && uncommittedEvents >= effectiveEventThreshold;
        const timeIntervalMet = intervalSec !== null && lastCommitSec !== null && (currentTimeSec - lastCommitSec) >= intervalSec;
        const initialCommitMet = lastCommitSec === null;

        if (eventThresholdMet || timeIntervalMet || initialCommitMet) {
          execFileSync("git", ["add", relPath], {
            cwd: realRepoRoot,
            stdio: ["ignore", "pipe", "ignore"],
          });
          execFileSync("git", ["commit", "-m", "chore(.fgos): periodic events.jsonl checkpoint", "--", relPath], {
            cwd: realRepoRoot,
            stdio: ["ignore", "pipe", "ignore"],
          });
        }
      }
    }
  } catch {
    // Non-blocking: swallow error
  }
}

