# Host Invocation native selector follow-up

Status: ready for review; batch remains open.
Author session: codex-session:4@2026-10-13
Content commit: 744fecf087841e3600c44bb3d07a681a37203ef0
Applied independent reports: 0c06e6e6b67a3897d660ee54de25fdc9971e59a4

Review only 6 source rationale corrections, 5 successor bindings whose targets changed, and the 14 changed native units (seven headings and seven tables) across five files shown below. Both reports' 33 source and 35 successor ok notes were applied verbatim in ordinary mode before editing. Changed rows have no approval carry: 425 source approvals and 30 successor approvals retain exact notes and pins. All five text-rework groups now name the five native selectors or mappings. The spec addition is labelled Added in candidate. The six rationale corrections drop the over-listed remainder anchor or explicitly name the relocated body and restoration owner.

Use two ordinary five-column reports (Claim | Verdict | Note | Source digest | Target digest), with Reviewer and Review mode: ordinary. Source report Author session: codex-session:1@2026-10-11; successor report Author session: codex-session:3@2026-10-13. Full direct-heading sections and tables below are shown with full digests. Also give verdicts on changed text; no unchanged unit is submitted.

Machine accounting: accounting-261013-1816-host-invocation-native-followup.json. No fresh readers, batch closure, main merge, next batch, promotion or owner decision is requested. Literal restoration fences, accepted owner choices and the npm-bin owner question remain unchanged. Conservation evidence follows in verification-261013-1816-host-invocation-native-followup.json and progress.md.

## Source rows

| Claim | Source digest | Target digest |
|---|---|---|
| claim_d5dd5fbdb3483914743a14791a5f02a8 | 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe | e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 |
| claim_98683c6667ec64317c110eb4fe42da11 | 1084930371798278160dcbcbd00f50c98b2ae0bbb835aa54e2185cf414701532 | 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52 |
| claim_b74991659ee3db4cb630f607d065ce52 | 51b636bb97780e8be205e1fce45918f81b4e6e9b40b4a5bd008ce4a9d71cd965 | 7504e7fd27fa2de1f5b1e486ab3e7efff0e956e57f789c7363feeec37b581856 |
| claim_14f599ac6c6af84bcd15a503faaaea03 | 24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621 | 73142a367bf579e3afc2da330169ae1b04b7a9b758a33a9b8be857aca2e85373 |
| claim_aec6fb3d8eed3c772ec8bac9808009d3 | 1b4f6a70d3530daab76986749e1284dac18236ec9de6faada23ff972e155e334 | 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73 |
| claim_4862726f445bfdcba1b58996cf47dfd8 | a755bd8cd566ed1f0ada74dd6f1a63dc20a8648ba87e1b61510c9784dc216a01 | 2c60584c5c5e535249c603a1e98ede6c6497204f5e1880f44cf3a8fb0ad00a05 |

### claim_d5dd5fbdb3483914743a14791a5f02a8

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms

Source unit digest: 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe

Target unit digest: e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0

Shown source SHA256: b6f0ab966420df63fd317e0cfda12d54cd69755e781f4be6de8627c170b300b2

Shown target SHA256: 5bf6a77720d3dddf7539bf6cd0e531dcd2b0900345f104811b0d27b0ff1b716f

Previous rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Current rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Current remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t).

Retained Lead note verbatim: Named blocks 12, 14, 15, 16, 17 verified verbatim at release-boundaries restored-class-definitions and the retained enum-covers paragraph is in place; links resolve. Rationale also lists the same-process anchor as holding this unit remainder, which is over-listed (see concerns), no text lost.

Full shown source:

`````md
## 2. Invocation Mechanisms

```rust
enum Provider {
    BuiltIn(Arc<dyn OperationProvider>),
    ExternalProcess(ProcessRpcClient),
    ExternalWasm(WasmComponent),
}
```

This enum covers semantic providers and is an illustrative host-implementation detail, not the public ABI (the transitional `LegacyCliPassthrough` binding is CLI-only and lives outside this set — see [Legacy CLI Transition](./legacy-cli-transition.md)).

**Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization or cross-process cost; still obeys the owning port and authority boundary. Normal mechanism for core components, and may serve packaged extensions fgOS chooses to compile in.

**External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needing filesystem, Git, network, subprocess, or other OS capabilities. Crash/restart and resource isolation are part of the adapter contract.

**External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scoped extensions. Required host functions are explicit capabilities, not ambient access.

Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses the crash/memory isolation process or WASM boundaries give.
`````

Full shown target:

`````md
#### 2. Invocation Mechanisms


Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).


This enum covers semantic providers and is an illustrative host-implementation detail, not the public ABI (the transitional `LegacyCliPassthrough` binding is CLI-only and lives outside this set — see [Legacy CLI Transition](legacy-cli-transition.md)).






Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).



Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).




Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).
`````

### claim_98683c6667ec64317c110eb4fe42da11

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Source unit digest: 1084930371798278160dcbcbd00f50c98b2ae0bbb835aa54e2185cf414701532

Target unit digest: 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52

Shown source SHA256: bcf292ee51ddeaaf56aeae73786dc7778f196a912de09a8ac0aebd1b6faab822

Shown target SHA256: c26fb83382f85291223d66aac01159d5e3a25ddc98662ca8ac22bb2904d33881

Previous rationale: Move the complete direct heading unit "## 3. Command Metadata And Parser Ownership" from docs/architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current rationale: Move the complete direct heading unit "## 3. Command Metadata And Parser Ownership" from docs/architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership. The heading and remaining in-place text stay at this mapped owner; the relocated body is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by its sibling source decisions. The mapped owner links to that live restoration; this row does not claim that all source body wording remains in place. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current remainder: none

Retained Lead note verbatim: Move holds on conservation: heading kept, first paragraph is verbatim in component-protocol restoration (second fence of both-adapters anchor) and paragraphs 2 and 3 retained; link resolves. Generic move rationale says all wording retained although paragraph 1 relocated (see concerns).

Full shown source:

`````md
## 3. Command Metadata And Parser Ownership

The router needs operation identity and provider metadata but does not need to parse every host's full input grammar. Metadata separates into: host-visible identity, summary, namespace, and provider mapping; host-owned projection from CLI/REST/MCP input to an operation request; provider-owned semantic validation; transitional provider-owned CLI parsing for legacy-cli selectors.

While a CLI verb is legacy, the Rust CLI recognizes only a checked command selector and forwards every provider-owned `OsString` unchanged. The selector routes under a reserved, CLI-only compatibility contract; it does not mint an implementation-shaped `legacy.<verb>` semantic `OperationId`. When a command becomes native, its option grammar and typed request conversion move together and its projection points at the component-owned operation — this avoids two independent parsers accepting subtly different inputs.

A deterministic generated command descriptor may bridge the current Node registry into the Rust host during migration. Generated metadata is validated for drift; it is not a second manually edited source of truth.
`````

