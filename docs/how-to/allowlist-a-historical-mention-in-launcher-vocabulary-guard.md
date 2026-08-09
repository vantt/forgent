---
type: how-to
title: How to allowlist a legitimate historical mention in launcher-vocabulary-guard.test.mjs
tags: []
source_capture_ids: [tsk-2uo]
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

## Related

- `test/docs/launcher-vocabulary-guard.test.mjs` — the guard itself,
  `ALLOWED_DIR_PREFIXES` and `ALLOWED_FILES` near the top of the file.
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md` — the
  decision record the rename (and this guard) exist to protect.
