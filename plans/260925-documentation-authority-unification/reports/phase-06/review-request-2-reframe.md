# Yêu cầu kiểm tra độc lập: current-only reframe

**Trạng thái: ready-for-review.** Em dừng tại đây theo A15; chưa đóng batch Agent Coordination, chưa hoàn tất Phase 6. Anh cho một session reviewer khác đọc và commit các báo cáo bên dưới. Không dùng cook tự approve; không chạy seeded pack/red-team ở lần kiểm tra giới hạn này.

## Ranh giới và các pin

- Worktree duy nhất: `/home/vantt/projects/forgentX-phase00-documentation-authority-unification`, branch `plan/260925-documentation-authority-unification`.
- Quyết định: A15 `7f8d12784`; standing A14 cho mọi legacy-shape shard bị buộc modernize.
- Review trước: `f309594fd`; ok verdicts đã apply trong `54c2698ee`.
- Nguồn nguyên văn trước reframe: `54c2698ee8c5b8f1baeac7244e946c793a637d29`.
- Snapshot lịch sử: `f719eeff972f3784bfd4faf0a14f46c0eba915f9`.
- Text hiện tại: `5d2587228e1bae5bdf947ef5b5c88314736f928f` (sau `977509d5f`).
- **Receipt commit: `d870fe07f79d115c6a4bf783a386c6f1c3bd4081`.** Artifact `ledger/candidate-classifications-agent-coordination-reframe.json`.
- **Author session: `codex-session:1`.** Reviewer phải là session khác; report ghi identity thật, author session và pin tương ứng. Không sửa gate, checker, baseline, vocabulary, extractor, legacy root, AGENTS.md hay main.

## Đọc trước

1. `owner-answers.md` A15 và standing A14; `review-2final-classifications.md` để thấy 40 stale / 14 verified.
2. `reframe-verification.json`: mảng command là lệnh đầy đủ đã chạy, kể cả 937 scope và 51 test files; không thay command bằng một subset tiện hơn.
3. `reframe-current-state-evidence.json`, `reframe-preservation-proof.json`, `reframe-pilot-provenance-proof.json`, `reframe-classification-accounting.json`.
4. Portal và spec hiện tại: `docs/platform/agent-coordination/{README,spec}.md`; đối chiếu từng câu current-state với source/callsite/CLI evidence. Runner gọi `runPattern` tại `src/runner/execution/run.mjs:536-540`; Workflow gọi `runUnit` tại `src/workflow/runner.mjs:420-428`. Engine cũ đã retired trong `2180b4e72701bb090288af8fe8021008d9d42079`.

Các path không bắt đầu `docs/` trong danh sách dưới đây đều tương đối với `plans/260925-documentation-authority-unification/`.

## Phạm vi duy nhất của lần kiểm tra

| Tập | Số dòng/unit | Cách đọc | Report phải commit dưới reports/phase-06/ |
|---|---:|---|---|
| Source bindings chuyển vào history, judgment-01 | 4 | Đọc đầy đủ source và target trong `reframe-diff-s2-agent-coordination-judgment-01.md`; source claim không được mất, historical status không được hiểu là runtime hiện tại | `review-2reframe-s2-agent-coordination-judgment-01.md` |
| Source bindings chuyển vào history, judgment-02 | 33 | Như trên, `reframe-diff-s2-agent-coordination-judgment-02.md` | `review-2reframe-s2-agent-coordination-judgment-02.md` |
| IO SC-1 correction | 1 | `reframe-diff-b-io-contract.md`; đọc whole field list, không chỉ từ thay thế. Current manifest có 15 externalEffect verbs, có run, không có coordination | `review-2reframe-b-io-contract.md` |
| Overlapping b-data-dictionary | 90 | `reframe-diff-b-data-dictionary.md`: một SC-1 row thay đổi; 89 row còn lại chỉ re-confirm provenance/content theo standing A14, so equality proof. Mỗi row một verdict; không silently carry old approval | `review-2reframe-b-data-dictionary.md` |
| Current/history reverse units | 106 | `reframe-classification-reading.md` chứa toàn bộ shown text và evidence digest. Đọc wrapper của snapshot trước literal payload; kiểm tra code/command evidence và semantics từng unit | `review-2reframe-classifications.md` |
| Original stale versions moved verbatim | 40 | `reframe-move-reading.md` + `ledger/retired-engine-moves.json`: old digest/version, mọi qualifier và containment trong snapshot phải đúng | `review-2reframe-moves.md` |
| Portal identities retired by authorized rewrite | 45 | `reframe-retired-portal-reading.md` + 45 pending row mới trong `ledger/retired-unit-decisions.json`; không bỏ ID, không approve old live-engine assertions | `review-2reframe-retired-portal.md` |
| New portal/spec current-state framing | 2 documents | Đọc whole current documents, exact promoted diff và code evidence; xác nhận 14 verified receipts vẫn nguyên văn và pins không đổi | `review-2reframe-current-state.md` |

Không mở lại các row/units không đổi ngoài 89 provenance reconfirmations mà A14 bắt buộc. Không có script-exact entry mới hay exact binding bị sửa trong tập này; đây là targeted check của batch đã được review, không phải một full batch review mới. Checkpoint sensitivity packs/red-team vẫn chỉ sau Step 3, sau Step 6 và Step 10.

