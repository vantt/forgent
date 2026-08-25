// plan.mjs (renamed from decompose.mjs, tsk-403 D11/D15) — chia-việc
// engine for stage `planning` (per stage-decompose D2/D3/D4/D5 — `planning`
// is the renamed `decompose` stage; the verdict-kind vocabulary below
// ("decompose verdict", `logDecomposeVerdict`, etc.) stays unchanged, D11:
// it names an outcome, not a stage). Mirrors discovery.mjs's shape exactly
// one stage over.
//
// RETIRED (tsk-1x3 D1/D9/D16, docs/history/fanout-and-delegation-rubric/
// CONTEXT.md): this module used to spawn a nested `claude -p` judge
// (the retired `judgeDecompose`) whenever no caller-supplied verdict was
// given — the same "soul re-deriving what a live soul already knows"
// waste `tsk-1ni` found in judgeDiscovery. `resolvePlan` now requires an
// explicit `callerVerdict` from any interactive caller; only the
// tiny/small skip-and-advance trust signal and a mechanical no-op for the
// runner's own sweep (D16 — resolvePlan was NOT symmetric with
// resolveDiscovery here before this item) remain as alternatives.
//
// FAIL-SAFE, but a DIFFERENT shape from discovery.mjs's (chốt tại
// validating, S1 feasibility matrix): a caller-supplied verdict that fails
// validation — or a "decompose" verdict where any child is missing a real
// `verify` (D2 forbids a placeholder/FALLBACK_VERIFY for a child, unlike
// discovery's clarify-pass fallback) — resolves to `{ kind: 'invalid' }`
// and resolvePlan does NOT write anything: the item is left exactly at
// the same stage/status it was already at (`planning`, or the legacy
// `decompose` alias for an item that hadn't yet drained off it, todo).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { judgeVerifySemanticCorrectness } from './verify-pattern-check.mjs';
import { listWork, moveStage, moveWork, addWork, putInAwaiting, addDecision, editWork, StoreError } from '../state/store.mjs';
import { getDomain, resolveWorkflow, stageForStep } from '../state/workflow-stage-graphs.mjs';
import { rankImpact } from '../state/impact.mjs';
import { computeImpact, computePriority, effortForMode, MODE_EFFORT, isRecognizedRisk } from '../state/priority-formula.mjs';
import { footprintOverlapAmong } from '../state/graph-metrics.mjs';
import { branchNameFor, findCheckoutPath } from '../runner/worktree.mjs';

// Best-effort read of the locked-decisions artifacts fgos-coding-exploring/
// fgos-coding-planning write under `work.docsRef` (docs/history/<feature>/). A
// missing docsRef, or a missing/unreadable file under it, is never fatal.
//
// EXPORTED (tsk-ozl D2): discovery.mjs's resolveDiscovery reuses this same
// read as its clarify-stage trust signal — a non-empty result means a
// human already locked decisions into CONTEXT.md, so re-judging blind is
// both wasteful and can re-ask an already-answered question.
export function readLockedContext(repoRoot, docsRef) {
  if (typeof docsRef !== 'string' || !docsRef.trim()) return '';
  const featureDir = path.join(repoRoot, docsRef);
  const sections = [];
  for (const file of ['CONTEXT.md', 'plan.md']) {
    try {
      const content = fs.readFileSync(path.join(featureDir, file), 'utf8');
      if (content.trim()) sections.push(`## ${file}\n${content.trim()}`);
    } catch {
      // optional artifact; absence is not an error (item may still be
      // mid-clarify with no plan.md yet, or predate fgos-coding-exploring)
    }
  }
  return sections.join('\n\n');
}

// CONTENT-ROOT RESOLUTION (tsk-1ni D1): every caller of readLockedContext
// used to pass `stateRoot` (`path.dirname(dir)`, always the main checkout
// per ADR0020) as the content root too -- but fgos-coding-exploring/fgos-coding-planning
// commit CONTEXT.md/plan.md to the item's OWN fgw/<id> branch/worktree,
// never to main, so that always missed the real content in the standard
// interactive workflow (the exact scenario the trust-signal shortcuts
// above exist to serve). Tries, in order, first hit wins:
// 1) `process.cwd()` -- the common case: an interactive session invokes
//    `fgos discover`/`fgos plan` from inside the worktree it just
//    committed to (fgos-coding-exploring's/fgos-coding-planning's own hard rule: commit
//    before calling either verb). Zero extra cost.
// 2) the item's own fgw/<id> worktree via `git worktree list --porcelain`
//    (`findCheckoutPath`, the exact parse `promote-preflight.mjs` already
//    reuses for the same "is this branch checked out somewhere" question)
//    -- covers the crashed-mid-session case tsk-ozl D3 named as the
//    reason a sweep should trust a committed CONTEXT.md even with no live
//    session attached: the worktree still exists on disk after the
//    session that created it ends.
// 3) `stateRoot` itself -- today's prior behavior, last resort: the
//    item's branch already merged to main (content really does live at
//    stateRoot now), or a genuinely untouched item with nothing to find
//    either way (correctly fails open to requiring an explicit verdict,
//    unchanged).
// Never throws: any git/fs failure at a candidate just falls through to
// the next one, ending at the always-available stateRoot.
export function resolveContentRoot(stateRoot, id, docsRef) {
  const candidates = [process.cwd()];
  try {
    const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: stateRoot,
      encoding: 'utf8',
      shell: false,
    });
    const worktreePath = findCheckoutPath(listing, branchNameFor(id));
    if (worktreePath) candidates.push(worktreePath);
  } catch {
    // no git, or worktree list failed -- fall through to stateRoot
  }
  candidates.push(stateRoot);

  for (const candidate of candidates) {
    if (readLockedContext(candidate, docsRef)) return candidate;
  }
  return stateRoot;
}

const DEFAULT_NEED_HUMAN_REASON =
  'Không phán được rõ ràng — cần người xác nhận cách chia.';

// D3(b): risk-heavy root always routes through the human gate regardless of
// what the verdict said — the threshold resolved at validating (feasibility
// matrix row 4): risk domain mirrors tier (classify.mjs), and 'heavy' is
// the one value that gates.
const HEAVY_RISK = 'heavy';
const DEFAULT_RISK_GATE_REASON = 'Item gốc có risk cao (heavy) — cần xác nhận trước khi chia.';

// work-item-priority-matrix D4/D8, Phase C: a real blast-radius measurement
// ADDS caution, never removes it -- a keyword-light item with a large
// enough blast-radius still gates, same as HEAVY_RISK above, and neither
// gate ever loosens the other (both are checked, either can force it).
const BLAST_RADIUS_GATE_THRESHOLD = 20;
const DEFAULT_BLAST_RADIUS_GATE_REASON =
  'Blast-radius (impact-analysis) vượt ngưỡng cảnh báo — cần xác nhận trước khi chia.';

