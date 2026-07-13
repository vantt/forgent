#!/usr/bin/env node
// bin/fgos.mjs — the fgos CLI: the single door onto `.fgos/` (per D3/D5).
//
// Audience (per CONTEXT.md Terms, single-door): a consumer that cannot be
// assumed to be an agent — so every outcome is a categorized exit code
// (R4), and callers should branch on the code, never on the message text.
//
//   0 ok            — mutation applied / read succeeded
//   1 unexpected     — anything not covered below (a real bug)
//   2 precondition   — illegal FSM transition (fsm.mjs)
//   3 conflict       — CAS expected-status mismatch (fsm.mjs)
//   4 validation     — bad input / not-found (work.mjs, store.mjs)
//   5 corrupt-log    — the event log itself failed to parse (events.mjs)
//
// This file never writes to `.fgos/` itself — every mutation goes through
// src/state/store.mjs, the sole write door.

import path from 'node:path';
import { initStore, addWork, moveWork, addDecision, listWork, rebuild, StoreError } from '../src/state/store.mjs';
import { FsmError } from '../src/state/fsm.mjs';
import { WorkValidationError } from '../src/state/work.mjs';
import { EventLogError } from '../src/state/events.mjs';

const EXIT_CODES = {
  precondition: 2,
  conflict: 3,
  validation: 4,
  'corrupt-log': 5,
};

function dataDir() {
  return path.join(process.cwd(), '.fgos');
}

function categoryOf(err) {
  if (err instanceof StoreError) return err.category;
  if (err instanceof FsmError) return err.category;
  if (err instanceof WorkValidationError) return err.category;
  if (err instanceof EventLogError) return err.category;
  return 'unexpected';
}

function requireField(value, message) {
  if (value === undefined || value === null || value === '') {
    throw new StoreError('validation', message);
  }
  return value;
}

// Minimal argv parser: `--flag value` or bare `--flag` (boolean), plus
// positional args. No dependency, no dashes-in-values ambiguity handling
// beyond what this CLI's own verbs need.
function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function parseListFlag(value) {
  if (value === undefined || value === true) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function runVerb(verb, flags, positional, dir) {
  switch (verb) {
    case 'init': {
      initStore(dir);
      return `Initialized ${dir}`;
    }

    case 'add': {
      const id = requireField(positional[0] ?? flags.id, 'add requires an id: fgos add <id> --title ... --kind ... --risk ... --verify ...');
      const work = {
        id,
        title: flags.title,
        kind: flags.kind,
        status: 'todo',
        deps: parseListFlag(flags.deps),
        risk: flags.risk,
        refs: parseListFlag(flags.refs),
        verify: flags.verify,
        learn: typeof flags.learn === 'string' ? flags.learn : undefined,
      };
      const { event } = addWork(dir, work);
      return `Added ${event.payload.id} (event #${event.seq})`;
    }

    case 'move': {
      const id = requireField(positional[0] ?? flags.id, 'move requires an id: fgos move <id> --to <status> [--expect <status>]');
      const to = requireField(flags.to, 'move requires --to <status>');
      const { event } = moveWork(dir, { id, to, expectedStatus: flags.expect });
      return `Moved ${id}: ${event.payload.from} -> ${event.payload.to} (event #${event.seq})`;
    }

    case 'decision': {
      const text = requireField(flags.text ?? (positional.length ? positional.join(' ') : undefined), 'decision requires --text "..."');
      const { event } = addDecision(dir, { text });
      return `Logged decision (event #${event.seq})`;
    }

    case 'list': {
      return JSON.stringify(listWork(dir), null, 2);
    }

    case 'rebuild': {
      const view = rebuild(dir);
      return `Rebuilt view: ${Object.keys(view.work).length} work item(s), ${view.decisions.length} decision(s).`;
    }

    default:
      throw new StoreError('validation', `unknown verb "${verb ?? ''}". Usage: fgos <init|add|move|decision|list|rebuild> ...`);
  }
}

function main() {
  const [, , verb, ...rest] = process.argv;
  const { flags, positional } = parseArgs(rest);

  try {
    const output = runVerb(verb, flags, positional, dataDir());
    console.log(output);
    process.exitCode = 0;
  } catch (err) {
    process.stderr.write(`fgos: ${err.message}\n`);
    process.exitCode = EXIT_CODES[categoryOf(err)] ?? 1;
  }
}

main();
