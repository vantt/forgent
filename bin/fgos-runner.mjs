#!/usr/bin/env node
// bin/fgos-runner.mjs — the fgos runner CLI (per D2, A1): one sequential
// pass over the frontier — reap, pick the FIFO head, dispatch a headless
// worker on an isolated branch, goal-check with the item's own verify, and
// write the outcome through the store facade. Phase 2 runs one item at a
// time; `--once` (the default and only mode) stops after that item.
//
//   fgos-runner [--once] [--dry-run] [--config <path>]
//
// Exit codes follow the same categorized contract as bin/fgos.mjs (R4):
//   0 ok            — proposed / parked / idle / dry-run
//   1 unexpected     — a real bug, or a tripped circuit breaker
//   2 precondition   — illegal FSM transition surfaced by the runner's write
//   3 conflict       — CAS conflict on the runner's own write (state-conflict)
//   4 validation     — bad runner config, unknown tier, not a git repo
//   5 corrupt-log    — the event log failed to parse
//   6 busy           — another live runner holds .fgos/runner.lock
//
// The repo root is derived from the CURRENT WORKING DIRECTORY via git
// (never from this file's own location), so the runner operates on the
// repo it is invoked in. All state writes go through src/state/store.mjs;
// worker/verify output is printed to the console only, never persisted to
// a committed path.

import path from 'node:path';
import { EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { loadRunnerConfig } from '../src/runner/dispatch.mjs';
import { resolveRepoRoot, runOnce } from '../src/runner/loop.mjs';

function parseArgs(args) {
  const flags = { once: false, dryRun: false, config: undefined };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--once') {
      flags.once = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--config') {
      flags.config = args[i + 1];
      i += 1;
    } else {
      const err = new Error(`unknown flag "${arg}". Usage: fgos-runner [--once] [--dry-run] [--config <path>]`);
      err.category = 'validation';
      throw err;
    }
  }
  return flags;
}

async function main() {
  try {
    const flags = parseArgs(process.argv.slice(2));
    const repoRoot = resolveRepoRoot(process.cwd());
    const configPath = flags.config ?? path.join(repoRoot, '.fgos-runner.json');
    const config = loadRunnerConfig(configPath);

    // `--once` is the default (and only) Phase 2 mode — the flag is
    // accepted for explicitness; omitting it changes nothing.
    const result = await runOnce({ repoRoot, config, dryRun: flags.dryRun });
    console.log(`fgos-runner: ${result.outcome}${result.id ? ` (${result.id})` : ''}`);
    process.exitCode = result.exitCode;
  } catch (err) {
    process.stderr.write(`fgos-runner: ${err.message}\n`);
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
