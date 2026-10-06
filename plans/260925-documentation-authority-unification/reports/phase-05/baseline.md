# Phase 5 baseline and pins (2026-10-06)

Measured before any pilot step. Branch `plan/260925-documentation-authority-unification` HEAD `1f17938c17cc6f6baf05e5f7bd9dfeed64cfac47`; main HEAD `60b5dd37138bfd7bc47fe6d272917dcc6e39ca73`. In-scope tree of the branch equals the committed inventory (`registry ... bound to HEAD; no carry-forward needed`). Dispatch answer for `fgos dispatch decide --for review --needs-soul --has-live-task-access`: `in-process` (reason `native-first.rule-2.live-task-access`), so doers are in-process Sonnet subagents.

Main drift check: `git diff --stat HEAD main` over the nine pilot source paths and the host-invocation and packaging-distribution target trees is empty, so no re-pin or ratchet exception is needed.

## 1. Pinned sources (sourceDigest is the sha256 of the file bytes)

| Source | Claim rows | Headings | Consumer edges | sourceDigest |
|---|---:|---:|---:|---|
| `docs/architect/host-invocation-routing/documentation-standardization-plan.md` | 75 | 24 | 28 | `06e5994c1f64d470f78627a3748b4daba5d123b3868f1eb28fd42a6ebc264f3a` |
| `docs/architect/host-invocation-routing/external-provider-protocol.md` | 48 | 10 | 54 | `eb969b8dbb4520b4794887ee98da6c0aa6ab8b799d30647720cfe2ab0b0a260d` |
| `docs/architect/host-invocation-routing/host-invocation-provider-routing.md` | 67 | 14 | 80 | `ffa08f6390701e71020110249c3ef7d2888831cee01cfedae28fe4f77ee98cb6` |
| `docs/architect/host-invocation-routing/legacy-cli-transition.md` | 38 | 8 | 61 | `90e6dcd22a5729f513b3104b5f2113d9fad57e677a8485b6b2452183b8f97a67` |
| `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` | 90 | 26 | 59 | `17103ea9eeaf6ca68869a37e44dca6cb8cc128ae315ef914bde71950f05d20b7` |
| `docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md` | 113 | 47 | 51 | `6ec5a5afad77acdf0dacf5523ae8a5b452e2ff5bd92015830c7526ebcee3e41a` |
| `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | 169 | 21 | 61 | `a35f8902db9fe0de4f770a8a4f236bf5d2b0867503fd69e90da5914e4f52b6d6` |
| `docs/io-contract.md` | 41 | 11 | 146 | `8b6e6a724c90926c6502ab69a96f2cfd23632c39c1293f007def4bca16d1bf38` |
| `docs/specs/work-state.md` | 325 | 117 | 590 | `745c1786a6fccf856592af56429ac0a6c2fed4b4651f2ebeeaf039f337e340ab` |

Pilot A targets: 33 files under `docs/platform/host-invocation-routing/`, 490 claim rows, 191 headings. Inventory: 4,311 files, 86,086 claim rows (scratch, regenerated in about 23 s).

## 2. Gate state at baseline

- `node scripts/check-doc-inventory-gates.mjs --inventory <scratch> --identity-registry <scratch>`: exit 0. Open data: 1,383 files and 39,584 rows unknown-blocking, 86,086 rows not reviewed, 83,751 without own rationale, 20 registry gaps without disposition, 1 dropped claim unreviewed; 1,054 gap/blocker, 818 duplicate groups, 151 semantic-conflict groups, 147 registry identity-gap rows.
- `node scripts/check-legacy-docs-ratchet.mjs`: exit 0 (995 legacy files, 24 accounted edits, 1 accounted new file).
- The strict run stays red by design; its baseline open set is the figures above.
