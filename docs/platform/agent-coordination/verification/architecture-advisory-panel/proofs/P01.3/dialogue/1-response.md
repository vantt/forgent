Authorized under: `dispositions.md`'s D1 and D2.

## Final outcome of this advisory session

**Recommendation, as accepted by the person — attributed to its actual
sources, not merged into one voice:**

The panel's own `synthesis.md`/`explanation.md` (Phases 1-8) recommended:
keep the two pipelines and the existing shared runner, do not build a new
pluggable abstraction, close 3 named seams, and named two things as the
person's own call (breadth-gate required-vs-exempted; which reading of
"evolution is difficult" applies). The panel's synthesis was explicit
that it could not settle which of the two readings of "difficult" was
correct — that was the single fact that could flip the whole
recommendation, and no repository check available to the panel could
produce it.

At the person's own request, a separate, out-of-panel consultation
(kongming) independently re-investigated the real repository and
returned a **sharper, more decisive verdict**, which the person received
and accepted without objection:

- **Same direction, sharper cause.** Kongming agrees: no pluggable
  pipeline abstraction (option B). But it locates the actual root cause
  one layer down from where the panel's three shapers put it: not the
  three seams as independent facts, but a single missing layer — a
  shared point-in-time Parquet reader — whose absence is *why* two of
  the three seams exist and *why* the panel's own concrete test case
  (porting ATR/RVOL entry-planning into intraday) would cost meaningfully
  more than it needs to.
- **Question 1 (breadth-gate required vs. exempted) — the fork mostly
  dissolves, and this is now Coordinator-verified, not just kongming's
  claim:** intraday's `compute_signals_intraday` already loads the
  per-sector data (`sector_map["sectors"]`, with `sector_state`) needed
  to compute the breadth input EOD already supplies — from the exact
  same table. The premise that the data is *absent* for intraday was
  wrong; it is only *unwired* (independently confirmed against
  `signal_engine_intraday.py`/`signal_engine_intraday_loaders.py`).
  Kongming's recommendation: wire it (a few lines), and for genuine
  future absence, match the fail-closed posture intraday's sibling gates
  already use — an error-severity check on the intraday signals asset,
  which the existing DAG already blocks the alert-dispatch asset behind.
  No runner reordering needed; the panel's own concern about
  post-execution checks not being able to unsend a notification stands,
  but the fix is a DAG-level block on the *signals* asset, not a
  post-hoc check on the *alerts* asset.
- **Question 2 (which reading of "difficult") — kongming measured a
  concrete number rather than leaving it as an unresolved values
  question:** porting ATR/RVOL entry-planning to intraday costs roughly
  60-80 lines under the current structure (about half of that being a
  4th copy of the same hand-rolled loader pattern already duplicated 3
  times elsewhere), versus roughly 30-40 lines with a shared reader, with
  zero domain-logic duplication either way. Kongming's reading: the
  "silent drift" cause dominates over the "duplicate everything" cause,
  and the "duplicate everything" cost that does exist is specifically a
  loader-copy-paste problem — which a shared reader fixes and a pipeline
  abstraction would not.

## What is explicitly NOT claimed here

Per the lead advisor's own impact reading (`dialogue/1-impact.md`), the
person's `"ok"` licenses that the relayed verdict provoked no objection —
it does not formally ratify Questions 1 and 2 as decided. Both remain, in
the strict sense, matters the person could still reopen. This response
records what was accepted at read time, not a signed-off implementation
mandate.

## What this session does NOT do

Per this track's own Plan-Level Invariants, this advisory session — and
kongming's separate consultation — have no git or implementation
authority inside `vnflow`. Nothing here has been implemented. Whether and
when to act on kongming's ordered plan is a separate decision, outside
this session, exactly as it was for mdview in P01.2.

## Open item carried forward, not resolved by this turn

Kongming flagged one thing it could not verify without live-lake access:
whether intraday's bare-Parquet-read bug has actually been silently
blocking BUY signals in production since 2026-06-22, or is latent. One
specific check would settle it (grep `sig/signals_intraday` reasons for
`regime=None(blocked)` since that date). Not pursued in this session;
named here so it is not lost.