// tsk-6b6 D1/D3: fixed rationale for the one branch with no trustworthy
// text to draw from -- a parse/validation failure, never a real verdict.
const DEFAULT_INVALID_RATIONALE = 'Verdict không hợp lệ — không phán được.';
// tsk-6b6 D2: fallback when a pass-through verdict carried no reason --
// distinct from decompose's reason, which is required (D3) and never
// falls back.
const DEFAULT_PASS_THROUGH_RATIONALE = 'Không có lý do cụ thể — pass-through mặc định.';
// tsk-27y D1/D3: same shape as DEFAULT_INVALID_RATIONALE above, but for a
// caller-supplied verdict (fgos decompose --verdict ...) that fails the
// same child-validation `buildDecomposeChildrenVerdict` applies.
const DEFAULT_CALLER_INVALID_RATIONALE =
  'Caller-supplied verdict không hợp lệ (thiếu reason, hoặc 1 child thiếu verify).';

// tsk-6b6 D1: log every decompose verdict branch via the shipped
// addDecision (tsk-63c, store.mjs) -- `outcome` is what resolvePlan
// actually did (never just verdict.kind, since the heavy-risk gate can force
// a `need-human` outcome out of a pass-through/decompose verdict), `label`
// is the extra bit worth naming in `text` (e.g. child count).
function logDecomposeVerdict(dir, id, outcome, rationale, label) {
  const text = label ? `decompose verdict: ${outcome} (${label})` : `decompose verdict: ${outcome}`;
  addDecision(dir, { id, text, source: 'resolvePlan', kind: 'engine', rationale });
}

// tsk-3xd D2 (docs/history/tsk-3xd-decompose-child-directive-prose/
// CONTEXT.md): a D-ID token as it appears in a "## Locked decisions" table
// row (e.g. "D1", "D2"). Deliberately the same section-scoping approach
// findUncoveredLockedDecisions below already uses (PATH_TOKEN_PATTERN over
// the same "## Locked decisions" slice) — a D-ID mentioned only in prose
// OUTSIDE that table is not a real citation.
const D_ID_PATTERN = /\bD\d+\b/g;

// tsk-1lv-3 (CONTEXT.md D3): the write-side counterpart to
// extractLockedDecisionIds' own section-scoping regex just above --
// `fgos context-render <id>` (bin/fgos.mjs, src/report/context-render.mjs)
// calls this to splice a freshly-rendered table into an existing
// CONTEXT.md, replacing whatever text currently sits under the heading
// (hand-typed prose, an earlier render, or nothing) without touching any
// other section. Exported so the CLI verb can call it directly rather than
// re-deriving the same section-matching logic a second time.
export function replaceLockedDecisionsSection(contextText, tableMarkdown) {
  if (typeof contextText !== 'string') {
    throw new Error('replaceLockedDecisionsSection: contextText must be a string');
  }
  if (typeof tableMarkdown !== 'string') {
    throw new Error('replaceLockedDecisionsSection: tableMarkdown must be a string');
  }
  const headingMatch = /##\s*Locked decisions\s*\n/i.exec(contextText);
  if (!headingMatch) {
    throw new Error('replaceLockedDecisionsSection: no "## Locked decisions" heading found');
  }
  const headingEnd = headingMatch.index + headingMatch[0].length;
  const rest = contextText.slice(headingEnd);
  // `headingMatch`'s own trailing `\s*` is greedy (it backtracks only as
  // far as needed to still match the required literal `\n`), so it already
  // consumes every blank line between the heading and whatever follows --
  // including an EMPTY section's zero-blank-line case, where the next
  // heading sits immediately at the start of `rest` with no leading `\n`
  // of its own left to find. Check that case explicitly before falling
  // back to the `\n##` search below; skipping it would let `sectionEnd`
  // run to the end of the whole document, swallowing every later section.
  let sectionEnd;
  if (/^##\s/.test(rest)) {
    sectionEnd = headingEnd;
  } else {
    const nextHeadingMatch = /\n##\s/.exec(rest);
    sectionEnd = nextHeadingMatch ? headingEnd + nextHeadingMatch.index + 1 : contextText.length;
  }
  const before = contextText.slice(0, headingEnd);
  const after = contextText.slice(sectionEnd);
  return `${before}${tableMarkdown.trimEnd()}\n\n${after}`;
}

function extractLockedDecisionIds(contextText) {
  if (typeof contextText !== 'string' || !contextText.trim()) return new Set();
  const section = /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i.exec(contextText);
  const decisionsText = section ? section[1] : '';
  if (!decisionsText.trim()) return new Set();
  const ids = new Set();
  let match;
  D_ID_PATTERN.lastIndex = 0;
  while ((match = D_ID_PATTERN.exec(decisionsText)) !== null) {
    ids.add(match[0]);
  }
  return ids;
}

// `lockedDecisionIds` (tsk-3xd D2, optional — every pre-tsk-3xd caller that
// passes none keeps the old `action`-free shape, since the check below is
// skipped whenever the set is empty): the real D-IDs found in the parent's
// own CONTEXT.md, via extractLockedDecisionIds above.
function normalizeChild(child, lockedDecisionIds) {
  if (!child || typeof child !== 'object' || Array.isArray(child)) return null;
  if (typeof child.title !== 'string' || !child.title.trim()) return null;
  // D2: a child with no real, runnable verify makes the WHOLE verdict
  // invalid — no placeholder, no FALLBACK_VERIFY (discovery.mjs's fallback
  // is explicitly forbidden here for children, per validating feasibility
  // matrix last row).
  if (typeof child.verify !== 'string' || !child.verify.trim()) return null;

  // tsk-3xd D2: action is now BẮT BUỘC, same "no placeholder invalidates
  // the whole verdict" discipline verify already has above — an executor
  // dispatched blind to what it must do and which decision it must obey is
  // exactly the three-layer bug this item exists to fix (CONTEXT.md's
  // "Tầng 1/2/3"). Must cite at least one real D-ID from the parent's own
  // "## Locked decisions" table; a citation to a nonexistent D-ID (typo,
  // hallucination) is rejected the same as no citation at all. Exempted
  // when the parent carries NO locked decisions at all (empty/missing
  // CONTEXT.md) — same graceful-degrade precedent
  // findUncoveredLockedDecisions already sets for that case — so an item
  // that never went through fgos-coding-exploring does not hard-break decompose
  // entirely; it only requires a non-empty action, not a citation with
  // nothing real to cite.
  if (typeof child.action !== 'string' || !child.action.trim()) return null;
  if (lockedDecisionIds instanceof Set && lockedDecisionIds.size > 0) {
    const cited = child.action.match(D_ID_PATTERN) ?? [];
    if (!cited.some((id) => lockedDecisionIds.has(id))) return null;
  }

  return {
    title: child.title,
    verify: child.verify,
    action: child.action,
    kind: typeof child.kind === 'string' && child.kind.trim() ? child.kind : undefined,
    risk: typeof child.risk === 'string' && child.risk.trim() ? child.risk : undefined,
    refs: Array.isArray(child.refs) ? child.refs.filter((r) => typeof r === 'string') : [],
    // work-graph-intelligence S9 footprint, same optional-additive shape as
    // work.mjs's validateWorkShape: a malformed (non-array) value never
    // invalidates the child, it just leaves footprint absent — same fail-soft
    // rule bin/fgos.mjs's own --footprint flag follows.
    footprint: Array.isArray(child.footprint)
      ? child.footprint.filter((p) => typeof p === 'string' && p.trim())
      : undefined,
    rawDeps: Array.isArray(child.deps) ? child.deps : [],
  };
}

