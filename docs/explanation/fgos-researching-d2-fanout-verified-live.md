---
type: explanation
title: fgos-researching's D2 fan-out rule, verified live on a real dogfood run
tags: []
source_capture_ids: [tsk-o4l]
---
# fgos-researching's D2 fan-out rule, verified live on a real dogfood run

`fgos-researching`'s D2 rule reads "Fan out only through a contracted
dispatch, never ad hoc" — a rule about how the skill is *supposed* to
behave when a question splits into independent branches. `tsk-o4l`
existed to answer a narrower question: does that rule actually fire on a
live run, and is the native-branch announce line added in
`.claude/skills/_shared/executor-dispatch-fallback.md` Step B.5 (commit
`1c741c7`) genuinely visible on the transcript — not just correct on
paper?

## Why this needed a dogfood item instead of a code read

Reading the skill's own prose confirms what it's *supposed* to do; it
cannot confirm what a live `/fgOS:pick` run actually does when the
question in front of it splits into two branches with no dependency on
each other. `tsk-o4l`'s plan set up exactly that split on purpose:

> Two independent proof points (this independence is the point — D2 only
> fans out when branches don't depend on each other's result):
>
> - **P1 (repo)** — every real call/reference site of
>   `resolveWriterIdentity`'s four-tier fallback (registry/env/pid/unresolved,
>   `src/runner/session-identity.mjs`) outside that file, cited `file:line`.
> - **P2 (external, unrelated to P1)** — how Node.js's `AbortController` API
>   is used to cancel a running `child_process.spawn`, cited to a real
>   external source.

P1 is a repo-search question; P2 is an unrelated external-documentation
question. Neither branch's answer depends on the other's — the condition
D2's fan-out rule requires before it fires at all.

## What the live run actually produced

Both branches dispatched through separate ad-hoc tasks
(`tsk-o4l#p1`, `tsk-o4l#p2`, D8: the `#p<n>` id shape stays literal —
this was captured before the rename) rather than staying inline in one
reasoning pass, per `RESEARCH.md` (quoted verbatim below, so it still
says "packet" — the term current at the time this run happened):

> - P1 — repo search (packet `tsk-o4l#p1`, dispatched native/Explore):
>   `resolveWriterIdentity` (`src/runner/session-identity.mjs`) call/reference
>   sites across the whole repo.
> - P2 — external doc lookup (packet `tsk-o4l#p2`, dispatched
>   native/researcher): Node.js `AbortController` + `child_process.spawn`
>   cancellation, `nodejs.org/api/child_process.html` and
>   `nodejs.org/api/globals.html#class-abortcontroller`.

Each branch returned real, citable evidence — P1 as a list of real
runtime call sites for `resolveWriterIdentity` (e.g.
`src/runner/merge.mjs:652`, `src/state/store.mjs:343`, `:509`, `:752`,
`bin/fgos.mjs:2540`, `:2562`), P2 as a real, sourced finding about
`AbortController`'s `signal` option on `spawn`/`exec`/`execFile`/`fork`
(stable since Node.js v15.4.0, cited to `nodejs.org/api/child_process.html`
and `nodejs.org/api/globals.html#class-abortcontroller`). `RESEARCH.md`
records no open follow-up for either branch:

> **Open:** none — both branches returned real, citable evidence. No
> follow-up question needed for this round.

## What this confirms

D2's fan-out rule is not just a written constraint that a skill's prose
happens to state — on a real run with two genuinely independent
branches, the dispatch mechanism actually split the work into two
separate contracted tasks instead of answering both questions inline
in one pass. The outcome record for `tsk-o4l` closed clean on the first
attempt (`outcome: awaiting-approval`, `passed: true`, `attempts: 1`),
with the item's own verify (`test -f
docs/history/dispatch-fanout-research-dogfood/RESEARCH.md`) satisfied by
the file this document draws its quotes from.

No friction and no learning were recorded against this item — the
mechanism worked as designed on the first live exercise.
