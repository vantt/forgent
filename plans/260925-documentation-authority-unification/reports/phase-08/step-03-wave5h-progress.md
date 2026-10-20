# Step 3 wave 5h — author progress

Fixed pin: `ae141550c2e022310de7a0efea757580c0b2479f`. Records-only corrections are authored in seven files. Independent review remains pending; runner owns commits. No consumer, checker/probe/resolver, prior request, owner answers, main progress or reproduction manifest is edited.

- **L12-52(1):** ten deleted-decision edges preserve: maps-j-07625, 07628, 07636, 07640, 07641, 07644, 07649, 07650, 07651, 07667. Each record names the complete exact title-matched internal narrative heading and its pinned line, with a non-executable internal-correspondence note. Successor-note requirement is waived; no self-link.
- **L12-52(2):** maps-j-07786 remains parked, now description-rewrite for duplicate wrapper Related under L12-34(4). Metadata is above the explicit source-body start at lines 24–26; literal body links are unchanged.
- **L12-53:** batch-086 gains three preserved complete Markdown links at line 40 (documentation-governance, documentation-standardization-plan) and line 44 (phase-7-completion). The verification-index sentence is removed from 468 reasons and kept only on 05219. 06921 preserves the YAML evidence citation, naming pre-rename holder `docs/history/herdr-web-dashboard/RESEARCH.md`. 06958 patches to RUL101 at `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`; pinned line 196 states all three subjects: cwd dispatch lock, resume guard, reconcile. 06620 patches to the runner operation “Cổng duyệt PR nội bộ (approval gate) — review/approve/reject”, the holder required for root twin 01325. 06642 parks as description-rewrite: no live documentation holder states the combined copyCredentialFiles/cleanup.mjs row. One neighboring shared diffHunk header (06957) follows the canonical regenerated diff. No false retirement suffix requiring extra edits was found outside docs/specs/** and docs/architect/** in these seven touched batches.

**06621 / root twin 01326:** use `docs/routing-handoff-contract.md#khung-prompt-4-phần` (“Khung prompt 4 phần”, pinned lines 10–26). The claim assigned to that target is the fgOS worker dispatch contract: Goal, Worktree boundary, Expected proof and Constraints. The surrounding one-orchestrator policy remains local coexistence text. 06621 is narrowed to this exact section; batch-126 and 01326 are untouched for Doer A to update.

**Review:** one request, `step-03-wave5h-review-request.md`, with frozen index. Seven parts (`review-a38-step-03-wave5h-p01.md` … `p07.md`), **8 files / 632 edges**. Every changed file returns for targeted re-review; batch-103 expansion adds its only not-yet-reviewed file, `operations/operator-runbook.md`. Previously reviewed unchanged spec remains covered by the supplied Lead result. Existing review reports are absent in this isolated checkout; prior membership comes from the immutable wave5e request/index and supplied L12-53 result, not invented review acceptance. Indivisible larger files stand alone and use ≤100-edge pages. Reviewers read whole pinned sources/targets and Python fields; never checker/probes. Started/accepted 0/0, reviewed denominator 0, rework pending; no set closure.

**Final verification:** unchanged full checker over **121 canonical batches / 970 files / 8,761 edges**: **12 failures**, byte-for-byte identical to the targeted seven-file failure list. **11 are the expected pending L12-52 exemptions; one additional failure is L12-53 supplemental-link scanner coverage. Zero other failures.** Parallel batches 105–113 are absent here and are not fabricated. The only inherited notClosableSet is batch-089 (06547 belongs to Doer A); this author removes the 115/117 lead-ruling parks without claiming independent set closure. Exact final receipts: `step-03-wave5h-check-result.json` and `step-03-wave5h-check-failure-index.json`.

The required “0 failures other than L12-52” criterion is **blocked**, not green: the unchanged scanner emits separate basename spans for the two line-40 sibling links and no line-44 phase-7-completion link. `author-added-search-coverage` requires exact span equality and every added id to join that scanner output; it rejects the three complete-link preserves L12-53 explicitly requires. The records retain the correct full-link spans and manual source-bound coverage receipt. **Doer A must extend the existing scanner to cover those three complete Markdown links under L12-38(5)/L12-53, in addition to its L12-52 exemptions.** No checker, probe, scan result, source tuple or required edge was altered to manufacture a pass; no extra write scope is requested.

| Check / ruling | Exact edgeId(s) |
|---|---|
| removed-decision-narrative-successor / L12-52(1) | maps-j-07625 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07628 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07636 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07640 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07641 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07644 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07649 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07650 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07651 |
| removed-decision-narrative-successor / L12-52(1) | maps-j-07667 |
| carriage-no-existence-claims / L12-52(2) | maps-j-07786 |
| author-added-search-coverage / L12-53, one file-level failure affecting three added edges | author-wave5h-source-inventory-L40C181; author-wave5h-source-inventory-L40C244; author-wave5h-source-inventory-L44C5 |

Structural replay passes: exact existing source tuples and inventory pins unchanged, all 3 new complete links bound to pinned source bytes, 8-file review hashes/pages/bounds valid, **212 protected record/control/request bindings unchanged**, `git diff --check` green. `step-03-wave5h-verification.json` records the scope and bindings. The full checker/resolver bytes match HEAD; only cache/apply scratch paths are redirected. Full npm tests, probes and runtime/default-root/writer parity are not run or claimed for this record-only correction.

Scratch only `/tmp/fgos-work/wave5h/`; tests/checks unset CLAUDE_CODE_SESSION_ID. No fgOS CLI, git writes, state/secrets/config access, service, native/global sync or independent dispatch. Mandatory atomic outbox is the brief exception. MDView MCP unavailable; preview remains for Lead. Actual-commit accounting and Step 4 source/target drift revalidation remain Lead owned. No Phase 8 close or Phase 9 authorization.

## Reproduce the unchanged full checker

Run from the worktree root. This is an invocation wrapper only: unchanged checker/resolver predicates, complete canonical record population, and scratch-only routing. It prints JSON; redirect outside the repo if desired. Do not substitute an old frozen wave manifest or omit any current batch. Reviewers never run this command.

```sh
env -u CLAUDE_CODE_SESSION_ID python3 - <<'PY_CHECK'
import sys
sys.dont_write_bytecode = True
import pathlib, importlib.util, json, types
p = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-08').resolve()
spec = importlib.util.spec_from_file_location('check', p/'step-03-check.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
real_path = pathlib.Path
m.resolver.pathlib = types.SimpleNamespace(Path=lambda value: real_path(
    '/tmp/fgos-work/wave5h/anchor-cache'
    if str(value) == '/tmp/fgos-work/step03-anchor-cache' else value))
real_temp = m.tempfile.TemporaryDirectory
def scratch_temp(*args, **kwargs):
    if str(kwargs.get('dir')) == '/tmp/fgos-work':
        kwargs['dir'] = '/tmp/fgos-work/wave5h'
    return real_temp(*args, **kwargs)
m.tempfile.TemporaryDirectory = scratch_temp
real_path('/tmp/fgos-work/wave5h').mkdir(parents=True, exist_ok=True)
m.SETS = tuple(x.stem.removeprefix('batch-') for x in
    sorted((p/'step-03-records').glob('batch-[0-9][0-9][0-9].jsonl')))
records = [json.loads(line) for b in m.SETS for line in
    (p/'step-03-records'/f'batch-{b}.jsonl').read_text().splitlines()]
result = m.Checker('ae141550c2e022310de7a0efea757580c0b2479f').all(records)
print(json.dumps(result, ensure_ascii=False, indent=2))
PY_CHECK
```
