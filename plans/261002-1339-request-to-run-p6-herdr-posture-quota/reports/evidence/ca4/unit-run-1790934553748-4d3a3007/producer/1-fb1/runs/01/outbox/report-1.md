# Report 1

Read src/runner/execution/bind.mjs lines 250-270 (no files modified; only outbox files written).

**Answer:** The `transport` variable can take only the two values `'cli'` (initialised at line 257) and `'herdr'` (assigned at lines 263 and 266).

Evidence: `let transport = 'cli'` at L257; `transport = 'herdr'` at L263 (pinned override invocation whose adapter is `herdr-spawn`) and L266 (herdr present, herdr invocation can apply posture).

Unresolved questions: none.
