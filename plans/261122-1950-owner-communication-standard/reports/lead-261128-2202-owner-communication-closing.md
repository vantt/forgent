# Closing report: communication standard plan

Status: done. All five phases are landed on main; the final land is `5789386102` (phase 5). The full gate
`fgos release check` (ticket `c-83920-1795876559938`, tip `d16dc38aae`) was green: `npm test` exit 0 and
`cargo test --workspace` exit 0.

## Acceptance criteria

| # | Mark | Result | Evidence |
|---|---|---|---|
| 1 | core | met | The old-path `git grep` prints nothing on the combined tree; `core/skills/_shared/owner-communication.md` and `core/instructions/owner-communication.md` exist. |
| 2 | core | met | `AGENTS.md` carries id `owner-communication` and no `decision-question-template`; `node --test test/docs/rul11-anchor-phrase.test.mjs` 6/6. |
| 3 | core | met | The supervisor ran `npm run build:skills && node scripts/project-agents.mjs` on the combined tree: only the new fragment showed. `project-agents.test.mjs` passed inside the release check's `npm test`. Plain `node --test` from a checkout fails it with `git-addon-unavailable` on main too: environment, not this change. |
| 4 | core | met | `owner-communication` is in `packages/observe/rust/friction-kinds.json` and `docs/platform/observe/spec.md`; the observe crate tests run green in the gate. |
| 5 | core | met | `packages/questions/rust/tests/store_usecases.rs`: a decided question without `parts.default` is refused `question-unclear` naming the field; a discovery question without it is accepted; a blank default is refused at every stage. |
| 6 | core | met | CLI list and detail views letter the options A to D, recommended first, with `Default if no answer:`; `--option A` resolves by place (A to D only, exact label first); the gateway `NeedsAnswer` screen shows the same (vitest 12/12). |
| 7 | core | met | A stored question without a default still folds (`store_usecases.rs` old-record case); `record.rs` keeps the field optional. |
| 8 | core | met | Release check green on the combined tree; `changelog.d/261122-1950-owner-communication-standard.md` holds the two bullets. |

## Review dispositions (phase 3)

- Hand-lettered label shown with a new letter while the `Recommendation:` line kept the asker's letter: accepted; fixed (`43d651c44f`), the recommendation line now uses the place letter.
- Spec claimed `show` prints the answer command: accepted; spec corrected.
- Blank or whitespace default accepted: accepted; refused at every stage.
- Letters past D accepted through a `% 26` wrap: accepted; only A to D name a place.
- `--option` help text still says "label" only (`src/cli/command-registry.mjs`, command manifest, `apps/fgos/src/cli_projector.rs`): deferred, outside the plan footprint. Debt below.

## Debt and follow-ups (for the secretary to open as backlog rows)

1. `--option` help text does not mention the letter answer. Files: `src/cli/command-registry.mjs`,
   `packages/host-runtime/contracts/command-manifest.json`, `apps/fgos/src/cli_projector.rs`.
2. Flaky test `apps/fgos/tests/git_recover_confirm_dead.rs::a_caller_under_an_agent_cli_cannot_confirm_a_writer_dead`:
   copies `/bin/sh` then execs it while other test threads fork, so it can fail `ETXTBSY` (it failed the phase 3
   gate once, then passed 3/3 alone).
3. The `code:implement` route decides `gemini` (quota out), whose fallback through thehive/deepseek fails exit 11
   `credential refresh-ahead ... unexpected-shape`; units here ran with `--provider claude` instead. The supervisor
   took the credential fault.
4. Units cannot run `scripts/git-one-door-scan.mjs --write-census` (read-only git probe in the sandbox), so a
   phase that changes skills needs an unconfined step to regenerate the mutation census.

## Cleanup

Every branch `owner-communication-standard/p01`, `p01r`, `p01s`, `p02`, `p02r`, `p03`, `p04`, `p05` is an
ancestor of main. One worktree is left: `/home/vantt/projects/forgent-worktrees/261122-1950-owner-communication-standard-p02`
(superseded, tip on main), for the supervisor to remove with `fgos worktree remove --delivered-to main`. The release
check also left `/home/vantt/projects/forgent-worktrees/release-check-chk-c-74874-1795873466358` (its own removal
ended exit 1).
