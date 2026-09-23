#!/usr/bin/env node
// Temporary CI diagnostic: run one test file under `node --test` with a
// watchdog. If it has not exited by the deadline, print every process still
// descended from it (pid, parent, command line) before killing the tree, so a
// hang that only happens on one OS names its own culprit in the job log.
//
// Usage: node scripts/ci-diagnose-hang.mjs <test-file> [deadline-seconds]
import { spawn, execFileSync } from 'node:child_process';

const [file, deadlineArg = '600'] = process.argv.slice(2);
const deadlineMs = Number(deadlineArg) * 1000;
const startedAt = Date.now();
const child = spawn(process.execPath, ['--test', file], { stdio: 'inherit' });

function processTable() {
  if (process.platform === 'win32') {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-Command',
      'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine | ConvertTo-Json -Compress'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(out).map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, cmd: p.CommandLine || '' }));
  }
  return execFileSync('ps', ['-eo', 'pid=,ppid=,args='], { encoding: 'utf8' }).split('\n').filter(Boolean).map((line) => {
    const [pid, ppid, ...cmd] = line.trim().split(/\s+/);
    return { pid: Number(pid), ppid: Number(ppid), cmd: cmd.join(' ') };
  });
}

function descendants(rootPid) {
  const table = processTable();
  const found = [];
  const queue = [rootPid];
  while (queue.length) {
    const pid = queue.shift();
    for (const p of table) {
      if (p.ppid === pid && !found.some((f) => f.pid === p.pid)) {
        found.push(p);
        queue.push(p.pid);
      }
    }
  }
  return found;
}

const timer = setTimeout(() => {
  console.log(`\n[diagnose-hang] ${file} still running after ${deadlineArg}s. Live descendants of pid ${child.pid}:`);
  try {
    for (const p of descendants(child.pid)) console.log(`[diagnose-hang] pid=${p.pid} ppid=${p.ppid} ${p.cmd}`);
  } catch (err) {
    console.log(`[diagnose-hang] could not list processes: ${err.message}`);
  }
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'inherit' });
    else process.kill(child.pid, 'SIGKILL');
  } catch {}
  process.exitCode = 124;
}, deadlineMs);

child.on('exit', (code) => {
  clearTimeout(timer);
  console.log(`[diagnose-hang] ${file} exited code=${code} after ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  if (process.exitCode === undefined) process.exitCode = code ?? 1;
});
