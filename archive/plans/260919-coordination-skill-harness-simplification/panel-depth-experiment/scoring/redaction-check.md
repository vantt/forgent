# Redaction self-check (rubric Section 4)

Ran, after two manual passes (mechanical script + hand-removal of self-referential
"deliberately blind" framing sentences that the mechanical pass could not safely
regex out) a grep across every `explanation-*.md` and `control-objections-source-*.md`
file for: `red-team`/`redteam`/`red team`, `full protocol`/`standard variant`,
`architecture-advisory-panel-v1`/`-standard-v1`, `asgn_*`/`coord_*`/`aap-p052-*`/`i27-*`
ids, `/home/vantt` paths, `claude-cli-bwrap`/`codex-cli-bwrap`/`agy-cli*`/`pi-cli-bwrap*`
executor ids, and the self-referential phrases `deliberately blind`, `blind by design`,
`written blind`, `this probe`.

First pass found 3 real hits (a literal `architecture-advisory-panel-v1` protocol-id
mention in case-3's `explanation-Y.md` and both `control-objections-source-*.md`
files). Fixed. Second pass: **zero hits across all files.**

Two additional hand-caught leaks the automated grep list above would not have
caught on its own (recorded here for the record, not because the grep found them):
`case-1/explanation-Y.md` originally named itself "This probe forbade reading..."
and carried a "Note on the packet header" section describing the dispatch
mechanism's operation-type mismatch; both removed as run-condition meta-commentary,
not decision substance.
