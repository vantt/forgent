---
authoritative_for: fgos list --id --fields flag, lightweight state-read projection, distinct from tsk-483/tsk-5dnt payload fixes, events.jsonl concurrent-session loss and resubmission
---

# `fgos list --id --fields` — a lightweight projection for the common re-read

`tsk-4zr` closed a real cost distinct from two already-fixed payload
bugs: even a correctly-scoped `fgos list --id <id> --json` still embeds
the *full text* of every decision rationale, research round, and gate
record ever logged on that one item, unbounded, with no lightweight
projection — legitimate accumulated history, not a leak.

## Distinct from two prior fixes — same symptom, different causes

- **`tsk-483`** (done) fixed the *bare* `fgos list` (no `--id`) being
  3.1MB by excluding every open item's cross-cutting logs.
- **[`tsk-5dnt`](list-id-callthreads-leak-fix.md)** fixed `list --id`
  leaking *other items'* `callThreads` into a single-item view — a real
  leak of foreign data.
- **This item** addresses neither: even with zero leak and correct
  scoping, one item's *own* accumulated history (many rounds of
  decisions/gates/discovery on a long-running item) has no way to be
  read cheaply — the full historical arrays always came back, whether
  the caller needed them or not.

## Confirmed live

Driving `tsk-4gc` through discovery/planning/validating/implement, `fgos
list --id tsk-4gc --json` grew to 119.5KB after roughly 10 rounds of
decision/gate-approve/discover calls on that single item. Every
single-item state read that session — at least 6 separate times, once
per driving-loop iteration plus ad-hoc Orient reads — had to be piped
through a throwaway `node` script just to extract 3-6 fields (`stage`/
`status`/`holder`/`title`/`docsRef`/`verify`). This directly costs
`fgos-coding-driving`'s own loop, whose Step 1 rule requires re-reading
the item's stage/status fresh every iteration, never reusing a
snapshot — on a long-running or heavily-discussed item, this compounds
every single iteration.

## What shipped

An opt-in `--fields <comma-separated-list>` flag on `fgos list --id`
(`bin/fgos.mjs`). When passed, the response drops every historical array
(`decisions`, `discovery`, `gates`, `settlements`, `outcomes`,
`frictions`, `learnings`, `decisionsById`, `callThreads`) entirely and
returns only the requested live-pointer fields from an allowlist:
`stage`, `status`, `holder`, `title`, `docsRef`, `verify`, `parent`,
`id`, `domain`, `kind`, `risk`, `tier`. An unknown field name or an empty
list is a validation error, not a silent no-op. Purely additive — the
default (no `--fields`) behavior is unchanged, so existing callers reading
the full historical shape keep working exactly as before.

## A concurrent-session data-loss incident along the way

This item was originally submitted as `tsk-4zr` on 2026-08-20, but that
submission — along with a sibling item, `tsk-2zo`, submitted the same
session — disappeared from `.fgos/events.jsonl` entirely: confirmed by
direct grep, zero trace. The event log's tail showed a seq/timestamp
inversion consistent with the file being reset to an earlier snapshot
mid-session, most likely from another concurrently active session
holding the main-checkout lock for a different item at the time. Both
items were re-submitted verbatim (with this note added) at the user's
request, and `.fgos/events.jsonl` was checkpointed afterward to recover
them. No root-cause fix for the underlying loss mechanism shipped as
part of this item — it is named here as a real, confirmed incident, not
a resolved one.
