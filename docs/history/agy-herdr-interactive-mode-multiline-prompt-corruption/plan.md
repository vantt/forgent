# agy-herdr-interactive-mode-multiline-prompt-corruption — plan.md

Mode: tiny (0-1 flags: a single documentation file, no production code
touched — the risky mitigation itself already landed in a prior, separate
commit; this item's own footprint is read-only research already written
and committed in discovery).

## Approach

RESEARCH.md Round 1 already did the real work: live-reproduced the exact
root cause with real `herdr`/`agy` binaries (a controlled single-line vs.
multi-line prompt comparison), confirmed the existing mitigation
(`fgos-coding-implement` defaulting to `agy-cli`, commit `21966be3`,
already on `main`) is sufficient, and scoped a real follow-up fix
(`send-text`/`send-keys` sequencing in `herdrSpawnInteractiveAdapter`)
that needs its own separate live-verification pass this item does not
attempt. Nothing further to design — the file is already written and
committed.

Files touched: none beyond what discovery already committed
(`docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md`).

Risk map: none — no production code changes.

## Shape

Nothing further — RESEARCH.md is the complete deliverable for this item's
own scope (root-cause + document; fix deferred as a named follow-up).

## Outstanding questions

None.
