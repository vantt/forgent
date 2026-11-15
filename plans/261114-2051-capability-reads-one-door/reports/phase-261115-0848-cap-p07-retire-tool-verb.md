# Phase 07 report: retire `fgos tool` and the status overlay

Branch `capability-reads-p07`, based on the integration branch at 4d813949b. Phase 06 measured the live probe at 3.6 ms p95 at most,
so the stop condition did not trigger: the verb and the overlay are both gone.

## What changed

- Verb: `case 'tool'`, its comment and the static import left `bin/fgos.mjs`; the `tool` entry left `src/cli/command-registry.mjs`;
  `command-routes.json` and `command-manifest.json` regenerated with `node scripts/export-command-selectors.mjs` (`--check` passes).
- `src/state/tool-registry.mjs` deleted whole, with `FGOS_FILE.TOOL_STATUS` and its path (`fgos-file-registry.mjs`), its manifest row,
  its `ARM_STATIC_IMPORTS` line, its ownership rule, the `tool-status.local.json` mention in `.gitignore`, and the two baseline files'
  entries. An existing `.fgos/runtime/tool-status.local.json` is inert.
- Doctor `tool-registry-configured` (same id, same three postures) is computed from `toolProvidersOf(runner, { repoRoot: mainCheckout })`:
  all present -> full; any stale, missing or unprobeable -> degraded (counts per status, fix line points at `decide`); none -> inactive.
  A tool serving two capabilities counts once.
- `src/setup/executor-profile-warnings.mjs` reads `for` only through `forEntriesOf`/`servedCapabilitiesOf`, and gained the warning
  `runner.capabilities.<cap>.prefer is ignored: <cap> is served by tool executor <id> through "for"` (id
  `executor.<id>.tool-purpose-prefer-ignored.<cap>`). After this phase `tool-providers.mjs` is the only reader of `for`
  (`rg "\.for\b|executor\.for" src` finds none elsewhere). Live: doctor on this repo prints the warning for `impact-analysis`.
- Callers moved to `fgos dispatch decide --for <cap> --json`: the impact-analysis gate prose in `AGENTS.md` (above the GitNexus block;
  the block itself and the AGENTKIT-OMP block untouched; `build:skills` rewrote AGENTS.md but the diff is only the gate prose), the four
  coding references, `plugins/fgOS/skills/terminal/{SKILL.md,rename.sh}` (the script runs `decide` from the project root and gates on
  `"mechanism": "in-process"`; same fail-closed no-op), the doctor how-to row, the tool-registry knowledge reference (old sections kept
  as history under a header note) and one line of the runner spec that cited the deleted file path. Generated skill surfaces rebuilt
  with `npm run build:skills`; a second run is clean.
- Phase 06 items 9-11: stale chooser text fixed in `core/skills/_shared/capability-catalog.md`, `planning-capability-awareness.md` and
  `executor-dispatch-fallback.md` (which now explains `command`, `providers`, `stale` and the three `tool.*` reason codes);
  `test/setup/capability-catalog-doctrine.test.mjs:117` no longer says mcp-handback. Item 9's three `dispatch-control-plane.md` lines are
  not in this phase's list (phase 08).
- Agent/Task hook message (`src/runner/dispatch/hook.mjs`): `unavailable` no longer reads "resolves to out-of-process". It says
  "decide answered unavailable for it (<blockedReason or reason codes>)", points at `decide --for ... --needs-soul`, and names no
  `fgos run` door (a run would meet the same refusal). The out-of-process wording stays for a real out-of-process answer.

## Tests

Retired tests and owners are in the commit message. New or changed:
- `checks-doctor-config.test.mjs`: full (live cli tool), degraded naming missing/stale/unprobeable, one tool serving two capabilities
  counts once, the ignored-`prefer` warning (through the `executor-profile-warnings` check). No overlay fixture any more.
- `dispatch-decide-hook.test.mjs`: the old out-of-process fixture was a pooled row whose only executor was a tool (the exact case that
  now answers `unavailable`), so it now uses a placeable agent executor; a new case pins the refusal message. One wiring proof in
  `test/cli/dispatch-retired-doors.test.mjs` now asserts the `unavailable` wording for its tool-only fixture.
- `command-routes`, `fgos-verb-help-json`, `subcommand-flag-drift` drop `tool` from their verb lists; `terminal-skill-attach` stub prints
  the `decide` answer.

