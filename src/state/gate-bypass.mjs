// gate-bypass.mjs — decides whether a skill-embedded confirmation gate
// (fgos-exploring's "Approve CONTEXT.md?", fgos-planning's "Approve work
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
import { HEAVY_KEYWORDS } from '../intake/risk-keywords.mjs';

/** Level order, weakest to strongest. 'off' auto-approves nothing. */
export const LEVELS = Object.freeze(['off', ...TIERS]);

export const DEFAULT_LEVEL = 'off';

const CONFIG_FILE_NAME = 'gate-bypass.json';

/**
 * Read the configured bypass level from `<dir>/gate-bypass.json`. Fails
 * closed to `DEFAULT_LEVEL` on a missing file, invalid JSON, or a shape/value
 * that isn't a recognized level — never throws, per D2/D4's "never fails
 * open" requirement.
 */
export function readGateBypassLevel(dir) {
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
  const haystack = `${item?.title ?? ''}\n${item?.description ?? ''}`.toLowerCase();
  const hardGateHit = HEAVY_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
  if (hardGateHit) return false;

  if (!isTierCovered(item?.tier, level)) return false;
  if (hasOpenItems(artifactText)) return false;
  return true;
}
