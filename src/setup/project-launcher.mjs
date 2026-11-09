// project-launcher.mjs — the `fgos` command that runs each project's own fgos.
//
// A release install puts only `fgctl` on PATH; `fgctl init` then activates a
// release per project in `<project>/.fgos/installation/activation.json`.
// Nothing put a plain `fgos` on PATH, so people typed an absolute path. This
// module owns a tiny launcher, written next to `fgctl`, that walks up from the
// working directory to the nearest activation and runs the release it names:
// each project runs the release it activated, from any subdirectory, in any
// shell, interactive or not (hooks and agents included), with no rc file edit.
//
// Trust: everything under a project's `.fgos/installation/` can arrive with a
// `git clone` (Git keeps the exec bit), so the launcher executes nothing from
// the project. It reads only `status` and `artifactDigest` from the activation
// and runs `<stateRoot>/releases/<artifactDigest>/bin/fgos`, the same release
// directory `fgctl verify` checks (packages/distribution/rust/src/store.rs
// `release_dir_path`): a release only `fgctl` puts into this machine's store,
// after verifying its digest. A digest that is not `sha256:` and 64 lowercase
// hex digits, a status other than `ready`, or a release missing from the store
// is refused by name with exit 126 and the fix. The state root follows the one
// formula (packages/holder-lock/rust/src/state_root.rs `state_root_from`):
// FGOS_STATE_ROOT, FGOS_STATE_HOME (a blank value counts as unset), then
// XDG_STATE_HOME/fgos, HOME/.local/state/fgos, USERPROFILE/.local/state/fgos,
// then the relative `.local/state/fgos`. The sh form runs only shell builtins.
//
// The launcher carries a marker line so `doctor` can tell its own file from a
// foreign `fgos` (an npm global, say) and never overwrites the latter. The
// marker text never changes: an older launcher must still read as ours so the
// fix replaces it.

import fs from 'node:fs';
import path from 'node:path';

export const LAUNCHER_MARKER = 'fgos-project-launcher v1';

const WINDOWS = process.platform === 'win32';

const REFUSE_FIX = "fgos runs only a release fgctl installed on this machine -- run 'fgctl init' in the project to activate one, then 'fgctl verify'";

const SH_BODY = `#!/bin/sh
# ${LAUNCHER_MARKER}: runs the release the nearest enclosing project activated, from this machine's release store only.
_fgos_dir=$PWD
while [ ! -f "$_fgos_dir/.fgos/installation/activation.json" ]; do
  if [ "$_fgos_dir" = / ] || [ -z "$_fgos_dir" ]; then
    echo "fgos: no .fgos/installation found above $PWD -- run 'fgctl init' in the project" >&2
    exit 127
  fi
  _fgos_dir=\${_fgos_dir%/*}
  [ -n "$_fgos_dir" ] || _fgos_dir=/
done
_fgos_act="\${_fgos_dir%/}/.fgos/installation/activation.json"
_fgos_refuse() {
  echo "fgos: refusing $_fgos_act: $1 -- ${REFUSE_FIX}" >&2
  exit 126
}
# _fgos_field KEY LINE: sets _fgos_v to the quoted value after "KEY": on LINE; false when LINE has no "KEY".
_fgos_field() {
  case $2 in *"\\"$1\\""*) ;; *) return 1 ;; esac
  _fgos_v=\${2#*"\\"$1\\""}
  _fgos_v=\${_fgos_v#*:}
  _fgos_v=\${_fgos_v#*\\"}
  _fgos_v=\${_fgos_v%%\\"*}
}
_fgos_status= _fgos_digest= _fgos_has_status= _fgos_has_digest=
while IFS= read -r _fgos_line || [ -n "$_fgos_line" ]; do
  if [ -z "$_fgos_has_status" ] && _fgos_field status "$_fgos_line"; then _fgos_status=$_fgos_v; _fgos_has_status=1; fi
  if [ -z "$_fgos_has_digest" ] && _fgos_field artifactDigest "$_fgos_line"; then _fgos_digest=$_fgos_v; _fgos_has_digest=1; fi
  [ -z "$_fgos_has_status" ] || [ -z "$_fgos_has_digest" ] || break
done < "$_fgos_act" || _fgos_refuse "it is not readable"
[ "$_fgos_status" = ready ] || _fgos_refuse "status is not ready ($_fgos_status)"
case $_fgos_digest in sha256:*) _fgos_hex=\${_fgos_digest#sha256:} ;; *) _fgos_hex= ;; esac
case $_fgos_hex in *[!0-9a-f]*) _fgos_hex= ;; esac
[ \${#_fgos_hex} -eq 64 ] || _fgos_refuse "artifactDigest is not sha256 and 64 lowercase hex digits"
_fgos_nonblank() { case $1 in *[![:space:]]*) return 0 ;; esac; return 1; }
if _fgos_nonblank "\${FGOS_STATE_ROOT-}"; then _fgos_store=$FGOS_STATE_ROOT
elif _fgos_nonblank "\${FGOS_STATE_HOME-}"; then _fgos_store=$FGOS_STATE_HOME
elif _fgos_nonblank "\${XDG_STATE_HOME-}"; then _fgos_store=$XDG_STATE_HOME/fgos
elif [ "\${HOME+set}" = set ]; then _fgos_store=\${HOME:+$HOME/}.local/state/fgos
elif [ "\${USERPROFILE+set}" = set ]; then _fgos_store=\${USERPROFILE:+$USERPROFILE/}.local/state/fgos
else _fgos_store=.local/state/fgos
fi
_fgos_release=$_fgos_store/releases/$_fgos_digest
[ -d "$_fgos_release" ] || _fgos_release=$_fgos_store/releases/sha256-$_fgos_hex
[ -x "$_fgos_release/bin/fgos" ] || _fgos_refuse "release $_fgos_digest is not in this machine's release store $_fgos_store/releases"
exec "$_fgos_release/bin/fgos" "$@"
`;

