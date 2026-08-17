# Why stage-skills forbid ad hoc Task/Agent delegation for their own reasoning

`fgos-coding-exploring/SKILL.md` (commit `2bc193d`, corrected `8c1dab1`) was the
first place a hard rule landed forbidding a stage-skill from spawning a
Task/Agent subagent to do the skill's own scout/reasoning work. The rule
came out of the same session's discussion with the user about
`/fgOS:discover` feeling like an opaque CLI-spawn — a live session
delegating a judgment it could make itself reads as a black box to
whoever is watching. `tsk-29i` then audited the other coding-domain
stage-skills (`fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`,
and — widened past the item's own original text — `fgos-coding-driving`)
for the same gap, and mirrored the fix wherever it was real.

## The waste, not just the opacity

The rule's own wording, verbatim from `fgos-coding-planning/SKILL.md`:

> spawning a nested Task subagent for the mode/approach/shape judgment
> this skill exists to do is the same "soul re-deriving what a live soul
> already knows" waste `tsk-1ni` found in `judgeDiscovery`'s blind
> cli-spawn — pure overhead, not a transparency question (a Task/Agent
> call is collapsed by default in the transcript, not hidden, unlike a
> genuinely opaque headless `claude -p` subprocess).

The opacity framing that started the conversation turned out not to be
the real problem — a Task/Agent call already renders visibly in the
transcript, collapsed but not hidden. The actual defect is redundant
work: a live session that already holds full context spawning a fresh
subagent to re-derive a judgment it could make directly, the same class
of waste `tsk-1ni` found inside `judgeDiscovery`'s blind CLI-spawn. Citing
only opacity would have pointed at the wrong fix (make the spawn more
visible); naming the waste points at the right one (don't spawn at all
for this kind of step).

## The rule has an escape valve, and it matters which one

The rule never says "never delegate, full stop." A step that genuinely
needs a different backend — a cheaper model, a cross-provider capability,
real isolation — still has a legitimate path: the existing
executor-dispatch mechanism
(`.claude/skills/_shared/executor-dispatch-fallback.md`, itself governed
by `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
cli-spawn.md`'s Native-First Dispatch Doctrine). The distinction that
matters is *what kind* of step is being delegated:

- **The skill's own core judgment** (the mode/approach/shape call in
  `fgos-coding-planning`, the reality-check in `fgos-coding-validating`, the
  implementation judgment in `fgos-coding-implement`) — never delegated. The
  live session already has full context; a subagent would have to
  re-derive it from scratch, at real cost, to reach the same answer.
- **A narrow helper task that genuinely needs a different backend** —
  routed explicitly through executor-dispatch, which already resolves
  configured executors and decides native-vs-cli-spawn per Step B.5's
  Native-First doctrine, instead of an ad hoc Task call improvising the
  same decision inline.

## Where the gap was real, and where it wasn't

The audit found the gap present in three of the four skills checked, each
for a different reasoning surface:

- **`fgos-coding-planning`** — no rule at all governed its step 3
  (Approach/risk-map) or step 4 (Shape) judgment. Got the equivalent rule.
- **`fgos-coding-implement`** — no rule at all governed its step 2
  (Implement) or its Iron Law classification. Got the equivalent rule.
- **`fgos-coding-validating`** — already had a related but narrower rule ("Do
  not dispatch a second reader or a review pass over this plan...", tied
  to its own D6) — same spirit, but scoped to review-pass ceremony, not
  Task-tool delegation specifically, and with no executor-dispatch escape
  valve named. The user chose explicit consistency across all three
  skills over leaning on the narrower existing rule to already cover it.

`fgos-coding-driving` — the mechanical stage-dispatch loop those three
skills sit under — was audited and found to need **no change**: it has no
scout/reasoning surface of its own to protect. Its own hard rules already
forbid it from re-deriving anything a stage-skill decides ("never
second-guesses or repeats a stage-skill's own gate"). Adding a duplicate
rule there would have guarded against work this skill never does in the
first place — the risk the audit closes is already fully covered, once
the invoked stage-skills carry the fix themselves.

## Why this stayed a doc-only, no-split change

The fix mirrors the exact same rule text (adjusted only for each skill's
own named reasoning surface) into `.claude/skills/` and its
`.agents/skills/` mirror, kept byte-identical by
`test/skills/fgos-mirror.test.mjs`. No implementation-only detail was left
open for planning to resolve — a prose change proven once on
`fgos-coding-exploring`, applied identically wherever the same gap turned out to
be real.
