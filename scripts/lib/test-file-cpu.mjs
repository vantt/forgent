// The CPU a test costs: what a process spent itself plus what every child it waited for spent (git, bwrap,
// the CLIs a test runs), read from /proc/self/stat. The full suite reads it around the whole run, and each
// test file process appends its own to the log CPU_LOG_ENV names when it exits (test/helpers/git-spawn-spy.mjs
// installs that). Linux only; elsewhere the reading is null and the run is reported without CPU.

import fs from 'node:fs';
import path from 'node:path';

export const CPU_LOG_ENV = 'FGOS_TEST_CPU_LOG';
// USER_HZ, the unit of /proc/<pid>/stat times, is 100 on every Linux architecture.
const TICKS_PER_SECOND = 100;

/** Seconds of CPU this process and its waited-for children have used, or null off Linux. */
export function waitedCpuSeconds(readStat = () => fs.readFileSync('/proc/self/stat', 'utf8')) {
  if (process.platform !== 'linux') return null;
  try {
    // Fields after the command name, which may hold spaces: state is [0], utime [11], stime [12], cutime [13], cstime [14].
    const stat = readStat();
    const fields = stat.slice(stat.lastIndexOf(') ') + 2).split(' ');
    return fields.slice(11, 15).reduce((sum, ticks) => sum + Number(ticks), 0) / TICKS_PER_SECOND;
  } catch {
    return null;
  }
}

/** Records this test file's CPU at exit when the suite asked for it and this process is a test file. */
export function recordTestFileCpuAtExit(env = process.env, file = process.argv[1]) {
  const log = env[CPU_LOG_ENV];
  if (!log || !/\.test\.m?js$/.test(file ?? '') || waitedCpuSeconds() === null) return;
  process.on('exit', () => {
    try {
      fs.appendFileSync(log, `${JSON.stringify({ file: path.resolve(file), cpuSeconds: waitedCpuSeconds() })}\n`);
    } catch {
      // A missing record leaves that file out of the cost report; it never fails the test.
    }
  });
}

/** CPU seconds per test file of `files` (paths relative to `cwd`), from the log; files not in the run are dropped. */
export function readTestFileCpu(log, cwd, files) {
  const wanted = new Set(files);
  const cpu = {};
  let text = '';
  try { text = fs.readFileSync(log, 'utf8'); } catch { return cpu; }
  for (const line of text.split('\n').filter(Boolean)) {
    const { file, cpuSeconds } = JSON.parse(line);
    const rel = path.relative(cwd, file).replaceAll('\\', '/');
    if (wanted.has(rel) && typeof cpuSeconds === 'number') cpu[rel] = (cpu[rel] ?? 0) + cpuSeconds;
  }
  return cpu;
}
