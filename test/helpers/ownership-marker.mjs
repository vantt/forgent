// Rewrite fields of a confinement home's ownership marker in place: what an agent, or an older release, could
// leave in it. Production never changes a marker after the home is made.
import fs from 'node:fs';
import path from 'node:path';
import { OWNERSHIP_MARKER_FILE } from '../../src/runner/dispatch/confinement/cleanup.mjs';

export function rewriteOwnershipMarker(dir, fields) {
  const file = path.join(dir, OWNERSHIP_MARKER_FILE);
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), ...fields }, null, 2));
}
