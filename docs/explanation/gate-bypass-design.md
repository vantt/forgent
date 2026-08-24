---
type: explanation
source_capture_ids: [tsk-6bx, tsk-1ds, tsk-1vi, tsk-3i8]
---

# Why gate-bypass is shaped the way it is

`docs/reference/gate-bypass-config.md` covers the mechanism's exact
shape. This is the discussion of why it landed on that shape instead of
several other plausible ones — grounded in the locked decisions in
`docs/history/gate-bypass/CONTEXT.md` (D1-D5).

## The actual problem wasn't "let us auto-approve everything"

The request that started this (`tsk-6bx`) named bee's `gate_bypass`
config as the pattern to learn from. The obvious reading — "add a
config toggle that skips confirmations" — turned out to be the wrong
target. Discussion during clarify surfaced the real complaint: fgOS
already has a legitimate unclear-stop (`awaiting-human`, via `fgos
ask`/`answer`) that intentionally-unattended flows rely on — that one is
working as designed. The actual friction was the *other* kind of stop:
skill-embedded confirmation prompts (`fgos-coding-exploring`'s "Approve
CONTEXT.md?", `fgos-coding-planning`'s "Approve work shape?") firing
unconditionally, even when the artifact behind them was already clearly
complete and there was no real decision left for a human to make.

This reframing (**D1**) is why the feature touches exactly two files
(`fgos-coding-exploring`/`fgos-coding-planning`'s Gate sections) and not the
`awaiting-human` state machine at all. A design that started from the
literal "add a bypass toggle" reading would have touched the wrong
mechanism entirely.

## Why the skip criterion is mechanical, not a confidence read

bee's `gate_bypass` is an explicit, human-set, persisted ceiling that a
session's own live judgment sits *underneath* — never something the LLM
can grant itself by asserting "act as if the level were higher." The
distilled evidence for bee's design is direct about why: an LLM's
in-context read of "is this actually fine to skip" is exactly the kind of
judgment a crafted item description (untrusted input, RUL45) could talk a
session into faking.

fgOS's skip criterion (**D2**, `hasOpenItems`) sidesteps that specific
risk by being mechanical rather than a confidence read: does the artifact
have a `TODO`/`FIXME` marker, or a `## Outstanding questions` section
whose body isn't literally `None`? A program can check this without
trusting the session's own self-assessment at all. That is *why* fgOS
doesn't need bee's exact four-level `gate_bypass` scheme to get the same
safety property bee's scheme protects — the underlying trigger here is
already inspectable, not a vibe.

## Why there's still a human-set ceiling anyway (D5)

Given D2's mechanical check, an obvious follow-up question came up
directly during planning: if the check is already deterministic, does a
config ceiling add anything, or is it just process for its own sake?

The answer is that mechanical-and-self-graded are two different axes.
`hasOpenItems` being inspectable doesn't change *who* is doing the
inspecting — it's still the same session reading its own artifact, one
step removed from the exact self-assessment risk D2 was designed around.
D5 keeps a second, independent axis (the item's `tier`, reused from
`src/state/work.mjs`'s existing enum, matched against a repo-wide
config level) precisely so the skip is never authorized by the
mechanical check alone — a human still has to have set a level that
covers this tier, the same two-layer shape ("level covers this lane AND
content is actually clear") bee's own design already uses, just with a
mechanical second layer instead of bee's own risk classifier.

## Why the floor (D4) never bends

Bee's own design keeps a floor even at its most permissive level —
secret-file reads and review P1 findings always stop for a human,
regardless of how far a human has turned the dial. The reasoning bee's
distilled inventory gives for that floor: raising the bypass level is a
deliberate choice to trust *routine* work more, not a decision to stop
caring about the specific cases that are expensive to get wrong.

fgOS's floor reuses the same risk-keyword detection (`HEAVY_KEYWORDS`,
`src/intake/risk-keywords.mjs`) that already exists for a completely
different purpose (Iron Law's hard-gate classification, RUL34) — not a
new list invented for this feature. That reuse is itself a small piece of
evidence for the design: the same signal that already says "this needs
more scrutiny" elsewhere in fgOS is the right signal to say "this can
never silently skip a human" here too, rather than fgOS defining its own,
possibly inconsistent, notion of what counts as high-stakes.

## What this means for the next person extending it

Any future addition to what auto-approves should ask the same two
questions this design asks: (1) is the trigger a mechanical, inspectable
fact, not a live confidence read, and (2) does raising the ceiling still
leave the existing hard-gate floor untouched? A change that answers "no"
to either isn't really the same feature anymore.

## A mechanical check is only as live as the artifact it reads (tsk-5hg)

D2's `hasOpenItems` check is mechanical, but mechanical still means it
reads something a producer wrote — and for months after this design
shipped, nothing wrote it. `tsk-5hg` found and fixed a real gap: the
skills that actually write `CONTEXT.md`/`plan.md`
(`.claude/skills/fgos-coding-exploring/SKILL.md`,
`.claude/skills/fgos-coding-planning/SKILL.md`) never mentioned the `##
Outstanding questions` convention `hasOpenItems` depends on —
`gate-bypass.mjs` itself asserts it's "the convention this item's own
CONTEXT.md/plan.md already follow," but nothing wired that convention
into the skills doing the actual writing. Two layers that were supposed
to agree silently didn't.

The measured effect: only 21/197 (11%) of real `CONTEXT.md` files and
1/189 (1%) of real `plan.md` files passed `hasOpenItems` — blocked mostly
by the missing heading (142 and 161 cases respectively), not by genuine
open TODOs/FIXMEs (34 and 27). The bypass mechanism actually fired 6/366
times across its whole history (1.6%), and zero times in the week before
this item. D4's hard-gate floor was never the bottleneck; the mechanism
was fail-closed by a missing convention wire-up, not by design.

The fix was narrow on purpose, and the item's own locked constraint says
why: `hasOpenItems` itself was never loosened (that would have undermined
D2's whole point — a mechanical, inspectable trigger, not a widened one).
Only the two producing `SKILL.md` files gained the missing instruction to
actually write the heading. The lesson generalizes past this one gate: a
mechanical/inspectable check is a contract between a reader and a writer,
and proving the reader-side logic is sound (D2-D5 above) says nothing
about whether anything upstream is actually writing to that contract —
that has to be checked separately, against the real artifacts, not
assumed from the check's own code comment.

## The third gate needed a different axis, not the same one reused (D6, tsk-1ds)

`validateApprove` (`fgos-coding-validating`'s own Gate) was, until `tsk-1ds`, the
one gate of the three skill gates with no bypass path at all —
`.claude/skills/fgos-coding-validating/SKILL.md` used to hardcode "No
auto-approve path exists for this Gate today ... actor is always human
here," even after `contextApprove` and `planApprove` both gained
`canAutoApprove`.

The measured case for closing that gap (`.fgos/events.jsonl`, 2026-08-09):
108 items had passed through `validateApprove` — 1 rejection (NOT READY),
13 `READY WITH CONSTRAINTS`, and ~94 (87%) with no constraints at all.
`validateApprove` had never once needed a second round with a human
(0/108) — the only one of the three gates with that record
(`contextApprove` 27/99, `planApprove` 10/105 needed a repeat ask). By
2026-08-07 it accounted for 23/53 (43%) of all gate-approve calls, the
remaining ceiling on yes/no gate load after `tsk-5hg` fixed the other
two gates' bypass wiring.

**Why `hasOpenItems` itself wasn't reused for this gate.** A multi-condition
axis modeled on `hasOpenItems` (every reality-gate row PASS, verify
runnable, a real test surface exists, tier covered, no risk keyword) was
considered and rejected: reading the 13 real constraints recorded against
`validateApprove` showed 10 were mechanical but 3 needed judgment (is a
smoke test sufficient coverage for an external tool; is deferring a
migration risk to post-merge acceptable; does prose-only work genuinely
have no test surface) — and two of those three were not detectable in
advance, only visible once the skill actually wrote its verdict. The skill
computing the verdict is the party that already knows whether it recorded
a constraint. A self-reported axis was judged more honest than five axes
that would have had to guess ahead of time.

**The mechanism.** Not a content-inspection check like `hasOpenItems` —
the axis is `fgos-coding-validating`'s own already-computed verdict:

- verdict `READY` (no constraints) → bypass, `actor: bypass`
- verdict `READY WITH CONSTRAINTS` → ask a human, `actor: human`
- verdict `NOT READY` → unchanged: skip the question entirely, return to
  `fgos-coding-planning`

This keeps the same self-reported trade-off `hasOpenItems` already
carries (a skill could under-report constraints to earn a bypass) rather
than introducing a new one — the repo had already accepted that same risk
shape for the other two gates.

`src/state/gate-bypass.mjs` gained a new export,
`canAutoApproveValidate(item, verdict, level)`, reusing exactly the first
two axes `canAutoApprove` already used (the `HEAVY_KEYWORDS` floor, D4;
`isTierCovered`) and swapping the third for `verdict === 'READY'`. The
existing `canAutoApprove` — at the time still driving both
`contextApprove` and `planApprove` — was left untouched rather than
parameterized, so neither of those two gates' behavior could shift as a
side effect.

**Superseded:** `coding-planning-validating-gate-redesign/CONTEXT.md`
D9-D11 later deleted `canAutoApproveValidate` entirely, replacing it with
`canAutoApproveMergedGate` at the single merged gate now owned by
`fgos-coding-validating`; `fgos-coding-planning`'s own `planApprove` gate
was removed in the same change, so `canAutoApprove` today drives only
`contextApprove`. This section stays as a historical record of D6's own
reasoning at the time.

## A mechanical check is only as live as the branch importing it (D7/D8, `tsk-1vi`)

`tsk-5hg` (above) proved a mechanical check is only as sound as whatever
*writes* the fact it reads. `tsk-1vi` found a sibling failure mode one
layer down: the check is also only as sound as whatever *code* actually
runs when a Gate section imports it — and each of the three Gate
sections' inline `node -e` scripts import `gate-bypass.mjs`/`store.mjs`
cwd-relative, from the claimed item's own `fgw/<id>` worktree, not from
the main checkout.

That choice was deliberate for `fgos-coding-exploring`/`fgos-coding-planning`'s own
Gate sections, which document it explicitly: "this worktree's own branch
already carries whatever version it needs" — protecting the case where
an item is itself modifying `gate-bypass.mjs` (as this feature's own
`tsk-6bx`/`tsk-1ds` rollouts did) and needs its own gate check to
exercise its own branch's in-progress code before `main` even has it.

**The gap**: a long-lived branch forked *before* a needed export existed
on `main` gets a cwd-relative import that resolves successfully but
returns `undefined` for that export — not a load failure, a silently
stale one. Reproduced live on `tsk-5lr`: its branch forked 2026-08-06,
three days before D6 added `canAutoApproveValidate` to `main`
(2026-08-09). Calling the `undefined` export threw `TypeError:
canAutoApproveValidate is not a function` — which happened to fail
closed only because each Gate section's own consumer rule treats
"anything but `true`" as `false`, not because anyone designed that
exception path on purpose.

**The fix (D7)**: local-first, fall back to root. Try the existing
cwd-relative import first; if the needed export comes back `undefined`
or the import throws, retry the same import from `${root}/src/state/...`
(the main checkout) before falling through to `false`. This is correct
in both directions at once — the self-referential case (an item modifying
`gate-bypass.mjs` itself) still gets its own branch's in-progress code
via the local import succeeding first, and the stale-branch case falls
back to `main`'s canonical code once the local import's export comes back
missing. A flat switch to `$root`-only import was considered and rejected
specifically because it would have broken the self-referential case this
very feature's own two prior rollouts (D1-D6) depended on.

**What stayed explicitly out of scope (D8)**: a pure global `npm install`
of fgOS onto a different product's repo has no repo-local `src/state/*.mjs`
at either `./` or `$root` — the same import fails unconditionally there,
for every item, not just stale branches. That's a different failure
shape (always-crash vs. sometimes-crash) from what D7 fixes, and was
split into its own backlog item (`tsk-65q`) rather than folded into this
one's scope — the DoD-before-polish priority order this repo already
follows.

The general lesson, layered onto `tsk-5hg`'s own: "this check reads a
fact mechanically" and "this check's own code is definitely the current
code" are two separate soundness claims. The first was already proven;
the second silently assumed a worktree's cwd-relative import always
resolves against fresh code, which held for every case this feature was
originally built and tested against, and broke the moment a branch
outlived the code it imports.

## The global-install crash D8 split off (tsk-65q)

D8 deliberately left one failure shape unfixed: a pure global `npm
install` of fgOS onto a *different product's* repo has no repo-local
`src/state/*.mjs` at either `./` (cwd-relative) or `$root` (the calling
repo's own git root) — both of D7's fallback tiers look inside the
*consuming* repo, and neither ever looks at where the `fgos` package
itself is actually installed. Unlike D7's stale-branch case, this crashes
**unconditionally, for every item**, not just some. It happened to fail
closed by the same accident as D7's bug — "anything but `true` is
`false`" — but the whole gate-bypass feature was silently a permanent
no-op for anyone using a pure global install, not a rare edge case.

**Root cause and the precedent that was already sitting in the repo.**
The Gate-section checks in `fgos-coding-exploring`/`fgos-coding-validating` each
reimplemented their own two-tier module resolver inline (an embedded
`node -e` script) — neither tier ever consulted where the `fgos` package
itself resolves from. But `bin/fgos.mjs` already had a *working*,
in-repo precedent for exactly this: its own static relative imports
resolve against the *importing file's own location*
(`import.meta.url`), not cwd — so the installed CLI itself already
resolved `gate-bypass.mjs`/`store.mjs` correctly from any install shape,
with zero special-casing, the whole time. The bug was never in Node's
module resolution; it was that the Gate-section checks bypassed the one
file that already got this right and re-derived their own, incomplete
version.

**The fix: route through the CLI instead of re-deriving resolution.** A
new read-only verb, `fgos gate-check <id> --gate <contextApprove|
validateApprove> ...`, was added to `bin/fgos.mjs` itself
(`case 'gate-check'`) — a thin wrapper around the already-imported,
already-tested `canAutoApprove`/`canAutoApproveMergedGate`. Both Gate
sections' inline `node -e` resolver blocks were replaced with a call to
this verb. This inherits `bin/fgos.mjs`'s already-correct resolution for
free: no new resolution logic to write or prove, only a thin verb around
functions the CLI already imports.

**Rejected alternative: teach the inline resolver a third tier** (walk up
from `process.execPath`, or use `import.meta.resolve('forgent/...')`
relative to the `node -e` script). Rejected because it would have
duplicated resolution logic `bin/fgos.mjs` already had correct, in two
more places that would each need the same proof burden all over again —
the entire point of routing through the CLI is that Node's own module
resolution does the work exactly once, in the one file that ships with
the package and is guaranteed to resolve correctly regardless of install
shape.

**Why this was flagged high-risk despite being a small, mechanical
change.** The path touched (`canAutoApprove`/`canAutoApproveMergedGate`)
decides whether a work item's gate is auto-approved without a human. The
bug failed closed by accident — global-install users always got asked.
Making the check actually *run* for that population is a real behavior
change: those same users will, once the fix lands, get real
auto-approve/deny answers per their configured bypass level instead of
always being asked. That is a genuine audit/security-flagged change on
its own, even though the code delta is small and mechanical.

**Proof burden matched to the actual regression.** The regression this
item exists to fix only reproduces from a cwd with no local
`src/state/*.mjs` at all — calling the new verb from inside forgentX
itself would pass even with the old broken resolver, since forgentX *is*
the dev checkout the old cwd-relative tier worked by accident. The test
added (`test/cli/fgos-gate-approve.test.mjs`) therefore invokes the new
verb from a scratch tmp directory that has no local state modules,
simulating a real global-install consumer's repo, and asserts it returns
the same answer `canAutoApprove` would give directly — proof against the
actual failure condition, not just proof the verb exists.

## A bare-word marker scan created a perverse incentive to obfuscate (`tsk-3i8`)

`hasOpenItems`'s TODO/FIXME check ran over the *whole* artifact text
before it ever read the artifact's own "Outstanding questions" section —
so any artifact whose prose merely contains the literal token `todo`
failed the check, regardless of what the section actually said.

This is unavoidable for exactly the class of item most likely to write
about the work FSM itself: the status vocabulary includes `todo` as a
real status name. Reproduced directly on `tsk-3dt` (during the
worker-slot batch, `docs/explanation/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md`):
a plan explaining that a refused claim correctly leaves an item at
`todo` rather than orphaning it at `doing` could not auto-approve, purely
because the word appeared in the explanation, forcing an unnecessary
human round trip. Confirmed minimal: the identical plan text with
`None` under Outstanding questions returns `true`; the same text with
that one word spelled differently returns `false`.

**Why a false positive here is worse than the usual "gate is too
strict."** The gate's entire purpose is to force honest disclosure of
open items. A marker scan matching a bare word anywhere in prose makes
the *cheapest* way to pass the check "reword the document to dodge the
scanner" — exactly the behavior the gate exists to prevent, and a real
incentive the next agent (or the same one, next time) is likely to take
once it notices the check is beatable by wording alone.

**The landed fix**: the marker regex now requires `TODO`/`FIXME` to be
immediately followed by a colon or an open parenthesis — the shape a
genuine code marker actually reads (`TODO:`, `FIXME(name):`) — instead of
matching the bare word anywhere in ordinary prose. A plan that merely
*discusses* the `todo` status by name, with no real open-item marker,
now reads correctly.
