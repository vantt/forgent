---
phase: 27
title: "Claude seat store: confined claude seats get their own login store and keep their transcript (owner decision 86 Q2)"
status: landed
depends_on: ["phase 26 landed", "owner decision 86 Q2 (a)", "owner guide: declare-claude-seat-store"]
parallel: "after the global tier cells phase (runner spec); files are the confinement and credential store, the claude trust seed in herdr-round, runner.yaml"
effort: ~1d
net_size: "Node about +60 (layout factory, probe branch, private-config seed); YAML +10; tests +90"
---

# Phase 27 - Claude seat store (owner decision 86 Q2) - Execution (T4/T5)

**Authority moved:** none. Execution keeps the transcript (phase 26); the credential-store copy, renewal and write-back stay the one path pi, omp and codex use. Claude is the fourth user of it.

## Context

Phase 26 showed a confined claude seat writes no session anywhere: `claude-*-bwrap` declare no `credentialStore`, so the private home is unused and `~/.claude` is read-only under bwrap. Owner decision 86 Q2 (a): claude gets its own login store like pi and omp (`CLAUDE_CONFIG_DIR` in the seat home, a login copy, `sessionDir` declared), a confinement and credential change with OPC review.

## Requirements

1. `claude-cli-bwrap` and `claude-herdr-bwrap` declare `credentialStore: { use: claude, homeEnv: CLAUDE_CONFIG_DIR, sessionDir: projects, files: [.credentials.json] }` in `core/config-standard/runner.yaml`.
2. The login copy is made by the existing credential-store copy and write-back path; no new mechanism. Files 0600, dirs 0700, removed with the home. The kept transcript is only `sessionDir`.
3. Login renewal goes through the same safety path as the other CLIs. Claude's tokens are opaque (no signed-account claim), so a login renewed inside a home is staged and never applied (as xai); doctor `credential-copies-retained` lists it.
4. A claude pane reads its first-run state and folder trust from `$CLAUDE_CONFIG_DIR/.claude.json`; the private config directory is seeded there, derived from a root the operator trusts in `~/.claude.json`, which is never edited.
5. The machine declares one claude account (owner guide), else a seat starts logged out and doctor `confined-pane-accounts` fails naming it.

## Files

`core/config-standard/runner.yaml`, `packages/config/contracts/fixtures/repo-differences.v1.json`, `src/runner/dispatch/provider-credential-renewal.mjs` (claude layout for a config directory), `src/runner/dispatch/provider-credential-probe.mjs`, `src/run-supervisor/trust-store.mjs` and `src/runner/dispatch/herdr-round.mjs` (private config seed), their owning tests, the confinement, run-supervisor and runner specs, CHANGELOG, the census, the owner guide, the report.

## Validation

`test/runner/credential-store.test.mjs`, `provider-credential-renewal`, `provider-credential-probe`, `herdr-private-home-trust`; `cargo test -p fgos-config` and `-p fgos`; `fgos dispatch probe-session claude` before (`dir-undeclared`) and after (`kept`, 0600 files, no login file in `protected/session/`); the pane (`--invocation claude-herdr-bwrap`). OPC reviews before landing.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A machine without a claude account starts confined claude seats logged out | M x H | owner guide first; doctor `confined-pane-accounts` fails naming the account |
| A refresh token redeemed in a private home is lost | L x M | pane-renewed copies are staged and kept, never applied; fgOS's own renewal runs on a scratch copy and applies only a proven replacement |
| The seat loses the operator's `~/.claude` settings, hooks and skills | H x L | intended: a confined seat reads only its own store |

Rollback: revert the merge commit; claude seats read `~/.claude` in place again and keep no transcript.
