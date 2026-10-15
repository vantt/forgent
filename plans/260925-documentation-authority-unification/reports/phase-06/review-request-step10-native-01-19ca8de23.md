# Native identity transitions and candidate accounting — part 1

Author session: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Packaged by: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Content pin / SYNC: `19ca8de23908e161c34c91626e41041b7813167c`
Comparison base: `ab4d6274a9ae78c2613897432df726bfab32be52`
Entries: **120**, maximum 120 per request part.

[Single request index](review-request-step10-index-19ca8de23.md). This is one bounded re-review set of changes since `ab4d6274a`, replacing prior submission for changed entries only; unchanged matching ok verdicts remain accepted. This author header identifies this part's submitted author; per-row `authoredBy` and immutable historical author fields remain exact. No producer seed, draw, sample or verdict is selected.

Read [A36 mechanical/deep lists](step10-sync19-A36.json). Every submitted claim requires one ordinary verdict with exact shown source and target digests and a `deep` or `mechanical` note. Recompute full digests and anchors and compare current shard/pack equality for every row. Deep-review every unequal source/target row, every submitted partial carry, all seven labelled truth corrections, all historical AGENTS rows and other explicitly marked reworks. The reviewer selects and records a seed for at least 63/415 Weak-exact/Judgment rows (15%, minimum 10, all if fewer); >3% deep rework escalates to whole-pack deep review. A36 changes neither truth sampling nor checkpoint review. Non-claim entries receive item-specific accounting/content verdicts, not claim approvals. Existing independently ok unchanged full-file content is context only.

## Entry claim_ccf1acf857fc4e9757a933ca22ed34f1

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "23f1a1a44bcbd0668f8f545b5508024b57db8171e828816c1c9d064c5e94dfd4",
    "identityFingerprint": "763eccb4a0f5b2da851cbe6313f021081dc116b68cae242a3cd2d0280c718ac6",
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "0951d8b2cc464fa07dc2db5e313c9aa31a4bd64acf9000bbd1f00e85ca17c4e5",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "de4eef33278cc9823a919f747dd2683dddd8279ead610386ed645aec20edf3c0",
    "identityFingerprint": "dc8c693cdf604e1f32de09ae44a7a11ae1b79a14bc89794dbf3bb6cb4b937094",
    "claimId": "claim_ccf1acf857fc4e9757a933ca22ed34f1",
    "sourceAnchor": "legacy-node-cli-ownership-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "claimKind": "contract",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "23f1a1a44bcbd0668f8f545b5508024b57db8171e828816c1c9d064c5e94dfd4",
      "toUnitDigest": "de4eef33278cc9823a919f747dd2683dddd8279ead610386ed645aec20edf3c0",
      "fromSourceUnitDigest": "0951d8b2cc464fa07dc2db5e313c9aa31a4bd64acf9000bbd1f00e85ca17c4e5",
      "toSourceUnitDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Legacy-Node CLI Ownership Boundary",
    "anchor": "legacy-node-cli-ownership-boundary",
    "githubAnchor": "legacy-node-cli-ownership-boundary",
    "stableAnchor": "h-389367d240cb",
    "startLine": 83,
    "endLine": 83,
    "textDigest": "0951d8b2cc464fa07dc2db5e313c9aa31a4bd64acf9000bbd1f00e85ca17c4e5",
    "sample": "Legacy-Node CLI Ownership Boundary",
    "sectionPayloadDigest": "d3ea0a363dc71ec956f780a1d6dd66b57d916bbad7bd7d89f0dfcebf35856428",
    "followingBlockDigest": "9babb9141d90b2e3a99f353c735db9e64679ea4be0bc12cf27432d1cd728df8f",
    "identityFingerprint": "763eccb4a0f5b2da851cbe6313f021081dc116b68cae242a3cd2d0280c718ac6",
    "ancestry": [
      "forgent"
    ],
    "text": "## Legacy-Node CLI Ownership Boundary",
    "sectionText": "## Legacy-Node CLI Ownership Boundary\n\nRust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Rust host at\n`components.legacyNode.entry` — never relocated or renamed in the source tree.\nThe host resolves it only through those manifest fields, never PATH, cwd or\nhardcoded locations outside the manifest. Global npm `bin.fgos` and fallback\n`node bin/fgos.mjs` are compatibility channels calling this entry directly.\n\nPlain `fgos` runs the activated release recorded in\n`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.\nUse `npm run fgos:dev -- <verb> [args]` to run working-tree code through the Rust\nhost. It preserves caller cwd via `INIT_CWD`, honors `CARGO_TARGET_DIR`, and\nmaterializes confined per-invocation artifacts under `.fgos/runtime/dev-host/`,\nremoving only its own directory after the child exits. Serialize invocations\nacross worktrees only where their Cargo target is actually shared.\n\n`fgos doctor` check `active-release-matches-checkout` compares the owned source\ncheckout's working-tree Node payload with its activation; it does not certify\nRust freshness. Dependencies do not count as drift, but symlink/unsafe manifest\nentries still fail. It skips activation owned by main from a linked worktree\nand the same-checkout dev manifest. To update plain `fgos`, build/stage/activate\nthe intended tree, then verify doctor through the installed shim. Old-release\n`fgos setup` can overwrite generated render headers until that release is\nrestaged; activation never refreshes itself merely because source was edited."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Legacy-Node CLI Ownership Boundary",
    "anchor": "legacy-node-cli-ownership-boundary",
    "githubAnchor": "legacy-node-cli-ownership-boundary",
    "stableAnchor": "h-389367d240cb",
    "startLine": 83,
    "endLine": 83,
    "textDigest": "fed79e2e75d57ab326d97e74e6b2cd4b8fd1474aa6df3abb284ae2bb6d46f817",
    "sample": "Legacy-Node CLI Ownership Boundary",
    "sectionPayloadDigest": "b3ae552c425d296332c9d276e530cfaa9cb01fe59f99a01827a68d880c790d33",
    "followingBlockDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "identityFingerprint": "dc8c693cdf604e1f32de09ae44a7a11ae1b79a14bc89794dbf3bb6cb4b937094",
    "ancestry": [
      "forgent"
    ],
    "text": "## Legacy-Node CLI Ownership Boundary",
    "sectionText": "## Legacy-Node CLI Ownership Boundary\n\nRust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Rust host at\n`components.legacyNode.entry` — never relocated or renamed in the source tree.\nThe host resolves it only through those manifest fields, never PATH, cwd or\nhardcoded locations outside the manifest. Global npm `bin.fgos` and fallback\n`node bin/fgos.mjs` are compatibility channels calling this entry directly;\nevery state write resolves the writer identity through the Rust host\n(`docs/platform/session-identity/spec.md`), so these channels write only\ninside an activated project or with `FGOS_HOST_BIN` set to a host binary.\n\nPlain `fgos` runs the activated release recorded in\n`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.\nUse `npm run fgos:dev -- <verb> [args]` to run working-tree code through the Rust\nhost. It preserves caller cwd via `INIT_CWD`, honors `CARGO_TARGET_DIR`, and\nmaterializes confined per-invocation artifacts under `.fgos/runtime/dev-host/`,\nremoving only its own directory after the child exits. Serialize invocations\nacross worktrees only where their Cargo target is actually shared.\n\n`fgos doctor` check `active-release-matches-checkout` compares the owned source\ncheckout's working-tree Node payload with its activation; it does not certify\nRust freshness. Dependencies do not count as drift, but symlink/unsafe manifest\nentries still fail. It skips activation owned by main from a linked worktree\nand the same-checkout dev manifest. To update plain `fgos`, build/stage/activate\nthe intended tree, then verify doctor through the installed shim. Old-release\n`fgos setup` can overwrite generated render headers until that release is\nrestaged; activation never refreshes itself merely because source was edited."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_ccf1acf857fc4e9757a933ca22ed34f1"
}
```

## Entry claim_c328f1aab4c53a87e5564dab101facf2

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "AGENTS.md",
    "unitDigest": "1046d4d70e2c62fd9f723e4cdcc255bad22131e060d812d9476d0969b80a244f",
    "identityFingerprint": "1046d4d70e2c62fd9f723e4cdcc255bad22131e060d812d9476d0969b80a244f",
    "claimId": "claim_c328f1aab4c53a87e5564dab101facf2",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "claimKind": "unclassified",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 85,
    "endLine": 94,
    "textDigest": "e3c0146e4d7a42d364c551fcb327b9ab9faef893cfe3b6075a4e658836d69972",
    "sample": "Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Ru",
    "identityFingerprint": "1046d4d70e2c62fd9f723e4cdcc255bad22131e060d812d9476d0969b80a244f",
    "ancestry": [
      "forgent",
      "Legacy-Node CLI Ownership Boundary"
    ],
    "text": "Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the\n`legacy-node` payload entry, staged whole under a release's\n`components.legacyNode.root` and exec'd by the Rust host at\n`components.legacyNode.entry` — never relocated or renamed in the source tree.\nThe host resolves it only through those manifest fields, never PATH, cwd or\nhardcoded locations outside the manifest. Global npm `bin.fgos` and fallback\n`node bin/fgos.mjs` are compatibility channels calling this entry directly;\nevery state write resolves the writer identity through the Rust host\n(`docs/platform/session-identity/spec.md`), so these channels write only\ninside an activated project or with `FGOS_HOST_BIN` set to a host binary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c328f1aab4c53a87e5564dab101facf2"
}
```

## Entry claim_03ef50e87178220032a3eebe5c5d89d9

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/architecture-manifest.json",
    "unitDigest": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "claimId": "claim_03ef50e87178220032a3eebe5c5d89d9",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 269,
    "textDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/host-bin-path.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_03ef50e87178220032a3eebe5c5d89d9"
}
```

## Entry claim_569973698a19ffcda609e4c300bb65c7

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_569973698a19ffcda609e4c300bb65c7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/explanation/orphaned-runtime-claim-recovery-unclaim-verb.md",
    "unitDigest": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "identityFingerprint": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "claimId": "claim_569973698a19ffcda609e4c300bb65c7",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f640ce00f8db26152a69ebb1f0d5896db890f6033676dc1b7c8a9e760a9c267b",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/explanation/orphaned-runtime-claim-recovery-unclaim-verb.md",
    "unitDigest": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "identityFingerprint": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "claimId": "claim_569973698a19ffcda609e4c300bb65c7",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f640ce00f8db26152a69ebb1f0d5896db890f6033676dc1b7c8a9e760a9c267b",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 44,
    "endLine": 66,
    "textDigest": "f640ce00f8db26152a69ebb1f0d5896db890f6033676dc1b7c8a9e760a9c267b",
    "sample": "- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `statu",
    "identityFingerprint": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "ancestry": [
      "When a claim outlives the work it was claiming",
      "What shipped"
    ],
    "text": "- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `status` for that id. **If durable status is anything other than\n  `doing`** (including \"not found\" post-truncation) — the claim can no\n  longer be justified by durable state, so it releases immediately:\n  `{released: true, reason: 'durable-status-mismatch', durableStatus}`.\n  This is the exact case `tsk-uio` hit.\n- Only when durable status genuinely is `doing` does it fall back to the\n  existing liveness check (`isReclaimEligible`) — refusing with a\n  `ClaimError('conflict', ...)` naming the holder and claim age if the\n  claim is still genuinely live, or releasing with `{released: true,\n  reason: 'stale-liveness'}` if not.\n- Both releases go through `releaseClaim`'s named `adminReason` option,\n  because the claim usually belongs to another (dead) session and a plain\n  release is refused for any writer but the claim's own. When the operator\n  is a different writer, the result adds `admin: {reason, ownerWriterId,\n  releasedByWriterId}`, and the release is also appended to the event log\n  as a `decision` (`source: unclaim`, `kind: engine`) whose `admin` field\n  carries the same three values plus `claimId` (and `itemId` when the item\n  is unknown, since such a decision cannot carry an `id`). The stale-claim\n  reclaim in `pick` adds the same `admin` field to the decision it already\n  writes."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 44,
    "endLine": 66,
    "textDigest": "f640ce00f8db26152a69ebb1f0d5896db890f6033676dc1b7c8a9e760a9c267b",
    "sample": "- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `statu",
    "identityFingerprint": "35605a186f8ce26a1057ad2a47bb22db70589f3f8b45fab31be6849344fe20b2",
    "ancestry": [
      "When a claim outlives the work it was claiming",
      "What shipped"
    ],
    "text": "- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `status` for that id. **If durable status is anything other than\n  `doing`** (including \"not found\" post-truncation) — the claim can no\n  longer be justified by durable state, so it releases immediately:\n  `{released: true, reason: 'durable-status-mismatch', durableStatus}`.\n  This is the exact case `tsk-uio` hit.\n- Only when durable status genuinely is `doing` does it fall back to the\n  existing liveness check (`isReclaimEligible`) — refusing with a\n  `ClaimError('conflict', ...)` naming the holder and claim age if the\n  claim is still genuinely live, or releasing with `{released: true,\n  reason: 'stale-liveness'}` if not.\n- Both releases go through `releaseClaim`'s named `adminReason` option,\n  because the claim usually belongs to another (dead) session and a plain\n  release is refused for any writer but the claim's own. When the operator\n  is a different writer, the result adds `admin: {reason, ownerWriterId,\n  releasedByWriterId}`, and the release is also appended to the event log\n  as a `decision` (`source: unclaim`, `kind: engine`) whose `admin` field\n  carries the same three values plus `claimId` (and `itemId` when the item\n  is unknown, since such a decision cannot carry an `id`). The stale-claim\n  reclaim in `pick` adds the same `admin` field to the decision it already\n  writes."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_569973698a19ffcda609e4c300bb65c7"
}
```

## Entry claim_55b5d50f2b7963398dbeddf574b0399c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_55b5d50f2b7963398dbeddf574b0399c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/explanation/orphaned-runtime-claim-recovery-unclaim-verb.md",
    "unitDigest": "9aa00cf8dc6c3450d8baf5836cb3041cd36fc814c1d04bb7bbed8f8e444e1391",
    "identityFingerprint": "81cc1854b1d9def201cff67e5abdef25885c0267b0f4842e58213ffd88b99519",
    "claimId": "claim_55b5d50f2b7963398dbeddf574b0399c",
    "sourceAnchor": "what-shipped",
    "unitKind": "heading",
    "sourceUnitDigest": "a8209d1cd28db207337cc023b6e79efb157abd68dba02c5b29efed52f9c60a02",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "81f1e6cd8f9da3ee009fbffcd0b215bf971bb0f55c5727f8f7c5af99cb448269",
      "toUnitDigest": "9aa00cf8dc6c3450d8baf5836cb3041cd36fc814c1d04bb7bbed8f8e444e1391",
      "fromSourceUnitDigest": "90b9214b654ca476dce332f3efa40d13bf5d8bef635d3cc522b343b83eabf81a",
      "toSourceUnitDigest": "a8209d1cd28db207337cc023b6e79efb157abd68dba02c5b29efed52f9c60a02"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/explanation/orphaned-runtime-claim-recovery-unclaim-verb.md",
    "unitDigest": "9aa00cf8dc6c3450d8baf5836cb3041cd36fc814c1d04bb7bbed8f8e444e1391",
    "identityFingerprint": "81cc1854b1d9def201cff67e5abdef25885c0267b0f4842e58213ffd88b99519",
    "claimId": "claim_55b5d50f2b7963398dbeddf574b0399c",
    "sourceAnchor": "what-shipped",
    "unitKind": "heading",
    "sourceUnitDigest": "a8209d1cd28db207337cc023b6e79efb157abd68dba02c5b29efed52f9c60a02",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "What shipped",
    "anchor": "what-shipped",
    "githubAnchor": "what-shipped",
    "stableAnchor": "h-65423e7e3f99",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "a8209d1cd28db207337cc023b6e79efb157abd68dba02c5b29efed52f9c60a02",
    "sample": "What shipped",
    "sectionPayloadDigest": "7001e5fc818ff7f679d2661aa5f4d9d45af1cea409b0fd9662d73bd61825ad24",
    "followingBlockDigest": "fefd3ebc3509d17f343a581348eee9aab5e00eedd92d1f720d1b7a991589537f",
    "identityFingerprint": "81cc1854b1d9def201cff67e5abdef25885c0267b0f4842e58213ffd88b99519",
    "ancestry": [
      "When a claim outlives the work it was claiming"
    ],
    "text": "## What shipped",
    "sectionText": "## What shipped\n\nA new `fgos unclaim <id>` CLI verb (`bin/fgos.mjs`), reusing three\nalready-tested primitives rather than adding new mechanism:\n\n- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `status` for that id. **If durable status is anything other than\n  `doing`** (including \"not found\" post-truncation) — the claim can no\n  longer be justified by durable state, so it releases immediately:\n  `{released: true, reason: 'durable-status-mismatch', durableStatus}`.\n  This is the exact case `tsk-uio` hit.\n- Only when durable status genuinely is `doing` does it fall back to the\n  existing liveness check (`isReclaimEligible`) — refusing with a\n  `ClaimError('conflict', ...)` naming the holder and claim age if the\n  claim is still genuinely live, or releasing with `{released: true,\n  reason: 'stale-liveness'}` if not.\n- Both releases go through `releaseClaim`'s named `adminReason` option,\n  because the claim usually belongs to another (dead) session and a plain\n  release is refused for any writer but the claim's own. When the operator\n  is a different writer, the result adds `admin: {reason, ownerWriterId,\n  releasedByWriterId}`, and the release is also appended to the event log\n  as a `decision` (`source: unclaim`, `kind: engine`) whose `admin` field\n  carries the same three values plus `claimId` (and `itemId` when the item\n  is unknown, since such a decision cannot carry an `id`). The stale-claim\n  reclaim in `pick` adds the same `admin` field to the decision it already\n  writes.\n\nThis is additive and composes existing primitives (`releaseClaim`,\n`rebuildViewFromDir`, `isReclaimEligible`) rather than duplicating any of\ntheir logic — reviewed and auto-approved as REVERSIBLE (never touches the\ndurable event log)."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "What shipped",
    "anchor": "what-shipped",
    "githubAnchor": "what-shipped",
    "stableAnchor": "h-65423e7e3f99",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "a8209d1cd28db207337cc023b6e79efb157abd68dba02c5b29efed52f9c60a02",
    "sample": "What shipped",
    "sectionPayloadDigest": "7001e5fc818ff7f679d2661aa5f4d9d45af1cea409b0fd9662d73bd61825ad24",
    "followingBlockDigest": "fefd3ebc3509d17f343a581348eee9aab5e00eedd92d1f720d1b7a991589537f",
    "identityFingerprint": "81cc1854b1d9def201cff67e5abdef25885c0267b0f4842e58213ffd88b99519",
    "ancestry": [
      "When a claim outlives the work it was claiming"
    ],
    "text": "## What shipped",
    "sectionText": "## What shipped\n\nA new `fgos unclaim <id>` CLI verb (`bin/fgos.mjs`), reusing three\nalready-tested primitives rather than adding new mechanism:\n\n- Reads the claim via `readClaim(dir, id)`. No claim → `{released: false,\n  reason: 'no-claim'}`.\n- Rebuilds the durable view (`rebuildViewFromDir`) and checks the durable\n  `status` for that id. **If durable status is anything other than\n  `doing`** (including \"not found\" post-truncation) — the claim can no\n  longer be justified by durable state, so it releases immediately:\n  `{released: true, reason: 'durable-status-mismatch', durableStatus}`.\n  This is the exact case `tsk-uio` hit.\n- Only when durable status genuinely is `doing` does it fall back to the\n  existing liveness check (`isReclaimEligible`) — refusing with a\n  `ClaimError('conflict', ...)` naming the holder and claim age if the\n  claim is still genuinely live, or releasing with `{released: true,\n  reason: 'stale-liveness'}` if not.\n- Both releases go through `releaseClaim`'s named `adminReason` option,\n  because the claim usually belongs to another (dead) session and a plain\n  release is refused for any writer but the claim's own. When the operator\n  is a different writer, the result adds `admin: {reason, ownerWriterId,\n  releasedByWriterId}`, and the release is also appended to the event log\n  as a `decision` (`source: unclaim`, `kind: engine`) whose `admin` field\n  carries the same three values plus `claimId` (and `itemId` when the item\n  is unknown, since such a decision cannot carry an `id`). The stale-claim\n  reclaim in `pick` adds the same `admin` field to the decision it already\n  writes.\n\nThis is additive and composes existing primitives (`releaseClaim`,\n`rebuildViewFromDir`, `isReclaimEligible`) rather than duplicating any of\ntheir logic — reviewed and auto-approved as REVERSIBLE (never touches the\ndurable event log)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_55b5d50f2b7963398dbeddf574b0399c"
}
```

## Entry claim_51848961a2bbf93d37bc2b46d9f141f5

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "0f9cc0a2d6c88b4463e6dc64e994d4f9675253b2f36947d8111375b447c0ed7c",
    "identityFingerprint": "c234a8806d26045bdf64b6c748e1721e78759e6c687d6d30b98ab65a3adec77c",
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "unitKind": "heading",
    "sourceUnitDigest": "698037f4efe95080b0c82ec8c7f6e98fc16aa248cf230bf58b280496c2bb5c73",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "4abddc6aceac4d77d1dc3e17fc5d72ab40ef98847f15aaa2eef262507a798e02",
    "identityFingerprint": "d424e46d7fee36a9bbb6408b532de110e319e2b270c289ff1512405c07f5ab54",
    "claimId": "claim_51848961a2bbf93d37bc2b46d9f141f5",
    "sourceAnchor": "chiều-vào-verb-danh-tính",
    "unitKind": "heading",
    "sourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "claimKind": "contract",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "0f9cc0a2d6c88b4463e6dc64e994d4f9675253b2f36947d8111375b447c0ed7c",
      "toUnitDigest": "4abddc6aceac4d77d1dc3e17fc5d72ab40ef98847f15aaa2eef262507a798e02",
      "fromSourceUnitDigest": "698037f4efe95080b0c82ec8c7f6e98fc16aa248cf230bf58b280496c2bb5c73",
      "toSourceUnitDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Chiều vào — verb + danh tính",
    "anchor": "chiều-vào-verb-danh-tính",
    "githubAnchor": "chiều-vào-verb-danh-tính",
    "stableAnchor": "h-2af51816e00c",
    "startLine": 17,
    "endLine": 17,
    "textDigest": "698037f4efe95080b0c82ec8c7f6e98fc16aa248cf230bf58b280496c2bb5c73",
    "sample": "Chiều vào — verb + danh tính",
    "sectionPayloadDigest": "d0349593e66e6928ff970a660b5de498a4e5938fd9183ca189cf2b551c7fd79f",
    "followingBlockDigest": "4d3e5ba86bd907aba25dfcc099af5e2891236ac44ec6aac4eb3e2fc2bd2a5c83",
    "identityFingerprint": "c234a8806d26045bdf64b6c748e1721e78759e6c687d6d30b98ab65a3adec77c",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`"
    ],
    "text": "## Chiều vào — verb + danh tính",
    "sectionText": "## Chiều vào — verb + danh tính\n\nMọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`\n(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.\n\nMỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:\n\n- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,\n  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được).\n\n**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực\nđược ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`\nđược. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua\nvề an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9\nchọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật\nthuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả\nhai nằm NGOÀI hợp đồng này.\n\nSong song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Chiều vào — verb + danh tính",
    "anchor": "chiều-vào-verb-danh-tính",
    "githubAnchor": "chiều-vào-verb-danh-tính",
    "stableAnchor": "h-2af51816e00c",
    "startLine": 17,
    "endLine": 17,
    "textDigest": "a8638afcbc30af3cfed8ddecb38f890e54215f551afcbd9a9d09d23c02d8bce3",
    "sample": "Chiều vào — verb + danh tính",
    "sectionPayloadDigest": "6861300202bfe938a374f0518310d07ad942267cb4507f775b12eb22722e8075",
    "followingBlockDigest": "4d3e5ba86bd907aba25dfcc099af5e2891236ac44ec6aac4eb3e2fc2bd2a5c83",
    "identityFingerprint": "d424e46d7fee36a9bbb6408b532de110e319e2b270c289ff1512405c07f5ab54",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`"
    ],
    "text": "## Chiều vào — verb + danh tính",
    "sectionText": "## Chiều vào — verb + danh tính\n\nMọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`\n(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.\n\nMỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:\n\n- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](platform/session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`.\n\n**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực\nđược ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`\nđược. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua\nvề an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9\nchọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật\nthuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả\nhai nằm NGOÀI hợp đồng này.\n\nKhác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-output`), verb ghi dừng với lỗi `precondition`\n(exit 2) trước khi ghi gì, không bao giờ đoán id. Kênh `node bin/fgos.mjs` và\n`bin.fgos` của npm global vì vậy chỉ ghi được trong project đã activate, hoặc\nkhi `FGOS_HOST_BIN` trỏ tới một binary host.\n\nSong song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_51848961a2bbf93d37bc2b46d9f141f5"
}
```

## Entry claim_dc506074dcc2f08f6012ebb078b50371

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "claimId": "claim_dc506074dcc2f08f6012ebb078b50371",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 53,
    "endLine": 55,
    "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 63,
    "endLine": 65,
    "textDigest": "18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2",
    "sample": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```",
    "identityFingerprint": "54e748727b3965de64cad699080c04ca9dde712a66fcfa5390aca21149606fd3",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "```\n{ contract: 'fgos.v1', generated_at, data_hash, data }\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_dc506074dcc2f08f6012ebb078b50371"
}
```

## Entry claim_62d31ae4e5abfcf0ab158c0c6a8337ee

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
    "sourceAnchor": "unheaded-block-10",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "claimId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-10",
    "githubAnchor": "unheaded-block-10",
    "stableAnchor": "unheaded-block-10",
    "title": "Unheaded block 10",
    "startLine": 57,
    "endLine": 60,
    "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 67,
    "endLine": 70,
    "textDigest": "84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71",
    "sample": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phon",
    "identityFingerprint": "01a3b167cedff01696bcb854f33c46c3250c9f5d0d9e0633245f9bdbbdae944f",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho\nngười — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những\ntrường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/\nbại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_62d31ae4e5abfcf0ab158c0c6a8337ee"
}
```

## Entry claim_5e282fb457ff9ef02e88cf329556cf34

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "claimId": "claim_5e282fb457ff9ef02e88cf329556cf34",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 62,
    "endLine": 66,
    "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 72,
    "endLine": 76,
    "textDigest": "6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca",
    "sample": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một",
    "identityFingerprint": "716ba1ed20e3b9ba335f8aea5899f5e842f85892ea40fcd2a0233237ae61b12d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in\nnhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`\nhoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong\nbì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên\nđọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5e282fb457ff9ef02e88cf329556cf34"
}
```

## Entry claim_5b930b5ce84afec3d4b2c383c7f85925

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "claimId": "claim_5b930b5ce84afec3d4b2c383c7f85925",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 68,
    "endLine": 71,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 78,
    "endLine": 81,
    "textDigest": "bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056",
    "sample": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progr",
    "identityFingerprint": "ba5e63678191dc9c6bae6aa99c65efd2c8f670d3dd9b38c8aaee891fe5787197",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm\n`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd \"dòng\nbắt đầu bằng `{`\"), vì luồng progress-trace của `fgos-runner` (xem \"Ngoại\nlệ có lý do\" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5b930b5ce84afec3d4b2c383c7f85925"
}
```

## Entry claim_bc091727d4f9526a57978e0ccc1cd5f7

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "claimId": "claim_bc091727d4f9526a57978e0ccc1cd5f7",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 75,
    "endLine": 80,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Mã thoát (exit code) — một nguồn duy nhất"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 85,
    "endLine": 90,
    "textDigest": "d1af2d5a982f5d139fda776a23b4ad0b3776cc40c1fc0177636c44bdc91b968d",
    "sample": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail",
    "identityFingerprint": "78a5ddb4f5e294cd0185681fedb1e548cace7fbb42d520feec13ae171ceafb00",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Mã thoát (exit code) — một nguồn duy nhất"
    ],
    "text": "`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·\n4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail · 9 merge-fail · 4 not-found) cộng\n`OUTCOME_EXIT_CODES` (4 policy-refusal · 10 provider-limit · 11 execution-failure · 12 partial-writes ·\n13 blocked · 14 findings) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của\nrunner) là bảng DUY NHẤT. 0 = ok / pass, 1 = bất ngờ (mọi thứ chưa phân loại).\nConsumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_bc091727d4f9526a57978e0ccc1cd5f7"
}
```

## Entry claim_812873a889bd4222ea0ab3dc9194e1ad

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceAnchor": "unheaded-block-14",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "claimId": "claim_812873a889bd4222ea0ab3dc9194e1ad",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-14",
    "githubAnchor": "unheaded-block-14",
    "stableAnchor": "unheaded-block-14",
    "title": "Unheaded block 14",
    "startLine": 82,
    "endLine": 83,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Mã thoát (exit code) — một nguồn duy nhất"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 92,
    "endLine": 93,
    "textDigest": "131cc0704d753f35dcbec3ebba7be49a0d103732b6f4ee8c5ecc175d5c46167e",
    "sample": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tư",
    "identityFingerprint": "e92265336a0d1434e9f7768558dc58ebd574fb194a7871ae7bce67f7afa2a734",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Mã thoát (exit code) — một nguồn duy nhất"
    ],
    "text": "**Kết cục thực thi (`fgos run` và `fgos workflow start|resume|answer --foreground`, RUL99):**\nKhi lệnh chạy kết thúc với một outcome không phải `pass`, tiến trình CLI trả mã lỗi tương ứng theo bảng mã kết cục thực thi (`policy-refusal`: 4, `provider-limit`: 10, `execution-failure`: 11, `partial-writes`: 12, `blocked`: 13, `findings`: 14), trong khi toàn bộ luồng stdout JSON envelope `fgos.v1` vẫn được giữ nguyên vẹn 100%. Các lệnh chỉ-đọc như `fgos workflow status` luôn trả mã thoát 0 bất kể outcome của workflow run. Lệnh `fgos workflow start` chạy detached trả exit code 0 khi tiến trình daemon được kích hoạt thành công."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_812873a889bd4222ea0ab3dc9194e1ad"
}
```

## Entry claim_992a812b2fcaa4f93dd86d2190d7ac3a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_992a812b2fcaa4f93dd86d2190d7ac3a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "claimId": "claim_992a812b2fcaa4f93dd86d2190d7ac3a",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "claimId": "claim_992a812b2fcaa4f93dd86d2190d7ac3a",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 86,
    "endLine": 87,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Ngoại lệ có lý do"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 96,
    "endLine": 97,
    "textDigest": "cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8",
    "sample": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:",
    "identityFingerprint": "a329378df55a88a211d803b53fce8d8b4b954eb4cacd1f78dfc353e97b20d783",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Ngoại lệ có lý do"
    ],
    "text": "Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung\nđúng một chữ, \"ngoại lệ có lý do\", không gọi tuỳ hứng theo từng chỗ:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_992a812b2fcaa4f93dd86d2190d7ac3a"
}
```

## Entry claim_e5e2846158bbd249d1ebbd70161f02a0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e5e2846158bbd249d1ebbd70161f02a0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "identityFingerprint": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "claimId": "claim_e5e2846158bbd249d1ebbd70161f02a0",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "06606edc018d149151d695b556303fa30fc664064737645cc57d1dce43711b67",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "identityFingerprint": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "claimId": "claim_e5e2846158bbd249d1ebbd70161f02a0",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "06606edc018d149151d695b556303fa30fc664064737645cc57d1dce43711b67",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 89,
    "endLine": 106,
    "textDigest": "06606edc018d149151d695b556303fa30fc664064737645cc57d1dce43711b67",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Ngoại lệ có lý do"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.\n**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 99,
    "endLine": 116,
    "textDigest": "06606edc018d149151d695b556303fa30fc664064737645cc57d1dce43711b67",
    "sample": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --p",
    "identityFingerprint": "32c40ae41f32ba4d7337e3dda1a320645a8e0206cd5ac1662395b253337ac705",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Ngoại lệ có lý do"
    ],
    "text": "1. **Sổ verb máy-đọc** (`--help`/`-h`, có hoặc không `--json`, kể cả\n   `<verb> [<sub>] --help`) — siêu dữ liệu về CLI, không phải payload của\n   một verb.\n2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh\n   qua cờ `--pretty`, không phải payload mặc định.\n3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`\n   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.\n4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán\n   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle\n   \"watch mode stopped\" khi nhận tín hiệu dừng) — in console y nguyên như\n   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.\n5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —\n   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,\n   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,\n   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.\n**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)\nNẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không\nphải cửa ra tới người."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e5e2846158bbd249d1ebbd70161f02a0"
}
```

## Entry claim_da21278ab32966f6631c82420552ed2b

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_da21278ab32966f6631c82420552ed2b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "claimId": "claim_da21278ab32966f6631c82420552ed2b",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "claimId": "claim_da21278ab32966f6631c82420552ed2b",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 110,
    "endLine": 119,
    "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Phân trang — con trỏ đục"
    ],
    "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 120,
    "endLine": 129,
    "textDigest": "c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4",
    "sample": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → ",
    "identityFingerprint": "30d43ecb2d28400d920c9b3e23e93ead71b4cb92aecb62d15a14115f3ceb9363",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Phân trang — con trỏ đục"
    ],
    "text": "Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:\n`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá\n`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có\ntính năng này. Truyền một trong hai → kết quả đổi hình dạng thành\n`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy\nchủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự\nchế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã\nrời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu\nlại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của\nnó là một cặp `(a,b)`, không có khoá riêng cho một dòng."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_da21278ab32966f6631c82420552ed2b"
}
```

## Entry claim_b38e730cc466114aa1e1ebba6fa880ed

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "claimId": "claim_b38e730cc466114aa1e1ebba6fa880ed",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-18",
    "githubAnchor": "unheaded-block-18",
    "stableAnchor": "unheaded-block-18",
    "title": "Unheaded block 18",
    "startLine": 121,
    "endLine": 122,
    "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Phân trang — con trỏ đục"
    ],
    "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 131,
    "endLine": 132,
    "textDigest": "b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce",
    "sample": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb).",
    "identityFingerprint": "f7db584629456ff7dc7809a7269b5323e94ec40e570d416c5cd29d45ea82206d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất",
      "Phân trang — con trỏ đục"
    ],
    "text": "Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt\ntrên MỌI verb)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b38e730cc466114aa1e1ebba6fa880ed"
}
```

## Entry claim_cbc7ad17e0764ac8d1d4d386e3b62e74

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceAnchor": "unheaded-block-19",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "claimId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74",
    "sourceAnchor": "unheaded-block-20",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-19",
    "githubAnchor": "unheaded-block-19",
    "stableAnchor": "unheaded-block-19",
    "title": "Unheaded block 19",
    "startLine": 126,
    "endLine": 133,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 136,
    "endLine": 143,
    "textDigest": "51dd3c8aa026a8f5a15e4c12c522b3bf2ad7c29238c49bf9ba51324806e10e23",
    "sample": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `sc",
    "identityFingerprint": "49d3e9858947d27fe5eed264949a7b4b22caed396f6bebb112a9eae50fa460fd",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố\ntoàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest\nthay vì hard-code từng verb. `schema_version` hiện `'3.0'` (tăng từ `'2.0'`\nkhi cờ của verb có sub-verb dời vào `subcommands`; `'2.0'` từng tăng từ\n`'1.0'` vì trường `access` bị xoá). `fgos <verb> [<sub>] --help --json` trả\nriêng mục của một verb (thu hẹp về một sub-verb khi có), cùng hình dạng một\nphần tử `commands[]`. Cả hai chạy được qua Rust host ở mọi project và không\nbao giờ chạy verb. Mỗi mục verb mang:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cbc7ad17e0764ac8d1d4d386e3b62e74"
}
```

## Entry claim_b8fa7fa2cd614433de754bbb92302140

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "identityFingerprint": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceAnchor": "unheaded-block-20",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "identityFingerprint": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "claimId": "claim_b8fa7fa2cd614433de754bbb92302140",
    "sourceAnchor": "unheaded-block-21",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-20",
    "githubAnchor": "unheaded-block-20",
    "stableAnchor": "unheaded-block-20",
    "title": "Unheaded block 20",
    "startLine": 135,
    "endLine": 148,
    "textDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho\n  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,\n  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-21",
    "githubAnchor": "unheaded-block-21",
    "stableAnchor": "unheaded-block-21",
    "title": "Unheaded block 21",
    "startLine": 145,
    "endLine": 158,
    "textDigest": "d08ac6f65427df6334f383a722e80ed4640fc93af7693c530ce2265d7262fcb7",
    "sample": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `unde",
    "identityFingerprint": "c38ce970c6b66ab0c845d09798a8f8fbf86a4fdc950c1f7c6b663066d441febe",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`\n  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata\n  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).\n- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và\n  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục\n  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,\n  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù\n  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho\n  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,\n  `coordination` — dispatch executor thật tính là effect ngoài `.fgos/`).\n- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.\n- `subcommands` cho verb có sub-verb ở vị trí đầu: `{<sub>: {description,\n  parameters, examples}}`, mỗi sub-verb chỉ mang cờ nó thật sự đọc;\n  `parameters` cấp verb khi đó chỉ còn `sub`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b8fa7fa2cd614433de754bbb92302140"
}
```

## Entry claim_535f1aeb31d616e2138a5b3719cb4cd0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
    "sourceAnchor": "unheaded-block-21",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "claimId": "claim_535f1aeb31d616e2138a5b3719cb4cd0",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-21",
    "githubAnchor": "unheaded-block-21",
    "stableAnchor": "unheaded-block-21",
    "title": "Unheaded block 21",
    "startLine": 150,
    "endLine": 151,
    "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 160,
    "endLine": 161,
    "textDigest": "78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293",
    "sample": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38.",
    "identityFingerprint": "09c3e021c9425c045fe449a643d34c2a0822b5ab6874cf19bff4bead073bf38c",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả"
    ],
    "text": "Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa\nnối vào điều phối hay xác danh; cổng \"ai được nói verb nào\" thuộc STR38."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_535f1aeb31d616e2138a5b3719cb4cd0"
}
```

## Entry claim_d0e16d088cdecf2dd0b491f819009aa6

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
    "sourceAnchor": "unheaded-block-22",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "claimId": "claim_d0e16d088cdecf2dd0b491f819009aa6",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-22",
    "githubAnchor": "unheaded-block-22",
    "stableAnchor": "unheaded-block-22",
    "title": "Unheaded block 22",
    "startLine": 155,
    "endLine": 159,
    "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả",
      "Quy ước cờ nhiều-giá-trị"
    ],
    "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 165,
    "endLine": 169,
    "textDigest": "a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5",
    "sample": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý k",
    "identityFingerprint": "391c047e1504392d5753fa672f78780cdcb8fe38297709666e38396a5d65e1e6",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Sổ verb máy-đọc — CLI tự mô tả",
      "Quy ước cờ nhiều-giá-trị"
    ],
    "text": "Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách\ndấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi\nJSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự\nchứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;\nnay đọc được bằng máy."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d0e16d088cdecf2dd0b491f819009aa6"
}
```

## Entry claim_e9ee744c6e1847ef25b3eb0bf180f577

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "claimId": "claim_e9ee744c6e1847ef25b3eb0bf180f577",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-23",
    "githubAnchor": "unheaded-block-23",
    "stableAnchor": "unheaded-block-23",
    "title": "Unheaded block 23",
    "startLine": 163,
    "endLine": 164,
    "textDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "sample": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
    "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 173,
    "endLine": 174,
    "textDigest": "ae0e60ec193e0ac5ad026b2cf78a37ba3156fea7043460714946bfe66311ab5e",
    "sample": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó.",
    "identityFingerprint": "2df9f5fa04ff7038ba5082547bea7f14594ba0bedda12729cf337e9f24f85bfc",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "Theo [0011](decisions/0011-version-tuong-minh-cho-moi-contract.md): mỗi\ncontract mang version tường minh trong định danh của chính nó."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e9ee744c6e1847ef25b3eb0bf180f577"
}
```

## Entry claim_6f7c99f38f64abb5af7f07c1e2690730

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "claimId": "claim_6f7c99f38f64abb5af7f07c1e2690730",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 166,
    "endLine": 172,
    "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 176,
    "endLine": 182,
    "textDigest": "c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3",
    "sample": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phầ",
    "identityFingerprint": "d147ec28828230700ab1bfea679f7deb623328c37da2976e6c6d1b6fe70fa67d",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "| Bề mặt | Token | Hiện thân |\n|---|---|---|\n| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |\n| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |\n| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |\n| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |\n| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6f7c99f38f64abb5af7f07c1e2690730"
}
```

## Entry claim_ea280fa29dca090fe3306f6161ac6ae7

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
    "sourceAnchor": "unheaded-block-25",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "claimId": "claim_ea280fa29dca090fe3306f6161ac6ae7",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-25",
    "githubAnchor": "unheaded-block-25",
    "stableAnchor": "unheaded-block-25",
    "title": "Unheaded block 25",
    "startLine": 174,
    "endLine": 175,
    "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 184,
    "endLine": 185,
    "textDigest": "03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb",
    "sample": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định.",
    "identityFingerprint": "e0550b3dffbcc1e7cca3870dcaba9bc25ff6b8faf4890803a7c9c02fdaf3f477",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Version token"
    ],
    "text": "CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,\ndán version lên thứ chưa chạy là đóng dấu cho giả định."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ea280fa29dca090fe3306f6161ac6ae7"
}
```

## Entry claim_8999e61e46d6c02b407b84263d7a2d67

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "claimId": "claim_8999e61e46d6c02b407b84263d7a2d67",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-26",
    "githubAnchor": "unheaded-block-26",
    "stableAnchor": "unheaded-block-26",
    "title": "Unheaded block 26",
    "startLine": 179,
    "endLine": 181,
    "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-27",
    "githubAnchor": "unheaded-block-27",
    "stableAnchor": "unheaded-block-27",
    "title": "Unheaded block 27",
    "startLine": 189,
    "endLine": 191,
    "textDigest": "36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d",
    "sample": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:",
    "identityFingerprint": "a835a7428bc1398d720acb13ab8296532880e72b4898d3899de3d7769b4d82c1",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ\nđộng (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có\nnhà riêng:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_8999e61e46d6c02b407b84263d7a2d67"
}
```

## Entry claim_f10fba22a20755dc700bb1720f98f451

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
    "sourceAnchor": "unheaded-block-27",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "claimId": "claim_f10fba22a20755dc700bb1720f98f451",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-27",
    "githubAnchor": "unheaded-block-27",
    "stableAnchor": "unheaded-block-27",
    "title": "Unheaded block 27",
    "startLine": 183,
    "endLine": 188,
    "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 193,
    "endLine": 198,
    "textDigest": "fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea",
    "sample": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daem",
    "identityFingerprint": "a29bb933980ea4913cae817f4ebe6cac7f0a9646a72058f4553d41243dd446a0",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "- **Chiều-ra khởi-xướng (\"cần bạn\")** — một kênh attention/push có\n  delivery-semantics riêng (at-least-once, dedup, routing, ack,\n  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.\n- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.\n- **Tầng phân quyền** (\"ai được gọi verb nào\", caller chưa xác danh có bị\n  chặn hay không) — thuộc STR38."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f10fba22a20755dc700bb1720f98f451"
}
```

## Entry claim_cf56f4a8b7679435c6bf59abd8c23093

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "claimId": "claim_cf56f4a8b7679435c6bf59abd8c23093",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-28",
    "githubAnchor": "unheaded-block-28",
    "stableAnchor": "unheaded-block-28",
    "title": "Unheaded block 28",
    "startLine": 190,
    "endLine": 192,
    "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-29",
    "githubAnchor": "unheaded-block-29",
    "stableAnchor": "unheaded-block-29",
    "title": "Unheaded block 29",
    "startLine": 200,
    "endLine": 202,
    "textDigest": "30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7",
    "sample": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, ",
    "identityFingerprint": "8bd38f6ba0f85b2d742a0454a7907d8516563078c2d8099856d856f1f2710db9",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ\ný: chỉ vế \"có một spec hợp đồng in/out tự-mô-tả\" là việc của STR46; hai vế\ncòn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cf56f4a8b7679435c6bf59abd8c23093"
}
```

## Entry claim_deb4b4da2abbc3d6190dfce1c75cabf2

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
    "sourceAnchor": "unheaded-block-29",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "claimId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-29",
    "githubAnchor": "unheaded-block-29",
    "stableAnchor": "unheaded-block-29",
    "title": "Unheaded block 29",
    "startLine": 194,
    "endLine": 197,
    "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 204,
    "endLine": 207,
    "textDigest": "fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75",
    "sample": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discove",
    "identityFingerprint": "6cd92acba46a3c7426f42a13e11e56a76332f8eec064c096fc0b761fef543213",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Ranh giới — điều gì KHÔNG thuộc hợp đồng này"
    ],
    "text": "Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập\nCLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi\nhành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải\ncửa ra tới người)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_deb4b4da2abbc3d6190dfce1c75cabf2"
}
```

## Entry claim_d802aabd387ae98595c102f0e857f9b1

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
    "sourceAnchor": "unheaded-block-30",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "claimId": "claim_d802aabd387ae98595c102f0e857f9b1",
    "sourceAnchor": "unheaded-block-31",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-30",
    "githubAnchor": "unheaded-block-30",
    "stableAnchor": "unheaded-block-30",
    "title": "Unheaded block 30",
    "startLine": 201,
    "endLine": 207,
    "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Tham chiếu"
    ],
    "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-31",
    "githubAnchor": "unheaded-block-31",
    "stableAnchor": "unheaded-block-31",
    "title": "Unheaded block 31",
    "startLine": 211,
    "endLine": 217,
    "textDigest": "7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf",
    "sample": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envel",
    "identityFingerprint": "a7e6134a0d237d4c3430f1d677f25907055cfb0e76bdc47225a0c1da5843c4ff",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Tham chiếu"
    ],
    "text": "`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·\n`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·\n`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người\nghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope\nstdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng\nký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định\nkhoá, plan.md bốn lát)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d802aabd387ae98595c102f0e857f9b1"
}
```

## Entry claim_57f11d837272b3f9781b376ef1665c81

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "claimId": "claim_57f11d837272b3f9781b376ef1665c81",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "claimKind": "contract",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 24,
    "endLine": 34,
    "textDigest": "d38286962b4133b3c55926e513b03625483e4bd0b6b885a6fd3dde23c00686b8",
    "sample": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: ",
    "identityFingerprint": "bcd5fad94d4723e8decd7375d5df9a749a53154e519ca0b4392815883b490e04",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song\n  song), luôn có mặt.\n- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu\n  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·\n  `env` (biến môi trường, ai cũng set được) · `pid` (tổ tiên cao nhất còn\n  terminal, không có thì session id của tiến trình gọi; best-effort) ·\n  `unresolved` (không nguồn nào xác nhận được — `id` vẫn là\n  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn\n  `source` nói giá trị chưa kiểm chứng được). Luật đầy đủ (thứ tự biến env,\n  giới hạn đã biết) chỉ nằm ở [spec Session Identity](platform/session-identity/spec.md);\n  nguồn duy nhất là crate Rust `fgos-session-identity`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_57f11d837272b3f9781b376ef1665c81"
}
```

## Entry claim_a14f9308d3f04e10e670c6f178d4ee33

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "claimId": "claim_a14f9308d3f04e10e670c6f178d4ee33",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "claimKind": "contract",
    "status": "current",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 44,
    "endLine": 49,
    "textDigest": "b5b6124764e7d3f101cac103f5a6e63bdf8f5732bc72e4a7049337f519d4ea79",
    "sample": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-",
    "identityFingerprint": "364e81e85037c5701c597a7036c723d620a39c75e5137bb197651b57c9865746",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "Khác với \"chưa xác danh\", **lỗi cài đặt** thì chặn: khi không có binary host\nRust nào trả lời được identity (`host-missing`, `host-version-mismatch`,\n`timeout`, `host-error`, `bad-output`), verb ghi dừng với lỗi `precondition`\n(exit 2) trước khi ghi gì, không bao giờ đoán id. Kênh `node bin/fgos.mjs` và\n`bin.fgos` của npm global vì vậy chỉ ghi được trong project đã activate, hoặc\nkhi `FGOS_HOST_BIN` trỏ tới một binary host."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a14f9308d3f04e10e670c6f178d4ee33"
}
```

## Entry claim_153f56c2d5a2e895f8e6b2607bb7ab3d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "claimId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 41,
    "endLine": 45,
    "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 51,
    "endLine": 55,
    "textDigest": "25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770",
    "sample": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park ",
    "identityFingerprint": "25e8ac8713a9e8b0d4e2aec65856e800400119e2ea30774d3f016bbfafa4f8ee",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều vào — verb + danh tính"
    ],
    "text": "Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`\n— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ\ntư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,\nkhông do ai quyết định). `role` và `writer` tách bạch: một cái nói \"ai gây\nra\", một cái nói \"loại gì gây ra\"."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_153f56c2d5a2e895f8e6b2607bb7ab3d"
}
```

## Entry claim_38ad96d62f2c6cf7a639fc24a83c2621

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "claimKind": "contract",
    "status": "current"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/io-contract.md",
    "unitDigest": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "claimId": "claim_38ad96d62f2c6cf7a639fc24a83c2621",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "claimKind": "contract",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 49,
    "endLine": 51,
    "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 59,
    "endLine": 61,
    "textDigest": "6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa",
    "sample": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:",
    "identityFingerprint": "f36f89657b6f8b5083e49ed2033398ce8e8dd135da61ade065ae4668c324f77e",
    "ancestry": [
      "Hợp Đồng I/O của fgOS — cửa CLI + bề mặt stdout của `fgos-runner`",
      "Chiều ra — envelope thống nhất"
    ],
    "text": "Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,\n`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra\n`stdout`:"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_38ad96d62f2c6cf7a639fc24a83c2621"
}
```

## Entry claim_b4cf0df2f8bcb0d3daa27b5fc3bfdadb

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b4cf0df2f8bcb0d3daa27b5fc3bfdadb",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "a30f85563a9088f3e29d568382fd64d2883945d74d152e7bafee3a185d447725",
    "identityFingerprint": "4efdf860593f6345616b516b7b33a100e370a7fa9765b6cf9af5d3eca28f7e42",
    "claimId": "claim_b4cf0df2f8bcb0d3daa27b5fc3bfdadb",
    "sourceAnchor": "1-platform-wide-anchors",
    "unitKind": "heading",
    "sourceUnitDigest": "a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "4470d20cfccc7aabfe4c87ef5c87acbc1466d535e85d6250b3d70b02f527e9d2",
      "toUnitDigest": "a30f85563a9088f3e29d568382fd64d2883945d74d152e7bafee3a185d447725",
      "fromSourceUnitDigest": "7f079957dfceec8cb7a7777eb432f348a14560c4943f277c56e207dc981928fc",
      "toSourceUnitDigest": "a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "a30f85563a9088f3e29d568382fd64d2883945d74d152e7bafee3a185d447725",
    "identityFingerprint": "4efdf860593f6345616b516b7b33a100e370a7fa9765b6cf9af5d3eca28f7e42",
    "claimId": "claim_b4cf0df2f8bcb0d3daa27b5fc3bfdadb",
    "sourceAnchor": "1-platform-wide-anchors",
    "unitKind": "heading",
    "sourceUnitDigest": "a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Platform-wide Anchors",
    "anchor": "1-platform-wide-anchors",
    "githubAnchor": "1-platform-wide-anchors",
    "stableAnchor": "h-69c814c2bca6",
    "startLine": 25,
    "endLine": 25,
    "textDigest": "a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c",
    "sample": "1. Platform-wide Anchors",
    "sectionPayloadDigest": "b57724220efedb3f165fe73453a90335985514025faf92f291384a2b47eaf489",
    "followingBlockDigest": "b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd",
    "identityFingerprint": "4efdf860593f6345616b516b7b33a100e370a7fa9765b6cf9af5d3eca28f7e42",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 1. Platform-wide Anchors",
    "sectionText": "## 1. Platform-wide Anchors\n\nThese docs are cross-area authority and live directly under `docs/platform/` in\nthe target structure.\n\n| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](../platform-foundations.md), [../work-item-lifecycle-vision.md](../work-item-lifecycle-vision.md), design discussions |\n| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent across simplified implementation slices | Documentation-system discussion, [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) |\n| [platform-foundations.md](platform-foundations.md) | Platform laws and durable constraints | [../platform-foundations.md](../platform-foundations.md), [../specs/platform-foundations.md](../specs/platform-foundations.md) |\n| [architecture-map.md](architecture-map.md) | Whole-system architecture map | [../architecture-map.md](../architecture-map.md) |\n| [component-boundary.md](component-boundary.md) | Layers, parent/child components, responsibilities, authority boundaries | [../architect/component-boundary/](../architect/component-boundary/) |\n| [../contracts/](../contracts/) | Cross-area contracts during migration | [../routing-handoff-contract.md](../routing-handoff-contract.md), [../contracts/](../contracts/) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "1. Platform-wide Anchors",
    "anchor": "1-platform-wide-anchors",
    "githubAnchor": "1-platform-wide-anchors",
    "stableAnchor": "h-69c814c2bca6",
    "startLine": 25,
    "endLine": 25,
    "textDigest": "a50bb1654cb8fda3fd30a1d4de47465b15870f24a5a7034d6c003f6ee386612c",
    "sample": "1. Platform-wide Anchors",
    "sectionPayloadDigest": "b57724220efedb3f165fe73453a90335985514025faf92f291384a2b47eaf489",
    "followingBlockDigest": "b91459b47f7a7aec45a0e03afc29342b26e9cdba66f334988a648ac9acf6e4bd",
    "identityFingerprint": "4efdf860593f6345616b516b7b33a100e370a7fa9765b6cf9af5d3eca28f7e42",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 1. Platform-wide Anchors",
    "sectionText": "## 1. Platform-wide Anchors\n\nThese docs are cross-area authority and live directly under `docs/platform/` in\nthe target structure.\n\n| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](../platform-foundations.md), [../work-item-lifecycle-vision.md](../work-item-lifecycle-vision.md), design discussions |\n| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent across simplified implementation slices | Documentation-system discussion, [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) |\n| [platform-foundations.md](platform-foundations.md) | Platform laws and durable constraints | [../platform-foundations.md](../platform-foundations.md), [../specs/platform-foundations.md](../specs/platform-foundations.md) |\n| [architecture-map.md](architecture-map.md) | Whole-system architecture map | [../architecture-map.md](../architecture-map.md) |\n| [component-boundary.md](component-boundary.md) | Layers, parent/child components, responsibilities, authority boundaries | [../architect/component-boundary/](../architect/component-boundary/) |\n| [../contracts/](../contracts/) | Cross-area contracts during migration | [../routing-handoff-contract.md](../routing-handoff-contract.md), [../contracts/](../contracts/) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b4cf0df2f8bcb0d3daa27b5fc3bfdadb"
}
```

## Entry claim_1898cdafa7835d675526173d39eb5cd2

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "6a852b4f8cae0c9ba67ba869a619605e07009cd668149bcdff501922339e2e30",
    "identityFingerprint": "6ecd4697e437d51544909c2d972e36780dcfa182e78ce074c7ab34c4d68c50dd",
    "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
    "sourceAnchor": "2-area-registry",
    "unitKind": "heading",
    "sourceUnitDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "5fa8a302eac76a3127f26c35e2c3fc27722fc9b25ea76de6464e12bd15712183",
      "toUnitDigest": "6a852b4f8cae0c9ba67ba869a619605e07009cd668149bcdff501922339e2e30",
      "fromSourceUnitDigest": "411eda9b0873c433b9c23553bcb173d939dadd5e2d54e3279905f932fe3215b4",
      "toSourceUnitDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "6a852b4f8cae0c9ba67ba869a619605e07009cd668149bcdff501922339e2e30",
    "identityFingerprint": "6ecd4697e437d51544909c2d972e36780dcfa182e78ce074c7ab34c4d68c50dd",
    "claimId": "claim_1898cdafa7835d675526173d39eb5cd2",
    "sourceAnchor": "2-area-registry",
    "unitKind": "heading",
    "sourceUnitDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Area Registry",
    "anchor": "2-area-registry",
    "githubAnchor": "2-area-registry",
    "stableAnchor": "h-b2df212ebca6",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
    "sample": "2. Area Registry",
    "sectionPayloadDigest": "9fdca6e653e5ef214025e1ff13968d5a47647f726afec003d28a39ffd587d33e",
    "followingBlockDigest": "ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069",
    "identityFingerprint": "6ecd4697e437d51544909c2d972e36780dcfa182e78ce074c7ab34c4d68c50dd",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 2. Area Registry",
    "sectionText": "## 2. Area Registry\n\nTarget area docs live at `docs/platform/<area>/`.\n\n| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Area Registry",
    "anchor": "2-area-registry",
    "githubAnchor": "2-area-registry",
    "stableAnchor": "h-b2df212ebca6",
    "startLine": 39,
    "endLine": 39,
    "textDigest": "6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66",
    "sample": "2. Area Registry",
    "sectionPayloadDigest": "9fdca6e653e5ef214025e1ff13968d5a47647f726afec003d28a39ffd587d33e",
    "followingBlockDigest": "ca9b55008482c55a9c860c3c957855a19075bdd07ef9e882435be2c6d2413069",
    "identityFingerprint": "6ecd4697e437d51544909c2d972e36780dcfa182e78ce074c7ab34c4d68c50dd",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 2. Area Registry",
    "sectionText": "## 2. Area Registry\n\nTarget area docs live at `docs/platform/<area>/`.\n\n| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1898cdafa7835d675526173d39eb5cd2"
}
```

## Entry claim_6143f65cb5e3d4d41e7b957306ab6e4e

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_6143f65cb5e3d4d41e7b957306ab6e4e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "247855f93a51a462e3196194a05f5f706ae3160f92ab0843ca1814aee2225a48",
    "identityFingerprint": "dead9f704f35d8338bb5b75fe3253a629256e072ba5d68fc9853cf2ee1541161",
    "claimId": "claim_6143f65cb5e3d4d41e7b957306ab6e4e",
    "sourceAnchor": "4-how-to-change-platform-docs",
    "unitKind": "heading",
    "sourceUnitDigest": "8bef85b5b40152a6725e550d17e758d19d02f00a0fcde98dcc1c83af76e6b1b4",
    "claimKind": "procedure",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "4821b84611502d01638a28393da3f4a165d89a30ec12a5375a63834b9872a9bd",
      "toUnitDigest": "247855f93a51a462e3196194a05f5f706ae3160f92ab0843ca1814aee2225a48",
      "fromSourceUnitDigest": "fa60ca643103bb168bb3d5adf8637902e6a7cc0a1d43d9dd726902951a2bc336",
      "toSourceUnitDigest": "8bef85b5b40152a6725e550d17e758d19d02f00a0fcde98dcc1c83af76e6b1b4"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "247855f93a51a462e3196194a05f5f706ae3160f92ab0843ca1814aee2225a48",
    "identityFingerprint": "dead9f704f35d8338bb5b75fe3253a629256e072ba5d68fc9853cf2ee1541161",
    "claimId": "claim_6143f65cb5e3d4d41e7b957306ab6e4e",
    "sourceAnchor": "4-how-to-change-platform-docs",
    "unitKind": "heading",
    "sourceUnitDigest": "8bef85b5b40152a6725e550d17e758d19d02f00a0fcde98dcc1c83af76e6b1b4",
    "claimKind": "procedure",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. How To Change Platform Docs",
    "anchor": "4-how-to-change-platform-docs",
    "githubAnchor": "4-how-to-change-platform-docs",
    "stableAnchor": "h-d7c4d2615ca3",
    "startLine": 65,
    "endLine": 65,
    "textDigest": "8bef85b5b40152a6725e550d17e758d19d02f00a0fcde98dcc1c83af76e6b1b4",
    "sample": "4. How To Change Platform Docs",
    "sectionPayloadDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "followingBlockDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "identityFingerprint": "dead9f704f35d8338bb5b75fe3253a629256e072ba5d68fc9853cf2ee1541161",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 4. How To Change Platform Docs",
    "sectionText": "## 4. How To Change Platform Docs\n\n1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read this portal and the relevant area portal/spec.\n4. Read the relevant vision and intent-preservation ledger when the change\n   narrows, stages, or simplifies the full design.\n5. Use a discussion scratchpad for multi-round shaping.\n6. Promote settled content into the right canonical doc.\n7. Update links and verification pointers."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. How To Change Platform Docs",
    "anchor": "4-how-to-change-platform-docs",
    "githubAnchor": "4-how-to-change-platform-docs",
    "stableAnchor": "h-d7c4d2615ca3",
    "startLine": 65,
    "endLine": 65,
    "textDigest": "8bef85b5b40152a6725e550d17e758d19d02f00a0fcde98dcc1c83af76e6b1b4",
    "sample": "4. How To Change Platform Docs",
    "sectionPayloadDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "followingBlockDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "identityFingerprint": "dead9f704f35d8338bb5b75fe3253a629256e072ba5d68fc9853cf2ee1541161",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 4. How To Change Platform Docs",
    "sectionText": "## 4. How To Change Platform Docs\n\n1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read this portal and the relevant area portal/spec.\n4. Read the relevant vision and intent-preservation ledger when the change\n   narrows, stages, or simplifies the full design.\n5. Use a discussion scratchpad for multi-round shaping.\n6. Promote settled content into the right canonical doc.\n7. Update links and verification pointers."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6143f65cb5e3d4d41e7b957306ab6e4e"
}
```

## Entry claim_cf06097fa740bba9d230af78ec04463d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cf06097fa740bba9d230af78ec04463d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "a3595c48ed911e7beffb5aa43e9f66b84b2fc6ac15c702f3032883894d68b690",
    "identityFingerprint": "c53d4463919e9679327e17018df13f3d1a160485958f492eb74fdf69bc3fb9e8",
    "claimId": "claim_cf06097fa740bba9d230af78ec04463d",
    "sourceAnchor": "5-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "a3208b26b1372ab85510c05c5533a099da6499599627ee62c5f61112d6d2daad",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "fab341110e7c3c8637652fc1bdc1c571bd7a2cc249ec3ed19acd31efc6ec06d1",
      "toUnitDigest": "a3595c48ed911e7beffb5aa43e9f66b84b2fc6ac15c702f3032883894d68b690",
      "fromSourceUnitDigest": "19e4204cb55f7d3d614090de44f4ef1685a317598a039abc56f0f2f16363e3ad",
      "toSourceUnitDigest": "a3208b26b1372ab85510c05c5533a099da6499599627ee62c5f61112d6d2daad"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "a3595c48ed911e7beffb5aa43e9f66b84b2fc6ac15c702f3032883894d68b690",
    "identityFingerprint": "c53d4463919e9679327e17018df13f3d1a160485958f492eb74fdf69bc3fb9e8",
    "claimId": "claim_cf06097fa740bba9d230af78ec04463d",
    "sourceAnchor": "5-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "a3208b26b1372ab85510c05c5533a099da6499599627ee62c5f61112d6d2daad",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Related Files",
    "anchor": "5-related-files",
    "githubAnchor": "5-related-files",
    "stableAnchor": "h-6524ea4e5608",
    "startLine": 76,
    "endLine": 76,
    "textDigest": "a3208b26b1372ab85510c05c5533a099da6499599627ee62c5f61112d6d2daad",
    "sample": "5. Related Files",
    "sectionPayloadDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "followingBlockDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "identityFingerprint": "c53d4463919e9679327e17018df13f3d1a160485958f492eb74fdf69bc3fb9e8",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 5. Related Files",
    "sectionText": "## 5. Related Files\n\n| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [migration-authoring-rules.md](migration-authoring-rules.md) |\n| routes readers | [../reading-map.md](../reading-map.md) |\n| defines platform direction | [vision.md](vision.md) |\n| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| defines durable laws | [platform-foundations.md](platform-foundations.md) |\n| maps architecture | [architecture-map.md](architecture-map.md) |\n| maps component boundaries | [component-boundary.md](component-boundary.md) |\n| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |\n| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Related Files",
    "anchor": "5-related-files",
    "githubAnchor": "5-related-files",
    "stableAnchor": "h-6524ea4e5608",
    "startLine": 76,
    "endLine": 76,
    "textDigest": "a3208b26b1372ab85510c05c5533a099da6499599627ee62c5f61112d6d2daad",
    "sample": "5. Related Files",
    "sectionPayloadDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "followingBlockDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "identityFingerprint": "c53d4463919e9679327e17018df13f3d1a160485958f492eb74fdf69bc3fb9e8",
    "ancestry": [
      "Platform Documentation"
    ],
    "text": "## 5. Related Files",
    "sectionText": "## 5. Related Files\n\n| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [migration-authoring-rules.md](migration-authoring-rules.md) |\n| routes readers | [../reading-map.md](../reading-map.md) |\n| defines platform direction | [vision.md](vision.md) |\n| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| defines durable laws | [platform-foundations.md](platform-foundations.md) |\n| maps architecture | [architecture-map.md](architecture-map.md) |\n| maps component boundaries | [component-boundary.md](component-boundary.md) |\n| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |\n| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cf06097fa740bba9d230af78ec04463d"
}
```

## Entry claim_033f287bcaf95120784babf285217b96

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_033f287bcaf95120784babf285217b96",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "identityFingerprint": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "claimId": "claim_033f287bcaf95120784babf285217b96",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "identityFingerprint": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "claimId": "claim_033f287bcaf95120784babf285217b96",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24",
    "claimKind": "vision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 30,
    "endLine": 37,
    "textDigest": "9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24",
    "sample": "| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](",
    "identityFingerprint": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "ancestry": [
      "Platform Documentation",
      "1. Platform-wide Anchors"
    ],
    "text": "| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](../platform-foundations.md), [../work-item-lifecycle-vision.md](../work-item-lifecycle-vision.md), design discussions |\n| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent across simplified implementation slices | Documentation-system discussion, [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) |\n| [platform-foundations.md](platform-foundations.md) | Platform laws and durable constraints | [../platform-foundations.md](../platform-foundations.md), [../specs/platform-foundations.md](../specs/platform-foundations.md) |\n| [architecture-map.md](architecture-map.md) | Whole-system architecture map | [../architecture-map.md](../architecture-map.md) |\n| [component-boundary.md](component-boundary.md) | Layers, parent/child components, responsibilities, authority boundaries | [../architect/component-boundary/](../architect/component-boundary/) |\n| [../contracts/](../contracts/) | Cross-area contracts during migration | [../routing-handoff-contract.md](../routing-handoff-contract.md), [../contracts/](../contracts/) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 30,
    "endLine": 37,
    "textDigest": "9b4b3a19cc2e07dbd32a971403f26aa29034191bff4c65de59850183866d0e24",
    "sample": "| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](",
    "identityFingerprint": "d409eaa04d1cb9c9d10bd44060a68a74b3017c77c97bc1c795be9d8292dd48f2",
    "ancestry": [
      "Platform Documentation",
      "1. Platform-wide Anchors"
    ],
    "text": "| Target doc | Role | Current source during migration |\n|---|---|---|\n| [vision.md](vision.md) | Whole-platform mission, scope, non-scope, direction | [../platform-foundations.md](../platform-foundations.md), [../work-item-lifecycle-vision.md](../work-item-lifecycle-vision.md), design discussions |\n| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Whole-platform preserved intent across simplified implementation slices | Documentation-system discussion, [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) |\n| [platform-foundations.md](platform-foundations.md) | Platform laws and durable constraints | [../platform-foundations.md](../platform-foundations.md), [../specs/platform-foundations.md](../specs/platform-foundations.md) |\n| [architecture-map.md](architecture-map.md) | Whole-system architecture map | [../architecture-map.md](../architecture-map.md) |\n| [component-boundary.md](component-boundary.md) | Layers, parent/child components, responsibilities, authority boundaries | [../architect/component-boundary/](../architect/component-boundary/) |\n| [../contracts/](../contracts/) | Cross-area contracts during migration | [../routing-handoff-contract.md](../routing-handoff-contract.md), [../contracts/](../contracts/) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_033f287bcaf95120784babf285217b96"
}
```

## Entry claim_9a8cba990a73cf16af3dcf8310f73abb

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9a8cba990a73cf16af3dcf8310f73abb",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "identityFingerprint": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "claimId": "claim_9a8cba990a73cf16af3dcf8310f73abb",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "identityFingerprint": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "claimId": "claim_9a8cba990a73cf16af3dcf8310f73abb",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 43,
    "endLine": 53,
    "textDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
    "sample": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../",
    "identityFingerprint": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "ancestry": [
      "Platform Documentation",
      "2. Area Registry"
    ],
    "text": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 43,
    "endLine": 53,
    "textDigest": "3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2",
    "sample": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../",
    "identityFingerprint": "896d9599558aba040e27b445ccc216d46aa9a4920fba80c70b565df97a73fda5",
    "ancestry": [
      "Platform Documentation",
      "2. Area Registry"
    ],
    "text": "| Area | Current source during migration |\n|---|---|\n| `runner` | [../specs/runner.md](../specs/runner.md), runner architecture docs |\n| `work-state` | [../specs/work-state.md](../specs/work-state.md) |\n| [packaging-distribution](packaging-distribution/README.md) | [packaging-distribution/README.md](packaging-distribution/README.md), [../specs/distribution.md](../specs/distribution.md), [../distribution-vision.md](../distribution-vision.md), [../architect/packaging-distribution/](../architect/packaging-distribution/) |\n| [host-invocation-routing](host-invocation-routing/README.md) | [host-invocation-routing/README.md](host-invocation-routing/README.md), [../architect/host-invocation-routing/](../architect/host-invocation-routing/) |\n| [convention](convention/spec.md) | [convention/spec.md](convention/spec.md) — implemented executable naming and placement authority; no document-body health rules |\n| [agent-coordination](agent-coordination/README.md) | [agent-coordination/README.md](agent-coordination/README.md), [../architect/agent-coordination/](../architect/agent-coordination/), runner coordination specs |\n| `skills` | domain and skill docs under [../../domains/](../../domains/), [../../.agents/skills/](../../.agents/skills/), [../../plugins/fgOS/skills/](../../plugins/fgOS/skills/) |\n| `ui-spec` | [../ui-spec/](../ui-spec/) |\n| `documentation-system` | Full-horizon proposal: [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md); proposed active H1 migration plan: `plans/260925-documentation-authority-unification/plan.md`; implemented end-user registry foundation: `archive/plans/260825-1841-knowledge-registry/plan.md` |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9a8cba990a73cf16af3dcf8310f73abb"
}
```

## Entry claim_a5bbab017081b72bb8288cc898ad6a34

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_a5bbab017081b72bb8288cc898ad6a34",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "identityFingerprint": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "claimId": "claim_a5bbab017081b72bb8288cc898ad6a34",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "identityFingerprint": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "claimId": "claim_a5bbab017081b72bb8288cc898ad6a34",
    "sourceAnchor": "unheaded-block-8",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 67,
    "endLine": 74,
    "textDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "sample": "1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read thi",
    "identityFingerprint": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "ancestry": [
      "Platform Documentation",
      "4. How To Change Platform Docs"
    ],
    "text": "1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read this portal and the relevant area portal/spec.\n4. Read the relevant vision and intent-preservation ledger when the change\n   narrows, stages, or simplifies the full design.\n5. Use a discussion scratchpad for multi-round shaping.\n6. Promote settled content into the right canonical doc.\n7. Update links and verification pointers."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-8",
    "githubAnchor": "unheaded-block-8",
    "stableAnchor": "unheaded-block-8",
    "title": "Unheaded block 8",
    "startLine": 67,
    "endLine": 74,
    "textDigest": "da4f7e82c24a3f1253856b3e2c4a5f35447cc4e318e1e8a97e1ea525b1ec4f77",
    "sample": "1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read thi",
    "identityFingerprint": "253db54b9be8632069cb7ef2292554e5a4468d859c42d47591fe4d6a14fec513",
    "ancestry": [
      "Platform Documentation",
      "4. How To Change Platform Docs"
    ],
    "text": "1. Read `docs/doc-governance.md`.\n2. Read [migration-authoring-rules.md](migration-authoring-rules.md) and [documentation/switchboard.md](documentation/switchboard.md).\n3. Read this portal and the relevant area portal/spec.\n4. Read the relevant vision and intent-preservation ledger when the change\n   narrows, stages, or simplifies the full design.\n5. Use a discussion scratchpad for multi-round shaping.\n6. Promote settled content into the right canonical doc.\n7. Update links and verification pointers."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_a5bbab017081b72bb8288cc898ad6a34"
}
```

## Entry claim_c47458906c78c5d39b52a43ce5635a0a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_c47458906c78c5d39b52a43ce5635a0a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "identityFingerprint": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "claimId": "claim_c47458906c78c5d39b52a43ce5635a0a",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/README.md",
    "unitDigest": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "identityFingerprint": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "claimId": "claim_c47458906c78c5d39b52a43ce5635a0a",
    "sourceAnchor": "unheaded-block-9",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 78,
    "endLine": 91,
    "textDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "sample": "| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.",
    "identityFingerprint": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "ancestry": [
      "Platform Documentation",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [migration-authoring-rules.md](migration-authoring-rules.md) |\n| routes readers | [../reading-map.md](../reading-map.md) |\n| defines platform direction | [vision.md](vision.md) |\n| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| defines durable laws | [platform-foundations.md](platform-foundations.md) |\n| maps architecture | [architecture-map.md](architecture-map.md) |\n| maps component boundaries | [component-boundary.md](component-boundary.md) |\n| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |\n| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-9",
    "githubAnchor": "unheaded-block-9",
    "stableAnchor": "unheaded-block-9",
    "title": "Unheaded block 9",
    "startLine": 78,
    "endLine": 91,
    "textDigest": "40d6cd5365cec9a0d45ff7f795357ecc2fd1bdf95b2dd6a54b492452abef2506",
    "sample": "| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.",
    "identityFingerprint": "05a8171cf1218e2f7b373b28c592833f4f78f2b4f2647b19528647164116624b",
    "ancestry": [
      "Platform Documentation",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| governs docs | [governance.md](governance.md) |\n| operative transitional switchboard | [documentation/switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [migration-authoring-rules.md](migration-authoring-rules.md) |\n| routes readers | [../reading-map.md](../reading-map.md) |\n| defines platform direction | [vision.md](vision.md) |\n| preserves platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| defines durable laws | [platform-foundations.md](platform-foundations.md) |\n| maps architecture | [architecture-map.md](architecture-map.md) |\n| maps component boundaries | [component-boundary.md](component-boundary.md) |\n| preserves deferred documentation-system architecture | [intent-preservation-ledger.md](intent-preservation-ledger.md) |\n| proposes full documentation operating system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) |\n| plans near-term authority unification | `plans/260925-documentation-authority-unification/plan.md` |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c47458906c78c5d39b52a43ce5635a0a"
}
```

## Entry claim_e5a7b0cef10e9078102b4afd7db27d2d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e5a7b0cef10e9078102b4afd7db27d2d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/README.md",
    "unitDigest": "cbcde749cb9db3cd219892e379077ca0aa5bb08ecb83cf7f47ca2cc8b574bb41",
    "identityFingerprint": "94142f4b014a68b4d747026224a49ad9d312aaf53f5056d656b1cd32b7fac930",
    "claimId": "claim_e5a7b0cef10e9078102b4afd7db27d2d",
    "sourceAnchor": "current-execution",
    "unitKind": "heading",
    "sourceUnitDigest": "c05934d194565d3d068757e93944ec9d8bf3eade5dcecb8d4d2f13cd222e5341",
    "claimKind": "navigation",
    "status": "current",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "7e5101cbc17ab09ef129734f832558b4b7a8fd9cacd62a5ec9605f02532f3d25",
      "toUnitDigest": "cbcde749cb9db3cd219892e379077ca0aa5bb08ecb83cf7f47ca2cc8b574bb41",
      "fromSourceUnitDigest": "03ab74fcf4a238c52389db9c3b5fd061176910baebf9a5e7a609b6e93907034a",
      "toSourceUnitDigest": "c05934d194565d3d068757e93944ec9d8bf3eade5dcecb8d4d2f13cd222e5341"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/README.md",
    "unitDigest": "cbcde749cb9db3cd219892e379077ca0aa5bb08ecb83cf7f47ca2cc8b574bb41",
    "identityFingerprint": "94142f4b014a68b4d747026224a49ad9d312aaf53f5056d656b1cd32b7fac930",
    "claimId": "claim_e5a7b0cef10e9078102b4afd7db27d2d",
    "sourceAnchor": "current-execution",
    "unitKind": "heading",
    "sourceUnitDigest": "c05934d194565d3d068757e93944ec9d8bf3eade5dcecb8d4d2f13cd222e5341",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Execution",
    "anchor": "current-execution",
    "githubAnchor": "current-execution",
    "stableAnchor": "h-a3e542a692e5",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "c05934d194565d3d068757e93944ec9d8bf3eade5dcecb8d4d2f13cd222e5341",
    "sample": "Current Execution",
    "sectionPayloadDigest": "e0686531edeb749049bb999048daa2ad7242dd53c03655437e743f2ea4b4e72c",
    "followingBlockDigest": "57931038d3c10553faa32c9affb85a109a6c7e42817ed1cdd64c5a9b76d41998",
    "identityFingerprint": "94142f4b014a68b4d747026224a49ad9d312aaf53f5056d656b1cd32b7fac930",
    "ancestry": [
      "Agent Coordination"
    ],
    "text": "## Current Execution",
    "sectionText": "## Current Execution\n\nThe former coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. `coordination` is not a current public CLI verb; the actual machine-readable `--help --json` manifest is the CLI inventory.\n\nCollaborationPattern owns Unit collaboration patterns in `src/runner/execution/patterns/index.mjs`; Unit execution enters through `src/runner/execution/run.mjs`. Workflow execution belongs to `src/workflow/runner.mjs` and its Unit execution-core integration.\nThe surviving Assignment/Run dispatch chain is also current: Assignment building, DispatchPlan compilation, governed execution and RunResult normalization are owned by `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`.\n\nRead [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities.\n\n> **Ghi chú (2026-10-14, decision 0062 trong `docs/specs/runner.md`):** các cửa dispatch thô mà tài liệu, proof và roadmap trong thư mục này nhắc tới — `dispatch execute` (cả `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` — đã bị xoá. Việc chạy qua `fgos run \"<prompt>\"` / `fgos run --unit` hoặc `fgos workflow start`. Các bản ghi verification/proof giữ nguyên lệnh đã chạy lúc đó, như bằng chứng lịch sử."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Execution",
    "anchor": "current-execution",
    "githubAnchor": "current-execution",
    "stableAnchor": "h-a3e542a692e5",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "c05934d194565d3d068757e93944ec9d8bf3eade5dcecb8d4d2f13cd222e5341",
    "sample": "Current Execution",
    "sectionPayloadDigest": "e0686531edeb749049bb999048daa2ad7242dd53c03655437e743f2ea4b4e72c",
    "followingBlockDigest": "57931038d3c10553faa32c9affb85a109a6c7e42817ed1cdd64c5a9b76d41998",
    "identityFingerprint": "94142f4b014a68b4d747026224a49ad9d312aaf53f5056d656b1cd32b7fac930",
    "ancestry": [
      "Agent Coordination"
    ],
    "text": "## Current Execution",
    "sectionText": "## Current Execution\n\nThe former coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. `coordination` is not a current public CLI verb; the actual machine-readable `--help --json` manifest is the CLI inventory.\n\nCollaborationPattern owns Unit collaboration patterns in `src/runner/execution/patterns/index.mjs`; Unit execution enters through `src/runner/execution/run.mjs`. Workflow execution belongs to `src/workflow/runner.mjs` and its Unit execution-core integration.\nThe surviving Assignment/Run dispatch chain is also current: Assignment building, DispatchPlan compilation, governed execution and RunResult normalization are owned by `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`.\n\nRead [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities.\n\n> **Ghi chú (2026-10-14, decision 0062 trong `docs/specs/runner.md`):** các cửa dispatch thô mà tài liệu, proof và roadmap trong thư mục này nhắc tới — `dispatch execute` (cả `--contract`, `--assignment`), `dispatch log`, `dispatch fanout-batch` — đã bị xoá. Việc chạy qua `fgos run \"<prompt>\"` / `fgos run --unit` hoặc `fgos workflow start`. Các bản ghi verification/proof giữ nguyên lệnh đã chạy lúc đó, như bằng chứng lịch sử."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e5a7b0cef10e9078102b4afd7db27d2d"
}
```

## Entry claim_28bb13fcd6ab3b0d84e00ef54f55865c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_28bb13fcd6ab3b0d84e00ef54f55865c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/README.md",
    "unitDigest": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "identityFingerprint": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "claimId": "claim_28bb13fcd6ab3b0d84e00ef54f55865c",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "77357ff684f5dd2c24689e0372bc9dac0ae9bb6377ce2f819c380d587d9c84af",
    "claimKind": "navigation",
    "status": "current",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/README.md",
    "unitDigest": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "identityFingerprint": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "claimId": "claim_28bb13fcd6ab3b0d84e00ef54f55865c",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "77357ff684f5dd2c24689e0372bc9dac0ae9bb6377ce2f819c380d587d9c84af",
    "claimKind": "navigation",
    "status": "current"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 31,
    "endLine": 31,
    "textDigest": "77357ff684f5dd2c24689e0372bc9dac0ae9bb6377ce2f819c380d587d9c84af",
    "sample": "Read [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol ",
    "identityFingerprint": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "ancestry": [
      "Agent Coordination",
      "Current Execution"
    ],
    "text": "Read [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 31,
    "endLine": 31,
    "textDigest": "77357ff684f5dd2c24689e0372bc9dac0ae9bb6377ce2f819c380d587d9c84af",
    "sample": "Read [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol ",
    "identityFingerprint": "f74838f5b77547382454dcc419fa46dc3eeff4167f5ea83e29142aa1e2b18798",
    "ancestry": [
      "Agent Coordination",
      "Current Execution"
    ],
    "text": "Read [the runner spec](../runner/spec.md) for the current execution contract, then [this area's current-owner map](spec.md). Do not treat CoordinationSession, CoordinationProtocol or FlowDefinition in the preserved documents as current implemented engine entities."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_28bb13fcd6ab3b0d84e00ef54f55865c"
}
```

## Entry claim_d38ae3f6caea59dfde5e57e0dba7a492

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d38ae3f6caea59dfde5e57e0dba7a492",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "unitDigest": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "identityFingerprint": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "claimId": "claim_d38ae3f6caea59dfde5e57e0dba7a492",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "edf121e111ee8686f6d72c685ed19b25c16bb8087658d35df7ebb53566bdcf72",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "unitDigest": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "identityFingerprint": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "claimId": "claim_d38ae3f6caea59dfde5e57e0dba7a492",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "edf121e111ee8686f6d72c685ed19b25c16bb8087658d35df7ebb53566bdcf72",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 78,
    "endLine": 79,
    "textDigest": "edf121e111ee8686f6d72c685ed19b25c16bb8087658d35df7ebb53566bdcf72",
    "sample": "Read the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries.",
    "identityFingerprint": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "ancestry": [
      "Evidence And Result Architecture",
      "Visibility Boundary"
    ],
    "text": "Read the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 78,
    "endLine": 79,
    "textDigest": "edf121e111ee8686f6d72c685ed19b25c16bb8087658d35df7ebb53566bdcf72",
    "sample": "Read the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries.",
    "identityFingerprint": "2bbda40b144fb349ae353117c55f76fc481d3378f2b2ac26c367ab5940de4e0a",
    "ancestry": [
      "Evidence And Result Architecture",
      "Visibility Boundary"
    ],
    "text": "Read the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d38ae3f6caea59dfde5e57e0dba7a492"
}
```

## Entry claim_61ccfef5e885afd4b29dbba4f6b4bf0c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_61ccfef5e885afd4b29dbba4f6b4bf0c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "unitDigest": "845a6fd574e56ab50ebb637e625ea6bf08e23b07ed003dd9c0d5494fc993e23b",
    "identityFingerprint": "393de9337d7c72330f6e4f3c60db7241a5d7d5e09d02d31f0c0b46ddeae9803b",
    "claimId": "claim_61ccfef5e885afd4b29dbba4f6b4bf0c",
    "sourceAnchor": "visibility-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "1e36b97aa12e851cf97ade9c39141632466db8ee2983a3d54e7bd7c3585d9f07",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "bff56c00a5e604ad92e6a4c38a6a506543351cf8749a9439f932b469a07d6174",
      "toUnitDigest": "845a6fd574e56ab50ebb637e625ea6bf08e23b07ed003dd9c0d5494fc993e23b",
      "fromSourceUnitDigest": "a1da561639818dab01402d79fcfe133df897986a888ab41692ed697719d470c7",
      "toSourceUnitDigest": "1e36b97aa12e851cf97ade9c39141632466db8ee2983a3d54e7bd7c3585d9f07"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "unitDigest": "845a6fd574e56ab50ebb637e625ea6bf08e23b07ed003dd9c0d5494fc993e23b",
    "identityFingerprint": "393de9337d7c72330f6e4f3c60db7241a5d7d5e09d02d31f0c0b46ddeae9803b",
    "claimId": "claim_61ccfef5e885afd4b29dbba4f6b4bf0c",
    "sourceAnchor": "visibility-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "1e36b97aa12e851cf97ade9c39141632466db8ee2983a3d54e7bd7c3585d9f07",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Visibility Boundary",
    "anchor": "visibility-boundary",
    "githubAnchor": "visibility-boundary",
    "stableAnchor": "h-1c60e62b5e99",
    "startLine": 73,
    "endLine": 73,
    "textDigest": "1e36b97aa12e851cf97ade9c39141632466db8ee2983a3d54e7bd7c3585d9f07",
    "sample": "Visibility Boundary",
    "sectionPayloadDigest": "072509d7ab8d3c5c64d9614f05f2844fcdf76f5a02d38e5045c40a243784ae4a",
    "followingBlockDigest": "208e75132fe946d028499340f14b866cfccb9bc8929bc94d35b8ad4e56b9289f",
    "identityFingerprint": "393de9337d7c72330f6e4f3c60db7241a5d7d5e09d02d31f0c0b46ddeae9803b",
    "ancestry": [
      "Evidence And Result Architecture"
    ],
    "text": "## Visibility Boundary",
    "sectionText": "## Visibility Boundary\n\nHerdr pane state, terminal text, quietness, and process appearance are useful\ndiagnostics only. They cannot replace structured runtime and evidence records.\n\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Visibility Boundary",
    "anchor": "visibility-boundary",
    "githubAnchor": "visibility-boundary",
    "stableAnchor": "h-1c60e62b5e99",
    "startLine": 73,
    "endLine": 73,
    "textDigest": "1e36b97aa12e851cf97ade9c39141632466db8ee2983a3d54e7bd7c3585d9f07",
    "sample": "Visibility Boundary",
    "sectionPayloadDigest": "072509d7ab8d3c5c64d9614f05f2844fcdf76f5a02d38e5045c40a243784ae4a",
    "followingBlockDigest": "208e75132fe946d028499340f14b866cfccb9bc8929bc94d35b8ad4e56b9289f",
    "identityFingerprint": "393de9337d7c72330f6e4f3c60db7241a5d7d5e09d02d31f0c0b46ddeae9803b",
    "ancestry": [
      "Evidence And Result Architecture"
    ],
    "text": "## Visibility Boundary",
    "sectionText": "## Visibility Boundary\n\nHerdr pane state, terminal text, quietness, and process appearance are useful\ndiagnostics only. They cannot replace structured runtime and evidence records.\n\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the consuming execution and delivery boundaries."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_61ccfef5e885afd4b29dbba4f6b4bf0c"
}
```

## Entry claim_13ba760cbd7bfff5dc1cf25ecf5cee25

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_13ba760cbd7bfff5dc1cf25ecf5cee25",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "unitDigest": "69c5e3c4aa995ff096a6449a11460b442718fb579ddc7901ff0735d6da34d5ee",
    "identityFingerprint": "d384abb972e4290f0bd5f5e5426320cb7e0dbbbff7e1062682ad58cc583edbac",
    "claimId": "claim_13ba760cbd7bfff5dc1cf25ecf5cee25",
    "sourceAnchor": "7-agent-facing-contract",
    "unitKind": "heading",
    "sourceUnitDigest": "0304740f98bdab3df44c5b9b88de64409ad96c2bd94bc3ab41aaa4afbbc2fe68",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "065ce0994bc713cf2f3226aeec18d02e0de6b77a4fd461c19594a532e67a2c47",
      "toUnitDigest": "69c5e3c4aa995ff096a6449a11460b442718fb579ddc7901ff0735d6da34d5ee",
      "fromSourceUnitDigest": "dbb12451e148155e32f46eda7c2f8ca300e02705e53c47d359353c7e7df18f27",
      "toSourceUnitDigest": "0304740f98bdab3df44c5b9b88de64409ad96c2bd94bc3ab41aaa4afbbc2fe68"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "unitDigest": "69c5e3c4aa995ff096a6449a11460b442718fb579ddc7901ff0735d6da34d5ee",
    "identityFingerprint": "d384abb972e4290f0bd5f5e5426320cb7e0dbbbff7e1062682ad58cc583edbac",
    "claimId": "claim_13ba760cbd7bfff5dc1cf25ecf5cee25",
    "sourceAnchor": "7-agent-facing-contract",
    "unitKind": "heading",
    "sourceUnitDigest": "0304740f98bdab3df44c5b9b88de64409ad96c2bd94bc3ab41aaa4afbbc2fe68",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Agent-Facing Contract",
    "anchor": "7-agent-facing-contract",
    "githubAnchor": "7-agent-facing-contract",
    "stableAnchor": "h-bfb8d2a1c009",
    "startLine": 168,
    "endLine": 168,
    "textDigest": "0304740f98bdab3df44c5b9b88de64409ad96c2bd94bc3ab41aaa4afbbc2fe68",
    "sample": "7. Agent-Facing Contract",
    "sectionPayloadDigest": "c08ddc1aba4310ba00be33a8df3d66d638d52425ccc77cafe695645671793f24",
    "followingBlockDigest": "fb6bcd9ac99360a3573de37bb2a970a018a0c2af80fadfe79010835f74a62b70",
    "identityFingerprint": "d384abb972e4290f0bd5f5e5426320cb7e0dbbbff7e1062682ad58cc583edbac",
    "ancestry": [
      "Runtime Recovery And Work Continuity"
    ],
    "text": "## 7. Agent-Facing Contract",
    "sectionText": "## 7. Agent-Facing Contract\n\nThe current door is `fgos dispatch recover <runId>`, without `--action` for\nread-only observation. It builds a snapshot of the Run, visibility, outbox,\ncontroller evidence, real control epoch and settled signal, then returns a\nrecommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;\nthe default is defined by the CLI/use case, not by a coordination-session scan.\n\nResume requires explicit non-fresh driver-liveness evidence; fresh or unknown\nfreshness parks. Reassignment requires replacement-authority evidence naming a\ndriver, read from controller-owned state, never worker-writable outbox claims.\nUnknown evidence parks; a settled Run has nothing to recover. A recommendation\ncontains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,\n`action`, `expiresAt` and `reason`; the default lifetime is five minutes.\n\nApply uses the same door with `--action`, `--expected-snapshot`,\n`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.\nIt re-reads facts, checks action-key binding, snapshot, epoch, expiry and\npresent legality, then acquires real Run control and checks settlement again.\nStale/expired plans, missing authority and held live control are refused or\nparked rather than overridden. Repeating a consumed action key returns the\nrecorded `already-applied` outcome.\n\nSuccessful apply records the recovery command, updates the control-epoch\nprojection and attempts the applicable dispatch-claim clear. It does not itself\nlaunch a replacement worker, close a session or advance a Workflow. Dormant\nsession-ownership checks still refuse `resume-driver` for old session-owned\nAssignments; this is not a claim that the retired coordination door exists.\n\nImplementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the wider execution boundary; recovery here does not own Work lifecycle."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "7. Agent-Facing Contract",
    "anchor": "7-agent-facing-contract",
    "githubAnchor": "7-agent-facing-contract",
    "stableAnchor": "h-bfb8d2a1c009",
    "startLine": 168,
    "endLine": 168,
    "textDigest": "0304740f98bdab3df44c5b9b88de64409ad96c2bd94bc3ab41aaa4afbbc2fe68",
    "sample": "7. Agent-Facing Contract",
    "sectionPayloadDigest": "c08ddc1aba4310ba00be33a8df3d66d638d52425ccc77cafe695645671793f24",
    "followingBlockDigest": "fb6bcd9ac99360a3573de37bb2a970a018a0c2af80fadfe79010835f74a62b70",
    "identityFingerprint": "d384abb972e4290f0bd5f5e5426320cb7e0dbbbff7e1062682ad58cc583edbac",
    "ancestry": [
      "Runtime Recovery And Work Continuity"
    ],
    "text": "## 7. Agent-Facing Contract",
    "sectionText": "## 7. Agent-Facing Contract\n\nThe current door is `fgos dispatch recover <runId>`, without `--action` for\nread-only observation. It builds a snapshot of the Run, visibility, outbox,\ncontroller evidence, real control epoch and settled signal, then returns a\nrecommendation, `needs-input` or `park`. The intent is `resume` or `reassign`;\nthe default is defined by the CLI/use case, not by a coordination-session scan.\n\nResume requires explicit non-fresh driver-liveness evidence; fresh or unknown\nfreshness parks. Reassignment requires replacement-authority evidence naming a\ndriver, read from controller-owned state, never worker-writable outbox claims.\nUnknown evidence parks; a settled Run has nothing to recover. A recommendation\ncontains `snapshotHash`, `expectedControlEpoch`, `actionKey`, `evidenceIds`,\n`action`, `expiresAt` and `reason`; the default lifetime is five minutes.\n\nApply uses the same door with `--action`, `--expected-snapshot`,\n`--expected-control-epoch`, `--expected-expires-at` and `--action-key`.\nIt re-reads facts, checks action-key binding, snapshot, epoch, expiry and\npresent legality, then acquires real Run control and checks settlement again.\nStale/expired plans, missing authority and held live control are refused or\nparked rather than overridden. Repeating a consumed action key returns the\nrecorded `already-applied` outcome.\n\nSuccessful apply records the recovery command, updates the control-epoch\nprojection and attempts the applicable dispatch-claim clear. It does not itself\nlaunch a replacement worker, close a session or advance a Workflow. Dormant\nsession-ownership checks still refuse `resume-driver` for old session-owned\nAssignments; this is not a claim that the retired coordination door exists.\n\nImplementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the wider execution boundary; recovery here does not own Work lifecycle."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_13ba760cbd7bfff5dc1cf25ecf5cee25"
}
```

## Entry claim_ebc31ba49493b62466bd711265e0bec0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ebc31ba49493b62466bd711265e0bec0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "unitDigest": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "identityFingerprint": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "claimId": "claim_ebc31ba49493b62466bd711265e0bec0",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "116e4c580af27f2a35b6d289d1ae392edc990267c1938f142a4a9b2be29f2bb8",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/runtime-recovery-design.md",
    "unitDigest": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "identityFingerprint": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "claimId": "claim_ebc31ba49493b62466bd711265e0bec0",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "116e4c580af27f2a35b6d289d1ae392edc990267c1938f142a4a9b2be29f2bb8",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 197,
    "endLine": 200,
    "textDigest": "116e4c580af27f2a35b6d289d1ae392edc990267c1938f142a4a9b2be29f2bb8",
    "sample": "Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.m",
    "identityFingerprint": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "ancestry": [
      "Runtime Recovery And Work Continuity",
      "7. Agent-Facing Contract"
    ],
    "text": "Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the wider execution boundary; recovery here does not own Work lifecycle."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-24",
    "githubAnchor": "unheaded-block-24",
    "stableAnchor": "unheaded-block-24",
    "title": "Unheaded block 24",
    "startLine": 197,
    "endLine": 200,
    "textDigest": "116e4c580af27f2a35b6d289d1ae392edc990267c1938f142a4a9b2be29f2bb8",
    "sample": "Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.m",
    "identityFingerprint": "5bc40aa402c4a2fd93257f59f001a4df69121b580f4e7baa513e2cc5d7a2a93c",
    "ancestry": [
      "Runtime Recovery And Work Continuity",
      "7. Agent-Facing Contract"
    ],
    "text": "Implementation evidence: `src/runner/dispatch/recovery-planner.mjs:118-173,\n243-316,319-361` and `src/verbs/dispatch/recover.mjs:95-132,266-408`.\nRead the [area portal](../README.md) and [runner spec](../../runner/spec.md)\nfor the wider execution boundary; recovery here does not own Work lifecycle."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ebc31ba49493b62466bd711265e0bec0"
}
```

## Entry claim_05168000517d90873aa6340f004b28ad

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_05168000517d90873aa6340f004b28ad",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/work-integration.md",
    "unitDigest": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "identityFingerprint": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "claimId": "claim_05168000517d90873aa6340f004b28ad",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cf74e4749cf2b09a3b679fe250497523b3e33a8121f6f47d86903f5d3f890286",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/work-integration.md",
    "unitDigest": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "identityFingerprint": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "claimId": "claim_05168000517d90873aa6340f004b28ad",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cf74e4749cf2b09a3b679fe250497523b3e33a8121f6f47d86903f5d3f890286",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 86,
    "endLine": 86,
    "textDigest": "cf74e4749cf2b09a3b679fe250497523b3e33a8121f6f47d86903f5d3f890286",
    "sample": "See the [area portal](../README.md) and [runner spec](../../runner/spec.md).",
    "identityFingerprint": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "ancestry": [
      "Work Integration Boundaries",
      "Work Driver Handoff To Dispatch"
    ],
    "text": "See the [area portal](../README.md) and [runner spec](../../runner/spec.md)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 86,
    "endLine": 86,
    "textDigest": "cf74e4749cf2b09a3b679fe250497523b3e33a8121f6f47d86903f5d3f890286",
    "sample": "See the [area portal](../README.md) and [runner spec](../../runner/spec.md).",
    "identityFingerprint": "b4cef1fe857801bf7905061b2fcdf024a1e89dfc237cf4ed29e50eb15018b534",
    "ancestry": [
      "Work Integration Boundaries",
      "Work Driver Handoff To Dispatch"
    ],
    "text": "See the [area portal](../README.md) and [runner spec](../../runner/spec.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_05168000517d90873aa6340f004b28ad"
}
```

## Entry claim_3e77ba7d49e3be7af271cdc24bdc5b0b

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_3e77ba7d49e3be7af271cdc24bdc5b0b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/work-integration.md",
    "unitDigest": "b7909edbeff5635d11fb2b9ece67612a74800207d44e4e8ac5b022a6709957a2",
    "identityFingerprint": "2d9bd530d3891893afdc1702cbc335f15fe097672f10896c9c394e8e0ddb47d6",
    "claimId": "claim_3e77ba7d49e3be7af271cdc24bdc5b0b",
    "sourceAnchor": "work-driver-handoff-to-dispatch",
    "unitKind": "heading",
    "sourceUnitDigest": "ef0e26efeb3a17d765d289a523eaf0d5cbb2ca31b5fb14ea3f55f5e067fe53dc",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "16cbd84e13b7882c47bd95063ed65dada680f9992cabe93dfbd0f469789c2e70",
      "toUnitDigest": "b7909edbeff5635d11fb2b9ece67612a74800207d44e4e8ac5b022a6709957a2",
      "fromSourceUnitDigest": "09b00f38b9eaeda6bc99952065b356e088123b7b96365c8829d28aab5b11ceb4",
      "toSourceUnitDigest": "ef0e26efeb3a17d765d289a523eaf0d5cbb2ca31b5fb14ea3f55f5e067fe53dc"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/architecture/work-integration.md",
    "unitDigest": "b7909edbeff5635d11fb2b9ece67612a74800207d44e4e8ac5b022a6709957a2",
    "identityFingerprint": "2d9bd530d3891893afdc1702cbc335f15fe097672f10896c9c394e8e0ddb47d6",
    "claimId": "claim_3e77ba7d49e3be7af271cdc24bdc5b0b",
    "sourceAnchor": "work-driver-handoff-to-dispatch",
    "unitKind": "heading",
    "sourceUnitDigest": "ef0e26efeb3a17d765d289a523eaf0d5cbb2ca31b5fb14ea3f55f5e067fe53dc",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Work Driver Handoff To Dispatch",
    "anchor": "work-driver-handoff-to-dispatch",
    "githubAnchor": "work-driver-handoff-to-dispatch",
    "stableAnchor": "h-85b4c001501d",
    "startLine": 74,
    "endLine": 74,
    "textDigest": "ef0e26efeb3a17d765d289a523eaf0d5cbb2ca31b5fb14ea3f55f5e067fe53dc",
    "sample": "Work Driver Handoff To Dispatch",
    "sectionPayloadDigest": "7f950170b4d49d6b0e15d098b613a0191d10e110ab56999f2542fbc97625a320",
    "followingBlockDigest": "e093f09bae75a474ee2eb37e99c73b28c85877efb9ef6331ed1f375386a0f7a2",
    "identityFingerprint": "2d9bd530d3891893afdc1702cbc335f15fe097672f10896c9c394e8e0ddb47d6",
    "ancestry": [
      "Work Integration Boundaries"
    ],
    "text": "## Work Driver Handoff To Dispatch",
    "sectionText": "## Work Driver Handoff To Dispatch\n\nThe Work driver supplies the task target/capability, policy inputs and provenance\nto the governed execution door. It does not call `resolveExecutorConfig` to\nbypass dispatch planning, governance or confinement. Dispatch resolves execution\nconfiguration; the Work driver retains the subsequent lifecycle decision.\n\nThe current policy resolver accepts caller `policyInputs` (with its existing\n`cliOverride` alias) and records effective-policy provenance. This is distinct\nfrom the proposed `DispatchRequest` schema: a design request name must not be\ntreated as an exported normalizer or an additional Work write door.\n\nSee the [area portal](../README.md) and [runner spec](../../runner/spec.md)."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Work Driver Handoff To Dispatch",
    "anchor": "work-driver-handoff-to-dispatch",
    "githubAnchor": "work-driver-handoff-to-dispatch",
    "stableAnchor": "h-85b4c001501d",
    "startLine": 74,
    "endLine": 74,
    "textDigest": "ef0e26efeb3a17d765d289a523eaf0d5cbb2ca31b5fb14ea3f55f5e067fe53dc",
    "sample": "Work Driver Handoff To Dispatch",
    "sectionPayloadDigest": "7f950170b4d49d6b0e15d098b613a0191d10e110ab56999f2542fbc97625a320",
    "followingBlockDigest": "e093f09bae75a474ee2eb37e99c73b28c85877efb9ef6331ed1f375386a0f7a2",
    "identityFingerprint": "2d9bd530d3891893afdc1702cbc335f15fe097672f10896c9c394e8e0ddb47d6",
    "ancestry": [
      "Work Integration Boundaries"
    ],
    "text": "## Work Driver Handoff To Dispatch",
    "sectionText": "## Work Driver Handoff To Dispatch\n\nThe Work driver supplies the task target/capability, policy inputs and provenance\nto the governed execution door. It does not call `resolveExecutorConfig` to\nbypass dispatch planning, governance or confinement. Dispatch resolves execution\nconfiguration; the Work driver retains the subsequent lifecycle decision.\n\nThe current policy resolver accepts caller `policyInputs` (with its existing\n`cliOverride` alias) and records effective-policy provenance. This is distinct\nfrom the proposed `DispatchRequest` schema: a design request name must not be\ntreated as an exported normalizer or an additional Work write door.\n\nSee the [area portal](../README.md) and [runner spec](../../runner/spec.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_3e77ba7d49e3be7af271cdc24bdc5b0b"
}
```

## Entry claim_06f1e2385c0487b7256aff419d115abf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_06f1e2385c0487b7256aff419d115abf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "unitDigest": "d08868b15e8a86200a3894317b1039afa30b71f18896c00a49358b533b381428",
    "identityFingerprint": "8c5e6d224280c83ae8a4b10ccdb5d13998958054b21d7f2d82ab3b089d19cb50",
    "claimId": "claim_06f1e2385c0487b7256aff419d115abf",
    "sourceAnchor": "current-scope",
    "unitKind": "heading",
    "sourceUnitDigest": "1e6e6ec09e02bf511b2c53aa7dd36d2a73ebe057d3b2411c988b8cdf89024e89",
    "claimKind": "decision",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "61cb8460489d1712e0bf13dcdc9b92d55c528f0bfb87fb83559681223b9642ba",
      "toUnitDigest": "d08868b15e8a86200a3894317b1039afa30b71f18896c00a49358b533b381428",
      "fromSourceUnitDigest": "e5a1b146a6a0471b3710e7e7bca0c86d4f1d1493fdb972e9feff3fd9138ec6a6",
      "toSourceUnitDigest": "1e6e6ec09e02bf511b2c53aa7dd36d2a73ebe057d3b2411c988b8cdf89024e89"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "unitDigest": "d08868b15e8a86200a3894317b1039afa30b71f18896c00a49358b533b381428",
    "identityFingerprint": "8c5e6d224280c83ae8a4b10ccdb5d13998958054b21d7f2d82ab3b089d19cb50",
    "claimId": "claim_06f1e2385c0487b7256aff419d115abf",
    "sourceAnchor": "current-scope",
    "unitKind": "heading",
    "sourceUnitDigest": "1e6e6ec09e02bf511b2c53aa7dd36d2a73ebe057d3b2411c988b8cdf89024e89",
    "claimKind": "decision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Scope",
    "anchor": "current-scope",
    "githubAnchor": "current-scope",
    "stableAnchor": "h-4d275f579dca",
    "startLine": 21,
    "endLine": 21,
    "textDigest": "1e6e6ec09e02bf511b2c53aa7dd36d2a73ebe057d3b2411c988b8cdf89024e89",
    "sample": "Current Scope",
    "sectionPayloadDigest": "69dfa91725dde94297d4ccf4fa3bb0488490e6966af2f2fe775202814d5e84fe",
    "followingBlockDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "identityFingerprint": "8c5e6d224280c83ae8a4b10ccdb5d13998958054b21d7f2d82ab3b089d19cb50",
    "ancestry": [
      "ADR-003: Separate Assignment, Run, And RunResult"
    ],
    "text": "## Current Scope",
    "sectionText": "## Current Scope\n\nThis candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md).\n\nThe normalizer takes distinct Assignment and Run identifiers; Unit execution identity and round are separate inputs. Evidence: `src/runner/dispatch/run-result.mjs:350-355`."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Scope",
    "anchor": "current-scope",
    "githubAnchor": "current-scope",
    "stableAnchor": "h-4d275f579dca",
    "startLine": 21,
    "endLine": 21,
    "textDigest": "1e6e6ec09e02bf511b2c53aa7dd36d2a73ebe057d3b2411c988b8cdf89024e89",
    "sample": "Current Scope",
    "sectionPayloadDigest": "69dfa91725dde94297d4ccf4fa3bb0488490e6966af2f2fe775202814d5e84fe",
    "followingBlockDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "identityFingerprint": "8c5e6d224280c83ae8a4b10ccdb5d13998958054b21d7f2d82ab3b089d19cb50",
    "ancestry": [
      "ADR-003: Separate Assignment, Run, And RunResult"
    ],
    "text": "## Current Scope",
    "sectionText": "## Current Scope\n\nThis candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md).\n\nThe normalizer takes distinct Assignment and Run identifiers; Unit execution identity and round are separate inputs. Evidence: `src/runner/dispatch/run-result.mjs:350-355`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_06f1e2385c0487b7256aff419d115abf"
}
```

## Entry claim_f82f42c39a5c322062adaa3b90646a66

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f82f42c39a5c322062adaa3b90646a66",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "unitDigest": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "claimId": "claim_f82f42c39a5c322062adaa3b90646a66",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "claimKind": "decision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-003-assignment-run-runresult-separation.md",
    "unitDigest": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "claimId": "claim_f82f42c39a5c322062adaa3b90646a66",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "claimKind": "decision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "sample": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runne",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "ancestry": [
      "ADR-003: Separate Assignment, Run, And RunResult",
      "Current Scope"
    ],
    "text": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "sample": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runne",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "ancestry": [
      "ADR-003: Separate Assignment, Run, And RunResult",
      "Current Scope"
    ],
    "text": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f82f42c39a5c322062adaa3b90646a66"
}
```

## Entry claim_eefd21e417ee3e32c356caf5759b8166

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_eefd21e417ee3e32c356caf5759b8166",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "unitDigest": "700f957b6b88a6130988c038ac9d322abd1aee5b600d192cfd10eee08abc36b8",
    "identityFingerprint": "02cdd9494ce44b7a00c73e6952e91237fdae7ed6ee17fde2a3a29a637d7f044a",
    "claimId": "claim_eefd21e417ee3e32c356caf5759b8166",
    "sourceAnchor": "current-scope",
    "unitKind": "heading",
    "sourceUnitDigest": "83370882ceae06bff62a3f0b1debbf065c551c18181f316685b83db0455c54e7",
    "claimKind": "decision",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "8f52fa068f29b9fa266a32f439848fa0495de2e08de5fe9039691e7c74fc8a6c",
      "toUnitDigest": "700f957b6b88a6130988c038ac9d322abd1aee5b600d192cfd10eee08abc36b8",
      "fromSourceUnitDigest": "834b2ab0c97f45112bcdf72452c7b653418d07318d386b3d02e091731a449990",
      "toSourceUnitDigest": "83370882ceae06bff62a3f0b1debbf065c551c18181f316685b83db0455c54e7"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "unitDigest": "700f957b6b88a6130988c038ac9d322abd1aee5b600d192cfd10eee08abc36b8",
    "identityFingerprint": "02cdd9494ce44b7a00c73e6952e91237fdae7ed6ee17fde2a3a29a637d7f044a",
    "claimId": "claim_eefd21e417ee3e32c356caf5759b8166",
    "sourceAnchor": "current-scope",
    "unitKind": "heading",
    "sourceUnitDigest": "83370882ceae06bff62a3f0b1debbf065c551c18181f316685b83db0455c54e7",
    "claimKind": "decision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Scope",
    "anchor": "current-scope",
    "githubAnchor": "current-scope",
    "stableAnchor": "h-4d275f579dca",
    "startLine": 21,
    "endLine": 21,
    "textDigest": "83370882ceae06bff62a3f0b1debbf065c551c18181f316685b83db0455c54e7",
    "sample": "Current Scope",
    "sectionPayloadDigest": "2ea18911b512080f7054a213ff29a0ca1c8640e76cdef6fbb1be2bb7ecc3f202",
    "followingBlockDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "identityFingerprint": "02cdd9494ce44b7a00c73e6952e91237fdae7ed6ee17fde2a3a29a637d7f044a",
    "ancestry": [
      "ADR-005: Herdr Is Visibility, Not Evidence"
    ],
    "text": "## Current Scope",
    "sectionText": "## Current Scope\n\nThis candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md).\n\nVisibility detachment changes only visibility state, not Run settlement truth. Evidence: `src/runner/dispatch/visibility-session.mjs:130-133`."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Scope",
    "anchor": "current-scope",
    "githubAnchor": "current-scope",
    "stableAnchor": "h-4d275f579dca",
    "startLine": 21,
    "endLine": 21,
    "textDigest": "83370882ceae06bff62a3f0b1debbf065c551c18181f316685b83db0455c54e7",
    "sample": "Current Scope",
    "sectionPayloadDigest": "2ea18911b512080f7054a213ff29a0ca1c8640e76cdef6fbb1be2bb7ecc3f202",
    "followingBlockDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "identityFingerprint": "02cdd9494ce44b7a00c73e6952e91237fdae7ed6ee17fde2a3a29a637d7f044a",
    "ancestry": [
      "ADR-005: Herdr Is Visibility, Not Evidence"
    ],
    "text": "## Current Scope",
    "sectionText": "## Current Scope\n\nThis candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md).\n\nVisibility detachment changes only visibility state, not Run settlement truth. Evidence: `src/runner/dispatch/visibility-session.mjs:130-133`."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_eefd21e417ee3e32c356caf5759b8166"
}
```

## Entry claim_d102eca8db91f86bdea22364b68dcf06

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d102eca8db91f86bdea22364b68dcf06",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "unitDigest": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "claimId": "claim_d102eca8db91f86bdea22364b68dcf06",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "claimKind": "decision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md",
    "unitDigest": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "claimId": "claim_d102eca8db91f86bdea22364b68dcf06",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "claimKind": "decision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "sample": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runne",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "ancestry": [
      "ADR-005: Herdr Is Visibility, Not Evidence",
      "Current Scope"
    ],
    "text": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 23,
    "endLine": 23,
    "textDigest": "fc26975e015616bb7bd594b34358c61df091977a7910dcc606a3b590d4cdcaf8",
    "sample": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runne",
    "identityFingerprint": "a086c026adc03fa84cbe832f44f4ab36e93bd3154e14c2bc325c73505a71dae9",
    "ancestry": [
      "ADR-005: Herdr Is Visibility, Not Evidence",
      "Current Scope"
    ],
    "text": "This candidate retains the surviving owner and boundary below. It is not a second runtime schema or an approval of the former engine. Current execution authority remains [the runner spec](../../runner/spec.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d102eca8db91f86bdea22364b68dcf06"
}
```

## Entry claim_9786ce02129b75faa01d4b022dca1fe2

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "44a7a5c667d31d20106ff07e3a89abd324caf75e1e3307a22fa86af3630a1468",
    "identityFingerprint": "02c8681c99ff08684fc77bcd956027322d185c2e2c077ade3f2d4456e45d88d3",
    "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
    "sourceAnchor": "agent-coordination-spec",
    "unitKind": "heading",
    "sourceUnitDigest": "294b2487cc407d098b8ef87abbfa9d257267db56afb2366c6db4deebc2e94c87",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "734c8299933693acbeaca91d2c1440b56e1f35fd81b9e28c0538d2bb474d970f",
      "toUnitDigest": "44a7a5c667d31d20106ff07e3a89abd324caf75e1e3307a22fa86af3630a1468",
      "fromSourceUnitDigest": "b26e9455b8cbcd730def449474ed42d1221c18874c81106e2d58354fe55760d1",
      "toSourceUnitDigest": "294b2487cc407d098b8ef87abbfa9d257267db56afb2366c6db4deebc2e94c87"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "44a7a5c667d31d20106ff07e3a89abd324caf75e1e3307a22fa86af3630a1468",
    "identityFingerprint": "02c8681c99ff08684fc77bcd956027322d185c2e2c077ade3f2d4456e45d88d3",
    "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
    "sourceAnchor": "agent-coordination-spec",
    "unitKind": "heading",
    "sourceUnitDigest": "294b2487cc407d098b8ef87abbfa9d257267db56afb2366c6db4deebc2e94c87",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination Spec",
    "anchor": "agent-coordination-spec",
    "githubAnchor": "agent-coordination-spec",
    "stableAnchor": "h-5c0b11c376ef",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "294b2487cc407d098b8ef87abbfa9d257267db56afb2366c6db4deebc2e94c87",
    "sample": "Agent Coordination Spec",
    "sectionPayloadDigest": "f93e64c031751db5aa732a334661daa30bd4735a08bc205602cf1cd2d91b5c29",
    "followingBlockDigest": "b3929df05f09393b95955b685bef21cc427c0505ea5f3affdd6873866c9c4ab6",
    "identityFingerprint": "02c8681c99ff08684fc77bcd956027322d185c2e2c077ade3f2d4456e45d88d3",
    "ancestry": [],
    "text": "# Agent Coordination Spec",
    "sectionText": "# Agent Coordination Spec\n\n```txt\nDocument type: Spec\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its code and runner-spec owners, retaining verified boundaries\nDesign status: Candidate\nImplementation: Current execution is owned by CollaborationPattern and the Workflow runner\nProvenance: Whole-area reframe under owner A16; complete classified input preserved in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Current-owner navigation and verified boundaries; not a second runtime specification\nUse this when: Locating current execution owners or auditing historical claims\nDo not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\n- docs/platform/agent-coordination/history/retired-engine/spec.md\nSupersedes: Stale current-state framing only; all old claims are preserved verbatim\nSuperseded by: Runtime ownership in docs/specs/runner.md\nAdded in candidate: Retirement framing and current-owner navigation\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Agent Coordination Spec",
    "anchor": "agent-coordination-spec",
    "githubAnchor": "agent-coordination-spec",
    "stableAnchor": "h-5c0b11c376ef",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "294b2487cc407d098b8ef87abbfa9d257267db56afb2366c6db4deebc2e94c87",
    "sample": "Agent Coordination Spec",
    "sectionPayloadDigest": "f93e64c031751db5aa732a334661daa30bd4735a08bc205602cf1cd2d91b5c29",
    "followingBlockDigest": "b3929df05f09393b95955b685bef21cc427c0505ea5f3affdd6873866c9c4ab6",
    "identityFingerprint": "02c8681c99ff08684fc77bcd956027322d185c2e2c077ade3f2d4456e45d88d3",
    "ancestry": [],
    "text": "# Agent Coordination Spec",
    "sectionText": "# Agent Coordination Spec\n\n```txt\nDocument type: Spec\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its code and runner-spec owners, retaining verified boundaries\nDesign status: Candidate\nImplementation: Current execution is owned by CollaborationPattern and the Workflow runner\nProvenance: Whole-area reframe under owner A16; complete classified input preserved in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Current-owner navigation and verified boundaries; not a second runtime specification\nUse this when: Locating current execution owners or auditing historical claims\nDo not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\n- docs/platform/agent-coordination/history/retired-engine/spec.md\nSupersedes: Stale current-state framing only; all old claims are preserved verbatim\nSuperseded by: Runtime ownership in docs/specs/runner.md\nAdded in candidate: Retirement framing and current-owner navigation\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9786ce02129b75faa01d4b022dca1fe2"
}
```

## Entry claim_021a84c1334927bc8bba62ec12584496

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_021a84c1334927bc8bba62ec12584496",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "c64da14f76bb3aa90022744325820ae52347f54a19407c9a092225b88dac7552",
    "identityFingerprint": "36d379cd226eeb59fd8f19c7cb32d1883cb096f8ddb3c99b5a535a3a605cfd41",
    "claimId": "claim_021a84c1334927bc8bba62ec12584496",
    "sourceAnchor": "contracts-consumed",
    "unitKind": "heading",
    "sourceUnitDigest": "6d46dde5699b5d3e43be6fdcc96e786f8e4f2ddedbc4300aa2481454976984a5",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "bbafc87a122d2e369f3bf4517957f8c179bc6e4872f85555b76707ae7682a896",
      "toUnitDigest": "c64da14f76bb3aa90022744325820ae52347f54a19407c9a092225b88dac7552",
      "fromSourceUnitDigest": "8519c651dc5341f1620239f9434d5f4ee7be204318e023bd6a4c1db93feb5a8c",
      "toSourceUnitDigest": "6d46dde5699b5d3e43be6fdcc96e786f8e4f2ddedbc4300aa2481454976984a5"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "c64da14f76bb3aa90022744325820ae52347f54a19407c9a092225b88dac7552",
    "identityFingerprint": "36d379cd226eeb59fd8f19c7cb32d1883cb096f8ddb3c99b5a535a3a605cfd41",
    "claimId": "claim_021a84c1334927bc8bba62ec12584496",
    "sourceAnchor": "contracts-consumed",
    "unitKind": "heading",
    "sourceUnitDigest": "6d46dde5699b5d3e43be6fdcc96e786f8e4f2ddedbc4300aa2481454976984a5",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Contracts Consumed",
    "anchor": "contracts-consumed",
    "githubAnchor": "contracts-consumed",
    "stableAnchor": "h-d63f7c5292f5",
    "startLine": 83,
    "endLine": 83,
    "textDigest": "6d46dde5699b5d3e43be6fdcc96e786f8e4f2ddedbc4300aa2481454976984a5",
    "sample": "Contracts Consumed",
    "sectionPayloadDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "followingBlockDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "identityFingerprint": "36d379cd226eeb59fd8f19c7cb32d1883cb096f8ddb3c99b5a535a3a605cfd41",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Contracts Consumed",
    "sectionText": "## Contracts Consumed\n\n| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |\n| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |\n| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |\n| Confinement Authority | [confinement-authority spec](../agent-confinement/spec.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Contracts Consumed",
    "anchor": "contracts-consumed",
    "githubAnchor": "contracts-consumed",
    "stableAnchor": "h-d63f7c5292f5",
    "startLine": 83,
    "endLine": 83,
    "textDigest": "6d46dde5699b5d3e43be6fdcc96e786f8e4f2ddedbc4300aa2481454976984a5",
    "sample": "Contracts Consumed",
    "sectionPayloadDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "followingBlockDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "identityFingerprint": "36d379cd226eeb59fd8f19c7cb32d1883cb096f8ddb3c99b5a535a3a605cfd41",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Contracts Consumed",
    "sectionText": "## Contracts Consumed\n\n| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |\n| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |\n| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |\n| Confinement Authority | [confinement-authority spec](../agent-confinement/spec.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_021a84c1334927bc8bba62ec12584496"
}
```

## Entry claim_bdc686550bc36d7563154fd33098741d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_bdc686550bc36d7563154fd33098741d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "a759da28f57f0030729b0b2c49d2ebe544db454f02c6c233fe44cb478e2b5f4a",
    "identityFingerprint": "988a2a3c2be9e7373ac4b80de6b197d71e45cdd966dc3471b12aae4cb51c988d",
    "claimId": "claim_bdc686550bc36d7563154fd33098741d",
    "sourceAnchor": "contracts-owned",
    "unitKind": "heading",
    "sourceUnitDigest": "29827cecc4237462ac73fcf7b9ca7930db6bb0ea0d751c7cba1ac81bb44fa559",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "a8225df4a0a88e91c2c9d88c6e65e46ff65dc3e0d960d67454c9cfc5bc456f84",
      "toUnitDigest": "a759da28f57f0030729b0b2c49d2ebe544db454f02c6c233fe44cb478e2b5f4a",
      "fromSourceUnitDigest": "29326c6039305ab442f2e6d87841bf41a6496825ee26c70769c81e383bb27810",
      "toSourceUnitDigest": "29827cecc4237462ac73fcf7b9ca7930db6bb0ea0d751c7cba1ac81bb44fa559"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "25856acc816cb6457b7027d059385ff8f9cb2a51ea802e65a7705cbf74f789ca",
    "identityFingerprint": "c638e1de0920d4cb75d558649c67be3d18ab77a2ce7468ccf121fe5989b04cb7",
    "claimId": "claim_bdc686550bc36d7563154fd33098741d",
    "sourceAnchor": "contracts-owned",
    "unitKind": "heading",
    "sourceUnitDigest": "e7d024c8e95cf7d1b35c78a8540b8f6179ab3c40a672637ccdb6a28f1780b80d",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "a759da28f57f0030729b0b2c49d2ebe544db454f02c6c233fe44cb478e2b5f4a",
      "toUnitDigest": "25856acc816cb6457b7027d059385ff8f9cb2a51ea802e65a7705cbf74f789ca",
      "fromSourceUnitDigest": "29827cecc4237462ac73fcf7b9ca7930db6bb0ea0d751c7cba1ac81bb44fa559",
      "toSourceUnitDigest": "e7d024c8e95cf7d1b35c78a8540b8f6179ab3c40a672637ccdb6a28f1780b80d"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Contracts Owned",
    "anchor": "contracts-owned",
    "githubAnchor": "contracts-owned",
    "stableAnchor": "h-cc83ea7ce8cf",
    "startLine": 73,
    "endLine": 73,
    "textDigest": "29827cecc4237462ac73fcf7b9ca7930db6bb0ea0d751c7cba1ac81bb44fa559",
    "sample": "Contracts Owned",
    "sectionPayloadDigest": "caf53948d4bb9d443fe273f7c933930c189adf5f0307851ab551cf9c73826a47",
    "followingBlockDigest": "3780e1a95c63621f0792e2323f39e313728dfc96d106217f8b6b538e45143b7d",
    "identityFingerprint": "988a2a3c2be9e7373ac4b80de6b197d71e45cdd966dc3471b12aae4cb51c988d",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Contracts Owned",
    "sectionText": "## Contracts Owned\n\nUnit/Workflow execution ownership is described by [docs/platform/runner/spec.md](../runner/spec.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details.\n\n| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |\n| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Contracts Owned",
    "anchor": "contracts-owned",
    "githubAnchor": "contracts-owned",
    "stableAnchor": "h-cc83ea7ce8cf",
    "startLine": 73,
    "endLine": 73,
    "textDigest": "e7d024c8e95cf7d1b35c78a8540b8f6179ab3c40a672637ccdb6a28f1780b80d",
    "sample": "Contracts Owned",
    "sectionPayloadDigest": "5da6bdc109f50533dc06cf03ca773036f65c7eaedc0422144ee756418fd72967",
    "followingBlockDigest": "ea74865624780601cd67f4c2c5138432dfb6a150c7fb8cdb465299fab313b4e0",
    "identityFingerprint": "c638e1de0920d4cb75d558649c67be3d18ab77a2ce7468ccf121fe5989b04cb7",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Contracts Owned",
    "sectionText": "## Contracts Owned\n\nUnit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details.\n\n| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |\n| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_bdc686550bc36d7563154fd33098741d"
}
```

## Entry claim_1b9e2ea95285bcf3db525a371492b405

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "11d3d6708d548ba69a93bbbb12138637dc2aeeadedb2f8dc9499ad7e73fa1795",
    "identityFingerprint": "dc8ec15cfd8e7b0bb8169f157b7258952abe126be179f72effe762000dba7b13",
    "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
    "sourceAnchor": "current-summary",
    "unitKind": "heading",
    "sourceUnitDigest": "b54a970932f68ca248093ffc54b6adf753ac25391815499903f32239f351cbbf",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "b9afc3fe8ca8f67e254b9aed971f218ccdf9dd04d83029ba4d0506eef49eaaaf",
      "toUnitDigest": "11d3d6708d548ba69a93bbbb12138637dc2aeeadedb2f8dc9499ad7e73fa1795",
      "fromSourceUnitDigest": "7ab59bdf8dc3b451b61feffb2eb3000b71e2916e9fe9820a3f7d8f0dc46e549b",
      "toSourceUnitDigest": "b54a970932f68ca248093ffc54b6adf753ac25391815499903f32239f351cbbf"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "11d3d6708d548ba69a93bbbb12138637dc2aeeadedb2f8dc9499ad7e73fa1795",
    "identityFingerprint": "dc8ec15cfd8e7b0bb8169f157b7258952abe126be179f72effe762000dba7b13",
    "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
    "sourceAnchor": "current-summary",
    "unitKind": "heading",
    "sourceUnitDigest": "b54a970932f68ca248093ffc54b6adf753ac25391815499903f32239f351cbbf",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Summary",
    "anchor": "current-summary",
    "githubAnchor": "current-summary",
    "stableAnchor": "h-c5a6abc56334",
    "startLine": 26,
    "endLine": 26,
    "textDigest": "b54a970932f68ca248093ffc54b6adf753ac25391815499903f32239f351cbbf",
    "sample": "Current Summary",
    "sectionPayloadDigest": "731d39b0f8700987020df31eb7df0a44bded372a1263ec44ec732794e9f4744a",
    "followingBlockDigest": "1fa05e73fe203351e8d1668838d3bcde3fb6e825827fb0968dcc647c4296f6d0",
    "identityFingerprint": "dc8ec15cfd8e7b0bb8169f157b7258952abe126be179f72effe762000dba7b13",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Current Summary",
    "sectionText": "## Current Summary\n\nCurrent Unit collaboration is selected by CollaborationPattern; executable\nWorkflow nodes call the Unit execution core. This is a current-owner map,\nnot an assertion that CoordinationProtocol is a current prerequisite or entity.\nEvidence: src/runner/execution/patterns/index.mjs:34-46; src/workflow/runner.mjs:419-428.\n\nCurrent execution owners are:\n\n- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/spec.md](../runner/spec.md), not the retired CoordinationSession engine.\n- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Current Summary",
    "anchor": "current-summary",
    "githubAnchor": "current-summary",
    "stableAnchor": "h-c5a6abc56334",
    "startLine": 26,
    "endLine": 26,
    "textDigest": "b54a970932f68ca248093ffc54b6adf753ac25391815499903f32239f351cbbf",
    "sample": "Current Summary",
    "sectionPayloadDigest": "731d39b0f8700987020df31eb7df0a44bded372a1263ec44ec732794e9f4744a",
    "followingBlockDigest": "1fa05e73fe203351e8d1668838d3bcde3fb6e825827fb0968dcc647c4296f6d0",
    "identityFingerprint": "dc8ec15cfd8e7b0bb8169f157b7258952abe126be179f72effe762000dba7b13",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Current Summary",
    "sectionText": "## Current Summary\n\nCurrent Unit collaboration is selected by CollaborationPattern; executable\nWorkflow nodes call the Unit execution core. This is a current-owner map,\nnot an assertion that CoordinationProtocol is a current prerequisite or entity.\nEvidence: src/runner/execution/patterns/index.mjs:34-46; src/workflow/runner.mjs:419-428.\n\nCurrent execution owners are:\n\n- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/spec.md](../runner/spec.md), not the retired CoordinationSession engine.\n- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_1b9e2ea95285bcf3db525a371492b405"
}
```

## Entry claim_abd1a1964d80a8d3e5635ba17cd386cf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "717b0c14e5245c5e392d111c820bdf767be6c6827a0483109634a49821ab4cd6",
    "identityFingerprint": "492b9ed4909a287b7b6fbe2acfbe66827f3814be34f928431630743a96e47278",
    "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
    "sourceAnchor": "known-gaps",
    "unitKind": "heading",
    "sourceUnitDigest": "9503bfc39e71e8f39f88825b94ea0b8ac9f9668bdd24fc75c0ba66757a121af7",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "9e55d90b2c9ec8cd248711c01b3b0a7faa43ebb803ae310ad59b2e4eb77f75ff",
      "toUnitDigest": "717b0c14e5245c5e392d111c820bdf767be6c6827a0483109634a49821ab4cd6",
      "fromSourceUnitDigest": "d679fd7b9129e008893a4937916cedeff3d0682f3c3cd45ad774391c8b58b3c1",
      "toSourceUnitDigest": "9503bfc39e71e8f39f88825b94ea0b8ac9f9668bdd24fc75c0ba66757a121af7"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "2e4a280b65973bc791afaea79fa4148c14747aaeb919783bc34e1828aa3fbdbd",
    "identityFingerprint": "5d41f80af3970625553ab794ed7c40211aa5a085e4490cb12b9b0c457370a7f3",
    "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
    "sourceAnchor": "known-gaps",
    "unitKind": "heading",
    "sourceUnitDigest": "3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "717b0c14e5245c5e392d111c820bdf767be6c6827a0483109634a49821ab4cd6",
      "toUnitDigest": "2e4a280b65973bc791afaea79fa4148c14747aaeb919783bc34e1828aa3fbdbd",
      "fromSourceUnitDigest": "9503bfc39e71e8f39f88825b94ea0b8ac9f9668bdd24fc75c0ba66757a121af7",
      "toSourceUnitDigest": "3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Known Gaps",
    "anchor": "known-gaps",
    "githubAnchor": "known-gaps",
    "stableAnchor": "h-c625509c7575",
    "startLine": 98,
    "endLine": 98,
    "textDigest": "9503bfc39e71e8f39f88825b94ea0b8ac9f9668bdd24fc75c0ba66757a121af7",
    "sample": "Known Gaps",
    "sectionPayloadDigest": "98c4c235294db2b0d8048b250c3fda14ed0295d346be00eec139e901a12dd354",
    "followingBlockDigest": "98c4c235294db2b0d8048b250c3fda14ed0295d346be00eec139e901a12dd354",
    "identityFingerprint": "492b9ed4909a287b7b6fbe2acfbe66827f3814be34f928431630743a96e47278",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Known Gaps",
    "sectionText": "## Known Gaps\n\nThe former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../runner/spec.md) when assessing present execution."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Known Gaps",
    "anchor": "known-gaps",
    "githubAnchor": "known-gaps",
    "stableAnchor": "h-c625509c7575",
    "startLine": 98,
    "endLine": 98,
    "textDigest": "3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51",
    "sample": "Known Gaps",
    "sectionPayloadDigest": "897dce4f1eedf73927e88e7bd18e4151bf7daac694151605695d83e6eb387994",
    "followingBlockDigest": "897dce4f1eedf73927e88e7bd18e4151bf7daac694151605695d83e6eb387994",
    "identityFingerprint": "5d41f80af3970625553ab794ed7c40211aa5a085e4490cb12b9b0c457370a7f3",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Known Gaps",
    "sectionText": "## Known Gaps\n\nThe former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_abd1a1964d80a8d3e5635ba17cd386cf"
}
```

## Entry claim_9a3c360e46f16369ea4820a1b8bfbcca

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "176d5e91538064d2ddb6c3e3b5e703316d2d98fc46405f4cc04461b5249ae6f4",
    "identityFingerprint": "6d4f48a18a217ed278f2c0801c9a272b2488a15b329992ba6c9dc0e8bdf4f48b",
    "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
    "sourceAnchor": "related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "339867f1bc28f15750988a320498aea72f5d029aebf7555129edd289650ff303",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "c3df2d156ff5efbd510f4aa9b782718ab6d604788aad50fc8e8ba84ee65155e8",
      "toUnitDigest": "176d5e91538064d2ddb6c3e3b5e703316d2d98fc46405f4cc04461b5249ae6f4",
      "fromSourceUnitDigest": "f1dc5f26ab4ed0403e488fec6b7dbfa934b32e1869bb1c98c3621600442738f6",
      "toSourceUnitDigest": "339867f1bc28f15750988a320498aea72f5d029aebf7555129edd289650ff303"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "176d5e91538064d2ddb6c3e3b5e703316d2d98fc46405f4cc04461b5249ae6f4",
    "identityFingerprint": "6d4f48a18a217ed278f2c0801c9a272b2488a15b329992ba6c9dc0e8bdf4f48b",
    "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
    "sourceAnchor": "related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "339867f1bc28f15750988a320498aea72f5d029aebf7555129edd289650ff303",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Related Files",
    "anchor": "related-files",
    "githubAnchor": "related-files",
    "stableAnchor": "h-2e2050e7a699",
    "startLine": 102,
    "endLine": 102,
    "textDigest": "339867f1bc28f15750988a320498aea72f5d029aebf7555129edd289650ff303",
    "sample": "Related Files",
    "sectionPayloadDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "followingBlockDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "identityFingerprint": "6d4f48a18a217ed278f2c0801c9a272b2488a15b329992ba6c9dc0e8bdf4f48b",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Related Files",
    "sectionText": "## Related Files\n\n| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |\n| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Related Files",
    "anchor": "related-files",
    "githubAnchor": "related-files",
    "stableAnchor": "h-2e2050e7a699",
    "startLine": 102,
    "endLine": 102,
    "textDigest": "339867f1bc28f15750988a320498aea72f5d029aebf7555129edd289650ff303",
    "sample": "Related Files",
    "sectionPayloadDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "followingBlockDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "identityFingerprint": "6d4f48a18a217ed278f2c0801c9a272b2488a15b329992ba6c9dc0e8bdf4f48b",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Related Files",
    "sectionText": "## Related Files\n\n| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |\n| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9a3c360e46f16369ea4820a1b8bfbcca"
}
```

## Entry claim_6c4f618a99c27c8d995e5ae4ea838c31

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "b95b0fc40e5736b46d0f74542ecb4674a792d67b8caed035c8c94fa784afedf8",
    "identityFingerprint": "35ca016eb36a13f5639a9541873dacfa72f11b6f711d8ffe08b5c54db4dff0cc",
    "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
    "sourceAnchor": "scope",
    "unitKind": "heading",
    "sourceUnitDigest": "f4b260299aa4019eb6ca092c3ea02bc49ac316d8e0d6c551de22b7699d048a5a",
    "claimKind": "specification",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "96bc3166aaa7616191682dffb3f43f805e267527e9518c7452a92162c8bcb202",
      "toUnitDigest": "b95b0fc40e5736b46d0f74542ecb4674a792d67b8caed035c8c94fa784afedf8",
      "fromSourceUnitDigest": "0498080f3e20c2c959fb80440645949e3aaf4be6d67ea2e95d2645dc3efaeeec",
      "toSourceUnitDigest": "f4b260299aa4019eb6ca092c3ea02bc49ac316d8e0d6c551de22b7699d048a5a"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "b95b0fc40e5736b46d0f74542ecb4674a792d67b8caed035c8c94fa784afedf8",
    "identityFingerprint": "35ca016eb36a13f5639a9541873dacfa72f11b6f711d8ffe08b5c54db4dff0cc",
    "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
    "sourceAnchor": "scope",
    "unitKind": "heading",
    "sourceUnitDigest": "f4b260299aa4019eb6ca092c3ea02bc49ac316d8e0d6c551de22b7699d048a5a",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Scope",
    "anchor": "scope",
    "githubAnchor": "scope",
    "stableAnchor": "h-27310d207322",
    "startLine": 40,
    "endLine": 40,
    "textDigest": "f4b260299aa4019eb6ca092c3ea02bc49ac316d8e0d6c551de22b7699d048a5a",
    "sample": "Scope",
    "sectionPayloadDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "followingBlockDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "identityFingerprint": "35ca016eb36a13f5639a9541873dacfa72f11b6f711d8ffe08b5c54db4dff0cc",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Scope",
    "sectionText": "## Scope\n\nFor current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Scope",
    "anchor": "scope",
    "githubAnchor": "scope",
    "stableAnchor": "h-27310d207322",
    "startLine": 40,
    "endLine": 40,
    "textDigest": "f4b260299aa4019eb6ca092c3ea02bc49ac316d8e0d6c551de22b7699d048a5a",
    "sample": "Scope",
    "sectionPayloadDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "followingBlockDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "identityFingerprint": "35ca016eb36a13f5639a9541873dacfa72f11b6f711d8ffe08b5c54db4dff0cc",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "## Scope",
    "sectionText": "## Scope\n\nFor current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6c4f618a99c27c8d995e5ae4ea838c31"
}
```

## Entry claim_12c1a2e9e7024e1bfd575fbeda3a95a5

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_12c1a2e9e7024e1bfd575fbeda3a95a5",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "8feadff5cc4191b266f3c284dd5c514439346f884ed9f60480560bcf194844a1",
    "identityFingerprint": "8feadff5cc4191b266f3c284dd5c514439346f884ed9f60480560bcf194844a1",
    "claimId": "claim_12c1a2e9e7024e1bfd575fbeda3a95a5",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ea74865624780601cd67f4c2c5138432dfb6a150c7fb8cdb465299fab313b4e0",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 75,
    "endLine": 75,
    "textDigest": "ea74865624780601cd67f4c2c5138432dfb6a150c7fb8cdb465299fab313b4e0",
    "sample": "Unit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current c",
    "identityFingerprint": "8feadff5cc4191b266f3c284dd5c514439346f884ed9f60480560bcf194844a1",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Owned"
    ],
    "text": "Unit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_12c1a2e9e7024e1bfd575fbeda3a95a5"
}
```

## Entry claim_f6647fb13c981c2202b3671c8d55bffc

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f6647fb13c981c2202b3671c8d55bffc",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "identityFingerprint": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "claimId": "claim_f6647fb13c981c2202b3671c8d55bffc",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0c4f7a6d7119bec4f37415eebf9a2fc0786a26d60d47914f0b0d842213c02a0a",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "identityFingerprint": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "claimId": "claim_f6647fb13c981c2202b3671c8d55bffc",
    "sourceAnchor": "unheaded-block-12",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0c4f7a6d7119bec4f37415eebf9a2fc0786a26d60d47914f0b0d842213c02a0a",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 77,
    "endLine": 81,
    "textDigest": "0c4f7a6d7119bec4f37415eebf9a2fc0786a26d60d47914f0b0d842213c02a0a",
    "sample": "| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundari",
    "identityFingerprint": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Owned"
    ],
    "text": "| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |\n| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-12",
    "githubAnchor": "unheaded-block-12",
    "stableAnchor": "unheaded-block-12",
    "title": "Unheaded block 12",
    "startLine": 77,
    "endLine": 81,
    "textDigest": "0c4f7a6d7119bec4f37415eebf9a2fc0786a26d60d47914f0b0d842213c02a0a",
    "sample": "| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundari",
    "identityFingerprint": "2e52a5a524052f4956f650cfbff8c1516e88398d5d2bf82578c6ebf3abc48d58",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Owned"
    ],
    "text": "| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../runner/spec.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |\n| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f6647fb13c981c2202b3671c8d55bffc"
}
```

## Entry claim_6e283f886ccd5efc279b44adf0f7b073

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_6e283f886ccd5efc279b44adf0f7b073",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "identityFingerprint": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "claimId": "claim_6e283f886ccd5efc279b44adf0f7b073",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "identityFingerprint": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "claimId": "claim_6e283f886ccd5efc279b44adf0f7b073",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 85,
    "endLine": 90,
    "textDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "sample": "| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authorit",
    "identityFingerprint": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Consumed"
    ],
    "text": "| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |\n| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |\n| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |\n| Confinement Authority | [confinement-authority spec](../agent-confinement/spec.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 85,
    "endLine": 90,
    "textDigest": "1b6fb0095ed47cc396c91d6cb66502161eaac67504a78e9f99507f4dfcbfd871",
    "sample": "| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authorit",
    "identityFingerprint": "c2633a6183fdc2e8cd9de3656234f8b480ec246e36c6be8bb1313c2918d25942",
    "ancestry": [
      "Agent Coordination Spec",
      "Contracts Consumed"
    ],
    "text": "| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |\n| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |\n| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |\n| Confinement Authority | [confinement-authority spec](../agent-confinement/spec.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6e283f886ccd5efc279b44adf0f7b073"
}
```

## Entry claim_105f15e6b189309da77518915b5406e1

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_105f15e6b189309da77518915b5406e1",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "69548f12f55846517e4884f06599d9687fa9aa7b5496f2602d714e27fb8854b2",
    "identityFingerprint": "69548f12f55846517e4884f06599d9687fa9aa7b5496f2602d714e27fb8854b2",
    "claimId": "claim_105f15e6b189309da77518915b5406e1",
    "sourceAnchor": "unheaded-block-16",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "897dce4f1eedf73927e88e7bd18e4151bf7daac694151605695d83e6eb387994",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-16",
    "githubAnchor": "unheaded-block-16",
    "stableAnchor": "unheaded-block-16",
    "title": "Unheaded block 16",
    "startLine": 100,
    "endLine": 100,
    "textDigest": "897dce4f1eedf73927e88e7bd18e4151bf7daac694151605695d83e6eb387994",
    "sample": "The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/",
    "identityFingerprint": "69548f12f55846517e4884f06599d9687fa9aa7b5496f2602d714e27fb8854b2",
    "ancestry": [
      "Agent Coordination Spec",
      "Known Gaps"
    ],
    "text": "The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_105f15e6b189309da77518915b5406e1"
}
```

## Entry claim_abbf47251a8e62cc43dc8275ce8dd32f

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_abbf47251a8e62cc43dc8275ce8dd32f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "identityFingerprint": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "claimId": "claim_abbf47251a8e62cc43dc8275ce8dd32f",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "identityFingerprint": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "claimId": "claim_abbf47251a8e62cc43dc8275ce8dd32f",
    "sourceAnchor": "unheaded-block-17",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 104,
    "endLine": 109,
    "textDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "sample": "| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](h",
    "identityFingerprint": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "ancestry": [
      "Agent Coordination Spec",
      "Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |\n| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-17",
    "githubAnchor": "unheaded-block-17",
    "stableAnchor": "unheaded-block-17",
    "title": "Unheaded block 17",
    "startLine": 104,
    "endLine": 109,
    "textDigest": "561c34752847739d1119257acdb249bd842db7b9b0680feedae923f7c68d4a25",
    "sample": "| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](h",
    "identityFingerprint": "cfcc3eb504e24eb5c112474f2a83bbafa477f7f87d1b70c6ff38b5ee008c6168",
    "ancestry": [
      "Agent Coordination Spec",
      "Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../runner/spec.md) |\n| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |\n| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_abbf47251a8e62cc43dc8275ce8dd32f"
}
```

## Entry claim_c6643ddc4ccb59a58ec4257ebef366a0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_c6643ddc4ccb59a58ec4257ebef366a0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "identityFingerprint": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "claimId": "claim_c6643ddc4ccb59a58ec4257ebef366a0",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "163d1189de89c56d693ebe79bb5d60931160f4f07a2246f3d40628afc8a1a9a3",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "identityFingerprint": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "claimId": "claim_c6643ddc4ccb59a58ec4257ebef366a0",
    "sourceAnchor": "unheaded-block-2",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "163d1189de89c56d693ebe79bb5d60931160f4f07a2246f3d40628afc8a1a9a3",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "163d1189de89c56d693ebe79bb5d60931160f4f07a2246f3d40628afc8a1a9a3",
    "sample": "The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified",
    "identityFingerprint": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-2",
    "githubAnchor": "unheaded-block-2",
    "stableAnchor": "unheaded-block-2",
    "title": "Unheaded block 2",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "163d1189de89c56d693ebe79bb5d60931160f4f07a2246f3d40628afc8a1a9a3",
    "sample": "The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified",
    "identityFingerprint": "79f44da66ec557f57104ad9e8c3e85acab5afcbff058be5246ab084c52287f5c",
    "ancestry": [
      "Agent Coordination Spec"
    ],
    "text": "The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../runner/spec.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c6643ddc4ccb59a58ec4257ebef366a0"
}
```

## Entry claim_8b86ec0d1eb5b46ede209632df262fa9

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_8b86ec0d1eb5b46ede209632df262fa9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "identityFingerprint": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "claimId": "claim_8b86ec0d1eb5b46ede209632df262fa9",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3a6e29755a2e56ac3e354d3afc146a2abf0f155a7d4d86d89c9be56d0a22868d",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "identityFingerprint": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "claimId": "claim_8b86ec0d1eb5b46ede209632df262fa9",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "3a6e29755a2e56ac3e354d3afc146a2abf0f155a7d4d86d89c9be56d0a22868d",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 35,
    "endLine": 38,
    "textDigest": "3a6e29755a2e56ac3e354d3afc146a2abf0f155a7d4d86d89c9be56d0a22868d",
    "sample": "- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/s",
    "identityFingerprint": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "ancestry": [
      "Agent Coordination Spec",
      "Current Summary"
    ],
    "text": "- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/spec.md](../runner/spec.md), not the retired CoordinationSession engine.\n- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 35,
    "endLine": 38,
    "textDigest": "3a6e29755a2e56ac3e354d3afc146a2abf0f155a7d4d86d89c9be56d0a22868d",
    "sample": "- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/s",
    "identityFingerprint": "f4b58c970c31e0de26c0b85246d176ee5b06d77486a9e9da0e7b7fa1c90f561d",
    "ancestry": [
      "Agent Coordination Spec",
      "Current Summary"
    ],
    "text": "- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/platform/runner/spec.md](../runner/spec.md), not the retired CoordinationSession engine.\n- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_8b86ec0d1eb5b46ede209632df262fa9"
}
```

## Entry claim_e2afe8e294d70cd25312c86c13aba93a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e2afe8e294d70cd25312c86c13aba93a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "identityFingerprint": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "claimId": "claim_e2afe8e294d70cd25312c86c13aba93a",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/spec.md",
    "unitDigest": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "identityFingerprint": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "claimId": "claim_e2afe8e294d70cd25312c86c13aba93a",
    "sourceAnchor": "unheaded-block-6",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 42,
    "endLine": 42,
    "textDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "sample": "For current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#li",
    "identityFingerprint": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "ancestry": [
      "Agent Coordination Spec",
      "Scope"
    ],
    "text": "For current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-6",
    "githubAnchor": "unheaded-block-6",
    "stableAnchor": "unheaded-block-6",
    "title": "Unheaded block 6",
    "startLine": 42,
    "endLine": 42,
    "textDigest": "70f068392a2ff2509babddbf0a071e340e4036959d6839b678410f0dda286601",
    "sample": "For current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#li",
    "identityFingerprint": "f5c53080a7dd9fc77cbd50d6610d9a5639052b836fdaa2fe6edba25b5b417df5",
    "ancestry": [
      "Agent Coordination Spec",
      "Scope"
    ],
    "text": "For current execution ownership read [the runner spec](../runner/spec.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e2afe8e294d70cd25312c86c13aba93a"
}
```

## Entry claim_122f97e762ea7ff7851d6a21fc96a0ca

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_122f97e762ea7ff7851d6a21fc96a0ca",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/vision.md",
    "unitDigest": "00d0a0b57aac94c4ea567394ba0a0852f1ad8707029e173b7cab5bb8340e3686",
    "identityFingerprint": "5060e58049bb0840bb158b16aab6650aa98d593cbfc232930ced7c9370caad82",
    "claimId": "claim_122f97e762ea7ff7851d6a21fc96a0ca",
    "sourceAnchor": "reading-down-from-the-vision",
    "unitKind": "heading",
    "sourceUnitDigest": "852ed9b500d96e96ae6dfa27c123feb107277c4bd2657c708dee8bdd220d2b52",
    "claimKind": "vision",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "d7c83521bc5a699719d4f6960b5951e131a6fc00b72217febe56d1ac1790679f",
      "toUnitDigest": "00d0a0b57aac94c4ea567394ba0a0852f1ad8707029e173b7cab5bb8340e3686",
      "fromSourceUnitDigest": "bcc498d937367343f1b0ce52884e9320bf3183d865750dd5a0e4e3c135abebc6",
      "toSourceUnitDigest": "852ed9b500d96e96ae6dfa27c123feb107277c4bd2657c708dee8bdd220d2b52"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/vision.md",
    "unitDigest": "00d0a0b57aac94c4ea567394ba0a0852f1ad8707029e173b7cab5bb8340e3686",
    "identityFingerprint": "5060e58049bb0840bb158b16aab6650aa98d593cbfc232930ced7c9370caad82",
    "claimId": "claim_122f97e762ea7ff7851d6a21fc96a0ca",
    "sourceAnchor": "reading-down-from-the-vision",
    "unitKind": "heading",
    "sourceUnitDigest": "852ed9b500d96e96ae6dfa27c123feb107277c4bd2657c708dee8bdd220d2b52",
    "claimKind": "vision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "Reading Down From The Vision",
    "anchor": "reading-down-from-the-vision",
    "githubAnchor": "reading-down-from-the-vision",
    "stableAnchor": "h-e41548d586db",
    "startLine": 343,
    "endLine": 343,
    "textDigest": "852ed9b500d96e96ae6dfa27c123feb107277c4bd2657c708dee8bdd220d2b52",
    "sample": "Reading Down From The Vision",
    "sectionPayloadDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "followingBlockDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "identityFingerprint": "5060e58049bb0840bb158b16aab6650aa98d593cbfc232930ced7c9370caad82",
    "ancestry": [
      "Agent Coordination Foundation Vision"
    ],
    "text": "## Reading Down From The Vision",
    "sectionText": "## Reading Down From The Vision\n\n1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitly proposed designs.\n3. [Assignment, Run and RunResult contract](contracts/assignment-run-runresult.md)\n   distinguishes current execution/evidence boundaries from historical schemas.\n4. [Decisions](decisions/README.md) distinguishes surviving boundaries from\n   retired-engine acceptance.\n5. [Historical Step 07](history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)\n   and [Step 08](history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)\n   preserve their earlier frontier; they do not define current execution doors.\n6. Current sequencing and binding implementation is linked by\n   [the runner spec](../runner/spec.md). The two recorded spec/code conflicts\n   require separate main-owner investigation, not inference from old acceptance."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "Reading Down From The Vision",
    "anchor": "reading-down-from-the-vision",
    "githubAnchor": "reading-down-from-the-vision",
    "stableAnchor": "h-e41548d586db",
    "startLine": 343,
    "endLine": 343,
    "textDigest": "852ed9b500d96e96ae6dfa27c123feb107277c4bd2657c708dee8bdd220d2b52",
    "sample": "Reading Down From The Vision",
    "sectionPayloadDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "followingBlockDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "identityFingerprint": "5060e58049bb0840bb158b16aab6650aa98d593cbfc232930ced7c9370caad82",
    "ancestry": [
      "Agent Coordination Foundation Vision"
    ],
    "text": "## Reading Down From The Vision",
    "sectionText": "## Reading Down From The Vision\n\n1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitly proposed designs.\n3. [Assignment, Run and RunResult contract](contracts/assignment-run-runresult.md)\n   distinguishes current execution/evidence boundaries from historical schemas.\n4. [Decisions](decisions/README.md) distinguishes surviving boundaries from\n   retired-engine acceptance.\n5. [Historical Step 07](history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)\n   and [Step 08](history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)\n   preserve their earlier frontier; they do not define current execution doors.\n6. Current sequencing and binding implementation is linked by\n   [the runner spec](../runner/spec.md). The two recorded spec/code conflicts\n   require separate main-owner investigation, not inference from old acceptance."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_122f97e762ea7ff7851d6a21fc96a0ca"
}
```

## Entry claim_dee4109c508c8e3b6596636a59625edd

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_dee4109c508c8e3b6596636a59625edd",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/vision.md",
    "unitDigest": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "identityFingerprint": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "claimId": "claim_dee4109c508c8e3b6596636a59625edd",
    "sourceAnchor": "unheaded-block-57",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "claimKind": "vision",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/agent-coordination/vision.md",
    "unitDigest": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "identityFingerprint": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "claimId": "claim_dee4109c508c8e3b6596636a59625edd",
    "sourceAnchor": "unheaded-block-57",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "claimKind": "vision",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-57",
    "githubAnchor": "unheaded-block-57",
    "stableAnchor": "unheaded-block-57",
    "title": "Unheaded block 57",
    "startLine": 345,
    "endLine": 357,
    "textDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "sample": "1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitl",
    "identityFingerprint": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "ancestry": [
      "Agent Coordination Foundation Vision",
      "Reading Down From The Vision"
    ],
    "text": "1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitly proposed designs.\n3. [Assignment, Run and RunResult contract](contracts/assignment-run-runresult.md)\n   distinguishes current execution/evidence boundaries from historical schemas.\n4. [Decisions](decisions/README.md) distinguishes surviving boundaries from\n   retired-engine acceptance.\n5. [Historical Step 07](history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)\n   and [Step 08](history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)\n   preserve their earlier frontier; they do not define current execution doors.\n6. Current sequencing and binding implementation is linked by\n   [the runner spec](../runner/spec.md). The two recorded spec/code conflicts\n   require separate main-owner investigation, not inference from old acceptance."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-57",
    "githubAnchor": "unheaded-block-57",
    "stableAnchor": "unheaded-block-57",
    "title": "Unheaded block 57",
    "startLine": 345,
    "endLine": 357,
    "textDigest": "afa6e1bfcf309ab69db544af5f4f249255e17db2973ea08b733ba5b9fd1f4f6b",
    "sample": "1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitl",
    "identityFingerprint": "c383dc082a7556859785d2eea4a37dd214225aae54e00a4bc060b06875463eb1",
    "ancestry": [
      "Agent Coordination Foundation Vision",
      "Reading Down From The Vision"
    ],
    "text": "1. [Vocabulary](vocabulary/README.md) names current, proposed and reserved terms.\n2. [Architecture](architecture/README.md) routes to current implementation owners\n   and explicitly proposed designs.\n3. [Assignment, Run and RunResult contract](contracts/assignment-run-runresult.md)\n   distinguishes current execution/evidence boundaries from historical schemas.\n4. [Decisions](decisions/README.md) distinguishes surviving boundaries from\n   retired-engine acceptance.\n5. [Historical Step 07](history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)\n   and [Step 08](history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)\n   preserve their earlier frontier; they do not define current execution doors.\n6. Current sequencing and binding implementation is linked by\n   [the runner spec](../runner/spec.md). The two recorded spec/code conflicts\n   require separate main-owner investigation, not inference from old acceptance."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_dee4109c508c8e3b6596636a59625edd"
}
```

## Entry claim_fa634b3e30b51cd9a715a68c66a6c6cd

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_fa634b3e30b51cd9a715a68c66a6c6cd",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/architecture-map.md",
    "unitDigest": "dd04350bd92a4306508ff831ca748f085169df65f3bd22c9717e5233085ba29a",
    "identityFingerprint": "176490a67dd7497459f97c7f06da9b391b67cf2f39f2152eacccd94c437bba40",
    "claimId": "claim_fa634b3e30b51cd9a715a68c66a6c6cd",
    "sourceAnchor": "architecture-map",
    "unitKind": "heading",
    "sourceUnitDigest": "3cbd17c5ad739da3c5f1d5d9895a8289881518833bad2bb7846fcb023b09aafb",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "dbf77216ff3f2053bbe33014754a33b205ee6dac4d1d07ff58eb761389ad0e5e",
      "toUnitDigest": "dd04350bd92a4306508ff831ca748f085169df65f3bd22c9717e5233085ba29a",
      "fromSourceUnitDigest": "05d9cc45eefa33ab959c9dad93935840f85544e60a48d41118f0cefcef038479",
      "toSourceUnitDigest": "3cbd17c5ad739da3c5f1d5d9895a8289881518833bad2bb7846fcb023b09aafb"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/architecture-map.md",
    "unitDigest": "dd04350bd92a4306508ff831ca748f085169df65f3bd22c9717e5233085ba29a",
    "identityFingerprint": "176490a67dd7497459f97c7f06da9b391b67cf2f39f2152eacccd94c437bba40",
    "claimId": "claim_fa634b3e30b51cd9a715a68c66a6c6cd",
    "sourceAnchor": "architecture-map",
    "unitKind": "heading",
    "sourceUnitDigest": "3cbd17c5ad739da3c5f1d5d9895a8289881518833bad2bb7846fcb023b09aafb",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Map",
    "anchor": "architecture-map",
    "githubAnchor": "architecture-map",
    "stableAnchor": "h-77b8a1b8c2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "3cbd17c5ad739da3c5f1d5d9895a8289881518833bad2bb7846fcb023b09aafb",
    "sample": "Architecture Map",
    "sectionPayloadDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "followingBlockDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "identityFingerprint": "176490a67dd7497459f97c7f06da9b391b67cf2f39f2152eacccd94c437bba40",
    "ancestry": [],
    "text": "# Architecture Map",
    "sectionText": "# Architecture Map\n\n```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture Map",
    "anchor": "architecture-map",
    "githubAnchor": "architecture-map",
    "stableAnchor": "h-77b8a1b8c2ff",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "3cbd17c5ad739da3c5f1d5d9895a8289881518833bad2bb7846fcb023b09aafb",
    "sample": "Architecture Map",
    "sectionPayloadDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "followingBlockDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "identityFingerprint": "176490a67dd7497459f97c7f06da9b391b67cf2f39f2152eacccd94c437bba40",
    "ancestry": [],
    "text": "# Architecture Map",
    "sectionText": "# Architecture Map\n\n```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_fa634b3e30b51cd9a715a68c66a6c6cd"
}
```

## Entry claim_f2da2b26518a1b8d568d92d13d967e76

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f2da2b26518a1b8d568d92d13d967e76",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/architecture-map.md",
    "unitDigest": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "identityFingerprint": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "claimId": "claim_f2da2b26518a1b8d568d92d13d967e76",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/architecture-map.md",
    "unitDigest": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "identityFingerprint": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "claimId": "claim_f2da2b26518a1b8d568d92d13d967e76",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 23,
    "textDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "sample": "```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign statu",
    "identityFingerprint": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "ancestry": [
      "Architecture Map"
    ],
    "text": "```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 23,
    "textDigest": "62eb4aa69a84b9d0085b8eadc84efe52f4a854ae07a608d5be5071b72823baa2",
    "sample": "```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign statu",
    "identityFingerprint": "99ece451a770864134a7e22a825d570c4354f213daadd307b7115fb3dbc300c2",
    "ancestry": [
      "Architecture Map"
    ],
    "text": "```txt\nDocument type: Platform architecture map\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Route readers through the whole-system architecture map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-09-13\nRelated:\n- docs/platform/README.md\n- docs/platform/component-boundary.md\n- docs/architecture-map.md\nImplementation: Partial\nProvenance: Promoted anchor from docs/architecture-map.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through the whole-system architecture map; authority follows transitional switchboard\nUse this when: Route readers through the whole-system architecture map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f2da2b26518a1b8d568d92d13d967e76"
}
```

## Entry claim_ba166f5e88cad3fc0ec193c601fa2daa

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ba166f5e88cad3fc0ec193c601fa2daa",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "55116c76bc3191bdf0c3833a325ac3b9744d51cfc364c65cb5cde4db5688c448",
    "identityFingerprint": "ac9f0451d6598713c21b73b770f24d6a910c6009d2e2dbc0c23bf0c141aae431",
    "claimId": "claim_ba166f5e88cad3fc0ec193c601fa2daa",
    "sourceAnchor": "1-how-to-read-this-folder",
    "unitKind": "heading",
    "sourceUnitDigest": "8f3acc2c9875a25d866b98dd0d4903bb68ff8cdb44ff2d653cef53aa2c4b10e8",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "532f02c39b34b61867f5ada2d49f8d775d8ed7bbf46a09461a2d1f6f5741d03c",
      "toUnitDigest": "55116c76bc3191bdf0c3833a325ac3b9744d51cfc364c65cb5cde4db5688c448",
      "fromSourceUnitDigest": "ac23ba89e02455c86ec6e6ca55ec760e7eb475d200b8c93bfa07fbb82752702d",
      "toSourceUnitDigest": "8f3acc2c9875a25d866b98dd0d4903bb68ff8cdb44ff2d653cef53aa2c4b10e8"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "55116c76bc3191bdf0c3833a325ac3b9744d51cfc364c65cb5cde4db5688c448",
    "identityFingerprint": "ac9f0451d6598713c21b73b770f24d6a910c6009d2e2dbc0c23bf0c141aae431",
    "claimId": "claim_ba166f5e88cad3fc0ec193c601fa2daa",
    "sourceAnchor": "1-how-to-read-this-folder",
    "unitKind": "heading",
    "sourceUnitDigest": "8f3acc2c9875a25d866b98dd0d4903bb68ff8cdb44ff2d653cef53aa2c4b10e8",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. How To Read This Folder",
    "anchor": "1-how-to-read-this-folder",
    "githubAnchor": "1-how-to-read-this-folder",
    "stableAnchor": "h-9b387c020dc3",
    "startLine": 1179,
    "endLine": 1179,
    "textDigest": "8f3acc2c9875a25d866b98dd0d4903bb68ff8cdb44ff2d653cef53aa2c4b10e8",
    "sample": "1. How To Read This Folder",
    "sectionPayloadDigest": "cbdc09cd58034a0d7dcf5064832b981c3420cb845aca298595205e13ccd0c2fd",
    "followingBlockDigest": "d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e",
    "identityFingerprint": "ac9f0451d6598713c21b73b770f24d6a910c6009d2e2dbc0c23bf0c141aae431",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture"
    ],
    "text": "#### 1. How To Read This Folder",
    "sectionText": "#### 1. How To Read This Folder\n\nRead boundary before layout:\n\n1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [Host Invocation And Provider Routing](host-invocation-routing/spec.md)\n4. [Node To Rust Component Migration](host-invocation-routing/architecture/node-to-rust-migration.md)\n5. [Packaging And Distribution Architecture](packaging-distribution/README.md)\n\nThe first document answers:\n\n```txt\nWhat components exist?\nWhat responsibility does each component own?\nWhere are the bounded contexts?\nWhich component has authority over each state transition or decision?\nWhich behavior must stay domain-specific instead of moving into foundation?\n```\n\nThe second document answers:\n\n```txt\nWhere should those components live physically in the repo?\nWhich code should be a thin app entrypoint?\nWhich code should become a reusable package?\nWhich source paths are placement, not architectural ownership?\n```\n\nThe third document answers:\n\n```txt\nHow do CLI and remote host use cases enter the same semantic operation path?\nHow does one router select built-in, legacy, process-plugin, or WASM providers?\nWhere do provider discovery, capability grants, and failure normalization live?\n```\n\nThe fourth document answers:\n\n```txt\nHow can one component at a time move from Node to Rust?\nWhich parts of fgos are already thin, partly thin, or not thin yet?\nHow does fgos keep the same CLI and envelope while implementation changes?\nHow does the Rust host delegate whole operations to the legacy Node provider?\nWhen does implementation movement become authority movement?\n```\n\nThe fifth document answers:\n\n```txt\nHow is the project-local fgOS runtime payload selected, installed, verified,\nrepaired, and upgraded?\nWhere is the boundary between global bootstrap, shared web/gateway, project\nruntime adapter, and local project fgOS semantics?\nHow do skills, agents, prose, runner, legacy Node payload, Rust host, and docs\nfit into one distributable payload identity?\n```\n\nDo not invert that order. Folder layout should express component boundaries; it\nshould not create authority by convenience of file location."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 4,
    "title": "1. How To Read This Folder",
    "anchor": "1-how-to-read-this-folder",
    "githubAnchor": "1-how-to-read-this-folder",
    "stableAnchor": "h-91396e96dfeb",
    "startLine": 1180,
    "endLine": 1180,
    "textDigest": "8f3acc2c9875a25d866b98dd0d4903bb68ff8cdb44ff2d653cef53aa2c4b10e8",
    "sample": "1. How To Read This Folder",
    "sectionPayloadDigest": "cbdc09cd58034a0d7dcf5064832b981c3420cb845aca298595205e13ccd0c2fd",
    "followingBlockDigest": "d502c9085325bc99f244af24c20979635885deedbe201ee7eedc972e716cbe7e",
    "identityFingerprint": "ac9f0451d6598713c21b73b770f24d6a910c6009d2e2dbc0c23bf0c141aae431",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture"
    ],
    "text": "#### 1. How To Read This Folder",
    "sectionText": "#### 1. How To Read This Folder\n\nRead boundary before layout:\n\n1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [Host Invocation And Provider Routing](host-invocation-routing/spec.md)\n4. [Node To Rust Component Migration](host-invocation-routing/architecture/node-to-rust-migration.md)\n5. [Packaging And Distribution Architecture](packaging-distribution/README.md)\n\nThe first document answers:\n\n```txt\nWhat components exist?\nWhat responsibility does each component own?\nWhere are the bounded contexts?\nWhich component has authority over each state transition or decision?\nWhich behavior must stay domain-specific instead of moving into foundation?\n```\n\nThe second document answers:\n\n```txt\nWhere should those components live physically in the repo?\nWhich code should be a thin app entrypoint?\nWhich code should become a reusable package?\nWhich source paths are placement, not architectural ownership?\n```\n\nThe third document answers:\n\n```txt\nHow do CLI and remote host use cases enter the same semantic operation path?\nHow does one router select built-in, legacy, process-plugin, or WASM providers?\nWhere do provider discovery, capability grants, and failure normalization live?\n```\n\nThe fourth document answers:\n\n```txt\nHow can one component at a time move from Node to Rust?\nWhich parts of fgos are already thin, partly thin, or not thin yet?\nHow does fgos keep the same CLI and envelope while implementation changes?\nHow does the Rust host delegate whole operations to the legacy Node provider?\nWhen does implementation movement become authority movement?\n```\n\nThe fifth document answers:\n\n```txt\nHow is the project-local fgOS runtime payload selected, installed, verified,\nrepaired, and upgraded?\nWhere is the boundary between global bootstrap, shared web/gateway, project\nruntime adapter, and local project fgOS semantics?\nHow do skills, agents, prose, runner, legacy Node payload, Rust host, and docs\nfit into one distributable payload identity?\n```\n\nDo not invert that order. Folder layout should express component boundaries; it\nshould not create authority by convenience of file location."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ba166f5e88cad3fc0ec193c601fa2daa"
}
```

## Entry claim_8f18b63b71b7d9431414d08beedc3921

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_8f18b63b71b7d9431414d08beedc3921",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "6a20a88acdd9b6bec42c9765a566b9a6ac4b3e8e4a60ce1914cb3227993c6145",
    "identityFingerprint": "a7f1cfec000065c749ec0e9f0dded22e4bd576b95b12557c774ae76da0048ef9",
    "claimId": "claim_8f18b63b71b7d9431414d08beedc3921",
    "sourceAnchor": "2-current-source-during-migration",
    "unitKind": "heading",
    "sourceUnitDigest": "dcddbbebdca7357a6b4d098eff8960aee8c43a5a28932c49e768078b254e8cf7",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "03c3e7a6e9360bdfe2390f626e5602693bd23eb2d69f501f8344e1d6742f715f",
      "toUnitDigest": "6a20a88acdd9b6bec42c9765a566b9a6ac4b3e8e4a60ce1914cb3227993c6145",
      "fromSourceUnitDigest": "ab7d8e897fe548820e7ecc24e66c2788d95eea50a29e2aebe76a163f207975de",
      "toSourceUnitDigest": "dcddbbebdca7357a6b4d098eff8960aee8c43a5a28932c49e768078b254e8cf7"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "d68c1266022940d4b6ab8c86577f43e3ee8e4ae4af0edf98668f295b6181e07f",
    "identityFingerprint": "63a1920e677b3220ea97d5467d6b9c4947e8968721260d08b90b80275555ea97",
    "claimId": "claim_8f18b63b71b7d9431414d08beedc3921",
    "sourceAnchor": "2-current-source-during-migration",
    "unitKind": "heading",
    "sourceUnitDigest": "5341c959c3d2fdd7e6713f825e09d581449633c8f54de7a70ca0421f34cdfd85",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "6a20a88acdd9b6bec42c9765a566b9a6ac4b3e8e4a60ce1914cb3227993c6145",
      "toUnitDigest": "d68c1266022940d4b6ab8c86577f43e3ee8e4ae4af0edf98668f295b6181e07f",
      "fromSourceUnitDigest": "dcddbbebdca7357a6b4d098eff8960aee8c43a5a28932c49e768078b254e8cf7",
      "toSourceUnitDigest": "5341c959c3d2fdd7e6713f825e09d581449633c8f54de7a70ca0421f34cdfd85"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Current Source During Migration",
    "anchor": "2-current-source-during-migration",
    "githubAnchor": "2-current-source-during-migration",
    "stableAnchor": "h-34b5149f8d49",
    "startLine": 38,
    "endLine": 38,
    "textDigest": "dcddbbebdca7357a6b4d098eff8960aee8c43a5a28932c49e768078b254e8cf7",
    "sample": "2. Current Source During Migration",
    "sectionPayloadDigest": "e82fd4a281b8ff2a83c9163f4083a65257286c2845b7d1ef330eeabbd9ad7c92",
    "followingBlockDigest": "5a4f9608c6c88b211b79a9e695b3242279891daf915424ff0dfc42f1ff7ccded",
    "identityFingerprint": "a7f1cfec000065c749ec0e9f0dded22e4bd576b95b12557c774ae76da0048ef9",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 2. Current Source During Migration",
    "sectionText": "## 2. Current Source During Migration\n\nThe current detailed source remains:\n\n| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |\n| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |\n| [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\n\nUntil this anchor is fully promoted, use those sources for detail and update this file as the stable entry point."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "2. Current Source During Migration",
    "anchor": "2-current-source-during-migration",
    "githubAnchor": "2-current-source-during-migration",
    "stableAnchor": "h-34b5149f8d49",
    "startLine": 38,
    "endLine": 38,
    "textDigest": "5341c959c3d2fdd7e6713f825e09d581449633c8f54de7a70ca0421f34cdfd85",
    "sample": "2. Current Source During Migration",
    "sectionPayloadDigest": "5dc5861d60c0dfd83b61cd4a9e3523b1c913a1f2d2d9c083f7a70ed27128d702",
    "followingBlockDigest": "5a4f9608c6c88b211b79a9e695b3242279891daf915424ff0dfc42f1ff7ccded",
    "identityFingerprint": "63a1920e677b3220ea97d5467d6b9c4947e8968721260d08b90b80275555ea97",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 2. Current Source During Migration",
    "sectionText": "## 2. Current Source During Migration\n\nThe current detailed source remains:\n\n| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |\n| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |\n| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |\n\nUntil this anchor is fully promoted, use those sources for detail and update this file as the stable entry point."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_8f18b63b71b7d9431414d08beedc3921"
}
```

## Entry claim_60b200d89cba5da6157ee4c3b7311a2e

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_60b200d89cba5da6157ee4c3b7311a2e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "fec1fa649603d9717bbde26d5325c6b30ff926524e28400249f3d4c1577b3690",
    "identityFingerprint": "93f6a55d180947f73bff3b620e4ee026a3cf53e7709b3ea5adbb69b89eb27c46",
    "claimId": "claim_60b200d89cba5da6157ee4c3b7311a2e",
    "sourceAnchor": "4-current-high-level-components",
    "unitKind": "heading",
    "sourceUnitDigest": "074412d0f27fb46eef0f2f874fa82854cfe3d19f27ec43eb1bceb4234a3c7108",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "92e9eeffa8a85ed91b4286fa4d369f9d56c064de7f86f5d6fb6b32a99362177d",
      "toUnitDigest": "fec1fa649603d9717bbde26d5325c6b30ff926524e28400249f3d4c1577b3690",
      "fromSourceUnitDigest": "97aec22b3b2b93a00664bdb8f17acd9d2ab76d5d4dc90fd0c3f0bf148801c8af",
      "toSourceUnitDigest": "074412d0f27fb46eef0f2f874fa82854cfe3d19f27ec43eb1bceb4234a3c7108"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "e52a98dda8b141fee9641ddd1ba57a19d8f2c4be921358eebd6ff1ba2231430a",
    "identityFingerprint": "c8abe104c3e068a77fe1180ea4082188645604bfb1d0a1f78f4f7744252fae96",
    "claimId": "claim_60b200d89cba5da6157ee4c3b7311a2e",
    "sourceAnchor": "4-current-high-level-components",
    "unitKind": "heading",
    "sourceUnitDigest": "fcb4b0a3c668b8d140c18241d29ebe57991a7197a1696903fe93d346bbed7fdd",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "fec1fa649603d9717bbde26d5325c6b30ff926524e28400249f3d4c1577b3690",
      "toUnitDigest": "e52a98dda8b141fee9641ddd1ba57a19d8f2c4be921358eebd6ff1ba2231430a",
      "fromSourceUnitDigest": "074412d0f27fb46eef0f2f874fa82854cfe3d19f27ec43eb1bceb4234a3c7108",
      "toSourceUnitDigest": "fcb4b0a3c668b8d140c18241d29ebe57991a7197a1696903fe93d346bbed7fdd"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Current High-Level Components",
    "anchor": "4-current-high-level-components",
    "githubAnchor": "4-current-high-level-components",
    "stableAnchor": "h-5396f40fb13f",
    "startLine": 62,
    "endLine": 62,
    "textDigest": "074412d0f27fb46eef0f2f874fa82854cfe3d19f27ec43eb1bceb4234a3c7108",
    "sample": "4. Current High-Level Components",
    "sectionPayloadDigest": "74e2fb4b4284d4ea86d6aa5752da5f8ad013fd89059199bd0c2282fcea6f5455",
    "followingBlockDigest": "36c91b4a266f2cce40ec42a6cbd62b58b528279168a1f18813f26320a368c040",
    "identityFingerprint": "93f6a55d180947f73bff3b620e4ee026a3cf53e7709b3ea5adbb69b89eb27c46",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 4. Current High-Level Components",
    "sectionText": "## 4. Current High-Level Components\n\nThis table is a compact navigation surface, not a full replacement for the advisory docs.\n\n| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |\n| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for \"ai làm / model / persona / cơ chế\" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |\n| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |\n| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\\|status\\|stop`; không phải một phần của herdr và không phải \"herdr-gateway\" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |\n| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |\n| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |\n| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |\n| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |\n| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |\n| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Current High-Level Components",
    "anchor": "4-current-high-level-components",
    "githubAnchor": "4-current-high-level-components",
    "stableAnchor": "h-5396f40fb13f",
    "startLine": 62,
    "endLine": 62,
    "textDigest": "fcb4b0a3c668b8d140c18241d29ebe57991a7197a1696903fe93d346bbed7fdd",
    "sample": "4. Current High-Level Components",
    "sectionPayloadDigest": "dd6fba393f11f764e216d9b64493fad194f9e7ef178f3a59053aafcc8521b9b2",
    "followingBlockDigest": "36c91b4a266f2cce40ec42a6cbd62b58b528279168a1f18813f26320a368c040",
    "identityFingerprint": "c8abe104c3e068a77fe1180ea4082188645604bfb1d0a1f78f4f7744252fae96",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 4. Current High-Level Components",
    "sectionText": "## 4. Current High-Level Components\n\nThis table is a compact navigation surface, not a full replacement for the advisory docs.\n\n| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |\n| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for \"ai làm / model / persona / cơ chế\" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |\n| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |\n| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\\|status\\|stop`; không phải một phần của herdr và không phải \"herdr-gateway\" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |\n| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |\n| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |\n| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |\n| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |\n| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |\n| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |\n| Session Identity (Writer Identity) | Foundation authority for \"who is the writer of this process\" (`{id, source}`). One implementation, the Rust crate `fgos-session-identity` (`packages/session-identity/rust`, native verb `fgos identity`); Observe calls it in process, Node through the facade `src/util/session-identity.mjs`. Owns no state and depends only on `fgos-host-runtime`; Observe depends on it. Grants no lock or claim authority. | [session-identity/spec.md](session-identity/spec.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_60b200d89cba5da6157ee4c3b7311a2e"
}
```

## Entry claim_aad2298c61137cd5bcc2a8a215d139e0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_aad2298c61137cd5bcc2a8a215d139e0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "72b8285b1cbc11122572f59db1b6ac091108bc2af944c250f58f1f3d9068d5fc",
    "identityFingerprint": "21f45ce3a727930816c92e6ff87e33bb8f292a369d809c55821e80228e28bb8f",
    "claimId": "claim_aad2298c61137cd5bcc2a8a215d139e0",
    "sourceAnchor": "5-high-level-component-authority-register",
    "unitKind": "heading",
    "sourceUnitDigest": "e086f83923aac7dad4e323cdf59fd7be32b2feabcc46802ad41baff5a6a406c2",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "c6cfd488df255fd941a0c95f7c6599d78910de050363469a3b09419abcb1b8b9",
      "toUnitDigest": "72b8285b1cbc11122572f59db1b6ac091108bc2af944c250f58f1f3d9068d5fc",
      "fromSourceUnitDigest": "ab0b345ff26b19e4c70142d6b8ea5664b1dbc8bb2197a6aee83a721b72532ad4",
      "toSourceUnitDigest": "e086f83923aac7dad4e323cdf59fd7be32b2feabcc46802ad41baff5a6a406c2"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "72b8285b1cbc11122572f59db1b6ac091108bc2af944c250f58f1f3d9068d5fc",
    "identityFingerprint": "21f45ce3a727930816c92e6ff87e33bb8f292a369d809c55821e80228e28bb8f",
    "claimId": "claim_aad2298c61137cd5bcc2a8a215d139e0",
    "sourceAnchor": "5-high-level-component-authority-register",
    "unitKind": "heading",
    "sourceUnitDigest": "e086f83923aac7dad4e323cdf59fd7be32b2feabcc46802ad41baff5a6a406c2",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. High-Level Component Authority Register",
    "anchor": "5-high-level-component-authority-register",
    "githubAnchor": "5-high-level-component-authority-register",
    "stableAnchor": "h-9ad4daec6413",
    "startLine": 230,
    "endLine": 230,
    "textDigest": "e086f83923aac7dad4e323cdf59fd7be32b2feabcc46802ad41baff5a6a406c2",
    "sample": "5. High-Level Component Authority Register",
    "sectionPayloadDigest": "4eeeb69541ab9f30d251083c547f51f09099199ebdceb077bad9f7f9dc0bf7e7",
    "followingBlockDigest": "7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056",
    "identityFingerprint": "21f45ce3a727930816c92e6ff87e33bb8f292a369d809c55821e80228e28bb8f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 5. High-Level Component Authority Register",
    "sectionText": "#### 5. High-Level Component Authority Register\n\nThe lower-level boundaries below should not be mapped one-to-one into\ntop-level modules, services, or packages. That would make the implementation\ntoo fragmented. They are a mix of bounded contexts and authority boundaries,\nand should be grouped into a smaller set of practical components.\n\nA component boundary can link to several documents because ownership is split\nbetween product spec, architecture contract, and implementation reality. The\ntable below is the management view for the whole system.\n\n| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](work-state/spec.md), [Work Item Lifecycle Vision](vision.md), [System Overview](system-overview/spec.md) |\n| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](runner/spec.md), [Platform Component Boundary](component-boundary.md) |\n| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](runner/spec.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) |\n| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](runner/spec.md) |\n| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](domainization/architecture/domainization.md), [System Overview](system-overview/spec.md), [Work Item Lifecycle Vision](vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |\n| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](claude-plugin/spec.md), [Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md), [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](work-state/contracts/cli-io-contract.md) |\n| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](packaging-distribution/spec.md), [Distribution Vision](packaging-distribution/history/distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |\n| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](system-overview/spec.md) |\n\nThe collaboration shape should stay:\n\n```txt\nHost / Surface\n  -> Work Lifecycle Engine\n       owns Work lifecycle and may ask Agent Coordination to perform a legal\n       operation\n  -> Agent Coordination Engine\n       can also run standalone without Work\n\nAgent Coordination Engine\n  -> Team Cognition Engine\n       proposes cognitive strategy, roles, tasks, topology, and synthesis plan\n  -> Dispatch And Execution Engine\n       resolves and launches governed execution\n  -> Run Result Evaluator\n       normalizes RunResult, evidence, and confidence\n  -> Work Lifecycle Engine\n       returns evidence/recommendations only; Work verbs decide lifecycle\n\nDomain Components And Extension Layer supplies domain workflow definitions,\nprotocol packages, domain harnesses, evidence policy adapters, and organization\npolicy through controlled ports.\n```\n\nUnder this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.\nIt is a sibling fgOS component that can consume Agent Coordination as an\nexecution/collaboration capability. It should stay domain-agnostic: marketing,\noperations, coding, or another domain can use Work items to manage units of\nwork without inheriting coding-specific Git, worktree, merge, or technical\napproval behavior.\n\nThe split is: the Work engine owns domain-agnostic work-unit lifecycle and\nhuman gates; a domain extension owns domain-specific approval semantics,\nresource isolation, branch/worktree behavior, and merge mechanics when that\ndomain needs them.\n\nA Coding Domain Component is a high-level domain package, not a small\nextension. Its job is to own coding-specific product and technical behavior\nwhile consuming platform engines for generic lifecycle and collaboration.\n\nInside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix\nWorkflow` are separate subcomponents. The core owns repository mechanics and\ntechnical policy. The workflows own different coding work shapes. The component\nuses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to\nrun agent collaboration.\n\n`Team Cognition Engine` is a major internal module of Agent Coordination\nEngine, not a protocol package. Protocol packages are recipes/configuration.\nThe engine is the runtime reasoning component that consumes an objective,\nsession state, optional protocol definition, and domain/org constraints, then\nproposes the next bounded coordination action.\n\n`Run Result Evaluator` is not a generic verification harness. Its scope is\nspecific: evaluate the result of one Run for one Assignment. Domain-specific\nevidence adapters may provide proof inputs, but the evaluator owns the final\nRunResult confidence decision."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 4,
    "title": "5. High-Level Component Authority Register",
    "anchor": "5-high-level-component-authority-register",
    "githubAnchor": "5-high-level-component-authority-register",
    "stableAnchor": "h-ba1c68d4ea6a",
    "startLine": 231,
    "endLine": 231,
    "textDigest": "e086f83923aac7dad4e323cdf59fd7be32b2feabcc46802ad41baff5a6a406c2",
    "sample": "5. High-Level Component Authority Register",
    "sectionPayloadDigest": "4eeeb69541ab9f30d251083c547f51f09099199ebdceb077bad9f7f9dc0bf7e7",
    "followingBlockDigest": "7cb40f48a17a3f179d8bf58fd03d67ead3d86aa57776986f4130c297fa881056",
    "identityFingerprint": "21f45ce3a727930816c92e6ff87e33bb8f292a369d809c55821e80228e28bb8f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 5. High-Level Component Authority Register",
    "sectionText": "#### 5. High-Level Component Authority Register\n\nThe lower-level boundaries below should not be mapped one-to-one into\ntop-level modules, services, or packages. That would make the implementation\ntoo fragmented. They are a mix of bounded contexts and authority boundaries,\nand should be grouped into a smaller set of practical components.\n\nA component boundary can link to several documents because ownership is split\nbetween product spec, architecture contract, and implementation reality. The\ntable below is the management view for the whole system.\n\n| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](work-state/spec.md), [Work Item Lifecycle Vision](vision.md), [System Overview](system-overview/spec.md) |\n| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](runner/spec.md), [Platform Component Boundary](component-boundary.md) |\n| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](runner/spec.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) |\n| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](runner/spec.md) |\n| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](domainization/architecture/domainization.md), [System Overview](system-overview/spec.md), [Work Item Lifecycle Vision](vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |\n| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](claude-plugin/spec.md), [Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md), [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](work-state/contracts/cli-io-contract.md) |\n| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](packaging-distribution/spec.md), [Distribution Vision](packaging-distribution/history/distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |\n| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](system-overview/spec.md) |\n\nThe collaboration shape should stay:\n\n```txt\nHost / Surface\n  -> Work Lifecycle Engine\n       owns Work lifecycle and may ask Agent Coordination to perform a legal\n       operation\n  -> Agent Coordination Engine\n       can also run standalone without Work\n\nAgent Coordination Engine\n  -> Team Cognition Engine\n       proposes cognitive strategy, roles, tasks, topology, and synthesis plan\n  -> Dispatch And Execution Engine\n       resolves and launches governed execution\n  -> Run Result Evaluator\n       normalizes RunResult, evidence, and confidence\n  -> Work Lifecycle Engine\n       returns evidence/recommendations only; Work verbs decide lifecycle\n\nDomain Components And Extension Layer supplies domain workflow definitions,\nprotocol packages, domain harnesses, evidence policy adapters, and organization\npolicy through controlled ports.\n```\n\nUnder this view, `Work Lifecycle Engine` is not an Agent Coordination submodule.\nIt is a sibling fgOS component that can consume Agent Coordination as an\nexecution/collaboration capability. It should stay domain-agnostic: marketing,\noperations, coding, or another domain can use Work items to manage units of\nwork without inheriting coding-specific Git, worktree, merge, or technical\napproval behavior.\n\nThe split is: the Work engine owns domain-agnostic work-unit lifecycle and\nhuman gates; a domain extension owns domain-specific approval semantics,\nresource isolation, branch/worktree behavior, and merge mechanics when that\ndomain needs them.\n\nA Coding Domain Component is a high-level domain package, not a small\nextension. Its job is to own coding-specific product and technical behavior\nwhile consuming platform engines for generic lifecycle and collaboration.\n\nInside it, `Coding Domain Core`, `Coding Feature Workflow`, and `Bugfix\nWorkflow` are separate subcomponents. The core owns repository mechanics and\ntechnical policy. The workflows own different coding work shapes. The component\nuses Work Lifecycle Engine to manage Work units and Agent Coordination Engine to\nrun agent collaboration.\n\n`Team Cognition Engine` is a major internal module of Agent Coordination\nEngine, not a protocol package. Protocol packages are recipes/configuration.\nThe engine is the runtime reasoning component that consumes an objective,\nsession state, optional protocol definition, and domain/org constraints, then\nproposes the next bounded coordination action.\n\n`Run Result Evaluator` is not a generic verification harness. Its scope is\nspecific: evaluate the result of one Run for one Assignment. Domain-specific\nevidence adapters may provide proof inputs, but the evaluator owns the final\nRunResult confidence decision."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_aad2298c61137cd5bcc2a8a215d139e0"
}
```

## Entry claim_5d3c632ef3e6b7631307307d54682e71

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5d3c632ef3e6b7631307307d54682e71",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "40fdf895180bfbeb297fd86fd0bf67ab4d4b72b23afa7ac774fa12c08d7a9109",
    "identityFingerprint": "43e95a75502f6f23ec256f647ce819c1b3b5f70b642437bf5185afc1d1a390d6",
    "claimId": "claim_5d3c632ef3e6b7631307307d54682e71",
    "sourceAnchor": "6-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "677e131ff3c2e8e607e3296a01cd1ee9371fc9d44ac93a1ad08b6fa54dac97c1",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "5636853f32bfbc240bebd99396381c383544cddcb47ae23d8770aadf2fab38a5",
      "toUnitDigest": "40fdf895180bfbeb297fd86fd0bf67ab4d4b72b23afa7ac774fa12c08d7a9109",
      "fromSourceUnitDigest": "a482903b6c75ae6d015230cbf007c93ae168da2a65ad38e8ad0d16b341c2222a",
      "toSourceUnitDigest": "677e131ff3c2e8e607e3296a01cd1ee9371fc9d44ac93a1ad08b6fa54dac97c1"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "40fdf895180bfbeb297fd86fd0bf67ab4d4b72b23afa7ac774fa12c08d7a9109",
    "identityFingerprint": "43e95a75502f6f23ec256f647ce819c1b3b5f70b642437bf5185afc1d1a390d6",
    "claimId": "claim_5d3c632ef3e6b7631307307d54682e71",
    "sourceAnchor": "6-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "677e131ff3c2e8e607e3296a01cd1ee9371fc9d44ac93a1ad08b6fa54dac97c1",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "6. Related Files",
    "anchor": "6-related-files",
    "githubAnchor": "6-related-files",
    "stableAnchor": "h-db5da2ac3799",
    "startLine": 90,
    "endLine": 90,
    "textDigest": "677e131ff3c2e8e607e3296a01cd1ee9371fc9d44ac93a1ad08b6fa54dac97c1",
    "sample": "6. Related Files",
    "sectionPayloadDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "followingBlockDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "identityFingerprint": "43e95a75502f6f23ec256f647ce819c1b3b5f70b642437bf5185afc1d1a390d6",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 6. Related Files",
    "sectionText": "## 6. Related Files\n\n| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\n| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| observe component | [observe/spec.md](observe/spec.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "6. Related Files",
    "anchor": "6-related-files",
    "githubAnchor": "6-related-files",
    "stableAnchor": "h-9e5496bbe91b",
    "startLine": 91,
    "endLine": 91,
    "textDigest": "677e131ff3c2e8e607e3296a01cd1ee9371fc9d44ac93a1ad08b6fa54dac97c1",
    "sample": "6. Related Files",
    "sectionPayloadDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "followingBlockDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "identityFingerprint": "43e95a75502f6f23ec256f647ce819c1b3b5f70b642437bf5185afc1d1a390d6",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "## 6. Related Files",
    "sectionText": "## 6. Related Files\n\n| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\n| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| observe component | [observe/spec.md](observe/spec.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_5d3c632ef3e6b7631307307d54682e71"
}
```

## Entry claim_95f55e6965a8591505526258baa55b4c

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_95f55e6965a8591505526258baa55b4c",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "50f1f8bec7c93e8e726aec12a5c4fe1f2418254e62c3457098280628d09d49c0",
    "identityFingerprint": "ac22c0fa9518fa0ea876e544b0cd822078af00088f324eac7c80311090a17a2e",
    "claimId": "claim_95f55e6965a8591505526258baa55b4c",
    "sourceAnchor": "7-contract-authority-matrix",
    "unitKind": "heading",
    "sourceUnitDigest": "2d963824a78865150ea00c06c9c03bcd89c2d0c3488c8d2148bd9038e732296a",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "fcacd335bab622c59946dbe29b9aca2354183a67dfbf743d60890a3a136d61b8",
      "toUnitDigest": "50f1f8bec7c93e8e726aec12a5c4fe1f2418254e62c3457098280628d09d49c0",
      "fromSourceUnitDigest": "8f99ea365de4aed673b87511d51775ce357be6be3a54f36f8bf013ee9338d083",
      "toSourceUnitDigest": "2d963824a78865150ea00c06c9c03bcd89c2d0c3488c8d2148bd9038e732296a"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "2b271db4aa08a18da957157a5e5b393da85bd14295d26c9c12dcf8f32a24364f",
    "identityFingerprint": "2bfc54facfd117c1072a54083b1d382820bbd59b390d3a0d26e2ca5c3927487a",
    "claimId": "claim_95f55e6965a8591505526258baa55b4c",
    "sourceAnchor": "7-contract-authority-matrix",
    "unitKind": "heading",
    "sourceUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "50f1f8bec7c93e8e726aec12a5c4fe1f2418254e62c3457098280628d09d49c0",
      "toUnitDigest": "2b271db4aa08a18da957157a5e5b393da85bd14295d26c9c12dcf8f32a24364f",
      "fromSourceUnitDigest": "2d963824a78865150ea00c06c9c03bcd89c2d0c3488c8d2148bd9038e732296a",
      "toSourceUnitDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-9588cce222dc",
    "startLine": 380,
    "endLine": 380,
    "textDigest": "2d963824a78865150ea00c06c9c03bcd89c2d0c3488c8d2148bd9038e732296a",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "992abb07a98c7a45aabd58a43e5e3a1f859f16953eae0c6ee37bfd9085e61871",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "ac22c0fa9518fa0ea876e544b0cd822078af00088f324eac7c80311090a17a2e",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 7. Contract Authority Matrix",
    "sectionText": "#### 7. Contract Authority Matrix\n\nThe existing contracts should be read as shared system contracts with explicit\ncomponent ownership. A document may describe a chain across components, but the\nauthority for each decision should still belong to one component.\n\nIn this advisory, a contract is not a component. A contract is the public\ninterface, schema, or invariant owned by the component that controls the\nbehavior. Other components interact through that contract and must not\nre-derive it privately.\n\n| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](../architect/agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |\n\nTwo contract files deserve special care:\n\n1. `assignment-run-runresult.md` is a chain contract, not a single-component\n   ownership contract. Assignment, Run, and RunResult should remain separate\n   authority boundaries even if they are documented together.\n2. `flow-definition.md` carries policy and evidence requirement fields, but\n   those are declared requirements. Effective provider/model resolution belongs\n   to Dispatch And Execution, and confidence computation belongs to the Run\n   Result Evaluator.\n\nThree coding-domain sources deserve the same treatment:\n\n1. `domains/coding/workflows/feature.yaml` is the source for the feature\n   workflow's legal stage operations. `planning.validate-plan` should be read\n   from here before any architectural question is asked.\n2. `domains/coding/task-specs/*.md` are the task contracts. They should carry\n   collaboration triggers and return-shape expectations.\n3. `domains/coding/skills/*` are executor doctrine. They can describe how to do\n   the work, but they do not own lifecycle movement or dispatch governance."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 4,
    "title": "7. Contract Authority Matrix",
    "anchor": "7-contract-authority-matrix",
    "githubAnchor": "7-contract-authority-matrix",
    "stableAnchor": "h-07ffc80a3f93",
    "startLine": 381,
    "endLine": 381,
    "textDigest": "1788408993b6607a28c59c3925c30846ec8eaaf79c32672b36ca78c29969d35c",
    "sample": "7. Contract Authority Matrix",
    "sectionPayloadDigest": "79fa3ff145b22bc40113febe7e716cb940d792e1155830ca3192a4dec4ce4e71",
    "followingBlockDigest": "624f0470e956272b4aa288c111d0f175986229add08fe5739a0bf474e4503e8f",
    "identityFingerprint": "2bfc54facfd117c1072a54083b1d382820bbd59b390d3a0d26e2ca5c3927487a",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 7. Contract Authority Matrix",
    "sectionText": "#### 7. Contract Authority Matrix\n\nThe existing contracts should be read as shared system contracts with explicit\ncomponent ownership. A document may describe a chain across components, but the\nauthority for each decision should still belong to one component.\n\nIn this advisory, a contract is not a component. A contract is the public\ninterface, schema, or invariant owned by the component that controls the\nbehavior. Other components interact through that contract and must not\nre-derive it privately.\n\n| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |\n\nTwo contract files deserve special care:\n\n1. `assignment-run-runresult.md` is a chain contract, not a single-component\n   ownership contract. Assignment, Run, and RunResult should remain separate\n   authority boundaries even if they are documented together.\n2. `flow-definition.md` carries policy and evidence requirement fields, but\n   those are declared requirements. Effective provider/model resolution belongs\n   to Dispatch And Execution, and confidence computation belongs to the Run\n   Result Evaluator.\n\nThree coding-domain sources deserve the same treatment:\n\n1. `domains/coding/workflows/feature.yaml` is the source for the feature\n   workflow's legal stage operations. `planning.validate-plan` should be read\n   from here before any architectural question is asked.\n2. `domains/coding/task-specs/*.md` are the task contracts. They should carry\n   collaboration triggers and return-shape expectations.\n3. `domains/coding/skills/*` are executor doctrine. They can describe how to do\n   the work, but they do not own lifecycle movement or dispatch governance."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_95f55e6965a8591505526258baa55b4c"
}
```

## Entry claim_9362d89b2708a5c72c2fe9c9fc6747b4

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9362d89b2708a5c72c2fe9c9fc6747b4",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "db6de2fa959dc6f2a52896dc62aafdf84d7abfec03dd35e18411821b2191eb58",
    "identityFingerprint": "f61cd1c1d43465ab64b89710736968f198f1d6457db6db6c7fbd37ddf35eb86a",
    "claimId": "claim_9362d89b2708a5c72c2fe9c9fc6747b4",
    "sourceAnchor": "8-internal-boundary-map",
    "unitKind": "heading",
    "sourceUnitDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "35404c8f33aab8f0714161199d814f1a7eb0e8db0cdd4834ea8d029e5e213949",
      "toUnitDigest": "db6de2fa959dc6f2a52896dc62aafdf84d7abfec03dd35e18411821b2191eb58",
      "fromSourceUnitDigest": "7334b3174da2c73d1c452c30506f563c0e225c82493dcd181101f62e254f4302",
      "toSourceUnitDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "db6de2fa959dc6f2a52896dc62aafdf84d7abfec03dd35e18411821b2191eb58",
    "identityFingerprint": "f61cd1c1d43465ab64b89710736968f198f1d6457db6db6c7fbd37ddf35eb86a",
    "claimId": "claim_9362d89b2708a5c72c2fe9c9fc6747b4",
    "sourceAnchor": "8-internal-boundary-map",
    "unitKind": "heading",
    "sourceUnitDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Internal Boundary Map",
    "anchor": "8-internal-boundary-map",
    "githubAnchor": "8-internal-boundary-map",
    "stableAnchor": "h-b629c0217787",
    "startLine": 428,
    "endLine": 428,
    "textDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479",
    "sample": "8. Internal Boundary Map",
    "sectionPayloadDigest": "1b4ede13ccdcc00f45ecc393189af65e3c689214454ea7b5478d71a6f123292c",
    "followingBlockDigest": "e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19",
    "identityFingerprint": "f61cd1c1d43465ab64b89710736968f198f1d6457db6db6c7fbd37ddf35eb86a",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 8. Internal Boundary Map",
    "sectionText": "#### 8. Internal Boundary Map\n\nThese are lower-level boundaries that can live inside the high-level components\nabove. Some are bounded contexts with their own vocabulary and model; some are\nauthority boundaries that may remain as explicit ports, contracts, or policy\nchecks rather than standalone modules.\n\n| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |\n| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |\n| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |\n| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |\n| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |\n| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |\n| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |\n| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |\n| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |\n| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |\n| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |\n| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |\n| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |\n| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |\n| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 4,
    "title": "8. Internal Boundary Map",
    "anchor": "8-internal-boundary-map",
    "githubAnchor": "8-internal-boundary-map",
    "stableAnchor": "h-f5ea41b276bb",
    "startLine": 429,
    "endLine": 429,
    "textDigest": "a9dfd52ce5279d1126f5acff4866e16263c4d65ac6777f2a6a2e692afefce479",
    "sample": "8. Internal Boundary Map",
    "sectionPayloadDigest": "1b4ede13ccdcc00f45ecc393189af65e3c689214454ea7b5478d71a6f123292c",
    "followingBlockDigest": "e1e06122c7338e94d1bd360b83b455ea69f6a538127efe50836a045c70bc3d19",
    "identityFingerprint": "f61cd1c1d43465ab64b89710736968f198f1d6457db6db6c7fbd37ddf35eb86a",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "#### 8. Internal Boundary Map",
    "sectionText": "#### 8. Internal Boundary Map\n\nThese are lower-level boundaries that can live inside the high-level components\nabove. Some are bounded contexts with their own vocabulary and model; some are\nauthority boundaries that may remain as explicit ports, contracts, or policy\nchecks rather than standalone modules.\n\n| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |\n| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |\n| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |\n| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |\n| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |\n| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |\n| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |\n| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |\n| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |\n| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |\n| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |\n| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |\n| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |\n| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |\n| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9362d89b2708a5c72c2fe9c9fc6747b4"
}
```

## Entry claim_cdcd06c4f58641e5a125f6fe052d21ed

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cdcd06c4f58641e5a125f6fe052d21ed",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "b69f8c7ef9608a1b9ed49b2fefb56beb6cd2d835f0d72b48c107199e3d026a9f",
    "identityFingerprint": "2afca73e84be6f572bb99fd9f2b338498cba716452552e16ad17e46e202785fb",
    "claimId": "claim_cdcd06c4f58641e5a125f6fe052d21ed",
    "sourceAnchor": "canonical-architecture-and-specs",
    "unitKind": "heading",
    "sourceUnitDigest": "d5984df97888ec0c8a79017b5053c0b6377b1109ccce2b56fa13331071ac41e3",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "d15f926429867b4fce86df6afe76a5dce8c94382f2216b5c00a4dfb95e395c08",
      "toUnitDigest": "b69f8c7ef9608a1b9ed49b2fefb56beb6cd2d835f0d72b48c107199e3d026a9f",
      "fromSourceUnitDigest": "130bf89bd3541df014e8f4a75f7e1782a4ac388294b5c6a6046505abf5f08ff7",
      "toSourceUnitDigest": "d5984df97888ec0c8a79017b5053c0b6377b1109ccce2b56fa13331071ac41e3"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "b69f8c7ef9608a1b9ed49b2fefb56beb6cd2d835f0d72b48c107199e3d026a9f",
    "identityFingerprint": "2afca73e84be6f572bb99fd9f2b338498cba716452552e16ad17e46e202785fb",
    "claimId": "claim_cdcd06c4f58641e5a125f6fe052d21ed",
    "sourceAnchor": "canonical-architecture-and-specs",
    "unitKind": "heading",
    "sourceUnitDigest": "d5984df97888ec0c8a79017b5053c0b6377b1109ccce2b56fa13331071ac41e3",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Canonical Architecture And Specs",
    "anchor": "canonical-architecture-and-specs",
    "githubAnchor": "canonical-architecture-and-specs",
    "stableAnchor": "h-5658f3bd523a",
    "startLine": 1358,
    "endLine": 1358,
    "textDigest": "d5984df97888ec0c8a79017b5053c0b6377b1109ccce2b56fa13331071ac41e3",
    "sample": "Canonical Architecture And Specs",
    "sectionPayloadDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "followingBlockDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "identityFingerprint": "2afca73e84be6f572bb99fd9f2b338498cba716452552e16ad17e46e202785fb",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links"
    ],
    "text": "##### Canonical Architecture And Specs",
    "sectionText": "##### Canonical Architecture And Specs\n\n- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, shared\n  entities, actors, and cross-area flows.\n- [Platform Foundations](platform-foundations.md) — locked platform laws\n  and durability/DoD doctrine.\n- [Work Item Lifecycle Vision](vision.md) — base\n  workflow and coding-specific lifecycle mapping.\n- [Distribution Vision](packaging-distribution/history/distribution-vision.md) — install/setup/doctor\n  direction and config/default registration posture.\n- [Domainization Architecture](domainization/architecture/domainization.md) — core vs domain\n  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and\n  agent boundaries."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Canonical Architecture And Specs",
    "anchor": "canonical-architecture-and-specs",
    "githubAnchor": "canonical-architecture-and-specs",
    "stableAnchor": "h-9b8988c315bb",
    "startLine": 1359,
    "endLine": 1359,
    "textDigest": "d5984df97888ec0c8a79017b5053c0b6377b1109ccce2b56fa13331071ac41e3",
    "sample": "Canonical Architecture And Specs",
    "sectionPayloadDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "followingBlockDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "identityFingerprint": "2afca73e84be6f572bb99fd9f2b338498cba716452552e16ad17e46e202785fb",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links"
    ],
    "text": "##### Canonical Architecture And Specs",
    "sectionText": "##### Canonical Architecture And Specs\n\n- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, shared\n  entities, actors, and cross-area flows.\n- [Platform Foundations](platform-foundations.md) — locked platform laws\n  and durability/DoD doctrine.\n- [Work Item Lifecycle Vision](vision.md) — base\n  workflow and coding-specific lifecycle mapping.\n- [Distribution Vision](packaging-distribution/history/distribution-vision.md) — install/setup/doctor\n  direction and config/default registration posture.\n- [Domainization Architecture](domainization/architecture/domainization.md) — core vs domain\n  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and\n  agent boundaries."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cdcd06c4f58641e5a125f6fe052d21ed"
}
```

## Entry claim_b3accab399a342e74cfc9f0a80322ab0

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b3accab399a342e74cfc9f0a80322ab0",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "ea4233e340f8b7c5fc9b3789a6269744d868a09bf0dd5af26815fb25cd1af5f2",
    "identityFingerprint": "b3822eac51b64f2be92dc32e365bbef66aa55b89f03a31b04fe2fd3c86f696da",
    "claimId": "claim_b3accab399a342e74cfc9f0a80322ab0",
    "sourceAnchor": "component-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "a8cffab152a69e4f1e96ef38b85d2aea82d0636a2787d1f6cf96bdc51deef0ea",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "a7a748eadb2eba9ee87c7e9b923a99bd9718d24826a001e5f74182dc41d6a7fd",
      "toUnitDigest": "ea4233e340f8b7c5fc9b3789a6269744d868a09bf0dd5af26815fb25cd1af5f2",
      "fromSourceUnitDigest": "725363f18a5458e00b5f7d577e388c99e8f694d6d53f8b93f66fdc5bd2e7bf64",
      "toSourceUnitDigest": "a8cffab152a69e4f1e96ef38b85d2aea82d0636a2787d1f6cf96bdc51deef0ea"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "ea4233e340f8b7c5fc9b3789a6269744d868a09bf0dd5af26815fb25cd1af5f2",
    "identityFingerprint": "b3822eac51b64f2be92dc32e365bbef66aa55b89f03a31b04fe2fd3c86f696da",
    "claimId": "claim_b3accab399a342e74cfc9f0a80322ab0",
    "sourceAnchor": "component-boundary",
    "unitKind": "heading",
    "sourceUnitDigest": "a8cffab152a69e4f1e96ef38b85d2aea82d0636a2787d1f6cf96bdc51deef0ea",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a8cffab152a69e4f1e96ef38b85d2aea82d0636a2787d1f6cf96bdc51deef0ea",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "followingBlockDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "identityFingerprint": "b3822eac51b64f2be92dc32e365bbef66aa55b89f03a31b04fe2fd3c86f696da",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Component Boundary",
    "anchor": "component-boundary",
    "githubAnchor": "component-boundary",
    "stableAnchor": "h-065adbde00f9",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "a8cffab152a69e4f1e96ef38b85d2aea82d0636a2787d1f6cf96bdc51deef0ea",
    "sample": "Component Boundary",
    "sectionPayloadDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "followingBlockDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "identityFingerprint": "b3822eac51b64f2be92dc32e365bbef66aa55b89f03a31b04fe2fd3c86f696da",
    "ancestry": [],
    "text": "# Component Boundary",
    "sectionText": "# Component Boundary\n\n```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b3accab399a342e74cfc9f0a80322ab0"
}
```

## Entry claim_bb8378cc937f647e5e109fa99bbffe3e

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_bb8378cc937f647e5e109fa99bbffe3e",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "42e9d8863107b47ae52da5258b1bbe3ac47f7a1aad89edb3d0ed63a42e062d46",
    "identityFingerprint": "a5c541f4de04b7372585202931d0c645c8e560c2baee755edc44e6434f247e9f",
    "claimId": "claim_bb8378cc937f647e5e109fa99bbffe3e",
    "sourceAnchor": "component-boundary-advisory",
    "unitKind": "heading",
    "sourceUnitDigest": "457c2097e525258924d9dcf3bef70ebf0bf716e268b245048d5ae364fca41f8e",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "d1ca96dd79b0242e3abc1a1aed2cb18ae69da9715cea2e506fdf6ef4b3a4f985",
      "toUnitDigest": "42e9d8863107b47ae52da5258b1bbe3ac47f7a1aad89edb3d0ed63a42e062d46",
      "fromSourceUnitDigest": "5fd7d0b1779d9f3832ce6bfaf07313e416a59d4a4940f41ca6d13ebe0ebf6d3e",
      "toSourceUnitDigest": "457c2097e525258924d9dcf3bef70ebf0bf716e268b245048d5ae364fca41f8e"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "42e9d8863107b47ae52da5258b1bbe3ac47f7a1aad89edb3d0ed63a42e062d46",
    "identityFingerprint": "a5c541f4de04b7372585202931d0c645c8e560c2baee755edc44e6434f247e9f",
    "claimId": "claim_bb8378cc937f647e5e109fa99bbffe3e",
    "sourceAnchor": "component-boundary-advisory",
    "unitKind": "heading",
    "sourceUnitDigest": "457c2097e525258924d9dcf3bef70ebf0bf716e268b245048d5ae364fca41f8e",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Component Boundary Advisory",
    "anchor": "component-boundary-advisory",
    "githubAnchor": "component-boundary-advisory",
    "stableAnchor": "h-1e39b6d0f11b",
    "startLine": 1242,
    "endLine": 1242,
    "textDigest": "457c2097e525258924d9dcf3bef70ebf0bf716e268b245048d5ae364fca41f8e",
    "sample": "Component Boundary Advisory",
    "sectionPayloadDigest": "6e73f9182919b3335ef08f420516063176e165fe5398bdde19cfbf646a1de90b",
    "followingBlockDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "identityFingerprint": "a5c541f4de04b7372585202931d0c645c8e560c2baee755edc44e6434f247e9f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Component Boundary Advisory",
    "sectionText": "##### Component Boundary Advisory\n\n[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority\nboundary.\n\nIt asks whether fgOS is split at the right conceptual boundaries: Work\nLifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,\nDomain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,\nlearning, and the additional boundaries already visible in code.\n\nUse this document when deciding:\n\n- whether a behavior belongs in foundation or a domain;\n- whether Coding Domain is owning enough of its coding-specific behavior;\n- whether Work Lifecycle remains domain-agnostic;\n- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses\n  are overlapping;\n- whether a refactor is clarifying an authority boundary or merely moving\n  files.\n\nFor folder-level domain authoring shape, domain manifest/workflow files,\ndomain-scoped doctrine, task-spec placement, skill/agent authoring sources, and\ndomain-siloing enforcement, use\n[Domainization Architecture](domainization/architecture/domainization.md)."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Component Boundary Advisory",
    "anchor": "component-boundary-advisory",
    "githubAnchor": "component-boundary-advisory",
    "stableAnchor": "h-d7f37a1ce526",
    "startLine": 1243,
    "endLine": 1243,
    "textDigest": "457c2097e525258924d9dcf3bef70ebf0bf716e268b245048d5ae364fca41f8e",
    "sample": "Component Boundary Advisory",
    "sectionPayloadDigest": "6e73f9182919b3335ef08f420516063176e165fe5398bdde19cfbf646a1de90b",
    "followingBlockDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "identityFingerprint": "a5c541f4de04b7372585202931d0c645c8e560c2baee755edc44e6434f247e9f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Component Boundary Advisory",
    "sectionText": "##### Component Boundary Advisory\n\n[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority\nboundary.\n\nIt asks whether fgOS is split at the right conceptual boundaries: Work\nLifecycle, Agent Coordination, Dispatch And Execution, Run Result Evaluation,\nDomain Components, Host Surfaces, setup/doctor/distribution, gateway/Herdr,\nlearning, and the additional boundaries already visible in code.\n\nUse this document when deciding:\n\n- whether a behavior belongs in foundation or a domain;\n- whether Coding Domain is owning enough of its coding-specific behavior;\n- whether Work Lifecycle remains domain-agnostic;\n- whether Dispatch, RunResult evaluation, workflow driving, and domain harnesses\n  are overlapping;\n- whether a refactor is clarifying an authority boundary or merely moving\n  files.\n\nFor folder-level domain authoring shape, domain manifest/workflow files,\ndomain-scoped doctrine, task-spec placement, skill/agent authoring sources, and\ndomain-siloing enforcement, use\n[Domainization Architecture](domainization/architecture/domainization.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_bb8378cc937f647e5e109fa99bbffe3e"
}
```

## Entry claim_e961b2d6995309157ba3474bc4531d93

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e961b2d6995309157ba3474bc4531d93",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "054a0c20554a3a84627a9c3468d36ca82d1412d31ebc9d94a50e47be5f394e9b",
    "identityFingerprint": "a2c715ef69df470e08d06d5efaf838bc9f631fd78e9990162d355c7e31b5290f",
    "claimId": "claim_e961b2d6995309157ba3474bc4531d93",
    "sourceAnchor": "fgos-component-boundary-advisory",
    "unitKind": "heading",
    "sourceUnitDigest": "5d693cd0376780c965e59de839cb3db8439d9c27b2810c9c951ca99352e0c3ba",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "0f48e71dee76a89ce3cd702dd244925ddacc611c238541ffeea1214839eac9f0",
      "toUnitDigest": "054a0c20554a3a84627a9c3468d36ca82d1412d31ebc9d94a50e47be5f394e9b",
      "fromSourceUnitDigest": "cef01b7bcb79441b21c155752aa4ba1a0f7802df7e79f95fa41eb97ec39c80bd",
      "toSourceUnitDigest": "5d693cd0376780c965e59de839cb3db8439d9c27b2810c9c951ca99352e0c3ba"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "054a0c20554a3a84627a9c3468d36ca82d1412d31ebc9d94a50e47be5f394e9b",
    "identityFingerprint": "a2c715ef69df470e08d06d5efaf838bc9f631fd78e9990162d355c7e31b5290f",
    "claimId": "claim_e961b2d6995309157ba3474bc4531d93",
    "sourceAnchor": "fgos-component-boundary-advisory",
    "unitKind": "heading",
    "sourceUnitDigest": "5d693cd0376780c965e59de839cb3db8439d9c27b2810c9c951ca99352e0c3ba",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 3,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-52d3948b9de6",
    "startLine": 104,
    "endLine": 104,
    "textDigest": "5d693cd0376780c965e59de839cb3db8439d9c27b2810c9c951ca99352e0c3ba",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "followingBlockDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "identityFingerprint": "a2c715ef69df470e08d06d5efaf838bc9f631fd78e9990162d355c7e31b5290f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage"
    ],
    "text": "### fgOS Component Boundary Advisory",
    "sectionText": "### fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](architecture-map.md), [System Overview](system-overview/spec.md), [Platform Foundations](platform-foundations.md), [Domainization Architecture](domainization/architecture/domainization.md), [Agent Coordination Foundation Vision](agent-coordination/vision.md), [Concept Relationships](agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md), [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 3,
    "title": "fgOS Component Boundary Advisory",
    "anchor": "fgos-component-boundary-advisory",
    "githubAnchor": "fgos-component-boundary-advisory",
    "stableAnchor": "h-00738c146491",
    "startLine": 105,
    "endLine": 105,
    "textDigest": "5d693cd0376780c965e59de839cb3db8439d9c27b2810c9c951ca99352e0c3ba",
    "sample": "fgOS Component Boundary Advisory",
    "sectionPayloadDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "followingBlockDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "identityFingerprint": "a2c715ef69df470e08d06d5efaf838bc9f631fd78e9990162d355c7e31b5290f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage"
    ],
    "text": "### fgOS Component Boundary Advisory",
    "sectionText": "### fgOS Component Boundary Advisory\n\nDocument type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](architecture-map.md), [System Overview](system-overview/spec.md), [Platform Foundations](platform-foundations.md), [Domainization Architecture](domainization/architecture/domainization.md), [Agent Coordination Foundation Vision](agent-coordination/vision.md), [Concept Relationships](agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md), [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e961b2d6995309157ba3474bc4531d93"
}
```

## Entry claim_4a9481ee980f13fd3c46165b4cb9b200

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_4a9481ee980f13fd3c46165b4cb9b200",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "6868415e40f7b08a28a2e808c1db0113de9904215bd3c548601db0c2cecc9375",
    "identityFingerprint": "bc9243f1446e71df7ad339d54ba8db55d87dc7754c7b7932a93e019f50c378fd",
    "claimId": "claim_4a9481ee980f13fd3c46165b4cb9b200",
    "sourceAnchor": "host-invocation-and-provider-routing",
    "unitKind": "heading",
    "sourceUnitDigest": "31ff1014acc172147fc74a432fee687499200fb8b238a8eb6f396f2a9cee005b",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "7710babd7a2430df5fdcdd1b82269e1dba16ebe8ad707563d2c9a53b4ce681f3",
      "toUnitDigest": "6868415e40f7b08a28a2e808c1db0113de9904215bd3c548601db0c2cecc9375",
      "fromSourceUnitDigest": "e43aae5e0f4aded84f9747ea2895369d021a624c2db051b4aa0d55a00bb73f38",
      "toSourceUnitDigest": "31ff1014acc172147fc74a432fee687499200fb8b238a8eb6f396f2a9cee005b"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "6868415e40f7b08a28a2e808c1db0113de9904215bd3c548601db0c2cecc9375",
    "identityFingerprint": "bc9243f1446e71df7ad339d54ba8db55d87dc7754c7b7932a93e019f50c378fd",
    "claimId": "claim_4a9481ee980f13fd3c46165b4cb9b200",
    "sourceAnchor": "host-invocation-and-provider-routing",
    "unitKind": "heading",
    "sourceUnitDigest": "31ff1014acc172147fc74a432fee687499200fb8b238a8eb6f396f2a9cee005b",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Host Invocation And Provider Routing",
    "anchor": "host-invocation-and-provider-routing",
    "githubAnchor": "host-invocation-and-provider-routing",
    "stableAnchor": "h-de7b7a8dc4a6",
    "startLine": 1285,
    "endLine": 1285,
    "textDigest": "31ff1014acc172147fc74a432fee687499200fb8b238a8eb6f396f2a9cee005b",
    "sample": "Host Invocation And Provider Routing",
    "sectionPayloadDigest": "047b87d2cdcf44a550f5ca6a4fd54b44302d04aca023e99207308dd05f17c076",
    "followingBlockDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "identityFingerprint": "bc9243f1446e71df7ad339d54ba8db55d87dc7754c7b7932a93e019f50c378fd",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Host Invocation And Provider Routing",
    "sectionText": "##### Host Invocation And Provider Routing\n\n[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router.\n\nUse this document when deciding:\n\n- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;\n- where CLI/REST/MCP input becomes a transport-neutral semantic operation;\n- how one operation selects a built-in, legacy, process, or WASM provider;\n- how external plugins declare operations and requested capabilities;\n- which layer owns authority checks, provider lifecycle, and error projection."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Host Invocation And Provider Routing",
    "anchor": "host-invocation-and-provider-routing",
    "githubAnchor": "host-invocation-and-provider-routing",
    "stableAnchor": "h-5588fd371904",
    "startLine": 1286,
    "endLine": 1286,
    "textDigest": "31ff1014acc172147fc74a432fee687499200fb8b238a8eb6f396f2a9cee005b",
    "sample": "Host Invocation And Provider Routing",
    "sectionPayloadDigest": "047b87d2cdcf44a550f5ca6a4fd54b44302d04aca023e99207308dd05f17c076",
    "followingBlockDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "identityFingerprint": "bc9243f1446e71df7ad339d54ba8db55d87dc7754c7b7932a93e019f50c378fd",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Host Invocation And Provider Routing",
    "sectionText": "##### Host Invocation And Provider Routing\n\n[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router.\n\nUse this document when deciding:\n\n- how `cli-host-use-case` and `remote-host-use-case` remain peer entry paths;\n- where CLI/REST/MCP input becomes a transport-neutral semantic operation;\n- how one operation selects a built-in, legacy, process, or WASM provider;\n- how external plugins declare operations and requested capabilities;\n- which layer owns authority checks, provider lifecycle, and error projection."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_4a9481ee980f13fd3c46165b4cb9b200"
}
```

## Entry claim_c0c206c3800b110c7dffd86b9c365dbb

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_c0c206c3800b110c7dffd86b9c365dbb",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "ce1a55f536f8360c37fc67c54804ca1bc9a15821ca5efe862362ccbc1a4fae35",
    "identityFingerprint": "47dba70caa80e853136eaeac109d3e8120eea1dca1cf501a61621a5184010a4f",
    "claimId": "claim_c0c206c3800b110c7dffd86b9c365dbb",
    "sourceAnchor": "node-to-rust-component-migration",
    "unitKind": "heading",
    "sourceUnitDigest": "498170b56dca7baacfcc063c115e7e7717e47be121d39342eb1c9b56e7eae861",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "97a171b4ec4a894f6f84227791eb96dc77dc5f5ec237134c1a73856acf987d86",
      "toUnitDigest": "ce1a55f536f8360c37fc67c54804ca1bc9a15821ca5efe862362ccbc1a4fae35",
      "fromSourceUnitDigest": "672ff85939d0526d739a870e57a84e345a64f2626ce6d5e4ec1613ad774e180d",
      "toSourceUnitDigest": "498170b56dca7baacfcc063c115e7e7717e47be121d39342eb1c9b56e7eae861"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "ce1a55f536f8360c37fc67c54804ca1bc9a15821ca5efe862362ccbc1a4fae35",
    "identityFingerprint": "47dba70caa80e853136eaeac109d3e8120eea1dca1cf501a61621a5184010a4f",
    "claimId": "claim_c0c206c3800b110c7dffd86b9c365dbb",
    "sourceAnchor": "node-to-rust-component-migration",
    "unitKind": "heading",
    "sourceUnitDigest": "498170b56dca7baacfcc063c115e7e7717e47be121d39342eb1c9b56e7eae861",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-c04c3b54dc66",
    "startLine": 1298,
    "endLine": 1298,
    "textDigest": "498170b56dca7baacfcc063c115e7e7717e47be121d39342eb1c9b56e7eae861",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "271d7752363a50497ae8a48d7a305413c083f17ef56a0ad37540d7b867d4b0d1",
    "followingBlockDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "identityFingerprint": "47dba70caa80e853136eaeac109d3e8120eea1dca1cf501a61621a5184010a4f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Node To Rust Component Migration",
    "sectionText": "##### Node To Rust Component Migration\n\n[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust components one boundary at a time while preserving the existing `fgos`\nsurface.\n\nUse this document when deciding:\n\n- how the Rust CLI delegates unmigrated operations to the legacy Node provider;\n- which `fgos` verb clusters are ready to become native Rust providers;\n- how to avoid double parsing and split transactions during migration;\n- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a\n  gradual migration;\n- when a Node implementation and rollback path can be removed."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Node To Rust Component Migration",
    "anchor": "node-to-rust-component-migration",
    "githubAnchor": "node-to-rust-component-migration",
    "stableAnchor": "h-4d0ddb094c4c",
    "startLine": 1299,
    "endLine": 1299,
    "textDigest": "498170b56dca7baacfcc063c115e7e7717e47be121d39342eb1c9b56e7eae861",
    "sample": "Node To Rust Component Migration",
    "sectionPayloadDigest": "271d7752363a50497ae8a48d7a305413c083f17ef56a0ad37540d7b867d4b0d1",
    "followingBlockDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "identityFingerprint": "47dba70caa80e853136eaeac109d3e8120eea1dca1cf501a61621a5184010a4f",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Node To Rust Component Migration",
    "sectionText": "##### Node To Rust Component Migration\n\n[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust components one boundary at a time while preserving the existing `fgos`\nsurface.\n\nUse this document when deciding:\n\n- how the Rust CLI delegates unmigrated operations to the legacy Node provider;\n- which `fgos` verb clusters are ready to become native Rust providers;\n- how to avoid double parsing and split transactions during migration;\n- how to preserve `fgos` CLI, envelope, error, and lifecycle contracts during a\n  gradual migration;\n- when a Node implementation and rollback path can be removed."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c0c206c3800b110c7dffd86b9c365dbb"
}
```

## Entry claim_cc78cecb854fcb0e3b28b198936b6688

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_cc78cecb854fcb0e3b28b198936b6688",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "b94299b298926b3f99fc4ea1bc046d614ef5285304108e386e3e53bdbb7e25e0",
    "identityFingerprint": "5bc584ff811c66cbb53173d829658a853b3cbd244ff74fd40800c6423931b872",
    "claimId": "claim_cc78cecb854fcb0e3b28b198936b6688",
    "sourceAnchor": "related-agent-coordination-contracts",
    "unitKind": "heading",
    "sourceUnitDigest": "e96eb39fc1cebb38824be7d340ccba3f4ead668994a377434a180aa976c12e33",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "4e23b9c14f1ec1b176f5743b4da24ca8b07ac7c8c7dea02364f80125ad0b0636",
      "toUnitDigest": "b94299b298926b3f99fc4ea1bc046d614ef5285304108e386e3e53bdbb7e25e0",
      "fromSourceUnitDigest": "aaf7a2843c22714d990cbfac4c06f2b5fc5ee1e9a8d40d323ce995a8c2c78f54",
      "toSourceUnitDigest": "e96eb39fc1cebb38824be7d340ccba3f4ead668994a377434a180aa976c12e33"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "b94299b298926b3f99fc4ea1bc046d614ef5285304108e386e3e53bdbb7e25e0",
    "identityFingerprint": "5bc584ff811c66cbb53173d829658a853b3cbd244ff74fd40800c6423931b872",
    "claimId": "claim_cc78cecb854fcb0e3b28b198936b6688",
    "sourceAnchor": "related-agent-coordination-contracts",
    "unitKind": "heading",
    "sourceUnitDigest": "e96eb39fc1cebb38824be7d340ccba3f4ead668994a377434a180aa976c12e33",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Related Agent Coordination Contracts",
    "anchor": "related-agent-coordination-contracts",
    "githubAnchor": "related-agent-coordination-contracts",
    "stableAnchor": "h-2be9211988a0",
    "startLine": 1374,
    "endLine": 1374,
    "textDigest": "e96eb39fc1cebb38824be7d340ccba3f4ead668994a377434a180aa976c12e33",
    "sample": "Related Agent Coordination Contracts",
    "sectionPayloadDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "followingBlockDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "identityFingerprint": "5bc584ff811c66cbb53173d829658a853b3cbd244ff74fd40800c6423931b872",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links"
    ],
    "text": "##### Related Agent Coordination Contracts",
    "sectionText": "##### Related Agent Coordination Contracts\n\n- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordination/vision.md) —\n  foundation/domain split, runtime contracts, and small-core constraints.\n- [System Context](agent-coordination/history/retired-engine/legacy/architecture/system-context.md) —\n  boundaries, runtime profiles, and trust boundaries.\n- [Runtime Model](agent-coordination/architecture/runtime-model.md) —\n  assignment execution chain, invariants, and failure domains.\n- [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md)\n  — executor/provider/model/tier/mechanism governance boundary.\n- [Evidence And Results](agent-coordination/architecture/evidence-and-results.md)\n  — RunResult confidence and evidence boundary.\n- [Work Integration](agent-coordination/architecture/work-integration.md) —\n  Work lifecycle integration boundary."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Related Agent Coordination Contracts",
    "anchor": "related-agent-coordination-contracts",
    "githubAnchor": "related-agent-coordination-contracts",
    "stableAnchor": "h-cac0778958fb",
    "startLine": 1375,
    "endLine": 1375,
    "textDigest": "e96eb39fc1cebb38824be7d340ccba3f4ead668994a377434a180aa976c12e33",
    "sample": "Related Agent Coordination Contracts",
    "sectionPayloadDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "followingBlockDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "identityFingerprint": "5bc584ff811c66cbb53173d829658a853b3cbd244ff74fd40800c6423931b872",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links"
    ],
    "text": "##### Related Agent Coordination Contracts",
    "sectionText": "##### Related Agent Coordination Contracts\n\n- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordination/vision.md) —\n  foundation/domain split, runtime contracts, and small-core constraints.\n- [System Context](agent-coordination/history/retired-engine/legacy/architecture/system-context.md) —\n  boundaries, runtime profiles, and trust boundaries.\n- [Runtime Model](agent-coordination/architecture/runtime-model.md) —\n  assignment execution chain, invariants, and failure domains.\n- [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md)\n  — executor/provider/model/tier/mechanism governance boundary.\n- [Evidence And Results](agent-coordination/architecture/evidence-and-results.md)\n  — RunResult confidence and evidence boundary.\n- [Work Integration](agent-coordination/architecture/work-integration.md) —\n  Work lifecycle integration boundary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_cc78cecb854fcb0e3b28b198936b6688"
}
```

## Entry claim_abfd24be27e1378d7e6f491f46c4b4cf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_abfd24be27e1378d7e6f491f46c4b4cf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "98ecebf3b738d406b8a1ffb9bea47c6bf5b60a171ee4ac39ce5ea15fddb39b21",
    "identityFingerprint": "627657f38ee5800d72256c38c95b7c2cc55ca09b2ad2395b60752f821c5d25aa",
    "claimId": "claim_abfd24be27e1378d7e6f491f46c4b4cf",
    "sourceAnchor": "repo-layout-vision",
    "unitKind": "heading",
    "sourceUnitDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02",
    "claimKind": "contract",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "c69a2e1f5423e14a23e3d705f112a030f7ee466a900849540715297b42ca3a51",
      "toUnitDigest": "98ecebf3b738d406b8a1ffb9bea47c6bf5b60a171ee4ac39ce5ea15fddb39b21",
      "fromSourceUnitDigest": "5d4124f7fcc6d528da92d2b1b27ce2326e1d494146da683cbacc67c4bc496711",
      "toSourceUnitDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "98ecebf3b738d406b8a1ffb9bea47c6bf5b60a171ee4ac39ce5ea15fddb39b21",
    "identityFingerprint": "627657f38ee5800d72256c38c95b7c2cc55ca09b2ad2395b60752f821c5d25aa",
    "claimId": "claim_abfd24be27e1378d7e6f491f46c4b4cf",
    "sourceAnchor": "repo-layout-vision",
    "unitKind": "heading",
    "sourceUnitDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 5,
    "title": "Repo Layout Vision",
    "anchor": "repo-layout-vision",
    "githubAnchor": "repo-layout-vision",
    "stableAnchor": "h-2e2e9228f6a9",
    "startLine": 1268,
    "endLine": 1268,
    "textDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02",
    "sample": "Repo Layout Vision",
    "sectionPayloadDigest": "a9e6df0a8e42161be6d97ad0357c26130f95a5b0873af3d1206d81afef17c307",
    "followingBlockDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "identityFingerprint": "627657f38ee5800d72256c38c95b7c2cc55ca09b2ad2395b60752f821c5d25aa",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Repo Layout Vision",
    "sectionText": "##### Repo Layout Vision\n\n[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout.\n\nIt describes the `apps/` plus `packages/` direction: apps are thin entrypoints\nand packages hold reusable implementation logic. Its concrete scope is the\nRust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.\n\nUse this document when deciding:\n\n- where a component should live once its boundary is agreed;\n- whether a binary should be a thin app or a logic-owning package;\n- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be\n  separated physically;\n- what mechanical blast radius a layout refactor is likely to touch."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 5,
    "title": "Repo Layout Vision",
    "anchor": "repo-layout-vision",
    "githubAnchor": "repo-layout-vision",
    "stableAnchor": "h-1ffe3817757d",
    "startLine": 1269,
    "endLine": 1269,
    "textDigest": "76ec7851ade9bdd4fef5b40b167bc07ec745dcedfc0e50c3672b6bd25796ad02",
    "sample": "Repo Layout Vision",
    "sectionPayloadDigest": "a9e6df0a8e42161be6d97ad0357c26130f95a5b0873af3d1206d81afef17c307",
    "followingBlockDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "identityFingerprint": "627657f38ee5800d72256c38c95b7c2cc55ca09b2ad2395b60752f821c5d25aa",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents"
    ],
    "text": "##### Repo Layout Vision",
    "sectionText": "##### Repo Layout Vision\n\n[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout.\n\nIt describes the `apps/` plus `packages/` direction: apps are thin entrypoints\nand packages hold reusable implementation logic. Its concrete scope is the\nRust/web split of the former `herdr-plugin/` package (now `apps/fgos-gateway/`, `herdr-dashboard/` and `packages/herdr-fgos-common/rust/`; see its status note). The Node side is outside this document.\n\nUse this document when deciding:\n\n- where a component should live once its boundary is agreed;\n- whether a binary should be a thin app or a logic-owning package;\n- how existing Rust gateway, MCP, TUI, port, and web-dashboard code should be\n  separated physically;\n- what mechanical blast radius a layout refactor is likely to touch."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_abfd24be27e1378d7e6f491f46c4b4cf"
}
```

## Entry claim_ae866db5c795898e6321e6d78ff85621

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ae866db5c795898e6321e6d78ff85621",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "identityFingerprint": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "claimId": "claim_ae866db5c795898e6321e6d78ff85621",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "identityFingerprint": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "claimId": "claim_ae866db5c795898e6321e6d78ff85621",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 24,
    "textDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "sample": "```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority bou",
    "identityFingerprint": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 24,
    "textDigest": "101030d628745ef104f9ac9c3440c3b0e25db9a5047ec248ac7a2f7820848650",
    "sample": "```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority bou",
    "identityFingerprint": "45af8621857fb8693684ea5d968f5b42e2d6bb7c1a9735c57a9760a002949ac5",
    "ancestry": [
      "Component Boundary"
    ],
    "text": "```txt\nDocument type: Platform architecture anchor\nAudience: Human reviewer, architect, maintainer, design-shaping agent\nPurpose: Track the whole-system component and authority boundary map\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Platform documentation\nLast reviewed: 2026-10-04\nRelated:\n- docs/architect/component-boundary/README.md\n- docs/architect/component-boundary/component-boundary-advisory.md\n- docs/architect/proposals/component-authority-boundary-map.md\n- docs/platform/README.md\nImplementation: Partial\nProvenance: Promoted anchor for docs/architect/component-boundary/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Track the whole-system component and authority boundary map; authority follows transitional switchboard\nUse this when: Track the whole-system component and authority boundary map\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ae866db5c795898e6321e6d78ff85621"
}
```

## Entry claim_552c245d8c6c6cb103b24f0e4498b651

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_552c245d8c6c6cb103b24f0e4498b651",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "1eb32495a818576f51d52fc28c8508608cac0f86337d2bc7927375109906c516",
    "identityFingerprint": "1eb32495a818576f51d52fc28c8508608cac0f86337d2bc7927375109906c516",
    "claimId": "claim_552c245d8c6c6cb103b24f0e4498b651",
    "sourceAnchor": "unheaded-block-11",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "973ee5615eeb755822f8032d8d11c080f21e340bd20a87952b300cde23661e95",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-11",
    "githubAnchor": "unheaded-block-11",
    "stableAnchor": "unheaded-block-11",
    "title": "Unheaded block 11",
    "startLine": 66,
    "endLine": 82,
    "textDigest": "973ee5615eeb755822f8032d8d11c080f21e340bd20a87952b300cde23661e95",
    "sample": "| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gat",
    "identityFingerprint": "1eb32495a818576f51d52fc28c8508608cac0f86337d2bc7927375109906c516",
    "ancestry": [
      "Component Boundary",
      "4. Current High-Level Components"
    ],
    "text": "| Component | Current role | Current source |\n| --- | --- | --- |\n| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |\n| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for \"ai làm / model / persona / cơ chế\" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |\n| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |\n| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\\|status\\|stop`; không phải một phần của herdr và không phải \"herdr-gateway\" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |\n| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |\n| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |\n| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |\n| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |\n| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |\n| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |\n| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |\n| Session Identity (Writer Identity) | Foundation authority for \"who is the writer of this process\" (`{id, source}`). One implementation, the Rust crate `fgos-session-identity` (`packages/session-identity/rust`, native verb `fgos identity`); Observe calls it in process, Node through the facade `src/util/session-identity.mjs`. Owns no state and depends only on `fgos-host-runtime`; Observe depends on it. Grants no lock or claim authority. | [session-identity/spec.md](session-identity/spec.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_552c245d8c6c6cb103b24f0e4498b651"
}
```

## Entry claim_b8c99351fb2a23740539de0afcfdafbf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_b8c99351fb2a23740539de0afcfdafbf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "identityFingerprint": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "claimId": "claim_b8c99351fb2a23740539de0afcfdafbf",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "identityFingerprint": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "claimId": "claim_b8c99351fb2a23740539de0afcfdafbf",
    "sourceAnchor": "unheaded-block-13",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 92,
    "endLine": 98,
    "textDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "sample": "| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-adviso",
    "identityFingerprint": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "ancestry": [
      "Component Boundary",
      "6. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\n| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| observe component | [observe/spec.md](observe/spec.md) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-13",
    "githubAnchor": "unheaded-block-13",
    "stableAnchor": "unheaded-block-13",
    "title": "Unheaded block 13",
    "startLine": 93,
    "endLine": 99,
    "textDigest": "928afdd0d671c1952dd27a83bff8ebbb709abf443d75ecf9018a1096c9d1d18c",
    "sample": "| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-adviso",
    "identityFingerprint": "dc9075b82b5914e262463a021eaad8d6f94eb84039e2bafb8428aaab01b2131f",
    "ancestry": [
      "Component Boundary",
      "6. Related Files"
    ],
    "text": "| Relationship | File |\n| --- | --- |\n| platform portal | [README.md](README.md) |\n| detailed component-boundary source | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |\n| draft authority map | [proposals/component-authority-boundary-map.md](proposals/component-authority-boundary-map.md) |\n| packaging-distribution area | [packaging-distribution/README.md](packaging-distribution/README.md) |\n| observe component | [observe/spec.md](observe/spec.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_b8c99351fb2a23740539de0afcfdafbf"
}
```

## Entry claim_478f4ffb947b0d32dfbf8622876bfa8f

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_478f4ffb947b0d32dfbf8622876bfa8f",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "identityFingerprint": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "claimId": "claim_478f4ffb947b0d32dfbf8622876bfa8f",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "identityFingerprint": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "claimId": "claim_478f4ffb947b0d32dfbf8622876bfa8f",
    "sourceAnchor": "unheaded-block-15",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 106,
    "endLine": 111,
    "textDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "sample": "Document type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [A",
    "identityFingerprint": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "Document type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](architecture-map.md), [System Overview](system-overview/spec.md), [Platform Foundations](platform-foundations.md), [Domainization Architecture](domainization/architecture/domainization.md), [Agent Coordination Foundation Vision](agent-coordination/vision.md), [Concept Relationships](agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md), [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-15",
    "githubAnchor": "unheaded-block-15",
    "stableAnchor": "unheaded-block-15",
    "title": "Unheaded block 15",
    "startLine": 107,
    "endLine": 112,
    "textDigest": "6e7fac96ac571658cb549018e24770c9973cbeda56203374f2cb1b6582982288",
    "sample": "Document type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [A",
    "identityFingerprint": "336995ffaf9b7d9d44fcce343b7fef503940836867ed4140b291973462dbdc60",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory"
    ],
    "text": "Document type: Proposal\nDesign status: Discussion / Visionary advisory\nImplementation: N/A\nLast reviewed: 2026-09-01\nCanonical for: nothing; architectural advisory only\nRelated: [Architecture Map](architecture-map.md), [System Overview](system-overview/spec.md), [Platform Foundations](platform-foundations.md), [Domainization Architecture](domainization/architecture/domainization.md), [Agent Coordination Foundation Vision](agent-coordination/vision.md), [Concept Relationships](agent-coordination/vocabulary/concept-relationships.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Protocol Model](agent-coordination/architecture/protocol-model.md), [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md), [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_478f4ffb947b0d32dfbf8622876bfa8f"
}
```

## Entry claim_2083bad8b5e2e59940736226093dbc5a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_2083bad8b5e2e59940736226093dbc5a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "identityFingerprint": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "claimId": "claim_2083bad8b5e2e59940736226093dbc5a",
    "sourceAnchor": "unheaded-block-165",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6af8570adb8504650c6d36ccc3e5e347ac8aa45cca06ff7b9c465b1c0225b903",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "identityFingerprint": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "claimId": "claim_2083bad8b5e2e59940736226093dbc5a",
    "sourceAnchor": "unheaded-block-165",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "6af8570adb8504650c6d36ccc3e5e347ac8aa45cca06ff7b9c465b1c0225b903",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-165",
    "githubAnchor": "unheaded-block-165",
    "stableAnchor": "unheaded-block-165",
    "title": "Unheaded block 165",
    "startLine": 1183,
    "endLine": 1187,
    "textDigest": "6af8570adb8504650c6d36ccc3e5e347ac8aa45cca06ff7b9c465b1c0225b903",
    "sample": "1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [",
    "identityFingerprint": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "1. How To Read This Folder"
    ],
    "text": "1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [Host Invocation And Provider Routing](host-invocation-routing/spec.md)\n4. [Node To Rust Component Migration](host-invocation-routing/architecture/node-to-rust-migration.md)\n5. [Packaging And Distribution Architecture](packaging-distribution/README.md)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-165",
    "githubAnchor": "unheaded-block-165",
    "stableAnchor": "unheaded-block-165",
    "title": "Unheaded block 165",
    "startLine": 1184,
    "endLine": 1188,
    "textDigest": "6af8570adb8504650c6d36ccc3e5e347ac8aa45cca06ff7b9c465b1c0225b903",
    "sample": "1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [",
    "identityFingerprint": "3ee1a5033d69dd1189435c4976d0cecb9977284db014555ccc8962295f18bf27",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "1. How To Read This Folder"
    ],
    "text": "1. [Component Boundary Advisory](../architect/component-boundary/component-boundary-advisory.md)\n2. [Repo Layout Vision](../architect/component-boundary/repo-layout-vision.md)\n3. [Host Invocation And Provider Routing](host-invocation-routing/spec.md)\n4. [Node To Rust Component Migration](host-invocation-routing/architecture/node-to-rust-migration.md)\n5. [Packaging And Distribution Architecture](packaging-distribution/README.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_2083bad8b5e2e59940736226093dbc5a"
}
```

## Entry claim_e09c148584022a7286cd21e54403c2bc

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_e09c148584022a7286cd21e54403c2bc",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "identityFingerprint": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "claimId": "claim_e09c148584022a7286cd21e54403c2bc",
    "sourceAnchor": "unheaded-block-177",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "identityFingerprint": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "claimId": "claim_e09c148584022a7286cd21e54403c2bc",
    "sourceAnchor": "unheaded-block-177",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-177",
    "githubAnchor": "unheaded-block-177",
    "stableAnchor": "unheaded-block-177",
    "title": "Unheaded block 177",
    "startLine": 1244,
    "endLine": 1246,
    "textDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "sample": "[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority",
    "identityFingerprint": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Component Boundary Advisory"
    ],
    "text": "[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority\nboundary."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-177",
    "githubAnchor": "unheaded-block-177",
    "stableAnchor": "unheaded-block-177",
    "title": "Unheaded block 177",
    "startLine": 1245,
    "endLine": 1247,
    "textDigest": "a3a418d3011a365ff46381767ed5c15547ad1a33da57b7e83405010c7c659fdd",
    "sample": "[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority",
    "identityFingerprint": "809c5dcb2022cd7174ba11bd821e0d68f5c938b7433cb31beb880c99036fbb26",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Component Boundary Advisory"
    ],
    "text": "[component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) is the\nvision document for component responsibility, bounded context, and authority\nboundary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_e09c148584022a7286cd21e54403c2bc"
}
```

## Entry claim_ec09b512ef434848f34608c79b5ac525

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ec09b512ef434848f34608c79b5ac525",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "identityFingerprint": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "claimId": "claim_ec09b512ef434848f34608c79b5ac525",
    "sourceAnchor": "unheaded-block-182",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "identityFingerprint": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "claimId": "claim_ec09b512ef434848f34608c79b5ac525",
    "sourceAnchor": "unheaded-block-182",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-182",
    "githubAnchor": "unheaded-block-182",
    "stableAnchor": "unheaded-block-182",
    "title": "Unheaded block 182",
    "startLine": 1270,
    "endLine": 1271,
    "textDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "sample": "[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout.",
    "identityFingerprint": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Repo Layout Vision"
    ],
    "text": "[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-182",
    "githubAnchor": "unheaded-block-182",
    "stableAnchor": "unheaded-block-182",
    "title": "Unheaded block 182",
    "startLine": 1271,
    "endLine": 1272,
    "textDigest": "cd07aba31d0b8612aa7585d57c57e30a9905fc2fb17d6dd0bb53d852aae0d71b",
    "sample": "[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout.",
    "identityFingerprint": "cf4d8e56370f43b29345eb3ea98dc445d6574f9c1a6912001e51eb0672e28ead",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Repo Layout Vision"
    ],
    "text": "[repo-layout-vision.md](../architect/component-boundary/repo-layout-vision.md) is the vision document for\nphysical source layout."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ec09b512ef434848f34608c79b5ac525"
}
```

## Entry claim_d0966e5c8937a3a894e3ae133b48a827

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d0966e5c8937a3a894e3ae133b48a827",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "identityFingerprint": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "claimId": "claim_d0966e5c8937a3a894e3ae133b48a827",
    "sourceAnchor": "unheaded-block-186",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "identityFingerprint": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "claimId": "claim_d0966e5c8937a3a894e3ae133b48a827",
    "sourceAnchor": "unheaded-block-186",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-186",
    "githubAnchor": "unheaded-block-186",
    "stableAnchor": "unheaded-block-186",
    "title": "Unheaded block 186",
    "startLine": 1287,
    "endLine": 1288,
    "textDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "sample": "[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router.",
    "identityFingerprint": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Host Invocation And Provider Routing"
    ],
    "text": "[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-186",
    "githubAnchor": "unheaded-block-186",
    "stableAnchor": "unheaded-block-186",
    "title": "Unheaded block 186",
    "startLine": 1288,
    "endLine": 1289,
    "textDigest": "799cd5b1d42b59ffa6bf38415e7bebe742b345003b87be4a77e5b512b1185efb",
    "sample": "[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router.",
    "identityFingerprint": "f9742679a4f2d1e94ee686a44602307c9690cc9fbf0829d6b78bf0090c70bf96",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Host Invocation And Provider Routing"
    ],
    "text": "[host-invocation-provider-routing.md](host-invocation-routing/spec.md)\ndefines the shared host invocation path and the Operation Provider Router."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d0966e5c8937a3a894e3ae133b48a827"
}
```

## Entry claim_7e2b615ab453abdfaa47eb3955e50343

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_7e2b615ab453abdfaa47eb3955e50343",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "identityFingerprint": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "claimId": "claim_7e2b615ab453abdfaa47eb3955e50343",
    "sourceAnchor": "unheaded-block-189",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "identityFingerprint": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "claimId": "claim_7e2b615ab453abdfaa47eb3955e50343",
    "sourceAnchor": "unheaded-block-189",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-189",
    "githubAnchor": "unheaded-block-189",
    "stableAnchor": "unheaded-block-189",
    "title": "Unheaded block 189",
    "startLine": 1300,
    "endLine": 1303,
    "textDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "sample": "[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust com",
    "identityFingerprint": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Node To Rust Component Migration"
    ],
    "text": "[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust components one boundary at a time while preserving the existing `fgos`\nsurface."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-189",
    "githubAnchor": "unheaded-block-189",
    "stableAnchor": "unheaded-block-189",
    "title": "Unheaded block 189",
    "startLine": 1301,
    "endLine": 1304,
    "textDigest": "c7a72d8d1c40718a22b72f05a0cba1f869153d86ea9f6436082c3f56a0ef760a",
    "sample": "[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust com",
    "identityFingerprint": "cc84aea39e9a5bbd7d1cb97346c5f4876c210a98e007db13c218053a77a9a440",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "2. Documents",
      "Node To Rust Component Migration"
    ],
    "text": "[node-to-rust-component-migration.md](host-invocation-routing/architecture/node-to-rust-migration.md)\nrecords the migration shape for replacing Node harness internals with\nRust components one boundary at a time while preserving the existing `fgos`\nsurface."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_7e2b615ab453abdfaa47eb3955e50343"
}
```

## Entry claim_ff2f4cda8f156fa2cdaec880290d9430

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ff2f4cda8f156fa2cdaec880290d9430",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "identityFingerprint": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "claimId": "claim_ff2f4cda8f156fa2cdaec880290d9430",
    "sourceAnchor": "unheaded-block-198",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "identityFingerprint": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "claimId": "claim_ff2f4cda8f156fa2cdaec880290d9430",
    "sourceAnchor": "unheaded-block-198",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-198",
    "githubAnchor": "unheaded-block-198",
    "stableAnchor": "unheaded-block-198",
    "title": "Unheaded block 198",
    "startLine": 1360,
    "endLine": 1372,
    "textDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "sample": "- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, s",
    "identityFingerprint": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links",
      "Canonical Architecture And Specs"
    ],
    "text": "- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, shared\n  entities, actors, and cross-area flows.\n- [Platform Foundations](platform-foundations.md) — locked platform laws\n  and durability/DoD doctrine.\n- [Work Item Lifecycle Vision](vision.md) — base\n  workflow and coding-specific lifecycle mapping.\n- [Distribution Vision](packaging-distribution/history/distribution-vision.md) — install/setup/doctor\n  direction and config/default registration posture.\n- [Domainization Architecture](domainization/architecture/domainization.md) — core vs domain\n  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and\n  agent boundaries."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-198",
    "githubAnchor": "unheaded-block-198",
    "stableAnchor": "unheaded-block-198",
    "title": "Unheaded block 198",
    "startLine": 1361,
    "endLine": 1373,
    "textDigest": "9c2b09723d424834b43348d027b8a5ddf18d635bc3ce3ba67fe1cbad8dc8e1cb",
    "sample": "- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, s",
    "identityFingerprint": "93c297692110aba0954ca9e17fe3098195da084280f6c0f7f9556327956c040d",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links",
      "Canonical Architecture And Specs"
    ],
    "text": "- [Architecture Map](architecture-map.md) — structure/physics/authority\n  map, component registry, and contract registry.\n- [System Overview](system-overview/spec.md) — area map, shared\n  entities, actors, and cross-area flows.\n- [Platform Foundations](platform-foundations.md) — locked platform laws\n  and durability/DoD doctrine.\n- [Work Item Lifecycle Vision](vision.md) — base\n  workflow and coding-specific lifecycle mapping.\n- [Distribution Vision](packaging-distribution/history/distribution-vision.md) — install/setup/doctor\n  direction and config/default registration posture.\n- [Domainization Architecture](domainization/architecture/domainization.md) — core vs domain\n  authoring, resolver, doctrine, workflow, skill, task-spec, knowledge, and\n  agent boundaries."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ff2f4cda8f156fa2cdaec880290d9430"
}
```

## Entry claim_9be3172079a53a61e5eab7ae8377fbb6

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9be3172079a53a61e5eab7ae8377fbb6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "identityFingerprint": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "claimId": "claim_9be3172079a53a61e5eab7ae8377fbb6",
    "sourceAnchor": "unheaded-block-199",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "identityFingerprint": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "claimId": "claim_9be3172079a53a61e5eab7ae8377fbb6",
    "sourceAnchor": "unheaded-block-199",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-199",
    "githubAnchor": "unheaded-block-199",
    "stableAnchor": "unheaded-block-199",
    "title": "Unheaded block 199",
    "startLine": 1376,
    "endLine": 1389,
    "textDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "sample": "- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordinati",
    "identityFingerprint": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links",
      "Related Agent Coordination Contracts"
    ],
    "text": "- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordination/vision.md) —\n  foundation/domain split, runtime contracts, and small-core constraints.\n- [System Context](agent-coordination/history/retired-engine/legacy/architecture/system-context.md) —\n  boundaries, runtime profiles, and trust boundaries.\n- [Runtime Model](agent-coordination/architecture/runtime-model.md) —\n  assignment execution chain, invariants, and failure domains.\n- [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md)\n  — executor/provider/model/tier/mechanism governance boundary.\n- [Evidence And Results](agent-coordination/architecture/evidence-and-results.md)\n  — RunResult confidence and evidence boundary.\n- [Work Integration](agent-coordination/architecture/work-integration.md) —\n  Work lifecycle integration boundary."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-199",
    "githubAnchor": "unheaded-block-199",
    "stableAnchor": "unheaded-block-199",
    "title": "Unheaded block 199",
    "startLine": 1377,
    "endLine": 1390,
    "textDigest": "db2184d7643038ad40c88bfeb7586a308ab907915fcbb5dfced23cc702ee7cce",
    "sample": "- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordinati",
    "identityFingerprint": "17f6e8777bc58b1b72faeb946acbe4983e446b4f1125882e8fd9545cb3832bcb",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: README source carriage",
      "Component Boundary Architecture",
      "5. External Review Links",
      "Related Agent Coordination Contracts"
    ],
    "text": "- [Agent Coordination Portal](agent-coordination/README.md) — reading entry\n  for the Agent Coordination architecture set.\n- [Agent Coordination Foundation Vision](agent-coordination/vision.md) —\n  foundation/domain split, runtime contracts, and small-core constraints.\n- [System Context](agent-coordination/history/retired-engine/legacy/architecture/system-context.md) —\n  boundaries, runtime profiles, and trust boundaries.\n- [Runtime Model](agent-coordination/architecture/runtime-model.md) —\n  assignment execution chain, invariants, and failure domains.\n- [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md)\n  — executor/provider/model/tier/mechanism governance boundary.\n- [Evidence And Results](agent-coordination/architecture/evidence-and-results.md)\n  — RunResult confidence and evidence boundary.\n- [Work Integration](agent-coordination/architecture/work-integration.md) —\n  Work lifecycle integration boundary."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9be3172079a53a61e5eab7ae8377fbb6"
}
```

## Entry claim_3751851fd439fd347690729ff1e4bb79

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_3751851fd439fd347690729ff1e4bb79",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "identityFingerprint": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "claimId": "claim_3751851fd439fd347690729ff1e4bb79",
    "sourceAnchor": "unheaded-block-39",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "57f9ce1415b601e5a7dc77c281d688b5ef47c7c84bf5620294bacf66ed5bde0f",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "identityFingerprint": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "claimId": "claim_3751851fd439fd347690729ff1e4bb79",
    "sourceAnchor": "unheaded-block-39",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "57f9ce1415b601e5a7dc77c281d688b5ef47c7c84bf5620294bacf66ed5bde0f",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 241,
    "endLine": 250,
    "textDigest": "57f9ce1415b601e5a7dc77c281d688b5ef47c7c84bf5620294bacf66ed5bde0f",
    "sample": "| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management:",
    "identityFingerprint": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "5. High-Level Component Authority Register"
    ],
    "text": "| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](work-state/spec.md), [Work Item Lifecycle Vision](vision.md), [System Overview](system-overview/spec.md) |\n| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](runner/spec.md), [Platform Component Boundary](component-boundary.md) |\n| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](runner/spec.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) |\n| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](runner/spec.md) |\n| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](domainization/architecture/domainization.md), [System Overview](system-overview/spec.md), [Work Item Lifecycle Vision](vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |\n| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](claude-plugin/spec.md), [Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md), [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](work-state/contracts/cli-io-contract.md) |\n| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](packaging-distribution/spec.md), [Distribution Vision](packaging-distribution/history/distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |\n| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](system-overview/spec.md) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-39",
    "githubAnchor": "unheaded-block-39",
    "stableAnchor": "unheaded-block-39",
    "title": "Unheaded block 39",
    "startLine": 242,
    "endLine": 251,
    "textDigest": "57f9ce1415b601e5a7dc77c281d688b5ef47c7c84bf5620294bacf66ed5bde0f",
    "sample": "| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management:",
    "identityFingerprint": "918b194bb1d280aed32e5f1fff53ede623d9e1d76f73620573d0f818d1a7f309",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "5. High-Level Component Authority Register"
    ],
    "text": "| Component | Role | Internal boundaries | Owning / reference documents |\n|---|---|---|---|\n| Work Lifecycle Engine | fgOS component that owns domain-agnostic Work-unit management: item identity, status, stage, claim/return, related info, context, documents, questions, and Work verbs. It may use Agent Coordination for selected operations, but Agent Coordination never owns this lifecycle. | Work item state machine, domain-agnostic stage/status, claim/return ownership, related refs, context/document refs, human gates. | [Work-State Spec](work-state/spec.md), [Work Item Lifecycle Vision](vision.md), [System Overview](system-overview/spec.md) |\n| Collaboration Patterns & Workflow Runner | Domain-neutral collaboration runtime (replaces retired Agent Coordination Engine per P4). Owns Workflow step DAG scheduling and small collaboration pattern loops (`solo`, `reviewed`, `panel`). | Workflow runner, Unit DAG scheduling, CollaborationPattern presets (`consult`, `research-fan-out`, `rfc`). | [Runner Spec](runner/spec.md), [Platform Component Boundary](component-boundary.md) |\n| Dispatch And Execution Engine | Governed execution of one approved Assignment. It chooses the allowed executor/provider/model/tier/mechanism and supervises the Run. | dispatch policy resolver, executor registry, governance/egress, DispatchPlan, Run creation, launch/timeout/cancel/retry, executor adapters. | [Runner Spec](runner/spec.md), [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) |\n| Run Result Evaluator | Truth boundary for one Assignment Run. It turns the Assignment contract, Run settlement, worker claim, artifacts, and evidence into a RunResult confidence decision. | worker result parser, evidence collectors, freshness checks, artifact refs/store, confidence evaluator, RunResult normalizer. | [Evidence And Results](agent-coordination/architecture/evidence-and-results.md), [Assignment/Run/RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md), [Runner Spec](runner/spec.md) |\n| Domain Components And Extension Layer | Domain packages and smaller extension packages that use the engines while owning domain-specific behavior. A domain package may be large enough to have its own core and sub-workflows. | Coding Domain Component, Marketing Domain Component, Workflow definitions, TaskSpecs, Skills, domain harnesses, org policy/persona/tier preferences, evidence policy adapters. | [Domainization Architecture](domainization/architecture/domainization.md), [System Overview](system-overview/spec.md), [Work Item Lifecycle Vision](vision.md), `domains/<domain>/AGENTS.md`, `domains/<domain>/manifest.yaml`, `domains/<domain>/workflows/` |\n| Host And Surface Layer | Inbound/outbound surfaces and operator visibility. It translates CLI/API/plugin/dashboard/webhook/chat/Herdr interactions into calls against the engines, without becoming lifecycle or evidence truth. | CLI/API/plugin adapters, Herdr/dashboard visibility, host adapters, surface auth, command/API envelopes. | [fgOS Plugin Spec](claude-plugin/spec.md), [Herdr Web Dashboard Spec](herdr-web-dashboard/spec.md), [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md), [IO Contract](work-state/contracts/cli-io-contract.md) |\n| Setup, Doctor, And Distribution Health | Platform support component that owns install shape, config defaults, health checks, repair posture, and global/project precedence. | setup config merge, doctor check registry, distribution packaging, shell integration, dependency/default discoverability. | [Distribution Spec](packaging-distribution/spec.md), [Distribution Vision](packaging-distribution/history/distribution-vision.md), [Reading Map setup entries](../specs/reading-map.md) |\n| Knowledge, Learning, And Documentation Registry | Lifecycle-adjacent learning component that owns retrospective knowledge, doc/topic registry, end-user document indexing, trace, and evolve signals. | knowledge registry, doc registry, Diataxis index, item trace, friction/outcome learning, evolve candidates. | [Enduser Docs Authoring Spec](../specs/enduser-docs-authoring.md), [Enduser Docs Index Spec](../specs/enduser-docs-index.md), [System Overview](system-overview/spec.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_3751851fd439fd347690729ff1e4bb79"
}
```

## Entry claim_c11ed79c0397df3ecb557a64094e0d62

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_c11ed79c0397df3ecb557a64094e0d62",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "67102ecc4221285f2db64734c2963afa8d99f2578d48da693bd4fb119a6eef9c",
    "identityFingerprint": "67102ecc4221285f2db64734c2963afa8d99f2578d48da693bd4fb119a6eef9c",
    "claimId": "claim_c11ed79c0397df3ecb557a64094e0d62",
    "sourceAnchor": "unheaded-block-5",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ef970220b2a0deaa9fe9d0aabe96a61d29451f0955f547b511aaa46b7f5df403",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-5",
    "githubAnchor": "unheaded-block-5",
    "stableAnchor": "unheaded-block-5",
    "title": "Unheaded block 5",
    "startLine": 42,
    "endLine": 46,
    "textDigest": "ef970220b2a0deaa9fe9d0aabe96a61d29451f0955f547b511aaa46b7f5df403",
    "sample": "| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary archit",
    "identityFingerprint": "67102ecc4221285f2db64734c2963afa8d99f2578d48da693bd4fb119a6eef9c",
    "ancestry": [
      "Component Boundary",
      "2. Current Source During Migration"
    ],
    "text": "| Source | Role |\n| --- | --- |\n| [../architect/component-boundary/README.md](../architect/component-boundary/README.md) | Reading portal for the existing component-boundary architecture package. |\n| [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) | Advisory map of components, bounded contexts, and authority boundaries. |\n| [../architect/proposals/component-authority-boundary-map.md](../architect/proposals/component-authority-boundary-map.md) | Draft authority map with parent/child and dependency vocabulary. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_c11ed79c0397df3ecb557a64094e0d62"
}
```

## Entry claim_23ac8c459b3cd1c0966639096522bbb8

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_23ac8c459b3cd1c0966639096522bbb8",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "5edb6b00c25fed741ebe22952d1fda831f238d4eb7d402536b9faa0491e4ff4c",
    "identityFingerprint": "5edb6b00c25fed741ebe22952d1fda831f238d4eb7d402536b9faa0491e4ff4c",
    "claimId": "claim_23ac8c459b3cd1c0966639096522bbb8",
    "sourceAnchor": "unheaded-block-56",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-56",
    "githubAnchor": "unheaded-block-56",
    "stableAnchor": "unheaded-block-56",
    "title": "Unheaded block 56",
    "startLine": 392,
    "endLine": 407,
    "textDigest": "71392c90d7e585abc412086957cca9584606daa7415c2afff44c2593060de45e",
    "sample": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-s",
    "identityFingerprint": "5edb6b00c25fed741ebe22952d1fda831f238d4eb7d402536b9faa0491e4ff4c",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "7. Contract Authority Matrix"
    ],
    "text": "| Existing contract or rule | Primary owner | Important consumers | Ownership note |\n|---|---|---|---|\n| [Workflow Stage Operation Contract](agent-coordination/contracts/workflow-stage-operation.md) | Domain Components And Extension Layer, as consumed by Work Lifecycle Engine | Agent Coordination Engine, Assignment Builder | Owns declared domain Work-stage operation normalization and compatibility. Coding Feature Workflow and Bugfix Workflow are coding-domain subcomponents, not Agent Coordination core. |\n| [FlowDefinition Contract](agent-coordination/history/retired-engine/files/contracts/flow-definition.md) | Domain Components And Extension Layer, with validation consumed by Agent Coordination Engine | Team Cognition Engine, Work Lifecycle Engine, Dispatch/Execution | Owns schema/IR for graph, roles, actors, operations, profiles, and declared policy hints. It should not own runtime state, executor choice, or evidence truth. |\n| [CoordinationSession Contract](agent-coordination/history/retired-engine/files/contracts/coordination-session.md) | Agent Coordination Engine | Team Cognition Engine, Dispatch/Execution, Run Result Evaluator, Work Lifecycle Engine | Owns session manifest, event stream, assignment membership, aggregate bounds, topology state, and recovery. It should reference Assignment/Run/RunResult records, not duplicate them. |\n| Assignment section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Agent Coordination Engine / Assignment Builder | Domain Components And Extension Layer, Domain Harnesses, Dispatch/Execution | Owns immutable semantic request shape and provenance. It should freeze mutation/evidence/budget/policy inputs before dispatch. |\n| Run section of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Dispatch And Execution Engine | Run Result Evaluator, Host/Surface, Agent Coordination Engine | Owns one concrete attempt and its resolved DispatchPlan/mechanism metadata. It should not become semantic task identity. |\n| RunResult and Confidence sections of [Assignment, Run, And RunResult Contract](agent-coordination/contracts/assignment-run-runresult.md) | Run Result Evaluator | Agent Coordination Engine, Work Lifecycle Engine, Team Cognition Engine | Owns normalized outcome, confidence, accepted/rejected evidence, and failure classification. It should not authorize lifecycle mutation. |\n| [Dispatch Control Plane](agent-coordination/architecture/dispatch-control-plane.md) | Dispatch And Execution Engine | Agent Coordination Engine, Domain Components And Extension Layer, Host/Surface | Owns executor/provider/model/tier/mechanism/adapter/governance resolution. It should not choose semantic operations or interpret success. |\n| [Evidence And Result Architecture](agent-coordination/architecture/evidence-and-results.md) | Run Result Evaluator | Dispatch/Execution, Agent Coordination Engine, Work Lifecycle Engine, Domain Components And Extension Layer | Owns confidence boundaries, evidence freshness, and false-success rules. Adapters and domain evidence policy should feed it evidence, not replace it. |\n| [Work Integration Boundaries](agent-coordination/architecture/work-integration.md) | Work Lifecycle Engine | Agent Coordination Engine, Domain Components And Extension Layer, Run Result Evaluator | Owns the rule that only Work verbs move domain-agnostic Work lifecycle state. Domain-specific lifecycle effects such as coding merge/technical approval belong to the relevant domain component. Sessions and RunResults may inform drivers only. |\n| [Visibility And Herdr](agent-coordination/architecture/visibility-and-herdr.md) | Host And Surface Layer | Dispatch/Execution, Run Result Evaluator, Agent Coordination Engine | Owns observation and operator visibility. It must consume canonical Run/RunResult state where possible and must not become truth. |\n| [ADR-007 Domain Harness Seam](agent-coordination/decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain Components And Extension Layer | Assignment Builder, Agent Coordination Engine, Work Lifecycle Engine | Owns domain-specific enrichment/rejection before normalization. It may add constraints/evidence/policy hints, but may not dispatch or mutate lifecycle. |\n| Domain manifest and workflow declarations (`domains/<domain>/manifest.yaml`, `workflows/*.yaml`) | Domain Components And Extension Layer | Work Lifecycle Engine, Agent Coordination Engine, Assignment Builder, Dispatch And Execution Engine | Own stage vocabulary, legal operations, stage skill/taskSpec mapping, workflow selection, and domain policy hints. Other components read them; they do not reinterpret them. |\n| Domain task-specs (`domains/<domain>/task-specs/*.md`) | Domain Components And Extension Layer | Agent Coordination Engine, Assignment Builder, Skills, Run Result Evaluator | Own executable contract, collaboration triggers, required skill/agent hints, expected outputs, gates, and return shape for an operation. They are not runtime state and should not choose executor transport. |\n| Domain skills (`domains/<domain>/skills/*` or `.agents/skills/*`) | Domain Components And Extension Layer | Executors, Assignment Builder, Host/Surface | Own operational know-how for an executor. They must not silently replace task-spec authority, domain workflow legality, dispatch policy, or Work lifecycle verbs. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_23ac8c459b3cd1c0966639096522bbb8"
}
```

## Entry claim_766e7971c03b8f085290d45795a24c33

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_766e7971c03b8f085290d45795a24c33",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "identityFingerprint": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "claimId": "claim_766e7971c03b8f085290d45795a24c33",
    "sourceAnchor": "unheaded-block-62",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/component-boundary.md",
    "unitDigest": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "identityFingerprint": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "claimId": "claim_766e7971c03b8f085290d45795a24c33",
    "sourceAnchor": "unheaded-block-62",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63",
    "claimKind": "contract",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-62",
    "githubAnchor": "unheaded-block-62",
    "stableAnchor": "unheaded-block-62",
    "title": "Unheaded block 62",
    "startLine": 435,
    "endLine": 451,
    "textDigest": "0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63",
    "sample": "| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, ",
    "identityFingerprint": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "8. Internal Boundary Map"
    ],
    "text": "| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |\n| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |\n| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |\n| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |\n| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |\n| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |\n| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |\n| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |\n| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |\n| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |\n| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |\n| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |\n| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |\n| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |\n| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-62",
    "githubAnchor": "unheaded-block-62",
    "stableAnchor": "unheaded-block-62",
    "title": "Unheaded block 62",
    "startLine": 436,
    "endLine": 452,
    "textDigest": "0fbb26b5b55ac7b4a59c5822c3a1d8b7d79929464f29ff7217e322b46e2b7d63",
    "sample": "| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, ",
    "identityFingerprint": "53a9f3121e75580a272f6309f2fea5f1a7ed2f3525856144f4ba1657e3a9bd15",
    "ancestry": [
      "Component Boundary",
      "Added in candidate: component-boundary-advisory source carriage",
      "fgOS Component Boundary Advisory",
      "8. Internal Boundary Map"
    ],
    "text": "| Boundary | Type | Likely component | Owns | Must not own |\n|---|---|---|---|---|\n| Work Lifecycle | Bounded context + authority boundary | Work Lifecycle Engine | Work identity, status, stage, claim/return, related refs, context, documents, human gates, lifecycle verbs. | Agent runtime, task graph progress, executor selection, evidence confidence, domain-specific merge/worktree behavior. |\n| Coordination Session Runtime | Bounded context | Agent Coordination Engine | One bounded coordination invocation, session manifest, event stream, AdhocTask graph, topology, budgets, recovery, synthesis boundary. | Work lifecycle mutation, provider/model execution choice, domain-specific branch authority. |\n| Team Cognition Engine | Bounded context | Agent Coordination Engine | Runtime group reasoning: choose consult/research/debate/brainstorm/peer-review strategy, allocate semantic cohorts, manage visibility policy, and propose synthesis strategy. | Dispatch bypass, protocol schema ownership, canonical runtime record ownership, Work lifecycle. |\n| Protocol Package / Definition | Extension boundary | Domain Components And Extension Layer | Reusable declared collaboration recipes: consult, research, debate, brainstorm, leader-worker, peer review, legal phases, operations, topology, and policy hints. | Runtime reasoning/adaptation, session persistence, executor choice, evidence truth. |\n| Coding Domain Component | Domain component | Domain Components And Extension Layer | Coding-specific core, Feature Workflow, Bugfix Workflow, coding harness, coding evidence adapters, repository/resource model, worktree/merge behavior, technical approval gates. | Generic coordination runtime, direct executor launch, domain-agnostic Work lifecycle mutation outside Work verbs. |\n| Coding Feature Workflow | Domain subcomponent | Coding Domain Component | Feature-specific stages, legal operations, TaskSpecs, Skills, and planning doctrine. | Bugfix-specific lifecycle semantics, generic Work state engine, direct executor launch. |\n| Bugfix Workflow | Domain subcomponent | Coding Domain Component | Bugfix-specific stages such as reproduce/diagnose/fix/verify/review, operations, TaskSpecs, Skills, and verification doctrine. | Feature-specific planning semantics, generic Work state engine, direct executor launch. |\n| Stage Operation Choice | Authority boundary | Work Lifecycle Engine, interpreting Domain workflow declarations | Select the next legal operation for the current Work stage from declared domain workflow operations and current evidence signals. | Declaring new operations, choosing concrete executor/provider/model, computing RunResult confidence. |\n| Execution Contract / Assignment Builder | Authority boundary | Agent Coordination Engine | Convert declared operation or validated inline contract into immutable Assignment snapshot with provenance, mutation, evidence, budget, role, and policy inputs. | Dispatch target choice, retry lifecycle, Work mutation. |\n| Dispatch Control Plane | Bounded context + authority boundary | Dispatch And Execution Engine | Resolve Assignment policy into DispatchPlan: executor, provider, model, tier, mechanism, adapter, governance, egress. Routes on exactly two identities, capability and executor-id — see the canonical [Dispatch Control Plane](../architect/agent-coordination/architecture/dispatch-control-plane.md) doc for the accepted DispatchRequest/PolicyPatch/DispatchPlan contracts and component-internal ownership list. | Choosing semantic operation, interpreting task success, mutating lifecycle. |\n| Execution Adapters | Adapter boundary | Dispatch And Execution Engine | Deliver one approved Run through CLI, Herdr, MCP, API, or future native mechanism. | Policy decision, evidence confidence, Work state. |\n| Run Runtime | Authority boundary | Dispatch And Execution Engine | One attempt, settlement, timeout, cancellation, retry boundary, process/transport metadata. | Semantic task identity, evidence truth, lifecycle progression. |\n| Run Result Evaluation | Bounded context + authority boundary | Run Result Evaluator | Parse worker claim, collect/validate artifacts, compute confidence, produce RunResult. | Launching executors, choosing providers, approving Work. |\n| Domain Harnesses | Extension boundary + authority boundary | Domain Components And Extension Layer | Domain knowledge, resource/conflict/isolation advice, domain evidence rules, Work integration policy. | Generic execution core, provider launch, hidden lifecycle authority. |\n| Visibility / Herdr | Adapter boundary | Host And Surface Layer | Pane/process observation, operator visibility, diagnostics, live intervention surface. | Runtime truth, evidence authority, lifecycle authority. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_766e7971c03b8f085290d45795a24c33"
}
```

## Entry claim_95bccfdc53e0c3efcfa29e694d26d5a3

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_95bccfdc53e0c3efcfa29e694d26d5a3",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/contracts/architecture-manifest.json",
    "unitDigest": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "claimId": "claim_95bccfdc53e0c3efcfa29e694d26d5a3",
    "sourceAnchor": "file-block",
    "unitKind": "file-block",
    "sourceUnitDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "claimKind": "contract",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "file-block",
    "anchor": "file-block",
    "githubAnchor": "file-block",
    "stableAnchor": "file-block",
    "title": "architecture-manifest.json",
    "startLine": 1,
    "endLine": 269,
    "textDigest": "2d55be82331318dd370052c80940458ce88894b98b049d626e41ba1bc6653b6a",
    "identityFingerprint": "bee0f585dc079a9cf24fe84a2cfacaa3aa99e6818f4fbf4e69dbf76dd601e99c",
    "sample": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": ",
    "ancestry": [],
    "text": "{\n  \"contract\": \"architecture-manifest.v1\",\n  \"map\": \"docs/architecture-map.md\",\n  \"layers\": [\n    \"entry\",\n    \"use-case\",\n    \"infra\",\n    \"domain\",\n    \"kernel\"\n  ],\n  \"rules\": [\n    \"one-directional-layer\",\n    \"domain-siloing\"\n  ],\n  \"components\": [\n    \"packaging-distribution\"\n  ],\n  \"domains\": [\n    \"coding\",\n    \"marketing\"\n  ],\n  \"files\": {\n    \"bin/fgos.mjs\": \"entry\",\n    \"bin/fgos-runner.mjs\": \"entry\",\n    \"src/runner/loop.mjs\": \"use-case\",\n    \"src/runner/paths.mjs\": \"infra\",\n    \"src/runner/dispatch.mjs\": \"infra\",\n    \"src/runner/operation-capability.mjs\": \"domain\",\n    \"src/runner/rigor.mjs\": \"kernel\",\n    \"src/runner/fanout-batch.mjs\": \"use-case\",\n    \"src/runner/work-compat.mjs\": \"infra\",\n    \"src/runner/dispatch/adapters.mjs\": \"infra\",\n    \"src/runner/dispatch/config.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/policies.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/bypass-pairing.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/backend-registry.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/authority.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/request.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/resources.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/cleanup.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/attestation-store.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/drivers/bwrap.mjs\": \"infra\",\n    \"src/runner/dispatch/confinement/probes/harness.mjs\": \"infra\",\n    \"src/runner/dispatch/resolve.mjs\": \"infra\",\n    \"src/runner/dispatch/mechanism.mjs\": \"infra\",\n    \"src/runner/dispatch/plan.mjs\": \"infra\",\n    \"src/runner/dispatch/transport.mjs\": \"infra\",\n    \"src/runner/dispatch/prepare.mjs\": \"infra\",\n    \"src/runner/dispatch/result-ladder.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-layout.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-normalizer.mjs\": \"infra\",\n    \"src/runner/dispatch/execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/effective-execution-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/agent-result-claim-contract.mjs\": \"infra\",\n    \"src/runner/dispatch/evidence-attribution.mjs\": \"infra\",\n    \"src/runner/dispatch/write-scope.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-timeout.mjs\": \"kernel\",\n    \"src/runner/dispatch/run-result.mjs\": \"infra\",\n    \"src/runner/dispatch/usage-parsers.mjs\": \"infra\",\n    \"src/runner/dispatch/runtime-inspection.mjs\": \"infra\",\n    \"src/runner/dispatch/reconciliation-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-policy.mjs\": \"infra\",\n    \"src/runner/dispatch/operation-prompt-templates.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-adapter.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-capacity.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-auth-failure.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-account-probe.mjs\": \"infra\",\n    \"src/runner/dispatch/provider-credential-renewal.mjs\": \"infra\",\n    \"src/runner/dispatch/assignment-runner.mjs\": \"infra\",\n    \"src/runner/dispatch/settlement.mjs\": \"infra\",\n    \"src/runner/dispatch/reconcile-cli-spawn.mjs\": \"infra\",\n    \"src/runner/dispatch/cli.mjs\": \"infra\",\n    \"src/runner/dispatch/detached-run-supervisor.mjs\": \"infra\",\n    \"src/runner/prompt-templates.mjs\": \"infra\",\n    \"src/runner/worker-log.mjs\": \"infra\",\n    \"src/runner/agent-roster.mjs\": \"infra\",\n    \"src/runner/agent-definitions.mjs\": \"infra\",\n    \"src/runner/agent-listing.mjs\": \"infra\",\n    \"src/runner/worktree.mjs\": \"infra\",\n    \"src/runner/promote-preflight.mjs\": \"infra\",\n    \"src/runner/promote-engine.mjs\": \"infra\",\n    \"src/runner/session.mjs\": \"infra\",\n    \"src/runner/gateway-control.mjs\": \"infra\",\n    \"src/runner/goal-check.mjs\": \"infra\",\n    \"src/runner/iron-law-gate.mjs\": \"infra\",\n    \"src/runner/frozen-judge.mjs\": \"domain\",\n    \"src/runner/merge.mjs\": \"infra\",\n    \"src/runner/main-checkout-lock.mjs\": \"infra\",\n    \"src/runner/main-checkout-activity.mjs\": \"infra\",\n    \"src/runner/main-checkout-reset-guard.mjs\": \"infra\",\n    \"src/runner/github-adapter.mjs\": \"infra\",\n    \"src/state/drift-status.mjs\": \"infra\",\n    \"src/state/postland-drift.mjs\": \"infra\",\n    \"src/state/store.mjs\": \"infra\",\n    \"src/state/gate-bypass.mjs\": \"infra\",\n    \"src/state/cursor.mjs\": \"use-case\",\n    \"src/state/porting-store.mjs\": \"infra\",\n    \"src/state/tool-registry.mjs\": \"domain\",\n    \"src/install/coexist.mjs\": \"infra\",\n    \"src/runner/recovery.mjs\": \"domain\",\n    \"src/runner/anti-loop.mjs\": \"domain\",\n    \"src/runner/attestation-guard.mjs\": \"domain\",\n    \"src/runner/claim-port.mjs\": \"infra\",\n    \"src/runner/claim-liveness.mjs\": \"infra\",\n    \"src/runner/lock-wait.mjs\": \"infra\",\n    \"src/runner/write-queue.mjs\": \"domain\",\n    \"src/runner/root-affinity.mjs\": \"domain\",\n    \"src/state/status-fsm.mjs\": \"domain\",\n    \"src/state/decision-question.mjs\": \"domain\",\n    \"src/state/handoff.mjs\": \"domain\",\n    \"src/state/porting.mjs\": \"domain\",\n    \"src/state/frontier.mjs\": \"domain\",\n    \"src/state/impact.mjs\": \"domain\",\n    \"src/state/priority-formula.mjs\": \"domain\",\n    \"src/state/replay.mjs\": \"domain\",\n    \"src/state/events-compaction.mjs\": \"domain\",\n    \"src/state/dep-graph.mjs\": \"domain\",\n    \"src/state/graph-harness.mjs\": \"domain\",\n    \"src/state/graph-metrics.mjs\": \"domain\",\n    \"src/state/awaiting-context.mjs\": \"domain\",\n    \"src/state/cleanup-harness.mjs\": \"domain\",\n    \"src/state/cleanup-pool.mjs\": \"domain\",\n    \"src/state/discover-pool.mjs\": \"domain\",\n    \"src/state/plan-pool.mjs\": \"domain\",\n    \"src/state/retro-pool.mjs\": \"domain\",\n    \"src/state/retrospective-doors.mjs\": \"domain\",\n    \"src/state/worker-slots.mjs\": \"domain\",\n    \"src/intake/discovery.mjs\": \"use-case\",\n    \"src/intake/plan.mjs\": \"use-case\",\n    \"src/intake/plan-verdict-from-plan-md.mjs\": \"use-case\",\n    \"src/intake/verify-pattern-check.mjs\": \"kernel\",\n    \"src/cli/command-registry.mjs\": \"kernel\",\n    \"src/cli/deprecation.mjs\": \"kernel\",\n    \"src/cli/version.mjs\": \"kernel\",\n    \"src/cli/invocation-fault-log.mjs\": \"infra\",\n    \"src/cli/approve-fault-log.mjs\": \"infra\",\n    \"src/report/enduser-index.mjs\": \"domain\",\n    \"src/report/enduser-index-generate.mjs\": \"infra\",\n    \"src/report/decision-index.mjs\": \"infra\",\n    \"src/report/capability-plan-lint.mjs\": \"infra\",\n    \"src/report/context-render.mjs\": \"domain\",\n    \"src/report/frontmatter.mjs\": \"domain\",\n    \"src/report/authoritative-match.mjs\": \"domain\",\n    \"src/evolve/iron-law.mjs\": \"domain\",\n    \"src/state/events.mjs\": \"kernel\",\n    \"src/state/events-jsonl-truncation-guard.mjs\": \"kernel\",\n    \"src/state/main-checkout-guard-warnings.mjs\": \"kernel\",\n    \"src/state/work.mjs\": \"kernel\",\n    \"src/state/envelope.mjs\": \"kernel\",\n    \"src/intake/risk-keywords.mjs\": \"kernel\",\n    \"src/verbs/merge/merge.mjs\": \"use-case\",\n    \"src/verbs/merge/iron-law-level.mjs\": \"use-case\",\n    \"src/verbs/merge/approve.mjs\": \"use-case\",\n    \"src/verbs/merge/review.mjs\": \"use-case\",\n    \"src/verbs/merge/sync-root.mjs\": \"use-case\",\n    \"src/verbs/merge/catchup.mjs\": \"use-case\",\n    \"src/verbs/merge/reject.mjs\": \"use-case\",\n    \"src/verbs/merge/promote-to-component.mjs\": \"use-case\",\n    \"src/verbs/state/edit.mjs\": \"use-case\",\n    \"src/verbs/state/move.mjs\": \"use-case\",\n    \"src/verbs/state/read.mjs\": \"use-case\",\n    \"src/verbs/dispatch/show-run.mjs\": \"use-case\",\n    \"src/verbs/dispatch/inspect.mjs\": \"use-case\",\n    \"src/verbs/dispatch/reconcile.mjs\": \"use-case\",\n    \"src/verbs/dispatch/watch.mjs\": \"use-case\",\n    \"src/verbs/dispatch/recover.mjs\": \"use-case\",\n    \"src/report/item-trace.mjs\": \"domain\",\n    \"src/util/format-bytes.mjs\": \"kernel\",\n    \"src/util/format-duration.mjs\": \"kernel\",\n    \"src/util/normalize-path.mjs\": \"kernel\",\n    \"src/util/git-paths.mjs\": \"kernel\",\n    \"src/util/release-binary-path.mjs\": \"kernel\",\n    \"src/util/release-targets.mjs\": \"kernel\",\n    \"src/util/session-identity.mjs\": \"kernel\",\n    \"src/util/host-bin-path.mjs\": \"kernel\",\n    \"src/util/unique-tmp-tag.mjs\": \"kernel\",\n    \"src/util/host-bin.mjs\": \"infra\",\n    \"src/convention/convention-client.mjs\": \"infra\",\n    \"src/observe/friction-client.mjs\": \"infra\",\n    \"src/intake/classify.mjs\": \"use-case\",\n    \"src/setup/ansi.mjs\": \"domain\",\n    \"src/setup/config-merge.mjs\": \"domain\",\n    \"src/setup/shell-rc.mjs\": \"infra\",\n    \"src/setup/project-launcher.mjs\": \"infra\",\n    \"src/setup/bin-discovery.mjs\": \"infra\",\n    \"src/setup/skill-wrappers.mjs\": \"infra\",\n    \"src/setup/instruction-registry.mjs\": \"infra\",\n    \"src/setup/git-hooks.mjs\": \"infra\",\n    \"src/setup/claude-code-hooks.mjs\": \"infra\",\n    \"src/setup/agent-hooks.mjs\": \"infra\",\n    \"src/setup/agy-permissions.mjs\": \"infra\",\n    \"src/setup/agent-cli-trust.mjs\": \"infra\",\n    \"src/setup/blind-steps-proven-pools.mjs\": \"use-case\",\n    \"src/setup/workflow-pool-independence.mjs\": \"use-case\",\n    \"src/setup/checks.mjs\": \"use-case\",\n    \"src/setup/executor-profile-warnings.mjs\": \"infra\",\n    \"src/config/global-config.mjs\": \"infra\",\n    \"src/setup/registrations.mjs\": \"use-case\",\n    \"src/setup/executor-posture-coverage.mjs\": \"use-case\",\n    \"src/config/shared-config-file.mjs\": \"domain\",\n    \"src/state/knowledge-registry.mjs\": \"domain\",\n    \"src/report/knowledge-resolver.mjs\": \"domain\",\n    \"src/report/knowledge-projection.mjs\": \"domain\",\n    \"src/state/fgos-file-registry.mjs\": \"kernel\",\n    \"src/state/runtime-coordination.mjs\": \"infra\",\n    \"src/runner/dispatch/brief.mjs\": \"infra\",\n    \"src/runner/dispatch/dispatch-error.mjs\": \"infra\",\n    \"src/runner/dispatch/proof-helpers.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-agent.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-diagnosis.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-round.mjs\": \"infra\",\n    \"src/runner/dispatch/herdr-reconcile.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-artifacts.mjs\": \"infra\",\n    \"src/runner/dispatch/liveness.mjs\": \"infra\",\n    \"src/runner/dispatch/visibility-session.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery-planner.mjs\": \"infra\",\n    \"src/runner/dispatch/run-lock.mjs\": \"infra\",\n    \"src/runner/dispatch/process-identity.mjs\": \"infra\",\n    \"src/runner/dispatch/trust-store.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-home.mjs\": \"infra\",\n    \"src/runner/dispatch/stop-processes-inside.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session.mjs\": \"infra\",\n    \"src/runner/dispatch/worker-session-boot.mjs\": \"infra\",\n    \"src/runner/dispatch/recovery.mjs\": \"infra\",\n    \"src/setup/instruction-composition.mjs\": \"infra\",\n    \"src/setup/instruction-projections.mjs\": \"infra\",\n    \"src/runner/execution/unit.mjs\": \"infra\",\n    \"src/runner/execution/bind.mjs\": \"infra\",\n    \"src/runner/execution/account-pin.mjs\": \"infra\",\n    \"src/runner/execution/account-rotation.mjs\": \"infra\",\n    \"src/runner/execution/dry-bind.mjs\": \"infra\",\n    \"src/runner/execution/role-ledger.mjs\": \"infra\",\n    \"src/runner/execution/commit-unit-work.mjs\": \"infra\",\n    \"src/runner/execution/partial-writes.mjs\": \"infra\",\n    \"src/runner/execution/unit-sync.mjs\": \"infra\",\n    \"src/runner/execution/handoff-refs.mjs\": \"infra\",\n    \"src/runner/execution/unit-run-history.mjs\": \"infra\",\n    \"src/runner/execution/unit-summary.mjs\": \"infra\",\n    \"src/runner/execution/run.mjs\": \"use-case\",\n    \"src/runner/execution/patterns/index.mjs\": \"domain\",\n    \"src/runner/execution/patterns/panel.mjs\": \"domain\",\n    \"src/runner/execution/patterns/presets.mjs\": \"domain\",\n    \"src/runner/execution/patterns/reviewed.mjs\": \"domain\",\n    \"src/runner/execution/patterns/role-tasks.mjs\": \"domain\",\n    \"src/runner/execution/patterns/solo.mjs\": \"domain\",\n    \"src/workflow/definition.mjs\": \"kernel\",\n    \"src/workflow/dir-guard.mjs\": \"infra\",\n    \"src/workflow/loader.mjs\": \"infra\",\n    \"src/workflow/store.mjs\": \"infra\",\n    \"src/workflow/integrate.mjs\": \"infra\",\n    \"src/workflow/plan-source.mjs\": \"infra\",\n    \"src/workflow/units-source.mjs\": \"infra\",\n    \"src/workflow/runner.mjs\": \"use-case\",\n    \"src/workflow/index.mjs\": \"use-case\",\n    \"src/workflow/checked.mjs\": \"infra\",\n    \"src/workflow/ref-digests.mjs\": \"infra\",\n    \"src/workflow/seat-providers.mjs\": \"infra\",\n    \"src/workflow/seats.mjs\": \"infra\",\n    \"src/workflow/steps.mjs\": \"kernel\",\n    \"src/state/domain-registry.mjs\": \"kernel\",\n    \"src/state/step-fsm.mjs\": \"domain\",\n    \"src/verbs/state/step.mjs\": \"use-case\",\n    \"src/runner/operation-choice.mjs\": \"use-case\",\n    \"src/runner/work-dispatch.mjs\": \"use-case\"\n  }\n}"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_95bccfdc53e0c3efcfa29e694d26d5a3"
}
```

## Entry claim_0cd9f726c1975be41c12f673b0f92353

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_0cd9f726c1975be41c12f673b0f92353",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/convention/spec.md",
    "unitDigest": "63cf17af9c53d235ce3deb80500434d4bd232749e21033c32ef7bd0e39c914e0",
    "identityFingerprint": "459a8df5a260572433b83391338c12139620007bc599fa61c78d7b2257e0618e",
    "claimId": "claim_0cd9f726c1975be41c12f673b0f92353",
    "sourceAnchor": "convention-component-specification",
    "unitKind": "heading",
    "sourceUnitDigest": "aa4bc0763d6cf4bb71bac98fe0da2aefa1ff24f51c88c29f6e830d87ccfc816b",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "e0e8920480d4237d7babdc725594b783100dad999ff1ae2f12bf50980aff4d9e",
      "toUnitDigest": "63cf17af9c53d235ce3deb80500434d4bd232749e21033c32ef7bd0e39c914e0",
      "fromSourceUnitDigest": "15eff66ad0cc2181a7d2fb879b0af62e7885521b0c78eeee5480e1ddb69a550d",
      "toSourceUnitDigest": "aa4bc0763d6cf4bb71bac98fe0da2aefa1ff24f51c88c29f6e830d87ccfc816b"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/convention/spec.md",
    "unitDigest": "63cf17af9c53d235ce3deb80500434d4bd232749e21033c32ef7bd0e39c914e0",
    "identityFingerprint": "459a8df5a260572433b83391338c12139620007bc599fa61c78d7b2257e0618e",
    "claimId": "claim_0cd9f726c1975be41c12f673b0f92353",
    "sourceAnchor": "convention-component-specification",
    "unitKind": "heading",
    "sourceUnitDigest": "aa4bc0763d6cf4bb71bac98fe0da2aefa1ff24f51c88c29f6e830d87ccfc816b",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Convention Component Specification",
    "anchor": "convention-component-specification",
    "githubAnchor": "convention-component-specification",
    "stableAnchor": "h-05674feff071",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "aa4bc0763d6cf4bb71bac98fe0da2aefa1ff24f51c88c29f6e830d87ccfc816b",
    "sample": "Convention Component Specification",
    "sectionPayloadDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "followingBlockDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "identityFingerprint": "459a8df5a260572433b83391338c12139620007bc599fa61c78d7b2257e0618e",
    "ancestry": [],
    "text": "# Convention Component Specification",
    "sectionText": "# Convention Component Specification\n\n```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\nImplementation: Implemented\nProvenance: Existing convention specification and its Related references; metadata completion under L10-9\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard\nUse this when: Define the executable source of truth for fgOS names and repository-relative placement\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Convention Component Specification",
    "anchor": "convention-component-specification",
    "githubAnchor": "convention-component-specification",
    "stableAnchor": "h-05674feff071",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "aa4bc0763d6cf4bb71bac98fe0da2aefa1ff24f51c88c29f6e830d87ccfc816b",
    "sample": "Convention Component Specification",
    "sectionPayloadDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "followingBlockDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "identityFingerprint": "459a8df5a260572433b83391338c12139620007bc599fa61c78d7b2257e0618e",
    "ancestry": [],
    "text": "# Convention Component Specification",
    "sectionText": "# Convention Component Specification\n\n```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\nImplementation: Implemented\nProvenance: Existing convention specification and its Related references; metadata completion under L10-9\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard\nUse this when: Define the executable source of truth for fgOS names and repository-relative placement\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_0cd9f726c1975be41c12f673b0f92353"
}
```

## Entry claim_ebf69accf5e5c54f1fc5a6af005bb34b

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_ebf69accf5e5c54f1fc5a6af005bb34b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/convention/spec.md",
    "unitDigest": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "identityFingerprint": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "claimId": "claim_ebf69accf5e5c54f1fc5a6af005bb34b",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "claimKind": "specification",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/convention/spec.md",
    "unitDigest": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "identityFingerprint": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "claimId": "claim_ebf69accf5e5c54f1fc5a6af005bb34b",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "claimKind": "specification",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 25,
    "textDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "sample": "```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS na",
    "identityFingerprint": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "ancestry": [
      "Convention Component Specification"
    ],
    "text": "```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\nImplementation: Implemented\nProvenance: Existing convention specification and its Related references; metadata completion under L10-9\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard\nUse this when: Define the executable source of truth for fgOS names and repository-relative placement\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 25,
    "textDigest": "d2cf54a22442ddf7c4f8c2288d93912160a7cfdc7d0b43c7e1b4d47f030ace1d",
    "sample": "```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS na",
    "identityFingerprint": "8351f5b13fa5f7b0320cd7e7a29a6a486a9cd5814c33dfc822122a62622f227f",
    "ancestry": [
      "Convention Component Specification"
    ],
    "text": "```txt\nDocument type: BA-grade area specification\nAudience: Human reviewer, maintainer, implementation agent, tool author\nPurpose: Define the executable source of truth for fgOS names and repository-relative placement\nDesign status: Accepted\nCanonical: Yes\nOwner: Convention component\nSource: packages/convention/rust\nContracts: packages/convention/contracts/\nLast reviewed: 2026-10-10\nRelated:\n- docs/platform/component-boundary.md\n- docs/platform/host-invocation-routing/contracts/operation-catalog.md\n- docs/io-contract.md\nImplementation: Implemented\nProvenance: Existing convention specification and its Related references; metadata completion under L10-9\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the executable source of truth for fgOS names and repository-relative placement; authority follows transitional switchboard\nUse this when: Define the executable source of truth for fgOS names and repository-relative placement\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_ebf69accf5e5c54f1fc5a6af005bb34b"
}
```

## Entry claim_6594cb53b2803583e6473e2f889b573a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_6594cb53b2803583e6473e2f889b573a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/architecture/documentation-system-design.md",
    "unitDigest": "b8a7b1b71c5c402a88c471918505b6656f053f50914946ef5a5f0265e5453f81",
    "identityFingerprint": "52608faa09c20422c85a8f8a8ca485734493f236096019a2ba250b624eb7ab62",
    "claimId": "claim_6594cb53b2803583e6473e2f889b573a",
    "sourceAnchor": "documentation-system-design",
    "unitKind": "heading",
    "sourceUnitDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "7aa43bae8ddb0fae66a20af7a28f952995edabfa61ddbc958b2fcf241813702e",
      "toUnitDigest": "b8a7b1b71c5c402a88c471918505b6656f053f50914946ef5a5f0265e5453f81",
      "fromSourceUnitDigest": "8c8841510e4c3e0c64556e3cec4777918ec8333869e02c0debe7aae074efd271",
      "toSourceUnitDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/architecture/documentation-system-design.md",
    "unitDigest": "b8a7b1b71c5c402a88c471918505b6656f053f50914946ef5a5f0265e5453f81",
    "identityFingerprint": "52608faa09c20422c85a8f8a8ca485734493f236096019a2ba250b624eb7ab62",
    "claimId": "claim_6594cb53b2803583e6473e2f889b573a",
    "sourceAnchor": "documentation-system-design",
    "unitKind": "heading",
    "sourceUnitDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation System Design",
    "anchor": "documentation-system-design",
    "githubAnchor": "documentation-system-design",
    "stableAnchor": "h-fe60eb6ae7ad",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96",
    "sample": "Documentation System Design",
    "sectionPayloadDigest": "3e28cf3f42b86004cc9f4a57f76fd4797dfbc8b4c17c3ec9def0ea39cc54c60d",
    "followingBlockDigest": "744aa1a17b6ad2ad2fe131479995e8d04b3ec2c213687999f7f4fba6c4a6ea7b",
    "identityFingerprint": "52608faa09c20422c85a8f8a8ca485734493f236096019a2ba250b624eb7ab62",
    "ancestry": [],
    "text": "# Documentation System Design",
    "sectionText": "# Documentation System Design\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/documentation-system-design.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob cbb634aa4c221da02bd34e41cb234abb70dfaa9b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/documentation-system-design.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep the mapped architecture rationale, not a new governance authority. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../architect/documentation-system-design.md).\n\n\n```txt\nDocument type: Architecture design\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Propose the whole-system documentation model for fgOS\nDesign status: Accepted\nImplementation: Partially promoted\nProvenance: Human + agent coauthor, synthesized from discussion and panel review\nWriter type: Human + agent coauthor\nCanonical for: source design behind the promoted documentation governance\nUse this when: Reviewing the rationale behind the documentation-system governance\nDo not use this for: Migration execution details\nLast reviewed: 2026-09-13\nRelated:\n- `docs/architect/documentation-system-discussion.md`\n```\n\nThis document is the source design for the fgOS documentation system. Its first\nsettled slice has been promoted into `docs/doc-governance.md`,\n`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and\n`docs/templates/**`. Use the promoted files for day-to-day documentation\ngovernance; use this design for rationale and future refinement."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation System Design",
    "anchor": "documentation-system-design",
    "githubAnchor": "documentation-system-design",
    "stableAnchor": "h-fe60eb6ae7ad",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "70a02fca3bf1139d4184cea11e561982fd6536e0f124e8318d32c62116eb3f96",
    "sample": "Documentation System Design",
    "sectionPayloadDigest": "3e28cf3f42b86004cc9f4a57f76fd4797dfbc8b4c17c3ec9def0ea39cc54c60d",
    "followingBlockDigest": "744aa1a17b6ad2ad2fe131479995e8d04b3ec2c213687999f7f4fba6c4a6ea7b",
    "identityFingerprint": "52608faa09c20422c85a8f8a8ca485734493f236096019a2ba250b624eb7ab62",
    "ancestry": [],
    "text": "# Documentation System Design",
    "sectionText": "# Documentation System Design\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/documentation-system-design.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob cbb634aa4c221da02bd34e41cb234abb70dfaa9b\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/documentation-system-design.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Keep the mapped architecture rationale, not a new governance authority. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../architect/documentation-system-design.md).\n\n\n```txt\nDocument type: Architecture design\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Propose the whole-system documentation model for fgOS\nDesign status: Accepted\nImplementation: Partially promoted\nProvenance: Human + agent coauthor, synthesized from discussion and panel review\nWriter type: Human + agent coauthor\nCanonical for: source design behind the promoted documentation governance\nUse this when: Reviewing the rationale behind the documentation-system governance\nDo not use this for: Migration execution details\nLast reviewed: 2026-09-13\nRelated:\n- `docs/architect/documentation-system-discussion.md`\n```\n\nThis document is the source design for the fgOS documentation system. Its first\nsettled slice has been promoted into `docs/doc-governance.md`,\n`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and\n`docs/templates/**`. Use the promoted files for day-to-day documentation\ngovernance; use this design for rationale and future refinement."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_6594cb53b2803583e6473e2f889b573a"
}
```

## Entry claim_074ebac66fec4b7c1415a4b4e3e7dda2

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_074ebac66fec4b7c1415a4b4e3e7dda2",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/architecture/documentation-system-design.md",
    "unitDigest": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "identityFingerprint": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "claimId": "claim_074ebac66fec4b7c1415a4b4e3e7dda2",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "17eb7516e2dfefa437f112df67c20294b3eb9f847b9e79e632e8d82df62ad5f9",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/architecture/documentation-system-design.md",
    "unitDigest": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "identityFingerprint": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "claimId": "claim_074ebac66fec4b7c1415a4b4e3e7dda2",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "17eb7516e2dfefa437f112df67c20294b3eb9f847b9e79e632e8d82df62ad5f9",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "17eb7516e2dfefa437f112df67c20294b3eb9f847b9e79e632e8d82df62ad5f9",
    "sample": "Source relationship: [original source](../../../architect/documentation-system-design.md).",
    "identityFingerprint": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "ancestry": [
      "Documentation System Design"
    ],
    "text": "Source relationship: [original source](../../../architect/documentation-system-design.md)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "17eb7516e2dfefa437f112df67c20294b3eb9f847b9e79e632e8d82df62ad5f9",
    "sample": "Source relationship: [original source](../../../architect/documentation-system-design.md).",
    "identityFingerprint": "602985212f3973a444c27d1838c0b2a97fa8a7f268f87f55de8cf0736b8c68a6",
    "ancestry": [
      "Documentation System Design"
    ],
    "text": "Source relationship: [original source](../../../architect/documentation-system-design.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_074ebac66fec4b7c1415a4b4e3e7dda2"
}
```

## Entry claim_f57240590425901ac663ceabffcd8585

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f57240590425901ac663ceabffcd8585",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/switchboard.md",
    "unitDigest": "51ee09c2c8b8e5068988c6cab9793fa9acb4ce3995daff8b58e9cc252735cd34",
    "identityFingerprint": "a06b87962e9a5581596cfa1f3bfbe4944b3d3da367de806973cc9dd868b09070",
    "claimId": "claim_f57240590425901ac663ceabffcd8585",
    "sourceAnchor": "5-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "94f76558f054c3b49810458efdcb284f7fdb709efbd22aae3d263b87eac323ec",
      "toUnitDigest": "51ee09c2c8b8e5068988c6cab9793fa9acb4ce3995daff8b58e9cc252735cd34",
      "fromSourceUnitDigest": "e0db043a10f231a131c7424e58b5cfb5e811009e5da73e64f0d02ba00c6fd2fb",
      "toSourceUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/switchboard.md",
    "unitDigest": "51ee09c2c8b8e5068988c6cab9793fa9acb4ce3995daff8b58e9cc252735cd34",
    "identityFingerprint": "a06b87962e9a5581596cfa1f3bfbe4944b3d3da367de806973cc9dd868b09070",
    "claimId": "claim_f57240590425901ac663ceabffcd8585",
    "sourceAnchor": "5-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Related Files",
    "anchor": "5-related-files",
    "githubAnchor": "5-related-files",
    "stableAnchor": "h-451a0ae5de06",
    "startLine": 109,
    "endLine": 109,
    "textDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "sample": "5. Related Files",
    "sectionPayloadDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "followingBlockDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "identityFingerprint": "a06b87962e9a5581596cfa1f3bfbe4944b3d3da367de806973cc9dd868b09070",
    "ancestry": [
      "Transitional Documentation Authority Switchboard"
    ],
    "text": "## 5. Related Files",
    "sectionText": "## 5. Related Files\n\n| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation governance | [docs/platform/governance.md](../governance.md) |\n| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |\n| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "5. Related Files",
    "anchor": "5-related-files",
    "githubAnchor": "5-related-files",
    "stableAnchor": "h-451a0ae5de06",
    "startLine": 109,
    "endLine": 109,
    "textDigest": "31d43bc08eb7f07bb47204e7cef0998d514836e35e717db722eb8e171a2c578e",
    "sample": "5. Related Files",
    "sectionPayloadDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "followingBlockDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "identityFingerprint": "a06b87962e9a5581596cfa1f3bfbe4944b3d3da367de806973cc9dd868b09070",
    "ancestry": [
      "Transitional Documentation Authority Switchboard"
    ],
    "text": "## 5. Related Files",
    "sectionText": "## 5. Related Files\n\n| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation governance | [docs/platform/governance.md](../governance.md) |\n| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |\n| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f57240590425901ac663ceabffcd8585"
}
```

## Entry claim_9402734ed8f5815e32b51c4e5fa5971a

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9402734ed8f5815e32b51c4e5fa5971a",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/switchboard.md",
    "unitDigest": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "identityFingerprint": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "claimId": "claim_9402734ed8f5815e32b51c4e5fa5971a",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/documentation/switchboard.md",
    "unitDigest": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "identityFingerprint": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "claimId": "claim_9402734ed8f5815e32b51c4e5fa5971a",
    "sourceAnchor": "unheaded-block-7",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "claimKind": "unclassified",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 111,
    "endLine": 118,
    "textDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "sample": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation",
    "identityFingerprint": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "ancestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation governance | [docs/platform/governance.md](../governance.md) |\n| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |\n| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-7",
    "githubAnchor": "unheaded-block-7",
    "stableAnchor": "unheaded-block-7",
    "title": "Unheaded block 7",
    "startLine": 111,
    "endLine": 118,
    "textDigest": "9d3f5ac3c5d03730ea68427c86f1e9e1b324a008486e9a3a1864e92f7c671672",
    "sample": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation",
    "identityFingerprint": "9fcc7b2d1b7e3d57658c3da119865bacbb599e64f7fc47b2b3d04cd2fac6469f",
    "ancestry": [
      "Transitional Documentation Authority Switchboard",
      "5. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| reader orientation | [docs/reading-map.md](../../reading-map.md) |\n| platform portal | [docs/platform/README.md](../README.md) |\n| documentation governance | [docs/platform/governance.md](../governance.md) |\n| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |\n| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |\n| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9402734ed8f5815e32b51c4e5fa5971a"
}
```

## Entry claim_efdb6d13ecd336da18d388407093017b

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_efdb6d13ecd336da18d388407093017b",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "9f111f004f7f9310a9ced9b8f6589d1e86acb777634c85b351de5c334698634c",
    "identityFingerprint": "f078a23defbb643768b8f7f6b3c10c9b8282cea73edcc2dc0d7ccb0a3e4c8c9c",
    "claimId": "claim_efdb6d13ecd336da18d388407093017b",
    "sourceAnchor": "fgos-domainization-architecture",
    "unitKind": "heading",
    "sourceUnitDigest": "cb673d5ef82458d38d0c12ade3b37664b34ecd83e116c779334607279ac3a731",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "bca24010e3a9655a62f05b375651a50d80a0426507ef3706e296df91f72931f8",
      "toUnitDigest": "9f111f004f7f9310a9ced9b8f6589d1e86acb777634c85b351de5c334698634c",
      "fromSourceUnitDigest": "78feb072acedefed0b4d8fa8f1fcd1798d8c69c646ac496c6e9f9f4a199eb125",
      "toSourceUnitDigest": "cb673d5ef82458d38d0c12ade3b37664b34ecd83e116c779334607279ac3a731"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "9f111f004f7f9310a9ced9b8f6589d1e86acb777634c85b351de5c334698634c",
    "identityFingerprint": "f078a23defbb643768b8f7f6b3c10c9b8282cea73edcc2dc0d7ccb0a3e4c8c9c",
    "claimId": "claim_efdb6d13ecd336da18d388407093017b",
    "sourceAnchor": "fgos-domainization-architecture",
    "unitKind": "heading",
    "sourceUnitDigest": "cb673d5ef82458d38d0c12ade3b37664b34ecd83e116c779334607279ac3a731",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Domainization Architecture",
    "anchor": "fgos-domainization-architecture",
    "githubAnchor": "fgos-domainization-architecture",
    "stableAnchor": "h-f2b16f408358",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cb673d5ef82458d38d0c12ade3b37664b34ecd83e116c779334607279ac3a731",
    "sample": "fgOS Domainization Architecture",
    "sectionPayloadDigest": "54ee18176f35d3b51df50b11d01099dba100c96e3119827ad4bcadb2856c5054",
    "followingBlockDigest": "c6bdae3f7c1516b811344aeb7f7925c52dffe8df3d861212876b0cedebaba8fa",
    "identityFingerprint": "f078a23defbb643768b8f7f6b3c10c9b8282cea73edcc2dc0d7ccb0a3e4c8c9c",
    "ancestry": [],
    "text": "# fgOS Domainization Architecture",
    "sectionText": "# fgOS Domainization Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/domainization/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 10bba1a86978a08564cac0ca623bc4ed0326b987\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/domainization/README.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Retain mapped architecture; preserve advisory and partial status verbatim. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../architect/domainization/README.md).\n\n\nDocument type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts\nRelated: [Component Boundary Advisory](../../component-boundary.md), [System Overview](../../system-overview/spec.md), [Work Item Lifecycle Vision](../../vision.md), [Work-State Spec](../../work-state/spec.md)"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "fgOS Domainization Architecture",
    "anchor": "fgos-domainization-architecture",
    "githubAnchor": "fgos-domainization-architecture",
    "stableAnchor": "h-f2b16f408358",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cb673d5ef82458d38d0c12ade3b37664b34ecd83e116c779334607279ac3a731",
    "sample": "fgOS Domainization Architecture",
    "sectionPayloadDigest": "54ee18176f35d3b51df50b11d01099dba100c96e3119827ad4bcadb2856c5054",
    "followingBlockDigest": "c6bdae3f7c1516b811344aeb7f7925c52dffe8df3d861212876b0cedebaba8fa",
    "identityFingerprint": "f078a23defbb643768b8f7f6b3c10c9b8282cea73edcc2dc0d7ccb0a3e4c8c9c",
    "ancestry": [],
    "text": "# fgOS Domainization Architecture",
    "sectionText": "# fgOS Domainization Architecture\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, agent\nPurpose: Preserve mapped source text for independent conservation review\nDesign status: Candidate\nImplementation: Source snapshot retained; current implementation truth not certified\nProvenance: docs/architect/domainization/README.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob 10bba1a86978a08564cac0ca623bc4ed0326b987\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: Nothing; non-canonical candidate conservation carrier\nUse this when: Reviewing source carriage, placement, intent and provenance\nDo not use this for: Current authority, implementation proof or cutover approval\nLast reviewed: Pending independent review\nRelated:\n- docs/architect/domainization/README.md\nSupersedes: None; legacy source remains intact\nSuperseded by: None\n```\n\nAdded in candidate: Candidate carriage; Retain mapped architecture; preserve advisory and partial status verbatim. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.\n\nSource relationship: [original source](../../../architect/domainization/README.md).\n\n\nDocument type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts\nRelated: [Component Boundary Advisory](../../component-boundary.md), [System Overview](../../system-overview/spec.md), [Work Item Lifecycle Vision](../../vision.md), [Work-State Spec](../../work-state/spec.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_efdb6d13ecd336da18d388407093017b"
}
```

## Entry claim_9fcbbf13385477554e3c3b7d23b528f6

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_9fcbbf13385477554e3c3b7d23b528f6",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "identityFingerprint": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "claimId": "claim_9fcbbf13385477554e3c3b7d23b528f6",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0b999d0ccb448e6f457297aea601d89ce5ac72f124a5b330e55cac5425b376ba",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "identityFingerprint": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "claimId": "claim_9fcbbf13385477554e3c3b7d23b528f6",
    "sourceAnchor": "unheaded-block-3",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "0b999d0ccb448e6f457297aea601d89ce5ac72f124a5b330e55cac5425b376ba",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "0b999d0ccb448e6f457297aea601d89ce5ac72f124a5b330e55cac5425b376ba",
    "sample": "Source relationship: [original source](../../../architect/domainization/README.md).",
    "identityFingerprint": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "ancestry": [
      "fgOS Domainization Architecture"
    ],
    "text": "Source relationship: [original source](../../../architect/domainization/README.md)."
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-3",
    "githubAnchor": "unheaded-block-3",
    "stableAnchor": "unheaded-block-3",
    "title": "Unheaded block 3",
    "startLine": 24,
    "endLine": 24,
    "textDigest": "0b999d0ccb448e6f457297aea601d89ce5ac72f124a5b330e55cac5425b376ba",
    "sample": "Source relationship: [original source](../../../architect/domainization/README.md).",
    "identityFingerprint": "6c8aff2fc7fcd11e232a4d0d6b864e93bfb527080dbbe7215eb505165c6c6798",
    "ancestry": [
      "fgOS Domainization Architecture"
    ],
    "text": "Source relationship: [original source](../../../architect/domainization/README.md)."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_9fcbbf13385477554e3c3b7d23b528f6"
}
```

## Entry claim_d167b947abb56624d1c4d02ac6573ed9

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_d167b947abb56624d1c4d02ac6573ed9",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "identityFingerprint": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "claimId": "claim_d167b947abb56624d1c4d02ac6573ed9",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "06812ac14892a989397980cd115b5cddbdf986aa9311f3bff352ebec3a685c64",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/domainization/architecture/domainization.md",
    "unitDigest": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "identityFingerprint": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "claimId": "claim_d167b947abb56624d1c4d02ac6573ed9",
    "sourceAnchor": "unheaded-block-4",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "06812ac14892a989397980cd115b5cddbdf986aa9311f3bff352ebec3a685c64",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 27,
    "endLine": 32,
    "textDigest": "06812ac14892a989397980cd115b5cddbdf986aa9311f3bff352ebec3a685c64",
    "sample": "Document type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; o",
    "identityFingerprint": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "ancestry": [
      "fgOS Domainization Architecture"
    ],
    "text": "Document type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts\nRelated: [Component Boundary Advisory](../../component-boundary.md), [System Overview](../../system-overview/spec.md), [Work Item Lifecycle Vision](../../vision.md), [Work-State Spec](../../work-state/spec.md)"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-4",
    "githubAnchor": "unheaded-block-4",
    "stableAnchor": "unheaded-block-4",
    "title": "Unheaded block 4",
    "startLine": 27,
    "endLine": 32,
    "textDigest": "06812ac14892a989397980cd115b5cddbdf986aa9311f3bff352ebec3a685c64",
    "sample": "Document type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; o",
    "identityFingerprint": "3aa3f353b33609f36aa067397ebc4892973e160dccb71cde479ef901d0419996",
    "ancestry": [
      "fgOS Domainization Architecture"
    ],
    "text": "Document type: Architecture advisory\nDesign status: Discussion / Visionary advisory\nImplementation: Partial\nLast reviewed: 2026-09-03\nCanonical for: domainization direction only; owning contracts still live in specs, domain files, and engine contracts\nRelated: [Component Boundary Advisory](../../component-boundary.md), [System Overview](../../system-overview/spec.md), [Work Item Lifecycle Vision](../../vision.md), [Work-State Spec](../../work-state/spec.md)"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_d167b947abb56624d1c4d02ac6573ed9"
}
```

## Entry claim_5dae6eed87e8f69f3c3530f0d203b7fa

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "d7c4f56a3332d3d45c5e4dbf118d334e3d4d69969584d2feb4b65ad077d1ed71",
    "identityFingerprint": "5b31066727f3ed51e337ea0c1392e22f868296c3c44d8fb4246b9dcd799c3d8d",
    "claimId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa",
    "sourceAnchor": "14-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c",
    "claimKind": "unclassified",
    "status": "future"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "0a8dec140c3b9bad9f1fd945dd8eba2b12bc8b08405b1e90c536941bf96378aa",
    "identityFingerprint": "162adf53d5e0fa7024810b711d2356345e9e4068a20f705de82bf8ea59449bc8",
    "claimId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa",
    "sourceAnchor": "14-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "claimKind": "unclassified",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "2300d65571968bb3bcb80123a273272586e3f1db",
      "fromUnitDigest": "d7c4f56a3332d3d45c5e4dbf118d334e3d4d69969584d2feb4b65ad077d1ed71",
      "toUnitDigest": "0a8dec140c3b9bad9f1fd945dd8eba2b12bc8b08405b1e90c536941bf96378aa",
      "fromSourceUnitDigest": "1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c",
      "toSourceUnitDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6"
    }
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Related Files",
    "anchor": "14-related-files",
    "githubAnchor": "14-related-files",
    "stableAnchor": "h-0bbdbfcf2ed4",
    "startLine": 467,
    "endLine": 467,
    "textDigest": "1b5703ab9905bb5b86c289e9b6474f95cb2313ac563451919595515af5f1000c",
    "sample": "14. Related Files",
    "sectionPayloadDigest": "32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba",
    "followingBlockDigest": "32b40e383cb5cb41ff5b61f312d99116278ddac6728391109adbd1f7f891c4ba",
    "identityFingerprint": "5b31066727f3ed51e337ea0c1392e22f868296c3c44d8fb4246b9dcd799c3d8d",
    "ancestry": [
      "Documentation Governance"
    ],
    "text": "## 14. Related Files",
    "sectionText": "## 14. Related Files\n\n| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |\n| platform portal | [platform/README.md](README.md) |\n| source design discussion | [architect/documentation-system-design.md](documentation/architecture/documentation-system-design.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "14. Related Files",
    "anchor": "14-related-files",
    "githubAnchor": "14-related-files",
    "stableAnchor": "h-0bbdbfcf2ed4",
    "startLine": 467,
    "endLine": 467,
    "textDigest": "12cc18517f23da3cdd1de3e0a0090371e92f19fce30063363466eb6fdea56cb6",
    "sample": "14. Related Files",
    "sectionPayloadDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "followingBlockDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "identityFingerprint": "162adf53d5e0fa7024810b711d2356345e9e4068a20f705de82bf8ea59449bc8",
    "ancestry": [
      "Documentation Governance"
    ],
    "text": "## 14. Related Files",
    "sectionText": "## 14. Related Files\n\n| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |\n| platform portal | [platform/README.md](README.md) |\n| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": true,
  "entryId": "claim_5dae6eed87e8f69f3c3530f0d203b7fa"
}
```

## Entry claim_dcd367702f88715502009bca2285a1e4

```json
{
  "kind": "new-native-unit",
  "claimId": "claim_dcd367702f88715502009bca2285a1e4",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": null,
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/governance.md",
    "unitDigest": "033acbc5972fad7020c442c62fe2c6461e65cff22e3f45c5efbc812f97067e04",
    "identityFingerprint": "033acbc5972fad7020c442c62fe2c6461e65cff22e3f45c5efbc812f97067e04",
    "claimId": "claim_dcd367702f88715502009bca2285a1e4",
    "sourceAnchor": "unheaded-block-60",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "claimKind": "unclassified",
    "status": "future",
    "origin": "added-since-2300d65571968bb3bcb80123a273272586e3f1db"
  },
  "beforeWitness": null,
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-60",
    "githubAnchor": "unheaded-block-60",
    "stableAnchor": "unheaded-block-60",
    "title": "Unheaded block 60",
    "startLine": 469,
    "endLine": 476,
    "textDigest": "f389738a959bded8d713ae3139c654c123eed5d9a93ae8b439562d84aca629ae",
    "sample": "| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n|",
    "identityFingerprint": "033acbc5972fad7020c442c62fe2c6461e65cff22e3f45c5efbc812f97067e04",
    "ancestry": [
      "Documentation Governance",
      "14. Related Files"
    ],
    "text": "| Relationship | File |\n|---|---|\n| documentation portal | [README.md](documentation/operations/portals/docs-portal.md) |\n| reader routing | [reading-map.md](../reading-map.md) |\n| operative transitional switchboard | [transitional-switchboard.md](documentation/switchboard.md) |\n| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |\n| platform portal | [platform/README.md](README.md) |\n| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_dcd367702f88715502009bca2285a1e4"
}
```

## Entry claim_072aec4329b94c7ce2bf371f676bf7ec

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_072aec4329b94c7ce2bf371f676bf7ec",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/history/documentation-authority-unification/README.md",
    "unitDigest": "3760a75727c53fb5556abb7740875d7be768fc67d05cf8e558dcb62841b6ae86",
    "identityFingerprint": "8683477efcf3aa47805701778eb8ea676750ee4e571d72fff405e5199e1f1373",
    "claimId": "claim_072aec4329b94c7ce2bf371f676bf7ec",
    "sourceAnchor": "documentation-authority-unification-evidence",
    "unitKind": "heading",
    "sourceUnitDigest": "cc71c898b15c49e862592a081319bf3caebf624bb3bad7a2cb081da7774ee1da",
    "claimKind": "historical-context",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "c8505059c66cdf8c24a136a4d091624f24c8f322a4ab6dcf09cf125e6c6dc821",
      "toUnitDigest": "3760a75727c53fb5556abb7740875d7be768fc67d05cf8e558dcb62841b6ae86",
      "fromSourceUnitDigest": "68f98c6eaab9f9372db32c6c56dfe81cd46e5aeaeaab672f50694fa59cd09ea5",
      "toSourceUnitDigest": "cc71c898b15c49e862592a081319bf3caebf624bb3bad7a2cb081da7774ee1da"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/history/documentation-authority-unification/README.md",
    "unitDigest": "3760a75727c53fb5556abb7740875d7be768fc67d05cf8e558dcb62841b6ae86",
    "identityFingerprint": "8683477efcf3aa47805701778eb8ea676750ee4e571d72fff405e5199e1f1373",
    "claimId": "claim_072aec4329b94c7ce2bf371f676bf7ec",
    "sourceAnchor": "documentation-authority-unification-evidence",
    "unitKind": "heading",
    "sourceUnitDigest": "cc71c898b15c49e862592a081319bf3caebf624bb3bad7a2cb081da7774ee1da",
    "claimKind": "historical-context",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation authority unification evidence",
    "anchor": "documentation-authority-unification-evidence",
    "githubAnchor": "documentation-authority-unification-evidence",
    "stableAnchor": "h-274b4a5b8c28",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc71c898b15c49e862592a081319bf3caebf624bb3bad7a2cb081da7774ee1da",
    "sample": "Documentation authority unification evidence",
    "sectionPayloadDigest": "a4d3dda62fe83e04f4c84f35328fd21ad15b18868e63e6c12c3f58bcc5cbba58",
    "followingBlockDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "identityFingerprint": "8683477efcf3aa47805701778eb8ea676750ee4e571d72fff405e5199e1f1373",
    "ancestry": [],
    "text": "# Documentation authority unification evidence",
    "sectionText": "# Documentation authority unification evidence\n\n```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nProvenance: plans/260925-documentation-authority-unification/ at SYNC e7393ea3c\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; historical evidence\nUse this when: Auditing documentation conservation and recorded decisions\nDo not use this for: Current platform authority or cutover authorization\nLast reviewed: Pending independent review\nRelated: plans/260925-documentation-authority-unification/plan.md\nSupersedes: None\nSuperseded by: None\n```\n\nAdded in candidate: Migration evidence index. The plan, decisions, reports, independent review receipts and known holds remain in plans/260925-documentation-authority-unification/. A dry-run snapshot will be generated by propose-doc-decisions.mjs --snapshot and checked with --verify in the package turn after documents are committed. No snapshot is claimed present yet. Phase 9 owns the sealed format and sealing. This history document changes no authority status and authorizes no retirement or deletion."
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Documentation authority unification evidence",
    "anchor": "documentation-authority-unification-evidence",
    "githubAnchor": "documentation-authority-unification-evidence",
    "stableAnchor": "h-274b4a5b8c28",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "cc71c898b15c49e862592a081319bf3caebf624bb3bad7a2cb081da7774ee1da",
    "sample": "Documentation authority unification evidence",
    "sectionPayloadDigest": "a4d3dda62fe83e04f4c84f35328fd21ad15b18868e63e6c12c3f58bcc5cbba58",
    "followingBlockDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "identityFingerprint": "8683477efcf3aa47805701778eb8ea676750ee4e571d72fff405e5199e1f1373",
    "ancestry": [],
    "text": "# Documentation authority unification evidence",
    "sectionText": "# Documentation authority unification evidence\n\n```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nProvenance: plans/260925-documentation-authority-unification/ at SYNC e7393ea3c\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; historical evidence\nUse this when: Auditing documentation conservation and recorded decisions\nDo not use this for: Current platform authority or cutover authorization\nLast reviewed: Pending independent review\nRelated: plans/260925-documentation-authority-unification/plan.md\nSupersedes: None\nSuperseded by: None\n```\n\nAdded in candidate: Migration evidence index. The plan, decisions, reports, independent review receipts and known holds remain in plans/260925-documentation-authority-unification/. A dry-run snapshot will be generated by propose-doc-decisions.mjs --snapshot and checked with --verify in the package turn after documents are committed. No snapshot is claimed present yet. Phase 9 owns the sealed format and sealing. This history document changes no authority status and authorizes no retirement or deletion."
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_072aec4329b94c7ce2bf371f676bf7ec"
}
```

## Entry claim_234f45dac22000befcb8f285c1870c9d

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_234f45dac22000befcb8f285c1870c9d",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/history/documentation-authority-unification/README.md",
    "unitDigest": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "identityFingerprint": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "claimId": "claim_234f45dac22000befcb8f285c1870c9d",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "claimKind": "historical-context",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/history/documentation-authority-unification/README.md",
    "unitDigest": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "identityFingerprint": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "claimId": "claim_234f45dac22000befcb8f285c1870c9d",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "claimKind": "historical-context",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 19,
    "textDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "sample": "```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nPr",
    "identityFingerprint": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "ancestry": [
      "Documentation authority unification evidence"
    ],
    "text": "```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nProvenance: plans/260925-documentation-authority-unification/ at SYNC e7393ea3c\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; historical evidence\nUse this when: Auditing documentation conservation and recorded decisions\nDo not use this for: Current platform authority or cutover authorization\nLast reviewed: Pending independent review\nRelated: plans/260925-documentation-authority-unification/plan.md\nSupersedes: None\nSuperseded by: None\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 19,
    "textDigest": "efd0d06260c1cc0d4aa1591252511dc81eb00ff290d113ffc04dbc761b1fb7d3",
    "sample": "```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nPr",
    "identityFingerprint": "5a3aac0ee5b4f57e415b28ef38be86528509d038d372c28034fa77739432fb5b",
    "ancestry": [
      "Documentation authority unification evidence"
    ],
    "text": "```txt\nDocument type: History\nAudience: Maintainer and independent reviewer\nPurpose: Locate the migration evidence records\nDesign status: Candidate\nImplementation: Evidence only\nProvenance: plans/260925-documentation-authority-unification/ at SYNC e7393ea3c\nWriter type: Agent draft writer\nCanonical: No\nCanonical for: None; historical evidence\nUse this when: Auditing documentation conservation and recorded decisions\nDo not use this for: Current platform authority or cutover authorization\nLast reviewed: Pending independent review\nRelated: plans/260925-documentation-authority-unification/plan.md\nSupersedes: None\nSuperseded by: None\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_234f45dac22000befcb8f285c1870c9d"
}
```

## Entry claim_42ae1ad24d365094fc3df661bfeb4c36

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_42ae1ad24d365094fc3df661bfeb4c36",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/README.md",
    "unitDigest": "dbc0133ba50f1ced1fce8f5dce01697e81e54fdae2795e9fa4a99c24f5d58210",
    "identityFingerprint": "abb150c0699af5f92f5cb0d9058329da6e463e6d577ad735b1a2fec3501f4894",
    "claimId": "claim_42ae1ad24d365094fc3df661bfeb4c36",
    "sourceAnchor": "host-invocation-architecture",
    "unitKind": "heading",
    "sourceUnitDigest": "b84954bb5d2ce5925a6e1484b85bda0fbfd556ebd3b10f960299ceced19f7987",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "414dba658a5432875821880b4f584a877aa420dba1591a402b5662e690f05f38",
      "toUnitDigest": "dbc0133ba50f1ced1fce8f5dce01697e81e54fdae2795e9fa4a99c24f5d58210",
      "fromSourceUnitDigest": "8a893b0b2d44cbf2a9a30cf1ab71a037ad0e87079914eb7059fab08c7cacdd68",
      "toSourceUnitDigest": "b84954bb5d2ce5925a6e1484b85bda0fbfd556ebd3b10f960299ceced19f7987"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/README.md",
    "unitDigest": "dbc0133ba50f1ced1fce8f5dce01697e81e54fdae2795e9fa4a99c24f5d58210",
    "identityFingerprint": "abb150c0699af5f92f5cb0d9058329da6e463e6d577ad735b1a2fec3501f4894",
    "claimId": "claim_42ae1ad24d365094fc3df661bfeb4c36",
    "sourceAnchor": "host-invocation-architecture",
    "unitKind": "heading",
    "sourceUnitDigest": "b84954bb5d2ce5925a6e1484b85bda0fbfd556ebd3b10f960299ceced19f7987",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation Architecture",
    "anchor": "host-invocation-architecture",
    "githubAnchor": "host-invocation-architecture",
    "stableAnchor": "h-4521b5493cde",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b84954bb5d2ce5925a6e1484b85bda0fbfd556ebd3b10f960299ceced19f7987",
    "sample": "Host Invocation Architecture",
    "sectionPayloadDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "followingBlockDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "identityFingerprint": "abb150c0699af5f92f5cb0d9058329da6e463e6d577ad735b1a2fec3501f4894",
    "ancestry": [],
    "text": "# Host Invocation Architecture",
    "sectionText": "# Host Invocation Architecture\n\n```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus future host/component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard\nUse this when: Route readers through accepted and planned host-invocation architecture\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Host Invocation Architecture",
    "anchor": "host-invocation-architecture",
    "githubAnchor": "host-invocation-architecture",
    "stableAnchor": "h-4521b5493cde",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "b84954bb5d2ce5925a6e1484b85bda0fbfd556ebd3b10f960299ceced19f7987",
    "sample": "Host Invocation Architecture",
    "sectionPayloadDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "followingBlockDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "identityFingerprint": "abb150c0699af5f92f5cb0d9058329da6e463e6d577ad735b1a2fec3501f4894",
    "ancestry": [],
    "text": "# Host Invocation Architecture",
    "sectionText": "# Host Invocation Architecture\n\n```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus future host/component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard\nUse this when: Route readers through accepted and planned host-invocation architecture\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_42ae1ad24d365094fc3df661bfeb4c36"
}
```

## Entry claim_93d0d193f18927a1369ad3fd41db19da

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_93d0d193f18927a1369ad3fd41db19da",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/README.md",
    "unitDigest": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "identityFingerprint": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "claimId": "claim_93d0d193f18927a1369ad3fd41db19da",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "claimKind": "architecture",
    "status": "future",
    "origin": "added-since-aecdc30aad0ffd65a2956ff642c4be9410686ede"
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/README.md",
    "unitDigest": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "identityFingerprint": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "claimId": "claim_93d0d193f18927a1369ad3fd41db19da",
    "sourceAnchor": "unheaded-block-1",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 23,
    "textDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "sample": "```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation a",
    "identityFingerprint": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "ancestry": [
      "Host Invocation Architecture"
    ],
    "text": "```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus future host/component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard\nUse this when: Route readers through accepted and planned host-invocation architecture\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "unheaded-block",
    "anchor": "unheaded-block-1",
    "githubAnchor": "unheaded-block-1",
    "stableAnchor": "unheaded-block-1",
    "title": "Unheaded block 1",
    "startLine": 3,
    "endLine": 23,
    "textDigest": "c7b25a0d90167096cece47d6106a899d9551b470b1efeb09a6cc0f9307614b89",
    "sample": "```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation a",
    "identityFingerprint": "58e09f25f3fbe61ada15409cc3653fd8d5ee9e043e33f984664b525a460282c0",
    "ancestry": [
      "Host Invocation Architecture"
    ],
    "text": "```txt\nDocument type: Architecture index\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Route readers through accepted and planned host-invocation architecture\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/README.md\n- docs/platform/host-invocation-routing/vision.md\n- docs/platform/host-invocation-routing/verification/implementation-alignment.md\nImplementation: R1/R2/R3 implemented preview plus future host/component migrations\nProvenance: Promoted from docs/architect/host-invocation-routing/**\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Route readers through accepted and planned host-invocation architecture; authority follows transitional switchboard\nUse this when: Route readers through accepted and planned host-invocation architecture\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_93d0d193f18927a1369ad3fd41db19da"
}
```

## Entry claim_8a945d78b4d0ff19d2f42232b5b962bf

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_8a945d78b4d0ff19d2f42232b5b962bf",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "726ed05dc419537f96a390ce93c061a1205f8ce9137326447b903307be774609",
    "identityFingerprint": "e3c328d480e6cbfad6d5dc017327658b163f5d6107c6589cd12be78dd976bed9",
    "claimId": "claim_8a945d78b4d0ff19d2f42232b5b962bf",
    "sourceAnchor": "3-implementation-alignment",
    "unitKind": "heading",
    "sourceUnitDigest": "9b5cfe66e644edcefbf2fabde95a40583b35dc7499b4004f3fe450f527ca3c5f",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "8a29c9f3f11e64ce45e2a7427733032ac796f9ebe15ad4798c94a5532b7ae024",
      "toUnitDigest": "726ed05dc419537f96a390ce93c061a1205f8ce9137326447b903307be774609",
      "fromSourceUnitDigest": "59602390440895d71e4330cdbe7f9de76ab7a44c68cda818cc66c0ee7f589152",
      "toSourceUnitDigest": "9b5cfe66e644edcefbf2fabde95a40583b35dc7499b4004f3fe450f527ca3c5f"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "726ed05dc419537f96a390ce93c061a1205f8ce9137326447b903307be774609",
    "identityFingerprint": "e3c328d480e6cbfad6d5dc017327658b163f5d6107c6589cd12be78dd976bed9",
    "claimId": "claim_8a945d78b4d0ff19d2f42232b5b962bf",
    "sourceAnchor": "3-implementation-alignment",
    "unitKind": "heading",
    "sourceUnitDigest": "9b5cfe66e644edcefbf2fabde95a40583b35dc7499b4004f3fe450f527ca3c5f",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Implementation Alignment",
    "anchor": "3-implementation-alignment",
    "githubAnchor": "3-implementation-alignment",
    "stableAnchor": "h-f532f11e7d89",
    "startLine": 37,
    "endLine": 37,
    "textDigest": "9b5cfe66e644edcefbf2fabde95a40583b35dc7499b4004f3fe450f527ca3c5f",
    "sample": "3. Implementation Alignment",
    "sectionPayloadDigest": "ceb33bb84b1999bac2d5070546554ce9498ada3bc463f846eff2c0d2e8129473",
    "followingBlockDigest": "ceb33bb84b1999bac2d5070546554ce9498ada3bc463f846eff2c0d2e8129473",
    "identityFingerprint": "e3c328d480e6cbfad6d5dc017327658b163f5d6107c6589cd12be78dd976bed9",
    "ancestry": [
      "Architecture: External Provider Protocol"
    ],
    "text": "## 3. Implementation Alignment",
    "sectionText": "## 3. Implementation Alignment\n\n| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Process protocol framing is length-prefixed JSON-RPC over stdio. | `implemented preview` | [source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P3 conformance tests closed 2026-09-15. |\n| Static manifest discovery does not execute provider code. | `implemented preview` | [source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P1 discovery proof closed 2026-09-15. |\n| Marketplace, signatures, and production WASM are out of R2. | `planned` | [release boundaries](release-boundaries.md), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | Still future ecosystem decision -- unaffected by R2 closing. |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "3. Implementation Alignment",
    "anchor": "3-implementation-alignment",
    "githubAnchor": "3-implementation-alignment",
    "stableAnchor": "h-f532f11e7d89",
    "startLine": 37,
    "endLine": 37,
    "textDigest": "9b5cfe66e644edcefbf2fabde95a40583b35dc7499b4004f3fe450f527ca3c5f",
    "sample": "3. Implementation Alignment",
    "sectionPayloadDigest": "ceb33bb84b1999bac2d5070546554ce9498ada3bc463f846eff2c0d2e8129473",
    "followingBlockDigest": "ceb33bb84b1999bac2d5070546554ce9498ada3bc463f846eff2c0d2e8129473",
    "identityFingerprint": "e3c328d480e6cbfad6d5dc017327658b163f5d6107c6589cd12be78dd976bed9",
    "ancestry": [
      "Architecture: External Provider Protocol"
    ],
    "text": "## 3. Implementation Alignment",
    "sectionText": "## 3. Implementation Alignment\n\n| Design claim | Implementation status | Evidence | Gap / next action |\n| --- | --- | --- | --- |\n| Process protocol framing is length-prefixed JSON-RPC over stdio. | `implemented preview` | [source protocol §3](../../../architect/host-invocation-routing/external-provider-protocol.md#3-component-protocol), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P3 conformance tests closed 2026-09-15. |\n| Static manifest discovery does not execute provider code. | `implemented preview` | [source protocol §4](../../../architect/host-invocation-routing/external-provider-protocol.md#4-plugin-registry-linker), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | R2-P1 discovery proof closed 2026-09-15. |\n| Marketplace, signatures, and production WASM are out of R2. | `planned` | [release boundaries](release-boundaries.md), [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) | Still future ecosystem decision -- unaffected by R2 closing. |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_8a945d78b4d0ff19d2f42232b5b962bf"
}
```

## Entry claim_f1918740f86eeb4b8058f196404542ba

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_f1918740f86eeb4b8058f196404542ba",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "c314b35b43e1d21b70a6b0af52237350e08fa13a85e796e5886826340f902522",
    "identityFingerprint": "fe4f35064c4b4ba55588aae1033d649dae7d68ff548ad39126a92a6930df3d03",
    "claimId": "claim_f1918740f86eeb4b8058f196404542ba",
    "sourceAnchor": "4-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "92b45eada0775c0166589f84ebaa3ec4c83ebdb353ea163d7137a228de8b242c",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "b9a2dba946e34117657b9882a13e758aa35d2e2d7719f31313dc2ba46f2bb0e1",
      "toUnitDigest": "c314b35b43e1d21b70a6b0af52237350e08fa13a85e796e5886826340f902522",
      "fromSourceUnitDigest": "5702a4f25d6b6ce15b951f254eed54fe21d5ae98dfaaf9ea85da216cf0d48942",
      "toSourceUnitDigest": "92b45eada0775c0166589f84ebaa3ec4c83ebdb353ea163d7137a228de8b242c"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "c314b35b43e1d21b70a6b0af52237350e08fa13a85e796e5886826340f902522",
    "identityFingerprint": "fe4f35064c4b4ba55588aae1033d649dae7d68ff548ad39126a92a6930df3d03",
    "claimId": "claim_f1918740f86eeb4b8058f196404542ba",
    "sourceAnchor": "4-related-files",
    "unitKind": "heading",
    "sourceUnitDigest": "92b45eada0775c0166589f84ebaa3ec4c83ebdb353ea163d7137a228de8b242c",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-677196c7c323",
    "startLine": 45,
    "endLine": 45,
    "textDigest": "92b45eada0775c0166589f84ebaa3ec4c83ebdb353ea163d7137a228de8b242c",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "9b760da62f6e56cbda32d5425b967cae2156d66465ee367020fa77e919fd9578",
    "followingBlockDigest": "9b760da62f6e56cbda32d5425b967cae2156d66465ee367020fa77e919fd9578",
    "identityFingerprint": "fe4f35064c4b4ba55588aae1033d649dae7d68ff548ad39126a92a6930df3d03",
    "ancestry": [
      "Architecture: External Provider Protocol"
    ],
    "text": "## 4. Related Files",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n| --- | --- |\n| component protocol contract | [../contracts/component-protocol.md](../contracts/component-protocol.md) |\n| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |\n| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |\n| source protocol | [../../../architect/host-invocation-routing/external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) |"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 2,
    "title": "4. Related Files",
    "anchor": "4-related-files",
    "githubAnchor": "4-related-files",
    "stableAnchor": "h-677196c7c323",
    "startLine": 45,
    "endLine": 45,
    "textDigest": "92b45eada0775c0166589f84ebaa3ec4c83ebdb353ea163d7137a228de8b242c",
    "sample": "4. Related Files",
    "sectionPayloadDigest": "9b760da62f6e56cbda32d5425b967cae2156d66465ee367020fa77e919fd9578",
    "followingBlockDigest": "9b760da62f6e56cbda32d5425b967cae2156d66465ee367020fa77e919fd9578",
    "identityFingerprint": "fe4f35064c4b4ba55588aae1033d649dae7d68ff548ad39126a92a6930df3d03",
    "ancestry": [
      "Architecture: External Provider Protocol"
    ],
    "text": "## 4. Related Files",
    "sectionText": "## 4. Related Files\n\n| Relationship | File |\n| --- | --- |\n| component protocol contract | [../contracts/component-protocol.md](../contracts/component-protocol.md) |\n| manifest contract | [../contracts/external-provider-manifest.md](../contracts/external-provider-manifest.md) |\n| R2 proof | [../verification/r2-external-process-proof.md](../verification/r2-external-process-proof.md) |\n| source protocol | [../../../architect/host-invocation-routing/external-provider-protocol.md](../../../architect/host-invocation-routing/external-provider-protocol.md) |"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_f1918740f86eeb4b8058f196404542ba"
}
```

## Entry claim_eeff6182ca11adda0451a09f2f25d350

```json
{
  "kind": "retained-native-tuple-change",
  "claimId": "claim_eeff6182ca11adda0451a09f2f25d350",
  "authorSession": "codex-session:unit-run-1792090455209-159fbfed@2026-10-16",
  "before": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "b9ef9ae5667bb9905769a60ba1c0688b3b66811d6db2bafc6dbf9c9c548127d2",
    "identityFingerprint": "567cd122a1c507b87ba7b77900588e02d447f1f4f153d063a9bf15a9f7796b31",
    "claimId": "claim_eeff6182ca11adda0451a09f2f25d350",
    "sourceAnchor": "architecture-external-provider-protocol",
    "unitKind": "heading",
    "sourceUnitDigest": "bc8d9710671b98ab35667472e4d1a8488b41a249a771fb143a2a9b80dc8c0774",
    "claimKind": "architecture",
    "status": "future",
    "reviewStatus": "needs-review",
    "lineage": {
      "fromCommit": "aecdc30aad0ffd65a2956ff642c4be9410686ede",
      "fromUnitDigest": "b962e52ffaf52057a8ca2481fb2438c2e160229b6b624f67116d24cfe1917845",
      "toUnitDigest": "b9ef9ae5667bb9905769a60ba1c0688b3b66811d6db2bafc6dbf9c9c548127d2",
      "fromSourceUnitDigest": "c7fee5c805b345fab3fcc58438b39ea0fdf07c694e4f3508edf6364690830e70",
      "toSourceUnitDigest": "bc8d9710671b98ab35667472e4d1a8488b41a249a771fb143a2a9b80dc8c0774"
    }
  },
  "after": {
    "kind": "units",
    "sourcePath": "docs/platform/host-invocation-routing/architecture/external-provider-protocol.md",
    "unitDigest": "b9ef9ae5667bb9905769a60ba1c0688b3b66811d6db2bafc6dbf9c9c548127d2",
    "identityFingerprint": "567cd122a1c507b87ba7b77900588e02d447f1f4f153d063a9bf15a9f7796b31",
    "claimId": "claim_eeff6182ca11adda0451a09f2f25d350",
    "sourceAnchor": "architecture-external-provider-protocol",
    "unitKind": "heading",
    "sourceUnitDigest": "bc8d9710671b98ab35667472e4d1a8488b41a249a771fb143a2a9b80dc8c0774",
    "claimKind": "architecture",
    "status": "future"
  },
  "beforeWitness": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture: External Provider Protocol",
    "anchor": "architecture-external-provider-protocol",
    "githubAnchor": "architecture-external-provider-protocol",
    "stableAnchor": "h-c7ade9e34cea",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "bc8d9710671b98ab35667472e4d1a8488b41a249a771fb143a2a9b80dc8c0774",
    "sample": "Architecture: External Provider Protocol",
    "sectionPayloadDigest": "c730a1970eed7c487123682117cb4106d6ae90be4f872311d959d874696d1d17",
    "followingBlockDigest": "c730a1970eed7c487123682117cb4106d6ae90be4f872311d959d874696d1d17",
    "identityFingerprint": "567cd122a1c507b87ba7b77900588e02d447f1f4f153d063a9bf15a9f7796b31",
    "ancestry": [],
    "text": "# Architecture: External Provider Protocol",
    "sectionText": "# Architecture: External Provider Protocol\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\nImplementation: External process implemented preview; WASM/provider ecosystem planned\nProvenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the preview architecture for external process providers and future WASM/provider-ecosystem work; authority follows transitional switchboard\nUse this when: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "currentSource": {
    "unitKind": "heading",
    "level": 1,
    "title": "Architecture: External Provider Protocol",
    "anchor": "architecture-external-provider-protocol",
    "githubAnchor": "architecture-external-provider-protocol",
    "stableAnchor": "h-c7ade9e34cea",
    "startLine": 1,
    "endLine": 1,
    "textDigest": "bc8d9710671b98ab35667472e4d1a8488b41a249a771fb143a2a9b80dc8c0774",
    "sample": "Architecture: External Provider Protocol",
    "sectionPayloadDigest": "c730a1970eed7c487123682117cb4106d6ae90be4f872311d959d874696d1d17",
    "followingBlockDigest": "c730a1970eed7c487123682117cb4106d6ae90be4f872311d959d874696d1d17",
    "identityFingerprint": "567cd122a1c507b87ba7b77900588e02d447f1f4f153d063a9bf15a9f7796b31",
    "ancestry": [],
    "text": "# Architecture: External Provider Protocol",
    "sectionText": "# Architecture: External Provider Protocol\n\n```txt\nDocument type: Architecture\nAudience: Human reviewer, architect, maintainer, implementation agent\nPurpose: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDesign status: Draft\nCanonical: Yes, after review\nOwner: Host invocation\nLast reviewed: 2026-09-18\nRelated:\n- docs/platform/host-invocation-routing/contracts/component-protocol.md\n- docs/platform/host-invocation-routing/contracts/external-provider-manifest.md\n- docs/platform/host-invocation-routing/verification/r2-external-process-proof.md\nImplementation: External process implemented preview; WASM/provider ecosystem planned\nProvenance: Promoted from docs/architect/host-invocation-routing/external-provider-protocol.md\nWriter type: Original writer attribution not recorded; retained source provenance\nCanonical for: Candidate scope: Define the preview architecture for external process providers and future WASM/provider-ecosystem work; authority follows transitional switchboard\nUse this when: Define the preview architecture for external process providers and future WASM/provider-ecosystem work\nDo not use this for: Authority beyond the declared scope or implementation truth without the cited verification\nSupersedes: None; legacy sources remain in place during migration\nSuperseded by: None recorded\n```"
  },
  "classification": "Native accounting only; no truth verdict or approval; new candidate units remain candidate-unverified. Source decision changes are separately listed.",
  "deepRequired": false,
  "entryId": "claim_eeff6182ca11adda0451a09f2f25d350"
}
```

