# Phase 3: Cage, the role's own work runs inside (Rust)

Capability: `code:implement`.

Builds the loosening half of PC-D7 in the Rust resolver: what is the role's own work runs inside its cage. Never opens
`.fgos`, `.git` or the release to a grant (`validate_workspace_paths`).

## Inputs

- `plans/261124-1853-confinement-to-rust/reports/cage-diagnosis.md` (phase 1: causes and their marks).
- `packages/execution/engine/src/confinement/policy/resolver.rs`, `policy/workspace_paths.rs`, `policy/roots.rs`.
- `packages/execution/engine/tests/confinement_policy.rs`.
- `docs/platform/agent-confinement/spec.md` (bindings section).

## Footprint

`packages/execution/engine/src/confinement/policy/` (whole directory),
`packages/execution/engine/tests/confinement_policy.rs`, `docs/platform/agent-confinement/spec.md`,
`plans/261124-1853-confinement-to-rust/reports/cage-loosen.md`.

## Steps

1. For each cause marked "role's own space", bind what it names inside the head's private space: a writable private
   cache or target directory per head (cargo target, npm cache, `TMPDIR`), never a path under `.fgos`, `.git` or the
   release.
2. For each cause marked "needs `.fgos`", change nothing; list it in the report as a window job for plan 0004's
   permission table.
3. Re-prove `friction record`, mail send from Miu and `questions answer` from Miu on a build of this tree; fix any that
   still fails by the same rule. Write the backlog ids each closes in the report; the supervisor closes the rows.
4. One proof per new binding in `tests/confinement_policy.rs`: it is writable, and it is not under `.fgos`, `.git` or
   the release.
5. Update the spec's bindings section for the new private caches.

## Verify

```bash
cargo test -p fgos-execution-engine --test confinement_policy
```

Pass: green, and the report holds the fix per cause and the window jobs left over.

## Rollback

`git revert` the phase's commits; the bindings return to today's set.
