---
type: how-to
title: How to resolve ambiguous multi-target errors from an impact-analysis provider
tags: []
timestamp: 2026-08-19T13:25:26.000Z
source_capture_ids: [tsk-5nz]
framework: diataxis
mode: how-to
---

# How to resolve ambiguous multi-target errors from an impact-analysis provider

Use this when the impact-analysis capability's active provider (today:
GitNexus — see `CLAUDE.md`'s "Impact-analysis capability gate", which is
explicit that GitNexus is only the first registered provider, not the
only one) indexes more than one repo/target on this machine, and a query
(`impact`/`context`/`explain`/`trace`/`pdg_query`, or an equivalent tool
from a future provider) errors because it cannot tell which target you
mean — for example "Multiple repositories indexed" or "Repository not
found".

## Before you start

Do not retry with anything guessed. Two guesses that both look
reasonable are confirmed wrong in practice (see the real reproduction
below):

- Copying the `repo`/target value verbatim out of the error message's own
  display string — that string is for a human to read, not guaranteed to
  be a value the tool accepts back.
- Falling back to a bare short name (e.g. `forgent`) hoping it is
  unambiguous — it can silently resolve among several registered targets
  sharing that name (including unrelated worktrees of the same repo),
  with no second error to catch the mistake.

## Steps

1. **Look at the erroring MCP server's own tool list for a
   listing/discovery tool** — a tool whose name suggests enumeration
   (list/search/discover). For GitNexus this is `list_repos`
   (`mcp__gitnexus__list_repos`).
2. **Call it and read back the exact registered identifiers.** For
   GitNexus, each entry carries a `scanTarget` field — the absolute path
   the repo was indexed from.
3. **Match your current project by that stable, absolute-path field —
   never by a human-readable label.** A real reproduction on this machine
   (2026-08-19) listed six registered repos, three of them sharing the
   display name `forgent`:

   ```
   marketing-cockpit
   forgent (/home/vantt/projects/forgent/repo)
   forgent (/home/vantt/projects/forgentX)
   forgent (/home/vantt/projects/forgentX/.claude/worktrees/tsk-2qc-2cfwQQ)
   forgent (/home/vantt/projects/forgentX/.claude/worktrees/tsk-48w-Q2nOev)
   beegog
   ```

   Passing back `repo: "forgent (/home/vantt/projects/forgentX)"` — copied
   verbatim from that same list — failed with `Repository "forgent
   (/home/vantt/projects/forgentX)" not found`. Passing back the bare
   `repo: "forgent"` did not error a second time, but silently returned
   `impactedCount: 0` for a target that plausibly exists in the intended
   repo — consistent with having resolved to the wrong one of the three
   repos sharing that name.
4. **Retry the original query with the exact identifier you matched in
   step 3.**

## Why this exists

The capability gate in `CLAUDE.md` is deliberately written to be
impact-analysis-provider-agnostic — GitNexus is named as "the first
registered provider... not the only one this gate can ever recognize."
This how-to keeps that same posture: the steps above name no provider by
requirement, only by today's one real example, so they stay correct if a
different provider is ever registered.

Two wrong retries look equally plausible without this doc — reusing the
error's own display string, or guessing a short name — and the second one
is the more dangerous of the two: it does not error again, it just quietly
answers about the wrong repo. That is the failure mode this how-to exists
to close, not the first (louder, self-announcing) one.
