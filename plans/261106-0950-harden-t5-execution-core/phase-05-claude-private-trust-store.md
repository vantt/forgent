---
phase: 05
title: "Claude private trust store: an unconfined claude pane reads a config store private to its attempt, fgOS never writes the operator's ~/.claude.json; the remaining operator-store writers (codex, agy) resolve links and report failures"
status: pending
depends_on: [02]
parallel: "wave 2, with 03, 04, 07"
effort: ~1.5d (includes one measured live claude run by the big lead)
net_size: "Node −35 / Rust 0 / tests −40 (estimate)"
---

# Phase 05 — Claude private trust store (Q1a)

## Context

Decision 61 Q1a; red-team R-2 = correctness B-1 = T4 hand-off H-T4c (reproduced: 4 writers × 100 seeds into one store, 297 of 400 lost); correctness B-4 (a symlinked store replaced by a file, reproduced), B-5 (a codex section removal leaves malformed TOML; `removeAgyTrust` reports a write failure as `already-gone`, reproduced); O-3 (the trust store's hand-rolled temp-and-rename). Q1a scope: `herdr-round.mjs`, `trust-store.mjs`, `cleanup-trust.mjs` and their tests; codex and agy keep how they work (only B-4/B-5 fixes apply to them).

Code read on `4b116c27e` (`trust-store.mjs` is at `src/run-supervisor/trust-store.mjs` after P02):
- `herdr-round.mjs:222-251` (`seedWorkspaceTrust`), `:290-311` (`trustStorePaths`: codex and agy write a private store when the worker has its own home; claude always the real `~/.claude.json` `:309-310`), `:331-338` (`seedAttemptTrust` writes `controller/trust-context.json` for `cleanup-trust`), `:399-403` (`abandon` calls `cleanupTrust`), `:460-466` (seed only when there is no worker home).
- `worker-home.mjs:74-166` (`createWorkerHome`): provisions `.zshrc`, copies `.claude/.credentials.json` (`:107`), writes a private `.claude.json` with onboarding, theme and workspace trust (`:131-142`), `settings.json` for bypass. Used today only by the herdr confinement path (`herdr-round.mjs:168-201`).
- `trust-store.mjs:78-104` (`writeFileKeepingMode`, `writeStoreAtomic`: rename over the target, no `realpath`, no fsync), `:203-236` (`seedTrust`, `removeTrust`), `:290-293` (`codexSectionPattern` ends at the first `[`), `:304-347` (codex seed/remove; key written unescaped `:326`), `:616-639` (`removeAgyTrust` returns `false` on a failed write).
- `src/run-supervisor/steps/cleanup-trust.mjs:18-29` (claude branch `removeTrust` `:28`).
- `assignment-runner.mjs:1960-1970` (`prepareTerminalAttempt` args: `attemptEnv`, `trustStore`), `:1985` (`buildEnvelope`, launch env) — the one line that carries the private store's env into the launch.
- Settled fact needed: which variable points claude at a private config (`CLAUDE_CONFIG_DIR`, read for the mailbox at `src/setup/mailbox-claude-accept.mjs:17`) and whether claude, run with it, keeps its login, writes refreshed tokens there and shows no trust dialog. Not measured for a pane (plan fact 3).

## Measured run (big lead, 2026-11-06 11:2x, claude 2.1.314)

- A scratch `CLAUDE_CONFIG_DIR` holding a private `.claude.json` (onboarding, theme, trust for the scratch cwd) and `.credentials.json` as a **symlink** to the operator's login: `claude -p` answered, exit 0. The operator's `~/.claude.json` hash and the login file's mtime were unchanged. So reading the login through a link works.
- No refresh happened in the run. Claude's credential writer (bundle function `Un` → `Xne`, read in the binary) stages a temp file and **renames it over the target path**, and its in-place fallback opens with `O_NOFOLLOW`. A refresh inside the pane would therefore replace the link with a regular file in the private dir: the rotated login lands only in the private copy, and the operator's file keeps a login the provider may already have invalidated.
- Outcome: the "credential copy required, refreshed tokens land only in the private copy" branch of the requirement holds. Stopped and asked the owner before code. **Owner 2026-11-06 11:59 (decision 63): (a)** every claude pane takes the confined path's provisioning (`createWorkerHome` login copy, renewal at the source, write-back through the door phase 03 hardened); runs after phase 03 lands.

## Requirements

- **Measured live run first (big lead, live provider).** One real claude pane through `fgos run` with a scratch private config built the way this phase builds it. Record: no folder-trust dialog; login works; the operator's `~/.claude.json` bytes and mtime unchanged; where claude writes a refreshed token, if it refreshes. Evidence goes into the phase report.
  - If the login works without fgOS copying a credential into the private store (claude reads the credential from the operator's `~/.claude/.credentials.json` while the config dir is private, or a read-only link works and refreshes go to the operator's file): proceed.
  - If a credential copy is required and refreshed tokens would land only in the private copy: **stop and ask** (decision question): that adds a claude write-back path, outside the Q1a frame (Node −40).
- **Private claude store per attempt.** For an unconfined claude pane (no worker home), `prepareTerminalAttempt` builds a private claude config for the attempt by reusing `createWorkerHome`'s claude provisioning (`.claude.json` onboarding, theme, trust; nothing new invented) under the attempt's run directory or the confinement temp root (lead picks the place the supervisor's `finalize-home`/`cleanup-trust` already reaches), and returns the env that points claude at it; `assignment-runner.mjs` adds that env to the launch (one line at the `buildEnvelope` call). `trustStorePaths` for claude returns that private target; the operator's store is the read-only root (trust derived from it, as for codex).
- **Delete the claude write.** `seedTrust`/`removeTrust` on a real store, `seedAttemptTrust`'s trust-context record for claude, the claude branch of `cleanup-trust` (`:28`), and their tests go (L10). The private store is removed with the attempt (by the step that already removes attempt files; lead names it).
- **Codex and agy writers (unchanged behaviour, B-4/B-5):** resolve the store's `realpath` before choosing the temp directory and rename onto the real file (a symlinked store stays a symlink); write through the durable door (`replaceDurably` with the mode kept, which `proof-helpers`/`door.mjs` already offer) instead of `writeFileKeepingMode`; `codexSectionPattern` ends at the next line that starts a table header, not the first `[`; the seeded key is escaped as a TOML basic string; `removeAgyTrust` and `removeCodexTrust` report a failed write as `failed` (so `cleanup-trust` says `remove-failed`, not `already-gone`).
- `docs/backlog.md`: the H-T4c row is created and closed by this phase (P13 if the backlog file is busy).
- CHANGELOG: fgOS no longer writes `~/.claude.json`; claude panes use a private config per attempt.

## Files

**Create:** none (provisioning reused).

**Modify:**
- `src/runner/dispatch/herdr-round.mjs` (`:222-251`, `:290-338`, `:399-403`, `:460-466`)
- `src/runner/dispatch/worker-home.mjs` (export the claude-store provisioning so both paths call one function)
- `src/run-supervisor/trust-store.mjs` (`:78-104`, `:203-236` delete, `:290-347`, `:616-639`)
- `src/run-supervisor/steps/cleanup-trust.mjs`
- `src/runner/dispatch/assignment-runner.mjs` (one line at the `buildEnvelope` call, `:1985`)
- Tests: `test/runner/dispatch-trust-store.test.mjs`, `test/runner/herdr-private-home-trust.test.mjs`, `test/runner/worktree-config-trust.test.mjs` (if it seeds claude), the `cleanup-trust` cases in `test/run-supervisor/attempt-steps.test.mjs`
- `CHANGELOG.md`, census, `docs/backlog.md`

**Delete:** `seedTrust`, `removeTrust` (if no other caller after the claude path goes: `rg -n "seedTrust\(|removeTrust\(" src`), the claude branch of `cleanup-trust`, `writeFileKeepingMode`/`writeStoreAtomic` (replaced by the durable door).

**Tests to retire:**
- `dispatch-trust-store.test.mjs` cases that seed/remove the real claude store: behaviour removed; owner of "claude pane trusted without a dialog": the P01 case "an unconfined claude pane never writes the operator's claude store" plus the provisioning case in `herdr-private-home-trust.test.mjs`.
- `attempt-steps.test.mjs` claude `cleanup-trust` removal case: behaviour removed; owner of codex/agy removal: the remaining `cleanup-trust` cases (same file).
- The lead lists each retired title and its owner.

## Net size

Node: claude seed/remove and branches −70, provisioning shared +15, env line +3, B-4/B-5 +15, durable write −10 → about −35 (arbitration Q1a −40 plus B-4/B-5). Tests: −60 retired, +20 new → about −40.

## Steps

1. Big lead: the measured claude run; decide proceed or stop-and-ask on its evidence.
2. P01 claude row; confirm red.
3. Private store and env; delete the claude write path and its tests.
4. Codex/agy fixes (realpath, durable write, section end, escaping, failure report) with cases in the owning test.
5. CHANGELOG, backlog row, census.

## Validation (focused)

- FR `test/runner/dispatch-trust-store.test.mjs test/runner/herdr-private-home-trust.test.mjs test/runner/worktree-config-trust.test.mjs test/run-supervisor/attempt-steps.test.mjs test/runner/assignment-dispatch.test.mjs`
- `rg -n "\.claude\.json" src/runner src/run-supervisor`: no write path left (reads for provisioning only).
- After land on fg-server2: one claude pane smoke and one panel (2 seats) smoke; `~/.claude.json` mtime unchanged across both.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Claude needs its credential inside the private config and rotates it there | M × H | Measured run first; stop and ask if so (RT-P8). |
| The private config drops settings the operator expects in panes (MCP servers, permissions, model defaults from `~/.claude.json`) | M × M | The provisioning copies what `createWorkerHome` copies today for confined claude panes; the measured run lists anything the pane lost; a loss is reported, not patched with new copying. |
| A symlinked codex or agy store now gets written through the link | L × M | That is the intended B-4 behaviour; the CHANGELOG line names it. |

## Rollback

Revert the merge; re-activate the previous release. On disk: per-attempt claude stores left under run directories are inert; the old release seeds `~/.claude.json` again (the lost-update race returns).

## Done when

Measured run recorded; P01 row green; no claude write path; codex/agy fixes proven; landed with a pane and a panel smoke; guide section written.

## Lead brief essentials

The big lead's measured run decides before code. No new provisioning: reuse `createWorkerHome`'s. Stop and ask if claude needs a credential copy. All plan.md lead rules apply.
