---
authoritative_for: events.jsonl Tier A redesign — content-hash identity, per-session file sharding, multi-file replay, incremental fast-path, compaction, doctor gates (tsk-3ve coordinating parent)
---

# Tier A: redesigning `.fgos/events.jsonl` around content-hash identity and per-session files

`tsk-3ve` is the coordinating parent for a structural redesign of the
shared event log — borrowing the harness's own data-structure shape
(many small files, content-hash identity, gated compaction) while
deliberately NOT borrowing its write location: every write still lands on
the main checkout, ADR0020 stays unreversed (worktrees still never carry
`.fgos/`). A "Tier B" (worktrees writing their own changesets, actually
reducing main-checkout load) was explicitly named as a *separate* item
needing its own confirmation — not attempted here.

## The motivating problem, restated precisely

`seq` was a per-writer self-assigned counter — when two sources (two
branches/sessions) wrote a new event from the same fork point, both could
stamp the *same* `seq` on two *different* events. Union-merge
(`.gitattributes merge=union`, `tsk-3wq`) could reconcile the content but
left duplicate `seq`s needing `events-jsonl-contiguity.mjs` to resequence
after the fact — a patch applied after the fact, not a safe design from
the start. This is the exact mechanism behind a real 2026-07-28 data loss
(`aa9ae156`/`9e3fb469`, `tsk-n4i`).

## A live incident during the item's own shaping — reinforcing its own motive

Documented directly in the item's own `CONTEXT.md`: during round-1
shaping (2026-08-23, ~10:29-10:33Z), 7 `fgos decision` commands (TA-D0
through TA-D6) each exited `0` but their events never appeared in
`.fgos/events.jsonl` on the main checkout — no checkpoint commit ever
contained them (`git log --all -S` confirmed), no gap in other sessions'
interleaved `seq` in the same window, not found in any worktree or global
store, and the truncation guard never fired. Same class as
[`tsk-1vc`'s own silent loss](eventlog-guard-fail-closed-event-count-checkpoint.md)
— exit-0-but-lost. All 16 decisions were re-recorded with read-back
verification. This incident became live evidence reinforcing the item's
own premise: a single shared file is not trustworthy even when the CLI
reports success.

## The locked design (17 decisions, `TA-D0` through `TA-D15` plus the incident record)

- **TA-D1 — identity: content-hash, not seq.** Each event's identity
  becomes a 16-hex-char (64-bit) SHA-256 truncation over the JSONL line's
  content — deterministic, order-independent. `seq`/`ts` become
  descriptive/display fields only, no longer the primary key. 16 hex was
  judged sufficient at fgOS's real observed scale (~1000 events/day,
  birthday-bound collision probability ~1/145M/year, analyzed in the
  cited investigation report).
- **TA-D2 — per-session file sharding.** Each session appends to its own
  file under `.fgos/events/`, git-tracked, instead of everyone appending
  to one shared `events.jsonl`. Two concurrent writers become two
  differently-named files — never a git conflict (git only conflicts when
  two sides edit the *same* file) — retiring the long-term need for
  `merge=union` on new writes.
- **TA-D9 — a `src` field, stamped before hashing.** Every new event
  carries `src` (the writer id from `resolveWriterIdentity`); the hash is
  computed over the line *including* `src`, so two genuinely different
  events from different writers are never byte-identical by construction.
- **TA-D7 — total replay order: `(ts, filename, seq-within-file)`.**
  Deterministic, preserves per-writer causality; plain `ts`-only sort was
  rejected because it leaves ties undefined when two files share a `ts`.
- **TA-D3 — `replay.mjs` reads a directory, not a file.** Source discovery
  now gathers every file under `.fgos/events/` (excluding `archive/`) plus
  the legacy `events.jsonl`, sorts by in-content `ts`, and reuses
  `foldEvents`/`applyEvent` unchanged.
- **TA-D8/TA-D4 — incremental read keeps its shape, changes its unit.**
  `state.json`'s existing incremental-anchor-read (`tsk-49e`) keeps its
  mechanism; the anchor unit changes from a single byte-offset to a list
  of consumed files plus an offset into the file still open. The fast
  path only fires when every new event's `ts` is strictly greater than a
  new `maxTs` anchor field; any doubt falls back to a full rebuild.
- **TA-D12 — migration: no rewrite of the existing 23K-line file.** The
  current `events.jsonl` becomes `baseline-0`, kept as-is, still a real
  replay source; the new write path only writes to `.fgos/events/`. A
  one-time cutover, no dual-write; `merge=union` stays on the legacy file
  but is not applied to the new per-session files.
