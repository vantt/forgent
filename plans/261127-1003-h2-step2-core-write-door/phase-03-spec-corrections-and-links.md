---
phase: 3
title: "Specs after the context engine, and links to the build order"
status: draft
dependencies: []
---

# Phase 3: specs after the context engine, and links to the build order

## Inputs

- `plan.md` facts F9, F10, F11 and decisions D4, D6.
- `docs/platform/documentation/spec.md` (sections 2, 4, 5, 6.1, 8, 10).
- `docs/platform/documentation/subcomponents/write-door/spec.md` section 11.
- `docs/platform/documentation/subcomponents/document-identity/spec.md` sections 8.1 step 6 and 8.3.
- `docs/platform/agent-context-engine/spec.md` sections 1 and 2.
- `docs/platform/proposals/documentation-system-unification.md` section 0 table and 9.2.
- `plans/260925-documentation-authority-unification/plan.md` section 12.1.
- `docs/reading-map.md`; `docs/platform/intent-preservation-ledger.md` row PF-I006.
- `docs/platform/governance.md` section 5 (the required header) and the decision-history rule.

## Footprint

`docs/platform/documentation/spec.md`, `docs/platform/documentation/subcomponents/write-door/spec.md`,
`docs/platform/documentation/subcomponents/document-identity/spec.md`,
`docs/platform/proposals/documentation-system-unification.md`, `docs/platform/intent-preservation-ledger.md`,
`docs/reading-map.md`, `plans/260925-documentation-authority-unification/plan.md`.

Do not touch the implementation-alignment rows (documentation spec header "Implementation", write-door 12,
document identity 14). Phase 5 writes them once the code has merged.

## Steps

1. Documentation spec:
   - Section 2: the H3 row says the Agent Context Engine is built and links its spec. It reads documentation outputs
     and never defines their truth.
   - Section 4: add a column `Plan / status` to the build order. Step 1 links to
     `plans/261122-2217-docos-pkm-locate-door/plan.md` (done). Step 2 links to this plan. Steps 3–7 say "no plan yet".
     This is the one place where H2's progress is read.
   - Section 5: row A3 is met by the Agent Context Engine and Agent Start Context, outside this area.
   - Section 6.1 item 1: rewrite per D6.
   - Section 8: the "Agent Context Engine" row becomes "done elsewhere", with a link. Add a row for the shared pkm pin:
     a pin raise moves documentation and the context engine together.
   - Section 10: add a 2026-11-27 entry for D1, D3, D5 and D6, with this plan as the source.
2. Write-door spec section 11 item 1: amend per D5 (a context-engine rule unit, compiled into the effective set, with
   no instruction registry and no `fgos setup`). Record it as a new section 15 entry. Do not edit the signed
   wording in place beyond that pointer.
3. Document identity 8.1 step 6: the writer's decision is recorded on `doc.attest` and `capture.handoff` (D2).
   8.3: the refusal at the creation verbs comes with admission's door checks (D4).
4. Proposal: the section 0 table's H2 row and section 9.2 link to documentation spec section 4. Write "the build
   order and the status of each step live there" in one sentence. Do not copy the steps.
5. H1 plan section 12.1: one line linking to documentation spec section 4.
6. `docs/reading-map.md`: add the documentation area spec (H2 map and build order) next to the other area specs.
7. Ledger PF-I006: its source pointer names documentation spec section 4 next to the existing ones.
8. Pin (fact F13): where the documentation spec or document identity states the *current* pkm pin, it says `v0.7.1`
   and names the context engine as the second consumer. Add one decision-history entry in document identity section
   17 for the raise in `acb2a6efa`. Leave historical entries that recorded `v0.7.0` at their date unchanged.

## Verify

```bash
rg -n "future area|instruction registry renders" docs/platform/documentation   # no output
node scripts/doc-health.mjs
```

Pass: no output from `rg`; doc-health green on `docs/platform/**`, including the dead-reference rule.

## Rollback

Revert the phase commit. It changes text only.
