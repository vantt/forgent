// capped-jsonl-log.mjs — one JSON record per line in a private, size-capped log. A kernel leaf (fs, path and
// the tier-0 temp-name tag only), so any layer that keeps a history as a log (L1) can use it without reaching anything above.

import fs from 'node:fs';
import path from 'node:path';
import { uniqueTmpTag } from './unique-tmp-tag.mjs';

/** Past this size the oldest half of the log is dropped. */
export const FAULT_LOG_MAX_BYTES = 1024 * 1024;

/**
 * Append one JSON record to a log. The file is created 0600; once it passes `FAULT_LOG_MAX_BYTES` the
 * oldest half of its lines goes first. Takes no lock: a caller with concurrent writers serialises them
 * itself. Throws on a write failure; the callers catch.
 */
export function appendFaultRecord(logPath, record) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  try {
    if (fs.statSync(logPath).size > FAULT_LOG_MAX_BYTES) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      const temp = `${logPath}.tmp-${uniqueTmpTag()}`;
      fs.writeFileSync(temp, `${lines.slice(Math.ceil(lines.length / 2)).join('\n')}\n`, { mode: 0o600 });
      fs.renameSync(temp, logPath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  fs.chmodSync(logPath, 0o600);
}
