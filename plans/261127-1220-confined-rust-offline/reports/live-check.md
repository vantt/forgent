# Live check — acceptance criterion 4

Release `sha256:0b0992f6…` built from main `9840b971a4` (contains the ort fix `a2eb3be936`), 2026-11-28.
Raw transcript: [live-check-raw.txt](live-check-raw.txt). Assignments: `unit-run-1795830567168-c21ed2ac`,
`unit-run-1795830681678-52bb924d`.

**Launch argv** (envelope of the first unit) carries:

```
--ro-bind /home/vantt/.cargo /home/vantt/.cargo
--ro-bind /home/vantt/.rustup /home/vantt/.rustup
--ro-bind /home/vantt/.cache/ort.pyke.io /home/vantt/.cache/ort.pyke.io
```

The unit saw `CARGO_HOME`, `RUSTUP_HOME`, `CARGO_NET_OFFLINE=true`, `GIT_TERMINAL_PROMPT=0` and
`ORT_LIB_PATH=<cache>/dfbin/x86_64-unknown-linux-gnu/<hash>` (holding `libonnxruntime.a`); a write probe into
`~/.cargo` failed with `Read-only file system`.

| Run | HOME | Command | Result |
|---|---|---|---|
| compile from cache | real | `cargo test -p fgos-agent-context-engine --locked --no-run` | exit 0 in 15.0 s; `pkm-core`, `ort-sys` compiled, no prompt |
| empty cache | real | same, `CARGO_HOME=$(mktemp -d)` | exit 101 in 0.31 s: `failed to get pkm-core … you are in the offline mode (--offline)` |
| compile from cache | private, empty | same, `HOME=$(mktemp -d)` | exit 0 in 14.3 s |
| empty cache | private, empty | same, both temp | exit 101 in 0.06 s, same named refusal |

**Seat deviation.** Both gemini pools were at provider-limit, so `bind()` served the unit on pi (deepseek, invocation
`homeEnv: PI_CODING_AGENT_DIR`) instead of agy (`homeEnv: HOME`). The private-HOME condition that `homeEnv: HOME`
creates was reproduced inside the same confined unit with `HOME=$(mktemp -d)`; the resource and its variables do
not depend on `homeEnv` (plan decision 3), and both conditions pass.

**Review dispositions (fix `eb64be34f0`):** no blocking finding. Deferred: spec §9.4 does not say why
`ORT_LIB_PATH` is absent from the worker env allowlist (resource env bypasses that filter; the owner's scope
excluded the allowlist file); the test does not cover an ort link escaping the cache or a cache inside a private
root (same exclusion code as cargo/rustup); a hash dir is not checked for `libonnxruntime.a`. Rejected: following
`$XDG_CACHE_HOME` (owner answer fixes `<home>/.cache/ort.pyke.io`; absent cache gives no mount and no variable).
