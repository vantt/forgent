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
import { resolveFgosFile, FGOS_FILE } from "./fgos-file-registry.mjs";

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

/**
 * Tầng A/T5 (TA-D10): the sidecar now holds a MAP `{fileName -> {seq,
 * hash}}` instead of a single `{seq, hash}` object -- one entry per
 * tracked file (baseline-0's own basename `"events.jsonl"`, or
 * `"events/<writer file name>"` for a per-writer file), since a
 * truncation on one writer's file must never be confused with, or hide
 * behind, another writer's own mark. Still one gitignored sidecar per
 * `.fgos/` dir (unchanged path/name) -- only its on-disk SHAPE changed.
 * `readGuardMarks`/`writeGuardMarks` own that shape; every other function
 * below narrows to one entry by `fileKey`.
 */
export function readGuardMarks(guardPath) {
  let raw;
  try {
    raw = fs.readFileSync(guardPath, "utf8");
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist the WHOLE marks map to `guardPath`. */
export function writeGuardMarks(guardPath, marks) {
  fs.mkdirSync(path.dirname(guardPath), { recursive: true });
  fs.writeFileSync(guardPath, `${JSON.stringify(marks)}\n`, "utf8");
}

/** Read one file's persisted mark from the shared sidecar map. Missing
 * sidecar, missing entry, unreadable, or malformed content is treated as
 * bootstrap (`null`), never a hard failure -- matches `checkContiguity`'s
 * "never throws on the expected finding" posture; a lost/corrupt sidecar
 * is itself a legitimate reason to re-bootstrap from the current tip
 * rather than crash `fgos doctor`. */
export function readGuardMark(guardPath, fileKey) {
  const mark = readGuardMarks(guardPath)[fileKey];
  return mark && typeof mark.seq === "number" && typeof mark.hash === "string" ? mark : null;
}

/** Persist `mark` under `fileKey` in the shared sidecar map, leaving every
 * other file's own entry untouched. `mark === null` (an empty/legacy log)
 * writes nothing -- there is no mark yet to advance to. */
export function writeGuardMark(guardPath, fileKey, mark) {
  if (mark === null) return;
  const marks = readGuardMarks(guardPath);
  marks[fileKey] = mark;
  writeGuardMarks(guardPath, marks);
}

/**
 * Derives the canonical sidecar `fileKey` from a log path.
 * If the log file lives directly inside an `events` directory (e.g. `.fgos/events/<name>.jsonl`),
 * returns `events/<name>`. Otherwise defaults to `path.basename(logPath)`.
 */
export function deriveFileKeyFromLogPath(logPath) {
  const parent = path.basename(path.dirname(logPath));
  return parent === "events" ? `events/${path.basename(logPath)}` : path.basename(logPath);
}

/** Read-only: run `checkTruncationGuard` against real files on disk,
 * never writing the sidecar. Unlocked read of the log -- mirrors
 * `checkEventsJsonlContiguity`'s own precedent (a report that races a
 * concurrent append at worst reads a slightly stale snapshot, never a
 * torn/corrupt one; `appendEvent`'s own lock still protects the file
 * itself from a torn write). `fileKey` defaults to `deriveFileKeyFromLogPath(logPath)` --
 * `events/<name>` when inside an `events/` directory, or `path.basename(logPath)` otherwise. */
export function checkEventsJsonlTruncationGuard(logPath, guardPath, fileKey = deriveFileKeyFromLogPath(logPath)) {
  const raw = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
  const storedMark = readGuardMark(guardPath, fileKey);
  return checkTruncationGuard(raw, storedMark);
}

/** Read-modify-write: runs the same check, and when it passes (bootstrap
 * or clean), advances the persisted mark forward to the log's current
 * tip -- this IS the mechanism (an external mark that only a clean check
 * ever gets to move). Never advances the mark on a break, so the failing
 * mark stays pointed at the last known-good position for whoever
 * investigates. Same `fileKey` default as `checkEventsJsonlTruncationGuard`. */
export function advanceEventsJsonlTruncationGuard(logPath, guardPath, fileKey = deriveFileKeyFromLogPath(logPath)) {
  const report = checkEventsJsonlTruncationGuard(logPath, guardPath, fileKey);
  if (report.ok && report.mark !== null) {
    writeGuardMark(guardPath, fileKey, report.mark);
  }
  return report;
}

/**
 * Tầng A/T5 (TA-D10): every file the guard/checkpoint machinery tracks --
 * baseline-0 (`${fgosDir}/events.jsonl`, always listed, tagged with the
 * `fileKey` `"events.jsonl"` even if it does not physically exist yet) plus
 * every `*.jsonl` file directly under `${fgosDir}/events/` (non-recursive,
 * so a future `archive/` there is structurally never included), tagged
 * `"events/<name>"`. Mirrors `discoverEventFilePaths` in replay.mjs (T3/T4)
 * -- a separate copy here on purpose: this module is `kernel` tier and may
 * not import from `src/state/replay.mjs` (one-way-down layering).
 */
function discoverGuardedFiles(fgosDir) {
  const result = [{ fileKey: "events.jsonl", logPath: path.join(fgosDir, "events.jsonl") }];
  const eventsDirPath = path.join(fgosDir, "events");
  let names = [];
  try {
    names = fs
      .readdirSync(eventsDirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .map((entry) => entry.name);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  for (const name of names) {
    result.push({ fileKey: `events/${name}`, logPath: path.join(eventsDirPath, name) });
  }
  return result;
}

/**
 * Unconditionally re-baselines the truncation guard mark for all discovered log files
 * in `fgosDir` that exist on disk.
 *
 * Unlike `advanceEventsJsonlTruncationGuard`, which refuses to update the mark when
 * a break is detected, this function computes and writes the current tip mark
 * unconditionally -- acknowledging any break and bringing the mark up to date.
 *
 * @param {string} fgosDir - Path to the `.fgos` directory
 * @param {string} guardPath - Path to the guard sidecar file
 * @returns {{ rebaselined: Array<{fileKey: string, mark: {seq: number, hash: string}}>, skippedEmpty: Array<string> }}
 */
export function forceRebaselineTruncationGuard(fgosDir, guardPath) {
  const rebaselined = [];
  const skippedEmpty = [];
  for (const { fileKey, logPath } of discoverGuardedFiles(fgosDir)) {
    if (!fs.existsSync(logPath)) continue;
    const raw = fs.readFileSync(logPath, "utf8");
    const mark = computeGuardMark(raw);
    if (mark === null) {
      skippedEmpty.push(fileKey);
    } else {
      writeGuardMark(guardPath, fileKey, mark);
      rebaselined.push({ fileKey, mark });
    }
  }
  return { rebaselined, skippedEmpty };
}

export const DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC = 3600; // 3600 seconds (1 hour) fallback interval

/** The single-file core `getUncommittedEventCount` (below) sums over every
 * discovered file. Returns 0 if `logPath` does not exist. */
function getUncommittedEventCountForFile(logPath, repoRoot) {
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
 * Calculates the number of uncommitted appended events across baseline-0
 * AND every per-writer file under `.fgos/events/` (TA-D10) relative to git
 * HEAD, summed. `fgosDir` is the `.fgos` directory (not a single log path
 * -- pre-T5 this function took `logPath` directly; there were no callers
 * outside this module to preserve compat for). Returns 0 for a dir with no
 * baseline and no `events/` files at all.
 */
export function getUncommittedEventCount(fgosDir, repoRoot) {
  let total = 0;
  for (const { logPath } of discoverGuardedFiles(fgosDir)) {
    total += getUncommittedEventCountForFile(logPath, repoRoot);
  }
  return total;
}

/**
 * Runs opportunistic checks immediately after main checkout lock acquisition:
 * D1: Advance truncation guard and record warning on break; refuse mark advancement & fallback commit on break (never throws/blocks).
 * D2: Fallback auto-commit of .fgos/events.jsonl and .fgos/events/ if dirty after fallbackIntervalSec (default 3600s, never throws/blocks).
 *
 * @param {string} dir - .fgos directory or repo root
 * @param {string} [repoRoot] - optional repository root (defaults to parent of dir if dir is .fgos)
 * @param {Object} [opts] - optional options for testing
 * @param {number} [opts.nowSec] - mock current timestamp (unix seconds)
 * @param {number} [opts.fallbackIntervalSec] - override fallback threshold seconds (default 3600)
 * @param {string} [opts.rawLog] - mock raw log text for testing
 * @param {Object} [opts.commitEnv] - extra env vars merged onto the fallback
 *   checkpoint's own `git commit` call (tsk-32v).
 */
export function runOpportunisticMainCheckoutChecks(
  dir,
  repoRoot = null,
  {
    nowSec = null,
    fallbackIntervalSec = null,
    rawLog = null,
    commitEnv = null,
  } = {}
) {
  if (process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS === "1") return;
  const fgosDir = path.basename(dir) === ".fgos" ? dir : path.join(dir, ".fgos");
  const realRepoRoot = repoRoot || (path.basename(dir) === ".fgos" ? path.dirname(dir) : dir);

  let breakFlagged = false;

  // D1: Detect and warn, per tracked file (TA-D10: baseline-0 AND every
  // per-writer file under .fgos/events/). Refuse mark advancement /
  // fallback commit on ANY file's break -- a break on one writer's file is
  // just as real a truncation as one on baseline-0.
  try {
    const guardPath = resolveFgosFile(fgosDir, FGOS_FILE.GUARD_MARK);
    if (rawLog !== null) {
      // Test-injection path (existing `rawLog` override): scoped to
      // baseline-0 only, byte-identical to before T5 -- callers using this
      // override are simulating a single log's raw text directly, not a
      // whole directory.
      const fileKey = "events.jsonl";
      const storedMark = readGuardMark(guardPath, fileKey);
      const report = checkTruncationGuard(rawLog, storedMark);
      if (report.ok && report.mark !== null) {
        writeGuardMark(guardPath, fileKey, report.mark);
      } else if (!report.ok) {
        recordMainCheckoutGuardWarning(fgosDir, { ...report, file: fileKey });
        breakFlagged = true;
      }
    } else {
      for (const { fileKey, logPath } of discoverGuardedFiles(fgosDir)) {
        if (!fs.existsSync(logPath)) continue;
        const report = advanceEventsJsonlTruncationGuard(logPath, guardPath, fileKey);
        if (report && report.ok === false) {
          recordMainCheckoutGuardWarning(fgosDir, { ...report, file: fileKey });
          breakFlagged = true;
        }
      }
    }
  } catch {
    // Non-blocking: swallow error
  }

  // D1 Fail-closed: refuse fallback auto-commit when an unacknowledged break is flagged
  if (breakFlagged) return;

  // D2: Fallback auto-commit for quiet periods without merges.
  try {
    const logPath = path.join(fgosDir, "events.jsonl");
    const eventsDirPath = path.join(fgosDir, "events");
    const pathspecs = [];
    if (fs.existsSync(logPath)) {
      pathspecs.push(path.relative(realRepoRoot, logPath) || ".fgos/events.jsonl");
    }
    if (fs.existsSync(eventsDirPath)) {
      pathspecs.push(path.relative(realRepoRoot, eventsDirPath));
    }
    if (pathspecs.length > 0) {
      const statusOut = execFileSync("git", ["status", "--porcelain", "--", ...pathspecs], {
        cwd: realRepoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();

      if (statusOut.length > 0) {
        let lastCommitSec = null;
        try {
          const logOut = execFileSync("git", ["log", "-1", "--format=%ct", "--", ...pathspecs], {
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

        let oldestDirtySec = null;
        for (const spec of pathspecs) {
          const fullPath = path.resolve(realRepoRoot, spec);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              const entries = fs.readdirSync(fullPath, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isFile()) {
                  const fileStat = fs.statSync(path.join(fullPath, entry.name));
                  const mtimeSec = Math.floor(fileStat.mtimeMs / 1000);
                  if (oldestDirtySec === null || mtimeSec < oldestDirtySec) {
                    oldestDirtySec = mtimeSec;
                  }
                }
              }
            } else if (stat.isFile()) {
              const mtimeSec = Math.floor(stat.mtimeMs / 1000);
              if (oldestDirtySec === null || mtimeSec < oldestDirtySec) {
                oldestDirtySec = mtimeSec;
              }
            }
          } catch {
            // ignore
          }
        }

        let configFallbackIntervalSec = null;
        try {
          const sharedConfigPath = path.join(realRepoRoot, ".fgos", "config.json");
          if (fs.existsSync(sharedConfigPath)) {
            const cfg = JSON.parse(fs.readFileSync(sharedConfigPath, "utf8"));
            configFallbackIntervalSec = cfg?.checkpoint?.fallbackIntervalSec;
          }
        } catch {
          // ignore
        }

        const effectiveFallbackIntervalSec =
          fallbackIntervalSec !== null
            ? fallbackIntervalSec
            : typeof configFallbackIntervalSec === "number"
            ? configFallbackIntervalSec
            : DEFAULT_CHECKPOINT_FALLBACK_INTERVAL_SEC;

        const currentTimeSec = nowSec !== null ? nowSec : Math.floor(Date.now() / 1000);
        const refSec = lastCommitSec !== null ? lastCommitSec : oldestDirtySec;

        const fallbackIntervalMet =
          effectiveFallbackIntervalSec !== null &&
          refSec !== null &&
          currentTimeSec - refSec >= effectiveFallbackIntervalSec;

        if (fallbackIntervalMet) {
          execFileSync("git", ["add", ...pathspecs], {
            cwd: realRepoRoot,
            stdio: ["ignore", "pipe", "ignore"],
          });
          try {
            execFileSync("git", ["commit", "-m", "chore(.fgos): fallback events checkpoint", "--", ...pathspecs], {
              cwd: realRepoRoot,
              stdio: ["ignore", "pipe", "ignore"],
              ...(commitEnv ? { env: { ...process.env, ...commitEnv } } : {}),
            });
          } catch (commitErr) {
            try {
              execFileSync("git", ["reset", "--", ...pathspecs], { cwd: realRepoRoot, stdio: ["ignore", "pipe", "ignore"] });
            } catch {
              // best-effort
            }
            throw commitErr;
          }
        }
      }
    }
  } catch {
    // Non-blocking: swallow error
  }
}


