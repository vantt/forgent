# terminal-control: config, doctor, setup, docs (phase report)

## Done
- `src/terminal-control/config.mjs`: defaults, project>global>default merge with source, rules, route config, retain time. One module feeds doctor and the round.
- `src/setup/terminal-control-checks.mjs`: checks `terminal-control`, `terminal-config`, `terminal-allocations`; fix `terminal-dir` (stateRoot/terminal, 0700).
- `registrations.mjs`: `herdr-available` + `checkHerdrAvailable` removed (one door); three checks, config default `terminal`, fix registered. Anchor-pane diagnosis kept inside `terminal-control`.
- `herdr-deadlines.mjs` (leaf): `READY_TIMEOUT_MS` moved out of `herdr-round.mjs` so doctor reads the same constant.
- herdr-round now sends explicit `terminal.*` values to the route and honours `retainFailedPaneMs`. Before this the keys would have been dead config.
- Docs: spec (config, setup/doctor, L5 six questions, history), distribution.md (rows 5h/7/7b, setup bullet, history), runner.md rule, reading-map, component-boundary, how-to doctor table, CHANGELOG, architecture manifest.

## Decisions
- Missing herdr = warning, not fail (direct mode needs no terminal).
- Other-release check: active release (one digest in forgentX, mdview, mcp-skill-hub) gives an identical doctor failure set with and without a `terminal` section in global + project config, so setup writes the key normally.
- Rust keeps its own defaults: only explicitly set values go to the route; a test pins JS defaults to route.rs constants and policy names to the contract.
- runner.md rule added without a RUL number (6.2 shares that file and the numbering).

## Tests (host built privately, FGOS_HOST_BIN set, session id unset)
- test/setup/terminal-control-checks.test.mjs 24/24 (real route + recorded herdr stand-in; stuck-slot scan via real allocate).
- Integration worktree after merge: terminal-control-checks, checks, checks-doctor-config, registrations, visibility-checks, dispatch-governance-operability, herdr-round-terminal-control, herdr-reconciliation, test/terminal-control/*, architecture: 378 pass, 0 fail.
- Full test/setup/*.test.mjs: only failure is skill-wrappers "instruction-audit" wrapper missing, present on the integration tip too (not caused here).
- `fgos convention check --all` exit 0, no finding on touched files.
- Removed old checkHerdrAvailable tests; their cases (override, empty/unresolvable/valid anchor) are covered in the new file.
- Not run: full `npm test`, live herdr.

## Impact
driveRound LOW (1 caller). detect_changes low, no affected processes.

## Unresolved
- terminal-allocations finding path is covered with a recorded process-info fixture, not a live herdr.
- Active release (before this lands) has no `terminal-*` checks: doctor via plain `fgos` shows them only after activation.

Status: DONE
