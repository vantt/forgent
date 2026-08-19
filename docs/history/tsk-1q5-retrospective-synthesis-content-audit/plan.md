# plan.md — tsk-4dy: audit of commit a23ec8a1 (row 3 of the 5-instance table)

Mode: tiny

Flag count: 0 (no auth, authorization, data-model change, external
system, public-contract change, cross-platform surface, or
existing-covered-behavior change — the plan itself makes no production
code change at all). The item's title reads "AUDIT" and its subject is a
potential data-loss shape, but the flag gate scores what THIS PLAN does,
not the topic under investigation (`fgos-coding-planning` step 2); this
plan's only action is recording an already-gathered, already-verified
finding and closing the item — a couple of docs files and the normal
lifecycle calls, squarely `tiny`.

impact-analysis posture: `full` (GitNexus registered and `present` on
this machine, per `CLAUDE.md`'s capability gate) — not exercised here
since no symbol is touched; recorded for completeness.

## Approach

**Chosen path: verify-and-close, no code change.** Discovery stage
(round 1 in `RESEARCH.md`, this same directory) already ran the exact git
archaeology the item's description asked for — `git log`/`git show`/`git
diff` at the commit and blob level between the merge commit and its two
parents, `git merge-base --is-ancestor` against current `main`, and a
live `fgos show tsk-1q5 --json` outcome check — and found both open
questions resolve clean:

1. tsk-13m's real content commit (`201672f0`, "add Iron Law
   failing-test-first proof for the ppidOf timeout") is a direct ancestor
   of `main` today, with a clean single-commit file history for
   `docs/history/tsk-13m/iron-law-evidence.md` — no truncation, no
   conflict-marker corruption.
2. tsk-1q5's own retrospective-synthesis doc write
   (`docs/explanation/events-jsonl-lost-update-race-under-concurrent-
   session-writes.md`) survived the same merge, is present on `main`
   verbatim today, and is properly tagged on the item
   (`outcome.docType: "explanation"`, `outcome.docPath` pointing at the
   exact file).

No content was lost. The merge that produced `a23ec8a1` has the same
*mechanical shape* tsk-2oy's root-cause fix targets (an unrelated second
parent — here, a self-sync "merge main into fgw/tsk-13m" commit —
absorbed via `fgos-compounding`'s plain `git commit` completing an
already-staged merge), but in this specific instance it happened to
preserve both trees cleanly: this is the `tsk-psb`-documented "fourth
case" pattern (a decomposed/synced branch's own recorded commit is only
ever a sync merge, not a feature commit, so its absorption carries no
content the target ref does not already have through the real route).
Mislabeling-only, not content-loss. There is nothing to fix.

**Alternative considered and rejected:** re-run the full remediation
tsk-2oy applied to `tsk-4v6` (re-merge with correct attribution) even
though no content is actually missing here. Rejected — that remediation
exists to recover LOST content; there is none to recover in this
instance, so applying it would be a no-op edit with no functional
difference, purely for label cosmetics on an 8-day-old merge commit
already reachable and already correctly content-complete. Rewriting
history for cosmetic-only reasons is out of scope and carries its own
real risk (rewriting a commit already merged to `main`) for zero benefit.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Conclusion correctness (no content lost) | Low — already proven with `git merge-base --is-ancestor` against current `main` plus a single-commit file history check and a live outcome-field check | Already proven in `RESEARCH.md` round 1; re-stated here, not re-derived |
| Item classification (kind/status on close) | Low — this repo's status vocabulary supports closing a verified-non-issue via `done` with a decision note; no distinct `wontfix`/`superseded` status fits "investigated, found nothing" (those are for items overtaken by other work, not this shape) | `src/state/workflow-stage-graphs.mjs` DOMAINS.coding status vocabulary; same conclusion tsk-67t's own plan.md reached auditing the sibling instance (`docs/history/tsk-648-retrospective-synthesis-content-audit/plan.md`) |

No medium/high risk item on this map — no proof point is deferred to
`fgos-coding-validating` beyond re-affirming the same evidence already in
`RESEARCH.md`.

## Shape

One piece, no split (see below). The item proceeds as itself:

1. Record the audit conclusion as a `fgos decision` on the item citing the
   evidence (commit SHAs, file paths, diff/ancestry results) — done via
   the `discover --verdict clear` call itself (auto-records a
   `caller-supplied` decision), reinforced by this `plan.md`.
2. No code, test, or doc changes beyond this feature's own
   `docs/history/tsk-1q5-retrospective-synthesis-content-audit/{RESEARCH.md,plan.md}`
   (already written) — the item's own description already carries the
   full investigation narrative; it stays as-is since it already matches
   reality (re-scanned per the item's own "[MUST khi bắt đầu]" standing
   instruction — every fact in the description checks out against real
   git history, no drift found).
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
