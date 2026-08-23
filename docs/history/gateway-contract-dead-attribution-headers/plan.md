# Plan — dead attribution headers (tsk-5m1)

Mode: **tiny** (0 Mode-gate flags — no auth/authorization/data-model/
audit-security/external-system/cross-platform/multi-domain concern; a
docs-only contract edit, no existing test covers these dead parameters
since nothing in the Rust code ever reads them).

## Approach

**Chosen path:** delete the `WriterId`/`WriterRole` parameter components
and every `$ref` to them from `docs/contracts/fgos-gateway-api-v1.yaml`, so
the contract stops promising headers the gateway silently ignores.

**Why deletion, not implementation** (`RESEARCH.md` round 1): the
contract's own "writer.id" is the SAME identity `src/runner/session-
identity.mjs`'s `resolveWriterIdentity` derives for STR65's main-checkout
lock — deliberately never caller-suppliable (a caller-supplied identity
would let two distinct concurrent writers collide onto one string,
reopening the exact collision STR65's lock exists to close). Implementing
the headers "end-to-end" would mean accepting an HTTP header as an
override of that same collision-avoidance identity — a real trust-model
change disproportionate to a medium-low attribution-nicety finding.
Deletion is the reversible option (D5): a future item can design real
writer attribution properly, from scratch, once someone actually needs it,
without this fix having pre-committed to the wrong shape.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Contract structural validity after removing 2 components + ~14 `$ref`s | low — mechanical deletion, no other content changes | the item's own verify: parses the yaml, asserts `openapi`/`paths`/`info` are still present |
| Nothing in Rust code reads these headers today | none (already confirmed) | `RESEARCH.md` round 1: `rg` across `herdr-plugin/src/*.rs` found zero reads of either header before this fix; `cargo test --manifest-path herdr-plugin/Cargo.toml` stays green as a sanity check even though this item touches no Rust file |

**Impact-analysis posture: inactive for this item** — a YAML-only doc
change carries no code blast radius for GitNexus (or any impact-analysis
tool) to measure; not queried.

## Files touched

- `docs/contracts/fgos-gateway-api-v1.yaml` — only file. No split.

## Split decision

**No split.** One honest piece: delete two dead parameter components and
their references. `fgos graph --json`'s `criticalPath`/`topUnblock` do not
include `tsk-5m1` or any gateway-audit sibling; ordering follows the audit
report's severity ranking (Finding 6, medium-low, sixth in the queue).

## Outstanding questions

None
