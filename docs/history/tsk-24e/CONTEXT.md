# tsk-24e — events.jsonl concurrent data-loss, post-fix gap — locked decisions

## Feature boundary

`.fgos/events.jsonl` is git-tracked in the one shared main checkout that
every concurrent fgOS session writes against. Three prior fixes
(tsk-1q5, tsk-3wq, tsk-2tm) already closed three real race classes on
this file. Fresh live evidence recorded directly on this item (2026-08-20:
tsk-6al, tsk-4oq, tsk-5dnt, tsk-1el) shows data loss continuing to happen
AFTER those fixes landed. Discovery research
(`docs/history/tsk-24e/RESEARCH.md`) traced this
to a real, never-implemented gap: nothing commits `.fgos/events.jsonl`
automatically, so it sits uncommitted for long stretches, exposed to a
concurrent session's raw `git reset --hard`/`git checkout -f` on the
shared main checkout — a vector the `union` merge driver (tsk-3wq) does
not cover (it only fires on merge-class git operations, never on
checkout/reset). This item's scope is closing that specific gap: (1) a
guard that reacts to a dangerous raw force-checkout/reset threatening
uncommitted `.fgos/events.jsonl` content, and (2) an auto-commit cadence
that shrinks how long that file sits exposed uncommitted in the first
place. Out of scope: re-litigating the three already-fixed race classes,
or the tsk-1el stale-`main-checkout-lock` correlation (settled below as
coincidental, no follow-up).

**Correction (Round 2, same day):** the "never-implemented gap" framing
above was wrong on one factual point — `tsk-cgg` (done, merged) already
built a real detector (`src/state/events-jsonl-truncation-guard.mjs`,
`fgos doctor`-registered). The actual gap is detection cadence/wiring, not
absence, and `tsk-1ji` (already claimed and in `planning` by a different,
concurrent session, `deps: [tsk-24e, tsk-cgg]`) is already carrying a
properly-scoped fix for it — see D3 and `RESEARCH.md` Round 2. tsk-24e's
own remaining scope narrows accordingly: D1/D2 stay as valid guidance for
whoever implements, but this item itself does not duplicate tsk-1ji's
plan.

## Reasoning behind D1 and D2

D1 (guard behavior) and D2 (commit cadence) were locked live in
conversation on 2026-08-20 after presenting trade-offs for each; the full
reasoning behind each choice is recorded here since the rendered table
below only holds the one-line decision text.

**D1 — detect-and-warn, never block.** Blocking was considered and
rejected: no clean git-native pre-reset/pre-checkout-force hook exists
without real plumbing risk (the closest primitive, the
`reference-transaction` hook, is real but nontrivial — an implementation
question left to `fgos-coding-planning`, not decided here), and a
false-positive block would refuse a person's own legitimate recovery
operation, a worse failure mode than the data loss it prevents.
Detect-and-warn matches this repo's existing `events-jsonl-contiguous`
doctor-check precedent (detect + `fgos doctor --fix`, never refuses an
operation: `src/setup/registrations.mjs:1177-1183`).

**D2 — time-based periodic auto-commit.** Per-verb-call was rejected:
real `git commit` overhead on every single mutating call across
potentially many concurrent sessions, plus `git log`/`git blame` noise.
Checkpoint-only (e.g. at `return`/`approve`) was rejected: it reproduces
the exact gap already observed today — tsk-4oq sat through 15-20 events
over roughly an hour, all uncommitted, before any checkpoint would have
fired. Time-based periodic directly bounds the quantity that actually
matters (wall-clock exposure window), matching the observed failure shape
rather than a proxy for it (verb-call count, or an item's own lifecycle
checkpoint that says nothing about how long a single stage takes).

