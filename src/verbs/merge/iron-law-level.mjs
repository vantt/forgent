// iron-law-level.mjs — the `ironLaw.level` (ask/warn) read + the `warn`-level
// skip record, shared by every merge-cluster verb that gates on the Iron Law
// (docs/history/iron-law-gate-human-ux/CONTEXT.md D3/D7/D8).
//
// Lives at the use-case tier (not `runner/iron-law-gate.mjs`, which is infra)
// because it reads `IRON_LAW_LEVELS`/`DEFAULT_IRON_LAW_LEVEL` from
// `src/setup/registrations.mjs`, itself use-case tier — an infra file
// importing a use-case file would invert the layer this whole boundary
// refactor exists to keep one-directional (docs/architecture-manifest.json).
import { readSharedConfigOrEmpty } from '../../config/shared-config-file.mjs';
import { IRON_LAW_LEVELS, DEFAULT_IRON_LAW_LEVEL } from '../../setup/registrations.mjs';
import { addDecision } from '../../state/store.mjs';

// Anything that is not exactly the opt-in literal reads as `ask` — a missing
// key, a malformed file, a typo'd value. That is the same fail-closed shape
// `--acknowledge-iron-law` already uses for its own bare-boolean check
// (review-20260718-self-improve-loop f02), and it matters more here: the
// permissive level is the one that lets a self-modifying diff land unreviewed.
export function readIronLawLevel(repoRoot) {
  const level = readSharedConfigOrEmpty(repoRoot)?.ironLaw?.level;
  return IRON_LAW_LEVELS.includes(level) ? level : DEFAULT_IRON_LAW_LEVEL;
}

// The `warn`-level skip record (CONTEXT.md D8). Written through `addDecision`
// directly rather than by shelling out to `fgos decision`, which has no
// `--kind` flag (src/cli/command-registry.mjs) and would fall back to
// addDecision's own `kind: 'design'` default — labelling a machine's gate skip
// as human design reflection, which is what the retrospective content gate
// reads to decide an item may reach `done`.
//
// Called BEFORE the merge it permits, never after: the log records "the gate
// was skipped", not "the merge succeeded", so a merge that then fails leaves
// this record standing correctly.
export function recordIronLawSkip(dir, { verb, id, ironLaw }) {
  return addDecision(dir, {
    text: `${verb}: Iron Law skipped for "${id}" at level warn — matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]`,
    rationale: `ironLaw.level = "warn" in .fgos/config.json — the gate warns and records instead of refusing (D3/D8)`,
    id,
    kind: 'engine',
  });
}

// The explicit-acknowledge record — the sibling `recordIronLawSkip` above
// was missing: written when a caller passed `--acknowledge-iron-law` on an
// item that actually tripped the gate, so a later audit can tell "never
// tripped" apart from "tripped, human acknowledged" instead of seeing a
// silence in both cases (tsk-sdr). `text` says "acknowledged", never
// "skipped" — the existing test grep (`/iron law/i`, no "skip" anchor)
// would otherwise conflate this record with a warn-level skip.
export function recordIronLawAcknowledge(dir, { verb, id, ironLaw }) {
  return addDecision(dir, {
    text: `${verb}: Iron Law acknowledged for "${id}" via --acknowledge-iron-law — matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}]`,
    rationale: '--acknowledge-iron-law was passed and the gate required proof — the caller explicitly confirmed failing-test-first proof instead of the gate refusing or the warn-level auto-skip firing',
    id,
    kind: 'engine',
  });
}
