# Report: confined-pane recipe — per-invocation config vs provider adapter

Read-only. No file modified except this outbox.

## Evidence read
- docs/specs/confinement-authority.md §13.1 (recipe, history, why forgotten).
- .fgos/config.json: `codex-herdr-fgovn`, `agy-herdr-mucdong`, `pi-herdr-vantt` (adapter herdr-spawn, confinement.backend bwrap).
- src/runner/dispatch/confinement/drivers/bwrap.mjs (lines 21-100, 291, 415-416).

## Findings
1. The three invocations differ only in one datum: `resourceBindings[0].target.name` (CODEX_HOME / HOME / PI_CODING_AGENT_DIR) plus `interactiveMode.trustStore.kind`. The rest of the recipe is identical: private-home binding + `${HOME}`-expanded env default.
2. Credential layout is NOT in the invocation. It is in the machine-global inventory `runner.providers.<p>.accounts.<id>.credentialSource` (`codex-home` | `home-files` with explicit file list). The driver copies it owner-only, fail closed (bwrap.mjs:72-95). So "which credential files" already lives in a provider-keyed declaration; the only thing a new adapter would add is "home layout" = the env var name.
3. The driver is already agent-agnostic: it acts on a `private-home` binding and a `credentialSource`. Residual codex-ism: function `provisionSelectedCodexCredential` and the `codex-home` kind (hardcodes `auth.json`). `home-files` already covers agy/pi, so that is a naming smell, not a gap.
4. The real failure in §13.1 history was omission (cfd670c43 applied posture without a binding; H8 refusal undocumented), not a missing abstraction. An adapter that "declares layout" would not by itself have prevented it unless it also made the binding implicit.

## Options
### A. Keep per-invocation config (+ guard) — RECOMMENDED
- Pros: zero new surface; no second source of truth for env var names (invocation already owns `env` and `command`); matches `codex-cli-bwrap` precedent; per-account invocations (fgovn, mucdong, vantt) legitimately differ in home path; consistent with single-user/no-compat rule (YAGNI/KISS).
- Cons: 3x repetition, drift risk when a 4th agent or a new invocation is copied without the binding (exactly the cfd670c43 failure); layout knowledge is implicit in config rather than named.
- Mitigation (small, in scope of install/doctor gate): doctor check that a confined (`confinement.backend` set) herdr-spawn invocation whose `interactiveMode.kind` is not claude must carry a `private-home` binding, extending the existing `confined-pane-accounts` check; rename `provisionSelectedCodexCredential` to a neutral name when next touched.

### B. Provider adapter declaring home layout + credential files
- Pros: one place per agent kind (env var, trust-store kind, credential file set); new invocations inherit the binding automatically, so the omission class disappears; clearer docs.
- Cons: new module + registry + spec/config-registry entry (AGENTS.md install gate: new area gets spec before code); duplicates what credentialSource already declares, creating two sources of truth to keep in sync; layout is per-account/per-install (agy HOME vs codex dir paths differ per account), so the adapter would still need per-invocation overrides; only 3 consumers, 1 driver. Premature.

## Risks / red-team on the recommendation
- Guard must key on `kind`, not on command name, or a renamed executor escapes it again (history item c).
- If a second consumer of the layout appears (e.g. a non-herdr adapter needing the same env var names, or a 4th agent kind), switch to a small kind-keyed table (`kind -> {homeEnv, trustStore}`) consumed by config validation, still not a full adapter.
- Doctor guard is advisory until `runner.confinement.strict` defaults true (open deferred item), so omission is detected, not blocked.

## Recommendation
Option A: keep per-invocation config, add the doctor guard, defer any adapter until a 4th agent kind or second consumer exists; then prefer a kind-keyed table over a full adapter.

## Unresolved
- Whether doctor guard should be hard-fail or warn under non-strict mode (product call).
