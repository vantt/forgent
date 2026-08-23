---
type: reference
title: "`fgos list`'s side-log scoping"
tags: [list, pagination, cli]
timestamp: 2026-08-11T11:50:00.000Z
source_capture_ids: [tsk-483]
---

# `fgos list`'s side-log scoping

`fgos list`'s response always includes `work` (a map of items) plus eight
side-logs: `decisions`, `discovery`, `gates`, `settlements`, `outcomes`,
`frictions`, `learnings`, `decisionsById`. Before `tsk-483`, every one of
these side-logs was returned **unconditionally in full** — regardless of
how many items `work` actually contained. Against this repo's own real
backlog (86 open items), that meant `decisions` alone carried 1771
entries, `outcomes` 399, `settlements` 386, `discovery` 258, `learnings`
225, `gates` 212, `decisionsById` 246 — a plain `fgos list` call measured
3.1MB (~800K tokens), larger than most agents' own context windows.
`--limit` only trimmed `work` itself, saving about 6%, because the
side-logs — not `work` — dominated the payload.

## Current behavior

Every side-log is now scoped down to **the same id set actually present
in the returned `work` map**, for every call shape except one protected
exception:

| Call shape | Side-logs scoped to |
|---|---|
| `fgos list` (bare default, no flags) | the open items actually returned |
| `fgos list --id <id>` | that one id (unchanged — already correct since `tsk-2u9`) |
| `fgos list --cursor <c> --limit <n>` (any combination, including with `--all`) | the ids on that page |
| `fgos list --all --json` (no `--cursor`/`--limit`) | **not scoped — returns the full, unfiltered side-logs, forever** |

The last row is a permanent, deliberate exception: `herdr-plugin/src/
fgos.rs` (a separate Rust crate outside this repo's own Node build/test
surface) parses exactly that call shape — `["list", "--all", "--json"]`
verbatim, never combined with pagination flags — as a public external
contract. Every other combination was free to change shape; this one was
confirmed, by reading its three real call sites directly, to never read
any of the fields that scoping would remove.

Measured effect on this repo's own real backlog: bare `fgos list` dropped
from 377KB to 15KB with `--limit 5` — a 25x reduction, driven almost
entirely by the side-logs shrinking along with `work`, not by `work`
itself.

## Mechanism

`scopedById(section)` — the single-id filter `tsk-2u9` already proved
safe for `list --id` — generalized to `scopedByIds(section, idSet)`,
applied *after* the existing child-visibility filter and *after*
pagination slicing, so it always reflects the final id set actually being
returned:

- id-keyed dicts (`discovery`, `gates`, `settlements`, `outcomes`,
  `frictions`, `learnings`, `decisionsById`): filtered to `{[id]: v[id]}`
  per id present in the set.
- the flat `decisions` array: filtered by `d.id` membership in the set.
- `tools`: never touched — keyed by tool name, not by item id.

## If you're an agent reading the backlog

Prefer `fgos list --id <id>` for one item, or `fgos list --limit <n>` for
a bounded page, over a bare `fgos list` call — the response now stays
proportional to how many items you actually asked to see.
