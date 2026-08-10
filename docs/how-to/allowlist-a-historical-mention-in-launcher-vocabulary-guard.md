---
type: how-to
title: How to allowlist a legitimate historical mention in launcher-vocabulary-guard.test.mjs
tags: []
source_capture_ids: [tsk-2uo, tsk-5td, tsk-2lg, tsk-2au]
---
# How to allowlist a legitimate historical mention in launcher-vocabulary-guard.test.mjs

Use this when `node --test test/docs/launcher-vocabulary-guard.test.mjs`
fails because a real file legitimately mentions "orchestrator" — decision
0026's original name for the pick-1-rootTask + stand-up + step-out role,
renamed to "launcher" — without that file actually deploying the retired
term as live prose.

## Before you start

The guard's own header states its purpose plainly:

> "orchestrator" (decision 0026's original name for the pick-1-rootTask +
> stand-up + step-out role) was renamed to "launcher" throughout
> fgOS-owned prose. This test fails if "orchestrator" reappears outside
> the allowlist below, so the rename can't silently drift back.

Not every real appearance of the word is a drift-back regression. The
guard already distinguishes two separate reasons a path might legitimately
carry the term:

- **`ALLOWED_DIR_PREFIXES`** — a whole directory where "orchestrator"
  names a real, distinct, unrelated concept (e.g. `herdr-plugin/src/`'s
  Rust `PaneOrchestrator` trait) and was never touched by the rename at
  all.
