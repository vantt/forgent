# plan.md — Route discover/decompose/discover-next skill wrappers through fgos-routing

Item: tsk-31l · CONTEXT.md: decisions D1-D6 (this directory)

## Mode gate

Flags counted against the item's actual scope (not vibes):

- auth / authorization / data model / audit-security / external systems /
  cross-platform / multi-domain — **no** (prose-only edit to 3 skill files
  + 1 doc; engine untouched per CONTEXT.md's feature boundary).
- public contracts — **borderline, counted no**: the 3 skills are internal
  fgOS workflow tooling (slash-commands used by sessions working this
  repo's own backlog), not an external API/data contract other systems
  depend on. Their *behavior* changes (slower, Socratic, may ask a
  question) but no caller outside a live Claude Code session invokes them.
- existing covered behavior — **no**: no existing test asserts the prose
  content or dispatch behavior of these 3 files (confirmed:
  `test/skills/fgos-mirror.test.mjs` only covers `fgos-*`-prefixed dirs
  under `.claude/skills`/`.agents/skills`; `plugins/fgOS/skills/discover`
  et al. live elsewhere and have no such mirror). `npm test`'s existing
  coverage of `bin/fgos.mjs`'s `discover`/`decompose` CLI flags
  (stage-guard, `--verdict` parsing) stays a valid regression net since
  the engine is untouched.
- weak proof around the area — **yes**: confirmed empirically this
  session (see "Proof surface" below) — a shell `verify` command cannot
  assert that an LLM correctly interprets and follows prose dispatch
  instructions. This is a real, structural gap, not a wording problem.

**Count: 1 flag (weak proof), no hard-gate flag.** Files touched: 3
`SKILL.md` + 1 how-to doc = 4, each edit mechanical once D1-D6 are read.
No gray areas remain — every open question CONTEXT.md could raise was
already locked (D1-D6) before this plan was written.

**Mode: small.**

## Approach

`fgos graph --json` (this session): tsk-31l is its own isolated component
(`size: 1`, no deps, no dependents) — no cross-item ordering pressure, no
`topUnblock`/`criticalPath` signal to weigh. Ordering below is decided by
logical coupling only (a skill's dispatch shape must exist before the doc
describing it can be rewritten).

`fgos tool query --capability impact-analysis --status present` (this
session, and again in fgos-coding-exploring): GitNexus present, posture **full**.
Not load-bearing here — no symbol is edited, only prose files — recorded
per this skill's own instruction, not because a proof point below depends
on it.

Alternatives rejected: hardcoding "invoke fgos-coding-exploring" directly inside
`discover/SKILL.md` (rather than routing through `fgos-coding-driving`) was
considered and rejected — `fgos-coding-driving`'s own red-flag list forbids
any caller from resolving a stage-to-skill mapping itself; every caller
must go through the one registry lookup it wraps. Routing through
`fgos-coding-driving` with an explicit ceiling (D1, D6) is the only shape
that respects that rule while still guaranteeing each command does exactly
one stage's work.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| `discover/SKILL.md` step 2 rewrite | low | Structural: file references `fgos-coding-driving`/`fgos-coding-exploring`, `fgos take`, `stage:decompose`; old blind `--json --dir` verb-call pattern gone. Behavioral (does the LLM actually follow the new prose correctly at runtime): **not provable by shell verify** — confirmed this session (4 rounds of `judgeVerifySemanticCorrectness` disagreement, itself shown to be context-blind — see CONTEXT.md D4's pinned-term note and `tsk-4l9`). Real proof is a person driving `/fgOS:discover <id>` for real and observing the outcome, which is `fgos-coding-validating`'s reality check (next stage) plus ordinary code review at merge, not this item's own `verify`. |
| `decompose/SKILL.md` step 2 rewrite | low | Same structural checks (`fgos-coding-driving`/`fgos-coding-planning`, `fgos take`, `stage:executing` per D6), same behavioral-proof limit as above. |
| `discover-next/SKILL.md` step 4 rewrite (dynamic ceiling, D2+D6) | low-medium | Structural: file references `fgos-coding-driving`, both `stage:decompose` and `stage:executing` (proving both ceiling branches are named, not just one). The two-branch logic itself (picked stage decides which ceiling) is prose an LLM executes — same behavioral-proof limit as above. |
| `docs/how-to/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md` update (D5) | low | Structural: old phrase "wrap these two verbs directly" no longer present. |

No medium/high-risk component needs a `fgos-coding-validating` proof point beyond
what the risk map already names — this item never touches auth, data,
external systems, or existing covered code paths.

## Files touched, in order

1. `plugins/fgOS/skills/discover/SKILL.md` — replace step 2 (the blind
   `node bin/fgos.mjs discover $ARGUMENTS --json --dir ...` call) with:
   claim if not `doing` (`fgos take --role session --id <id>`), then
   invoke `fgos-coding-driving` for this id with `ceiling: stage:decompose`
   (D1, D6). Update the skill's own header prose (currently says it "wraps
   `fgos discover`" directly) to describe the routed shape instead.
2. `plugins/fgOS/skills/plan/SKILL.md` — same shape, `ceiling:
   stage:executing` (D1, D6). Update lines 8 and 25's self-referencing
   prose per D5.
3. `plugins/fgOS/skills/discover-next/SKILL.md` step 4 — keep step 2's
   pick call unchanged (D2). Replace the direct verb call with: hand the
   picked `id` to `fgos-coding-driving`, `ceiling: stage:decompose` when
   the picker returned `stage: "clarify"`, `ceiling: stage:executing` when
   it returned `stage: "decompose"` (D2, D6).
4. `docs/how-to/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md`
   lines 68-70 — replace "`/fgOS:discover <id>` and `/fgOS:plan <id>`
   wrap these two verbs directly" with a description of the routed
   dispatch (D5).

No split (step 5 of this skill's flow): all 4 edits are one coupled
change — `discover-next` step 4's shape is not decidable without the
routing shape steps 1-2 establish first, and the doc update (step 4)
describes the combined result. Filing them as separate items would leave
intermediate states where the doc lies about current behavior. One item,
sequenced internally.

## Proof surface (item's own `verify`)

```
npm test \
&& grep -Eq "fgos-coding-driving|fgos-coding-exploring" plugins/fgOS/skills/discover/SKILL.md \
&& grep -q "fgos.mjs take" plugins/fgOS/skills/discover/SKILL.md \
&& grep -q "stage:decompose" plugins/fgOS/skills/discover/SKILL.md \
&& grep -Eq "fgos-coding-driving|fgos-coding-planning" plugins/fgOS/skills/plan/SKILL.md \
&& grep -q "fgos.mjs take" plugins/fgOS/skills/plan/SKILL.md \
&& grep -q "stage:executing" plugins/fgOS/skills/plan/SKILL.md \
&& grep -q "fgos-coding-driving" plugins/fgOS/skills/discover-next/SKILL.md \
&& grep -q "stage:decompose" plugins/fgOS/skills/discover-next/SKILL.md \
&& grep -q "stage:executing" plugins/fgOS/skills/discover-next/SKILL.md \
&& ! grep -q "discover \$ARGUMENTS --json --dir" plugins/fgOS/skills/discover/SKILL.md \
&& ! grep -q "decompose \$ARGUMENTS --json --dir" plugins/fgOS/skills/plan/SKILL.md \
&& ! grep -q "wrap these two verbs directly" docs/how-to/advance-a-clarify-or-decompose-stage-item-with-discover-decompose.md
```

Sanity-checked against the pre-fix tree (this session): exits non-zero
(fails), confirming it is a real, non-vacuous check. **Corrected during
`fgos-coding-implement` (this session):** the first draft's `take`/`--json --dir`
substrings were imprecise — `fgos take` never appears literally (the real
invocation is `bin/fgos.mjs take`), and a bare `--json --dir` also matched
the new claim-step's own legitimate `fgos list --id ... --json --dir`
status check, not just the old blind verb-call pattern. Both checks are
now scoped to the exact strings that actually appear. This is the
structural ceiling this item's `verify` can honestly reach — it proves the
4 files were edited to the shape D1-D6 describe; it does not and cannot
prove an LLM will follow that prose correctly at runtime. That gap is
real, out of this item's scope, and tracked separately as `tsk-4l9`
(discoveredFrom tsk-31l). A second gap, discovered only during
implementation — `/fgOS:discover-loop` losing its distinct lock-timeout
whole-loop stop signal once `discover-next` dispatches through a skill
instead of a bare CLI subprocess — is tracked separately as `tsk-1c6`
(discoveredFrom tsk-31l); bounded by `discover-loop`'s own iteration cap,
not a silent data-loss risk, so it did not block returning this item.

## Assumptions

- The exact wording of the new step-2/step-4 prose in each `SKILL.md` is
  an implementation detail for `fgos-coding-implement` to write, not pinned here
  — only the shape (claim-if-needed, dispatch via `fgos-coding-driving`,
  which ceiling) is locked (D1, D2, D6). Not material: wording doesn't
  change scope/behavior as long as the shape holds.
- `fgos-coding-driving`'s claim hard rule ("claim right before the FIRST
  invocation of the executing-stage skill, never earlier") means
  `discover`/`decompose`/`discover-next`'s own explicit `fgos take` step
  is redundant with what `fgos-coding-driving` would do anyway if the item
  isn't yet `doing` — kept explicit in the plan for clarity/parity with
  `/fgOS:pick`'s own step 2, not because `fgos-coding-driving` needs it
  spelled out twice. Not material.
