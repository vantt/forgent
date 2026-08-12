# plan.md — tsk-1c6: propagate `stop-reason: lock-timeout` through the skill-invocation layers

Mode: **standard**

Lane decided by `fgos-routing`'s Mode gate, 2 flags:

- **public contracts** — `fgos-coding-driving`'s stop-report is read by
  `/fgOS:cook`, `/fgOS:pick`, `discover-next` and `discover-loop`
  (CONTEXT.md D2 makes the change deliberately visible to all of them).
- **weak proof around the area** — CONTEXT.md D3: no shell command can
  prove the runtime claim; `verify` asserts the written contract only.

Not `small`: the change lands a token that four independent callers must
agree on, and D3 records that the proof for it is structurally partial —
neither is honestly "a few files, no gray areas".

## Approach

One honest piece of work. No split (see Shape below).

`fgos-coding-driving`'s stop-report contract becomes the single place the
literal token `stop-reason: lock-timeout` (CONTEXT.md D4) is defined; the
stage-skills that actually run the failing engine verb relay it verbatim
upward; the two loop callers classify on it. Order follows producer →
relayer → consumer, so no file ever references a contract that is not yet
written down:

1. **`fgos-coding-driving/SKILL.md`** — define the token as part of the
   stop-report contract, and add the hard rule that a known error category
   from an invoked stage-skill's engine-verb call is relayed verbatim,
   never paraphrased into a generic "blocked". Honors D2 (fix at the root)
   and D4 (the literal token).
2. **`fgos-coding-exploring/SKILL.md`**, **`fgos-coding-planning/SKILL.md`**,
   **`fgos-coding-validating/SKILL.md`** — each runs state-writing `fgos` verbs
   against the shared `.fgos/events.jsonl` lock and is therefore a layer
   that can be the first to see a lock-timeout. Each gains the instruction
   to carry the token verbatim into its hand-back. Honors CONTEXT.md's
   "propagation" pinned term.

   Verb inventory, read off the real files (`rg` on each SKILL.md), which
   corrects an earlier draft of this plan that named `fgos-coding-planning` as the
   `fgos plan` caller and excluded `fgos-coding-validating` entirely:

   | Skill | State-writing verbs it runs |
   |---|---|
   | `fgos-coding-exploring` | `fgos discover`, `add`, `ask`, `answer`, `decision`, `gate-approve` |
   | `fgos-coding-planning` | `fgos decision`, `gate-approve` |
   | `fgos-coding-validating` | `fgos plan`, `decision`, `gate-approve` |
   | `fgos-coding-driving` | `fgos list`, `fgos pick` |

   The trigger is therefore "any state-writing `fgos` verb", not
   `discover`/`decompose` specifically — every one of them contends for the
   same lock. This does not widen CONTEXT.md D1: the propagated *category*
   is still `lock-timeout` alone.
3. **`discover-next/SKILL.md`** — replace the "Known gap, not fixed by this
   item" paragraph (lines 99-115, verified present on this branch) with
   reading the token off the driver's stop-report and classifying
   lock-timeout as its own branch, separate from generic `blocked`.
4. **`discover-loop/SKILL.md`** — its step 4 stop rule (lines 73-77,
   verified present) already keys on a `lock-timeout` outcome; make it read
   the propagated token explicitly so the rule matches what
   `discover-next` now reports.

Each of steps 1-2 touches **two** files per skill:
`.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`. All
four pairs are byte-identical today (verified with `diff -q` on this
branch) and must stay so — the verify asserts the token in both copies of
each.

`fgos-coding-driving` appears in both step 1 (it defines the contract) and
the step-2 inventory (it runs `fgos list`/`fgos pick` itself, so it can
also be the layer that first sees a lock-timeout). One file pair, both
roles.

### Alternatives rejected

- **Patch `discover-next` only.** Rejected by CONTEXT.md D2: the driver is
  the shared orchestration point, and a narrow patch would leave every
  other caller of `fgos-coding-driving` blind to the same signal.
- **Propagate every error category, not just lock-timeout.** Rejected by
  CONTEXT.md D1: `lock-timeout` is the only category that ever stopped the
  whole loop; `session-fail`/`merge-fail`/CAS-`validation` stay per-item.
- **Change the lock's own retry policy** (`.fgos/events.lock`, 2s/10ms).
  Out of scope per D1; deferred to tsk-r87.

## Risk map

