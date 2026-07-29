#!/usr/bin/env node
// bin/fgos-runner.mjs — the fgos runner CLI (per D2, A1): one sequential
// pass over the frontier — reap, pick the FIFO head, dispatch a headless
// worker on an isolated branch, goal-check with the item's own verify, and
// write the outcome through the store facade. `--once` (the default mode)
// runs one bounded drain-run and exits. `--watch` (D8, str7-str8) instead
// stays a persistent process, re-deriving the frontier every commit (or
// falling back to a poll every `--poll-ms`, default 5000) and exiting only
// on an explicit SIGINT/SIGTERM.
//
//   fgos-runner [--once] [--watch] [--poll-ms <ms>] [--dry-run] [--config <path>]
//
// Exit codes (R4): The canonical exit-code table lives in src/state/store.mjs's
// EXIT_CODES export (codes 2-5, 7-9; 0=ok, 1=unexpected) plus src/runner/loop.mjs's
// EXIT_BUSY (code 6, runner-only state).
//
// The repo root is derived from the CURRENT WORKING DIRECTORY via git
// (never from this file's own location), so the runner operates on the
// repo it is invoked in. All state writes go through src/state/store.mjs;
// worker/verify output is printed to the console only, never persisted to
// a committed path.

import path from 'node:path';
import { EXIT_CODES, categoryOf } from '../src/state/store.mjs';
import { loadRunnerConfig, ensureRunnerConfig } from '../src/runner/dispatch.mjs';
import { resolveRepoRoot, runOnce, runWatch } from '../src/runner/loop.mjs';
import { wrapEnvelope } from '../src/state/envelope.mjs';

function parseArgs(args) {
  const flags = { once: false, watch: false, pollMs: undefined, dryRun: false, config: undefined };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--once') {
      flags.once = true;
    } else if (arg === '--watch') {
      flags.watch = true;
    } else if (arg === '--poll-ms') {
      const raw = args[i + 1];
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        const err = new Error(`--poll-ms requires a positive number, got "${raw}"`);
        err.category = 'validation';
        throw err;
      }
      flags.pollMs = n;
      i += 1;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--config') {
      flags.config = args[i + 1];
      i += 1;
    } else {
      const err = new Error(
        `unknown flag "${arg}". Usage: fgos-runner [--once] [--watch] [--poll-ms <ms>] [--dry-run] [--config <path>]`,
      );
      err.category = 'validation';
      throw err;
    }
  }
  if (flags.watch && flags.dryRun) {
    const err = new Error('--watch cannot be combined with --dry-run');
    err.category = 'validation';
    throw err;
  }
  return flags;
}

// Shared by --once and every --watch cycle (via onCycle) so the printed
// shape stays byte-for-byte identical between both modes (D2): builds ONE
// fgos.v1 envelope per call via wrapEnvelope() (the SAME function
// bin/fgos.mjs uses at its own envelope call site, fgos.mjs:2333) and writes
// it to stdout as COMPACT single-line JSON — no pretty-print indentation,
// deliberately DIFFERENT from fgos.mjs's own pretty-printed convention.
// Reason: fgos.mjs is a one-shot call producing exactly one envelope per
// invocation, so multi-line pretty-print is fine there; fgos-runner can
// emit MANY envelopes over a --watch session's lifetime (one per cycle),
// and a consumer tailing/streaming that output needs one-JSON-object-per-
// line to parse incrementally — the same operational reason the worker log
// file (RUL39) is append-friendly. Compact single-line output also makes
// "the envelope is the last line of stdout" literally true for a --once
// run, instead of requiring a caller to reconstruct a multi-line trailing
// JSON value. NOTE for any consumer: loop.mjs's own progress-trace lines
// (verify-tail etc.) can themselves start with "{" — discriminate the real
// envelope by parsing a line as JSON and checking contract === 'fgos.v1',
// never by a textual "starts with {" heuristic.
//
// The enveloped data is the result object with `exitCode` stripped out:
// exitCode continues to ONLY set process.exitCode via the existing call
// sites (--once below, and --watch's onCycle never reads it at all) — it
// never leaks into `data`, the same convention bin/fgos.mjs's verbs follow.
function printResult(result) {
  const { exitCode, ...data } = result;
  console.log(JSON.stringify(wrapEnvelope(data)));
}

async function main() {
  try {
    const flags = parseArgs(process.argv.slice(2));
    const repoRoot = resolveRepoRoot(process.cwd());
    // An explicit --config path stays a loud, unmodified failure on ENOENT
    // (loadRunnerConfig); only the default, unflagged path bootstraps a
    // missing config (D1/D3, ensureRunnerConfig).
    const config = flags.config
      ? loadRunnerConfig(flags.config)
      : ensureRunnerConfig(path.join(repoRoot, '.fgos-runner.json'));

    if (flags.watch) {
      // Persistent mode (D8): the ONLY termination trigger is an explicit
      // stop signal. A first SIGINT/SIGTERM aborts the loop's signal and
      // lets the current cycle finish cleanly; a SECOND one is the escape
      // hatch for a stuck cycle and force-exits immediately — still an
      // explicit stop, not a self-termination, so it stays within D8.
      const controller = new AbortController();
      let stopRequested = false;
      const requestStop = () => {
        if (stopRequested) {
          process.exit(130);
          return;
        }
        stopRequested = true;
        controller.abort();
      };
      process.on('SIGINT', requestStop);
      process.on('SIGTERM', requestStop);

      await runWatch({
        repoRoot,
        config,
        signal: controller.signal,
        pollFallbackMs: flags.pollMs,
        onCycle: (result) => {
          if (result.outcome === 'error') {
            console.error('fgos-runner: cycle error:', result.error.message);
          } else {
            printResult(result);
          }
        },
      });
      // documented exception (D2): this lifecycle line stays plain text,
      // not an fgos.v1 envelope — it is metadata about the runner's own
      // stop event, not a verb's data payload, same vocabulary D2/D32 use
      // for the other non-enveloped stdout lines in this contract.
      console.log('fgos-runner: watch mode stopped (signal received)');
      // A deliberate stop is always a clean exit regardless of the last
      // cycle's own outcome (D8) — --watch never surfaces a per-cycle
      // exit code the way --once does.
      process.exitCode = 0;
      return;
    }

    // `--once` runs one bounded drain-run over the frontier (D10/D15): it may
    // now dispatch several items in parallel, so a `drained` result carries a
    // per-item `dispatched` list inside the one envelope printResult() emits
    // (D2) — `busy`/`idle`/`dry-run` are pre-dispatch short-circuits and get
    // the same single-envelope treatment.
    const result = await runOnce({ repoRoot, config, dryRun: flags.dryRun });
    printResult(result);
    process.exitCode = result.exitCode;
  } catch (err) {
    process.stderr.write(`fgos-runner: ${err.message}\n`);
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
