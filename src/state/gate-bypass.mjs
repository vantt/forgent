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
//
// tsk-224 (docs/history/coding-planning-validating-gate-redesign/CONTEXT.md)
// adds `canAutoApproveMergedGate` at the bottom of this file, for the single
// gate that replaced `planApprove` + `validateApprove`. It supersedes the
// `canAutoApproveValidate` export that used to live here, and relaxes D2's
// "never a self-reported read" clause — but only because every check in it
// is monotone toward asking (D9), so a session's own judgment can raise the
// bar and never lower it. `canAutoApprove` itself is unchanged; its only
// remaining caller is fgos-coding-exploring's `contextApprove`.

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
 *   - a real `TODO`/`FIXME` marker — the word immediately followed
 *     (optionally after whitespace) by `:` or `(`, the shape an actual code
 *     marker is written in (`TODO:`, `FIXME:`, `TODO(name):`) — or
 *   - a missing `## Outstanding questions` section, or one whose body isn't
 *     exactly "None" (case-insensitive) — the convention this item's own
 *     CONTEXT.md/plan.md already follow.
 * A missing section fails closed to "has open items" rather than assuming
 * the artifact just doesn't use the convention.
 *
 * The colon/paren requirement exists because a bare `\b(TODO|FIXME)\b`
 * match fires on prose that legitimately discusses fgOS's own `todo`
 * status literal or an enum like `WorkTab::Todo`, without ever getting
 * closer to a genuine unfinished marker. Requiring the code-marker shape
 * resolves that class of false positive while still catching a real one.
 */
export function hasOpenItems(artifactText) {
  const text = typeof artifactText === 'string' ? artifactText : '';
  if (/\b(TODO|FIXME)\s*[:(]/i.test(text)) return true;

  const match = text.match(/^##\s*Outstanding questions\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/im);
  if (!match) return true;

  const body = match[1].trim();
  if (!body) return true;
  return !/^none\b/i.test(body);
}

function stripCitations(text) {
  if (typeof text !== 'string') return '';
  // Backtick-quoted spans (code spans, quoted paths/filenames).
  let out = text.replace(/`[^`]*`/g, ' ');
  // Bare filename-shaped tokens, e.g. AUDIT.md, gate-bypass.mjs.
  out = out.replace(/\b[\w-]+\.(md|mjs|js|cjs|ts|json|yml|yaml|txt)\b/gi, ' ');
  return out;
}

/**
 * Combine all three checks (D5's two axes plus D4's floor) into the single
 * yes/no a Gate step needs. `item` is the work item (title/description/tier
 * read from it); `artifactText` is the gated artifact's raw content;
 * `level` is the value `readGateBypassLevel` returned.
 */
export function canAutoApprove(item, artifactText, level) {
  const haystack = stripCitations(`${item?.title ?? ''}\n${item?.description ?? ''}`);

  // Known, permanent limitations of the mechanical floor:
  // - A title/description that merely mentions a hard-gate word as a topic
  //   (not describing an actual risky change) still hard-gates — accepted,
  //   because the failure mode is asking a human unnecessarily (friction),
  //   never silently skipping a real risk (the floor's own fail-safe direction).
  // - Negated prose ("no auth/audit risk applies here") still hard-gates —
  //   accepted, because teaching the floor to parse negation would turn it
  //   from mechanical/lexical into an interpretive read, exactly what its own
  //   design principle (docs/explanation/gate-bypass-design.md) exists to prevent.
  const hardGateHit = HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword));
  if (hardGateHit) return false;

  if (!isTierCovered(item?.tier, level)) return false;
  if (hasOpenItems(artifactText)) return false;
  return true;
}

/**
 * The cost verdict a session supplies to the merged gate below
 * (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D4,
 * D5). Deliberately two-valued: the gate only ever needs to know whether
 * being wrong here is cheap to undo, not how expensive it would be.
 * Anything that is not exactly `REVERSIBLE` asks, so an unrecognized or
 * missing verdict fails closed like every other read in this file.
 */
export const COST_REVERSIBLE = 'REVERSIBLE';

/**
 * Build the hard-gate floor's haystack (D10).
 *
 * The source is the item's own submit text UNION the *structured* fields
 * the plan carries — footprint paths and each child spec's title/verify/
 * action — and deliberately NOT `plan.md`'s narrative prose.
 *
 * That exclusion is measured, not stylistic (plan.md's assumption A1):
 * scanning narrative prose would trip this floor on 266 of the 318 real
 * `docs/history/*&#47;plan.md` files in this repo (83.6%), driven by `audit`
 * (242), `auth` (217), and `security` (210) — words that are this
 * project's everyday vocabulary rather than a signal that anything is
 * irreversible. A floor that fires on five plans out of six has stopped
 * discriminating. Structured fields carry the same added coverage D10
 * wanted (a bland submit text whose plan touches `src/**&#47;migration.mjs`)
 * without inheriting that vocabulary problem.
 */
function mergedGateHaystack(item, childSpecs) {
  const parts = [
    stripCitations(item?.title ?? ''),
    stripCitations(item?.description ?? ''),
  ];

  for (const p of Array.isArray(item?.footprint) ? item.footprint : []) {
    if (typeof p === 'string') parts.push(p);
  }

  for (const child of Array.isArray(childSpecs) ? childSpecs : []) {
    if (!child || typeof child !== 'object') continue;
    for (const field of ['title', 'verify', 'action']) {
      if (typeof child[field] === 'string') parts.push(child[field]);
    }
    for (const p of Array.isArray(child.footprint) ? child.footprint : []) {
      if (typeof p === 'string') parts.push(p);
    }
  }

  return parts.join('\n');
}

/**
 * The single merged gate that replaces `planApprove` + `validateApprove`
 * (`docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` D1),
 * sitting at `fgos-coding-validating` immediately before materialize (D7).
 * Supersedes the `canAutoApproveValidate` this export replaced, which
 * carried `docs/history/gate-bypass/CONTEXT.md` D6's verdict axis.
 *
 * Four checks, and — the load-bearing property (D9) — every one of them
 * can only push toward ASKING, never toward silence. That monotone
 * direction is what makes the self-reported `costVerdict` axis safe where
 * `gate-bypass` D2 refused one: a session's own judgment can escalate to
 * "ask", but it can never talk the mechanical floor below down.
 *
 *   1. D10 — hard-gate floor over the widened structured haystack above.
 *   2. D11 — tier ceiling. Note this axis measures *delegation appetite*
 *      ("how heavy a piece has the person authorized the machine to run
 *      alone"), NOT risk; size and reversibility are different things, and
 *      conflating them is exactly what D10/D11 separated.
 *   3. D8 — `gate-bypass` D2's surviving mechanical-completeness half,
 *      read fresh off `plan.md` at gate time.
 *   4. D3/D4/D5 — the session's own cost verdict.
 *
 * `canAutoApprove` above is deliberately left untouched: after D1 its only
 * remaining caller is `fgos-coding-exploring`'s `contextApprove`, which D2
 * of the same CONTEXT.md keeps exactly as it is.
 */
export function canAutoApproveMergedGate(item, planText, childSpecs, costVerdict, level) {
  const haystack = mergedGateHaystack(item, childSpecs);
  const hardGateHit = HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword));
  if (hardGateHit) return false;

  if (!isTierCovered(item?.tier, level)) return false;
  if (hasOpenItems(planText)) return false;
  if (costVerdict !== COST_REVERSIBLE) return false;
  return true;
}
