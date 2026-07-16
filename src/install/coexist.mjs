// src/install/coexist.mjs — read-only harness-marker detection + territory
// manifest, so `fgos init` can coexist with other agent harnesses already
// present in the same project (docs/history/install-coexistence/CONTEXT.md
// D2/D4/D6).
//
// READ-ONLY ABSOLUTE (D4): every function here only ever calls `existsSync`
// or `readFileSync` against another harness's paths — never a write, never a
// rename, never a delete. Detection failing (unreadable AGENTS.md, odd
// permissions) is recorded as data, not thrown — `writeCoexistenceManifest`
// never lets a detection problem fail `fgos init` (fail-safe, D4).
//
// NHƯỜNG-NHỊN (D4/D6): a detected harness is only ever recognized, never
// touched — `fgos init` does not create or edit a host `AGENTS.md` (D6), and
// this module has no write path onto any of the marker locations below.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Data-driven marker set (D4: "tập khởi đầu, mở rộng được" — start narrow,
// extend by adding rows here, never by branching new detection logic).
const DIR_MARKERS = [
  { name: 'bee', dir: '.bee' },
  { name: 'claude', dir: '.claude' },
  { name: 'codex', dir: '.codex' },
  { name: 'cursor', dir: '.cursor' },
];

// bee's own AGENTS.md managed-block convention (onboard_bee.mjs MARKER_START).
const AGENTS_MD_MARKER = { name: 'bee', label: '<!-- BEE:START -->' };

function detectDirMarkers(rootDir) {
  const found = [];
  for (const { name, dir } of DIR_MARKERS) {
    if (fs.existsSync(path.join(rootDir, dir))) {
      found.push({ name, markers: [dir] });
    }
  }
  return found;
}

// Absent AGENTS.md is skipped per D6 (fgos never creates one, so "no file"
// is simply "nothing to detect" — not an error). An existing-but-unreadable
// AGENTS.md is recorded as `agentsMdReadError` for the manifest rather than
// thrown, so a permissions quirk on a host file can never fail `fgos init`.
function detectAgentsMdMarker(rootDir) {
  const agentsPath = path.join(rootDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    return { hit: null, readError: null };
  }
  try {
    const content = fs.readFileSync(agentsPath, 'utf8');
    const hit = content.includes(AGENTS_MD_MARKER.label)
      ? { name: AGENTS_MD_MARKER.name, markers: [AGENTS_MD_MARKER.label] }
      : null;
    return { hit, readError: null };
  } catch (err) {
    return { hit: null, readError: err.message };
  }
}

/**
 * Read-only scan of `rootDir` for other agent-harness markers. Returns
 * `{ detected_harnesses, agentsMdReadError }` — `detected_harnesses` is a
 * de-duplicated-by-name array (a directory marker and an AGENTS.md block for
 * the same harness collapse into one entry with both markers listed).
 */
export function detectHarnesses(rootDir) {
  const byName = new Map();
  for (const hit of detectDirMarkers(rootDir)) {
    byName.set(hit.name, { name: hit.name, markers: [...hit.markers] });
  }

  const { hit: agentsHit, readError } = detectAgentsMdMarker(rootDir);
  if (agentsHit) {
    const existing = byName.get(agentsHit.name);
    if (existing) {
      existing.markers.push(...agentsHit.markers);
    } else {
      byName.set(agentsHit.name, { name: agentsHit.name, markers: [...agentsHit.markers] });
    }
  }

  return { detected_harnesses: [...byName.values()], agentsMdReadError: readError };
}

/**
 * Build the `.fgos/coexistence.json` manifest for `rootDir` (D2: fgos's own
 * territory, machine-readable, for another harness to check). `territory`
 * is descriptive, not derived from `rootDir` — the manifest documents what
 * `fgos.mjs`/`worktree.mjs` already do (dataDir cwd-relative, worktrees under
 * the OS tmpdir), it does not compute a new path convention.
 */
export function buildManifest(rootDir) {
  const { detected_harnesses, agentsMdReadError } = detectHarnesses(rootDir);
  return {
    v: 1,
    territory: {
      data: '.fgos/',
      worktrees: {
        descriptor: '<tmpdir>/fgos-worktrees',
        resolved: path.join(os.tmpdir(), 'fgos-worktrees'),
      },
      branches: 'fgw/*',
    },
    detected_harnesses,
    ...(agentsMdReadError ? { agentsMdReadError } : {}),
  };
}

/**
 * Build and write `<dataDir>/coexistence.json` for the project at `rootDir`.
 * Returns the manifest that was written so the caller (fgos.mjs `init`) can
 * report detected harnesses without re-reading the file. Callers are
 * responsible for the fail-safe wrapping (D4: detection must never fail
 * `fgos init`) — this function itself still throws on a genuine write
 * failure (e.g. `dataDir` unwritable), same as any other write in this repo.
 */
export function writeCoexistenceManifest(rootDir, dataDir) {
  const manifest = buildManifest(rootDir);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'coexistence.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}
