# Nine historical AGENTS decisions — part 1

Author session: `codex-session:unit-run-1792089181794-89ae42db@2026-10-16`
Packaged by: `codex-session:unit-run-1792090455209-159fbfed@2026-10-16`
Content pin / SYNC: `19ca8de23908e161c34c91626e41041b7813167c`
Comparison base: `ab4d6274a9ae78c2613897432df726bfab32be52`
Entries: **9**, maximum 120 per request part.

[Single request index](review-request-step10-index-19ca8de23.md). This is one bounded re-review set of changes since `ab4d6274a`, replacing prior submission for changed entries only; unchanged matching ok verdicts remain accepted. This author header identifies this part's submitted author; per-row `authoredBy` and immutable historical author fields remain exact. No producer seed, draw, sample or verdict is selected.

Read [A36 mechanical/deep lists](step10-sync19-A36.json). Every submitted claim requires one ordinary verdict with exact shown source and target digests and a `deep` or `mechanical` note. Recompute full digests and anchors and compare current shard/pack equality for every row. Deep-review every unequal source/target row, every submitted partial carry, all seven labelled truth corrections, all historical AGENTS rows and other explicitly marked reworks. The reviewer selects and records a seed for at least 63/415 Weak-exact/Judgment rows (15%, minimum 10, all if fewer); >3% deep rework escalates to whole-pack deep review. A36 changes neither truth sampling nor checkpoint review. Non-claim entries receive item-specific accounting/content verdicts, not claim approvals. Existing independently ok unchanged full-file content is context only.

