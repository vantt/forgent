# tsk-2k0 — plan.md

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). Docs-only change
to two mirrored `SKILL.md` files, no code touched. One direct task, no
gray areas.

## Approach

Add a named hazard section to `.claude/skills/fgos-fanout/SKILL.md` and
its `.agents/` mirror (byte-identical today, per RESEARCH.md Round 1),
stating plainly that concurrent worktree-entering dispatch is unsafe at
the harness level right now: worktree-isolation state is held at
SESSION level, not per-agent, so the skill's own "dispatch one Agent per
id, single message, running in parallel" loop step (line 200-203) can
clobber sibling agents' isolation state, causing write refusals and, in
the worst case, a full deadlock. Cite the two real incidents
(tsk-1y0/tsk-2k0's own decision logs, both 2026-08-13) as evidence, not
speculation.

**Alternatives rejected:**
- Removing or softening the "single message, running in parallel"
  instruction itself — rejected. That instruction describes the
  environment's own actual dispatch mechanism (independent Agent calls in
  one message run in parallel regardless of what this skill's prose
  says); removing it would misdescribe how dispatch actually works. The
  item's own description is explicit: "fgOS cannot patch [the harness]...
  the work here is to establish whether fanout can dispatch
  worktree-entering agents concurrently at all, and if it cannot, to say
  so in the skill" — naming the hazard, not rewriting the mechanism.
- Lowering `fgos-fanout`'s own batch-size cap (currently up to 5) as a
  mitigation — rejected as out of this item's scope. The item's own
  conclusion (RESEARCH.md, both source items) is that NO isolation
  strategy tried so far (none, or `isolation:"worktree"`) makes concurrent
  `/fgOS:pick` dispatch safe — so a lower cap does not remove the hazard,
  it only lowers its probability. Deciding a new cap (or a serialization
  strategy) is a product/design decision for tsk-1y0 itself (still open,
  `todo`), not something this documentation-only item should decide as a
  side effect.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `.claude/skills/fgos-fanout/SKILL.md` + `.agents/` mirror | light | Both files are prose only — no runtime behavior to break. `npm test` stays green (nothing code-level touches these files); the new hazard-section heading is grep-checked present in both; a scope-boundary check confirms no `src/`/`bin/` file was touched. |

No medium/high risk items — pure documentation addition, no code path.

**Impact-analysis posture:** Not applicable — no code symbol is touched,
so `CLAUDE.md`'s impact-analysis capability gate (blast-radius evidence)
has nothing to analyze. `impact-analysis: inactive` for this item, by
scope, not by tool availability (GitNexus itself is present and fresh,
per tsk-5zg's own plan.md check moments earlier on the same session).

## Shape

Single piece, no split — one docs section, mirrored across two files.
Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches a `SKILL.md` path, so that doc's guidance is binding): verify
needs a POSITIVE (new deliverable exists) and, where meaningful, a
NEGATIVE. There is no old *false* claim to prove removed (the file never
explicitly asserted concurrent dispatch was safe — it just never warned),
so the NEGATIVE here is a scope-boundary check instead (the same pattern
that how-to doc's own self-referential example uses): confirm this diff
never touches `src/` or `bin/`, proving the fix stayed documentation-only
as intended.

Verify (strengthened from discovery's placeholder — a bare `grep -q
"worktree"` was already trivially true before any edit, RESEARCH.md Round
1):

```
npm test && grep -q '## Known hazard: concurrent worktree-entering dispatch is unsafe at the harness level' .claude/skills/fgos-fanout/SKILL.md && grep -q '## Known hazard: concurrent worktree-entering dispatch is unsafe at the harness level' .agents/skills/fgos-fanout/SKILL.md && ! git diff --name-only main...HEAD | grep -qE '^(src|bin)/'
```

## Outstanding questions

None
