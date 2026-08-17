# CONTEXT: Chống outdate/mâu thuẫn giữa rule, decision, doc (tsk-1lv)

## Feature boundary

fgOS thiếu một cơ chế chống "doc-rot": quyết định supersede rồi nhưng
artifact nguồn không đồng bộ ngược (STR72, đã xảy ra thật); agent quét ra
quyết định cũ thay vì mới nhất; tài liệu Diataxis end-user (267 file) chỉ
được phép phình, không bao giờ được retire/reconcile theo luật hiện tại của
`fgos-coding-compounding`. Feature này đóng gói toàn bộ 3 vấn đề đó thành
một thiết kế thống nhất, dựa trên khảo cứu trực tiếp bee/beegog upstream
(scan tới v2.7.0) và scout thật trên chính codebase fgOS — không phải giả
định. Toàn bộ evidence, external research, và 15 round Q&A nằm ở
`docs/history/canonical-decision-projection/DISCUSSION.md` (nguồn đầy đủ,
CONTEXT.md này chỉ là bản đúc kết cho `fgos-coding-planning`).

**Ngoài phạm vi feature này** (đã quyết định tường minh trong DISCUSSION.md,
không lặp lại lý do ở đây): xây stored graph/daemon riêng (D2); xây
decision-store mới (D3 — `state.decisions` đã có sẵn); gate `fgos approve`
bằng bất kỳ check nào (D7 — dùng `retrospective` đã có); semantic-search
thật cho tìm-trước-khi-tạo (D12 — skeleton-match string là đủ, mirror bee);
**định nghĩa audience/area như một trục độc lập của tài liệu Diataxis (D14
— chưa tồn tại, hiện `audience` khoá cứng gieo từ quadrant theo `docs/specs/
enduser-docs-index.md` R4; đây là việc CHƯA GIẢI của `tsk-28x`, tsk-1lv chỉ
chống trùng TRONG subject-space quadrant-scoped hiện có, không tự ý mở rộng
sang audience-as-dimension).**

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | Năng lực chung cho MỌI project dùng fgOS, không chỉ dogfood nội bộ repo forgentX. |
| D2 | Không xây stored graph/daemon riêng — consistency derive tại write-time sweep + close-time door (mirror bee's R9 "No stored graph, no daemon"). |
| D3 | KHÔNG xây decision-store mới — fgOS đã có `state.decisions` (event `type:decision` trong `.fgos/events.jsonl`, port từ bee ở tsk-63c). Việc cần làm là WIRE bề mặt đọc (CONTEXT.md, docs/specs) vào đây. |
| D4 | 3 loại quyết định gốc map vào `state.decisions`: bookkeeping máy → `kind:engine` (đã có, không đổi); quyết định cấp item → `kind:design`+`id:<item-id>` (ghi đã có sẵn qua `fgos decision --id`, thiếu là CONTEXT.md render từ đây); quyết định cấp platform/repo-wide → cần THÊM field mới `scope`/`area` (chưa có). |
| D5 | Retire `docs/decisions/*.md` corpus (35 file, 1-file/quyết định kiểu Nygard) — narrative dài dồn vào `docs/specs/<area>.md` (đã tồn tại, đúng vai trò area-doc); `state.decisions` giữ record ngắn làm nguồn thật. |
| D6 | Mở rộng scope sang tầng Diataxis end-user docs (267 file: explanation/reference/how-to/tutorials, sinh bởi `fgos-coding-compounding`) — cho phép reconcile/retire prose cũ khi có capture mới mâu thuẫn (sửa luật cấm tuyệt đối hiện tại). |
| D7 | 4-door check (freshness/impact/routing/doc-deferral) + D5's narrative-sync chạy BÊN TRONG lần gọi batch hiện có của `retrospective`/`fgos-coding-compounding` (`/fgOS:retro-loop`) — cadence KHÔNG đổi, không bắt chước continuous cadence của bee. `state.decisions` vẫn ghi ngay lúc chốt. `fgos approve` KHÔNG bị gate. |
| D8 | Sửa cơ chế D6: tìm-trước-khi-tạo = doctrine (tra `authoritative_for` theo chủ đề, update-in-place) + harness backstop (check mechanical trong verify chain) — KHÔNG BAO GIỜ một hàm gate sống (mirror bee tự bỏ `scribingTarget()`, nay dead surface). |
| D9 | Phối hợp `tsk-37i`: tsk-1lv nhận mảnh 2 (ADR reversal sweep, siêu hình bởi D5) + mảnh 4 (routing door, = D7) từ tsk-37i; tsk-37i giữ mảnh 1 (khuôn citation `<ID> (<gloss>)`) + mảnh 3 (dọn ~36-69 file vi phạm). Không `deps` — scope hết overlap. |
| D10 | Đánh đổi batch-narrative-synthesis chấp nhận được: raw capture ghi ngay (không đổi); narrative trễ có giới hạn (TTL 3 ngày, `classifyStalePostDelivery` của tsk-1bl) + có phát hiện được; doctrine bắt buộc agent đọc `state.decisions`/index trước khi tin prose spec trong lúc chờ batch. |
| D11 | 4-door áp cho MỌI item trong retrospective batch, KHÔNG scope theo risk-tier — doc-rot không phân biệt tier, door là check thuần cơ học (không ceremony để giảm theo tier). |
| D12 | Cơ chế tra chủ đề (D8b) = skeleton-match chuỗi (normalize/lowercase/accent-strip/confusable-fold/punctuation-collapse, mirror bee — họ chưa bao giờ dùng semantic search thật). Triển khai dưới dạng PORT/ADAPTER swappable, mirror CTR009 executor.v1 đã có sẵn (`dispatch.mjs`) — không hardcode inline, để thay giải pháp khác sau này mà không đổi caller. |
| D13 | Cross-reference `tsk-28x` (Extensible multi-audience artifact-producer registry cho `fgos-coding-compounding`) — không `deps` cứng, mọi producer/artifact type MỚI tsk-28x đăng ký qua registry của họ PHẢI route qua check `authoritative_for` của D8, không được miễn trừ. Khai `--footprint` trùng ở cả 2 item để `fgos conflicts` bắt xung đột file cơ học. **Sửa bởi D14: quan hệ là HAI CHIỀU, không chỉ một chiều.** |
| D14 | **Sửa phạm vi D6/D8 (không đổi mục tiêu D3/D5)**: `authoritative_for` (D8) chỉ giải "trùng chủ đề TRONG một subject-space đã định nghĩa rõ" — KHÔNG mở rộng claim sang audience/area như một trục độc lập, vì trục đó CHƯA TỒN TẠI trong schema hiện tại (`docs/specs/enduser-docs-index.md` R4 khoá cứng: `audience` gieo từ quadrant, không độc lập — mọi doc cùng quadrant bắt buộc cùng audience). D6/D8 trong tsk-1lv chỉ cam kết đúng phạm vi đã chứng minh: chống trùng/reconcile trong quadrant-scoped subject-space HIỆN CÓ. Audience-as-dimension vẫn là việc CHƯA GIẢI của `tsk-28x` (điểm D+E DISCUSSION.md của họ đều "CHƯA RÕ", chưa bàn xong round 3-5 của họ) — tsk-1lv KHÔNG tự ý mở rộng để giải thay. |

## Pinned terms

- **`state.decisions`** — projection đọc từ event `type:decision` trong
  `.fgos/events.jsonl` (nguồn sự thật hợp nhất, không phải file riêng).
- **Narrative synthesis** — bước viết/reconcile prose sống trong
  `docs/specs/<area>.md`, khác với raw capture (ghi ngay) — chỉ bước này bị
  trễ theo batch retrospective (D7/D10).
- **4-door** — freshness/impact/routing/doc-deferral, mirror bee v2.7.0's
  close-gate bundle, chạy trong retrospective batch, không gate approve.
- **`authoritative_for`** — field frontmatter đánh dấu chủ sở hữu MỘT chủ đề
  (mirror bee's OKF profile), dùng bởi D8's doctrine+backstop.

## Scout paths và evidence

- Nội bộ fgOS: `src/state/store.mjs:1123` (`addDecision`), `docs/decisions/
  0000-index.md` (tay-viết, không generate), `scripts/check-decision-
  citation-drift.mjs` + `scripts/check-decision-supersession.mjs` (2 script
  detection-only, chưa CI), `docs/explanation/state-decisions-splits-
  engine-bookkeeping-from-cited-design-decisions.md` (tsk-1ud), `docs/
  explanation/why-done-split-into-delivered-retrospective-cleanup-done.md`
  (tsk-1ca, 16 D-ID + 2 lần evidence-hoá thêm bởi tsk-1q1/tsk-1bl), `.agents/
  skills/fgos-coding-compounding/SKILL.md` bước 3 (2 lỗ hổng: không tìm-
  trước-khi-tạo, cấm prune tuyệt đối).
- External: `/home/vantt/projects/beegog` (bee source repo thật, v2.7.0,
  KHÁC `docs/distillery/sources/bee.md` — file đó dừng ở v1.18.3), đọc trực
  tiếp `docs/knowledge/areas/{decision-memory,workflow-state,okf-profile}/
  *.md` — không phải distill lại, đọc nguồn thật.
- Đo thật: `find docs -iname "*.md"` = 1546 file; `docs/history/` 1157
  (không phải mục tiêu); Diataxis end-user 267 file (mục tiêu D6).
- Đối chiếu liên-item: `docs/history/self-contained-id-references/
  DISCUSSION.md` (tsk-37i, `git show fgw/tsk-37i:...`), `docs/history/
  compound-learn-artifact-registry/DISCUSSION.md` (tsk-28x).

## Impact-analysis capability gate (thông tin, không gate quyết định ở đây)

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`. Hook đồng thời báo "GitNexus index is stale (last indexed:
7bb3231)" — theo CLAUDE.md's gate, `present` không đảm bảo index tươi;
đọc là **degraded**, không phải full. `fgos-coding-exploring` không sửa code
nên posture này chỉ mang tính thông tin cho `fgos-coding-planning`/
`fgos-coding-implement` đọc lại, không tự gate gì ở bước này.

## Canonical references

- `docs/history/canonical-decision-projection/DISCUSSION.md` — nguồn đầy
  đủ, 15 round, §6 tổng hợp thiết kế kèm sơ đồ, §7 6 candidate task.
- `docs/history/self-contained-id-references/DISCUSSION.md` (tsk-37i, branch
  `fgw/tsk-37i`) — phối hợp D9.
- `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (tsk-28x)
  — cross-reference D13.

## Outstanding questions

None