// tsk-27y D1: the 'decompose' verdict-shape resolution a caller-supplied
// verdict (`fgos decompose --children`) resolves through — same
// normalizeChild rejection rule (no child missing `verify`) and same
// "0 children collapses to pass-through" rule.
//
// `lockedContext` (tsk-3xd D2, optional — omitted keeps the old shape byte-
// identical): the parent's own CONTEXT.md/plan.md text, threaded down to
// normalizeChild's D-ID-citation check via extractLockedDecisionIds.
function buildDecomposeChildrenVerdict(rawReason, rawChildren, lockedContext) {
  const reason = typeof rawReason === 'string' && rawReason.trim() ? rawReason : undefined;

  if (!Array.isArray(rawChildren) || rawChildren.length === 0) {
    const out = { kind: 'pass-through' };
    if (reason) out.reason = reason;
    return out;
  }

  // tsk-6b6 D3: a decompose verdict with no real top-level reason (the
  // why-split summary) is invalid -- same rule as a child missing verify
  // below, never a placeholder or a silently-accepted blank.
  if (!reason) {
    return { kind: 'invalid' };
  }

  const lockedDecisionIds = extractLockedDecisionIds(lockedContext);
  const normalized = rawChildren.map((child) => normalizeChild(child, lockedDecisionIds));
  if (normalized.some((child) => child === null)) {
    return { kind: 'invalid' };
  }

  const children = normalized.map((child, index) => {
    const deps = child.rawDeps.filter((d) => Number.isInteger(d) && d >= 0 && d < index);
    const { rawDeps, ...rest } = child;
    return { ...rest, deps };
  });
  return { kind: 'decompose', reason, children };
}

// tsk-27y D1/D2: resolves a caller-supplied verdict (`fgos plan
// --verdict ...`) into the `{kind, reason?, children?}` shape
// resolvePlan dispatches on (pass-through/need-human/decompose). `raw`
// is the CLI's already-argv-validated object (`bin/fgos.mjs`'s
// `parsePlanCallerVerdict`) — this function only re-validates the
// parts that matter to write correctness (reason, children shape).
export function resolveCallerPlanVerdict(raw, lockedContext) {
  if (!raw || typeof raw !== 'object') return { kind: 'invalid' };

  if (raw.verdict === 'pass-through') {
    const reason = typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason : undefined;
    const out = { kind: 'pass-through' };
    if (reason) out.reason = reason;
    return out;
  }

  if (raw.verdict === 'need-human') {
    const reason = typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason : DEFAULT_NEED_HUMAN_REASON;
    return { kind: 'need-human', reason };
  }

  if (raw.verdict === 'decompose') {
    return buildDecomposeChildrenVerdict(raw.reason, raw.children, lockedContext);
  }

  return { kind: 'invalid' };
}

function formatProposalAsk(verdict, reason) {
  if (verdict.kind === 'decompose') {
    const list = verdict.children.map((c, i) => `${i + 1}. ${c.title} (verify: ${c.verify})`).join('\n');
    return `## Context\n\nĐề xuất chia (chưa ghi vào queue, cần xác nhận) — ${reason}\n${list}\n\n## Why this matters\n\nCần xác nhận trước khi các việc con được ghi thật vào queue — sai sót ở đây tốn công dọn lại sau.`;
  }
  if (verdict.kind === 'pass-through') {
    return `## Context\n\nĐề xuất: không chia (pass-through) — ${reason}\n\n## Why this matters\n\nCần xác nhận trước khi việc này được coi là một khối duy nhất, không tách nhỏ.`;
  }
  return `## Context\n\nĐề xuất chia — ${reason}\n\n## Why this matters\n\nCần xác nhận trước khi các việc con được ghi thật vào queue.`;
}

// tsk-5e97 D1 (docs/history/tsk-5e97-decompose-footprint-overlap-gate/
// CONTEXT.md): footprint overlap among the tentative children of a
// `decompose` verdict names each conflicting pair, their shared paths, and
// footprintOverlapAmong's own resolution suggestions (sequence/hoist/
// re-slice) -- surfaced as the `reason` fed into formatProposalAsk below,
// same gate shape as keywordRiskGate/blastRadiusGate.
function formatFootprintOverlapReason(conflicts) {
  const lines = conflicts.map(
    (c) => `${c.a} ↔ ${c.b} (trùng: ${c.shared.join(', ')}; gợi ý: ${c.suggestions.join('/')})`,
  );
  return `Footprint trùng giữa các việc con dự kiến:\n${lines.join('\n')}`;
}

// A token shaped like a real repo file path: has a "/" (directory-shaped)
// OR ends with a familiar code/config/doc extension. Loose on purpose (D2:
// mechanical, no judge call) -- fs.existsSync below is what actually
// filters out prose that merely looks path-shaped.
// tsk-gio fix: optional leading "." before the boundary so a root
// dotfile (".fgos-runner.json") keeps its dot instead of tokenizing as
// "fgos-runner.json" -- fs.existsSync below then checks the WRONG path
// and silently exempts a real, existing dotfile (found by independent
// review: this is exactly the tsk-2ta case this feature exists for).
const PATH_TOKEN_PATTERN = /[A-Za-z0-9_.-]*\/[A-Za-z0-9_./-]+|\.?\b[A-Za-z0-9_-]+\.(?:mjs|cjs|js|ts|tsx|jsx|json|md|ya?ml|toml|py|go|rs|rb)\b/g;

/**
 * COMPLETENESS ADVISORY (tsk-1gr, D1/D2 of docs/history/decompose-locked-
 * decision-footprint-coverage/CONTEXT.md): a locked decision naming a
 * real, existing file that NO tentative child's footprint covers --
 * advisory-only, NEVER blocks (D1 -- unlike `footprintOverlapAmong`'s
 * collision gate above, which is a different failure mode: this is about
 * a decision nobody claimed responsibility for, not two children fighting
 * over the same file). D2: purely mechanical, no LLM/judge call --
 * extracts path-shaped tokens from CONTEXT.md's own "## Locked decisions"
 * section (readLockedContext's concatenated text), keeps only the ones
 * `fs.existsSync` confirms are real files in `repoRoot`, then flags any
 * such path that no child's declared `footprint` contains. A decision
 * whose text names no real path is exempt automatically -- nothing to
 * check (D2's own "vắng path thì miễn tự động").
 *
 * @param {string} contextText - readLockedContext's own concatenated output
 * @param {{footprint?: string[]}[]} children - tentative children (verdict.children shape)
 * @param {string} repoRoot - resolved against fs.existsSync
 * @returns {string[]} real paths named in locked decisions that no child's footprint touches
 */
