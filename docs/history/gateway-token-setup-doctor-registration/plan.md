# Plan — gateway token not in setup/doctor (tsk-4r1)

Mode: **standard** (2-3 flags — this adds a config default (explicitly
named in `AGENTS.md`'s own install/setup/doctor gate as requiring exactly
this registration), and touches the shared config-registry test's spec
cross-check (`RESEARCH.md`'s discovery that `docs/specs/distribution.md`'s
Data Dictionary rows are a hard, test-enforced obligation) — real,
cross-cutting, not a one-file fix).

## Approach

**Chosen path** (`RESEARCH.md` round 1):

1. `registerConfigDefault({id: 'gateway', key: 'gateway', shape: {port:
   4170, token: null}})` in `src/setup/registrations.mjs` — matches
   `gateway.rs`'s own `DEFAULT_PORT = 4170`. `token: null` follows the
   real, existing `workerSlots.ceiling: null` precedent (ship present-but-
   unarmed, never a shared predictable secret).
2. `registerCheck({id: 'gateway-token-configured', ...})` — reads
   `~/.fgos/config.json` (`os.homedir()`, NOT `cwd` — matching where
   `load_gateway_config` actually reads from), passes if `gateway.token`
   is a non-empty string, fails naming the real fix otherwise.
3. `registerFix({id: 'gateway-token-configured', fix: ...})` — generates
   `crypto.randomBytes(32).toString('hex')` (256-bit, appropriate entropy
   for a bearer token — not `randomUUID`'s 122 bits, `session.mjs`'s own
   choice for a non-secret id) and writes it into `~/.fgos/config.json`'s
   `gateway.token` field via the existing `readSharedConfig`/
   `writeSharedConfig`, only when missing/empty (idempotent, matches the
   `gateBypass` fix's own read-merge-write shape).
4. Update `docs/specs/distribution.md`'s Data Dictionary rows #7/#7b to
   name `gateway-token-configured` — `test/setup/registrations.test.mjs`'s
   own two spec-consistency tests assert this list is exhaustive; skipping
   it fails the verify, by design (that enforcement is the whole point of
   those two tests, per the comment directly above them).
5. Update `herdr-plugin/src/gateway.rs`'s `GatewayConfigError::NotFound`/
   `MissingToken` `Display` text to name the real remediation
   (`fgos setup && fgos doctor --fix`) instead of the current generic
   "add a gateway: {token: ...} entry by hand".

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `registerConfigDefault`/`registerCheck`/`registerFix` for `gateway` | low — additive, same shape 20+ existing entries already use | `npm test` (`test/setup/registrations.test.mjs`'s own generic-mechanism tests already prove any new registration is picked up without editing `checks.mjs`) |
| Home-dir targeting (`os.homedir()`, not `cwd`) in the check/fix | medium — no existing precedent to copy verbatim, a wrong path would check/fix a file the gateway never reads | new test: check/fix functions called with an explicit fake-`$HOME` env override, asserting they read/write THAT path, not `cwd`'s `.fgos/config.json` |
| `docs/specs/distribution.md` Data Dictionary rows | none if updated correctly, else a hard test failure by design | `test/setup/registrations.test.mjs`'s existing "Data Dictionary #7/#7b names exactly the registered..." tests, run as part of `npm test` |
| `gateway.rs` error message text | low — string-only change, no behavior change | `cargo test --manifest-path herdr-plugin/Cargo.toml` (no test asserts exact error text today, confirmed by `rg` — a wording change can't regress a test that doesn't exist; full suite still proves nothing else broke) |

**Impact-analysis posture: degraded** for the Rust portion (same GitNexus
gap as prior gateway-audit items); **inactive** for the JS portion — no
Rust file's own call graph is implicated, and the JS-side registry has no
GitNexus coverage claim either way (not queried, cross-checked instead via
direct read of the registry + its own test file).

## Files touched

- `src/setup/registrations.mjs`
- `docs/specs/distribution.md`
- `herdr-plugin/src/gateway.rs`

## Split decision

**No split.** One coherent fix: the registry entries only satisfy the
doctor gate if the spec row and the error-message text agree with them —
splitting these into separate items would leave each one temporarily
inconsistent with the others. `fgos graph --json`'s `criticalPath`/
`topUnblock` do not include `tsk-4r1` or any gateway-audit sibling; last
in the queue (Finding 9, low, ninth of nine).

## Outstanding questions

None
