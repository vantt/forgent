---
id: p-mnymjukvqd
title: "Reserve one Claude account for the secretary head (Miu) and lease the other Claude accounts to the panes we open (seat binding / accounts, priority high under Release con nguoi; source: owner 2026-11-18)"
status: done
priority: P1
area: seat-binding
created: 2026-11-18
---

# Why

fgOS already keeps account pools in the `llmAccounts` config (each account names a login directory per CLI, leased in order). Miu must stay alive to keep operating, so her account must never be spent by a pane. Today Miu is started by hand, outside the lease.

# Done when

Miu keeps the default Claude login in the home directory (`~/.claude`; owner decision 2026-11-18) and no lease ever hands that login to another seat; every other Claude account lives in its own login directory outside the default home and is listed only in the pane pools; further Claude accounts can be added to a separate pool that new panes lease from; when the pane pool is exhausted or quota-limited, panes switch account or wait, and Miu is unaffected; the setting lives in the config door and is proven by a real start of a head and of a pane. The owner wants to be told the moment Miu (`head:secretary-miu`) can start through `fgos head start secretary --name miu` on her own account and refresh or rotate herself with `fgos head rotate` (owner 2026-11-18).

# Notes

Migrated from the legacy backlog table. Original status: done.
