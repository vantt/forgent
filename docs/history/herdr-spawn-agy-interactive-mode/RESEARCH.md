# RESEARCH — tsk-10j: agy-herdr interactive-mode redesign

## Round 1 (2026-08-26, discovery) — is there a robust completion signal better than text-pattern matching?

**Asked:** The submitted item's own description assumed completion detection
would have to watch the pane's raw scrollback TEXT for an idle indicator
(the UI status bar changing from "esc to cancel"/"Generating..." to "?
for shortcuts") — already known to be adjacent to the exact echo-pollution
bug class tsk-5jl's own iron-law-evidence.md documents fixing once. Before
locking that as the plan's approach: does herdr itself expose a more
robust, STRUCTURED (non-text) signal for "is the foreground agent process
idle or busy" that a real caller could poll instead?

**Checked:** `herdr pane split`/`herdr pane list` real JSON responses,
live, against a real `agy -i '<long prompt>'` run in an actual pane.

**Found:** `herdr pane list`'s own per-pane object carries `agent` (the
detected foreground agent CLI name, e.g. `"agy"`) and `agent_status` —
confirmed real, structured, and reliable via direct live polling:

```
t+1s: agent_status="working", agent="agy"   (agy still generating the response)
t+4s: agent_status="working", agent="agy"
t+9s: agent_status="idle",    agent="agy"   (agy has genuinely finished)
```

This matches upstream herdr's own documented foreground-process detection
mechanism (`upstreams/herdr/src/detect/mod.rs`, confirmed via source read
earlier this session: `foreground_process`/`foreground_group_leader_job`
recognize known agent CLI binary names by process name, e.g. the existing
test fixtures for `"claude"`/`"codex"`) — `agy` is evidently also
recognized. This is a genuinely different, more robust signal than
anything text-based: it comes from herdr's own process-table inspection
of the pane's real foreground job, not from parsing what the agent
printed, so it cannot be fooled by an echoed prompt containing lookalike
text the way a `[DONE]`-token grep already was (also reproduced live this
same session: a prompt literally containing "[DONE]" as instructional
text matched on the FIRST occurrence — the echo — while agy was still
visibly "Generating...", a real false positive).

**Verdict:** clear. The plan should poll `herdr pane list`'s
`agent_status` field (`"working"` -> `"idle"` transition for the target
`pane_id`) as the PRIMARY completion signal, not a text/regex match
against pane scrollback. This is strictly more robust and simpler to
implement (a JSON field read, not a regex against a raw terminal
transcript) than the text-based approach the item's own submission text
assumed before this round of research.

## Overall verdict

**clear.** All three pieces this item depends on are proven live, not
assumed:
1. `agy -i '<prompt>'` produces a real, rich interactive TUI (prior
   research, this same session, cited in the item's own description).
2. `agent_status` (`herdr pane list`) is a real, structured, reliable
   idle/working signal for a pane's foreground agent process (this
   round).
3. An externally-typed `/exit` (via a second `herdr pane run`) genuinely
   terminates the real `agy` process cleanly, and the shell's own `$?`
   immediately after correctly reflects agy's real exit code (prior
   research, this same session, cited in the item's own description).

Verify: `npm test` plus the required real live proof (dispatch a real
work item through the redesigned `executors.agy-herdr`, confirm the rich
TUI shows live, `agent_status` correctly drives the close sequence, the
pane auto-closes, and the adapter returns the correct real exit
code/stdout).
