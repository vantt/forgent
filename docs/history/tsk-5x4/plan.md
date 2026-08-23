# plan.md — tsk-5x4: two evidence-doc-accuracy corrections

Mode: tiny

## What this closes

Two unrelated docs/history-only corrections found in the same post-hoc
audit, bundled because both are the same class (evidence accuracy, no
src/ touched, no conflicting session claim):

1. `docs/history/merge-conductor-throughput-and-human-release/
   iron-law-evidence-tsk-51m-root.md` — its recorded 2985-test full-suite
   run was measured on a tree later found (commit `254f61e9`) to have been
   silently reverted by a stale worktree index. Added an addendum with the
   root cause and a fresh, correct run against `main`'s current tip.
2. `docs/history/tsk-60h-merge-conflict-catchup-playbook/plan.md` —
   tsk-60h's own stored `verify` field greps a literal string that no
   longer exists verbatim after a later item's wording consolidation.
   Added an addendum noting the drift; did NOT edit tsk-60h's own stored
   verify field itself (immutable historical record of a delivered item).

## Why not Iron Law

Neither file matches any `src/evolve/iron-law.mjs` `MODULE_RULES` entry —
both are pure `docs/history/*.md` edits, no `src/`, `bin/fgos.mjs`, or any
other gated module touched.

## Verify

```
npm test
```

Purely additive prose changes to two markdown files; `npm test` staying
green is the only meaningful check (no code path reads either file).
