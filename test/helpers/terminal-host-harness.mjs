// test/helpers/terminal-host-harness.mjs -- what a test needs so the real
// `fgos internal terminal-control` route can drive a fake herdr binary.
//
// The route identifies the herdr server by the process listening on its
// socket, and keeps its allocation records under the state root. The harness
// listens on a socket in this test process (so this process is the "server"),
// points HERDR_SOCKET_PATH at it, and gives the route a private state root.
// FGOS_HOST_BIN must name a host built from this checkout; without it the
// client refuses with a named error, which is the right failure.
//
//   const harness = await startTerminalHarness();   // in before()
//   harness.stop();                                 // in after()

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const TOUCHED = ['FGOS_STATE_ROOT', 'HERDR_SOCKET_PATH', 'HERDR_SESSION'];

export async function startTerminalHarness() {
  // A unix socket path is limited to about a hundred characters, and a test run's own temp dir can
  // be long: the harness lives under /tmp directly.
  const scratch = fs.mkdtempSync(path.join(process.platform === 'win32' ? os.tmpdir() : '/tmp', 'fgos-tch-'));
  const socketPath = path.join(scratch, 'herdr.sock');
  const stateRoot = path.join(scratch, 'state');
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });
  const saved = Object.fromEntries(TOUCHED.map((name) => [name, process.env[name]]));
  process.env.FGOS_STATE_ROOT = stateRoot;
  process.env.HERDR_SOCKET_PATH = socketPath;
  delete process.env.HERDR_SESSION;
  return {
    socketPath,
    stateRoot,
    stop() {
      server.close();
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      fs.rmSync(scratch, { recursive: true, force: true });
    },
  };
}
