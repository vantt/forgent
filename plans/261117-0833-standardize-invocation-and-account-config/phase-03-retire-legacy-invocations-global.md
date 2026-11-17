---
phase: 3
title: "Retire legacy invocations in the global config, one CLI at a time"
status: applied 2026-11-17 (design-lap), no id renamed
priority: P1
effort: 4h
depends_on: [D1, D2, P2]
touches: global config (runner.executors.{openai,xai,deepseek,glm,gemini}.invocations), owner approval per write
---

# Phase 3: Retire legacy invocations in the global config

## Context

The selection analysis in `plan.md` shows that the legacy forms win only because they come first
in declaration order (`bind.mjs:165-172`, `policies.mjs:674-684`). The form A forms were proven in
the harness today for claude, codex, pi (openai/fgovn), omp (xai/vantt) and agy. Inventory and
verdicts: [inventory.md](inventory.md). The repo is not touched. Every write is a global write that
the owner approves, and every write must keep working under all three activated releases. All three
postdate `credentialStore` (`d2b08e011`, 2026-10-19), so removing `resourceBindings` does not strand them.

## Requirements

- Per executor, the global list holds only the generic forms. They are named per D1, with confined
  forms first, the herdr form first among herdr-spawn entries, and the CLI the family is "about" first
  (codex before pi for openai).
- No `resourceBindings` and no account-pinning env (`CODEX_HOME`, `PI_CODING_AGENT_DIR`, `HOME`,
  `OPENROUTER_API_KEY`) on any invocation. `PI_CONFIG_DIR` on omp stays, because it is a relative
  config-dir name and not an account pin. Verify that it is relative by reading the key's presence
  only, never its value.
- `codex-cli-bwrap` gets an explicit `credentialStore {use: codex, homeEnv: CODEX_HOME}` (copied from
  the standard, `core/config-standard/runner.yaml:101`).

## Steps

0. **Pre-flight (no writes).**
   - Run `rg -n "codex-herdr|pi-herdr|omp-herdr|agy-herdr|-fgovn|-tetnu|-vantt|-openrouter|-tetcu72"
     ~/projects/*/.fgos/config.yaml` to find pins in other projects that a rename or delete would
     break. Today's known pins: forgentX `advise` → `claude-cli-bwrap` (unchanged). mcp-skill-hub
     declares its own executor invocations (D8), so its project file replaces the global list for
     those executors, and P3 does not affect it there.
   - Confirm no run is in flight: `fgos dispatch watch` or `show-run` shows none active. A seat with
     walk continuity on a renamed id would refuse `seat-continuity-unavailable`.
   - Back up `~/.fgos/config.yaml` to `~/.fgos/private/config-backup-<YYMMDD-HHMM>-retire-legacy/`.
1. **openai (codex then pi).** Write the whole sequence, in this order: `codex-cli-bwrap` (with
   `credentialStore`), `codex-herdr[-bwrap]`, `pi-cli-bwrap`, `pi-herdr[-bwrap]`.
   `fgos config set --global runner.executors.openai.invocations '<flow list>' --reason "openai runs only the generic leased forms; the account comes from the lease"`.
   If the door refuses for comment loss, use `unset --acknowledge-comment-loss` and then `set`, back
   to back. Checks: `fgos config check` shows no `config-unknown-key` under openai. Then run
   `fgos dispatch explain --for code:review` (stays pinned `codex-cli-bwrap`) and an explain where
   openai is the primary inside herdr: expect `codex-herdr[-bwrap]`. **Owner-gated probe:**
   `fgos dispatch probe-account --provider openai --account fgovn --leg harness` and `--account
   tetnu`. Expected: every row is `ok` (codex cli, codex herdr, pi cli, pi herdr), and no legacy id
   appears.
2. **xai (omp).** Sequence: `omp-cli-bwrap`, `omp-herdr[-bwrap]`. Same checks. Probe xai/vantt.
   Expected: both rows `ok`.
3. **deepseek and glm (pi over openrouter).** deepseek: `pi-cli-bwrap`, `pi-herdr[-bwrap]`. glm:
   `pi-cli-bwrap`. Before writing, check with `fgos dispatch explain --for business:frame` (glm
   pinned `pi-cli-bwrap`) that the leased account's pi store holds the OpenRouter key in its
   `auth.json`, the reason `4f6fc44d7` removed the env key. If `explain` shows the CLI cannot run on
   the account, stop and ask. Probe deepseek/openrouter and z-ai/openrouter: rows `ok`.
