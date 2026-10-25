# Shard 2 — rework against the F chain

**Status: blocked on checker support, not accepted.** All seven review REWORKs have prepared fixes, but the required checker does not accept F-chain patch preimages. No source patch has been applied; no authority, gate closure or cutover-readiness claim is made.

- Evidence pin remains `c94545de5b45873cb2eb419f10124283fd730a2e`.
- F-chain replay pin: `c58f2b230e14e73db42cb8ccc965ef8967bb085a`.
- Scope: exactly 263 assigned IDs; only [shard-2.json](shard-2.json) and this report changed.
- Inputs read: the complete w25 brief, both shard-2 review files, L13-21, `chain-check.md` including the Lead correction, and shard-2 findings in `chain-check-c804a3213.json`.
- Reused the existing patch record, `check_shard.py` custody/marker helpers, `composition/compose.py` replay, and Step 7 hunk handling. Read-only history identifies `926000dbd` as the consolidated checker's introduction. No replacement checker or parallel bare-pin executable patch is shipped.

## Before and after

| Measure | Before | After |
|---|---:|---:|
| Assigned rows | 263 | 263 |
| preserve-confirmed | 229 | 226 |
| repoint | 28 | 31 |
| successor-bound | 6 | 6 |
| owned-park / retire-with-source | 0 / 0 | 0 / 0 |
| Distinct prepared file patches | 16 | 42 |
| Replacement records | 28 | 67 |
| Verified `alreadyComposed` rows | 0 | 4 |
| Changed / unchanged rows | — | 73 / 190 |

The 64 patch-owning rows share **42** complete file patches; execute each file patch once. All 263 original source/evidence bindings are unchanged. Six removed-law successor bindings remain unchanged, including the disclosed non-identical opening provenance in the law carrier.

### Required checker: still blocked

The unmodified `check_shard.py` main was executed with `--shard 2`. Its report-write destination alone was redirected to an auto-cleaned tempfile because its default output is outside this assignment's writable list. No validation was changed or skipped.

| Actual checker result | Before | After |
|---|---|---|
| Exit | 1 | 1 |
| Findings | 12 conflictsWithChain + 4 duplicateOfChain + 15 staleChainEntry | 1 invalidShard + 15 staleChainEntry |
| Shard row inspection | 16 unresolved row findings | **Not reached**; do not infer zero row findings |

The after error is:

```text
patch preimage: docs/knowledge/the-fgos-gateway-http-json-api-contract-ctr010-its-scope-and/fgos-gateway-api-ctr010.md
```

`validate_shard()` requires `sourceSha256 == sha(blob(document.pin, file))` and rebuilds the diff from that bare evidence pin. L13-21.1 instead requires the strict F-chain result as the preimage. Fifteen of the 42 file preimages differ from the evidence pin. Restoring the old hashes/diffs to satisfy this check would undo the requested rebase.

Additionally, `inspect_rows()` selects replacements with original evidence ordinals, not the rebased ordinal or explicit `sourceLine`. Examples: f04479 is evidence line 661 / chain line 697; f06799 is evidence line 476 / chain line 478. It also treats any changed line in a preserved source span as an operand conflict; the five cases below demonstrate why that is overbroad.

**Needed write, not performed:** `preserve-premise/park-judgments/check_shard.py` (full repo-relative path is recorded in JSON `verification.needsWrites`). Its owner needs to validate the declared F-chain base and source-to-chain ordinal binding while retaining all custody/replay checks, compare preserved bound operands, and provide a report output option usable under exact shard scopes. Until then the required proof is **not met**. No stale-only or passing official result is claimed.

### Supplemental proof, not a substitute for that gate

Exit **0** for the separate read-only custody/replay probe:

- 263 exact IDs, group partition and disposition counts; proof/ID input digests; every original source/evidence span and successor span checked with the existing `check_span()` helper.
- 42/42 file bases strict, with exact chain IDs/input hashes; zero stale source dependencies.
- 42/42 prepared diffs reconstruct exactly from their replacement records, reach `proposedSha256`, and replay forward/reverse with `patch --batch --fuzz=0 -p1`, restoring the exact chain bytes.
- All four duplicate markers independently pass the existing `inspect_rows()` marker checks, with no parallel patch.
- Repoint operands are removed/moved and successor-bound source files are removed, using the corrected Lead rule. All 36 X1 rows plus f06461 have non-clickable lineage patches.

