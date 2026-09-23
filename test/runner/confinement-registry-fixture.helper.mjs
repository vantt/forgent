// Shared fixture: point the machine confinement backend registry at a
// file-local copy for the rest of the calling test file, so tests never read
// the real ~/.fgos/confinement-backends.json. A machine that never ran
// `fgos setup` (CI) must behave exactly like one that did.
import { after } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ENV_KEY = 'FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH';

export function seedFileLocalBwrapRegistry(executable = '/usr/bin/bwrap') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-confinement-registry-'));
  const registryPath = path.join(dir, 'confinement-backends.json');
  fs.writeFileSync(registryPath, JSON.stringify({
    contract: 'confinement-backend-registry.v1',
    confinementBackends: { bwrap: { type: 'bwrap', enabled: true, executable } },
  }));
  const previous = process.env[ENV_KEY];
  process.env[ENV_KEY] = registryPath;
  after(() => {
    if (previous === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return registryPath;
}
