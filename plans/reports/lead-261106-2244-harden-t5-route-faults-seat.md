# HARDEN T5 follow-up: provider route faults, seat side (provider HTTP error stop, probe model, pinned account login)

Branch `harden/t5-route-faults-seat` (worktree `forgent-worktrees/harden-t5-route-faults-seat`), base `d1e892ad0`.
Input: DOCOS report `plans/reports/debug-261106-2221-provider-route-faults-gemini-argon-agy-account-flag.md`
(sections 1 and 3). No P01 rows; each red proof was written first and seen red before the fix. Not pushed.

## Commits

| Commit | Item | What changed |
|---|---|---|
| `c0c192b79` | 1, dispatch side | `classifyProviderCapacityFault`: a provider stop with cause `provider` is `evidence-only`, reason code `provider-error` (no quota quarantine, no credential quarantine). Settlement already passes the cause through to `failure.cause`; its parameter comment now names `provider`. |
| `c7237a6ee` | 2 | `probeModelFor(cfg, {executorId, family})`: the strongest tier of `modelPolicies.<executor family>` whose cell has an entry served by the account's pool; the probe passes it as `cliOverride.model`, else probes the invocation default. Each result row carries `model` and `modelSource` (`<family>.<tier>` or `invocation-default`). |
| `b127b7960` | 3 | `rank.rs`: with an account pin, before the walk, a candidate of the pinned pool whose (unpinned) invocation's CLI the account holds no login for takes the first invocation that carries the posture and whose CLI it does. In the pin step the account lookup is hoisted out of the per-survivor loop; a survivor whose launching CLI the account still lacks is dropped, none left refuses `account-pin-no-login` naming the account's stores. A pinned invocation is never swapped. |

Item 1 split (coordinator decision, option a): the protocol lead adds the headless `provider-error` blocked reason
(last JSON event `stopReason: error`, `errorStatus` 4xx/5xx except 401/403) in
`packages/agent-protocol/rust/src/direct/mod.rs` and maps `direct:blocked:provider-error` (and the terminal one) in
`providerStopOf` (`src/run-supervisor/steps/settle-attempt.mjs`) to `{adapterOutcome: 'provider-limit', cause: 'provider'}`.
This branch assumes exactly that reason string and cause; until that lands, an omp 404 still settles
`nonzero-process-exit`.

## Red to green

| Proof | Red (before fix) | Green |
|---|---|---|
| `test/runner/provider-auth-failure.test.mjs` "a provider HTTP error stop moves the walk on but does not quarantine the account as quota or credential" (+ the settlement case now also asserts cause `provider` passes through) | fail 1 (`action` was `quarantine`, `quota-limit`) | pass 10 |
| `test/runner/provider-account-probe.test.mjs` "each CLI is probed on the strongest model a tier cell names for the account's pool, and the row says which" | fail 1 (`cliOverride.model` undefined) | pass 8 |
| golden v1 "an account pin takes the invocation whose CLI the pinned account holds a login for" | `invocation: omp-herdr` | pass |
| golden v1 "an account pin whose account holds no login for any invocation of the seat is refused by name" | `ok: true` | pass |
| `test/runner/execution/account-pin.test.mjs` "a pinned account launches through the invocation whose login store it holds, and one holding none is refused" (wiring) | fail 1 | pass 14 |

`account-pin.test.mjs:77` ("a pin ... can move the seat to the family that pool belongs to") unchanged and green.
No test retired.

## Gates

- Focused: provider/probe/capacity/pin/bind/seat-binding/doctor dry-bind files, `test/architecture.test.mjs`,
  `test/scripts/doc-health.test.mjs`, `test/scripts/check-decision-citation-drift.test.mjs`: 178 + 277 pass, 0 fail.
- Rust `fgos-seat-binding`: `cargo test` ok (golden 98 cases), `clippy --all-targets -D warnings` clean, `check`
  `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` ok. `cargo fmt --all --check`: rank.rs clean; one diff
  remains in `packages/convention/rust/tests/golden.rs:283`, already on origin/main, not touched here.
- `git-one-door-scan`: 0 undeclared; census regenerated in each commit.
- Full suite (`/dev/shm/t5seat-full.log`): 8601 tests, 8567 pass, 2 fail:
  - known frozen V7n addendum test (pre-existing);
  - `test/runner/claim-port.test.mjs` killed at the 600 s per-file limit (hang under suite load). Rerun alone:
    21 pass, 0 fail, 17 s. It touches no provider, account or seat code. The 2 `fgos-tp-*` leftovers belonged to
    that killed file's run root, which no longer exists.

## Size

Product: Node +32 −4 (probe +25, capacity +3, settlement 0), Rust +86 −30 (rank.rs; about +40 net is the
pre-walk invocation choice, the rest is the hoisted account lookup and rustfmt wrapping). Tests +76, golden +150
JSON. Docs: spec RUL79 and RUL106 one sentence each, CHANGELOG 3 lines. Net positive: these are fixes of
missing behaviour, not a cut.

## Deviations

- Item 1 is only the dispatch half here (see above); the classifier half is the protocol lead's.
- Item 2 picks the strongest tier that names the pool (flagship in today's configs; frontier wins if a frontier
  cell names the same pool), not the literal `flagship` key, so a config without a flagship cell still probes
  the most demanding model its seats ask for.
- Item 3 drops (rather than refuses at once) a survivor of the pinned pool that cannot run on the account, and
  refuses only when none is left, so a second executor served by the same pool still binds.

## For other lanes

- Protocol lead: `provider-error` reason and `providerStopOf` mapping as agreed; also the herdr screen
  `✘ Cloud Code Assist API error (404)` (DOCOS section 1) for the terminal side.
- Not covered by any lane here: the 404 root cause itself (`omp --profile` vs `PI_CODING_AGENT_DIR` launch shape,
  DOCOS section 1 hypotheses); a pinned account whose pool holds no login at all for the default CLI still
  fails `pool-unusable` in judge before the pin step and binds unpinned elsewhere with `account-pin-other-pool`.

Status: DONE_WITH_CONCERNS
Summary: Three commits: provider-cause stops no longer quarantine accounts, the account probe asks for the pool's strongest tier model and names it, and a pinned account binds to an invocation it is logged in to or refuses `account-pin-no-login`.
Concerns/Blockers: Item 1 takes effect only once the protocol lead emits `provider-error`; full suite had one load-related claim-port timeout (green alone).
