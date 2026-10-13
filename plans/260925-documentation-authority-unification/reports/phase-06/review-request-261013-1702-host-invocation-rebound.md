# Host Invocation bounded rework review request

Status: ready for review; batch remains open.
Author session: codex-session:3@2026-10-13
Original row author: codex-session:1@2026-10-11
Content commit: b69197f88749fc6e1acc14797186f039a19e9793
Independent checkpoint: aaa3ab9629eebdd0af50b044b24fbea813f540c4

Review only the 33 rebound source decisions, the 35 necessary native candidate identity successors, and changed text shown below. The original checkpoint applied 417 ok notes verbatim; 14 committed reworks plus 19 necessary changed-text/ancestry consequences are pending, with no approval carry. The remaining 398 approvals retain their exact notes and report pins. The migration notes supersede dated bookkeeping with a stated reason. The twelve partial carries name their relocated remainder and sibling claims; their live restoration links preserve all content across the existing owners.

The 16 literal restoration approvals and contextual two-member exception are recorded from the committed report, with its notes verbatim. This does not decide whether the npm-bin removal promise is withdrawn or deferred: the owner question remains open, and its text is unchanged. Accepted restoration fences and owner placements are unchanged. No fresh readers, batch closure, main merge, promotion or next batch is requested.

Current route recount from packages/host-runtime/contracts/command-routes.json: 75 selectors, 70 legacy-cli, five native (convention, friction, gate-bypass, metrics, version). The dated R2 merge evidence and September route snapshot retain their historical counts. The retained no-setup sentence has a labelled status note backed by src/cli/command-registry.mjs:1439-1454 and bin/fgos.mjs:3774. HI-I027 keeps never hardcoded; its spec status stays accepted-not-implemented.

Use the ordinary five-column report for this bounded follow-up: Claim | Verdict | Note | Source digest | Target digest. Include Reviewer, Author session matching the original row author, and Review mode: ordinary. Source and target unit digests below are full SHA256; full heading sections are shown so unchanged heading bytes cannot hide changed payloads. Also inspect each changed-text block for the authorized navigation/truth correction. Do not reopen unchanged checkpoint units.

Machine sidecar: host-invocation-rebound-accounting.json. It contains full source/previous-target/current-target objects, section payload digests, decisions, original applied notes, every changed unit and complete-file before/after digests. Prior reviewed identities stay auditable. Proof results will be recorded separately in host-invocation-rebound-verification.json and progress.md after the request commit.

## Rebound source decisions

| Claim | Reason | Disposition | Source digest | Target digest |
|---|---|---|---|---|
| claim_4a49679c5f81a5e86ab79f533fcf3470 | authorized content/binding consequence | supersede | 38d7528327830a9c34ca7e47eafe40cba8125b841bde9c3cd41cbd127f462395 | fc32b1b25c89ea4978ab36812b636d62c665da2e38af568a1671921384685156 |
| claim_72b068a205f5bdb963a0c90a64a51038 | authorized content/binding consequence | supersede | ee6cfc9db675fd373ea468c602e95927ded4d5401f644411245dee6d7a53eb92 | 4d84b71de5a938c290f706f618397babc4a704b66e270c7755b57eca1404b6fa |
| claim_af6831310fe9fcdaa7c8e69902e3c767 | committed rework | partial-carry | a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f | fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f |
| claim_d5dd5fbdb3483914743a14791a5f02a8 | committed rework | partial-carry | 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe | e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0 |
| claim_8066684d5e7c7159d6f58caeef26d8cc | committed rework | partial-carry | 4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6 | 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8 |
| claim_9a5781f0086209a17330035ff0e58638 | committed rework | partial-carry | f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c | cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32 |
| claim_a4351841ba59f20ec7938e5b1ea38f66 | authorized content/binding consequence | supersede | eaa7cc7f11d305ec0f0b0c52173193702dd38086c35d32e77269851001695a52 | cf64a5c903ae0225be855f3e70d01ef8e268e7de94d741063cb5afb351ca10c6 |
| claim_37572a9d192f311dd68474b794f87d5e | authorized content/binding consequence | supersede | 149ad5bb28ae20c41f0917491a0a11139b768c15a47372960555002876de7973 | b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d |
| claim_80fe1621540d25e5e4f6968bea7e0a0b | committed rework | partial-carry | 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3 | 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79 |
| claim_76dfcba31d147e73488ea3abeade7ef1 | committed rework | partial-carry | 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224 | a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6 |
| claim_080c5cdacf820ed661ab372086ca7e41 | committed rework | partial-carry | 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35 | f7ec6eee77fd234f5385f260c3d7c567a2759526feb3098baf1619e0cd237621 |
| claim_b4f3b7bbb0174373a63a66c57c4f3078 | committed rework | supersede | 8ab9a5d08768588a2df182c5335647db6e2ca5f25639722119cd7009d2cdfcc0 | caf8f56f95cb4bab4c0d074baf0daae1bfd03c7311387c571d36de1b76d089b2 |
| claim_2f85030181d51c92cbb5dfd094d20956 | committed rework | supersede | f7d94659b67e25dfcd16d65ccb72561343b62d223afedc078e4a53fddea7c335 | 1456e880d651b7d8ccc5886ccbe36f3bdf676a2acb7218541e53162738d531a6 |
| claim_7b3c9cdf89fe70d17f3f526bbdffa385 | committed rework | partial-carry | fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd | 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d |
| claim_04f0605dc840e350f63e53d0e1e96843 | committed rework | partial-carry | e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d | bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf |
| claim_98683c6667ec64317c110eb4fe42da11 | authorized content/binding consequence | move | 1084930371798278160dcbcbd00f50c98b2ae0bbb835aa54e2185cf414701532 | 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52 |
| claim_b74991659ee3db4cb630f607d065ce52 | authorized content/binding consequence | move | 51b636bb97780e8be205e1fce45918f81b4e6e9b40b4a5bd008ce4a9d71cd965 | 7504e7fd27fa2de1f5b1e486ab3e7efff0e956e57f789c7363feeec37b581856 |
| claim_14f599ac6c6af84bcd15a503faaaea03 | authorized content/binding consequence | move | 24e0aa773ffabc724acf02f1b1c6f96aaedfc26582081dd323103b4146ef3621 | 73142a367bf579e3afc2da330169ae1b04b7a9b758a33a9b8be857aca2e85373 |
| claim_6275bba15f3262cd1adb35973216a47d | authorized content/binding consequence | supersede | cb163186599cc01493d0fde6e37f8e026f336650869f14291eb1fb32bbc96e14 | 01b857cc72715357538a05446610509d83d5bf88b54ec3b3b39977ca2a808042 |
| claim_fd246fe0ad796f0ce1f3448b6ad8ec61 | authorized content/binding consequence | supersede | 4db21e2ea3a790fe043ded9006b9c31a127c871c4c77a2c1055d2db137650c60 | 52109204af09107163b441654a44e9de25868552102a993367ad38f66ae6ac6a |
| claim_aec6fb3d8eed3c772ec8bac9808009d3 | authorized content/binding consequence | move | 1b4f6a70d3530daab76986749e1284dac18236ec9de6faada23ff972e155e334 | 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73 |
| claim_4862726f445bfdcba1b58996cf47dfd8 | authorized content/binding consequence | move | a755bd8cd566ed1f0ada74dd6f1a63dc20a8648ba87e1b61510c9784dc216a01 | 2c60584c5c5e535249c603a1e98ede6c6497204f5e1880f44cf3a8fb0ad00a05 |
| claim_d3350f1f59df99f9dfa937d5ea894de4 | authorized content/binding consequence | move | 9cf9fd76cccbf49a0bd485ce613f7cb89676ff9096a727d123e0a7a18d2524c9 | 7d4964d379b1f658632996f0008287e453f8a8cf8fc28fb5cc7b63e59327f96c |
| claim_c072318ec582affe5e0e6936961fadc4 | committed rework | partial-carry | d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f | ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e |
| claim_e960a05c0b656d0dae2cffd3daee5a0d | committed rework | partial-carry | 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c | 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d |
| claim_ac2177776d1a367f2d8e81699b04fc63 | committed rework | partial-carry | 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20 | 18582e9da8d64b7e18ba9e1bc7c3eff5aeb10565960bf94f7fe947bc921a0f07 |
| claim_d4b9b2583e0b4b598a7610af9ced7d36 | authorized content/binding consequence | supersede | c00dc23b0e512e53f33c2adf2c3bf3d0b3809e35b3e0fbe748ab8fd2399477e5 | c67619ba2bc360580b6127bb4b93b9358875e6513207ece712288be415e59496 |
| claim_bb1dcfee5986a94c37e667c75bd3af84 | authorized content/binding consequence | supersede | 9e7bbb0c3bb089181632d8951600128bde3f77e1abd0fe287709719375149abf | 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e |
| claim_ab778e44a43171006f82c08d9939dcf5 | authorized content/binding consequence | move | 2c11291e0dae8db873ecf306d203f0d2daeee2ad5b89e686468faa7d185a77e8 | cbf26e495828da2b590d1d6c244b2cf4cec5fe12f6694b754861a23bb3f8eb72 |
| claim_3c202991304027e73ce867fadfd87175 | authorized content/binding consequence | move | 42627a79ae9e2ad3cdd87a461aedfab3e1a4bc6c1ccb6396b6d62e3811e2dedd | 8fe73175caed647b1eb18bd5241b3974b2614d3b132fb87c0a1a00ec7c2be8d1 |
| claim_fc22ecebfdc6e506475e638d1ba86920 | authorized content/binding consequence | move | e48c44ad1a36f17b9268adb396121d048857e13cdbfe14bfbd40c285a11e66ea | 75e0fe39c2aaa78adefd3e98cf324334eed056be09406e3f4a9dec5da39094bd |
| claim_cbdba798349c777e7f15979d300e0142 | authorized content/binding consequence | move | 7c6a82426019f1aa6755e520878d99ca6e41571b6fbce753322deac3160408c7 | ac492f613b9b733b46f8f0e566ea4f839961ee30f3a1dafd97b61be903af14f7 |
| claim_c245c752125bfa748075cb620216e537 | authorized content/binding consequence | move | 61bbe41eda82d22b8c6104b878d8fb289f0d49b3b61a09a5d0ed7a507e47f087 | 6c81ae046ab7de3a595689c9da4de2d4723ea86247de47d6c82f300c1844203e |

### claim_4a49679c5f81a5e86ab79f533fcf3470

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#migration-status-note

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#historical-migration-status-note

Source unit digest: 38d7528327830a9c34ca7e47eafe40cba8125b841bde9c3cd41cbd127f462395

Target unit digest: fc32b1b25c89ea4978ab36812b636d62c665da2e38af568a1671921384685156

Shown source digest: ba5a14ebbba727fe1ea9e7d2e4687dc9ca48507464d3c1a8750e4cfd89bb64f1

Shown target digest: b2f700961b5562103060d9ca4ea3c91197e3c6b4052350a9b3aa454d60964279

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/external-provider-protocol.md#migration-status-note at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#historical-migration-status-note. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
## Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/external-provider-protocol.md](../../platform/host-invocation-routing/architecture/external-provider-protocol.md),
[contracts/component-protocol.md](../../platform/host-invocation-routing/contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../../platform/host-invocation-routing/contracts/external-provider-manifest.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_72b068a205f5bdb963a0c90a64a51038

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-3

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-9

Source unit digest: ee6cfc9db675fd373ea468c602e95927ded4d5401f644411245dee6d7a53eb92

Target unit digest: 4d84b71de5a938c290f706f618397babc4a704b66e270c7755b57eca1404b6fa

Shown source digest: ee6cfc9db675fd373ea468c602e95927ded4d5401f644411245dee6d7a53eb92

Shown target digest: 4d84b71de5a938c290f706f618397babc4a704b66e270c7755b57eca1404b6fa

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-3 at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-9. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/external-provider-protocol.md](../../platform/host-invocation-routing/architecture/external-provider-protocol.md),
[contracts/component-protocol.md](../../platform/host-invocation-routing/contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../../platform/host-invocation-routing/contracts/external-provider-manifest.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_af6831310fe9fcdaa7c8e69902e3c767

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes

Source unit digest: a180ac1d80159115a4f336ae648d311a92f7b2a09de392544c38273cf1ffa34f

Target unit digest: fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f

Shown source digest: 17f6a67d5a9a11d6b09c39bca307d9c6ef51c15f5e8ff3917b3d4b7440cf9113

Shown target digest: 42a193a17781dcfe117954934184abdbaf0198171bc86d0bc40d473c8f49721c

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#1-component-classes is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-7 (claim_d90840823918415e74ddd353dae32ea3; **Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once m); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-8 (claim_2ce14ab31e5b889ce37c4e99735c69e5; **Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configu); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-10 (claim_95063c4b27e671f29631d4fd68427008; | Component class | Common invocation mechanism | Notes | |---|---|---| | Core component | Built-in after migration; LegacyNode during trans); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-11 (claim_bb84143c32c84b94257bfeb7ca6dacd2; This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 1. Component Classes

Invocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:

```txt
component class    -> who owns/releases/configures the component
invocation mechanism -> how the selected provider is invoked at runtime
```

A `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).

**Core component** — required for a useful fgOS release; owned by fgOS, released atomically with the host, normally statically linked once migrated. Not optional and not replaceable by default; may expose extension points, but a plugin implementing one does not become the authority owner of the core component. Examples: Work Lifecycle, Host Invocation, authority gating, provider routing, DispatchPlan selection, Assignment/Run/RunResult contracts, init/doctor health.

**Packaged extension** — owned and shipped by fgOS but not required for a minimum useful release; may be enabled/disabled/omitted by configuration, edition, or environment. Follows fgOS release discipline, compatibility policy, init/doctor registration, docs, tests. More trustworthy than a user plugin because fgOS ships it, but disabling it must not corrupt core state or block boot. Examples: optional domain packages, optional coordination protocol packs, optional Herdr/dashboard surfaces.

**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim.

| Component class | Common invocation mechanism | Notes |
|---|---|---|
| Core component | Built-in after migration; LegacyNode during transition | Required, fgOS-owned, atomically released. |
| Packaged extension | Built-in, ExternalProcess, or ExternalWasm | fgOS-owned but optional; install/init/doctor aware. |
| User plugin | ExternalProcess or ExternalWasm | User-owned, independently installed; manifest-linked and capability-gated. |

This classification blocks two mistakes: treating every statically linked implementation as architecturally core, and treating every out-of-process implementation as a user plugin. Packaging and authority follow component class; runtime calling details follow invocation mechanism.
`````

Full shown target:

`````md
#### 1. Component Classes

Invocation mechanism describes how an implementation is invoked. It does not describe the product nature, release ownership, or authority posture of the component being invoked — that is a separate axis, **component class**:

```txt
component class    -> who owns/releases/configures the component
invocation mechanism -> how the selected provider is invoked at runtime
```

A `ProviderDescriptor` therefore declares both: component class (core, packaged extension, or user plugin) and invocation mechanism (built-in, legacy node, external process, or external WASM).


Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).



**User plugin** — supplied, installed, upgraded, removed outside the fgOS release train; never assumed present, never compiled into the host. Discovered from manifests, linked into the derived registry, granted only explicit capabilities. May add vendor-scoped operations or implement published extension points; owns no core namespace, authority, init/doctor invariant, or ambient access merely by manifest claim.
`````

### claim_d5dd5fbdb3483914743a14791a5f02a8

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms

Source unit digest: 19bd3465163fc281e12f6ac88d531d651ce0e8329d0485fa4536c107516305fe

Target unit digest: e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0

Shown source digest: b6f0ab966420df63fd317e0cfda12d54cd69755e781f4be6de8627c170b300b2

Shown target digest: 5bf6a77720d3dddf7539bf6cd0e531dcd2b0900345f104811b0d27b0ff1b716f

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#2-invocation-mechanisms is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-class-definitions, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-12 (claim_3f7b5a5b5b1c39251e56f0d232e11ec3; ```rust enum Provider { BuiltIn(Arc<dyn OperationProvider>), ExternalProcess(ProcessRpcClient), ExternalWasm(WasmComponent), } `); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-14 (claim_962d99a375bab41c2063612523bdf348; **Built-In** — a trusted Rust crate statically linked into the host binary, called through the `OperationProvider` trait. No serialization o); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-15 (claim_f2755ef85799b9a6ec4fd4f5d03e9106; **External Process** — an independently installed, language-neutral plugin reached through persistent framed RPC (§3). Fits extensions needi); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-16 (claim_66ce4edf221963b22ad02dbdf872da1c; **External WebAssembly** — a sandboxed plugin reached through a typed component interface such as WIT. Fits pure or tightly capability-scope); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-17 (claim_8948a9c62d80ce2692687f3fcfbaf8ff; Native Rust dynamic libraries are not the default external mechanism: Rust has no stable ABI, and in-process third-party native code loses t). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

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

### claim_8066684d5e7c7159d6f58caeef26d8cc

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol

Source unit digest: 4788de97424c5b1035cf2384d427ef5a7694dfbae3af9c94f73cf5dcf4420ea6

Target unit digest: 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8

Shown source digest: e00860aa411d2755a23483d7b7b865731b7d9b15a05cf5bebe81ae251092ea6f

Shown target digest: 3ba791132af9eaf67f60b6744bc0e259b9d37d3d21535904b621aa841a647deb

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-25 (claim_d1c4102dc6dea3ae86434fb12c0abf71; The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the oper). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 3. Component Protocol

The semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.

For process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.

The host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.

One connection obeys these lifecycle rules:

- request IDs are unique per connection;
- responses may complete out of order only when concurrency greater than one was negotiated;
- requests, frames, and event queues are bounded to provide backpressure;
- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;
- cancellation acknowledgement does not claim semantic side effects were rolled back;
- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;
- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.

The semantic contract stays transport-neutral: a future binary codec or local socket transport may replace framing without renaming the operation.

`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:

```rust
pub struct EncodedMessage {
    pub contract_id: ContractId,
    pub version: ContractVersion,
    pub content_type: ContentType,
    pub bytes: Bytes,
}
```
`````

Full shown target:

`````md
#### 3. Component Protocol

The semantic component protocol is versioned independently from public host protocols — `fgos.component.v1`, distinct from CLI `fgos.v1` and any remote API version. It carries: operation identity and protocol/schema version range; request ID and optional parent/correlation ID; typed request, result, and error payloads; deadline, cancellation, progress, and events where supported; capability context granted by the host; provider identity and diagnostics needed for tracing.

For process plugins, version one uses JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. Newline-delimited JSON is not the contract: a length prefix gives one enforceable maximum-frame boundary and does not make embedded or future formatted content ambiguous. Stdout is protocol only; logs go to stderr or a declared log notification.

The host starts a process only after static manifest selection. Its first exchange confirms provider identity, accepted manifest digest, component protocol range, supported operation/contract pairs, and concurrency limit. Discovery never depends on this handshake; a mismatch terminates the provider and fails closed.

One connection obeys these lifecycle rules:

- request IDs are unique per connection;
- responses may complete out of order only when concurrency greater than one was negotiated;
- requests, frames, and event queues are bounded to provide backpressure;
- cancellation sends a protocol notification, waits a bounded grace period, then terminates the provider process if necessary;
- cancellation acknowledgement does not claim semantic side effects were rolled back;
- a crash after dispatch yields completion-unknown unless the operation's idempotency contract and key explicitly permit retry;
- a one-shot CLI may own one process for its lifetime; a gateway may pool or persist connections under the adapter's health/restart policy.


Added in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).


`EncodedMessage` is the wire representation used only at this boundary — never inside the kernel:

```rust
pub struct EncodedMessage {
    pub contract_id: ContractId,
    pub version: ContractVersion,
    pub content_type: ContentType,
    pub bytes: Bytes,
}
```
`````

### claim_9a5781f0086209a17330035ff0e58638

Source: docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker

Source unit digest: f26fe2980e00f599ee3395a67dd57972d0ef8371bf0219fde39bb7f44b353a4c

Target unit digest: cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32

Shown source digest: 3e12e34592d1f9d6d8caeffbe19285ba3702c0cec17022da7ad34394bdcd9b6a

Shown target digest: 1f365ce98f1e852910b0c7b298411a7752063fb6faf2ef047bcb22f97016d7e8

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker at docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker is retained verbatim at docs/platform/host-invocation-routing/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-32 (claim_08172f75766eb1d002d4cba2669f9bbd; The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; veri); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-33 (claim_7e15be77fb7c4bff223728491df3e212; Its complete input/output physics:); docs/architect/host-invocation-routing/external-provider-protocol.md#unheaded-block-34 (claim_0f401249972ad0ce465e24e0932a2834; ```txt authored OperationCatalog + built-in provider descriptors + transitional CLI-compatibility bindings + validated external manifest dec). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 4. Plugin Registry Linker

External discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.

A `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.

`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.

**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.

The registry linker: scans configured global and project plugin locations; parses and validates manifests without running the provider; verifies compatibility, provider presence, and integrity policy; resolves IDs, namespace claims, precedence, and explicit replacements; emits a deterministic derived lock/cache for help, introspection, dispatch, init, and doctor; starts a selected provider and uses `describe` only to confirm it matches the accepted manifest.

Its complete input/output physics:

```txt
authored OperationCatalog
+ built-in provider descriptors
+ transitional CLI-compatibility bindings
+ validated external manifest declarations
+ explicit global/project enable-disable-replacement policy
  -> immutable RegistrySnapshot + source fingerprint
```

Authored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.

Project configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers.
`````

Full shown target:

`````md
#### 4. Plugin Registry Linker

External discovery is data-first: the host scans a static manifest and never executes unknown provider code merely to discover what it claims.

A `manifest.yaml` provider declaration declares at least: plugin ID, version, publisher, and component protocol range; provided `OperationId` values or named extension points; request/result schema references; invocation mechanism and executable/module location; requested host capabilities; platform compatibility and integrity metadata; health and post-selection `describe` operations.

`manifest.yaml` is the one canonical filename for authored, static provider declarations. Its `kind` field distinguishes the declaration shape (`fgos.component`, `fgos.plugin`, `fgos.domain`, ...); every kind shares `manifestVersion`, `id`, `version`, `provides`, `requires`, `capabilities` before kind-specific fields are validated.

**Registry** names only the host's derived runtime index (and its lock/cache), never another authored file. Discovery scans `manifest.yaml`, validates by `kind`, then links accepted claims into the provider registry.


Added in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).




Authored catalogs, manifests, and policy are durable inputs; the linked registry lock/cache is rebuildable derived state — it records host version and source fingerprint, is replaced atomically, and is ignored/rebuilt when stale or corrupt. A cache never outranks its authored sources. This is a compiler only in the linking/validation sense; it does not compile plugin source or the `fgos` host binary.

Project configuration overrides global configuration values, but duplicate operation claims do not silently use last-writer-wins — override precedence is not authority precedence. Ambiguity fails closed unless an explicit replacement policy names both the selected provider and the provider being replaced. Configuration can never replace a **built-in** provider (see the kernel contract's Authority section); a replacement policy only ever governs the external/plugin surface this linker discovers.
`````

### claim_a4351841ba59f20ec7938e5b1ea38f66

Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#migration-status-note

Target: docs/platform/host-invocation-routing/spec.md#historical-migration-status-note

Source unit digest: eaa7cc7f11d305ec0f0b0c52173193702dd38086c35d32e77269851001695a52

Target unit digest: cf64a5c903ae0225be855f3e70d01ef8e268e7de94d741063cb5afb351ca10c6

Shown source digest: 0ba39a0a29f253a7656e9b1584bd3446f8c92dbf7c5ca320264b5e26b84c5994

Shown target digest: 27802c28adbb91c3aa65fe5387b8fdd46c85f855b9b04741fe6af5f601179364

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#migration-status-note at docs/platform/host-invocation-routing/spec.md#historical-migration-status-note. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
## Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform entry is
[docs/platform/host-invocation-routing/README.md](../../platform/host-invocation-routing/README.md).
Its details are split across
[vision.md](../../platform/host-invocation-routing/vision.md),
[invocation-kernel.md](../../platform/host-invocation-routing/architecture/invocation-kernel.md),
[host-use-cases.md](../../platform/host-invocation-routing/architecture/host-use-cases.md),
[provider-routing.md](../../platform/host-invocation-routing/architecture/provider-routing.md),
and [contracts/](../../platform/host-invocation-routing/contracts/README.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_37572a9d192f311dd68474b794f87d5e

Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-3

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-17

Source unit digest: 149ad5bb28ae20c41f0917491a0a11139b768c15a47372960555002876de7973

Target unit digest: b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d

Shown source digest: 149ad5bb28ae20c41f0917491a0a11139b768c15a47372960555002876de7973

Shown target digest: b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-3 at docs/platform/host-invocation-routing/spec.md#unheaded-block-17. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform entry is
[docs/platform/host-invocation-routing/README.md](../../platform/host-invocation-routing/README.md).
Its details are split across
[vision.md](../../platform/host-invocation-routing/vision.md),
[invocation-kernel.md](../../platform/host-invocation-routing/architecture/invocation-kernel.md),
[host-use-cases.md](../../platform/host-invocation-routing/architecture/host-use-cases.md),
[provider-routing.md](../../platform/host-invocation-routing/architecture/provider-routing.md),
and [contracts/](../../platform/host-invocation-routing/contracts/README.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_80fe1621540d25e5e4f6968bea7e0a0b

Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts

Target: docs/platform/host-invocation-routing/spec.md#5-core-contracts

Source unit digest: 5e7c2c60dfed54dc9ebb433881669fc2e31db27fbf1cf90aef988969b14fd6e3

Target unit digest: 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79

Shown source digest: b1c43ef644d65580bf8085a4675e1fa94cb8f82073b03ee446b63852847ded9e

Shown target digest: 53951aa9dea55fb4b972f798979581ca3b6b1fb515a6b596996ab44e27928f8e

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts at docs/platform/host-invocation-routing/spec.md#5-core-contracts; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-24 (claim_bbaec409dcbaee8f33968727aa0abed5; **Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range ). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 5. Core Contracts

The name table (§3) says what each type is; this adds the rules it has no room for.

**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).

**`HostInvocation`** — host kind is an **open string** (`"cli" | "remote" | "chat"`, not a closed enum every future host must exist in R1).

**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.

**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](./external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.

**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.

**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`"builtin" | "legacy-node" | "external-process" | "wasm"`), not a closed enum. `"legacy-node"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](./legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.

**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).

**Contract versioning:** request/outcome contracts version independently; linking picks one exact version pair from the host/provider range intersection — no runtime "best effort" coercion. An incompatible change gets a new operation variant or major contract version per the owning component's policy; adapters may perform an explicit registered upgrade/downgrade transform, recorded in diagnostics — the router never reshapes payloads implicitly.
`````

Full shown target:

`````md
#### 5. Core Contracts

The name table (§3) says what each type is; this adds the rules it has no room for.

**`OperationId`** — `<component>.<object-type>.<action>[.<variant>]`. `<component>` owns authority; `<object-type>` is singular (`work.item.list` still names `WorkItem`); `<action>` is a small verb set (`create`, `submit`, `show`, `claim`, `approve`, `run`, ...). E.g. `work.item.submit`, `distribution.build.show`. Each host owns its own projection — CLI verbs, REST paths, MCP names, chat intents are not `OperationId`s unless explicitly mapped; REST may keep plural URLs (`GET /work-items` -> `work.item.list`). Not suffixed for a compatible field addition (see versioning below).

**`HostInvocation`** — host kind is an **open string** (`"cli" | "remote" | "chat"`, not a closed enum every future host must exist in R1).

**`OperationRequest`** = `{ operation: OperationId, contract: ContractRef, input: Box<dyn Any + Send> }` — typed per contract; a built-in downcasts `input` directly, never through a decode step.

**No serialization for built-in providers** — the semantic contract is schema + version (`ContractRef`), but in-process representation is typed Rust through `OperationProvider`. `EncodedMessage` (contract id, version, content type, bytes) exists only at the external-process/WASM boundary ([External Provider Protocol](architecture/external-provider-protocol.md)), never as a kernel type. Raw `OsString` argv is never a semantic `OperationRequest` — it stays inside the CLI adapter's transitional lane.

**`ProviderOutcome`** — not a nested `fgos.v1` envelope or HTTP response; the presenter owns public projection; diagnostics travel through the trace/evidence sink, never silently on compatibility stdout/stderr. Human-in-the-loop rule: §8.

**`ProviderDescriptor` / `ConfigPort`** — `lifecycle` is `singleton | per-invocation | pooled`. Invocation mechanism is an **open string** (`"builtin" | "legacy-node" | "external-process" | "wasm"`), not a closed enum. `"legacy-node"` names `LegacySemanticProvider`: a normal `OperationProvider` whose implementation still calls an extracted Node use case, introduced per operation only when a non-CLI host needs it before the native provider exists ([Legacy CLI Transition](architecture/legacy-cli-transition.md) §1) — distinct from the CLI adapter's exec lane, which is not a provider at all. A provider receives resolved config/context through `ConfigPort` and never reads a second global config file itself.

**`OperationDescriptor` / `OperationCatalog`** — authored by owning components, never inferred from CLI commands or provider manifests. Fields: operation id, owning component id, request/outcome contracts, effect (`read | write | external`), idempotency (`none | keyed | safe`), authority policy id, allowed host kinds, streaming mode. The CLI command registry stays authority for CLI help/grammar and maps selectors into catalogued operations; a registry entry alone cannot create an operation. **R1 simplicity:** one native operation (`distribution.build.show`), so `OperationCatalog` is a `const` array and `RegistrySnapshot` is assembled once at the host's composition root (`apps/fgos`) from const tables via a pure `build_snapshot(catalog, providers, fingerprint)` — the kernel crate never depends on a provider crate, and there is no catalog system, linker, cache, or manifest scan in R1 (§10).


Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).
`````

### claim_76dfcba31d147e73488ea3abeade7ef1

Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input

Target: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input

Source unit digest: 7a639345a5670ebb3cd24fd27a72fb08467d57f4667517fbd47f51d35b9bb224

Target unit digest: a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6

Shown source digest: 951646b9243255d9701a0e0be217e3aa26374e188bd97443a259c42c15aed497

Shown target digest: b159d8491b6b9f59b03f0c788d08792b07f64712db0a7c19c9799c2402e9f182

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input at docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te, docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-41 (claim_75c780a31188a0fa1e19d03ccbd3b6b1; ```txt received -> admitted | admission-refused -> selected | selection-refused -> granted | grant-refused -> dis); docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-43 (claim_e365a92a236aa909b9148185aa8f0801; For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never i). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 8. Failure, Cancellation, Lifecycle, And Human Input

Closed failure families, common across every invocation mechanism:

- semantic validation, precondition, conflict, not-found;
- caller admission denied, selected-provider capability denied;
- no binding, ambiguous binding, incompatible contract;
- provider unavailable, protocol violation, provider crash;
- deadline exceeded, caller cancelled, completion unknown.

Each host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.

```txt
received -> admitted | admission-refused
         -> selected | selection-refused
         -> granted | grant-refused
         -> dispatched
         -> succeeded | semantic-failed | cancelled | deadline-exceeded
                       | provider-failed | completion-unknown
```

Exactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.

For idempotency-keyed operations the key lives in the owning operation contract and is stable across an authorized retry; the router never invents one. Read-only does not imply retry-safe when the provider has external effects — the catalog's declared idempotency decides.

**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input.
`````

Full shown target:

`````md
#### 8. Failure, Cancellation, Lifecycle, And Human Input

Closed failure families, common across every invocation mechanism:

- semantic validation, precondition, conflict, not-found;
- caller admission denied, selected-provider capability denied;
- no binding, ambiguous binding, incompatible contract;
- provider unavailable, protocol violation, provider crash;
- deadline exceeded, caller cancelled, completion unknown.

Each host presenter maps these onto its own contract (`fgos.v1`/exit codes, REST/MCP response, chat result); `InvocationService` preserves invocation/provider IDs so projections correlate without scraping output. Transport adapters never turn a provider crash into a semantic failure or infer success from partial output. A remote disconnect cancels through the same invocation context as a CLI interrupt; a crash never authorizes an automatic replay of a non-idempotent operation. The provider port is asynchronous from v1 — deadlines, cancellation, progress, and backpressure are already runtime requirements, so deferring async would change the ABI at the first real remote/process integration.


Added in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).


Exactly one terminal record is emitted; `dispatched` is the point after which a transport loss may be completion-unknown, and a late response after cancellation/deadline is diagnostic evidence, not a second terminal truth. Records carry invocation/parent-correlation ID, contract versions, registry fingerprint, provider ID, host kind, timing, terminal family, evidence references — never secrets or capability material.


Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).


**Human input:** a provider never blocks waiting for a person. It returns a `parked` `ProviderOutcome`; the host or work lifecycle re-invokes later. No provider is ever given a mid-invocation callback to solicit input.
`````

### claim_080c5cdacf820ed661ab372086ca7e41

Source: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement

Target: docs/platform/host-invocation-routing/spec.md#9-physical-placement

Source unit digest: 26dedcce46fdb8fba749ce8ecb56418bbc45624ad00c28a2a355647221c73a35

Target unit digest: f7ec6eee77fd234f5385f260c3d7c567a2759526feb3098baf1619e0cd237621

Shown source digest: 093b7b0f90e9d550eb7b643c9a664edff38860c053b99b3cdb7d1df8443a8ef0

Shown target digest: f2af1b5c32b86de66fc5ef1a095b3efb7f20fef17f5a7fbeae32b65d2c65080b

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement at docs/platform/host-invocation-routing/spec.md#9-physical-placement; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/host-invocation-provider-routing.md#unheaded-block-46 (claim_54536d1078dc6a2b6eacd17105389f2b; ```txt Cargo.toml # workspace root; herdr-plugin/ excluded in R1 apps/ fgos/ # crat). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 9. Physical Placement

The public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.

```txt
Cargo.toml                           # workspace root; herdr-plugin/ excluded in R1
apps/
  fgos/                              # crate `fgos`, binary `fgos` — thin CLI adapter
    src/cli_projector.rs             # argv -> OperationRequest
    src/cli_presenter.rs             # ProviderOutcome -> fgos.v1 / exit code
    src/legacy_exec.rs               # CommandRouteDescriptor lookup + Node payload exec
  gateway/                           # later: thin REST/MCP/remote adapter (repo-layout-vision)

packages/
  host-runtime/rust/                 # crate `fgos-host-runtime` — the kernel
    src/contracts.rs                 # OperationId, HostInvocation, OperationRequest, ProviderOutcome, ...
    src/operation_provider_router.rs
    src/invocation_service.rs
    src/authority_gate.rs
    src/providers/builtin.rs
    src/remote_host_use_case.rs      # R3
    src/chat_host_use_case.rs        # later
    src/registry_linker.rs           # R2
    src/providers/{external_process,external_wasm}.rs   # R2+
  distribution/rust/                 # crate `fgos-distribution` — owns distribution.build.show
  component-protocol/{rust,node}/    # R2: EncodedMessage, framed protocol

bin/fgos.mjs, src/, scripts/, core/ ...   # the Node payload, unmoved (Legacy CLI Transition §2)
```

