// What a crash row needs to know about an attempt from its envelope and its binding: which processes are
// the supervisor and the gate, and which are one step of the chain. The host refuses an envelope that names
// a host binary other than the one running it, so a step cannot be swapped for another command; a step is
// held by freezing the process the supervisor started for it (kill-on-file.mjs).
import fs from 'node:fs';
import path from 'node:path';

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

/** Supervisor and gate pids of a bound attempt, `[]` while it is not bound. */
export function bindingPids(runDir) {
  const binding = readJson(path.join(runDir, 'supervisor-binding.json'));
  return binding ? [binding.supervisor?.pid, binding.gate?.pid].filter(Boolean) : [];
}

/** Match the argv of a process that runs step `stepId` for `runDir` (the host route and the payload it starts). */
export function stepProcess(runDir, stepId) {
  return (args) => args.includes(stepId) && args.includes(runDir) && args.some((a) => a === 'attempt-step' || a.endsWith('attempt-step.mjs'));
}

/** Match the supervisor process of the attempt whose envelope is `<runDir>/envelope.json`. */
export function supervisorProcess(runDir) {
  const envelope = path.join(runDir, 'envelope.json');
  return (args) => args.includes('supervise') && args.includes(envelope);
}
