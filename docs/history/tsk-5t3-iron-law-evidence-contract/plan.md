---
item: tsk-5t3
timestamp: 2026-07-30T10:11:42.000Z
---

# plan.md: Iron Law evidence contract

## Mode

**high-risk.** Flags counted against the item:

| Flag | Applies? | Why |
|------|----------|-----|
| audit/security | **yes** | The item feeds evidence directly into the Iron Law gate's human decision (RUL34) — a hard-gate flag by the mode rule's own definition, even though D4 keeps this item from touching the gate's enforcement code itself. |
| existing covered behavior | **yes** | `.claude/skills/fgos-coding-implement/` must stay a byte-identical mirror of `.agents/skills/fgos-coding-implement/`, enforced today by `test/skills/fgos-mirror.test.mjs` (docs/history/gate-bypass/plan.md already hit and documented this same requirement). `plugins/fgOS/skills/merge-loop/SKILL.md` also carries an existing grep-based verify contract from `tsk-1sm` (requires `iron-law`, `picked.*null`, `clean`, `/loop`, `/fgOS:merge-next` to all still appear) that this edit must not break. |
| weak proof around the area | **yes** | The merge/Iron-Law area has a real incident history in this repo (`tsk-3mv`, `tsk-598`, `tsk-3yl`, `gate-bypass`, and this session's own live main-checkout-lock collision) — proof here needs to be concrete, not assumed. |

One hard-gate flag (audit/security) alone forces high-risk per the mode
rule, independent of the count. A smaller mode would not honestly cover an
item whose whole purpose is supplying evidence for a locked security gate's
human decision, even though D4 keeps the gate's own code untouched.

`fgos graph --what-if tsk-5t3` reports `unblocksTransitive: 0` right now —
`tsk-44f` (the only item that would depend on this one) is not filed yet
(per `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` D2), so
nothing in the current graph unblocks on this item's completion. Not a
reason to shrink scope; just an honest note that this item's payoff is
currently unrealized until `tsk-44f` exists.

## Approach

Two components, each a prose edit to an existing skill file — no new `.mjs`
code, no new CLI flag, no schema change (per `CONTEXT.md` D2-D4, which
already ruled out `.fgos/`-based and `docType`/`docPath`-based storage).

**1. Producer — `.claude/skills/fgos-coding-implement/SKILL.md`** (mirrored
byte-identical into `.agents/skills/fgos-coding-implement/SKILL.md` in the same
commit, per the mirror test above): add a step, run right before the
session calls `fgos return`, that:
- computes the item's final diff the same way `approve` itself will
  (`git diff <trunk>...fgw/<id>` — the exact range `reviewDiff`/
  `classifySource` use in `src/runner/merge.mjs`, not a different
  computation such as working-tree status or staged diff);
- calls `classifyIronLaw({ filesChanged, description: item.description })`
  (`src/evolve/iron-law.mjs`) on that diff;
- when `required: true`, writes `docs/history/<id>/iron-law-evidence.md`
  on the item's own branch containing: the matched flags/modules (from
  the classifier's own return value, so the evidence cites the same
  reasons the gate will), the test command run, and its failing-before /
  passing-after transcript excerpts (D1's pinned "failing-test-first
  proof" term);
- when `required: false`, writes nothing — D2's whole point is not
  paying this cost for the common case.

**2. Consumer — `plugins/fgOS/skills/merge-loop/SKILL.md`**: add a step,
run when `/fgOS:merge-next`'s recursed `approve` call reports the Iron Law
block shape (`{picked, blocked: "iron-law"}`, per `tsk-3mv`'s own scout
evidence of this reporting shape), that:
- reads `docs/history/<id>/iron-law-evidence.md` via
  `git show fgw/<id>:docs/history/<id>/iron-law-evidence.md` from the main
  checkout (D3's branch-ref pattern, same resolution `fgos-routing`'s own
  root-finding already uses);
- if present, prints its content in chat before surfacing today's
  stop-and-report message — never spliced into a shell command (RUL45
  still applies to this file's content, even though fgOS's own tooling
  authored it: printing is safe, executing or re-interpreting it is not);
- if absent, says so plainly and falls through to today's unchanged
  stop-and-report behavior — this item never makes evidence a
  precondition for anything, per D1.
- `approve`'s own CLI code and thrown message
  (`bin/fgos.mjs:1931-1938`) are not touched by either component (D4).

Order: producer before consumer — an evidence file has to exist before
there is anything for the consumer step to find and print. Both are small
enough (prose edits to already-open files) that there is no meaningful
scheduling risk either order; producer-first is just the logical
dependency, not a critical-path finding from `fgos graph` (nothing else in
the graph currently depends on either half, see `unblocksTransitive: 0`
above).

## Risk map

| Component | How risky | What would prove it |
|-----------|-----------|----------------------|
| Producer diff computation | Medium — if it computes a different file set than `approve` will (e.g. working-tree diff instead of `trunk...fgw/<id>`), evidence gets written for the wrong condition: false-negative (gate trips, no evidence exists) or false-positive (evidence written, gate never trips) | `fgos-coding-validating` dry-runs `classifyIronLaw` against a real `trunk...fgw/<id>` diff for an item known to touch a listed module (e.g. this item's own diff, which touches `bin/fgos.mjs`'s sibling skill trees — not `bin/fgos.mjs` itself) and confirms the file set matches what `reviewDiff` would compute |
| Consumer read path | Medium — a wrong `git show` ref/path silently finds nothing (fails safe: falls through to today's behavior, per D1) or, worse, a wrong quoting/splice of the file's content into a command (RUL45 violation) | `fgos-coding-validating` writes a throwaway `iron-law-evidence.md` on a scratch branch and confirms the exact `git show <branch>:<path>` command in the plan reads it back byte-for-byte from the main checkout |
| Skill-mirror / existing-verify regression | Low-medium — an edit that breaks `test/skills/fgos-mirror.test.mjs` (producer) or silently drops one of `tsk-1sm`'s required terms from `merge-loop/SKILL.md` (consumer) | `npm test` plus the item's own verify command below, both re-run after the edit |

## Split

No split. Both components are small prose edits to already-identified,
already-open skill files, fully specified by `CONTEXT.md` D2-D4 with no
remaining ambiguity a separate clarify/plan cycle would resolve — the cost
of two claims/two verify cycles would not buy anything a single pass
doesn't already cover. One item, two ordered steps within it.

## Verify

```bash
node --test test/skills/fgos-mirror.test.mjs \
  && diff .claude/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-implement/SKILL.md \
  && grep -qi "iron-law-evidence.md" .claude/skills/fgos-coding-implement/SKILL.md \
  && grep -qi "classifyIronLaw" .claude/skills/fgos-coding-implement/SKILL.md \
  && grep -qi "iron-law-evidence.md" plugins/fgOS/skills/merge-loop/SKILL.md \
  && grep -qi "acknowledge-iron-law" plugins/fgOS/skills/merge-loop/SKILL.md \
  && grep -qi "picked.*null" plugins/fgOS/skills/merge-loop/SKILL.md \
  && npm test
```
