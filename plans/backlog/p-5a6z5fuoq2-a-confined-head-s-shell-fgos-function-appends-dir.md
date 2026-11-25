---
id: p-5a6z5fuoq2
title: A confined head's shell `fgos` function appends `--dir`, so every plain `fgos` call is refused `argv-not-allowed`
status: proposed
priority: P1
area: session-host
created: 2026-11-25
---

# Why

In head session `head:supervisor-forgent`, the shell snapshot defines an `fgos` function (from the opt-in shell integration in the user profile) that appends `--dir "$root"` to every call. The head's argv window refuses `--dir` ("--dir changes the project root, the cwd or the environment of the call", code `argv-not-allowed`), so `fgos questions`, `fgos supervisor queue` and every other verb fail at the start ritual. The only workaround is to call `.fgos/installation/bin/fgos` directly. The lead of plan 261125-1556 reported `fgos supervisor raise` refused in the same window on the same day; that may be the same cause.

# Done when

A confined head runs a plain `fgos <verb>` and reaches the window without an injected `--dir`: either the head's shell does not load the integration function, or the integration skips `--dir` when `FGOS_HEAD_REQUEST_SOCKET` is set. One test covers the chosen rule.

# Notes

Related: p-ls4tuvflrd (the same shell integration still runs a project's own shim).
