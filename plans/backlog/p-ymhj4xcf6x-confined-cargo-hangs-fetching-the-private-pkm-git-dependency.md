---
id: p-ymhj4xcf6x
title: "A confined unit's cargo hangs forever fetching the private pkm git dependency (runner confinement, priority high; source: lead:SUPERVISOR, 2026-11-27)"
status: done
priority: P1
area: runner
created: 2026-11-27
---

# Why

Since c7b66be3cf (2026-11-26 16:14), `packages/documentation/rust` and `packages/agent-context-engine/rust` depend on
`git = "https://github.com/vantt/pkm"`, a private repository (anonymous HTTPS answers 404). A confined unit runs with
`HOME` and `CARGO_HOME` under `/tmp/fgos-confinement/<disp>/home`, whose `.cargo/git` starts empty and which has none of
the owner's GitHub credentials (the `gh auth git-credential` helper lives in the real home). Any `cargo test` or
`cargo build` in the workspace then runs `git-remote-https https://github.com/vantt/pkm`, which waits on a credential
prompt with no timeout. Killing the fetch makes cargo retry it.

Evidence (fg-server2, 2026-11-27 00:30-00:55): two units hung 22-25 minutes in that fetch, the changelog-fragments
fix unit (`cargo test -p fgos-supervision --test land`) and Keeper phase 9 (`--test watcher --test definitions`).
The same commands passed unconfined in their worktrees (69 and 22+ tests green).

# Done when

A confined unit runs workspace cargo commands without network credentials and without hanging: the pkm sources are
reachable read-only from the confinement (for example a shared, read-only cargo git cache or a vendored copy), and a
fetch that cannot authenticate fails fast with a named reason instead of waiting.

# Notes

Until then, confined units cannot run any cargo gate; leads send cargo gates to lead:SUPERVISOR.