R1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).

Distribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md).
`````

Full shown target:

`````md
#### 9. Physical Placement

The public command name stays `fgos` — runtime identity is the release digest, not the name, and every skill, hook, plugin, and Herdr call already targets `fgos <verb>`. `fgctl` is a separate bootstrap binary, not a renamed `fgos`. Crate names are kebab-case with an `fgos-` prefix; modules are snake_case.


Added in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).


R1 is three crates: `fgos`, `fgos-host-runtime`, `fgos-distribution`. The legacy exec lane is a module inside `apps/fgos`, not a crate, because it is CLI-adapter-local (§4). `component-protocol` waits for R2 (only an external-process adapter needs `EncodedMessage`). Extract further crates only when pressure is real. Neither app owns provider selection; neither host use case imports another; every host feeds the shared authority/router/contracts layer, and provider adapters depend on component protocols, not host presentation. A component is not created merely because one proof verb is convenient (`gate-bypass` stays under its settled authority, not a manufactured `gate-policy` component).

Distribution selects and activates the trusted runtime (`fgctl`: acquire/stage/verify/activate/upgrade/rollback); host invocation routes inside the activated runtime. Packaging-distribution owns the onboarding command vocabulary: local `fgos init` adopts a workspace under the active identity on first use, `fgos doctor --fix` performs every later registered repair, and the target architecture has no separate `setup` verb. See [Runtime Identity And Activation](../../architect/packaging-distribution/runtime-identity-and-activation.md).
`````

### claim_b4f3b7bbb0174373a63a66c57c4f3078

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#migration-status-note

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#historical-migration-status-note

Source unit digest: 8ab9a5d08768588a2df182c5335647db6e2ca5f25639722119cd7009d2cdfcc0

Target unit digest: caf8f56f95cb4bab4c0d074baf0daae1bfd03c7311387c571d36de1b76d089b2

Shown source digest: c80064ff9a65a2cd371d250c0657966d323d67d90c87b2d176c88a98640d0ed8

Shown target digest: 2c5fed878b4304455e30f9fc484c576ceb118c971a74d80135a88b68b7cf1e22

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/legacy-cli-transition.md#migration-status-note at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#historical-migration-status-note. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
## Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/legacy-cli-transition.md](../../platform/host-invocation-routing/architecture/legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../../platform/host-invocation-routing/contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../../platform/host-invocation-routing/contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../../platform/host-invocation-routing/verification/compatibility-harness.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_2f85030181d51c92cbb5dfd094d20956

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-3

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-9

Source unit digest: f7d94659b67e25dfcd16d65ccb72561343b62d223afedc078e4a53fddea7c335

Target unit digest: 1456e880d651b7d8ccc5886ccbe36f3bdf676a2acb7218541e53162738d531a6

Shown source digest: f7d94659b67e25dfcd16d65ccb72561343b62d223afedc078e4a53fddea7c335

Shown target digest: 1456e880d651b7d8ccc5886ccbe36f3bdf676a2acb7218541e53162738d531a6

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-3 at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-9. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/legacy-cli-transition.md](../../platform/host-invocation-routing/architecture/legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../../platform/host-invocation-routing/contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../../platform/host-invocation-routing/contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../../platform/host-invocation-routing/verification/compatibility-harness.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_7b3c9cdf89fe70d17f3f526bbdffa385

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters

Source unit digest: fee7e29c8f6886025098180b705008f43d5a3198943485c0256f5645b9cdc0fd

Target unit digest: 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d

Shown source digest: 88585116a348df1316f6ea160ee9877a719f18ad1214eeb95a2e9a19c2451b75

Shown target digest: 4e1b25930ec0c9491441481f1fef20b49fad95022f05f1b03df52c86c8616497

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-8 (claim_7046eb56f67c02ef82f621a3fa30286c; Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a compone). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 1. Two Distinct Adapters

Node transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.

**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.

**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is "legacy" only in that its implementation still calls into Node.

Capturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.

Both adapters delegate a complete use case. A host must not split one state transaction between native and legacy providers unless a component contract already defines locking, atomicity, recovery, and authority at that boundary.

The adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess.
`````

Full shown target:

`````md
#### 1. Two Distinct Adapters

Node transition needs two adapters with different contracts. Treating them as one provider would create the false impression that captured CLI output is a semantic result.

**`LegacyCliPassthroughProvider`** — CLI-only. Receives preserved `OsString` argv, inherited stdin, cwd/environment, and signal context; returns pre-rendered stdout/stderr bytes plus process exit/signal termination. It never returns `ProviderOutcome` and is never reachable from remote or chat hosts. This is the only adapter most legacy commands need: the CLI adapter looks up `CommandRouteDescriptor[selector]`, and for `route_kind == legacy-cli` execs the Node payload directly (argv preserved, signal forwarding) and writes one invocation record through the shared recorder — without ever building an `OperationRequest` or calling `InvocationService`/Router.

**`LegacySemanticProvider`** — receives and returns real versioned semantic contracts (`OperationRequest`/`ProviderOutcome`). Its Node bridge calls an extracted Node use case directly, never `bin/fgos.mjs` and never an envelope parser. It can serve any admitted host and is introduced per operation only when a non-CLI host needs Node behavior before the native provider exists. Unlike the passthrough, this adapter *is* a normal `OperationProvider` participant in the kernel pipeline (admit -> select -> grant -> invoke -> normalize -> record) — it is "legacy" only in that its implementation still calls into Node.

Capturing stdout/stderr in a supervised child improves CLI cancellation and tracing but remains passthrough presentation; it never becomes the bridge used by a remote host.


Added in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).


The adapters resolve the legacy payload relative to the installed host, never from the caller's cwd, and invoke the Node entry/bridge directly rather than spawning `fgos` recursively. The CLI parent forwards termination consistently; Unix signal equivalence and Windows process-tree behavior are explicit target-specific compatibility tests, not an undocumented `exit.code()` guess.
`````

### claim_04f0605dc840e350f63e53d0e1e96843

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path

Source unit digest: e9f472117d68d8c826f9f9b15946883a24addeedf3c298765032fc081f37cb2d

Target unit digest: bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf

Shown source digest: 41b6cb4e5f5180599a153f345377dc8f90d4ebd36ed3bec5eac383bbda401c68

Shown target digest: 52684b7c86346bee3177b682092ff0b1143576a50094168a4f101e74c593c04c

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path at docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path is retained verbatim at docs/platform/host-invocation-routing/architecture/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/legacy-cli-transition.md#unheaded-block-14 (claim_6a37273a0a45d24c53e344928c3edf22; `package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` ). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 2. Legacy Payload Identity, Ownership, And Repair Path

Three things are separated that the name `bin/fgos.mjs` currently conflates:

| | Today | After R1 |
|---|---|---|
| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |
| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |
| File location | `bin/fgos.mjs` at the repo root | unchanged |

**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as "legacy"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.

The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"`; a staged release declares `root: "libexec/legacy-node"`, `entries.fgos: "bin/fgos"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md) §5).

`package.json` `bin.fgos` is removed (or pointed at the workspace shim) when the Rust host becomes the installed default; `bin.fgos-runner` stays until the runner migrates. A header in `bin/fgos.mjs` and the root `AGENTS.md` state the ownership rule for editors already at that path.

**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of "where is `fgos`?": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new("node")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.

Every selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:

```txt
selector               # canonical command/subcommand selector
route_kind             # legacy-cli | native
operation_id           # required only for native semantic routing
legacy_payload         # required only for legacy-cli; named payload identity
owner_path             # canonical implementation boundary to edit
compatibility_tests    # named parity/vector suites required for a repair
```

`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.

The descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.

**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no "roll back by changing provider selection" mechanism; none is promised anywhere in this stack.
`````

Full shown target:

`````md
#### 2. Legacy Payload Identity, Ownership, And Repair Path

Three things are separated that the name `bin/fgos.mjs` currently conflates:

| | Today | After R1 |
|---|---|---|
| Public name people type | `fgos` → Node | `fgos` → Rust host (workspace shim / PATH) |
| Payload identity the Rust host execs | none | `legacy-node` — the release manifest's `components.legacyNode` and the `legacy_payload` field of every `legacy-cli` `CommandRouteDescriptor` |
| File location | `bin/fgos.mjs` at the repo root | unchanged |

**The Node program is not relocated and not renamed in the source tree** (decided 2026-09-10). `bin/fgos.mjs` computes its package root from its own file location and imports `../src/...` relatively, so moving the entry alone breaks it, and moving the whole Node package would decide the Node-side repo layout that [Repo Layout Vision](../../../architect/component-boundary/repo-layout-vision.md) §7 deliberately defers (and would mislabel `src/state`, `src/runner` — which `fgos-runner` keeps using — as "legacy"). The payload is therefore the current npm package exactly as `package.json` `files` defines it, staged whole by the release builder under the manifest's `components.legacyNode.root` (`libexec/legacy-node/` in a staged release) with the same relative layout as the source tree — zero import changes, `bin/fgos.mjs` and `bin/fgos-runner.mjs` both inside it. The identity is renamed (`legacy-node`), the file is not; a filesystem rename happens only when the payload is deleted.

The public `fgos` executable is the platform Rust host. It resolves the legacy payload as `join(activeReleasePath, components.legacyNode.root, components.legacyNode.entry)` read from the activation binding's manifest — never from `PATH`, never from the caller's cwd, never as an alternate package-manager `bin` entry, and never hardcoded. A `dev:<rev>` source activation declares `root: "."`, `entry: "bin/fgos.mjs"`, `entries.fgos: "target/release/fgos"`; a staged release declares `root: "libexec/legacy-node"`, `entries.fgos: "bin/fgos"`. One mechanism serves dogfood and production ([Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md) §5).

Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.

Added in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).


**Callers of the old path.** A grep for `bin/fgos.mjs` finds ~150 hits; only ~9 are real call sites, all of them variants of "where is `fgos`?": the shell function's tier-1 (`scripts/fgos-shell-integration.sh`), Herdr's three `Command::new("node")` sites (`fgos.rs`, `gateway.rs`, `main.rs`), the dispatch CLI path (`src/runner/dispatch/cli.mjs`), the iron-law footprint matcher (`src/evolve/iron-law.mjs`), the doctor reachability check (`src/setup/registrations.mjs`), the plugin-skill fallback (`core/skills/_shared/fgos-cli-fallback.md` — the single source the ~20 `.agents`/`plugins` copies render from), and `package.json` `bin`. The fix is not a substitution: add one **tier 0 = workspace shim `.fgos/installation/bin/fgos`** to the single resolver each runtime already has (`src/setup/bin-discovery.mjs` for Node, the shell function for shells, one `resolve_fgos` for Herdr) and make the nine sites use it, with the old `node bin/fgos.mjs` path kept only as the fallback for a project that has not run `fgctl init`. The ~75 Node tests that spawn `bin/fgos.mjs` directly stay as they are — they test the Node payload's behavior with the Node payload. Comments are not callers.

Every selector has exactly one generated `CommandRouteDescriptor`, derived from the Node command registry plus checked migration annotations. Its minimum fields:

```txt
selector               # canonical command/subcommand selector
route_kind             # legacy-cli | native
operation_id           # required only for native semantic routing
legacy_payload         # required only for legacy-cli; named payload identity
owner_path             # canonical implementation boundary to edit
compatibility_tests    # named parity/vector suites required for a repair
```

`legacy-cli` means the Node payload owns argument parsing and behavior; the Rust host must only recognize the checked selector and preserve the remaining `OsString` argv. `native` means the typed provider owns the operation and the legacy implementation is retained only as an explicitly bounded rollback oracle. A descriptor may not name both paths as active, and an unlisted selector fails the build rather than choosing a fallback.

The descriptor is both the routing input and the contributor repair map. A repository-local `scripts/explain-command-route.mjs <selector>` reads the same checked artifact and prints route kind, owner path, payload identity, and required compatibility suites. CI rejects a descriptor whose owner or required proof is missing, drift between the Node registry and descriptor, a direct production spawn of the private payload outside `LegacyCliPassthroughProvider` (test fixtures excepted), or a legacy payload removal before its compatibility binding is removed.

**Rollback:** configuration can never replace a built-in provider (kernel contract §7), and there is no runtime provider-selection swap to roll back a native operation. Rollback of a native operation in R1–R2 is a **release rollback through `fgctl`** — the previous release still ships both the native provider and the Node payload during the observation window. There is no "roll back by changing provider selection" mechanism; none is promised anywhere in this stack.
`````

### claim_98683c6667ec64317c110eb4fe42da11

Source: docs/architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Source unit digest: 1084930371798278160dcbcbd00f50c98b2ae0bbb835aa54e2185cf414701532

Target unit digest: 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52

Shown source digest: bcf292ee51ddeaaf56aeae73786dc7778f196a912de09a8ac0aebd1b6faab822

Shown target digest: c26fb83382f85291223d66aac01159d5e3a25ddc98662ca8ac22bb2904d33881

Rationale: Move the complete direct heading unit "## 3. Command Metadata And Parser Ownership" from docs/architect/host-invocation-routing/legacy-cli-transition.md#3-command-metadata-and-parser-ownership to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

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

Shown source digest: b920259d79b6e810e9d375d461a991662ec2a2f058673e47388d1a287dfbbd2f

Shown target digest: 54fc03c248c40df62301221aed559f98f3e2ceadbacdb6ceabec35177eb06177

Rationale: Move the complete direct heading unit "## 5. Rust Host First: Benefit And Cost" from docs/architect/host-invocation-routing/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost to its frozen mapped owner docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

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

Shown source digest: 617c7d667c482e1f25d15822f67b7575817d743ef446976b55b133c828493455

Shown target digest: 2999c52b74cf6b2918eb84e1411f7db4ebc71e7418684b59e856af9de455b409

Rationale: Move the complete direct heading unit "# Node To Rust Component Migration" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#node-to-rust-component-migration to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

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


#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.

#### 1. Migration Question

The current harness is mostly Node and `bin/fgos.mjs` still combines entry,
dispatch, use-case orchestration, and policy. The system cannot move to Rust in
one rebuild.

The migration question is:

```txt
How can Rust become the permanent fgos host first while every existing Node
operation keeps working until its complete component boundary is ready to move?
```

The migration must preserve current commands, `fgos.v1`, errors, state
authority, install behavior, and rollback until each replacement is proven.

It must also preserve a visible repair path: an unmigrated selector remains
owned by the Node payload — identity `legacy-node`, the npm package as
`package.json` `files` defines it, unmoved in the source tree and staged whole
under the release manifest's `components.legacyNode.root` — so `bin/fgos.mjs`
is a file inside that payload, no longer a public name. The generated command-route
descriptor tells a contributor whether a selector is `legacy-cli` or `native`,
its owner path, and its required compatibility tests. A selector cannot be
made native merely by changing a Rust parser; its descriptor and complete
provider binding change together.

#### 2. Options Considered

##### Option A: Thin The Entire Node Host First


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



##### Option B: Rust Host First, Node As Legacy Provider

```txt
thin Rust host/router
  -> CLI adapter execs every unmigrated selector straight to the Node payload
  -> move one complete operation/component to native Rust
  -> remove its Node path after proof
```

This establishes the permanent composition root first. It keeps the initial
Rust change narrow without making a disposable wrapper. R1 already has the CLI
adapter's legacy-cli exec lane and the kernel's native-selector shape that can
survive a long migration; boundary extraction still happens only when a
component is actually migrated. See
[Legacy CLI Transition](legacy-cli-transition.md) for the exec mechanics.

##### Option C: Big-Bang Rust Rewrite


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



##### Selected Option

Option B is selected. The first Rust release is an intentionally small,
distributable host/router; the CLI adapter execs every unmigrated selector
straight to the Node payload by default, not an immediate rewrite of all Node
semantics.


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).




#### 4. Current Migration Readiness

The current CLI thinness is an ordering signal, not a prerequisite to refactor
all Node code first.

##### Near-Thin Candidates

- `version` already delegates to version resolution.
- `review`, `approve`, `reject`, `catchup`, `sync-root`, and
  `promote-to-component` delegate substantial behavior to
  `src/verbs/merge/*`.
- `gateway start|stop|status` delegates to gateway lifecycle control.
- `session start|end|list|gc` mostly delegates to the session component.
- `triage` delegates to impact ranking.
- `goal` mostly delegates to focus/set/show functions.

These need less boundary extraction, but risk and authority still determine
their order.

##### Partly Thin Candidates

- `submit` still composes title derivation, ID generation, defaults, domain
  entry, acceptance parsing, and add.
- `discover` still owns verdict parsing, stage/domain preconditions, config,
  and classification patching.
- `plan` still owns validation branching, stage checks, verdict parsing, and
  child parsing.
- `init` and `doctor` still compose rc wiring, hooks, defaults, fixes, checks,
  and presentation.
- `check`, `rollup`, and `evolve` still compose their read models and output.

Their migration slice must first isolate a complete use case. That happens per
component rather than in one repository-wide Node-thinning phase.

##### Not-Thin Candidates

- `take`, `pick`, and `return` combine pull-door policy, git/worktree behavior,
  verification, claims, and advisory checks.
- `move` owns multiple lifecycle guards and decision logging.
- `add` and `edit` own substantial parsing, normalization, and validation.
- `uninstall`, `preflight`, `unlock`, `main-checkout-reset`, and
  `resync-worktree` mix host/system policy with control flow.
- knowledge, documentation, and registry verbs still combine reporting and
  orchestration in the CLI switch.

These remain whole legacy operations until their transaction and authority
boundaries can move together.

#### 5. Release R1: Distributable Rust CLI Host

R1 is the smallest honest meaning of “ship the Rust host”. It is not merely a
binary that passes repository tests. The installed product entry becomes Rust,
all unmigrated CLI selectors retain transparent whole-invocation Node
compatibility, `fgos-runner` remains a separately proven Node public entry, and
`version` proves one typed built-in operation.

The migration order is:

1. adopt the packaging stream's settled install/activation/rollback contract
   (`fgctl` + release store + workspace activation binding; see
   [Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md)
   §11–§13); confirm the supported target matrix;
2. name the Node payload `legacy-node` in the release manifest
   (`components.legacyNode.root`/`entry`) without moving or renaming any file;
   add the ownership header to `bin/fgos.mjs` and the root `AGENTS.md` note;
3. freeze executable Node compatibility evidence and the checked command-route
   descriptor, including the owner and test suite for every selector;
4. land the Rust invocation kernel with immutable static bindings and the
   two-stage authority path;
5. wire the CLI adapter to read the checked `CommandRouteDescriptor` for every
   current selector: a `legacy-cli` selector execs straight to the Node
   payload with argv preserved, never entering `InvocationService`; only a
   `native` selector builds an `OperationRequest`. See
   [Legacy CLI Transition](legacy-cli-transition.md);
6. migrate `version` to native `distribution.build.show`;
7. prove the install/activation/rollback contract through `fgctl init` on an
   external temp project from a staged release, followed by the active
   runtime's `fgos init` → `doctor --fix` → `doctor`, on every supported
   target;
8. flip the installed default only after the compatibility and distribution
   gates pass.

External-process discovery, WASM, chat, and production gateway adoption do not
block R1. They prove later parts of the permanent architecture without delaying
the first usable release.

Exit condition: every existing CLI invocation still reaches Node unchanged (via
the CLI adapter's legacy-cli exec lane) or an explicitly native provider,
`version` creates no Node process, and the proof runs through `fgctl init` on
an external temp project from a staged release, followed by the active
runtime's `fgos init` → `doctor --fix` → `doctor`, with the previous release
remaining a named rollback channel through `fgctl`. For every legacy selector,
`explain-command-route` identifies the canonical Node owner and required
parity suite; no contributor must infer ownership from a stale `bin/fgos.mjs`
reference. The activated Rust host, legacy payload, and Node runner always
come from one versioned release artifact; no release mixes them across
versions.

#### 6. Release R2: External Process Provider Preview

R2 proves runtime extension after R1 has established the host. The framed
protocol, discovery manifest shape, and process adapter contract live in
[External Provider Protocol](external-provider-protocol.md); this section
only orders the migration proof.

1. freeze the framed component protocol and conformance fixtures;
2. implement bounded process supervision, handshake, cancellation, crash and
   completion-unknown behavior;
3. validate a static test/dev manifest without executing it during discovery;
4. invoke one vendor-scoped fixture operation through the same router;
5. expose provider/registry diagnostics through an explicit diagnostics
   surface, never compatibility output.

Full marketplace/signature policy, core replacement, WASM, and broad
project/global discovery UX remain separate ecosystem work. R2 exits when the
process adapter and protocol are real and fail closed, not when every future
plugin product concern is solved.

#### 7. Release R3: Production Remote Host

Adopt the common invocation service route by route:

1. inventory current gateway routes by semantic operation and side effect;
2. replace `VerbGateway` for one native read with a remote projector and
   presenter calling the shared invocation service;
3. keep REST/MCP authentication and transport presentation in the gateway;
4. for a route that must remain on Node, build a real per-operation Node
   semantic bridge or leave that route on the old chokepoint during its named
   rollback window;
5. never parse `fgos.v1` or captured CLI stdout as the remote internal API;
6. delete the CLI-shelling chokepoint after no route uses it.

Captured/supervised legacy CLI output is not a semantic provider outcome and
cannot serve this stage. This stage gets a separate blast-radius review because
the current Herdr crate combines gateway, TUI, Axum, MCP, auth, and web concerns.

The production remote host in R3 is the project-local gateway (the current
Herdr crate, released alongside the runtime) composing the host-runtime crate
in-process. A future shared multi-project gateway is a different component: it
reaches a selected project runtime only through the out-of-process Project
Runtime Adapter
([Future Constraints](../../../architect/packaging-distribution/future-constraints.md) §2),
never by loading a project runtime in-process itself.

Chat becomes a peer host only when a real chat adapter and its own contracts
exist. Host extensibility is preserved meanwhile; a speculative chat proof is
not a release gate.

#### 8. Migrate The Next Small Read-Only Proof

Migrate one more read-only operation before touching state writes.

##### `gate-bypass`

Port only the read of the configured bypass level. This proves a real project
filesystem/config path, precedence over the legacy standalone file, malformed
input handling, and fail-closed default behavior without moving write authority.

Do not include approval-policy calculation or risk-keyword evaluation in this
slice.

Exit condition: existing positive and malformed/missing-file cases are
equivalent and the operation performs no writes or Node spawn.

##### Why `ready` Is Not A First Proof

`ready` appears small at the CLI but depends on event loading, replay, domain
stage mapping, lineage/dependency semantics, and effective runtime claims.
Porting it first would silently turn a host proof into a Work Lifecycle read
model migration. It is a good later read-side slice after `version` and
`gate-bypass`.

#### 9. Repeat By Component Boundary


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



Near-thin read-only operations come before complex write owners. File size alone
does not choose order.

A native provider never blocks waiting for a person. An operation that needs
human input returns a `parked` outcome and is re-invoked by the work
lifecycle, not by a provider-side wait. This must hold before any
`ask`/`answer`-shaped operation migrates.

#### 10. Migrate Read Models Before Writers

The next meaningful proof after the small operations should be a Work Lifecycle
read-side component, potentially the dependencies needed by `ready`.


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



This creates reusable Rust read models before any event writer moves.

#### 11. Migrate State-Writing Components

Move a writer only when all of these are explicit and tested:

- sole authority owner;
- event/schema version compatibility;
- lock and concurrency behavior;
- atomicity and fsync/rename expectations;
- idempotency and retry policy;
- crash recovery and partial-write detection;
- typed error/exit mapping;
- Node/Rust mutual exclusion during cutover;
- rollback compatibility with events written by Rust.

Never dual-run a write for shadow comparison. Use fixtures, isolated temp stores,
and replay equivalence instead.

#### 12. Remove Node

Remove the Node runtime/payload only when:

- no built-in operation routes to the legacy provider;
- all events written by the final Node version replay correctly in Rust;
- all public commands and supported hosts pass contract tests;
- `init`/`doctor` reports no remaining legacy dependency;
- release rollback no longer depends on shipping Node;
- obsolete Node facades, manifests, test adapters, and distribution entries are
  removed in the same cleanup series.

Node removal is a consequence of zero remaining routes, not a calendar target.

#### 13. Rollback Rules

Config can never replace a built-in provider (host doc open question 2 closed
as "prohibit"). A provider binding is not a runtime-selectable switch, so
rollback of a native operation in R1–R2 is a release rollback through `fgctl`:
`ActivationRecord.previousArtifactDigest` + the preserved release directory +
a state-schema compatibility check (see
[Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md)
§11). The previous release still contains both the native provider and the
Node payload during the operation's observation window, so a release rollback
restores the legacy path without restoring the old outer executable by hand.


Added in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets).


#### 14. Verification Gates

Every stage must leave a reproducible gate:

| Stage | Minimum proof | Performance gate |
|---|---|---|
| R1 Rust CLI | Node baseline; invocation kernel; transparent CLI fallback parity across argv/stdin/stdout/stderr/cwd/env/exit/signal; native `version`; `fgctl` install/upgrade/rollback/uninstall from a staged release; `fgos init` / `doctor --fix` / `doctor` on every supported target | legacy passthrough overhead vs direct `node` entry and native `version` latency measured against the thresholds fixed in the plan's P1 harness |
| R2 process preview | framed-protocol conformance, manifest-without-execution discovery, bounded cancel/backpressure, crash/completion-unknown mapping, vendor fixture through the common router | — |
| R3 remote peer | at least one native semantic route through the production gateway, transport-specific contract suite, and no internal `fgos.v1` parsing on migrated routes | — |
| Next read proof | `gate-bypass` or another authority-confirmed read runs natively with no Node process and no writes | — |
| Work read model | Rust event decode/replay/frontier determinism against Node fixtures | — |
| First writer | atomicity, recovery, concurrency, mutual exclusion, idempotency, and cross-version replay | — |
| Node removal | zero compatibility bindings and zero init/doctor/runtime dependency on Node | — |

Repository-wide proof remains `npm test` plus the new Rust workspace's
`cargo test --workspace` until Node tests are retired deliberately.

#### 15. Remaining Migration Decisions

1. Which supported target matrix gates the first distributed Rust host?
2. How long is the provider rollback observation window?
3. Does `gate-bypass` remain the next proof after its component ownership is
   confirmed, or should an already-settled component read replace it?
4. Which state-writing component is the first eligible writer after Rust replay
   parity exists?

The former "which post-npm release/install mechanism owns native artifacts"
decision is settled: the packaging stream owns it (`fgctl` + release store +
workspace activation binding), see
[Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md).
`````

### claim_6275bba15f3262cd1adb35973216a47d

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#migration-status-note

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#historical-migration-status-note

Source unit digest: cb163186599cc01493d0fde6e37f8e026f336650869f14291eb1fb32bbc96e14

Target unit digest: 01b857cc72715357538a05446610509d83d5bf88b54ec3b3b39977ca2a808042

Shown source digest: abf89bd8243a46cd8c23768af8facc18b418a506740b99ac24ce64f089a484b9

Shown target digest: 69a14e4f5727ea8937d29fefbef5caa76beb200f77171c958b48edcf50284d6f

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#migration-status-note at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#historical-migration-status-note. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
## Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/node-to-rust-migration.md](../../platform/host-invocation-routing/architecture/node-to-rust-migration.md),
[architecture/release-boundaries.md](../../platform/host-invocation-routing/architecture/release-boundaries.md),
[verification/r1-rust-host-proof.md](../../platform/host-invocation-routing/verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../../platform/host-invocation-routing/history/host-invocation-baseline.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_fd246fe0ad796f0ce1f3448b6ad8ec61

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-3

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-10

Source unit digest: 4db21e2ea3a790fe043ded9006b9c31a127c871c4c77a2c1055d2db137650c60

Target unit digest: 52109204af09107163b441654a44e9de25868552102a993367ad38f66ae6ac6a

Shown source digest: 4db21e2ea3a790fe043ded9006b9c31a127c871c4c77a2c1055d2db137650c60

Shown target digest: 52109204af09107163b441654a44e9de25868552102a993367ad38f66ae6ac6a

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-3 at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-10. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/node-to-rust-migration.md](../../platform/host-invocation-routing/architecture/node-to-rust-migration.md),
[architecture/release-boundaries.md](../../platform/host-invocation-routing/architecture/release-boundaries.md),
[verification/r1-rust-host-proof.md](../../platform/host-invocation-routing/verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../../platform/host-invocation-routing/history/host-invocation-baseline.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_aec6fb3d8eed3c772ec8bac9808009d3

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-a-thin-the-entire-node-host-first

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first

Source unit digest: 1b4f6a70d3530daab76986749e1284dac18236ec9de6faada23ff972e155e334

Target unit digest: 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73

Shown source digest: 9334322765c33eaa99906024ca68ac02fd515aadb32bacb1b93cace5a4721d02

Shown target digest: e0e67f5195298a63ff46b85ba7da5b4efb6ce070ac3666a08ade660055ddaff1

Rationale: Move the complete direct heading unit "### Option A: Thin The Entire Node Host First" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-a-thin-the-entire-node-host-first to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

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

Shown source digest: df7b26f208ea41b1e2f55d125e6b77b58dcc60ee06a039e38f7981cfcf584cc0

Shown target digest: 312b9a1b98fcc5344559bcce0845cc04bcd28f08d3d7d715d91cd3c6dc19340e

Rationale: Move the complete direct heading unit "### Option C: Big-Bang Rust Rewrite" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#option-c-big-bang-rust-rewrite to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

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

### claim_d3350f1f59df99f9dfa937d5ea894de4

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#selected-option

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#selected-option

Source unit digest: 9cf9fd76cccbf49a0bd485ce613f7cb89676ff9096a727d123e0a7a18d2524c9

Target unit digest: 7d4964d379b1f658632996f0008287e453f8a8cf8fc28fb5cc7b63e59327f96c

Shown source digest: 7593b6842bd25d76e65c0c0881f86064f5c28730224f6c27e7ba16a28600e0e0

Shown target digest: 763e36a01f846cd9ad1ea0b8114ff60160d1f84ef5319eaadeb971ec69687799

Rationale: Move the complete direct heading unit "### Selected Option" from docs/architect/host-invocation-routing/node-to-rust-component-migration.md#selected-option to its frozen mapped owner docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#selected-option. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
### Selected Option

Option B is selected. The first Rust release is an intentionally small,
distributable host/router; the CLI adapter execs every unmigrated selector
straight to the Node payload by default, not an immediate rewrite of all Node
semantics.
`````

Full shown target:

`````md
##### Selected Option

Option B is selected. The first Rust release is an intentionally small,
distributable host/router; the CLI adapter execs every unmigrated selector
straight to the Node payload by default, not an immediate rewrite of all Node
semantics.


Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).



Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

### claim_c072318ec582affe5e0e6936961fadc4

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary

Source unit digest: d1c2fad49a5087903461482aaa9dbb0b96c53baa6db717e0546f8b185552307f

Target unit digest: ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e

Shown source digest: 18325398c7375466fc1f86ca3ec636ff0dec40b8911144b741473ccada700945

Shown target digest: 7c8ddca61bf8d451cd2bad9f1e0b0276c37abbbc4181ab32eb7f1ba7464ace19

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-44 (claim_9f2283b25ef4be9f0e68b4381f1ce08e; For each subsequent component:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-45 (claim_abc80009ab1bf59c40a645089fbc82fd; 1. Read [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md) and name responsibility, semantic ope). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 9. Repeat By Component Boundary

For each subsequent component:

1. Read
   [fgOS Component Boundary Advisory](../component-boundary/component-boundary-advisory.md)
   and name responsibility, semantic operations, authority, state, side
   effects, component class, and physical placement.
2. Select a complete operation/use-case boundary rather than private helpers.
3. Capture current Node behavior as shared fixtures.
4. Extract only the Node boundary needed for this migration slice.
5. Implement the corresponding native Rust provider.
6. Run both providers against the same semantic fixtures.
7. Shadow only side-effect-free reads.
8. Switch the operation from legacy to native after parity proof.
9. Observe the rollback window.
10. Remove the Node implementation in a later cleanup change.

Near-thin read-only operations come before complex write owners. File size alone
does not choose order.

A native provider never blocks waiting for a person. An operation that needs
human input returns a `parked` outcome and is re-invoked by the work
lifecycle, not by a provider-side wait. This must hold before any
`ask`/`answer`-shaped operation migrates.
`````

Full shown target:

`````md
#### 9. Repeat By Component Boundary


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



Near-thin read-only operations come before complex write owners. File size alone
does not choose order.

A native provider never blocks waiting for a person. An operation that needs
human input returns a `parked` outcome and is re-invoked by the work
lifecycle, not by a provider-side wait. This must hold before any
`ask`/`answer`-shaped operation migrates.
`````

### claim_e960a05c0b656d0dae2cffd3daee5a0d

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers

Source unit digest: 225088240c21859fc36ee71b02c32151f4f19e37a2a17e8539b159561d58f15c

Target unit digest: 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d

Shown source digest: a6cc9c587ef564b6b0b61de86ce194e228497b39d8c3be75abd525edd9f2043f

Shown target digest: bda74dbdc68fbe322850af6ecea5832f73376460389fa57dd462ff9fd9e641e7

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-per-component-repeat-procedure and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-49 (claim_99bf6932b3f44681c138edf8384d652b; Sequence it internally:); docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-50 (claim_056d11e86ef88989c436bc14a24997a1; 1. event/schema decode fixtures; 2. deterministic replay fixtures; 3. domain/stage projection fixtures; 4. frontier calculation fixtures; 5.). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 10. Migrate Read Models Before Writers

The next meaningful proof after the small operations should be a Work Lifecycle
read-side component, potentially the dependencies needed by `ready`.

Sequence it internally:

1. event/schema decode fixtures;
2. deterministic replay fixtures;
3. domain/stage projection fixtures;
4. frontier calculation fixtures;
5. effective claim overlay;
6. CLI `ready` parity and pagination;
7. remote semantic parity.

