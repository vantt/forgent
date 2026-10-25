# Shard 3 — premise rework against the F chain

**Current status: mechanical chain proof passes; independent acceptance still pending.**
All proposals now use `premise-patch.v1`. See [current contract and proof](chain-check.md)
and [chain-check-b005d4eba.json](chain-check-b005d4eba.json): 261 rows, 34 source-file and
2 successor-holder proposals, 3 exact chain markers, zero unresolved findings.
No judgment or original evidence changed. No patch was applied; no review acceptance,
gate closure, authority promotion or cutover readiness is claimed.

**Historical rework narrative below:** `chainRebases`, `successorPatches`,
`postChainReplay`, diagnostic-chain counts and checker blockers describe the earlier
proposal format only. Those side doors are removed from the current JSON: every sole
executable proposal is attached as `rows[].patch`, including the two named holders.
Five frozen pin replacement proofs remain non-executable `frozenPinEvidence`.

- Rework pin: `c58f2b230e14e73db42cb8ccc965ef8967bb085a`.
- Frozen source-evidence pin retained: `c94545de5b45873cb2eb419f10124283fd730a2e`. Source passages and digests are unchanged; new Lead authority is separately pinned in `decisionRefs`.
- Read first: [rework brief](../../w25-shard-rework-brief.md), [review](../../reviews/w23-g6-shard-3-review.md), L13-21 in [owner answers](../../owner-answers.md), [chain-check report and Lead correction](chain-check.md), then [shard-3.json](shard-3.json).
- The JSON records every changed row in `reworkChanges`/`reworkNotes`, exact replacement evidence, post-chain proposals, hashes, roundtrip results and the outstanding checker limitations.

## Before and after

| Disposition | Before | After |
|---|---:|---:|
| preserve-confirmed | 98 | 138 |
| repoint | 77 | 73 |
| successor-bound | 50 | 50 |
| owned-park | 36 | 0 |
| retire-with-source | 0 | 0 |
| **Total** | **261** | **261** |

All 44 review REWORK rows have an explicit response. There are 122 changed row objects, including shared-patch regeneration and stale-dependency notes; the other 139 row objects are unchanged. Every original source binding remains byte-for-byte identical. All rows retain `needsFlipDate: false`.

| Proof measure | Before | After |
|---|---:|---:|
| Unique pin-evidence file patches | 39 | 34 |
| Duplicate row patches | 3 | 0 |
| alreadyComposed markers | 0 | 3 |
| Checker unresolved, shard-local | 29 | 26 |
| Checker unresolved, global chain included | 38 | 35 |
| Checker exit | 1 | 1 |

After: one resolved duplicate (`f08496`), two stale-dependent markers, 16 reported conflicts, two absent-source false positives and six shard-local stale entries. The resolved duplicate is included in the finding counts but not the unresolved total. There remain **20 non-stale shard-local findings**: 13 unrecognized rebases, three gloss false positives, two absent-source false positives and two markers blocked by stale predecessors. These are not waived or relabelled to obtain green.

Independent data/replay checks passed: exact 261-row coverage and existing checker span/digest validation; all 44 review REWORKs accounted for; 36 sole file proposals replayed forward and reverse at `--fuzz=0` (72 executions). **35 proposal chains are strict; `docs/reading-map.md` is diagnostic only** until its stale predecessor is repaired. This independent result does not replace the required consolidated-checker proof.

## Proposal representation and blocker

Existing `validate_shard` requires every row patch to be exactly the standard `difflib.unified_diff` from the **bare evidence pin** and its declared replacements (`check_shard.py:146–166`). `inspect_rows` then sends that **same diff** to `patch_roundtrip` on the **F-chain output** (`:304–310`). It has no representation for a different post-chain context or a patch on a successor holder rather than the source file.

Consequently the four context-conflict files cannot both satisfy its bare-pin diff equality and supply the chain-rebased diff required by L13-21.1. The checker is outside this shard's exact writable list and was not changed.

The artifact makes this distinction explicit, pending checker/contract review:

- `rows[].patch` retains the existing frozen-pin replacement proof. For a file named in `chainRebases`, it is **evidence only, not another executable proposal**.
- `chainRebases` contains the sole proposed post-chain diff for five files: platform-foundations, routing-handoff, roadmap, work-state README and CLI I/O contract. The first, second, fourth and fifth fix context conflicts; roadmap is also regenerated at its post-chain line positions instead of relying on an offset. Each has its chain-entry list, pre/post hashes and actual forward/reverse replay results.
- Other row patches already replay on the chain; their post-chain hashes are recorded in `postChainReplay` rather than misusing their pin-time `proposedSha256` as a chain hash.
- `successorPatches` contains one prepared post-chain patch each for Identity and Workflow, with source evidence, rollback diffs and replay results. They are attached by existing row ids, not invented proof rows or ids.
- `alreadyComposed` rows have **no patch**. Diagnostic replay never approves a stale chain entry.

This is a blocked proposal contract, not a new accepted application door. Do not silently apply either representation. The needed out-of-scope change is `preserve-premise/park-judgments/check_shard.py`: validate a guarded chain basis as well as frozen replacement evidence, validate successor-holder proposals, distinguish pre-existing absent sources, and distinguish harmless gloss additions from lost preserved references. Stale-marker certification additionally waits for the separately assigned chain-rebase turn.

## Every changed row and its reason

Rows grouped below share exactly the stated cause; each id is explicit. JSON carries per-row notes and evidence.

### Review REWORKs

- **f08458, f08460, f08461, f08462, f08463, f08464, f08466, f08467, f08468, f08469, f08470, f08472, f08474, f08475, f08476, f08477, f08478, f08481, f08482, f08483, f08484, f08485, f08487, f08488, f08489, f08490, f08491, f08492, f08495, f08548, f08557, f08618, f08720, f08724, f08727, f08803:** change owned-park to preserve-confirmed, **keep the live convention unchanged** under L12-10 and L13-21.3. Added exact L12-10 evidence and per-row operand facts. The physical move/removal set contains no `docs/history/` path. Removed the unnecessary owner question and caller-migration action; these are not reclassified as historical examples.
- **f07667:** preserve the carried coordination CLI paragraph verbatim. The examples glob is unaffected by cutover, and the line-23 carriage note explicitly defers truth correction. Removed both the paragraph rewrite and retarget. Its source file also depends on the stale `h-69197b459754.md` chain entry.
- **f07886, f07889:** preserve the dated P12/section-9 generated-spec process claims, consistent with f07869/f07888 and the provenance header. Removed their replacements from the shared roadmap patch; no new editing/generation rule for platform specs is introduced.
- **f07871:** retarget the plural contracts directory to `docs/platform/agent-coordination/history/retired-engine/files/contracts/`, not one coordination-session contract. Bind the collection README's `## Contracts` section, which lists all four contracts. Regenerate its shared patch on the chain result.
- **f08668:** preserve the already-absent abbreviated decision-id citation (`beforePresent: false`, `removedByMoveOrStep6: false`) consistently with its seven siblings. Remove the unjustified product-comment patch.
- **f08496:** drop its duplicate patch and set `alreadyComposed: file:herdr-dashboard/src/pane_scan.rs`; the checker verifies this exact bound retarget and resolves the duplicate.
- **f08634:** drop its duplicate patch and set `alreadyComposed: file:plugins/fgOS/skills/terminal/SKILL.md`. Record the stale predecessor dependency; checker certification is still blocked, not claimed.
- **f08665:** drop its duplicate patch and set `alreadyComposed: file:src/runner/dispatch/assignment-runner.mjs`. Record the stale predecessor dependency; checker certification is still blocked, not claimed.

### Shared-patch and live-pointer work