4. **gemini.** Rename `agy-herdr` to `agy-herdr-bwrap` only if D1 picks option A. P2 already fixed
   the args.
5. **Order audit.** For each executor, `fgos dispatch explain` inside and outside herdr shows the
   generic form as the transport default (acceptance criterion 2). Run `fgos doctor` and `fgos config
   check`. For each of momentry, run `fgos config check --dir ~/projects/<p>` and
   `fgos doctor --dir ...` (read-only): no new fail.

## Optional E (owner-gated, quota): writer-unit confinement confirmation

The code already proves that a bound run is always confined (plan.md, selection analysis point 4).
For an empirical check, create a linked worktree (`fgos worktree create ...`) and run
`fgos run "append one line to NOTES-probe.md" --provider openai --capability code:test --writes
NOTES-probe.md --worktree <wt>`. Expected: `launcher.sh` in the run dir wraps `bwrap`, and the
attestation shows `enforced` with policy `workspace-write`. Then remove the worktree.

## Validation

The acceptance criteria 1-3 from plan.md hold for the five executors, and the probe rows are `ok`.

## Risk

| Risk | L x I | Mitigation |
|------|-------|------------|
| A generic form lacks a login for an account (store missing) | M x H | probe per account right after each executor write; doctor `confined-pane-accounts` |
| Whole-sequence set refused or loses notes | M x L | fallback unset+set; the `@fgos:why` reason carries the rationale |
| Another project pins a removed id | L x M | pre-flight grep; mcp-skill-hub overrides executors itself |
| Rename breaks a running seat's continuity | L x M | no runs in flight before each write |

## Rollback

Per executor: `fgos config set --global runner.executors.<e>.invocations '<old flow value from backup>'`,
or restore the whole file from the backup with the owner present, because a file copy bypasses the
door's revision check.

## Applied (design-lap machine, 2026-11-17, owner-approved)

Backup: `~/.fgos/private/config-backup-261117-p3/config.global.before-p3.yaml`. No invocation id was renamed
(the naming decision V7 is still open); only the legacy forms were removed. Pre-flight: no project pins a
removed id (momentry none; forgentX only in descriptions; mcp-skill-hub is out of scope); no run in flight.

| Executor | Before | After |
|---|---|---|
| openai | 12 (8 account-pinned or unconfined, 5 with `resourceBindings`) | `codex-cli-bwrap` (now with explicit `credentialStore {use: codex, homeEnv: CODEX_HOME}`), `codex-herdr`, `pi-cli-bwrap`, `pi-herdr` |
| xai | 5 | `omp-cli-bwrap`, `omp-herdr` (`PI_CONFIG_DIR` kept, it is a relative name) |
| deepseek | 4 | `pi-cli-bwrap`, `pi-herdr` |
| glm | 3 | `pi-cli-bwrap` |
| gemini | 1 | unchanged (`agy-cli-bwrap`, which gained `files` in P8) |
| claude | none | unchanged (standard list, so `credentialStore` and `sessionDir` are kept) |

Evidence:
- `fgos config check`: `config-unknown-key` 0 (was 9, all `resourceBindings`). Acceptance criterion 1 holds.
- `fgos dispatch explain`: `code:review` binds `codex-cli-bwrap`; inside herdr openai walks `codex-herdr`; gemini `agy-cli-bwrap`; deepseek and z-ai `pi-herdr` and `pi-cli-bwrap`. No legacy id appears.
- Harness probes: openai/fgovn `healthy` (four runs: codex cli, codex herdr, pi cli, pi herdr; only the first row was read individually, as `ok`); xai/vantt `healthy` (`omp-cli-bwrap` ok, `omp-herdr` ok, model grok-4.7). A real `fgos run` pinned to `thehive/thehive` returned OK through the generic deepseek form.
- Doctor: the failures that remain are not from this change (tool registry, a stale work step, root drift, an expired openrouter quarantine, release drift). momentry: no new failure (its own failures are hook wiring, tool registry, the same expired quarantine).

Not proven, stated plainly:
- openai/tetnu was not probed. deepseek and z-ai on the `openrouter` account returned `other` because `probe-account` asks the first cell entry, `thehive/...`, which the openrouter account cannot serve (`Model ... not found`); it is a probe artefact, not a regression (the same model would have been asked before). The OpenRouter fallback route of the generic forms has therefore not been proven live yet.
- Optional step E (writer-unit confinement check) was not run.
- The D1 rename and the P2 agy args are untouched.

Rollback per executor: `fgos config set --global runner.executors.<e>.invocations '<old list from the backup>'`.