This creates reusable Rust read models before any event writer moves.
`````

Full shown target:

`````md
#### 10. Migrate Read Models Before Writers

The next meaningful proof after the small operations should be a Work Lifecycle
read-side component, potentially the dependencies needed by `ready`.


Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).



This creates reusable Rust read models before any event writer moves.
`````

### claim_ac2177776d1a367f2d8e81699b04fc63

Source: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules

Source unit digest: 30245265d7fc653884caff4a90018addd38af26a0e29f35223b0f4fcd4ecdd20

Target unit digest: 18582e9da8d64b7e18ba9e1bc7c3eff5aeb10565960bf94f7fe947bc921a0f07

Shown source digest: 9076f0a59a8df69f43aaa58237b0f1018d778f203b573bc30201a212438f4991

Shown target digest: 619346b9ebf3e2d76ce84904e80b006f9546e49f291b869a623e566d9d0fb7ea

Rationale: Partial carry of the direct source section docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules at docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules; surrounding content stays here. Remainder: The relocated passage of docs/architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules is retained verbatim at docs/platform/host-invocation-routing/contracts/component-protocol.md#restored-rollback-bullets and accounted by the sibling source decisions for those literal restoration blocks. The primary target retains the surrounding section text and links directly to those live anchors. Named source remainder: docs/architect/host-invocation-routing/node-to-rust-component-migration.md#unheaded-block-59 (claim_a1c1085c9d77a84ca5e5aefe1de6d059; - Keep legacy and native implementations side by side only for the observation window of their operation. - Never delete a Node writer bef). No source wording is discarded; this row does not claim the primary target alone contains the relocated passage.

Full shown source:

`````md
## 13. Rollback Rules

Config can never replace a built-in provider (host doc open question 2 closed
as "prohibit"). A provider binding is not a runtime-selectable switch, so
rollback of a native operation in R1–R2 is a release rollback through `fgctl`:
`ActivationRecord.previousArtifactDigest` + the preserved release directory +
a state-schema compatibility check (see
[Runtime Identity And Activation](../packaging-distribution/runtime-identity-and-activation.md)
§11). The previous release still contains both the native provider and the
Node payload during the operation's observation window, so a release rollback
restores the legacy path without restoring the old outer executable by hand.

- Keep legacy and native implementations side by side only for the observation
  window of their operation.
- Never delete a Node writer before proving it can read/recover state last
  written by the Rust implementation, or explicitly declaring the cutover
  irreversible with migration evidence.
- Remove rollback code per component after its window; do not accumulate a
  permanent second implementation tree.
`````

Full shown target:

`````md
#### 13. Rollback Rules

Config can never replace a built-in provider (host doc open question 2 closed
as "prohibit"). A provider binding is not a runtime-selectable switch, so
rollback of a native operation in R1–R2 is a release rollback through `fgctl`:
`ActivationRecord.previousArtifactDigest` + the preserved release directory +
a state-schema compatibility check (see
[Runtime Identity And Activation](../../../architect/packaging-distribution/runtime-identity-and-activation.md)
§11). The previous release still contains both the native provider and the
Node payload during the operation's observation window, so a release rollback
restores the legacy path without restoring the old outer executable by hand.


Added in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets).
`````

### claim_d4b9b2583e0b4b598a7610af9ced7d36

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#migration-status-note

Target: docs/platform/host-invocation-routing/roadmap.md#historical-migration-status-note

Source unit digest: c00dc23b0e512e53f33c2adf2c3bf3d0b3809e35b3e0fbe748ab8fd2399477e5

Target unit digest: c67619ba2bc360580b6127bb4b93b9358875e6513207ece712288be415e59496

Shown source digest: 5c2e5c0a69e773802fa0eff105c43649cafe6b0903b4f3ce795b1a7dd2f5767e

Shown target digest: a938357f3ce333ec39444b1669ee24e5f571026936f46e6475b4054616c60d7a

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#migration-status-note at docs/platform/host-invocation-routing/roadmap.md#historical-migration-status-note. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
## Migration Status Note

This document remains a legacy-current execution-plan source during the
2026-09-14 promotion pass. The promoted platform docs are
[architecture/release-boundaries.md](../../platform/host-invocation-routing/architecture/release-boundaries.md),
[verification/compatibility-harness.md](../../platform/host-invocation-routing/verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](../../platform/host-invocation-routing/verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](../../platform/host-invocation-routing/verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](../../platform/host-invocation-routing/verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy execution-plan source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_bb1dcfee5986a94c37e667c75bd3af84

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-3

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-63

Source unit digest: 9e7bbb0c3bb089181632d8951600128bde3f77e1abd0fe287709719375149abf

Target unit digest: 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e

Shown source digest: 9e7bbb0c3bb089181632d8951600128bde3f77e1abd0fe287709719375149abf

Shown target digest: 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e

Rationale: Supersede the complete migration bookkeeping unit from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#unheaded-block-3 at docs/platform/host-invocation-routing/roadmap.md#unheaded-block-63. Reason: the September legacy-current label describes the legacy input during its dated promotion pass; the candidate now explicitly records that historical status and all destination references, without presenting itself as legacy-current.

Full shown source:

`````md
This document remains a legacy-current execution-plan source during the
2026-09-14 promotion pass. The promoted platform docs are
[architecture/release-boundaries.md](../../platform/host-invocation-routing/architecture/release-boundaries.md),
[verification/compatibility-harness.md](../../platform/host-invocation-routing/verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](../../platform/host-invocation-routing/verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](../../platform/host-invocation-routing/verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](../../platform/host-invocation-routing/verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](../../platform/host-invocation-routing/intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy execution-plan source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_ab778e44a43171006f82c08d9939dcf5

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution

Target: docs/platform/host-invocation-routing/roadmap.md#3-decisions-required-before-r1-execution

Source unit digest: 2c11291e0dae8db873ecf306d203f0d2daeee2ad5b89e686468faa7d185a77e8

Target unit digest: cbf26e495828da2b590d1d6c244b2cf4cec5fe12f6694b754861a23bb3f8eb72

Shown source digest: 25eec6030255ca3d32eb24bd40a48dc3a000ed49a531c0ba5393c304586ebae0

Shown target digest: 510a43e3722432cb8a9f9ff49e29ee8ade74961a722907e2eb25289f7fa9e1da

Rationale: Move the complete direct heading unit "## 3. Decisions Required Before R1 Execution" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#3-decisions-required-before-r1-execution. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
## 3. Decisions Required Before R1 Execution

These are product/release inputs, not implementation details to guess:

1. supported R1 target matrix;
2. ~~native archive publication and installation mechanism~~ — settled, see
   `runtime-identity-and-activation.md` §13 (`fgctl` Rust bootstrap; local
   path/tarball/GitHub release asset acquisition sources) and §5
   (content-addressed release store, release tree manifest);
3. ~~upgrade and rollback channel~~ — settled, see
   `runtime-identity-and-activation.md` §11 (`fgctl upgrade`/`fgctl repair`
   pipeline; rollback via `ActivationRecord.previousArtifactDigest` plus the
   preserved release directory). Compatibility-window duration remains open
   (carried forward as decision 6 below);
4. ~~release artifact naming and integrity/checksum policy~~ — settled, see
   `runtime-identity-and-activation.md` §5 (release tree manifest digest
   identity, not archive digest) and §11 (quarantine on digest mismatch);
5. whether the first public R1 is preview or immediate stable default;
6. compatibility-window duration for R1's Node fallback (§16).

Decision "whether setup/doctor may ever select or download an upgrade" is
closed: **never**. `fgctl` owns acquisition/upgrade/rollback; local `fgos
init` and `fgos doctor --fix` never select or download a release
(`runtime-identity-and-activation.md` §12, Command Authority Matrix). There is
no `setup` verb — see the P0 deliverable on inventorying `fgos setup` callers
(§5).

Record decisions 1, 5, and 6 in the packaging stream
(`docs/architect/packaging-distribution/`), which owns install/activation;
`docs/specs/distribution.md` is regenerated from it later. Local P1–P5 work
may proceed; the public entry flip (P6) may not infer these decisions and also
depends on the packaging stream's `fgctl` walking skeleton (§4, node `PK`).
`````

Full shown target:

`````md
#### 3. Decisions Required Before R1 Execution

These are product/release inputs, not implementation details to guess:

1. supported R1 target matrix;
2. ~~native archive publication and installation mechanism~~ — settled, see
   `runtime-identity-and-activation.md` §13 (`fgctl` Rust bootstrap; local
   path/tarball/GitHub release asset acquisition sources) and §5
   (content-addressed release store, release tree manifest);
3. ~~upgrade and rollback channel~~ — settled, see
   `runtime-identity-and-activation.md` §11 (`fgctl upgrade`/`fgctl repair`
   pipeline; rollback via `ActivationRecord.previousArtifactDigest` plus the
   preserved release directory). Compatibility-window duration remains open
   (carried forward as decision 6 below);
4. ~~release artifact naming and integrity/checksum policy~~ — settled, see
   `runtime-identity-and-activation.md` §5 (release tree manifest digest
   identity, not archive digest) and §11 (quarantine on digest mismatch);
5. whether the first public R1 is preview or immediate stable default;
6. compatibility-window duration for R1's Node fallback (§16).

Decision "whether setup/doctor may ever select or download an upgrade" is
closed: **never**. `fgctl` owns acquisition/upgrade/rollback; local `fgos
init` and `fgos doctor --fix` never select or download a release
(`runtime-identity-and-activation.md` §12, Command Authority Matrix). There is
no `setup` verb — see the P0 deliverable on inventorying `fgos setup` callers
(§5).

Added in candidate — checked status (2026-10-13): the preceding no-setup sentence is retained historical design wording. `setup` still exists as a legacy compatibility command (`src/cli/command-registry.mjs:1439-1441`, `bin/fgos.mjs:3774`); its compatibility window has not been retired. This note supersedes that sentence as a present-status assertion.

Record decisions 1, 5, and 6 in the packaging stream
(`docs/architect/packaging-distribution/`), which owns install/activation;
`docs/specs/distribution.md` is regenerated from it later. Local P1–P5 work
may proceed; the public entry flip (P6) may not infer these decisions and also
depends on the packaging stream's `fgctl` walking skeleton (§4, node `PK`).
`````

### claim_3c202991304027e73ce867fadfd87175

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness

Target: docs/platform/host-invocation-routing/roadmap.md#6-p1-compatibility-harness

Source unit digest: 42627a79ae9e2ad3cdd87a461aedfab3e1a4bc6c1ccb6396b6d62e3811e2dedd

Target unit digest: 8fe73175caed647b1eb18bd5241b3974b2614d3b132fb87c0a1a00ec7c2be8d1

Shown source digest: fe24bda31396c4376632de7fd5e2fb063907974f998cb9a2733dcfb82c50cddb

Shown target digest: bace158e52957e598756122318395e53879a60f8f4925187215ac16763852e86

Rationale: Move the complete direct heading unit "## 6. P1 — Compatibility Harness" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#6-p1-compatibility-harness. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
## 6. P1 — Compatibility Harness
`````

Full shown target:

`````md
#### 6. P1 — Compatibility Harness


Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).



Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).


##### Steps

1. Build one harness that invokes Node or a candidate Rust binary with identical
   argv bytes, stdin, cwd, selected environment, and timeout.
2. Capture stdout/stderr bytes, normal exit, signal termination, filesystem
   diff, spawned-process evidence, and wall-clock timing per case.
3. Generate a checked command-route descriptor from the current command
   registry plus explicit migration annotations; do not hand-maintain a second
   command list. Require one `legacy-cli` or `native` route kind, one canonical
   owner path, and one or more required proof suites for every selector.
4. Add a byte drift test for the generated artifact.
5. Add Node-generated `fgos.v1` vectors and the architecture's differential
   serialization corpus.
6. Add `scripts/explain-command-route.mjs <selector>` as a developer-only view
   over that same checked artifact; its output names the owner path and suites
   to run for a bug repair.
7. Declare comparison mode per case: exact bytes, semantic JSON plus timestamp
   predicate, filesystem delta, or signal.
8. Prove the harness detects an injected stdout byte, exit-code change, missing
   argv token, and unexpected child process.

##### Coverage floor

- Every selector: recognition and help/syntax passthrough.
- Every selector: route descriptor has exactly one active route, an owner, and
  a required proof suite; unknown selectors and ambiguous routes fail closed.
- Every exit category: stdout/stderr/status.
- Reads `version` and `ready`; one validation failure; unknown verb.
- Isolated write: `init` then `add` in a temp repository.
- `--dir`, caller cwd distinct from product root, stdin consumer if present.
- Target-specific signal/process-tree behavior.



Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).




Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_fc22ecebfdc6e506475e638d1ba86920

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#coverage-floor

Target: docs/platform/host-invocation-routing/roadmap.md#coverage-floor

Source unit digest: e48c44ad1a36f17b9268adb396121d048857e13cdbfe14bfbd40c285a11e66ea

Target unit digest: 75e0fe39c2aaa78adefd3e98cf324334eed056be09406e3f4a9dec5da39094bd

Shown source digest: 8e097d62870417522172a762a1b16e1b7d488c49609722e674c55a21f0057de0

Shown target digest: f0f52021bcfbaa1ccc628d235c455dc532a3c90bdbfbf1c17ede1ceba38ea275

Rationale: Move the complete direct heading unit "### Coverage floor" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#coverage-floor to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#coverage-floor. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
### Coverage floor

- Every selector: recognition and help/syntax passthrough.
- Every selector: route descriptor has exactly one active route, an owner, and
  a required proof suite; unknown selectors and ambiguous routes fail closed.
- Every exit category: stdout/stderr/status.
- Reads `version` and `ready`; one validation failure; unknown verb.
- Isolated write: `init` then `add` in a temp repository.
- `--dir`, caller cwd distinct from product root, stdin consumer if present.
- Target-specific signal/process-tree behavior.
`````

Full shown target:

`````md
##### Coverage floor

- Every selector: recognition and help/syntax passthrough.
- Every selector: route descriptor has exactly one active route, an owner, and
  a required proof suite; unknown selectors and ambiguous routes fail closed.
- Every exit category: stdout/stderr/status.
- Reads `version` and `ready`; one validation failure; unknown verb.
- Isolated write: `init` then `add` in a temp repository.
- `--dir`, caller cwd distinct from product root, stdin consumer if present.
- Target-specific signal/process-tree behavior.



Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).




Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_cbdba798349c777e7f15979d300e0142

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read

Target: docs/platform/host-invocation-routing/roadmap.md#14-p9-next-native-read

Source unit digest: 7c6a82426019f1aa6755e520878d99ca6e41571b6fbce753322deac3160408c7

Target unit digest: ac492f613b9b733b46f8f0e566ea4f839961ee30f3a1dafd97b61be903af14f7

Shown source digest: 3e7e0adbe3757aec182f602c9f73ed14513570f196e355d6bdc090d97d499766

Shown target digest: ab792ecb22e68426cb552175c7ada66cad88a191564b0a5971b3b8a7399a2dca

Rationale: Move the complete direct heading unit "## 14. P9 — Next Native Read" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#14-p9-next-native-read. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
## 14. P9 — Next Native Read

`gate-bypass` is a candidate, not a pre-created component. Confirm authority
and placement first. If selected: freeze precedence/malformed fixtures; port
only the read; consume resolved project context; prove zero writes and zero Node
spawn; flip binding separately from Node deletion. If ownership stays unclear,
choose another settled read instead of inventing a component boundary.

The provider never blocks on human input; a `parked` outcome is the only
allowed response when human input is needed (matches `ask`/awaiting-human;
"Release con người" law). This applies to P9 and to any later native
migration slice.

```sh
node --test test/rust-host/gate-bypass-parity.test.mjs
cargo test --workspace
```
`````

Full shown target:

`````md
#### 14. P9 — Next Native Read

`gate-bypass` is a candidate, not a pre-created component. Confirm authority
and placement first. If selected: freeze precedence/malformed fixtures; port
only the read; consume resolved project context; prove zero writes and zero Node
spawn; flip binding separately from Node deletion. If ownership stays unclear,
choose another settled read instead of inventing a component boundary.

The provider never blocks on human input; a `parked` outcome is the only
allowed response when human input is needed (matches `ask`/awaiting-human;
"Release con người" law). This applies to P9 and to any later native
migration slice.

```sh
node --test test/rust-host/gate-bypass-parity.test.mjs
cargo test --workspace
```


Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).



Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

### claim_c245c752125bfa748075cb620216e537

Source: docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#16-commit-and-rollback-slices

Target: docs/platform/host-invocation-routing/roadmap.md#16-commit-and-rollback-slices

Source unit digest: 61bbe41eda82d22b8c6104b878d8fb289f0d49b3b61a09a5d0ed7a507e47f087

Target unit digest: 6c81ae046ab7de3a595689c9da4de2d4723ea86247de47d6c82f300c1844203e

Shown source digest: 16c6bfd719556d324b0d8c885529d6c6655832c62770dad34f5965a116f1758e

Shown target digest: baa4eec3067079bb2631081ca1b1f58dd0f25df92159f91fee7b0eda1bc687e4

Rationale: Move the complete direct heading unit "## 16. Commit And Rollback Slices" from docs/architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#16-commit-and-rollback-slices to its frozen mapped owner docs/platform/host-invocation-routing/roadmap.md#16-commit-and-rollback-slices. The selected source material retains all direct-unit wording; only source heading depth and resolved link destinations are structural rewrites. The separate dated-scope note does not assert every source proposal or old route count is current code. Native counterpart class Judgment: no target digest match; independent full-text judgment remains required, not a script-proven approval.

Full shown source:

`````md
## 16. Commit And Rollback Slices

Independently revertible slices:

1. harness and generated selector artifact;
2. workspace skeleton;
3. invocation kernel/in-memory providers;
4. Node compatibility;
5. native `version` binding;
6. artifact production;
7. init/doctor and external install tests;
8. installed-entry flip;
9. process protocol fixture/adapter;
10. first remote route;
11. each later native binding;
12. each Node deletion after its observation window.

Before P6, discard the candidate binary. After P6, roll back via `fgctl`
release rollback (restores the previous complete release via
`ActivationRecord.previousArtifactDigest` plus the preserved release
directory; R1–R2 use no other rollback channel — config never selects or
replaces a built-in provider). Roll back a single native read by changing its
binding in code and shipping a new release, never by a runtime
provider-selection toggle: R1–R2 bindings are immutable and static. Never
shadow-run or auto-retry a writer. Never delete a Node writer before
cross-version recovery is proven or the cutover is explicitly irreversible.
`````

Full shown target:

`````md
#### 16. Commit And Rollback Slices

Independently revertible slices:

1. harness and generated selector artifact;
2. workspace skeleton;
3. invocation kernel/in-memory providers;
4. Node compatibility;
5. native `version` binding;
6. artifact production;
7. init/doctor and external install tests;
8. installed-entry flip;
9. process protocol fixture/adapter;
10. first remote route;
11. each later native binding;
12. each Node deletion after its observation window.

Before P6, discard the candidate binary. After P6, roll back via `fgctl`
release rollback (restores the previous complete release via
`ActivationRecord.previousArtifactDigest` plus the preserved release
directory; R1–R2 use no other rollback channel — config never selects or
replaces a built-in provider). Roll back a single native read by changing its
binding in code and shipping a new release, never by a runtime
provider-selection toggle: R1–R2 bindings are immutable and static. Never
shadow-run or auto-retry a writer. Never delete a Node writer before
cross-version recovery is proven or the cutover is explicitly irreversible.



Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

## Pending native identity successors

The native refresh retained all old IDs and surfaced 35 retired candidate units changed by these corrections. Each has a real same-document successor, full before/current text, and pending supersede; no approval carries. This is binding accounting within the authorized changes, not new content.

### claim_b759dfca1af06f32bacaf80c87167db5

Source: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#migration-status-note at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#historical-migration-status-note at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: db3348e89c4fa8b1dda4d626191433e97554c0c4e41aa6f14a75bb1de322a4f3

Target unit digest: fc32b1b25c89ea4978ab36812b636d62c665da2e38af568a1671921384685156

Shown source digest: 1b75444c95d1fa36d88e6bc2c97b48d2c0c95055a2ed63ce929b19bcdd376bf1

Shown target digest: b2f700961b5562103060d9ca4ea3c91197e3c6b4052350a9b3aa454d60964279

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#migration-status-note is replaced in the same document by #historical-migration-status-note. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
#### Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_59ae4b053c3d881974ba4e51a485844e

Source: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-4 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-5 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: d3a55a05b15dcdbaf1c9fe8b2c6cbe42fd47da062903d41aa5b9814dc8484365

Target unit digest: 806eb8664cf1055d8efe549b2d6189a6d2ee7c70da17b42fe1974cd8f258d0c7

Shown source digest: d3a55a05b15dcdbaf1c9fe8b2c6cbe42fd47da062903d41aa5b9814dc8484365

Shown target digest: 806eb8664cf1055d8efe549b2d6189a6d2ee7c70da17b42fe1974cd8f258d0c7

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-4 is replaced in the same document by #unheaded-block-5. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Native routes use `OperationRequest` to `ProviderOutcome`. | `implemented preview` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for `distribution.build.show`, `work.gate-bypass.show`, and the R2 fixture operation. Additional operations need their own route/provider proof. |
| Legacy CLI routes bypass the kernel. | `implemented preview` | [legacy-cli-transition.md](legacy-cli-transition.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Current route matrix still has 71 `legacy-cli` selectors; keep bypass behavior until each selector migrates. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |
`````

Full shown target:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Native routes use `OperationRequest` to `ProviderOutcome`. | `implemented preview` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for `distribution.build.show`, `work.gate-bypass.show`, and the R2 fixture operation. Additional operations need their own route/provider proof. |
| Legacy CLI routes bypass the kernel. | `implemented preview` | [legacy-cli-transition.md](legacy-cli-transition.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Current route matrix still has 70 `legacy-cli` selectors; keep bypass behavior until each selector migrates. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |
`````

### claim_8db9ab0b54fbc30deec8b558a3c88375

Source: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#migration-status-note at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#historical-migration-status-note at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 4ea52718f114ddd1de808f2b62beb60f7201687e0b64a1aa873caa96d49dbbf1

Target unit digest: caf8f56f95cb4bab4c0d074baf0daae1bfd03c7311387c571d36de1b76d089b2

Shown source digest: b66a1a8b26a6925854ed287caf9a7642a423c15d2cfcf917a69ef269baf2f0e8

Shown target digest: 2c5fed878b4304455e30f9fc484c576ceb118c971a74d80135a88b68b7cf1e22

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#migration-status-note is replaced in the same document by #historical-migration-status-note. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
#### Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_d98eae7bdb398f8346f377379f10f524

Source: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-27 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-28 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: ab2cd0f150f5e1b404324375d0296ae4adbaaef0f80f503bb5e6760e7bc651f9

Target unit digest: 0d4394dd6bc803be0cf225b1d69a29665a957ac95bde8dbe68e07920fa1165bf

Shown source digest: ab2cd0f150f5e1b404324375d0296ae4adbaaef0f80f503bb5e6760e7bc651f9

Shown target digest: 0d4394dd6bc803be0cf225b1d69a29665a957ac95bde8dbe68e07920fa1165bf

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-27 is replaced in the same document by #unheaded-block-28. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-009 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).
`````

### claim_ec76480d44e19694d3298ca65278c8af

Source: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-35 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-36 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 3ecc5accc1eacd0fded8ba487bf40b9b354624efd7aad3c7806f04975bc9a70a

Target unit digest: aa4a78bd4a05ca0eeb350d5fb7ed6f09197d3f253d8128b9d1b283bcd4971476

Shown source digest: 3ecc5accc1eacd0fded8ba487bf40b9b354624efd7aad3c7806f04975bc9a70a

Shown target digest: aa4a78bd4a05ca0eeb350d5fb7ed6f09197d3f253d8128b9d1b283bcd4971476

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-35 is replaced in the same document by #unheaded-block-36. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-011 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rust-host-first-cost`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-011 restoration](../contracts/component-protocol.md#restored-rust-host-first-cost).
`````

### claim_c6b3c7d09fb97f29f2d049376c17239e

Source: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#migration-status-note at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#historical-migration-status-note at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: a84fb148d6012d7377131d4e7aed4b121a584a2bb673df4c87a36bc4a90f35df

Target unit digest: 01b857cc72715357538a05446610509d83d5bf88b54ec3b3b39977ca2a808042

Shown source digest: e9b7cfdfed763a705942ef75183cc62fd1d11ef0c8644bd065f95954393f6f1d

Shown target digest: 69a14e4f5727ea8937d29fefbef5caa76beb200f77171c958b48edcf50284d6f

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#migration-status-note is replaced in the same document by #historical-migration-status-note. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
#### Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_d81d353395c08b743001f95191ab69f0

Source: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-4 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: fd42541f9fa8692e12e6564bd0c66e09edebfb76accbb134816a002c194e2387

Target unit digest: c300d4dcad0156d171a142c34facf83ac23acd25c337c77d3ed8e4526c30196c

Shown source digest: fd42541f9fa8692e12e6564bd0c66e09edebfb76accbb134816a002c194e2387

Shown target digest: c300d4dcad0156d171a142c34facf83ac23acd25c337c77d3ed8e4526c30196c

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 73 selectors, 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | explicit escape hatch approved; 30 calendar days after preview release publication; for `v0.1.0`, earliest removal is 2026-10-18 | Packaging-distribution stream plus host invocation. |
`````

Full shown target:

`````md
| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 75 selectors, 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | explicit escape hatch approved; 30 calendar days after preview release publication; for `v0.1.0`, earliest removal is 2026-10-18 | Packaging-distribution stream plus host invocation. |
`````

### claim_a42f3f80a058e272ef1f2dc9f85eac7b

Source: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-5 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-6 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 18a897d50d895beba46ff67ef9e880f0a3b2476d6a664c919bfee160be8dfc82

Target unit digest: 9dcb8f1af676e0a4ab1797f627e485f1e95d87e687b20b166389fb2234d0979e

Shown source digest: 18a897d50d895beba46ff67ef9e880f0a3b2476d6a664c919bfee160be8dfc82

Shown target digest: 9dcb8f1af676e0a4ab1797f627e485f1e95d87e687b20b166389fb2234d0979e

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-5 is replaced in the same document by #unheaded-block-6. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../test/rust-host/command-routes.test.mjs](../../../../test/rust-host/command-routes.test.mjs) | Current snapshot has 73 selectors: 71 `legacy-cli`, two native. Keep drift tests current as selectors move. |
| `legacy-cli` preserves provider-owned argv. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Full compatibility-vector cleanup remains future, but manifest-owned legacy CLI lane is proven for preview. |
`````

Full shown target:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../test/rust-host/command-routes.test.mjs](../../../../test/rust-host/command-routes.test.mjs) | Current snapshot has 75 selectors: 70 `legacy-cli`, five native. Keep drift tests current as selectors move. |
| `legacy-cli` preserves provider-owned argv. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Full compatibility-vector cleanup remains future, but manifest-owned legacy CLI lane is proven for preview. |
`````

### claim_ddcc41a349c39f39ab02e40f709b4a55

Source: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-5 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-6 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: f7341ad45bd1ad546e336d059ff4ee8617498116ad159bd2e7531273ddbf6285

Target unit digest: 45d7db6a7075e118c4290ed08d5f2df32c46140aa42cfaee1d4403f87fb84d22

Shown source digest: f7341ad45bd1ad546e336d059ff4ee8617498116ad159bd2e7531273ddbf6285

Shown target digest: 45d7db6a7075e118c4290ed08d5f2df32c46140aa42cfaee1d4403f87fb84d22

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-5 is replaced in the same document by #unheaded-block-6. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HI-I001 | The area name is Host Invocation And Provider Routing, centered on the Operation Provider Router; avoid `Component Router` and `Command Router`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `accepted-not-implemented` | `promote` | [README.md](README.md), [architecture/provider-routing.md](architecture/provider-routing.md) | Commands are only CLI projections; not every component is dispatchable. | Needs implementation proof for actual router naming. |
| HI-I002 | Host invocation and provider routing are separate responsibilities: host normalizes/admits; router selects implementation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `current partial` | `split` | [vision.md](vision.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Do not collapse parsing, admission, selection, and provider invocation into one CLI path. | Rust kernel proof exists for current built-in routes, R2 external-provider route, and R3 remote peer route; broader component migration remains partial. |
| HI-I003 | CLI, remote, and chat are peer host use cases; none shells through or wraps another after migration. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases) | `current partial` | `promote` | [architecture/host-use-cases.md](architecture/host-use-cases.md) | Peer status does not require one OS process; hosts may compose the same runtime crate. | CLI and remote peer proof exist for selected operations; chat remains future. |
| HI-I004 | The legacy CLI lane is the only non-`OperationRequest`/`ProviderOutcome` path and never enters `InvocationService` or Router. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases), [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `current partial` with `legacy-current` payload behavior | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Direct Node exec preserves argv/stdin/cwd/env/signals and writes one invocation record without semantic wrapping. | Preview proof exists for the manifest-owned legacy CLI lane; full compatibility vectors remain future cleanup. |
| HI-I005 | Canonical kernel terms include `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, Router, `InvocationService`, `InvocationControl`, `EventSink`, `CommandRouteDescriptor`, and `ConfigPort`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names) | `accepted-not-implemented` | `split` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [contracts/operation-provider.md](contracts/operation-provider.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) | One canonical name per concept; no alias drift. | Contract implementation unknown until Rust types exist. |
| HI-I006 | `OperationId` is stable semantic identity independent of CLI/REST/MCP/chat spelling. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `accepted-not-implemented` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md) | Format `<component>.<object-type>.<action>[.<variant>]`; hosts own projection. | First descriptors remain open. |
| HI-I007 | Built-in providers use typed Rust representation; `EncodedMessage` exists only at external process/WASM boundary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts), [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `split` | [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [contracts/component-protocol.md](contracts/component-protocol.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Raw `OsString` is never semantic request; built-ins never decode bytes. | Built-in Rust routes prove typed provider flow; R2 proves `EncodedMessage` stays private to the external process adapter boundary. |
| HI-I008 | `OperationCatalog` is authored by owning components; CLI registry or provider manifest cannot create an operation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `current partial` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | R1 uses const catalog/snapshot at composition root; no linker/cache/manifest scan in R1. | Current built-in catalog proof exists; R2 proves external manifests cannot claim reserved core operations and only add through the external provider linker path. |
| HI-I009 | Router is pure selection; `InvocationService` owns admit, select, grant, invoke, normalize, and record. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Router has no I/O, async, invocation, failure normalization, reporting, or host parsing. | Current Rust slice plus R2 external process proof use the same router/InvocationService path; replacement resolution remains partial. |
| HI-I010 | Authority has two stages: caller admission before routing and selected-provider grant after routing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/operation-provider.md](contracts/operation-provider.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Provider manifest is never authority; selected grant is least privilege. | Current authority-gate proof exists; R2 negative tests cover external manifest/linker refusal and same-pipeline provider grants. |
| HI-I011 | Configuration can never replace a built-in provider; rollback is via `fgctl` release rollback, not provider-selection swap. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Replacement policy only governs explicit external/plugin surface. | Preview `fgctl` proof exists; stable/default graduation remains a release-owner decision, while fallback removal follows the 30-day preview window. |
| HI-I012 | Failure families are closed and host presenters map them to their own public contracts. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `current partial` | `split` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/implementation-alignment.md](verification/implementation-alignment.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Provider crash is not semantic failure; partial output does not imply success. | Built-in provider errors and R2 external process crash/timeout/cancellation mapping are covered for preview; future routes/providers must keep the closed-family mapping. |
| HI-I013 | Exactly one terminal lifecycle record is emitted; late response after cancellation/deadline is diagnostic evidence, not second truth. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) | Records carry ids, contracts, registry fingerprint, provider id, host kind, timing, terminal family, evidence refs; never secrets. | Lifecycle recorder implementation missing. |
| HI-I014 | Providers never block waiting for human input; they return `parked`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | No mid-invocation callback to solicit input. | Needed before `ask`/`answer` migration. |
| HI-I015 | Public command name remains `fgos`; runtime identity is release digest; `fgctl` is separate bootstrap binary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [spec.md](spec.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Do not rename `fgos` to `fgctl`; `fgctl` owns bootstrap. | Preview proof shows `fgos` runtime identity through `version --runtime-json`; stable/default graduation remains open. |
| HI-I016 | R1 physical placement is three Rust crates plus unmoved Node payload; `component-protocol` waits for R2. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | No `packages/legacy-node` crate; legacy exec is CLI-adapter module; do not create fake `gate-policy` component. | R1 placement and R2 component protocol preview proof are closed; production ecosystem hardening remains future. |
| HI-I017 | R1 ships a distributable Rust CLI host, native `version`, and transparent Node compatibility. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | R1 is useful without R2/R3; repo tests alone do not mean stable/default release graduation. | Preview installed/default proof is recorded; stable/default graduation remains open. |
| HI-I018 | R2 proves external process provider preview without marketplace/signature/WASM scope. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview) | `implemented preview` | `promote` | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Static manifest validation and fail-closed protocol behavior gate R2. | R2 proof closed with `fixture.echo.echo`; marketplace/signature/WASM remain future. |
| HI-I019 | R3 proves a production remote peer through project-local gateway without CLI shelling or `fgos.v1` parsing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host) | `implemented preview` | `promote` | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md), [architecture/host-use-cases.md](architecture/host-use-cases.md) | Future shared multi-project gateway is separate and uses Project Runtime Adapter. | `GET /v1/runtime` proves the first project-local gateway peer route for `distribution.build.show`; all other gateway routes remain legacy `VerbGateway` consumers. |
| HI-I020 | Component class and invocation mechanism are separate axes. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes) | `accepted-not-implemented` | `promote` | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) | Core/packaged extension/user plugin differ from built-in/process/WASM mechanisms. | Provider descriptor proof needed. |
| HI-I021 | External process protocol is JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `promote` | [contracts/component-protocol.md](contracts/component-protocol.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Stdout is protocol only; logs go to stderr or declared notification; newline JSON is not contract. | R2 conformance closed for external process preview. |
| HI-I022 | External discovery scans static `manifest.yaml` and never executes unknown provider code to discover claims. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | `Registry` names derived runtime index/lock/cache, not another authored file. | R2 manifest proof closed; persisted cache/lock remains future. |
| HI-I023 | Duplicate operation claims fail closed unless explicit replacement policy names selected and replaced provider. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md) | Project-over-global config precedence is not authority precedence. | R2 negative tests cover duplicate/reserved/built-in replacement refusal; declared replacement resolution remains future. |
| HI-I024 | Core operation and command namespaces are reserved; plugins add vendor-scoped operations or implement published extension points. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [contracts/operation-catalog.md](contracts/operation-catalog.md) | Unknown capability requests and ambiguous claims fail closed. | R2 negative tests cover reserved namespace, duplicate, unknown capability, and incompatible-contract failures. |
| HI-I025 | `LegacyCliPassthroughProvider` and `LegacySemanticProvider` are distinct adapters with different contracts. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `accepted-not-implemented` | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Captured stdout/stderr never become semantic result; semantic bridge calls extracted Node use case, never `bin/fgos.mjs`. | P4/P8 proof needed. |
| HI-I026 | Node payload identity is `legacy-node`; source file `bin/fgos.mjs` is not relocated or renamed. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `legacy-current` and `accepted-not-implemented` target manifest identity | `keep legacy` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [spec.md](spec.md) | Payload is current npm package as `package.json` `files` defines it, staged whole under `components.legacyNode.root`. | Current file exists; release-manifest proof needed. |
| HI-I027 | The Rust adapter resolves the payload through verified release-manifest legacyNode fields, never PATH, caller cwd, alternate npm bin selection or an unconfined hardcoded payload path. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `code-checked boundary; dated preview proofs retained` | `promote` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [manifest-owned resolver](../../../apps/fgos/src/legacy_exec.rs) | Explicit release/dev environment bindings or current_exe-relative manifest discovery choose the root; manifest invariants, release files and confined legacy entry are verified. | Checked at the pinned candidate source tree: apps/fgos/src/legacy_exec.rs:69-154. package.json:9-12 and bin/fgos.mjs:1-10 retain npm/direct-Node compatibility channels; those channels are not the Rust payload resolver. No new install/activation smoke is claimed. |
| HI-I028 | Old `bin/fgos.mjs` callers require resolver migration; tests that spawn Node directly remain payload tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory) | `planned` | `promote` | [verification/compatibility-harness.md](verification/compatibility-harness.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Nine real call sites route through resolver; `.agents`/`plugins` copies are render targets. | P0/P4 scan proof needed. |
| HI-I029 | Every selector has exactly one generated `CommandRouteDescriptor`, route kind, owner path, and compatibility tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness) | `current partial` | `promote` | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/compatibility-harness.md](verification/compatibility-harness.md) | Descriptor is routing input and contributor repair map; unlisted selector fails build. | Current route matrix has 73 selectors, 71 legacy and two native, with drift tests. |
| HI-I030 | `fgos.v1` is CLI presentation, not provider protocol; legacy passthrough must not be double-wrapped. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | `accepted-not-implemented` | `split` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | Preserve compact hash input, pretty envelope output, order, timestamps, stdout/stderr, exit/signal mapping. | Compatibility vectors needed. |
| HI-I031 | Migration selects Rust host first, Node as legacy provider/lane; Option A and C are rejected. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered) | `accepted-not-implemented` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Do not do repository-wide Node thinning first or big-bang rewrite. | Plan accepted; implementation planned. |
| HI-I032 | Current CLI thinness categories are ordering signals, not authority to migrate by file size. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [history/host-invocation-baseline.md](history/host-invocation-baseline.md) | Preserve near-thin, partly-thin, and not-thin lists. | Needs fresh scan before execution. |
| HI-I033 | R1 migration order includes packaging contract adoption, legacy payload naming, selector descriptor, kernel, CLI adapter, native `version`, external install proof, then installed default flip. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Flip only after compatibility and distribution gates pass. | Preview installed/default flip is proven; stable/default release graduation remains open. |
| HI-I034 | `gate-bypass` is the next read proof, not a pre-created component; `ready` is not first proof. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read) | `implemented local proof` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [roadmap.md](roadmap.md#7-phase-d-add-the-next-native-read-route), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Implemented as existing work/state read ownership with Packaging-Distribution retaining setup/doctor readiness; do not invent `gate-policy`. | Keep proof scoped to read-only `work.gate-bypass.show`; full Work/State migration remains future work. |
| HI-I035 | Read models migrate before writers; writers need sole authority, event/schema compatibility, locks, atomicity, idempotency, crash recovery, mutual exclusion, and rollback compatibility. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Never dual-run a write for shadow comparison. | Future writer proof needed. |
| HI-I036 | Node removal is allowed only after zero legacy routes, replay compatibility, public host contract tests, no init/doctor dependency, and no rollback dependency. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Node removal is consequence of zero routes, not calendar target. | Future cleanup proof needed. |
| HI-I037 | P0-P9 execution graph and proof gates remain planning material, not architecture authority. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph) | `planned` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/compatibility-harness.md](verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) | P-numbering stays P0-P9; PK is packaging dependency, not new P-package. | Proof docs are stubs until executed. |
| HI-I038 | Remaining decisions before R1: target matrix, preview-vs-stable, compatibility-window duration. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution) | `preview settled; stable deferred; fallback window settled` | `deferred` | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Settled packaging choices for publication, rollback, artifact identity, and setup/doctor authority must not be reopened here. | Preview/default is settled; fallback escape-hatch window is 30 calendar days after preview release publication; stable graduation still needs release-owner decision. |
`````

Full shown target:

`````md
| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HI-I001 | The area name is Host Invocation And Provider Routing, centered on the Operation Provider Router; avoid `Component Router` and `Command Router`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `accepted-not-implemented` | `promote` | [README.md](README.md), [architecture/provider-routing.md](architecture/provider-routing.md) | Commands are only CLI projections; not every component is dispatchable. | Needs implementation proof for actual router naming. |
| HI-I002 | Host invocation and provider routing are separate responsibilities: host normalizes/admits; router selects implementation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `current partial` | `split` | [vision.md](vision.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Do not collapse parsing, admission, selection, and provider invocation into one CLI path. | Rust kernel proof exists for current built-in routes, R2 external-provider route, and R3 remote peer route; broader component migration remains partial. |
| HI-I003 | CLI, remote, and chat are peer host use cases; none shells through or wraps another after migration. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases) | `current partial` | `promote` | [architecture/host-use-cases.md](architecture/host-use-cases.md) | Peer status does not require one OS process; hosts may compose the same runtime crate. | CLI and remote peer proof exist for selected operations; chat remains future. |
| HI-I004 | The legacy CLI lane is the only non-`OperationRequest`/`ProviderOutcome` path and never enters `InvocationService` or Router. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases), [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `current partial` with `legacy-current` payload behavior | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Direct Node exec preserves argv/stdin/cwd/env/signals and writes one invocation record without semantic wrapping. | Preview proof exists for the manifest-owned legacy CLI lane; full compatibility vectors remain future cleanup. |
| HI-I005 | Canonical kernel terms include `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, Router, `InvocationService`, `InvocationControl`, `EventSink`, `CommandRouteDescriptor`, and `ConfigPort`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names) | `accepted-not-implemented` | `split` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [contracts/operation-provider.md](contracts/operation-provider.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) | One canonical name per concept; no alias drift. | Contract implementation unknown until Rust types exist. |
| HI-I006 | `OperationId` is stable semantic identity independent of CLI/REST/MCP/chat spelling. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `accepted-not-implemented` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md) | Format `<component>.<object-type>.<action>[.<variant>]`; hosts own projection. | First descriptors remain open. |
| HI-I007 | Built-in providers use typed Rust representation; `EncodedMessage` exists only at external process/WASM boundary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts), [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `split` | [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [contracts/component-protocol.md](contracts/component-protocol.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Raw `OsString` is never semantic request; built-ins never decode bytes. | Built-in Rust routes prove typed provider flow; R2 proves `EncodedMessage` stays private to the external process adapter boundary. |
| HI-I008 | `OperationCatalog` is authored by owning components; CLI registry or provider manifest cannot create an operation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `current partial` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | R1 uses const catalog/snapshot at composition root; no linker/cache/manifest scan in R1. | Current built-in catalog proof exists; R2 proves external manifests cannot claim reserved core operations and only add through the external provider linker path. |
| HI-I009 | Router is pure selection; `InvocationService` owns admit, select, grant, invoke, normalize, and record. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Router has no I/O, async, invocation, failure normalization, reporting, or host parsing. | Current Rust slice plus R2 external process proof use the same router/InvocationService path; replacement resolution remains partial. |
| HI-I010 | Authority has two stages: caller admission before routing and selected-provider grant after routing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/operation-provider.md](contracts/operation-provider.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Provider manifest is never authority; selected grant is least privilege. | Current authority-gate proof exists; R2 negative tests cover external manifest/linker refusal and same-pipeline provider grants. |
| HI-I011 | Configuration can never replace a built-in provider; rollback is via `fgctl` release rollback, not provider-selection swap. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Replacement policy only governs explicit external/plugin surface. | Preview `fgctl` proof exists; stable/default graduation remains a release-owner decision, while fallback removal follows the 30-day preview window. |
| HI-I012 | Failure families are closed and host presenters map them to their own public contracts. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `current partial` | `split` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/implementation-alignment.md](verification/implementation-alignment.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Provider crash is not semantic failure; partial output does not imply success. | Built-in provider errors and R2 external process crash/timeout/cancellation mapping are covered for preview; future routes/providers must keep the closed-family mapping. |
| HI-I013 | Exactly one terminal lifecycle record is emitted; late response after cancellation/deadline is diagnostic evidence, not second truth. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) | Records carry ids, contracts, registry fingerprint, provider id, host kind, timing, terminal family, evidence refs; never secrets. | Lifecycle recorder implementation missing. |
| HI-I014 | Providers never block waiting for human input; they return `parked`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | No mid-invocation callback to solicit input. | Needed before `ask`/`answer` migration. |
| HI-I015 | Public command name remains `fgos`; runtime identity is release digest; `fgctl` is separate bootstrap binary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [spec.md](spec.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Do not rename `fgos` to `fgctl`; `fgctl` owns bootstrap. | Preview proof shows `fgos` runtime identity through `version --runtime-json`; stable/default graduation remains open. |
| HI-I016 | R1 physical placement is three Rust crates plus unmoved Node payload; `component-protocol` waits for R2. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | No `packages/legacy-node` crate; legacy exec is CLI-adapter module; do not create fake `gate-policy` component. | R1 placement and R2 component protocol preview proof are closed; production ecosystem hardening remains future. |
| HI-I017 | R1 ships a distributable Rust CLI host, native `version`, and transparent Node compatibility. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | R1 is useful without R2/R3; repo tests alone do not mean stable/default release graduation. | Preview installed/default proof is recorded; stable/default graduation remains open. |
| HI-I018 | R2 proves external process provider preview without marketplace/signature/WASM scope. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview) | `implemented preview` | `promote` | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Static manifest validation and fail-closed protocol behavior gate R2. | R2 proof closed with `fixture.echo.echo`; marketplace/signature/WASM remain future. |
| HI-I019 | R3 proves a production remote peer through project-local gateway without CLI shelling or `fgos.v1` parsing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host) | `implemented preview` | `promote` | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md), [architecture/host-use-cases.md](architecture/host-use-cases.md) | Future shared multi-project gateway is separate and uses Project Runtime Adapter. | `GET /v1/runtime` proves the first project-local gateway peer route for `distribution.build.show`; all other gateway routes remain legacy `VerbGateway` consumers. |
| HI-I020 | Component class and invocation mechanism are separate axes. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes) | `accepted-not-implemented` | `promote` | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) | Core/packaged extension/user plugin differ from built-in/process/WASM mechanisms. | Provider descriptor proof needed. |
| HI-I021 | External process protocol is JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `promote` | [contracts/component-protocol.md](contracts/component-protocol.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Stdout is protocol only; logs go to stderr or declared notification; newline JSON is not contract. | R2 conformance closed for external process preview. |
| HI-I022 | External discovery scans static `manifest.yaml` and never executes unknown provider code to discover claims. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | `Registry` names derived runtime index/lock/cache, not another authored file. | R2 manifest proof closed; persisted cache/lock remains future. |
| HI-I023 | Duplicate operation claims fail closed unless explicit replacement policy names selected and replaced provider. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md) | Project-over-global config precedence is not authority precedence. | R2 negative tests cover duplicate/reserved/built-in replacement refusal; declared replacement resolution remains future. |
| HI-I024 | Core operation and command namespaces are reserved; plugins add vendor-scoped operations or implement published extension points. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [contracts/operation-catalog.md](contracts/operation-catalog.md) | Unknown capability requests and ambiguous claims fail closed. | R2 negative tests cover reserved namespace, duplicate, unknown capability, and incompatible-contract failures. |
| HI-I025 | `LegacyCliPassthroughProvider` and `LegacySemanticProvider` are distinct adapters with different contracts. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `accepted-not-implemented` | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Captured stdout/stderr never become semantic result; semantic bridge calls extracted Node use case, never `bin/fgos.mjs`. | P4/P8 proof needed. |
| HI-I026 | Node payload identity is `legacy-node`; source file `bin/fgos.mjs` is not relocated or renamed. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `legacy-current` and `accepted-not-implemented` target manifest identity | `keep legacy` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [spec.md](spec.md) | Payload is current npm package as `package.json` `files` defines it, staged whole under `components.legacyNode.root`. | Current file exists; release-manifest proof needed. |
| HI-I027 | The Rust adapter resolves the payload through verified release-manifest legacyNode fields, never from PATH, never from the caller’s cwd, never as an alternate package-manager bin entry, and never hardcoded. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `accepted-not-implemented` target; manifest-owned resolver checked, dated preview proofs retained | `promote` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [manifest-owned resolver](../../../apps/fgos/src/legacy_exec.rs) | Explicit release/dev environment bindings or current_exe-relative manifest discovery choose the root; manifest invariants, release files and confined legacy entry are verified. | Checked at the pinned candidate source tree: apps/fgos/src/legacy_exec.rs:69-154. package.json:9-12 and bin/fgos.mjs:1-10 retain npm/direct-Node compatibility channels; those channels are not the Rust payload resolver. No new install/activation smoke is claimed. |
| HI-I028 | Old `bin/fgos.mjs` callers require resolver migration; tests that spawn Node directly remain payload tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory) | `planned` | `promote` | [verification/compatibility-harness.md](verification/compatibility-harness.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Nine real call sites route through resolver; `.agents`/`plugins` copies are render targets. | P0/P4 scan proof needed. |
| HI-I029 | Every selector has exactly one generated `CommandRouteDescriptor`, route kind, owner path, and compatibility tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness) | `current partial` | `promote` | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/compatibility-harness.md](verification/compatibility-harness.md) | Descriptor is routing input and contributor repair map; unlisted selector fails build. | Current route matrix has 75 selectors, 70 legacy and five native, with drift tests. |
| HI-I030 | `fgos.v1` is CLI presentation, not provider protocol; legacy passthrough must not be double-wrapped. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | `accepted-not-implemented` | `split` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | Preserve compact hash input, pretty envelope output, order, timestamps, stdout/stderr, exit/signal mapping. | Compatibility vectors needed. |
| HI-I031 | Migration selects Rust host first, Node as legacy provider/lane; Option A and C are rejected. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered) | `accepted-not-implemented` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Do not do repository-wide Node thinning first or big-bang rewrite. | Plan accepted; implementation planned. |
| HI-I032 | Current CLI thinness categories are ordering signals, not authority to migrate by file size. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [history/host-invocation-baseline.md](history/host-invocation-baseline.md) | Preserve near-thin, partly-thin, and not-thin lists. | Needs fresh scan before execution. |
| HI-I033 | R1 migration order includes packaging contract adoption, legacy payload naming, selector descriptor, kernel, CLI adapter, native `version`, external install proof, then installed default flip. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Flip only after compatibility and distribution gates pass. | Preview installed/default flip is proven; stable/default release graduation remains open. |
| HI-I034 | `gate-bypass` is the next read proof, not a pre-created component; `ready` is not first proof. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read) | `implemented local proof` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [roadmap.md](roadmap.md#7-phase-d-add-the-next-native-read-route), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Implemented as existing work/state read ownership with Packaging-Distribution retaining setup/doctor readiness; do not invent `gate-policy`. | Keep proof scoped to read-only `work.gate-bypass.show`; full Work/State migration remains future work. |
| HI-I035 | Read models migrate before writers; writers need sole authority, event/schema compatibility, locks, atomicity, idempotency, crash recovery, mutual exclusion, and rollback compatibility. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Never dual-run a write for shadow comparison. | Future writer proof needed. |
| HI-I036 | Node removal is allowed only after zero legacy routes, replay compatibility, public host contract tests, no init/doctor dependency, and no rollback dependency. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Node removal is consequence of zero routes, not calendar target. | Future cleanup proof needed. |
| HI-I037 | P0-P9 execution graph and proof gates remain planning material, not architecture authority. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph) | `planned` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/compatibility-harness.md](verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) | P-numbering stays P0-P9; PK is packaging dependency, not new P-package. | Proof docs are stubs until executed. |
| HI-I038 | Remaining decisions before R1: target matrix, preview-vs-stable, compatibility-window duration. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution) | `preview settled; stable deferred; fallback window settled` | `deferred` | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Settled packaging choices for publication, rollback, artifact identity, and setup/doctor authority must not be reopened here. | Preview/default is settled; fallback escape-hatch window is 30 calendar days after preview release publication; stable graduation still needs release-owner decision. |
`````

### claim_b6387d30d960295b4b435073f651049f

Source: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-8 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-9 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2

Target unit digest: 6285e4bf68b83ee0e8090de22df3316e6c529bef2f750c8a33e3983c22aae9a5

Shown source digest: 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2

Shown target digest: 6285e4bf68b83ee0e8090de22df3316e6c529bef2f750c8a33e3983c22aae9a5

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-8 is replaced in the same document by #unheaded-block-9. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

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
| Native `OperationId` descriptors beyond `distribution.build.show` | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a test fixture. | Host invocation; reopen when adding another native route. |
| `gate-bypass` ownership | Closed; local native proof implemented | Code places read semantics under state, config readiness under setup, and CLI grammar under the command registry; native migration uses existing work/state read ownership and avoids a new `gate-policy` component. | Host invocation plus existing work/state owner; Packaging-Distribution remains owner for setup/doctor readiness. |
| First external provider preview set | Product / conformance decision | R2 needs a fixture provider set, but the source docs left that selection open; this is now the next host-invocation frontier. | Host invocation plus provider owners. |
| Chat host contracts | Future host contract decision | Chat is a planned peer host, but its adapter, interruption, and presentation contracts are not yet defined. | Host invocation. |
`````

