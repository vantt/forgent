# Gate register catch-up

Current committed inputs: `6ba3a13e18018fdfc7c79f08cd7f290865537bde`. Historical input layers and original occurrence accounting remain in `receipt.json` and `sources.json`; `currentCatchUp` fingerprints the new layer. Reused the sole generator, owning G0 join, fchain replay engine and verifier/control seams. Impact-analysis: degraded/unqueried under the no-CLI/no-MCP boundary.

## Result

Local preparation is met-local: G0 1,929/1,929 approved, G2 judgments reviewed, G6 787 premises settled and G9 158 decisions settled. The owner packet was sent (6586bbc46); L13-30 approves option A. lead:LAND confirms before any option-A step, starting with the board notice; confirmation and the board notice/HARDEN request are done on 2026-10-26 (origin/main e99966b37; w40 brief). L13-31 requires HARDEN answers before F, then staging-only release R, G11, G10 and the real lease. From F until Land docs/ is frozen; until the real lease it is held by convention only. G8 publication permission is covered by A; G5 owner acceptance, G9 backlog intent and G4/G10/G11 external dependencies remain open. W39 independently reviewed 45da92781 (11 APPROVE / 0 REWORK); its order and condition notes are resolved here. No lease, F, release, publication execution or Land approval is claimed.

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
| G8 | met-local | met-local | F duties; 0 owner items; 0 external items |
| G9 | met-local | met-local | F duties; 1 owner items; 1 external items |
| G10 | external | external | F duties; 0 owner items; 1 external items |
| G11 | external | external | F duties; 0 owner items; 2 external items |

## Evidence decisions

