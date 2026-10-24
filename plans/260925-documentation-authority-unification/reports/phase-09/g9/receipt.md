# Interim source-context receipt — rework

Source pin: `d14d89865b44018db48d12fa8b3f5279a2dbc905`, **not final pin F**. This supersedes the earlier receipt's current counts and replay claims. **G9 sweep and composition verification pass; the assignment is blocked only on the pre-existing legacy-ratchet failures below.** No independent acceptance or gate closure is claimed.

## Records and dispositions

The three cohorts still contain **684 memberships / 574 physical records**: changed 518 (10/30/478), overlaps 144 (10/9/125), W0 deferred 22 (11/4/7). Revision rows remain distinct.

| Classification | Records | Passages |
|---|---:|---:|
| unchanged | 55 | 3,576 |
| moved | 88 | 12,766 |
| changed | 353 | 3,857 |
| absent | 78 | 995 |

Dispositions: **229 still-valid-as-recorded, 7 needs-recomposition, 338 owned-park**. The parks remain owned by **Documentation source-binding reviewer / Lead (G9)**, with row-specific next actions, ranges and evidence hashes. These are conservative author dispositions, not semantic approvals or runtime parity.

The existing edit-interval mapping now classifies a mapped passage as **moved when its full bytes equal the bound passage**, even when that text occurs more than once. This corrects 244 passage classifications and **20 changed/parked records → moved/still-valid**. No ambiguous occurrence is selected by guessing. [w10-judgment-delta.json](w10-judgment-delta.json) lists all 20 record ids and all disposition changes.

The five unexplained still-valid judgments are now **owned parks**, not approvals:

- `step04-009.jsonl:3`: changed `docs/architecture-manifest.json` dependency.
- `step04-030.jsonl:4`: changed `docs/backlog.md` dependency.
- `step04-030.jsonl:8`: changed `docs/specs/reading-map.md` dependency; that retired-path park is explicitly **not** validity evidence.
- `generators-skills-and-support.jsonl:3` and `:96`: changed canonical `domains/coding/skills/_shared/coding-cell-policy.md` dependency.

The classifier/judge records these dependencies separately from primary passages and names them in each park's next action. The seven pre-existing needs-recomposition judgments remain pending, with dependency review explicitly unresolved; none is relabelled still-valid. `verify.py` now rejects any still-valid judgment that hides a changed explicit/canonical dependency. Other disposition changes: none.

## Recomposition and chain guard

`recomposed.json` still contains **545 bodies**: 536 existing files and nine absence-guarded creations; 46 no-byte-change bodies, 79 generator-evidence-only bodies, 14 final-pin-conditional bodies. Every nonempty body replays forward and rollback with `patch --batch --fuzz=0 --reject-file=- -p1`, whole-file guards, and byte-exact restoration. Nothing is applied to the checkout.

Exactly these five body diffs changed; the other **540 body diffs/hashes are unchanged** ([w10-recomposition-delta.json](w10-recomposition-delta.json)):

