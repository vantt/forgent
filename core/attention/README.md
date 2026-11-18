# Attention definitions

Named Observe queries that `fgos dispatch inspect --attention` runs in one call
(`fgos metrics query --def core/attention/definitions`). Detection is these files; the view only wires them, so a
definition added here is picked up with no code change. What to do about a row kind belongs to the watcher.

The view passes the window (`--since`, `--now`); a file never carries one, except to declare `"window": "own"`.

`plan-no-progress` owns its window (`"window": "own"`): a plan that went running before `--since` and has stalled since
is still found. Its no-progress span is the config key `dispatch.attention.planNoProgressMinutes` (default 60), read
through `params.minutes` into `"within": {"param": "minutes", "unit": "m"}`. A row's instant is the observation, not
the state change it grouped.
