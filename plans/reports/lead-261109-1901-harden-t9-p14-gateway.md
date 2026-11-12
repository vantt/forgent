# Lead report: HARDEN T9 P14, gateway hardening

Branch `harden/t9-p14-gateway`, one commit on `origin/main` (rebased over the census change). The phase file sized Rust at about +60; the real change is larger because the call-site switch, the `status` carrier and the tests landed together (see Deviations).

## What changed

- **Default bind.** `core/config-standard/gateway.yaml` `bind: 127.0.0.1`; the doc line and the schema description say non-loopback is explicit (`gateway.bind`). The non-loopback warning stays. No `--bind` flag (plan open question 1).
- **Caller recorded.** `require_token` stamps a `Caller`: `cf:<identity>` after a verified Cloudflare Access assertion, else `token:<12 hex of sha256(token)>`, never the token. A request whose method can change state writes `fgOS gateway: <caller> <METHOD> <path>` on the gateway's stderr; `ask` and `answer` also carry `--source gateway:<caller>`. Reads are not recorded.
- **Rhai limits.** String 4 MiB, array and map 100 000, call levels 32, expression depth 64/32, `DummyModuleResolver` (no `import`), and a 600 s wall-clock bound checked at every operation (`run_script_within` takes the budget so the test uses 100 ms).
- **Concurrency cap.** `limit_in_flight` (32 permits, `try_acquire`) sits inside `require_token`; the 33rd request gets 429 `busy` at once. Not a `tower` layer: `ConcurrencyLimit` is not `Clone`, so `Router::layer` refuses it, and it would queue instead of refuse. `tokio` gains the `sync` feature; no new crate for this. `sha2` (already in the lock) is the one new direct dependency, for the fingerprint.
- **File reads.** Each `CONTEXT.md` and `plan.md` is canonicalised and its prefix rechecked against `docs/history` before reading. `with_static_serving` serves the embedded bundle only (the cwd-relative `static` directory and the `tower-http` `fs` feature are gone).
- **JWKS client.** Built inside `CfAccessVerifier::new(team_domain, aud)` with a 10 s timeout; a failed fetch is remembered for 30 s.
- **Call-site switch (P13).** `spawn_fgos_verb` and `/runner/tick` use `fgos_command`; the node fallback and `build_fgos_command` are deleted; `is_tier_zero` is deleted and `resolve_fgos` is private in `herdr-fgos-common`. A missing shim is `GatewayError::unavailable` (503, category `precondition`, message names `fgctl init`).
- CHANGELOG line; `docs/platform/herdr-web-dashboard/spec.md` (two lines stating the old 0.0.0.0 default); mutation census regenerated (0 undeclared sites).

## Proof

Owning tests, by behaviour:

- `mcp.rs`: a doubling string and a doubling array end in a script error; `import` is refused; a script past its budget is terminated.
- `gateway.rs`: the default config loads loopback (the 0.0.0.0 test renamed); a bearer `ask` records a fingerprint, not the token; a CF identity `answer` records `gateway:cf:<email>`; a flood of 7 against a cap of 3 gives 3 OK and 4 busy with peak concurrency 3; a `CONTEXT.md` link out of `docs/history` reads as null; no shim gives 503 naming `fgctl init`; static serving tests now cover the embedded bundle only.
- `cf_access.rs`: a stalled endpoint times out; the second request inside 30 s does not reach the endpoint.
- Retired: `build_fgos_command_runs_in_root_not_the_ambient_process_cwd` (working directory and `--dir` are owned by `fgos_command_runs_the_shim_with_dir_and_project_cwd` in `herdr-fgos-common`); `static_serving_enabled_prefers_the_on_disk_override_over_the_embedded_bundle` (behaviour removed).
- Rust: gateway `cargo test` 99 pass; clippy `-D warnings` clean for the gateway and `herdr-fgos-common`; `cargo fmt --all --check` clean. msvc and aarch64-apple-darwin `cargo check` pass for `herdr-fgos-common`. The gateway crate cannot be cross-checked on this machine: the `aws-lc-sys` C build fails for both targets. Confirmed on a clean `origin/main` checkout (62eda3ac6, same `cargo check --target` in `apps/fgos-gateway`): the same `cc-rs` error for both targets, so it predates this change.
- Node focused: architecture, doc-health, decision-citation-drift, fgos-gateway, config-door, facade, config-fixture, config-checks, checks-doctor-config: 157 pass.
- Full suite: `npm test` on the first commit (before the rebase over the symlink-refusal and identity phases): 8605 pass, 1 fail, no ERROR lines. The one failure is the known V7n addendum (`test/scripts/mailbox-behaviour-v7n.test.mjs`). 630 files, 2362 Rust tests, 619 s wall. After the second rebase the focused set was rerun (below).

## Not done

- No live `fgos gateway start` and `status` check: this machine has no gateway token file and the worktree has no installation; provisioning a token would change the owner's state. `fgos:dev gateway status` reports not running, as expected. The loopback default is proved by `load_gateway_config` reading the bundled standard.

## Deviations from the phase file

- The phase says the record is "the existing `--source` of the verb". Only `ask`, `answer` and `decision` accept `--source` in `bin/fgos.mjs`; every other verb refuses an unknown flag. So every state-changing request is recorded on stderr, and `ask` and `answer` also store it. A durable record for `submit`, `move`, `approve` and the rest needs a verb change in Work (`bin/fgos.mjs`), which this phase does not own: backlog row `p-tnxbnqboeb` (Work later, decision 81 Q2; the Work batch of decision 78).
- MCP `execute` arrives as `POST /v1/mcp`, so the stderr line names the caller of the MCP request but not of each verb the script runs.
- `GatewayError` gained a `status: Option<StatusCode>` field (15 literal sites got `status: None`) so the 503 needs no new `category`; the contract's category set stays closed.
- The map size limit is set but has no own proof: a map cannot grow faster than the 500 000-operation cap reaches 100 000 entries.

## Guide text for P16 (LAN and Tailscale machines)

After upgrading, a machine that serves the dashboard to other machines adds `"gateway": { "bind": "0.0.0.0" }` (or its Tailscale address) to its global fgOS config file, then runs `fgos gateway stop` and `fgos gateway start`. Without it the gateway listens on 127.0.0.1 only.

## Authority

- The gateway's caller record has no durable owner: Work's verbs hold `--source` for three verbs only. It belongs in the Work verbs (one common caller field), which the Work layer owns; told to `forgent-6a`.

## Lessons

- A phase file that names a flag ("the verb's `--source`") must be checked against the verb table before it is planned; here 3 of 14 mutating verbs accept it.
- `fgos-gateway` is outside the root workspace: `cargo fmt --all`, `cargo test --workspace` and the cross-target checks do not see it. Its gate is `cargo test` and `cargo clippy` run inside `apps/fgos-gateway`.
- The one-door scan builds in the worktree with the default target directory unless `CARGO_TARGET_DIR` is exported in the same command.
