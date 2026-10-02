# Report 1 — confined herdr pane recipe: per-invocation config vs provider adapter

Read-only. Sources read: docs/specs/confinement-authority.md §13.1 (+§14 pointers), the three herdr invocations in .fgos/config.json (codex-herdr-fgovn, agy-herdr-mucdong, pi-herdr-vantt; claude-herdr-bwrap / glm-herdr-bwrap for contrast), src/runner/dispatch/confinement/drivers/bwrap.mjs, and grep of herdr-round.mjs trust-store code. No file modified.

## What the facts say

1. The driver is deliberately agent-agnostic. `prepareBwrap` header + R4: no branching on executor id/agent; mounts come only from resolved resources; the invocation's `resourceBindings` just maps a resource to an env var (`CODEX_HOME` / `HOME` / `PI_CODING_AGENT_DIR`). The sole provider-aware piece is `provisionSelectedCodexCredential`, and it is already data-driven: it reads `request.providerCapacity.credentialSource` (`codex-home` or `home-files` + explicit file list).
2. Credential layout already lives in a registry, not in invocations: `~/.fgos/config.json runner.providers.<p>.accounts.<id>.credentialSource` (RUL65b). So "which credential files" is already declared once, per account, machine-global.
3. Per-invocation residue is tiny: one binding naming one env var (3 lines x 3 invocations) plus `interactiveMode.kind/trustStore`, which already is a per-agent-kind declaration consumed by herdr-round (`trustStorePaths` switches on kind).
4. The history in §13.1 shows the actual failure was not a wrong abstraction but a forgotten one: cfd670c43 applied posture to all herdr invocations with no binding, so codex/pi/agy died at start. Cause = no check that a confined herdr invocation has a binding, not where the data lived.
5. Config invocations carry a dead-ish `env` entry (e.g. `CODEX_HOME=${HOME}/.codex-fgovn`) that the binding overrides — minor noise, a place where an adapter would help only by deleting it.

## Options

A. Stay per-invocation config (+ a guard).
B. Provider adapter declaring each agent's home layout (env var, state dirs, credential files, trust store).

## Recommendation: A, with a doctor guard

Keep it per-invocation. Add (as follow-up, not done here) a `fgos doctor` check in src/setup/checks.mjs registry: every `herdr-spawn` invocation with `confinement.backend` and an `interactiveMode.kind` other than claude must carry a `private-home` binding — this closes the exact hole that caused the 10-01 breakage. The existing `confined-pane-accounts` check already covers login state; this covers config completeness.

Why A wins now:
- Credential files are already adapter-like data (the inventory); B would duplicate it or relocate it, two sources of truth for one fact.
- Only 3 consumers and 1 varying fact (env var name). B is a new abstraction + spec/registry entry (AGENTS.md install/doctor gate; new module needs spec first) for ~9 lines of config. Violates YAGNI/KISS.
- B pulls provider knowledge toward the driver, which §6.5/R4 forbids; or needs a new layer between invocation and driver, more surface for the confinement claim.
- Home env var is a property of the agent binary, so it is legitimately "provider knowledge", but it changes with account/layout rarely; copy-paste cost is low and visible in config.

Trade-offs accepted with A:
- Repetition across invocations; new agent = remember to add binding (mitigated by the doctor guard).
- Home layout knowledge is implicit (env var chosen by whoever writes the invocation; trust store kind and binding env var can disagree with no check).
- Does not give one place to answer "what does agy keep in its home".

When to switch to B (revisit triggers): a 4th+ agent family or a second consumer needing the layout (e.g. doctor/trust-store/inventory all re-deriving env var from `kind`); layout facts beyond one env var (multiple state dirs, per-agent file lists in invocations); or a bug traced to binding/kind disagreement. If so, the cheapest B is a small table keyed by `interactiveMode.kind` (env var + default credential files) read by config validation to *expand* the binding — not a new adapter runtime.

## Unresolved
- Whether `confined-pane-accounts` already asserts binding presence (not verified; only grepped for its existence — grep found no match under src with that include pattern, so its location was not confirmed).
- Dead `env` entries overridden by bindings left untouched; cleanup optional.
