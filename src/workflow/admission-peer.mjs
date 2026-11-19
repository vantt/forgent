// admission-peer.mjs -- the Workflow's case admission port served to a native unit run.
//
// The host starts this payload module (through `legacy_exec`, the launcher of every payload module it talks to)
// when a standalone `fgos run` asks the port: every writing run, a run that names a case, and a confined worker's
// writing run. It builds the port the Node `fgos run` built (`createCaseAdmissionPort` for the main checkout the
// run is in, plus `activityUnitOf` and `confinedWriteRefusal`) and serves it over this process's stdin and stdout
// with the peer protocol of `src/native/execution-door.mjs`. No logic of its own.
//
// Arguments: `--repo-root <main checkout>`, given when the run knows its main checkout; without it the case port
// is not built and only the two reads are served.
import process from 'node:process';
import { serveAdmissionPeer } from '../native/execution-door.mjs';
import { createCaseAdmissionPort, activityUnitOf, confinedWriteRefusal } from './case-admission-port.mjs';

function repoRootOf(argv) {
  const at = argv.indexOf('--repo-root');
  if (at === -1) return null;
  const value = argv[at + 1];
  if (typeof value !== 'string' || value === '') throw new Error('admission-peer: --repo-root requires a path');
  return value;
}

const repoRoot = repoRootOf(process.argv.slice(2));
const port = {
  ...(repoRoot === null ? {} : createCaseAdmissionPort({ repoRoot })),
  activityUnitOf,
  confinedWriteRefusal,
};
await serveAdmissionPeer(port, process.stdin, process.stdout);
