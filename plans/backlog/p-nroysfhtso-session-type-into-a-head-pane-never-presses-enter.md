---
id: p-nroysfhtso
title: "Text typed into a head's pane with fgos session type is never submitted: the Enter key is not pressed (session-host, priority high; source: owner via Miu, 2026-11-25)"
status: proposed
priority: P1
area: session-host
created: 2026-11-25
---

# Why

Owner, 2026-11-25: every time a head types into another head's pane, the text lands in the input box but Enter is not pressed, so the receiving head never acts on it. A message that is typed but not submitted is as good as unsent, and it hides the failure because the verb reports success. Related: `p-nnaksnxtwu` (heads must always be able to speak up).

# Done when

`fgos session type` submits the text it typed (Enter pressed, or an explicit `--no-enter` for the rare case that wants it held), for every agent CLI the heads run in. One owning proof at the pane-driver layer, plus one live check that the receiving head sees the line submitted.

# Notes

Not yet diagnosed: whether the cause is the `session type` verb never sending Enter, or Enter sent in a form the CLI's input box ignores (for example bracketed paste swallowing the newline). A shaper or debugger proves the cause before a fix is chosen.
