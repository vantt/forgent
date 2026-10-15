# Bounded re-review: historical, part 1

Author session: `codex-session:27@2026-10-14`
Packaged by: `codex-session:unit-run-1792094246578-b2fbe39b@2026-10-16`
Content pin / SYNC: `345f15d95663260976200be66d1b9a6c648bcd6d`
Comparison base: `4a18f35ff5d6a9b7a07e955bd64418282c6a91b2`
Entries: **1**, maximum120 per request.

[Single request index](review-request-step10-index-345f15d95.md). [A36 exact lists](step10-sync345-A36.json). This is one combined bounded request set for all changes at345f15d95 and the current package. Historical before records are witnesses, not current dispositions. Source authors and current row authors remain exact. No producer seed, draw or verdict is selected.

Every submitted manual claim gets digest recomputation, anchor and shard/pack equality checks and an ordinary verdict with a `deep` or `mechanical` note. All unequal source/target digests, partial carries and historical claims are deep. All explicitly marked re-anchor, link, rationale, L10-22, tool, content and accounting deltas are deep. The independent reviewer seeds at least 69/460 Weak-exact/Judgment rows, records seed/sample IDs, and deep-reads the whole pack if >3% of deep rows need rework. Existing truth samples and checkpoint obligations remain unchanged.

Only decisions/historical entries request claim verdicts. Anchors, rationale proofs, native tuples and other accounting entries request item-specific review; they do not create additional claim approvals. Entries marked `changed-review-application-confirmation` preserve existing committed ordinary approvals and request confirmation of exact application; packaging does not revoke or approve them. New/changed pending rows carry no old approval. The runner's package commit supplies the new predecessor shard and request files; immutable document/helper bytes are pinned above.

## Entry claim_500d588a939fd6109cf102b8343484bb

```json
{
  "kind": "historical-row-delta",
  "file": "plans/260925-documentation-authority-unification/ledger/retired-unit-decisions.json",
  "claimId": "claim_500d588a939fd6109cf102b8343484bb",
  "authorSession": "codex-session:27@2026-10-14",
  "before": null,
  "currentDecision": {
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
  "currentContentCommit": "345f15d95663260976200be66d1b9a6c648bcd6d",
  "entryId": "claim_500d588a939fd6109cf102b8343484bb"
}
```

