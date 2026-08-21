// main-checkout-guard-warnings.mjs — records a D1 events.jsonl truncation guard warning
// when a silent truncation (git reset/checkout/clean) is detected on the main checkout.
//
// Deliberately NOT events.jsonl and deliberately NOT sharing events.lock — same reasoning
// as approve-fault-log.mjs: plain fs.appendFileSync to its own file.
// Never throws into caller.

import fs from 'node:fs';
import path from 'node:path';

export const MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME = 'main-checkout-guard-warnings.jsonl';

/**
 * Record a truncation guard warning.
 * @param {string} dir - .fgos directory or repo directory containing .fgos
 * @param {Object} report - report returned by checkTruncationGuard / advanceEventsJsonlTruncationGuard
 * @returns {string|null} path of log file written, or null on error
 */
export function recordMainCheckoutGuardWarning(dir, report) {
  try {
    const fgosDir = path.basename(dir) === '.fgos' ? dir : path.join(dir, '.fgos');
    const logPath = path.join(fgosDir, MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME);
    const record = {
      ts: new Date().toISOString(),
      reason: report?.reason ?? 'unknown',
      message: report?.message ?? '',
      mark: report?.mark ?? null,
    };
    fs.mkdirSync(fgosDir, { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8');
    return logPath;
  } catch {
    return null;
  }
}

/**
 * Read recorded truncation guard warnings.
 * @param {string} dir - .fgos directory or repo directory containing .fgos
 * @returns {Array<{ts: string, reason: string, message: string, mark: any}>} array of warning records
 */
export function readMainCheckoutGuardWarnings(dir) {
  try {
    const fgosDir = path.basename(dir) === '.fgos' ? dir : path.join(dir, '.fgos');
    const logPath = path.join(fgosDir, MAIN_CHECKOUT_GUARD_WARNINGS_BASENAME);
    if (!fs.existsSync(logPath)) {
      return [];
    }
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const records = [];
    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch {
        // ignore malformed lines
      }
    }
    return records;
  } catch {
    return [];
  }
}

