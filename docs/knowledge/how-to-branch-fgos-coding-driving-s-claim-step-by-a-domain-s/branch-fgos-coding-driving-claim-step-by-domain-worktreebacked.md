---
type: how-to
title: How to branch fgos-coding-driving's claim step by a domain's worktreeBacked flag
tags: []
timestamp: 2026-08-04T09:30:44.306Z
source_capture_ids: [tsk-5y5]
framework: diataxis
mode: how-to
---
# How to branch fgos-coding-driving's claim step by a domain's worktreeBacked flag

Use this when a domain's `executing`-stage skill needs claiming, but that
domain declares `worktreeBacked: false` in the `DOMAINS` registry
(`src/state/workflow-stage-graphs.mjs`) — a real git worktree/branch is
pointless work for a domain that never merges anything.

## Before you start

- You need the target domain's registry entry to already declare
  `worktreeBacked` (`coding`: `true`; `synthetic`: `false` — both already
  registered, no new field to add).
- This applies to `fgos-coding-driving`'s own claim step, immediately
  before the FIRST invocation of a domain's `executing`-stage skill in the
  loop — not to any other claim path.

## Steps

1. **Read `domain.worktreeBacked` before claiming**, the same registry
   lookup the skill already uses for `skillForStage` — no new field:

   > `read domain.worktreeBacked (getDomain(domain).worktreeBacked, the
   > same registry lookup this skill already uses for skillForStage, no
   > new field) and claim accordingly` (`.claude/skills/fgos-coding-driving/SKILL.md`)

2. **`worktreeBacked === true`** (today: `coding`) — claim exactly the way
   `/fgOS:pick`'s own step 2 does, then hand the session into the worktree:

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" pick "<id>" --dir "$root"
   ```

   then `EnterWorktree` into the returned `data.worktree.path` (falling
   back to printing the path and stopping if it is unavailable/refuses —
   never fail or retry past that fallback). Only then invoke the
   `executing`-stage skill.

3. **`worktreeBacked === false`** — claim without a worktree, the same
   stage-agnostic claim `fgos-routing` and two other skills already use
   (`claimWork`'s `isolate:false` path, `claim-port.mjs:88`; `take --id`
   already claims an item at any stage):

   ```bash
   root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
   node "$root/bin/fgos.mjs" take --role session --id "<id>" --dir "$root"
   ```

   Never call `EnterWorktree` for this branch — invoke the `executing`-stage
   skill directly at the current (main-checkout) cwd.

4. **Skip claiming entirely if `status` already reads `doing`** — the
   caller (e.g. `/fgOS:pick`'s own step 2, or a prior loop iteration)
   already claimed it. The session is assumed to already be inside the
   claimed worktree in that case, or, for a `worktreeBacked:false` domain,
   already at the main checkout.

## Why this needed fixing

Before this fix, the claim step always called `fgos pick` (worktree-
creating, `isolate:true`) unconditionally, regardless of domain. That is
harmless today only because no domain currently exercises the gap: the one
existing `worktreeBacked:false` domain (`synthetic`) declares a single
stage mapped to `Execute` whose own `skillMap` entry is `null` —
`fgos-coding-driving`'s loop stops at its own "skill is null → stage is
mechanical" branch *before* ever reaching the claim-step check. The bug
was live-in-waiting for the first future domain that combines
`worktreeBacked:false` with a real `executing`-stage skill.

Root cause, confirmed by reading the code (not guessed): `claimWork`
(`src/runner/claim-port.mjs:88`) already accepted an `isolate` param —
`true` for pick's worktree-creating behavior, `false` for take's — and
`bin/fgos.mjs`'s `take` case (lines 1770–1799) already claims an item at
any stage via explicit `--id`, not just `clarify`/`decompose`. Both
primitives needed for the fix already existed; only the skill's own prose
never branched on them.

## Real example

The two SKILL.md copies (`.claude/skills/fgos-coding-driving/SKILL.md` and
its mirror `.agents/skills/fgos-coding-driving/SKILL.md`) both now carry
this exact loop-pseudocode branch:

> ```text
> if skill resolves to the domain's `executing`-stage skill AND status != 'doing':
>   if domain.worktreeBacked:
>     claim `id` (`fgos pick`) and enter its worktree BEFORE invoking
>   else:
>     claim `id` (`fgos take --role session`), no worktree, invoke at the
>     main checkout
> ```

and one added Red Flags line making explicit that this branch is not a
new cross-domain generalization claim on its own:

> `reading the claim step's worktreeBacked branch as if it were itself new
> cross-domain evidence — it only reads a per-domain field the registry
> already carries for every domain (coding and synthetic...`

That line exists on purpose: `fgos-coding-driving`'s own D9/D10 discipline
already states the loop "is proven correct for the `coding` domain only,"
and a reader seeing a brand-new domain-conditional branch land right next
to that disclaimer could otherwise read it as quietly contradicting it.

## What went wrong along the way

One real verification friction during this item's own execution: a
`goal-check failed on branch "fgw/tsk-5y5" (exit 2)` park, disposition
`blocked`, `errorClass: verify-miss`. Root cause was the `verify` command
itself, not the fix — this repo has no automated test surface for
skill-body prose, so `verify` had to be a mechanical `grep`/`diff` command
checked by hand, and it took four rounds of human answer/refinement before
landing on a command specific enough to actually distinguish "the branch
exists" from "the branch exists with the right shape" (final locked form:
`grep -c worktreeBacked <file>` count check, plus a `diff` mirror check,
plus explicit `grep -q` checks for each of the two literal branch
conditions and the `EnterWorktree` call count). The lesson for any future
skill-prose-only item with no test surface: write the mechanical verify
command as specifically as the thing it is meant to catch, not just
"the keyword appears somewhere."

## Related

- `docs/history/fgos-coding-driving-worktreebacked-claim-branch/CONTEXT.md`
  — the locked decisions (D1: the branch itself; D2: the Red Flags
  clarifying line) and full scout evidence behind this fix.
- `plans/reports/internal-research-260804-1230-routing-coding-driving-domain-gap-plan-report.md`
  §3 "Finding 2" and §5 ("Item B — filed as `tsk-5y5`") — the source
  finding and the fix-now-vs-defer call this item already resolved.
- `docs/how-to/claim-a-clarify-or-decompose-stage-item.md` — the general
  `take` vs `pick` claim-mechanics doc this fix's branch reuses rather
  than reinventing.
