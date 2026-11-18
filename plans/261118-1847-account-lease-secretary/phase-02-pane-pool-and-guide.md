# Phase 02: pane pool and Miu pool on the owner machines

Wave 2. Depends on 1. Capability `code:implement` (docs) plus a machine step run by the owner or OPC. Effort 0.5d plus
owner machine time. Discussion task `task-pane-pool`; decisions OD1, OD2, OD3, OD5, SD2; plan A4, A6.

## Context

Today pool `claude` holds one account `vantt` whose login is the same Anthropic account as `~/.claude` (F3), so every
claude pane spends Miu's quota. The owner logged in `tetcu`, `anhdvh`, `van.tran` into
`~/.fgos/private/claude-<id>`. This phase is mostly machine config; the repo part is a generic guide.

## Repo part

1. `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, section 5.3.1 ("A claude seat in the sandbox needs its
   own login"): add a short paragraph for any fgOS user: quota is per provider account, not per directory, so two
   login directories of one account share quota; keep the account of your main session (or secretary head) out of the
   pane pools; to reserve one, put it in its own pool that no tier cell names and point the persona at it (link to the
   seat-binding spec section phase 4 writes). With one account only, pane and main session share quota, and the
   doctor warn of phase 3 explains the renewal risk; fgOS still runs.

## Machine part (owner machines, not repo code)

Run on fg-server2 by OPC (owner rule: OPC does config steps there), then on each other owner machine by the owner
from this list. Back up `~/.fgos/private/accounts.yaml` first; never print a login file; use the config door
(`fgos config set|unset|patch --global --reason`) where it can express the change, else edit the file and run
`fgos doctor`.

1. `chmod 700` each of `~/.fgos/private/claude-tetcu`, `claude-anhdvh`, `claude-van.tran` (shaping saw 775).
2. Pool `claude`: add accounts `tetcu`, `anhdvh`, `van.tran`, each `credentialStore: {claude: ~/.fgos/private/claude-<id>}`;
   order is lease order.
3. Probe: `fgos dispatch probe-account` for each new account (owner-gated, spends a little quota). Only after at least
   one passes, move `vantt` out of `claude` into a new pool `claude-miu` with the same store (A4). No tier cell names
   `claude-miu`, so until phase 5 it is inert.
4. Check: `fgos dispatch explain --for execute --json` lists the three accounts usable in pool `claude` and no `vantt`;
   `fgos doctor` rows `llm-accounts-shape` and `confined-pane-accounts` are `ok`. Record command, exit and the account
   ids (no paths beyond the directory names, no content) in `reports/phase-02-machine.md`.

## Validation

`npm run check:docs` (or the repo's docs link check) green for the edited guide. Machine check as step 4. A real pane
start is proven in phase 5, not here.

## Risk and rollback

A pane seat pinned to claude may be refused while no new account has passed its probe: step 3 orders the move after a
passing probe. Rollback: restore the backed-up `accounts.yaml`.
