---
authoritative_for: pre-commit hook content-precedence guard on .fgos/*, refuses regressed line counts on main checkout, closes manual git merge bypass of fgos approve, distinct from tsk-1vc and tsk-56u
---

# A pre-commit guard closes the one path `fgos approve`'s own refusal can't reach: a manual `git merge`

`tsk-1i3` fixed a real confirmed incident — commit `e921fdb4`
(2026-08-20) overwrote 4 live `.fgos/*.jsonl` files on `main` with stale
`fgw/tsk-6al` branch content, restored 58 seconds later by `165bc0cb`
(the same incident already noted as a side-observation in
[`tsk-6al`'s own doc](fgos-return-skip-redundant-verify.md)). This item is
its authoritative fix-scope.

## The item's own premise was false — found before any code was written

The item was submitted asking for a fix inside `merge.mjs`'s
`mergeRunnerItem`, claiming the merge-into-main mechanism only *warns* on
a `.fgos/` content regression. Discovery research checked this directly
and found it already false: `mergeRunnerItem` has staged every merge and
hard-aborted (`fgos-write-rejected`) on any `.fgos/` diff since
2026-08-17 — three days before the incident. The real event log for the
incident window proved it: a genuine `fgos approve` attempt on `tsk-6al`
at 22:33+07 correctly aborted ("main unchanged"); the actual incident
commit 18 minutes later has **zero** corresponding engine event —
meaning it never went through `fgos approve` at all, most plausibly a
manual `git merge` run directly on the shared main checkout.

That finding re-aimed the whole fix target: `merge.mjs`'s guard is
already correct but can only ever fire *inside* `fgos approve`'s own call
path — it cannot close a gap a manual `git merge` bypasses entirely. The
real fix target became `.githooks/pre-commit`, which per its own header
fires for **every** `git commit` against the shared checkout regardless
of actor (human, agent, or CI).

## Distinct from the two adjacent guards already in that same hook

`.githooks/pre-commit` already carried two `.fgos/`-related checks before
this item, and neither covers the incident's actual shape (a commit with
`HEAD=main` that **modifies**, not deletes, `.fgos/*.jsonl` content with
a regressed version):

- `tsk-56u`'s `stagedFgosDeletions` — only staged **deletions**
  (`--diff-filter=D`).
- `tsk-5pb`'s `stagedFgosChangesOnWorkerBranch` — only fires when `HEAD`
  is a `fgw/*` branch, never on `main` itself.

Also distinct from [`tsk-1vc`'s guard](eventlog-guard-fail-closed-event-count-checkpoint.md),
which covers a different mechanism entirely: silent event-history
reversion from a concurrent-write race during normal operation, not a
merge/commit landing regressed content on purpose or by accident.

## What shipped

A new `stagedFgosModificationsRegressLineCount(committingToplevel)`
function in `.githooks/pre-commit` (commit `fc6de76e`), gated per the
item's own locked decisions:

- **Scope: content-precedence on the default branch only** (D1/D2) —
  skips immediately when the current branch matches `/^fgw\//`; applies
  to any commit modifying `.fgos/*` on `main`, not narrowed to merge
  commits specifically (a single-parent append-only commit like the
  periodic checkpoint auto-commit is trivially compliant, so parent-count
  narrowing would add complexity the invariant doesn't need).
- **Heuristic: per-file line-count non-decrease** (D4) — for each staged
  `.fgos/*` modification (`--diff-filter=M`), reads both `HEAD:<path>`
  and the staged `:<path>` blob via `git show`, counts `\n` via a
  `countLines` helper, and collects any path where the staged count is
  strictly lower than `HEAD`'s into `regressedPaths`. Deliberately a
  cheap, synchronous-hook-safe check — not full content-hash/semantic
  diffing — sufficient to catch the observed failure class (bulk content
  loss, e.g. `events.jsonl` losing 352 lines) without adding real latency
  to every commit.
- **Hard refuse, no bypass flag** (D3) — any git-command failure while
  reading blobs is itself treated fail-closed (`refuse()` with an error
  message, never silently skipped); any regressed path refuses the commit
  outright, pointing at `docs/how-to/fix-fgos-write-rejected-merge-block.md`
  for recovery. Chosen over `tsk-1ji`'s detect-and-warn shape deliberately:
  that shape exists because it runs on every claim/return call where a
  false positive would block legitimate high-frequency work; this guard
  sits only on the rare main-checkout commit path, so that cost doesn't
  apply here.

**Note for whoever next touches this area**: as of this doc's own
writing, `docs/how-to/fix-fgos-write-rejected-merge-block.md` — the
recovery doc this guard's own refusal message points at — still does not
exist on disk (also already flagged as missing from
[`tsk-2f6`'s own doc](fgos-write-rejected-structural-deadlock.md)). A
person hitting this refusal currently has no linked recovery doc to read.

## A same-day follow-up fix

`e2affe8c` (same day, ~1 hour later) raised `execFileSync`'s default 1MB
`maxBuffer` — smaller than `.fgos/events.jsonl`'s real size (10MB+) — which
had been silently breaking **every** commit touching that file with
`ENOBUFS`, wrongly refused as "could not read blob." This blocked all
commits to the live event log on `main` from the moment `tsk-1i3` first
landed until this follow-up fixed it about an hour later.

## Not a duplicate

`tsk-56u`, `tsk-5pb`, `tsk-1vc` — each already delivered, each covering a
distinct mechanism (see above). This item neither repeats nor supersedes
them, only closes the one remaining path — a manual `git merge` on the
shared main checkout, entirely outside `fgos approve` — that none of them
could reach.
