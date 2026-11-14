// The committed verb manifest (packages/host-runtime/contracts/command-manifest.json): the file the host
// renders every help form from. Tests that check what the manifest says about a verb read it here, without
// starting a process; the generator's drift test proves the file is the registry projection.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/host-runtime/contracts/command-manifest.json');

export function commandManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
}

export function manifestEntry(name) {
  const entry = commandManifest().commands.find((command) => command.name === name);
  if (!entry) throw new Error(`the command manifest has no "${name}" entry`);
  return entry;
}