- **f07532:** use relative `../governance.md`, matching this Related list's convention and preserving its mapped destination.
- **f07872, f07873, f07874, f07875, f07876, f07877, f07878, f07879, f07880, f07881:** regenerate their shared roadmap patch after the directory correction and removal of f07886/f07889 changes. Their approved pointer-token replacements remain unchanged. Their sole post-chain proposal is the roadmap entry in `chainRebases`.
- **f07380, f07398:** prepare a platform-foundations post-chain diff, preserving the chain's changed neighbouring table row. Frozen pin replacement evidence remains distinct; checker cannot yet consume the rebased context.
- **f07697, f07698, f07701:** prepare a routing-handoff post-chain diff, preserving the chain's neighbouring ADR-0005 retarget. Same checker limitation.
- **f08012, f08013, f08021, f08024:** prepare a work-state README post-chain diff, preserving the chain's Purpose/Read-first/legacy-owner changes. Same checker limitation.
- **f08033, f08044, f08046, f08047:** prepare a CLI I/O contract post-chain diff, preserving the chain's neighbouring version/envelope retargets. Same checker limitation.
- **f07852, f07854:** prepare Identity successor-holder navigation for `:22` and `:159` to the CLI I/O area contract. Keep successor-bound: commit `9fdaac9ba` removed the old Session Identity file before the pin and merged the writer contract into Identity §7a. Git ancestry, source absence, the successor header and preserved claim are evidence against `successorOfSurvivingSource`; an already-absent source is not a surviving file. Do not retire the surviving writer claim merely to silence the checker.
- **f08335:** prepare the Workflow successor-holder law link, changing only destination `../../platform-foundations.md` to `../platform-foundations.md`. The actual pointer is line 693 at the pin (the review/Lead locator says 694). No unnamed future composition duty remains.
- **f07976, f07985, f08419, f08443:** record that the two ui-spec holder patches cover both live gateway-YAML citations and the two removed-source successor claims. Do not create duplicate successor patches.

### Checker findings answered with evidence

- **f07786, f07789, f07790:** retain preserve-confirmed/source-carriage-note. `w8:gloss:docs/platform/runner/spec.md` inserts only `(doctor checks executor posture readiness without spawning agents)` after RUL100. All source-coordinate operands survive unchanged. Added exact post-chain text and digest in `chainEvidence`. The checker uses whole-line equality, so it reports a conflict despite no lost preserved reference. An `alreadyComposed` marker would be false: this is not a retarget.

### Dependency notes only — judgments unchanged

- **f07660:** stale predecessor `file:docs/platform/runner/architecture/h-69197b459754.md`.
- **f07671, f07672, f07686:** stale predecessor `file:docs/platform/runner/architecture/h-7af1f0242611.md`.
- **f07816, f07819:** stale predecessor `file:docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`.
- **f08094, f08096, f08098, f08099, f08104, f08105, f08106, f08110, f08115, f08116, f08117, f08128, f08179, f08180, f08209, f08211, f08212, f08213, f08216, f08218, f08219, f08220, f08223, f08225, f08227, f08228, f08231, f08232, f08244, f08245, f08246, f08247, f08250, f08251, f08283, f08285, f08286, f08288:** stale predecessor `file:docs/reading-map.md`, whether the file is the source or bound successor. Current diagnostic patch replay is not approval of that predecessor.

## Retained judgment groups

| Shared cause | Rows | Meaning |
|---|---:|---|
| historical-package-record | 23 | Dated distribution/closeout/audit source coordinates, not live authority routes |
| literal-example | 9 | Hypothetical paths, payloads, traversal strings and wireframe literals |
| source-carriage-note | 22 | Explicit frozen-source/stale-locator provenance, including f07667 |
| historical-decision-or-proof | 46 | Dated/citation-only decision and evidence references, including f08668 |
| historical-roadmap-process | 2 | Dated generated-spec process claims, not new platform rules |
| live-navigation | 50 | Live routes; three are covered by named chain entries, others have proposals |
| source-coordinate-label | 23 | Non-navigation code-span provenance, not self-links |
| successor-navigation-merge | 40 | Exact surviving relationship in a mapped successor unit |
| historical-template-carriage | 8 | Archived templates and placeholders, not new authoring rules |
| identity-rename | 2 | Writer contract survives the pre-existing rename into Identity §7a |
| live-artifact-convention-unchanged | 36 | Live external-project conventions explicitly unchanged under L12-10 |
| **Total** | **261** | **No owned parks remain** |

## L13-21 cross-cutting coverage

- All **36** lineage rows identified by shard 2 review X1 belong to shard 2; intersection with shard-3 ids is empty. Their ids and exclusion reason are in `coverageNotes.lineageLinks`. No other shard was edited. Existing shard-3 source-coordinate-label proposals already produce explicit code spans/non-navigation framing.
- All 18 removed-door banners belong to shards 1/2; none is assigned here.
- Gateway YAML: shard 3 owns the S03-task-detail and 15-system-events holders, covered by f07976/f07985. The config and herdr-web-dashboard holders are shard 2's, not silently patched here.
- `packages/yaml-doc` mentions are excluded: crate source, upgrade-record and fixture coordinates are not the moved gateway API document or legacy authority roots. Observed examples include `packaging-distribution/spec.md:217,221,742` and `docs/reading-map.md:187`; no package-directory rewrite is warranted.
- Identity and Workflow uncovered live pointers have explicit prepared successor patches in this artifact, rather than a promise of a later unnamed owner.

