// retrospective-doors.mjs — tsk-1lv-5 (CONTEXT.md D7/D9/D11): the 4-door
// check (freshness/impact/routing/doc-deferral) bee v2.7.0 runs at
// feature-close time, ported to run inside fgOS's own existing
// `retrospective` batch sweep (`bin/fgos.mjs`'s `retrospective` case) --
// never a new call site, never gating `fgos approve` (D7: "approve KHÔNG
// bị gate"). Harness-only: no skill prose reads or writes this module.
//
// D11: every door applies to every item swept through `retrospective`,
// regardless of risk tier -- doc-rot does not distinguish tier, and every
// check here is mechanical (no ceremony to scale down).
//
// Advisory, not blocking (mirrors D10's "raw capture ghi ngay, narrative
// synthesis trễ có giới hạn + có phát hiện được" posture): a finding is
// recorded via `addFriction` by the caller so it is queryable
// (`fgos check <id>`), never a reason to hold the item out of
// `retrospective` -- Ưu tiên #2 ("Release con người") already establishes
// that one hung question must never block other independent progress, and
// `cleanup`'s own existing gate (`assessCleanupReadiness`) is the real
// blocking checkpoint further down this same item's lifecycle.

import fs from 'node:fs';
import path from 'node:path';
import { collectWideSourceFiles, findWideCitationFindings, isDLocalId } from '../../scripts/check-decision-citation-drift.mjs';

const D_ID_PATTERN = /\bD\d+\b/g;
const D_ID_TEXT_PREFIX_PATTERN = /^(D\d+):/;
// No `\b` around the Vietnamese phrases: JS regex word-boundary tests only
// recognize ASCII `[A-Za-z0-9_]` as "word" characters, so a boundary right
// before a diacritic like "để"'s leading "đ" never actually matches (both
// sides read as non-word) -- confirmed by direct test, not assumed.
const DEFERRAL_PATTERN = /để sau|sẽ làm sau|\b(?:to do later|TODO|for later|deferred to)\b/i;
const TRACKING_REF_PATTERN = /\b(tsk-[a-z0-9]+|STR\d+|ADR\d{4})\b/i;
// tsk-1lv review-fix F7: `refs` (command-registry.mjs: "Comma-separated
// list of reference ids/links") holds a mix of real file paths AND bare
// work-item/tracking ids -- checkFreshnessDoor used to run
// `fs.existsSync` against every entry unconditionally, so any tsk-*/STR*/
// ADR-shaped id (never a path on disk) reported a false dangling-source
// finding on every sweep (measured against the live log: 15 of 100
// distinct refs values across the repo). A whole-string match (not
// TRACKING_REF_PATTERN's `\b...\b` substring test above, which would also
// wrongly skip a real path that happens to CONTAIN an id-shaped segment)
// is the correct test here: an id reference never needs a freshness
// check at all, a path does.
const ID_LIKE_REF_PATTERN = /^(tsk-[a-z0-9-]+|STR\d+|ADR\d{4}|D-ADR\d{4})$/i;

function docsRefDir(item) {
  return typeof item.docsRef === 'string' && item.docsRef.trim() ? item.docsRef.replace(/\/+$/, '') : null;
}

/**
 * Freshness door (bee's "dangling_source"/"dangling_required_context"):
 * does every path this item's own `refs`/`docsRef` names still exist on
 * disk? A path that no longer exists is a source the item's own record
 * still points at that has since vanished.
 */
export function checkFreshnessDoor(item, repoRoot) {
  const findings = [];
  const candidatePaths = [];
  const docsRef = docsRefDir(item);
  if (docsRef) candidatePaths.push(docsRef);
  for (const ref of item.refs ?? []) {
    if (typeof ref !== 'string' || !ref.trim()) continue;
    const trimmed = ref.trim();
    if (ID_LIKE_REF_PATTERN.test(trimmed)) continue;
    candidatePaths.push(trimmed);
  }
  for (const p of candidatePaths) {
    if (!fs.existsSync(path.join(repoRoot, p))) {
      findings.push({
        door: 'freshness',
        path: p,
        message: `${p}: referenced by ${item.id} but no longer exists on disk (dangling source)`,
      });
    }
  }
  return findings;
}

/**
 * Impact door (bee's "còn doc nào vẫn cite một decision của chính feature
 * chưa reconcile"): for every ITEM-SCOPED decision (`d.id === item.id`)
 * THIS item itself logged with `--relation supersedes:<oldId>`
 * (tsk-1lv-1), re-run the same write-time widened citation sweep at close
 * time -- a dangling citation of the old id that surfaced (and may have
 * been left unreconciled) at write-time is a real, current impact-door
 * finding now.
 *
 * **Known gap (tsk-1lv review-fix F8, not fixed here):** a platform-level
 * `--scope` decision (no `--id`, e.g. every one of tsk-1lv-4's 34 ADR-
 * retirement writes) has no owning item, so it can never be caught by
 * ANY item's retrospective sweep -- this door is structurally item-scoped
 * and there is no natural item to hang a platform decision's close-time
 * check on. The write-time sweep (`bin/fgos.mjs`'s `decision` case, F3)
 * DOES correctly fire for `--scope` writes after the F3 fix -- that is
 * the real, working safety net for platform-level supersessions today;
 * this door only ever re-checks it for item-scoped ones. Building a
 * separate, item-independent sweep for `--scope` decisions (e.g. wired
 * into `decision-index --check` or `fgos doctor`, which already visit
 * every scope-carrying decision) is real follow-up work, not a small fix
 * -- out of this review round's scope.
 */