- `docs/platform/agent-protocol/spec.md`
- `docs/platform/event-store/spec.md` (including the witness #16 correction)
- `docs/platform/git/spec.md`
- `docs/platform/process/spec.md`
- `docs/platform/terminal-control/spec.md`

`sweep.py --check` now compares each recomposed predecessor chain's **ordered spec id, before hash, expected-after hash and diff hash** with the current `spec_chains()`. Missing/stale chains fail closed; source preimage equality alone is insufficient. `verify.py` reuses the same content-identity projection instead of maintaining a second contract.

The real check **exited 1 before recomposition**, naming exactly those five stale chains ([w10-before-recompose-check.json](w10-before-recompose-check.json)); the classifier's pending judgment refresh was also reported, not hidden. An isolated in-memory replay of the real old packet confirms the five chain mismatches while current judgment errors are zero ([w10-chain-control.json](w10-chain-control.json)). Final `sweep-check.json`: **0 source drift, 0 chain mismatches, 0 judgment errors, 0 unresolved recompositions; exit 0**.

Reused: Step 7 authored-hunk parser/exact locator, existing current-byte composer and GNU patch, existing evidence joins and shared provenance map. Prior-art Git searches locate these mechanisms in `4f08d504d`; the sibling gloss rewrite is `928f5cc14`. No component-boundary change. `impact-analysis: degraded` under the explicit no-CLI grant; caller inspection found only the G9 scripts, not product runtime callers.

## Ratchet pin and blocker

The only exceptions-ledger edit is `previousMainMergeAccounting.inputCommit`: `92260972c…` → **`5965143b4fd56df6698b2096df1a672d26293c90`**. Both commits have stable patch-id `585be0a439f62fe3c25787d27bb35ba6714bd426`; the new commit is an ancestor of the source pin. **The complete exceptions file at the two commits is byte-equal**, SHA-256 `67d639b04bce8342a1bcd245a1b6736bbbddfcd33f47ed2664c90a524cc5e65e`. The retained object's hash remains `4957bd9e261f8a51a6e2d94910a62a26a1bb1f4517f2b562d1d0bec8c201e2a7`. Commands and exact evidence: [w10-ratchet-repin.json](w10-ratchet-repin.json).

**The required ratchet exit 0 is not achieved.** `node scripts/check-legacy-docs-ratchet.mjs` exits **1**, with three existing exception-digest mismatches:

- `docs/specs/confinement-authority.md`
- `docs/specs/reading-map.md`
- `docs/specs/seat-binding.md`

Running with the **unmodified HEAD exceptions file** exported to scratch gives the identical JSON findings/stats as the re-pinned file: [before](w10-ratchet-before.json), [after](w10-ratchet-after.json). The pin change does not cause or resolve them. No baseline, expected digest, rationale, or exception allowance was changed to manufacture green. Lead must review/account the current legacy bytes or authorize their correction; the brief's pin-only repair does not establish that approval. No additional write path is requested: `needsWrites=[]`.

## Commands and exits

Let `G=plans/260925-documentation-authority-unification/reports/phase-09/g9` and `C=../composition` relative to G. All Python runs use `python3 -B`. Exact subprocess argv, exits and outputs/digests are retained in `w10-commands.json`, `patch-commands.json`, `source-read-commands.json`, `verification-commands.json`, `sweep-check.json.commands`, `w10-ratchet-repin.json.commands` and the composition `w10-*commands.json` files.

| Command | Exit / result |
|---|---|
| `python3 -B "$G/sweep.py" --check` before recompose | **1**, expected stale chains + judgments pending classifier refresh |
| `python3 -B "$G/recompose.py" --pin HEAD` | **0**; 545 bodies, zero unresolved; **1,515 patch invocations, all 0** |
| `python3 -B "$G/judge.py" --pin HEAD` | **0** on all four author runs; final 229 / 7 / 338 |
| `python3 -B "$G/verify.py" --pin HEAD` | **0** on all four runs; final 545 roundtrips, **998 patch invocations all 0**, 12 patch-id equivalences, 10 direct historical pin fields, complete evidence joins and existing negative controls |
| `python3 -B "$G/sweep.py" --check` after judgment refresh | **0** on all four runs; final counts above |
| `python3 -B …/composition/w10-rework.py --prepare` | **0**, witness #16 regenerated; all 104 after-lines read |
| `python3 -B …/composition/w10-rework.py --verify` | First **1**, scratch output-name adaptation accidentally renamed a ledger input; corrected scoped adaptation **0**. Full composition/resolver and independent replay pass; citation 130 → 0. See composition receipt. |
| `node scripts/check-legacy-docs-ratchet.mjs` (three default invocations) | **1** each; same three pre-existing failures; log + `w10-commands.json` stderr retained |
| Same checker `--json`, and `--exceptions /tmp/fgos-work/w10-g9-rework/head-exceptions.json --json` | **1 / 1**, byte-equal result objects |
| Read-only Git `rev-parse`, `show`, `patch-id --stable`, `merge-base --is-ancestor`, history/caller/status/diff inspections | **0**; missing-source reads **128** are explicit absence evidence, not successes |
| `git diff --check`; `git diff --cached --name-only` | **0 / 0**, index empty; final scope audit in `w10-final-audit.json` |

Authoring harness attempts are not acceptance proof: `run-g9.py` first exited **1** when the real ratchet returned 1 rather than the requested 0; `final-g9.py` first exited **1** when its five-park assertion exposed a temporary 4-park/1-recomposition result. Correcting the policy to park all five gave **0**. Earlier temporary policy had parked the seven pending recompositions too; that over-broad disposition was corrected and rerun. No failed attempt is represented as green. The preliminary read-only check also exited **1**, before the published before-recompose check.

Older `commands.json`, `determinism.json`, `integrity.json`, `final-audit.json`, historical-pin controls and re-pin receipts remain historical evidence at their own pins; they are **not** this tree's completion claim. Current owning outputs are the files named above. Scratch is confined to `/tmp/fgos-work/w10-g9-rework/` and removed at handoff. No live docs/product code/tests, `.fgos`, secrets, Git writes, fgOS CLI, pair accounting, baseline changes, suite runs or preview service. Assignment outbox publication is the required exception. Final-pin acceptance, parks, semantic review and full-suite parity remain Lead-owned.
