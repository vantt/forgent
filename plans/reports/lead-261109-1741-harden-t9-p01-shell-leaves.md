# HARDEN T9 P01 lead report: shell leaves

Branch `harden/t9-p01-shell-leaves`, base `308c314a0`. Status: landed except the `version` arm (waits for packaging P04).

## What changed
- `src/state/store-error.mjs` (kernel, no imports): `StoreError`, `EXIT_CODES`, `categoryOf`. `store.mjs` re-exports them.
- Registry: `requiresExistingStore` replaced by `store: none | open | read | require`, `mutatesStore` (true or predicate), `landsWork` (true or predicate). Deviation from the phase text: the plan's single `store` value with `write` cannot say "opens the Event Store, mutates, but does not refuse a missing store" (`events sync`) or "mutates, opens nothing" (`session start`), so mutation is its own field. `declared()` resolves true-or-predicate.
- Shell: the five sets, the predicate table and the history comment are gone; `main()` reads the registry. `requireSubVerb` reads registry `subcommands`; only `gateway` converted (the other arms keep their own message text and belong to later phases' ranges).
- Exit map: `src/cli/verb-exit.mjs` (`exitCodeOf`), main names no verb. Outcome codes moved to `src/runner/execution/outcome-exit.mjs` (Execution), per the authority audit.
- Dead names removed: `check`, `coordination` (no entry, no handler), `gate-bypass` set member and Node arm (verb is native, entry now `nativeOnly`), orphan comments.
- Lazy loads: dispatch depth (`adapters.mjs`), `DispatchError` (leaf), Land release (`merge.mjs`), decision citation scan (decision arm).
- Guard: `test/architecture.test.mjs` pins the entry's static imports to four leaves plus a named, shrinking arm list.
- Skill text and its renders say `store: 'require'`. CHANGELOG: one line (direct Node channel refusal for `gate-bypass`).

## Equivalence proof (before the old sets were deleted)
A one-off script compared old sets with the derived fields across 81 entries and every sub-verb shape: mutating, lands, warn, require and opens-store classes identical. Only difference: `gate-bypass` (arm deleted, entry native). `fgos --help --json`: byte-identical (226 761 bytes) before and after.

## Retired tests (owner told before the commit)
| Retired | Owner |
|---|---|
| fgos-setup "gate-bypass from a .fgos/-less linked worktree ... warns" | behaviour removed (Node warning of a native verb); level default: `packages/work-state/rust/src/lib.rs` `test_gate_bypass_level_fails_closed`; route: `test/rust-host/command-routes.test.mjs:80-84` |
| disconnected-guard "coordination run ... refused" | behaviour removed (dead verb); unknown verb: `invocation-fault-log.test.mjs:75`, `fgos-claim-2.test.mjs:227`. Replaced by a real-verb case: `lock fence` and `dispatch recover --action` refused, bare `dispatch recover` unaffected |
New tests: `verb-exit.test.mjs`, two in `fgos-manifest.test.mjs`, two in `architecture.test.mjs`, one guard case. Net: +12 -8 test() calls.

## Measurements
- Modules loaded by `fgos --help`: 208 before, 207 after. The phase's target (entry import closure) is not reachable here: `transport.mjs` and the citation script are still reached through other static importers (`work-dispatch.mjs`, `retrospective-doors.mjs`, `setup/registrations.mjs`) that belong to later phases and to Work. Wall time on this machine (load average 34) is noise.
- Net size: see `git diff --stat`; bin shrinks by the sets, the arm and the history comment.

## Gate
Focused: architecture, manifest, drift, guard, unknown-flag, command-routes, outcome exit codes, workflow propose, preflight: 276 pass. Full `npm test`: 8577 pass, 2 fail, both known: V7n addendum, and `active-release-drift-check` (no compiled fgctl in the worktree; same two in the T8 P11 full run). Census scan: 0 undeclared, census regenerated.

## Census of test/cli (step 7)
14 708 lines; about 815 spawned CLI calls. About 615 (40 files, 10 131 lines) drive Work verbs: out of scope (decision 78). Non-Work spawns by arm owner: P02 9 (claim-2, claim, lock-fence, guard), P03 35 (claim-2 session x18, claim main-checkout-reset x6, git x7), P04 36 (init across 13 files, rebuild), P06 41 (dispatch-reconcile, dispatch-retired-doors, tool x17, verb-help-json), P08 2, P10 9 (preflight x6, setup). Each phase lead turns its arm's calls into the (case, owning proof) table when it moves the logic; most `init` calls are fixtures, not assertions.

## Authority
- Verb store behaviour: was held as 5 sets and a predicate table in `bin/fgos.mjs` plus a per-entry bool in the registry (and a gate-bypass copy). Now one place: the registry entry (`store`, `mutatesStore`, `landsWork`). It belongs in the registry; it is there.
- Outcome to exit code: was in `src/state/store.mjs` (Work layer). Now `src/runner/execution/outcome-exit.mjs`, next to Execution's outcome vocabulary; `src/cli/verb-exit.mjs` reads it.
- Error category to exit code: `EXIT_CODES` in the import-free `src/state/store-error.mjs`. Not Work-specific (every verb's refusals use it) but it still sits under `src/state`; candidate to move below the CLI. Open question for the audit.
- Sub-verb lists: still hand-written in 8 arms beside registry `subcommands` (git, merge, dispatch, worktree, session, goal, agents, tool, lock). Authority is the registry; later phases convert their arms.
- Docs that still name `requiresExistingStore` (docs/knowledge narratives, 11 files): dated records, left as is; P16 spec close decides.

## Concerns
- `version` arm untouched until packaging P04 lands (follow-up commit of this phase).
- Doctor exit rule now lives in `src/cli/verb-exit.mjs` (`doctor`); packaging P02 edits it there.

## Lessons
- The phase text's single `store` value did not fit three real verb shapes; deriving the table from the old sets first showed it before any codemod ran.
- A suite waits in the machine-wide queue behind other full runs; start it early and do doc edits meanwhile (not tests in the same worktree).
- `build:skills` leaves an untracked generated wrapper dir; check `git status` after it.