## Entry claim_b12ca1fdc3534fa31f9d7459c1be9ef7

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_b12ca1fdc3534fa31f9d7459c1be9ef7",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_b12ca1fdc3534fa31f9d7459c1be9ef7",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "dispatch-routing-work-to-a-executor",
    "sourceUnitDigest": "6f82f0a34b9d52aeb929fa62c63a49e558f0cf94e6552b59bca278097f14ea6d",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_b12ca1fdc3534fa31f9d7459c1be9ef7 records the historical native instruction identity AGENTS.md#dispatch-routing-work-to-a-executor (digest 6f82f0a34b9d52aeb929fa62c63a49e558f0cf94e6552b59bca278097f14ea6d). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "cce8adf1a5726f3086628fb47787d8fc62bafd874ab0a633aa97027c8ab15b95",
    "identityFingerprint": "41eb5eeb06fd7d09e712d39830543f29dff961a1dbaca85df9a8fe1e80d07c98",
    "claimId": "claim_b12ca1fdc3534fa31f9d7459c1be9ef7",
    "sourceAnchor": "dispatch-routing-work-to-a-executor",
    "unitKind": "heading",
    "sourceUnitDigest": "6f82f0a34b9d52aeb929fa62c63a49e558f0cf94e6552b59bca278097f14ea6d",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "dispatch-routing-work-to-an-executor",
    "dispositionRationale": "heading renamed, body carried to the successor unit",
    "dispositionEvidence": [
      "classification heading-renamed",
      "5df843bdb chore(docs): refresh the GitNexus symbol counts in agent instructions"
    ],
    "dispositionSource": "carry-forward-classification",
    "dispositionConfidence": "high",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": "120af6b3de826faec4e98cf72a92d8bcf1a21dff",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "Dispatch — routing work to a executor",
      "anchor": "dispatch-routing-work-to-a-executor",
      "githubAnchor": "dispatch-routing-work-to-a-executor",
      "stableAnchor": "h-f2453467eb3b",
      "startLine": 99,
      "endLine": 99,
      "textDigest": "6f82f0a34b9d52aeb929fa62c63a49e558f0cf94e6552b59bca278097f14ea6d",
      "sample": "Dispatch — routing work to a executor",
      "sectionPayloadDigest": "62c16e84f9cea236dfca759a074c003fe7657480894587525a56e18143e9535e",
      "followingBlockDigest": "818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1",
      "identityFingerprint": "41eb5eeb06fd7d09e712d39830543f29dff961a1dbaca85df9a8fe1e80d07c98",
      "ancestry": [
        "forgent"
      ],
      "text": "## Dispatch — routing work to a executor",
      "sectionText": "## Dispatch — routing work to a executor\n\n**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or compatibility alias `node src/runner/dispatch.mjs decide`) first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it runs `decide` for you and refuses the call when the answer comes back as anything other than `in-process`.\n\nFour ways to call `decide`, for four different situations:\n\n- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).\n- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.\n- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.\n- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name.\n\nAdd `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed.\n\nThree possible `mechanism` results, each needing a different response:\n\n- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **\"in-process\"** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.\n- **`\"out-of-process\"`** — run `fgos dispatch execute` (or compatibility alias `node src/runner/dispatch.mjs execute`). Never run the resolved command yourself through Bash: `execute` invokes the adapter and hands back the real result. (For a worktree-backed item, if passing explicit directory flags, pass `--cwd <worktree path>` and `--repo-root <main checkout path>` as two separate flags — never pass the main checkout as `--dir` alone). Log completed out-of-process runs via `fgos dispatch log` (or compatibility alias `node src/runner/dispatch.mjs log`).\n\nEvery result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.\n\nA skill that dispatches should not re-derive any of this. Point its reasoning step at the shared fragment `.agents/skills/_shared/executor-dispatch-fallback.md` (mirrored byte-identical at `plugins/fgOS/skills/_shared/`). `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_b12ca1fdc3534fa31f9d7459c1be9ef7"
}
```

## Entry claim_c3ef3a4ddc116883db10a70d55ba7bd5

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": {
    "sourcePath": "AGENTS.md",
    "unitDigest": "68bd036dcb1c088227e41c53d967140ee4ba34b3adfe2f3669044f4aa463dddd",
    "identityFingerprint": "6f882a01917473e188404cf5d22111820f6dbf1e80e8c69ba66d7a9eeb2464ef",
    "claimId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5",
    "sourceAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
    "unitKind": "heading",
    "sourceUnitDigest": "4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "d98a5c5e75e4529cd99dd9c8bce95a0032806d95",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
    "targetUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
    "shownTargetDigest": "53ac9f9ff1a0476287e5746059f0dd1681d73d704b010f7ef12b61b325d1d9fe",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:1@2026-10-08",
    "mainCommit": "f33612119f1158716b6797859598033cda6eb89c",
    "rationale": "Owner A13 supersede: main commit f33612119f1158716b6797859598033cda6eb89c renames the RUL11 heading from D-ADR0036 to D-ADR0054, explicitly retaining the superseded decision reference. This is instruction identity accounting only; no law or instruction text is edited.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-retired-unit.md",
    "reviewReportCommit": "f309594fd9b6074c696c8aa458e300f995c1713a",
    "reviewNote": "Supersede from AGENTS.md#rul11-...-d-adr0036-... to the heading renamed in f33612119. Old unit digest 4485eb54 and successor unit digest 52ff86d6 recomputed with the repository extractor at f33612119^ and f33612119; shown successor text hashes to the recorded shown digest. Every old clause survives in the successor, which adds only the owner-decided ADR0054 scope refinement; vocabulary supersede (target replaces the whole unit, possibly reworded) fits and no AGENTS.md text is touched."
  },
  "currentDecision": {
    "claimId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
    "sourceUnitDigest": "4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_c3ef3a4ddc116883db10a70d55ba7bd5 records the historical native instruction identity AGENTS.md#rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd (digest 4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "68bd036dcb1c088227e41c53d967140ee4ba34b3adfe2f3669044f4aa463dddd",
    "identityFingerprint": "6f882a01917473e188404cf5d22111820f6dbf1e80e8c69ba66d7a9eeb2464ef",
    "claimId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5",
    "sourceAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
    "unitKind": "heading",
    "sourceUnitDigest": "4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "d98a5c5e75e4529cd99dd9c8bce95a0032806d95",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
    "targetUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
    "shownTargetDigest": "53ac9f9ff1a0476287e5746059f0dd1681d73d704b010f7ef12b61b325d1d9fe",
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:1@2026-10-08",
    "mainCommit": "f33612119f1158716b6797859598033cda6eb89c",
    "rationale": "Owner A13 supersede: main commit f33612119f1158716b6797859598033cda6eb89c renames the RUL11 heading from D-ADR0036 to D-ADR0054, explicitly retaining the superseded decision reference. This is instruction identity accounting only; no law or instruction text is edited.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
    "reviewedAt": "2026-10-09",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-retired-unit.md",
    "reviewReportCommit": "f309594fd9b6074c696c8aa458e300f995c1713a",
    "reviewNote": "Supersede from AGENTS.md#rul11-...-d-adr0036-... to the heading renamed in f33612119. Old unit digest 4485eb54 and successor unit digest 52ff86d6 recomputed with the repository extractor at f33612119^ and f33612119; shown successor text hashes to the recorded shown digest. Every old clause survives in the successor, which adds only the owner-decided ADR0054 scope refinement; vocabulary supersede (target replaces the whole unit, possibly reworded) fits and no AGENTS.md text is touched."
  },
  "sourceWitness": {
    "commit": "b33876bce00d485d7ef238b784a154e6015fac4b",
    "unit": {
      "unitKind": "heading",
      "level": 2,
      "title": "RUL11 — tùm lum, không phải nặng (D-ADR0036, docs/specs/platform-foundations.md)",
      "anchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
      "githubAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
      "stableAnchor": "h-35301ec3051c",
      "startLine": 134,
      "endLine": 134,
      "textDigest": "4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940",
      "sample": "RUL11 — tùm lum, không phải nặng (D-ADR0036, docs/specs/platform-foundations.md)",
      "sectionPayloadDigest": "5eb78e222308c346428365daa4162e296f14cb784bfee5cb1ba2dbb6866a481a",
      "followingBlockDigest": "2921133d68f4ba5dfc0428f6e63c3eafc839091ef150a7d174a7ec0925bb185e",
      "identityFingerprint": "6f882a01917473e188404cf5d22111820f6dbf1e80e8c69ba66d7a9eeb2464ef",
      "ancestry": [
        "forgent"
      ],
      "text": "## RUL11 — tùm lum, không phải nặng (D-ADR0036, docs/specs/platform-foundations.md)",
      "sectionText": "## RUL11 — tùm lum, không phải nặng (D-ADR0036, docs/specs/platform-foundations.md)\n\nViệc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của\ntình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum, gom lại — gom\ntới khi hết; quy mô không bao giờ là lý do miễn trừ. Đích của mọi lần gom\nlà một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến\nhình dễ, không chắp vá.\n\nkhong phai no nang ma no tum lum"
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "priorDecisionHistory": [
    {
      "sourcePath": "AGENTS.md",
      "unitDigest": "68bd036dcb1c088227e41c53d967140ee4ba34b3adfe2f3669044f4aa463dddd",
      "identityFingerprint": "6f882a01917473e188404cf5d22111820f6dbf1e80e8c69ba66d7a9eeb2464ef",
      "claimId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5",
      "sourceAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd",
      "unitKind": "heading",
      "sourceUnitDigest": "4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940",
      "claimKind": "unclassified",
      "status": "removed-pending-disposition",
      "priorStatus": "current",
      "retiredAtCommit": "d98a5c5e75e4529cd99dd9c8bce95a0032806d95",
      "retiredReason": "no counterpart in current source",
      "disposition": "supersede",
      "targetOwner": "AGENTS.md",
      "targetAnchor": "rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd",
      "targetUnitDigest": "52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2",
      "shownTargetDigest": "53ac9f9ff1a0476287e5746059f0dd1681d73d704b010f7ef12b61b325d1d9fe",
      "reviewStatus": "reviewed",
      "authoredBy": "codex-session:1@2026-10-08",
      "mainCommit": "f33612119f1158716b6797859598033cda6eb89c",
      "rationale": "Owner A13 supersede: main commit f33612119f1158716b6797859598033cda6eb89c renames the RUL11 heading from D-ADR0036 to D-ADR0054, explicitly retaining the superseded decision reference. This is instruction identity accounting only; no law or instruction text is edited.",
      "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-09",
      "reviewedAt": "2026-10-09",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2final-retired-unit.md",
      "reviewReportCommit": "f309594fd9b6074c696c8aa458e300f995c1713a",
      "reviewNote": "Supersede from AGENTS.md#rul11-...-d-adr0036-... to the heading renamed in f33612119. Old unit digest 4485eb54 and successor unit digest 52ff86d6 recomputed with the repository extractor at f33612119^ and f33612119; shown successor text hashes to the recorded shown digest. Every old clause survives in the successor, which adds only the owner-decided ADR0054 scope refinement; vocabulary supersede (target replaces the whole unit, possibly reworded) fits and no AGENTS.md text is touched."
    }
  ],
  "priorDecisionHistoryScope": "Historical reviewed predecessor disposition, context only. L10-16 submits the separately authored pending reclassification; the old review approves no current reclassification. Match full source/target/authorship tuple, not first same-ID record.",
  "entryId": "claim_c3ef3a4ddc116883db10a70d55ba7bd5"
}
```

