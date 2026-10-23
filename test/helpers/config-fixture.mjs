// The one door a test uses to put a config file on disk. Tests never write
// `.fgos/config.json` by hand: when the on-disk format or file name changes,
// this module is the single place that follows.
//
// Project and global config share one layout (`<root>/.fgos/<file>`), so one
// path function and one writer serve both scopes; the product writer
// (`writeSharedConfig`) produces the bytes, so a test fixture and a real
// `fgos setup` write the same thing.

import fs from 'node:fs';
import path from 'node:path';

import { sharedConfigFilePath, writeSharedConfig } from '../../src/config/shared-config-file.mjs';

/** Path of the project config under `dir` (a repo or fixture root). */
export function projectConfigPath(dir) {
  return sharedConfigFilePath(dir);
}

/** Path of the global config under `home` (a fake HOME). */
export function globalConfigPath(home) {
  return sharedConfigFilePath(home);
}

/** Write `value` (a plain object) as the project config under `dir`, creating `.fgos/`. */
export function writeProjectConfig(dir, value) {
  writeSharedConfig(dir, value);
}

/** Write `value` (a plain object) as the global config under `home`, creating `.fgos/`. */
export function writeGlobalConfig(home, value) {
  writeSharedConfig(home, value);
}

function writeRaw(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

/** Write exactly `text` as the project config: malformed content or byte-exact fixtures. */
export function writeRawProjectConfig(dir, text) {
  writeRaw(projectConfigPath(dir), text);
}

/** Write exactly `text` as the global config. */
export function writeRawGlobalConfig(home, text) {
  writeRaw(globalConfigPath(home), text);
}