Full shown target:

`````md
#### 3. Command Metadata And Parser Ownership


Added in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).


While a CLI verb is legacy, the Rust CLI recognizes only a checked command selector and forwards every provider-owned `OsString` unchanged. The selector routes under a reserved, CLI-only compatibility contract; it does not mint an implementation-shaped `legacy.<verb>` semantic `OperationId`. When a command becomes native, its option grammar and typed request conversion move together and its projection points at the component-owned operation — this avoids two independent parsers accepting subtly different inputs.

A deterministic generated command descriptor may bridge the current Node registry into the Rust host during migration. Generated metadata is validated for drift; it is not a second manually edited source of truth.
`````

### claim_b74991659ee3db4cb630f607d065ce52

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost

Source unit digest: 51b636bb97780e8be205e1fce45918f81b4e6e9b40b4a5bd008ce4a9d71cd965

Target unit digest: 7504e7fd27fa2de1f5b1e486ab3e7efff0e956e57f789c7363feeec37b581856

Shown source SHA256: b920259d79b6e810e9d375d461a991662ec2a2f058673e47388d1a287dfbbd2f

Shown target SHA256: 54fc03c248c40df62301221aed559f98f3e2ceadbacdb6ceabec35177eb06177

Previous rationale: Move the complete direct heading unit "## 5. Rust Host First: Benefit And Cost" from docs/architect/host-invocation-routing/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current rationale: Move the complete direct heading unit "## 5. Rust Host First: Benefit And Cost" from docs/architect/host-invocation-routing/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost. The heading and remaining in-place text stay at this mapped owner; the relocated body is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rust-host-first-cost and accounted by its sibling source decisions. The mapped owner links to that live restoration; this row does not claim that all source body wording remains in place. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current remainder: none

Retained Lead note verbatim: Conservation holds: first paragraph retained, cost paragraph verbatim in component-protocol restored-rust-host-first-cost; link resolves. Generic move rationale says all wording retained although the cost paragraph relocated (see concerns).

Full shown source:

`````md
## 5. Rust Host First: Benefit And Cost

Making Rust the host before migrating components places the final composition root, peer host use cases, provider registry, and plugin seam in their permanent runtime immediately. Every native migration then removes a `LegacyNode` edge instead of building more infrastructure into a temporary Node host.

The cost is temporary: a legacy CLI call pays both the small Rust launcher and Node startup, distribution must ship both runtimes, and compatibility failures can occur before any command becomes faster. The architecture only pays off if the first Rust host remains thin and forwards legacy behavior rather than rewriting every parser and use case at once.
`````

Full shown target:

`````md
#### 5. Rust Host First: Benefit And Cost

Making Rust the host before migrating components places the final composition root, peer host use cases, provider registry, and plugin seam in their permanent runtime immediately. Every native migration then removes a `LegacyNode` edge instead of building more infrastructure into a temporary Node host.


Added in candidate: this retained source detail is carried verbatim in [the dropped-011 restoration](../contracts/component-protocol.md#restored-rust-host-first-cost).
`````

### claim_14f599ac6c6af84bcd15a503faaaea03

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#node-to-rust-component-migration

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration

Source unit digest: 24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621

Target unit digest: 73142a367bf579e3afc2da330169ae1b04b7a9b758a33a9b8be857aca2e85373

Shown source SHA256: 617c7d667c482e1f25d15822f67b7575817d743ef446976b55b133c828493455

Shown target SHA256: 613c330c6cc62a5e7d01aff04b6300656499e0dd6b3aa52b7c8b932964ecec4a

Previous rationale: Move the complete direct heading unit "# Node To Rust Component Migration" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#node-to-rust-component-migration to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current rationale: Move the complete direct heading unit "# Node To Rust Component Migration" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#node-to-rust-component-migration to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration. The heading and remaining in-place text stay at this mapped owner; the relocated body is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-scope and accounted by its sibling source decisions. The mapped owner links to that live restoration; this row does not claim that all source body wording remains in place. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current remainder: none

Retained Lead note verbatim: Conservation holds: status lines retained; scope paragraph verbatim in release-boundaries restored-scope; link resolves. Added historical-note block is labelled and supersedes the legacy-current note. Move rationale over-states retention (see concerns).

Full shown source:

`````md
# Node To Rust Component Migration

**Status:** Selected migration direction, not an implementation plan.
**Date:** 2026-09-01.
**Revised:** 2026-09-10 (see
plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).
**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the
distributable Rust `fgos` CLI host in R1, with every unmigrated selector
resolved by the CLI adapter to the legacy-cli lane and exec'd straight to the
Node payload, never entering the kernel; prove external process providers in
R2 and the production remote peer in R3; then replace semantic operations one
component at a time with native Rust providers.
**Source:** Product-owner planning and follow-up component-boundary discussion.

This document discusses only migration options, ordering, transition stages,
cutover, and rollback. The stable host model, peer CLI/remote host use cases,
Operation Provider Router, provider mechanics, protocols, plugin registry,
authority, and technical tradeoffs live in
[Host Invocation And Provider Routing Architecture](./host-invocation-provider-routing.md).
Component ownership, authority boundaries, and the physical placement compass
for files/crates/components live in
[fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md);
every native migration slice must read it before choosing where a provider or
component module lives.
The executable work breakdown lives in
[Rust Host And Proof Providers Implementation Plan](./rust-cli-and-proof-components-plan.md).
`````

Full shown target:

`````md
### Node To Rust Component Migration

**Status:** Selected migration direction, not an implementation plan.
**Date:** 2026-09-01.
**Revised:** 2026-09-10 (see
plans/reports/architecture-review-260910-1537-host-invocation-provider-routing-design-review.md).
**Selected direction (2026-09-03; revised 2026-09-04, 2026-09-10):** ship the
distributable Rust `fgos` CLI host in R1, with every unmigrated selector
resolved by the CLI adapter to the legacy-cli lane and exec'd straight to the
Node payload, never entering the kernel; prove external process providers in
R2 and the production remote peer in R3; then replace semantic operations one
component at a time with native Rust providers.
**Source:** Product-owner planning and follow-up component-boundary discussion.


Added in candidate: this retained source detail is carried verbatim in [the dropped-012 restoration](release-boundaries.md#restored-scope).
`````

### claim_aec6fb3d8eed3c772ec8bac9808009d3

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-a-thin-the-entire-node-host-first

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first

Source unit digest: 1b4f6a70d3530daab76986749e1284dac18236ec9de6faada23ff972e155e334

Target unit digest: 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73

Shown source SHA256: 9334322765c33eaa99906024ca68ac02fd515aadb32bacb1b93cace5a4721d02

Shown target SHA256: e0e67f5195298a63ff46b85ba7da5b4efb6ce070ac3666a08ade660055ddaff1