- **`ALLOWED_FILES`** — a `Map` of individual file paths to a one-line
  reason each, for files that discuss the *retired* term as their own
  subject matter (decision records about the rename, history docs citing
  it, meta-citations of this guard test's own error text) rather than
  using it as live prose describing current behavior.

## Update (`tsk-2lg`): one recurring shape no longer needs a manual entry

`tsk-2uo`'s own experience (below) — 5 separate `ALLOWED_FILES` entries for
the same recurring shape, "an `iron-law-evidence.md` file quoting this
guard's own pre-existing-failure output as a worked example" — turned out
to repeat often enough (`tsk-33w`, `tsk-4eu`, `tsk-2uo` twice in one item)
that the guard now generalizes it structurally instead of by hand.
`IRON_LAW_EVIDENCE_META_CITATION`, a path-pattern regex
(`/^docs\/history\/[^/]+\/iron-law-evidence(-[^/]+)?\.md$/`), replaced 6
hand-added `ALLOWED_FILES` entries matching that shape:

> "Add `IRON_LAW_EVIDENCE_META_CITATION` regex exempting
> `docs/history/<id>/iron-law-evidence(-<suffix>).md`, replacing 6
> hand-added `ALLOWED_FILES` entries for the same recurring meta-citation
> shape."
> — real commit message, `45bf3cd5`, branch `fgw/tsk-2lg`

**What this changes for step 3 below**: any file matching
`docs/history/<id>/iron-law-evidence(-<suffix>).md` is now covered
automatically — do not add a manual `ALLOWED_FILES` entry for that shape
anymore; the negative check still catches a real "orchestrator" leak
outside that exact pattern. Every *other* legitimate-mention shape (a
decision record, a `DISCUSSION.md` entry, a different explanation doc, a
still-in-progress artifact) still has no safely generalizable pattern and
still needs its own individual `ALLOWED_FILES` entry via step 3, exactly
as before. The historical entries quoted in step 3 and the `tsk-2uo`
example below predate this generalization — kept as-is since they're an
accurate record of what those items actually did at the time, not a
stale instruction to repeat today.

## Update (`tsk-2au`): a second generalized shape — a frozen *phrase*, not a frozen *path*

`tsk-2lg`'s `IRON_LAW_EVIDENCE_META_CITATION` generalizes by **path
pattern** — any file whose path matches
`docs/history/<id>/iron-law-evidence(-<suffix>).md` is exempt regardless
of content. A second recurring shape doesn't fit that mold: any file,
anywhere, that legitimately cites `tsk-2xt`'s own item nickname —
`"herdr-orchestrator"` — trips the guard, and there's no fixed path
pattern to match, since a citation can land in any history doc that
mentions that item by name.

> "docs/history/fgos-terminal-close-autoclose/CONTEXT.md ... then
> tsk-3cs's DISCUSSION.md ... this recurred a 2nd time ... generalize the
> launcher-vocabulary-guard's herdr-orchestrator nickname citation into a
> frozen-phrase exemption (like tsk-2lg's IRON_LAW_EVIDENCE_META_CITATION),
> so future citations of tsk-2xt's item title don't need a new
> hand-added ALLOWED_FILES entry each time."
> — real item description, `tsk-2au`

The fix reused a *different* existing mechanism already in the same file
— `FROZEN_FILENAMES`/`FROZEN_PATTERNS`/`stripFrozenFilenames()`, built
for two frozen decision-doc filenames — rather than copying
`IRON_LAW_EVIDENCE_META_CITATION`'s path-regex shape, since
`"herdr-orchestrator"` is a hyphenated **phrase** that can appear inside
any file's prose, not a path shape. A new `FROZEN_PHRASES` list
(`['herdr-orchestrator']`) reuses the exact same wrap-tolerant
segment-join regex-building logic `FROZEN_PATTERNS` already has, so both
lists share one regex builder rather than duplicating it.

**Two real occurrences resolved differently**, which matters for how you
apply a frozen-phrase generalization: `merge-list-tree-bottleneck-
priority/DISCUSSION.md` had exactly one occurrence of the phrase, so
stripping it fully cleared the file — its now-redundant `ALLOWED_FILES`
entry was removed. `fgos-terminal-close-autoclose/CONTEXT.md` had five
occurrences, only one of which was the frozen phrase — the other four
were unrelated legitimate senses (an industry "orchestrator" usage, the
Rust `PaneOrchestrator` trait) already covered by that file's own
`ALLOWED_FILES` reason. Its entry had to *stay*, just with its reason
string tightened to name only the still-relevant justification —
stripping a frozen phrase does not automatically mean the whole file
becomes exempt if other real "orchestrator" mentions remain in it.

A self-check test locks the boundary the same way
`IRON_LAW_EVIDENCE_META_CITATION`'s own self-check does: confirms
`"herdr-orchestrator"` strips to empty, while a bare `"orchestrator"`
(no `"herdr-"` prefix) still trips the guard afterward — so the pinned
role itself stays caught, only the specific nickname compound is exempt.

## Steps

1. **Confirm the failure is real drift-back, not a legitimate mention.**
   Read the offending file's actual context around the word. If it's
   describing the rename itself, quoting a historical decision, or citing
   this guard test's own pre-existing-failure output, it's a candidate
   for allowlisting, not a regression to fix by rewriting the file.

2. **Never retroactively edit historical evidence files** (decision
   records, `docs/history/*/iron-law-evidence.md`, `RECONCILIATION.md`,
   or similar). These are frozen records of what happened — allowlist
   them instead of rewriting their prose to dodge the guard.

3. **Add an entry to `ALLOWED_FILES`** in
   `test/docs/launcher-vocabulary-guard.test.mjs`, matching the existing
   entries' shape — path as key, a one-line reason as value, citing the
   nearest precedent entry's reasoning when the situation matches one
   already there:

   ```js
   ['docs/history/backlog-execution-reconciliation/RECONCILIATION.md', 'reconciles against docs/backlog.md\'s own STR27 row -- same fleet-orchestrator reserved-future sense already allowlisted there'],
   ['docs/history/tsk-33w-capacity-dispatch-command-audit-field/iron-law-evidence.md', 'meta-citation of this guard test\'s own pre-existing-failure report (quotes the guard\'s error text describing itself), not prose deploying the pinned term'],
   ```

4. **Be careful with still-in-progress artifacts.** A file that's a live,
   in-progress working document for a *different*, still-open item (e.g.
   another session's `next-session-prompt.md`) isn't yours to rewrite
   mid-session even if it currently trips the guard — allowlist it with a
   reason naming why it legitimately discusses the term as its own subject
   matter, and leave the actual content for whoever owns that item to
   clean up:

   > `['plans/260808-2210-dispatch-vocabulary-rearrange/next-session-prompt.md', 'tsk-5td\'s own working prompt for its dispatch-vocabulary-rearrange session -- discusses "orchestrator" as its own subject matter ... not prose this item has authority to rewrite mid-session']`
   > — real allowlist entry, added by `tsk-2uo`

5. **Re-run the guard test** and confirm both the negative test (no
   unallowlisted offenders) and the self-check test (real allowlisted
   paths aren't vacuously exempted) pass:

   ```
   node --test test/docs/launcher-vocabulary-guard.test.mjs
   ```

## What this looked like on a real run (`tsk-2uo`)

Five real files tripped the guard at once, discovered as a side effect of
an unrelated item's full `npm test` run, and confirmed pre-existing at
that branch's own fork point before being treated as in scope:

> "test/docs/launcher-vocabulary-guard.test.mjs con fail: 5 duong dan leak
> chu 'orchestrator' ... Phat hien khi lam tsk-592 ... npm test day du hit
> dung loi nay, xac nhan pre-existing tai branch fork point (69f5fb6),
> khong lien quan tsk-592."
> — real work item description, id `tsk-2uo`

Four of the five were historical evidence/reconciliation files that
should never be edited retroactively; the fifth
(`next-session-prompt.md`) was a different item's (`tsk-5td`) live
working artifact. The plan originally intended to leave that fifth file
untouched, but that left the guard test itself red — the guard cannot
distinguish an "expected still red, someone else's problem" offender from
a real regression:

> "scope grew from 4 to 5 allowlisted files during implementation --
> added next-session-prompt.md ... plan originally left tsk-5td's
> next-session-prompt.md untouched (live in-progress artifact), but that
> left this item's own verify (the guard test) red since the guard cannot
> distinguish an expected-still-red offender from a real one."
> — real `work.decision` capture, id `tsk-2uo`

The fix landed as five additive `ALLOWED_FILES` entries, no rewrite of
any of the five files' actual content.

## A second real case (`tsk-5td`): the guard itself postdates your own branch's fork point

`tsk-5td` (closing out `docs/history/dispatch-concept-boundary/
DISCUSSION.md` itself, a long-lived branch far behind `main`) hit this
guard from the opposite direction of the `tsk-2uo` example above: not a
different item's file discovered as a side effect, but the very file this
item's own branch had been authoring the whole time, discussing D17
(orchestrator is the T0 aggregate layer) the same legitimate way the
decision record and other `DISCUSSION.md` entries already do:

> "docs/history/dispatch-concept-boundary/DISCUSSION.md legitimately
> discusses D17 ... same reasoning already used for the other
> DISCUSSION.md entries and for decision 0029's own allowlist entry
> covering the same D17. Caught by `fgos approve`'s post-merge verify
> since this guard test postdates this branch's own fork point; merged
> main forward first to pick it up."
> — real commit message, `0ff244a6`, branch `fgw/tsk-5td`

The lesson this adds: a long-lived branch (this one was 215+ commits
behind `main`) can fork *before* `launcher-vocabulary-guard.test.mjs`
even existed, or before it grew stricter — so `npm test` on the branch's
own tree stays green locally right up until `approve`'s post-merge verify
runs against the merged result and the guard fires for the first time.
Merging main forward into the branch before allowlisting surfaces this the
same way any other newly-added guard would; the fix is the same additive
`ALLOWED_FILES` entry step 3 already describes, just for a file the
branch itself authored rather than one discovered as someone else's
side effect.

## Related

- `test/docs/launcher-vocabulary-guard.test.mjs` — the guard itself,
  `ALLOWED_DIR_PREFIXES` and `ALLOWED_FILES` near the top of the file.
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md` — the
  decision record the rename (and this guard) exist to protect.
