# Supervisor wake 17:12

## Queue

- session-idle `3bc0ebcb…` (lead:WINCUSTODY, `forgent-261121-1309-git-wi-2454d`): this was a false alarm. At 17:12 the lead finished a turn with two shells still running. One is the phase 5 fix round for two bugs found on Windows CI run 44890889362. The first is that registry lock paths use the verbatim `\\?\` spelling with `/` separators (holder-lock `scope.rs` `lock_path`). The second is that a restore snapshot does not round-trip on Windows. The other shell watches phase 4 Windows CI run 44891585144. The harness wakes the lead when those finish. Marked handled.

## Plans

- 4 of 4 leads are live: s6a-execution-tier-rust, work-data-model, git-windows-custody and windows-ci-packaging-reds. No plan is admissible, and 2 lanes are free.
- work-data-model: phases 5, 6 and 7 are waiting on three owner questions about the footprint (q-ekkgwaavrb, q-wb6bdz3c72 and q-76qpywi7if). The lead is waiting correctly, so no action.
- `supervisor plans` lists 89 plans as unreadable because their status values are older than plan-v1. Phase 7 of work-data-model owns that problem, and q-wb6bdz3c72 blocks it.

## Open owner questions

- q-o3omqvtsuc (asked by this session): the owner needs to run the patch that pins planner heads to Claude Opus.
- q-ekkgwaavrb, q-wb6bdz3c72, q-76qpywi7if: decisions on the work-data-model footprint.
