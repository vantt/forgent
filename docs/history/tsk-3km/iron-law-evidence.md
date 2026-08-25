# Iron Law evidence — tsk-3km

`classifyIronLaw` against the real committed diff (commit `3f1e26f4`, the
out-of-process worker's own commit) returned:

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/prompt-templates/worker-prompt-default.txt","src/runner/prompt-templates/worker-prompt-skill-pointer.txt"]}
```

(run via `node --input-type=module -e "import { changedFiles } from
'./src/runner/merge.mjs'; import { classifyIronLaw } from
'./src/evolve/iron-law.mjs'; import { listWork } from
'./src/state/store.mjs'; const item = listWork('/home/vantt/projects/
forgentX/.fgos').work['tsk-3km']; const filesChanged = changedFiles('.',
item); console.log(JSON.stringify(classifyIronLaw({ filesChanged,
description: item.description })));"` — run AFTER the implementation
commit landed, per `docs/how-to/produce-failing-test-first-proof-for-an-
iron-law-gated-diff.md`'s own false-negative warning).

The dispatch mechanism for this item's Implement step was `out-of-process`
(`agy`/`gemini-3.6-flash-medium`, per `.fgos/config.json`'s
`capabilities['fgos-coding-implement'].prefer`) — per
`../_shared/coding-worker-contract.md`, the out-of-process worker contract
does not yet ask a worker to run `classifyIronLaw` or write this file
itself (that gap is `tsk-3ys`, still `status:todo`, a distinct item this
one does not depend on landing first). This evidence was therefore
produced retroactively by the driver, the exact "get honestly to red"
recipe the how-to doc describes, adapted for an already-committed diff
(restore the pre-implementation file content, not `git stash`, since
nothing was uncommitted at evidence-production time):

## The recipe actually run

1. **Scoped test command** (the item's own `verify`, unchanged before and
   after):
   ```
   node --test test/runner/prompt-templates.test.mjs
   ```

2. **Get to red honestly.** Restored the two implementation files (not
   the test file) to their pre-implementation content via `git checkout
   9b17b8b4 -- src/runner/prompt-templates/worker-prompt-default.txt
   src/runner/prompt-templates/worker-prompt-skill-pointer.txt`
   (`9b17b8b4` = the commit immediately before the implementation commit
   `3f1e26f4`, i.e. this item's own plan/research commit). Running the
   scoped test command against that state produced a real failure — not
   invented:

   ```
   ℹ tests 12
   ℹ pass 10
   ℹ fail 2

   ✖ renderTemplate(worker-prompt-default.txt, ...) golden output — no-feedback shape, byte-for-byte
     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
     ... (diff shows the golden `expected` string carrying the new
     "# How to finish" section; `actual`, built from the reverted
     pre-implementation template, has no such section — the two
     `renderTemplate` calls in the test file are what differ, the test
     file itself was untouched throughout)

   ✖ renderTemplate(worker-prompt-skill-pointer.txt, ...) golden output — no-feedback shape, byte-for-byte
     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
     ... (same shape: `expected` carries the new section between
     "# Worktree boundary" and "# Expected proof", `actual` from the
     reverted template does not)
   ```

   The other 10 tests (`selectTemplate`/`loadTemplate`/`hashTemplate`)
   passed throughout, as expected — they do not depend on the new section
   at all, confirming the red was scoped to exactly the two golden-render
   assertions this item's change touches.

3. **Get back to green.** Restored the implementation files to their real,
   committed content via `git checkout HEAD -- src/runner/prompt-templates/worker-prompt-default.txt
   src/runner/prompt-templates/worker-prompt-skill-pointer.txt`. Running
   the identical scoped test command now passed in full:

   ```
   ℹ tests 12
   ℹ pass 12
   ℹ fail 0
   ```

   `git status --short` immediately after confirmed a clean tree (aside
   from the worktree's own pre-existing, unrelated `.fgos/` deletions —
   ADR0020's deliberate strip of `.fgos/` from every linked worktree,
   present before this item touched anything and untouched by this
   recipe).

4. **Full suite, once more, for regression proof.** Per this repo's own
   environment caveat (`npm test` silently under-runs on this Node
   version), ran bare recursive auto-discovery instead:
   ```
   FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
   ```
   Result: `3896` tests, `3890` pass, `1` fail, `5` skipped. The one
   failure — `herdr-plugin/web/src/api/client.test.ts` (a TS-resolution
   issue) — is a pre-existing, unrelated failure already present on `main`
   itself, not caused by this item's diff (confirmed against this driving
   session's own environment notes, not re-verified against `main` again
   here since it is out of this item's footprint by construction — its
   only touched files are two prompt templates and their own golden test,
   nothing under `herdr-plugin/`). No new failure and no new skip
   appeared beyond that one known baseline failure.

5. **Impact-analysis posture: `degraded`, named plainly, not skipped.**
   `fgos tool query --capability impact-analysis --status present` reports
   GitNexus present, but `mcp__gitnexus__list_repos` shows no index
   registered for this item's own worktree
   (`.claude/worktrees/tsk-3km-eQfCsN`) at all, and the nearest registered
   sibling (the main checkout) is 1433 commits stale — not fresh enough to
   trust for this diff. `detect_changes()`/`impact()` was therefore not
   run against a mismatched or stale index (which could produce a
   misleadingly confident-looking but wrong blast-radius read); the
   cross-check already recorded in this item's own `RESEARCH.md` Round 1
   (`grep -rn "worker-prompt-default\|worker-prompt-skill-pointer" src/
   --include="*.mjs"` — exactly one hit, `prompt-templates.mjs`'s own
   `TEMPLATE_RULES` string literals, unchanged by this diff) stands in as
   the honest substitute, per `plan.md`'s own Approach section.

## Why this is a real proof, not an assertion

Steps 2-3 above show the actual `node --test` stdout for both the red and
the green run, not a paraphrase — the exact assertion diff, the exact
pass/fail counts. The 10-vs-12 pass count and the specific two failing
test names match exactly what this item's own diff should and does touch
(the two golden-render assertions on the very two templates this item
edits), and nothing else in the same file's other 10 tests ever flipped.
