---
authoritative_for: docs/routing-handoff-contract.md's D3 (never trust worker self-report, always independently re-run verify) citing a deleted docs/history/phase-2-routing/CONTEXT.md; real fgOS-specific rationale is unintentional worker drift (agy cwd bug, fanout worktree race), not the upstream beehive adversarial-swarm threat model
---

# D3's rationale outlived its own citation, and pointed to the wrong threat model anyway

`docs/routing-handoff-contract.md`'s D3 (never trust a worker's own
self-report — always independently re-run `verify` via `goal-check.mjs`)
cited `docs/history/phase-2-routing/CONTEXT.md D3/D4` as its decision
source. That file no longer exists in the repo (confirmed by `find` — not
present at main checkout). `tsk-3i6` fixed the dead citation, and along the
way corrected what D3's rationale actually was.

## The rationale that survived wasn't fgOS's own

The only surviving rationale trace was a pattern borrowed from the upstream
"beehive" project (`docs/distillery/sources/beehive.md`, entry
`goal-check-every-done-yourself`), framed around a "moved not passed"
threat in a multi-worker swarm system. That's not an fgOS-specific reason
— it's an inherited framing from a different system with a different
threat model (adversarial workers in a swarm).

## The real fgOS-specific threat, confirmed with two live incidents

Discussion with a fable agent (2026-08-24) confirmed D3 genuinely is
necessary for fgOS — but for a different reason than beehive's: fgOS's real
threat is **unintentional worker drift**, not an adversarial worker. Two
directly-verified incidents in the repo prove it:

1. **The `agy` cwd bug**
   (`docs/history/agy-cwd-fidelity/RESEARCH.md`) — the executor process ran
   with the correct `cwd`, but the agent itself jumped to a *different*
   item's worktree (`fgw/tsk-1lv`), exited successfully, and reported green
   despite the result being entirely wrong.
2. **The fanout worktree race** — already documented in
   `.agents/skills/fgos-fanout/SKILL.md:159-166`: "Real incidents have
   found that this harness's own worktree-isolation state is held at
   session level" and gets clobbered by sibling dispatched agents, drifting
   the coordinating session's own working directory into a sibling's
   worktree mid-run.

A third premise also didn't hold: "there's always a human reviewing before
merge, so re-verify isn't needed" doesn't match how the system actually
operates. fgOS's own priority #2, "Release con người" (docs/specs/runner.md),
drives toward unattended batch self-approval loops
(`/fgOS:merge-loop`, `/fgOS:cleanup-loop`) — exactly the scenario where an
independent re-verify catches drift a human isn't watching for.

## What shipped

`docs/specs/runner.md`'s ADR-0005 entry ("Runner & cô lập worker") gained
the two fgOS-specific evidence citations and the corrected review-cadence
premise, plus a new locked-decision line: independent re-verify guards
against unintentional worker drift specifically because batch unattended
merge loops don't have a human watching each item. `docs/routing-
handoff-contract.md:81`'s dead citation was repointed from the deleted
`phase-2-routing/CONTEXT.md` to this same ADR-0005 entry — D3 now has a
rationale that stands on its own, without requiring a reader to trace back
into an upstream project's docs to understand why it exists.
