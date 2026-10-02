# Report 1 — confined herdr pane recipe: per-invocation config vs provider adapter

Mutation: read-only. Read: confinement-authority.md §13.1, the three herdr invocations in `.fgos/config.json`, `drivers/bwrap.mjs` (lines 20-96, 380-430), `provider-adapter.mjs`, `herdr-round.mjs` `trustStorePaths`, the doctor check `confined-pane-accounts` (`src/setup/registrations.mjs` ~4130), runner.md RUL65b line. Credential values not read or quoted.

## Facts established

1. **Recipe is already split in three, and only one piece is per-invocation.**
   - Per invocation (`.fgos/config.json`): `resourceBindings: [private-home -> env <NAME>]`, plus `env.<NAME>`. codex-herdr-fgovn uses `CODEX_HOME`, agy-herdr-mucdong uses `HOME`, pi-herdr-vantt uses `PI_CODING_AGENT_DIR`. That is 4 lines of config each, all the same shape.
   - Machine-global (`~/.fgos/config.json` `runner.providers.<p>.accounts.<id>.credentialSource`): the per-agent layout knowledge already lives here as data. Kind `codex-home` copies `auth.json`; kind `home-files` carries an explicit file list (xai: auth.json, models-store.json, settings.json, trust.json, bin/fd; gemini: three `.gemini/antigravity-cli/*` files and more). So "which credential files each agent needs" is NOT in invocation config today. It is in the account inventory.
   - Driver code (`bwrap.mjs`): `provisionSelectedCodexCredential` is generic over `credentialSource.kind`. It has no provider branching, and `copyHomeFiles` is fail-closed (relative paths only, no `..`, realpath containment, regular files only, 0600/0700). Despite the "Codex" name it already serves pi and agy.
2. **Trust seeding is the one piece with real per-agent code**: `trustStorePaths` in `herdr-round.mjs` branches on `trustStore.kind` (codex-toml, agy, default claude json). pi declares no trustStore (its `trust.json` ships via home-files).
3. **A provider adapter exists but is the wrong shape for this.** `provider-adapter.mjs` is documented as a pure rendering layer (no fs, no spawn), run in shadow mode only, covering policy-shaped flags/effort/tool gating. Production dispatch does not use it. Putting home layout there would either break its purity invariant or require a second, impure adapter concept.
4. **bwrap spec constraint (§6.5, driver comment)**: the driver must never branch on executor id, provider, or agent type; the single documented exception is credential provisioning into a private home. An adapter declaring "home layout and credential files" would move provider knowledge toward the confinement driver, which is the thing the spec is guarding against.
5. **Failure history (§13.1)**: the recipe was forgotten because it was undocumented and ids were renamed (H8 `credential-provisioning-unsupported` exception, `cfd670c43` posture without binding killed codex/pi/agy at start). Discoverability was the failure, not per-invocation config as such.
6. Safety net exists: doctor `confined-pane-accounts` flags a herdr invocation that binds a private home but has no accounts or missing files.

## Options

**A. Keep per-invocation config (status quo, documented).**
- Pros: zero new code; matches existing pattern (`codex-cli-bwrap`); driver stays provider-blind; the layout data is already in the inventory so there is little duplication; YAGNI/KISS; doctor already guards it; §13.1 plus AGENTS.md prior-art step already fixes the discoverability gap.
- Cons: each new confined herdr invocation repeats 3 facts that are really properties of the agent: which env var names the home, that it needs a private-home binding, and the trustStore kind. A forgotten binding fails at runtime (pane dies or starts logged out), though doctor now catches the missing-account half, not the missing-binding half. Adding a fourth agent is hand-copying.

**B. Provider adapter declaring home layout and credential files.**
- Pros: single place per agent; new invocations shrink to "adapter: herdr-spawn, confinement: bwrap"; could make the binding implicit and eliminate the forgotten-binding failure class.
- Cons: the credential file list is per-account (the xai/gemini lists differ by account setup and live in the machine-global inventory by RUL65b design), so moving it into code would either duplicate or override the inventory, and code-declared lists can drift from what the installed agent version really writes. It conflicts with the pure-adapter invariant, pushes provider knowledge toward the driver (§6.5), and adds a layer for three agents. Single-user repo, no second consumer yet. Large blast radius for a recipe that works.

**C (middle path, my recommendation): keep A, move only the genuinely static agent fact into a small declarative table.**
- The only per-agent fact that is not account data is "which env var names the private home" (CODEX_HOME / HOME / PI_CODING_AGENT_DIR) plus trustStore kind. Do not build an adapter now. Instead extend the existing doctor check to also fail when a confinement-posture herdr invocation of a known agent kind lacks the matching private-home binding. That closes the one remaining failure class (forgotten binding) with ~10 lines in an existing registry, no runtime layering.

## Recommendation

**Option A, plus the doctor extension from C.** Reasons, each verified in source: the credential files are already data in the machine-global inventory, not per-invocation config, so the "adapter declares credential files" premise mostly dissolves; the driver is already provider-blind and generic; the existing adapter is pure/shadow and structurally unsuitable; the failure that motivated this was lost knowledge, now recorded in §13.1. Revisit and move to B only if a fourth confined-pane agent family is added, or if two invocations of the same agent diverge in home layout, since then the repeated facts have a real second consumer.

## Trade-offs accepted
- Hand-written binding per invocation remains; mitigated by doctor, not eliminated.
- No single declarative source for agent home layout; the layout facts stay split between invocation env, inventory file list, and `trustStorePaths`.

## Unresolved questions
- Does the doctor check already cover the missing-binding case (invocation under posture but no private-home binding)? I only read the branch that skips invocations without a binding, so it does not appear to. Not run or tested.
- Is `provider-adapter.mjs` still intended to leave shadow mode? If so, B's cost estimate changes.