### Literal history không phải implementation hiện tại

Mười snapshot dưới `docs/platform/agent-coordination/history/retired-engine/` giữ nguyên toàn bộ old documents, kể cả portal đầy đủ, status cũ, proposal và qualifiers. Fence là presentation frame; body byte-identical với source commit. Reviewer chấp nhận **preservation và non-authority framing**, không chấp nhận lại việc engine cũ đang implemented. Trong native-content receipts của lịch sử, true-and-current finding nói về hành vi preservation/framing hiện tại; old present-tense assertions bên trong literal fence là dated evidence. Nếu wrapper, evidence hay cách diễn giải không chứng minh điều đó, trả rework/hold; không nới class/gate.

14 verified native-content receipts được giữ nguyên text/anchor/digest và các immutable report pins. 15 changed-frame approvals đã bị rút khỏi current references; 40 old rework versions có move accounting riêng. Current classification shard có 75 valid accepted references và 106 pending references, không có author approval mới.

## Format báo cáo và áp dụng sau review

- Bốn source-shard reports: `Claim | Verdict | Note | Source unit digest | Target unit digest`; verdict `ok`, `rework`, `hold`. Dùng digest của text reviewer thực sự thấy trong native diff pack. Native `--apply-review` chỉ apply từ committed report, không stamp digest từ một target đã đổi sau khi đọc.
- Classification report: ghi `Reviewer`, `Author session`, `Receipt commit` đúng pin trên; bảng `Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest`. Note phải nêu semantics và file:line/command evidence, không chỉ echo digest. Một verdict cho mỗi receipt.
- Move/retired reports: một verdict cho từng claim ID/version, source digest, target digest, note containment/framing. Current-state report pin blob của cả hai documents và code/command evidence cho từng current-state claim.
- Không thêm reviewedBy/reviewedAt cho rework/hold; unknown-blocking giữ blocking, các row khác giữ pending. Report phải được commit từ reviewer session khác trước khi author tiến tiếp.

## Bằng chứng đã chạy; không nhầm với closure

| Kiểm tra | Kết quả quan sát |
|---|---|
| Full D, lần lượt hai prior registries | 2/2 exit 0; zero fatal |
| Scoped D, 937 source paths, hai prior registries | 2/2 exit 0; zero fatal |
| Scoped strict E, hai prior registries | Exit 1 có chủ đích: 37 source rows chưa review, 106 reverse units, 342 identical-unit groups đã được account trước; **closure UNPROVEN** |
| `env -u CLAUDE_CODE_SESSION_ID node --test <51 explicit files>` | 912 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo |
| Native extractor + actual snapshot byte commands | 14/14 verified units, 40/40 stale units, 10/10 complete source documents preserved |
| `node scripts/check-legacy-docs-ratchet.mjs` | 995 files; 25 accounted edits; one accounted addition; clean |
| `node scripts/check-doc-constitution.mjs --no-ledger --check-placement` | 458 files; 457 matched; one existing exception; no leftovers/ambiguity/unindexed evidence |
| `node scripts/check-doc-candidate-status.mjs --json` | Same 30 inherited exact findings as committed prior proof; zero new/unaccounted findings; baseline unchanged |
| Frozen extractor/imports | 5/5 blobs unchanged |
| Commit-path allowlist | Zero violations; A3 exempts exactly its five original commit/path pairs, no later edits |

Reviewer chạy các command arrays trong `reframe-verification.json` và kiểm tra rằng không có fatal type ngoài các review-open diagnostics đã nêu. Scratch retired-row accounting phải project từ committed ledger, giữ identity registry dạng plain JSON và bind inventory bằng actual bytes/SHA256; không sửa source IDs hoặc checker. Inventory shards và scratch projection không commit. Không diễn giải exit 0 của D thành strict E hay semantic acceptance.

## Danh sách gửi anh

- Archive/delete: mười candidate snapshots, 40 original-unit moves và 45 retired portal-unit moves; không xóa/archive physical legacy source, không mất claim ID.
- Promoted edit: portal current-only rewrite, old portal nguyên văn đã giữ; exact diff `git diff 54c2698ee8c5b8f1baeac7244e946c793a637d29 HEAD -- docs/platform/agent-coordination/README.md`, log tại `promoted-edits.md`.
- Real conflicts: SC-1 theo current code; hai overlapping source bindings đợi independent verdict. Các conflict/identical receipts cũ không đổi.
- Holds: zero unknown-blocking holds mới. Không cần owner-authority decision mới.
- **UNPROVEN:** independent semantic acceptance của reframe; strict E/P6 batch closure; full npm test sau đợt docs-only này; Phase 6 completion.

**Bước tiếp theo chính xác:** reviewer session khác commit các scoped reports; author mới apply ok verdicts, giữ/rework các row chưa được chấp nhận, chạy P6/strict E scoped theo phase contract. Chỉ khi batch closure được chứng minh mới sang batch kế tiếp; checkpoint đầu tiên vẫn sau Step 3.
