// shell-rc.mjs — detect a user's existing shell rc file(s) and idempotently
// insert the fgos-shell-integration.sh source line into them (CONTEXT.md
// D4: bash and zsh both in scope; D6: `fgos setup` inserts and announces,
// never asks first).
//
// Never creates a new rc file: detectRcFiles only reports rc files that
// already exist on disk, and insertSourceLine only ever appends to one of
// those — it refuses rather than creating a missing file.

import fs from 'node:fs';
import path from 'node:path';

const RC_FILE_NAMES = ['.bashrc', '.zshrc'];

export function detectRcFiles(homeDir) {
  return RC_FILE_NAMES.map((name) => path.join(homeDir, name)).filter((candidate) =>
    fs.existsSync(candidate),
  );
}

function sourceLinePattern(integrationScriptPath) {
  const escapedPath = integrationScriptPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*(?:source|\\.)\\s+["']?${escapedPath}["']?\\s*(?:#.*)?$`, 'm');
}

export function hasSourceLine(rcFilePath, integrationScriptPath) {
  if (!fs.existsSync(rcFilePath)) {
    return false;
  }
  const content = fs.readFileSync(rcFilePath, 'utf8');
  return sourceLinePattern(integrationScriptPath).test(content);
}

export function insertSourceLine(rcFilePath, integrationScriptPath) {
  if (!fs.existsSync(rcFilePath)) {
    throw new Error(`refusing to create rc file that does not already exist: ${rcFilePath}`);
  }
  if (hasSourceLine(rcFilePath, integrationScriptPath)) {
    return false;
  }
  const comment = "# Added by fgos setup: source forgent's fgos/fgos-runner shell functions";
  const sourceLine = `source "${integrationScriptPath}"`;
  fs.appendFileSync(rcFilePath, `\n${comment}\n${sourceLine}\n`);
  return true;
}