### claim_09c874b5c58f74c3744ef149d0e8c3bc

Source: docs/platform/host-invocation-routing/roadmap.md#migration-status-note at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#historical-migration-status-note at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 10609d492de231f4a29fa203b1270b09a5d50eea31c50d8102ce79393f71d468

Target unit digest: c67619ba2bc360580b6127bb4b93b9358875e6513207ece712288be415e59496

Shown source digest: fb29b19a556b6fab235cb5e84ebb49f58b7b4d370f3711536ee43866e9b05028

Shown target digest: a938357f3ce333ec39444b1669ee24e5f571026936f46e6475b4054616c60d7a

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#migration-status-note is replaced in the same document by #historical-migration-status-note. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
#### Migration Status Note

This document remains a legacy-current execution-plan source during the
2026-09-14 promotion pass. The promoted platform docs are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy execution-plan source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_a280efc911bcb1010f131a48de7a7bac

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-119 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-121 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Target unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Shown source digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Shown target digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-119 is replaced in the same document by #unheaded-block-121. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

### claim_3cd74cd8e3e79a2a2578252da59955d3

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-120 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-122 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Target unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Shown source digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Shown target digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-120 is replaced in the same document by #unheaded-block-122. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

### claim_51a9f0addbe54a02f70eca3046b38464

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-124 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-126 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Target unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Shown source digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

Shown target digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-124 is replaced in the same document by #unheaded-block-126. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

### claim_ce29f4c2f27a7a5d9e5266aa311e2774

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-4 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b

Target unit digest: 470ddd3bc8b62c4b74b260dffc943949e49cad26eb2faa66e9e9c0845c542b38

Shown source digest: 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b

Shown target digest: 470ddd3bc8b62c4b74b260dffc943949e49cad26eb2faa66e9e9c0845c542b38

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

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
| [apps/fgos/src/cli_projector.rs](../../../apps/fgos/src/cli_projector.rs) | Native CLI routes project `version` to `distribution.build.show` and `gate-bypass` to `work.gate-bypass.show`. |
| [packages/distribution/rust/src/lib.rs](../../../packages/distribution/rust/src/lib.rs) | `distribution.build.show` provider exists. |
| `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14 during code scan and local Phase A proof refresh. |
| `node --test test/rust-host/command-routes.test.mjs` | Passed on 2026-09-14 during local Phase A proof refresh. |
| [package.json](../../../package.json) | npm `bin.fgos` still points to `bin/fgos.mjs`, the legacy Node compatibility entry. |
| Preview release proof | Published GitHub release `v0.1.0` on 2026-09-18 includes `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; release workflow `35317876419` passed, and post-release CI run `35498322149` passed including external-consumer proof. Local release-shaped assets also passed `scripts/ci-external-consumer.sh --assets <dir>` on 2026-09-15. |
`````

### claim_205ab893bcb20e61e215eb56f01c4e08

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-40 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-41 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: f18c77cb977aaa9a2e16999f24f0136f4857ece188c5c8a3d8a28580afd2765f

Target unit digest: 6253bce61340a663e2dcb3a910ba19065911e4ab74fe348863a410f3486e2d3e

Shown source digest: f18c77cb977aaa9a2e16999f24f0136f4857ece188c5c8a3d8a28580afd2765f

Shown target digest: 6253bce61340a663e2dcb3a910ba19065911e4ab74fe348863a410f3486e2d3e

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-40 is replaced in the same document by #unheaded-block-41. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Detailed rollout plan: `R3 execution record` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`).
`````

Full shown target:

`````md
Detailed rollout plan: [R3 execution record](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md).
`````

### claim_aa8842ac447d7cca1598df492d7801d1

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-57 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-58 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 762bc840497bd26b419b9193ebb202b5f838de4a26c73e111b0c289a8f25902d

Target unit digest: f4d0e1ae6fe79de37172b94ecb2d0216dc6ecfd6078038f358cdcbcb42aa3a1f

Shown source digest: 762bc840497bd26b419b9193ebb202b5f838de4a26c73e111b0c289a8f25902d

Shown target digest: f4d0e1ae6fe79de37172b94ecb2d0216dc6ecfd6078038f358cdcbcb42aa3a1f

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-57 is replaced in the same document by #unheaded-block-58. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Order | Action | Owner | Packaging dependency |
| --- | --- | --- | --- |
| 1 | Keep preview proof green: route matrix stays at 73 selectors / 71 `legacy-cli` / two native until a new migration intentionally changes it. | Host invocation | No |
| 2 | Decide whether the next frontier is another native read route, another remote read route, or the chat-host contract. Do not treat R2/R3 closeout as whole-component migration. | Host invocation | No, unless the chosen route touches release/runtime selection. |
| 3 | Keep stable/default graduation parked with the release owner; enforce the settled 30-day legacy fallback escape-hatch window for preview. | Packaging-distribution / release owner | Yes |
| 4 | For external providers, choose whether to harden the preview mechanism (persisted cache/lock, shipped provider packaging, marketplace/signatures, WASM) before accepting non-fixture providers. | Host invocation plus Packaging-Distribution where artifacts ship | Maybe |
`````

Full shown target:

`````md
| Order | Action | Owner | Packaging dependency |
| --- | --- | --- | --- |
| 1 | Keep preview proof green: route matrix stays at 75 selectors / 70 `legacy-cli` / five native until a new migration intentionally changes it. | Host invocation | No |
| 2 | Decide whether the next frontier is another native read route, another remote read route, or the chat-host contract. Do not treat R2/R3 closeout as whole-component migration. | Host invocation | No, unless the chosen route touches release/runtime selection. |
| 3 | Keep stable/default graduation parked with the release owner; enforce the settled 30-day legacy fallback escape-hatch window for preview. | Packaging-distribution / release owner | Yes |
| 4 | For external providers, choose whether to harden the preview mechanism (persisted cache/lock, shipped provider packaging, marketplace/signatures, WASM) before accepting non-fixture providers. | Host invocation plus Packaging-Distribution where artifacts ship | Maybe |
`````

### claim_2683f0b08d28a984d6aba983aa71d3c3

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-62 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-63 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 571b35923c8fa16665f8e7c05d16dd8932251c62c0773c168d42e92d74e33ebc

Target unit digest: 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e

Shown source digest: 571b35923c8fa16665f8e7c05d16dd8932251c62c0773c168d42e92d74e33ebc

Shown target digest: 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-62 is replaced in the same document by #unheaded-block-63. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
This document remains a legacy-current execution-plan source during the
2026-09-14 promotion pass. The promoted platform docs are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy execution-plan source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_02ca18de57f73ee92ff5c94c6e7fb550

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-78 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-80 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Target unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Shown source digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Shown target digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-78 is replaced in the same document by #unheaded-block-80. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_4c020205ca6e82f71812652dcae5a812

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-79 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-81 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Target unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Shown source digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Shown target digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-79 is replaced in the same document by #unheaded-block-81. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_857706b08a50b9a871a087624bd094ea

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-8 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-9 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 8b4f5a17fceff4ccc66ec2b8064a259453563feac5b4c87ddeceb2978920c8e6

Target unit digest: a6f8be6c25e2a74e3951a8e8393d14950a93bc72c1172ee763bf527191e173f9

Shown source digest: 8b4f5a17fceff4ccc66ec2b8064a259453563feac5b4c87ddeceb2978920c8e6

Shown target digest: a6f8be6c25e2a74e3951a8e8393d14950a93bc72c1172ee763bf527191e173f9

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-8 is replaced in the same document by #unheaded-block-9. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Phase A, Phase D's local native-read proof, Phase E (R2, closed 2026-09-15),
and the preview parts of Phase B/C are closed. Stable/default graduation still
requires packaging-distribution or release-owner decisions. Phase F now has
its precondition satisfied (Phase E delivered `fixture.echo.echo`, a semantic
operation that is not only a built-in CLI route) and can proceed on its own
rollout plan. Phase F is now implemented preview: R3-P0 through R3-P5 are
closed on 2026-09-18, proving native remote peer invocation for
`distribution.build.show` (`GET /v1/runtime` in `apps/fgos-gateway/src/gateway.rs`)
without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other
gateway routes remain on `VerbGateway` per the
`R3 execution record` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`).
`````

Full shown target:

`````md
Phase A, Phase D's local native-read proof, Phase E (R2, closed 2026-09-15),
and the preview parts of Phase B/C are closed. Stable/default graduation still
requires packaging-distribution or release-owner decisions. Phase F now has
its precondition satisfied (Phase E delivered `fixture.echo.echo`, a semantic
operation that is not only a built-in CLI route) and can proceed on its own
rollout plan. Phase F is now implemented preview: R3-P0 through R3-P5 are
closed on 2026-09-18, proving native remote peer invocation for
`distribution.build.show` (`GET /v1/runtime` in `apps/fgos-gateway/src/gateway.rs`)
without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other
gateway routes remain on `VerbGateway` per the
[R3 execution record](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md).
`````

### claim_58fd865b8fca08796a490cad3fb7f6ce

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-82 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-84 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Target unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Shown source digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Shown target digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-82 is replaced in the same document by #unheaded-block-84. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_43628b076df7f79ac815eb2f09756d94

Source: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-83 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-85 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Target unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Shown source digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

Shown target digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-83 is replaced in the same document by #unheaded-block-85. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

### claim_1acbe35c100c6ce87858b6de61cd7e96

Source: docs/platform/host-invocation-routing/spec.md#migration-status-note at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#historical-migration-status-note at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 276515af31eaa5688e1d0dfaf01137d3696cf7e650d6115adedc6569febe4d16

Target unit digest: cf64a5c903ae0225be855f3e70d01ef8e268e7de94d741063cb5afb351ca10c6

Shown source digest: 168bb2f01b0bece241e30a27849e494a45cb1a0b5a9255e6d7a4b13f6c9b7c39

Shown target digest: 27802c28adbb91c3aa65fe5387b8fdd46c85f855b9b04741fe6af5f601179364

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#migration-status-note is replaced in the same document by #historical-migration-status-note. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
#### Migration Status Note

This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
#### Historical Migration Status Note

Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_65a7aae7b5028b9cda27951a0b7b6ac4

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-10 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-11 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4

Target unit digest: 467ad3ca4c303a0828566f84764aaca4a32ec89b695dcb324a6f8daca798ed2e

Shown source digest: 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4

Shown target digest: 467ad3ca4c303a0828566f84764aaca4a32ec89b695dcb324a6f8daca798ed2e

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-10 is replaced in the same document by #unheaded-block-11. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

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
| Exact native descriptors beyond `distribution.build.show` | Code-verified current snapshot | The current native selector set is `convention`, `friction`, `gate-bypass`, `metrics`, `version`; `test.fixture.echo` remains a test fixture in the host-runtime catalog/provider. | Blocks only future expansion, not the current docs migration. | Reopen when another production native selector is proposed. |
| `gate-bypass` component ownership | Closed; local native proof implemented | Current code places gate-bypass read behavior in `src/state/gate-bypass.mjs`, exposes CLI descriptors in `src/cli/command-registry.mjs`, and setup/doctor config readiness in `src/setup/registrations.mjs`. The Rust route implements the read-only surface as `work.gate-bypass.show`, using existing work/state read ownership; setup/doctor config readiness remains Packaging-Distribution. | Does not prove full Work/State migration or installed-default release posture. | Keep `work.gate-bypass.show` as a local native read proof and record no component-boundary change. |
| First external provider preview set | Closed preview conformance decision | R2 selected the `fixture.echo.echo` provider and closed manifest, linker, frame codec, supervisor, and integration proof. | Blocks only future production ecosystem hardening, not R2 preview. | Keep [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) current when provider protocol behavior changes. |
| Chat host admission, interruption, and presentation semantics | Future host contract decision | Scan found no current chat host adapter implementation. Chat remains only a planned peer-host concept. | Blocks chat from being treated as more than planned/future. | A chat-host contract and proof plan are added before any chat host is called current. |
`````

### claim_0f056e8e4333aa21479d5470041f7894

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-16 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-17 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: f66f31f2045455ac771ba83435fb913e5bb982be2896f56df06d86ea2d4ed69c

Target unit digest: b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d

Shown source digest: f66f31f2045455ac771ba83435fb913e5bb982be2896f56df06d86ea2d4ed69c

Shown target digest: b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-16 is replaced in the same document by #unheaded-block-17. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Full shown target:

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

### claim_f0fd5b73b1ba81375c4831240c554b7e

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-4 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: a2b0cf841d5cbe0e13f237dfb2264c847aa88ed3fc06c465f05cd2e93c309f95

Target unit digest: 52806d831c8db7061ebf5c1dd984b44d4f62fd7e0c2de30242d9d10499c55b76

Shown source digest: a2b0cf841d5cbe0e13f237dfb2264c847aa88ed3fc06c465f05cd2e93c309f95

Shown target digest: 52806d831c8db7061ebf5c1dd984b44d4f62fd7e0c2de30242d9d10499c55b76

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, and routes other selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 71 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `implemented preview` | R2 proves static manifest discovery, derived linker/registry, framed JSON-RPC-over-stdio component protocol, bounded supervision, fail-closed negative cases, and an end-to-end `fixture.echo.echo` invocation through `InvocationService`. | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Production remote peer | `implemented preview` | `GET /v1/runtime` calls shared `InvocationService` directly through the remote projector/presenter for `distribution.build.show`, without `VerbGateway`, CLI shelling, Node spawn, or `fgos.v1` parsing. Other gateway routes remain legacy. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
`````

Full shown target:

`````md
| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, also routes `convention`, `metrics` and `friction` natively, and routes the remaining 70 selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 70 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `implemented preview` | R2 proves static manifest discovery, derived linker/registry, framed JSON-RPC-over-stdio component protocol, bounded supervision, fail-closed negative cases, and an end-to-end `fixture.echo.echo` invocation through `InvocationService`. | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Production remote peer | `implemented preview` | `GET /v1/runtime` calls shared `InvocationService` directly through the remote projector/presenter for `distribution.build.show`, without `VerbGateway`, CLI shelling, Node spawn, or `fgos.v1` parsing. Other gateway routes remain legacy. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
`````

### claim_553c06e1b580ca8245d9281acc5a72a3

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-37 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-38 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

Target unit digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

Shown source digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

Shown target digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-37 is replaced in the same document by #unheaded-block-38. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-002 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).
`````

### claim_8adc05c374c6a68eced46cf469cc8cec

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-54 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-55 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 052e5ba9d1a46c809ec39b1208ad9e1c7c84b0db485c7cf7ea5b67e198574564

Target unit digest: e9ceee2df5e4cb99e6e2418af4aaa15a968c8d9dc66884dea7c5841de4a8d62f

Shown source digest: 052e5ba9d1a46c809ec39b1208ad9e1c7c84b0db485c7cf7ea5b67e198574564

Shown target digest: e9ceee2df5e4cb99e6e2418af4aaa15a968c8d9dc66884dea7c5841de4a8d62f

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-54 is replaced in the same document by #unheaded-block-55. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-003 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).
`````

### claim_4fa010c6ebfeef774f7f86372ad80a74

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-56 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-57 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

Target unit digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

Shown source digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

Shown target digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-56 is replaced in the same document by #unheaded-block-57. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-002 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).
`````

### claim_630897f30824261a6545dcd9885cfd13

Source: docs/platform/host-invocation-routing/spec.md#unheaded-block-59 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/spec.md#unheaded-block-60 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 4be6696c53f2d2bc639db2edbbe8faa1fa265565a3a5af5e794a1ad6de706991

Target unit digest: e953c05405687a15a1bd3d4832b5cd375b9e109b41c65c911cd1b0d8416553b6

Shown source digest: 4be6696c53f2d2bc639db2edbbe8faa1fa265565a3a5af5e794a1ad6de706991

Shown target digest: e953c05405687a15a1bd3d4832b5cd375b9e109b41c65c911cd1b0d8416553b6

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/spec.md#unheaded-block-59 is replaced in the same document by #unheaded-block-60. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-004 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree`).
`````

Full shown target:

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).
`````

### claim_5792d0ca65e70e4db334cb35edc0fec5

Source: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-4 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: c50cfdce5e0df606998194c04ed62e08895dadcecd12a21333a6593dcedeaaf1

