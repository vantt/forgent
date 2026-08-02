# tsk-66x — `fgos merge` false negative from inside a git worktree

## Feature boundary

`fgos merge list`/`fgos merge next`, run without `--dir` from a cwd that
is a linked git worktree (which never carries its own `.fgos/`, per
ADR0020), silently return a valid-looking empty result
(`{picked: null, reason: "nothing ready to merge"}`, `ready`/`waiting`/
`conflicts` all empty) instead of refusing — while the real store at the
main checkout has items ready to merge. `approve` already refuses
correctly in the same situation (`.fgos/ not found ... check you are not
inside a linked worktree`, exit 4). An unattended `merge-loop` run
therefore stops silently and misreports "done" when it's actually just
looking at the wrong (nonexistent) directory.

Fix boundary: correct `merge`'s own `requiresExistingStore` classification
in the CLI command registry so the existing, already-correct pre-handler
guard (`bin/fgos.mjs`'s `main()`) catches this before ever reaching
`merge`'s handler — the same mechanism `approve`/`rebuild`/`repair` already
rely on. No new guard mechanism, no new message, no runner/dispatch
changes.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Root cause: `merge`'s registry entry (`src/cli/command-registry.mjs:439`) declares `requiresExistingStore: false`. That flag drives a real branch in `bin/fgos.mjs`'s `main()` (line 3099): only `true` triggers the hard pre-handler refusal (`.fgos/ not found...`, exit 4) before the verb's handler ever runs; `false` lets `listWork(dir)` fold a nonexistent directory into an empty-but-valid view instead. `merge` also isn't in `STORE_MISSING_WARNING_VERBS` (line 3057), so it gets neither the hard refusal nor even the soft stderr warning those 9 read-only verbs get — it fails silently on both counts. The fix is flipping that one field to `true`, matching the sibling write verb `approve` (line 629) exactly. Both `merge list` and `merge next` share this one registry entry, so both start refusing together — confirmed as the correct behavior for `next` too, since it internally calls `mergeReadiness(listWork(dir))` (`bin/fgos.mjs:1357`) before ever reaching `approve`. |
| D2 | Scope stays exactly `merge` — no other verb in the registry needs the same fix. Scouted every verb with `touchesState: true` and `requiresExistingStore: false` (`init`, `merge`, `evolve`, `session`, `setup`, `uninstall`, `doctor`): every one except `merge` carries an explicit exemption comment already justifying why it's intentionally `false` (`init` gets the opposite linked-worktree check; `session`/`setup` write through independent paths, never through `dir`; `evolve`'s dual-mode exemption is itself a prior, already-decided item, `command-registry.mjs:690-700`, explicitly scoped OUT of "the worktree-write hazard this item targets"; `uninstall`/`doctor` never touch `.fgos/` at all). `merge` is the only entry with no such comment — a genuine oversight, not a pattern needing a wider audit. |
| D3 | No change needed in `bin/fgos.mjs`'s `merge`/`next` handler (lines 1337-1373) or in the `merge-list`/`merge-next`/`merge-loop` skill files. `merge next`'s recursive `runVerb('approve', ...)` call is reached only after `main()`'s pre-handler guard already passed for the outer `merge` call — once `merge` itself is gated, that recursive call is simply never reached on a missing store, so no double-gating is needed. The `merge-next` skill (`plugins/fgOS/skills/merge-next/SKILL.md` step 2) already distinguishes "the command itself fails to execute (a real CLI error)" — show it and stop — from "a reported blocked outcome" (JSON `data`); the new exit-4 refusal falls cleanly into the already-handled first case, so `merge-loop`'s stop-rule reading (`{picked: null, reason: "nothing ready to merge"}` = clean stop) is simply never reached in the broken-store case anymore — it now hits the error path instead, which already exists. |

## Pinned terms

- **False negative** (per the item title): the command returns *no error
  and no ready items* while ready items genuinely exist in the real
  store — as opposed to a true negative (`{picked: null, ...}` when the
  frontier is actually empty), which stays the correct, unchanged
  behavior once the store is confirmed to exist.
- **Linked worktree**: a `git worktree add`-created checkout under
  `.claude/worktrees/`, which never carries its own `.fgos/` by design
  (ADR0020, `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`).

## Scout evidence

- `src/cli/command-registry.mjs:422-443` — `merge`'s registry entry,
  `requiresExistingStore: false`, no exemption comment (contrast with
  `evolve`'s at lines 690-700).
- `src/cli/command-registry.mjs:610-631` — `approve`'s sibling entry,
  `requiresExistingStore: true`, the proven pattern being matched.
- `bin/fgos.mjs:3086-3126` — `main()`'s pre-handler guard: the hard
  refusal for `requiresExistingStore: true` verbs (line 3099, the exact
  message `approve` already surfaces), and the separate soft-warning set
  `STORE_MISSING_WARNING_VERBS` (line 3057) that `merge` is also absent
  from.
- `bin/fgos.mjs:1337-1373` — `merge`'s own dispatch case: `list` calls
  `mergeReadiness(listWork(dir))` directly; `next` calls the same, then
  recurses into `runVerb('approve', ...)` on the top pick.
- `plugins/fgOS/skills/merge-next/SKILL.md:39-42` — confirms `merge next`
  "runs unattended by design" and already separates a real CLI failure
  (show error, stop) from a reported blocked outcome.
- `plugins/fgOS/skills/merge-loop/SKILL.md:58-61` — confirms the exact
  failure mode named in the item: `{picked: null, reason: "nothing ready
  to merge"}` is read as "frontier empty, stop cleanly, nothing to
  report as a problem" — today conflating a genuine empty frontier with
  this bug's false negative.
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md:84` —
  prior research report already live-reproduced this exact bug during
  unrelated investigation of `tsk-g18`, independently confirming the
  same diagnosis and impact; also confirms (§8) that the separate,
  larger "should worktrees be blocked by `.fgos`'s lock at all"
  design tension (`tsk-2eq` vs `tsk-45y`) is explicitly a different,
  unresolved item — not part of `tsk-66x`'s scope.
- Capability gate: `impact-analysis: full` (gitnexus present,
  `fgos tool query --capability impact-analysis --status present`
  returned one `present` provider) — GitNexus impact analysis is
  available and should be run on `merge`'s registry entry / `main()`
  before this item's plan edits either.

## Canonical references

- ADR0020: `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  (line 84 names `tsk-66x` directly)
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`

## Outstanding questions deferred to planning

- Exact `verify` command for this item (currently "chưa xác định — P15 bổ
  sung" on the work record) — planning's job to fill in, likely a new or
  extended unit test on `command-registry.mjs`/`main()`'s dispatch guard
  plus a live repro (run `merge list`/`merge next` from a linked worktree
  without `--dir`, assert exit 4 and the `.fgos/ not found` message).
- Whether any existing test currently asserts `merge`'s
  `requiresExistingStore: false` value and needs updating alongside the
  flip — a scout task for planning, not a product decision.