## Stale chain entries left for the separate turn

Each id below is prefixed by `file:`. Expected/actual hashes remain in the pinned chain-check evidence; no chain record was rewritten or waived.

| Shard-local file | Dependent rows |
|---|---|
| docs/platform/runner/architecture/h-69197b459754.md | f07660, f07667 |
| docs/platform/runner/architecture/h-7af1f0242611.md | f07671, f07672, f07686 |
| docs/platform/runner/subcomponents/h-6979005beaf7/spec.md | f07816, f07819 |
| docs/reading-map.md | All 38 reading-map source/successor dependency-note rows listed above |
| plugins/fgOS/skills/terminal/SKILL.md | f08634; its marker remains uncertified |
| src/runner/dispatch/assignment-runner.mjs | f08665; its marker remains uncertified |

The unchanged checker also includes nine stale global entries outside shard source files: `.githooks/pre-commit`, `docs/io-contract.md`, `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`, `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md`, `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`, `docs/platform/agent-coordination/decisions/README.md`, `src/runner/dispatch/confinement/policies.mjs`, `src/runner/dispatch/herdr-round.mjs`, and `test/runner/dispatch-worker-session.test.mjs`. Thus global stale count is 15, not six.

## Commands, verification and scope

All work ran from `/home/vantt/projects/forgentX-p9-w1-d3`. Python was always `python3 -B`. Scratch was confined to a turn-specific tempfile directory under `/tmp/fgos-work/` and removed at handoff.

| Command / operation | Exit / result |
|---|---|
| `git rev-parse HEAD`, `git status --short` at entry | 0; clean, rework pin above |
| Read-only JSON/evidence/chain inspections | 0 except one exploratory dump stopped on absent-source `text` (KeyError); no artifact emitted |
| `git log -3 --oneline -S'alreadyComposed' -- .../check_shard.py` | 0; found `926000dbd`, which introduced the consolidated checker |
| `git show --stat --oneline 9fdaac9ba -- ...`, ancestry check | 0; confirmed Session Identity removal and merge before evidence pin |
| Initial checker invocation via I/O-only wrapper, first attempt | 1/traceback: wrapper also blocked legitimate tempfile `write_text`; fixed wrapper to permit scratch writes, not checker logic |
| Unchanged checker `main()` with `--shard 3`, before rework | Return 1; 29 own / 38 global unresolved |
| Scratch proposal generation, including exact chain replay | 0; 34 file patches, five rebases, two successor patches |
| Unchanged checker `main()` with `--shard 3`, after rework | Return 1; 26 own / 35 global unresolved; no invalidShard |
| Independent artifact verification, first draft | 1; verifier incorrectly compared a post-chain hash with a pin-only hash; corrected verifier to use recorded post-chain hash, not proposal data |
| Independent final artifact verification | 0; 261 bindings, 44 REWORK responses, 122 changed rows, 36 proposals / 72 exact executions, 35 strict chains |
| `git diff --check`, exact two-file scope check | 0 |

The CLI's normal final report path `chain-check-<HEAD>.json` is outside the writable list. To avoid that forbidden write, the scratch wrapper imported the unchanged module and called its unchanged `main()` with the exact arguments, relocating **only that report sink** into its tempfile directory. Legitimate replay scratch writes remained enabled; no assertion, source input, finding, command result or return code was altered. The invocation returned 1, and its relevant results are retained in `verification` in the JSON. No outside-scope chain-check report was created.

Normal reproduction, in a turn authorized to create the checker report:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard.py --shard 3
```

Expected at this rework pin: exit 1 **with the non-stale blockers described above**, not a stale-only pass. Independent replay uses the existing `composition/compose.py` `apply_diff`, the checker `patch_roundtrip` and the actual effective-chain output; it does not invent another chain or transfer stale approvals.

Only this Markdown file and `shard-3.json` were changed. No git writes/staging, fgOS CLI, lifecycle verb, native addon, product test, ledger/register edit, source-doc edit or preview service was run. Impact-analysis: degraded; the brief forbids the capability-query CLI and no impact tool is exposed. Required artifact names were supplied verbatim, not newly constructed. This records slice adds no product dependency/default/env var and does not change shipped user behavior.
