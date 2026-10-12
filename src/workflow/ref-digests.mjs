// src/workflow/ref-digests.mjs — what the shared context documents of a --seats run looked like when it started.
// Seats read a plain-path ref themselves, live, while they run, so this is a digest at start: it shows
// whether a document changed between the start and a later look. It is not proof of what a seat read.
// Refs that name another run's result (`unit-run:`, `gate-answer:`) are already immutable and are skipped.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const RUN_REF = /^(unit-run:|gate-answer:)/;

/**
 * @param {string[]} refs the run's shared context refs
 * @param {string} root directory plain-path refs are read against
 * @returns {Array<{ ref: string, sha256: string, bytes: number } | { ref: string, unreadable: true }>}
 */
export function digestContextRefs(refs, root) {
  const digests = [];
  for (const ref of refs) {
    if (RUN_REF.test(ref)) continue;
    try {
      const bytes = fs.readFileSync(path.resolve(root, ref));
      digests.push({ ref, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
    } catch {
      digests.push({ ref, unreadable: true });
    }
  }
  return digests;
}

/**
 * The short statement a start prints about the seats it pinned, so the owner sees what will run
 * before the first seat spends anything.
 *
 * @param {{ personas?: Array<{ seat: string, name: string, tier: string, source: string }>, refDigests?: object[] } | null | undefined} seats
 */
export function seatsEcho(seats) {
  if (!seats) return undefined;
  const refs = seats.refDigests ?? [];
  return {
    personas: (seats.personas ?? []).map(({ seat, name, tier, source }) => ({ seat, name, tier, source })),
    refs: {
      count: refs.length,
      totalBytes: refs.reduce((sum, item) => sum + (item.bytes ?? 0), 0),
      unreadable: refs.filter((item) => item.unreadable).map((item) => item.ref),
    },
    note: 'refs are digested at start; seats read them live while they run, so a later edit still reaches a seat',
  };
}
