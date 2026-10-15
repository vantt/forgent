// main-checkout-activity.mjs — the "someone just committed here" beacon the
// pre-commit hook leaves on the main checkout.
//
// A beacon is a hint, not a lock. It lives in its own file, apart from
// `.fgos/main-checkout.lock` (the mutex fgOS writers hold around claim,
// checkpoint and land), so a commit no longer blocks the next claim, land or
// `fgctl init` of any session for the reader's own TTL. Only the hook reads
// it (to refuse a second session's commit inside the window) and only the
// hook writes it; `fgos lock-status` shows it and a session's own verbs may
// clear it when that session is done with the checkout.
//
// Record: {v:1, kind:'beacon', writer:{id, source}, writtenAt, windowMs,
// auditPid}. `windowMs` is the one duration field and the writer sets it.
// `auditPid` is for debugging only; liveness is never probed. A corrupt or
// foreign-schema beacon fails open: the hook warns and overwrites it.
//
// Zero-dep, Node builtins only: the hook imports this file by relative path.
import fs from 'node:fs';
import path from 'node:path';

export const BEACON_SCHEMA = 1;
export const BEACON_RELATIVE_PATH = path.join('runtime', 'main-checkout-activity.json');

export function beaconPath(fgosDir) {
  return path.join(fgosDir, BEACON_RELATIVE_PATH);
}

function isWriterId(value) {
  if (typeof value === 'string') return value.length > 0;
  return Number.isInteger(value) && value > 0;
}

function parseBeacon(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const { v, kind, writer, writtenAt, windowMs } = parsed;
  if (v !== BEACON_SCHEMA || kind !== 'beacon') return null;
  if (!writer || typeof writer !== 'object' || !isWriterId(writer.id)) return null;
  if (!Number.isSafeInteger(writtenAt) || writtenAt <= 0) return null;
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) return null;
  return parsed;
}

/** Reads the beacon: `{status:'none'}`, `{status:'corrupt'}` (unparseable or
 * a schema this release does not know), or `{status:'ok', record, raw}`. */
export function readBeacon(fgosDir) {
  let raw;
  try {
    raw = fs.readFileSync(beaconPath(fgosDir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { status: 'none' };
    throw err;
  }
  const record = parseBeacon(raw);
  return record === null ? { status: 'corrupt' } : { status: 'ok', record, raw };
}

/**
 * Decides whether `writerId` may commit given what `readBeacon` returned.
 * Returns `{decision:'allow'|'refuse', reason, ageMs?, remainingMs?}`:
 *   - none / corrupt (fail-open, the hook warns) / same writer / window
 *     elapsed → allow;
 *   - a different writer inside its own `windowMs` → refuse.
 * A beacon dated further in the future than its own window is treated as
 * corrupt, so a clock step can never block the checkout indefinitely.
 */
export function judgeBeacon(read, writerId, now = Date.now()) {
  if (read.status === 'none') return { decision: 'allow', reason: 'none' };
  if (read.status === 'corrupt') return { decision: 'allow', reason: 'corrupt' };
  const { record } = read;
  if (record.writer.id === writerId) return { decision: 'allow', reason: 'same-writer' };
  const ageMs = now - record.writtenAt;
  if (ageMs < -record.windowMs) return { decision: 'allow', reason: 'corrupt' };
  if (ageMs <= record.windowMs) {
    return { decision: 'refuse', reason: 'other-writer-active', ageMs: Math.max(0, ageMs), remainingMs: record.windowMs - Math.max(0, ageMs) };
  }
  return { decision: 'allow', reason: 'expired', ageMs };
}

/** Publishes the beacon atomically (temp file + rename), replacing any
 * previous one. */
export function writeBeacon(fgosDir, { writer, windowMs, now = Date.now(), auditPid = process.pid }) {
  const target = beaconPath(fgosDir);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const record = { v: BEACON_SCHEMA, kind: 'beacon', writer: { id: writer.id, source: writer.source ?? null }, writtenAt: now, windowMs, auditPid };
  const tmpPath = `${target}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tmpPath, JSON.stringify(record));
  fs.renameSync(tmpPath, target);
  return record;
}

/**
 * Removes the beacon only when it was written by `writerId`, re-reading it
 * right before the unlink so a different writer's fresh beacon is never
 * removed. Returns `{status}`: 'cleared', 'no-beacon', 'not-owner' or
 * 'corrupt' (left in place; the next hook run overwrites it).
 */
export function clearBeaconIfOwn(fgosDir, writerId) {
  const first = readBeacon(fgosDir);
  if (first.status === 'none') return { status: 'no-beacon' };
  if (first.status === 'corrupt') return { status: 'corrupt' };
  if (first.record.writer.id !== writerId) return { status: 'not-owner' };
  const again = readBeacon(fgosDir);
  if (again.status === 'none') return { status: 'no-beacon' };
  if (again.status !== 'ok' || again.raw !== first.raw) return { status: 'not-owner' };
  try {
    fs.unlinkSync(beaconPath(fgosDir));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return { status: 'cleared' };
}
