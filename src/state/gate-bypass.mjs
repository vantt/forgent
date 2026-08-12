// gate-bypass.mjs — decides whether a skill-embedded confirmation gate
// (fgos-coding-exploring's "Approve CONTEXT.md?", fgos-coding-planning's "Approve work
// shape?") can be auto-approved instead of asked (docs/history/gate-bypass/
// CONTEXT.md D1-D5). Never touches the `awaiting-human` park (D1) — that
// stays a separate, untouched mechanism.
//
// Two axes must both hold, plus an absolute floor:
//   - D2: the artifact has zero open items (mechanical, not a confidence read)
//   - D5: the item's `tier` is covered by the configured level
//   - D4: a hard-gate risk-keyword hit always overrides both axes to false
//
// Every read here fails closed to the safest answer (level 'off', not
// covered, has open items) — a missing or malformed `.fgos/gate-bypass.json`
// must never silently open a gate that would otherwise ask.

import fs from 'node:fs';
import path from 'node:path';
import { TIERS } from './work.mjs';
import { HEAVY_KEYWORDS, matchesKeyword } from '../intake/risk-keywords.mjs';
import { readSharedConfig } from '../config/shared-config-file.mjs';

/** Level order, weakest to strongest. 'off' auto-approves nothing. */
export const LEVELS = Object.freeze(['off', ...TIERS]);

export const DEFAULT_LEVEL = 'off';

const CONFIG_FILE_NAME = 'gate-bypass.json';

/**
 * Read the configured bypass level. `dir` is the `.fgos` directory (every
 * existing caller already resolves this before calling — bin/fgos.mjs's
 * `gate-bypass` verb, both skill-embedded gate checks in fgos-coding-exploring/
 * fgos-coding-planning).
 *
 * Tries the shared config file first (`config.gateBypass.level`,
 * docs/history/doctor-fix-gate-bypass/CONTEXT.md D1/D3 — gate-bypass's real
 * registry entry, `registrations.mjs`); `readSharedConfig` takes the repo
 * root (`.fgos`'s parent), not `.fgos` itself, so that's resolved here via
 * `path.dirname(dir)`. Falls back to the legacy standalone
 * `<dir>/gate-bypass.json` (never deleted, a "read the old file until a real
 * migration writes the new one" discipline) when the shared file has no
 * valid `gateBypass` entry yet.
 *
 * Fails closed to `DEFAULT_LEVEL` on a missing file, invalid JSON, or a
 * shape/value that isn't a recognized level, at either layer — never
 * throws, per D2/D4's "never fails open" requirement.
 */
export function readGateBypassLevel(dir) {
  let shared;
  try {
    shared = readSharedConfig(path.dirname(dir));
  } catch {
    shared = undefined;
  }
  const sharedLevel = shared?.gateBypass?.level;
  if (typeof sharedLevel === 'string' && LEVELS.includes(sharedLevel)) {
    return sharedLevel;
  }
  return readLegacyStandaloneLevel(dir);
}

/**
 * Legacy standalone `<dir>/gate-bypass.json` read (pre-D1 shape, D2 of this
 * item's own CONTEXT.md) — byte-identical logic to what `readGateBypassLevel`
 * used to be before the shared-file read was added above.
 */
function readLegacyStandaloneLevel(dir) {
  const filePath = path.join(dir, CONFIG_FILE_NAME);
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return DEFAULT_LEVEL;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_LEVEL;
  }

  if (!parsed || typeof parsed.level !== 'string' || !LEVELS.includes(parsed.level)) {
    return DEFAULT_LEVEL;
  }
  return parsed.level;
}

/**
 * Does `level` cover `tier`? `off` covers nothing. Any other level covers
 * its own tier and every lighter one (D5's reuse of `TIERS`' own order).
 * An unrecognized tier or level is never covered (fail closed).
 */
export function isTierCovered(tier, level) {
  const tierRank = TIERS.indexOf(tier);
  const levelRank = LEVELS.indexOf(level);
  if (tierRank === -1 || levelRank === -1 || level === 'off') return false;
  return tierRank < levelRank;
}

/**
 * D2's mechanical completeness check on a gated artifact's raw text
 * (CONTEXT.md or plan.md content). True means "not clear enough to skip the
 * gate" — the safe default. Flags on either:
 *   - a stray `TODO`/`FIXME` marker anywhere in the text, or
 *   - a missing `## Outstanding questions` section, or one whose body isn't
 *     exactly "None" (case-insensitive) — the convention this item's own
 *     CONTEXT.md/plan.md already follow.
 * A missing section fails closed to "has open items" rather than assuming
 * the artifact just doesn't use the convention.
 */
export function hasOpenItems(artifactText) {
  const text = typeof artifactText === 'string' ? artifactText : '';
  if (/\b(TODO|FIXME)\b/i.test(text)) return true;

  const match = text.match(/^##\s*Outstanding questions\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/im);
  if (!match) return true;

  const body = match[1].trim();
  if (!body) return true;
  return !/^none\b/i.test(body);
}

/**
 * Combine all three checks (D5's two axes plus D4's floor) into the single
 * yes/no a Gate step needs. `item` is the work item (title/description/tier
 * read from it); `artifactText` is the gated artifact's raw content;
 * `level` is the value `readGateBypassLevel` returned.
 */
export function canAutoApprove(item, artifactText, level) {
  const haystack = `${item?.title ?? ''}\n${item?.description ?? ''}`;
  const hardGateHit = HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword));
  if (hardGateHit) return false;

  if (!isTierCovered(item?.tier, level)) return false;
  if (hasOpenItems(artifactText)) return false;
  return true;
}

/**
 * D6's bypass axis for `fgos-coding-validating`'s `validateApprove` gate
 * (`docs/history/gate-bypass/CONTEXT.md` D6). Reuses `canAutoApprove`'s
 * first two checks verbatim (D4's hard-gate floor, D5's tier-coverage
 * axis) and swaps the third axis: instead of `hasOpenItems` scanning an
 * artifact's text, this reads `fgos-coding-validating`'s own already-computed
 * reality-gate verdict directly. `verdict` is self-reported by the skill
 * that just computed it, per D6 — a `READY WITH CONSTRAINTS`/`NOT READY`
 * verdict is treated the same as "has open items": never skippable.
 */
export function canAutoApproveValidate(item, verdict, level) {
  const haystack = `${item?.title ?? ''}\n${item?.description ?? ''}`;
  const hardGateHit = HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword));
  if (hardGateHit) return false;

  if (!isTierCovered(item?.tier, level)) return false;
  if (verdict !== 'READY') return false;
  return true;
}