const CMD_BODY = [
  '@echo off',
  `rem ${LAUNCHER_MARKER}: runs the release the nearest enclosing project activated, from this machine's release store only.`,
  'setlocal EnableExtensions DisableDelayedExpansion',
  'set "dir=%CD%"',
  ':loop',
  'if exist "%dir%\\.fgos\\installation\\activation.json" goto found',
  'for %%I in ("%dir%\\..") do set "parent=%%~fI"',
  'if /i "%parent%"=="%dir%" goto none',
  'set "dir=%parent%"',
  'goto loop',
  ':found',
  'if "%dir:~-1%"=="\\" set "dir=%dir:~0,-1%"',
  'set "ACTIVATION=%dir%\\.fgos\\installation\\activation.json"',
  'set "STORE="',
  'if defined FGOS_STATE_ROOT set "STORE=%FGOS_STATE_ROOT%"',
  'if not defined STORE if defined FGOS_STATE_HOME set "STORE=%FGOS_STATE_HOME%"',
  'if not defined STORE if defined XDG_STATE_HOME set "STORE=%XDG_STATE_HOME%\\fgos"',
  'if not defined STORE if defined HOME set "STORE=%HOME%\\.local\\state\\fgos"',
  'if not defined STORE if defined USERPROFILE set "STORE=%USERPROFILE%\\.local\\state\\fgos"',
  'if not defined STORE set "STORE=.local\\state\\fgos"',
  'set "STATUS_LINE="',
  'set "DIGEST_LINE="',
  'for /f "usebackq delims=" %%L in (`findstr /r /c:"^ *.status.:" "%ACTIVATION%"`) do if not defined STATUS_LINE set "STATUS_LINE=%%L"',
  'for /f "usebackq delims=" %%L in (`findstr /r /c:"^ *.artifactDigest.:" "%ACTIVATION%"`) do if not defined DIGEST_LINE set "DIGEST_LINE=%%L"',
  'setlocal EnableDelayedExpansion',
  'set "WHY=status is not ready"',
  'if not defined STATUS_LINE goto refuse',
  'set "STATUS=!STATUS_LINE:*: =!"',
  'set "STATUS=!STATUS:"=!"',
  'if "!STATUS:~-1!"=="," set "STATUS=!STATUS:~0,-1!"',
  'if /i not "!STATUS!"=="ready" goto refuse',
  'set "WHY=artifactDigest is not sha256 and 64 lowercase hex digits"',
  'if not defined DIGEST_LINE goto refuse',
  'set "DIGEST=!DIGEST_LINE:*: =!"',
  'set "DIGEST=!DIGEST:"=!"',
  'if "!DIGEST:~-1!"=="," set "DIGEST=!DIGEST:~0,-1!"',
  'if not "!DIGEST:~0,7!"=="sha256:" goto refuse',
  'set "HEX=!DIGEST:~7!"',
  'if not defined HEX goto refuse',
  'if not "!HEX:~64!"=="" goto refuse',
  'if "!HEX:~63,1!"=="" goto refuse',
  'set "REST=!HEX!"',
  'for %%C in (0 1 2 3 4 5 6 7 8 9 a b c d e f) do set "REST=!REST:%%C=!"',
  'if defined REST goto refuse',
  'set "ENTRY=!STORE!\\releases\\sha256-!HEX!\\bin\\fgos.exe"',
  'set "WHY=release !DIGEST! is not in this machine\'s release store !STORE!\\releases"',
  'if not exist "!ENTRY!" goto refuse',
  'endlocal & set "FGOS_LAUNCH_ENTRY=%ENTRY%"',
  '"%FGOS_LAUNCH_ENTRY%" %*',
  'exit /b %errorlevel%',
  ':refuse',
  `>&2 echo fgos: refusing !ACTIVATION!: !WHY! -- ${REFUSE_FIX}`,
  'exit /b 126',
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
