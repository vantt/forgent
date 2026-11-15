// shell-rc.mjs — detect a user's existing shell rc file(s), for the repository's session-start hook
// (scripts/fgos-session-start-hook.mjs). Read-only, and only rc files that already exist on disk.
//
// WINDOWS (tsk-63j D3): also detects PowerShell profile paths on win32 — detection only.

import fs from 'node:fs';
import path from 'node:path';

const RC_FILE_NAMES = ['.bashrc', '.zshrc'];

// Well-known default profile locations (Microsoft docs): Windows
// PowerShell 5.1 and PowerShell 7+ (pwsh) keep separate profile files
// under the user's Documents folder.
const WINDOWS_PROFILE_RELATIVE_PATHS = [
  path.join('Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
  path.join('Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1'),
];

export function detectRcFiles(homeDir, platform = process.platform) {
  const relativeNames = platform === 'win32' ? WINDOWS_PROFILE_RELATIVE_PATHS : RC_FILE_NAMES;
  return relativeNames.map((name) => path.join(homeDir, name)).filter((candidate) =>
    fs.existsSync(candidate),
  );
}
