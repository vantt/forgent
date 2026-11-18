# Integration report: session verb for agent sessions (phase 6)

Tree: linked worktree `svb/p06` at `2f61c1ebc` (= origin/main, every other phase already landed) plus this phase's
changes. Date 2026-11-19. `CARGO_TARGET_DIR` = a per-worktree target on ext4.

## Changes in this phase

- `CHANGELOG.md` `[Unreleased]`: one new line for the verb change (`fgos session` = head sessions, `fgos head` gone,
  worktree verbs retired for `fgos worktree create|remove`, inert `.fgos/sessions.json` and `<tmp>/fgos-sessions`,
  `fgos identity` without `--fgos-dir`/`source: registry`, gateway `/v1/sessions*` 501, doctor row `leaf-notify-drift`
  removed). Four existing unreleased lines that said `fgos head start|rotate|write` now say `fgos session ...`.
  Released sections (rc.11, rc.12) are left as written.
- Leftover old names reworded to the socket verbs `session <x>` (SV-9 terms kept: "head session", `head:` role,
  `FGOS_HEAD_*`, the "head start door" and "head request socket", file names): `envelope.v3.json`,
  `rotation-files.v1.json`, `src/setup/agent-hooks.mjs`, `src/runner/dispatch/confinement/resources.mjs`,
  run-supervisor spec, identity spec (current-state text; the 2026-11-18 decision-history entry keeps the name it had),
  agent-confinement spec 445, reading-map 173/189/191 (the `session.rs` line was already gone; line 173 no longer cites
  the session registry or `fgos session start`). No digest or vector covers the edited description text
  (`envelope-digest.v1.json` digests envelope instances, not the contract file).
- `docs/backlog.md`: `p-g2iprtzptz`, `p-zgbqe2bpig`, `p-ktnvgs2ozm`, `p-rk75ictfw7` done with the plan linked;
  `p-5x37olszki` closed obsolete (status `done`, the backlog has no other closed status); `p-xkkoaq6eoh` names the
  retired verb as history, not `fgos session`; `p-cymvjb6nrc` was already done.

## Fixes (gate failures caused by this plan, phase 7f `7185f8375`)

7f added `runner.personas.secretary` to the release standard, pinned to the claude-only invocation
`claude-herdr-bypass-bwrap` (`permissionMode: bypass`, full bwrap posture). Three owning tests still held the old shape:

| test | failure | fix |
|---|---|---|
| `test/runner/herdr-provider-invocations.test.mjs` "no herdr invocation relies on a bypass flag in place of the sandbox" | confinement deep-equal `{backend: 'bwrap'}` and no-bypass-arg rule hit the new invocation | still requires `backend: 'bwrap'` for every herdr invocation; skips the arg rule only for an invocation that declares `permissionMode: bypass`, whose posture pairing is owned by `test/session-host/head-permission-mode.test.mjs` |
| `packages/config/rust/tests/authoring_equivalence.rs` standard-only paths | `["runner","personas"]` is now standard-only | recorded in `packages/config/contracts/fixtures/repo-differences.v1.json` `standard-only` |
| `packages/config/rust/tests/golden_standard.rs` `every_standard_agent_pool_names_both_claude_and_openai` | `personas.secretary.prefer lacks openai` | a prefer list that pins a bypass invocation is not a failover pool and is skipped (only claude has such a pane; failover would change the head's permission mode, and the persona's `claude-miu` pool refuses other families) |

## Acceptance criteria

