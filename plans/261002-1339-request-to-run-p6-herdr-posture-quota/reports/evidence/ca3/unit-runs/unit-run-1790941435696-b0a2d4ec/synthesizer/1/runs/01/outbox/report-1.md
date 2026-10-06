# Report for Brief 1 - Synthesizer Round 1

## Work Performed
- Acknowledged receipt by writing ack-1.json (via tmp+rename) at 2026-10-02T11:46:33.023Z as required.
- Read docs/specs/confinement-authority.md section 13.1 ("Pane herdr bị confine cho agent không phải claude").
- Inspected the three herdr invocations in .fgos/config.json: codex-herdr-fgovn, agy-herdr-mucdong, pi-herdr-vantt (all use herdr-spawn adapter, confinement.backend=bwrap, resourceBindings for private-home targeting CODEX_HOME/HOME/PI_CODING_AGENT_DIR, plus env overrides pointing to per-account credential homes under ~/.codex-fgovn, ~/.agy-homes/mucdong, ~/.pi/accounts/...).
- Read src/runner/dispatch/confinement/drivers/bwrap.mjs (v1 driver): agent-agnostic implementation using resolveConfinementResources + provisionSelectedCodexCredential (or home-files copy); credential layout and home env vars come from invocation + providerCapacity.credentialSource (machine-global inventory in ~/.fgos/config.json under runner.providers), never hardcoded per-agent inside driver.
- Cross-referenced with framing output from earlier step (architecture-advisory context).

## Analysis and Recommendation
The confined-pane recipe (private home per invocation + machine-global provider account inventory for credentials) should **stay as per-invocation config**.

**Rationale (system view):** The bwrap driver already treats all agents uniformly via the shared credentialSource mechanism (kind: codex-home or home-files). The per-invocation resourceBindings and env simply declare *which* home layout variable to bind for that specific invocation (codex vs agy vs pi differ only in their env var name and account dir structure). Moving the declaration into a "provider adapter" would either (a) duplicate the same data or (b) force agent-specific knowledge into the adapter layer, violating the current clean separation.

**Alternative considered:** Centralize home-layout declarations inside each provider's adapter definition (e.g., a table keyed by agent kind inside openai/gemini executor config). This would reduce repetition across the 3+ herdr invocations but would make the adapter responsible for knowing every possible consumer's private-home convention, increasing coupling and making onboarding of a 4th agent (or second consumer of the same provider) require adapter changes instead of just new invocation entries.

**Constraint-focused trade-offs:**
- Per-invocation (chosen): + driver stays small and fail-closed agnostic; + each account can choose its own credential home layout independently; + easy to add new agent kinds without touching driver/adapter; - small duplication of the private-home binding pattern across invocations. Mitigation: add `fgos doctor` guard (as framing suggests) that enforces presence of private-home binding on any confined non-claude herdr invocation.
- Move to provider adapter: + single source of truth per provider; - risks "agent creep" inside adapters; - breaks the "credential layout lives in provider account inventory" invariant documented in §13.1; - higher change cost when new agent appears.

**Decision:** Keep per-invocation config + doctor guard requiring private-home binding on confined non-claude herdr panes. Revisit only if a 4th distinct agent or second consumer of the same provider materializes (then consider a kind-keyed table under runner.providers.*.confinementLayouts).

No files were modified outside the required outbox artifacts. All work was read-only as contracted.

## Evidence
- confinement-authority.md:1291-1340 (section 13.1)
- .fgos/config.json (herdr invocations and resourceBindings)
- src/runner/dispatch/confinement/drivers/bwrap.mjs (provisioning logic, no per-agent branches)
