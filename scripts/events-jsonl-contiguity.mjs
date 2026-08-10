#!/usr/bin/env node
// events-jsonl-contiguity.mjs -- tsk-3wq D3 (docs/history/
// events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md): detects and
// repairs seq breaks/duplicates left behind by an ordinary git `union`
// merge (.gitattributes: `.fgos/events.jsonl merge=union`) on the shared
// append-only event log. `union` keeps lines from both sides of a merge
// instead of leaving conflict markers, but (per git's own documentation)
// "tends to leave the added lines in the resulting file in random order",
// and never renumbers `seq` -- two branches that each appended new events
// since a common ancestor will independently number their own new lines,
// so a plain union of both can leave duplicate `seq` values pointing at
// genuinely different events. This script closes that gap: `--check` is a
// read-only report (wired into the `events-jsonl-contiguous` fgos doctor
// check); `--fix` dedupes exact-duplicate lines, stable-sorts the rest by
// `ts`, and renumbers `seq` 1..N contiguously.
//
// This is a general-purpose tool, not a git merge-driver script -- it
// never receives git's %O/%A/%B ancestor/ours/theirs paths and never needs
// to; it only ever operates on ONE caller-supplied events.jsonl path,
// whatever state it is already in.

import fs from "node:fs";
import path from "node:path";
import { withEventsLock } from "../src/state/events.mjs";

function parseLines(raw) {
  const lines = raw.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((line, i) => {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      throw new Error(
        `events-jsonl-contiguity: line ${i + 1} of ${lines.length} does not parse as JSON -- refusing to operate on a log that is not already well-formed: ${err.message}`,
      );
    }
    return { line, parsed };
  });
}

// Pure core: given the raw log text, reports every seq break/duplicate
// found. Never mutates, never throws on a break -- a break IS the expected
// finding this function exists to surface.
export function checkContiguity(raw) {
  const entries = parseLines(raw);
  const seenSeq = new Map(); // seq -> first 1-based line number that used it
  const duplicates = [];
  const gaps = [];
  let prevSeq = null;

  entries.forEach(({ parsed }, i) => {
    const lineNo = i + 1;
    const seq = parsed.seq;
    if (typeof seq !== "number") return; // pre-Phase-2 legacy line, no seq to check

    if (seenSeq.has(seq)) {
      duplicates.push({ seq, firstLine: seenSeq.get(seq), duplicateLine: lineNo });
    } else {
      seenSeq.set(seq, lineNo);
    }

    if (prevSeq !== null && seq !== prevSeq + 1 && seq !== prevSeq) {
      gaps.push({ afterSeq: prevSeq, foundSeq: seq, line: lineNo });
    }
    prevSeq = seq;
  });

  return { ok: duplicates.length === 0 && gaps.length === 0, totalLines: entries.length, duplicates, gaps };
}

// Pure core: dedupe exact-duplicate lines (byte-identical, first occurrence
// wins), stable-sort the remainder by `ts`, then renumber `seq` 1..N over
// the result. Lines with no `seq` field (pre-Phase-2 legacy) are left
// exactly where dedup/sort placed them and never assigned a `seq`.
export function fixContiguity(raw) {
  const entries = parseLines(raw);
  const seenLine = new Set();
  const deduped = [];
  let dedupedCount = 0;
  for (const entry of entries) {
    if (seenLine.has(entry.line)) {
      dedupedCount++;
      continue;
    }
    seenLine.add(entry.line);
    deduped.push(entry);
  }

  // Stable sort by ts (ISO-8601 strings sort correctly lexicographically);
  // Array#sort is stable per spec, so entries with equal/missing ts keep
  // their relative dedup-order position.
  deduped.sort((a, b) => {
    const tsA = typeof a.parsed.ts === "string" ? a.parsed.ts : "";
    const tsB = typeof b.parsed.ts === "string" ? b.parsed.ts : "";
    if (tsA < tsB) return -1;
    if (tsA > tsB) return 1;
    return 0;
  });

  let nextSeq = 1;
  let resequencedCount = 0;
  const outLines = deduped.map(({ line, parsed }) => {
    if (typeof parsed.seq !== "number") return line; // legacy line, never assigned a seq
    const seq = nextSeq;
    nextSeq++;
    if (parsed.seq === seq) return line; // already correct -- byte-identical, no reserialize
    resequencedCount++;
    return JSON.stringify({ ...parsed, seq });
  });

  const rewritten = outLines.map((l) => `${l}\n`).join("");
  return { rewritten, totalLines: entries.length, dedupedCount, resequencedCount };
}

/** Read-only: run `checkContiguity` against a real file on disk. No lock --
 * mirrors `readEvents`'s own unlocked-read precedent (events.mjs); a report
 * that races a concurrent append at worst reads a slightly stale snapshot,
 * never a torn/corrupt one (appendEvent's own lock still protects the file
 * itself from a torn write). */
export function checkEventsJsonlContiguity(logPath) {
  const raw = fs.readFileSync(logPath, "utf8");
  return checkContiguity(raw);
}

/** Read-modify-write: runs inside `withEventsLock` (same cross-process lock
 * `appendEvent`/`repairTruncatedLastLine` hold) so a concurrent append can
 * never land mid-fix. Always backs up before writing when anything actually
 * changed; a no-op (already contiguous) never touches disk. */
export function fixEventsJsonlContiguity(logPath) {
  return withEventsLock(logPath, () => {
    const raw = fs.readFileSync(logPath, "utf8");
    const { rewritten, totalLines, dedupedCount, resequencedCount } = fixContiguity(raw);

    if (dedupedCount === 0 && resequencedCount === 0) {
      return { fixed: false, totalLines, dedupedCount: 0, resequencedCount: 0, backupPath: null, logPath };
    }

    const backupPath = `${logPath}.fixed-${Date.now()}`;
    fs.copyFileSync(logPath, backupPath);
    fs.writeFileSync(logPath, rewritten, "utf8");

    return { fixed: true, totalLines, dedupedCount, resequencedCount, backupPath, logPath };
  });
}

function parseArgs(argv) {
  const checkIdx = argv.indexOf("--check");
  const fixIdx = argv.indexOf("--fix");
  if (checkIdx >= 0 && fixIdx >= 0) {
    throw new Error("usage: events-jsonl-contiguity.mjs --check <path> | --fix <path> -- pass exactly one mode, not both");
  }
  if (checkIdx >= 0) return { mode: "check", logPath: argv[checkIdx + 1] };
  if (fixIdx >= 0) return { mode: "fix", logPath: argv[fixIdx + 1] };
  throw new Error("usage: events-jsonl-contiguity.mjs --check <path-to-events.jsonl> | --fix <path-to-events.jsonl>");
}

function runCli(argv, cwd) {
  const { mode, logPath } = parseArgs(argv);
  if (!logPath) {
    throw new Error(`events-jsonl-contiguity.mjs: --${mode} requires a path argument`);
  }
  const resolvedLog = path.resolve(cwd, logPath);

  if (mode === "check") {
    const report = checkEventsJsonlContiguity(resolvedLog);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  const report = fixEventsJsonlContiguity(resolvedLog);
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
