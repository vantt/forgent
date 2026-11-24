# Phase 6: Recall regression measurement

## Context

Spec 15: the gold set and trial cases rerun after any change of provider version, model or ranking. F22 gives the
gold files in pkm's format and the 2026-11-21 baseline. Decision 9.

## Files it writes

`src/cli/command-registry.mjs` (`--eval <file>` on `doc locate`), the three regenerated host contracts,
`apps/fgos/src/wiring/doc_locate.rs`, `docs/platform/documentation/subcomponents/document-identity/verification/recall/**`
(gold label normalisation only if needed), and one measurement report at the path
`fgos convention path --kind report --type measurement --slug docos-pkm-v0-7-locate-recall --json` returns.

## Steps

1. `fgos doc locate --eval <gold.yaml> [--json]`: parse with pkm's `structure::eval::parse_gold`, run the adapter's
   `eval`; refuse (`index-not-ready`, state and eta) unless the state is `ready`. Unit coverage of the `docs/` mapping
   is already in phase 2's crate test; add a case there for an eval path if missing.
2. Check the committed section labels carry no `#` marks (the 2026-11-21 report asked for this); normalise if any remain.
3. Measure on the main checkout of fgOS, with the model fetched (phase 4) and no other heavy IO:
   `fgos doc index status --wait 900`, then both gold files, then `vi-queries-en.json` if pkm accepts it, recording wall
   time, worker peak RSS, index size and cold/warm locate latency.
4. Write the report: per-file recall@3/@10, right-section-first count, every case whose rank changed against F22, costs.

## Validation (acceptance criterion 4 of plan.md)

```sh
flock -o /home/vantt/projects/.doc-work/doc-heavy.lock sh -c '
  npm run fgos:dev -- doc index status --wait 900 --json &&
  npm run fgos:dev -- doc locate --eval docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-vi-en.yaml --json &&
  npm run fgos:dev -- doc locate --eval docs/platform/documentation/subcomponents/document-identity/verification/recall/locate-gold-short.yaml --json'
```
vi-en recall@3 ≥ 91.7%, @10 ≥ 95.8%; short recall@3 ≥ 65.9%, @10 ≥ 90.9%.

## Risk

Corpus has grown since the baseline, so small rank moves are expected; the report names them instead of hiding them.
A real drop below the gate stops the plan and goes to the owner with the case list.

## Rollback

Revert the flag; the report stays as a record.

## As built (2026-11-24)

- `fgos doc locate --eval <gold> [--json]` measures on a ready index and refuses `[index-not-ready]` otherwise, starting
  the worker; `fgos doc index status --wait` now starts the worker it waits for, and every index state names an fgos
  verb instead of a `pkm` command.
- The rendered profile leaves out `past-state` folders (`history`, `proposals`) and `docs/distillery/` (spec 5.4,
  owner 2026-11-24); a crate test proves neither is ever a candidate.
- Gold labels already carried no `#` marks; the 88 `#` in `locate-gold-short.yaml` are inside query text.
- Measured ([report](../reports/measurement-261124-0511-docos-pkm-v0-7-locate-recall.md)): on the pinned 2026-11-12
  corpus the engine reproduces the baseline exactly (91.7% / 95.8%, 14 of 23 sections, 67.0% / 92.0%), so the gate
  passes. On the live corpus translated notes reach 83.3% / 91.7%; the cases and causes are in the report. The owner
  moved the gate to the pinned corpus on 2026-11-24.
- pkm's index worker ignores `vault.exclude` and embeds the excluded folders anyway (42,169 against 23,100 chunks);
  filed as [vantt/pkm#2](https://github.com/vantt/pkm/issues/2).

