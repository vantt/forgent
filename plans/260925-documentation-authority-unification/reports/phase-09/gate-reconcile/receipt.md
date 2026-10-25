# Gate register catch-up

Current committed inputs: `a734c3f47ff6eb39d80ba1c16e6dd88d44cc2d53`. Historical input layers and original occurrence accounting remain in `receipt.json` and `sources.json`; `currentCatchUp` fingerprints the new layer. Reused the sole generator, owning G0 join, fchain replay engine and verifier/control seams. Impact-analysis: degraded/unqueried under the no-CLI/no-MCP boundary.

## Result

Local preparation is met-local: G0 1,929/1,929 approved, G2 judgments reviewed, G6 787 premises settled and G9 158 decisions settled. Send the owner packet at met-local before approval, lease and F (L13-6). G5 owner acceptance, G8 publication, G9 backlog intent and G4/G10/G11 external dependencies remain open. W32 reviewed the prior catch-up (18 APPROVE / 3 REWORK); its findings are addressed by the w33/w35/w37 review chain and Lead mechanical fix, not erased. This register update still needs independent records review before the packet; no F, release, lease, publication, cutover or Land approval is inferred.

| Gate | Turn-start status | Current status | Open boundary |
|---|---|---|---|
| G0 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G1 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G2 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G3 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G4 | external | external | F duties; 0 owner items; 1 external items |
| G5 | met-local | met-local | F duties; 1 owner items; 0 external items |
| G6 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G7 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G8 | met-local | met-local | F duties; 1 owner items; 0 external items |
| G9 | met-local | met-local | F duties; 1 owner items; 1 external items |
| G10 | external | external | F duties; 0 owner items; 1 external items |
| G11 | external | external | F duties; 0 owner items; 2 external items |

## Evidence decisions

- G0: committed per-row verdicts W24–W30 and a fresh join prove 1,929/1,929; no aggregate approval substitutes for row records. `g0rework/final-pin-duties.json` owns the 134 conditional overlays, rebased relocation id/hash and actual-F delta review.
- G2: the 187 judgments keep the committed W20/W21 review scope. The 4 citation patches and shared-pin G2/G6 verification remain F duties.
- G6: W23 reviews all 787; W28 approves the 85 fixes and confirms prior approvals unchanged. The w33 (4 APPROVE / 1 REWORK), w35 (7/3) and w37 (10/1) chain covers link retargets and the whole-population L13-28 guard. Row 125 is approved in w35; w35 rework is approved in w37; its duplicate-id REWORK is a Lead mechanical fix in edf816838, verified by owning compose exit 0 and a rejecting duplicate-id probe (exit 1). No open review REWORK is hidden as met-local. The 137 current-passage-unbound rows and changed shard-2 patch delta reviews remain at F.
- G9: all 158 decisions, not 33. W25 is 158 APPROVE / 12 REWORK across entry and cross-cutting scopes, not blanket approval. L13-23/24 plus W28 settle the proposals/overlaps with unchanged decisions. WORK and registry exports remain external; two backlog-intent choices remain owner-owned.
- F composition: every prepared source is in fchain/manifest.json, including rebased-patches.json and link-retargets.json. Current replay exits 0, whole-population linkGuard=0, Related included. Guard 3 must agree at F (including 398 literal-code occurrences and 44 Related #anchor operands that the current product reader misreads); both must report 0. This is preparation only, not a separate retarget pass.
- Ownership: w33-ownership-audit independently records 5 APPROVE / 0 REWORK, covering 73e89962e, 98d71bef2, ca3179b3c and c3882df26 (plus existing accounting). Rebind status now cites that review; edges are byte-identical. L13-27 routes drift judgment through rebind.py --check. The committed Lead brief reports audit-report.py ok at 4a4fefbe8 after pair accounting; no committed full audit stdout was found. The register labels this reported-ok, with pinned script/manifest hashes, not an independently reproduced audit. The forbidden audit was never run.
- G4 is external: local repairs are complete, but Git/HARDEN review is not accepted. G5 still needs owner acceptance of exactly 8 restatements. G8 creates the local archive ref only at F before G10; publication is owner-gated. G10/G11 remain external.

## F-window size

```json
{
  "sourcePin": "a734c3f47ff6eb39d80ba1c16e6dd88d44cc2d53",
  "meaning": "Source-derived sizing witnesses, not sums of independent populations or a wall-time estimate. Re-enumerate after F import; stop instead of widening the approved lease budget.",
  "g6UnboundRows": {
    "count": 137,
    "source": "preserve-premise/proof.json",
    "selection": "rows[result=park-current-passage-unbound]"
  },
  "g6BeforeF": {
    "authoredJudgments": 787,
    "reviewPending": 0,
    "dispositions": {
      "preserve-confirmed": 465,
      "repoint": 158,
      "successor-bound": 164
    },
    "ownedPlacementDecisions": 0,
    "source": "preserve-premise/park-judgments/shard-{1,2,3}.json",
    "insideFWindow": false
  },
  "g6Composition": {
    "datedNotes": 163,
    "existingRepointProposals": 6,
    "parkJudgmentRepoints": 158,
    "source": "preserve-premise/proof.json and park-judgments/shard-{1,2,3}.json"
  },
  "postApplyBindings": {
    "distinct": 407,
    "assertions": 556,
    "source": "composition/w9-unresolved-bindings.json",
    "historicalWitness": true
  },
  "glosses": {
    "mainOwnedSites": 130,
    "mainOwnedPassages": 95,
    "source": "composition/w8-citation-glosses.json",
    "historicalWitness": true
  },
  "deltaReviewsPerGate": {
    "G0": {
      "effectiveBindingsAtSourcePin": 1929,
      "frozenChangedBindings": 257,
      "laterEffectiveDeltaCount": null,
      "source": "gate-reconcile/current-proofs.json",
      "rule": "Current verdict file is complete; actual F rebindings require fresh matching delta verdicts, including decision-field changes."
    },
    "G2": {
      "originalSites": 1126,
      "unappliedRetargets": 4,
      "deltaCountAtF": null,
      "source": "census-join/locator-proof.json and pointer-patches.json",
      "rule": "Rescan/join and review post-pin literal/dynamic delta, including the prepared retarget chain."
    },
    "G6": {
      "unboundRows": 137,
      "deltaCountAtF": null,
      "source": "preserve-premise/proof.json",
      "rule": "Review newly bound 137 rows plus changed evidence only; no 787-judgment batch inside F."
    },
    "G7": {
      "totalSpecs": 423,
      "deferredSpecs": 36,
      "deltaCountAtF": null,
      "source": "review-batches.json",
      "rule": "Review 36 deferred specs and changed spec/predecessor digests; count after F sweep."
    },
    "G9": {
      "localDependencies": 158,
      "deltaCountAtF": null,
      "source": "g9/phase9-decisions.json",
      "rule": "All 158 decisions settled before F; current source delta and composed bodies reviewed at actual F."
    }
  },
  "fComposition": {
    "source": "fchain/check.py composed replay (gate-reconcile/current-proofs.json); source inventories: fchain/manifest.json, rebased-patches.json and link-retargets.json",
    "status": "met-local",
    "manifestSources": 20,
    "baseChainFiles": 465,
    "basePatchSteps": 497,
    "additionalExecutedPatches": 229,
    "composedFiles": 595,
    "rebasedEntries": 5,
    "linkRetargetPatches": 88,
    "linkRetargetRows": 377,
    "linkIntoMoveSet": 0,
    "linkGuard": 0,
    "rule": "Counts are witnesses, not additive populations; replay once through the single door at F."
  }
}
```

## Outside-plan follow-ups

- Work-state Data Dictionary row 12 says add defaults to executing, contrary to RUL18 and bin/fgos.mjs (discovery). Source: `reviews/w29-g0-verdicts-b10.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- RUL59 declares intent retired but still describes edit --intent and intent write errors. Source: `reviews/w30-g0-verdicts-b11.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- About 15 old Vietnamese heading titles remain quoted after the headings were renamed. Source: `reviews/w29-g0-verdicts-b10.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- 36 rationale/reason strings in s2/s6/s14 start with whitespace; out-of-scope ledger cleanup. Source: `reviews/w30-g0-verdicts-b11.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).

