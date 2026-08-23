#!/usr/bin/env node
// events-jsonl-truncation-guard.mjs -- CLI wrapper (tsk-cgg). The real
// logic lives in src/state/events-jsonl-truncation-guard.mjs (a shipped
// module src/setup/registrations.mjs imports at runtime); this file only
// adds the --check/--advance argv parsing and stdout reporting for
// standalone/`npm run` invocation. See that module's own header for the
// full truncate-then-reappend problem this solves.

import path from "node:path";
import { checkEventsJsonlTruncationGuard, advanceEventsJsonlTruncationGuard } from "../src/state/events-jsonl-truncation-guard.mjs";

export { checkEventsJsonlTruncationGuard, advanceEventsJsonlTruncationGuard };

function parseArgs(argv) {
  const checkIdx = argv.indexOf("--check");
  const advanceIdx = argv.indexOf("--advance");
  if (checkIdx >= 0 && advanceIdx >= 0) {
    throw new Error("usage: events-jsonl-truncation-guard.mjs --check <log> <guard> | --advance <log> <guard> -- pass exactly one mode, not both");
  }
  if (checkIdx >= 0) return { mode: "check", logPath: argv[checkIdx + 1], guardPath: argv[checkIdx + 2] };
  if (advanceIdx >= 0) return { mode: "advance", logPath: argv[advanceIdx + 1], guardPath: argv[advanceIdx + 2] };
  throw new Error("usage: events-jsonl-truncation-guard.mjs --check <path-to-events.jsonl> <path-to-guard.json> | --advance <path-to-events.jsonl> <path-to-guard.json>");
}

function runCli(argv, cwd) {
  const { mode, logPath, guardPath } = parseArgs(argv);
  if (!logPath || !guardPath) {
    throw new Error(`events-jsonl-truncation-guard.mjs: --${mode} requires both a log path and a guard path`);
  }
  const resolvedLog = path.resolve(cwd, logPath);
  const resolvedGuard = path.resolve(cwd, guardPath);

  const report = mode === "check" ? checkEventsJsonlTruncationGuard(resolvedLog, resolvedGuard) : advanceEventsJsonlTruncationGuard(resolvedLog, resolvedGuard);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