export function findUncoveredLockedDecisions(contextText, children, repoRoot) {
  if (typeof contextText !== 'string' || !contextText.trim()) return [];
  const section = /##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i.exec(contextText);
  const decisionsText = section ? section[1] : '';
  if (!decisionsText.trim()) return [];

  const candidatePaths = new Set();
  let match;
  PATH_TOKEN_PATTERN.lastIndex = 0;
  while ((match = PATH_TOKEN_PATTERN.exec(decisionsText)) !== null) {
    candidatePaths.add(match[0].replace(/^`|`$/g, ''));
  }
  if (candidatePaths.size === 0) return [];

  const realPaths = [...candidatePaths].filter((p) => {
    try {
      return fs.existsSync(path.join(repoRoot, p));
    } catch {
      return false;
    }
  });
  if (realPaths.length === 0) return [];

  const covered = new Set();
  for (const child of Array.isArray(children) ? children : []) {
    for (const f of Array.isArray(child?.footprint) ? child.footprint : []) {
      // tsk-297 fix: a non-string footprint entry used to reach
      // isCoveredByDirectory's f.replace(...) below and throw -- silently,
      // since that call now sits inside resolvePlan's own catch{}
      // (tsk-gio). Filtering here keeps `covered` a plain Set<string>,
      // which both isCoveredByDirectory and isDirectoryContainingCoverage
      // below assume without needing their own per-entry type guard.
      if (typeof f === 'string') covered.add(f);
    }
  }

  // tsk-gio fix: a directory-shaped footprint entry (e.g. "src/",
  // "docs/decisions") covers every path underneath it, not only an exact
  // string match -- real footprints in this repo are routinely
  // directory-shaped (found by independent review), so exact-match-only
  // coverage produced false "uncovered" advisories on decisions that
  // WERE covered. Purely mechanical (D2): no fs.statSync directory check,
  // just a "/" boundary after stripping a trailing slash.
  const isCoveredByDirectory = (p) => {
    for (const f of covered) {
      const dir = f.replace(/\/+$/, '');
      if (dir && p.startsWith(`${dir}/`)) return true;
    }
    return false;
  };

  // tsk-297 fix: the MIRROR case tsk-gio's directory fix left open --
  // fs.existsSync (above) is true for directories too, so a locked
  // decision naming an enclosing directory (e.g. "src/intake/") is a
  // real candidate path. A child declaring a FILE inside that directory
  // (e.g. "src/intake/plan.mjs") clearly does touch it, but exact-
  // match/isCoveredByDirectory above only ever check the decision path
  // as a potential PREFIX of a footprint entry, never the reverse. Found
  // by independent review: 20+ real CONTEXT.md decisions name a
  // directory this way. Same purely-mechanical "/" boundary, just the
  // other direction.
  //
  // tsk-5iv D5 (round-3 review, MEDIUM, intentional trade-off -- NOT
  // tightened): this means ANY single footprint entry nested under a
  // directory-shaped decision counts as full coverage of that decision,
  // not just an entry naming the directory itself or a path at/above it.
  // Requiring the stricter form was considered and rejected: it would
  // make a real, legitimate child that touches exactly one file inside a
  // directory-shaped decision incorrectly fail coverage -- a false
  // positive on the advisory this exists to keep quiet on real matches.
  // The blast radius of the looser form stays bounded by
  // PATH_TOKEN_PATTERN's 2+-segment requirement (a bare top-level
  // directory like "src/" alone never tokenizes as a decision path at
  // all), and this whole check is advisory-only -- it never blocks a
  // decompose, only logs an advisory decision (see resolvePlan's
  // caller). Never blocks == the class of unnecessary rework a false
  // positive would cause is why looser was chosen here, while
  // isCoveredByDirectory above stays the direction it already was.
  const isDirectoryContainingCoverage = (p) => {
    const dir = p.replace(/\/+$/, '');
    if (!dir) return false;
    for (const f of covered) {
      if (f.startsWith(`${dir}/`)) return true;
    }
    return false;
  };

  return realPaths.filter(
    (p) => !covered.has(p) && !isCoveredByDirectory(p) && !isDirectoryContainingCoverage(p),
  );
}

/**
 * Read `id` from the store at `dir` and resolve its decompose-stage
 * transition — the ONE function both the sync decompose-equivalent verb
 * and the async runner sweep call (D3's sync/async parity, mirroring
 * resolveDiscovery). `role` is positional, exactly like resolveDiscovery
 * (Phase 3 S3-closeout settlement design): the runner's sweep passes
 * `'runner'`; a sync caller passes its own attribution. Only stamped on the
 * root's own stage-move (children are `work.add` events, which carry no
 * role field at all).
 *
 * Returns `{ outcome, id, verdict?, childIds? }` where `outcome` is one of
 * `'noop'` (already past decompose — CAS-backed idempotency), `'already-
 * decomposed'` (children exist from an interrupted prior call; only the
 * root's stage-move is completed, no children regenerated), `'invalid'`
 * (fail-safe, item left untouched), `'need-human'` (parked in awaiting-human
 * with the proposal, nothing written to the queue yet), `'pass-through'`, or
 * `'decompose'` (children written, root moved to executing).
 *
 * `callerVerdict` (tsk-27y D1/D2): `{verdict: 'pass-through'|'need-human'|
 * 'decompose', reason?, children?}` — when supplied (`fgos decompose
 * --verdict ...`), resolved via `resolveCallerPlanVerdict` INSTEAD of
 * any subprocess judgment, checked before the plan.md tiny/small mode
 * skip-and-advance heuristic. Every downstream gate (heavy-risk,
 * blast-radius, footprint-overlap) still applies unconditionally (D3) —
 * only the model/subprocess call itself is skipped.
 *
 * MISSING BOTH (tsk-1x3 D16): no `callerVerdict` and plan.md does not
 * declare `tiny`/`small` mode. `resolvePlan` was NOT symmetric with
 * `resolveDiscovery` here before this item — its fallback here used to
 * call `judgeDecompose`, a real subprocess judge, for every other mode. A
 * `'runner'` role (the mechanical decompose sweep, `src/runner/loop.mjs`)
 * now degrades to the same safe no-op D6 already established for
 * discovery: the item is left exactly where it is, changing no observed
 * behavior since the runner has never dispatched a real worker for this
 * stage in this repo's history. Any other role reaching this point
 * genuinely omitted `--verdict` — refuse loudly instead of silently
 * guessing.
 */