Every patch now declares `base.kind: F-chain`, its source commit and effective chain entry IDs. `replacements.line` is the chain-result ordinal; `sourceLine` retains the original evidence ordinal. These are explicit patch-base facts, not a waiver of the evidence pin. Pinned checker/chain input digests are in `rework.inputs`.

## Changed rows and reasons

The table enumerates all 73 changed rows. JSON `reworkNotes`, `chainReview`, and `rework.changes` retain individual details.

| Row | Change and reason |
|---|---|
| f03781 | Preserve historical Iron Law collision identities; chain line 134 changes a different explanatory link, not either 0032 operand. Record exact overlapping edit. |
| f03782 | Preserve historical multi-role collision identities; the same line-134 explanatory-link edit does not change either bound 0032 operand. |
| f03783 | Preserve the historical distribution conflict footprint on line 130; chain only retargets the explanatory link on line 134. |
| f03898 | Regenerate shared file patch on strict chain; approved architecture successor unchanged. |
| f03913 | Preserve launcher-vocabulary source on line 66; chain edits the sibling merge-block example on line 67, not this operand. |
| f03917 | Regenerate gateway-contract pointer patch on strict chain, retaining intervening chain edits. |
| f04047 | R1 / L13-21.2: banner is current framing; decision 0062 citation now targets `docs/platform/runner/decisions/h-36d872fbb0e5.md`. |
| f04271 | Rebase law pointer; approved successor unchanged. |
| f04287 | R1 / L13-21.2: same current banner locator fix as f04047. |
| f04357 | Rebase gateway-contract pointer; approved successor unchanged. |
| f04427 | Rebase runbook pointer; approved successor unchanged. |
| f04443 | Replace failed bare-pin context with strict-chain context; keep the chain's changed Supersedes text. |
| f04479 | Rebase handoff pointer from original line 661 to chain line 697. |
| f06461 | R2: preserve the architecture map's own legacy-source identity, not a self-link. L13-21.4 code-span patch; remove successor claim. |
| f06504 | L13-21.4: code-format own-source Related path; preserve lineage. |
| f06508 | Preserve canary source at line 112; chain adds an ADR0009 gloss on line 108, not a canary-source retarget. |
| f06550 | Rebase architecture-manifest pointer; approved successor unchanged. |
| f06551 | Rebase CLI I/O pointer; approved successor unchanged. |
| f06591 | L13-21.4: code-format audit own-source Related path. |
| f06697 | L13-21.4: code-format architecture-template source Related path. |
| f06699 | L13-21.4: code-format area-template source Related path. |
| f06700 | L13-21.4: code-format contract-template source Related path. |
| f06702 | L13-21.4: code-format docs-portal own-source Related path. |
| f06786 | Rebase shared Event Store patch on chain; preserve its durability/gloss edits. |
| f06787 | Rebase L7 citation onto the chain's rewritten ack sentence, without restoring old D5/D2 prose. |
| f06790 | R3: coherent tree edit, not a slash-containing root filename. Remove moved root README/governance and archived templates; show actual platform/documentation destinations. |
| f06791 | R3: same shared tree edit; place `governance.md` under `platform/`. |
| f06794 | L13-21.4: code-format governance own-source Related path. |
| f06799 | L13-21.4: source-design link becomes code spans; preserve distinct visible label and destination; rebase to chain line 478. |
| f06805 | `alreadyComposed: file:docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml`; remove duplicate patch. |
| f06808 | Same verified chain entry; no parallel x-specs patch. |
| f06817 | Same verified chain entry; remove duplicate refusal-contract patch. |
| f06821 | Same verified chain entry; remove duplicate refusal-contract patch. |
| f06823 | L13-21.4: code-format runbook own-source Related path. |
| f06833 | Rebase shared dashboard patch; preserve chain's work-state pointer edits. |
| f06835 | Rebase dashboard authorization-boundary citation on chain. |
| f06837 | L13-21.5: retain explicit gateway-yaml successor patch on chain; it is not already composed. |
| f06843 | Rebase dashboard I/O Related pointer beside the chain-repointed work-state entry. |
| f06861 | L13-21.4: source protocol link becomes code span, not successor authority. |
| f06871 | L13-21.4: host-use-cases source architecture link becomes code span. |
| f06875 | L13-21.4: invocation-kernel source architecture link becomes code span. |
| f06883 | L13-21.4: legacy-transition source link becomes code span. |
| f06900 | L13-21.4: Node/Rust migration source link becomes code span. |
| f06913 | L13-21.4: provider-routing source architecture link becomes code span. |
| f06920 | R4 / L13-21.5: change only right-hand advisory destination to `../../component-boundary.md`; literal mapping input and fenced excerpts stay unchanged. |
| f06924 | L13-21.4: release-boundaries source-plan link becomes code span. |
| f06933 | R4 / L13-21.5: same right-hand-only advisory destination repair in component-protocol. |
| f06951 | L13-21.4: legacy-payload source-transition link becomes code span. |
| f06953 | L13-21.4: operation-catalog source architecture link becomes code span. |
| f06956 | L13-21.4: request/outcome source architecture link becomes code span. |
| f07069 | L13-21.4: compatibility-harness source-plan link becomes code span. |
| f07075 | L13-21.4: R1 proof source-plan link becomes code span. |
| f07081 | L13-21.4: R2 proof source-plan link becomes code span. |
| f07084 | L13-21.4: R3 proof source-migration link becomes code span. |
| f07086 | L13-21.4: coverage-matrix standardization source becomes code spans; current coverage links untouched. |
| f07087 | L13-21.4: coverage-matrix host architecture source becomes code spans. |
| f07091 | L13-21.4: coverage-matrix external protocol source becomes code spans. |
| f07094 | L13-21.4: coverage-matrix legacy transition source becomes code spans. |
| f07097 | L13-21.4: coverage-matrix Node/Rust source becomes code spans. |
| f07098 | L13-21.4: coverage-matrix Rust plan source becomes code spans. |
| f07105 | L13-21.4: vision's preserved host architecture source becomes code spans; proof link retained. |
| f07106 | L13-21.4: vision's preserved legacy-transition source becomes code spans. |
| f07107 | L13-21.4: vision's preserved external-protocol source becomes code spans. |
| f07108 | L13-21.4: vision's preserved Node/Rust source becomes code spans. |
| f07109 | L13-21.4: vision Related source architecture link becomes code span. |
| f07110 | L13-21.4: vision Related source migration link becomes code span. |
| f07111 | Rebase intent-ledger governance pointer; approved successor unchanged. |
| f07112 | Rebase mission-decision pointer; retain the approved carried 0035 narrative/anchor. |
| f07115 | Rebase intent-ledger portal pointer; approved successor unchanged. |
| f07121 | Rebase authoring-rules governance Related pointer. |
| f07134 | Rebase placement-map instruction; governance tree patch now agrees with this live route. |
| f07135 | Rebase metadata instruction; approved successor unchanged. |
| f07205 | L13-21.4: code-format distribution baseline's own-source Related path. |