Previous rationale: Move the complete direct heading unit "### Option A: Thin The Entire Node Host First" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-a-thin-the-entire-node-host-first to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current rationale: Move the complete direct heading unit "### Option A: Thin The Entire Node Host First" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-a-thin-the-entire-node-host-first to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first. The heading and remaining in-place text stay at this mapped owner; the relocated body is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rejected-options-rationale and accounted by its sibling source decisions. The mapped owner links to that live restoration; this row does not claim that all source body wording remains in place. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current remainder: none

Retained Lead note verbatim: Option A diagram and rationale verbatim in component-protocol restored-rejected-options-rationale (first two fences); labelled live link replaces the old dead pointer and resolves. Move rationale over-states retention (see concerns).

Full shown source:

`````md
### Option A: Thin The Entire Node Host First

```txt
large Node-thinning refactor
  -> stable Node component ports
  -> Rust implementations behind those ports
  -> replace the outer host last
```

This makes each later port explicit, but invests heavily in a composition root
that is scheduled for removal. It also delays the final Rust plugin/host seam
until after substantial Node restructuring.
`````

Full shown target:

`````md
##### Option A: Thin The Entire Node Host First


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

### claim_4862726f445bfdcba1b58996cf47dfd8

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-c-big-bang-rust-rewrite

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite

Source unit digest: a755bd8cd566ed1f0ada74dd6f1a63dc20a8648ba87e1b61510c9784dc216a01

Target unit digest: 2c60584c5c5e535249c603a1e98ede6c6497204f5e1880f44cf3a8fb0ad00a05

Shown source SHA256: df7b26f208ea41b1e2f55d125e6b77b58dcc60ee06a039e38f7981cfcf584cc0

Shown target SHA256: 312b9a1b98fcc5344559bcce0845cc04bcd28f08d3d7d715d91cd3c6dc19340e

Previous rationale: Move the complete direct heading unit "### Option C: Big-Bang Rust Rewrite" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-c-big-bang-rust-rewrite to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current rationale: Move the complete direct heading unit "### Option C: Big-Bang Rust Rewrite" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-c-big-bang-rust-rewrite to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite. The heading and remaining in-place text stay at this mapped owner; the relocated body is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rejected-options-rationale and accounted by its sibling source decisions. The mapped owner links to that live restoration; this row does not claim that all source body wording remains in place. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Current remainder: none

Retained Lead note verbatim: Option C diagram and rationale verbatim in component-protocol restored-rejected-options-rationale (fences three and four); labelled live link resolves. Move rationale over-states retention (see concerns).

Full shown source:

`````md
### Option C: Big-Bang Rust Rewrite

```txt
reimplement parser + use cases + state + distribution
  -> switch everything at once
```

This has no safe parity or rollback gradient. It mixes host replacement,
component redesign, authority movement, and distribution into one release and
is rejected.
`````

Full shown target:

`````md
##### Option C: Big-Bang Rust Rewrite


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

## Rebound successors

| Claim | Source digest | Target digest |
|---|---|---|
| claim_b6387d30d960295b4b435073f651049f | 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2 | 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d |
| claim_ce29f4c2f27a7a5d9e5266aa311e2774 | 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b | 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc |
| claim_65a7aae7b5028b9cda27951a0b7b6ac4 | 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4 | 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086 |
| claim_2549fb95501e270298d3272b058e7887 | 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e | 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed |
| claim_51d3818de63d806db2841b0504336134 | 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619 | 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80 |

### claim_b6387d30d960295b4b435073f651049f

Source: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-8 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-9 at 744fecf087841e3600c44bb3d07a681a37203ef0

Source unit digest: 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2

Target unit digest: 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d

Shown source SHA256: 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2

Shown target SHA256: 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-8 is replaced in the same document by #unheaded-block-9. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Retained Lead note verbatim: Same table. Recount to 75/70/five with the five native names, verified against command-routes.json; owner column unchanged. Old two-route mapping prose dropped here but still carried in other host-invocation docs.

Full shown source:

`````md
| Item | Kind | Why it remains open | Owner |
| --- | --- | --- | --- |
| R1 route matrix | Code-verified current snapshot | The current route table is 73 selectors: 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. | Host invocation. |
| Stable/default graduation | Product / release decision | Preview posture is approved and external installs default to Rust host; stable/default graduation remains undecided. | Packaging-distribution stream / release owner. |
| Legacy Node fallback removal timing | Product / support decision | Explicit deprecated escape hatch is approved for 30 calendar days after preview release publication. | Packaging-distribution stream plus host invocation. |
| Native `OperationId` descriptors beyond `distribution.build.show` | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a test fixture. | Host invocation; reopen when adding another native route. |
| `gate-bypass` ownership | Closed; local native proof implemented | Code places read semantics under state, config readiness under setup, and CLI grammar under the command registry; native migration uses existing work/state read ownership and avoids a new `gate-policy` component. | Host invocation plus existing work/state owner; Packaging-Distribution remains owner for setup/doctor readiness. |
| First external provider preview set | Product / conformance decision | R2 needs a fixture provider set, but the source docs left that selection open; this is now the next host-invocation frontier. | Host invocation plus provider owners. |
| Chat host contracts | Future host contract decision | Chat is a planned peer host, but its adapter, interruption, and presentation contracts are not yet defined. | Host invocation. |
`````

Full shown target:

