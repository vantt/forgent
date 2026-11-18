# Attention definitions

Named Observe queries that `fgos dispatch inspect --attention` runs in one call
(`fgos metrics query --def core/attention/definitions`). Detection is these files; the view only wires them, so a
definition added here is picked up with no code change. What to do about a row kind belongs to the watcher.

The view passes the window (`--since`, `--now`); a file never carries one.

## Pending Observe grammar

- `plan-no-progress` — the `within` of an anti-join is a literal duration; it cannot take a `params` value. The config
  key `dispatch.attention.planNoProgressMinutes` (default 60) therefore does not move the window yet: the file holds
  `60m`. Once `within` accepts a param, declare `params.minutes` from that key and read it there.