## Entry claim_21f66ad1c973daaf6c31abf50b6c8cc3

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_21f66ad1c973daaf6c31abf50b6c8cc3",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_21f66ad1c973daaf6c31abf50b6c8cc3",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "starting-the-herdr-gateway-one-door-never-a-raw-process",
    "sourceUnitDigest": "43d98a2d84170eee45f9c337cd6700c7af2e32965c415e3fb26cf3c3ebe14bd7",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_21f66ad1c973daaf6c31abf50b6c8cc3 records the historical native instruction identity AGENTS.md#starting-the-herdr-gateway-one-door-never-a-raw-process (digest 43d98a2d84170eee45f9c337cd6700c7af2e32965c415e3fb26cf3c3ebe14bd7). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "f43c2531dd9881bb1545c5e517a3fe4f113768c78d01e0e4ace54cc91e6567c8",
    "identityFingerprint": "5a48e513a739fdabe33dc762242cfd1c44c8d10b8884ec7ece94fd92fe918c9f",
    "claimId": "claim_21f66ad1c973daaf6c31abf50b6c8cc3",
    "sourceAnchor": "starting-the-herdr-gateway-one-door-never-a-raw-process",
    "unitKind": "heading",
    "sourceUnitDigest": "43d98a2d84170eee45f9c337cd6700c7af2e32965c415e3fb26cf3c3ebe14bd7",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "starting-the-fgos-gateway-one-door-never-a-raw-process",
    "dispositionRationale": "heading renamed, body carried to the successor unit",
    "dispositionEvidence": [
      "classification heading-renamed",
      "5df843bdb chore(docs): refresh the GitNexus symbol counts in agent instructions"
    ],
    "dispositionSource": "carry-forward-classification",
    "dispositionConfidence": "high",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": null,
    "unit": null,
    "limitation": "Historical witness unavailable; not reconstructed from numbered anchor. Retain explicit evidence limitation from prior review."
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_21f66ad1c973daaf6c31abf50b6c8cc3"
}
```

## Entry claim_806342ec2a1c5fd1d0b6d82ebd54d4e0

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_806342ec2a1c5fd1d0b6d82ebd54d4e0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_806342ec2a1c5fd1d0b6d82ebd54d4e0",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-18",
    "sourceUnitDigest": "818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_806342ec2a1c5fd1d0b6d82ebd54d4e0 records the historical native instruction identity AGENTS.md#unheaded-block-18 (digest 818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "fff631dbd3ba1cbe17bab30c43da8435675f6ffa06ce1b7c547f7de6ee65d315",
    "identityFingerprint": "fff631dbd3ba1cbe17bab30c43da8435675f6ffa06ce1b7c547f7de6ee65d315",
    "claimId": "claim_806342ec2a1c5fd1d0b6d82ebd54d4e0",
    "sourceAnchor": "unheaded-block-18",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "delete-as-obsolete",
    "targetOwner": null,
    "targetAnchor": null,
    "dispositionRationale": "dispatch paragraph reworded when decide moved onto bind(); the PreToolUse hook now delegates to bind()",
    "dispositionEvidence": [
      "cfd670c43 feat(execution): Wave D complete - ... engine/decide on bind"
    ],
    "dispositionSource": "commit-history-review",
    "dispositionConfidence": "reviewed",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": "120af6b3de826faec4e98cf72a92d8bcf1a21dff",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-18",
      "githubAnchor": "unheaded-block-18",
      "stableAnchor": "unheaded-block-18",
      "title": "Unheaded block 18",
      "startLine": 101,
      "endLine": 101,
      "textDigest": "818ed72de3118b43bbb9682e5b2231a74894d6001771d6375d08fcb626cd99b1",
      "sample": "**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or",
      "identityFingerprint": "fff631dbd3ba1cbe17bab30c43da8435675f6ffa06ce1b7c547f7de6ee65d315",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to a executor"
      ],
      "text": "**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or compatibility alias `node src/runner/dispatch.mjs decide`) first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it runs `decide` for you and refuses the call when the answer comes back as anything other than `in-process`."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_806342ec2a1c5fd1d0b6d82ebd54d4e0"
}
```

