# Panelist 2 recommendation

## Recommendation

Keep the confined herdr-pane recipe as **per-invocation configuration**. Do not move agent home-layout and credential-file declarations into a provider adapter now.

The provider account inventory already correctly owns the machine-global, account-specific credential source: `runner.providers.<provider>.accounts.<id>.credentialSource`. The invocation is the only layer that knows how the launched executable consumes its private state directory, so it should keep the `private-home` resource binding to its specific target environment variable. The three current `herdr-spawn` cases demonstrate this directly:

- `codex-herdr-fgovn` binds `private-home` to `CODEX_HOME`.
- `agy-herdr-mucdong` binds it to `HOME`.
- `pi-herdr-vantt` binds it to `PI_CODING_AGENT_DIR`.

## Evidence and reasoning

Section 13.1 of `docs/specs/confinement-authority.md` explicitly defines this split: the invocation carries `resourceBindings` for the private home; the global provider account inventory supplies a `codex-home` or explicit `home-files` credential source; bwrap copies only those selected files into the temporary private home and never mounts the real account home.

`src/runner/dispatch/confinement/drivers/bwrap.mjs` reinforces the boundary. `prepareBwrap` allocates and mounts only resolved resources, then applies generic invocation resource bindings to an environment variable or argument token. Its stated rule is no branching by executor, provider model, or agent type for confinement guarantees. Credential provisioning reads the already selected `request.providerCapacity.credentialSource` and supports generic `home-files`; although the helper retains the historical name `provisionSelectedCodexCredential`, its behavior is not Codex-only.

Repository history explains why retaining this explicit seam is safer. The documented prior art says the 2026-10-01 posture rollout applied bwrap to all herdr invocations without the bindings, causing codex/pi/agy to fail because their state directory became read-only. Commit `6e8d0304e` subsequently carried the leased provider account through `herdr-spawn` and provisioned its selected credential files into the private home. Making an adapter infer each agent layout would recreate an implicit coupling at precisely the point that previously went missing.

## Trade-offs

Keeping it per invocation costs three small, repetitive `resourceBindings` declarations and requires a new invocation to name its actual state-home target. In return it keeps account identity/credentials separate from executable layout, permits two invocations for the same provider to use different layouts, makes the security-critical remapping visible in review, and leaves bwrap provider-agnostic.

An adapter-level layout table would reduce repetition and might become worthwhile if a fourth distinct agent or a second independent consumer needs exactly the same kind-keyed mappings. It should then be an explicit, validated kind-keyed table consumed to produce the same invocation-level binding—not inferred driver behavior—and it must preserve an invocation override/exception path.

## Guardrail

Add or retain a doctor/config-validation guard: every confined `herdr-spawn` invocation for a non-Claude agent must declare exactly one `private-home` resource binding to a valid env target. The check should diagnose a missing binding before launch; it should not silently choose an adapter default. This directly prevents the known posture-without-private-home regression.
