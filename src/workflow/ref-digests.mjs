// src/workflow/ref-digests.mjs — what the shared context documents of a --seats run looked like when it started.
// Seats read a plain-path ref themselves, live, while they run, so this is a digest at start: it shows
// whether a document changed between the start and a later look. It is not proof of what a seat read.
// Refs that name another run's result (`unit-run:`, `gate-answer:`) are skipped here: a unit run's report is
// written once, and a gate answer is kept as one file per round that is never rewritten (see case-inbox.mjs).
//
// The second half digests a milestone's subject: a declared set of artifacts, never a branch.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveUnitInputs } from '../runner/execution/handoff-refs.mjs';

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

const sha256 = (data) => `sha256:${crypto.createHash('sha256').update(data).digest('hex')}`;

function walkFiles(abs, rel, out) {
  let stat;
  try {
    stat = fs.lstatSync(abs);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  if (stat.isDirectory()) {
    if (rel === '.fgos' || rel.endsWith('/.fgos')) return;
    for (const name of fs.readdirSync(abs).sort()) walkFiles(path.join(abs, name), rel === '' ? name : `${rel}/${name}`, out);
  } else if (stat.isFile()) {
    out.push(rel);
  }
}

/**
 * Digest of one milestone subject, or null when it cannot be known (a milestone then fails closed, only that one).
 *
 * - `{ files: [path] }`: every named file must exist; the digest covers each path and its bytes.
 * - `{ tree: [path] }`: the files under each path (a path with nothing under it counts as empty, so a
 *   file that appears later changes the digest); `.fgos` is never part of a subject.
 * - `{ named: string, value }`: an external subject the caller names, digested by its JSON form.
 *
 * @returns {string | null} `sha256:<hex>`
 */
export function digestSubject(subject, root) {
  try {
    if (subject && typeof subject.named === 'string') {
      return sha256(JSON.stringify([subject.named, subject.value ?? null]));
    }
    const entries = [];
    if (Array.isArray(subject?.files)) {
      for (const file of [...subject.files].sort()) {
        const abs = path.resolve(root, file);
        if (!fs.statSync(abs).isFile()) return null;
        entries.push([file, crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')]);
      }
      return sha256(JSON.stringify(entries));
    }
    if (Array.isArray(subject?.tree)) {
      for (const entry of [...subject.tree].sort()) {
        const found = [];
        walkFiles(path.resolve(root, entry), entry.replace(/\/+$/, ''), found);
        for (const rel of found) entries.push([rel, crypto.createHash('sha256').update(fs.readFileSync(path.resolve(root, rel))).digest('hex')]);
        if (found.length === 0) entries.push([entry, null]);
      }
      return sha256(JSON.stringify(entries));
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Digest of what Unit runs reported: the bytes of the report file of every named role, read through the
 * one hand-off resolver. A report that cannot be resolved makes the digest unknown (null).
 *
 * @param {Array<{ unitRunId: string, roles: string[] }>} units
 */
export function digestUnitRunReports(units, mainRoot) {
  try {
    const refs = [];
    for (const { unitRunId, roles } of [...units].sort((a, b) => a.unitRunId.localeCompare(b.unitRunId))) {
      for (const role of [...roles].sort()) refs.push(`unit-run:${unitRunId}/${role}`);
    }
    const { refs: files } = resolveUnitInputs(refs, mainRoot);
    return sha256(JSON.stringify(files.map((file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'))));
  } catch {
    return null;
  }
}

/** Digest of a text (a request, an answer). */
export const digestText = (text) => sha256(String(text ?? ''));
