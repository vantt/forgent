// Shared fixture: stub executables for the named agent CLIs. Seat Binding and doctor only count a CLI the
// machine has, so a test whose executors name `claude` or `omp` states those CLIs are installed instead of
// leaning on what the machine running it happens to have.
import { after } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** A directory holding one stub executable per command, removed when the calling test file ends; pass it as a session `pathEnv`. */
export function stubAgentCliDir(...commands) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agent-clis-'));
  for (const command of commands) fs.writeFileSync(path.join(dir, command), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** The named CLIs on PATH for the rest of the calling test file. */
export function seedStubAgentClis(...commands) {
  const dir = stubAgentCliDir(...commands);
  const previous = process.env.PATH;
  process.env.PATH = [dir, previous].filter(Boolean).join(path.delimiter);
  after(() => { process.env.PATH = previous; });
  return dir;
}
