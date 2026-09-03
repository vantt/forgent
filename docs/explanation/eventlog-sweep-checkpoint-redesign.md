---
authoritative_for: sweep checkpoint redesign, retiring dedicated periodic events.jsonl commit, sweeping dirty .fgos/events shards into a merge/approve commit, sparse fallback interval, Tang B repurposed, retired legacy seq-contiguity surface (tsk-3tp coordinating parent)
---

# Retiring the dedicated periodic `.fgos/events` checkpoint commit — swept into the next real merge instead

`tsk-3tp` is the coordinating parent for repurposing what was originally
scoped as "Tầng B" (workers writing `.fgos/` inside their own worktree —
closed permanently, never attempted, ADR0020 stays unreversed) into a
different, narrower redesign once [Tầng A (`tsk-3ve`)](eventlog-tier-a-multifile-content-hash-redesign.md)
landed as its required dependency: a **sweep checkpoint redesign**.

## The problem this closed

The dedicated periodic-checkpoint commit for `.fgos/events`
(900s/50-event threshold, `src/state/events-jsonl-truncation-guard.mjs`)
moved `main`'s `HEAD` continuously — every open `fgw/*` branch had to
catch up and re-verify (~6 minutes) frequently just to stay current. Root
cause (from the original 2026-08-21 investigation report): of ~23,847
events, roughly 40% of coordination visibility (move/stage/add) already
came from the **working-directory append** on the main checkout, visible
immediately, before any commit — the periodic commit itself only ever
served durability/history, never visibility. The dedicated commit
mechanism was solving a problem that didn't need its own commit at all.

## The design (D2, from the item's own shaping)

1. Remove the dedicated periodic-checkpoint-commit mechanism and its
   `checkpoint.eventThreshold` tuning entirely.
2. **Sweep**: whenever a merge/approve commit that advances `main` is
   about to land anyway, gather up any dirty `.fgos/events/` shards into
   that same commit — piggybacking on activity that was going to move
   `HEAD` regardless.
