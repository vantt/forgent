---
phase: 7
title: "Owner-gated cleanups"
status: pending
priority: P3
effort: 1h
depends_on: [P3; step 4 after the P4 release is activated in every workspace]
touches: global and project config descriptions, provider-capacity state (through its verb)
---

# Phase 7: Owner-gated cleanups

## Steps

1. **gemini/mucdong quarantine (D7, state write).** A manual-clear `auth-token` quarantine dated
   2026-10-09 sits in `~/.fgos/runtime/provider-capacity/state.json`. First run the direct leg
   (owner-gated, quota): `fgos dispatch probe-account --provider gemini --account mucdong --leg direct`.
   If it answers `ok`, clear the quarantine through its own door, `fgos dispatch reconcile` (the
   provider-capacity quarantine door; check `fgos dispatch reconcile --help` for the exact flags) or
   `probe-account --record`, which lifts a login lock on an answer. Never edit `state.json` by hand.
2. **Stale descriptions, global** (`~/.fgos/config.yaml`): the gemini description (line 115) still
   describes `agy-cli-mucdong`/`agy-herdr-mucdong`. The xai description (line 142) describes the
   pinned `xai-vantt` profile, and the deepseek one (line 333) the account-dir design. Rewrite each
   to state the generic forms and "the account comes from the lease". Use
   `fgos config set --global runner.executors.<e>.description "<text>" --reason ...`.
3. **Stale descriptions, project** (`.fgos/config.yaml`): line 44 (`fgos-coding-implement` mentions
   `omp-gemini-tetcu72`), line 155 (gemini via omp) and line 160 (xai profile). Set them through
   `fgos config set` (project file), or unset them so the standard's text applies after P4. Then
   commit `.fgos/config.yaml` alone with a pathspec. Check `git diff` first: the file is already
   modified in the working tree by another change, so stage only these hunks, or ask.
4. **Global lists that equal the standard (D4, after the P4 release is activated in forgentX,
   momentry and mcp-skill-hub).** `fgos config check` reports `config-redundant-value` for each
   executor's `invocations` that now equals the standard. Unset each with `--global
   --acknowledge-comment-loss --reason "equals the standard"`. Re-run explain and doctor.
5. If the P1 stopgap (D6) was applied, revert it once the P1 release is activated.

## Validation

`fgos config check` shows no stale-description findings (manual read) and no redundant lists.
Doctor passes.

## Risk

A low-impact text-only change, except step 1 (state) and step 4 (inheritance). Both are gated on
explicit owner yes.

## Rollback

Restore from the backup taken before each write, or re-set the value.