- **TA-D10 — truncation guard and periodic checkpoint rescope to the
  directory.** In scope for Tier A (piece T5) rather than deferred.
- **TA-D11 — naming: `<writer-id>-<openTs>.jsonl`.** One open file per
  writer; same-session processes keep appending to it. An UNRESOLVED
  writer id (fallback to pid) creating one file per invocation is an
  accepted degraded mode, cleaned up later by compaction.
- **TA-D13 — compaction, gated.** Only merges files whose writer is
  dead/idle past a threshold, runs under `events.lock`, and only
  `git mv`s into `archive/` once a verify gate passes; replay dedupes by
  hash at all times (legacy path deduped by line content), so a crash
  mid-compaction is structurally harmless. Threshold picked from real
  measurement, its own config key.
- **TA-D14 — the lock stays directory-wide.** Multi-file sharding
  eliminates git-level conflicts but not local races; the CAS
  precondition plus `refreshView`-inside-lock (`tsk-1q5`) still need one
  critical section — a per-file lock was explicitly rejected as wrong.
- **TA-D5/TA-D6 — compaction trigger and gate.** Trigger reuses
  `tsk-1vc`'s already-locked event-count-based checkpointing (D2), no new
  schedule invented; a new `fgos doctor` check (deep-equal view + event
  count + hash-set comparison) gates publishing a compacted baseline.
- **TA-D15 — explicitly deferred, not in scope.** A SQLite view layer for
  `state.json` was considered and explicitly excluded from Tier A —
  `state.json` stays JSON; a future item would only be justified once
  parse/rewrite cost crosses a felt threshold (measured baseline noted:
  8.1MB/1013 items, 67ms read + 70ms parse per call).

## What shipped — six pieces, split by the item's own plan (T1–T6), each landing exactly as designed

Split into 6 children specifically because of `risk:heavy` and a
landing-evidence gate — each merged individually into `fgw/tsk-3ve`
before the whole branch merged to `main` (`ed0d8bf0`):

- **`tsk-3ve-1`** (`5b8a122a`) — `src/state/events.mjs`: the content-hash
  identity + `src` stamping (TA-D1/TA-D9).
- **`tsk-3ve-2`** (`1ee694d6`) — `src/state/store.mjs` (+209/-62 lines):
  the per-session write-path sharding (TA-D2/TA-D11).
- **`tsk-3ve-3`** (`69313c04`/`f36c2287`) — `src/state/replay.mjs`:
  multi-file discovery and hash-based dedupe (TA-D3/TA-D7).
- **`tsk-3ve-4`** (`4371eab3`/`32a8ddca`) — `src/state/replay.mjs`
  extended further (+186/-33 net over T3's file): restores the
  incremental-read fast path for multi-file logs (TA-D8/TA-D4).
- **`tsk-3ve-5`** (`33916721`) — `src/state/events-jsonl-truncation-guard.mjs`
  + `src/setup/registrations.mjs`: rescopes the truncation guard and
  periodic checkpoint to the directory (TA-D10).
- **`tsk-3ve-6`** (`b723729d`) — new `src/state/events-compaction.mjs`
  (257 lines) + a new `fgos doctor` registration: the gated compaction
  mechanism itself (TA-D5/TA-D6/TA-D13).

Each child's own `docs/history/tsk-3ve-<n>/plan.md` (committed alongside
its merge) is the per-piece detail; this doc covers the coordinating
design. A notable trait of this item, worth naming directly: all 17
locked decisions from the shaping rounds landed in the shipped code
essentially as designed — a rare case where discovery/planning's own
premises held all the way through implementation, unlike several
adjacent items in this same log ([`tsk-3ofc`](loop-descendant-dedup-false-premise.md),
[`tsk-2lq`](merged-tree-verified-disjoint-main-advance.md)) whose plans
needed correction after contact with real evidence.

## Not a duplicate

[`tsk-3wq`](events-jsonl-concurrent-data-loss-investigation.md) (the
union-merge driver this item's own D2 begins retiring for new writes, but
does not remove — legacy `events.jsonl` keeps `merge=union`),
[`tsk-1vc`](eventlog-guard-fail-closed-event-count-checkpoint.md) (guard
reliability + the event-count checkpoint trigger this item's TA-D5
reuses rather than re-deriving), `tsk-49e` (the incremental `state.json`
read this item's TA-D4 extends rather than replaces).
