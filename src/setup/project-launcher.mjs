// project-launcher.mjs — the `fgos` command that runs each project's own fgos.
//
// A release install puts only `fgctl` on PATH; `fgctl init` then activates a
// release per project under `<project>/.fgos/installation/bin/`. Nothing put a
// plain `fgos` on PATH, so people typed an absolute path. This module owns a
// tiny launcher, written next to `fgctl`, that walks up from the working
// directory to the nearest `.fgos/installation/bin/fgos` and runs that one: each
// project runs the release it activated, from any subdirectory, in any shell,
// interactive or not (hooks and agents included), with no rc file edit.
//
// The launcher carries a marker line so `doctor` can tell its own file from a
// foreign `fgos` (an npm global, say) and never overwrites the latter.

import fs from 'node:fs';
import path from 'node:path';

export const LAUNCHER_MARKER = 'fgos-project-launcher v1';

const WINDOWS = process.platform === 'win32';

const SH_BODY = `#!/bin/sh
# ${LAUNCHER_MARKER}: runs the fgos that the nearest enclosing project activated.
dir=$PWD
while :; do
  if [ -x "$dir/.fgos/installation/bin/fgos" ]; then
    exec "$dir/.fgos/installation/bin/fgos" "$@"
  fi
  [ "$dir" = / ] && break
  dir=$(dirname "$dir")
done
echo "fgos: no .fgos/installation found above $PWD -- run 'fgctl init' in the project" >&2
exit 127
`;

const CMD_BODY = [
  '@echo off',
  `rem ${LAUNCHER_MARKER}: runs the fgos that the nearest enclosing project activated.`,
  'setlocal',
  'set "dir=%CD%"',
  ':loop',
  'if exist "%dir%\\.fgos\\installation\\bin\\fgos.cmd" goto run',
  'for %%I in ("%dir%\\..") do set "parent=%%~fI"',
  'if /i "%parent%"=="%dir%" goto none',
  'set "dir=%parent%"',
  'goto loop',
  ':run',
  '"%dir%\\.fgos\\installation\\bin\\fgos.cmd" %*',
  'exit /b %errorlevel%',
  ':none',
  'echo fgos: no .fgos\\installation found above %CD% -- run "fgctl init" in the project 1>&2',
  'exit /b 127',
  '',
].join('\r\n');

export function launcherFileName(platform = process.platform) {
  return platform === 'win32' ? 'fgos.cmd' : 'fgos';
}

export function launcherBody(platform = process.platform) {
  return platform === 'win32' ? CMD_BODY : SH_BODY;
}

function isExecutableFile(file) {
  try {
    if (!fs.statSync(file).isFile()) return false;
    if (!WINDOWS) fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function pathDirs(pathEnv) {
  return typeof pathEnv === 'string' && pathEnv ? pathEnv.split(path.delimiter).filter(Boolean) : [];
}

/** First PATH entry holding an executable `name` (with PATHEXT on Windows), as a full path. */
export function firstOnPath(name, pathEnv = process.env.PATH) {
  const exts = WINDOWS ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(Boolean) : [''];
  for (const dir of pathDirs(pathEnv)) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext);
      if (isExecutableFile(candidate)) return candidate;
    }
  }
  return null;
}

function readOwnFile(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Where `fgos` stands on PATH, in one of five states:
 *   ready     -- the first `fgos` is our launcher and current
 *   stale     -- the first `fgos` is our launcher but out of date
 *   foreign   -- the first `fgos` is someone else's file (never overwritten)
 *   missing   -- no `fgos` on PATH, and `fgctl` is on PATH so the launcher can go beside it
 *   no-fgctl  -- no `fgos` on PATH and no `fgctl` either: nowhere trustworthy to put it
 */
export function inspectLauncher({ pathEnv = process.env.PATH, platform = process.platform } = {}) {
  const first = firstOnPath('fgos', pathEnv);
  const body = launcherBody(platform);
  if (first) {
    const text = readOwnFile(first);
    if (text === null || !text.includes(LAUNCHER_MARKER)) return { state: 'foreign', file: first };
    return { state: text === body ? 'ready' : 'stale', file: first };
  }
  const fgctl = firstOnPath('fgctl', pathEnv);
  if (!fgctl) return { state: 'no-fgctl', file: null };
  return { state: 'missing', file: path.join(path.dirname(fgctl), launcherFileName(platform)) };
}

/** Write the launcher (executable on POSIX). Returns the file written. */
export function writeLauncher(file, platform = process.platform) {
  fs.writeFileSync(file, launcherBody(platform), { mode: 0o755 });
  if (platform !== 'win32') fs.chmodSync(file, 0o755);
  return file;
}
