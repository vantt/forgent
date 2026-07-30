#!/usr/bin/env node
// check-events-seq-contiguity.mjs -- fast-fail guard for an events.jsonl
// log's `seq` field. Read-only, never acquires events.lock (nothing to
// serialize a read against). Exits 0 silently when every seq is unique,
// gapless, and strictly increasing; exits 1 with the exact line/seq
// mismatch otherwise.
//
// Exists because the live shared .fgos/events.jsonl already went corrupt
// once (docs/history/live-events-seq-corruption/) from an ad hoc,
// inconsistently hand-resolved git-merge conflict, and sat broken for days
// before a migrate script's own contiguity guard happened to trip over it.
// Wired into `npm test` (via the ordinary `test/**/*.test.mjs` glob) so the
// same break is caught immediately the next time it happens, regardless of
// what caused it.

import fs from "node:fs";
import path from "node:path";

/**
 * Pure check: throws with a precise line/seq message on the first break,
 * otherwise returns `{ totalLines, lastSeq }`. A line with no numeric
 * `seq` field is skipped (never a break) -- mirrors the two migrate
 * scripts' own `typeof parsed.seq === "number"` guard, since not every
 * historical line shape carries one.
 */
export function checkSeqContiguity(raw) {
  const lines = raw.split("\n").filter((l) => l !== "");
  let prevSeq = null;
  for (let i = 0; i < lines.length; i++) {
    let parsed;
    try {
      parsed = JSON.parse(lines[i]);
    } catch (err) {
      throw new Error(`check-events-seq-contiguity: line ${i + 1} of ${lines.length} does not parse as JSON: ${err.message}`);
    }
    if (typeof parsed.seq !== "number") continue;
    if (prevSeq !== null && parsed.seq !== prevSeq + 1) {
      throw new Error(
        `check-events-seq-contiguity: seq break at line ${i + 1} -- expected ${prevSeq + 1}, got ${parsed.seq}. ` +
          "This is usually a git-merge conflict on an events.jsonl hand-resolved incorrectly -- " +
          "see docs/how-to/resolve-an-events-jsonl-merge-conflict.md for how to fix it.",
      );
    }
    prevSeq = parsed.seq;
  }
  return { totalLines: lines.length, lastSeq: prevSeq };
}

function parseArgs(argv) {
  const logIdx = argv.indexOf("--log");
  const logPath = logIdx >= 0 ? argv[logIdx + 1] : undefined;
  if (!logPath) {
    throw new Error("usage: check-events-seq-contiguity.mjs --log <path-to-events.jsonl>");
  }
  return { logPath };
}

function runCli(argv, cwd) {
  const { logPath } = parseArgs(argv);
  const resolvedLog = path.resolve(cwd, logPath);
  const raw = fs.readFileSync(resolvedLog, "utf8");
  const report = checkSeqContiguity(raw);
  console.log(JSON.stringify({ logPath: resolvedLog, ...report }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