`````md
| Item | Kind | Why it remains open | Owner |
| --- | --- | --- | --- |
| R1 route matrix | Code-verified current snapshot | The current route table is 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Host invocation. |
| Stable/default graduation | Product / release decision | Preview posture is approved and external installs default to Rust host; stable/default graduation remains undecided. | Packaging-distribution stream / release owner. |
| Legacy Node fallback removal timing | Product / support decision | Explicit deprecated escape hatch is approved for 30 calendar days after preview release publication. | Packaging-distribution stream plus host invocation. |
| Native `OperationId` descriptors beyond `distribution.build.show` | Code-verified current snapshot | Added in candidate: the five production native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`; `test.fixture.echo` is a test fixture. | Host invocation; reopen when adding another native route. |
| `gate-bypass` ownership | Closed; local native proof implemented | Code places read semantics under state, config readiness under setup, and CLI grammar under the command registry; native migration uses existing work/state read ownership and avoids a new `gate-policy` component. | Host invocation plus existing work/state owner; Packaging-Distribution remains owner for setup/doctor readiness. |
| First external provider preview set | Product / conformance decision | R2 needs a fixture provider set, but the source docs left that selection open; this is now the next host-invocation frontier. | Host invocation plus provider owners. |
| Chat host contracts | Future host contract decision | Chat is a planned peer host, but its adapter, interruption, and presentation contracts are not yet defined. | Host invocation. |
`````

### claim_ce29f4c2f27a7a5d9e5266aa311e2774

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-4 at 744fecf087841e3600c44bb3d07a681a37203ef0

Source unit digest: 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b

Target unit digest: 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc

Shown source SHA256: 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b

Shown target SHA256: 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Retained Lead note verbatim: Same table. Only the route recount changed (73/71/two to 75/70/five), which matches command-routes.json; links unchanged.

Full shown source:

`````md
| Evidence | Current state |
| --- | --- |
| [apps/fgos](../../../apps/fgos/) | Rust CLI host code exists. |
| [packages/host-runtime/rust](../../../packages/host-runtime/rust/) | Host runtime crate implements kernel contracts, router, registry, authority gate, providers, and invocation service. |
| [packages/host-runtime/contracts/command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) | Current route matrix has 73 selectors: 71 `legacy-cli`, two native. |
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Native CLI routes project `version` to `distribution.build.show` and `gate-bypass` to `work.gate-bypass.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| Preview release proof | Published GitHub release `v0.1.0` on 2026-09-18 includes `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; release workflow `35317876419` passed, and post-release CI run `35498322149` passed including external-consumer proof. Local release-shaped assets also passed `scripts/ci-external-consumer.sh --assets <dir>` on 2026-09-15. |
`````

Full shown target:

`````md
| Evidence | Current state |
| --- | --- |
| [apps/fgos](../../../apps/fgos/) | Rust CLI host code exists. |
| [packages/host-runtime/rust](../../../packages/host-runtime/rust/) | Host runtime crate implements kernel contracts, router, registry, authority gate, providers, and invocation service. |
| [packages/host-runtime/contracts/command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) | Current route matrix has 75 selectors: 70 `legacy-cli`, five native. |
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Added in candidate: native CLI routes project the five selectors as `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| Preview release proof | Published GitHub release `v0.1.0` on 2026-09-18 includes `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; release workflow `35317876419` passed, and post-release CI run `35498322149` passed including external-consumer proof. Local release-shaped assets also passed `scripts/ci-external-consumer.sh --assets <dir>` on 2026-09-15. |
`````

### claim_65a7aae7b5028b9cda27951a0b7b6ac4

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-10 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-11 at 744fecf087841e3600c44bb3d07a681a37203ef0

Source unit digest: 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4

Target unit digest: 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086

Shown source SHA256: 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4

Shown target SHA256: 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-10 is replaced in the same document by #unheaded-block-11. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Retained Lead note verbatim: Same table. Recount to 75/70/five and the second-native-selector sentence replaced by the current five-name set (verified); test.fixture.echo caveat and reopen action kept. The old version/gate-bypass mapping prose is dropped here but still carried in other host-invocation docs.

Full shown source:

`````md
| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 73 selectors total, 71 `legacy-cli` selectors and two native selectors: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved for 30 calendar days after preview release publication. | Blocks only removal before the 30-day window closes, not Rust-host default preview posture. | Public preview tag `v0.1.0` was published on 2026-09-18; earliest removal for this preview release is 2026-10-18 unless a later release decision replaces that support promise. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is now the second production native selector; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |
`````

Full shown target:

`````md
| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 75 selectors total, 70 `legacy-cli` selectors and five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved for 30 calendar days after preview release publication. | Blocks only removal before the 30-day window closes, not Rust-host default preview posture. | Public preview tag `v0.1.0` was published on 2026-09-18; earliest removal for this preview release is 2026-10-18 unless a later release decision replaces that support promise. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | Added in candidate: the current native selector set is `convention`, `friction`, `gate-bypass`, `metrics`, `version`; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |
`````

### claim_2549fb95501e270298d3272b058e7887

Source: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-4 at 744fecf087841e3600c44bb3d07a681a37203ef0

Source unit digest: 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e

Target unit digest: 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed

Shown source SHA256: 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e

Shown target SHA256: 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Retained Lead note verbatim: Same table. Only the route recount changed (73/71/two to 75/70/five), which matches command-routes.json; links unchanged.

Full shown source:

`````md
| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `implemented preview` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `implemented preview` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 73 selectors total, 71 `legacy-cli`, two native |
| Native selectors | `current partial`: `version -> distribution.build.show`; local native read proof: `gate-bypass -> work.gate-bypass.show` |
| Production native descriptors beyond `distribution.build.show` | `current partial`: `gate-bypass -> work.gate-bypass.show`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: release `v0.1.0` was published on 2026-09-18 with `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |
`````

Full shown target:

`````md
| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `implemented preview` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `implemented preview` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 75 selectors total, 70 `legacy-cli`, five native |
| Native selectors | Added in candidate: current native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show` |
| Production native descriptors beyond `distribution.build.show` | Added in candidate: the production native mappings beyond `distribution.build.show` are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: release `v0.1.0` was published on 2026-09-18 with `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |
`````

### claim_51d3818de63d806db2841b0504336134

Source: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-10 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-11 at 744fecf087841e3600c44bb3d07a681a37203ef0

Source unit digest: 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619

Target unit digest: 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80

Shown source SHA256: 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619

Shown target SHA256: 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-10 is replaced in the same document by #unheaded-block-11. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Retained Lead note verbatim: Same table. Recount to 75/70/five with the five native names (verified against command-routes.json); the R3 plan pointer became a live link to archive/plans/260918-host-invocation-r3-remote-peer/plan.md, which exists. The old two-route mapping prose is dropped here but remains in r1-rust-host-proof.md, spec.md and invocation-kernel.md.

Full shown source:

