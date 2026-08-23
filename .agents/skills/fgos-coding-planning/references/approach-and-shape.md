# Approach and Shape — full mechanics

The full detail behind SKILL.md's Step 2 (Approach) and Step 3 (Shape).

## Approach

Write the chosen path and the alternatives rejected along the way, a risk
map (component / how risky / what would prove it), the files likely
touched, and the order they need to happen in. Before fixing that order,
run `fgos graph --json` and read its `criticalPath` and `topUnblock`
fields — let those inform which piece goes first instead of ordering by
judgment alone. Cite the CONTEXT.md decision each choice honors. A medium
or high risk in the map needs a proof point at `fgos-coding-validating`,
not a guess here.

Before writing a proof point that would lean on blast-radius evidence,
run `CLAUDE.md`'s impact-analysis capability gate (`fgos tool query
--capability impact-analysis --status present`) instead of assuming
GitNexus is on this machine. Record the resulting posture
(`impact-analysis: inactive|degraded|full`) in `plan.md` next to that
proof point — inactive drops the requirement, degraded keeps it but marks
the evidence weak, full keeps it exactly as before.

If a named library/precedent surfaces that neither CONTEXT.md nor a
direct read resolves, dispatch to `fgos-researching` — the rare
`consult` interaction, not the default path:

```bash
node "$root/bin/fgos.mjs" handoff "<id>" --to researcher --reason consult --outcome "<finding, one line>" --dir "$root"
```

## Shape

Write (or enrich) `plan.md` scaled to the mode: a direct note for `tiny`,
one open question for `spike`, a short plan for `small`, a phased plan
for `standard`, a fuller map for `high-risk`. Sketch the concrete cases
worth proving against — empty/boundary input, existing behavior that
must not regress, concurrent access, partial failure — at a depth
matching the mode; a `tiny` item does not need the same sketch a
`high-risk` one does.

End `plan.md` with a section using this exact heading (nothing appended
on that line), body `None` when nothing is outstanding, or a real list
otherwise:

```markdown
## Outstanding questions

None
```

Same convention `fgos-coding-exploring` already writes into CONTEXT.md,
read by the same gate-bypass `hasOpenItems` check at
`fgos-coding-validating`'s own Gate (this skill has no gate of its own —
see SKILL.md's "No gate here"). In the common case this reads `None`:
Step 6 already routes any newly-discovered *material* question back into
CONTEXT.md before this section is ever written, so a real item here
should be rare.
