# Shared fragment: citation-format

tsk-37i: fgOS has three citation ID systems, each with a different
lifetime and scope — global-permanent (`ADR<n>`, `docs/decisions/*.md`),
area-scoped-reset-per-file (`RUL<n>`, resets inside each
`docs/specs/<area>.md`), and feature-scoped (`D<n>` "D-local",
`docs/history/<feature>/CONTEXT.md`). That 3-tier shape is correct and
stays as-is — upstream project `beegog` independently converged on the
identical structure, recorded in
`docs/history/self-contained-id-references/DISCUSSION.md`. What was
missing was a single, canonical rule for how to CITE one of these ids
from anywhere other than its own home file — this fragment is that rule
(one rule, one home, learned from `beegog`'s own prompt-writing standard
of the same name: a rule is stated in full exactly once, and everywhere
else it appears as a one-line cite plus the local delta, never a bare id
and never a restated copy of the rule).

Point at this file from a consuming `SKILL.md`/spec (relative path, e.g.
`../_shared/citation-format.md`) instead of restating this convention in
each file's own prose.

## The rule

**ADR and RUL — cite as `<ID> (<one-line gloss>)`, never bare.**

```
Good:  ADR9999 (one-line summary of what the decision actually says)
Good:  RUL99 (one-line summary of what the rule actually requires)
Bad:   ADR9999
Bad:   9999
Bad:   RUL99
Bad:   RUL99 (runner)   <- an area-name-only suffix satisfies the
                            OLDER, narrower area-suffix convention
                            (docs/id-systems-audit.md) but not this
                            rule -- a real one-line gloss of what the
                            id actually says is required, an area
                            name alone is not enough
```
- The gloss must sit immediately after the id (only whitespace between),
  matching `<ID> (<gloss>)`. A citation with unrelated words sitting
  between the id and its parenthetical still reads as un-glossed to the
  mechanical check below — the parenthetical has to be the very next
  thing, not just present somewhere on the same line.
- The gloss's *accuracy* is prose discipline, judged at review — no shell
  command can verify a summary is faithful. Only the *structure* (is there
  a real parenthetical there at all, long enough to be prose rather than a
  bare list of other ids) is machine-checked.

**D-local — never cite outside its own `CONTEXT.md` at all, gloss or
not.** This is not a new rule — it is decision `0017`
(`docs/id-systems-audit.md` §5), already locked, previously unenforced.
A `D<n>` id belongs to exactly one feature's own
`docs/history/<feature>/CONTEXT.md` and is not a portable reference the
way `ADR`/`RUL` are. Citing it anywhere else — even with a gloss attached
— still leaves the reader unable to verify it without that one file, and
still breaks completely once the citing prose ships to a different
project. The only correct fix at a citation site is: **inline the
decision's actual content, and delete the id.** Before:

```
Never write CONTEXT.md/plan.md itself (D2).
```

After:

```
Never write CONTEXT.md/plan.md itself.
```

(the content was already the sentence itself — the id added nothing a
reader couldn't already see) or, when the id was standing in for content
not otherwise present:

```
Never write CONTEXT.md/plan.md itself -- that stays fgos-coding-exploring's
and fgos-coding-planning's job.
```

A heading drops the id the same way:

```
Before: ## Terminal handoff (D2 -- Native-First Dispatch)
After:  ## Terminal handoff (Native-First Dispatch)
```

The descriptive name is what a reader needs, the bare id is not.

## The mechanical check

`scripts/check-decision-citation-drift.mjs` (this fragment's own
companion tool, see
`docs/history/self-contained-id-references/CONTEXT.md` for the full
design record) detects two finding kinds relevant to this rule —
`bare-citation` (an `ADR`/`RUL` id with no qualifying gloss) and
`d-local-outside-home` (a `D<n>` id in any file that is not its own
`CONTEXT.md`) — across `docs/backlog.md`, `docs/specs/*.md`, and any
`--skills-dir` root given to it. It ratchets against a checked-in
baseline (`scripts/check-decision-citation-drift.baseline.json`): a
citation already known at the time the baseline was generated stays
visible in the tool's own output but does not fail `npm test`; a
genuinely new one does. `--write-baseline` regenerates the snapshot —
run it after a cleanup batch to shrink the baseline, never by
hand-editing the JSON.