## Commands and exits

Read-only inventory commands (`git status --short`, `pwd`, `ls`, `git rev-parse HEAD`, `git log` including -S history, `git diff --name-only/--stat`, `git show` including --stat, `git ls-tree`, `rg`) exited 0; none mutated Git. Source reads and full JSON review parsing/fingerprinting are recorded by currentCatchUp.inputs/reviewInventory. No product tests, CLI, native addons, pair accounting, lease/ref or other records were written.

| Command | Exit | Evidence |
|---|---:|---|
| python3 -B P/g0join/join.py --pin a734c3f47ff6eb39d80ba1c16e6dd88d44cc2d53 | 0 | current-proofs.json: argv, counts, stdout hash, stderr |
| python3 -B P/fchain/check.py --pin a734c3f47ff6eb39d80ba1c16e6dd88d44cc2d53 (compose API, output-only adapter) | 0 | current-proofs.json: full engine, sources, counts, report hash; no out-of-scope check.json write |
| python3 -B P/gate-reconcile/reconcile.py (twice) | 0 / 0 | deterministic generated register/receipts/sources/current-proofs |
| python3 -B P/gate-reconcile/verify.py | 0 | verification.json |
| python3 -B P/gate-reconcile/controls.py | 0 | controls.json: all existing controls retained, plus current review/guard/status regressions |
| python3 -B P/rebind/rebind.py --check | 0 | register-update-proof.json; drift 0, 7 superseded origins, 16 groups |
| fchain.compose(pin), duplicate-id probe through load seam | 1 (expected) | current-proofs.json; rejects duplicate L13-28:related:86 after Lead fix edf816838 |
| git diff --check | 0 | no whitespace errors |

Exact current argv, exits, stdout/stderr and deterministic hashes: `register-update-proof.json`. Historical execution-proof.json remains unchanged. The current proof also records rebind.py --check (exit 0) and the expected-failing duplicate-id probe (exit 1, rejected). The first integrated verify attempt exited 1 on a case-sensitive wording check (Independently vs independent); that text check is now case-insensitive, with the approval/review boundary unchanged. Rebind record status alone is updated to cite w33; every other byte is conserved. Current status table above compares the register at turn-start HEAD, not an invented pre-F approval. No evidence or validation predicate was bypassed.

P = plans/260925-documentation-authority-unification/reports/phase-09. The current proofs retain production checks; only the F replay output sink uses the owning compose API to respect the exact write grant. Frozen historical/generated hashes are checked against their committed pins, not today’s live files. Only verification.json checkedAtHead is volatile and restored when it is the only rerun change. Scratch: exit-cleaned tempfile directories under /tmp/fgos-work/. No preview service under this scope. needsWrites: [].