## Entry claim_7a4fef4aa802940385df7cd8fc1bf6f0

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_7a4fef4aa802940385df7cd8fc1bf6f0",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_7a4fef4aa802940385df7cd8fc1bf6f0",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-23",
    "sourceUnitDigest": "367c95ab6574855f85ab31608ca9438bddb2bef0839cfc45ff4bf2640c6ea2f4",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_7a4fef4aa802940385df7cd8fc1bf6f0 records the historical native instruction identity AGENTS.md#unheaded-block-23 (digest 367c95ab6574855f85ab31608ca9438bddb2bef0839cfc45ff4bf2640c6ea2f4). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "628b53a9189e3d71858125922e0fa57a176ff0d789d8c482f558b926fff9f3ef",
    "identityFingerprint": "628b53a9189e3d71858125922e0fa57a176ff0d789d8c482f558b926fff9f3ef",
    "claimId": "claim_7a4fef4aa802940385df7cd8fc1bf6f0",
    "sourceAnchor": "unheaded-block-23",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "367c95ab6574855f85ab31608ca9438bddb2bef0839cfc45ff4bf2640c6ea2f4",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "dispatch-routing-work-to-an-executor",
    "dispositionRationale": "unit reworked; successor unit needs content review",
    "dispositionEvidence": [
      "classification real-edit",
      "5df843bdb chore(docs): refresh the GitNexus symbol counts in agent instructions"
    ],
    "dispositionSource": "carry-forward-classification",
    "dispositionConfidence": "needs-owner-review",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": "120af6b3de826faec4e98cf72a92d8bcf1a21dff",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-23",
      "githubAnchor": "unheaded-block-23",
      "stableAnchor": "unheaded-block-23",
      "title": "Unheaded block 23",
      "startLine": 114,
      "endLine": 116,
      "textDigest": "367c95ab6574855f85ab31608ca9438bddb2bef0839cfc45ff4bf2640c6ea2f4",
      "sample": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **\"in-process\"** — call it yourself, with your own live capability: pass the",
      "identityFingerprint": "628b53a9189e3d71858125922e0fa57a176ff0d789d8c482f558b926fff9f3ef",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to a executor"
      ],
      "text": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **\"in-process\"** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.\n- **`\"out-of-process\"`** — run `fgos dispatch execute` (or compatibility alias `node src/runner/dispatch.mjs execute`). Never run the resolved command yourself through Bash: `execute` invokes the adapter and hands back the real result. (For a worktree-backed item, if passing explicit directory flags, pass `--cwd <worktree path>` and `--repo-root <main checkout path>` as two separate flags — never pass the main checkout as `--dir` alone). Log completed out-of-process runs via `fgos dispatch log` (or compatibility alias `node src/runner/dispatch.mjs log`)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_7a4fef4aa802940385df7cd8fc1bf6f0"
}
```

## Entry claim_7b209ce1498d7ab5ddafe25d203e5852

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_7b209ce1498d7ab5ddafe25d203e5852",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_7b209ce1498d7ab5ddafe25d203e5852",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-24",
    "sourceUnitDigest": "bd95c2c1daeda69523d203dcefc33f2d50d81a401087e921c058a7d004f5a02a",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_7b209ce1498d7ab5ddafe25d203e5852 records the historical native instruction identity AGENTS.md#unheaded-block-24 (digest bd95c2c1daeda69523d203dcefc33f2d50d81a401087e921c058a7d004f5a02a). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "3b977a253a8d9efbe838cf0d32928b58f626497c71928dfdb7e1ccf748df0562",
    "identityFingerprint": "3b977a253a8d9efbe838cf0d32928b58f626497c71928dfdb7e1ccf748df0562",
    "claimId": "claim_7b209ce1498d7ab5ddafe25d203e5852",
    "sourceAnchor": "unheaded-block-24",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "bd95c2c1daeda69523d203dcefc33f2d50d81a401087e921c058a7d004f5a02a",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "dispatch-routing-work-to-an-executor",
    "dispositionRationale": "content unchanged, unit boundary or position moved within the same file",
    "dispositionEvidence": [
      "classification renumbered-only",
      "5df843bdb chore(docs): refresh the GitNexus symbol counts in agent instructions"
    ],
    "dispositionSource": "carry-forward-classification",
    "dispositionConfidence": "high",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": "120af6b3de826faec4e98cf72a92d8bcf1a21dff",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-24",
      "githubAnchor": "unheaded-block-24",
      "stableAnchor": "unheaded-block-24",
      "title": "Unheaded block 24",
      "startLine": 118,
      "endLine": 118,
      "textDigest": "bd95c2c1daeda69523d203dcefc33f2d50d81a401087e921c058a7d004f5a02a",
      "sample": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is ",
      "identityFingerprint": "3b977a253a8d9efbe838cf0d32928b58f626497c71928dfdb7e1ccf748df0562",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to a executor"
      ],
      "text": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_7b209ce1498d7ab5ddafe25d203e5852"
}
```

