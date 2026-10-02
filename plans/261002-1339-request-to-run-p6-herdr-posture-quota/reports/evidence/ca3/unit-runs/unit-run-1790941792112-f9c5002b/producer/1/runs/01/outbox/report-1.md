# Report 1: confined non-claude herdr pane recipe — config vs provider adapter

Read-only. No repo file modified. Sources read: docs/specs/confinement-authority.md §13.1 (+ §14 pointers), the herdr-spawn invocations in .fgos/config.json (codex-herdr-fgovn, agy-herdr-mucdong, pi-herdr-vantt; claude-herdr-bwrap / glm-herdr-bwrap as contrast), src/runner/dispatch/confinement/drivers/bwrap.mjs (copyHomeFiles, provisionSelectedCodexCredential, resource-binding loop ~L400-440), and `confined-pane-accounts` in src/setup/registrations.mjs:4330.

## Recommendation: keep it as per-invocation config (+ one doctor guard)

### Findings
1. The recipe is already split along the right seam. Each invocation declares only: `confinement.backend: bwrap`, a `private-home` resourceBinding naming the env var that points the agent at its home (CODEX_HOME / HOME / PI_CODING_AGENT_DIR), and `env` for the real-home path. Credential *layout* (which files, kind `codex-home` or `home-files`) is NOT in the invocation; it lives in the machine-global inventory `runner.providers.<p>.accounts.<id>.credentialSource` (RUL65b).
2. The bwrap driver is agent-agnostic by design (comment: "spec §6.5: no provider branching"). It copies an explicit file allow-list into the private home, fail-closed, and binds the env var generically. A provider adapter declaring "home layout + credential files" would re-add provider knowledge to that layer, or duplicate what the inventory already holds.
3. The three invocations are near-identical in shape; the only per-agent variance is one env var name. There is no layout logic left to centralise. Three consumers, one differing string, is below the bar for a new abstraction (YAGNI/KISS).
4. Real failure history (§13.1) was not "config is the wrong place" but "recipe was forgotten": cfd670c43 applied the posture to herdr invocations without a binding and codex/pi/agy died at start. An adapter would fix this only if it made the binding implicit — which is exactly the part that is cheaper as a guard.
5. Gap confirmed in code: `confined-pane-accounts` only evaluates invocations that already bind a private home. An invocation that omits the binding is invisible to it. This is the concrete hole that caused the regression, so the guard must fail on absence, not just validate existing bindings (critique finding upheld).

### Trade-offs
Keep as config:
- (+) No new abstraction; driver stays provider-neutral; credential knowledge stays single-sourced in the inventory; consistent with codex-cli-bwrap which uses the same form.
- (+) Cheap to change per account/home path; project config can still pick per-invocation env.
- (−) Recipe is repeated 3x; a new agent author must know to copy it (the "forgotten" failure mode).
- (−) Correct env-var name per agent is tribal until documented (it is, in §13.1).

Provider adapter:
- (+) One place declares layout; omission becomes impossible; new agents added declaratively.
- (−) New contract + schema + doctor/setup registration (AGENTS.md install/doctor gate), spec-first bar; must not leak provider branching into the driver.
- (−) Overlaps the account inventory, creating two sources for "which files make an account logged in".
- (−) Premature: only 3 agents, same mechanism, one varying string.

### Concrete follow-up (not done here, read-only)
Extend `confined-pane-accounts` (or add a sibling check) to FAIL when a herdr-spawn invocation with `confinement.backend: bwrap` and a non-claude `interactiveMode.kind` (codex, agy, pi) has no `private-home` resourceBinding. Register it via the existing doctor registry; add a test for the missing-binding case. Claude-kind invocations are exempt (they run today without one).

### Revisit trigger
Move to a kind-keyed table (keyed by `interactiveMode.kind` → env var name, defaulted so config only overrides) if a 4th agent kind appears or a second consumer needs the same layout. Even then the table belongs next to the interactive kind registry, not in the driver.

## Unresolved questions
- Is claude-kind exemption from the guard intentional long-term, or does the claude pane also get a private home eventually?
- Whether the guard should live in `confined-pane-accounts` or a separate check id (affects doctor output naming only).
