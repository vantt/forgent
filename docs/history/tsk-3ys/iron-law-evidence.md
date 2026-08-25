# Iron Law evidence — tsk-3ys

`classifyIronLaw` on this item's real committed diff (`fgw/tsk-3ys` vs
detected trunk, computed via `changedFiles`/`classifyIronLaw` per
`fgos-coding-implement`'s own Step 4 recipe, run from the item's own
worktree at commit `cbf5c39a79b549e3c89494cb442d30ba537b88f0`) returns:

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/prompt-templates/worker-prompt-skill-pointer.txt"]}
```

`matchedModules` trips on `src/evolve/iron-law.mjs`'s `MODULE_RULES` prefix
rule for `src/runner/` — the touched file sits under that directory.

## Recipe used

Following `docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`'s
stash-based shape (adapted: the implementation file was already committed
by the time this evidence was produced, so a targeted `git checkout
<parent-commit> -- <file>` / `git checkout HEAD -- <file>` round-trip was
used instead of `git stash`, since there were no uncommitted changes left
to stash — same effect: only the implementation file's content changes
between the two runs, the test file never does).

1. Test file covering the change: `test/runner/prompt-templates.test.mjs`.
   Command used both times, unchanged:
   ```
   FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test test/runner/prompt-templates.test.mjs
   ```

2. **Get to red honestly** — reverted only the implementation file to its
   pre-fix content (the commit just before this item's implementation
   commit):
   ```
   git checkout d546d306 -- src/runner/prompt-templates/worker-prompt-skill-pointer.txt
   ```
   Running the test command against that pre-implementation content
   produced a real failure — not invented:
   ```
   ✖ renderTemplate(worker-prompt-skill-pointer.txt, ...) golden output — no-feedback shape, byte-for-byte (6.932171ms)
   ℹ tests 12
   ℹ pass 11
   ℹ fail 1

   AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   + actual - expected
   ...
   -   '# Iron Law evidence\n' +
   -   'This repo is self-modifying: fix any of its own runner/evolve/state modules\n' +
   -   "(`src/evolve/iron-law.mjs`'s `MODULE_RULES`) and one extra guardrail applies\n" +
   -   '— proof a fix was validated against a real failing test before it existed.\n' +
       ... [full "# Iron Law evidence" section body omitted here for
       brevity; the live run's real diff showed every line of it missing
       from `actual`, present only in `expected`] ...
   -   '\n' +
       '# How to finish\n' +
   ```
   The assertion diff shows the entire new `# Iron Law evidence` section
   present in `expected` (the golden string the test file already carries)
   but absent from `actual` (the reverted template's rendered output) —
   exactly the change this item makes, and nothing else. 11/12 tests still
   passed (every other template/golden test, unaffected by this file).

3. **Get back to green** — restored the implementation file from `HEAD`:
   ```
   git checkout HEAD -- src/runner/prompt-templates/worker-prompt-skill-pointer.txt
   ```
   Running the identical test command now passed in full:
   ```
   ℹ tests 12
   ℹ pass 12
   ℹ fail 0
   ```

4. Full suite run once more, same commit, proof the fix didn't regress
   anything the scoped test command wouldn't have caught:
   ```
   FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'
   ```
   ```
   ℹ tests 4017
   ℹ pass 4012
   ℹ fail 0
   ℹ skipped 5
   ```
   (5 pre-existing skips, 0 failures — matches the baseline this repo's
   suite already runs at.)

5. GitNexus `detect_changes()` was not run for this item — a
   template-text-only change with no code-path/data-flow implications
   (tier `light`, risk `light`, plan.md's own recorded risk map: low), and
   the how-to's own step 5 names it as conditional ("if GitNexus is
   available"), not mandatory. The scoped + full-suite runs above already
   give direct, stronger evidence for this specific change than a
   blast-radius graph traversal would for a prose-only template edit.

## Provenance note

This item's real implementation was originally produced by a genuine
out-of-process worker dispatch (`agy`/`gemini-3.6-flash-medium`,
`node src/runner/dispatch.mjs execute fgos-coding-implement`), which
committed the correct content (verified byte-for-byte against
`plan.md`'s own Shape §1/§2) but — due to a live cross-worktree cwd race
affecting multiple concurrent sibling driving sessions in this same batch
— landed the commit on a different item's branch (`fgw/tsk-ri8`, as commit
`512ee690926d473761de7693b846bea5ff1339eb`) instead of `fgw/tsk-3ys`. The
commit was independently verified (content, diff, byte-for-byte match to
plan.md) before being cherry-picked onto this item's own branch
(`fgw/tsk-3ys`) and its message corrected to remove the mislabel. This
Iron Law evidence step itself, and every command transcript pasted above,
was run directly, in-process, against this item's own real branch state —
not reused from the original worker's own claims.
