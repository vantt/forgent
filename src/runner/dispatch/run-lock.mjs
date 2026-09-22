// dispatch/run-lock.mjs — the one append-only generation/release-marker
// primitive this cell introduces, per
// plans/260911-2305-runtime-recovery/phase-designs/run-admission-and-fencing.md
// ("Lock Protocol") and
// docs/architect/agent-coordination/architecture/runtime-recovery-design.md
// section 6 ("Local Concurrency And Durability").
//
// Shared by three callers: Assignment/Run admission (assignment-runner.mjs),
// schema-2 session retry declarations (coordination/store.mjs), and per-Run
// control-epoch/token fencing (this file's own acquireRunControl/
// releaseRunControl). One scope directory holds immutable, monotonically
// numbered generation records plus token-specific release markers, both
// published by a fsynced temp file followed by an exclusive hard link.
// Nothing here ever unlinks or overwrites a published record: a delayed
// straggler can only ever publish a NEW, higher-numbered generation, never
// touch an earlier one, so a stale release can never delete a successor.
//
// Reclaim rule (the fact P00 corrected against main-checkout-lock.mjs's own
// heartbeat-mitigated TTL takeover): a live PID remains HELD no matter how
// stale its heartbeat looks. `ttlMs` only gates whether a contender bothers
// to probe process liveness at all; the actual reclaim decision is PID-dead
// proof (`isProcessAlive` returns false), never elapsed time alone.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { getBootId, getProcessStartTime } from './process-identity.mjs';

// --- PID liveness --------------------------------------------------------

/** Signal-0 liveness probe (mirrors main-checkout-lock.mjs's isPidAlive).
 * EPERM means the pid exists under another user -- still alive. */
export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// --- Control holder identity (H1) -----------------------------------------

/** Build a control holder identity for the CURRENT process: `{id, pid,
 * bootId, processStartTime, host}`. Centralizes the shape so every
 * acquireRunControl caller records the same cross-checkable identity --
 * `id` alone (the pre-H1 shape) let a PID reused by an unrelated process
 * after the real holder died be mistaken for the same holder. */
export function buildRunControlHolder(id) {
  return {
    id,
    pid: process.pid,
    bootId: getBootId(),
    processStartTime: getProcessStartTime(process.pid),
    host: os.hostname(),
  };
}

/** Whether a recorded control holder is still the live process that
 * acquired the lock, fails closed toward 'held' whenever that cannot be
 * disproven:
 *  - bootId recorded and differs from the current boot -> 'dead' (the host
 *    rebooted since acquisition; that pid cannot still be this holder).
 *  - pid not alive (ESRCH) -> 'dead'.
 *  - pid alive but no recorded processStartTime (pre-H1 holder record) ->
 *    'held' (nothing to cross-check against; stay conservative).
 *  - pid alive but /proc/<pid>/stat unreadable -> 'held' (unknown is not
 *    dead).
 *  - pid alive and processStartTime matches -> 'held' (same process).
 *  - pid alive but processStartTime differs -> 'dead' (pid was reused by a
 *    different process). */
export function resolveHolderLiveness(holder) {
  if (!holder || !Number.isInteger(holder.pid)) return 'dead';
  const currentBootId = getBootId();
  if (holder.bootId && currentBootId && currentBootId !== 'unknown-boot' && holder.bootId !== currentBootId) {
    return 'dead';
  }
  if (!isProcessAlive(holder.pid)) return 'dead';
  if (!holder.processStartTime) return 'held';
  const liveStartTime = getProcessStartTime(holder.pid);
  if (liveStartTime === null) return 'held';
  return liveStartTime === holder.processStartTime ? 'held' : 'dead';
}

// --- Fsynced atomic publication -------------------------------------------

function writeFsyncedTemp(dir, content) {
  const tmpPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  return tmpPath;
}

/** Best-effort fsync of an already-written file, for a caller that wrote it
 * via plain `fs.writeFileSync` rather than `writeFsyncedTemp` above (e.g. a
 * file inside a staging directory this module doesn't own the writing of). */
export function fsyncFileBestEffort(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r+');
    fs.fsyncSync(fd);
  } catch {
    // best-effort, mirrors fsyncDirBestEffort below
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }
}

