---
authoritative_for: footprintDiffHits (bin/fgos.mjs) firing guaranteed noise on docs/history/<feature>/RESEARCH.md for nearly every item that runs fgos-researching, because the footprint-sync convention never requires listing RESEARCH.md — confirmed live during tsk-22b's own return
---

# A third "100% guaranteed noise" path in `footprintDiffHits`, fixed the same way as the first two

`tsk-67o` fixed a false-positive noise source in `footprintDiffHits`
(`bin/fgos.mjs`, computed at both `fgos return` call sites, the underlying
function defined in `src/runner/frozen-judge.mjs:89`): it fired on
`docs/history/<feature>/RESEARCH.md` for nearly every item that runs
`fgos-researching` during discovery/planning/validating.

## Why it always fired

`fgos-coding-planning`'s footprint-sync convention
(`.agents/skills/fgos-coding-planning/references/verify-sync-and-gap.md`)
only requires syncing `plan.md` into an item's `footprint` field as the
minimum — it never mentions `RESEARCH.md`. So a real item's declared
footprint almost never lists the research doc, even when the doc genuinely
belongs to that item's own work. Confirmed live during `tsk-22b`'s own
return: `fgos return tsk-22b` output included
`"footprintDiffHits": [{ "file":
"docs/history/data-dictionary-no-stuck-merge-abort-drift/RESEARCH.md" }]`
even though `passed: true` and the item's footprint had been correctly
synced per the documented convention (`plan.md` +
`docs/specs/distribution.md`).

## The third instance of a pattern already fixed twice

`bin/fgos.mjs` already documents and fixes this exact "100% guaranteed
noise" shape for two other paths:

- **`tsk-4hl`** — `docs/history/<id>/iron-law-evidence.md`, exempted via
  `excludeIronLawEvidence`.
- **`tsk-x5r`/`tsk-5iv`** — `.fgos/events.jsonl` and similar store paths,
  exempted via `excludeFgosPaths`/`FGOS_NOISE_ONLY_PATHS`.

`RESEARCH.md` couldn't reuse either helper unmodified: unlike
`iron-law-evidence.md`'s fixed `docs/history/<id>/` path, `RESEARCH.md`
lives under `docs/history/<feature>/` where `<feature>` is a free-form
slug not guaranteed to equal the item id (`docsRef` carries that mapping,
not the item id itself).

Currently this hit is advisory-only — it never blocks `return` — but it
defeated the purpose of the advisory the same way the two prior instances
did before their own fix: real noise on real passing returns erodes trust
in the signal.

## What shipped

A new `excludeDocsRefResearch(files, item)` helper was added alongside
`excludeIronLawEvidence`/`excludeFgosPaths`, narrowed to the item's own
`item.docsRef` directory (never a blanket `RESEARCH.md` exemption):

```js
function excludeDocsRefResearch(files, item) {
  if (typeof item?.docsRef !== 'string' || !item.docsRef.trim()) return files;
  const researchPath = normalizePath(path.posix.join(item.docsRef.replace(/\/+$/, ''), 'RESEARCH.md'));
  return files.filter((f) => normalizePath(f) !== researchPath);
}
```

Wired into both `footprintDiffHits` call sites (`~3189`, `~3320`), composed
with the existing exclusions:
`footprintDiffHits(excludeDocsRefResearch(excludeFgosPaths(excludeIronLawEvidence(changed, id)), item), item.footprint)`.
A docsRef-keyed exemption test was added to `test/cli/fgos-return.test.mjs`.

## An unrelated pre-existing gap surfaced, not fixed here

Verifying this item's own fix first failed for a reason unconnected to the
fix itself: `test/cli/fgos-return.test.mjs` + `frozen-judge.test.mjs` also
run two pre-existing tests (`tsk-x5r self-exempt`, `ONLY .fgos/ is dirty`)
that failed because `excludeFgosPaths`' `FGOS_NOISE_ONLY_PATHS` regex does
not yet cover `.fgos/events-jsonl.truncation-guard.json` — a file
introduced by the separately-merged `tsk-3ve` event-log sharding
migration. Confirmed by direct reproduction: the identical 3 failures occur
on the pre-`tsk-67o` base commit and on the real main checkout itself,
unrelated to this item's own diff. Left unfixed here — different
footprint, different root cause — but named for whoever next touches
`FGOS_NOISE_ONLY_PATHS`.
