# Iron Law evidence — tsk-bc7

## classifyIronLaw result (against the real committed diff)

```json
{"required":true,"matchedFlags":["audit"],"matchedModules":[]}
```

Run against `changedFiles(repoRoot, item)` AFTER committing the real
implementation (`git add`/`git commit` first — the ordering
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
own "watch out" section requires, to avoid the false-negative `tsk-2l0`
found).

## Why this trips the gate — and why the usual failing-test-first recipe does not apply here

`matchedFlags: ["audit"]` is a **description-keyword** match
(`src/intake/risk-keywords.mjs`'s `HEAVY_KEYWORDS` list includes the
literal word `audit`, and this item's own title/description says "Hậu
kiểm (post-hoc audit)"). `matchedModules` is **empty** — no file this
item touched is on the Iron Law's self-modifying gated-module list
(`src/evolve/iron-law.mjs`'s `MODULE_RULES`). The gate fires because of
the item's own subject matter, not because the diff itself is
self-modifying capability code.

The item's real committed diff is:
- `docs/history/tsk-49i-iron-law-port-followup-audit/plan.md` — a new doc
  file (planning artifact), no executable content.
- `src/setup/registrations.mjs` — a **3-line comment-only edit**
  (`git show 41bfcbd2 --stat`: 3 insertions, 3 deletions, comment text
  only — updates a stale reference from `bin/fgos.mjs's readIronLawLevel`
  to `src/verbs/merge/iron-law-level.mjs's readIronLawLevel`, the
  function's real post-port location). Zero behavioral change: no
  identifier, no control flow, no runtime string changed.

The standard "stash the implementation, get to red, restore, get to
green" recipe assumes the diff changes *behavior* a test can observe
differently before and after. A comment-only edit has no such behavior —
there is no red state to honestly produce, and inventing one (e.g.
temporarily breaking something unrelated just to have a "before" failure)
would be exactly the fabrication this proof requirement exists to
prevent. The honest equivalent proof for a behavior-neutral diff is
**identical test results before and after**, confirming the change did
not regress anything:

## Real evidence: `npm test`, run before AND after the comment edit

**Before** (registrations.mjs still had the stale comment):
```
ℹ tests 3369
ℹ suites 0
ℹ pass 3364
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 129326.029045
```

**After** (comment fixed, commit `41bfcbd2`):
```
ℹ tests 3369
ℹ suites 0
ℹ pass 3364
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 129916.116781
```

Identical pass/fail/skip counts (3364/0/5 out of 3369) both times — the
comment fix is provably behavior-neutral, which is the correct proof
shape for a diff with no executable change to test.

## The rest of this item's audit work (the actual "audit" the description names)

This item's real deliverable is the audit itself, carried out during
`fgos-coding-validating`'s reality-gate/feasibility-matrix step (not a
separate execution phase — the plan's proof points ARE the audit):
line-by-line comparison of `src/verbs/merge/iron-law-level.mjs`,
`approve.mjs`, `sync-root.mjs`, `merge.mjs`'s `wouldTripIronLaw`,
`CHANGELOG.md`, and `docs/architecture-manifest.json` against
`d694a7d2737c0a43cab2e62399243726078b109e` (main's own original Iron Law
trunk-boundary commit, pre-port); confirmation that every file
`d694a7d2` touched beyond `bin/fgos.mjs` survived the port via git
ancestry; and confirmation `.fgos/` carries no stray diff in merge commit
`5f4005fa945877c7a6b249f44891b465dda48aaf` (`git diff --stat` against
`ede5994b5c11873c6f8a6fd57a7a9b8a874f8c6d`, empty). All of that is a read
audit with no code changed by it — the one real code change this item
made is the comment fix documented above, which is what `classifyIronLaw`
is actually gating.