The five preserved-span findings above remain checker-owner disputes, **not resolved mechanical findings**. Changing their dispositions to silence the checker would misstate their bound operands. Exact chain before/after edits are embedded in each row's `chainReview`.

## Live-pointer scope and unchanged exceptions

- Of L13-21.5's named files, shard 2 owns `herdr-web-dashboard/spec.md` (f06837) and the two component-boundary mapping files (f06920/f06933). Their patches are included.
- `config/spec.md`, `ui-spec/architecture/screens/S03-task-detail.md`, `ui-spec/contracts/15-system-events.md`, `identity/spec.md`, and `workflow/spec.md` under `docs/platform/` have no source file in shard 2. No extra rows or patches are claimed for them.
- `packages/yaml-doc` is excluded: it is an implementation/package path, not a removed documentation authority root, and no shard-2 row binds it.
- f06698 is the already-broken history-template placeholder `../contracts/`; it is not one of the 36 removed-source X1 rows and remains unchanged. This does not certify the eventual platform link guard as green.
- No shard-3 `docs/history/` convention park was touched (L13-21.3). Source paths *inside* `docs/platform/documentation/history/templates/` above are distinct assigned shard-2 lineage rows, explicitly covered by L13-21.4.

## Stale chain entries left for the separate rebase turn