export function fsyncDirBestEffort(dir) {
  let fd;
  try {
    fd = fs.openSync(dir, 'r');
    fs.fsyncSync(fd);
  } catch {
    // Some platforms/filesystems refuse to open a directory for fsync;
    // publication already happened via the hard link itself, so this is
    // best-effort durability, not the correctness boundary.
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }
}

function removeTempBestEffort(tmpPath) {
  try {
    fs.unlinkSync(tmpPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// --- Generic append-only generation ledger --------------------------------
//
// A directory of immutable, monotonically numbered JSON records. Contenders
// for the same next generation race on one target path; exactly one wins
// the exclusive hard link, every loser rereads the (now different) current
// generation and re-decides.

const GENERATION_FILE_RE = /^(\d{10})\.json$/;

function generationFileName(epoch) {
  return `${String(epoch).padStart(10, '0')}.json`;
}

function parseJsonFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch {
    // A record this primitive published is always complete (fsynced temp +
    // atomic link); unparseable content here can only mean something else
    // wrote into this directory. Treated as absent, never authoritative.
    return null;
  }
}

/** Every published generation record in `generationsDir`, ascending by
 * epoch. Missing directory reads as an empty ledger. */
export function listGenerations(generationsDir) {
  let names;
  try {
    names = fs.readdirSync(generationsDir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const records = [];
  for (const name of names) {
    const match = GENERATION_FILE_RE.exec(name);
    if (!match) continue;
    const record = parseJsonFile(path.join(generationsDir, name));
    if (record === null) continue;
    records.push({ epoch: Number(match[1]), record });
  }
  records.sort((a, b) => a.epoch - b.epoch);
  return records;
}

/** The highest-epoch published generation, or null when the ledger is
 * empty. Never a cached/rebuilt projection -- always a fresh directory
 * read, since a rebuildable projection is explicitly not authority here. */
export function currentGeneration(generationsDir) {
  const generations = listGenerations(generationsDir);
  return generations.length > 0 ? generations[generations.length - 1] : null;
}

/**
 * Attempt to publish the next generation in `generationsDir`.
 *
 * `decide({ current, nextEpoch, generations })` is called fresh on every
 * attempt (including after losing a race) and must return either:
 *   - `{ stop: true, ...rest }` -- do not publish anything; `rest` is
 *     returned verbatim alongside `{ published: false }` (e.g. recognizing
 *     an already-committed idempotent match, or refusing as stale/held).
 *   - `{ record }` -- attempt to publish `record` as generation `nextEpoch`.
 *
 * On a lost race (a concurrent contender already published `nextEpoch`),
 * this rereads the ledger and calls `decide` again against the new current
 * generation -- so a loser either recognizes the winner's record as its own
 * outcome, or contends again for the generation beyond it. Nothing here
 * ever unlinks or overwrites a published record.
 */
export function publishNextGeneration(generationsDir, decide) {
  fs.mkdirSync(generationsDir, { recursive: true });
  for (;;) {
    const generations = listGenerations(generationsDir);
    const current = generations.length > 0 ? generations[generations.length - 1] : null;
    const nextEpoch = (current?.epoch ?? 0) + 1;
    const decision = decide({ current, nextEpoch, generations });
    if (decision.stop) {
      return { published: false, ...decision };
    }

    const targetPath = path.join(generationsDir, generationFileName(nextEpoch));
    const tmpPath = writeFsyncedTemp(generationsDir, JSON.stringify(decision.record));
    try {
      fs.linkSync(tmpPath, targetPath);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      removeTempBestEffort(tmpPath);
      continue; // lost the race -- reread and let `decide` re-evaluate
    }
    removeTempBestEffort(tmpPath);
    fsyncDirBestEffort(generationsDir);
    return { published: true, epoch: nextEpoch, record: decision.record };
  }
}

// --- One-shot markers (release markers, abort markers, ...) --------------
//
// Same publication discipline as a generation record, but keyed by an
// explicit path rather than "next number" -- used for anything that is
// published at most once for a given key (a release marker for one
// control token, a fulfillment/abort marker for one retryId). Idempotent:
// a second publish for the same path is a no-op, never an overwrite.

export function publishMarkerOnce(markerPath, record) {
  const dir = path.dirname(markerPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = writeFsyncedTemp(dir, JSON.stringify(record));
  try {
    fs.linkSync(tmpPath, markerPath);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    removeTempBestEffort(tmpPath);
    return { published: false };
  }
  removeTempBestEffort(tmpPath);
  fsyncDirBestEffort(dir);
  return { published: true };
}

/** Read a marker published by `publishMarkerOnce`. A `finally` marker is
 * evidence of a clean release, never death proof: callers must never treat
 * an ABSENT marker as "still alive" or "definitely dead" -- absence proves
 * nothing either way. */
export function readMarker(markerPath) {
  return parseJsonFile(markerPath);
}

// --- Per-Run control epoch/token fencing ----------------------------------

export function controlDirs(runDir) {
  const base = path.join(runDir, 'control');
  return { generationsDir: path.join(base, 'generations'), releasesDir: path.join(base, 'releases') };
}

function releaseMarkerPath(releasesDir, epoch) {
  return path.join(releasesDir, `${generationFileName(epoch)}.release`);
}

/**
 * Acquire per-Run control: a monotonic `controlEpoch` plus a unique
 * `controlToken`, fencing successive controller acquisitions of the same
 * Run (AD-02, AD-10). No async adapter call may run inside this function --
 * it is synchronous, fs-only, and returns before any I/O the caller does
 * with the acquired token.
 *
 * `holder` is `{ id, pid }`. `expectedControlEpoch`, when supplied, fences a
 * caller that read a stale epoch: if the Run's committed current epoch does
 * not match, this refuses with `status: 'stale'` without attempting
 * anything. `ttlMs` only gates whether a contender bothers to probe the
 * current holder's process liveness at all (an efficiency guard against
 * probing a healthy holder on every contention) -- omitting it means every
 * call probes. The actual reclaim decision is always PID-dead proof: a live
 * `holder.pid` (per `isProcessAlive`) is HELD regardless of how stale the
 * recorded generation looks. A `finally` release marker is evidence of a
 * clean release; its absence never proves the holder crashed and is never
 * treated as such.
 *
 * Returns `{ status: 'acquired', controlEpoch, controlToken }`,
 * `{ status: 'held', controlEpoch, holder }`, or
 * `{ status: 'stale', controlEpoch }` (the ambient current epoch, which
 * disagreed with `expectedControlEpoch`).
 */
export function acquireRunControl(runDir, { holder, purpose, expectedControlEpoch, ttlMs, now = Date.now() } = {}) {
  const { generationsDir, releasesDir } = controlDirs(runDir);

  const result = publishNextGeneration(generationsDir, ({ current }) => {
    if (expectedControlEpoch !== undefined) {
      const currentEpoch = current?.epoch ?? null;
      if (currentEpoch !== expectedControlEpoch) {
        return { stop: true, status: 'stale', controlEpoch: currentEpoch };
      }
    }

    if (current) {
      if (current.record?.purpose === 'settled') {
        return { stop: true, status: 'settled', controlEpoch: current.epoch };
      }
      const released = readMarker(releaseMarkerPath(releasesDir, current.epoch)) !== null;
      if (!released) {
        const heartbeatFresh = typeof ttlMs === 'number' && now - current.record.acquiredAt <= ttlMs;
        if (heartbeatFresh) {
          return { stop: true, status: 'held', controlEpoch: current.epoch, holder: current.record.holder };
        }
        // Heartbeat expired (or no ttlMs given, meaning always attempt):
        // permitted to ATTEMPT reclaim. Only proven-dead identity actually
        // authorizes it (resolveHolderLiveness, H1) -- a live PID, or one
        // whose liveness cannot be disproven, remains HELD, full stop, no
        // matter how stale this generation looks.
        if (resolveHolderLiveness(current.record.holder) === 'held') {
          return { stop: true, status: 'held', controlEpoch: current.epoch, holder: current.record.holder };
        }
      }
    }

    return {
      record: {
        controlToken: crypto.randomUUID(),
        holder,
        purpose,
        acquiredAt: now,
      },
    };
  });

  if (!result.published) {
    return { status: result.status, controlEpoch: result.controlEpoch ?? null, holder: result.holder };
  }
  return { status: 'acquired', controlEpoch: result.epoch, controlToken: result.record.controlToken };
}

/**
 * Read-only: is this Run's current control generation still effectively
 * held? Same "released marker, then dead-holder proof" logic
 * `acquireRunControl`'s own reclaim decision applies, but with no write --
 * a caller that only needs to ASK, never to acquire (Phase 03 M1: deciding
 * whether admitting a brand-new attempt for an Assignment would spawn a
 * second worker racing an unsettled one), must never cause the side effect
 * of publishing a new generation into a DIFFERENT Run's own control ledger
 * just to peek at it.
 *
 * Returns `{held: false}` when there is no generation at all, or the
 * current one is released/its holder is provably dead (Phase 02 identity);
 * `{held: true, controlEpoch, holder}` otherwise -- alive, or liveness that
 * cannot be disproven, both read as "still held" (fail closed).
 */
export function inspectRunControl(runDir) {
  const { generationsDir, releasesDir } = controlDirs(runDir);
  const current = currentGeneration(generationsDir);
  if (!current) return { held: false };
  if (current.record?.purpose === 'settled') return { held: false, settled: true, controlEpoch: current.epoch };
  const released = readMarker(releaseMarkerPath(releasesDir, current.epoch)) !== null;
  if (released) return { held: false, controlEpoch: current.epoch };
  if (resolveHolderLiveness(current.record.holder) === 'dead') return { held: false, controlEpoch: current.epoch };
  return { held: true, controlEpoch: current.epoch, holder: current.record.holder };
}

/**
 * Commit authoritative settlement for a Run under its control ledger.
 *
 * Atomic CAS:
 * - Checks that { controlEpoch, controlToken } is the current generation in generationsDir.
 * - Publishes the next generation with purpose: 'settled', fencing any future controller.
 * - If current generation does not match or a newer controller has taken over, returns
 *   { status: 'superseded', controlEpoch: current?.epoch }.
 * - If already settled, returns { status: 'already-settled', controlEpoch: current?.epoch }.
 */
export function settleRunControl(runDir, { controlEpoch, controlToken, now = Date.now() } = {}) {
  const { generationsDir } = controlDirs(runDir);
  const result = publishNextGeneration(generationsDir, ({ current, nextEpoch }) => {
    if (!current || current.epoch !== controlEpoch || current.record.controlToken !== controlToken) {
      return { stop: true, status: 'superseded', controlEpoch: current?.epoch ?? null };
    }
    if (current.record.purpose === 'settled') {
      return { stop: true, status: 'already-settled', controlEpoch: current.epoch };
    }
    return {
      record: {
        controlToken,
        purpose: 'settled',
        settledEpoch: controlEpoch,
        acquiredAt: now,
      },
    };
  });

  if (!result.published) {
    return { status: result.status, controlEpoch: result.controlEpoch ?? null };
  }
  return { status: 'settled', controlEpoch: result.epoch };
}

/**
 * Release a held control token. Idempotent: releasing an already-released
 * epoch/token is a no-op, never an error, so a `finally` block can always
 * call this safely. `status: 'token-mismatch'`/`'unknown-generation'` means
 * this caller no longer names the generation it thinks it holds (e.g. it
 * was already superseded after PID-dead reclaim) -- never throws, so a
 * cleanup path is never blocked by its own staleness.
 */
export function releaseRunControl(runDir, { controlEpoch, controlToken, now = Date.now() } = {}) {
  const { generationsDir, releasesDir } = controlDirs(runDir);
  const record = parseJsonFile(path.join(generationsDir, generationFileName(controlEpoch)));
  if (record === null) return { status: 'unknown-generation' };
  if (record.controlToken !== controlToken) return { status: 'token-mismatch' };

  const outcome = publishMarkerOnce(releaseMarkerPath(releasesDir, controlEpoch), {
    controlEpoch,
    controlToken,
    releasedAt: now,
  });
  return { status: outcome.published ? 'released' : 'already-released' };
}

/**
 * Whether `{controlEpoch, controlToken}` is still the Run's current
 * control generation right now. Used to detect that an async adapter call
 * has outlived its logical control token: a caller starts an adapter I/O
 * under a token, and before committing that I/O's effect/result, calls this
 * to confirm nothing superseded it in the meantime. This function itself
 * never blocks or cancels anything -- it only answers the question; the
 * caller decides what to do with a `false` answer (typically: refuse to
 * commit, same as a stale-control-token settlement refusal).
 */
export function isRunControlCurrent(runDir, { controlEpoch, controlToken }) {
  const { generationsDir } = controlDirs(runDir);
  const current = currentGeneration(generationsDir);
  if (!current) return false;
  return current.epoch === controlEpoch && current.record.controlToken === controlToken;
}
