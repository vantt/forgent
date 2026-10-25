# Retention and surviving-map check receipt

## 1. Scope and result

Input pin: `a8acd5d27d115bc1f91fb043bc9afff4ad8c1196` (HEAD at execution).
Owning instructions: [brief](../w20-g5-surviving-map-brief.md),
[W8 REWORK](../reviews/w8-lead-fixes-review.md),
[L13-10](../owner-answers.md#l13-10--g6-exhaustive-reviews-and-file-level-framing),
[G5 definition](../preflip-execution-plan.md#2-gates-met-inputs-owner-work-size-proof).

**Check exit 1, intentionally reported as failure, not a green gate.** All 10
legacy receipt spans are still byte-exact whole lines. In the surviving
`docs/reading-map.md`: 1 verbatim, 8 named restatement proposals, 1 missing.
The full output is [check-a8acd5d27.json](check-a8acd5d27.json).
[check-b726d44ed.json](check-b726d44ed.json) is unchanged historical evidence
of the legacy-only check, not evidence of this complete clause.

The missing span is `docs/platform/holder-lock/spec.md:8`: its implementation
status sentence remains at line 8 of that spec, but has no whole-line copy or
explicit proposed restatement in the surviving map. The map's component entry
is not byte-equal, and this task supplied no holder-lock restatement. The brief
says **every span** must be checked in the surviving map, so the script does not
silently exclude that tenth span. No docs change or exemption was invented.
The Lead must resolve this gap before claiming that literal all-span clause:
a documentation change or an explicit narrower target contract belongs outside
this records-only assignment. No outside-scope write is needed to deliver this
checker and honest receipt; no `needsWrites` request is made here.

The 8 proposals remain **pending owner acceptance**, not approved by the script
or this receipt. Independent review and the final-pin rerun are still required;
the gate register and owner rulings were not edited. No component-boundary change.

## 2. Reused proof and exact matching

Extended the existing `receipts`, `read`, and legacy digest/whole-line checks in
`check.py` (introduced by f2162d9ff; narrowed gate claim in 25e8842d3). Prior-art
inspection used read-only `git log -S'retentionReceipts'`,
`git log -S'entry-union-transition-banner'`, `git log -S'## 3. Transitional Note'`
and `git show f2162d9ff -- <g5/check.py>`. No earlier surviving-map check was found.

`--pin` now resolves to the full commit and reads the receipt register, both
legacy files, and the surviving map at that commit. The executing checker is
working-tree code; its `checkerSha256` is recorded in the output, independently
of the document pin. Unpinned mode still explicitly labels `working-tree@HEAD`.
Reads use bytes split only on LF: no Unicode, CRLF, whitespace, substring or
fuzzy normalization. Missing files fail closed. The recorded legacy digest is
validated before a whole-line lookup. Each explicit restatement is bound to its
legacy file, recorded line and recorded SHA256, and matches only the frozen
literal proposed text. Multi-line proposals report both start and end lines.

The seven banner spans all refer to the same exact section-3 block (lines
89–108), not seven newly authored translations. This is a proposal of the
existing English block, **not proof of semantic equivalence**: it does not repeat
the literal `Canonical:` wording, and it updates the historical completed and
unauthorized phase counts (00–02 / 03–09 versus legacy 00–01 / 02–09).
These differences remain visible in the exact old/new texts below for owner
judgment. The line-34 proposal includes not only the Truth-correction suffix,
but the changed `skillForStep` / `src/state/domain-registry.mjs` references in
place of `skillForStage` / `src/state/workflow-stage-graphs.mjs`. Nothing is
reduced to an unchecked prefix or suffix rule.

`ok` describes content checks and controls only; it never signifies acceptance.
`gateApproved` is always false. `ownerAcceptance` contains exactly the eight
rows whose surviving status is `restated`, with their exact legacy and proposed
texts. The missing holder-lock span is not disguised as a pending restatement.

## 3. Commands, exits and controls

Run from `/home/vantt/projects/forgentX-p9-w1-d1`:

```sh
P=plans/260925-documentation-authority-unification/reports/phase-09/g5
python3 -B "$P/check.py" --pin a8acd5d27d115bc1f91fb043bc9afff4ad8c1196 > "$P/check-a8acd5d27.json"
# exit 1: legacyOk=true, survivingOk=false, negativeControlsOk=true

git diff --check
# exit 0
```

The checker automatically runs 31 in-memory negative controls on the pinned
inputs: 10 legacy byte mutations, 1 verbatim surviving byte mutation, 8
restated-block byte mutations, 9 surviving-span removals, and 3 missing files.
**31/31 pass** (the targeted row is rejected and the content result fails).
Each control checks that it actually changed its input; a pre-existing red
cannot satisfy a control merely because the overall result was already red.
No mutation is written to docs or scratch.

Additional validation ran with `python3 -B` (exit **0**). Reproduce it with:

```sh
python3 -B - <<'PYTEST'
import hashlib, importlib.util, json, pathlib, subprocess
base = pathlib.Path('plans/260925-documentation-authority-unification/reports/phase-09/g5')
spec = importlib.util.spec_from_file_location('g5_check', base / 'check.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
pin = 'a8acd5d27d115bc1f91fb043bc9afff4ad8c1196'
artifact = (base / 'check-a8acd5d27.json').read_bytes()
for _ in range(2):
    run = subprocess.run(['python3', '-B', str(base / 'check.py'), '--pin', pin], capture_output=True)
    assert run.returncode == 1 and run.stdout == artifact, run.stderr
d = json.loads(artifact)
assert d['legacyOk'] and not d['survivingOk'] and not d['ok']
assert len(d['survivingMissing']) == 1
assert d['survivingMissing'][0]['file'] == 'docs/platform/holder-lock/spec.md'
assert d['negativeControlsOk'] and len(d['negativeControls']) == 31
expected = [(r['file'], r['recordedLine'], r['surviving']['text']) for r in d['rows'] if r['surviving']['status'] == 'restated']
assert expected == [(r['file'], r['recordedLine'], r['proposedText']) for r in d['ownerAcceptance']]
assert len(expected) == 8
assert all(r['status'] == 'pending-owner-acceptance' for r in d['ownerAcceptance'])
assert d['checkerSha256'] == hashlib.sha256((base / 'check.py').read_bytes()).hexdigest()
records = list(m.receipts(json.loads(m.read(m.GATES, pin))))
files = {p: m.read(p, pin) for p in dict.fromkeys([r['file'] for r in records] + [m.SURVIVOR])}
# Synthetic all-present control; not a real documentation fix or gate proof.
files[m.SURVIVOR] += b'\n' + d['survivingMissing'][0]['legacyText'].encode() + b'\n'
positive = m.check(records, files)
assert positive['ok'] and not positive['gateApproved']
controls = m.negative_controls(records, files, positive)
assert len(controls) == 33 and all(c['ok'] and c['exercised'] for c in controls)
assert m.location(b'prefix exact suffix\n', 'exact') is None
assert m.location(b'exact\r\n', 'exact') is None
assert m.location(b'exact\n', 'exact') == 1
original = pathlib.Path.read_bytes
def refuse_disk_read(self):
    raise AssertionError('pinned read unexpectedly used the working tree')
pathlib.Path.read_bytes = refuse_disk_read
try:
    for p in [m.GATES, *files]:
        assert m.read(p, pin) is not None
finally:
    pathlib.Path.read_bytes = original
history = base / 'check-b726d44ed.json'
assert history.read_bytes() == subprocess.check_output(['git', 'show', f'{pin}:{history}'])
print('PASS')
PYTEST
```

This proves two reruns byte-identical to the artifact; exact owner-list
membership; 33 rejecting controls on a synthetic **green** baseline, so rejection
cannot rely on the real holder-lock gap; whole-line/CRLF boundaries; pinned
readers independent of working-tree file reads; and byte-unchanged history.
All validation used memory only; no scratch directory was created.

Impact-analysis posture: **degraded** under the brief's no-fgOS-CLI restriction
and absence of live impact-analysis tools. Scope/caller cross-check used grep
and read-only git history; no product symbol was edited. No npm/cargo suites,
fgOS commands, native addons, audit-report.py, pair accounting, git writes,
lifecycle verbs, docs edits, ledger edits or gate-register edits were run.
Markdown preview was not launched: no preview tool is exposed, and auxiliary
registration/output outside the exact writable scope was not authorized.

## 4. Per-span table

All surviving locations below are in `docs/reading-map.md` at the input pin.

| Legacy file / recorded line | Legacy found line | Surviving status | Surviving map lines | Named proposal |
|---|---:|---|---|---|
| `docs/platform/holder-lock/spec.md:8` | 8 | missing | — | — |
| `docs/specs/reading-map.md:3` | 3 | restated | 89–108 | banner-entry-route |
| `docs/specs/reading-map.md:4` | 4 | restated | 89–108 | banner-switchboard-current-source |
| `docs/specs/reading-map.md:5` | 5 | restated | 89–108 | banner-no-inferred-authority |
| `docs/specs/reading-map.md:6` | 6 | restated | 89–108 | banner-metadata-and-snapshot |
| `docs/specs/reading-map.md:7` | 7 | restated | 89–108 | banner-snapshot-link |
| `docs/specs/reading-map.md:8` | 8 | restated | 89–108 | banner-no-promotion-and-historical-counts |
| `docs/specs/reading-map.md:9` | 9 | restated | 89–108 | banner-no-migration-authorization |
| `docs/specs/reading-map.md:34` | 34 | restated | 156 | workflow-truth-correction |
| `docs/specs/reading-map.md:37` | 37 | verbatim | 159 | — |

## 5. ownerAcceptance list (pending; exact output)

The following is copied without field changes from the check's
`ownerAcceptance` list. Shared banner text is deliberately repeated so every
span has a self-contained proposal in the owner's cutover packet.

```json
[
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 3,
    "sha256": "94cdd23d21d400397d6bfd59042d1945b1451f0a70a28b22568d7c16c42ab7cb",
    "legacyText": "> **Quy tắc chuyển tiếp hiện hành:** bắt đầu ở `docs/reading-map.md` và `docs/platform/README.md`",
    "restatement": "banner-entry-route",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 4,
    "sha256": "fb5311c374cfee920fe9c6028df70e5bae62361e5ab85d9512a35a4abaaa513b",
    "legacyText": "> (hoặc tra cứu nhanh tại `docs/transitional-switchboard.md`), rồi dùng mapping current-source tường minh của",
    "restatement": "banner-switchboard-current-source",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 5,
    "sha256": "36e46e9cf9e5c6b6b0be3ee282c20dcac71cdba9732e8ea407d1661d234db85a",
    "legacyText": "> portal area. Không suy authority từ path, ngày review, độ chi tiết, hoặc",
    "restatement": "banner-no-inferred-authority",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 6,
    "sha256": "16368141d63993234fad11e62e3e033f553e89c6b261947da4ed91ca74ae1095",
    "legacyText": "> riêng metadata `Canonical:`. Bảng kiểm chứng Phase 00 sống tại",
    "restatement": "banner-metadata-and-snapshot",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 7,
    "sha256": "daf7bc246d780bdbd8723fd344d5b764928e4755caf6862efe1e3408a3a48fe1",
    "legacyText": "> `plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md`;",
    "restatement": "banner-snapshot-link",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 8,
    "sha256": "9b75147a99731ae433b63f9d34a29f376184b662b40d78cea174d1d3437ee240",
    "legacyText": "> bảng đó không promote, migrate hay retire source nào. Phase 00 và Phase 01 đã",
    "restatement": "banner-no-promotion-and-historical-counts",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 9,
    "sha256": "6a6e9f58c9717087e1ad44290d2e2e6004c6ed750c11d2c1308e63b41a64c710",
    "legacyText": "> hoàn tất; Phase 02–09 vẫn chưa được authorize.",
    "restatement": "banner-no-migration-authorization",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 89,
    "survivingEndLine": 108,
    "proposedText": "The target structure is being introduced incrementally. When both legacy and\ntarget docs exist, **do not infer authority from path, newer date, richer prose,\nor more confident wording**. Follow the explicit current-source mapping in the\nplatform/area portal and surface any conflict. A target document marked partial\nor candidate does not outrank a declared legacy/current source merely because it\nlives under `docs/platform/**`.\n\nThe operative transitional authority switchboard is\n[transitional-switchboard.md](transitional-switchboard.md).\nThe verified Phase 00 snapshot is\n[current-authority-map-2026-09-25.md](../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md).\nIt records the explicit current route for every known area and root Markdown\nsurface; the switchboard operationalizes that route.\n\nThe full-horizon design is\n[documentation-system-unification.md](platform/proposals/documentation-system-unification.md).\nThe proposed near-term authority migration is\n[plan.md](../plans/260925-documentation-authority-unification/plan.md). Phase\n00–02 are completed; Phases 03–09 remain unauthorized, and this plan's existence\ndoes not authorize migration or cutover.",
    "status": "pending-owner-acceptance"
  },
  {
    "file": "docs/specs/reading-map.md",
    "recordedLine": 34,
    "sha256": "96a8f31e5bea9d070112c399c76d29510c6329ed47cdfc34c005ab621bc5c533",
    "legacyText": "- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStage`/`getDomain` (`src/state/workflow-stage-graphs.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn)",
    "restatement": "workflow-truth-correction",
    "survivingFile": "docs/reading-map.md",
    "survivingLine": 156,
    "survivingEndLine": 156,
    "proposedText": "- `domains/coding/AGENTS.md` `## fgOS Workflow` + `.claude/skills/` (`.agents/skills/` mirror byte-identical) — lớp hướng dẫn P50: entry skill (`fgos-routing`) + skill giai đoạn (`fgos-coding-discovering`/`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`/`fgos-coding-knowledge`) trỏ một phiên tự mở tới đúng skill theo `stage` của item; từ str89-fgos-domain-skills, tra cứu này domain-pluggable — đọc trường `domain` + `stage` của item rồi tra qua `skillForStep`/`getDomain` (`src/state/domain-registry.mjs`), không còn giả định ngầm domain `coding`; `fgos-routing` nay có hàng khoá theo **status** `retrospective → fgos-coding-knowledge` (skill tổng hợp cấp nhãn Diataxis + soạn tài liệu người-dùng-cuối) — stage `compound-learn` đã rút, việc tổng hợp nó từng canh nay là việc của status `retrospective`; skill ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã rút (tsk-6ar) — `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`) nay tự chạy clarify+classify trong cùng phiên sống, cùng việc mà skill đó từng làm nhưng trên bản mô tả SẠCH hơn; spec: docs/specs/work-state.md §RUL60 (hành vi), docs/specs/runner.md (lớp hướng dẫn) **Truth correction:** src/state/domain-registry.mjs:193,240; core/skills/fgos-routing/SKILL.md:124-136.",
    "status": "pending-owner-acceptance"
  }
]
```

## 4. Lead correction: scope of the survival clause

The brief asked for every span in the surviving map, which goes further than G5 itself. The G5 definition in [preflip-execution-plan.md](../preflip-execution-plan.md) has two parts:
- each `retentionReceipts` span is found at its own file at F;
- the reading-map entry-union record keeps the L11-25 banner and both compounding→knowledge lines.

The holder-lock span (`docs/platform/holder-lock/spec.md:8`, the L11-23 header) belongs to the first part only, and the legacy check proves it at its own file, which survives under `docs/platform/`. The Lead scoped `check.py` to match: spans whose file is not `docs/specs/reading-map.md` report `surviving.status: not-applicable`, with that reason. The surviving-map file-missing control now counts only the applicable spans.

`python3 -B check.py --pin b57e79625704b2d7a37700fc4d72dbcdd82cdf00` exits 0, and the output is [check-b57e79625.json](check-b57e79625.json):
- legacy: 10/10 spans;
- surviving map: 1 verbatim, 8 restated, 1 not applicable;
- 31 negative controls pass.

[check-a8acd5d27.json](check-a8acd5d27.json) is kept as the record of the over-broad run. The 8 restatements stay pending owner acceptance (L13-10), and `gateApproved` stays false.
