import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * True when the current process was launched with this module as its
 * entrypoint (`node some-script.mjs`), false when it was only imported.
 *
 * `import.meta.url === \`file://${process.argv[1]}\`` looks equivalent but
 * isn't: `import.meta.url` is a percent-encoded file URL (spaces become
 * `%20`) while the template literal is a raw path, so the two never match
 * whenever the resolved path contains a character URL-encoding changes --
 * always on Windows (`file:///D:/...` vs `file://D:\...`), and on any OS
 * when the path itself has a space or other reserved character.
 *
 * `realpathSync` matters separately from that: when `argv[1]` is a symlink
 * (a wrapper bin, a dev-checkout shell helper), Node's ESM loader resolves
 * `import.meta.url` to the symlink's REAL target, while `argv[1]` stays the
 * symlink path the user actually typed -- comparing the raw resolved path
 * against that real target then never matches either, same silent-no-op
 * failure mode. Resolving both sides through `realpathSync` before building
 * the file URL keeps them on equal footing.
 */
export function isMainModule(importMetaUrl) {
  if (!process.argv[1]) return false;
  let resolved = path.resolve(process.argv[1]);
  try {
    resolved = fs.realpathSync(resolved);
  } catch {
    // argv[1] doesn't exist on disk -- fall back to the unresolved path
    // rather than throwing out of what is meant to be a cheap boolean check.
  }
  return importMetaUrl === pathToFileURL(resolved).href;
}
