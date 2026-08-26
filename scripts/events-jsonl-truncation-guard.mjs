#!/usr/bin/env node
// events-jsonl-truncation-guard.mjs -- CLI wrapper (tsk-cgg). The real
// logic lives in src/state/events-jsonl-truncation-guard.mjs (a shipped
// module src/setup/registrations.mjs imports at runtime); this file only
// adds the --check/--advance argv parsing and stdout reporting for
// standalone/`npm run` invocation. See that module's own header for the
// full truncate-then-reappend problem this solves.

import path from "node:path";
import {
  checkEventsJsonlTruncationGuard,
  advanceEventsJsonlTruncationGuard,
  forceRebaselineTruncationGuard,
} from "../src/state/events-jsonl-truncation-guard.mjs";

export { checkEventsJsonlTruncationGuard, advanceEventsJsonlTruncationGuard, forceRebaselineTruncationGuard };

function parseArgs(argv) {
  const checkIdx = argv.indexOf("--check");
  const advanceIdx = argv.indexOf("--advance");
  const forceIdx = argv.indexOf("--force-rebaseline-all");

  const modeCount = (checkIdx >= 0 ? 1 : 0) + (advanceIdx >= 0 ? 1 : 0) + (forceIdx >= 0 ? 1 : 0);
  if (modeCount > 1) {
    throw new Error(
      "usage: events-jsonl-truncation-guard.mjs --check <log> <guard> | --advance <log> <guard> | --force-rebaseline-all <fgosDir> <guard> -- pass exactly one mode"
    );
  }

  if (checkIdx >= 0) return { mode: "check", targetPath: argv[checkIdx + 1], guardPath: argv[checkIdx + 2] };
  if (advanceIdx >= 0) return { mode: "advance", targetPath: argv[advanceIdx + 1], guardPath: argv[advanceIdx + 2] };
  if (forceIdx >= 0) return { mode: "force-rebaseline-all", targetPath: argv[forceIdx + 1], guardPath: argv[forceIdx + 2] };

  throw new Error(
    "usage: events-jsonl-truncation-guard.mjs --check <path-to-events.jsonl> <path-to-guard.json> | --advance <path-to-events.jsonl> <path-to-guard.json> | --force-rebaseline-all <path-to-fgos-dir> <path-to-guard.json>"
  );
}

function runCli(argv, cwd) {
  const { mode, targetPath, guardPath } = parseArgs(argv);
  if (!targetPath || !guardPath) {
    throw new Error(`events-jsonl-truncation-guard.mjs: --${mode} requires both a target path and a guard path`);
  }
  const resolvedTarget = path.resolve(cwd, targetPath);
  const resolvedGuard = path.resolve(cwd, guardPath);

  if (mode === "force-rebaseline-all") {
    const summary = forceRebaselineTruncationGuard(resolvedTarget, resolvedGuard);
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = 0;
  } else {
    const report =
      mode === "check"
        ? checkEventsJsonlTruncationGuard(resolvedTarget, resolvedGuard)
        : advanceEventsJsonlTruncationGuard(resolvedTarget, resolvedGuard);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
