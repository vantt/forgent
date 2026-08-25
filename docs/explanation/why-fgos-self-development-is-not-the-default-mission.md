---
authoritative_for: why fgOS treats self-development as a bounded lane with its own gate, not the default mission, and where the full mechanism narrative lives
---

# Why fgOS self-development is not the default mission

fgOS exists to (1) develop *other* projects, and (2) run as the platform
underneath business-base workflows — not (3) to develop itself. Working
inside this very repo, where fgOS self-hosts on its own source, makes
mission #3 easy to slip into by default: the tool being built and the
product being shipped are the same repository, so "fix fgOS" reads as the
obvious next task simply because it's the one directly in front of an
agent. `docs/decisions/0035` locked a real boundary against that drift.

## A separate axis, not a fifth priority tier

The product-priority order (`docs/decisions/0030`: Ship Faster / Release
con người / DoD / Polish Sau DoD) answers a different question — which
value wins when two already apply to the same work. Mission self-vs-host
is a classification question — *which* project's own priorities even
apply here — so it sits beside that ordering as its own axis, not slotted
in as a fifth tier under it.

## What this changes in practice

When working inside this repo, do not default to treating "fix fgOS" as
the goal just because it's the visible work — ask whether the task
actually serves mission #1/#2 (a capability fgOS gives to some other
project or workflow) or is only convenient for the fgOS team's own
development (mission #3). fgOS is already installed globally and running
real work against multiple other projects beyond this repo — mission #1/#2
is not theoretical.

## Full mechanism and evidence

The full narrative — the recognized `mission` config key mechanism, its
interaction with the Iron Law's self-modifying-module rules, and the
locked decisions behind all of it — lives in `docs/specs/
platform-foundations.md`'s own "Lịch sử quyết định" section under `0035`,
per this repo's own convention of retiring long-form decision narrative
into the relevant area spec rather than a standalone ADR file (`tsk-1lv`
D5). This document intentionally stays short and points there rather than
duplicating that narrative.

## Source

`tsk-4us`. Verify: `test -f docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md
&& grep -qi "mission" docs/decisions/0035-xac-lap-ranh-gioi-su-menh-fgos.md
&& grep -q "0035" AGENTS.md && grep -qi "mission" AGENTS.md`.
