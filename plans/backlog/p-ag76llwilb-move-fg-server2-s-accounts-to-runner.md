---
id: p-ag76llwilb
title: Move fg-server2's accounts to `runner.llmAccounts` only (machine config, priority medium; owner approved 2026-11-17, to be done as a planned step)
status: done
priority: P2
area: config
created: 2026-11-17
---

# Why

Part of the invocation and account config split (board 2026-11-17, option c: design-lap owns per-machine config). On fg-server2, `~/.fgos/private/accounts.yaml` holds both `runner.providers.*.accounts` (8 accounts) and `runner.llmAccounts` (7 accounts; the claude account has no pool). `fgos config migrate --global --dry-run` reports nothing pending, because it moves `~/.fgos/config.json` keys, not this file.

# Done when

Steps, each with a backup and a rollback: back up the file; add a `claude` pool to `llmAccounts` holding the claude account; remove the `runner.providers.*.accounts` blocks; run `fgos config check` and `fgos dispatch probe-account --provider <p> --account <a>` (read-only, no `--record`) for every account; post the board line 'fg-server2 on llmAccounts'. Done when every probe answers as before and the line is posted.

# Notes

Migrated from the legacy backlog table. Original status: done.
