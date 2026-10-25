# Gate register catch-up

Current committed inputs: `f498ebded83ba5789e730adc74bb637b80e2f536`. Historical input layers and original occurrence accounting remain in `receipt.json` and `sources.json`; `currentCatchUp` fingerprints the new layer. Reused the sole generator, owning G0 join, fchain replay engine and verifier/control seams. Impact-analysis: degraded/unqueried under the no-CLI/no-MCP boundary.

## Result

Local preparation is met-local: G0 1,929/1,929 approved, G2 judgments reviewed, G6 787 premises settled and G9 158 decisions settled. Send the owner packet at met-local before approval, lease and F (L13-6). G5 owner acceptance, G8 publication, G9 backlog intent and G4/G10/G11 external dependencies remain open. This catch-up itself still needs independent records review; no F, release, lease, publication, cutover or Land approval is inferred.

| Gate | Turn-start status | Current status | Open boundary |
|---|---|---|---|
| G0 | partial | met-local | F duties; 0 owner items; 0 external items |
| G1 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G2 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G3 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G4 | met-local | external | F duties; 0 owner items; 1 external items |
| G5 | met-local | met-local | F duties; 1 owner items; 0 external items |
| G6 | partial | met-local | F duties; 0 owner items; 0 external items |
| G7 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G8 | met-local | met-local | F duties; 1 owner items; 0 external items |
| G9 | partial | met-local | F duties; 1 owner items; 1 external items |
| G10 | external | external | F duties; 0 owner items; 1 external items |
| G11 | external | external | F duties; 0 owner items; 2 external items |

## Evidence decisions

- G0: committed per-row verdicts W24–W30 and a fresh join prove 1,929/1,929; no aggregate approval substitutes for row records. `g0rework/final-pin-duties.json` owns the 134 conditional overlays, rebased relocation id/hash and actual-F delta review.
- G2: the 187 judgments keep the committed W20/W21 review scope. The 4 citation patches and shared-pin G2/G6 verification remain F duties.
- G6: W23 reviews all 787 (702 APPROVE / 85 REWORK); W28 approves the 85 fixes and confirms prior approvals unchanged. The 36 history parks are keep-unchanged under L13-21.3, not open owner asks. W28 has 104 APPROVE / 2 REWORK: L13-26 and link-retargets.json answer the two findings. The 137 current-passage-unbound rows remain at F.
- G9: all 158 decisions, not 33. W25 is 158 APPROVE / 12 REWORK across entry and cross-cutting scopes, not blanket approval. L13-23/24 plus W28 settle the proposals/overlaps with unchanged decisions. WORK and registry exports remain external; two backlog-intent choices remain owner-owned.
- F composition: every prepared source is in fchain/manifest.json, including rebased-patches.json and link-retargets.json. Current replay exits 0, linkIntoMoveSet=0. This is preparation only: replay at actual F, not a separate retarget pass.
- Ownership: L13-27 routes drift judgment through rebind.py --check. The committed Lead brief reports audit-report.py ok at 4a4fefbe8 after pair accounting; no committed full audit stdout was found. The register labels this reported-ok, with pinned script/manifest hashes, not an independently reproduced audit. The forbidden audit was never run.
- G4 is external: local repairs are complete, but Git/HARDEN review is not accepted. G5 still needs owner acceptance of exactly 8 restatements. G8 creates the local archive ref only at F before G10; publication is owner-gated. G10/G11 remain external.

## F-window size

```json
{
  "sourcePin": "f498ebded83ba5789e730adc74bb637b80e2f536",
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
    "source": "fchain/manifest.json",
    "manifestSources": 20,
    "baseChainFiles": 465,
    "basePatchSteps": 497,
    "additionalExecutedPatches": 182,
    "composedFiles": 572,
    "rebasedEntries": 5,
    "linkRetargetPatches": 41,
    "linkRetargetRows": 162,
    "linkIntoMoveSet": 0,
    "rule": "Counts are witnesses, not additive populations; replay once through the single door at F."
  }
}
```

## Outside-plan follow-ups

- Work-state Data Dictionary row 12 says add defaults to executing, contrary to RUL18 and bin/fgos.mjs (discovery). Source: `reviews/w29-g0-verdicts-b10.md`.
- RUL59 declares intent retired but still describes edit --intent and intent write errors. Source: `reviews/w30-g0-verdicts-b11.md`.
- About 15 old Vietnamese heading titles remain quoted after the headings were renamed. Source: `reviews/w29-g0-verdicts-b10.md`.
- 36 rationale/reason strings in s2/s6/s14 start with whitespace; out-of-scope ledger cleanup. Source: `reviews/w30-g0-verdicts-b11.md`.

## Commands and exits

Read-only inventory commands (`git status --short`, `git rev-parse HEAD`, `git log`, `git diff --name-only`, `git show`, `git ls-tree`, `git grep`, `rg`, `wc`) exited 0 except negative searches (exit 1); none mutated Git. Source reads and full JSON review parsing/fingerprinting are recorded by currentCatchUp.inputs/reviewInventory. No product tests, CLI, native addons, pair accounting, lease/ref or other records were written.

| Command | Exit | Evidence |
|---|---:|---|
| python3 -B P/g0join/join.py --pin f498ebded83ba5789e730adc74bb637b80e2f536 | 0 | current-proofs.json: argv, counts, stdout hash, stderr |
| python3 -B P/fchain/check.py --pin f498ebded83ba5789e730adc74bb637b80e2f536 (compose API, output-only adapter) | 0 | current-proofs.json: full engine, sources, counts, report hash; no out-of-scope check.json write |
| python3 -B P/gate-reconcile/reconcile.py (twice) | 0 / 0 | deterministic generated register/receipts/sources/current-proofs |
| python3 -B P/gate-reconcile/verify.py | 0 | verification.json |
| python3 -B P/gate-reconcile/controls.py | 0 | controls.json: 23 rejecting controls (all prior 14 retained) |

Exact final argv, exits, stdout/stderr and deterministic hashes: `execution-proof.json`. Initial integration attempts are retained there too: three verifier exit-1 schema/fingerprint failures (historical generated coverage, evidence path shape, review inventory path shape), then one controls exit-1 because the overlay mutation hit the earlier count guard. The generator preserves all six historical generated fingerprints, inventory data no longer impersonates path lists, and the control now mutates the duty without changing counts. No evidence or validation predicate was bypassed.

P = plans/260925-documentation-authority-unification/reports/phase-09. The current proofs retain production checks; only the F replay output sink uses the owning compose API to respect the exact write grant. Frozen historical/generated hashes are checked against their committed pins, not today’s live files. Only verification.json checkedAtHead is volatile and restored when it is the only rerun change. Scratch: exit-cleaned tempfile directories under /tmp/fgos-work/. No preview service under this scope. needsWrites: [].