- G0: committed per-row verdicts W24–W30 and a fresh join prove 1,929/1,929; no aggregate approval substitutes for row records. `g0rework/final-pin-duties.json` owns the 134 conditional overlays, rebased relocation id/hash and actual-F delta review.
- G2: the 187 judgments keep the committed W20/W21 review scope. The 4 citation patches and shared-pin G2/G6 verification remain F duties.
- G6: W23 reviews all 787; W28 approves the 85 fixes and confirms prior approvals unchanged. The w33 (4 APPROVE / 1 REWORK), w35 (7/3) and w37 (10/1) chain covers link retargets and the whole-population L13-28 guard. Row 125 is approved in w35; w35 rework is approved in w37; its duplicate-id REWORK is a Lead mechanical fix in edf816838, verified by owning compose exit 0 and a rejecting duplicate-id probe (exit 1). No open review REWORK is hidden as met-local. The 137 current-passage-unbound rows and changed shard-2 patch delta reviews remain at F.
- G9: all 158 decisions, not 33. W25 is 158 APPROVE / 12 REWORK across entry and cross-cutting scopes, not blanket approval. L13-23/24 plus W28 settle the proposals/overlaps with unchanged decisions. WORK and registry exports remain external; two backlog-intent choices remain owner-owned.
- F composition: every prepared source is in fchain/manifest.json, including rebased-patches.json and link-retargets.json. Current replay exits 0, whole-population linkGuard=0, Related included. Guard 3 must agree at F (including 398 literal-code occurrences and 44 Related #anchor operands that the current product reader misreads); both must report 0. This is preparation only, not a separate retarget pass.
- Ownership: rebind records 0–148 cite W26 (594fe4194); records 149–154 cite w33-ownership-audit (5 APPROVE / 0 REWORK). The prior refresh changed only status; this turn does not write the rebind file and all edge bytes are conserved. L13-29.1 and packet 6586bbc46 report the latest accounting at 23e3c34b7: 0 unaccounted pairs, B ok, reproduction 8/8, 58 allowed-path exceptions dropped. Audit inputs are pinned and equal HEAD; the audit was not rerun and no pair accounting was performed.
- Owner decision: L13-30 approves option A on 2026-10-26. lead:LAND confirms before any option-A step, starting with the board notice; confirmation and the board notice/HARDEN request are done (origin/main e99966b37; w40). L13-31 start order: HARDEN answer → F → staged-only R → G11 → G10 → real lease → F duties → final ledger/review → separately approved Land. From F until Land docs/ is frozen, by convention only until the real lease. Every step after the notice remains pending. G8 publication permission is covered, not executed. Land needs separate approval after final ledger review; G5 and G9 owner items remain open. No frame widening, deletion on main or events push is authorized.
- Review/citations: 45da92781 now has its w39 entry (11 APPROVE / 0 REWORK), with order note w39-10 and condition note w39-11 resolved by this refresh. e7e6c129c retains its w38 entry (11 APPROVE / 0 REWORK); w38 also independently checked edf816838. W35/W37 include G9, W32 includes cutoverReadiness, and G7 cites reviews/w33-link-retargets-review.json item work-state-rebase. The obsolete constant field/control is retired; whole-population linkGuard is retained and the register reads it from fchain/check.json.
- G4 is external: local repairs are complete, but Git/HARDEN review is not accepted. G5 still needs owner acceptance of exactly 8 restatements. G8 creates the local archive ref only at F before G10. G10/G11 remain external. No component-boundary change.

## This refresh and proof ownership

- Reused reconcile.py as the sole register writer and verify.py check() as the owning record-integrity proof. History (-S on the lease step and order failure) shows the obsolete lease-before-F order was introduced in d7126c5b9 and retained by 45da92781; L13-31 intentionally changes that schedule, not the underlying lease safety contract.
- The 11-step order replaces the old eight-step list. Owner approval and LAND confirmation/board notice are done; HARDEN answers and all subsequent execution remain pending. The notice is fingerprinted from the e99966b37 commit diff, not by loading the whole board log. LAND confirmation is supplied by the w40 brief, not inferred from the relay notice.
- controls.py now rejects F-before-HARDEN, lease-before-G11, and lease-between-G11-and-G10 independently: 39 rejecting controls, up from 36. The confirmation control now rejects stale pending (confirmation is done); the lease-execution control points to the new real-lease index; the reverse-order control retains the same behaviour under its corrected title. All other checks and controls are retained.
- Current pin/review/input fields changed substantively; checkedAtHead is not an isolated volatile-only rerun change. No unrelated volatile fields changed. No final acceptance, lease operation, release activation, F import or Land was performed.

## F-window size

```json
{
  "sourcePin": "6ba3a13e18018fdfc7c79f08cd7f290865537bde",
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
    "linkGuard": 0,
    "linkGuardSource": "fchain/check.json#/counts/linkGuard (absent finding means 0)",
    "rule": "Counts are witnesses, not additive populations; replay once through the single door at F."
  }
}
```

## Outside-plan follow-ups

- Work-state Data Dictionary row 12 says add defaults to executing, contrary to RUL18 and bin/fgos.mjs (discovery). Source: `reviews/w29-g0-verdicts-b10.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- RUL59 declares intent retired but still describes edit --intent and intent write errors. Source: `reviews/w30-g0-verdicts-b11.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- About 15 old Vietnamese heading titles remain quoted after the headings were renamed. Source: `reviews/w29-g0-verdicts-b10.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- 36 rationale/reason strings in s2/s6/s14 start with whitespace; out-of-scope ledger cleanup. Source: `reviews/w30-g0-verdicts-b11.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- Have audit-report.py also report the raw drift count alongside unaccounted drift. Source: `reviews/w33-ownership-audit-review.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).
- Make rebind records 149–150 use the same file/pointer keying as records 151–154. Source: `reviews/w33-ownership-audit-review.md`. Owner: lead:DOC; destination: separate backlog item, filed when the cutover lands (backlog on main is outside PRE-FLIP scope).

## Commands and exits

Read-only inventory commands (`git status --short`, `git rev-parse`, `git log` including -S history, `git diff` including --name-only/--stat, `git show`, `git ls-tree`, `git for-each-ref`) exited 0; none mutated Git. The three changed Python scripts passed ast.parse in a python3 -B inline preflight (exit 0). Source reads and full JSON review parsing/fingerprinting are recorded by currentCatchUp.inputs/reviewInventory. An initial inline final-inspection command exited 1: its log selector mistook git diff --check for rebind.py --check and tried to JSON-parse empty stdout. The corrected selector names rebind/rebind.py; final inspection exits 0. This was reporting code only, not a failing owning proof; no production check changed. Both inspection outcomes are recorded in order-update-proof.json. No product tests, CLI, native addons, pair accounting, lease/ref or other records were written.

| Command | Exit | Evidence |
|---|---:|---|
| python3 -B P/g0join/join.py --pin 6ba3a13e18018fdfc7c79f08cd7f290865537bde | 0 | current-proofs.json: argv, counts, stdout hash, stderr |
| python3 -B P/fchain/check.py --pin 6ba3a13e18018fdfc7c79f08cd7f290865537bde (compose API, output-only adapter) | 0 | current-proofs.json: full engine, sources, counts, report hash; no out-of-scope check.json write |
| python3 -B P/gate-reconcile/reconcile.py (twice) | 0 / 0 | deterministic generated register/receipts/sources/current-proofs |
| python3 -B P/gate-reconcile/verify.py | 0 | verification.json |
| python3 -B P/gate-reconcile/controls.py | 0 | controls.json: 39 rejecting controls; new F/HARDEN and both lease/G11/G10 order regressions; prior linkGuard and decision/provenance regressions retained |
| python3 -B P/rebind/rebind.py --check | 0 | order-update-proof.json; drift 0, 7 superseded origins, 16 groups |
| fchain.compose(pin), duplicate-id probe through load seam | 1 (expected) | current-proofs.json; rejects duplicate L13-28:related:86 after Lead fix edf816838 |
| git diff --check | 0 | no whitespace errors |

Exact current argv, exits, stdout/stderr and deterministic hashes: `order-update-proof.json`. Prior register-update-proof.json is historical. Historical execution-proof.json remains unchanged. The owning duplicate-id probe still rejects (exit 1, expected). The rebind file was not written; its prior reviewed status and all edge bytes are conserved. Current status table compares turn-start HEAD, not final acceptance. The obsolete moved-path constant control is retired because linkGuard owns that measured behaviour; its existing whole-population regression control remains. No evidence or validation predicate was bypassed.

P = plans/260925-documentation-authority-unification/reports/phase-09. The current proofs retain production checks; only the F replay output sink uses the owning compose API to respect the exact write grant. Frozen historical/generated hashes are checked against their committed pins, not today’s live files. Only verification.json checkedAtHead is volatile and restored when it is the only rerun change. Scratch: exit-cleaned tempfile directories under /tmp/fgos-work/. No preview service under this scope. needsWrites: [].