Target unit digest: fe03ebab91c4b902931e990e36c4299d39e1eab46422c09146f14b32fbdb3b23

Shown source digest: c50cfdce5e0df606998194c04ed62e08895dadcecd12a21333a6593dcedeaaf1

Shown target digest: fe03ebab91c4b902931e990e36c4299d39e1eab46422c09146f14b32fbdb3b23

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI payload remains current compatibility behavior. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs), [../../../../package.json](../../../../package.json) | Keep until Node removal gates pass. |
| `bin/fgos.mjs` is not relocated or renamed in source. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | No action in docs migration. |
| Host invocation docs moved under platform area. | `current` | [../README.md](../README.md) | Old docs carry legacy/status notes for this migration pass. |
| No component-boundary change. | `current` | [../../component-boundary.md](../../component-boundary.md) | This migration does not change ownership or authority. |
| CLI and remote peer host model. | `current partial` | [../../../../packages/host-runtime/rust/tests/two_projectors.rs](../../../../packages/host-runtime/rust/tests/two_projectors.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | CLI and remote both share `InvocationService` for selected operations. R3 proves `GET /v1/runtime`; all other gateway routes remain legacy `VerbGateway`, and chat remains future. |
| Chat peer host model. | `planned` | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) | No chat adapter found in code scan. |
| Native `OperationRequest`/`ProviderOutcome` kernel. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current Rust slice exists; future providers may extend it. |
| Pure Router plus `InvocationService` pipeline. | `current partial` | [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs) | Replacement resolution policy remains a documented R1 gap in registry/router code. |
| Two-stage authority. | `current partial` | [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | R2-P5 proved the external process provider goes through the SAME unmodified caller-admission/selected-provider-grant pipeline as any built-in provider -- an ad-hoc synthetic-admission bypass was caught in review and deleted before merge, not shipped. R3 proves the remote host path for `distribution.build.show`; chat host authority proof remains future work. |
| `legacy-cli` bypasses semantic kernel and execs Node payload directly. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview installed/default proof is closed; route migration remains partial because 71 selectors still use the manifest-owned legacy CLI lane. |
| `CommandRouteDescriptor` exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current snapshot has 73 selectors: 71 `legacy-cli`, two native. Keep drift tests current. |
| External process provider protocol. | `implemented preview` | [../contracts/component-protocol.md](../contracts/component-protocol.md), [../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs](../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs](../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P3/P4 conformance suite passed (frame round-trip/reject cases, bounded supervision, crash/timeout/cancellation mapping); closed 2026-09-15. Production WASM and non-preview hardening remain future work. |
| Static external manifest discovery without execution. | `implemented preview` | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs](../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs](../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P1/P2 fixture proof passed (fail-closed on malformed/missing/path-escaping/unsupported manifests; discovery proven not to execute provider code; duplicate/reserved/unknown-capability/incompatible-contract/built-in-replacement claims all refused); closed 2026-09-15. |
| Native `version` as `distribution.build.show`. | `implemented preview` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), `cargo test -p fgos-host-runtime -p fgos --quiet` | Targeted Rust tests passed on 2026-09-14; preview external-consumer proof passed on 2026-09-15. Stable/default graduation remains a release-owner decision. |
| Production remote peer route. | `implemented preview` | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --lib gateway --quiet` | R3-P2..P5 closed in this cell's commit. Proves native remote peer invocation for `distribution.build.show` (`GET /v1/runtime`) without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other gateway routes remain on `VerbGateway`. |
| R1 route matrix. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), `node --test test/rust-host/command-routes.test.mjs` | Code snapshot verified on 2026-09-14: 73 selectors, 71 legacy, two native. |
| Preview/stable and compatibility-window duration. | `preview settled; stable open; fallback window settled` | [../architecture/release-boundaries.md](../architecture/release-boundaries.md#2-open-release-decisions), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md) | Preview public posture is approved with Rust host as default installed runtime. Legacy Node fallback remains an explicit deprecated escape hatch for 30 calendar days after preview release publication. Stable/default graduation remains a product/release decision. |
| `gate-bypass` as next read proof. | `implemented local proof` | [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../../../../src/state/gate-bypass.mjs](../../../../src/state/gate-bypass.mjs), [../../../../src/setup/registrations.mjs](../../../../src/setup/registrations.mjs), [../../../../src/cli/command-registry.mjs](../../../../src/cli/command-registry.mjs), [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route) | No component-boundary change: read semantics belong to the existing work/state read core; setup/doctor readiness remains Packaging-Distribution. This proves only the read-only `work.gate-bypass.show` route, not full Work/State migration. |
`````

Full shown target:

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI payload remains current compatibility behavior. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs), [../../../../package.json](../../../../package.json) | Keep until Node removal gates pass. |
| `bin/fgos.mjs` is not relocated or renamed in source. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | No action in docs migration. |
| Host invocation docs moved under platform area. | `current` | [../README.md](../README.md) | Old docs carry legacy/status notes for this migration pass. |
| No component-boundary change. | `current` | [../../component-boundary.md](../../component-boundary.md) | This migration does not change ownership or authority. |
| CLI and remote peer host model. | `current partial` | [../../../../packages/host-runtime/rust/tests/two_projectors.rs](../../../../packages/host-runtime/rust/tests/two_projectors.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | CLI and remote both share `InvocationService` for selected operations. R3 proves `GET /v1/runtime`; all other gateway routes remain legacy `VerbGateway`, and chat remains future. |
| Chat peer host model. | `planned` | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) | No chat adapter found in code scan. |
| Native `OperationRequest`/`ProviderOutcome` kernel. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current Rust slice exists; future providers may extend it. |
| Pure Router plus `InvocationService` pipeline. | `current partial` | [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs) | Replacement resolution policy remains a documented R1 gap in registry/router code. |
| Two-stage authority. | `current partial` | [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | R2-P5 proved the external process provider goes through the SAME unmodified caller-admission/selected-provider-grant pipeline as any built-in provider -- an ad-hoc synthetic-admission bypass was caught in review and deleted before merge, not shipped. R3 proves the remote host path for `distribution.build.show`; chat host authority proof remains future work. |
| `legacy-cli` bypasses semantic kernel and execs Node payload directly. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview installed/default proof is closed; route migration remains partial because 70 selectors still use the manifest-owned legacy CLI lane. |
| `CommandRouteDescriptor` exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current snapshot has 75 selectors: 70 `legacy-cli`, five native. Keep drift tests current. |
| External process provider protocol. | `implemented preview` | [../contracts/component-protocol.md](../contracts/component-protocol.md), [../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs](../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs](../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P3/P4 conformance suite passed (frame round-trip/reject cases, bounded supervision, crash/timeout/cancellation mapping); closed 2026-09-15. Production WASM and non-preview hardening remain future work. |
| Static external manifest discovery without execution. | `implemented preview` | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs](../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs](../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P1/P2 fixture proof passed (fail-closed on malformed/missing/path-escaping/unsupported manifests; discovery proven not to execute provider code; duplicate/reserved/unknown-capability/incompatible-contract/built-in-replacement claims all refused); closed 2026-09-15. |
| Native `version` as `distribution.build.show`. | `implemented preview` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), `cargo test -p fgos-host-runtime -p fgos --quiet` | Targeted Rust tests passed on 2026-09-14; preview external-consumer proof passed on 2026-09-15. Stable/default graduation remains a release-owner decision. |
| Production remote peer route. | `implemented preview` | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --lib gateway --quiet` | R3-P2..P5 closed in this cell's commit. Proves native remote peer invocation for `distribution.build.show` (`GET /v1/runtime`) without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other gateway routes remain on `VerbGateway`. |
| R1 route matrix. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), `node --test test/rust-host/command-routes.test.mjs` | Historical code snapshot verified on 2026-09-14: 73 selectors, 71 legacy, two native. Added in candidate: current 2026-10-13 recount is 75 selectors, 70 legacy-cli and five native (convention, friction, gate-bypass, metrics, version), from command-routes.json. |
| Preview/stable and compatibility-window duration. | `preview settled; stable open; fallback window settled` | [../architecture/release-boundaries.md](../architecture/release-boundaries.md#2-open-release-decisions), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md) | Preview public posture is approved with Rust host as default installed runtime. Legacy Node fallback remains an explicit deprecated escape hatch for 30 calendar days after preview release publication. Stable/default graduation remains a product/release decision. |
| `gate-bypass` as next read proof. | `implemented local proof` | [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../../../../src/state/gate-bypass.mjs](../../../../src/state/gate-bypass.mjs), [../../../../src/setup/registrations.mjs](../../../../src/setup/registrations.mjs), [../../../../src/cli/command-registry.mjs](../../../../src/cli/command-registry.mjs), [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route) | No component-boundary change: read semantics belong to the existing work/state read core; setup/doctor readiness remains Packaging-Distribution. This proves only the read-only `work.gate-bypass.show` route, not full Work/State migration. |
`````

### claim_2549fb95501e270298d3272b058e7887

Source: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-3 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-4 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e

Target unit digest: 7e25265bed79ca04ec8c529cae7496c2058099935c179c4a050f5519401c198b

Shown source digest: 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e

Shown target digest: 7e25265bed79ca04ec8c529cae7496c2058099935c179c4a050f5519401c198b

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-3 is replaced in the same document by #unheaded-block-4. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

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
| Native selectors | `current partial`: `version -> distribution.build.show`; local native read proof: `gate-bypass -> work.gate-bypass.show` |
| Production native descriptors beyond `distribution.build.show` | `current partial`: `gate-bypass -> work.gate-bypass.show`; `test.fixture.echo` is a test fixture |
| Installed/default runtime claim for preview public posture | `implemented preview`: release `v0.1.0` was published on 2026-09-18 with `fgctl`, `fgos`, `SHA256SUMS`, and `install.sh` assets; external installs default `fgos` through the Rust host; public docs may state Rust host is the default installed runtime. |
`````

### claim_bbcbde43aa6d15be5e73047b811ea7f3

Source: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-13 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-14 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 0b12afe86af5ff208d0a5923d0e7a3a7dd421b77b994647bdaa910722f9fd896

Target unit digest: 33b235b3de6e4cc1c1379e2d5389af923d5d29fe04cd312f704fb7cd0ed797d0

Shown source digest: 0b12afe86af5ff208d0a5923d0e7a3a7dd421b77b994647bdaa910722f9fd896

Shown target digest: 33b235b3de6e4cc1c1379e2d5389af923d5d29fe04cd312f704fb7cd0ed797d0

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-13 is replaced in the same document by #unheaded-block-14. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

Full shown source:

`````md
Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2. These remain future work for R3 or later, per the `R2 execution record` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`)'s own non-goals.
`````

Full shown target:

`````md
Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2. These remain future work for R3 or later, per the [R2 execution record](../../../../archive/plans/260915-host-invocation-r2-external-process/plan.md)'s own non-goals.
`````

### claim_51d3818de63d806db2841b0504336134

Source: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-10 at 13322f8a6712df4bb3dd69e7df208e237f32c216

Target: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-11 at b69197f88749fc6e1acc14797186f039a19e9793

Source unit digest: 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619

Target unit digest: b8c6c828860673a1d0ca70d074eb36712557197d058308786b62ac19568a02d9

Shown source digest: 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619

Shown target digest: b8c6c828860673a1d0ca70d074eb36712557197d058308786b62ac19568a02d9

Rationale: Necessary identity accounting for the authorized candidate correction: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-10 is replaced in the same document by #unheaded-block-11. Full old/current text and digests are shown for independent review; this carries the corrected whole unit, preserves its documentation subject, and adds no approval. Navigation destinations and current route/status statements are changed only as the committed checkpoint and owner continuation require.

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
| Production native descriptors beyond `distribution.build.show`. | Code-verified current snapshot | `gate-bypass -> work.gate-bypass.show` is the second production native route; `test.fixture.echo` is a host-runtime test fixture. | [../spec.md](../spec.md#6-unknowns), [../contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md) |
| `gate-bypass` component ownership. | Code-verified local native proof | Code location is clear: read semantics live in `src/state/gate-bypass.mjs`, setup/doctor readiness lives in `src/setup/registrations.mjs`, and CLI grammar lives in `src/cli/command-registry.mjs`. Native migration uses existing work/state read ownership with no new component-boundary change. | [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route), [implementation-alignment.md](implementation-alignment.md) |
| First external provider preview set and conformance fixture set. | Closed preview proof | R2 selected `fixture.echo.echo` and proved manifest, linker, frame codec, supervisor, and integration behavior. | [r2-external-process-proof.md](r2-external-process-proof.md), [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| First production remote peer route. | Closed preview proof | R3 selected `GET /v1/runtime` -> `distribution.build.show` and proved direct `InvocationService` invocation without `VerbGateway` or `fgos.v1` parsing. | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| Chat host admission, interruption, presentation, and lifecycle semantics. | Future host contract decision | Scan found no current chat host adapter implementation. | [../architecture/host-use-cases.md](../architecture/host-use-cases.md), [../intent-preservation-ledger.md](../intent-preservation-ledger.md) |
`````

## Changed text outside or overlapping the rebound rows

Full units below show the old and current text, including new labelled notes. Unchanged text and pure line-number shifts are omitted. Units whose heading ancestry changed are shown even when their bytes remain equal.

### docs/platform/host-invocation-routing/README.md

Before file digest: 7c4dfd5eb65a8ca425c8a10970c07a79058622bda47e2e2ab4718284922f14f0

After file digest: 0deb88fe1bba0846da7a3d76aa626964f33ac0f3da278790b255cad49b4c1621

Before: docs/platform/host-invocation-routing/README.md#2-read-first

Unit digest: 3f28bfb2e3421ce3879375f097b445fbf7c1aaf8ad0d507af410ce71d3cc950e

`````md
## 2. Read First
`````

Before: docs/platform/host-invocation-routing/README.md#unheaded-block-6

Unit digest: 1b3e232799bd6a3154f6432897baa54fe23da2febd76e0d4ac498e0553ebb73a

`````md
| Reader goal | Read |
| --- | --- |
| Understand the full direction | [vision.md](vision.md) |
| Check preserved legacy intent and dispositions | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Understand current, legacy-current, planned, and unknown behavior | [spec.md](spec.md) |
| Plan remaining work after R1/R2/R3 preview proofs | [roadmap.md](roadmap.md) |
| Review R2 external process provider preview closeout | `../../../plans/260915-host-invocation-r2-external-process/plan.md` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Review R3 remote peer closeout | `../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Understand invocation kernel shape | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Understand CLI, remote, and chat peer hosts | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
| Understand provider selection and authority | [architecture/provider-routing.md](architecture/provider-routing.md) |
| Understand external process/WASM provider direction | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) |
| Understand Node compatibility during transition | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| Understand migration sequence | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) |
| Understand release boundaries and gates | [architecture/release-boundaries.md](architecture/release-boundaries.md) |
| Check implementation status and proof gaps | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| Check source preservation | [history/source-inventory.md](history/source-inventory.md), [verification/source-preservation-audit.md](verification/source-preservation-audit.md), and [history/host-invocation-baseline.md](history/host-invocation-baseline.md) |
`````

After: docs/platform/host-invocation-routing/README.md#2-read-first

Unit digest: 28bae92ebad4ab286aa1a9d2ffac4c6fa37883c9d0ede5ca7d693970e911cf43

`````md
## 2. Read First
`````

After: docs/platform/host-invocation-routing/README.md#unheaded-block-6

Unit digest: 0c4b64c704eb6b4264103c96531206e8daab6e2338ca251abc10c78538f8bd70

`````md
| Reader goal | Read |
| --- | --- |
| Understand the full direction | [vision.md](vision.md) |
| Check preserved legacy intent and dispositions | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Understand current, legacy-current, planned, and unknown behavior | [spec.md](spec.md) |
| Plan remaining work after R1/R2/R3 preview proofs | [roadmap.md](roadmap.md) |
| Review R2 external process provider preview closeout | [../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../archive/plans/260915-host-invocation-r2-external-process/plan.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Review R3 remote peer closeout | [../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Understand invocation kernel shape | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Understand CLI, remote, and chat peer hosts | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
| Understand provider selection and authority | [architecture/provider-routing.md](architecture/provider-routing.md) |
| Understand external process/WASM provider direction | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) |
| Understand Node compatibility during transition | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| Understand migration sequence | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) |
| Understand release boundaries and gates | [architecture/release-boundaries.md](architecture/release-boundaries.md) |
| Check implementation status and proof gaps | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| Check source preservation | [history/source-inventory.md](history/source-inventory.md), [verification/source-preservation-audit.md](verification/source-preservation-audit.md), and [history/host-invocation-baseline.md](history/host-invocation-baseline.md) |
`````

### docs/platform/host-invocation-routing/architecture/external-provider-protocol.md

Before file digest: a1978f6d83ee38b94b095516de3b03b7b53729c404e25b424415ef59de0e128c

After file digest: c6696b9b64fd9bbb71e12070640d060a4f1ed6492773457955f9df979412bee9

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#migration-status-note

Unit digest: db3348e89c4fa8b1dda4d626191433e97554c0c4e41aa6f14a75bb1de322a4f3

`````md
#### Migration Status Note
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-9

Unit digest: 15534bd05f54a660f4b2a1f3042ff1da7cd7fe95cb9850ce1f7bbcb82e852f0f

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes

Unit digest: 6fd30c81f3964fa0fce56b1bb33f12eef8f1b9790d1d516c5f0137de8b54b864

`````md
#### 1. Component Classes
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-13

Unit digest: 27d69066fb80d541fe3ab60479159fc997277f3f27a20dfe560ca7536fe6981f

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-005 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/release-boundaries.md#restored-class-definitions`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms

Unit digest: 9d129be84b3aceb261848d57bf33fab53a971e3a8401bc9895e739f1ae522583

`````md
#### 2. Invocation Mechanisms
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-15

Unit digest: 27d69066fb80d541fe3ab60479159fc997277f3f27a20dfe560ca7536fe6981f

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-005 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/release-boundaries.md#restored-class-definitions`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-17

Unit digest: 501977bc175d1e0e13048966c2b723805846d49d30e35c45d6bb1ad24cd484e9

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-006 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-18

Unit digest: 501977bc175d1e0e13048966c2b723805846d49d30e35c45d6bb1ad24cd484e9

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-006 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-19

Unit digest: 501977bc175d1e0e13048966c2b723805846d49d30e35c45d6bb1ad24cd484e9

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-006 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol

Unit digest: 350387063cb468746fd11ecf7ad9d92763aa55ed8a98d474150b1fcbd6f9a2a4

`````md
#### 3. Component Protocol
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-25

Unit digest: 73cc532be4654bfebcfb7b76bb3f4d982588a7d750677d5826700cef58f12269

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-007 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral`).
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker

Unit digest: eb17b65cfeec9ec461edaf515ffbe31ea47c68c7e72b006f539b2b6eb06a3f07

`````md
#### 4. Plugin Registry Linker
`````

Before: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-32

Unit digest: 16c81c8d681ed07fcef9b4d4e6c284119c81616f24baeb708615cb5bcf2ab3fc

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-008 restoration` (historical reference unavailable: `docs/architect/verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula`).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#historical-migration-status-note

Unit digest: fc32b1b25c89ea4978ab36812b636d62c665da2e38af568a1671921384685156

`````md
#### Historical Migration Status Note
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-9

Unit digest: 4d84b71de5a938c290f706f618397babc4a704b66e270c7755b57eca1404b6fa

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/external-provider-protocol.md](external-provider-protocol.md),
[contracts/component-protocol.md](../contracts/component-protocol.md),
and [contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#1-component-classes

Unit digest: fd51d86a3880f7da70c7e5791d50dfb1af4cd414023a70d924a3606a319e252f

`````md
#### 1. Component Classes
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-13

Unit digest: 7c9657b50b7838a59effaedb399fe053cf3fd4cfbd7158d41efa3264787d2819

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#2-invocation-mechanisms

Unit digest: e7a9211054b328f165f59f75bfc1633b8b3a60a383afeff778f1eb2312f6d8a0

`````md
#### 2. Invocation Mechanisms
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-15

Unit digest: 7c9657b50b7838a59effaedb399fe053cf3fd4cfbd7158d41efa3264787d2819

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-005 restoration](release-boundaries.md#restored-class-definitions).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-17

Unit digest: 47969483fc1c0d7e06c1f5694770456716379257ad992cfee88f4d213e996259

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-18

Unit digest: 47969483fc1c0d7e06c1f5694770456716379257ad992cfee88f4d213e996259

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-19

Unit digest: 47969483fc1c0d7e06c1f5694770456716379257ad992cfee88f4d213e996259

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-006 restoration](../contracts/component-protocol.md#restored-same-process-built-ins-vs-runtime-extensions-and-cross-process-cost).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#3-component-protocol

Unit digest: 7cf43dd0dccf83e356b760c88da2576ecb1eb4cf9219caaf09a95ff12d2fd5a8

`````md
#### 3. Component Protocol
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-25

Unit digest: e0becb21de5f2730c2ada09ae3ee5b323fb6de3ea0f1a246ee20a15b58e072c4

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-007 restoration](../contracts/component-protocol.md#restored-semantic-contract-stays-transport-neutral).
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#4-plugin-registry-linker

Unit digest: cda1c088745776953a5144a0548869d897c54e9f69dcd512de6ad8359b99ed32

`````md
#### 4. Plugin Registry Linker
`````

After: docs/platform/host-invocation-routing/architecture/external-provider-protocol.md#unheaded-block-32

Unit digest: 826ad676386ede7942a16e3ad5cde0fd19dbd5994eec4ac9b868e4d0e2ac3638

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-008 restoration](../verification/compatibility-harness.md#restored-registry-linker-procedure-and-its-input-output-formula).
`````

### docs/platform/host-invocation-routing/architecture/host-use-cases.md

Before file digest: dc124a147cbecc66ba6e6a258ccae274ce77e5641aed032efd004913b1149516

After file digest: b54adc926555da030df92e1e1c90c339f10ba4152a17a3486df06a4a0ca7927a

Before: docs/platform/host-invocation-routing/architecture/host-use-cases.md#3-implementation-alignment

Unit digest: 6e8a2f55dc7612e232fc9c0b8ae1d0aaf6a3de6eb7f4c248f3f321a77c3a51ff

`````md
## 3. Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/architecture/host-use-cases.md#unheaded-block-4

Unit digest: 97a05209c3b50738316eff34a49f29c146da278abbf2b491d651d64fd809e6d0

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Remote peer is project-local gateway in R3. | `current partial` | Source: [old architecture §10](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs) | Proven native gateway route for `distribution.build.show` in [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md); all other routes remain legacy `VerbGateway`. |
| `GET /v1/runtime` (`distribution.build.show`) is the first remote-host-use-case proof for R3. | `implemented preview` | `R3 execution record` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs) | Route wired and verified with no-VerbGateway / no-fgos.v1 proof. Remote host is now a proven peer for `distribution.build.show` only. |
| Future shared multi-project gateway is separate. | `planned` | [Packaging future constraints](../../packaging-distribution/architecture/future-constraints.md) | Keep separate from R3 project-local gateway. |
`````

Before: docs/platform/host-invocation-routing/architecture/host-use-cases.md#4-related-files

Unit digest: 5b68b1798dc4716010e2aab2a8b7cfa1cc82330bb9f8cec4504b561668f605dc

`````md
## 4. Related Files
`````

Before: docs/platform/host-invocation-routing/architecture/host-use-cases.md#unheaded-block-5

Unit digest: 0a886e066616ecb914a4542dac9aea808e997c89d04a040847b3fe687262bad9

`````md
| Relationship | File |
| --- | --- |
| kernel | [invocation-kernel.md](invocation-kernel.md) |
| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |
| R3 execution record | `../../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`) |
| packaging future constraint | [../../packaging-distribution/architecture/future-constraints.md](../../packaging-distribution/architecture/future-constraints.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
`````

After: docs/platform/host-invocation-routing/architecture/host-use-cases.md#3-implementation-alignment

Unit digest: d60a6b2883a08d45cdcd7ce0c5cbfe97143a7e966103958e7cae73771a169e37

`````md
## 3. Implementation Alignment
`````

After: docs/platform/host-invocation-routing/architecture/host-use-cases.md#unheaded-block-4

Unit digest: 0030a8ecadd3da43d02992eaa5351328b9e479dbf5632372af05a0f27f2a343b

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Remote peer is project-local gateway in R3. | `current partial` | Source: [old architecture §10](../../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs) | Proven native gateway route for `distribution.build.show` in [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md); all other routes remain legacy `VerbGateway`. |
| `GET /v1/runtime` (`distribution.build.show`) is the first remote-host-use-case proof for R3. | `implemented preview` | [R3 execution record](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs) | Route wired and verified with no-VerbGateway / no-fgos.v1 proof. Remote host is now a proven peer for `distribution.build.show` only. |
| Future shared multi-project gateway is separate. | `planned` | [Packaging future constraints](../../packaging-distribution/architecture/future-constraints.md) | Keep separate from R3 project-local gateway. |
`````

After: docs/platform/host-invocation-routing/architecture/host-use-cases.md#4-related-files

Unit digest: 629c3ebc4d40d78a7fa46a7577161566d17fad7ca3e00bb035425ce22ede5802

`````md
## 4. Related Files
`````

After: docs/platform/host-invocation-routing/architecture/host-use-cases.md#unheaded-block-5

Unit digest: 1445ff220a93b5864634f29de1750eea50899fc7d34f79a0418597eeb56af7a4

`````md
| Relationship | File |
| --- | --- |
| kernel | [invocation-kernel.md](invocation-kernel.md) |
| R3 proof | [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) |
| R3 execution record | [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| packaging future constraint | [../../packaging-distribution/architecture/future-constraints.md](../../packaging-distribution/architecture/future-constraints.md) |
| source architecture | [../../../architect/host-invocation-routing/host-invocation-provider-routing.md](../../../architect/host-invocation-routing/host-invocation-provider-routing.md) |
`````

### docs/platform/host-invocation-routing/architecture/invocation-kernel.md

Before file digest: 9470f99f31b871d830916a2f30132322e42416245cf3d22bd564a348390b1204

After file digest: 64b03ea5fb9b59818d280d73a724d9e7c888065938337bcb85d7ebc077079930

Before: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#architecture-invocation-kernel

Unit digest: 7d101c8acb4923899797841ac80dc2d1f8306a3fa7d01e73eb900ba039f9a1d4

`````md
# Architecture: Invocation Kernel
`````

Before: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#3-implementation-alignment

Unit digest: 18f29a0402034061b222a65cd89841431852034dc2ec912acdea8622bd7a17d1

`````md
## 3. Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-4

Unit digest: d3a55a05b15dcdbaf1c9fe8b2c6cbe42fd47da062903d41aa5b9814dc8484365

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Native routes use `OperationRequest` to `ProviderOutcome`. | `implemented preview` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for `distribution.build.show`, `work.gate-bypass.show`, and the R2 fixture operation. Additional operations need their own route/provider proof. |
| Legacy CLI routes bypass the kernel. | `implemented preview` | [legacy-cli-transition.md](legacy-cli-transition.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Current route matrix still has 71 `legacy-cli` selectors; keep bypass behavior until each selector migrates. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |
`````

After: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#architecture-invocation-kernel

Unit digest: 4e2c330b1e666ea56870bafba2584b64e18f4d9467787d98111254958848af50

`````md
# Architecture: Invocation Kernel
`````

After: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#3-implementation-alignment

Unit digest: 8cfed1614f6aa34ec5109cdfbc4010b87ffe90d2c64562cf80ee53362d4c13e9

`````md
## 3. Implementation Alignment
`````

After: docs/platform/host-invocation-routing/architecture/invocation-kernel.md#unheaded-block-5

Unit digest: 806eb8664cf1055d8efe549b2d6189a6d2ee7c70da17b42fe1974cd8f258d0c7

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Native routes use `OperationRequest` to `ProviderOutcome`. | `implemented preview` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Proven for `distribution.build.show`, `work.gate-bypass.show`, and the R2 fixture operation. Additional operations need their own route/provider proof. |
| Legacy CLI routes bypass the kernel. | `implemented preview` | [legacy-cli-transition.md](legacy-cli-transition.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Current route matrix still has 70 `legacy-cli` selectors; keep bypass behavior until each selector migrates. |
| No component-boundary change. | `current` | [component-boundary.md](../../component-boundary.md) | No action for documentation migration. |
`````

### docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md

Before file digest: 023a152755f29d175ad707ef534453cf5ef82d2c98b1580b86743da415b86b44

After file digest: bed5a1a058b6975cfc1cd9186170a22b88c0fab8c1ba7244d13f00bab8d316b9

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#migration-status-note

Unit digest: 4ea52718f114ddd1de808f2b62beb60f7201687e0b64a1aa873caa96d49dbbf1

`````md
#### Migration Status Note
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-9

Unit digest: 81e298b1e50a0414fa5fb3d17ae45182a975b64c213fe856c1fac52facc8282c

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters

Unit digest: 91ef5706ccfb37792cda7231b99b6c1857b29f314509b11c0fe66ae6fca7e8a3

`````md
#### 1. Two Distinct Adapters
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-14

Unit digest: ab2cd0f150f5e1b404324375d0296ae4adbaaef0f80f503bb5e6760e7bc651f9

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-009 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case`).
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path

Unit digest: 82cdc406a102567b6f0e20f0a4a9c0a24c914eaeaa37b9438fb244d990a72571

`````md
#### 2. Legacy Payload Identity, Ownership, And Repair Path
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-20

Unit digest: cef255218a641526c39eb8e981dc29284b0ff9cb7d39a64422155eb1bd6eadb4

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-010 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea`).
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Unit digest: ed5b60249ca68e784ca85ffcd4d209b39951a55538d685ce33bed82c0f7308de

`````md
#### 3. Command Metadata And Parser Ownership
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-27

Unit digest: ab2cd0f150f5e1b404324375d0296ae4adbaaef0f80f503bb5e6760e7bc651f9

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-009 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case`).
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost

Unit digest: b1af5c5a5d366bb2d0e49df2924aba575c588127657d8dfd5dc8cec3591daae6

`````md
#### 5. Rust Host First: Benefit And Cost
`````

Before: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-35

Unit digest: 3ecc5accc1eacd0fded8ba487bf40b9b354624efd7aad3c7806f04975bc9a70a

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-011 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rust-host-first-cost`).
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#historical-migration-status-note

Unit digest: caf8f56f95cb4bab4c0d074baf0daae1bfd03c7311387c571d36de1b76d089b2

`````md
#### Historical Migration Status Note
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-9

Unit digest: 1456e880d651b7d8ccc5886ccbe36f3bdf676a2acb7218541e53162738d531a6

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/legacy-cli-transition.md](legacy-cli-transition.md),
[contracts/command-route-descriptor.md](../contracts/command-route-descriptor.md),
[contracts/legacy-payload.md](../contracts/legacy-payload.md),
and [verification/compatibility-harness.md](../verification/compatibility-harness.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#1-two-distinct-adapters

Unit digest: 49afb148ce5b49502adacce9e063c07b40e58fb0981db00e6b2d9048a726d90d

`````md
#### 1. Two Distinct Adapters
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-14

Unit digest: 0d4394dd6bc803be0cf225b1d69a29665a957ac95bde8dbe68e07920fa1165bf

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path

Unit digest: bcaecc76a91e2cd04d8a432c31285c9d795a274e2ae8dcba92ccfd94780daddf

`````md
#### 2. Legacy Payload Identity, Ownership, And Repair Path
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-20

Unit digest: 9dd61ab48eec66a51b53b85a4c0e371a74f0b85d4e1c6de673c84eca9aac9830

`````md
Added in candidate — checked resolver status (2026-10-13): the preceding activation-binding paragraph is retained selected design. `apps/fgos/src/legacy_exec.rs:69-154` selects the release root from explicit release/dev environment bindings or executable-relative manifest discovery, then verifies the manifest and confined entry. The target identity status in spec.md remains `accepted-not-implemented`; checked resolver behavior does not certify the entire target contract. The ownership rule remains never from PATH, never from caller cwd, never as an alternate package-manager bin entry, and never hardcoded.
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-21

Unit digest: fef135a2b6ecb59c602427e2458b7e2359ba90957424ee98667591cfc38f9a60

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-010 restoration](release-boundaries.md#restored-package-json-bin-fgos-removed-pointed-at-workspace-shim-at-default-flip-bin-fgos-runner-stays-ownership-hea).
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#3-command-metadata-and-parser-ownership

Unit digest: 5f052dc9bcfe273204107b49849e79b3a8141978a4dae163b80ce1197be4dc52

`````md
#### 3. Command Metadata And Parser Ownership
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-28

Unit digest: 0d4394dd6bc803be0cf225b1d69a29665a957ac95bde8dbe68e07920fa1165bf

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-009 restoration](../contracts/component-protocol.md#restored-both-adapters-delegate-a-complete-use-case).
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#5-rust-host-first-benefit-and-cost

Unit digest: 7504e7fd27fa2de1f5b1e486ab3e7efff0e956e57f789c7363feeec37b581856

`````md
#### 5. Rust Host First: Benefit And Cost
`````

After: docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md#unheaded-block-36

Unit digest: aa4a78bd4a05ca0eeb350d5fb7ed6f09197d3f253d8128b9d1b283bcd4971476

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-011 restoration](../contracts/component-protocol.md#restored-rust-host-first-cost).
`````

### docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md

Before file digest: 1c07cfd1925af5593d87f61b943594c58a09610a61ea7690c5d7cd68f5eb12f6

After file digest: bc0a292df192ec7ee1dbc217feed5057de129e55e02beaaf60dd4dd6edabdb37

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#4-implementation-alignment

Unit digest: 2ab93e76abee443b9d1ed331c5157c03266de783e1fb3622f942cfda664c9f1c

`````md
## 4. Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-5

Unit digest: c0ffb475f3aa129f49bd9714f03a2ad3d2c0813d6e8e8cc80ad132cbda8d2ce5

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Rust host first is selected. | `implemented preview` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Preview Rust host exists and is the installed/default preview entry. Stable/default graduation remains a release-owner decision. |
| Read models before writers. | `current partial` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | `version`, `gate-bypass`, and remote `/runtime` are read proofs. Future read routes should migrate before writes. |
| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |
| Observe is first component fully in Rust. | `implemented complete` | [Observe Spec](../../../specs/observe.md), [packages/observe/rust](../../../../packages/observe/rust), `plans/260929-1501-metrics-friction-rust-native` (historical plan unavailable in this checkout: `plans/260929-1501-metrics-friction-rust-native/plan.md`) | Observe migrated completely into Rust native without Node fallback; covers metrics and friction writers with native routing and writer shards. |
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration

Unit digest: 2b9efd3fc3b815613f0c334c1436fa71454707aa7665255ceff10130820ec38c

`````md
### Node To Rust Component Migration
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-9

Unit digest: f5b1de0d5eaa53842b5bb6719c21de0db22e022799f2f982787c0bdce2609da2

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-012 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/release-boundaries.md#restored-scope`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#migration-status-note

Unit digest: a84fb148d6012d7377131d4e7aed4b121a584a2bb673df4c87a36bc4a90f35df

`````md
#### Migration Status Note
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-10

Unit digest: e09cd4e156094cd510ff75feb88557f21804ab9d9fb18e543e0db68de6932b1a

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform docs are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first

Unit digest: 87a20861bcc621071f9be765145f24778189d45a5340d8cccbae47e9bef4de2e

`````md
##### Option A: Thin The Entire Node Host First
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-16

Unit digest: 26a5ba7a3e7e52845c2c5f1c4dd95f9ec18399ebb2b197e915cea44f9b2baa1a

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-013 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rejected-options-rationale`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite

Unit digest: 01cdbb3f89b9b78ea7e28bab45dfe439f5bb770bbb731e40f64ef49b51d79f82

`````md
##### Option C: Big-Bang Rust Rewrite
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-19

Unit digest: 26a5ba7a3e7e52845c2c5f1c4dd95f9ec18399ebb2b197e915cea44f9b2baa1a

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-013 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rejected-options-rationale`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#selected-option

Unit digest: ae1e03ac4e8db3eb0b85b17cb538e72bfe521fb583c8db4dfdd53efda9db5572

`````md
##### Selected Option
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-21

Unit digest: 26a5ba7a3e7e52845c2c5f1c4dd95f9ec18399ebb2b197e915cea44f9b2baa1a

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-013 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rejected-options-rationale`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-22

Unit digest: 26a5ba7a3e7e52845c2c5f1c4dd95f9ec18399ebb2b197e915cea44f9b2baa1a

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-013 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rejected-options-rationale`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary

Unit digest: fe750f6c27fa67e4d1c2f6b80562c0413f335e7c8747f2f7f8bd899301a2d042

`````md
#### 9. Repeat By Component Boundary
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-48

Unit digest: 76fa03b787a251bc7f984154b1161ee2e7fe877879939a3d3286c21453db7767

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-014 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-per-component-repeat-procedure`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers

Unit digest: 6a33a610bf3132cfba5482652140fd64e0d62595533957ba526c32ed8b6761bf

`````md
#### 10. Migrate Read Models Before Writers
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-52

Unit digest: 76fa03b787a251bc7f984154b1161ee2e7fe877879939a3d3286c21453db7767

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-014 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-per-component-repeat-procedure`).
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules

Unit digest: 09ff55be3b5f64cbeaa55d51a65daa0dabe745139c58e46089f9a1fb8c2b0c86

`````md
#### 13. Rollback Rules
`````

Before: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-61

Unit digest: 81d2135fae3fe4ef84de33d7e24ccf3f856763519f4d8479a3a3ed1a6f01c585

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-015 restoration` (historical reference unavailable: `docs/architect/contracts/component-protocol.md#restored-rollback-bullets`).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#4-implementation-alignment

Unit digest: 61b39f2d3859e71fcc1c96c1834629c6c80a1a01097ab8ea717d1a0553b8a749

`````md
## 4. Implementation Alignment
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-5

Unit digest: 8ec82fe8d92cf4fb9ff3e6299c0d3dbf54b924ad475f5246e282447968e02b20

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Rust host first is selected. | `implemented preview` | [source migration §2](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Preview Rust host exists and is the installed/default preview entry. Stable/default graduation remains a release-owner decision. |
| Read models before writers. | `current partial` | [source migration §10](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | `version`, `gate-bypass`, and remote `/runtime` are read proofs. Future read routes should migrate before writes. |
| Writer migration has atomicity/replay/mutual-exclusion gates. | `planned` | [source migration §11](../../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | Future writer proof. |
| Observe is first component fully in Rust. | `implemented complete` | [Observe Spec](../../../specs/observe.md), [packages/observe/rust](../../../../packages/observe/rust), [plans/260929-1501-metrics-friction-rust-native](../../../../archive/plans/260929-1501-metrics-friction-rust-native/plan.md) | Observe migrated completely into Rust native without Node fallback; covers metrics and friction writers with native routing and writer shards. |
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#node-to-rust-component-migration

Unit digest: 73142a367bf579e3afc2da330169ae1b04b7a9b758a33a9b8be857aca2e85373

`````md
### Node To Rust Component Migration
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-9

Unit digest: d2f56c19f841cb06ebbf5aa02d80ba06b9c4f54461ea661607f697635acdff57

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-012 restoration](release-boundaries.md#restored-scope).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#historical-migration-status-note

Unit digest: 01b857cc72715357538a05446610509d83d5bf88b54ec3b3b39977ca2a808042

`````md
#### Historical Migration Status Note
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-10

Unit digest: 52109204af09107163b441654a44e9de25868552102a993367ad38f66ae6ac6a

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/node-to-rust-migration.md](node-to-rust-migration.md),
[architecture/release-boundaries.md](release-boundaries.md),
[verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md),
and [history/host-invocation-baseline.md](../history/host-invocation-baseline.md).
See the [intent preservation ledger](../intent-preservation-ledger.md)
for disposition by preserved claim.
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-a-thin-the-entire-node-host-first

Unit digest: 0ebcb1ec37ffe2db3ea182a170b3ae2810f710cda67beecf0045f491c2b08e73

`````md
##### Option A: Thin The Entire Node Host First
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-16

Unit digest: 8f832801ac2ebc121115b395c34b847c41757675eb2f2648aa5a40519d693927

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#option-c-big-bang-rust-rewrite

Unit digest: 2c60584c5c5e535249c603a1e98ede6c6497204f5e1880f44cf3a8fb0ad00a05

`````md
##### Option C: Big-Bang Rust Rewrite
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-19

Unit digest: 8f832801ac2ebc121115b395c34b847c41757675eb2f2648aa5a40519d693927

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#selected-option

Unit digest: 7d4964d379b1f658632996f0008287e453f8a8cf8fc28fb5cc7b63e59327f96c

`````md
##### Selected Option
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-21

Unit digest: 8f832801ac2ebc121115b395c34b847c41757675eb2f2648aa5a40519d693927

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-22

Unit digest: 8f832801ac2ebc121115b395c34b847c41757675eb2f2648aa5a40519d693927

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-013 restoration](../contracts/component-protocol.md#restored-rejected-options-rationale).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#9-repeat-by-component-boundary

Unit digest: ef6d9f08943bdc073dcf957c969015d6821b081aeb08b90898f0f1024dd2319e

`````md
#### 9. Repeat By Component Boundary
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-48

Unit digest: 8fd9f660c71f26f5134efb4d9cebe6d3f2cd253694c0b6572c6faa7b6dca998f

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#10-migrate-read-models-before-writers

Unit digest: 5ae126eab3838fb0b18c1226734b38c22b3674d2b370d9c47193602a09990c6d

`````md
#### 10. Migrate Read Models Before Writers
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-52

Unit digest: 8fd9f660c71f26f5134efb4d9cebe6d3f2cd253694c0b6572c6faa7b6dca998f

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-014 restoration](../contracts/component-protocol.md#restored-per-component-repeat-procedure).
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#13-rollback-rules

Unit digest: 18582e9da8d64b7e18ba9e1bc7c3eff5aeb10565960bf94f7fe947bc921a0f07

`````md
#### 13. Rollback Rules
`````

After: docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-61

Unit digest: 3c902b47d56e18d44ba82e0a44e8e40b3a0494385d5f19eae45c22f790f66b54

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-015 restoration](../contracts/component-protocol.md#restored-rollback-bullets).
`````

### docs/platform/host-invocation-routing/architecture/release-boundaries.md

Before file digest: dea5bdc8b7bb596e3436f538e37df0ad8c27327970955349376ac9bd251fa4bc

After file digest: ca26b29daebedfa5dc1d2e98c5e9655e4491a2122296618220e141902583236f

Before: docs/platform/host-invocation-routing/architecture/release-boundaries.md#architecture-release-boundaries

Unit digest: e6056f3ebb504294ce76900eda1fe8f84a2ff398e64e32b7ea42368c48e497c5

`````md
# Architecture: Release Boundaries
`````

Before: docs/platform/host-invocation-routing/architecture/release-boundaries.md#2-open-release-decisions

Unit digest: c5541a5cef6057f457e2aac0b3204b95723402208670bcc6234a0d8bbb001f0c

`````md
## 2. Open Release Decisions
`````

Before: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-3

Unit digest: fd42541f9fa8692e12e6564bd0c66e09edebfb76accbb134816a002c194e2387

`````md
| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 73 selectors, 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | explicit escape hatch approved; 30 calendar days after preview release publication; for `v0.1.0`, earliest removal is 2026-10-18 | Packaging-distribution stream plus host invocation. |
`````

Before: docs/platform/host-invocation-routing/architecture/release-boundaries.md#3-implementation-alignment

Unit digest: e44ab05a63daaf21b7ad3ec4ad35894c9e4d2fa79e5d8d059cb7964277dab10d

`````md
## 3. Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-4

Unit digest: d70e9b520871ae2733f151b08b085a2b9bf65082f64a0c63ce11d3155189033e

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/lib.rs](../../../../packages/host-runtime/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Route migration remains partial: 71 selectors still use the manifest-owned legacy CLI lane. |
| R1 is a shipped host only with reproducible install/activation/rollback proof. | `implemented preview` | [source plan §18](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), release `v0.1.0` workflow `35317876419`, post-release CI/external-consumer proof `35498322149` | Stable/default release graduation remains a release-owner decision. |
| R2 and R3 do not delay R1 installed-entry flip. | `confirmed` | [source plan §1](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md)#6, [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Every R2 merge re-ran and passed the full R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`) with `apps/fgos` composition-root wiring untouched. R3 is a separate implemented-preview gateway peer proof for `GET /v1/runtime`; it does not change the R1 installed-entry flip. |
| `fgctl` owns rollback; runtime provider selection does not. | `implemented preview` | [packaging runtime activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview install/activation/repair proof is recorded. Stable/default graduation remains a release-owner decision. |
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#architecture-release-boundaries

Unit digest: 33649936e5a11652f76a21c231979eaee52c0f06911216b1b68d750bca60d74e

`````md
# Architecture: Release Boundaries
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#2-open-release-decisions

Unit digest: ca9dff0f66dd870392eee2151f7594d3f2ead425e12e6b87d9ff7f3d72733526

`````md
## 2. Open Release Decisions
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-4

Unit digest: c300d4dcad0156d171a142c34facf83ac23acd25c337c77d3ed8e4526c30196c

`````md
| Decision | Status | Owner |
| --- | --- | --- |
| Current R1 route matrix | `current partial` | Code snapshot: 75 selectors, 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`. |
| First public R1 preview vs stable default | `preview approved; stable undecided` | Packaging-distribution stream. |
| Compatibility-window duration for R1 Node fallback | explicit escape hatch approved; 30 calendar days after preview release publication; for `v0.1.0`, earliest removal is 2026-10-18 | Packaging-distribution stream plus host invocation. |
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#3-implementation-alignment

Unit digest: 207c786e5bacacd3c39ecc89212125d57ccf4ec298c709624aecc118fb7e7b97

`````md
## 3. Implementation Alignment
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-5

Unit digest: 3e859a799ab1b85e7bf241f8aad775044756a7b9937b5a1475d49642af7af976

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| R1 Rust host code path exists. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/lib.rs](../../../../packages/host-runtime/rust/src/lib.rs), [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Route migration remains partial: 70 selectors still use the manifest-owned legacy CLI lane. |
| R1 is a shipped host only with reproducible install/activation/rollback proof. | `implemented preview` | [source plan §18](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#18-definition-of-done), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), release `v0.1.0` workflow `35317876419`, post-release CI/external-consumer proof `35498322149` | Stable/default release graduation remains a release-owner decision. |
| R2 and R3 do not delay R1 installed-entry flip. | `confirmed` | [source plan §1](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md)#6, [../verification/r3-remote-peer-proof.md](../verification/r3-remote-peer-proof.md) | Every R2 merge re-ran and passed the full R1 proof (`cargo test -p fgos-host-runtime -p fgos --quiet`, `node --test test/rust-host/command-routes.test.mjs`) with `apps/fgos` composition-root wiring untouched. R3 is a separate implemented-preview gateway peer proof for `GET /v1/runtime`; it does not change the R1 installed-entry flip. |
| `fgctl` owns rollback; runtime provider selection does not. | `implemented preview` | [packaging runtime activation](../../packaging-distribution/architecture/runtime-identity-and-activation.md), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview install/activation/repair proof is recorded. Stable/default graduation remains a release-owner decision. |
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#source-relative-navigation-mappings

Unit digest: 0100cf9f47f309de5011eca88c711a3747bbde0ed36c72bee16a82b7fca31046

`````md
## Source-relative Navigation Mappings
`````

After: docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-31

Unit digest: 281da983307b9f20bc6b1fa693bed8dfaaadcd8e5418e135b8f90e11cefb0a75

`````md
Added in candidate — source-relative link destinations: the literal restored excerpts retain their original link bytes. `./host-invocation-provider-routing.md` maps to [the area spec](../spec.md); `./rust-cli-and-proof-components-plan.md` maps to [the area roadmap](../roadmap.md); `../component-boundary/component-boundary-advisory.md` maps to [the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md). These are navigation mappings, not revised restored text.
`````

### docs/platform/host-invocation-routing/contracts/command-route-descriptor.md

Before file digest: 37cec39e4473c74d6fee41ea074ca001f3df9e0f92f33f0005e461ae97ea8762

After file digest: 05ef5644dc45256e6bf8f667752bbbcc2b15e27353424e0abb39da819618a893

Before: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#contract-command-route-descriptor

Unit digest: 8ca2c9103e06621edbd5e61694ae8b75307e7395eb0f23a09ccfda1960b2fde4

`````md
# Contract: Command Route Descriptor
`````

Before: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#3-implementation-alignment

Unit digest: ea7119cc9c2212cb1da4a29f0f5f3112c8c111f7b0dfc2154187c0a55c2c2ee2

`````md
## 3. Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-5

Unit digest: 18a897d50d895beba46ff67ef9e880f0a3b2476d6a664c919bfee160be8dfc82

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../test/rust-host/command-routes.test.mjs](../../../../test/rust-host/command-routes.test.mjs) | Current snapshot has 73 selectors: 71 `legacy-cli`, two native. Keep drift tests current as selectors move. |
| `legacy-cli` preserves provider-owned argv. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Full compatibility-vector cleanup remains future, but manifest-owned legacy CLI lane is proven for preview. |
`````

After: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#contract-command-route-descriptor

Unit digest: 463a50dc187855245e03f08347bcae469296a8c9856eaa4a00f2b425af52b970

`````md
# Contract: Command Route Descriptor
`````

After: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#3-implementation-alignment

Unit digest: e59df71ccd216111612e7917cfad9d91d0261609397d79a6614352f1396cb25a

`````md
## 3. Implementation Alignment
`````

After: docs/platform/host-invocation-routing/contracts/command-route-descriptor.md#unheaded-block-6

Unit digest: 9dcb8f1af676e0a4ab1797f627e485f1e95d87e687b20b166389fb2234d0979e

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Descriptor exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../test/rust-host/command-routes.test.mjs](../../../../test/rust-host/command-routes.test.mjs) | Current snapshot has 75 selectors: 70 `legacy-cli`, five native. Keep drift tests current as selectors move. |
| `legacy-cli` preserves provider-owned argv. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../verification/r1-rust-host-proof.md](../verification/r1-rust-host-proof.md) | Full compatibility-vector cleanup remains future, but manifest-owned legacy CLI lane is proven for preview. |
`````

### docs/platform/host-invocation-routing/contracts/component-protocol.md

Before file digest: 93f20dd95cd8f1a779ef864177c2576fd2d1039f06187eafbab02161a94ad229

After file digest: 39c7a77ccdc4c2704b6a105f4f0d239e95779c5d9e07f6af804522c57e7be7f4

After: docs/platform/host-invocation-routing/contracts/component-protocol.md#source-relative-navigation-mappings

Unit digest: de152e90e1ff8e54333c69f466611c29db16c3b9f72fbf74b047b46c17054134

`````md
## Source-relative Navigation Mappings
`````

After: docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-68

Unit digest: 5d49788c33a3a8421bd11af9024b62ac8d98e61bcf37c0da20826a037618b31b

`````md
Added in candidate — source-relative link destination: the literal restored excerpt retains `../component-boundary/component-boundary-advisory.md`; its live destination is [the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md). This navigation mapping does not revise the restored text.
`````

### docs/platform/host-invocation-routing/intent-preservation-ledger.md

Before file digest: 429c55c486c61d62106e141a508f1eb8f6976410e57d52dbc62e9d4a8afc0602

After file digest: b74d4331c2bc0360ac200698a736fddd8c0378b896c472dfef2e59f9e33c46c9

Before: docs/platform/host-invocation-routing/intent-preservation-ledger.md#host-invocation-intent-preservation-ledger

Unit digest: d14d68ecfb2965355c2af9e53f89ba7295b09ac6dac735d6f52cd745794b9558

`````md
# Host Invocation Intent Preservation Ledger
`````

Before: docs/platform/host-invocation-routing/intent-preservation-ledger.md#4-preserved-intentions

Unit digest: 172c97d6d32a07039b2ffeed2e1a99e510c45ce5cb27ff7e0e884fe9de486d1b

`````md
## 4. Preserved Intentions
`````

Before: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-5

Unit digest: f7341ad45bd1ad546e336d059ff4ee8617498116ad159bd2e7531273ddbf6285

`````md
| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HI-I001 | The area name is Host Invocation And Provider Routing, centered on the Operation Provider Router; avoid `Component Router` and `Command Router`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `accepted-not-implemented` | `promote` | [README.md](README.md), [architecture/provider-routing.md](architecture/provider-routing.md) | Commands are only CLI projections; not every component is dispatchable. | Needs implementation proof for actual router naming. |
| HI-I002 | Host invocation and provider routing are separate responsibilities: host normalizes/admits; router selects implementation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `current partial` | `split` | [vision.md](vision.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Do not collapse parsing, admission, selection, and provider invocation into one CLI path. | Rust kernel proof exists for current built-in routes, R2 external-provider route, and R3 remote peer route; broader component migration remains partial. |
| HI-I003 | CLI, remote, and chat are peer host use cases; none shells through or wraps another after migration. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases) | `current partial` | `promote` | [architecture/host-use-cases.md](architecture/host-use-cases.md) | Peer status does not require one OS process; hosts may compose the same runtime crate. | CLI and remote peer proof exist for selected operations; chat remains future. |
| HI-I004 | The legacy CLI lane is the only non-`OperationRequest`/`ProviderOutcome` path and never enters `InvocationService` or Router. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases), [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `current partial` with `legacy-current` payload behavior | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Direct Node exec preserves argv/stdin/cwd/env/signals and writes one invocation record without semantic wrapping. | Preview proof exists for the manifest-owned legacy CLI lane; full compatibility vectors remain future cleanup. |
| HI-I005 | Canonical kernel terms include `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, Router, `InvocationService`, `InvocationControl`, `EventSink`, `CommandRouteDescriptor`, and `ConfigPort`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names) | `accepted-not-implemented` | `split` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [contracts/operation-provider.md](contracts/operation-provider.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) | One canonical name per concept; no alias drift. | Contract implementation unknown until Rust types exist. |
| HI-I006 | `OperationId` is stable semantic identity independent of CLI/REST/MCP/chat spelling. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `accepted-not-implemented` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md) | Format `<component>.<object-type>.<action>[.<variant>]`; hosts own projection. | First descriptors remain open. |
| HI-I007 | Built-in providers use typed Rust representation; `EncodedMessage` exists only at external process/WASM boundary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts), [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `split` | [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [contracts/component-protocol.md](contracts/component-protocol.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Raw `OsString` is never semantic request; built-ins never decode bytes. | Built-in Rust routes prove typed provider flow; R2 proves `EncodedMessage` stays private to the external process adapter boundary. |
| HI-I008 | `OperationCatalog` is authored by owning components; CLI registry or provider manifest cannot create an operation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `current partial` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | R1 uses const catalog/snapshot at composition root; no linker/cache/manifest scan in R1. | Current built-in catalog proof exists; R2 proves external manifests cannot claim reserved core operations and only add through the external provider linker path. |
| HI-I009 | Router is pure selection; `InvocationService` owns admit, select, grant, invoke, normalize, and record. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Router has no I/O, async, invocation, failure normalization, reporting, or host parsing. | Current Rust slice plus R2 external process proof use the same router/InvocationService path; replacement resolution remains partial. |
| HI-I010 | Authority has two stages: caller admission before routing and selected-provider grant after routing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/operation-provider.md](contracts/operation-provider.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Provider manifest is never authority; selected grant is least privilege. | Current authority-gate proof exists; R2 negative tests cover external manifest/linker refusal and same-pipeline provider grants. |
| HI-I011 | Configuration can never replace a built-in provider; rollback is via `fgctl` release rollback, not provider-selection swap. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Replacement policy only governs explicit external/plugin surface. | Preview `fgctl` proof exists; stable/default graduation remains a release-owner decision, while fallback removal follows the 30-day preview window. |
| HI-I012 | Failure families are closed and host presenters map them to their own public contracts. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `current partial` | `split` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/implementation-alignment.md](verification/implementation-alignment.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Provider crash is not semantic failure; partial output does not imply success. | Built-in provider errors and R2 external process crash/timeout/cancellation mapping are covered for preview; future routes/providers must keep the closed-family mapping. |
| HI-I013 | Exactly one terminal lifecycle record is emitted; late response after cancellation/deadline is diagnostic evidence, not second truth. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) | Records carry ids, contracts, registry fingerprint, provider id, host kind, timing, terminal family, evidence refs; never secrets. | Lifecycle recorder implementation missing. |
| HI-I014 | Providers never block waiting for human input; they return `parked`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | No mid-invocation callback to solicit input. | Needed before `ask`/`answer` migration. |
| HI-I015 | Public command name remains `fgos`; runtime identity is release digest; `fgctl` is separate bootstrap binary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [spec.md](spec.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Do not rename `fgos` to `fgctl`; `fgctl` owns bootstrap. | Preview proof shows `fgos` runtime identity through `version --runtime-json`; stable/default graduation remains open. |
| HI-I016 | R1 physical placement is three Rust crates plus unmoved Node payload; `component-protocol` waits for R2. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | No `packages/legacy-node` crate; legacy exec is CLI-adapter module; do not create fake `gate-policy` component. | R1 placement and R2 component protocol preview proof are closed; production ecosystem hardening remains future. |
| HI-I017 | R1 ships a distributable Rust CLI host, native `version`, and transparent Node compatibility. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | R1 is useful without R2/R3; repo tests alone do not mean stable/default release graduation. | Preview installed/default proof is recorded; stable/default graduation remains open. |
| HI-I018 | R2 proves external process provider preview without marketplace/signature/WASM scope. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview) | `implemented preview` | `promote` | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Static manifest validation and fail-closed protocol behavior gate R2. | R2 proof closed with `fixture.echo.echo`; marketplace/signature/WASM remain future. |
| HI-I019 | R3 proves a production remote peer through project-local gateway without CLI shelling or `fgos.v1` parsing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host) | `implemented preview` | `promote` | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md), [architecture/host-use-cases.md](architecture/host-use-cases.md) | Future shared multi-project gateway is separate and uses Project Runtime Adapter. | `GET /v1/runtime` proves the first project-local gateway peer route for `distribution.build.show`; all other gateway routes remain legacy `VerbGateway` consumers. |
| HI-I020 | Component class and invocation mechanism are separate axes. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes) | `accepted-not-implemented` | `promote` | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) | Core/packaged extension/user plugin differ from built-in/process/WASM mechanisms. | Provider descriptor proof needed. |
| HI-I021 | External process protocol is JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `promote` | [contracts/component-protocol.md](contracts/component-protocol.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Stdout is protocol only; logs go to stderr or declared notification; newline JSON is not contract. | R2 conformance closed for external process preview. |
| HI-I022 | External discovery scans static `manifest.yaml` and never executes unknown provider code to discover claims. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | `Registry` names derived runtime index/lock/cache, not another authored file. | R2 manifest proof closed; persisted cache/lock remains future. |
| HI-I023 | Duplicate operation claims fail closed unless explicit replacement policy names selected and replaced provider. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md) | Project-over-global config precedence is not authority precedence. | R2 negative tests cover duplicate/reserved/built-in replacement refusal; declared replacement resolution remains future. |
| HI-I024 | Core operation and command namespaces are reserved; plugins add vendor-scoped operations or implement published extension points. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [contracts/operation-catalog.md](contracts/operation-catalog.md) | Unknown capability requests and ambiguous claims fail closed. | R2 negative tests cover reserved namespace, duplicate, unknown capability, and incompatible-contract failures. |
| HI-I025 | `LegacyCliPassthroughProvider` and `LegacySemanticProvider` are distinct adapters with different contracts. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `accepted-not-implemented` | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Captured stdout/stderr never become semantic result; semantic bridge calls extracted Node use case, never `bin/fgos.mjs`. | P4/P8 proof needed. |
| HI-I026 | Node payload identity is `legacy-node`; source file `bin/fgos.mjs` is not relocated or renamed. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `legacy-current` and `accepted-not-implemented` target manifest identity | `keep legacy` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [spec.md](spec.md) | Payload is current npm package as `package.json` `files` defines it, staged whole under `components.legacyNode.root`. | Current file exists; release-manifest proof needed. |
| HI-I027 | The Rust adapter resolves the payload through verified release-manifest legacyNode fields, never PATH, caller cwd, alternate npm bin selection or an unconfined hardcoded payload path. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `code-checked boundary; dated preview proofs retained` | `promote` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [manifest-owned resolver](../../../apps/fgos/src/legacy_exec.rs) | Explicit release/dev environment bindings or current_exe-relative manifest discovery choose the root; manifest invariants, release files and confined legacy entry are verified. | Checked at the pinned candidate source tree: apps/fgos/src/legacy_exec.rs:69-154. package.json:9-12 and bin/fgos.mjs:1-10 retain npm/direct-Node compatibility channels; those channels are not the Rust payload resolver. No new install/activation smoke is claimed. |
| HI-I028 | Old `bin/fgos.mjs` callers require resolver migration; tests that spawn Node directly remain payload tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory) | `planned` | `promote` | [verification/compatibility-harness.md](verification/compatibility-harness.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Nine real call sites route through resolver; `.agents`/`plugins` copies are render targets. | P0/P4 scan proof needed. |
| HI-I029 | Every selector has exactly one generated `CommandRouteDescriptor`, route kind, owner path, and compatibility tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness) | `current partial` | `promote` | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/compatibility-harness.md](verification/compatibility-harness.md) | Descriptor is routing input and contributor repair map; unlisted selector fails build. | Current route matrix has 73 selectors, 71 legacy and two native, with drift tests. |
| HI-I030 | `fgos.v1` is CLI presentation, not provider protocol; legacy passthrough must not be double-wrapped. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | `accepted-not-implemented` | `split` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | Preserve compact hash input, pretty envelope output, order, timestamps, stdout/stderr, exit/signal mapping. | Compatibility vectors needed. |
| HI-I031 | Migration selects Rust host first, Node as legacy provider/lane; Option A and C are rejected. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered) | `accepted-not-implemented` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Do not do repository-wide Node thinning first or big-bang rewrite. | Plan accepted; implementation planned. |
| HI-I032 | Current CLI thinness categories are ordering signals, not authority to migrate by file size. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [history/host-invocation-baseline.md](history/host-invocation-baseline.md) | Preserve near-thin, partly-thin, and not-thin lists. | Needs fresh scan before execution. |
| HI-I033 | R1 migration order includes packaging contract adoption, legacy payload naming, selector descriptor, kernel, CLI adapter, native `version`, external install proof, then installed default flip. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Flip only after compatibility and distribution gates pass. | Preview installed/default flip is proven; stable/default release graduation remains open. |
| HI-I034 | `gate-bypass` is the next read proof, not a pre-created component; `ready` is not first proof. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read) | `implemented local proof` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [roadmap.md](roadmap.md#7-phase-d-add-the-next-native-read-route), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Implemented as existing work/state read ownership with Packaging-Distribution retaining setup/doctor readiness; do not invent `gate-policy`. | Keep proof scoped to read-only `work.gate-bypass.show`; full Work/State migration remains future work. |
| HI-I035 | Read models migrate before writers; writers need sole authority, event/schema compatibility, locks, atomicity, idempotency, crash recovery, mutual exclusion, and rollback compatibility. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Never dual-run a write for shadow comparison. | Future writer proof needed. |
| HI-I036 | Node removal is allowed only after zero legacy routes, replay compatibility, public host contract tests, no init/doctor dependency, and no rollback dependency. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Node removal is consequence of zero routes, not calendar target. | Future cleanup proof needed. |
| HI-I037 | P0-P9 execution graph and proof gates remain planning material, not architecture authority. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph) | `planned` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/compatibility-harness.md](verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) | P-numbering stays P0-P9; PK is packaging dependency, not new P-package. | Proof docs are stubs until executed. |
| HI-I038 | Remaining decisions before R1: target matrix, preview-vs-stable, compatibility-window duration. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution) | `preview settled; stable deferred; fallback window settled` | `deferred` | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Settled packaging choices for publication, rollback, artifact identity, and setup/doctor authority must not be reopened here. | Preview/default is settled; fallback escape-hatch window is 30 calendar days after preview release publication; stable graduation still needs release-owner decision. |
`````

Before: docs/platform/host-invocation-routing/intent-preservation-ledger.md#6-open-items

Unit digest: 736d6ee9913ab39b2002298cfc3f67640dd0f5c1cae75dd79f20c8b0ce350c59

`````md
## 6. Open Items
`````

Before: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-8

Unit digest: 076b6d519f65097ddf3ced2fa31996f5d760e0b7b184c0e69b263db2eed06cf2

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

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#host-invocation-intent-preservation-ledger

Unit digest: aa8ba20a81b8dd0108e9a339531914e0692d952a9d6247a2aa81864a34631583

`````md
# Host Invocation Intent Preservation Ledger
`````

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#4-preserved-intentions

Unit digest: cdb69c90ca068818b4c348b52746bb1fdfed0ec60fd9f3e9bc5c74668e9a4a12

`````md
## 4. Preserved Intentions
`````

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-6

Unit digest: 45d7db6a7075e118c4290ed08d5f2df32c46140aa42cfaee1d4403f87fb84d22

`````md
| ID | Claim / intent | Source | Status | Disposition | Target doc | Must not lose | Proof / gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HI-I001 | The area name is Host Invocation And Provider Routing, centered on the Operation Provider Router; avoid `Component Router` and `Command Router`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `accepted-not-implemented` | `promote` | [README.md](README.md), [architecture/provider-routing.md](architecture/provider-routing.md) | Commands are only CLI projections; not every component is dispatchable. | Needs implementation proof for actual router naming. |
| HI-I002 | Host invocation and provider routing are separate responsibilities: host normalizes/admits; router selects implementation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#1-architecture-name) | `current partial` | `split` | [vision.md](vision.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Do not collapse parsing, admission, selection, and provider invocation into one CLI path. | Rust kernel proof exists for current built-in routes, R2 external-provider route, and R3 remote peer route; broader component migration remains partial. |
| HI-I003 | CLI, remote, and chat are peer host use cases; none shells through or wraps another after migration. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases) | `current partial` | `promote` | [architecture/host-use-cases.md](architecture/host-use-cases.md) | Peer status does not require one OS process; hosts may compose the same runtime crate. | CLI and remote peer proof exist for selected operations; chat remains future. |
| HI-I004 | The legacy CLI lane is the only non-`OperationRequest`/`ProviderOutcome` path and never enters `InvocationService` or Router. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#4-peer-host-use-cases), [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `current partial` with `legacy-current` payload behavior | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Direct Node exec preserves argv/stdin/cwd/env/signals and writes one invocation record without semantic wrapping. | Preview proof exists for the manifest-owned legacy CLI lane; full compatibility vectors remain future cleanup. |
| HI-I005 | Canonical kernel terms include `OperationId`, `HostInvocation`, `OperationRequest`, `ContractRef`, `ProviderOutcome`, `ProviderError`, `OperationProvider`, `ProviderDescriptor`, `OperationDescriptor`, `OperationCatalog`, `RegistrySnapshot`, Router, `InvocationService`, `InvocationControl`, `EventSink`, `CommandRouteDescriptor`, and `ConfigPort`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#3-canonical-names) | `accepted-not-implemented` | `split` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [contracts/operation-provider.md](contracts/operation-provider.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md) | One canonical name per concept; no alias drift. | Contract implementation unknown until Rust types exist. |
| HI-I006 | `OperationId` is stable semantic identity independent of CLI/REST/MCP/chat spelling. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `accepted-not-implemented` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md) | Format `<component>.<object-type>.<action>[.<variant>]`; hosts own projection. | First descriptors remain open. |
| HI-I007 | Built-in providers use typed Rust representation; `EncodedMessage` exists only at external process/WASM boundary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts), [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `split` | [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [contracts/component-protocol.md](contracts/component-protocol.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Raw `OsString` is never semantic request; built-ins never decode bytes. | Built-in Rust routes prove typed provider flow; R2 proves `EncodedMessage` stays private to the external process adapter boundary. |
| HI-I008 | `OperationCatalog` is authored by owning components; CLI registry or provider manifest cannot create an operation. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#5-core-contracts) | `current partial` | `promote` | [contracts/operation-catalog.md](contracts/operation-catalog.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | R1 uses const catalog/snapshot at composition root; no linker/cache/manifest scan in R1. | Current built-in catalog proof exists; R2 proves external manifests cannot claim reserved core operations and only add through the external provider linker path. |
| HI-I009 | Router is pure selection; `InvocationService` owns admit, select, grant, invoke, normalize, and record. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#6-router-pure-and-invocationservice-pipeline) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/invocation-kernel.md](architecture/invocation-kernel.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Router has no I/O, async, invocation, failure normalization, reporting, or host parsing. | Current Rust slice plus R2 external process proof use the same router/InvocationService path; replacement resolution remains partial. |
| HI-I010 | Authority has two stages: caller admission before routing and selected-provider grant after routing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage) | `current partial` | `promote` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/operation-provider.md](contracts/operation-provider.md), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Provider manifest is never authority; selected grant is least privilege. | Current authority-gate proof exists; R2 negative tests cover external manifest/linker refusal and same-pipeline provider grants. |
| HI-I011 | Configuration can never replace a built-in provider; rollback is via `fgctl` release rollback, not provider-selection swap. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#7-authority-two-stage), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#13-rollback-rules) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Replacement policy only governs explicit external/plugin surface. | Preview `fgctl` proof exists; stable/default graduation remains a release-owner decision, while fallback removal follows the 30-day preview window. |
| HI-I012 | Failure families are closed and host presenters map them to their own public contracts. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `current partial` | `split` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/implementation-alignment.md](verification/implementation-alignment.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Provider crash is not semantic failure; partial output does not imply success. | Built-in provider errors and R2 external process crash/timeout/cancellation mapping are covered for preview; future routes/providers must keep the closed-family mapping. |
| HI-I013 | Exactly one terminal lifecycle record is emitted; late response after cancellation/deadline is diagnostic evidence, not second truth. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) | Records carry ids, contracts, registry fingerprint, provider id, host kind, timing, terminal family, evidence refs; never secrets. | Lifecycle recorder implementation missing. |
| HI-I014 | Providers never block waiting for human input; they return `parked`. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#8-failure-cancellation-lifecycle-and-human-input), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#9-repeat-by-component-boundary) | `accepted-not-implemented` | `promote` | [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | No mid-invocation callback to solicit input. | Needed before `ask`/`answer` migration. |
| HI-I015 | Public command name remains `fgos`; runtime identity is release digest; `fgctl` is separate bootstrap binary. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [spec.md](spec.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Do not rename `fgos` to `fgctl`; `fgctl` owns bootstrap. | Preview proof shows `fgos` runtime identity through `version --runtime-json`; stable/default graduation remains open. |
| HI-I016 | R1 physical placement is three Rust crates plus unmoved Node payload; `component-protocol` waits for R2. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#9-physical-placement), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#7-p2-rust-workspace-and-generated-inputs) | `implemented preview` | `promote` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | No `packages/legacy-node` crate; legacy exec is CLI-adapter module; do not create fake `gate-policy` component. | R1 placement and R2 component protocol preview proof are closed; production ecosystem hardening remains future. |
| HI-I017 | R1 ships a distributable Rust CLI host, native `version`, and transparent Node compatibility. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#1-outcome) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | R1 is useful without R2/R3; repo tests alone do not mean stable/default release graduation. | Preview installed/default proof is recorded; stable/default graduation remains open. |
| HI-I018 | R2 proves external process provider preview without marketplace/signature/WASM scope. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#12-p7-external-process-provider-preview) | `implemented preview` | `promote` | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Static manifest validation and fail-closed protocol behavior gate R2. | R2 proof closed with `fixture.echo.echo`; marketplace/signature/WASM remain future. |
| HI-I019 | R3 proves a production remote peer through project-local gateway without CLI shelling or `fgos.v1` parsing. | [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md#10-release-boundaries), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#7-release-r3-production-remote-host) | `implemented preview` | `promote` | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md), [architecture/host-use-cases.md](architecture/host-use-cases.md) | Future shared multi-project gateway is separate and uses Project Runtime Adapter. | `GET /v1/runtime` proves the first project-local gateway peer route for `distribution.build.show`; all other gateway routes remain legacy `VerbGateway` consumers. |
| HI-I020 | Component class and invocation mechanism are separate axes. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#1-component-classes) | `accepted-not-implemented` | `promote` | [architecture/external-provider-protocol.md](architecture/external-provider-protocol.md) | Core/packaged extension/user plugin differ from built-in/process/WASM mechanisms. | Provider descriptor proof needed. |
| HI-I021 | External process protocol is JSON-RPC 2.0 semantics over 4-byte big-endian length-prefixed UTF-8 JSON frames on stdio. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol) | `implemented preview` | `promote` | [contracts/component-protocol.md](contracts/component-protocol.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | Stdout is protocol only; logs go to stderr or declared notification; newline JSON is not contract. | R2 conformance closed for external process preview. |
| HI-I022 | External discovery scans static `manifest.yaml` and never executes unknown provider code to discover claims. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) | `Registry` names derived runtime index/lock/cache, not another authored file. | R2 manifest proof closed; persisted cache/lock remains future. |
| HI-I023 | Duplicate operation claims fail closed unless explicit replacement policy names selected and replaced provider. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker) | `current partial` | `split` | [architecture/provider-routing.md](architecture/provider-routing.md), [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md) | Project-over-global config precedence is not authority precedence. | R2 negative tests cover duplicate/reserved/built-in replacement refusal; declared replacement resolution remains future. |
| HI-I024 | Core operation and command namespaces are reserved; plugins add vendor-scoped operations or implement published extension points. | [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md#5-namespace-rules) | `implemented preview` | `promote` | [contracts/external-provider-manifest.md](contracts/external-provider-manifest.md), [contracts/operation-catalog.md](contracts/operation-catalog.md) | Unknown capability requests and ambiguous claims fail closed. | R2 negative tests cover reserved namespace, duplicate, unknown capability, and incompatible-contract failures. |
| HI-I025 | `LegacyCliPassthroughProvider` and `LegacySemanticProvider` are distinct adapters with different contracts. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#1-two-distinct-adapters) | `accepted-not-implemented` | `promote` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Captured stdout/stderr never become semantic result; semantic bridge calls extracted Node use case, never `bin/fgos.mjs`. | P4/P8 proof needed. |
| HI-I026 | Node payload identity is `legacy-node`; source file `bin/fgos.mjs` is not relocated or renamed. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `legacy-current` and `accepted-not-implemented` target manifest identity | `keep legacy` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [spec.md](spec.md) | Payload is current npm package as `package.json` `files` defines it, staged whole under `components.legacyNode.root`. | Current file exists; release-manifest proof needed. |
| HI-I027 | The Rust adapter resolves the payload through verified release-manifest legacyNode fields, never from PATH, never from the caller’s cwd, never as an alternate package-manager bin entry, and never hardcoded. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path) | `accepted-not-implemented` target; manifest-owned resolver checked, dated preview proofs retained | `promote` | [contracts/legacy-payload.md](contracts/legacy-payload.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [manifest-owned resolver](../../../apps/fgos/src/legacy_exec.rs) | Explicit release/dev environment bindings or current_exe-relative manifest discovery choose the root; manifest invariants, release files and confined legacy entry are verified. | Checked at the pinned candidate source tree: apps/fgos/src/legacy_exec.rs:69-154. package.json:9-12 and bin/fgos.mjs:1-10 retain npm/direct-Node compatibility channels; those channels are not the Rust payload resolver. No new install/activation smoke is claimed. |
| HI-I028 | Old `bin/fgos.mjs` callers require resolver migration; tests that spawn Node directly remain payload tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#5-p0-lock-release-inputs-and-baseline-inventory) | `planned` | `promote` | [verification/compatibility-harness.md](verification/compatibility-harness.md), [contracts/legacy-payload.md](contracts/legacy-payload.md) | Nine real call sites route through resolver; `.agents`/`plugins` copies are render targets. | P0/P4 scan proof needed. |
| HI-I029 | Every selector has exactly one generated `CommandRouteDescriptor`, route kind, owner path, and compatibility tests. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#2-legacy-payload-identity-ownership-and-repair-path), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#6-p1-compatibility-harness) | `current partial` | `promote` | [contracts/command-route-descriptor.md](contracts/command-route-descriptor.md), [verification/compatibility-harness.md](verification/compatibility-harness.md) | Descriptor is routing input and contributor repair map; unlisted selector fails build. | Current route matrix has 75 selectors, 70 legacy and five native, with drift tests. |
| HI-I030 | `fgos.v1` is CLI presentation, not provider protocol; legacy passthrough must not be double-wrapped. | [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md#4-public-presentation-versus-semantic-outcome) | `accepted-not-implemented` | `split` | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md), [contracts/operation-request-outcome.md](contracts/operation-request-outcome.md) | Preserve compact hash input, pretty envelope output, order, timestamps, stdout/stderr, exit/signal mapping. | Compatibility vectors needed. |
| HI-I031 | Migration selects Rust host first, Node as legacy provider/lane; Option A and C are rejected. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#2-options-considered) | `accepted-not-implemented` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Do not do repository-wide Node thinning first or big-bang rewrite. | Plan accepted; implementation planned. |
| HI-I032 | Current CLI thinness categories are ordering signals, not authority to migrate by file size. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#4-current-migration-readiness) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [history/host-invocation-baseline.md](history/host-invocation-baseline.md) | Preserve near-thin, partly-thin, and not-thin lists. | Needs fresh scan before execution. |
| HI-I033 | R1 migration order includes packaging contract adoption, legacy payload naming, selector descriptor, kernel, CLI adapter, native `version`, external install proof, then installed default flip. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#5-release-r1-distributable-rust-cli-host) | `implemented preview` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [../packaging-distribution/reports/track-closeout.md](../packaging-distribution/reports/track-closeout.md) | Flip only after compatibility and distribution gates pass. | Preview installed/default flip is proven; stable/default release graduation remains open. |
| HI-I034 | `gate-bypass` is the next read proof, not a pre-created component; `ready` is not first proof. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#8-migrate-the-next-small-read-only-proof), [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#14-p9-next-native-read) | `implemented local proof` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md), [roadmap.md](roadmap.md#7-phase-d-add-the-next-native-read-route), [verification/implementation-alignment.md](verification/implementation-alignment.md) | Implemented as existing work/state read ownership with Packaging-Distribution retaining setup/doctor readiness; do not invent `gate-policy`. | Keep proof scoped to read-only `work.gate-bypass.show`; full Work/State migration remains future work. |
| HI-I035 | Read models migrate before writers; writers need sole authority, event/schema compatibility, locks, atomicity, idempotency, crash recovery, mutual exclusion, and rollback compatibility. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#10-migrate-read-models-before-writers), [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#11-migrate-state-writing-components) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Never dual-run a write for shadow comparison. | Future writer proof needed. |
| HI-I036 | Node removal is allowed only after zero legacy routes, replay compatibility, public host contract tests, no init/doctor dependency, and no rollback dependency. | [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md#12-remove-node) | `planned` | `promote` | [architecture/node-to-rust-migration.md](architecture/node-to-rust-migration.md) | Node removal is consequence of zero routes, not calendar target. | Future cleanup proof needed. |
| HI-I037 | P0-P9 execution graph and proof gates remain planning material, not architecture authority. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#4-delivery-graph) | `planned` | `split` | [architecture/release-boundaries.md](architecture/release-boundaries.md), [verification/compatibility-harness.md](verification/compatibility-harness.md), [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md), [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) | P-numbering stays P0-P9; PK is packaging dependency, not new P-package. | Proof docs are stubs until executed. |
| HI-I038 | Remaining decisions before R1: target matrix, preview-vs-stable, compatibility-window duration. | [rust-cli-and-proof-components-plan.md](../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md#3-decisions-required-before-r1-execution) | `preview settled; stable deferred; fallback window settled` | `deferred` | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md), [architecture/release-boundaries.md](architecture/release-boundaries.md), [../packaging-distribution/verification/install-and-release-proof.md](../packaging-distribution/verification/install-and-release-proof.md) | Settled packaging choices for publication, rollback, artifact identity, and setup/doctor authority must not be reopened here. | Preview/default is settled; fallback escape-hatch window is 30 calendar days after preview release publication; stable graduation still needs release-owner decision. |
`````

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#6-open-items

Unit digest: 25be5a30c111e9005e326dd59542052c2aed32f25daaeef42c2a2a24032bd487

`````md
## 6. Open Items
`````

After: docs/platform/host-invocation-routing/intent-preservation-ledger.md#unheaded-block-9

Unit digest: 6285e4bf68b83ee0e8090de22df3316e6c529bef2f750c8a33e3983c22aae9a5

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

### docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md

Before file digest: a5234820a55579f42ed1c03559704b07b70d35064211a27b36d44dd47ec7878c

After file digest: 2188f9a15473d9dd2149b7c75ad471f733329bf6283b0edfcb526f6be7ba8476

Before: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#r2-external-process-provider-rollout-plan

Unit digest: 8e762433887df7ee03f2ad01abe5a63cc4d5069633cd31f24746e0c45612d11f

`````md
# R2 External Process Provider Rollout Plan
`````

Before: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#unheaded-block-2

Unit digest: f87ec64606aa1b87af31c09372ef7956f37217695c9165ec137811c682292d50

`````md
The R2 rollout plan is historical execution material, not a current platform
contract. Its previously recorded location is unavailable in this checkout:
`````

Before: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#unheaded-block-3

Unit digest: 0a133ef1c59e4773b2765c55d064e7553838a35c91ea2a598183d5d5aa6184bb

`````md
`../../../plans/260915-host-invocation-r2-external-process/plan.md` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`)
`````

After: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#r2-external-process-provider-rollout-plan

Unit digest: cc0ebf14d3f3d9c09073dcd9001fac0e75fd1faeb50355bf687fc58cef26b7f4

`````md
# R2 External Process Provider Rollout Plan
`````

After: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#unheaded-block-2

Unit digest: 0ea466093845bd8a89eb4f4e2a4826884e6e0c3a49621761d649c0452c4a1899

`````md
The R2 rollout plan is historical execution material, not a current platform
contract. Its archived execution record is available here:
`````

After: docs/platform/host-invocation-routing/r2-external-process-rollout-plan.md#unheaded-block-3

Unit digest: 45c132aafdeda9a805cf148cfaf7186641813f2edb569561b5004f56a2570561

`````md
[../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../archive/plans/260915-host-invocation-r2-external-process/plan.md)
`````

### docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md

Before file digest: dd463ba5c3139b1530f2d55875d9ef48201222b170cc5efe707224bc422447ee

After file digest: a93b6eaa791dbde6be510d6f2f035102eccca8393a71093febd6924236dc5a27

Before: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#r3-remote-peer-rollout-plan

Unit digest: b7babcb18ef4c9644624aa9ffb048c4d4843b09a495f74166f2c215a58016fbb

`````md
# R3 Remote Peer Rollout Plan
`````

Before: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#unheaded-block-2

Unit digest: 5956c0ec6a74389d9d6ac943201ecece133d094e814e785264ab9b0bf291f7db

`````md
The R3 rollout plan is historical execution material, not a current platform
contract. Its previously recorded location is unavailable in this checkout:
`````

Before: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#unheaded-block-3

Unit digest: 48b51eefdcf8b34f048c53f85f3cb6961b0db3213ee2036e943ec6d692717f69

`````md
`../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`)
`````

After: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#r3-remote-peer-rollout-plan

Unit digest: a13a5efad51d7cafe57a184eaf9500ce42f919409584d9601e2c98cbdaae9a78

`````md
# R3 Remote Peer Rollout Plan
`````

After: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#unheaded-block-2

Unit digest: 5728c6904b1e406d4ea7eb19be5327e454be9b394d513e3962a6f8c8d8dfb6e2

`````md
The R3 rollout plan is historical execution material, not a current platform
contract. Its archived execution record is available here:
`````

After: docs/platform/host-invocation-routing/r3-remote-peer-rollout-plan.md#unheaded-block-3

Unit digest: d9b5ecd632254f864ff804f501e1ee7bde1895d67707bcd6272c7cf3c87f0b54

`````md
[../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md)
`````

### docs/platform/host-invocation-routing/roadmap.md

Before file digest: 394bd2579a012fcc151c5486cc7deab8b6201abd7df5c7cf43bd77bab6127d1c

After file digest: 42733a0a9dd332a90d985037a589e2bfda30043dd5eddd48452f7321b831570d

Before: docs/platform/host-invocation-routing/roadmap.md#host-invocation-routing-roadmap

Unit digest: 9d166e3e58fac3c37915ec51e4be42cd1bab7cc282203607be9c400414ababb8

`````md
# Host Invocation Routing Roadmap
`````

Before: docs/platform/host-invocation-routing/roadmap.md#1-current-baseline

Unit digest: 589e9a8fd90ded189c6e873fad3af74c4a42d44be1a816ace2fef4fc5c628395

`````md
## 1. Current Baseline
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-3

Unit digest: 96321e0c9319ed562295b27c18c1a1ee1b3bf9e1f932816ddff13890d69a638b

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

Before: docs/platform/host-invocation-routing/roadmap.md#3-plan-overview

Unit digest: fd952025e65ed46d02be2578c87acbf464aaf6031c8ce72c9a5dd4685918caeb

`````md
## 3. Plan Overview
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-8

Unit digest: 8b4f5a17fceff4ccc66ec2b8064a259453563feac5b4c87ddeceb2978920c8e6

`````md
Phase A, Phase D's local native-read proof, Phase E (R2, closed 2026-09-15),
and the preview parts of Phase B/C are closed. Stable/default graduation still
requires packaging-distribution or release-owner decisions. Phase F now has
its precondition satisfied (Phase E delivered `fixture.echo.echo`, a semantic
operation that is not only a built-in CLI route) and can proceed on its own
rollout plan. Phase F is now implemented preview: R3-P0 through R3-P5 are
closed on 2026-09-18, proving native remote peer invocation for
`distribution.build.show` (`GET /v1/runtime` in `apps/fgos-gateway/src/gateway.rs`)
without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other
gateway routes remain on `VerbGateway` per the
`R3 execution record` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#31-status-tracker

Unit digest: 57afc74e1b96b127768edceeace114396bfa7ef940db0d86e1faae26c77a9d60

`````md
### 3.1 Status Tracker
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-9

Unit digest: 438155af8637aa98a7ecf9d30b8ee405b50a574d88b68d30349312518655ef50

`````md
| Front | Status | What is done | What remains |
| --- | --- | --- | --- |
| R1 Rust CLI host | `implemented preview` | Installed/default preview proof shows external `fgos` enters the Rust host; `version` and `gate-bypass` are native routes. | Stable/default graduation remains a release-owner decision. |
| Route matrix | `current partial` | 73 selectors are described: 71 `legacy-cli`, two native. | Migrate additional selectors only at complete operation/use-case boundaries. |
| Invocation kernel | `current partial` | `OperationRequest`, `ProviderOutcome`, router, registry snapshot, two-stage authority, and `InvocationService` are proven for the current Rust slice. | Declared replacement resolution, broader native providers, and future host kinds still need proof. |
| R2 external process provider | `implemented preview` | `fixture.echo.echo` proves manifest discovery, derived registry/linker, frame codec, supervisor, and router integration. | Production provider ecosystem work: marketplace/signatures, WASM, persisted cache/lock, non-fixture shipped providers. |
| R3 remote peer | `implemented preview` | `GET /v1/runtime` invokes `distribution.build.show` through the shared kernel without `VerbGateway`, CLI shelling, or `fgos.v1` parsing. | Every other gateway route remains legacy; future remote-route migrations are separate work. |
| Chat host | `planned` | No current adapter or contract is claimed. | Define admission, interruption, parking, presentation, and proof contract. |
| Legacy Node retirement | `blocked by migration/release gates` | Node is still the compatibility payload for 71 selectors. | Requires zero `legacy-cli` routes, release policy closure, and packaging rollback/fallback agreement. |
`````

Before: docs/platform/host-invocation-routing/roadmap.md#4-phase-a-close-local-r1-host-proof

Unit digest: 9064ea009eb86a3c5a41a2e9ac97ea8152a17afad10874bff1ecfe941be30dec

`````md
## 4. Phase A: Close Local R1 Host Proof
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-12

Unit digest: 9cd327cb0385c90d735a03302b06ea532380be307ea2ba692a21b2ebc86ba59a

`````md
- Keep [command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) as the route matrix source of truth.
- Verify the matrix count in tests: 73 selectors, 71 `legacy-cli`, two native routes: `version -> distribution.build.show` and `gate-bypass -> work.gate-bypass.show`.
- Ensure every route has owner path and compatibility tests.
- Keep native `version` proof: no Node child process, valid `fgos.v1` presentation, `distribution.build.show` typed provider output.
- Keep legacy passthrough proof: one Node child process, manifest-based legacy payload resolution, recursion guard, one lifecycle record.
- Keep kernel proof: `OperationId`, `OperationRequest`, `ProviderOutcome`, router, registry snapshot, authority gate, and `InvocationService` tests.
`````

Before: docs/platform/host-invocation-routing/roadmap.md#9-phase-f-r3-production-remote-peer

Unit digest: e83d02c9e70522adcc6bc32a3bccc8c8ab0afd0303b96acb2156817842a5cc18

`````md
## 9. Phase F: R3 Production Remote Peer
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-40

Unit digest: f18c77cb977aaa9a2e16999f24f0136f4857ece188c5c8a3d8a28580afd2765f

`````md
Detailed rollout plan: `R3 execution record` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#12-immediate-next-actions

Unit digest: 51c8d5ccae9c38a5969bc2b77ca6446f20a5dd07c4d1d3ca0ffe0aed5bc24764

`````md
## 12. Immediate Next Actions
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-57

Unit digest: 762bc840497bd26b419b9193ebb202b5f838de4a26c73e111b0c289a8f25902d

`````md
| Order | Action | Owner | Packaging dependency |
| --- | --- | --- | --- |
| 1 | Keep preview proof green: route matrix stays at 73 selectors / 71 `legacy-cli` / two native until a new migration intentionally changes it. | Host invocation | No |
| 2 | Decide whether the next frontier is another native read route, another remote read route, or the chat-host contract. Do not treat R2/R3 closeout as whole-component migration. | Host invocation | No, unless the chosen route touches release/runtime selection. |
| 3 | Keep stable/default graduation parked with the release owner; enforce the settled 30-day legacy fallback escape-hatch window for preview. | Packaging-distribution / release owner | Yes |
| 4 | For external providers, choose whether to harden the preview mechanism (persisted cache/lock, shipped provider packaging, marketplace/signatures, WASM) before accepting non-fixture providers. | Host invocation plus Packaging-Distribution where artifacts ship | Maybe |
`````

Before: docs/platform/host-invocation-routing/roadmap.md#13-related-files

Unit digest: fe04fbf58cfcf5f6093e1910b51cfe1e33c30487fb0a989ebb3443932835eef6

`````md
## 13. Related Files
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-58

Unit digest: f900b54f84c8a36a5b0fff4bde9584aac632c4b1058a92f812d564237d9ad05c

`````md
| Relationship | File |
| --- | --- |
| area portal | [README.md](README.md) |
| spec | [spec.md](spec.md) |
| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| R2 execution record | `../../../plans/260915-host-invocation-r2-external-process/plan.md` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`) |
| R3 execution record | `../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`) |
| R1 proof | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| R2 proof | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| R3 proof | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| packaging-distribution portal | [../packaging-distribution/README.md](../packaging-distribution/README.md) |
| runtime identity and activation | [../packaging-distribution/architecture/runtime-identity-and-activation.md](../packaging-distribution/architecture/runtime-identity-and-activation.md) |
`````

Before: docs/platform/host-invocation-routing/roadmap.md#migration-status-note

Unit digest: 10609d492de231f4a29fa203b1270b09a5d50eea31c50d8102ce79393f71d468

`````md
#### Migration Status Note
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-62

Unit digest: 571b35923c8fa16665f8e7c05d16dd8932251c62c0773c168d42e92d74e33ebc

`````md
This document remains a legacy-current execution-plan source during the
2026-09-14 promotion pass. The promoted platform docs are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Before: docs/platform/host-invocation-routing/roadmap.md#3-decisions-required-before-r1-execution

Unit digest: 702067cf0a8e58d6cb9e30f83150741f69bb78daf8009b518a905eccc29c755c

`````md
#### 3. Decisions Required Before R1 Execution
`````

Before: docs/platform/host-invocation-routing/roadmap.md#6-p1-compatibility-harness

Unit digest: 9774571e0438e50d2880b72f20ccbbe0030bf9e6fe5d4c12f1158a665aa99316

`````md
#### 6. P1 — Compatibility Harness
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-78

Unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-79

Unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#coverage-floor

Unit digest: 3735c67d2718167e94b240b5ca902e5ca926717df1527a1e452001c42e8db8a8

`````md
##### Coverage floor
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-82

Unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-83

Unit digest: d37ebff687ce8cfd2b3f3965ea78c65ff85f79071ad0495c92ef2ca40fdfedae

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-016 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-p1-compatibility-harness`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#14-p9-next-native-read

Unit digest: d37f678738c6741ae35829eb31c3669a46331921f42b5392a3cab40f4db77d5e

`````md
#### 14. P9 — Next Native Read
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-119

Unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-120

Unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

Before: docs/platform/host-invocation-routing/roadmap.md#16-commit-and-rollback-slices

Unit digest: 264e22c141cb1bab92bf5bcd9de7c022773e601a571adafdbd9ac2a0c9a841c8

`````md
#### 16. Commit And Rollback Slices
`````

Before: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-124

Unit digest: 5c0cf33db52380beeda5f0d34d12c5bcef1207968ee1d814f79ab34389b903e6

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-017 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/verification/compatibility-harness.md#restored-test-and-review-gates-table`).
`````

After: docs/platform/host-invocation-routing/roadmap.md#host-invocation-routing-roadmap

Unit digest: 6506a0e42323a5a5b41dfc7f0e89d7dfe473338b7a76385fe6485ead4440bc4f

`````md
# Host Invocation Routing Roadmap
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/roadmap.md#1-current-baseline

Unit digest: e970e9dca56ea3a31b46c058fb5edebfd8a579914da603b6fae70076863bb20b

`````md
## 1. Current Baseline
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-4

Unit digest: 470ddd3bc8b62c4b74b260dffc943949e49cad26eb2faa66e9e9c0845c542b38

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

After: docs/platform/host-invocation-routing/roadmap.md#3-plan-overview

Unit digest: 0a6dac28f6c6a4b41c9d0df797b9d00ac720a950fd1971719d2dce465e63235d

`````md
## 3. Plan Overview
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-9

Unit digest: a6f8be6c25e2a74e3951a8e8393d14950a93bc72c1172ee763bf527191e173f9

`````md
Phase A, Phase D's local native-read proof, Phase E (R2, closed 2026-09-15),
and the preview parts of Phase B/C are closed. Stable/default graduation still
requires packaging-distribution or release-owner decisions. Phase F now has
its precondition satisfied (Phase E delivered `fixture.echo.echo`, a semantic
operation that is not only a built-in CLI route) and can proceed on its own
rollout plan. Phase F is now implemented preview: R3-P0 through R3-P5 are
closed on 2026-09-18, proving native remote peer invocation for
`distribution.build.show` (`GET /v1/runtime` in `apps/fgos-gateway/src/gateway.rs`)
without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other
gateway routes remain on `VerbGateway` per the
[R3 execution record](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md).
`````

After: docs/platform/host-invocation-routing/roadmap.md#31-status-tracker

Unit digest: 926a6ea7aaba3f7a8536ed7a664d67f8f7f6f44a2ecd8d36ed8cc56f0d27ea9e

`````md
### 3.1 Status Tracker
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-10

Unit digest: 5a40e37465021536f67f72817ee4336d96f966fa366b76533a52412308a12764

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

After: docs/platform/host-invocation-routing/roadmap.md#4-phase-a-close-local-r1-host-proof

Unit digest: eca4945a2229e68aeff424f6c1d495d8b8d71bf254b5f224d4687543b613edd2

`````md
## 4. Phase A: Close Local R1 Host Proof
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-13

Unit digest: 756c09cbd8f4949210ad3f8b98212a700d5211c5c8ab4776a41b3e9f43b046ce

`````md
- Keep [command-routes.json](../../../packages/host-runtime/contracts/command-routes.json) as the route matrix source of truth.
- Verify the matrix count in tests: 75 selectors, 70 `legacy-cli`, five native selectors: `convention`, `friction`, `gate-bypass`, `metrics`, `version`.
- Ensure every route has owner path and compatibility tests.
- Keep native `version` proof: no Node child process, valid `fgos.v1` presentation, `distribution.build.show` typed provider output.
- Keep legacy passthrough proof: one Node child process, manifest-based legacy payload resolution, recursion guard, one lifecycle record.
- Keep kernel proof: `OperationId`, `OperationRequest`, `ProviderOutcome`, router, registry snapshot, authority gate, and `InvocationService` tests.
`````

After: docs/platform/host-invocation-routing/roadmap.md#9-phase-f-r3-production-remote-peer

Unit digest: 20a25aeedf20511880426b81f79fcef9a31c8f3e87f1c8429cf451cfd2eb08f6

`````md
## 9. Phase F: R3 Production Remote Peer
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-41

Unit digest: 6253bce61340a663e2dcb3a910ba19065911e4ab74fe348863a410f3486e2d3e

`````md
Detailed rollout plan: [R3 execution record](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md).
`````

After: docs/platform/host-invocation-routing/roadmap.md#12-immediate-next-actions

Unit digest: f106de30988abc0b67a9e330953a1ae0b6400c53ee6d34f7d8ba7d42f56590a2

`````md
## 12. Immediate Next Actions
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-58

Unit digest: f4d0e1ae6fe79de37172b94ecb2d0216dc6ecfd6078038f358cdcbcb42aa3a1f

`````md
| Order | Action | Owner | Packaging dependency |
| --- | --- | --- | --- |
| 1 | Keep preview proof green: route matrix stays at 75 selectors / 70 `legacy-cli` / five native until a new migration intentionally changes it. | Host invocation | No |
| 2 | Decide whether the next frontier is another native read route, another remote read route, or the chat-host contract. Do not treat R2/R3 closeout as whole-component migration. | Host invocation | No, unless the chosen route touches release/runtime selection. |
| 3 | Keep stable/default graduation parked with the release owner; enforce the settled 30-day legacy fallback escape-hatch window for preview. | Packaging-distribution / release owner | Yes |
| 4 | For external providers, choose whether to harden the preview mechanism (persisted cache/lock, shipped provider packaging, marketplace/signatures, WASM) before accepting non-fixture providers. | Host invocation plus Packaging-Distribution where artifacts ship | Maybe |
`````

After: docs/platform/host-invocation-routing/roadmap.md#13-related-files

Unit digest: 264f5ed8176d052fab40076c326a22539556b2a84100e1092382c5a4e0d18edf

`````md
## 13. Related Files
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-59

Unit digest: e40111c9241c06dfb2dd839d3c6fd07e2ab86f525950304c036e0d29f23c8a54

`````md
| Relationship | File |
| --- | --- |
| area portal | [README.md](README.md) |
| spec | [spec.md](spec.md) |
| implementation alignment | [verification/implementation-alignment.md](verification/implementation-alignment.md) |
| R2 execution record | [../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../archive/plans/260915-host-invocation-r2-external-process/plan.md) |
| R3 execution record | [../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| R1 proof | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| R2 proof | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| R3 proof | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| packaging-distribution portal | [../packaging-distribution/README.md](../packaging-distribution/README.md) |
| runtime identity and activation | [../packaging-distribution/architecture/runtime-identity-and-activation.md](../packaging-distribution/architecture/runtime-identity-and-activation.md) |
`````

After: docs/platform/host-invocation-routing/roadmap.md#historical-migration-status-note

Unit digest: c67619ba2bc360580b6127bb4b93b9358875e6513207ece712288be415e59496

`````md
#### Historical Migration Status Note
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-63

Unit digest: 52a9e0a948877fa42ccc7570580ccd25c5c8821bd3ddd7d13234f8e635db957e

`````md
Added in candidate: superseded migration bookkeeping. The legacy execution-plan source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform destinations are
[architecture/release-boundaries.md](architecture/release-boundaries.md),
[verification/compatibility-harness.md](verification/compatibility-harness.md),
[verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md),
[verification/r2-external-process-proof.md](verification/r2-external-process-proof.md),
and [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

After: docs/platform/host-invocation-routing/roadmap.md#3-decisions-required-before-r1-execution

Unit digest: cbf26e495828da2b590d1d6c244b2cf4cec5fe12f6694b754861a23bb3f8eb72

`````md
#### 3. Decisions Required Before R1 Execution
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-71

Unit digest: be01606a420077a6bfb299f329b27709f385d8519133042aab6ed08fda86257f

`````md
Added in candidate — checked status (2026-10-13): the preceding no-setup sentence is retained historical design wording. `setup` still exists as a legacy compatibility command (`src/cli/command-registry.mjs:1439-1441`, `bin/fgos.mjs:3774`); its compatibility window has not been retired. This note supersedes that sentence as a present-status assertion.
`````

After: docs/platform/host-invocation-routing/roadmap.md#6-p1-compatibility-harness

Unit digest: 8fe73175caed647b1eb18bd5241b3974b2614d3b132fb87c0a1a00ec7c2be8d1

`````md
#### 6. P1 — Compatibility Harness
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-80

Unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-81

Unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

After: docs/platform/host-invocation-routing/roadmap.md#coverage-floor

Unit digest: 75e0fe39c2aaa78adefd3e98cf324334eed056be09406e3f4a9dec5da39094bd

`````md
##### Coverage floor
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-84

Unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-85

Unit digest: ee740aab553abbb9f8cd9f97bd45c2162cdc6f5e96b2cf21ee0ce0dd57671c4d

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-016 restoration](contracts/component-protocol.md#restored-p1-compatibility-harness).
`````

After: docs/platform/host-invocation-routing/roadmap.md#14-p9-next-native-read

Unit digest: ac492f613b9b733b46f8f0e566ea4f839961ee30f3a1dafd97b61be903af14f7

`````md
#### 14. P9 — Next Native Read
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-121

Unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-122

Unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

After: docs/platform/host-invocation-routing/roadmap.md#16-commit-and-rollback-slices

Unit digest: 6c81ae046ab7de3a595689c9da4de2d4723ea86247de47d6c82f300c1844203e

`````md
#### 16. Commit And Rollback Slices
`````

After: docs/platform/host-invocation-routing/roadmap.md#unheaded-block-126

Unit digest: 7697f2bb2eeebad06f8636b3a84d475accd55340bf84646d87ba445162b4bc2c

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-017 restoration](verification/compatibility-harness.md#restored-test-and-review-gates-table).
`````

### docs/platform/host-invocation-routing/spec.md

Before file digest: 125796d5f3f506c75bbc89fe22dd348b0a13d40d89d2d44694ad62ecbcf37501

After file digest: e6f44522940b07c2e01ef9e3cec956c7845190c3c37ee8b52c8af936032bcbf0

Before: docs/platform/host-invocation-routing/spec.md#spec-host-invocation

Unit digest: 3760d3d15818dcb2dc10860a89c3e6fce032f9386c8a1b3104780751ab6c7e89

`````md
# Spec: Host Invocation
`````

Before: docs/platform/host-invocation-routing/spec.md#2-current-and-transition-status

Unit digest: 7d815c4939617db48f8e17568c8b541be74b5cb39e25d83578d0298e185d82ad

`````md
## 2. Current And Transition Status
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-3

Unit digest: a2b0cf841d5cbe0e13f237dfb2264c847aa88ed3fc06c465f05cd2e93c309f95

`````md
| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, and routes other selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 71 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `implemented preview` | R2 proves static manifest discovery, derived linker/registry, framed JSON-RPC-over-stdio component protocol, bounded supervision, fail-closed negative cases, and an end-to-end `fixture.echo.echo` invocation through `InvocationService`. | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Production remote peer | `implemented preview` | `GET /v1/runtime` calls shared `InvocationService` directly through the remote projector/presenter for `distribution.build.show`, without `VerbGateway`, CLI shelling, Node spawn, or `fgos.v1` parsing. Other gateway routes remain legacy. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
`````

Before: docs/platform/host-invocation-routing/spec.md#6-unknowns

Unit digest: 8e7a4c52fc51df8cdc5bb0ddc938e28a12cb3d15e1905a7c54819b115558832a

`````md
## 6. Unknowns
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-10

Unit digest: 90b906e635f31544a12da2c8bc3af670a7e62c3d3002ca31f88b40a1f92cbfc4

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

Before: docs/platform/host-invocation-routing/spec.md#migration-status-note

Unit digest: 276515af31eaa5688e1d0dfaf01137d3696cf7e650d6115adedc6569febe4d16

`````md
#### Migration Status Note
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-16

Unit digest: f66f31f2045455ac771ba83435fb913e5bb982be2896f56df06d86ea2d4ed69c

`````md
This document remains a legacy-current source during the 2026-09-14 promotion
pass. The promoted platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

Before: docs/platform/host-invocation-routing/spec.md#5-core-contracts

Unit digest: 08017696aed19cac2843f16c31a3c410dea789b9f33cbe4afffcaabc753f036b

`````md
#### 5. Core Contracts
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-37

Unit digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-002 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning`).
`````

Before: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input

Unit digest: d8ff15539e568ab91eed3265ae9839d8a1e7f75cf31908bc1d12d42135082527

`````md
#### 8. Failure, Cancellation, Lifecycle, And Human Input
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-54

Unit digest: 052e5ba9d1a46c809ec39b1208ad9e1c7c84b0db485c7cf7ea5b67e198574564

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-003 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te`).
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-56

Unit digest: 24e859393353390af0557057d680f3175b2852992363e6d9190bc37f1199cdf6

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-002 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/contracts/component-protocol.md#restored-contract-versioning`).
`````

Before: docs/platform/host-invocation-routing/spec.md#9-physical-placement

Unit digest: e0f3e1b3bb05aa2f28f6a3dcace160583488202b18c4c469a65bdac49ea4f6c6

`````md
#### 9. Physical Placement
`````

Before: docs/platform/host-invocation-routing/spec.md#unheaded-block-59

Unit digest: 4be6696c53f2d2bc639db2edbbe8faa1fa265565a3a5af5e794a1ad6de706991

`````md
Added in candidate: this retained source detail is carried verbatim in `the dropped-004 restoration` (historical reference unavailable: `docs/architect/host-invocation-routing/architecture/release-boundaries.md#restored-physical-placement-layout-tree`).
`````

After: docs/platform/host-invocation-routing/spec.md#spec-host-invocation

Unit digest: 7fddb34a1f9734f240a1282c6d321ea7d8bce2188ddb56931d8f63a0e5d6ec00

`````md
# Spec: Host Invocation
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/spec.md#2-current-and-transition-status

Unit digest: 19075be25da16f0222306e25473ca9fa731453c170128ae5002cb2586a77f78f

`````md
## 2. Current And Transition Status
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-4

Unit digest: 52806d831c8db7061ebf5c1dd984b44d4f62fd7e0c2de30242d9d10499c55b76

`````md
| Concern | Status | Spec statement | Alignment |
| --- | --- | --- | --- |
| Existing Node CLI payload | `legacy-current` | Existing commands still run through the Node payload. `bin/fgos.mjs` remains in the source tree and must not be renamed or moved while the legacy payload exists. | [verification/implementation-alignment.md](verification/implementation-alignment.md#2-alignment-table) |
| Legacy Node payload identity | `accepted-not-implemented` target over `legacy-current` file | R1 names the payload `legacy-node` in the release manifest and locates it through `components.legacyNode.root` and `components.legacyNode.entry`. | [contracts/legacy-payload.md](contracts/legacy-payload.md) |
| Rust host code path | `implemented preview` | `apps/fgos` exists as a Rust CLI host, embeds `command-routes.json`, routes `version` natively to `distribution.build.show`, routes `gate-bypass` natively to `work.gate-bypass.show`, also routes `convention`, `metrics` and `friction` natively, and routes the remaining 70 selectors through `legacy-cli`. Packaging-distribution preview proof shows external/default installed `fgos` enters the Rust host. | [verification/r1-rust-host-proof.md](verification/r1-rust-host-proof.md) |
| Native invocation kernel | `current partial` | `packages/host-runtime/rust` implements `OperationId`, `OperationRequest`, `ProviderOutcome`, `OperationProvider`, pure router, registry snapshot, authority gates, and `InvocationService` for the current Rust-host slice. | [architecture/invocation-kernel.md](architecture/invocation-kernel.md) |
| Transitional `legacy-cli` route | `current partial` | `command-routes.json` currently contains 70 `legacy-cli` selectors, and `apps/fgos/src/legacy_exec.rs` resolves the legacy Node payload from release/dev manifest fields before spawning Node. | [architecture/legacy-cli-transition.md](architecture/legacy-cli-transition.md) |
| External process providers | `implemented preview` | R2 proves static manifest discovery, derived linker/registry, framed JSON-RPC-over-stdio component protocol, bounded supervision, fail-closed negative cases, and an end-to-end `fixture.echo.echo` invocation through `InvocationService`. | [verification/r2-external-process-proof.md](verification/r2-external-process-proof.md) |
| Production remote peer | `implemented preview` | `GET /v1/runtime` calls shared `InvocationService` directly through the remote projector/presenter for `distribution.build.show`, without `VerbGateway`, CLI shelling, Node spawn, or `fgos.v1` parsing. Other gateway routes remain legacy. | [verification/r3-remote-peer-proof.md](verification/r3-remote-peer-proof.md) |
| Chat peer | `planned` | Chat is a valid future host, but no current adapter or contract is claimed. | [architecture/host-use-cases.md](architecture/host-use-cases.md) |
`````

After: docs/platform/host-invocation-routing/spec.md#6-unknowns

Unit digest: 3693814c15ab54d2cd830062e3d1b34afc3052082abb4b0b1301cd4a55e5eee0

`````md
## 6. Unknowns
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-11

Unit digest: 467ad3ca4c303a0828566f84764aaca4a32ec89b695dcb324a6f8daca798ed2e

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

After: docs/platform/host-invocation-routing/spec.md#historical-migration-status-note

Unit digest: cf64a5c903ae0225be855f3e70d01ef8e268e7de94d741063cb5afb351ca10c6

`````md
#### Historical Migration Status Note
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-17

Unit digest: b21d4164b9050dce3c9829ac2db0ee896f9808fa54b24cbd03672da08ba6ef4d

`````md
Added in candidate: superseded migration bookkeeping. The legacy source was
legacy-current during the 2026-09-14 promotion pass. That dated status applies
to the legacy input, not this candidate. The recorded platform entry is
[docs/platform/host-invocation-routing/README.md](README.md).
Its details are split across
[vision.md](vision.md),
[invocation-kernel.md](architecture/invocation-kernel.md),
[host-use-cases.md](architecture/host-use-cases.md),
[provider-routing.md](architecture/provider-routing.md),
and [contracts/](contracts/README.md).
See the [intent preservation ledger](intent-preservation-ledger.md)
for disposition by preserved claim.
`````

After: docs/platform/host-invocation-routing/spec.md#5-core-contracts

Unit digest: 9274b7dd1e623096538871b0934d940c5311b7dac7f87b98e8f3bbe9cbdf0e79

`````md
#### 5. Core Contracts
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-38

Unit digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).
`````

After: docs/platform/host-invocation-routing/spec.md#8-failure-cancellation-lifecycle-and-human-input

Unit digest: a3fd2fb5bbb38608bae7071b5f0571cbcccb756e34449544f509d1d40fc8fdc6

`````md
#### 8. Failure, Cancellation, Lifecycle, And Human Input
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-55

Unit digest: e9ceee2df5e4cb99e6e2418af4aaa15a968c8d9dc66884dea7c5841de4a8d62f

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-003 restoration](contracts/component-protocol.md#restored-lifecycle-state-chain-received-admitted-refused-selected-refused-granted-refused-dispatched-te).
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-57

Unit digest: 0d4cc71aa3946cb5af04f63560cd964f9828163fdd3153efce7e45358277792b

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-002 restoration](contracts/component-protocol.md#restored-contract-versioning).
`````

After: docs/platform/host-invocation-routing/spec.md#9-physical-placement

Unit digest: f7ec6eee77fd234f5385f260c3d7c567a2759526feb3098baf1619e0cd237621

`````md
#### 9. Physical Placement
`````

After: docs/platform/host-invocation-routing/spec.md#unheaded-block-60

Unit digest: e953c05405687a15a1bd3d4832b5cd375b9e109b41c65c911cd1b0d8416553b6

`````md
Added in candidate: this retained source detail is carried verbatim in [the dropped-004 restoration](architecture/release-boundaries.md#restored-physical-placement-layout-tree).
`````

### docs/platform/host-invocation-routing/verification/implementation-alignment.md

Before file digest: 703ce11c7dda4e6a56a65a0921e4abefad83814a1112223a2e9c1f13429872d7

After file digest: 59a4ee0383c26af63e9430b8440bd8c22a81a1de0dfc32efb7ba82dc8d9689e7

Before: docs/platform/host-invocation-routing/verification/implementation-alignment.md#verification-implementation-alignment

Unit digest: 6bd6ff2e302089e26edb140f1df81892a999b97232ada1d61e52722db6d74a0a

`````md
# Verification: Implementation Alignment
`````

Before: docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table

Unit digest: 193b7b9dd4a5bd45765ea6dec57db0bda108d7e5f51af87e4b3c379a209811b5

`````md
## 2. Alignment Table
`````

Before: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-3

Unit digest: c50cfdce5e0df606998194c04ed62e08895dadcecd12a21333a6593dcedeaaf1

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI payload remains current compatibility behavior. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs), [../../../../package.json](../../../../package.json) | Keep until Node removal gates pass. |
| `bin/fgos.mjs` is not relocated or renamed in source. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | No action in docs migration. |
| Host invocation docs moved under platform area. | `current` | [../README.md](../README.md) | Old docs carry legacy/status notes for this migration pass. |
| No component-boundary change. | `current` | [../../component-boundary.md](../../component-boundary.md) | This migration does not change ownership or authority. |
| CLI and remote peer host model. | `current partial` | [../../../../packages/host-runtime/rust/tests/two_projectors.rs](../../../../packages/host-runtime/rust/tests/two_projectors.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | CLI and remote both share `InvocationService` for selected operations. R3 proves `GET /v1/runtime`; all other gateway routes remain legacy `VerbGateway`, and chat remains future. |
| Chat peer host model. | `planned` | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) | No chat adapter found in code scan. |
| Native `OperationRequest`/`ProviderOutcome` kernel. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current Rust slice exists; future providers may extend it. |
| Pure Router plus `InvocationService` pipeline. | `current partial` | [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs) | Replacement resolution policy remains a documented R1 gap in registry/router code. |
| Two-stage authority. | `current partial` | [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | R2-P5 proved the external process provider goes through the SAME unmodified caller-admission/selected-provider-grant pipeline as any built-in provider -- an ad-hoc synthetic-admission bypass was caught in review and deleted before merge, not shipped. R3 proves the remote host path for `distribution.build.show`; chat host authority proof remains future work. |
| `legacy-cli` bypasses semantic kernel and execs Node payload directly. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview installed/default proof is closed; route migration remains partial because 71 selectors still use the manifest-owned legacy CLI lane. |
| `CommandRouteDescriptor` exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current snapshot has 73 selectors: 71 `legacy-cli`, two native. Keep drift tests current. |
| External process provider protocol. | `implemented preview` | [../contracts/component-protocol.md](../contracts/component-protocol.md), [../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs](../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs](../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P3/P4 conformance suite passed (frame round-trip/reject cases, bounded supervision, crash/timeout/cancellation mapping); closed 2026-09-15. Production WASM and non-preview hardening remain future work. |
| Static external manifest discovery without execution. | `implemented preview` | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs](../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs](../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P1/P2 fixture proof passed (fail-closed on malformed/missing/path-escaping/unsupported manifests; discovery proven not to execute provider code; duplicate/reserved/unknown-capability/incompatible-contract/built-in-replacement claims all refused); closed 2026-09-15. |
| Native `version` as `distribution.build.show`. | `implemented preview` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), `cargo test -p fgos-host-runtime -p fgos --quiet` | Targeted Rust tests passed on 2026-09-14; preview external-consumer proof passed on 2026-09-15. Stable/default graduation remains a release-owner decision. |
| Production remote peer route. | `implemented preview` | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --lib gateway --quiet` | R3-P2..P5 closed in this cell's commit. Proves native remote peer invocation for `distribution.build.show` (`GET /v1/runtime`) without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other gateway routes remain on `VerbGateway`. |
| R1 route matrix. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), `node --test test/rust-host/command-routes.test.mjs` | Code snapshot verified on 2026-09-14: 73 selectors, 71 legacy, two native. |
| Preview/stable and compatibility-window duration. | `preview settled; stable open; fallback window settled` | [../architecture/release-boundaries.md](../architecture/release-boundaries.md#2-open-release-decisions), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md) | Preview public posture is approved with Rust host as default installed runtime. Legacy Node fallback remains an explicit deprecated escape hatch for 30 calendar days after preview release publication. Stable/default graduation remains a product/release decision. |
| `gate-bypass` as next read proof. | `implemented local proof` | [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../../../../src/state/gate-bypass.mjs](../../../../src/state/gate-bypass.mjs), [../../../../src/setup/registrations.mjs](../../../../src/setup/registrations.mjs), [../../../../src/cli/command-registry.mjs](../../../../src/cli/command-registry.mjs), [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route) | No component-boundary change: read semantics belong to the existing work/state read core; setup/doctor readiness remains Packaging-Distribution. This proves only the read-only `work.gate-bypass.show` route, not full Work/State migration. |
`````

After: docs/platform/host-invocation-routing/verification/implementation-alignment.md#verification-implementation-alignment

Unit digest: 29757679d34b1f3ee0690d6fbcbf460d6fd28e913930798449cad30283052210

`````md
# Verification: Implementation Alignment
`````

After: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/verification/implementation-alignment.md#2-alignment-table

Unit digest: a1ac62ff1d7087ffe6f2e6a88becdaaf673c721fcc3344a52c61aa23e124add9

`````md
## 2. Alignment Table
`````

After: docs/platform/host-invocation-routing/verification/implementation-alignment.md#unheaded-block-4

Unit digest: fe03ebab91c4b902931e990e36c4299d39e1eab46422c09146f14b32fbdb3b23

`````md
| Design claim | Implementation status | Evidence | Gap / next action |
| --- | --- | --- | --- |
| Existing Node CLI payload remains current compatibility behavior. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs), [../../../../package.json](../../../../package.json) | Keep until Node removal gates pass. |
| `bin/fgos.mjs` is not relocated or renamed in source. | `legacy-current` | [../../../../bin/fgos.mjs](../../../../bin/fgos.mjs) | No action in docs migration. |
| Host invocation docs moved under platform area. | `current` | [../README.md](../README.md) | Old docs carry legacy/status notes for this migration pass. |
| No component-boundary change. | `current` | [../../component-boundary.md](../../component-boundary.md) | This migration does not change ownership or authority. |
| CLI and remote peer host model. | `current partial` | [../../../../packages/host-runtime/rust/tests/two_projectors.rs](../../../../packages/host-runtime/rust/tests/two_projectors.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | CLI and remote both share `InvocationService` for selected operations. R3 proves `GET /v1/runtime`; all other gateway routes remain legacy `VerbGateway`, and chat remains future. |
| Chat peer host model. | `planned` | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) | No chat adapter found in code scan. |
| Native `OperationRequest`/`ProviderOutcome` kernel. | `current partial` | [../../../../packages/host-runtime/rust/src/contracts.rs](../../../../packages/host-runtime/rust/src/contracts.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current Rust slice exists; future providers may extend it. |
| Pure Router plus `InvocationService` pipeline. | `current partial` | [../../../../packages/host-runtime/rust/src/operation_provider_router.rs](../../../../packages/host-runtime/rust/src/operation_provider_router.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [../../../../packages/host-runtime/rust/tests/module_graph.rs](../../../../packages/host-runtime/rust/tests/module_graph.rs) | Replacement resolution policy remains a documented R1 gap in registry/router code. |
| Two-stage authority. | `current partial` | [../../../../packages/host-runtime/rust/src/authority_gate.rs](../../../../packages/host-runtime/rust/src/authority_gate.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs), [r2-external-process-proof.md](r2-external-process-proof.md), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | R2-P5 proved the external process provider goes through the SAME unmodified caller-admission/selected-provider-grant pipeline as any built-in provider -- an ad-hoc synthetic-admission bypass was caught in review and deleted before merge, not shipped. R3 proves the remote host path for `distribution.build.show`; chat host authority proof remains future work. |
| `legacy-cli` bypasses semantic kernel and execs Node payload directly. | `implemented preview` | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../apps/fgos/src/legacy_exec.rs](../../../../apps/fgos/src/legacy_exec.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md) | Preview installed/default proof is closed; route migration remains partial because 70 selectors still use the manifest-owned legacy CLI lane. |
| `CommandRouteDescriptor` exists for every selector. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs) | Current snapshot has 75 selectors: 70 `legacy-cli`, five native. Keep drift tests current. |
| External process provider protocol. | `implemented preview` | [../contracts/component-protocol.md](../contracts/component-protocol.md), [../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs](../../../../packages/host-runtime/rust/src/providers/external_process/frame_codec.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs](../../../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P3/P4 conformance suite passed (frame round-trip/reject cases, bounded supervision, crash/timeout/cancellation mapping); closed 2026-09-15. Production WASM and non-preview hardening remain future work. |
| Static external manifest discovery without execution. | `implemented preview` | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md), [../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs](../../../../packages/host-runtime/rust/src/providers/external_process/manifest.rs), [../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs](../../../../packages/host-runtime/rust/src/providers/external_process/registry.rs), [r2-external-process-proof.md](r2-external-process-proof.md) | R2-P1/P2 fixture proof passed (fail-closed on malformed/missing/path-escaping/unsupported manifests; discovery proven not to execute provider code; duplicate/reserved/unknown-capability/incompatible-contract/built-in-replacement claims all refused); closed 2026-09-15. |
| Native `version` as `distribution.build.show`. | `implemented preview` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../apps/fgos/tests/cli_tests.rs](../../../../apps/fgos/tests/cli_tests.rs), [../../packaging-distribution/verification/install-and-release-proof.md](../../packaging-distribution/verification/install-and-release-proof.md), `cargo test -p fgos-host-runtime -p fgos --quiet` | Targeted Rust tests passed on 2026-09-14; preview external-consumer proof passed on 2026-09-15. Stable/default graduation remains a release-owner decision. |
| Production remote peer route. | `implemented preview` | [r3-remote-peer-proof.md](r3-remote-peer-proof.md), [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), `cargo test --manifest-path apps/fgos-gateway/Cargo.toml --lib gateway --quiet` | R3-P2..P5 closed in this cell's commit. Proves native remote peer invocation for `distribution.build.show` (`GET /v1/runtime`) without `VerbGateway`, CLI shelling, or `fgos.v1` envelope parsing. All other gateway routes remain on `VerbGateway`. |
| R1 route matrix. | `current partial` | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json), `node --test test/rust-host/command-routes.test.mjs` | Historical code snapshot verified on 2026-09-14: 73 selectors, 71 legacy, two native. Added in candidate: current 2026-10-13 recount is 75 selectors, 70 legacy-cli and five native (convention, friction, gate-bypass, metrics, version), from command-routes.json. |
| Preview/stable and compatibility-window duration. | `preview settled; stable open; fallback window settled` | [../architecture/release-boundaries.md](../architecture/release-boundaries.md#2-open-release-decisions), [../../packaging-distribution/reports/track-closeout.md](../../packaging-distribution/reports/track-closeout.md) | Preview public posture is approved with Rust host as default installed runtime. Legacy Node fallback remains an explicit deprecated escape hatch for 30 calendar days after preview release publication. Stable/default graduation remains a product/release decision. |
| `gate-bypass` as next read proof. | `implemented local proof` | [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs), [../../../../src/state/gate-bypass.mjs](../../../../src/state/gate-bypass.mjs), [../../../../src/setup/registrations.mjs](../../../../src/setup/registrations.mjs), [../../../../src/cli/command-registry.mjs](../../../../src/cli/command-registry.mjs), [../roadmap.md](../roadmap.md#7-phase-d-add-the-next-native-read-route) | No component-boundary change: read semantics belong to the existing work/state read core; setup/doctor readiness remains Packaging-Distribution. This proves only the read-only `work.gate-bypass.show` route, not full Work/State migration. |
`````

### docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md

Before file digest: 01431f16c3ee38955198b695a63156b16123e67fad6fcc02e80fe001e41208c1

After file digest: 54d417e7609743de75f2bf92789f4b290724294c6796b0ca2469e4623e516c7f

Before: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#verification-r1-rust-host-proof

Unit digest: 2e769f1935b3b877392be7d31e64c5b46ded8fe9f163d641c7daff8e38af436f

`````md
# Verification: R1 Rust Host Proof
`````

Before: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#2-code-verified-snapshot

Unit digest: 5b2361ab3d65a0b8bbeef99d23e2896fc642d15ea40e8a4022331c9c47f9e405

`````md
## 2. Code-Verified Snapshot
`````

Before: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-3

Unit digest: 68d165e5eb51e600326a33c1c6bdcd5823418d7240605c7802d4064fddb2965e

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

After: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#verification-r1-rust-host-proof

Unit digest: 7a770f5b44a90a169866d1eb57dde6bd2b8cf5e56030f9952c589a51f0900bb6

`````md
# Verification: R1 Rust Host Proof
`````

After: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#2-code-verified-snapshot

Unit digest: 6a4e39e926e9a483469d9928aee6a8b00a49e979263f22bca62901fb8229cae7

`````md
## 2. Code-Verified Snapshot
`````

After: docs/platform/host-invocation-routing/verification/r1-rust-host-proof.md#unheaded-block-4

Unit digest: 7e25265bed79ca04ec8c529cae7496c2058099935c179c4a050f5519401c198b

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

### docs/platform/host-invocation-routing/verification/r2-external-process-proof.md

Before file digest: 4362569960531e3b31667f711c11ae2238d08246fc907bc6bb20188a4f78ed73

After file digest: cf866186d80f2b9c8bbb5b35a83cf14d70bde9bdda8c8627a03d0e6fb199fe1f

Before: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#verification-r2-external-process-proof

Unit digest: d9f1ae97538131f88968f7bbf440ae714976632cf4f76adfb67957c812ef4b5e

`````md
# Verification: R2 External Process Proof
`````

Before: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#7-non-gates

Unit digest: ebdbc76a7ff1664faf12cbb7153fa7699e986f3d3e350bb1cfd3dddf4968cb5c

`````md
## 7. Non-Gates
`````

Before: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-13

Unit digest: 0b12afe86af5ff208d0a5923d0e7a3a7dd421b77b994647bdaa910722f9fd896

`````md
Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2. These remain future work for R3 or later, per the `R2 execution record` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`)'s own non-goals.
`````

Before: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#8-related-files

Unit digest: a7435184359480e70878d3ce071a77d9f1afb8b1b84b5de23512869599ef1afd

`````md
## 8. Related Files
`````

Before: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-14

Unit digest: 3f9f3119c9f3b99a6c2a45fe20e3374eabbb55b08dde883caa9c0840ea6a294b

`````md
| Relationship | File |
| --- | --- |
| execution record | `../../../../plans/260915-host-invocation-r2-external-process/plan.md` (historical plan unavailable in this checkout: `plans/260915-host-invocation-r2-external-process/plan.md`) |
| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| implementation alignment | [implementation-alignment.md](implementation-alignment.md) |
| R1 proof | [r1-rust-host-proof.md](r1-rust-host-proof.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#verification-r2-external-process-proof

Unit digest: 51d2630ea36f4eb43018580d2d5682a002ad9341f567ed4320e08cff38f08ac8

`````md
# Verification: R2 External Process Proof
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#7-non-gates

Unit digest: a04b446ed4bdf4db80b60b4e9b800fb514af3107df58e6653b3a51ae8b40b957

`````md
## 7. Non-Gates
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-14

Unit digest: 33b235b3de6e4cc1c1379e2d5389af923d5d29fe04cd312f704fb7cd0ed797d0

`````md
Marketplace, publisher trust, signature system, production WASM, and core-provider replacement do not gate R2. These remain future work for R3 or later, per the [R2 execution record](../../../../archive/plans/260915-host-invocation-r2-external-process/plan.md)'s own non-goals.
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#8-related-files

Unit digest: e8eaaa4fdef4d49731d1087ae76b6a6992bad353947e30915d0b63ee7799320d

`````md
## 8. Related Files
`````

After: docs/platform/host-invocation-routing/verification/r2-external-process-proof.md#unheaded-block-15

Unit digest: 1ebc5ca17a42cc28d47ba1ca9bebe4c027487a21c4e054e72b537d7c4a33f9db

`````md
| Relationship | File |
| --- | --- |
| execution record | [../../../../plans/260915-host-invocation-r2-external-process/plan.md](../../../../archive/plans/260915-host-invocation-r2-external-process/plan.md) |
| component protocol | [../contracts/component-protocol.md](../contracts/component-protocol.md) |
| provider manifest | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |
| implementation alignment | [implementation-alignment.md](implementation-alignment.md) |
| R1 proof | [r1-rust-host-proof.md](r1-rust-host-proof.md) |
| source plan | [../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md](../../../architect/host-invocation-routing/rust-cli-and-proof-components-plan.md) |
`````

### docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md

Before file digest: 34b327892c598bc592f762b30a481e067bb7bcf56b52348806df4b76a9225eb7

After file digest: a082d00c31d0301643ffd1ae3880e058cbcdd99fa169ef8525309faa7f5d6d3f

Before: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#11-selected-route-r3-p0-2026-09-17

Unit digest: 951723946c093a37adaccbf9e07c0fa945e96723d62dbe009d1fe9eeeac9a6ea

`````md
### 1.1 Selected Route (R3-P0, 2026-09-17)
`````

Before: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#unheaded-block-3

Unit digest: 69cf9c077238d78c40bd201688cea9127e1a40aeff7004ebffd6999e620b1ecd

`````md
- **Route:** `GET /v1/runtime`
- **Operation id:** `distribution.build.show`
- **Status:** Implemented preview (R3-P2 route wired, R3-P3 proof verified).
- **Full frozen fields** (auth, request projection, response shape, error
  mapping, deadline/disconnect, rationale): `R3 execution record §6 R3-P0` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`).
`````

Before: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#4-related-files

Unit digest: 05821c7d3084fda7dc219bbc30b0eec37e02c565150c6427980371ea7d16332b

`````md
## 4. Related Files
`````

Before: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#unheaded-block-16

Unit digest: 29ec63ebdd098ec0da0ea585c61c3660d4107da6f1461e70f8f927f3600a4e70

`````md
| Relationship | File |
| --- | --- |
| execution record | `../../../../plans/260918-host-invocation-r3-remote-peer/plan.md` (historical plan unavailable in this checkout: `plans/260918-host-invocation-r3-remote-peer/plan.md`) |
| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |
`````

After: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#11-selected-route-r3-p0-2026-09-17

Unit digest: 6a605f1d976b8126c2e42614b85e4c68ef4abad5004de1a958ea8f529fb3874f

`````md
### 1.1 Selected Route (R3-P0, 2026-09-17)
`````

After: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#unheaded-block-3

Unit digest: d4ea7ac742edee19c1aef17034b2f374606661d08ab0aec78745297b1fc4aa56

`````md
- **Route:** `GET /v1/runtime`
- **Operation id:** `distribution.build.show`
- **Status:** Implemented preview (R3-P2 route wired, R3-P3 proof verified).
- **Full frozen fields** (auth, request projection, response shape, error
  mapping, deadline/disconnect, rationale): [R3 execution record §6 R3-P0](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md).
`````

After: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#4-related-files

Unit digest: b8ab04f08f0edb17c75777e0f1c7f7c9d50d4f40ee9e15550c258bde7209e7cb

`````md
## 4. Related Files
`````

After: docs/platform/host-invocation-routing/verification/r3-remote-peer-proof.md#unheaded-block-16

Unit digest: 318d52d941f1c5655b46f5389a17d612f8de7ea6c356e38fd309aaeadbadf91d

`````md
| Relationship | File |
| --- | --- |
| execution record | [../../../../plans/260918-host-invocation-r3-remote-peer/plan.md](../../../../archive/plans/260918-host-invocation-r3-remote-peer/plan.md) |
| host use cases | [../architecture/host-use-cases.md](../architecture/host-use-cases.md) |
| release boundaries | [../architecture/release-boundaries.md](../architecture/release-boundaries.md) |
| source migration | [../../../architect/host-invocation-routing/node-to-rust-component-migration.md](../../../architect/host-invocation-routing/node-to-rust-component-migration.md) |
`````

### docs/platform/host-invocation-routing/verification/source-preservation-audit.md

Before file digest: 64805395dc7d584f1e2ab7b947073de01c780bb5bac3c6752e23840ffd31066b

After file digest: ec5ea53ac9fe5e1e66f3a45265788d0b6c3bbec61e381f163a92989a51523599

Before: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#host-invocation-source-preservation-audit

Unit digest: 27f436b3aace253b35857ca76f160eb143a1c72a95d8239707d5643a0b8f6bd5

`````md
# Host Invocation Source Preservation Audit
`````

Before: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#5-remaining-unknowns

Unit digest: f13084ba49ad187e570bf17804799b780c435fb786619a5d476d8d6e016bf02f

`````md
## 5. Remaining Unknowns
`````

Before: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-10

Unit digest: 97cb46cc36823b6a451dec3d19653c42c3cb96d3962dd7dda2c659176f497619

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

Before: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#6-code-scan-evidence

Unit digest: 585008c0593f9aabdbc19dd374ee15a536f2481e590836728b2f02d7ecf876f2

`````md
## 6. Code Scan Evidence
`````

Before: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-11

Unit digest: 8182aa6148417b07ac97e4a320636fe847dd2ec80c05857d4d6ca2c7d4b89f90

`````md
| Check | Evidence | Result |
| --- | --- | --- |
| Route matrix count | [../../../../packages/host-runtime/contracts/command-routes.json](../../../../packages/host-runtime/contracts/command-routes.json) | 73 selectors: 71 `legacy-cli`, two native. |
| Native production operations | [../../../../apps/fgos/src/cli_projector.rs](../../../../apps/fgos/src/cli_projector.rs), [../../../../packages/distribution/rust/src/lib.rs](../../../../packages/distribution/rust/src/lib.rs), [../../../../packages/work-state/rust/src/lib.rs](../../../../packages/work-state/rust/src/lib.rs) | `version` projects to `distribution.build.show`; `gate-bypass` projects to `work.gate-bypass.show`. |
| Rust host/runtime proof | [../../../../apps/fgos/src/main.rs](../../../../apps/fgos/src/main.rs), [../../../../packages/host-runtime/rust/src/invocation_service.rs](../../../../packages/host-runtime/rust/src/invocation_service.rs) | Current partial code path exists. |
| External provider implementation | [../../../../packages/host-runtime/rust/src/providers/external_process/](../../../../packages/host-runtime/rust/src/providers/external_process/), [r2-external-process-proof.md](r2-external-process-proof.md) | R2 preview path implemented with fixture proof; production ecosystem hardening remains future. |
| Remote peer implementation | [../../../../apps/fgos-gateway/src/remote_invocation.rs](../../../../apps/fgos-gateway/src/remote_invocation.rs), [../../../../apps/fgos-gateway/src/gateway.rs](../../../../apps/fgos-gateway/src/gateway.rs), [r3-remote-peer-proof.md](r3-remote-peer-proof.md) | `GET /v1/runtime` implemented preview; all other gateway routes remain legacy. |
| Chat adapter implementation | `rg` over `src`, `bin`, `packages`, `apps`, `herdr-dashboard` | No current chat host adapter found. |
| Targeted tests | `cargo test -p fgos-host-runtime -p fgos --quiet` | Passed on 2026-09-14. |
`````

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#host-invocation-source-preservation-audit

Unit digest: 5a57ffb0589a7432bfd866a45ae2f216491c701410ebb85d8d40194b15e3a41d

`````md
# Host Invocation Source Preservation Audit
`````

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-2

Unit digest: a67cb287df52cef6a00ea94d6d4861f53882d2ce2941478491f1309c8fbdf051

`````md
Added in candidate — checked route snapshot (2026-10-13): `packages/host-runtime/contracts/command-routes.json` has 75 selectors: 70 `legacy-cli` and five native (`convention`, `friction`, `gate-bypass`, `metrics`, `version`). This recount supersedes current-count wording; dated proof records remain historical.
`````

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#5-remaining-unknowns

Unit digest: e6061d3782a5389fe4dc8d3303747751a129c10fd280fdf670851735081763c6

`````md
## 5. Remaining Unknowns
`````

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-11

Unit digest: b8c6c828860673a1d0ca70d074eb36712557197d058308786b62ac19568a02d9

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

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#6-code-scan-evidence

Unit digest: a19b5b00eaf5d563d81cccc0043374f58c5933f2b5990a1d14e53295b547737f

`````md
## 6. Code Scan Evidence
`````

After: docs/platform/host-invocation-routing/verification/source-preservation-audit.md#unheaded-block-12

Unit digest: c5472bc42b8d6e56775d17e7d61cd7684d82b185d7e4f9ba141f83ecb15d4a29

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