| Component | Risk | What would prove it |
|---|---|---|
| Token agreed across 4 callers | medium | `discover-next`'s new classification branch and `discover-loop`'s step-4 rule both name the exact same string D4 pinned — read both files side by side, not just grep |
| `.claude` / `.agents` copy drift | low | `diff -q` on all three pairs after the edit; the verify's per-copy greps also catch a one-sided edit |
| Runtime relay actually happens | medium, **proof is partial by construction** | Not provable by `verify` (D3). Owned by `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md` plus event-log observation, per tsk-4l9's standard |
| Removing `discover-next`'s "Known gap" paragraph | low | NEGATIVE half of the verify; the paragraph is the item's own stated obsolete state |

`impact-analysis: degraded` — `fgos tool query --capability
impact-analysis --status present` returns gitnexus at `status: present`,
but the index is behind HEAD (last indexed `251d0b5`). The blast radius
here is prose files no code imports, so no proof point in this plan leans
on it; noted so a later reader does not re-derive the posture.

`fgos graph --json`: tsk-1c6 appears in neither `criticalPath` (depth 10,
rooted at tsk-4vo) nor `topUnblock` — it blocks nothing, so ordering
against other items is unconstrained. The internal 1→4 order above is
driven by the contract dependency, not by graph position.

## Shape

No split. The four steps are one contract landing in eight files; splitting
them would produce children that each leave the token half-defined, and
`footprintOverlapAmong` would flag every pair as overlapping anyway since
they share the driver file's contract.

Files touched (10):

```
.claude/skills/fgos-coding-driving/SKILL.md
.agents/skills/fgos-coding-driving/SKILL.md
.claude/skills/fgos-coding-exploring/SKILL.md
.agents/skills/fgos-coding-exploring/SKILL.md
.claude/skills/fgos-coding-planning/SKILL.md
.agents/skills/fgos-coding-planning/SKILL.md
.claude/skills/fgos-coding-validating/SKILL.md
.agents/skills/fgos-coding-validating/SKILL.md
plugins/fgOS/skills/discover-next/SKILL.md
plugins/fgOS/skills/discover-loop/SKILL.md
```

### Cases worth proving against

- **A lock-timeout raised by `fgos-coding-planning`, not `fgos-coding-exploring`** — the
  relay must work from either stage-skill, since `discover-next` routes
  `decompose`-stage items through the same driver.
- **A non-lock-timeout block** — must still surface as generic `blocked`
  and be skipped per-item, per D1. The new branch must not swallow
  ordinary blocks.
- **`discover-loop` mid-run** — the stop must end the whole loop on the
  iteration it happens, distinct from the iteration-cap stop reason the
  loop already reports separately.

## Proof surface

The one command that proves this item done:

```
npm test && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-driving/SKILL.md && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-driving/SKILL.md && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-exploring/SKILL.md && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-exploring/SKILL.md && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-planning/SKILL.md && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-planning/SKILL.md && grep -q 'stop-reason: lock-timeout' .claude/skills/fgos-coding-validating/SKILL.md && grep -q 'stop-reason: lock-timeout' .agents/skills/fgos-coding-validating/SKILL.md && grep -q 'stop-reason: lock-timeout' plugins/fgOS/skills/discover-next/SKILL.md && grep -q 'stop-reason: lock-timeout' plugins/fgOS/skills/discover-loop/SKILL.md && ! grep -q 'Known gap, not fixed by this item' plugins/fgOS/skills/discover-next/SKILL.md
```

Shape per tsk-4l9's standard (`docs/how-to/write-verify-for-a-skill-prose-change.md`,
commit `5c738bd` on `fgw/tsk-4l9`): `npm test` + POSITIVE + NEGATIVE.

## Assumptions

- **`fgos-coding-validating` needs the same relay instruction.** CONTEXT.md left
  this open ("Outstanding questions deferred to planning"). **Resolved, not
  assumed** — an earlier draft of this plan pinned the opposite as an
  assumption and `fgos-coding-validating`'s own reality gate caught it: `rg` on
  `.claude/skills/fgos-coding-validating/SKILL.md` shows it fires
  `node "$root/bin/fgos.mjs" plan` in its own Gate section, so it is
  squarely a layer that observes this failure. Its file pair is in scope
  (verified byte-identical with `diff -q`).
- **The `.agents` copies stay byte-identical to their `.claude`
  counterparts.** **Proven, not assumed** — `test/skills/fgos-mirror.test.mjs`
  asserts that the two roots declare the same `fgos-*` skill names, the same
  relative file paths, and byte-identical content for every pair (plus
  `_shared`). It runs under `npm test`, which the verify already invokes, so
  a one-sided edit fails the item's own verify. No generator produces one
  side from the other; the mirror is enforced by test, not by codegen.

## Dependency

`deps: [tsk-4l9]` — kept. tsk-1c6's verify runs regardless, but the
standard justifying its shape is on `fgw/tsk-4l9` and not yet on main
(CONTEXT.md "Real dependency").
