# CONTEXT.md — dispatch: cơ chế kích hoạt & bàn giao

Item: `tsk-2uf` · domain: `coding`

Nguồn quyết định: `DISCUSSION.md` trong cùng thư mục (5 vòng thảo luận qua
`fgos-coding-shaping`, 2026-08-18). File này là bản khoá máy-đọc-được của
những gì §4 DISCUSSION.md đã chốt; `DISCUSSION.md#design` (§6) là bản diễn
giải đầy đủ, `#tasks` (§7) là danh mục hạng mục.

Không có vòng Socratic mới nào ở bước này: `refs` đã trỏ thẳng vào §6/§7 và
giải quyết hết gray-area, đúng như `fgos-coding-shaping` dự đoán cho một
bàn giao native-first ("expect that pass to generate few or no new
questions — that is this skill doing its job well").

## Ranh giới feature

**Trong phạm vi:** cơ chế *kích hoạt* (trigger/enforcement) và *bàn giao*
(handoff/return) của dispatch — cụ thể là cửa CLI để phát payload từ một
work item đã claim, hợp đồng mà bên thực thi phải theo, hình dạng kết quả
trả về, và việc ranh giới file có hiệu lực thật hay không.

**Ngoài phạm vi:** không đổi `decide`'s own mechanism judgment (D-ADR0033
giữ nguyên: config thắng `hasLiveTaskAccess`); không đổi `loop.mjs`'s
automated path; không đụng merge/approve gate; không thêm domain mới.

## Bằng chứng scout (đã dẫn nguồn)

| Điều | Ở đâu |
|---|---|
| `decide` có `--work <id>`, `executeExecutorCli` **không** có tham số `work` | `src/runner/dispatch.mjs:2168` vs `:1828-1843` |
| `buildPrompt` render prompt thuần từ field đã lưu trên item, gồm cả `skillPath` | `src/runner/dispatch.mjs:111-165` |
| Template dispatch bảo worker đọc `{skillPath}` **và** cấm gọi `fgos` | `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` |
| File được trỏ tới lại bảo gọi `dispatch.mjs decide` và `fgos return <id>` | `.agents/skills/fgos-coding-implement/SKILL.md` (Flow 2, Flow 5) |
| `footprintDiffHits` cờ mọi file ngoài `footprint`, **miễn trừ khi rỗng** (D5) | `src/runner/frozen-judge.mjs:69-100` |
| `normalizeChild` ép child spec self-contained lúc viết (`verify` thật + `action` trích D-ID có thật) | `src/intake/plan.mjs:175-219` |
| D-ID chỉ được đọc từ `CONTEXT.md`/`plan.md`, mục `## Locked decisions` | `src/intake/plan.mjs:50`, `extractLockedDecisionIds` |
| Chỉ MỘT điểm dispatch được ép bằng máy | `.claude/settings.json` → `PreToolUse` matcher `"Agent\|Task"` → `scripts/dispatch-decide-hook.mjs` |
| `capabilities` rỗng hoàn toàn → cửa `decide --for <purpose>` chưa ai ở | `.fgos/config.json` |
| 3 domain ngoài `coding` đều tự khai fixture, `skillMap` toàn `null`, `worktreeBacked:false`, không khai `roleGraph` | `src/state/workflow-stage-graphs.mjs:464-560` |
| Tiền lệ đặt tên coding-specific cho thân generic | `.agents/skills/fgos-coding-driving/SKILL.md` D12 + red flag D10 |
| Upstream: hợp đồng worker là file riêng, vẫn trỏ skill; cold-pickup refusal; token cố định | `/home/vantt/projects/beegog` `v2.7.0` → `packages/bee/agents/bee-build.md.tmpl` |
| Upstream: guard+prepare gom về một hàm thuần vì kiểm **cùng** một luật | `docs/knowledge/areas/hook-runtime/dispatch-guard.md` (beegog) |

**Chi phí đo được, làm nền cho toàn bộ feature:** tsk-3kl tốn ~25 tool call
+ 12m52s wall-clock để chèn 19 dòng prose mà chính phiên Claude đã viết sẵn
nguyên văn vào prompt — không lý do nào trong 4 lý do dispatch hợp lệ được
thoả, vì bàn giao quá đắt nên việc đẩy ra không hoàn vốn.

**`impact-analysis: degraded`** — `fgos tool query` báo provider `gitnexus`
`status: present`, nhưng hook trong phiên liên tục báo *"GitNexus index is
stale (last indexed: 7bb3231)"*. Theo đúng khung ba mức của `CLAUDE.md`:
present nhưng index lệch HEAD ⇒ mọi bằng chứng blast-radius phải bị đánh
dấu là yếu, không được coi là đã xác nhận. Ghi lại ở đây để người đọc sau
khỏi phải suy lại.

## Thuật ngữ đã ghim

- **driver** — phiên sở hữu vòng đời của item: claim, decide, dispatch,
  verify, return, Iron Law.
- **worker** — *người thật sự làm việc*, có thể chính là driver
  (in-process) hoặc một agent provider khác (out-of-process). Không phải
  một vai trong `roleGraph`; là một **hợp đồng**, không phải một danh tính.
- **ticket** — chính work item đã được claim. Không phải một gói prompt
  dựng riêng.
- **cold-pickup refusal** — worker tự thẩm định prompt có đủ để làm không;
  không đủ thì trả `[BLOCKED]` nêu đúng chỗ thiếu, tuyệt đối không đoán.
- **chỗ nối (seam)** — field khai ở registry theo khuôn opt-in per-domain
  của `roleGraph`: vắng mặt nghĩa là domain đó không dispatch worker.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | đẩy việc ra provider ngoài là ĐÚNG, không phải thứ cần giảm bớt -- vấn đề nằm ở cơ chế kích hoạt và cơ chế bàn giao |
| D2 | phân vai theo trí tuệ -- model mạnh làm planning + phân mảnh task với description self-contained, provider model rẻ thực thi mảnh đã chia |
| D3 | tách fgos-coding-implement thành phần driver (claim/decide/dispatch/verify/return/Iron Law) và phần worker (làm trong ranh giới, chứng minh, báo token); phiên Claude khi không dispatch cũng thi hành đúng phần worker đó, y như agy |
| D4 | hop dong worker -- cau truc tong quat (chỗ nối khai ở registry theo đúng khuôn opt-in per-domain của roleGraph), nội dung cụ thể của coding (một bản, tên coding-specific theo tiền lệ fgos-coding-driving D12) |

## Tham chiếu

- `DISCUSSION.md#design` — thiết kế đầy đủ, kèm sơ đồ so sánh hình dạng
  hôm nay với đề xuất.
- `DISCUSSION.md#tasks` — 5 hạng mục ứng viên (P1–P5) với quan hệ phụ thuộc.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — **bắt buộc đọc
  trước khi đặt `verify` cho bất kỳ hạng mục nào đụng `SKILL.md`** (P2/P3
  chắc chắn đụng): khuôn `npm test && POSITIVE && NEGATIVE`, năm cái bẫy đã
  gặp thật, và lập luận có sẵn cho vòng judge thứ hai.
- D-ADR0033 (`docs/specs/runner.md` §2312) — config thắng
  `hasLiveTaskAccess` cho executor cli-spawn-shaped. **Không mở lại**; mọi
  quyết định dưới đây tương thích với nó.
- `tsk-5tm-3` D5 — `execute` không được quyết định lại *cơ chế*. P1 kiểm
  *tính hợp lệ của lời gọi*, là việc khác.

## Outstanding questions

None
