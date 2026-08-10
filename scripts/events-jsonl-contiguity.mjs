#!/usr/bin/env node
// events-jsonl-contiguity.mjs -- CLI wrapper (tsk-3wq D3). The real logic
// lives in src/state/events-jsonl-contiguity.mjs (a shipped module
// src/setup/registrations.mjs imports at runtime); this file only adds the
// --check/--fix argv parsing and stdout reporting for standalone/`npm run`
// invocation. See that module's own header for the full seq-break/
// duplicate problem this solves.

import path from "node:path";
import {
  checkContiguity,
  fixContiguity,
  checkEventsJsonlContiguity,
  fixEventsJsonlContiguity,
} from "../src/state/events-jsonl-contiguity.mjs";

export { checkContiguity, fixContiguity, checkEventsJsonlContiguity, fixEventsJsonlContiguity };

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
