# plan.md — tsk-67t: audit of commit 7bf76aaa (row 1 of the 5-instance table)

Mode: tiny

Flag count: 0 (no auth, authorization, data-model change, external
system, public-contract change, cross-platform surface, or
existing-covered-behavior change — the plan itself makes no production
code change at all). The item's title reads "AUDIT" and its subject is a
potential data-loss shape, but the flag gate scores what THIS PLAN does,
not the topic under investigation (`fgos-coding-planning` step 2); this
plan's only action is recording an already-gathered, already-verified
finding and closing the item — that is a couple of docs files and one
`fgos move` call, squarely `tiny`.

impact-analysis posture: `full` (GitNexus registered and `present`,
checked live via `fgos tool query --capability impact-analysis --status
present`) — not exercised here since no symbol is touched; recorded for
completeness per the capability-gate note in `CLAUDE.md`.

`fgos graph --what-if tsk-67t --json`: `unblocksTransitive: 0`,
`newlyReady: []` — this item does not gate any other item's frontier, so
ordering is not a concern.

## Approach

**Chosen path: verify-and-close, no code change.** Discovery stage
(round 1 in `RESEARCH.md`, this same directory) already ran the exact git
archaeology the item's description asked for — `git show`, `git diff` at
the blob level between the merge commit and its two parents, and between
the merge commit and current `main` HEAD — and found both open questions
resolve clean:

1. tsk-5nj's plan-split content (`plan.md`, `CONTEXT.md`, `RESEARCH.md`
   under `docs/history/tsk-5nj-state-json-write-only-cost/`) is present on
   `main` today, byte-identical to the commits that authored it
   (`18b90ab8`, `b076b638`), and its two split children (`tsk-4mx`,
   `tsk-49e`) both completed to `status: done`.
2. tsk-648's own retrospective-synthesis doc
   (`docs/explanation/why-fgos-review-crashed-with-enobufs-on-stale-branch-diffs.md`)
   survived the same merge, was never modified after, and is properly
   tagged on the item (`outcome.docType: "explanation"`,
   `outcome.docPath` pointing at the exact file).

No content was lost. The merge that produced `7bf76aaa` has the same
*mechanical shape* tsk-2oy's root-cause fix targets (an unrelated second
parent absorbed via `fgos-compounding`'s plain `git commit` completing an
already-staged merge), but in this specific instance it happened to
preserve both trees cleanly — this is a mislabeling-only instance, not a
content-loss instance. There is nothing to fix.

**Alternative considered and rejected:** re-run the full remediation
tsk-2oy applied to `tsk-4v6` (re-merge with correct attribution) even
though no content is actually missing here. Rejected — that remediation
exists to recover LOST content; there is none to recover in this
instance, so applying it would be a no-op edit with no functional
difference, purely for label cosmetics on a 8-day-old merge commit
already reachable and already correctly content-complete. Rewriting
history for cosmetic-only reasons is out of scope and carries its own
real risk (rewriting a commit already merged to `main`) for zero benefit.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Conclusion correctness (no content lost) | Low — already proven with byte-level `git diff` (empty diffs) across three independent files plus a live status check on both split children | Already proven in `RESEARCH.md` round 1; re-stated here, not re-derived |
| Item classification (kind/status on close) | Low — this repo's status vocabulary supports closing a verified-non-issue via `done` with a decision note; no `wontfix` distinct status exists in this domain's FSM for "investigated, found nothing" (superseded/wontfix are for items overtaken by other work, not this shape) | `src/state/workflow-stage-graphs.mjs` DOMAINS.coding status vocabulary (spot-checked below) |

No medium/high risk item on this map — no proof point is deferred to
`fgos-coding-validating` beyond re-affirming the same evidence already in
`RESEARCH.md`.

## Shape

One piece, no split (see below). The item proceeds as itself:

1. Record the audit conclusion as a `fgos decision` on the item citing the
   evidence (commit SHAs, file paths, diff results).
2. No code, test, or doc changes beyond this feature's own
   `docs/history/tsk-648-retrospective-synthesis-content-audit/{RESEARCH.md,plan.md}`
   (already written) — the item's own description already carries the
   full investigation narrative; updating it is optional prose polish, not
   required for closure.
3. Verify: `npm test` (the item's existing, real verify field — a repo
   that still passes its full suite is the only proof this no-op change
   needs).
4. Return and approve through the normal lifecycle
   (`fgos return` → `fgos approve`), landing an audit-conclusion commit
   (this `plan.md`/`RESEARCH.md` pair) on `main`.

## Split decision

**No split.** This is one honest, small piece of work (an audit
conclusion, not a fix) — `fgos-coding-validating` should read this as
`pass-through`.

## Outstanding questions

None