`````md
| Unknown | Kind | Why it is unknown | Where tracked |
| --- | --- | --- | --- |
| Current R1 route matrix. | Code-verified current snapshot | `packages/host-runtime/contracts/command-routes.json` contains 73 selectors: 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. | [r1-rust-host-proof.md](r1-rust-host-proof.md), [../spec.md](../spec.md#6-unknowns) |
| Preview versus stable public contract split. | Product / release decision | The old plan names it as a remaining decision before R1, and code presence cannot decide public release posture. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Legacy compatibility support window. | Product / support decision | The support duration affects rollback and Node-removal policy, and was not settled in the source docs. | [compatibility-harness.md](compatibility-harness.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Closed preview proof | R2 selected `fixture.echo.echo` and proved manifest, linker, frame codec, supervisor, and integration behavior. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| First production remote peer route. | Closed preview proof | R3 selected `GET /v1/runtime` -> `distribution.build.show` and proved direct `InvocationService` invocation without `VerbGateway` or `fgos.v1` parsing. | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), `../../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
`````

Full shown target:

`````md
| Unknown | Kind | Why it is unknown | Where tracked |
| --- | --- | --- | --- |
| Current R1 route matrix. | Code-verified current snapshot | `packages/host-runtime/contracts/command-routes.json` contains 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | [r1-rust-host-proof.md](r1-rust-host-proof.md), [../spec.md](../spec.md#6-unknowns) |
| Preview versus stable public contract split. | Product / release decision | The old plan names it as a remaining decision before R1, and code presence cannot decide public release posture. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Legacy compatibility support window. | Product / support decision | The support duration affects rollback and Node-removal policy, and was not settled in the source docs. | [compatibility-harness.md](compatibility-harness.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | Added in candidate: the five production native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Closed preview proof | R2 selected `fixture.echo.echo` and proved manifest, linker, frame codec, supervisor, and integration behavior. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| First production remote peer route. | Closed preview proof | R3 selected `GET /v1/runtime` -> `distribution.build.show` and proved direct `InvocationService` invocation without `VerbGateway` or `fgos.v1` parsing. | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
`````

## Changed text

### docs/platform/host-invocation-routing/intent-preservation-ledger.md

Before file SHA256: b74d4331c2bc0360ac200698a736fddd8c0378b896c472dfef2e59f9e33c46c9

Current file SHA256: 19ea939648aa05b4e97b82e87f2f894a3c6286e70c969e43d68d21c74f2170e8

Before: #6-open-items, unit SHA256 25be5a30c111e9005e326dd59542052c2aed32f25daaeef42c2a2a24032bd487

`````md
## 6. Open Items
`````

Current: #6-open-items, unit SHA256 205ed62a0082b39ca6fc19956402fa681e6cd2829d47856be420b6f416c50a4b

`````md
## 6. Open Items
`````

Before: #unheaded-block-9, unit SHA256 6285e4bf68b83ee0e8090de22df3316e6c529bef2f750c8a33e3983c22aae9a5

`````md
| Item | Kind | Why it remains open | Owner |
| --- | --- | --- | --- |
| R1 route matrix | Code-verified current snapshot | The current route table is 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Host invocation. |
| Stable/default graduation | Product / release decision | Preview posture is approved and external installs default to Rust host; stable/default graduation remains undecided. | Packaging-distribution stream / release owner. |
| Legacy Node fallback removal timing | Product / support decision | Explicit deprecated escape hatch is approved for 30 calendar days after preview release publication. | Packaging-distribution stream plus host invocation. |
| Native `OperationId` descriptors beyond `distribution.build.show` | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a test fixture. | Host invocation; reopen when adding another native route. |
| `gate-bypass` ownership | Closed; local native proof implemented | Code places read semantics under state, config readiness under setup, and CLI grammar under the command registry; native migration uses existing work/state read ownership and avoids a new `gate-policy` component. | Host invocation plus existing work/state owner; Packaging-Distribution remains owner for setup/doctor readiness. |
| First external provider preview set | Product / conformance decision | R2 needs a fixture provider set, but the source docs left that selection open; this is now the next host-invocation frontier. | Host invocation plus provider owners. |
| Chat host contracts | Future host contract decision | Chat is a planned peer host, but its adapter, interruption, and presentation contracts are not yet defined. | Host invocation. |
`````

Current: #unheaded-block-9, unit SHA256 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d

`````md
| Item | Kind | Why it remains open | Owner |
| --- | --- | --- | --- |
| R1 route matrix | Code-verified current snapshot | The current route table is 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Host invocation. |
| Stable/default graduation | Product / release decision | Preview posture is approved and external installs default to Rust host; stable/default graduation remains undecided. | Packaging-distribution stream / release owner. |
| Legacy Node fallback removal timing | Product / support decision | Explicit deprecated escape hatch is approved for 30 calendar days after preview release publication. | Packaging-distribution stream plus host invocation. |
| Native `OperationId` descriptors beyond `distribution.build.show` | Code-verified current snapshot | Added in candidate: the five production native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`; `test.fixture.echo` is a test fixture. | Host invocation; reopen when adding another native route. |
| `gate-bypass` ownership | Closed; local native proof implemented | Code places read semantics under state, config readiness under setup, and CLI grammar under the command registry; native migration uses existing work/state read ownership and avoids a new `gate-policy` component. | Host invocation plus existing work/state owner; Packaging-Distribution remains owner for setup/doctor readiness. |
| First external provider preview set | Product / conformance decision | R2 needs a fixture provider set, but the source docs left that selection open; this is now the next host-invocation frontier. | Host invocation plus provider owners. |
| Chat host contracts | Future host contract decision | Chat is a planned peer host, but its adapter, interruption, and presentation contracts are not yet defined. | Host invocation. |
`````

### docs/platform/host-invocation-routing/roadmap.md

Before file SHA256: 42733a0a9dd332a90d985037a589e2bfda30043dd5eddd48452f7321b831570d

Current file SHA256: 7ae47ac59d0589d7fc22a615345e65b7f5c9c8d955abb844746f2fa66b26b6c9

Before: #1-current-baseline, unit SHA256 e970e9dca56ea3a31b46c058fb5edebfd8a579914da603b6fae70076863bb20b

`````md
## 1. Current Baseline
`````

Current: #1-current-baseline, unit SHA256 de33fe795a74c819045d5c4c1519b51f2da0469ff46af2e89b90dfec1fac2d40

`````md
## 1. Current Baseline
`````

Before: #unheaded-block-4, unit SHA256 470ddd3bc8b62c4b74b260dffc943949e49cad26eb2faa66e9e9c0845c542b38

`````md
| Evidence | Current state |
| --- | --- |
| [apps/fgos](../../../apps/fgos/) | Rust CLI host code exists. |
| [packages/host-runtime/rust](../../../packages/host-runtime/rust/) | Host runtime crate implements kernel contracts, router, registry, authority gate, providers, and invocation service. |
| [packages/host-runtime/contracts/command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) | Current route matrix has 75 selectors: 70 `legacy-cli`, five native. |
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Native CLI routes project `version` to `distribution.build.show` and `gate-bypass` to `work.gate-bypass.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| Preview release proof | Published GitHub release `v0.1.0` on 2026-09-18 includes `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; release workflow `35317876419` passed, and post-release CI run `35498322149` passed including external-consumer proof. Local release-shaped assets also passed `scripts/ci-external-consumer.sh --assets <dir>` on 2026-09-15. |
`````

Current: #unheaded-block-4, unit SHA256 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc

`````md
| Evidence | Current state |
| --- | --- |
| [apps/fgos](../../../apps/fgos/) | Rust CLI host code exists. |
| [packages/host-runtime/rust](../../../packages/host-runtime/rust/) | Host runtime crate implements kernel contracts, router, registry, authority gate, providers, and invocation service. |
| [packages/host-runtime/contracts/command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) | Current route matrix has 75 selectors: 70 `legacy-cli`, five native. |
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Added in candidate: native CLI routes project the five selectors as `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| Preview release proof | Published GitHub release `v0.1.0` on 2026-09-18 includes `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; release workflow `35317876419` passed, and post-release CI run `35498322149` passed including external-consumer proof. Local release-shaped assets also passed `scripts/ci-external-consumer.sh --assets <dir>` on 2026-09-15. |
`````

Before: #31-status-tracker, unit SHA256 926a6ea7aaba3f7a8536ed7a664d67f8f7f6f44a2ecd8d36ed8cc56f0d27ea9e

`````md
### 3.1 Status Tracker
`````

Current: #31-status-tracker, unit SHA256 87be6d10bab6016582d2b2295dd25e06e3b2a92913566a0c8c59e952825d91d3

`````md
### 3.1 Status Tracker
`````

Before: #unheaded-block-10, unit SHA256 5a40e37465021536f67f72817ee4336d96f966fa366b76533a52412308a12764

`````md
| Front | Status | What is done | What remains |
| --- | --- | --- | --- |
| R1 Rust CLI host | `implemented preview` | Installed/default preview proof shows external `fgos` enters the Rust host; `version` and `gate-bypass` are native routes. | Stable/default graduation remains a release-owner decision. |
| Route matrix | `current partial` | 75 selectors are described: 70 `legacy-cli`, five native. | Migrate additional selectors only at complete operation/use-case boundaries. |
| Invocation kernel | `current partial` | `OperationRequest`, `ProviderOutcome`, router, registry snapshot, two-stage authority, and `InvocationService` are proven for the current Rust slice. | Declared replacement resolution, broader native providers, and future host kinds still need proof. |
| R2 external process provider | `implemented preview` | `fixture.echo.echo` proves manifest discovery, derived registry/linker, frame codec, supervisor, and router integration. | Production provider ecosystem work: marketplace/signatures, WASM, persisted cache/lock, non-fixture shipped providers. |
| R3 remote peer | `implemented preview` | `GET /v1/runtime` invokes `distribution.build.show` through the shared kernel without `VerbGateway`, CLI shelling, or `fgos.v1` parsing. | Every other gateway route remains legacy; future remote-route migrations are separate work. |
| Chat host | `planned` | No current adapter or contract is claimed. | Define admission, interruption, parking, presentation, and proof contract. |
| Legacy Node retirement | `blocked by migration/release gates` | Node is still the compatibility payload for 70 selectors. | Requires zero `legacy-cli` routes, release policy closure, and packaging rollback/fallback agreement. |
`````

Current: #unheaded-block-10, unit SHA256 8380132b40fff81518b0e6e903a674b85963f2ca0dabc66e1e6218ac088d60b6

`````md
| Front | Status | What is done | What remains |
| --- | --- | --- | --- |
| R1 Rust CLI host | `implemented preview` | Installed/default preview proof shows external `fgos` enters the Rust host; Added in candidate: the current five native selectors are `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Stable/default graduation remains a release-owner decision. |
| Route matrix | `current partial` | 75 selectors are described: 70 `legacy-cli`, five native. | Migrate additional selectors only at complete operation/use-case boundaries. |
| Invocation kernel | `current partial` | `OperationRequest`, `ProviderOutcome`, router, registry snapshot, two-stage authority, and `InvocationService` are proven for the current Rust slice. | Declared replacement resolution, broader native providers, and future host kinds still need proof. |
| R2 external process provider | `implemented preview` | `fixture.echo.echo` proves manifest discovery, derived registry/linker, frame codec, supervisor, and router integration. | Production provider ecosystem work: marketplace/signatures, WASM, persisted cache/lock, non-fixture shipped providers. |
| R3 remote peer | `implemented preview` | `GET /v1/runtime` invokes `distribution.build.show` through the shared kernel without `VerbGateway`, CLI shelling, or `fgos.v1` parsing. | Every other gateway route remains legacy; future remote-route migrations are separate work. |
| Chat host | `planned` | No current adapter or contract is claimed. | Define admission, interruption, parking, presentation, and proof contract. |
| Legacy Node retirement | `blocked by migration/release gates` | Node is still the compatibility payload for 70 selectors. | Requires zero `legacy-cli` routes, release policy closure, and packaging rollback/fallback agreement. |
`````

### docs/platform/host-invocation-routing/spec.md

Before file SHA256: e6f44522940b07c2e01ef9e3cec956c7845190c3c37ee8b52c8af936032bcbf0

Current file SHA256: 67e0d029b6f3317608f0ed6e7874216b01a5c880db351f0834bb163e1434799c

Before: #6-unknowns, unit SHA256 3693814c15ab54d2cd830062e3d1b34afc3052082abb4b0b1301cd4a55e5eee0

`````md
## 6. Unknowns
`````

Current: #6-unknowns, unit SHA256 e2517cc6915051b1ca120db19735c823ed510ad85b570380a819a3c6929c2255

`````md
## 6. Unknowns
`````

Before: #unheaded-block-11, unit SHA256 467ad3ca4c303a0828566f84764aaca4a32ec89b695dcb324a6f8daca798ed2e

`````md
| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 75 selectors total, 70 `legacy-cli` selectors and five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved for 30 calendar days after preview release publication. | Blocks only removal before the 30-day window closes, not Rust-host default preview posture. | Public preview tag `v0.1.0` was published on 2026-09-18; earliest removal for this preview release is 2026-10-18 unless a later release decision replaces that support promise. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | The current native selector set is `convention`, `friction`, `gate-bypass`, `metrics`, `version`; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |
`````

Current: #unheaded-block-11, unit SHA256 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086

`````md
| Unknown | Kind | What is unclear | Blocking scope | Closure condition |
| --- | --- | --- | --- | --- |
| R1 command route matrix | Code-verified current snapshot | The checked-in route matrix exists: 75 selectors total, 70 `legacy-cli` selectors and five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | Does not by itself prove installed-default release. | Keep `packages/host-runtime/contracts/command-routes.json` as the source snapshot and rerun drift tests when selectors change. |
| Preview vs stable default | Product / release decision | Preview public posture is approved; stable/default graduation remains undecided. | Blocks only stable/default graduation, not preview installed/default proof. | Release owner approves stable/default graduation after any additional release proof required. |
| Node fallback compatibility-window duration | Product / support decision | Explicit deprecated fallback escape hatch is approved for 30 calendar days after preview release publication. | Blocks only removal before the 30-day window closes, not Rust-host default preview posture. | Public preview tag `v0.1.0` was published on 2026-09-18; earliest removal for this preview release is 2026-10-18 unless a later release decision replaces that support promise. |
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | Added in candidate: the current native selector set is `convention`, `friction`, `gate-bypass`, `metrics`, `version`; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |
`````

### docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md

Before file SHA256: 54d417e7609743de75f2bf92789f4b290724294c6796b0ca2469e4623e516c7f

Current file SHA256: d97afecf2a64681f02aa9fd715f459dae4ea688aa39c0f22d044ac37501c472a

Before: #2-code-verified-snapshot, unit SHA256 6a4e39e926e9a483469d9928aee6a8b00a49e979263f22bca62901fb8229cae7

`````md
## 2. Code-Verified Snapshot
`````

Current: #2-code-verified-snapshot, unit SHA256 879af26e49f84027a68a9370aeae60f25015cef2b28c03ef4be141ed59e78d10

`````md
## 2. Code-Verified Snapshot
`````

Before: #unheaded-block-4, unit SHA256 7e25265bed79ca04ec8c529cae7496c2058099935c179c4a050f5519401c198b

`````md
| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `implemented preview` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `implemented preview` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 75 selectors total, 70 `legacy-cli`, five native |
| Native selectors | `current partial`: `version -> distribution.build.show`; local native read proof: `gate-bypass -> work.gate-bypass.show` |
| Production native descriptors beyond `distribution.build.show` | `current partial`: `gate-bypass -> work.gate-bypass.show`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: release `v0.1.0` was published on 2026-09-18 with `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |
`````

Current: #unheaded-block-4, unit SHA256 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed

`````md
| Evidence | Status |
| --- | --- |
| Rust host binary source under [../../../../apps/fgos/](../../../../apps/fgos/) | `implemented preview` |
| Host runtime crate under [../../../../packages/host-runtime/rust/](../../../../packages/host-runtime/rust/) | `implemented preview` |
| Command route matrix in [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | `current partial`: 75 selectors total, 70 `legacy-cli`, five native |
| Native selectors | Added in candidate: current native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show` |
| Production native descriptors beyond `distribution.build.show` | Added in candidate: the production native mappings beyond `distribution.build.show` are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: release `v0.1.0` was published on 2026-09-18 with `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |
`````

### docs/platform/host-invocation-routing/verification/source-preservation-audit.md

Before file SHA256: ec5ea53ac9fe5e1e66f3a45265788d0b6c3bbec61e381f163a92989a51523599

Current file SHA256: 48161a13b8b7bb6547a2014aa411aab00fca5ec9acfa0c60d8f1cf207683ffef

Before: #5-remaining-unknowns, unit SHA256 e6061d3782a5389fe4dc8d3303747751a129c10fd280fdf670851735081763c6

`````md
## 5. Remaining Unknowns
`````

Current: #5-remaining-unknowns, unit SHA256 2cfcc0b2baf18d87e1d517473c16c6c96e27ca711b16178b6151c92d1f83118d

`````md
## 5. Remaining Unknowns
`````

Before: #unheaded-block-11, unit SHA256 b8c6c828860673a1d0ca70d074eb36712557197d058308786b62ac19568a02d9

`````md
| Unknown | Kind | Why it is unknown | Where tracked |
| --- | --- | --- | --- |
| Current R1 route matrix. | Code-verified current snapshot | `packages/host-runtime/contracts/command-routes.json` contains 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | [r1-rust-host-proof.md](r1-rust-host-proof.md), [../spec.md](../spec.md#6-unknowns) |
| Preview versus stable public contract split. | Product / release decision | The old plan names it as a remaining decision before R1, and code presence cannot decide public release posture. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Legacy compatibility support window. | Product / support decision | The support duration affects rollback and Node-removal policy, and was not settled in the source docs. | [compatibility-harness.md](compatibility-harness.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Closed preview proof | R2 selected `fixture.echo.echo` and proved manifest, linker, frame codec, supervisor, and integration behavior. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| First production remote peer route. | Closed preview proof | R3 selected `GET /v1/runtime` -> `distribution.build.show` and proved direct `InvocationService` invocation without `VerbGateway` or `fgos.v1` parsing. | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
`````

Current: #unheaded-block-11, unit SHA256 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80

`````md
| Unknown | Kind | Why it is unknown | Where tracked |
| --- | --- | --- | --- |
| Current R1 route matrix. | Code-verified current snapshot | `packages/host-runtime/contracts/command-routes.json` contains 75 selectors: 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. | [r1-rust-host-proof.md](r1-rust-host-proof.md), [../spec.md](../spec.md#6-unknowns) |
| Preview versus stable public contract split. | Product / release decision | The old plan names it as a remaining decision before R1, and code presence cannot decide public release posture. | [../architecture/release-boundaries.md](../architecture/release-boundaries.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Legacy compatibility support window. | Product / support decision | The support duration affects rollback and Node-removal policy, and was not settled in the source docs. | [compatibility-harness.md](compatibility-harness.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | Added in candidate: the five production native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Closed preview proof | R2 selected `fixture.echo.echo` and proved manifest, linker, frame codec, supervisor, and integration behavior. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| First production remote peer route. | Closed preview proof | R3 selected `GET /v1/runtime` -> `distribution.build.show` and proved direct `InvocationService` invocation without `VerbGateway` or `fgos.v1` parsing. | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
`````

Before: #6-code-scan-evidence, unit SHA256 a19b5b00eaf5d563d81cccc0043374f58c5933f2b5990a1d14e53295b547737f

`````md
## 6. Code Scan Evidence
`````

Current: #6-code-scan-evidence, unit SHA256 efeff8d1d094b751e34dd062f54f8d7e75b168cd5c614750f424b9e1d84f67bd

`````md
## 6. Code Scan Evidence
`````

Before: #unheaded-block-12, unit SHA256 c5472bc42b8d6e56775d17e7d61cd7684d82b185d7e4f9ba141f83ecb15d4a29

`````md
| Check | Evidence | Result |
| --- | --- | --- |
| Route matrix count | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | 75 selectors: 70 `legacy-cli`, five native. |
| Native production operations | [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs) | `version` projects to `distribution.build.show`; `gate-bypass` projects to `work.gate-bypass.show`. |
| Rust host/runtime proof | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current partial code path exists. |
| External provider implementation | [../../../../packages/host-runtime/rust/src/providers/external_process/](../../../../packages/host-runtime/rust/src/providers/external_process/), [r2-external-process-proof.md](r2-external-process-proof.md) | R2 preview path implemented with fixture proof; production ecosystem hardening remains future. |
| Remote peer implementation | [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | `GET /v1/runtime` implemented preview; all other gateway routes remain legacy. |
| Chat adapter implementation | `rg` over `src`, `bin`, `packages`, `apps`, `herdr-dashboard` | No current chat host adapter found. |
| Targeted tests | `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14. |
`````

Current: #unheaded-block-12, unit SHA256 7d134fc2e53808d59e8481618acebd87d0244aa41de45dffcc7d8ee4382ee854

`````md
| Check | Evidence | Result |
| --- | --- | --- |
| Route matrix count | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | 75 selectors: 70 `legacy-cli`, five native. |
| Native production operations | [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs) | Added in candidate: the five production native selector mappings are `convention -> convention.query`, `friction -> observe.friction`, `gate-bypass -> work.gate-bypass.show`, `metrics -> observe.metrics`, `version -> distribution.build.show`. |
| Rust host/runtime proof | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current partial code path exists. |
| External provider implementation | [../../../../packages/host-runtime/rust/src/providers/external_process/](../../../../packages/host-runtime/rust/src/providers/external_process/), [r2-external-process-proof.md](r2-external-process-proof.md) | R2 preview path implemented with fixture proof; production ecosystem hardening remains future. |
| Remote peer implementation | [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | `GET /v1/runtime` implemented preview; all other gateway routes remain legacy. |
| Chat adapter implementation | `rg` over `src`, `bin`, `packages`, `apps`, `herdr-dashboard` | No current chat host adapter found. |
| Targeted tests | `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14. |
`````

## Native list binding consequence

The reverse-open list remains exactly 588 candidate-unverified units. Native refresh changes 14 identity/digest tuples only at the changed units shown above; no truth receipt or approval is carried. These exact before/current tuples are recorded below for binding inspection.

| Path and anchor | Previous ID | Current ID | Previous digest | Current digest |
|---|---|---|---|---|
| docs/platform/host-invocation-routing/intent-preservation-ledger.md#6-open-items | claim_4ddd9c152b622116bebefe8fd67b92f8 | claim_4ddd9c152b622116bebefe8fd67b92f8 | 25be5a30c111e9005e326dd59542052c2aed32f25daaeef42c2a2a24032bd487 | 205ed62a0082b39ca6fc19956402fa681e6cd2829d47856be420b6f416c50a4b |
| docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-9 | claim_464aa1500dc32661646d7839e4cca7c6 | claim_d398f812ceeffb6b1b9f13ebcfc2ff86 | 6285e4bf68b83ee0e8090de22df3316e6c529bef2f750c8a33e3983c22aae9a5 | 0503621d0d5eee0f4c29ea520e3f0fb2224516a3a1dedc36dde16658525d453d |
| docs/platform/host-invocation-routing/roadmap.md#1-current-baseline | claim_69a0c2c6d25de1eee6c260a3efef81cf | claim_69a0c2c6d25de1eee6c260a3efef81cf | e970e9dca56ea3a31b46c058fb5edebfd8a579914da603b6fae70076863bb20b | de33fe795a74c819045d5c4c1519b51f2da0469ff46af2e89b90dfec1fac2d40 |
| docs/platform/host-invocation-routing/roadmap.md#unheaded-block-4 | claim_673812eb3044b197429efd54d8e9f738 | claim_839df723e7dac45895611ad69e2f85b7 | 470ddd3bc8b62c4b74b260dffc943949e49cad26eb2faa66e9e9c0845c542b38 | 1895bfcae8fb393d6b008fcec3e368c42f7ea6e24bac176ea8374ebfaa80d0dc |
| docs/platform/host-invocation-routing/roadmap.md#31-status-tracker | claim_966b166cc73a1b5b5a833068bf408d04 | claim_966b166cc73a1b5b5a833068bf408d04 | 926a6ea7aaba3f7a8536ed7a664d67f8f7f6f44a2ecd8d36ed8cc56f0d27ea9e | 87be6d10bab6016582d2b2295dd25e06e3b2a92913566a0c8c59e952825d91d3 |
| docs/platform/host-invocation-routing/roadmap.md#unheaded-block-10 | claim_ba70b38fbdb240a19cbe94ca36966ae5 | claim_db26914f569473135fcab7cd6c0f3a58 | 5a40e37465021536f67f72817ee4336d96f966fa366b76533a52412308a12764 | 8380132b40fff81518b0e6e903a674b85963f2ca0dabc66e1e6218ac088d60b6 |
| docs/platform/host-invocation-routing/spec.md#6-unknowns | claim_f7c25694cf1c273ade0e5e031260a471 | claim_f7c25694cf1c273ade0e5e031260a471 | 3693814c15ab54d2cd830062e3d1b34afc3052082abb4b0b1301cd4a55e5eee0 | e2517cc6915051b1ca120db19735c823ed510ad85b570380a819a3c6929c2255 |
| docs/platform/host-invocation-routing/spec.md#unheaded-block-11 | claim_1bf3824a9279bff8e0a15b44b8a05161 | claim_8c50679c6c10da7f17a22868a6db610c | 467ad3ca4c303a0828566f84764aaca4a32ec89b695dcb324a6f8daca798ed2e | 761661fa605597de44123a7c6ea679369c80196c46704ecf18aaa6529a530086 |
| docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#2-code-verified-snapshot | claim_1487deb6bbb61d481aff3dc950ad192e | claim_1487deb6bbb61d481aff3dc950ad192e | 6a4e39e926e9a483469d9928aee6a8b00a49e979263f22bca62901fb8229cae7 | 879af26e49f84027a68a9370aeae60f25015cef2b28c03ef4be141ed59e78d10 |
| docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-4 | claim_4e3eb7e52945e7808987bc105a27a61c | claim_cb0ac7f58676d2940b901d7ad321c9a8 | 7e25265bed79ca04ec8c529cae7496c2058099935c179c4a050f5519401c198b | 8325e1fcad29a45d6a9f39f8f4bb409e47285e51a2f7ea1d4198207872742fed |
| docs/platform/host-invocation-routing/verification/source-preservation-audit.md#5-remaining-unknowns | claim_56c5165f8efb71e49759c9e649d14de2 | claim_56c5165f8efb71e49759c9e649d14de2 | e6061d3782a5389fe4dc8d3303747751a129c10fd280fdf670851735081763c6 | 2cfcc0b2baf18d87e1d517473c16c6c96e27ca711b16178b6151c92d1f83118d |
| docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-11 | claim_d6a650daac3afaffa00dd35e94b0c950 | claim_7519b704a859a0bd3365f43b604281a0 | b8c6c828860673a1d0ca70d074eb36712557197d058308786b62ac19568a02d9 | 87dd11731527c21af8a18a47e4d23c8a179b625b03a29f9d1ec8100f18369b80 |
| docs/platform/host-invocation-routing/verification/source-preservation-audit.md#6-code-scan-evidence | claim_8f62a952c825814a0085e4a627fc0e40 | claim_8f62a952c825814a0085e4a627fc0e40 | a19b5b00eaf5d563d81cccc0043374f58c5933f2b5990a1d14e53295b547737f | efeff8d1d094b751e34dd062f54f8d7e75b168cd5c614750f424b9e1d84f67bd |
| docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-12 | claim_99a0b0508899caf761d2eeb30decfdcc | claim_075a75878b909d0dd445217b66664b3b | c5472bc42b8d6e56775d17e7d61cd7684d82b185d7e4f9ba141f83ecb15d4a29 | 7d134fc2e53808d59e8481618acebd87d0244aa41de45dffcc7d8ee4382ee854 |