**D3 — scope narrows to diagnosis, defer implementation to tsk-1ji.**
Discovered at planning time (`fgos graph tsk-24e --json`): `tsk-cgg` (done)
already implemented a real detector for this exact class of loss, and
`tsk-1ji` (already open, `deps: [tsk-24e, tsk-cgg]`, actively being planned
by a different concurrent session) already root-caused this item's own
fresh evidence to that same mechanism and is carrying forward a fix shape
matching D1/D2. Writing a second, independent implementation plan on
tsk-24e would duplicate tsk-1ji's own in-flight work. User decision
(2026-08-20, live conversation): tsk-24e stays a thin pass-through —
D1/D2 remain recorded here as guidance for whoever implements the fix
(most likely inside tsk-1ji's own plan), but this item's own `plan.md`
does not re-derive that implementation itself.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | Stronger, second-hand live evidence (2026-08-20, ~09:52 UTC, same session as this item's own submission): tsk-4oq's ENTIRE event history vanished from .fgos/events.jsonl -- not just one event like tsk-6al. tsk-4oq was fully driven this same session (pick, discover, plan, gate-approve, multiple decision/handoff calls, report, return, approve -- roughly 15-20+ events over about an hour) and confirmed delivered via fgos approve. Minutes later, fgos list --id tsk-4oq now reports status:doing, stage:executing (reverted, not delivered), and grep -c tsk-4oq .fgos/events.jsonl returns 0 -- zero trace of any of those events. The underlying git commit (a60c4ad0, Merge branch fgw/tsk-4oq) IS safely on main (confirmed via git merge-base --is-ancestor) -- code is NOT lost, only the .fgos event/state record. Notably the direction is opposite a simple stale-snapshot-overwrite theory: tsk-4oq's events (chronologically EARLIER in this session) are gone while tsk-24e's own creation event (chronologically LATER, submitted near the end of the same session) survived intact -- ruling out 'some other session just reverted the whole file to an older snapshot.' Looks more like a selective loss of one item's mid-file event span rather than a wholesale rollback. This strengthens the case that .fgos/events.jsonl's write path has a real concurrency gap under genuine multi-session load on a shared main checkout, independent of git's own durability. |
| — | Third independent live instance (2026-08-20, ~09:19-09:52 UTC session): tsk-5dnt's own mid-session event span (docsRef edit, footprint edit, verify sync, discover --verdict clear, gate-approve, second pick -- roughly seq 22182-22201, ~9 events over ~15min) vanished from .fgos/events.jsonl between two of the same session's own consecutive fgos calls. Confirmed via: (1) each call returned a real, incrementing seq at the time it ran; (2) a later fresh 'fgos list --id tsk-5dnt --json' read reported stage:discovery/status:todo/docsRef:undefined -- i.e. reverted to the item's pre-session state, not just one missing field; (3) grep on the live events.jsonl for those seq numbers around that window shows a gap -- events immediately before (seq ~22167-22169, this same session's own earlier work.add/work.edit/executor.dispatch calls) and immediately after (seq 22170+, OTHER concurrent sessions' work.add calls including tsk-24e's own creation) are both present and intact. This matches this item's own decision above (tsk-4oq case): a selective mid-file span loss for one item's own event range, not a wholesale file rollback -- consistent with the stale-read-then-full-rewrite race this item's description already hypothesizes (a concurrent writer's compare-and-swap-less read-modify-write silently discarding another writer's already-committed-looking appends). Underlying git work was unaffected in this case too -- the item's docs/history/ commits on fgw/tsk-5dnt survived (git commits are a separate, unaffected mechanism from the events.jsonl live-state log). Recovery used: re-ran the exact same sequence of fgos verb calls a second time (discover/plan/gate-approve/pick) against the item's still-intact git branch/docs, which succeeded cleanly and the item went on to a real return/approve/merge. Adds a third data point without changing tsk-64o's own open hypothesis or proposed fix direction (temporary durable logging at the write points) -- no new scope, just corroborating evidence with exact seq numbers for whoever picks this up next. |
| — | Second live reproduction (tsk-1el, 2026-08-20 ~09:12-09:20): fgos return reported real success (from:doing, to:awaiting-approval, passed:true, seq:22207) but the write never landed durably -- a fresh fgos list --id minutes later showed status back at doing, stage executing, and the item's own parkReason field still stuck on a value (human-question) that should have cleared 20+ minutes earlier at fgos answer time. Raw .fgos/events.jsonl had zero trace of the return event or of two prior fgos report calls I made (their own reported seq values, 22168/22207, exceeded the file's actual max seq at read time). fgos lock-status at the moment of discovery showed outcome:stale, holderPid a DIFFERENT session's string identity (not mine), lockAgeMs 517034 (8m37s), remainingTtlMs 0 -- a stale lock from another concurrent session's operation overlapping the exact window my return call ran in. Re-running fgos return afterward (lock now free) landed durably on the first try (seq 22214, confirmed by a fresh read). This correlates the data-loss window with a concurrently-held, since-expired main-checkout lock from a different session's identity -- a candidate lead for the discovery scope's own open question about withLockRetry/CAS protection under real concurrent multi-session load. Branch/commits themselves were never at risk (git history stayed fully intact throughout) -- only the .fgos/ event-log bookkeeping of the transition was lost. |
| D1 | guard behavior for a raw force-checkout/reset threatening uncommitted .fgos/events.jsonl is detect-and-warn, never block -- matches this repo's existing events-jsonl-contiguous doctor-check precedent (detect + fgos doctor --fix, never refuses an operation). Blocking rejected: no clean git-native pre-reset/pre-checkout-force hook exists without real plumbing risk, and a false-positive block would refuse a person's own legitimate recovery operation, a worse failure mode than the data loss it prevents. |
| D2 | auto-commit cadence for .fgos/events.jsonl on the shared main checkout is time-based periodic (a fixed wall-clock interval, independent of how many fgos verb calls happened), not per-verb-call and not checkpoint-only. Per-verb-call rejected: real git-commit overhead on every single mutating call across potentially many concurrent sessions, plus git log/blame noise. Checkpoint-only (e.g. at return/approve) rejected: reproduces the exact gap already observed today -- a long multi-step stage sits uncommitted for the whole stage duration. Time-based periodic directly bounds the quantity that actually matters (wall-clock exposure window), matching the actual observed failure shape. |
| — | auto-approved CONTEXT.md gate for tsk-24e at level standard |
| D3 | tsk-24e's own remaining scope narrows to evidence-gathering/diagnosis (already complete), not an independent implementation of D1/D2. tsk-cgg (done) already built a real code-level detector (src/state/events-jsonl-truncation-guard.mjs, fgos doctor-registered) -- Round 1 research's claim that no guard existed was wrong. tsk-1ji (currently claimed/planning by a different concurrent session, deps: [tsk-24e, tsk-cgg]) already root-caused this item's own fresh evidence to the exact tsk-cgg-diagnosed mechanism (git stash reverting the tracked uncommitted tail) and is already carrying forward a fix shape matching D1/D2 (higher-frequency detection wiring, or guarding fgOS's own git operations directly). D1/D2 stay valid as guidance for whoever implements the fix; tsk-24e itself will not duplicate tsk-1ji's plan. |

