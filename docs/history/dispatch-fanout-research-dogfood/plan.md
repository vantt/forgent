# tsk-o4l — plan

Mode: tiny

Lane-gate: 0 flags apply (no auth, no authorization, no data model, no
audit/security, no external-system change, no public contract, no
cross-platform, no existing covered behavior, no weak-proof area, single
domain) — this item ships no code; it is a dogfood observation walked
through live via `/fgOS:pick`, direct-entry into `decompose` (item never
went through `fgos-coding-exploring`, so no `CONTEXT.md` exists — nothing here
overrides a locked decision, there is none to override).

## Approach

Purpose: prove, on a real live run, that `fgos-researching`'s D2 fan-out
rule ("Fan out only through a contracted dispatch, never ad hoc") actually
fires and that the native-branch announce line added in
`.claude/skills/_shared/capacity-dispatch-fallback.md` Step B.5 (commit
`1c741c7`) is genuinely visible on the transcript — not just correct on
paper.

No forgentX source file changes. The "deliverable" is the observation
itself, captured in `RESEARCH.md` by whichever stage actually needs the two
research points below as real evidence (per `fgos-researching`'s own
description, it is callable "later from `fgos-coding-planning`/`fgos-coding-validating`")
— most likely `fgos-coding-validating`'s own reality check, since both proof
points below are exactly the kind of evidence that gate is supposed to
demand before trusting a plan.

Two independent proof points (this independence is the point — D2 only
fans out when branches don't depend on each other's result):

- **P1 (repo)** — every real call/reference site of
  `resolveWriterIdentity`'s four-tier fallback (registry/env/pid/unresolved,
  `src/runner/session-identity.mjs`) outside that file, cited `file:line`.
- **P2 (external, unrelated to P1)** — how Node.js's `AbortController` API
  is used to cancel a running `child_process.spawn`, cited to a real
  external source.

No split — one honest piece, the two proof points above are not separate
work items (per the split rule: only when a piece "could go first" on its
own dependency merits — these two need to run in parallel, not become
sequential children).

## Proof surface

Verify (real, runnable — checks the observation's own paper trail, not the
live announce lines, which are transcript-only and read by the person
watching per this item's own request):

```
test -f docs/history/dispatch-fanout-research-dogfood/RESEARCH.md
```

Risk map (regression risk: none — no code path touched. Evidence risk:
medium on both rows below — this item's entire proof burden IS P1/P2,
so `fgos-coding-validating`'s feasibility matrix must not skip them):

| Component | How risky | What would prove it |
|---|---|---|
| P1 (repo claim) | medium — unproven until read | real `file:line` citations from an actual repo search |
| P2 (external claim) | medium — unproven until read | a real external source, cited |

Impact-analysis capability gate checked (`fgos tool query --capability
impact-analysis --status present`): GitNexus present, posture `full` — not
load-bearing here, neither row needs blast-radius evidence, both need
direct-read/external-source evidence instead.

## Assumptions

- Which stage actually invokes `fgos-researching` (`fgos-coding-planning` itself
  never calls it directly per its own Flow; `fgos-coding-validating` is the more
  likely caller per D2's "later from... `fgos-coding-validating`") is left open —
  not material enough to block this plan, since either caller uses the
  exact same fan-out mechanism this item exists to observe. `fgos-
  validating`'s own reality check is expected to be the one that actually
  dispatches P1/P2, given both are real evidence claims a plan should not
  be trusted on without proof.
