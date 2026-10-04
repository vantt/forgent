# Synthesizer Report: Mechanical Dissent/Agreement Gate for `panel`

**Position:** No — do not add mechanical dissent/agreement gates (dissent quota, >70% agreement check, cross-examination, confidence tally) to the core `panel` pattern in `panel.mjs`. Provider-distinct panelists + `reviewed` red-team suffice for the atomic primitive; advanced council mechanics belong in Workflows.

**2-3 strongest reasons with evidence:**
1. **Pattern invariant: small, pure, stateless.** `docs/specs/runner.md:3026` settles "3 Pattern cộng tác (solo, reviewed, panel): Vòng lặp code nhỏ, thuần, không store mới". `panel.mjs:41-86` is ~46 lines of parallel dispatch + synthesize; adding re-prompt loops, tally state, or anonymized rounds would violate this (cf. `panel.mjs:44-87`).
2. **Existing diversity controls already address provider monoculture.** `panel.mjs:51` sets `independentOf` for each panelist; `panel.mjs:77-80` forces synthesizer on distinct provider family. This plus `reviewed.mjs:22-27` (red-team for high/critical + code caps) provides the adversarial check without fabricating objections.
3. **Deliberation topology is Workflow concern.** `research-fan-out-gated` preset exists but does not yet read `gated` (`presets.mjs:28-35`); complex flows (delphi.yaml, architecture-advisory.yaml) already compose `panel` + `reviewed` without mutating the primitive (`docs/specs/runner.md:1416-1422`).

**What would change my mind:** Production telemetry showing correlated groupthink on high-stakes units that red-team later misses, where a mechanical quota demonstrably surfaces splits without inflating latency/cost (D-ADR0030 Ship Faster).

**Concrete next step:** Register `council` workflow in `core/workflows/council.yaml` that composes `panel` + optional cross-exam unit + `reviewed` red-team, gated behind `research-fan-out-gated` preset, with fixture tests. Measure baseline agreement rates first.

**Evidence read:** panelist reports (all 3 converge on no), `panel.mjs`, `reviewed.mjs:1-60`, `presets.mjs:20-35`, `docs/specs/runner.md:1416-3038` (settled facts on patterns).
