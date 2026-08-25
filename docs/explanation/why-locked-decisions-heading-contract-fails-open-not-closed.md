---
authoritative_for: why the "## Locked decisions" heading contract between plan.mjs's reader and fgos-coding-exploring's writer silently fails open on a non-literal heading, and why the fix widens the writer/adds a loud test instead of loosening the reader's regex
---

# Why the "Locked decisions" heading contract fails open, not closed

`src/intake/plan.mjs` (the reader, lines 159/344) slices a `CONTEXT.md`'s
decision table with a literal English regex:

```
/##\s*Locked decisions([\s\S]*?)(?:\n##\s|$)/i
```

`.agents/skills/fgos-coding-exploring/SKILL.md` (the writer) step 3 tells a
session to write "the locked decisions table with D-IDs," but never pins
the heading to that exact string. This repo's prose is mostly Vietnamese,
so a session writing `## Quyết định đã khoá` instead of `## Locked
decisions` is the natural outcome, not a fluke — it recurred live during
`tsk-1y6`'s own shaping session on 2026-08-15, caught only because that
session happened to read `normalizeChild` before handing the item off.

## The measured blast radius

A repo-wide scan (`docs/history/**/CONTEXT.md`) found 281 files, 275 with
at least one D-ID, 244 the reader can actually parse, and 31 (11%) where
the guard is silently switched off by a non-matching heading — the worst
case, `docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md`, had 14
invisible D-IDs.

## Why this is worse than its own precedent

The same *class* of bug already has a documented precedent
(`docs/explanation/gate-bypass-design.md`'s account of `tsk-5hg`: reader
logic being correct says nothing about whether the writer actually honors
the contract — that has to be checked separately). But `tsk-5hg`'s own
contract (the `## Outstanding questions` heading) fails **closed**: a
missing heading forces a stop and a person gets asked. This contract fails
**open**: a missing heading makes the guard disappear entirely, with no log
and no warning.

Two consumers depend on the same slice, and both degrade silently on an
empty result:

- `normalizeChild` (`plan.mjs:198`) wraps its D-ID citation check in
  `if (lockedDecisionIds instanceof Set && lockedDecisionIds.size > 0)` —
  an empty set skips the whole check, so a child citing a D-ID that does
  not exist (typo or hallucination) is accepted anyway. This is exactly
  the dispatch-blind-executor failure mode `tsk-3xd` D2's guard exists to
  block.
- `findUncoveredLockedDecisions` (`plan.mjs:344`) returns empty — read as
  "every decision has an owner" — even though nobody actually claimed any
  of them, and the same slice also feeds footprint extraction, so no path
  is seen there either.

## Why the obvious "loosen the regex" fix was rejected

The item's first pass framed this as three open directions needing product
judgment: (a) pin the literal heading in the writer (cheapest, but leaves
the 31 existing files blind), (b) loosen the reader's regex to accept
Vietnamese variants (fixes old and new files, but turns a strict contract
into language-guessing), (c) turn the empty-slice case into a loud signal
instead of a silent one.

A second pass, after two more measurements, closed (b) out entirely and
found no product decision was actually left:

- **Measurement 1 — is any of the 31 blind files still live?** Zero. Thirty
  belong to already-closed items (done/wontfix/delivered/retrospective/
  cleanup); one has no `docsRef` mapping at all. The blindness carries no
  live exposure — all remaining risk is forward-looking, toward the next
  `CONTEXT.md` someone writes with a Vietnamese heading.
- **Measurement 2 — what do the real heading variants actually look
  like?** At least two distinct phrasings plus a numeric prefix, drawn from
  the blind files themselves: `## Quyết định đã chốt`
  (`docs/history/tsk-1ia/CONTEXT.md`), `## Quyết định đã khoá`, and
  `## 2. Quyết định đã khoá (D1-D10, giữ đủ lịch sử — D4-D8 đã bị
  supersede, không xoá)` (`docs/history/gate-approve-vs-movenext-semantics/
  CONTEXT.md`).

Loosening the regex to match measurement 2's variants opens an
open-ended guessing list (two phrasings, a numeric prefix, and whatever
phrasing comes next) purely to serve files nobody reads anymore
(measurement 1), and would silently change behavior for 30 historical
records — guards currently being skipped would switch on, and children
that cited a nonexistent D-ID in the past could start being rejected
retroactively.

## The actual, narrowed scope

1. Pin the literal heading `## Locked decisions` into step 3 of
   `.agents/skills/fgos-coding-exploring/SKILL.md` (the canonical source;
   `.claude/skills` is generated via `npm run build:skills` and must be
   rebuilt and committed alongside it, per `test/skills/fgos-mirror.test.mjs`).
   This is the entire real fix, since the remaining risk is forward-only.
2. Add a guard test in the same family as
   `test/scripts/check-decision-citation-drift.test.mjs` (an existing
   precedent, no new mechanism): fail when a `CONTEXT.md` has a D-ID in its
   prose but the `## Locked decisions` slice is empty. This is what makes
   the next drift loud instead of silent — the same lesson `tsk-5hg`
   already established in `docs/explanation/gate-bypass-design.md`: pinning
   the writer without anything checking it still leaves the contract
   unproven.
3. Mechanically rename the 30 old files' headings to `## Locked decisions`
   — low value on its own, but needed so the new test in (2) can run
   unconditionally instead of filtering by item status. Each file needs to
   be opened and confirmed to have a real decision table of its own before
   renaming — the original count treated "a D-ID appears anywhere in the
   file" as a hit, so a few of the 31 are false positives that only quote
   another feature's D-ID rather than owning a table.

Explicitly rejected: loosening the reader's regex (above), and adding the
check to `fgos doctor` (this is documentation lint, not setup health — a
test is the more honest home, and doesn't require registering a new
`doctor` check for something that isn't a setup/config concern).

## Source

`tsk-3xog`, found while validating `tsk-1y6` (which was not blocked by
this — its own `CONTEXT.md` already used the correct heading, verified to
recover 9/9 D-IDs). `docs/history/tsk-3xog/` carries the fuller shaping
record.
