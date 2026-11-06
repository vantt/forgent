---
phase: 04
title: "Config: a project layer may only tighten a capability's confinement (refused by name otherwise); executor command and args become global-only once UQ-1 is answered"
status: pending
depends_on: [02]
parallel: "wave 2, with 03, 05, 07 (Rust config crate and the runner schema only)"
effort: ~1d (tighten half) + ~0.5d (command half, after UQ-1)
net_size: "Node 0 / Rust +44 / tests +40 (estimate); schema YAML not counted"
---

# Phase 04 — Config tighten rule (Q2b)

## Context

Decision 61 Q2b; red-team R-3 (reproduced at the config layer: a committed `.fgos/config.yaml` set `code:review` to `unconfined` and claude's command to `/bin/sh`, and `loadRunnerConfigForDir` returned both); backlog `p-8da4b370` (digest approval) stays later. Needs CFG review (lane closed, reviewer named by the big lead on the board, RT-P14). A change to the config schema activates on every machine at once (plan.md Landing).

Code read on `4b116c27e`:
- `core/config-schema/runner.schema.yaml:7-25` (`executor`, scope `both`, sensitivity `command`), `:149-155` (`confinement.strict`), `:156-165` (`confinementPolicies`, `both`), `:421-440` (`capabilityConfinement`: `both`, `x-fgos-merge: replace`, `mode` enum `[required, preferred, unconfined]` `:430`), `:511-512` (capability `confinement` → `$ref capabilityConfinement`), `:689-695` (`executorEntry`, `both`).
- `packages/config/rust/src/scope.rs:33-45` (`global_only_below`), `:47-91` (`judge`: project key under `global-only` → `config-key-out-of-scope`; a list or replaced map above one also refused); `snapshot.rs:348-378` (layers project > global > accounts > detected > standard; `rules` maps `x-fgos-merge` to `MergeRule`); `schema.rs:177-180` (`scope`, `merge` resolved per node); `packages/config/contracts/annotations.v1.json:8` (`x-fgos-merge` values `deep|replace|leaf`), `config-schema.meta.v1.json:134,164`.
- Tests: `packages/config/rust/tests/golden_scope.rs` (scope refusals), `golden_snapshot.rs` (merge).
- Plan fact 2: this repo's `.fgos/config.yaml:18-25,159,181` commit executor commands.

## Requirements

**Half A, tighten-only confinement (lands without waiting):**
- One new merge value `tighten` (annotation list and meta schema updated, CFG review) on `capabilityConfinement` and on `confinement.strict`. Meaning: a project-layer value may equal or exceed the merged value of the layers below it; it never lowers it. Order: `mode` by its enum read weakest-last (`required` > `preferred` > `unconfined`, so the schema enum stays as written and the rule reads it in that order); `strict` `true` > `false`; with the same `mode`, a different `policy` name counts as lowering unless the lower layer names none. A lowering is refused by name (`config-confinement-lowered`, path, the file and line of the project value, never a value), like every other scope refusal; never silently ignored.
- `confinementPolicies` becomes `global-only`: a project could otherwise define a weak policy and require it (`:156-165`; "may only tighten" means it may pick a stricter existing policy, not define one). Before landing, a read-only census (`fgos config check` and `rg -n confinementPolicies` on every workspace's project file, both machines) shows no project defines one; if one does, stop and ask (it would be refused at activation).
- The P01 red case "a project file cannot lower a capability's confinement" goes green; add the equal and the raise cases (accepted) to the same file.

**Half B, command and args global-only (after UQ-1):**
- `x-fgos-scope: global-only` on `executor.command`, `executor.args`, and the invocation `command`/`args` of `executorEntry` (scope moves from the entry to the leaves; `kind`, `for`, `description`, tier facts keep `both` where they are not commands). `golden_scope.rs` gains: project `command` refused, project `invocations` list refused, global accepted.
- What happens to projects that already commit commands is UQ-1's answer; under (a) the guide's census lists every key per workspace and the owner moves them before the window; under (b) or (c) the extra rule is part of this half.

**Half B scope widened by the CFG review (2026-11-06 12:0x, inside decision 61 Q2b "a project may only tighten confinement"):** besides executor `command`/`args`, a project file can still lower confinement through `runner.executors.<id>.invocations[].confinement.backend|privateHome|isolatedSession`, `permissionMode: bypass`, a capability's `prefer` pointing at a non-bwrap invocation, and a capability's `aliases` rebinding to a project-defined unconfined capability (`src/runner/dispatch/resolve.mjs:36-44`: own keys win, aliases do not). Half B covers these with the same census-first move (decision 64). Until half B lands, the board says "a project can no longer lower a capability's confinement or `strict`", not "cannot lower confinement".

## Files

**Create:** none.

**Modify:**
- `packages/config/rust/src/snapshot.rs` (`:372-378` `MergeRule` mapping; the tighten comparison where layers merge)
- `packages/config/rust/src/scope.rs` (only if the refusal is raised there; one place)
- `packages/config/rust/src/schema.rs` (only if `merge` needs the enum order)
- `packages/config/contracts/annotations.v1.json:8`, `config-schema.meta.v1.json:134,164`
- `core/config-schema/runner.schema.yaml` (`:149-165`, `:421-440`; half B `:7-25`, `:689-695` and the invocation leaves)
- Tests: `packages/config/rust/tests/golden_scope.rs`, `golden_snapshot.rs`, `golden_schema.rs`/`golden_meta.rs` if they enumerate annotation values
- `docs/platform/config/spec.md` (merge values and scope list), `CHANGELOG.md`

**Delete:** none.

**Tests to retire:** none expected. If a Node test (`test/runner/config-seat-binding-layers.test.mjs`, `test/runner/dispatch-confinement-policies.test.mjs`) asserts a project may set `unconfined` over a stricter global or define a policy, it asserted the hole; it is rewritten to the refusal and the commit names the Rust owner (`golden_scope.rs`).

## Net size

Rust: tighten rule about +40, scope leaves +4 → +44. Tests (Rust): about +40.

## Steps

1. P01 red case; confirm red.
2. Annotation and meta schema; the tighten rule in the merge; refusal code.
3. Runner schema: `tighten` on the two nodes, `confinementPolicies` global-only; census on every workspace (read-only) before land.
4. Half B when UQ-1 is answered: leaves global-only, cases, guide census.
5. Spec lines; CHANGELOG; CFG review recorded on the board.

## Validation (focused)

- `cargo test -p fgos-config` (whole crate: scope, snapshot, schema, meta goldens).
- `cargo clippy -p fgos-config -D warnings`; msvc and darwin `cargo check -p fgos-config`.
- FR `test/runner/config-seat-binding-layers.test.mjs test/runner/dispatch-confinement-policies.test.mjs test/runner/dispatch-config-patterns.test.mjs` (the Node door over the crate).
- `fgos config check` on this checkout with the built host: no new refusal from half A.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A project on some machine relies on `unconfined` over a stricter global, or defines a policy, and stops at activation | M × H | Read-only census on all workspaces before the window; a hit stops the land and becomes a question. |
| Policy names have no strictness order, so "a different policy" is refused even when stricter | M × L | Accepted: the project may raise `mode` or add `strict`; a policy change goes to the global file. Stated in the refusal message. |
| Half B refuses committed project configs (UQ-1) | H × H | Half B waits for UQ-1; half A carries no command change. |
| CFG reviewer vacant | M × M | Big lead names a reviewer on the board before land. |

## Rollback

Revert the merge; re-activate the previous release on both machines in the same window (schema). Files the new release accepted are accepted by the old one (it is less strict).

## Done when

Half A: P01 case green, census clean, CFG review recorded, landed on both machines in one announced window. Half B: UQ-1 answered and done, or parked on the board with UQ-1 named.

## Lead brief essentials

One merge value, one refusal code, no silent ignore. Do not edit any real config file; census only. Half B waits for UQ-1. All plan.md lead rules apply.
