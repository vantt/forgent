// test/cli/fgos-decision.test.mjs — tsk-4wv: `fgos decision` requires
// `--text` explicitly; it no longer falls back to joining positional args.
//
// Before this, `decision`'s case (bin/fgos.mjs) read
// `flags.text ?? (positional.length ? positional.join(' ') : undefined)` --
// any stray non-flag token typed after `decision` (e.g. a caller running
// `fgos decision write "D-ADR0036: ..."` instead of `fgos decision --text
// "D-ADR0036: ..."`) silently leaked into the stored decision text as its
// first word. Confirmed against a real corrupted event already committed to
// `.fgos/events.jsonl` (text starting with `"write D-ADR0036: ..."`). Every
// real caller (5 skill files, every existing test) already used `--text`
// explicitly, so requiring it outright removes the whole failure class with
// no behavior change for any real caller.

import { test } from 'node:test';
import {
  assert,
  run,
  tmpCwd,
} from './helpers/fgos-cli-harness.mjs';

test('decision with no --text, only positional args, refuses with a validation error (exit 4) instead of silently storing corrupted text', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'decision',
    'write',
    'D-ADR0036: some decision text typed without --text',
    '--rationale', 'because reasons',
    '--relation', 'none',
  ]);
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(`${result.stdout}${result.stderr}`, /decision requires --text/);
});
