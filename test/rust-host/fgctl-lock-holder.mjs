// Holds a registry lock through the Node holder-lock facade in a child process, so a test can
// race a real second process against `fgctl` on the same kernel lock file. The lock lives on the
// child's open description: killing the child frees it, nothing else does.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FACADE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'holder-lock', 'index.mjs');

const HOLDER_SOURCE = `
import { acquireSync, createLockScope } from ${JSON.stringify(FACADE)};
const [name, paramsJson] = process.argv.slice(1);
const res = acquireSync(createLockScope(name), name, JSON.parse(paramsJson));
if (res.result !== 'acquired') { console.error('not-acquired ' + JSON.stringify(res)); process.exit(3); }
process.stdout.write('held\\n');
setInterval(() => {}, 1 << 30);
`;

/** Takes lock `name` (params resolve its path, e.g. `{ fgosDir }`) in a child; resolves once held. */
export function holdLock(name, params, { env = {} } = {}) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', HOLDER_SOURCE, name, JSON.stringify(params)], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d));
  const exited = new Promise((resolve) => child.once('exit', resolve));
  return new Promise((resolve, reject) => {
    let out = '';
    child.stdout.on('data', (d) => {
      out += d;
      if (out.includes('held\n')) {
        resolve({
          pid: child.pid,
          /** SIGKILL, the way a crashed holder ends; resolves once reaped. */
          kill: async () => {
            child.kill('SIGKILL');
            await exited;
          },
        });
      }
    });
    exited.then((code) => reject(new Error(`lock holder exited ${code} before holding: ${stderr}`)));
  });
}