## Entry claim_30f4d7e2306cb4ecdad78086848d139f

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_30f4d7e2306cb4ecdad78086848d139f",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_30f4d7e2306cb4ecdad78086848d139f",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-26",
    "sourceUnitDigest": "52b2e04e2be1548ef98b8c68b27ee09c3cef2b516ce1cdd6925362d81dd2a306",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_30f4d7e2306cb4ecdad78086848d139f records the historical native instruction identity AGENTS.md#unheaded-block-26 (digest 52b2e04e2be1548ef98b8c68b27ee09c3cef2b516ce1cdd6925362d81dd2a306). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "7ef38edf1fed459fc06d4f8e7bb0c26207706dbe2c4afe1b2f8f8819c1d7326b",
    "identityFingerprint": "7ef38edf1fed459fc06d4f8e7bb0c26207706dbe2c4afe1b2f8f8819c1d7326b",
    "claimId": "claim_30f4d7e2306cb4ecdad78086848d139f",
    "sourceAnchor": "unheaded-block-26",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "52b2e04e2be1548ef98b8c68b27ee09c3cef2b516ce1cdd6925362d81dd2a306",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "332effba6d5a904c9b6f458228c15f75d336c866",
    "retiredReason": "no counterpart in current source",
    "disposition": "supersede",
    "targetOwner": "AGENTS.md",
    "targetAnchor": "unheaded-block-14",
    "dispositionRationale": "paragraph rewritten by the main-side edit that made the Rust host the standard door; the successor block carries the legacy-node payload rule",
    "dispositionEvidence": [
      "git diff of the in-scope tree between the last two registry commits",
      "f053de033 feat(hygiene): unify skill renders, dev runtime and root guard"
    ],
    "dispositionSource": "carry-forward-classification",
    "dispositionConfidence": "needs-owner-review",
    "dispositionReviewer": "lead delegate 2026-10-07"
  },
  "sourceWitness": {
    "commit": "5df843bdb90527b326974a71cc9d288fac4393bc",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-26",
      "githubAnchor": "unheaded-block-26",
      "stableAnchor": "unheaded-block-26",
      "title": "Unheaded block 26",
      "startLine": 129,
      "endLine": 130,
      "textDigest": "52b2e04e2be1548ef98b8c68b27ee09c3cef2b516ce1cdd6925362d81dd2a306",
      "sample": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is ",
      "identityFingerprint": "7ef38edf1fed459fc06d4f8e7bb0c26207706dbe2c4afe1b2f8f8819c1d7326b",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.\nA skill that dispatches should not re-derive any of this. Point its reasoning step at the shared fragment `.agents/skills/_shared/executor-dispatch-fallback.md` (mirrored byte-identical at `plugins/fgOS/skills/_shared/`). `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_30f4d7e2306cb4ecdad78086848d139f"
}
```

## Entry claim_500d588a939fd6109cf102b8343484bb

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_500d588a939fd6109cf102b8343484bb",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_500d588a939fd6109cf102b8343484bb",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-28",
    "sourceUnitDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_500d588a939fd6109cf102b8343484bb records the historical native instruction identity AGENTS.md#unheaded-block-28 (digest 45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "identityFingerprint": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
    "claimId": "claim_500d588a939fd6109cf102b8343484bb",
    "sourceAnchor": "unheaded-block-28",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "retiredReason": "no counterpart in current source",
    "disposition": "retain-as-evidence",
    "targetOwner": null,
    "targetAnchor": null,
    "reviewStatus": "reviewed",
    "authoredBy": "codex-session:27@2026-10-14",
    "rationale": "A31 upstream removal: retain the exact prior unit as immutable git evidence at c18020da3. Full prior/current diff and informational successor shown for independent conservation review; no claim of full current carry or approval carry.",
    "reviewNote": "deep: AGENTS.md dispatch bullet list: the out-of-process bullet was rewritten upstream (dispatch execute to fgos run); 2 of 3 lines verbatim; old unit retained as git evidence and the missing line is in the main hunk",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-14",
    "reviewedAt": "2026-10-15",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-261015-0044-boundary-sync-resume-02.md",
    "reviewMode": "ordinary",
    "reviewReportCommit": "68b95dbd83adf817d42571d2c0b2961be75d78d2"
  },
  "sourceWitness": {
    "commit": "fba5d042675c4348fb46fb39464e495517ed3eb7",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-30",
      "githubAnchor": "unheaded-block-30",
      "stableAnchor": "unheaded-block-30",
      "title": "Unheaded block 30",
      "startLine": 168,
      "endLine": 170,
      "textDigest": "45945b0c37c8cca3414b5e11c8b0dba3c210d8dcf30d34fc26a1d794e848801e",
      "sample": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **`\"in-process\"`** — call it yourself, with your own live capability: pass t",
      "identityFingerprint": "875b03c309d71842d09c8647b525586e9c79e529c46804487926d99f46550b89",
      "ancestry": [
        "forgent",
        "Dispatch — routing work to an executor"
      ],
      "text": "- **`\"unavailable\"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.\n- **`\"in-process\"`** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.\n- **`\"out-of-process\"`** — run `fgos dispatch execute` (or compatibility alias `node src/runner/dispatch.mjs execute`). Never run the resolved command yourself through Bash: `execute` invokes the adapter and hands back the real result. (For a worktree-backed item, if passing explicit directory flags, pass `--cwd <worktree path>` and `--repo-root <main checkout path>` as two separate flags — never pass the main checkout as `--dir` alone). Log completed out-of-process runs via `fgos dispatch log` (or compatibility alias `node src/runner/dispatch.mjs log`)."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_500d588a939fd6109cf102b8343484bb"
}
```

## Entry claim_dea64a2d50bdbadf3b2ebeceec84fa5d

```json
{
  "kind": "pending-historical-decision",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "collection": "rows",
  "claimId": "claim_dea64a2d50bdbadf3b2ebeceec84fa5d",
  "authorSession": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
  "before": null,
  "currentDecision": {
    "claimId": "claim_dea64a2d50bdbadf3b2ebeceec84fa5d",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-34",
    "sourceUnitDigest": "ba8b02c21fe45af0ba20b280ef182065e87c3410dae024d6ede3983845990c9c",
    "claimKind": "procedure",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-16 / L10-3: claim_dea64a2d50bdbadf3b2ebeceec84fa5d records the historical native instruction identity AGENTS.md#unheaded-block-34 (digest ba8b02c21fe45af0ba20b280ef182065e87c3410dae024d6ede3983845990c9c). The root instruction file remains the always-loaded owner outside platform documentation authority. The historical anchor names this predecessor, not a claim that its old text is the current unit at the same numbered anchor. Retain native predecessor/successor identities without creating a platform copy, target owner or truth certificate. Reclassify-out-of-platform-scope pending independent review; no historical approval is carried. This is consistent with gap claim_91884eb1 (same ba8b02c2 text digest): both historical identities classify the instruction outside platform authority. The old registry delete-as-obsolete disposition is historical bookkeeping, not authority to delete root instruction text; no registry mutation this turn.",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792089181794-89ae42db@2026-10-16",
    "reviewNote": "Pending bounded independent re-review after Step 10 author corrections; no approval carried."
  },
  "native": {
    "kind": "retiredUnits",
    "sourcePath": "AGENTS.md",
    "unitDigest": "cddef0dd1bb74259e146ddf6e6fdc85320ba508b7e8544c4393fc50d4058340e",
    "identityFingerprint": "cddef0dd1bb74259e146ddf6e6fdc85320ba508b7e8544c4393fc50d4058340e",
    "claimId": "claim_dea64a2d50bdbadf3b2ebeceec84fa5d",
    "sourceAnchor": "unheaded-block-34",
    "unitKind": "unheaded-block",
    "sourceUnitDigest": "ba8b02c21fe45af0ba20b280ef182065e87c3410dae024d6ede3983845990c9c",
    "claimKind": "unclassified",
    "status": "removed-pending-disposition",
    "priorStatus": "current",
    "retiredAtCommit": "79530b22149de0decb4dfd389d2f018e8ed9d8e3",
    "retiredReason": "no counterpart in current source",
    "disposition": "delete-as-obsolete",
    "targetOwner": null,
    "targetAnchor": null,
    "dispositionRationale": "generated GitNexus index statistics line; the counts are refreshed on every analyze run",
    "dispositionEvidence": [
      "120af6b3d feat(observe): migrate Observe component to Rust native",
      "5df843bdb chore(docs): refresh the GitNexus symbol counts"
    ],
    "dispositionSource": "commit-history-review",
    "dispositionConfidence": "reviewed",
    "dispositionReviewer": "lead 2026-10-06"
  },
  "sourceWitness": {
    "commit": "f4a81c7ea2bf1b2b62bf38ad66dbbde2c6791704",
    "unit": {
      "unitKind": "unheaded-block",
      "anchor": "unheaded-block-34",
      "githubAnchor": "unheaded-block-34",
      "stableAnchor": "unheaded-block-34",
      "title": "Unheaded block 34",
      "startLine": 159,
      "endLine": 159,
      "textDigest": "ba8b02c21fe45af0ba20b280ef182065e87c3410dae024d6ede3983845990c9c",
      "sample": "This project is indexed by GitNexus as **forgent** (37092 symbols, 51501 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navi",
      "identityFingerprint": "cddef0dd1bb74259e146ddf6e6fdc85320ba508b7e8544c4393fc50d4058340e",
      "ancestry": [
        "GitNexus — Code Intelligence"
      ],
      "text": "This project is indexed by GitNexus as **forgent** (37092 symbols, 51501 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely."
    }
  },
  "mechanicalRequired": true,
  "deepRequired": true,
  "notLiveAnchorClaim": true,
  "entryId": "claim_dea64a2d50bdbadf3b2ebeceec84fa5d"
}
```