| # | command / proof | result |
|---|---|---|
| 1 | `rg -n "fgos head\b\|'head'" src bin core domains docs/platform packages/run-supervisor/contracts`; `npm run fgos:dev -- head --help` | pass: 4 hits, all rename history (`supervision/spec.md:32` legend, `session-host/spec.md:142,176,178`); `head --help` exit 4 `unknown verb "head"` |
| 2 | `npm run fgos:dev -- session start --help`, `session rotate --help`, `session end\|list\|gc` | pass: both help texts describe the head-session verbs (exit 0); end/list/gc exit 4 `unknown session sub-verb ... Usage: fgos session <start\|rotate\|write>` |
| 3 | `rg -n "sessions\.json\|listSessions\|fgos-sessions\|is_session_worktree\|Source::Registry\|registry_confirms" apps packages src bin test docs/platform` | pass: hits only in history text (identity spec 286 decision history, git spec G-191 frozen catalogue rows 855/1315, `proposals/doing-coordination-redesign.md`, archived proof logs under `agent-coordination/verification/`) |
| 4 | `cd apps/fgos-gateway && cargo test` | pass: 100 passed, 0 failed; owning test `gateway::tests::the_session_routes_refuse_with_501_and_run_no_verb` ok |
| 5 | `node scripts/plan-contract-check.mjs --plan plans/261118-0947-session-verb-for-agent-sessions` (with the worktree's staged addon env) | pass: `ok 261118-0947-session-verb-for-agent-sessions` |
| 6 | full gate (below) | pass after the three test fixes |
| 7 | CHANGELOG line; backlog `p-g2iprtzptz` done, `p-5x37olszki` closed obsolete | pass (this phase) |
| 8 | secretary head grants | tests pass in the suite (phase 7); live check on fg-server2: live, pending release |
| 9 | manual rotation logged `manual`, handoff content, `personas.secretary.reload` | tests pass in the suite (phase 8); live, pending release |
| 10 | head pid space, peer binds, subreaper + PDEATHSIG proofs | Rust proofs in `cargo test --workspace` pass (`gate_pid1.rs`); Miu `ListAgents`/SendMessage live check: live, pending release |
| 11 | model window | pass: proven 1M (`reports/phase-09.md`), `p-cymvjb6nrc` closed not a bug, `p-zgbqe2bpig`/`p-ktnvgs2ozm` done |
| 12 | `session write` door | Rust proofs `head_write_*` pass; live check: live, pending release |
| 13 | peers message the secretary head | tests pass (phase 7d); live check: live, pending release |
| 14 | one Identity record per session | tests pass (phase 7e); live check: live, pending release |
| 15 | secretary head in bypass mode, no held-for-approval prompt | tests pass (phase 7f, `head-permission-mode.test.mjs`); live check (lead SendMessage delivered without approval, Miu restart): live, pending release |

## Full gate

| gate | result |
|---|---|
| `npm test` (first run, before fixes) | 8413 tests, 8384 pass, 1 fail (`herdr-provider-invocations`), 0 ERROR lines |
| `npm test` (after fixes) | 8413 tests, 8385 pass, 0 fail, 28 skipped, 0 cancelled, 0 ERROR lines; 613 files, 3525 Rust tests, 622 s wall |
| `cargo test --workspace --no-fail-fast` | 3285 passed, 1 failed (`golden_standard`), 12 ignored; the first plain run stopped at `authoring_equivalence`; both now pass (`cargo test -p fgos-config --test golden_standard --test authoring_equivalence`: 9 + 2 passed) |
| `cargo clippy --workspace --all-targets -- -D warnings` | exit 0 (only the vendored `arraydeque` lifetime warnings, not denied) |
| `cargo check --target x86_64-pc-windows-msvc -p fgos` | exit 0 |
| `cargo check --target aarch64-apple-darwin -p fgos` | exit 0 |

Unrelated failures: none.

## Left open

- `invokeHost`'s `cwd` option (`src/util/host-bin.mjs:53`) has no production caller left, only
  `test/util/host-bin.test.mjs`; noted in `p-5x37olszki`'s closing text, not removed here (outside this phase).
- `docs/platform/session-host/spec.md:8` still names the modules "head start, head request" (module names, SV-9); not
  in this phase's footprint and not a verb use.
- Plan status and the phase 6 row stay as they are for the lead to set after landing.
