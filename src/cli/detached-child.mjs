// The one door through which a fgos CLI process hands work to a detached `fgos` child of its own and exits without
// waiting for it. The child is the same CLI entry (`bin/fgos.mjs`) run by the same node with the caller's environment,
// so it resolves the host, the state root and the writer identity exactly as the caller did. It leads its own session,
// has no IPC channel and holds no descriptor of the caller. A spawn that cannot start never throws: the caller gets
// `{ pid: null, error }` and decides what the missing child costs.
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const OWN_CLI = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));

/**
 * @param {{ args: string[], cwd?: string, env?: object, logPath?: string, cliPath?: string }} spec
 *   `args` are the CLI arguments after the entry file; `logPath` collects the child's output (none: discarded).
 * @returns {{ pid: number | null, logPath: string | null, error?: string }}
 */
export function spawnDetachedCli({ args, cwd = process.cwd(), env = process.env, logPath = null, cliPath = OWN_CLI }) {
  let logFd = null;
  try {
    if (logPath) logFd = fs.openSync(logPath, 'a');
    const out = logFd ?? 'ignore';
    const child = spawn(process.execPath, [cliPath, ...args], { cwd, detached: true, env, stdio: ['ignore', out, out], windowsHide: true });
    // A program that cannot start reports asynchronously; swallow it so it never ends the caller.
    child.on('error', () => {});
    child.unref();
    return { pid: child.pid ?? null, logPath };
  } catch (error) {
    return { pid: null, logPath, error: error.code ?? error.message };
  } finally {
    if (logFd !== null) fs.closeSync(logFd);
  }
}