## Pinned terms

- **The guard** — the detect-and-warn mechanism from D1, scoped to a raw
  `git reset --hard`/`git checkout -f`/`checkout --force` on the shared
  main checkout that would discard uncommitted `.fgos/events.jsonl`
  content. Ordinary `git checkout <branch>` is explicitly NOT in scope —
  git already refuses that itself when it would silently discard
  uncommitted tracked changes (confirmed in RESEARCH.md Round 1); the
  guard only concerns the FORCE variants that bypass that native
  protection.
- **The cadence** — the time-based periodic auto-commit mechanism from D2.
  The exact interval value and the trigger/scheduling mechanism (a
  background loop, a hook on existing periodic infrastructure, etc.) are
  implementation choices left to `fgos-coding-planning`.

## Scout evidence cited

- `src/state/store.mjs:137-152` — `withEventsLockAndRefresh` (tsk-1q5 fix,
  confirmed present).
- `.gitattributes` (repo root) — `.fgos/events.jsonl merge=union`
  (tsk-3wq fix, confirmed present).
- `scripts/events-jsonl-contiguity.mjs`,
  `src/setup/registrations.mjs:1177-1183` — `events-jsonl-contiguous`
  doctor check/fix pair (tsk-3wq, confirmed present) — the detect-and-warn
  precedent D1 follows.
- `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` — tsk-2tm's
  own scope (torn-read fix on the lock file, a different failure mode).
- `grep -rln "\.fgos" src/runner/*.mjs | xargs grep -l "git.*commit"` and a
  read of each hit — confirmed no code path ever runs a real `git commit`
  on `.fgos/events.jsonl` automatically; the word "commit" in
  `claim-port.mjs` refers to `moveWork`'s state event, not a git commit.
- `grep -rn "acquireMainCheckoutLock" src bin` and `src/state/` (empty) —
  confirmed `main-checkout-lock` is consulted only by `claimWork`
  (pick/take) and `merge.mjs` (approve/merge), never by `discover`/
  `return`/`edit` — the structural basis for treating tsk-1el's stale-lock
  correlation as coincidental.
- Full round detail, citations, and the research verdict:
  `docs/history/tsk-24e/RESEARCH.md`.
- Impact-analysis capability gate: `fgos tool query --capability
  impact-analysis --status present` → GitNexus registered, `present`,
  freshly checked this session (2026-08-20) — posture **full**. No
  scout evidence above depended on GitNexus blast-radius data; recorded
  per the gate's own completeness requirement.

## Canonical references

- `docs/history/tsk-1q5-events-jsonl-lost-update-race/plan.md` — the
  original root-cause-B "Outstanding question" this item closes.
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/plan.md` —
  tsk-3wq's actual (merge-time-only) scope, and why a `merge.mjs` change
  was rejected there (its own guard already aborts on any `.fgos/` path).
- `docs/history/main-checkout-lock-toctou-race/CONTEXT.md` — tsk-2tm's
  scope, cited above to distinguish it from this item.
- `docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md` — tsk-cgg
  (done), the real detector D3 discovered already exists.
- `docs/history/events-jsonl-merge-abort-truncation-gap/` — tsk-1ji's own
  docsRef (not yet on the main checkout as of this writing; lives on
  branch `fgw/tsk-1ji`), the item now carrying this fix forward.

## Outstanding questions

None
