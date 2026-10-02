# Panelist-1 report: confined-pane recipe, config vs provider adapter

Read-only. Read: docs/specs/confinement-authority.md 13.1, the three herdr invocations in .fgos/config.json (codex-herdr-fgovn, agy-herdr-mucdong, pi-herdr-vantt), and the credential code in drivers/bwrap.mjs (lines 21-90; the rest only grepped).

## Facts
- The only agent-specific datum per invocation is one binding: private-home -> env var (CODEX_HOME / HOME / PI_CODING_AGENT_DIR). It duplicates the invocation's own `env` key name.
- Credential layout is not per-invocation. It is already in the machine-global inventory (`runner.providers.<p>.accounts.<id>.credentialSource`): kind `codex-home` (auth.json) or `home-files` (explicit file list). bwrap.mjs copies from that source into the private home, owner-only, fail closed, and knows nothing about codex/agy/pi. agy and pi use `home-files`.
- Trust-store seeding is keyed by `interactiveMode.kind` / `trustStore.kind` (herdr-round.mjs), also already declarative.

So most of what an "adapter declaring home layout and credential files" would hold already exists in two declarative places. What remains per-invocation is 8 lines of JSON per agent.

## Recommendation: keep per-invocation config (option A)
Add a `fgos doctor` guard: a confined (`backend: bwrap`) herdr-spawn invocation whose agent is not claude must declare a private-home binding. `confined-pane-accounts` already catches the "starts logged out" half; the missing half is the cfd670c43 failure (posture applied, binding absent, agent dies on read-only state dir).

## Trade-offs
Keep config:
- (+) Driver stays agent-agnostic; no new abstraction/contract/registry; YAGNI/KISS. Three consumers, all same shape.
- (+) New agent = config + inventory entry, no code release.
- (+) Matches RUL11 only if gathered into one place: the recipe is already gathered in 13.1 and doctor.
- (-) Recipe can be forgotten again (the 10-01 regression). Mitigated by the doctor guard, not eliminated.
- (-) Env var name duplicated between `env` and binding; drift possible (doctor can cross-check).

Provider adapter (option B):
- (+) One place declares each agent's home layout; omission becomes impossible by construction; fixes the "forgotten" class at the root.
- (-) Duplicates the inventory's credentialSource role -> two sources of truth for credential files unless inventory is folded in, which widens scope into RUL65b and the rotator.
- (-) New contract surface (setup/doctor registration, spec entry per distribution gate) for 3 entries; adapter would need to be kind-keyed anyway, i.e. a table.
- (-) Pulls agent knowledge into dispatch code, reversing the current clean driver boundary.

## Revisit trigger
Move to a kind-keyed default table (binding target derived from `interactiveMode.kind`, invocation may override) when a 4th agent kind is added or a second consumer (cli-spawn H8 exception lifted) needs the same derivation. Still a table, not a plugin adapter.

## Caveats
Did not run doctor or tests; did not read bwrap.mjs beyond the credential section; the claim that H8 rationale lives only in code comments is taken from spec 13.1, not re-verified.

## Unresolved
- Should the doctor guard cross-check env-name vs binding-name, or only presence?
