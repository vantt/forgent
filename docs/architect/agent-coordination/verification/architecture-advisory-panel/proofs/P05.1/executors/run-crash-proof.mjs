// Real crash/fresh-process recovery driver for P05.1. Spawns the actual
// `fgos coordination run` CLI as a genuine child process dispatching the
// deliberately slow synthesis step, waits for real proof the executor
// subprocess is mid-flight (its own started marker file), then sends a
// real SIGKILL to the fgos process and records everything to disk so the
// evidence is inspectable afterward, not just narrated.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const WORK = process.cwd();
const FGOS = '/home/vantt/projects/forgentX/bin/fgos.mjs';
const markerPath = path.join(WORK, 'exec-slow-started.marker');
const finishedMarkerPath = path.join(WORK, 'exec-slow-finished.marker');
const log = [];
function record(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  log.push(stamped);
  console.log(stamped);
}

if (fs.existsSync(markerPath)) fs.unlinkSync(markerPath);
if (fs.existsSync(finishedMarkerPath)) fs.unlinkSync(finishedMarkerPath);

const outFile = fs.openSync(path.join(WORK, 'out-04-dispatch-synth-slow.json'), 'w');
const errFile = fs.openSync(path.join(WORK, 'out-04-dispatch-synth-slow.stderr.log'), 'w');

record('Spawning real child process: node bin/fgos.mjs coordination run --file req-04-dispatch-synth-slow.json');
const child = spawn(process.execPath, [FGOS, 'coordination', 'run', '--file', 'req-04-dispatch-synth-slow.json'], {
  cwd: WORK,
  stdio: ['ignore', outFile, errFile],
});
record(`Real child PID launched: ${child.pid}`);

let exited = false;
child.on('exit', (code, signal) => {
  exited = true;
  record(`Child process exited on its own (code=${code}, signal=${signal}) -- unexpected for this proof if it happened before the kill below.`);
});

async function waitFor(predicate, timeoutMs, intervalMs = 100) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// 1. Wait for real proof the executor subprocess is genuinely mid-flight.
const markerAppeared = await waitFor(() => fs.existsSync(markerPath), 15000);
if (!markerAppeared) {
  record('FAILURE: exec-slow-started.marker never appeared within 15s -- cannot prove mid-flight state, aborting proof.');
  process.exit(1);
}
const markerContent = fs.readFileSync(markerPath, 'utf8');
record(`Real proof of mid-flight execution: exec-slow-started.marker written by the executor subprocess: ${markerContent.trim()}`);

// 2. Confirm the fgos process is still alive (not already exited) right before the kill.
let aliveBeforeKill = false;
try {
  process.kill(child.pid, 0);
  aliveBeforeKill = true;
} catch {
  aliveBeforeKill = false;
}
record(`fgos coordination run PID ${child.pid} alive immediately before kill -9: ${aliveBeforeKill}`);

// 3. The real kill -9.
record(`Sending REAL SIGKILL to PID ${child.pid} (the actual "fgos coordination run" process, mid-dispatch).`);
process.kill(child.pid, 'SIGKILL');

// 4. Confirm the process is actually dead (not just exited cleanly).
const confirmedDead = await waitFor(() => {
  try {
    process.kill(child.pid, 0);
    return false;
  } catch (err) {
    return err.code === 'ESRCH';
  }
}, 5000, 50);
record(`Confirmed dead (ESRCH on kill -0 probe) within 5s: ${confirmedDead}`);
record(`Child process 'exit' event fired: ${exited}`);

// 5. Confirm the slow executor's own subprocess never got to finish (proves
// the kill landed genuinely mid-flight, not after settlement).
const finishedBeforeKillWon = fs.existsSync(finishedMarkerPath);
record(`exec-slow-finished.marker exists (would mean the executor settled before/despite the kill): ${finishedBeforeKillWon}`);

// 6. Best-effort cleanup: the executor subprocess is spawned detached as its
// own process-group leader (transport.mjs), so SIGKILL on the parent does
// NOT reach it -- record that honestly and reap it explicitly rather than
// leaving an orphan.
try {
  const { execSync } = await import('node:child_process');
  const psOut = execSync(`pgrep -f "exec-slow.mjs"`, { encoding: 'utf8' }).trim();
  if (psOut) {
    record(`Orphaned executor subprocess(es) still running after parent kill (expected -- detached process group, transport.mjs): PID(s) ${psOut.split('\n').join(', ')}`);
    for (const pid of psOut.split('\n')) {
      if (pid.trim()) {
        process.kill(Number(pid.trim()), 'SIGKILL');
        record(`Explicitly reaped orphaned executor PID ${pid.trim()} with SIGKILL (cleanup, not part of the crash mechanism itself).`);
      }
    }
  } else {
    record('No orphaned exec-slow.mjs process found (already exited or process-group kill reached it).');
  }
} catch (err) {
  record(`pgrep found no matching orphan process (exit code nonzero) -- treating as "none left": ${err.message.split('\n')[0]}`);
}

fs.writeFileSync(path.join(WORK, 'crash-proof-log.txt'), log.join('\n') + '\n');
record('Crash-proof driver log written to crash-proof-log.txt');
process.exit(0);
