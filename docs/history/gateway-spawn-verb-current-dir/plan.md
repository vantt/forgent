# Plan — spawn_fgos_verb missing current_dir (tsk-og6)

Mode: **tiny** (0 Mode-gate flags — no auth/authorization/data-model/audit-
security/external-system/public-contract/cross-platform/multi-domain
concern; the fix's blast radius, per `RESEARCH.md` round 1, is confined to
two verbs' cwd resolution and `spawn_fgos_verb` carries no existing test
coverage today, so "existing covered behavior" does not apply either).

## Approach

**Chosen path:** extract `spawn_fgos_verb`'s `std::process::Command`
construction (currently inline, `gateway.rs:251-262`) into a small pure
helper `build_fgos_command(root, args) -> std::process::Command` that also
calls `.current_dir(root)`, so the fix is directly, cheaply testable via
`Command::get_current_dir()` (stable std API) without spawning a real `node`
subprocess in the test.

**Why this path over a bare one-line edit:** `spawn_fgos_verb` has zero
existing test coverage (`RESEARCH.md` round 1) — the existing `gateway::
tests` module only exercises HTTP routing/auth against a `FakeGateway`
mock, never `FgosCliGateway`'s real `spawn_fgos_verb`. A bare one-line
`.current_dir(root)` edit with no new test would leave this exact class of
regression (a call site quietly losing its `current_dir`/`--dir` again
later) invisible to the suite, the same blind spot that let this bug exist
in the first place. Extracting a pure `Command`-building helper is the
smallest change that makes the fix provable without a real-subprocess
integration fixture (git repo + `.fgos` store + a reachable `bin/fgos.mjs`
copy), which this `tiny`-mode item's own scope does not call for.

**Alternative rejected:** a real-subprocess integration test (spawn an
actual `node bin/fgos.mjs session start` against a temp fixture repo and
assert it wrote its registry under the fixture's `.fgos/`, not the test
runner's cwd). Rejected as disproportionate to a `tiny`-mode, single-line
behavioral fix — it would need to provision a full working fgOS store and a
reachable copy of `bin/fgos.mjs` inside the test fixture, real setup cost
this item's own scope does not call for; the pure-helper test proves the
same fix (the spawned `Command` carries the right `current_dir`) without it.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `build_fgos_command` helper (extracted from `spawn_fgos_verb`) | low — pure function, no I/O, no behavior change beyond adding `.current_dir()` | new unit test asserting `cmd.get_current_dir() == Some(root)` |
| The 2 real cwd-resolving verbs (`session`, `move --to delivered`) this fix actually affects | low — `RESEARCH.md` round 1 already confirmed these are the ONLY gateway-reachable verbs affected, and setting `current_dir` to `root` (already used to build the child's own binary path and passed as `--dir`) cannot regress anything that currently works | existing `gateway::tests` suite (7 tests, `FakeGateway`-based, unaffected by this change) plus the new helper test |

**Impact-analysis posture: degraded** (same as `tsk-4uh`/Finding 1 — GitNexus
`present` per `fgos tool query`, but returns zero indexed symbols for
`herdr-plugin/src/gateway.rs`; not re-queried this item, same file, same
gap, cross-checked instead via `RESEARCH.md` round 1's direct `rg`/`Read`
survey of every `process.cwd()` call site and every gateway route handler).

## Files touched

- `herdr-plugin/src/gateway.rs` — only file. No split.

## Split decision

**No split.** One honest piece: extract the Command-building helper, add
`.current_dir(root)`, add one unit test. `fgos graph --json`'s
`criticalPath`/`topUnblock` do not include `tsk-og6` or any gateway-audit
sibling (same read as `tsk-4uh`'s plan.md — this session's own earlier
`fgos graph --json` call this pass); ordering among the 9 siblings follows
the audit report's severity ranking (this is Finding 2, high, second in the
queue).

## Outstanding questions

None
