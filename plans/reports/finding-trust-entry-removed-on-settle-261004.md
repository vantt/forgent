# Finding: the runner deletes the human's folder-trust entry when a dispatch settles (2026-10-04)

## Symptom
Claude-Code-based herdr executors (claude-herdr, glm-herdr) stopped at the folder-trust dialog "Is this a project you created or one you trust?" for
`/home/vantt/projects/forgentX`, repeatedly. The owner accepted it at ~22:00; it was back by 22:40.

## Cause (code + reproduction)
- `src/runner/dispatch/herdr-round.mjs` `seedWorkspaceTrust` seeds an entry for the dispatch cwd, derived from the trusted repo root. `seedTrust` returns
  `false` when the entry already exists ("already seeded") and `seedWorkspaceTrust` ignores that result (`:644`).
- `removeWorkspaceTrust` (`:699-713`) then calls `removeTrust(target, projectPath)` unconditionally on every settle path; `removeTrust`
  (`trust-store.mjs:192`) deletes the entry whenever it exists.
- For a read-only run the dispatch cwd is the main checkout, so `projectPath === repoRoot`: the entry the HUMAN vouched for is the one that gets deleted.
- Reproduced on a temporary store: seed returns false, remove returns true, the human entry is gone.
- Observed: flag true at ~22:01, undefined after the next claude-herdr run; project count 200 to 199; `trustRemoved: claude-json` in that run's `visibility.json`;
  the following dispatch logged `trustSeedFailed ... its repo root ... is not itself trusted`.
- The same shape exists for the codex and agy stores (`removeCodexTrust`, `removeAgyTrust`): not checked.

## Impact
Every claude-based herdr dispatch into the main checkout can make the owner's own Claude sessions ask for trust again, and makes the next claude dispatch fail.

## Fix (done)
The round now records whether it wrote an entry (`round.trustWritten`, set only when the seed returned true) and teardown removes only then. Covers the claude, codex and agy stores (one guard in `removeWorkspaceTrust`). Tests: two new cases in `test/runner/herdr-spawn-adapter.test.mjs` (claude-json and agy; both red before the change).

## Original fix direction
Remove only an entry this dispatch created: carry the seed result from seed to remove (per round) and skip removal when the entry pre-existed. Same for codex/agy.
Test: seed on an already-trusted root, settle, entry survives. Touches `herdr-round.mjs`, a 92 KB file: impact analysis first.

## Related, same session
- Starting any run while committing in the checkout turns read-only panelists into `read-only-mutation` (a concurrent commit counts as a mutation): do not write to the checkout while a read-only run is in flight.
- deepseek (cli only) cannot write its report: `EROFS` on the flat run directory.
