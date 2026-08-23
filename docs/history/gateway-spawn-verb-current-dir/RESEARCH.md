# Research — spawn_fgos_verb missing current_dir (tsk-og6)

## Round 1 — 2026-08-14

**Asked:** for a fix that adds `.current_dir(root)` to `spawn_fgos_verb`
(`herdr-plugin/src/gateway.rs:257-261`), are there other `process.cwd()`-
resolving verbs reachable through the gateway's own routes besides the two
the finding already names (`session`, `move --to delivered`)? Would setting
`current_dir` on every spawned CLI call break any verb that currently relies
on cwd differing from `--dir` for something unrelated to repo-root
resolution?

**Checked:**
- `rg -n "process\.cwd\(\)" bin/fgos.mjs` — 25 hits. Real `const repoRoot =
  process.cwd()` assignments (not comments) at `:1497` (`move --to
  delivered`'s tsk-5dk guard), `:1609`, `:2319`, `:2913`, `:3126`, `:4559`
  (`session`), `:4705`, `:4814`.
- Cross-referenced against the gateway's own route handlers
  (`gateway.rs:373-624`: `get_work`/`post_work`/`get_ready`/`get_rollup`/
  `get_graph`/`get_state_digest`/`post_sessions`/`delete_session`/
  `get_session_slots`/`post_runner_tick`) to find which CLI verbs the
  gateway can actually reach. Every route other than the `/sessions*` group
  and `/work/{id}/move` maps to a verb whose own comments explicitly say
  "repoRoot from `--dir`, never raw `process.cwd()`" (e.g. `:2647`,
  `:2753`, `:2830`, `:2886`, `:4416` are all such comments guarding the
  verbs `list`/`ready`/`rollup`/`graph`/`return`/`take` against exactly
  this class of bug already).
- The other `process.cwd()` sites (`:1609`, `:2319`, `:2913`, `:3126`,
  `:4705`, `:4814`) belong to verbs the gateway has no route for at all
  (`edit --verify-from-children`, `sync-root`, `review`, `doctor`, etc. —
  not `session`/`move`/`work`/`ready`/`rollup`/`graph`/`sessions`/
  `runner/tick`), so `spawn_fgos_verb`'s fix cannot reach them either way.
- `:1904`'s `process.cwd()` (inside `edit --verify-from-*`) is unrelated:
  it resolves git-common-dir for a verb the gateway never calls.

**Found:** the fix's blast radius is exactly the two verbs the finding
already names — `session` (`:4559`) and `move --to delivered`
(`:1497`) — both reachable through the gateway (`/sessions*`, `/work/{id}/
move`). No other gateway-reachable verb depends on `process.cwd()`, and no
verb anywhere in the CLI uses `process.cwd()` for anything OTHER than
repo-root resolution that `.current_dir(root)` would need to preserve
differently. Setting `current_dir(root)` on the spawned child process is
safe: `root` is already used to build the child's own binary path
(`root.join("bin/fgos.mjs")`) and passed as `--dir`, so it is already
guaranteed to be a valid, readable directory.

**Still open:** none.
