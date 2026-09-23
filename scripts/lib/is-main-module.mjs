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
 * when the path itself has a space or other reserved character. Comparing
 * two `pathToFileURL(...).href` values keeps both sides normalized the
 * same way.
 */
export function isMainModule(importMetaUrl) {
  if (!process.argv[1]) return false;
  return importMetaUrl === pathToFileURL(path.resolve(process.argv[1])).href;
}
