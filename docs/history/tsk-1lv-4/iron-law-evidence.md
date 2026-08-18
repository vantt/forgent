# Iron Law evidence: tsk-1lv-4

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against the real
committed diff (`changedFiles`, `src/runner/merge.mjs`) after commit
`4722361a`:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/runner/merge.mjs",
    "src/state/store.mjs"
  ]
}
```

## Inherited-diff note (tsk-28o precedent, same as tsk-1lv-3's own evidence)

All three matched modules are **inherited** from `tsk-1lv-1`/`tsk-1lv-2`
(already merged into `fgw/tsk-1lv` before this branch forked) — this
item's own commit (`4722361a`) touches none of them. Confirmed:
`git show --stat 4722361a` lists only `AGENTS.md`,
`docs/architecture-map.md`, 34 `docs/decisions/*.md` deletions + the new
`docs/decisions/index.md`, 4 `docs/specs/*.md` edits,
`scripts/check-decision-supersession.mjs`, `src/report/decision-index.mjs`,
and the two test files — no `bin/fgos.mjs`/`src/runner/merge.mjs`/
`src/state/store.mjs` in that list. Per the `tsk-28o` precedent this
repo's own `docs/how-to/fix-fgos-write-rejected-merge-block.md` documents:
"The fix is not to silence or dispute the classifier — it's reading the
real diff correctly... [the inherited file's] own proof stays where it
was actually produced, cited rather than re-derived." `bin/fgos.mjs`'s
own proof is in `docs/history/tsk-1lv-1/iron-law-evidence.md`;
`src/runner/merge.mjs`/`src/state/store.mjs`'s is split across
`docs/history/tsk-1lv-1/` and `docs/history/tsk-1lv-2/` — not re-derived
here.

## Verify command

```
node --test test/docs/decisions-corpus-retired.test.mjs
```

## Failing-before / passing-after transcript (this item's own diff)

**Before** (real transcript: checked out the pre-change
`src/report/decision-index.mjs`, `scripts/check-decision-supersession.mjs`,
and `test/report/enduser-index.test.mjs` from the parent commit, with the
new `test/docs/decisions-corpus-retired.test.mjs` and the migrated
`docs/specs/*.md`/`docs/decisions/` state already in place, then
regenerated `docs/decisions/index.md` with the pre-fix generator and ran
both this item's own verify command and the collateral
`enduser-index.test.mjs` suite it touches):

```
$ git checkout HEAD~1 -- src/report/decision-index.mjs scripts/check-decision-supersession.mjs test/report/enduser-index.test.mjs
$ node -e "generateDecisionIndex(...)"   # regenerated index.md WITHOUT type: explanation
$ node --test test/docs/decisions-corpus-retired.test.mjs test/report/enduser-index.test.mjs

ℹ tests 25
ℹ pass 23
ℹ fail 2

✖ fgos docs-index reads BOTH the docs/decisions/ alias and the primary docs/explanation/ dir into the explanation quadrant, tagged by quadrant name not source dir name
  AssertionError: ADR0001 must appear in the manifest via the alias
✖ every repo/docs/decisions/*.md file parses with parseFrontmatter to a non-empty meta.type
  AssertionError: index.md must have a non-empty frontmatter type
```

(`test/docs/decisions-corpus-retired.test.mjs`'s own 7 tests all passed
even against the pre-fix files above — they test the content-migration
side, which those two files never touched. The 2 real failures are both
in the collateral `enduser-index.test.mjs` suite this item's fixes target.)

**After** (real transcript, restoring the post-change files, regenerating
`index.md` with the real fix, and re-running the identical command):

```
$ git checkout HEAD -- src/report/decision-index.mjs scripts/check-decision-supersession.mjs test/report/enduser-index.test.mjs
$ node -e "generateDecisionIndex(...)"   # regenerated with type: explanation
$ node --test test/docs/decisions-corpus-retired.test.mjs test/report/enduser-index.test.mjs

ℹ tests 25
ℹ pass 25
ℹ fail 0
```

Regenerating `docs/decisions/index.md` after the restore produced a
byte-identical file to what commit `4722361a` already carries
(`git status --short docs/decisions/index.md` — clean), confirming the
generator is deterministic and the committed file is exactly what the
real generator produces from the real `state.decisions` log.

## Citation blast-radius accounting (full, not summarized away)

Per `docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`'s own
playbook, a full-repo grep for `docs/decisions/00` / `ADR00[0-9][0-9]`
was run (not just `addDecision`'s function callers) after the migration.
Real counts:

- **~150 files matched.** The large majority (a rough count: well over
  100) are under `docs/history/` — this repo's own append-only, frozen
  archival record (`tsk-1lv` parent's own D6 discussion: "docs/history/
  1157 file... tăng-theo-thiết-kế, không phải mục tiêu"). These are
  deliberately **not** edited — retroactively rewriting a point-in-time
  record to reflect a later reality is exactly the kind of edit this
  repo's own conventions forbid for that directory.
- **Fixed in this item:** `AGENTS.md`'s product-priority-order pointer (2
  citations, the most-visible always-loaded surface in the repo), and the
  two `test/report/enduser-index.test.mjs` assertions that would have
  actually broken (not just gone stale-but-harmless).
- **Not fixed, real and named:** roughly 15-20 files outside
  `docs/history/`/`docs/distillery/` (a `docs/reference/*.md`, several
  `docs/how-to/*.md`, `docs/backlog.md`, `docs/id-systems-audit.md`,
  `docs/io-contract.md`, code comments in `src/`/`bin/`/`scripts/`/`test/`,
  and skill prose in `.agents/skills/`) still cite old `ADR00NN` short
  codes or full `docs/decisions/00NN-*.md` paths. None of these are
  currently-broken *logic* (grep confirmed none of them are read
  programmatically the way `check-decision-supersession.mjs`'s CLI mode
  was) — they are prose citations that degrade from "clickable file path"
  to "findable by grepping the id," since every retired id's content is
  still real and locatable via `docs/decisions/index.md`, `state.decisions`,
  and the `### <id>` heading now living in its `docs/specs/`/
  `docs/architecture-map.md` home.

This was a deliberate scope decision, not an oversight: `check-decision-
citation-drift.mjs`'s default CLI mode (`docs/backlog.md`+`docs/specs/*.md`
against `docs/decisions/*.md`'s own `superseded_by` frontmatter) reports
`no findings` post-migration — trivially true now that the directory holds
no frontmatter-bearing ADR files to scan against, which is the literal
proof point the parent plan's own risk map named for this task. Doing a
genuinely bounded, systemic version of this check (widened beyond
supersession-acknowledgment to bare-citation-liveness, across every doc in
the repo) is exactly task 5's own stated scope (the 4-door
freshness/impact/routing/doc-deferral check inside `retrospective`), not
this task's.
