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
// against a synthetic repro of the real incident during `fgos-validating`,
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
