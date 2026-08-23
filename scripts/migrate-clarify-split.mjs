#!/usr/bin/env node
// migrate-clarify-split.mjs -- tsk-puz (docs/history/fanout-and-delegation-
// rubric/CONTEXT.md D12), retargeted by tsk-qod (D1/D2, docs/history/
// discover-stage-graph-and-skill-layering/CONTEXT.md): `clarify` retires
// as a stage entirely (moved to a pre-item-creation Init helper), so this
// migration now sorts EVERY item still sitting at stage `clarify` into the
// right of the two baskets that remain:
//
//   - has a real locked decision (decisionsById, or a real
//     committed CONTEXT.md under its own docsRef), OR was never
//     touched at all (no decision, no locked CONTEXT.md)        -> `discovery`
//     (tsk-qod D1: `clarify` is retired, so "never touched" no
//     longer has anywhere to stay -- it lands at the same machine-
//     alone research stage a "has decision" item already got,
//     since both are simply "an existing item with no clarify pass
//     left to run")
//   - parked mid-Socratic-question (`status: 'awaiting-human'`)
//                                                           -> `exploring`
//     (already at the machine+human decision-lock stage --
//     routing it through `discovery` first would misrepresent
//     it as needing a machine-alone research pass it never
//     asked for; tsk-puz's own new `clarify -> exploring` edge,
//     workflow-stage-graphs.mjs, exists for exactly this jump)
//
// UNLIKE scripts/migrate-status-proposed-to-awaiting-approval.mjs and
// scripts/migrate-actor-to-role.mjs (raw event-log string-substitution),
// this migration needs the REPLAYED VIEW (status/decisionsById/docsRef per
// item) to decide, and writes through the real store door (`moveStage`,
// `role: 'system'` -- the same attribution `fgos retrospective`'s own bulk
// sweep already uses) instead of rewriting log lines directly.
//
// IDEMPOTENT BY CONSTRUCTION, not by a catch-and-ignore CAS retry: an item
// this script already moved is no longer at stage `clarify` on a rerun, so
// the very filter that selects candidates excludes it -- no `moveStage`
// call, no conflict, no special-casing needed.

import path from "node:path";
import { listWork, moveStage } from "../src/state/store.mjs";
import { readLockedContext, resolveContentRoot } from "../src/intake/plan.mjs";

/**
 * Decide the target stage for one `stage: 'clarify'` item, per tsk-qod D1.
 * Never throws -- a read failure inside `readLockedContext` already
 * degrades to "no locked context" (that function's own contract), so the
 * only outcome here is one of the two literal stage names that remain
 * once `clarify` retires.
 */
function targetStageFor(item, view, repoRootFor) {
  if (item.status === "awaiting-human") return "exploring";
  const decisions = view.decisionsById?.[item.id];
  if (Array.isArray(decisions) && decisions.length > 0) return "discovery";
  if (typeof item.docsRef === "string" && item.docsRef.trim()) {
    const repoRoot = repoRootFor(item);
    if (readLockedContext(repoRoot, item.docsRef).trim()) return "discovery";
  }
  // tsk-qod D1: `clarify` no longer exists to stay at -- an untouched item
  // (no decision, no locked CONTEXT.md) gets the same target a "has
  // decision" item already gets, since both are simply "an existing item
  // with no clarify pass left to run."
  return "discovery";
}

/**
 * Run the migration against the store at `dir` (the `.fgos` directory
 * itself, same convention every other store-facing script/test in this
 * repo uses). `dryRun: true` computes and returns the full plan without
 * calling `moveStage` at all -- read-only, safe to run against a live
 * store to preview first.
 */
export function migrateClarifySplit(dir, { dryRun = false } = {}) {
  const view = listWork(dir);
  const stateRoot = path.dirname(dir);
  // resolveContentRoot (tsk-1ni D1, already used identically by discovery.mjs/
  // plan.mjs): a locked CONTEXT.md may live in the item's own fgw/<id>
  // worktree rather than the state root -- resolved per item, memoized since
  // the same id never changes across this one script run.
  const repoRootCache = new Map();
  const repoRootFor = (item) => {
    if (!repoRootCache.has(item.id)) {
      repoRootCache.set(item.id, resolveContentRoot(stateRoot, item.id, item.docsRef));
    }
    return repoRootCache.get(item.id);
  };

  // tsk-qod D1: `targetStageFor` never returns `"clarify"` anymore (there
  // is nowhere left to stay), so there is no `leftAtClarify` basket to
  // track -- every candidate item moves.
  const movedToDiscovery = [];
  const movedToExploring = [];

  for (const item of Object.values(view.work)) {
    if (item.stage !== "clarify") continue;
    const target = targetStageFor(item, view, repoRootFor);
    if (!dryRun) {
      moveStage(dir, { id: item.id, to: target, expectedStage: "clarify", role: "system" });
    }
    (target === "discovery" ? movedToDiscovery : movedToExploring).push(item.id);
  }

  return {
    dryRun,
    totalClarifyItemsSeen: movedToDiscovery.length + movedToExploring.length,
    movedToDiscovery,
    movedToExploring,
  };
}

function parseArgs(argv) {
  const dirIdx = argv.indexOf("--dir");
  const dryRun = argv.includes("--dry-run");
  const dir = dirIdx >= 0 ? argv[dirIdx + 1] : undefined;
  if (!dir) {
    throw new Error("usage: migrate-clarify-split.mjs --dir <path-to-.fgos> [--dry-run]");
  }
  return { dir, dryRun };
}

function runCli(argv, cwd) {
  const { dir, dryRun } = parseArgs(argv);
  const resolvedDir = path.resolve(cwd, dir);
  const report = migrateClarifySplit(resolvedDir, { dryRun });
  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.cwd());
}