Gates: the phase gate list plus every test that reads a changed file (88 files incl. `architecture`, `doc-health`, the CLI and setup
suites): 1770 tests, 1763 pass after the fixes above, 7 not run green: `help-routes` (5) and `release-targets` (1) need
`target/release/libfgos_node_addon.so` (a release build; environment, same on base) and the hook wiring test that is now fixed (re-run:
14/14). `check-decision-citation-drift` no new findings; `git-one-door-scan` 0 undeclared (census regenerated with `--write-census`);
`export-command-selectors --check` clean; `doctor --json` row answers live (`degraded - 1/2 tool(s) present (0 stale, 1 missing, ...)`:
herdr present, gitnexus missing in a worktree without `.gitnexus`).

## Deviations and things to decide

1. Gate `rg "tool query|tool check|tool-registry|tool-status"` over `src bin scripts AGENTS.md domains plugins core` is empty except the doctor
   row id `tool-registry-configured`, which the phase file says keeps its id (and `checks.test.mjs` pins it). Left as is.
2. Edited outside the file list (comment-only or test-only, each forced by a gate): `src/runner/paths.mjs` (comment named
   `tool-status.local.json`, the `rg` gate), `src/runner/dispatch/hook.mjs` and `test/scripts/dispatch-decide-hook.test.mjs`,
   `test/cli/dispatch-retired-doors.test.mjs` (the hook message you asked for and the tests that pinned the old text),
   `test/cli/fgos-verb-help-json.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/rust-host/command-routes.test.mjs`
   (verb lists), `packages/host-runtime/contracts/command-manifest.json`, `packages/git/contracts/mutation-census.v1.json` (generated),
   the runner spec line (a doc-health dead reference), `core/skills/_shared/*` (your items), `test/setup/capability-catalog-doctrine.test.mjs`.
3. The ignored-`prefer` warning lives in `executor-profile-warnings` (the doctor's warning collector), not in the row's message:
   the row fails when degraded, and a warning line there would be lost in a failure message; the collector already carries every
   executor/capability warning with an id and a migration target. The doctor still prints it (live run above).
4. `scripts/check-decision-codes.mjs` already reports 299 "new" findings against the baseline on the integration base (same count before
   and after this phase); I removed only the entries of the deleted test files and the two stale `tool-registry` titles by hand instead of
   `--write-baseline`, which would have added 360 unrelated lines.
5. `docs/platform/runner/...` decision history and the dispatch-control-plane doc lines are phase 08's. No decision narrative written here.
6. Landing on main (F0 at 8d2968b3c): a trial `git merge-tree` of this branch with `origin/main` conflicts only in
   `packages/host-runtime/contracts/command-routes.json`, `packages/git/contracts/mutation-census.v1.json` (regenerate both: export script
   and `git-one-door-scan --write-census`), `test/suite-baseline.json` (drop the two file lines again), `test/cli/fgos-tool.test.mjs` (main
   modified it, this branch deletes it: take the delete) and `test/cli/fgos-verb-help-json.test.mjs` (main deleted it, so drop this
   branch's one-line edit). `bin/fgos.mjs`, `command-registry.mjs`, `AGENTS.md`, the manifest and `architecture.test.mjs` auto-merge.

## CHANGELOG line (for the big lead; not edited here)

Under `## [Unreleased]`: "`fgos tool` is removed and decide answers tool purposes live: `fgos tool query` and `fgos tool check` are gone;
ask `fgos dispatch decide --for <capability> --json`, which probes the tool live (present, stale or missing) and is the same answer a
dispatch gets. `.fgos/runtime/tool-status.local.json` is no longer written or read and can be deleted. A `prefer` on a capability served
by a tool executor is ignored; `fgos doctor` warns about it."

## Lessons

- A test fixture that "tests the out-of-process message" can be testing a bug: the old hook fixture was a pooled row whose only
  executor was a tool, which bind refuses; the message was wrong and the test pinned it. Read what the fixture really answers.
- Deleting a verb touches more lists than its own: three tests keep a literal verb list (routes, help manifest, flag-drift scan) and the
  census hashes every changed source file, so regenerate generated files last, after the final source edit.
- A regenerated baseline can be far noisier than the change (here 360 lines); when the ratchet is already stale on the base, hand-remove
  only your own entries.

## Authority

- `toolProvidersOf`, `forEntriesOf`, `servedCapabilitiesOf` (`src/runner/dispatch/tool-providers.mjs`): the only reader of an executor's
  `for` and the only tool presence probe; doctor row `tool-registry-configured`, `executor-profile-warnings` and `decide` ask it.
- `fgos dispatch decide --for <capability>`: the only way to ask whether a tool-served capability is there; AGENTS.md's gate, the coding
  references and `rename.sh` read its answer.

Status: DONE_WITH_CONCERNS
