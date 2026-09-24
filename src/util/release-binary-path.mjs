// release-binary-path.mjs -- the one place that knows a `cargo build
// --release` binary needs `.exe` on win32 and nothing extra anywhere else.
// Every caller resolving a compiled fgos/fgctl/herdr-fgos path under
// target/release/<name> needs the identical rule; before this existed each
// call site hardcoded the extensionless POSIX name, so every one of them
// reported a genuinely-built Windows binary as missing.
//
// PURE: string in, string out. No fs, no child_process, no imports.

import path from 'node:path';

/** `path.join(releaseDir, name)`, with `.exe` appended on win32. */
export function releaseBinaryPath(releaseDir, name) {
  return path.join(releaseDir, process.platform === 'win32' ? `${name}.exe` : name);
}
