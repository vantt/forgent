---
phase: 1
title: "Baseline and setup"
status: ready
effort: 0.5h
owner: HARDEN
---

# Phase 1: baseline and setup

Read-only except the measure template. No owner question blocks it.

## Steps

1. Read-only prototype checkout: `fgos worktree create /home/vantt/projects/forgent-worktrees/trial-proto-ro --detach
   --base origin/plan-supervisor-prototype`. Never commit there.
2. Baseline facts (record in the template's header): `fgos --version` / activated release, main head, prototype head,
   `fgos dispatch decide --for execute --json` plus `fgos dispatch probe-account` (no `--record`) for claude, openai
   (pi or codex) and gemini (agy) to note which seats are live today, and `fgos config explain 'runner.capabilities.code:implement.verify'` (expected unset;
   feeds Q2).
3. Dry index check, read-only: from the main checkout,
   `node <proto>/tools/plan-supervisor/scripts/plan-board.mjs check --root plans` and `eligible --json`. Count how many
   current plans print errors/warnings (missing `footprint`/`base`, unknown `status: ready`); this is a free data point
   for the draft's "generic data" requirement. Do not run `render --write`, `claim`, `lock`, `queue`, `install.sh`.
4. Watcher dry run: `<proto>/tools/plan-supervisor/scripts/watchdog.sh /home/vantt/projects/forgent` once by hand;
   note what it flags on existing `.fgos/assignments` and whether its mailbox message is noise. If it is noisy, the
   phase 3 watcher is `fgos workflow status` instead (record that choice).
5. Write `reports/measures-template.md` in this plan dir: one table per measure (§13.3 1-7), a seat table (family,
   executor, slice, attempts, resumes, outcome class, reason code), an intervention table (time asked, time answered,
   kind: gate|design|failure|housekeeping|review, wait), a friction-id list, and a lessons list. Units: minutes, counts.

## Validation

- Template exists and names every measure in plan.md "Measures".
- Baseline header filled; `check` output counted; watcher choice recorded.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `watchdog.sh` mails a live agent head on old failures | M x L | run once, read `alerts.log` first; switch to `fgos workflow status` |
| prototype parser misreads current plans | M x L | it is read-only; misreads are data for phase 4, not errors to fix |

## Rollback

Remove the read-only worktree (`fgos worktree remove ... --delivered-to origin/plan-supervisor-prototype`), delete
`~/.local/state/plan-supervisor/forgent/` if the watcher created it.
