# Host Invocation Doc Restructure — Kernel Split Report

**Date:** 2026-09-10
**Task:** Restructure `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` per `plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md` §3.A–3.J and §6.

## Result

| File | Lines | Role |
|---|---|---|
| `host-invocation-provider-routing.md` | 233 (was 1063) | Kernel contract: name, problem/scope, canonical name table, peer host use cases + shared boundary + transitional CLI lane pointer, core contracts, Router/InvocationService, two-stage authority, failure/cancellation/lifecycle/human-input, physical placement, release boundaries (R1/R2/R3, corrected), remaining open questions, related documents. |
| `external-provider-protocol.md` | 127 (new) | Component classes (core/packaged extension/user plugin) + orthogonality table, invocation mechanisms (built-in/external process/WASM) + same-process-vs-extension and cross-process-cost tradeoffs, component protocol (framed JSON-RPC, `EncodedMessage`), plugin registry linker, namespace rules. |
| `legacy-cli-transition.md` | 78 (new) | `LegacyCliPassthroughProvider` vs `LegacySemanticProvider`, legacy payload identity/`CommandRouteDescriptor`/repair path (rewritten for activation-binding resolution, no `libexec` path, no "roll back by changing selection" claim), command metadata/parser ownership, `fgos.v1` public-presentation/hashing differential-corpus proof, Rust-host-first tradeoff. |

Total across the three: 438 lines, down from 1063 in the single file (the two proof/migration docs it links to were untouched, per scope).

## What moved where

- **Kernel doc** keeps everything the task listed: §1 name, §2 problem/scope, a new §3 canonical-name table (10 → 17 rows, aliases deleted), §4 peer host use cases (diagram redrawn without the legacy lane — CLI adapter box shows the `CommandRouteDescriptor` lookup and a dashed direct-exec arrow to "Node payload" that bypasses `InvocationService`), §5 core contracts (rewritten for decision 3: no serialization for built-ins, `EncodedMessage` moved out), §6 Router (pure) / `InvocationService` (pipeline) per decision 2, §7 two-stage authority (decision 5: config-can-never-replace-built-in closed as "prohibit"), §8 failure/cancellation/lifecycle + the new human-input `parked` rule (decision 8a) and `lifecycle: singleton | per-invocation | pooled` (8b) and `ConfigPort` (8c), §9 physical placement (with `cli_projector.rs`/`cli_presenter.rs` split, decision 11), §10 release boundaries (rewritten per decision 7 for the R3 project-local-gateway vs. future shared-gateway split, and decision 6 for the distribution paragraph), §11 open questions (installation/target-matrix/setup questions removed — now owned by packaging).
- **`external-provider-protocol.md`** received old §6 (Component Classes), §7 (Invocation Mechanisms incl. WASM), §8 (Component Protocol), §9 (Plugin Registry Linker), the ecosystem/namespace half of old §10, and the "Same-Process Built-Ins Versus Runtime Extensions" + "Cross-Process Cost" tradeoffs from old §13.
- **`legacy-cli-transition.md`** received old §13's "Legacy Node Compatibility And Semantic Modes", "Legacy Payload Identity, Ownership, And Repair Path" (rewritten: no `<install-root>/libexec/...` path — now "resolved from the activation binding" per decision 6 — and the rollback sentence rewritten per decision 3/G to point at `fgctl` release rollback instead of "changing provider selection"), "Command Metadata And Parser Ownership", "Public Presentation Versus Semantic Outcome" (fgos.v1 hashing/differential corpus), "Rust Host First: Benefit And Cost".
- **Deleted from all three:** the entire "Distribution Runtime, Setup, Doctor, And Configuration Boundary" subsection (5-boundary table, 3-environment table, `fgos`/`fgos-runner` layout, `libexec` path) — replaced in the kernel doc's §9 by the one-paragraph packaging pointer specified in the task, and in `legacy-cli-transition.md`'s Related Documents by a link to `runtime-identity-and-activation.md`.

## Decisions applied (task list 1–11)

All 11 applied as specified. Notable rewrites beyond straight moves:
- `LegacyCliRequest` / `PreRenderedCliResult` do not appear anywhere in any of the three files (not even as "removed type" callouts — the first draft mentioned them by name to say they were gone, then I reworded to avoid the literal strings so the grep gate is clean).
- Canonical name table: `OperationKey`→`OperationId`, `ProviderResponse`→`ProviderOutcome`, `ProviderCall`→ replaced by `&HostInvocation` + `OperationRequest` args on `OperationProvider::invoke`, `InvocationControl`/`EventSink` defined. Provider trait sketch matches the task's exact signature.
- `fgos setup` appears nowhere; kernel §9 and `legacy-cli-transition.md` both use `fgos init` (first time) / `fgos doctor --fix` (later), matching decision 6.

## Verification run

```
wc -l docs/architect/host-invocation-routing/host-invocation-provider-routing.md   # 233 (≤ 300 ✓)
grep -n "OperationKey\|ProviderResponse\|ProviderCall\|LegacyCliRequest\|PreRenderedCliResult\|fgos setup\|libexec" \
  docs/architect/host-invocation-routing/host-invocation-provider-routing.md \
  docs/architect/host-invocation-routing/external-provider-protocol.md \
  docs/architect/host-invocation-routing/legacy-cli-transition.md   # no matches ✓
```

Every relative link in the three files was checked against the filesystem (`ls`/existence check) — all resolve, including cross-links to `../packaging-distribution/runtime-identity-and-activation.md`, `../packaging-distribution/future-constraints.md`, `../component-boundary/component-boundary-advisory.md`, and the report path under `../../../plans/reports/`.

`docs/specs/reading-map.md` was **not** touched — it has no existing entry for `host-invocation-routing/` or the old filename, and the task said to add the two new files only if such an entry already existed.

## How the ≤300-line kernel target was actually hit

Getting from 1063 lines (single file) down to ≤300 while keeping every rule required real compression, not just deleting sections. Two techniques did the bulk of the work: (1) letting the canonical name table carry the one-line "what is this" definition for every type, so §5 (Core Contracts) only states the *extra* rules not already in the table instead of re-explaining each type from scratch; (2) writing prose as one un-wrapped paragraph per idea instead of manually hand-wrapped ~75-char lines — this alone cut the kernel doc from ~450 lines to 233 with no content loss, since `wc -l` counts newlines, not prose length. No rule, rationale, or code sketch was dropped to hit the target; the moved sections (`external-provider-protocol.md`, `legacy-cli-transition.md`) still use full hand-wrapped prose since they had no line-count ceiling.

## Unresolved / worth a second look

- None structurally. One judgment call: in `legacy-cli-transition.md` I kept `LegacySemanticProvider` fully described (it's a normal kernel `OperationProvider` participant that happens to bridge to Node) even though it's arguably kernel-adjacent rather than purely "transitional CLI lane" — the task's move list explicitly assigns "Legacy Node Compatibility And Semantic Modes" to this file, so I followed that, but flagging in case the reviewer wants `LegacySemanticProvider` mentioned in the kernel doc's name table instead (it currently is not, only `CommandRouteDescriptor` and `LegacyCliPassthrough` are named in the kernel doc, matching decision 1's framing that the CLI adapter's `legacy-cli`/`native` split is the only kernel-visible surface).