export function checkImpactDoor(item, decisions, repoRoot) {
  const findings = [];
  const ownSupersedes = (decisions ?? []).filter(
    (d) => d.id === item.id && typeof d.relation === 'string' && d.relation.startsWith('supersedes:'),
  );
  if (ownSupersedes.length === 0) return findings;
  const docsRef = docsRefDir(item);
  const sourceFiles = collectWideSourceFiles(repoRoot, { excludeRelDirs: docsRef ? [docsRef] : [] });
  for (const d of ownSupersedes) {
    const oldId = d.relation.slice('supersedes:'.length);
    let homeFile;
    if (isDLocalId(oldId)) {
      if (docsRef) {
        homeFile = path.posix.join(docsRef, 'CONTEXT.md');
      }
    }
    let effectiveSourceFiles = sourceFiles;
    if (homeFile && !effectiveSourceFiles.some((s) => s.file === homeFile)) {
      const absHome = path.join(repoRoot, homeFile);
      if (fs.existsSync(absHome)) {
        effectiveSourceFiles = [...effectiveSourceFiles, { file: homeFile, lines: fs.readFileSync(absHome, 'utf8').split('\n') }];
      }
    }
    for (const hit of findWideCitationFindings(effectiveSourceFiles, oldId, item.id, homeFile)) {
      findings.push({ door: 'impact', ...hit });
    }
  }
  return findings;
}

/**
 * Routing door (bee's "một D-ID đã khoá trong CONTEXT.md KHÔNG có citation
 * nào trong area-spec thật và cũng không có record cục bộ"): every D-ID
 * token appearing in this item's own CONTEXT.md "## Locked decisions"
 * table must have a matching `state.decisions` record scoped to this item
 * (`id === item.id`, `kind !== 'engine'`, text starting `"D<n>:"`) --
 * catches exactly STR72's own root cause (a decision locked in prose that
 * never made it into the machine-readable log fgos-coding-exploring's own
 * `fgos decision --id` call was supposed to fire for).
 */
export function checkRoutingDoor(item, decisions, repoRoot) {
  const findings = [];
  const docsRef = docsRefDir(item);
  if (!docsRef) return findings;
  let contextText;
  try {
    contextText = fs.readFileSync(path.join(repoRoot, docsRef, 'CONTEXT.md'), 'utf8');
  } catch {
    return findings;
  }
  const section = /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i.exec(contextText);
  const tableText = section ? section[1] : '';
  if (!tableText.trim()) return findings;

  const idsInTable = new Set();
  D_ID_PATTERN.lastIndex = 0;
  let match;
  while ((match = D_ID_PATTERN.exec(tableText)) !== null) idsInTable.add(match[0]);

  const loggedIds = new Set();
  for (const d of decisions ?? []) {
    if (d.id !== item.id || d.kind === 'engine') continue;
    const m = D_ID_TEXT_PREFIX_PATTERN.exec(d.text ?? '');
    if (m) loggedIds.add(m[1]);
  }

  for (const dId of idsInTable) {
    if (!loggedIds.has(dId)) {
      findings.push({
        door: 'routing',
        dId,
        message: `${dId} is locked in ${docsRef}/CONTEXT.md's table but has no matching state.decisions record for ${item.id} -- never routed into the machine-readable log`,
      });
    }
  }
  return findings;
}

/**
 * Doc-deferral door (bee's "prose kiểu 'để sau' không trỏ trigger nào"):
 * fgOS has no trigger registry (out of this item's own scope -- DISCUSSION
 * round 4's own note), so this is the honest, buildable half of the same
 * check: a line reading like deferred-to-later prose in one of this item's
 * own docs, with no tracked reference (`tsk-*`/`STR*`/`ADR*`) anywhere on
 * the same line, is a real finding -- deferred work with nothing anyone
 * can follow up on later.
 */
export function checkDocDeferralDoor(item, repoRoot) {
  const findings = [];
  const docsRef = docsRefDir(item);
  if (!docsRef) return findings;
  const dirAbs = path.join(repoRoot, docsRef);
  let entries;
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return findings;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(dirAbs, entry.name), 'utf8');
    content.split('\n').forEach((line, idx) => {
      if (DEFERRAL_PATTERN.test(line) && !TRACKING_REF_PATTERN.test(line)) {
        findings.push({
          door: 'doc-deferral',
          file: path.posix.join(docsRef, entry.name),
          line: idx + 1,
          message: `${path.posix.join(docsRef, entry.name)}:${idx + 1}: reads like deferred-to-later prose with no tracked reference (tsk-*/STR*/ADR*) nearby`,
        });
      }
    });
  }
  return findings;
}

/**
 * Run all four doors for one item being swept through `retrospective`.
 * Returns `{freshness, impact, routing, docDeferral}`, each an array
 * (possibly empty) -- the caller (`bin/fgos.mjs`'s `retrospective` case)
 * decides what to do with non-empty results (today: one `addFriction` per
 * non-empty door, advisory, never a block -- see this module's own header
 * comment for why).
 */
export function runFourDoorChecks(item, view, repoRoot) {
  const decisions = view.decisions ?? [];
  return {
    freshness: checkFreshnessDoor(item, repoRoot),
    impact: checkImpactDoor(item, decisions, repoRoot),
    routing: checkRoutingDoor(item, decisions, repoRoot),
    docDeferral: checkDocDeferralDoor(item, repoRoot),
  };
}