None touches a shard-2 source file or a prepared patch base. The main checker nevertheless includes all 15 globally; all have `chainEntryId: file:<path>`:

1. `.githooks/pre-commit`
2. `docs/io-contract.md`
3. `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`
4. `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md`
5. `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`
6. `docs/platform/agent-coordination/decisions/README.md`
7. `docs/platform/runner/architecture/h-69197b459754.md`
8. `docs/platform/runner/architecture/h-7af1f0242611.md`
9. `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
10. `docs/reading-map.md`
11. `plugins/fgOS/skills/terminal/SKILL.md`
12. `src/runner/dispatch/assignment-runner.mjs`
13. `src/runner/dispatch/confinement/policies.mjs`
14. `src/runner/dispatch/herdr-round.mjs`
15. `test/runner/dispatch-worker-session.test.mjs`

## Reproduce supplemental patch and custody proof

From the repository root; this prints results and writes only auto-cleaned checker scratch under `/tmp/fgos-work/`. It does **not** replace the blocked official checker:

```sh
python3 -B - <<'PY'
import importlib.util, json, pathlib
h = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments').resolve()
s = importlib.util.spec_from_file_location('c', h / 'check_shard.py')
c = importlib.util.module_from_spec(s); s.loader.exec_module(c)
d = c.load(h / 'shard-2.json'); rp = c.load_replayer()
states, findings, _ = c.replay_chain(d['rework']['sourceCommit'], rp)
patches = {}
assert [r['rowId'] for r in d['rows']] == c.load(h / 'shard-2-ids.json')['rowIds']
for row in d['rows']:
    c.check_span(d['pin'], row['source'])
    for evidence in row['evidence']: c.check_span(d['pin'], evidence)
    if 'successor' in row:
        successor = row['successor']
        c.check_span(d['pin'], successor.get('unit', successor))
        if 'sectionEvidence' in successor: c.check_span(d['pin'], successor['sectionEvidence'])
        for holder in successor.get('relatedHolders', []):
            c.check_span(d['pin'], holder['unit']); c.check_span(d['pin'], holder['sectionEvidence'])
    if 'patch' in row:
        p = row['patch']; assert patches.setdefault(p['file'], p) == p
for file, p in patches.items():
    state = states.get(file, {'text': c.blob(d['rework']['sourceCommit'], file).decode(), 'strict': True})
    assert state['strict'] and c.sha(state['text']) == p['sourceSha256']
    after = rp.apply_diff(file, state['text'], p['patch'])
    assert c.sha(after) == p['proposedSha256']
    assert c.patch_roundtrip(file, state['text'], p['patch'])['ok']
assert len(d['rows']) == 263 and len(patches) == 42
print('263 custody bindings; 42 strict-chain postimages and fuzz-zero roundtrips pass; official gate remains blocked')
PY
```

## Command/scope notes

- The before and after main-checker runs returned the nonpassing results above. An initial report-redirection wrapper mistakenly rejected the replayer's legitimate tempfile writes; it was corrected before collecting the stated baseline. A supplemental-probe marker subdocument initially omitted `pin`; that fixture was corrected and the full probe rerun successfully. Neither exploratory failure changed any checker/source file or supplies passing evidence.
- The strict-chain preparation probe initially used governance line 64 instead of 65; its assertion stopped before any shard write. The corrected tree was replayed both ways.
- `git diff --check` passes; worktree diff contains only the two assigned files. No git add/commit, fgOS CLI/lifecycle, product test, addon, source/chain/ledger/register edit, or pair accounting.
- Impact-analysis: **degraded/unqueried**; task forbids the CLI and no impact-analysis tool is exposed. No existing product symbol changed. No Markdown preview service was started under this exact write boundary.
- Scratch scripts/reports were confined to an auto-created `/tmp/fgos-work/` tempfile directory and removed at the end. The persistent evidence is the two assigned records, their pinned inputs, and the reproducible probes above.
