# CONTEXT — chuẩn mực verify cho item sửa skill prose

Item: `tsk-4l9` (thu scope từ "xây runtime verify harness cho hành vi
dispatch của skill prose").

## Ranh giới tính năng

Trong phạm vi: viết xuống chuẩn mực đã hành nghề cho **item thay đổi nội
dung prose của một skill** (`.claude/skills/**/SKILL.md`,
`.agents/skills/**/SKILL.md`, `plugins/fgOS/skills/**/SKILL.md`) — verify
field trông như thế nào, và ai gánh phần chứng minh hành vi runtime.

Ngoài phạm vi: xây harness tự động spawn phiên LLM; sửa
`judgeVerifySemanticCorrectness`; sửa `resolveDiscovery`'s callerVerdict
fall-through (đã có item riêng — xem "Việc chuyển đi" bên dưới).

## Locked decisions

| ID | Quyết định |
|----|------------|
| D1 | `tsk-4l9` thu scope: **không** xây runtime verify harness. Giao đúng một tài liệu chuẩn-mực verify cho item sửa skill prose. |
| D2 | Chuẩn verify cho item sửa skill prose = `npm test` + assert cấu trúc **POSITIVE** (deliverable mới thật sự tồn tại) + **NEGATIVE** (pattern cũ đã biến mất). Hai vế bắt buộc cả hai — thiếu vế positive thì xoá sạch deliverable cũng pass. |
| D3 | Chủ sở hữu chứng-minh-runtime của skill prose = (a) một smoke-test how-to doc theo mẫu `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md` khi thay đổi đáng, và (b) quan sát `.fgos/events.jsonl` các lần chạy thật. **Không** phải verify field của item. |
| D4 | Nhu cầu harness bị bác bởi bằng chứng thật: 103 event `discovery caller-supplied` sau khi `tsk-31l` merge, cộng với việc smoke-test how-to đã là đúng cơ chế `tsk-4l9` mô tả (spawn phiên chạy skill trên item test cố định, assert state đổi). |
| D5 | Tài liệu đặt tại `docs/how-to/write-verify-for-a-skill-prose-change.md` — Diataxis **how-to** (người tra lúc đang viết verify), theo tiền lệ `tsk-f38` và vì `package.json`'s `files` đã ship `docs/how-to`. |

## Thuật ngữ ghim

- **skill prose** — nội dung SKILL.md do một LLM diễn giải lúc chạy, không
  phải code xác định. Không có lệnh shell tĩnh nào assert được hành vi
  runtime của nó.
- **assert cấu trúc positive/negative** — positive: deliverable mới tồn tại
  (`test -f`, `grep -q` chuỗi mới). negative: dấu vết cũ biến mất
  (`! grep -q`, `! rg -l`). Một mình vế negative luôn không đủ.
- **chủ sở hữu chứng-minh-runtime** — bên thật sự chịu trách nhiệm chứng
  minh prose chạy đúng, tách khỏi verify field.

## Bằng chứng scout

`impact-analysis: full` (`fgos tool query --capability impact-analysis
--status present` → provider `gitnexus`, status `present`).

**Cơ chế mà item gốc đòi xây — đã tồn tại.**
`docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md` (viết
2026-07-24, capture `str89-case-study-executing`): thêm item chore vứt đi
với `verify: "true"`, claim, để skill chạy thật, rồi assert trên evidence
thật trong event log (`outcome: proposed`, `attempts: 1`,
`errorClass: null`, `aheadCount: 1`). Trùng khít mô tả của `tsk-4l9`
("harness spawn 1 phiên chạy skill trên 1 item test cố định rồi assert
output/state"). `tsk-f38` đã chốt nó thành tiền lệ bằng cách đưa
`test -f docs/how-to/smoke-test-...` vào chính verify của mình.

**Hành vi runtime đã được quan sát, không phải chưa chứng minh được.**
`tsk-31l` merge `2026-08-04T06:39Z` (commit `77bcfad`). Đếm trong
`.fgos/events.jsonl` sau mốc đó: **103** event `decision` mang text
`discovery caller-supplied` — đúng đường `--verdict` native-first mà
`tsk-31l` dựng; 91 `work.discovery`; 21 `work.stage` với chuỗi
clarify→decompose→executing (`tsk-3xo`, `tsk-5y5`, `tsk-69g`, `tsk-3id`,
`tsk-2as`).

**Second-pass judge không phải noise.** Trên `tsk-f38`
(`docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md`
:107-140) nó bắt 5 lỗi verify thật qua 4 vòng: `--exclude-dir` khớp
basename-only hỏng với `.claude/worktrees/**`; thiếu loại trừ
`.fgos/events.jsonl.backup-*`; grep nội dung mù với thư mục *mang tên*
chuỗi cũ; `rg` bỏ qua hidden dir nên chưa từng quét `.claude/skills/**`;
verify chỉ assert negative nên xoá sạch cũng pass. D2 sinh ra trực tiếp
từ danh sách này.

**Tiền lệ item prose ship được bằng verify cấu trúc.** `tsk-31l`
(status `retrospective`) ship với verify thuần grep trên 3 file
`plugins/fgOS/skills/*/SKILL.md`, cộng phủ định pattern cũ. `tsk-f38`
(`retrospective`) ship với `test -f` + `grep -q` positive + `! rg -l`
negative + `npm test`.

**Giới hạn trung thực của event log.** Chứng minh tốt đường thuận (skill
chạy, item tiến stage đúng chuỗi). Không bắt được ca âm ("skill lẽ ra
phải DỪNG mà không dừng" không sinh event). Không gate được lúc merge —
quan sát post-hoc. Chấp nhận được ở nhịp ~100 lần chạy/ngày: regression
lộ trong vài giờ, blast radius là một phiên khựng, không mất dữ liệu.

**Vì sao không phải harness tự động.** `fgos setup` không cài plugin
(`src/setup/` không có tham chiếu plugin nào) — harness chạy plugin skill
(`/fgOS:discover`) trong repo mkdtemp sẽ phải tự chế phần cài plugin, dễ
trôi phiên bản. Cộng nondeterminism + chi phí token + không có trigger
buộc chạy. `tsk-4l9` tự khai `tier: light`, `risk: light`, mâu thuẫn với
quy mô hạ tầng đó.

## Tham chiếu chuẩn

- `docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md` — mẫu smoke-test
- `docs/history/rename-fgos-executing-to-fgos-coding-implement/CONTEXT.md` — nguồn 5 lỗi verify của D2
- `docs/history/discover-decompose-skill-wrapper-verdict-routing/plan.md:64` — phát biểu sớm nhất của D3, chưa được coi là câu trả lời
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` — Native-First Dispatch Doctrine
- `docs/platform-foundations.md` L5 câu 5 — DoD "changed behavior gets a matching test"; D3 là câu trả lời cho vế prose

## Việc chuyển đi / còn mở

- **`tsk-5ov`** giữ root cause thật của cơn đau đẻ ra item này:
  `resolveDiscovery`'s `callerVerdict` branch không early-return nên vẫn
  rơi vào `judgeVerifySemanticCorrectness`, trong khi nhánh `lockedContext`
  thì bỏ qua cả hai judge. Bằng chứng `tsk-f38` (judge bắt 5 lỗi thật) nói
  hướng sửa nên là **nuôi context/policy cho judge**, không phải giết
  judge — và cái judge thiếu là **policy** (chính tài liệu D5 này), không
  chỉ CONTEXT.md. Ghi lại ở đây làm đầu vào cho clarify của `tsk-5ov`;
  item này không sửa `src/intake/`.
- **`tsk-1c6`** hiện `deps: [tsk-4l9]`. Sau D1, `tsk-4l9` không còn là thứ
  chặn nó — `tsk-5ov` mới là. Đổi dep là quyết định của người, chưa thực
  hiện trong item này.
- **`tsk-wo5`** (judge subprocess timeout 120s) cùng bề mặt đau; `tsk-5ov`
  làm nó gần như moot trên đường `--verdict`.
- Nếu sau này fgOS muốn bán "test skill prose của bạn" như năng lực sản
  phẩm cho người dùng nền tảng — item lớn khác, không thuộc phạm vi này.