3. A sparse fallback commit (~60 minutes, keyed on the oldest dirty
   shard's mtime, or end-of-session) for the case where no merge happens
   for a long stretch.
4. Between two merges, **zero** commit-metadata churn from `.fgos/`
   activity alone.

Upstream evidence cited directly: the harness commits changesets when its
orchestrator decides to (not on a hot path); beehive never commits
coordination activity at all. Neither upstream design lets a worktree
carry live state across a merge — ADR0020 stays exactly as locked, no
exception.

## Why this was unsafe before, and what made it safe now

The item's own text is explicit: this could not have shipped before
[Tầng A (`tsk-3ve`)](eventlog-tier-a-multifile-content-hash-redesign.md)
landed. Tầng A's per-writer sharding plus content-hash (`h`) identity, and
[`tsk-1i3`](pre-commit-fgos-content-precedence-guard.md)/`tsk-56u`'s
already-closed git-clobber vectors, were exactly the reasons the 900s
checkpoint cadence existed in the first place — a coarser cadence only
became safe once those were closed. `tsk-3ve` was a hard dependency, not
a preference.

## What shipped — two children, plus real follow-up fixes found after landing

- **`tsk-3tp-1`** (`453dbd4a`) — removed the dedicated interval/event-count
  periodic-commit branch; added the sparse fallback keyed on the oldest
  dirty shard's mtime (`checkpoint.fallbackIntervalSec`, default 3600s);
  `merge.mjs` now sweeps dirty/untracked files under `.fgos/events/` and
  `.fgos/events.jsonl` into its own staged merge commit before it lands.
- **`tsk-3tp-2`** (`92e533a8`) — retired the legacy `events.jsonl`
  seq-contiguity surface entirely: `seq` stopped being cross-writer
  identity once Tầng A gave every writer its own per-writer file
  (content-hash `h` is the real identity now), and `baseline-0` no longer
  receives new appends. Removed `.gitattributes`' `merge=union` entry for
  `events.jsonl`, `src/state/events-jsonl-contiguity.mjs`, both
  `scripts/events-jsonl-contiguity.mjs`/`check-events-seq-contiguity.mjs`,
  and the `events-jsonl-contiguous` doctor check/fix pair.

## A real bug found post-merge — the sweep silently no-op'd for a whole class of merges

Not part of either child's own original scope, found and fixed
afterward: the sweep computed its `.fgos/events*` pathspecs relative to
`repoRoot` and ran `git status`/`add` with `cwd: repoRoot` — but `.fgos`
only ever exists under `lockRoot` (ADR0020 strips it from every ephemeral
worktree). Whenever `lockRoot` differed from `repoRoot` — every
leaf→parent approve and promote-engine merge — the pathspec resolved
*outside* the ephemeral worktree, git refused it as "outside repository,"
and the error was silently swallowed. The shard was never swept for that
entire class of merges. Fixed (`c784cb9e`) by resolving/running both
against `lockRoot` instead, mirroring the existing `fgosDir`/
`runOpportunisticMainCheckoutChecks` pattern already used nearby in the
same function; `lockRoot` defaults to `repoRoot` so the root→main approve
path was unaffected. A regression test using two separate real repos
(`repoRoot` and `lockRoot`) reproduces the silent no-op pre-fix.

## A premise correction — `events.jsonl` wasn't fully frozen after all

`tsk-3tp-2` retired `merge=union` for `events.jsonl` assuming it was
fully frozen post-sharding. That assumption turned out false: at least
one write path (`fgos edit`) still appends to it directly (tracked
separately as `tsk-1t2`). Fixed (`836bd800`) by restoring the
`merge=union` safety net so any further growth on that path still merges
cleanly instead of tripping `fgos-write-rejected` on a real content diff.

## A related but separate follow-up — moving diagnostic logs off git tracking

Not part of `tsk-3tp`'s own scope, but directly motivated by its own
"52 commits/16h" churn measurement: `approve-post-success-faults.jsonl`,
`main-checkout-guard-warnings.jsonl`, `changelog-nag-history.jsonl`,
`entropy-history.jsonl`, and `invocation-faults.jsonl` were git-tracked
at `.fgos/` root and rewritten on nearly every command, keeping `git
status` permanently dirty and contributing to the same churn class. None
of these is the event log itself — each is a standalone diagnostic record
already kept out of `events.jsonl`'s own write path by its own author.
Moved into the already-gitignored `.fgos/logs/` bucket, with their now-dead
`merge=union` entries removed. Pre-commit's `.fgos-deletion` guard —
which blanket-blocks any deletion under `.fgos/` with no exception for a
deliberate untrack migration — refused this commit; bypassed with
`--no-verify`, explicitly approved by the user for that one commit.

## Documentation drift caught and corrected afterward

A separate pass (`89352d50`) found three docs still describing the
now-deleted contiguity mechanism as current:
`events-jsonl-lost-update-race`'s own explanation doc, a truncation
how-to, and `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`
(discovered mid-fix, referencing the deleted
`check-events-seq-contiguity.mjs` as still wired into `npm test`). All
three were marked historical and repointed at the actual current
mechanism (Tầng A's sharded `.fgos/events/` layout plus this item's
merge-time sweep/fallback commit). Other `.fgos/*.jsonl` `merge=union`
entries ([`tsk-2xg`](catchup-manual-merge-fgos-write-rejected-deadlock.md))
were confirmed untouched and still valid at the time — those entries were
later superseded, not by this item, by moving their target files off git
tracking entirely (see that item's own doc for the full timeline).

## Not a duplicate

[`tsk-3ve`](eventlog-tier-a-multifile-content-hash-redesign.md) — the
hard dependency this item builds on, not superseded. `tsk-1t2` — tracks
the still-live `fgos edit` direct-append path this item's `836bd800`
correction had to route around, not fixed here.
