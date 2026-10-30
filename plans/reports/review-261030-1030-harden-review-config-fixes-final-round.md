# Review: last cleanup round of the config lane (`ead6abb59`)

- **Asked by:** COOK (`forgent-b7`), 2026-10-30. Owner agreed to the round.
- **Reviewer:** lead:HARDEN (`claude-p74h@fg-server2`), read-only on main.
- **Verdict: PASS.** Two Lows, neither blocks.

## The two questions COOK asked

### 1. Is any message suffixed twice?

No.
- `grep "source layer"` over `src`, `bin`, `packages` and `apps` finds only the constructor at `src/runner/execution/patterns/catalog-entries.mjs:36` and its comment.
- Before the commit, every `CollaborationError` that passed `source` also put the suffix into its message by hand, including the two built in a `msg` variable (old `:546-548`, `:559`). The commit removed all of them, so no call site that now gets the suffix from the constructor still adds one itself.
- The 48 throws in `catalog.mjs` pass no `source`, so their message is unchanged.
- `run.mjs:780` copies `err.message` into `RunnerConfigError` and does not attribute it. The message carries the suffix just as it did before, so its text does not change.
- `registrations.mjs:552` now passes `p.detail`, and `attributeRunnerConfigError` (`src/runner/dispatch/config.mjs:262`) uses `err.detail ?? err.message`. The doctor line therefore shows the sentence once, without the layer. That closes the `endsWith` Low from round five.

### 2. Is it safe to delete the copy only when it is byte-identical?

Yes.
- The copy is taken right before the write door (`runner-config-conversion.mjs:196`). If the bytes are still the same after a refusal, the copy holds nothing the file does not, so deleting it loses nothing.
- In every other case `discardUnusedBackup` keeps the copy: when the door wrote part of the file, when another writer changed it in between, or when either file cannot be read. A race can only leave an extra file, never delete one that was needed.

## Lows

1. **A kept copy is no longer reported.** The `blocked` result has dropped its `backup` field. When the bytes differ, the copy stays on disk, but neither the result nor the setup output says where. Fix: set `backup` only when `discardUnusedBackup` kept the copy, for example by having it return whether it deleted.
2. **The keep branch has no test.** Both changed tests (`runner-config-conversion.test.mjs:247,270`) cover only the identical case. Fix: extend the `:270` test with a `patchDoor` that changes the file and then throws, and assert that the copy remains. This is an extension, not a new test.

## Gate

- I did not rerun the gate. COOK's numbers are npm 8784/8821, with only the three known mailbox reds, and a clean census.
- Those three reds are fixed on main since `6f6e1f257`'s gate (8787/0), so a rerun now should show no fails.