// `cfg` (tsk-1x3 D9 finding): unused inside this function's own body now
// that judgeDecompose is retired — same reasoning discovery.mjs's own
// resolveDiscovery states for its identical unused `cfg` parameter: kept
// for call-site compatibility outside this item's declared footprint.
export function resolvePlan(dir, id, cfg, role, callerVerdict) {
  const view = listWork(dir);
  const work = view.work[id];
  if (!work) {
    throw new StoreError('validation', `resolvePlan: work "${id}" not found.`);
  }

  // Claim release on the decompose->executing boundary (claim-lock §3b): a
  // pick claim held through clarify/decompose (`status: 'doing'`) is released
  // back to `todo` the moment the root actually reaches `executing`, so
  // `pick <id>` can re-claim it for the executing phase (§3a/§3c reattach the
  // SAME `fgw/<id>` worktree via branchExists, since it already exists).
  // `work.status` is read once, from the same snapshot as `work` above — the
  // status axis is untouched by anything else in this function, so it stays
  // valid across all three moveStage(...,'executing',...) call sites below. A
  // runner-sweep call (item never claimed, `status: 'todo'` already) is a
  // no-op here, matching R15 (sweep only touches todo items).
  // tsk-40m D5: releaseClaimOnExecuting retired. Items at stage planning no
  // longer hold durable status doing, so the planning->executing edge no longer
  // needs to release a durable doing status back to todo.
  const releaseClaimOnExecuting = () => {};

  // Idempotent no-op (must_haves truth 3): a re-entrant call once the root
  // is already past `decompose` does nothing — the CAS on the moveStage
  // calls below would otherwise throw a conflict for the exact same case,
  // so this check backs it up ahead of time rather than making every caller
  // catch that error.
  const domain = getDomain(work.domain);
  const currentStage = work.stage ?? stageForStep(domain, 'Execute');
  const planningStage = stageForStep(domain, 'Divide');
  // tsk-403 D18: `decompose` is coding's own drain-only legacy alias for
  // this same step — an item still parked there (from before the rename)
  // must NOT read as "already past Divide" here, or this function would
  // silently no-op on it forever instead of actually processing it. Only
  // activates when a domain declares both names distinctly (today: only
  // `coding`) — a domain whose OWN live Divide stage is still literally
  // named `decompose` (never renamed by this item) already has
  // `planningStage === 'decompose'`, so this stays a no-op for it.
  const workflow = resolveWorkflow(domain, work.kind);
  const legacyPlanStage = (workflow?.stages ?? domain.stages)?.includes('decompose') && planningStage !== 'decompose' ? 'decompose' : undefined;
  if (currentStage !== planningStage && currentStage !== legacyPlanStage) {
    return { outcome: 'noop', id };
  }

  // RE-ENTRANCY (validating feasibility matrix, REPAIRED; tsk-4n8 narrowed
  // the signal): a crash between writing children and moving the root to
  // executing must not regenerate children on retry. The signal for "this
  // call's own addWork loop already finished" is a durable
  // decompose-completion decision (`logDecomposeVerdict`'s own 'decompose'
  // entry below, written BEFORE moveStage) — never bare child existence
  // (tsk-4n8): a stray child (a prior partial/superseded --children
  // submission, or a human's manual `fgos add --parent`) must not be
  // mistaken for a completed decompose and permanently block every later
  // decompose attempt with no supported way to add the still-missing
  // children — the exact failure mode tsk-4n8 was filed to fix. Same
  // `view.decisionsById?.[id] ?? []` read pattern this file already uses
  // for `priorityOverridden` below.
  const priorDecomposeCompleted = (view.decisionsById?.[id] ?? []).some(
    (d) => d.source === 'resolvePlan' && typeof d.text === 'string' && d.text.startsWith('decompose verdict: decompose'),
  );
  // Real verify (tsk-19j D1/D11, closes gap 2): `gates[id].planApprove.verify`
  // was the real command `fgos-coding-planning`'s now-retired `planApprove`
  // gate recorded (coding-planning-validating-gate-redesign D9-D11 removed
  // that gate; no live skill writes a new `planApprove` record). Read once,
  // reused by every moveStage call below that advances this item to
  // `executing`, so none of them silently carry FALLBACK_VERIFY or leave
  // `verify` untouched (transitionStage only overwrites it when passed a
  // value — stage-fsm.mjs:60-65). For every item post-redesign this falls
  // through to the item's own current `verify` — the same value
  // `fgos-coding-validating`'s merged gate itself reads fresh — kept only so
  // pre-redesign items still carrying a historical `planApprove.verify`
  // replay unchanged.
  const planApproveVerify = view.gates?.[id]?.planApprove?.verify ?? work.verify;

  // tsk-4m4 (narrowed, D1): `planApproveVerify` above feeds FOUR separate
  // `moveStage` call sites below (hasChildren re-entrancy, tiny/small
  // skip-and-advance, explicit pass-through, and the real decompose
  // success path) with zero check on it — unlike resolveDiscovery's own
  // caller-verdict path, which runs this same mechanical check before
  // accepting a proposed verify. One check here, before any of those four
  // branches, closes all of them at once. Same shape as this file's own
  // existing per-child check below (`disputedChild`) and
  // resolveDiscovery's own dispute-handling (discovery.mjs:402-451):
  // mechanical-only (verify-pattern-check.mjs), park on disagreement
  // unless `--force` (never for a mechanical disagreement, tsk-12t D6).
  const planVerifyDispute = judgeVerifySemanticCorrectness(planApproveVerify);
  if (!planVerifyDispute.agrees) {
    if (callerVerdict?.force === true && planVerifyDispute.mechanical !== true) {
      addDecision(dir, {
        id,
        text: `plan --force overrode a disputed planApproveVerify: "${planApproveVerify}"`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale: `second pass disagreed: ${planVerifyDispute.reason}`,
      });
    } else {
      if (work.status === 'awaiting-human') {
        throw new StoreError(
          'validation',
          `plan --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
        );
      }
      const ask =
        `## Context\n\n` +
        `Verify hiện tại của item (sẽ được stamp lúc sang executing) bị nghi ngờ ở vòng kiểm tra thứ hai: ${planVerifyDispute.reason}\n` +
        `Verify: ${planApproveVerify}\n\n` +
        `## Why this matters\n\n` +
        `Cần xác nhận trước khi verify này được stamp thật vào item lúc sang executing.`;
      putInAwaiting(dir, { id, ask, statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
      return { outcome: 'verify-disputed', id, secondPass: planVerifyDispute };
    }
  }

  if (priorDecomposeCompleted) {
    moveStage(dir, { id, to: stageForStep(domain, 'Execute'), expectedStage: currentStage, verify: planApproveVerify, role });
    releaseClaimOnExecuting();
    return { outcome: 'already-decomposed', id };
  }

  const stateRoot = path.dirname(dir);
  // repoRoot (tsk-1ni D1): resolved to the item's own worktree when one
  // exists, never the raw state root -- see resolveContentRoot's own
  // comment above. Reused below for readLockedContext's own read AND
  // (tsk-3xd D2) the caller-supplied path's own D-ID-citation check --
  // hoisted above the callerVerdict/model branch so both share the SAME
  // read instead of the caller-supplied branch never seeing locked
  // decisions at all.
  const repoRoot = resolveContentRoot(stateRoot, id, work.docsRef);
  const lockedContext = readLockedContext(repoRoot, work.docsRef);

  let verdict;
  if (callerVerdict) {
    // tsk-27y D2: caller-supplied verdict checked FIRST, before the plan.md
    // tiny/small mode skip-and-advance heuristic below — explicit beats
    // heuristic.
    verdict = resolveCallerPlanVerdict(callerVerdict, lockedContext);
    if (verdict.kind === 'invalid') {
      logDecomposeVerdict(dir, id, 'invalid', DEFAULT_CALLER_INVALID_RATIONALE);
      return { outcome: 'invalid', id };
    }
    addDecision(dir, {
      id,
      text: `decompose caller-supplied: ${verdict.kind}`,
      source: 'resolvePlan',
      kind: 'engine',
      rationale:
        'tsk-27y D2/D3: caller-supplied verdict — session already reasoned live (fgos-coding-planning); downstream gates (heavy-risk/blast-radius/footprint-overlap) still apply unconditionally, same as before',
    });
  } else {
    // TINY/SMALL SKIP-AND-ADVANCE (tsk-19j D1/D3/D7, closes gap 3) —
    // deliberately narrower than a literal port of resolveDiscovery's own
    // trust signal: unlike a clarify-pass, a decompose verdict can WRITE
    // REAL CHILDREN (addWork below) — skipping blind would also skip the
    // one thing that turns plan.md's documented split into real work
    // items. The only case where skipping is provably safe is when
    // fgos-coding-planning's own mode gate (SKILL.md step 2) already guarantees
    // no split is possible: `tiny`/`small` mode is single-piece by
    // definition (0-1 risk flags). Detected by reading plan.md's own
    // recorded mode line — any other mode, or no match at all, now falls
    // through to the no-op/refuse branch below (tsk-1x3 D16) instead of a
    // subprocess judge call.
    const passThroughModeMatch = /\bmode\s*[:=]\s*\*{0,2}(tiny|small)\b/i.exec(lockedContext);
    if (lockedContext && passThroughModeMatch) {
      const mode = passThroughModeMatch[1].toLowerCase();
      addDecision(dir, {
        id,
        text: `decompose skip: plan.md declares mode "${mode}" (tiny/small are single-piece by fgos-coding-planning's own mode gate), no verdict required`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale:
          'tsk-19j D7 trust signal: plan.md already committed to no split, so there is nothing to judge — skipping avoids a pointless round-trip, never a real child-generation decision',
      });
      moveStage(dir, { id, to: stageForStep(domain, 'Execute'), expectedStage: currentStage, verify: planApproveVerify, role });
      releaseClaimOnExecuting();
      return { outcome: 'pass-through', id };
    }

    // tsk-1x3 D1/D9/D16: no callerVerdict, no tiny/small trust signal —
    // the old fallback (judgeDecompose, a nested `claude -p` subprocess)
    // is retired. 'runner' degrades to a safe no-op (see this function's
    // own doc comment above); any other role refuses loudly.
    if (role === 'runner') {
      return { outcome: 'noop', id };
    }
    throw new StoreError(
      'validation',
      `plan: work "${id}" has no --verdict and plan.md does not declare tiny/small mode -- run "fgos plan ${id} --verdict pass-through --reason \"...\"" (or --verdict decompose --children '[...]', or --verdict need-human --reason \"...\") after reasoning about it yourself.`,
    );
  }

  // work-item-priority-matrix D6/D8, Phase C: the REFINED pass -- unlike
  // discovery.mjs's rough pass (impact = blocks + semantic scan only,
  // effort assumed at EFFORT_FLOOR), this one has real `effort` (from
  // fgos-coding-planning's own mode, when a caller-supplied verdict carries one)
  // and a real `blastRadius` (when fgos-coding-planning/fgos-coding-validating actually
  // recorded one). Rides on every non-invalid outcome, same fail-safe
  // try/catch discipline discovery.mjs's rough pass uses.
  try {
    // tsk-1r3: semanticRelatedness explicit (not omitted) for parameter
    // parity with discovery.mjs's rough pass -- always 0 at BOTH call
    // sites today (discovery.mjs's own verdict.impactScore is never
    // populated by the live callerVerdict path; decompose's own verdict
    // shape has no equivalent field either), so this is a documentation/
    // consistency fix, not a behavior change.
    const impact = computeImpact({ blocks: rankImpact(view).find((r) => r.id === id)?.blocks ?? 0, semanticRelatedness: 0, blastRadius: verdict.blastRadius });
    const priority = computePriority({
      impact,
      urgent: work.urgent,
      effort: verdict.mode ? effortForMode(verdict.mode) : undefined,
      risk: work.risk,
      blastRadius: verdict.blastRadius,
    });
    // tsk-sq9: a human's `edit --priority` logs a `priority-override`
    // decision (bin/fgos.mjs's `edit` handler) -- if one is already on
    // record for this item, the refined pass skips its own overwrite
    // instead of silently clobbering the human's deliberate value. `view`
    // was read fresh at the top of this call, so it reflects any override
    // logged before this resolvePlan invocation.
    const priorityOverridden = (view.decisionsById?.[id] ?? []).some((d) => d.kind === 'priority-override');
    if (priorityOverridden) {
      addDecision(dir, {
        id,
        text: 'priority: skipped refined-pass overwrite -- priority-override decision already present',
        source: 'resolvePlan',
        kind: 'engine',
        rationale: 'tsk-sq9: a human already set priority via edit --priority; the refined pass would otherwise silently clobber it',
      });
    } else {
      editWork(dir, { id, patch: { priority }, role });
    }
    // tsk-4hb: see discovery.mjs's rough pass -- same observability gap,
    // same fix, the refined pass's own call site.
    if (work.risk && !isRecognizedRisk(work.risk)) {
      addDecision(dir, {
        id,
        text: `priority: work.risk "${work.risk}" is not a recognized RISK_DISCOUNTS key -- discountForRisk folded it to the "standard" default`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale: 'tsk-4hb: making the silent unrecognized-value fallback observable',
      });
    }
  } catch (err) {
    // tsk-6d8: swallowed intentionally (see comment above), but never
    // silently -- see discovery.mjs's own rough-pass catch for the same
    // fix and its full rationale (never a second write-door call, never
    // a re-throw).
    process.stderr.write(`fgos: priority write for "${id}" failed (${err?.message ?? err}) -- swallowed intentionally\n`);
  }

  // D3: need-human (an explicit verdict) OR a risk-heavy root (classify's
  // signal) routes through the human gate — carrying whatever the verdict
  // proposed as context, but writing nothing into the queue yet (Terms:
  // "Đề xuất chia" is the proposal BEFORE it is committed).
  //
  // Heavy-risk gate release (tsk-3w8 follow-up): this hard risk gate used
  // to re-fire unconditionally on every call — a human answering
  // `fgos answer` never released it, re-parking the exact same question
  // forever (dogfood, 2026-07-28). Bypassed only when the MOST RECENT gate
  // ask/answer on record is genuinely THIS gate's own prior ask (matched
  // by DEFAULT_RISK_GATE_REASON's own text, the one string
  // formatProposalAsk always embeds for it) — never a stale answer left
  // over from an unrelated clarify-stage or explicit need-human question.
  const gate = view?.gates?.[id];
  const heavyRiskAlreadyConfirmed =
    typeof gate?.answer === 'string' && gate.answer.trim() && typeof gate?.ask === 'string' && gate.ask.includes(DEFAULT_RISK_GATE_REASON);
  // tsk-wve D1: a heavy-risk verdict that cites a real, already-locked
  // decision from this item's own CONTEXT.md is grounded, not off-the-cuff
  // -- same D-ID-citation precedent normalizeChild already trusts for a
  // decompose child's own `action` field (above). `lockedDecisionIds.size
  // === 0` (no CONTEXT.md, or none with a "## Locked decisions" table)
  // never counts as evidence -- the floor stays exactly as before for an
  // item that never went through fgos-coding-exploring, same graceful-degrade
  // normalizeChild already applies.
  const lockedDecisionIds = extractLockedDecisionIds(lockedContext);
  const citesRealEvidence =
    lockedDecisionIds.size > 0 && (verdict.reason?.match(D_ID_PATTERN) ?? []).some((cited) => lockedDecisionIds.has(cited));
  const keywordRiskGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed && !citesRealEvidence;

  // work-item-priority-matrix D4/D8, Phase C: same bypass-detection shape as
  // keywordRiskGate above (matched by its own reason text, never a stale
  // answer from an unrelated gate) -- an INDEPENDENT gate, checked in
  // addition to keywordRiskGate, never instead of it.
  const blastRadiusAlreadyConfirmed =
    typeof gate?.answer === 'string' && gate.answer.trim() && typeof gate?.ask === 'string' && gate.ask.includes(DEFAULT_BLAST_RADIUS_GATE_REASON);
  const blastRadiusGate =
    Number.isFinite(verdict.blastRadius) && verdict.blastRadius >= BLAST_RADIUS_GATE_THRESHOLD && !blastRadiusAlreadyConfirmed;
  const risksGate = keywordRiskGate || blastRadiusGate;

  if (verdict.kind === 'need-human' || risksGate) {
    // keywordRiskGate's reason always wins when both apply -- it is the
    // existing floor (Phase C's own rule: capability signal only ever adds
    // caution, never replaces the keyword check it sits alongside).
    const reason = verdict.kind === 'need-human' ? verdict.reason : keywordRiskGate ? DEFAULT_RISK_GATE_REASON : DEFAULT_BLAST_RADIUS_GATE_REASON;
    // Logged outcome is 'need-human' (what actually happened), not
    // verdict.kind -- a risk-heavy root can force this parking out of a
    // pass-through/decompose verdict underneath it.
    logDecomposeVerdict(dir, id, 'need-human', reason);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
    return { outcome: 'need-human', id, verdict };
  }

  if (verdict.kind === 'pass-through') {
    logDecomposeVerdict(dir, id, 'pass-through', verdict.reason ?? DEFAULT_PASS_THROUGH_RATIONALE);
    moveStage(dir, { id, to: stageForStep(domain, 'Execute'), expectedStage: currentStage, verify: planApproveVerify, role });
    releaseClaimOnExecuting();
    return { outcome: 'pass-through', id };
  }

  // tsk-5q5-1 (D2/D4): each child's verify only ever got checked as
  // non-empty (normalizeChild above) before this fix — never whether it
  // actually proves that child's own claim. One independent second-pass
  // check per child (tsk-1x3 D17: mechanical-only, see
  // verify-pattern-check.mjs's own header for what this no longer
  // catches), BEFORE any child is written: a disagreement on any one of
  // them parks the WHOLE decompose verdict as need-human (never a partial
  // write) — same fail-safe stance the heavy-risk gate above already
  // applies to this same edge.
  const disputedChild = verdict.children
    .map((child, index) => ({
      index,
      child,
      secondPass: judgeVerifySemanticCorrectness(child.verify),
    }))
    .find((entry) => !entry.secondPass.agrees);

  if (disputedChild) {
    const reason =
      `Việc con #${disputedChild.index + 1} ("${disputedChild.child.title}") có verify bị nghi ngờ ở vòng ` +
      `kiểm tra thứ hai: ${disputedChild.secondPass.reason}`;

    // tsk-25g D2: --force mirrors discover's own override (tsk-5cf D1b,
    // discovery.mjs) -- proceeds past a disputed child's second-pass
    // verdict instead of parking, EXCEPT when the disagreement is
    // mechanical (tsk-12t D6, a syntactic fact not a judgement call) or
    // the item is already parked `awaiting-human` from a PRIOR
    // discover/decompose call (continuing would advance stage while
    // status stays parked -- same refusal shape discovery.mjs already
    // applies).
    if (callerVerdict?.force === true && disputedChild.secondPass.mechanical !== true) {
      if (work.status === 'awaiting-human') {
        throw new StoreError(
          'validation',
          `plan --force: work "${id}" is already "awaiting-human" -- run "fgos answer ${id} --text ..." to resume it before retrying --force.`,
        );
      }
      addDecision(dir, {
        id,
        text: `plan --force overrode a disputed child verify: "${disputedChild.child.verify}"`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale: `second pass disagreed on child #${disputedChild.index + 1}: ${disputedChild.secondPass.reason}`,
      });
      // fall through -- proceed to write children below, same as no dispute
    } else {
      logDecomposeVerdict(dir, id, 'need-human', reason);
      putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
      return { outcome: 'need-human', id, verdict };
    }
  }

  // verdict.kind === 'decompose': child ids are positional — `${work.id}-<n>`,
  // n = 1-based sibling index (id-systems-audit.md #1) — so recursion into a
  // grandchild falls out for free: when a child is itself later decomposed,
  // its own `work.id` (already `<root>-<m>`) becomes the base, producing
  // `<root>-<m>-<n>` with no special-case code.
  //
  // tsk-4n8: reconciled against any already-existing siblings first — a
  // verdict child whose title exactly matches an existing `parent === id`
  // item reuses that item's own real id (never re-`addWork`s it, which
  // would throw "already exists") instead of assuming a blank slate; a
  // verdict child with no match gets a fresh id, continuing the positional
  // sequence PAST the highest existing sibling suffix so it can never
  // collide with an id already taken. This is what lets a resubmission add
  // the still-missing children of a partially-materialized decompose
  // (priorDecomposeCompleted false, but some children already exist)
  // instead of every id recomputing from `-1` and colliding.
  const existingChildren = Object.values(view.work).filter((item) => item.parent === id);
  let nextNewSuffix =
    existingChildren.reduce((max, child) => {
      const suffix = Number(/-(\d+)$/.exec(child.id)?.[1]);
      return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
    }, 0) + 1;
  const childReconciliation = verdict.children.map((child) => {
    const normalizedTitle = child.title.trim().toLowerCase();
    const existing = existingChildren.find((item) => item.title.trim().toLowerCase() === normalizedTitle);
    if (existing) return { child, id: existing.id, alreadyMaterialized: true };
    const newId = `${work.id}-${nextNewSuffix}`;
    nextNewSuffix += 1;
    return { child, id: newId, alreadyMaterialized: false };
  });
  const childIds = childReconciliation.map((entry) => entry.id);

  // tsk-5e97 D1 (tsk-4n8 widened): check declared footprint overlap over
  // BOTH the tentative new children AND any already-materialized siblings'
  // own real, stored footprint -- footprintOverlapAmong already exists for
  // exactly this pairwise-candidate shape (merge-standardization
  // D4-revised). Widening past `verdict.children` alone matters here: a
  // resubmission that omits an already-materialized child's own spec (it
  // only lists the still-missing ones) must still have its NEW children's
  // footprints checked against that existing sibling's real footprint, not
  // only against each other. No bypass-detection constant here (unlike
  // keywordRiskGate/blastRadiusGate below): those gate on a static
  // property of the root item that never changes call to call, so without
  // a bypass a human's `fgos answer` would re-park on the identical reason
  // forever. This check is re-derived from the FRESH verdict every call --
  // once a human's answer leads the next call to propose non-overlapping
  // children, it passes on its own.
  const footprintCandidates = childReconciliation.map((entry) =>
    entry.alreadyMaterialized
      ? { id: entry.id, footprint: view.work[entry.id]?.footprint }
      : { id: entry.id, footprint: entry.child.footprint },
  );
  // A pair already connected by a declared `deps` edge (either direction)
  // can never run in parallel, so a shared footprint between them is not a
  // real dispatch hazard -- this is the `sequence` option
  // FOOTPRINT_CONFLICT_SUGGESTIONS already documents, honored here instead
  // of forcing every resolution through re-slicing. Scoped to this one
  // call site only (never touches footprintOverlapAmong itself): its other
  // callers all source candidates from an already deps-clear set (frontier/
  // syncClear), where this exemption would be a no-op, except one script
  // that intentionally checks raw, unfiltered siblings -- widening the
  // shared function would change that script's own semantics for no gain.
  const resolvedDepsById = new Map(
    childReconciliation.map((entry) => [
      entry.id,
      entry.alreadyMaterialized
        ? (Array.isArray(view.work[entry.id]?.deps) ? view.work[entry.id].deps : [])
        : entry.child.deps.map((depIndex) => childIds[depIndex]),
    ]),
  );
  const footprintConflicts = footprintOverlapAmong(footprintCandidates).filter(
    ({ a, b }) => !(resolvedDepsById.get(a) ?? []).includes(b) && !(resolvedDepsById.get(b) ?? []).includes(a),
  );
  if (footprintConflicts.length > 0) {
    const reason = formatFootprintOverlapReason(footprintConflicts);
    logDecomposeVerdict(dir, id, 'need-human', reason, `${footprintConflicts.length} footprint conflicts`);
    putInAwaiting(dir, { id, ask: formatProposalAsk(verdict, reason), statusAtAsk: work.status }); // tsk-40m P1 fix: statusAtAsk is informational only now; moveWork computes the resume-safe durableStatusAtAsk itself
    return { outcome: 'need-human', id, verdict };
  }

  // tsk-1gr D1/D2: completeness advisory -- computed fresh here regardless
  // of which branch produced `verdict` (caller-supplied never reads
  // lockedContext/repoRoot at all, per the tsk-27y branch above; this check
  // needs it either way, per D1's "unconditional, same as footprintOverlap").
  // ADVISORY ONLY: never parks, never blocks -- a hit is logged as its own
  // decision alongside the real decompose write below, not instead of it.
  // tsk-gio fix: wrapped in the same fail-safe try/catch discipline the
  // priority-refinement advisory above already uses -- an unwrapped
  // addDecision (store-lock contention, a corrupted item shape) used to be
  // able to throw and abort the decompose write below, directly
  // contradicting "never blocks" (found by independent review).
  try {
    const coverageRepoRoot = resolveContentRoot(stateRoot, id, work.docsRef);
    const coverageContext = readLockedContext(coverageRepoRoot, work.docsRef);
    const uncoveredDecisions = findUncoveredLockedDecisions(coverageContext, verdict.children, coverageRepoRoot);
    if (uncoveredDecisions.length > 0) {
      addDecision(dir, {
        id,
        text: `decompose completeness advisory: ${uncoveredDecisions.length} path(s) named in a locked decision have no child footprint covering them: ${uncoveredDecisions.join(', ')}`,
        source: 'resolvePlan',
        kind: 'engine',
        rationale:
          'tsk-1gr D1/D2: mechanical path-token check over CONTEXT.md\'s Locked decisions section -- advisory only, never blocks; see docs/explanation/auto-decompose-can-drop-a-locked-decision-from-every-childs-footprint.md for the failure mode this catches',
      });
    }
  } catch {
    // Swallowed intentionally, same fail-safe discipline as the
    // priority-refinement advisory above -- a failure computing or logging
    // this advisory must never abort the decompose write below.
  }

  childReconciliation.forEach(({ child, id: childId, alreadyMaterialized }) => {
    // tsk-4n8: already reconciled to a real existing sibling above --
    // never re-addWork it (would throw "already exists").
    if (alreadyMaterialized) return;
    addWork(dir, {
      id: childId,
      title: child.title,
      kind: child.kind ?? work.kind,
      status: 'todo',
      deps: child.deps.map((depIndex) => childIds[depIndex]),
      risk: child.risk ?? work.risk,
      refs: child.refs,
      footprint: child.footprint,
      verify: child.verify,
      // tsk-3xd D1/D3 (tầng 3 fix): the third and final layer this item's
      // three-layer bug named -- action now survives all the way from the
      // verdict (tầng 1) through normalizeChild (tầng 2) to the actual
      // work-item record, instead of being silently dropped here.
      action: child.action,
      // tsk-535 D2: description = the child's own title -- not action
      // (would just duplicate that field's content with no added
      // meaning). Closes the decompose-child half of the description gap
      // this item exists to fix.
      description: child.title,
      stage: stageForStep(domain, 'Execute'),
      parent: id,
      tier: work.tier,
      domain: work.domain,
    });
  });

  logDecomposeVerdict(dir, id, 'decompose', verdict.reason, `${childIds.length} children`);
  moveStage(dir, { id, to: stageForStep(domain, 'Execute'), expectedStage: currentStage, verify: planApproveVerify, role });
  releaseClaimOnExecuting();
  return { outcome: 'decompose', id, childIds };
}
