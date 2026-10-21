# Quét lại report và plan về tối ưu luật và instruction: danh sách tham chiếu

Quét ngày 2026-10-21 10:54 (Asia/Saigon), cập nhật 11:3x với phần tổng hợp vấn đề ở ngay dưới, chỉ đọc, trên checkout `/home/vantt/projects/forgent`, nhánh `main`. Theo yêu cầu của owner: quét một lần mọi report và plan đã tạo có đề cập việc tối ưu luật và instruction, liệt kê hết vào phần tham chiếu.

## Hiểu vấn đề và các việc quan trọng cần làm

Đề xuất của em, anh đã đồng ý cách chia hai nhóm (2026-10-21). Dựa trên 161 vấn đề ở bảng bên dưới; số trong ngoặc là mã dòng của bảng đó.

### Vấn đề cốt lõi, nói đơn giản

Mọi lỗi lặp lại quy về ba nguyên nhân gốc:

1. **Luật không có một nhà.** Cùng một luật nằm ở nhiều nơi (14 nơi), do nhiều bên ghi (fgOS, AgentKit, mdview, GitNexus), nên chép trùng, lệch nhau, và không ai biết sửa ở đâu (1.1, 1.2, 1.7, 1.8, 1.10, 7.3).
2. **Luật không tới đúng người, đúng lúc.** Lead chạy theo `ak-plan` và `ak-cook` không nhận được luật "gỡ test"; mỗi CLI (Claude, Codex, omp, pi, agy) nhận luật theo đường khác nhau và có CLI không có hook; một số luật bị nạp hai lần, một số có thể bị cắt vì trần 32 KiB của Codex (2.2, 2.3, 3.2, 1.2, 1.6, 13.4).
3. **Không có máy canh và không đo hành vi, nên luật chỉ thêm mà không bớt.** Nhiều máy kiểm có nhưng rải ở 5 cửa, có cái hỏng hoặc không nối vào đâu; chưa ai đo agent có làm theo luật không (6.1, 6.2, 2.7, 5.1, 5.2). Bằng chứng mạnh nhất: lỗi "hỏi thừa" lặp lại 3 lần dù luật đang được nạp (2.4). Nghĩa là viết thêm văn xuôi không chữa được lỗi; cần **máy chặn** và **phép đo**.

Hai ràng buộc ngoài: `ak`, `ck`, `rtk` là đồ của người khác (không sửa được, Q7 chưa chốt), và kế hoạch tài liệu 260925 sắp dời đường dẫn của nhiều file luật (14.1 đến 14.3).

**Về "không bao giờ xuất hiện nữa":** không hệ thống nào bảo đảm được. Đích thực tế là: lỗi **đã biết** bị máy chặn trước khi tới agent và không quay lại được; lỗi **mới** bị phát hiện sớm nhờ nhật ký inject và phép thử hành vi; mỗi luật có **vòng đời** (nguồn gốc, hạn, bị gỡ khi đã có máy chặn thay) nên luật chỉ tốt hơn chứ không chỉ nhiều hơn (RUL104).

### Hai nhóm lớn

**Nhóm 1. Luật đang tồn tại** (nội dung sai, trùng, mâu thuẫn, trỏ tới thứ không còn, nạp trùng). Tách hai loại:

**1A. Sửa nhỏ ngay bằng tay, không đợi engine.** Mỗi việc sửa hoặc gỡ một thứ đang gây hại, không thêm tính năng.

| # | Việc | Vì sao gấp | Dòng |
|---|---|---|---|
| 1A.1 | Không commit khối AgentKit vào `AGENTS.md` khi chưa có ngân sách byte. | Cây làm việc là 46.754 byte, trần Codex 32 KiB: luật sau byte 32.768 mất mà không báo. Bản commit hiện 29.800 byte, an toàn. | 1.6, 1.2 |
| 1A.2 | Sửa mục Iron Law trong template prompt worker. | Nó trỏ file đã chuyển và bắt import đường dẫn chỉ có ở repo fgOS; worker ở project khác nhận chỉ dẫn hỏng. | 13.3 |
| 1A.3 | Dọn con trỏ chết: thông báo pre-commit, `AGENTS.md:128`, `private-cell-worktree.md` còn dạy `fgos coordination`, skill viện `docs/decisions/00xx`, tên skill `fgos-coding-compounding` đã xoá. | Agent làm theo chỉ dẫn trỏ tới thứ không còn. | 6.14, 11.15 |
| 1A.4 | Nối `check-decision-codes` vào `npm test` (làm mới baseline) hoặc gỡ hẳn. | Đang báo 374 vi phạm và không chạy ở đâu: kiểm có mà như không. | 6.2 |
| 1A.5 | Chặn `--write-baseline` nuốt vi phạm mới. | Mọi máy kiểm kiểu ratchet có thể bị tắt âm thầm. | 11.3 |
| 1A.6 | Guard thư mục mới ở gốc repo. | Guard chỉ chặn file; `engineer/` nằm ở gốc mà không bị chặn. | 6.9 |

**1B. Dọn cấu trúc, làm *qua* engine, không làm tay.** Gom bản trùng về một nhà, xoá bản chép, giải mâu thuẫn, kéo luật còn nằm ngoài sổ vào (1.1, 1.2, 1.7, 1.8, 4.1, 4.3, 12.4). Làm tay thì sẽ trôi lại và phải làm hai lần (L10: mở rộng qua cửa, không đắp cạnh cửa).

**Nhóm 2. Engine để lỗi không phát sinh lại.** Chia ba lớp, làm theo thứ tự:

**2a. Máy kiểm nhỏ nhất, làm sớm** để các sửa ở 1A không quay lại: con trỏ chết, chống trùng định nghĩa, ngân sách byte theo CLI, chống sửa tay bản render (6.1, 6.2). Tái dùng mẫu đã land: header bản render, ratchet, hook thi hành mẫu câu hỏi.

**2b. Sổ luật và bản render.** Mở rộng `core/instructions/` và bộ chiếu hiện có (xem mục "Engine đã có sẵn gì"), không dựng kho thứ ba; bản render sinh ra, không sửa tay (1.1, 14.14 đến 14.17). Có tiêu chí phân loại mới, xem bên dưới.

**2c. Điểm inject, nhật ký, đo hành vi, vòng đời.** Trục điểm inject trung lập CLI, brief do `fgos run` dựng là đường chính; nhật ký inject và khử trùng trong phiên; phép thử lead mẫu trên ít nhất hai CLI; mỗi luật có nguồn gốc, chủ, hạn; luật mới phải nói thay luật nào; gỡ luật khi đã có máy chặn (3.1, 2.7, 5.1).

#### Engine đã có sẵn gì (kết quả của R3)

Engine không phải xây từ đầu: **bộ đăng ký, bộ ghép và bộ chiếu instruction đã có từ 2026-09-14** (`src/setup/instruction-registry.mjs`, `instruction-composition.mjs`, `instruction-projections.mjs`, 1.837 dòng test, check doctor `instruction-projections-stale`), và bản thiết kế đầy đủ gọi nó là **Agent Context Engine** (proposal `documentation-system-unification.md` §4.6 và §4.7.2, RUL102 ở `docs/specs/distribution.md:362`, PF-I007). Từ 09-14 đến nay không có file nào ở các thư mục instruction bị xoá, chỉ có thêm. Nên Nhóm 2 là **mở rộng cái đang có**, theo RUL102 (một chủ ghép, không thành phần mới).

| Cần của engine | Hiện trạng | Dòng |
|---|---|---|
| Sổ luật | Có đơn vị luật; thiếu nguồn gốc, điều kiện kích hoạt, hạn dùng, máy kiểm. | 14.23 |
| Thứ tự giải xung đột | Có sẵn: `supersedes`, `refines`, `conflictsWith`, xung đột thì fail. | |
| Bản render | Có, nhưng khoá host `*`, một khối trong một file, và đang inject cả nguồn gốc của luật. | 14.15, 14.16 |
| **Domain và việc** | Contract có phạm vi `domain-<d>`, `component-<c>`; bộ ghép chỉ lọc theo chủ sở hữu và host, chưa nhận "việc"; luật domain và component chưa tới agent nào. Đây là chỗ tiêu chí domain và việc lấp vào. | 14.14, 14.17 |
| Điểm inject, ngân sách, brief theo việc | Đã thiết kế (`fgos doc context --for --stage --budget`, RUL102 có giao tĩnh và giao động); chưa có mã. | 3.1 |
| Nhật ký inject | Proposal có Context Explainability; sổ chiếu hiện chỉ ghi vết cài đặt, thiếu host, vai, ngân sách. | 14.22 |
| Máy kiểm | Mới có một dòng doctor; các nghĩa vụ của contract §11 chưa có check. | 14.20 |

**Quyết định của owner (2026-10-21): engine phục vụ cả repo fgOS và project dùng fgOS (mission #1, #2, #3).** Hệ quả: nguồn luật vào engine qua một port nguồn, không đọc cứng ba gốc của repo fgOS; adapter repo fgOS làm trước, adapter project ngoài làm theo cùng port (khuyến nghị của báo cáo `kongming-261021-1325-rule-engine-component-boundary`, câu 2). Theo gate "Install/setup/doctor" của `AGENTS.md`, nơi đặt luật của project phải đăng ký vào config-merge của `fgos setup` và registry của `fgos doctor`, và config project ghi đè config global, không giả định mức cài đặt nào.

Hệ quả cho kế hoạch: **2b nhỏ hơn dự tính** (mở rộng schema và bộ chiếu hiện có), **2c lớn hơn** (giao động theo việc chưa có mã, và là điểm inject không phụ thuộc CLI). Engine hiện chỉ chạy ở repo fgOS, project khác báo "nothing to project" (14.21). Chữ "ledger" có ít nhất bốn nghĩa trong repo và "target" trong bộ ghép là chủ sở hữu luật, không phải CLI; nên đặt tên riêng.

#### Tiêu chí phân loại luật theo domain và việc trong domain (owner thêm 2026-10-21)

Mỗi luật phải khai **luật này dành cho domain nào, và việc nào trong domain**. Bản render lọc theo hai khoá này, cộng CLI, vai và điểm inject, nên luật `debug` không bị nạp cho việc `implement`, luật marketing không bị nạp khi viết code.

Repo **đã có từ vựng này**, nên dùng lại, không đặt hình thứ ba (catalog cấm hình thứ ba):
- **Domain:** `domains/coding`, `domains/marketing`; trong từ vựng capability là `code`, `docs`, hoặc trung lập (không domain).
- **Việc trong domain:** capability dạng `domain:capability` đã đăng ký: `code:implement`, `code:test`, `code:debug`, `code:review`, `code:refactor`, `docs:write`; việc trung lập: `advise`, `execute`, `review`. Mỗi Unit chạy qua `fgos run` đã khai sẵn capability của nó, nên bộ ghép lấy "việc" từ đó.
- **Chỗ đặt luật:** `domains/<domain>/instructions/` đã có (coding có `verification-discipline.md` và `worktree-safety.md`; marketing chưa có file nào); luật trung lập (L1–L10, RUL11, RUL104) ở `core/instructions/`. Schema đã có phạm vi `domain-<d>` nhưng bộ ghép mới lọc theo chủ sở hữu và host, chưa nhận "việc" (14.17) và chưa giao luật domain ra agent (14.14).

Bốn điểm cần chốt khi thiết kế:
1. **Tên domain lệch nhau:** thư mục là `coding`, từ vựng capability là `code`; `docs` có capability nhưng không có thư mục domain. Cần một bảng ánh xạ.
2. **"Việc" là capability (implement, test, debug…) hay cả stage của skill (discovering, exploring, planning, validating…) hay cả hai.**
3. **Mặc định của luật không khai:** nên là `*` (mọi domain, mọi việc), để L1–L10 không phải khai từng việc.
4. **Hai trục có thể làm luật chồng nhau** (ví dụ luật chung và luật `code:test` cùng nói về test): cần dùng thứ tự giải xung đột đã có (hẹp hơn bổ sung, không ghi đè luật khoá).

### Quyết định cho anh, hỏi một lần

Chạy song song với cả hai nhóm, vì thiếu chúng Nhóm 2b không bắt đầu được. Gom từ 24 dòng "Chờ owner":
- **Về nhóm 1:** Q7 (quyết định 10-06 "không sửa đồ ak, ck" còn hiệu lực không; ai là nhà của `.claude/rules/*` đang trùng với `AGENTS.md`; hook đăng ký trùng; 1.10 đến 1.12, 13.9) và R4, chính sách tương thích ngược (4.2).
- **Về nhóm 2:** PF-I007 chỉ cho mở lại engine sau khi tài liệu chuẩn đã đứng vững (sau Phase 9 của kế hoạch 260925), còn RUL102 cho làm lát đầu ngay: chọn bên nào (14.6); Q4, Q5, Q6 (nguyên tắc thành luật, trần 32 KiB, danh sách luật sinh từ đâu; 1.4 đến 1.6); cổng kích thước ròng, trần doctor row, chỉ số khách ngoài thay F5 (5.1, 5.2, 5.6); ~~phạm vi sổ luật~~ **đã chốt 2026-10-21: engine phục vụ cả repo fgOS và project dùng fgOS** (14.21); có chạy A/B đo hành vi không vì tốn quota (2.4); bốn điểm của tiêu chí domain và việc ở trên.

### Thứ tự và khuyến nghị

**1A, rồi 2a, rồi (1B cùng 2b), rồi 2c.** Việc 1A nhỏ và sửa lỗi đang xảy ra nên làm trước. 2a giữ cho 1A không quay lại. 1B và 2b làm cùng nhau vì dọn luật chính là kéo luật vào sổ. 2c làm cuối vì cần sổ luật và bản render đã có. Việc 1A.3 nên làm cùng lúc với máy kiểm con trỏ chết ở 2a, để dọn xong không quay lại.

## Tổng hợp vấn đề, giải pháp và trạng thái

Tổng hợp ngày 2026-10-21 (Asia/Saigon) từ **các tài liệu ở mục Tham chiếu (nhóm A đến L) và hai file handoff, report này**. Đợt đầu: bảy agent đọc cụm A đến I (70 tài liệu dưới `plans/`). Đợt hai: ba agent đọc `docs/history/` và `docs/journals/` (cụm J, K), ba agent đọc kế hoạch Documentation Authority Unification và các tài liệu thiết kế projection (cụm L). Mỗi agent kiểm trạng thái hiện tại trên `main` (HEAD `37992ef82`) bằng `git log`, grep và đọc file, rồi em gộp các bản trùng giữa cụm: đợt đầu 117 vấn đề thô thành 90 vấn đề (mười chủ đề), đợt hai thêm 71 vấn đề mới (bốn chủ đề 11 đến 14), tổng **161 vấn đề**.

**Kết quả: 33 đã giải quyết, 57 một phần, 42 chưa giải quyết, 23 chờ owner, 6 không còn hiệu lực (161 vấn đề).**

Điều đáng chú ý nhất: phần đã xong chủ yếu là các cơ chế riêng lẻ (mẫu câu hỏi, header render, guard gốc repo, cửa `fgos convention`, luật test). Phần **chưa xong là chính luồng quản lý luật**: chưa có sổ cái và bản render, chưa có trục điểm inject, chưa có máy kiểm kích thước ròng, và một loạt quyết định đang chờ owner (D6: Q4–Q7, R4, cổng kích thước, F5).

Phát hiện mới đáng chú ý của đợt hai: (1) bộ ghép và bộ chiếu instruction đã xây từ tháng 9 nhưng chỉ giao 3 luật core; đơn vị component và domain được viết mà không tới agent nào (14.14). (2) Kế hoạch 260925 coi `AGENTS.md` là ngoài phạm vi nhưng Phase 9 dời nguồn luật và vá 331 file theo digest; sổ luật phải xếp lịch với nó (14.1 đến 14.3). (3) `docs/specs/platform-foundations.md`, nơi duy nhất giữ RUL và tường thuật D-ADR, không có hàng area-map nào và sẽ bị xoá ở Phase 9 (14.9). (4) Mục Iron Law trong prompt worker trỏ file đã chuyển và đường dẫn chỉ có ở repo fgOS (13.3). (5) Cụm chữ "rule projection" không xuất hiện nguyên văn ở đâu; thiết kế nằm ở proposal §4.6 của `documentation-system-unification.md` và hợp đồng `instruction-composition-and-projection.md`.

Quy ước đọc bảng: **Nguồn** ghi chữ cái cụm ở mục Tham chiếu cộng tên ngắn của tài liệu (ví dụ `A guardrails` là `research-261016-1118-agent-code-quality-guardrails`). Trạng thái chỉ dùng năm giá trị: Đã giải quyết, Một phần, Chưa giải quyết, Chờ owner, Không còn hiệu lực (bị thay thế hoặc bị bác). Trạng thái do agent kiểm trên repo, không tin lời tự khai của tài liệu; những chỗ chỉ dựa vào báo cáo hoặc board được ghi trong mục Chưa chắc ở cuối.

### 1. Luật rải nhiều nơi, trùng lặp và không có một nhà

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 1.1 | Luật nằm ở 14 nơi, không có nhà duy nhất; mỗi lượt Claude nạp khoảng 56 KB; "dùng lại trước khi thêm" bị chép ở 8 nơi. | Sổ cái trong `core/instructions/` cộng bản render sinh ra; kéo luật ngoài sổ vào, gom và xoá bản trùng. | **Chưa giải quyết** | A review-1008, A handoff, A guardrails | `core/instructions/` mới có 3 file; RUL11, RUL104, `.claude/rules/*` và phần viết tay của `AGENTS.md` còn ngoài sổ. |
| 1.2 | Nội dung bị nạp hai lần: GitNexus và MDView (đã sửa), còn khối AgentKit trong `AGENTS.md` trùng `.claude/rules/*` (khoảng 14–17 KB). | `CLAUDE.md` chỉ `@AGENTS.md`; gỡ bản trùng để mỗi CLI thấy mỗi luật một lần. | **Một phần** | A guardrails, A review-1008 | `40c667c83` sửa phần GitNexus và MDView; khối `AGENTKIT-OMP` (`AGENTS.md:413-778` ở cây làm việc, chưa commit) còn trùng 8 file `.claude/rules`. |
| 1.3 | Danh sách luật thiếu L9 và L10 nên luật "một cửa" không tới agent. | Chiếu đủ L1–L10 vào phần luôn nạp. | **Đã giải quyết** | A guardrails | `f9ea9c219`; `core/instructions/platform-laws.md`. |
| 1.4 | Danh sách luật vẫn viết tay, không sinh từ `docs/platform-foundations.md` và không có test chống lệch. | Generator sinh fragment trong `core/instructions/` kèm test đối chiếu (Q6). | **Chờ owner** | A guardrails, A board | Hàng D6 của board còn treo Q6; không thấy test đối chiếu trong `test/`. |
| 1.5 | Ba trong bảy nguyên tắc của owner chưa thành luật. | Khoá thành luật có decision ID, hoặc để dạng `procedure` (Q4). | **Chờ owner** | A guardrails | `design-principles` đã chiếu vào `AGENTS.md` nhưng chưa có decision ID. |
| 1.6 | `AGENTS.md` có thể vượt trần 32 KiB của Codex, luật sau byte 32.768 mất mà không báo. | Rút gọn, sắp lại, hoặc nâng `project_doc_max_bytes`; thêm ngân sách theo host vào bộ chiếu (Q5). | **Chờ owner** | A guardrails | Bản commit 29.800 byte (đạt); cây làm việc 46.754 byte vì khối AgentKit chưa commit; bộ chiếu chưa có ngân sách byte. |
| 1.7 | `AGENTS.md` có nhiều người ghi (mdview, gitnexus, bộ chiếu fgOS, khối AgentKit); "một người ghi" mới đạt cho phần viết tay. | Doctrine một người ghi (một commit tay) và kiểm PC1 chống ghi đè; chưa có cơ chế dài hạn. | **Một phần** | E single-door, A guardrails | 367 dòng khối `AGENTKIT-OMP` chưa commit nằm ngoài khối bộ chiếu; board chờ D6. |
| 1.8 | Doctrine riêng của fgOS nằm trong `.claude/rules/*`, không được git theo dõi (`.gitignore:63`) nên worktree không nạp. | Đưa luật còn thiếu vào `AGENTS.md`. | **Một phần** | B archaeologist, B synthesis, B critic | Luật chính đã vào `AGENTS.md`; `git ls-files .claude/rules` rỗng; các doctrine khác vẫn chỉ ở `.claude/rules`. |
| 1.9 | Cổng sửa văn xuôi `AGENTS.md` và skill: ai được sửa, lúc nào. | Nối vào thảo luận `docs/history/instruction-prose-change-governance/DISCUSSION.md`. | **Chưa giải quyết** | A guardrails | Mới là thảo luận vòng 1, chưa có decision ID. |
| 1.10 | Luật nằm ở bản vendor (ak, ck): quyết định 10-06 "không sửa" mâu thuẫn với việc dọn bản trùng; bộ hook trùng (11 hook, 83 cặp skill, khoảng 11k token mỗi phiên); `rtk` làm biến dạng output. | Owner chốt quyết định 10-06 còn hiệu lực không (Q7); hiện chỉ ghi nhận tác động. | **Chờ owner** | A guardrails, B synthesis, B critic | Hàng D6 (Q7); critic: 0/57 ca do mâu thuẫn ck/ak, chỉ chi phí token còn đứng vững. |
| 1.11 | fgOS và AgentKit ghi đè registration của nhau; `doctor --fix` ghi đè cấu hình tool khác; `statusLine` có thể hỏng. | Hợp đồng phân quyền sở hữu file giữa fgOS và ak; `doctor --fix` an toàn. | **Chờ owner** | A guardrails | `docs/backlog.md:25-26` (`p-7eb9e65b`, `p-68be2ae3`) vẫn `proposed`; `statusLine` chưa kiểm được trên máy này. |
| 1.12 | Catalog skill phình do bộ ngoài nạp hai lần; skill `ak-*` render không có header nguồn và không có máy kiểm. | Phase render header chỉ phủ skill fgOS; phần ak ngoài phạm vi đã chốt. | **Chờ owner** | B skill-catalog-audit, E single-door | Nhiều `ak-*` thiếu header; không thấy quyết định owner được ghi. |

### 2. Luật không tới đúng nơi và không được làm theo

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 2.1 | Luật "tìm cái đã có, thay thì xoá" không nằm trong worker contract và brief, là nơi worker thật sự đọc. | Thêm bước tìm bắt buộc vào worker contract và `fgos-coding-implement`; thêm luật "thay thế thì xoá". | **Một phần** | A guardrails | `coding-worker-contract.md:73-83`, `fgos-coding-implement/SKILL.md:75-81`; chưa có máy kiểm; mẫu brief của lead chưa thấy dấu vết. |
| 2.2 | Luật "một bằng chứng / gỡ test theo cơ chế" (`fb8c6e4ae`) không tới phase file, brief và `ak-cook`; test vẫn tăng ròng (SEAT khoảng +4.800 dòng). | Mẫu brief, mục Delete và Tests to retire ở mẫu phase, lớp "plan addendum" do fgOS sở hữu. | **Một phần** | A review-1008, C+D dq-plan | Luật đã có; phần brief của `forgentx-95` ghi "sẽ sửa"; plan addendum chưa có. |
| 2.3 | Không có đường nào cho luật tới lead chạy theo `ak-plan` và `ak-cook`, vì fgOS không được sửa các skill đó. | Mẫu brief, mẫu plan, phase file do fgOS sở hữu, hoặc plan addendum. | **Chưa giải quyết** | A handoff nhóm E, A review-1008 | Nêu như câu hỏi mở ở nhóm E của handoff, chưa quyết. |
| 2.4 | Sửa bằng văn xuôi luôn nạp không ngăn được lỗi lặp (lỗi "hỏi thừa" lặp 3 lần dù luật đang nạp); không có bộ đo hành vi và không có A/B. | Rubric đo hành vi, script chấm diff, A/B dưới các bộ instruction khác nhau; câu H5 "quyết rồi báo". | **Chờ owner** | B fatal-flaws, B synthesis | H5 đã vào `AGENTS.md` (mục ưu tiên 2); A/B tốn quota nên chờ owner duyệt; không thấy kết quả. |
| 2.5 | Tự chế lại hoặc lập kế hoạch trên tiền đề cũ khi thứ cần đã có; prior art chỉ có ở 1/8 plan. | Mục "Prior art before design" trong `AGENTS.md`. | **Một phần** | B synthesis, B critic | Chỉ là văn xuôi, chưa có cơ chế bắt; board INS lo "luật dùng lại trước khi thêm". |
| 2.6 | Brief của lead chép luật đã chết hoặc ngược luật; chỉ 1 trong 20 brief nêu cờ `--yagni`. | Một cửa sinh tên; nêu cờ phạm vi trong brief. | **Một phần** | B conditions | Quy tắc "brief nêu cờ" chỉ ở `.claude/rules/orchestration-protocol.md` (vendor, ngoài git); chưa có cơ chế kiểm brief. |
| 2.7 | Mục tiêu hành vi: luật có điều kiện kích hoạt, vòng đời và nguồn gốc, đo bằng hành vi, không phình theo thời gian. | Phép thử lead mẫu trên ít nhất hai CLI; luật mới phải nói thay luật nào. | **Chưa giải quyết** | A handoff mục 1 (5–7) | Thuộc nhóm G của handoff, chưa phiên nào nhận. |
| 2.8 | Hook của fgOS không chạy ở project khác (script và `src/` không tồn tại ngoài repo fgOS). | Chạy hook qua cửa `fgos hook`, sửa entry hỏng, doctor kiểm hook chạy được. | **Một phần** | C+D hook-install | `3ea75475d`, `src/setup/agent-hooks.mjs`; entry hỏng ở `~/projects/mdview` chưa kiểm được. |

### 3. Điểm inject và giao chỉ dẫn trên nhiều CLI

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 3.1 | Chưa ai kiểm soát luật vào agent qua đường nào và cho việc gì; chưa có trục điểm inject, ngân sách token, nhật ký inject. | Agent Context Engine (RUL102): thêm trục điểm inject, ngân sách, nhật ký, khử trùng trong phiên. | **Một phần** | A handoff nhóm E, A guardrails | RUL102 đã chốt chủ ghép (`distribution.md:362`); PF-I007 là "preserved future"; `instruction-composition.mjs` mới là hạt giống. |
| 3.2 | Bảng nạp và điểm inject theo CLI chưa đủ: Claude và Codex đã đo; agy chỉ đo hook; pi chỉ đo chỉ dẫn; omp mới có phân tích tĩnh. | Nhóm C1 (token theo CLI) và C2 (điểm inject) đo thật từng CLI. | **Một phần** | A guardrails, I mailbox-s0, I mailbox-eval-v2 | Chưa phiên nào nhận nhóm C. |
| 3.3 | Hook "người gõ prompt": Claude và Codex có `UserPromptSubmit`, agy không có; hook cũng bắn cho tin của peer với payload y hệt. | Dùng cửa sổ trượt và phân biệt qua transcript, không dùng hook làm tín hiệu. | **Một phần** | I mailbox-s0 | Ghi trong spec mailbox 5.4; chưa có code. |
| 3.4 | `codex queue` trễ 0–10 s do nhịp quét của Codex; chưa biết tiến trình nào giữ nhịp. | Sửa số trong spec thành "nhịp 10 s". | **Một phần** | I mailbox-s0 | Spec dòng 328, 368, 647; S0 còn "to do". |
| 3.5 | Chỉ dẫn peer-input được làm theo rất khác nhau giữa các CLI (ca nên làm: Claude 12/20, Codex 3/20, pi 6/10); Codex im lặng 101/180 lần; chưa đo bằng đường hook thật. | Chỉ dẫn NEW; `status` hiện mail đã giao chưa trả lời. | **Chờ owner** | I mailbox-eval-v2 | Spec 5.5 và câu 14; Implementation "Not started"; agy và omp chưa đo. |
| 3.6 | Thân tin giả khung đóng khiến Codex làm theo 10/20 (Claude 0/20, pi 0/10); chưa đo bản đã escape. | Component escape thân tin; test thân tin thù địch không được nới. | **Một phần** | I mailbox-eval-v2 | Spec dòng 298 ghi nguyên tắc; chưa có code và chưa đo lại. |
| 3.7 | Codex nuốt Enter khi brief dài được gõ rồi Enter, nên `deliver_brief` trả `DeliveryUnknown`. | Codex gửi brief qua prompt door (bracketed paste). | **Đã giải quyết** | I debug-codex | `bcc1ef758`; `codex.rs` có `submit_by_prompt_door: true`. |
| 3.8 | Pi và omp có thể dính lỗi tương tự; claude và agy vẫn gõ rồi Enter nhưng chưa có số đo. | Owner chọn CLI nào dùng prompt door. | **Một phần** | I debug-codex | `ba41f13c6` chuyển pi, omp; `claude.rs` và `agy.rs` còn `submit_by_prompt_door: false`. |
| 3.9 | Brief nhiều dòng bị TUI gập thành chip paste nên không xác nhận được đã gửi (claude, agy, pi, omp). | Nhận chip, đọc composer; mặc định `promptDelivery: inline`. | **Đã giải quyết** | I herdr-inline, I herdr-verbose | `febafe586`; `common.rs:83`; bằng chứng live 5 CLI là tự khai của plan. |
| 3.10 | omp: modal paste từ 100 dòng, thiếu `.toml` herdr và invocation `omp-herdr-vantt`. | Đặt `largeMenuThreshold: 0`, nhận diện spinner, thêm lại invocation. | **Một phần** | I herdr-inline | `febafe586`; phần `config.yml` ở `~/.omp/profiles/...` nằm ngoài repo nên không kiểm được. |
| 3.11 | Rò môi trường vào pane worker (`TERM=dumb`, `HERDR_PANE_ID`, `OMPCODE`). | Danh sách biến cần loại và `workerBaseEnv`. | **Đã giải quyết** | I herdr-inline | Plan hoàn tất cùng `febafe586`; chưa đối chiếu từng biến. |
| 3.12 | Sau `DeliveryUnknown`: `supervisor.log` rỗng, `run.json` kẹt `running`, thiếu fixture "N Enter đầu bị nuốt". | Ghi log, báo `delivery-unknown`, thêm fixture hoặc replay test. | **Chưa giải quyết** | I debug-codex | Chưa thấy trong hai commit sửa; chưa grep test nên chưa chắc. |
| 3.13 | Spec mailbox chưa ký nguyên trạng (phát hiện B1–B12: tri thức theo CLI bị chia đôi, nói thẳng với herdr, tự chế định danh tiến trình, worker `att-` thành người nhận…). | Sửa văn bản, không thêm thành phần mới. | **Một phần** | I mailbox-boundary | Spec đã sửa và G0 đã ký (`a6288916e`); code chưa viết (không có `packages/mailbox`). |
| 3.14 | Prompt door cướp focus nên nudge mailbox không dùng thẳng `deliver_brief`. | Tham số focus-neutral và `composer_state`; hoãn sang 15.8. | **Chờ owner** | I mailbox-boundary | Spec dòng 592, 608; spec còn ghi "chỉ Codex dùng prompt door" trong khi pi và omp đã chuyển. |
| 3.15 | agy chỉ tách được tin peer bằng nhãn trong chữ; typed nudge cho agy bị hoãn. | Cửa sổ trượt 10 phút. | **Chưa giải quyết** | I mailbox-s0 | Spec dòng 608; câu hỏi 3 của báo cáo S0 còn mở. |

### 4. Xung đột giữa các luật

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 4.1 | Mâu thuẫn ngầm: "Add nothing beyond the request" với RUL11 "gom tới khi hết", và câu "second consumer" trong worker contract. | Gỡ câu mâu thuẫn; lập danh sách xung đột kèm thứ tự giải (nhóm D). | **Chưa giải quyết** | A guardrails, A handoff | `coding-worker-contract.md:143`; nhóm D chưa phiên nào nhận. |
| 4.2 | R4: luật "không cần tương thích ngược" mâu thuẫn với việc cài thật trên 3 workspace và 2 máy, nên fence, drain, legacy reader mọc thêm. | Owner chốt chính sách tương thích tường minh. | **Chờ owner** | A review-1008 | Câu hỏi 3 của review chưa có trả lời. |
| 4.3 | `AGENTS.md` tự mâu thuẫn về `docs/decisions/`: L5 mục 6 còn bảo ghi quyết định vào đó trong khi corpus đã retired. | Chưa có hành động riêng. | **Một phần** | B synthesis | `AGENTS.md:74` còn câu cũ; dòng 14 và 27 đã mô tả đúng. |
| 4.4 | Hai khối hook ak/ck nói ngược nhau (ví dụ `descriptive-name`: snake_case so với kebab-case). | Không sửa vì là đồ của người khác. | **Chờ owner** | B instruction-audit, B conditions | Phụ thuộc Q7; critic không thấy ca hành vi nào do việc này. |
| 4.5 | RUL11 hiểu "gom" là giảm cửa và dòng; gom làm tăng dòng ròng thì chưa có luật chặn. | Supersede D-ADR0036; RUL104 "tốt hơn, không to hơn". | **Một phần** | C+D genesis | D-ADR0054 (`f33612119`), D-ADR0062 (`69c04f179`); chưa có máy kiểm. |

### 5. Hệ thống phình: luật chỉ thêm mà không bớt

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 5.1 | Các luật đẩy một chiều (thêm test, doctor row, CHANGELOG, spec), không luật nào bắt bớt; không có cổng kích thước ròng và ngân sách Node cho foundation (Rust +104k dòng mà Node vẫn +15,5k). | Cổng kích thước ròng trong `npm test` hoặc doctor; ngân sách Node trong spec từng component; script diff-budget. | **Chờ owner** | A review-1008, A HARDEN, C+D genesis | HARDEN `held`; `ls scripts` không có script budget hay size; câu hỏi 1–2 của review chưa trả lời. |
| 5.2 | 144 doctor row không ai gỡ; hội đồng và red-team chỉ thêm; bề mặt luật (105 RUL, board 171 KB) chỉ tăng. | Gom row theo component và đặt trần; hội đồng nộp danh sách bỏ; soát bằng `instruction-audit`. | **Chờ owner** | A review-1008 | Câu hỏi 4–6 của review chưa trả lời. |
| 5.3 | Review chỉ trả danh sách lỗi rồi biến thành phase, không có kết luận "xoá hoặc giảm phạm vi". | Mỗi review có mục "nên xoá", nhãn fix, defer, descope. | **Một phần** | C+D genesis | Plan xếp việc này là ngoài phạm vi; từ `descope` không có trong `core/instructions` và `core/skills/_shared`. |
| 5.4 | Gate nghiệm thu không đạt trong phạm vi đã khai nên agent sửa lan sang tầng khác; luật "gom tới khi hết" biến quy mô thành lý do không được dừng. | "Khung đã duyệt" (`paths:` và `budget:`); ngoài khung thì dừng và hỏi. | **Một phần** | C+D genesis, C+D dq-plan | `f33612119`, `decision-question.md:19-33`; không có máy kiểm diff so với `budget:`. |
| 5.5 | Plan bị khoá trước khi có lần chạy thật; blocker môi trường lan sang tầng khác; tự báo "xong" mà sai. | Chạy thật trước khi khoá, dừng khi blocker môi trường, kiểm caller độc lập. | **Một phần** | C+D genesis | Chỉ có phần "dừng và hỏi khi ngoài khung"; "live probe trước khi khoá" và "kiểm caller độc lập" chưa có trong luật. |
| 5.6 | Gốc tự tham chiếu: bậc F5 "self-improving" và điều kiện bỏ bee không có khách ngoài; D-ADR0035 chỉ là văn xuôi, không có metric. | Chỉ số khách ngoài; mọi thành phần runtime mới cần một lần dùng từ project ngoài fgOS. | **Chờ owner** | C+D genesis | `platform-foundations.md:27` vẫn có F5; plan 10-08 ghi rõ "không làm". |
| 5.7 | Plan con không thừa kế ngân sách của plan cha. | Trường `parent:` thừa kế ngân sách còn lại. | **Chưa giải quyết** | C+D genesis | Không thấy `parent:` trong luật. |
| 5.8 | Nhiều cơ chế song song cho một việc (3 sequencer, 2 supervisor, 9+ cách đánh giá liveness). | "One door", L10; gỡ engine L4. | **Một phần** | C+D genesis | `2180b4e72`; chưa đo các cơ chế còn lại. |
| 5.9 | Tài liệu agent-coordination nhân đôi (868 trong 937 file) cho engine đã gỡ, cộng 31,8 MB log và json bằng chứng đã commit. | Xoá hoặc lưu trữ, hàng doctor cảnh báo, giới hạn kích thước bằng chứng. | **Chưa giải quyết** | C+D genesis | Hai cây `agent-coordination` còn; 439 file `*.log` đang theo dõi; plan 10-08 ghi "không thuộc plan này". |

### 6. Máy kiểm và cưỡng chế

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 6.1 | Không có máy kiểm chống trùng định nghĩa, chủ năng lực và "đường cũ đã xoá"; tám ca trùng thật vẫn qua mọi check. | Một checker trong `npm test`; manifest có trường `owns`; primitive về tầng thấp. | **Chưa giải quyết** | A guardrails, A review-1008 | Nhóm A của INS `not-planned`; `architecture-manifest.json` không có trường owner. |
| 6.2 | Cưỡng chế rải ở 5 cửa; `check-decision-codes` exit 1 (375 vi phạm) và không chạy trong `npm test`; `check-hook-registrations-guarded` mồ côi; RUL11 chỉ có test khoá câu chữ. | Làm mới baseline rồi nối vào như kiểm clone. | **Chưa giải quyết** | B enforcement-audit, G phase-lead-test | `run-tests.mjs` không gọi; `reading-map.md:18` vẫn nói không có hook riêng; con số 375 chưa chạy lại. |
| 6.3 | Quy tắc hỏi owner rải ở 5 skill, driver, `AGENTS.md` và memory; câu hỏi thiếu nguyên nhân, giá và khuyến nghị. | Một mẫu 5 phần, validator `fgos ask`, gỡ chỗ nói trùng. | **Đã giải quyết** | C+D dq-plan | `3d3d32648`, `b33876bce`, `85f41cace`. |
| 6.4 | `AskUserQuestion` trong chat không qua cửa kiểm mẫu. | Hook `PreToolUse` cho `AskUserQuestion`. | **Đã giải quyết** | C+D dq phase-04 | `017905101`; `.claude/settings.json:149-153`. |
| 6.5 | Đồng ý mù ("ok em làm tiếp") bị ghi thành giấy phép; gate nhả với mọi câu trả lời không rỗng; hai kênh hỏi song song. | `fgos answer --approve`; bỏ `--rationale` và `--alternatives` ở `ask`. | **Đã giải quyết** | C+D dq phase-05, C+D approve-door | `02dd11f59`, `cff70a5f4`; mọi cửa (CLI, gateway, MCP) nhận cờ; chưa chạy test. |
| 6.6 | Bản render skill không có header sinh tự động; `AGENTS.md` trỏ `_shared` sai và nói "byte-identical". | Header sinh tự động trên mọi bản render fgOS; sửa con trỏ. | **Đã giải quyết** | E phase-02, E phase-06, B synthesis | Mọi `.md` skill fgOS có header; `AGENTS.md` mục Dispatch. |
| 6.7 | Doctrine thiếu năm điều: H5, cửa dev `fgos:dev`, scratch, cấm cửa hậu cho test, phần còn lại của L8. | Một commit doctrine trong phần viết tay của `AGENTS.md`. | **Đã giải quyết** | E phase-06, B synthesis | `AGENTS.md:103`, mục Scratch artifacts, L5 mục 5. |
| 6.8 | File lạ ở gốc repo (28–30 file nháp) không bị chặn. | Guard pre-commit với allowlist một nguồn; xoá 30 file sau khi owner duyệt. | **Đã giải quyết** | E phase-05, B synthesis | `.githooks/pre-commit:45-95`; `76f6d0249`; test e2e root-file-guard. |
| 6.9 | Guard gốc repo chỉ chặn file, không chặn thư mục mới. | Không có (ghi là ngoài phạm vi). | **Chưa giải quyết** | E phase-05 | `engineer/` chưa theo dõi nằm ở gốc, không bị guard. |
| 6.10 | Nhiều cửa `fgos`: binary hoặc shim cũ chạy thay bản của repo; release lệch HEAD. | Rust `fgos` là cửa chuẩn, `npm run fgos:dev`, check `active-release-matches-checkout`. | **Đã giải quyết** | B synthesis, E phase-04 | `registrations.mjs:5096-5117`; `d3c74e76b`. |
| 6.11 | Roster executor chép tay ở 3 nơi; skill nói ngược engine hoặc nói ngược nhau. | Roster lấy từ config; gỡ skill cũ; chung một playbook. | **Đã giải quyết** | B synthesis | `09fe3ab32`, `e92cfe66f`, `d74dfea58`; chưa chạy test chặn roster chép tay. |
| 6.12 | Từ vựng đã gỡ quay lại docs và skill. | Guard từ vựng chết. | **Đã giải quyết** | E journal-p5 | `test/runner/dead-vocabulary-guard.test.mjs`; chưa chạy lại. |
| 6.13 | Test doctrine không bắt được lệnh cửa cũ bị ngắt qua nhiều dòng. | Chưa có. | **Một phần** | F lane-docs-b | Hiện không có chỗ nào vi phạm; đây là lỗ hổng về độ phủ. |
| 6.14 | Con trỏ chết và tham chiếu mồ côi: pre-commit trỏ file không tồn tại, `AGENTS.md:128` ghi `src/setup/checks.mjs` (nay chỉ là shim), 22–60 file nhắc `fgos-coding-compounding` đã xoá, `private-cell-worktree.md` còn dạy `fgos coordination` đã bỏ. | Gộp sửa vào phase tương ứng; chưa có item nhận. | **Chưa giải quyết** | B skill-catalog-audit, E phase-06, F cook-cleanup | `.githooks/pre-commit:36,492,524`; `private-cell-worktree.md:38,58`; `coding-cell-policy.md:14`. |

### 7. Quy ước, tên, đường dẫn và thẩm quyền tài liệu

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 7.1 | Không có cửa sinh tên và path cho report, plan, journal; có 3 mẫu tên và brief của lead thắng. | Component `fgos convention` (name, path, check) trong pre-commit và doctor. | **Đã giải quyết** | B path-name-docs-audit, B conditions | `packages/convention/`; `AGENTS.md` mục Convention paths; `.githooks/pre-commit:430,442`. |
| 7.2 | Chỉ 3 trong 15 quy ước có nguồn và máy kiểm; 9 trong 15 không có chủ. | Mỗi quy ước một cửa cơ học. | **Một phần** | B conditions | `convention` mới phủ tên report, plan, journal; các quy ước khác chưa. |
| 7.3 | Nguồn chuẩn bị tách: 3 bản `platform-foundations.md`, 2 `reading-map`, `plan.md` ở nhiều chỗ, 302 file trùng giữa `docs/architect` và `docs/platform`; `AGENTS.md` trỏ bản cũ; 9 đường dẫn chết. | Cắt chuyển nguyên tử ở Phase 9 của kế hoạch 260925. | **Chưa giải quyết** | G doc-authority, B synthesis | Cả 5 file còn trên main; nhánh plan chưa vào main (board hàng DOC: `running`, chưa land). |
| 7.4 | Thẩm quyền chuẩn chia ở nhiều nơi; `doc-governance.md` §13 bắt chuyển từng area một. | Phase 1 lập bảng "chủ hiện hành" theo area và sửa §13. | **Một phần** | G plan-260925 | `docs/doc-governance.md:445-457`; cắt chuyển chưa làm. |
| 7.5 | Không kiểm được máy bảo toàn claim; sổ claim bị rơi có 17 mục (1 chờ khôi phục, 16 chờ xem xét). | Sổ claim, quét 1.037 file, bản vá 331 file chờ Phase 9; khôi phục qua Plan C. | **Một phần** | G plan-260925 | Board DOC (`35512e278`, `0c9ad4403`, `763568157`); chưa áp dụng byte nào; Plan C còn là bản nháp. |
| 7.6 | Cắt chuyển thiếu khoá ghi thật, rollback không phủ phần ngoài git, xoá đường dẫn cũ không có bảng bí danh, dữ liệu bằng chứng bị xoá cùng cây. | Lease ghi, rollback phủ projection và ledger, bí danh tối thiểu, chuyển sớm kèm bằng chứng consumer. | **Một phần** | G plan-260925 | Có trong thiết kế plan (§3, §7, §13); chưa chạy; chưa thấy mã lease trên main. |
| 7.7 | Skill phát cho project khác nhắc đường dẫn `docs/specs/**` và `docs/history/**` của repo này. | Kiểm kê riêng hợp đồng đường dẫn đi kèm sản phẩm. | **Một phần** | G plan-260925 | `coding-worker-contract.md:3,159,172`; khoảng 113 chỗ trong `core/skills` và `plugins/fgOS/skills`. |
| 7.8 | Sửa `AGENTS.md` và luật khoá (L5, L8) không qua cổng; Plan A, B cũng ghi `AGENTS.md` trước cắt chuyển. | Kiểm văn bản L5, L8; xếp cắt chuyển sau Plan A, B phase 06. | **Một phần** | G plan-260925 | Phần kiểm L5, L8 xong; `AGENTS.md` chưa đổi; chưa xác minh phase 06 của Plan A, B đã land. |

### 8. Luật test (luồng TEST)

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 8.1 | Luật test chỉ ép "thêm, giữ, không làm yếu", không nói một test để làm gì. | Nguyên tắc 8 "One proof", L5 mục 5, Git spec §15 E6. | **Đã giải quyết** | H counsel | `fb8c6e4ae`; `AGENTS.md:399`; `docs/platform/git/spec.md:707`. |
| 8.2 | Không ai thấy cỡ suite; `reading-map` ghi số cũ. | Dòng `suite:` so với `test/suite-baseline.json`. | **Đã giải quyết** | H counsel | `f38dfd1d0`, `4c4ecded3`; `run-tests.mjs:601-602`; `reading-map.md:11`. |
| 8.3 | Test trùng byte (59 cặp) tồn tại hai tháng không ai biết. | Chặn clone mới trong `npm test` và gỡ dần. | **Một phần** | H counsel | `knownClones` vẫn còn 59; chờ Git 07 vào main. |
| 8.4 | Test Node chép lại ca của Rust (433 test Node trong 5 port); 22 file chỉ kiểm lời văn contract. | Phase 2: mỗi port giữ một test route, gỡ bản lặp. | **Chưa giải quyết** | H counsel, H test-governance-plan | Plan còn `pending`, chưa có commit nào trên main. |
| 8.5 | Thời gian chạy dồn ở khoảng 50 file spawn CLI hoặc host. | Phase 3: tách use-case trực tiếp, giữ một test CLI mỗi verb. | **Chưa giải quyết** | H counsel | Phase 3 chưa bắt đầu; hồ sơ phase 0 đo trong sandbox, cần đo lại. |
| 8.6 | Người duyệt không có checklist về test (cái nào bị gỡ, test mới có lý do không). | Bốn dòng trong `fgos-run/SKILL.md`; vai `reviewer` trong `role-tasks.mjs`. | **Một phần** | H phase-lead-test | `fgos-run/SKILL.md:86` xong; `role-tasks.mjs` chưa. |
| 8.7 | Mỗi file test tự lập fixture (312 trong 581 file spawn, 149 tự `git init`). | Chưa có hạng mục riêng. | **Chưa giải quyết** | H counsel | Số liệu chưa đo lại. |

### 9. Doctrine và skill điều phối

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 9.1 | Doctrine thiếu `fgos run` và `--units`, còn dạy cửa cũ (`dispatch execute`, `--assignment`, `fanout-batch`). | Thêm cửa mới, gỡ cửa cũ khỏi `AGENTS.md`, skill nguồn và bản render; test doctrine. | **Đã giải quyết** | F 07a-07b, F lane-docs | `0354b6fc3`, `3658e6e43`; rg ra 0 cửa cũ. |
| 9.2 | Review docs-b nêu 5 lỗi mức Medium ở prose và test; review I17 nêu hai lỗi doctrine ở prose. | Sửa từng chỗ; chọn phương án A cho Q0 của I17. | **Đã giải quyết** | F review-docs-b, F I17 | `5308ce86d`, `8864ea596`. |
| 9.3 | I17: `code:review` luôn thắng `code:debug`; ký hiệu cột `serves` lẫn lộn. | Hoãn cho I19 và I20. | **Không còn hiệu lực** | F I17 | Cơ chế `DemandFacts` đã bị gỡ ở `6527596eb`. |
| 9.4 | Skill thành "engine điều phối thứ hai": `fgos-plan-loop` hàn cứng discipline, `group-thinking` chứa protocol loop. | Tầng discipline dạng doctrine với 9 hook slot. | **Đã giải quyết** | F audit-260919, F advisory-phase4 | `6527596eb`, `2180b4e72`; `coordination-driver.md:92-103`. |
| 9.5 | `coordination-driver.md` viết theo session cũ, không theo case và hai cửa. | Viết lại theo case. | **Đã giải quyết** | F p09-closeout | `a94115474`. |
| 9.6 | Đường chuyển doctrine, persona và context từ protocol xuống worker bị thiếu; trust model chỉ giữ khi caller tuân thủ. | Thiết kế lại ranh giới authority. | **Không còn hiệu lực** | F review-260905 | Engine bị gỡ; brief xuống worker nay qua worker contract; confinement mới chưa kiểm. |
| 9.7 | `fgos-cook` thiếu bảng đường (capability, rigor, tier, pattern, persona cho từng loại slice). | Viết sau khi Seat Binding chốt; không bịa luật rigor sang tier. | **Chờ owner** | F cook-P5 | `route-table-pending.md`; spec SEAT đã duyệt 10-20, plan đang chạy. |
| 9.8 | Settle của conductor case không ghi milestone; `fgos-cook` chạy tuần tự, chưa thử trên plan thật. | Luồng D sửa; nới ra khi Git G3 land. | **Một phần** | F cook-P5 | Luồng D merge 10-20 nhưng chưa active; skill đã merge (`c93f2ea93`), chưa active. |
| 9.9 | Phase 08 của case ledger để ba câu mở; còn ba hàng backlog đóng cổng. | Để owner quyết. | **Chờ owner** | F p09-closeout | Báo cáo p09, mục "Open questions"; chưa đối chiếu `docs/backlog.md`. |

### 10. Ngoài trọng tâm nhưng được nêu

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 10.1 | Lỗi sản phẩm lẻ: regenerate baseline xoá khoảng 785 dòng, claim file rỗng làm cơ chế kiểm không chạy, test không hermetic. | Work item riêng, không phải việc của cuộc điều tra. | **Một phần** | B synthesis | Test hermetic: `fa7d05f39`; hai lỗi còn lại chưa kiểm. |
| 10.2 | Phiên song song trên checkout chung làm mất file, đổi nhánh (12 ca). | Tạm gác, ngoài phạm vi RUL11. | **Chưa giải quyết** | B synthesis | Có việc hạ tầng liên quan nhưng không ai nối với 12 ca này. |
| 10.3 | Lỗi do năng lực model hoặc công cụ ngoài. | Ngoài tầm can thiệp của harness. | **Không còn hiệu lực** | B synthesis | Synthesis xếp vào "Ngoài". |

### 11. Prose skill, trích dẫn trần và chuẩn verify

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 11.1 | Trích dẫn ID trần (ADR, RUL, D) không tự đứng được; D-local trích ngoài nhà vi phạm quyết định 0017. | Khuôn `<ID> (gloss)` ở `core/skills/_shared/citation-format.md`, máy kiểm trong `check-decision-citation-drift.mjs`, baseline ratchet, dọn hàng loạt. | **Một phần** | J self-contained-id-references, J tsk-2sp, J skill-prose-cleanup | Baseline giảm từ 1.679 xuống 205 mục (180 `d-local-outside-home`, 25 `bare-citation`, 38 file skill); `platform-foundations.md` còn 0 (`b8fbf0864`). |
| 11.2 | Bề mặt quét trích dẫn không gồm các file luật luôn nạp: `AGENTS.md` có 8 trích dẫn trần (dòng 17, 29, 145, 157), `domains/coding/AGENTS.md` có 1. | Chưa có; tsk-12v chỉ thêm `.agents/skills`. | **Chưa giải quyết** | J tsk-12v, J self-contained-id-references | `scripts/check-decision-citation-drift.mjs:321` liệt kê `docs, src, plugins, core/skills, domains, .agents/skills`. |
| 11.3 | `--write-baseline` ghi đè vô điều kiện nên nuốt luôn vi phạm mới mà không báo. | Gợi ý cho nó từ chối hoặc cảnh báo khi có vi phạm không giải thích được bằng dịch dòng. | **Chưa giải quyết** | J tsk-3x8 | `check-decision-citation-drift.mjs:469-480`; tái chụp baseline là việc thường làm (`d788f4d0b`). |
| 11.4 | Baseline ratchet khoá theo số dòng (chèn một dòng ra 64 vi phạm giả) và bỏ sót khoá trùng nội dung. | Khoá theo nội dung dòng, đếm số lần dùng khoá, `Object.create(null)`. | **Đã giải quyết** | J tsk-3x8, J tsk-6at | `check-decision-citation-drift.mjs:186-216`; `04da5fd88`; chạy ra "no findings". |
| 11.5 | Skill dài quá chuẩn 300 dòng kéo cả skill vào ngữ cảnh mỗi lượt; không có máy kiểm ngưỡng. | Tách `SKILL.md` ngắn cộng `references/*.md`. | **Một phần** | J skill-prose-cleanup | Phần lớn đã tách; `fgos-coding-driving` 310 dòng và `fgos-fanout` 309 dòng vẫn vượt. |
| 11.6 | Cùng một khối bash "fgos CLI fallback" bị chép y hệt trong 23 skill wrapper. | Gom về `_shared/fgos-cli-fallback.md`. | **Đã giải quyết** | J skill-prose-cleanup | 23 wrapper trong `plugins/fgOS/skills/` trỏ về file `_shared`. |
| 11.7 | Sửa văn xuôi skill không có chuẩn verify: `npm test` xanh mù với prose, event log không bắt ca âm. | How-to hai vế (positive và negative), chứng minh runtime bằng smoke-test cộng `events.jsonl`. | **Một phần** | J skill-prose-verify-standard, J discover-stage-graph-and-skill-layering | How-to ở `docs/knowledge/` (`0c32f3433`); chỉ hai file reference trỏ tới, `AGENTS.md` không nhắc. |
| 11.8 | Luật "chờ thông báo của harness, đừng dùng `ScheduleWakeup`" chỉ nói điều cấm, thiếu hành động bắt buộc "kết thúc lượt" ở fragment dispatch chung. | Thêm hành động "end the turn" ở bốn nơi. | **Một phần** | J tsk-3f9k | Có ở `wave-dispatch-mechanics.md:53`, `return-mechanics.md:9`; `executor-dispatch-fallback.md:114-117` vẫn chỉ cấm. |
| 11.9 | Luật "tự làm, đừng giao Agent hoặc Task ngẫu hứng" (tsk-29i) có ở bốn skill stage nhưng là đoạn chữ gần giống nhau lặp lại thay vì trỏ vào fragment. | Quyết định giữ luật `tsk-29i`; không bàn gom. | **Một phần** | J fgos-stage-skills-task-delegation-audit, J fanout-and-delegation-rubric | `fgos-coding-exploring/SKILL.md:46-51`, `fgos-coding-planning/SKILL.md:49`, `fgos-coding-validating/SKILL.md:57`, `fgos-clarifying/SKILL.md:96`. |
| 11.10 | Hợp đồng bằng chứng Iron Law: người làm ghi, người merge đọc. | Producer trong skill implement, consumer trong merge-loop; không tự acknowledge. | **Đã giải quyết** | J tsk-5t3-iron-law-evidence-contract | `verify-commit-and-iron-law.md`; `merge-loop/SKILL.md:92-104`. |
| 11.11 | Iron Law bắn nhầm theo từ khoá trong mô tả khi diff chỉ có tài liệu. | Ghi giải thích false positive, không sửa bộ phân loại. | **Chưa giải quyết** | J context-md-enforcement-scope | `src/evolve/iron-law.mjs:88-90` so mọi từ trong mô tả với `HEAVY_KEYWORDS`. |
| 11.12 | `CONTEXT.md` (nơi ghi lý do quyết định) không bị ép: chỉ 36% item có (đo 08-02). | Cổng cứng chặn `clarify` rồi `executing` và `decompose` rồi `executing` khi có trigger. | **Chưa giải quyết** | J context-md-enforcement-scope | Quyết định đã khoá, mã chưa viết; `src/intake/discovery.mjs` chỉ đọc khi có. |
| 11.13 | Việc con từ decompose chạy không có chỉ dẫn (chỉ title, refs, verify). | Thêm `action` và `read_first`, `action` bắt buộc trích một D-ID. | **Đã giải quyết** | J tsk-3xd-decompose-child-directive-prose | `src/intake/plan.mjs:164-186`; `f9636527e`. |
| 11.14 | Doctrine dispatch cũ (`dispatch execute`, `capacities.<id>`, `needs`, fragment `capacity-dispatch-fallback`) đã bị thay. | Các quyết định thời đó; sau đó thay bằng `fgos run`, `--units`, `bind()`. | **Không còn hiệu lực** | J task-dispatch-unification, J dispatch-contract-agents-md, J native-first-dispatch-doctrine-phase-4 | `5cf4fd52f`; `test/docs/run-doors-doctrine.test.mjs:51-58` chặn cửa cũ quay lại; `AGENTS.md` mục Dispatch. |
| 11.15 | `AGENTS.md` im lặng về dispatch và delegation, nên luật chỉ nằm sau các skill. | Viết mục Dispatch vào `AGENTS.md` kèm hook `PreToolUse` cho Agent hoặc Task. | **Đã giải quyết** | J dispatch-contract-agents-md, J dispatch-decide-scope-raw-tool-calls | `0354b6fc3`, `3658e6e43`; `executor-dispatch-fallback.md:53-58` nêu rõ lời gọi công cụ thô không thuộc `decide`. |
| 11.16 | Tên stage và skill đã gỡ còn trong spec, how-to, `docs/backlog.md` (4 dòng), 2 file `docs/explanation/`, `doc-registry`; `work-state.md` còn 24 lần "clarify". | Bảng viết lại dùng chung; doctor check đối chiếu tên stage với `stages` thật. | **Một phần** | J spec-docs-lifecycle-realignment, J discover-stage-graph-and-skill-layering | `AGENTS.md`, `CLAUDE.md`, `core`, `domains` sạch; không có check đối chiếu trong `src/setup/`. |
| 11.17 | Skill còn viện `docs/decisions/00xx-*.md` (decision 0026 ở `executor-dispatch-fallback.md:311` và hai chỗ nữa) trong khi kho đó đã retired. | Chưa có. | **Chưa giải quyết** | J native-first-dispatch-doctrine-phase-4, J dispatch-decide-scope-raw-tool-calls | `docs/decisions/` chỉ còn `index.md` sau `4722361ae`. |
| 11.18 | Con trỏ theo số dòng vào `docs/decisions/index.md` ("dòng 28–32") đã lệch vì index là bản sinh. | Thay con trỏ số dòng bằng mã ADR. | **Một phần** | J orchestrator-vocabulary-disambiguation-pointer | Banner ở `orchestrator-worker-slots/DISCUSSION.md` dòng 3 và `reading-map.md:16`; chuỗi ADR0026–0031 nay ở dòng 33–37. |

### 12. Quyết định, RUL11 và ranh giới sứ mệnh

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 12.1 | Quyết định bị supersede mà nguồn không đồng bộ ngược, agent đọc quyết định cũ (sự cố STR72). | Kho `state.decisions`, `--relation` bắt buộc, index sinh tự động, gỡ corpus `docs/decisions/*.md`, bốn cửa kiểm. | **Đã giải quyết** | J canonical-decision-projection | `4722361ae`, `a670be686`; `docs/decisions/index.md` là bản sinh. |
| 12.2 | RUL11 phải là luật luôn nạp chứ không chỉ khẩu hiệu: câu neo, test khoá chữ. | Dòng RUL11 ở spec, câu neo trên một dòng riêng trong `AGENTS.md`, test khoá chữ. | **Đã giải quyết** | J rul11-tum-lum-doctrine-anchor, J tsk-3uw4-rul11-citation-gloss | `AGENTS.md:155`; `b63ab155f`; 23 ca `test/docs/*` đã chạy pass. |
| 12.3 | RUL9 đòi mỗi luật nạp mọi lượt có neo kiểm tự động, nhưng chỉ RUL11, RUL104 và một dòng `fgos convention` có. | Plan chỉ mở khuôn, không bổ sung RUL1 đến RUL10. | **Chưa giải quyết** | J rul11-tum-lum-doctrine-anchor | `test/docs/` chỉ có `rul11-`, `rul104-anchor-phrase` và `agents-doctrine-anchors`; mục ranh giới sứ mệnh không có neo. |
| 12.4 | Mã `RUL11` không duy nhất: có ở bốn spec với nghĩa khác nhau (tùm lum, `doctor --fix`, tiến hoá schema…), dễ trích nhầm. | Gắn nhãn trong ngoặc; chọn số 104 cho luật sau để tránh trùng. | **Một phần** | J rul11-tum-lum-doctrine-anchor, J close-distribution-spec-doctor-fix | `platform-foundations.md:74`, `work-state.md:1203`, `runner.md:973`, `distribution.md:294`; không có máy kiểm trùng số. |
| 12.5 | Agent trong repo fgOS coi tự phát triển fgOS (mission #3) là trung tâm. | D-ADR0035 và mục luôn nạp trong `AGENTS.md`; khoá cấu hình `mission` chưa xây. | **Một phần** | J fgos-mission-boundary | `AGENTS.md:29-36`; `b2444f3d2`; không có khoá `mission` trong `src/setup` (đã có ở 5.6). |
| 12.6 | Doctrine chuyên coding lẫn trong `AGENTS.md` gốc, vô nghĩa với domain khác. | Chuyển sang `domains/coding/AGENTS.md`; `fgos-routing` đọc khi domain đã resolve. | **Một phần** | J core-foundation-domain-boundary | `07c4a5205`; khối GitNexus quay lại gốc ở `dbaa3fe03` và còn một bản cũ ở `domains/coding/AGENTS.md:47`. |
| 12.7 | Luật cấm sửa, rút gọn prose cũ của skill compounding gây phình tài liệu; thiếu bước tìm trước khi tạo. | Cho phép reconcile; `authoritative_for` so khớp skeleton; doctrine cộng backstop cơ học. | **Một phần** | J canonical-decision-projection | Backstop: `src/report/authoritative-match.mjs`, `registrations.mjs:137`; doctrine "tra trước khi tạo" không còn trong skill. |
| 12.8 | Chính sách supersede quyết định: bản ghi mới, không sửa tại chỗ; hai bản thay hai phần thì `superseded_by` là danh sách. | `superseded_by: [0028, 0029]`. | **Đã giải quyết** | J tsk-5wf-decision-doc-0029-supersede-0026-vocabulary | `docs/decisions/index.md:33`. |
| 12.9 | Lộ trình gom 8 file lớn theo mức đau chưa có việc con nào; các file lớn còn tăng. | Lập từng việc con theo thứ tự. | **Chưa giải quyết** | J codebase-scatter-consolidation-roadmap | `bin/fgos.mjs` 4.215 nay 5.236 dòng; `registrations.mjs` 2.071 nay 6.686; `29e9f3ec5` chỉ là báo cáo. |
| 12.10 | `authoritative_for` chỉ chống trùng trong một subject-space; trục audience chưa tồn tại. | Chuyển cho `tsk-28x`. | **Không còn hiệu lực** | J canonical-decision-projection | `tsk-28x` đã land registry nhiều audience (`5c948d2a4`). |

### 13. Đưa chỉ dẫn vào agent: prompt worker, hook, skill phát đi, từ vựng

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 13.1 | Prompt worker không chỉ tới `plan.md` và `CONTEXT.md` của item. | Biến `docsRefPointer` trong template. | **Đã giải quyết** | J dispatch-prompt-docsref-pointer | `f1643e391`; `work-compat.mjs:146,171`. |
| 13.2 | Prompt worker không dạy chứng cứ Iron Law đúng thời điểm, và không nói thẳng `[DONE]` hay `[BLOCKED]`. | Mục `# Iron Law evidence` và `# How to finish` trong cả 3 template. | **Đã giải quyết** | J worker-prompt-iron-law-evidence-timing, J worker-prompt-inline-completion-signal | `cbf5c39a7`, `3f1e26f4a`. |
| 13.3 | Mục Iron Law trong template worker trỏ file đã chuyển sang `docs/knowledge/` và bắt `import ./src/evolve/iron-law.mjs`, đường dẫn chỉ có trong repo fgOS. | Chưa có. | **Chưa giải quyết** | J worker-prompt-iron-law-evidence-timing | `docs/how-to/produce-failing-test-first-proof-...` không còn (`989d0c7fa`); template được chọn cho mọi project có domain `coding`; chưa chạy ở project ngoài. |
| 13.4 | Template worker không chứa con trỏ nào tới `AGENTS.md` hay luật "dùng lại trước khi thêm"; chuỗi chỉ dẫn vẫn qua 3 hop (wrapper, bản lắp, `coding-worker-contract.md`). | Chỉ lặp lại nội dung duy nhất đã từng không tới nơi. | **Một phần** | J worker-prompt-inline-completion-signal | grep `AGENTS` hoặc `One door` trong 3 template ra 0 hit (liên quan 2.1, 2.2). |
| 13.5 | Hai hệ template song song cho prompt worker: `src/runner/prompt-templates/*.txt` qua `work-compat.mjs` và `operation-prompt-templates.mjs` nhiều tầng. | Chưa có. | **Chưa giải quyết** | J worker-prompt-inline-completion-signal | Cả hai còn được gọi (`assignment.mjs`, `work-compat.mjs`); chưa biết `fgos run` hiện dùng đường nào. |
| 13.6 | Prompt của judge verify đòi bằng chứng sau triển khai ở giai đoạn trước triển khai. | Khối ngữ cảnh stage. | **Không còn hiệu lực** | J tsk-3jy | `794df20e0` đã xoá `judge-executor.mjs`. |
| 13.7 | Hook pre-commit có sẵn nhưng không ai bật; `core.hooksPath` tuyệt đối làm doctor báo sai. | Check `doctor`, `setup` điền `core.hooksPath`, so đường dẫn đã resolve. | **Đã giải quyết** | K hook-reachability-tsk-3w8, J main-checkout-hook-wired-absolute-path | `registrations.mjs:1594`; `git-hooks.mjs:15-21`; `e691cc118`. |
| 13.8 | Hook chỉ bảo vệ khi đã wired; CI chạy `git commit` trần vẫn không được bảo vệ. | `doctor --enforce` hoặc cổng CI, hoãn tới khi có bằng chứng. | **Chờ owner** | K hook-reachability-tsk-3w8 | Không thấy `--enforce` hay cổng CI. |
| 13.9 | `.claude/settings.json` chưa commit có 57 mục hook (HEAD là 24); 22 trong 28 cặp (sự kiện, script) đăng ký hơn một lần. | Phân quyền sở hữu file giữa fgOS và ak; hook fgOS đi qua cửa `fgos hook`. | **Một phần** | J claude-code-hook-spawn-enoent, A guardrails | Đã có phần liên quan ở 1.10, 1.11, 2.8; số đếm mới đọc từ cây làm việc. |
| 13.10 | Runbook nhận diện lỗi hook `posix_spawn '/bin/sh'` không có trên main. | `docs/how-to/recognize-a-claude-code-hook-spawn-enoent-failure.md`. | **Chưa giải quyết** | J claude-code-hook-spawn-enoent | File không tồn tại; chỉ các commit migrate docs nhắc tên. |
| 13.11 | Dev-skill lồng hai cấp nên tool `Skill` không thấy; dev-skill không tới project chỉ cài plugin; skill plugin gọi cứng `bin/fgos.mjs`. | Làm phẳng thư mục; bản sinh vào `plugins/fgOS/skills/`; thứ tự local rồi PATH rồi lỗi rõ. | **Đã giải quyết** | J fgos-skill-discovery-gap, J plugin-skill-packaging-audit, J fgos-plugin-dev-skill-packaging-gap, J plugin-skill-cli-path-fallback | `1e14290`; `registrations.mjs:3429` (`plugin-dev-skills-packaged`), `:3362` (`plugin-skill-cli-reachable`); ca session do mdview tạo chưa có bằng chứng tái hiện. |
| 13.12 | `fgos-routing` (skill nạp đầu tiên) dạy sai bảng route; frontmatter `description` còn nói stage đã chết. | Sửa bảng và mô tả. | **Một phần** | J discover-stage-graph-and-skill-layering | Bảng route đã đúng (`fgos-routing/SKILL.md:142-145`); mô tả của `cook` và các wrapper khác chưa kiểm hết. |
| 13.13 | Không có bất biến "item mở phải ở stage còn đăng ký" và không có check đối chiếu tên stage giữa spec và `stages` thật. | Check `no-open-item-at-unregistered-stage`. | **Một phần** | J discover-stage-graph-and-skill-layering | Nguồn sự thật của pool đã sửa (`discover-pool.mjs:25-32`); check B3 không có trong `src/setup/`. |
| 13.14 | Wrapper `/fgOS:discover`, `/fgOS:plan` gọi verb mù thay vì đi qua skill sống của session; đường interactive thiếu `--tier`, `--kind`, `--risk`. | Điều phối qua `fgos-coding-driving`, session tự đưa `--verdict`; thêm cờ. | **Đã giải quyết** | J discover-decompose-skill-wrapper-verdict-routing, J caller-verdict-protocol-discover-decompose | `plugins/fgOS/skills/discover/SKILL.md:7,20`; `794df20e0`; `discovery.mjs:186-191`. |
| 13.15 | Nhắc "không `git checkout` thẳng nhánh làm việc trên main checkout" chỉ nằm ở prose của `pick` và `cook`. | Câu nhắc trong `SKILL.md`; check `doctor` để sau. | **Một phần** | K main-checkout-direct-branch-checkout-tsk-4hk | `plugins/fgOS/skills/pick/SKILL.md:104`; chỉ có `.githooks/pre-commit`, không có hook chặn checkout. |
| 13.16 | Bài học của các journal (hàm phục hồi phá hủy phải fail-closed; gate có người trả lời phải chạy end-to-end) chưa thành luật. | Thêm vào `docs/platform-foundations.md` hoặc ADR. | **Chưa giải quyết** | K lifecycle-sync-gates, K worktree-reclaim-data-loss-tsk-1os | grep "fail closed" trong `docs/platform-foundations.md` ra 0. |
| 13.17 | Từ vựng đổi nghĩa giữa chừng ("orchestrator", "capacity" và "capability", `PaneOrchestrator`) mà không có chú giải ở nơi người đọc vào. | Banner, con trỏ ở `reading-map`, mục từ vựng hiện hành trong `runner.md`. | **Một phần** | J orchestrator-vocabulary-disambiguation-pointer, J current-dispatch-vocabulary-overlay, J herdr-orchestrator-terminology-boundary | `runner.md:1300` đã có; bản `docs/architect/dispatch-control-plane-redesign.md` và bản `docs/platform/...` lệch nhau (0 hit `PaneOrchestrator` ở bản cũ). |
| 13.18 | Guard cấm từ "orchestrator" đã gỡ nên không còn allowlist cơ học chặn rename mù; guard từ vựng chết chỉ khoá symbol tier và placement. | Chỉ văn xuôi. | **Chưa giải quyết** | J herdr-orchestrator-terminology-boundary | `270aa5ad` gỡ guard; `dead-vocabulary-guard.test.mjs` không khoá `rootTask`, `subTask`, `errand`. |
| 13.19 | Từ vựng dispatch trôi (`rootTask`, `capacity`, `needs`, `errand`); tên `dispatch.mjs` hứa rộng hơn thứ nó làm. | Khoá 18 D-ID từ vựng; tách `dispatch.mjs`. | **Một phần** | J dispatch-concept-boundary | Mô hình cũ bị thay bằng executor và capability (D-ADR0034, `4270c0c0d`); `f7850e2e0` tách module. |

### 14. Kế hoạch 260925 và sổ luật: chồng lấn thiết kế

| # | Vấn đề | Giải pháp đã nêu | Trạng thái | Nguồn | Bằng chứng |
|---|---|---|---|---|---|
| 14.1 | Cắt chuyển dời nguồn luật: `docs/platform-foundations.md` và `docs/architecture-manifest.json` bị `platform-laws.md` (10 neo) và `instruction-registry.mjs:458` đọc; bản chiếu nằm ngoài git nên test không bắt neo cũ. | Phase 8 soạn trước chữ thay thế; Phase 9 áp rồi sinh lại khối chiếu. | **Một phần** | L current-authority-map, L phase-08-draft, L independent-frontier-review | `area-map-root-authorities.md:7,14`; plan còn ghi L1–L8 trong khi main là L1–L10 (`platform-laws.md:15`). |
| 14.2 | Bản vá Phase 8 khoá theo digest của từng file nguồn: sửa song song một dòng làm cả bản vá của file đó thành drift; quá 10% entry lệch thì phase dừng. | Đề xuất lại và review lại phần lệch; merge main vào nhánh định kỳ. | **Chưa giải quyết** | L phase-08-draft | `phase-08-draft.md:178,226`; board đã merge main 3 lần trong ngày 10-20. |
| 14.3 | Phạm vi khoá ghi lúc cắt chuyển không phủ `core/instructions`, `components/*/instructions`, `domains/*/instructions`, `src/setup/instruction-*`, `.fgos/instructions/effective`; trong cửa sổ đó sổ luật sửa được nhưng bản render `AGENTS.md` không sinh lại được. | Chưa có. | **Chưa giải quyết** | L cutover-write-lease-design | `cutover-write-lease-design.md:21,58,158`; trên main không có mã lease. |
| 14.4 | Plan DOC không có chỗ cho "luật" như một loại thẩm quyền: hiến pháp có 24 loại tài liệu nhưng không có loại instruction; thứ tự giải xung đột của hiến pháp (tài liệu) khác thứ tự của bộ ghép (law, boundary, procedure, preference). | Hoãn vào Agent Context Engine (PF-I007). | **Chưa giải quyết** | L minimum-constitution, L area-map-closing-instructions | `area-map-closing-instructions.md:9-10` đặt `AGENTS.md`, `CLAUDE.md` là `reclassify-out-of-platform-scope`. |
| 14.5 | Hợp đồng schema instruction nằm trong `docs/platform/packaging-distribution/**` là vùng DOC đang chuyển; mở rộng schema là sửa file này và gặp xung đột khi nhánh DOC merge main. | Chưa có. | **Chưa giải quyết** | L phase-08-draft, L instruction-composition contract | Điều kiện dừng 6 của draft: xung đột chạm `docs/platform/**` hoặc từ 10 file. |
| 14.6 | PF-I007 đặt điều kiện mở lại là sau cắt chuyển (corpus chuẩn và đồ thị tối thiểu), còn RUL102 và handoff muốn làm lát đầu ngay. | Proposal §9.4 cho phép nguyên mẫu nếu không thành thẩm quyền thứ hai; ledger yêu cầu ghi "must not preclude". | **Chờ owner** | L intent-preservation-ledger, L RUL102 | `intent-preservation-ledger.md:71`; `distribution.md:362`. |
| 14.7 | Ghi quyết định mới vào `docs/specs/distribution.md` là sửa legacy root: mỗi lần phải ghi ngoại lệ ratchet và làm hàng đã review bị stale. | Ghi ngoại lệ tay mỗi lần sync; chế độ `--record` bị hoãn. | **Một phần** | L plan-260925 | `scripts/check-legacy-docs-ratchet.exceptions.json`; `--record` chưa có. |
| 14.8 | Nguồn gốc luật (D-ADR, RUL) sống ở "Lịch sử quyết định" của `docs/specs/<area>.md`; cắt chuyển xoá các file này và `check-decision-citation-drift.mjs:428` đọc thư mục cũ. | Khuyến nghị `docs/platform/<area>/decisions/`, giữ `docs/decisions/index.md` là bản sinh. | **Chờ owner** | L open-questions | Câu hỏi Q7-2; alias table đang rỗng tới Phase 9. |
| 14.9 | `docs/specs/platform-foundations.md` (RUL1–RUL104, tường thuật D-ADR0035, 0036, 0054, 0061, 0062) không có hàng area-map nào; switchboard ghi nó là "non-authority projection"; Phase 9 xoá cả `docs/specs/**`; ba test ghim câu luật vào đường dẫn này. | Chưa có. | **Chưa giải quyết** | L transitional-switchboard, L consumer-survey | `transitional-switchboard.json:47-54`; `grep -c RUL11` cho 0 ở `docs/platform-foundations.md` và 19 ở bản spec; `rul104-anchor-phrase.test.mjs:12-27`. |
| 14.10 | Gộp hoặc xoá một tiêu đề trong `AGENTS.md` làm mất claim id và cần một quyết định `supersede`, `partial-carry` hoặc `unknown-blocking`. | Luật chung A13 trong lượt review kế. | **Một phần** | L phase-06-owner-answers | `owner-answers.md:65`; `progress.md:157-164`. |
| 14.11 | Từ vựng plan DOC đóng băng: kind `normative-law` ghi "L1–L8" và không có kind cho RUL hay instruction. | Chỉ thêm kiểu 2.x qua quyết định owner. | **Chờ owner** | L claim-and-disposition-vocabulary | `claim-and-disposition-vocabulary.json:291`. |
| 14.12 | Khối chiếu trong `AGENTS.md` được setup chép sang project khác kèm đường dẫn của repo này (đã chết sẵn); không có cờ nào đánh dấu luật nào dành cho project khác. | Q8-5: sửa như mọi consumer khác. | **Chờ owner** | L consumer-survey | `consumer-survey.md` §4.1; chưa đọc được câu trả lời Q8-5. |
| 14.13 | Bộ công cụ của plan DOC (ratchet, lease, `consumer-rewrites`, bộ giải bí danh) chỉ có trên nhánh; sửa luật trên main không bị chặn, chỉ tính lại ở mỗi lần sync. 45 slot "park" trong 890 slot chưa quyết. | Quyết định F hoãn đẩy ratchet lên main. | **Chờ owner** | L plan-260925, L phase-08-draft | `ls scripts` không có ratchet hay `consumer-rewrites`; board dòng 172. |
| 14.14 | Đơn vị component và domain được viết nhưng không tới agent nào: tập hiệu lực chỉ có `repo` (3 luật core); `composeAllInstructionSets` không có caller ngoài file của nó. | Contract §9 hứa `domain-<d>` và `component-<c>`; chưa có đường giao. | **Chưa giải quyết** | L instruction-composition contract | `registrations.mjs:3796-3815` chỉ gọi target `repo`; `docs-only-verification` và `coding-worktree-safety` chỉ có trong contract, nguồn và test (grep, chưa dùng GitNexus). |
| 14.15 | Bộ chiếu từ chối mọi host khác `*` và chỉ cho một khối quản lý trong một file; lát cắt theo CLI chưa có chỗ đứng. | Contract §10: adapter "khi có nhu cầu". | **Một phần** | L instruction-composition contract | `UNSUPPORTED_PROJECTION_HOST` (test dòng 333); `spliceManagedProjection` ném lỗi khi có hơn một cặp marker. |
| 14.16 | Bản render đang inject chính phần nguồn gốc (tiêu đề, id, nguồn, mô tả của từng luật), trái mục tiêu không inject nguồn gốc. | Chưa có. | **Chưa giải quyết** | L instruction-composition contract | `renderRule`; khối đang chạy ở `AGENTS.md:321-411`. |
| 14.17 | Schema nhận scope `command`, `skill`, `session` nhưng bộ ghép chỉ lọc theo owner và host; không có đầu vào "việc đang làm" nên chưa chọn luật theo việc hay theo vai được. | Proposal §4.6 dòng 543-547. | **Chưa giải quyết** | L instruction-composition contract | `unitBelongsToTarget`, `unitAppliesToHost` (`composition.mjs:149-158`). |
| 14.18 | RUL102 tự lệch nhẹ: một câu nói engine tính "ngân sách theo host", câu khác nói engine không biết host hay file; mã hạt giống đã nhận `host`. | Chốt engine chỉ nhận host làm tham số và ngân sách. | **Chờ owner** | L RUL102 | `distribution.md:362` so với `composition.mjs:213-217`. |
| 14.19 | Hợp đồng §4 tự mâu thuẫn: bảng cho "locked platform law document" làm nguồn luật, đoạn văn lại cấm `docs/**`; `platform-laws.md` neo vào `docs/platform-foundations.md` mà Phase 9 sẽ dời. | Sinh fragment trong `core/instructions/` bằng generator kèm test (Q6). | **Một phần** | L instruction-composition contract | `contract` dòng 54-68; `plan.md:254`; liên quan 1.4. |
| 14.20 | Doctor chỉ có một dòng `instruction-projections-stale` cho tất cả; nghĩa vụ §11 (adapter bỏ sót luật, vượt ngân sách, nạp đúng một lần, canary) chưa có check. | Guardrails đề xuất ba mục bổ sung. | **Chưa giải quyết** | L instruction-composition contract, A guardrails | `registrations.mjs:3873`. |
| 14.21 | Check và fix chỉ chạy khi có `core/instructions` ở main checkout; project khác báo "nothing to project": cơ chế chỉ vận hành ở repo fgOS (mission #3), chưa có đường cho project dùng fgOS có sổ luật riêng (mission #1, #2). | Chưa có. | **Chưa giải quyết** | L instruction-composition contract | `registrations.mjs:3827,3856`. Owner chốt 2026-10-21: engine phục vụ cả repo fgOS và project dùng fgOS; chưa có mã. |
| 14.22 | Projection ledger ghi `runtime: local-fgos` là hằng số, không có host, vai, ngân sách; contract §12 muốn danh tính runtime và digest nguồn. | Chưa có. | **Một phần** | L projection-ledger | `computeInstructionProjection`, trường `runtime`; ledger ghi "Partial". |
| 14.23 | Không trường nào ghi "vì sao có luật" (sự cố hoặc quyết định sinh ra luật): contract §9 chỉ có `sources` (đường dẫn file) và `supersessionDecision` cho luật bị thay. | Chưa có. | **Chưa giải quyết** | L instruction-composition contract | `compileInstructionUnit`, các trường cố định. |
| 14.24 | Tài liệu thiết kế lệch trạng thái: proposal §4.6 còn ghi effective set chỉ có `platform-laws` (thực tế 3 luật); contract rà soát 09-14, `projection-ledger.md` 09-18, chưa nhắc RUL102. | Chưa có. | **Chưa giải quyết** | L instruction-composition contract, L documentation-system-unification | `repo.json` có 3 luật. |

### Đối chiếu với thiết kế nhóm E của handoff

Phần này gộp từ ba agent đọc kế hoạch 260925 và các tài liệu thiết kế projection (R1 đọc plan và phase, R2 đọc ledger, pilot, reports, R3 đọc hợp đồng composition và code `src/setup/instruction-*`). Prior art: từ 2026-09-14 đến nay không có file nào ở các thư mục instruction bị xoá, chỉ có thêm; hạt giống (registry, composition, projections) có trước kế hoạch 260925 và độc lập với nó.

**Khớp và tái dùng được**

1. **Hợp đồng bộ ghép và bộ chiếu đã có.** Đơn vị luật có `id`, `owner`, `scope`, `kind`, `mode`, `appliesTo`, `specificity`, `dependsOn`, `refines`, `supersedes`, `conflictsWith`, `renderHints` (contract §5); thứ tự law, boundary, procedure, preference và xung đột thì fail (§6, §8); tập hiệu lực JSON có nguồn (§9); doctor `instruction-projections-stale` (§11). Sổ cái của handoff là mở rộng cộng thêm vào cùng schema này, không cần kho thứ ba; thứ tự giải xung đột đã có sẵn.
2. **Proposal §4.6 và §4.7.2 là bản thiết kế sẵn:** thang L0 đến L4, gói theo việc với phạm vi, host, id nguồn, digest, ngân sách, phần bị bỏ kèm link, fail closed khi xung đột, "degrade by depth, not by arbitrary truncation" (lời giải cho trần 32 KiB của Codex), và Context Explainability tương ứng nhật ký inject.
3. **RUL102 đã có hai thời điểm giao:** giao tĩnh qua file chiếu và giao động (runner xin gói context đưa vào brief worker, không ghi file). Giao động chính là điểm inject chung không phụ thuộc CLI mà handoff nhận định ở nhóm E.
4. **Tiền lệ máy kiểm bản sinh:** header sinh tự động trên bản render, `decision-index --check`, hiến pháp tối thiểu (bản sinh phải ghi nguồn, bộ sinh, độ tươi, không sửa tay; disposition `regenerate-from-source`).
5. **Mẫu máy kiểm từ plan DOC dùng lại được:** `check-doc-constitution.mjs` (JSON là bản chiếu có kiểm của văn xuôi: mẫu test chống lệch cho Q6), ratchet cộng danh sách ngoại lệ (mẫu "luật mới phải nói thay luật nào"), `consumer-rewrites --remnants --assert-clean` (mẫu máy kiểm "luật bị chép" và "đường cũ đã xoá"), sổ ý định có cột điều kiện mở lại (mẫu "điều kiện hết hạn"), digest và độ tươi; thêm ratchet trích dẫn trần của `docs/history` (11.1, 11.4).
6. **Phân loại repo-local, consumer-project, mixed** của kiểm kê đường dẫn shipped dùng được cho cột sở hữu và cờ "đi sang project khác". Q8-10 của plan đã chốt `.claude/rules` và `~/.claude` ngoài phạm vi, trùng phạm vi handoff.
7. **Phép thử người đọc mới** (sáu câu L5, đáp án commit trước, chấm bằng script) dựng lại được thành phép thử lead mẫu của mục 5 §1.
8. **Plan DOC coi `AGENTS.md` và `CLAUDE.md` là ngoại lệ ngoài phạm vi platform** (`reclassify-out-of-platform-scope`), nên không tranh thẩm quyền với sổ luật, miễn sổ luật có một chủ duy nhất.

**Xung đột hoặc chồng lấn**

1. **Cùng file, cùng thời điểm:** `AGENTS.md`, `core/instructions/platform-laws.md` và file skill nguồn bị cả hai bên chạm; bản vá Phase 8 khoá theo digest nên sửa song song làm lệch (14.2); handoff §5 mới có điều phối miệng với `forgentx-5f`.
2. **Đường dẫn bị dời ở Phase 9:** `instruction-registry.mjs:458`, các neo của `platform-laws.md`, tường thuật D-ADR0030. Trường "nguồn gốc" của sổ cái nên ghi mã bất biến (RUL, D-ADR) cộng bộ giải, không ghi đường dẫn file (14.1, 14.8).
3. **Lease không phủ nguồn instruction** nên trong cửa sổ cắt chuyển sổ luật sửa được nhưng bản render `AGENTS.md` không sinh lại được (14.3).
4. **Schema nằm trong cây `docs/platform/**` đang chuyển** và RUL102 nằm ở legacy root `distribution.md` (14.5, 14.7).
5. **Hai thứ tự giải xung đột:** hiến pháp (giữa tài liệu) và bộ ghép (giữa luật); đích "thứ tự giải ghi ở một chỗ" của handoff phải nối hai trục này (14.4).
6. **Trùng tên:** "ledger" có ít nhất bốn nghĩa (projection ledger, sổ ý định, sổ claim, case ledger); "target" là chủ sở hữu luật trong bộ ghép nhưng handoff dùng cho CLI hay vai; "provenance" là đường dẫn nguồn trong contract nhưng là sự cố hay quyết định trong handoff; "L0–L4" của proposal trùng "L1–L10" của luật nền. Nên đặt tên riêng (ví dụ "sổ luật").
7. **Sổ ghi chiếu và nhật ký inject khác vòng đời:** ledger là vết cài đặt ở `.fgos/installation/`, nhật ký inject là vết theo phiên; không gộp.
8. **"Sổ cái là nơi duy nhất được sửa" chưa đúng với luật khoá:** văn bản L1–L10 ở `docs/platform-foundations.md`, RUL và tường thuật D-ADR ở `docs/specs/platform-foundations.md` (14.9); sổ cái chỉ sinh từ đó (1.4), không là nơi sửa.
9. **Frontmatter hiện có `scope`, `appliesTo`, `specificity`, `renderHints`:** trường mới "điều kiện kích hoạt" và "điểm inject" có thể trùng chúng.
10. **Ràng buộc từ phía render:** bộ chiếu khoá host về `*` và một khối trong một file (14.15); plan DOC đòi `AGENTS.md` không dẫn tới `docs/platform/` mới (kiểm tra I); L8 đòi cụm neo trên đúng một dòng chưa bị bẻ (`agents-doctrine-anchors`); bản render hiện inject chính nguồn gốc (14.16).

**Chưa nói tới nhưng handoff cần quyết**

1. **Thứ tự land** so với Phase 9 của kế hoạch DOC: sổ luật trước hay sau cắt chuyển; cần chốt với `forgentx-5f`.
2. **Nhà thật của câu RUL và tường thuật D-ADR** sau cắt chuyển (14.8, 14.9).
3. **Phạm vi nguồn của sổ cái:** ba gốc (`core/instructions`, `components/*/instructions`, `domains/*/instructions`) cộng `domains/*/AGENTS.md` viết tay; component và domain hiện không giao ra agent (14.14); chủ xác định từ `architecture-manifest.json`, file này đổi chỗ ở Phase 9.
4. **Vai** (big lead, lead, worker, reviewer) và **việc** chưa có trong từ vựng bộ ghép; ai khai (14.17).
5. **Ai kích hoạt sinh lại** bản render cho nhiều CLI và vai: setup, `doctor --fix`, hay lúc dựng brief (RUL102 chưa nói).
6. **Cờ "đi sang project khác"** cho từng luật, và cơ chế có áp cho project dùng fgOS hay chỉ repo fgOS (14.12, 14.21).
7. **Kind mới cho RUL và instruction** trong từ vựng đóng băng và disposition cuối của hàng `AGENTS.md`, `CLAUDE.md` (Phase 6 Bước 10; 14.11).
8. **Quy ước sửa luật khẩn trong cửa sổ lease** và quy ước ghi quyết định mới vào legacy root (14.7).
9. **Máy kiểm luật dùng lại cửa nào:** `fgos convention` và `fgos doc check` (Phase 10), không dựng cửa thứ hai.
10. **PF-I007:** cập nhật thành `partial` khi lát đầu land và ghi "must not preclude" cho seam mới (14.6).
11. **Tên verb:** `fgos doc context` thuộc không gian `doc` của registry tài liệu; chọn vị trí verb riêng.
12. **Khối AgentKit trong `AGENTS.md` nằm ngoài khối quản lý:** tính vào ngân sách và khử trùng hay chỉ đo (Q7).
13. **Phép thử người đọc mới dựa trên câu chữ DoD:** sửa câu DoD trong bản render làm lệch đáp án.

### Cập nhật cho các dòng đã có

- **1.4:** sau Phase 9 bộ sinh danh sách luật phải trỏ `docs/platform/platform-foundations.md`; hợp đồng §4 tự mâu thuẫn (14.19).
- **1.7 và 1.2:** khối AgentKit trong `AGENTS.md` không nằm trong ledger của fgOS; bộ chiếu chỉ biết khối của fgOS.
- **6.2:** `check-decision-codes` nay báo 374 vi phạm; test của script chỉ dùng thư mục tạm, không có ca chạy repo thật (khác `check-decision-citation-drift`); luật gốc "Stable Code Artifacts" chỉ có trong `.claude/rules/` và khối AGENTKIT chưa commit (`AGENTS.md:655`), không có ở `HEAD:AGENTS.md`.
- **7.3:** thêm hai bản `dispatch-control-plane-redesign.md` (`docs/architect/` và `docs/platform/`) đang lệch nhau.
- **7.5:** 890 slot của Phase 8 Bước 4 gồm 609 giữ nguyên, 59 bản vá Phase 9, 177 chỉ sinh lại bản render, 45 để treo (theo board); Phase 8 không sửa byte nào.
- **1.10 và 2.8:** `.claude/settings.json` chưa commit có 57 mục hook (HEAD là 24), 22 trong 28 cặp (sự kiện, script) đăng ký hơn một lần (13.9).

### Ghi chú về các kết luận đã bị bác

Cuộc điều tra harness 10-06 có hai kết luận trung tâm bị phản biện bác, nên không lập thành vấn đề: "harness khoảng 63%, thiếu rule là chính" (fatal-flaws chấm lại 9 ca lớp A thì chỉ giữ 2) và "hai kit hook ck/ak mâu thuẫn là nguyên nhân số 1" (critic: 0/57 ca do mâu thuẫn này). Kết luận "engine coordination không bị gỡ" của archaeologist cũng sai (commit `2180b4e72` ghi L4 đã retired). Báo cáo `distill-inventory-claudekit-engineer-orchestration` là kiểm kê cơ học, không nêu vấn đề nào.

### Chưa chắc ở phần tổng hợp

- Các agent chỉ đọc, grep và xem `git log`; không ai chạy `npm test`, `cargo test` hay `fgos` verb ghi. Mọi trạng thái "đã giải quyết" dựa vào commit, file và báo cáo, không phải chạy lại.
- Cụm tài liệu thẩm quyền tài liệu (mục 7): đầu nhánh `plan/260925-documentation-authority-unification` theo board là `763568157`, nhưng nhánh remote chỉ tới `168a27c6c` và `763568157` không có trong repo này; vì vậy các hàng 7.4–7.6 dựa vào board và nhánh remote cũ hơn.
- Một số đường dẫn trong `.claude/settings.json` (`/home/vantt/.local/bin/node`, `forgentX/...`) không tồn tại trên máy này; có thể đúng trên máy chính của owner nên không kết luận `statusLine` hỏng.
- `AGENTS.md`, `.claude/settings.json` và vài file khác đang có thay đổi chưa commit trong cây làm việc; số liệu như 46.754 byte và khối `AGENTKIT-OMP` đọc từ cây làm việc, không phải từ bản commit.
- Đợt hai: nhánh `plan/260925-...` trên remote chỉ tới `168a27c6c` (10-13); đầu nhánh `763568157` không có trong repo này, nên 331 bản vá và Phase 7, Phase 8 Bước 3, 4 chỉ có board làm bằng chứng. Plan trên main (704 dòng) cũ hơn bản trên nhánh (580 dòng); agent dùng bản trên nhánh.
- Đợt hai: kết luận "không caller production" của `composeAllInstructionSets` (14.14) dựa vào grep, chưa dùng GitNexus; theo cổng impact-analysis đây là bằng chứng yếu.
- Đợt hai: agent R2 chỉ xem khoảng 50 trong 540 file của plan 260925 (19 trên 29 file cấp plan, 8 trên 85 file ledger, 3 trên 20 file pilot, khoảng 20 trên 406 report); phần còn lại chỉ đếm từ khoá.
- `docs/history/`: chỉ các thư mục có tên hoặc điểm từ khoá liên quan được mở; mười một thư mục ở cuối nhóm J được nêu là chưa đọc sâu.
- Các số đo ở mục 3 (tỉ lệ làm theo chỉ dẫn, nuốt Enter) chỉ trên một máy, một tài khoản mỗi CLI, model nhỏ, N từ 1 đến 20; chưa ai chạy lại.
- Một số con số chưa được tự đo lại: 375 vi phạm `check-decision-codes`, 302 file trùng, 433 test Node trong 5 port, 439 file `*.log`, 113 chỗ nhắc `docs/specs`.

## Kết quả

Đợt đầu: trong 1.312 file markdown dưới `plans/` (761 file ở `plans/reports/`), em chọn ra **70 tài liệu** có chủ đề hoặc một phần đáng kể là luật, instruction, doctrine hay đường đưa chỉ dẫn vào agent: **33 Chính**, **25 Liên quan**, **12 Bối cảnh**. Danh sách xếp theo chín nhóm chủ đề ở mục Tham chiếu. Thêm 17 nơi ngoài `plans/` (docs, `core`, `src`, skill) để đối chiếu, và 7 tài liệu đã xét rồi loại. Đợt hai thêm nhóm J (`docs/history/`, 881 thư mục, 50 thư mục đã đọc), nhóm K (`docs/journals/`, 5 file) và nhóm L (kế hoạch 260925 cùng hợp đồng projection).

Ba điều rút ra, đều từ các báo cáo đã có, đáng đưa vào handoff:

1. **Cuộc điều tra harness 10-06 đã đo sẵn nhiều thứ handoff đang giao làm lại.** `instruction-audit-261006` đo lớp instruction thật sự nạp; `archaeologist-261006` đã kết luận `.claude/rules/*` không nằm trong git, trùng với điều em kiểm lại hôm nay; `fatal-flaws-261006` có bằng chứng rằng sửa bằng văn xuôi luôn nạp không ngăn được lỗi lặp lại, ủng hộ mục tiêu "đo bằng hành vi" của handoff.
2. **Số đo theo CLI cho điểm inject đã có một phần.** `research-261020-1612` đo hook theo từng CLI: Claude và Codex có `UserPromptSubmit`, agy không có; omp và pi chưa đo. `research-261020-1814-mailbox-instruction-and-injection-eval-v2` cho thấy cùng một chỉ dẫn được làm theo rất khác nhau giữa Claude, Codex và pi.
3. **Tiền lệ cho sổ cái và bản render đã có.** Phase 02 của kế hoạch một cửa (header trên bản render) và phase 04 của mẫu câu hỏi (hook thi hành) là hai cơ chế cùng loại đã land; nhóm E của handoff nên tái dùng, không dựng mới.

## Phương pháp và giới hạn

- Chấm điểm toàn bộ 1.312 file bằng từ khoá (`core/instructions`, `instruction-composition`, `AGENTS.md`, `.claude/rules`, RUL100–RUL111, guardrail, doctrine, luật, instruction), thêm lượt quét theo tên file và lượt quét theo nội dung (luật hoặc instruction đi cùng chuyện nạp, token, trùng lặp). Ra 238 ứng viên, đọc phần đầu của các file chưa rõ rồi phân loại bằng tay.
- Mức **Chính** nghĩa là chủ đề của tài liệu là luật hoặc instruction. **Liên quan** nghĩa là một phần đáng kể. **Bối cảnh** nghĩa là nguồn dữ liệu, brief hoặc điều phối.
- Em không đọc trọn từng tài liệu; phần "vấn đề chính" lấy từ tiêu đề và phần tóm tắt đầu file. Những tài liệu đánh Liên quan hoặc Bối cảnh mà người làm nhóm B cần dùng thì nên đọc kỹ hơn.
- Các file bằng chứng sinh ra bởi run (`brief-1.md` dưới `evidence/`, log, CSV, script) không liệt kê từng file.
- Đợt đầu chỉ quét `plans/`. Đợt hai quét `docs/history/` (1.679 file markdown, chấm điểm từ khoá rồi chọn theo tên thư mục) và `docs/journals/` (5 file), và đọc kế hoạch 260925 trên nhánh remote.

## Tham chiếu

### A. Nền của luồng quản lý luật

Đọc trước. Đây là bằng chứng và quyết định đang chi phối luồng này.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [research-261016-1118-agent-code-quality-guardrails.md](research-261016-1118-agent-code-quality-guardrails.md) | INS: vì sao luật "một cửa" có mà code vẫn trùng; đo thật bảng nạp luật của bốn CLI; đề xuất P1–P7 và câu Q4–Q7. |
| Chính | [review-261021-1008-rules-that-grow-the-system.md](review-261021-1008-rules-that-grow-the-system.md) | Kiểm kê 14 nơi ghi luật; mỗi lượt Claude nạp khoảng 56 KB; luật nào đẩy hệ thống phình; R4 "không cần tương thích ngược" mâu thuẫn với việc cài thật. |
| Chính | [handoff-261021-1021-rule-management-tight-no-conflict-right-place.md](handoff-261021-1021-rule-management-tight-no-conflict-right-place.md) | Prompt giao luồng quản lý luật: bảy mục tiêu, sổ cái và bản render, bảy nhóm việc. |
| Chính | [261017-1313-fgos-platform-program-board/plan.md](../261017-1313-fgos-platform-program-board/plan.md) | Board chương trình: hàng INS, D6, TEST, HARDEN, MAIL; nơi phải ghi trạng thái khi bắt đầu, xong, bị chặn hay land. |
| Liên quan | [proposal-261021-0851-harden-review-criteria-and-method.md](proposal-261021-0851-harden-review-criteria-and-method.md) | HARDEN: trục G (bề mặt cho agent) và cổng 6 (hướng dẫn cho agent rõ, nhẹ, không trùng) khi soát từng tầng foundation. |

### B. Điều tra harness 2026-10-06: vì sao agent vẫn làm tùm lum

Một cuộc điều tra nhiều vai, đo thật những gì phiên Claude nạp và 57 ca agent làm sai. Thư mục còn chứa script và số liệu thô (`count-hook-injections.cjs`, `measure-instruction-layers.cjs`, các file `.csv`, `.txt`).

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Bối cảnh | [prompt-261006-0955-investigate-harness-drift-rul11.md](prompt-261006-0955-investigate-harness-drift-rul11.md) | Brief mở cuộc điều tra, định nghĩa các vai. |
| Chính | [harness-investigation-261006-synthesis.md](harness-investigation-261006-synthesis.md) | Bản tổng hợp 3: mục tiêu "tối ưu hành vi"; coi `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit là ràng buộc ngoài; còn treo Q6–Q9. |
| Chính | [harness-investigation-261006/instruction-audit-261006.md](harness-investigation-261006/instruction-audit-261006.md) | Đo những gì một phiên Claude thật sự nạp, kể cả hook; hook global và project tiêm hai khối nói ngược nhau. |
| Chính | [harness-investigation-261006/enforcement-audit-261006.md](harness-investigation-261006/enforcement-audit-261006.md) | Phần cưỡng chế cũng tùm lum: kiểm cơ học đi qua 5 cửa; `check-decision-codes` exit 1 với 375 vi phạm vượt baseline; `check-hook-registrations-guarded` mồ côi. |
| Chính | [harness-investigation-261006/conditions-261006.md](harness-investigation-261006/conditions-261006.md) | Cấu trúc và điều kiện khiến agent làm tùm lum; bằng chứng sống về hai khối hook mâu thuẫn (`descriptive-name`). |
| Chính | [harness-investigation-261006/archaeologist-261006.md](harness-investigation-261006/archaeologist-261006.md) | Harness là ba lớp từ ba nguồn chồng nhau (ck, ak, doctrine fgOS); `.claude/rules/*` không nằm trong git; RUL11 gốc chỉ nhắm cấu trúc code. |
| Chính | [harness-investigation-261006/critic-261006.md](harness-investigation-261006/critic-261006.md) | Phản biện: phần đo đúng, chỗ yếu ở suy luận nhân quả; 0/57 ca do mâu thuẫn ck/ak gây ra. |
| Chính | [harness-investigation-261006/fatal-flaws-261006.md](harness-investigation-261006/fatal-flaws-261006.md) | Phản biện thù địch: sửa bằng văn xuôi luôn nạp bị chính dữ liệu bác (lỗi "hỏi thừa" lặp lại dù luật đang nạp); thiếu mẫu số, baseline và thí nghiệm A/B. |
| Liên quan | [harness-investigation-261006/behavior-forensics-261006.md](harness-investigation-261006/behavior-forensics-261006.md) | Pháp y hành vi: 57 ca agent làm sai, phân loại theo lớp harness. |
| Bối cảnh | [harness-investigation-261006/classification-codebook-261006.md](harness-investigation-261006/classification-codebook-261006.md) | Codebook phân loại dùng chung cho cuộc điều tra. |
| Bối cảnh | [harness-investigation-261006/rater-1-261006.md](harness-investigation-261006/rater-1-261006.md) | Người chấm độc lập thứ nhất cho 57 ca. |
| Bối cảnh | [harness-investigation-261006/rater-2-261006.md](harness-investigation-261006/rater-2-261006.md) | Người chấm độc lập thứ hai cho 57 ca. |
| Chính | [harness-investigation-261006/skill-catalog-audit-261006.md](harness-investigation-261006/skill-catalog-audit-261006.md) | Catalog skill phình do một bộ ngoài nạp hai lần; nguồn thật và bản render không rõ; tham chiếu mồ côi tới skill đã xoá. |
| Liên quan | [harness-investigation-261006/path-name-docs-audit-261006.md](harness-investigation-261006/path-name-docs-audit-261006.md) | Không có văn bản nào định nghĩa path và tên cho plan, report, prompt, journal; quy ước chỉ nằm trong hook; drift đo được. |

### C. Gốc rễ phình và trôi hướng

Hai tài liệu nhìn từ genesis, trả lời vì sao luật và cơ chế liên tục thêm mà không bớt.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [opus-genesis-drift-forensics-261008.md](opus-genesis-drift-forensics-261008.md) | fgOS sinh ra như harness tự cải thiện, không có tenant ngoài kéo kích thước xuống; các điều khoản "gom tới khi hết" không có ngân sách; vòng review chỉ thêm code. |
| Liên quan | [prompt-261008-bloat-root-cause-discussion.md](prompt-261008-bloat-root-cause-discussion.md) | Brief thảo luận với owner về nguyên nhân phình; một câu trả lời mù của owner bị ghi thành cho phép mở rộng phạm vi. |

### D. Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng

Một lần gom luật thật: gỡ nhiều chỗ nói trùng về cách hỏi owner, thay bằng một mẫu và hook thi hành.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [261008-1353-decision-question-template-and-cleanup/plan.md](../261008-1353-decision-question-template-and-cleanup/plan.md) | Mẫu câu hỏi quyết định và gỡ các quy tắc hỏi trùng; có ngân sách dòng thêm và dòng xoá. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-01-decision-question-template.md](../261008-1353-decision-question-template-and-cleanup/phase-01-decision-question-template.md) | Mẫu năm phần và validator `fgos ask`. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-02-remove-duplicate-question-rules.md](../261008-1353-decision-question-template-and-cleanup/phase-02-remove-duplicate-question-rules.md) | Gỡ các chỗ nói trùng về cách hỏi owner. |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-03-approved-frame.md](../261008-1353-decision-question-template-and-cleanup/phase-03-approved-frame.md) | Khung đã duyệt: điểm dừng chung cho các luật đẩy hệ thống về phía "nhiều hơn". |
| Chính | [261008-1353-decision-question-template-and-cleanup/phase-04-askuserquestion-hook.md](../261008-1353-decision-question-template-and-cleanup/phase-04-askuserquestion-hook.md) | Hook `AskUserQuestion` thi hành mẫu: cửa hỏi chính thật là `AskUserQuestion` (403 lần gọi), không phải `fgos ask`. |
| Liên quan | [261008-1353-decision-question-template-and-cleanup/phase-05-explicit-approval-and-single-ask-channel.md](../261008-1353-decision-question-template-and-cleanup/phase-05-explicit-approval-and-single-ask-channel.md) | Đồng ý rõ ràng bằng `--approve` và một kênh hỏi duy nhất. |
| Liên quan | [prompt-261008-1644-approve-on-every-answer-door.md](prompt-261008-1644-approve-on-every-answer-door.md) | Mọi cửa trả lời phải phân biệt đồng ý với làm rõ (gateway REST, MCP, workflow gate). |
| Chính | [prompt-261008-1644-hook-install-outside-fgos-repo.md](prompt-261008-1644-hook-install-outside-fgos-repo.md) | Hook của fgOS không chạy ở dự án khác (script và `src/` không tồn tại ngoài repo fgOS): luật inject bằng hook không tới được mission #1. |

### E. AGENTS.md một người ghi, bản render có header, máy kiểm chống sửa tay

Tiền lệ cho các cơ chế sổ cái và bản render mà handoff đề xuất.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Liên quan | [261006-1415-fgos-single-door-mechanisms/plan.md](../261006-1415-fgos-single-door-mechanisms/plan.md) | Kế hoạch cơ chế một cửa; phase 02, 05, 06 bên dưới là phần chạm luật. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md](../261006-1415-fgos-single-door-mechanisms/phase-02-skill-render-generated-header.md) | Header sinh tự động trên mọi file skill render, để biết nguồn và không sửa tay. |
| Liên quan | [261006-1415-fgos-single-door-mechanisms/phase-05-root-file-guard-and-junk-cleanup.md](../261006-1415-fgos-single-door-mechanisms/phase-05-root-file-guard-and-junk-cleanup.md) | Cổng chặn file lạ ở thư mục gốc (allowlist) và dọn rác có cổng. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md](../261006-1415-fgos-single-door-mechanisms/phase-06-agents-md-single-writer.md) | Doctrine một người ghi `AGENTS.md` và kiểm chứng vị trí tạm. |
| Chính | [261006-1415-fgos-single-door-mechanisms/phase-06-doctrine-review.md](../261006-1415-fgos-single-door-mechanisms/reports/phase-06-doctrine-review.md) | Review bằng chứng và vị trí đặt doctrine của phase 06. |
| Bối cảnh | [planner-261006-1415-single-door-mechanisms-handoff.md](planner-261006-1415-single-door-mechanisms-handoff.md) | Handoff của kế hoạch A, một cửa. |
| Bối cảnh | [journals/2026-10-06-single-door-hygiene-without-losing-prior-work.md](../journals/2026-10-06-single-door-hygiene-without-losing-prior-work.md) | Ghi chép giữ bằng chứng cũ khi dọn. |
| Liên quan | [journals/2026-10-02-p5-terminology-sweep-and-vocabulary-guard.md](../journals/2026-10-02-p5-terminology-sweep-and-vocabulary-guard.md) | Quét thuật ngữ và guard từ vựng chết: một máy kiểm giữ từ đã gỡ không quay lại tài liệu. |

### F. Sửa instruction và doctrine theo cơ chế thật

Những lần cụ thể doctrine, skill hay instruction bị viết lại hoặc gỡ để khớp với cơ chế mới.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Liên quan | [261014-1400-two-doors-one-rununit/plan.md](../261014-1400-two-doors-one-rununit/plan.md) | Hai cửa một runUnit; phase 07a, 07b là phần doctrine. |
| Chính | [261014-1400-two-doors-one-rununit/phase-07a-doctrine-additive.md](../261014-1400-two-doors-one-rununit/phase-07a-doctrine-additive.md) | Doctrine chỉ cộng thêm trước, cổng G-M1. |
| Chính | [261014-1400-two-doors-one-rununit/phase-07b-doctrine-remove-old-doors.md](../261014-1400-two-doors-one-rununit/phase-07b-doctrine-remove-old-doors.md) | Gỡ doctrine cửa cũ trong một lần merge cùng cơ chế. |
| Chính | [261014-1400-two-doors-one-rununit/lane-docs-a-261014-1837.md](../261014-1400-two-doors-one-rununit/reports/lane-docs-a-261014-1837.md) | Lane docs-a: doctrine chỉ cộng thêm. |
| Chính | [261014-1400-two-doors-one-rununit/lane-docs-b-261014-1948.md](../261014-1400-two-doors-one-rununit/reports/lane-docs-b-261014-1948.md) | Lane docs-b: gỡ doctrine cửa cũ. |
| Chính | [261014-1400-two-doors-one-rununit/review-rununit-docs-b-261014-1945.md](../261014-1400-two-doors-one-rununit/reports/review-rununit-docs-b-261014-1945.md) | Review: máy kiểm gồm test doctrine, regex cửa đã gỡ (0 hit) và renders đồng bộ. |
| Chính | [261019-1238-workflow-case-ledger-and-admission/phase-09-doctrine-docs-closeout.md](../261019-1238-workflow-case-ledger-and-admission/phase-09-doctrine-docs-closeout.md) | Viết lại `coordination-driver.md`: phán route thuộc agent, cơ học và cưỡng chế thuộc harness. |
| Liên quan | [phase-lead-261020-0051-workflow-case-p09-closeout.md](phase-lead-261020-0051-workflow-case-p09-closeout.md) | Báo cáo phase lead đóng phase 09. |
| Liên quan | [261018-2240-cook-path-cleanup-and-run-fixes/plan.md](../261018-2240-cook-path-cleanup-and-run-fixes/plan.md) | COOK P1 và P3: dọn sự kiện cũ, đổi tên cook cũ thành deliver. |
| Liên quan | [261020-2014-cook-p5-fgos-cook-coordination-loop/plan.md](../261020-2014-cook-p5-fgos-cook-coordination-loop/plan.md) | Skill `fgos-cook`: đọc plan do `ak:plan` viết (bên thứ ba, chỉ đọc), liên quan đường luật tới lead. |
| Liên quan | [code-review-260927-1456-unit-i17-demand-doctrine-review-report.md](code-review-260927-1456-unit-i17-demand-doctrine-review-report.md) | Review doctrine nhu cầu: hai lỗi doctrine chỉ ở văn xuôi. |
| Bối cảnh | [code-review-260927-1513-unit-i17-remediation-re-review-report.md](code-review-260927-1513-unit-i17-remediation-re-review-report.md) | Review lại phần sửa. |
| Liên quan | [architecture-advisory-260926-1322-phase4-loop-driver-layering-report.md](architecture-advisory-260926-1322-phase4-loop-driver-layering-report.md) | Tầng loop là doctrine (kỷ luật driver), không phải engine; cần hai consumer khác nhau dùng chung một fragment. |
| Liên quan | [coordination-skill-harness-architecture-audit-260919-report.md](coordination-skill-harness-architecture-audit-260919-report.md) | Skill runtime trở thành bản triển khai điều phối thứ hai, trộn routing, protocol và văn xuôi. |
| Liên quan | [review-260905-agent-coordination-trong-mem-ngoai-cung.md](review-260905-agent-coordination-trong-mem-ngoai-cung.md) | Đường chuyển doctrine, persona và context từ protocol xuống worker bị thiếu. |

### G. Thống nhất thẩm quyền tài liệu (kế hoạch 260925, chồng lấn trực tiếp)

Phiên `forgentx-5f`. Phase 8 có bản ghi vá cho 331 file instruction, skill, comment, help; chỉ land ở phase 9.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [260925-documentation-authority-unification/plan.md](../260925-documentation-authority-unification/plan.md) | Gộp các thẩm quyền tài liệu cạnh tranh về `docs/platform/**`. |
| Bối cảnh | [260925-documentation-authority-unification/independent-frontier-review-prompt.md](../260925-documentation-authority-unification/independent-frontier-review-prompt.md) | Prompt review độc lập. |
| Liên quan | [260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md](../260925-documentation-authority-unification/independent-frontier-review-2026-09-25.md) | Review độc lập lần một. |
| Liên quan | [260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md](../260925-documentation-authority-unification/independent-frontier-rereview-2026-09-25.md) | Review lại. |
| Bối cảnh | [advice-260929-2345-doc-authority-harness-executor-routing.md](advice-260929-2345-doc-authority-harness-executor-routing.md) | Cách chạy plan này bằng harness fgOS: harness biểu đạt ý định ở sai tầng. |
| Bối cảnh | [advice-260930-1002-harness-flexibility-plan-agnostic-routing.md](advice-260930-1002-harness-flexibility-plan-agnostic-routing.md) | Chạy plan bất kỳ với đúng executor, model, tier, persona; plan này là case ứng dụng. |
| Bối cảnh | [prompt-261006-1533-resume-documentation-authority-unification.md](prompt-261006-1533-resume-documentation-authority-unification.md) | Prompt nối lại plan. |
| Bối cảnh | [prompt-261006-1652-orient-documentation-authority-unification.md](prompt-261006-1652-orient-documentation-authority-unification.md) | Prompt định hướng lại để biết chỗ tiếp tục. |

### H. Luật test (luồng TEST, máy thứ hai)

Luật test chi tiết thuộc luồng TEST; luồng này chỉ đưa luật tới đúng nơi và gỡ bản trùng.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [counsel-261020-1658-test-suite-growth-rule.md](counsel-261020-1658-test-suite-growth-rule.md) | Bộ test không thừa mà không được quản: mọi luật hiện hành đẩy một chiều (thêm, giữ, không làm yếu); đề xuất luật tăng trưởng test. |
| Chính | [phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md](phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md) | Mảnh luật test, cơ chế đo, phase 0–1. |
| Liên quan | [261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md) | Gỡ bản Node của case Rust đã sở hữu; mỗi cổng một test route. |

### I. Đưa chỉ dẫn vào agent và đo trên nhiều CLI (điểm inject)

Số đo thật về từng CLI. Đây là chỗ nhóm C2 của handoff nên bắt đầu.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md](research-261020-1612-mailbox-s0-human-input-and-peer-prompt-hooks.md) | Đo hook "người gõ prompt": Claude và Codex có `UserPromptSubmit`; agy không có (sáu sự kiện tài liệu hoá); payload của peer không có trường nguồn. Chưa đo omp, pi. |
| Chính | [research-261020-1814-mailbox-instruction-and-injection-eval-v2.md](research-261020-1814-mailbox-instruction-and-injection-eval-v2.md) | Đo mức làm theo chỉ dẫn peer trên Claude, Codex, pi (N=20, 20, 10): hành vi khác nhau rõ giữa các CLI với cùng một chỉ dẫn. |
| Liên quan | [research-261020-1814-mailbox-component-authority-boundary-review.md](research-261020-1814-mailbox-component-authority-boundary-review.md) | Tri thức theo CLI bị chia đôi (adapters trong mailbox và profile terminal theo CLI trong agent-protocol); hook mức project làm cả worker pane cũng đăng ký. |
| Liên quan | [research-261014-2255-herdr-spawn-verbose-prompt-injection.md](research-261014-2255-herdr-spawn-verbose-prompt-injection.md) | Hai chế độ giao prompt, `simple` và `verbose`, trong `herdr-spawn`. |
| Liên quan | [261014-1710-herdr-inline-prompt-delivery/plan.md](../261014-1710-herdr-inline-prompt-delivery/plan.md) | Giao prompt inline hoặc con trỏ file cho claude, codex, agy, pi, omp dưới bwrap. |
| Liên quan | [debug-261018-2321-codex-inline-prompt-not-submitted.md](debug-261018-2321-codex-inline-prompt-not-submitted.md) | Codex 0.163 nuốt Enter khi gõ brief dài, còn `herdr agent prompt` (bracketed paste) 5/5: đường giao brief khác nhau theo CLI. |
| Liên quan | [distill-inventory-claudekit-engineer-orchestration-260825-1721-report.md](distill-inventory-claudekit-engineer-orchestration-260825-1721-report.md) | Kiểm kê hook, agent, rules của AgentKit upstream (11 managed hooks): nền cho phần "chỉ quan sát". |

### J. `docs/history/`: ghi chép từng task (881 thư mục; chọn theo từ khoá và tên, đã đọc các thư mục dưới đây)

Phần lớn `docs/history/` là bằng chứng của từng task nhỏ từ tháng 7 đến tháng 9, nhiều task đã đóng. Khoảng 50 file `iron-law-evidence.md` được loại cả lớp vì là bằng chứng từng task, không bàn về luật.

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Chính | [`history/rul11-tum-lum-doctrine-anchor/`](../../docs/history/rul11-tum-lum-doctrine-anchor/) | Khoá RUL11 thành luật chạm agent: dòng spec, câu neo trên một dòng riêng trong `AGENTS.md`, test khoá chữ. |
| Chính | [`history/canonical-decision-projection/`](../../docs/history/canonical-decision-projection/) | Chống doc-rot khi quyết định bị supersede: kho `state.decisions`, index sinh tự động, gỡ corpus `docs/decisions/*.md`. |
| Chính | [`history/self-contained-id-references/`](../../docs/history/self-contained-id-references/) | Trích dẫn ADR, RUL, D phải tự đứng được và có máy kiểm kiểu ratchet. |
| Chính | [`history/instruction-prose-change-governance/`](../../docs/history/instruction-prose-change-governance/) | Có nên có cổng cấm sửa `AGENTS.md`, `CLAUDE.md`, prose skill ngoài đường tường minh; thảo luận vòng 1, chưa quyết. |
| Chính | [`history/fgos-mission-boundary/`](../../docs/history/fgos-mission-boundary/) | Luật ranh giới sứ mệnh (D-ADR0035) là luật luôn nạp; ý tưởng khoá cấu hình `mission`. |
| Chính | [`history/skill-prose-cleanup/`](../../docs/history/skill-prose-cleanup/) | Skill vượt 300 dòng, khối fallback lặp 23 wrapper, hơn 260 trích dẫn ID trần. |
| Chính | [`history/skill-prose-verify-standard/`](../../docs/history/skill-prose-verify-standard/) | Chuẩn verify cho việc sửa prose skill. |
| Chính | [`history/tsk-3f9k-dispatch-waiting-rule-scheduleWakeup-gap/`](../../docs/history/tsk-3f9k-dispatch-waiting-rule-scheduleWakeup-gap/) | Luật chờ thông báo của harness chỉ nói điều cấm, thiếu hành động bắt buộc. |
| Chính | [`history/dispatch-contract-agents-md/`](../../docs/history/dispatch-contract-agents-md/) | Viết hợp đồng dispatch vào `AGENTS.md`; sau đó bị thay bằng doctrine `fgos run`. |
| Chính | [`history/fgos-coding-implement-decide-first-prose/`](../../docs/history/fgos-coding-implement-decide-first-prose/) | Skill implement dạy ngược với cấu hình dispatch; sửa thành gọi `decide` trước. |
| Chính | [`history/dispatch-decide-scope-raw-tool-calls/`](../../docs/history/dispatch-decide-scope-raw-tool-calls/) | Lời gọi công cụ thô không thuộc `decide`; hook chỉ khớp Agent hoặc Task. |
| Chính | [`history/tsk-5t3-iron-law-evidence-contract/`](../../docs/history/tsk-5t3-iron-law-evidence-contract/) | Hợp đồng bằng chứng Iron Law giữa người làm và merge-loop. |
| Chính | [`history/context-md-enforcement-scope/`](../../docs/history/context-md-enforcement-scope/) | Khoá phạm vi ép `CONTEXT.md`; mã ép chưa viết. |
| Chính | [`history/task-dispatch-unification/`](../../docs/history/task-dispatch-unification/) | Thống nhất dispatch quanh khái niệm task; có REVIEW-FINDINGS; cơ chế sau đó bị gỡ. |
| Chính | [`history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/`](../../docs/history/native-first-dispatch-doctrine-phase-4-unify-capacity-and-task-dispatch/) | Một giao thức quyết định native hay cli-spawn dùng chung. |
| Chính | [`history/discover-stage-graph-and-skill-layering/`](../../docs/history/discover-stage-graph-and-skill-layering/) | Kiểm toán sau khi cây đóng: bảng route dạy sai, frontmatter sai, `AGENTS.md` gọi tên skill đã chết, DoD mù với prose. |
| Chính | [`history/worker-prompt-inline-completion-signal/`](../../docs/history/worker-prompt-inline-completion-signal/) | Prompt worker không nói thẳng `[DONE]` hay `[BLOCKED]` vì chỉ dẫn nằm cuối chuỗi 3 hop. |
| Chính | [`history/worker-prompt-iron-law-evidence-timing/`](../../docs/history/worker-prompt-iron-law-evidence-timing/) | Prompt worker không dạy chứng cứ Iron Law đúng thời điểm. |
| Chính | [`history/dispatch-prompt-docsref-pointer/`](../../docs/history/dispatch-prompt-docsref-pointer/) | Prompt worker không chỉ tới `plan.md` và `CONTEXT.md` của item. |
| Chính | [`history/fgos-stage-skills-task-delegation-audit/`](../../docs/history/fgos-stage-skills-task-delegation-audit/) | Skill stage thiếu luật cấm tự ý gọi Agent hoặc Task; nguồn gốc luật `tsk-29i`. |
| Chính | [`history/discover-decompose-skill-wrapper-verdict-routing/`](../../docs/history/discover-decompose-skill-wrapper-verdict-routing/) | Wrapper gọi verb mù thay vì đi qua skill sống. |
| Chính | [`history/caller-verdict-protocol-discover-decompose/`](../../docs/history/caller-verdict-protocol-discover-decompose/) | Giao thức verdict do caller cấp cho `fgos discover` và `fgos plan`. |
| Chính | [`history/fgos-plugin-dev-skill-packaging-gap/`](../../docs/history/fgos-plugin-dev-skill-packaging-gap/) | Dev-skill không tới project chỉ cài plugin. |
| Chính | [`history/plugin-skill-cli-path-fallback/`](../../docs/history/plugin-skill-cli-path-fallback/) | Lệnh `bin/fgos.mjs` cứng làm hỏng skill ngoài repo fgOS. |
| Chính | [`history/fgos-skill-discovery-gap/`](../../docs/history/fgos-skill-discovery-gap/) | Dev-skill lồng hai cấp nên tool `Skill` không thấy. |
| Chính | [`history/plugin-skill-packaging-audit/`](../../docs/history/plugin-skill-packaging-audit/) | Kiểm toán đóng gói skill plugin. |
| Chính | [`history/orchestrator-vocabulary-disambiguation-pointer/`](../../docs/history/orchestrator-vocabulary-disambiguation-pointer/) | Từ "orchestrator" đổi nghĩa giữa các ADR mà người đọc không biết. |
| Chính | [`history/current-dispatch-vocabulary-overlay/`](../../docs/history/current-dispatch-vocabulary-overlay/) | Từ vựng dispatch hiện hành không có chỗ tra. |
| Chính | [`history/herdr-orchestrator-terminology-boundary/`](../../docs/history/herdr-orchestrator-terminology-boundary/) | Ranh giới từ "orchestrator" của Herdr và của fgOS. |
| Liên quan | [`history/tsk-3uw4-rul11-citation-gloss/`](../../docs/history/tsk-3uw4-rul11-citation-gloss/) | Sửa câu RUL11 trong spec cho đúng khuôn trích dẫn có gloss. |
| Liên quan | [`history/core-foundation-domain-boundary/`](../../docs/history/core-foundation-domain-boundary/) | D23: doctrine tách theo domain; phần còn lại là bố cục thư mục. |
| Liên quan | [`history/decision-code-check-enforcement/`](../../docs/history/decision-code-check-enforcement/) | Máy kiểm "không nhúng mã quyết định vào tên test" kiểu ratchet. |
| Liên quan | [`history/tsk-3x8-citation-drift-baseline-line-keying/`](../../docs/history/tsk-3x8-citation-drift-baseline-line-keying/) | Baseline khoá theo số dòng nên hiện vi phạm giả; đổi khoá theo nội dung. |
| Liên quan | [`history/tsk-6at-citation-drift-review-round/`](../../docs/history/tsk-6at-citation-drift-review-round/) | Vi phạm trùng khoá bị bỏ sót; đổi sang đếm số lần. |
| Liên quan | [`history/tsk-2sp-citation-drift-remaining-backlog/`](../../docs/history/tsk-2sp-citation-drift-remaining-backlog/) | Dọn 1.679 vi phạm định dạng trích dẫn còn lại. |
| Liên quan | [`history/tsk-12v-wide-sweep-agents-skills-root/`](../../docs/history/tsk-12v-wide-sweep-agents-skills-root/) | Mở rộng bề mặt quét sang `.agents/skills`. |
| Liên quan | [`history/fanout-and-delegation-rubric/`](../../docs/history/fanout-and-delegation-rubric/) | Tách `clarify` thành ba stage; phụ lục kiểm kê luật delegation nằm ở đâu. |
| Liên quan | [`history/worktree-guard-compound-command-prose-fix/`](../../docs/history/worktree-guard-compound-command-prose-fix/) | Guard worktree từ chối lệnh dispatch ghép; chỉ sửa được bằng ghi chú trong fragment. |
| Liên quan | [`history/tsk-3xd-decompose-child-directive-prose/`](../../docs/history/tsk-3xd-decompose-child-directive-prose/) | Việc con từ decompose chạy mù vì thiếu chỉ dẫn. |
| Liên quan | [`history/dispatch-concept-boundary/`](../../docs/history/dispatch-concept-boundary/) | Khoá từ vựng dispatch thành 18 D-ID; mô hình sau đó bị thay. |
| Liên quan | [`history/claude-code-hook-spawn-enoent/`](../../docs/history/claude-code-hook-spawn-enoent/) | Lỗi hook `posix_spawn '/bin/sh'`; runbook đề xuất không có trên main. |
| Liên quan | [`history/main-checkout-hook-wired-absolute-path/`](../../docs/history/main-checkout-hook-wired-absolute-path/) | Check `main-checkout-hook-wired` báo sai khi `core.hooksPath` tuyệt đối. |
| Bối cảnh | [`history/codebase-scatter-consolidation-roadmap/`](../../docs/history/codebase-scatter-consolidation-roadmap/) | Áp RUL11 lên code: xếp hạng 8 file lớn theo mức đau. |
| Bối cảnh | [`history/tsk-5wf-decision-doc-0029-supersede-0026-vocabulary/`](../../docs/history/tsk-5wf-decision-doc-0029-supersede-0026-vocabulary/) | Chính sách supersede là bản ghi mới. |
| Bối cảnh | [`history/spec-docs-lifecycle-realignment/`](../../docs/history/spec-docs-lifecycle-realignment/) | Sửa tên stage và skill đã gỡ còn sót trong spec và how-to. |
| Bối cảnh | [`history/close-distribution-spec-doctor-fix/`](../../docs/history/close-distribution-spec-doctor-fix/) | Spec distribution ghi RUL9, RUL11 sai thực tế. |
| Bối cảnh | [`history/tsk-3jy-judge-verify-prompt-pre-implementation-stage-context/`](../../docs/history/tsk-3jy-judge-verify-prompt-pre-implementation-stage-context/) | Prompt judge verify sai giai đoạn; cơ chế đã gỡ. |
| Bối cảnh | [`history/decision-schema-rationale-alternatives-source/`](../../docs/history/decision-schema-rationale-alternatives-source/) | Lược đồ ghi quyết định; không phải luật (xét rồi loại khỏi chủ đề). |
| Bối cảnh | [`history/test-suite-dry-consolidation/`](../../docs/history/test-suite-dry-consolidation/) | Gộp test trùng assertion; không đụng luật (xét rồi loại khỏi chủ đề). |
| Bối cảnh | [`history/merge-loop-skill/`](../../docs/history/merge-loop-skill/) | Thêm một skill wrapper; không có vấn đề luật (xét rồi loại khỏi chủ đề). |

**Thư mục thấy tên liên quan nhưng chưa đọc sâu** (nêu trong lượt quét, cần đọc nếu người làm nhóm B muốn phủ hết): `tsk-224-post-merge-prose-drift`, `tsk-104-cook-gate-bypass-prose-reconciliation` (prose "never auto-approve" của cook mâu thuẫn gate-bypass), `gate-question-quality-and-routing` (đo 314 lượt hỏi gate; tiền thân mẫu câu hỏi), `tsk-2yu-citation-baseline-cleanup`, `tsk-352f-generated-wrapper-d-local-citation-cleanup`, `launcher-vocabulary-rename`, `tsk-2uo-launcher-vocabulary-guard-allowlist`, `domain-workflow-skillmap-coverage-check`, `fgos-session-start-hook-worktree-root`, `dispatch-execute-prompt-file-flag`, `agy-herdr-interactive-mode-multiline-prompt-corruption`. Khoảng 321 thư mục trong `docs/history/` có nhắc `AGENTS.md` hoặc `CLAUDE.md`; chỉ các thư mục có tên rõ ràng về luật, instruction, prose, hook, vocabulary được mở.

### K. `docs/journals/`

| Mức | Tài liệu | Vấn đề chính |
|---|---|---|
| Liên quan | [`journals/260728-2130-hook-reachability-tsk-3w8.md`](../../docs/journals/260728-2130-hook-reachability-tsk-3w8.md) | Hook pre-commit có sẵn nhưng không ai bật; bài học "reachability không phải enforcement". |
| Liên quan | [`journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`](../../docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md) | Session checkout thẳng nhánh làm việc trên main; chỉ có câu nhắc trong prose của `pick` và `cook`. |
| Bối cảnh | [`journals/260728-2245-lifecycle-sync-gates-three-latent-bugs.md`](../../docs/journals/260728-2245-lifecycle-sync-gates-three-latent-bugs.md) | Ba lỗi gate im lặng; đề xuất bài học thành luật nhưng chưa thấy ghi. |
| Bối cảnh | [`journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md`](../../docs/journals/260728-2211-worktree-reclaim-data-loss-tsk-1os.md) | Mất dữ liệu khi reclaim worktree; bài học "fail closed" chưa thành luật. |
| Bối cảnh | [`journals/260728-2038-claim-port-str46-parallel-merge.md`](../../docs/journals/260728-2038-claim-port-str46-parallel-merge.md) | Va chạm merge giữa hai nhánh song song; không có bài học về luật (xét rồi loại). |

### L. Kế hoạch 260925 và thiết kế projection

Các tài liệu nằm trên nhánh remote `origin/plan/260925-documentation-authority-unification` (540 file dưới `plans/260925-documentation-authority-unification/`; đầu nhánh mà board ghi là `763568157` không có trong repo này, nên phần Phase 7 và Phase 8 Bước 3, 4 chỉ có hàng board làm bằng chứng) được ghi bằng đường dẫn, không có liên kết. Các file trên main có liên kết.

| Mức | Tài liệu | Điều nó nói về luật, instruction, projection |
|---|---|---|
| Chính | `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | Hợp đồng bộ ghép: đơn vị instruction (§5), thứ tự law đến preference (§6, §7), tập hiệu lực (§9), nghĩa vụ doctor (§11), ledger (§12). |
| Chính | `docs/platform/packaging-distribution/contracts/projection-ledger.md` | Ledger ghi "Partial"; chỉ có một entry cho khối `AGENTS.md`. |
| Chính | `archive/plans/260825-1841-knowledge-registry/phase-08-projections-doctor.md` | Nguồn gốc ý tưởng ảnh sinh ra có header cấm sửa tay kèm doctor check; chỉ cho registry tài liệu, không cho luật. |
| Chính | `plan.md`, `minimum-constitution.md`, `current-authority-map-2026-09-25.md` (nhánh) | Quyết định khoá 5 (cắt chuyển nguyên tử), 8 (bản sinh không lập thẩm quyền), §12.2 Agent Context Engine tách biệt; hiến pháp không có loại instruction; §4 "always-loaded bypasses". |
| Chính | `ledger/area-map-closing-instructions.md`, `area-map-root-authorities.md` (nhánh) | `AGENTS.md`, `CLAUDE.md` đặt `reclassify-out-of-platform-scope`; `architecture-manifest.json` và `platform-foundations.md` đổi chỗ; `docs/decisions/index.md` là bản sinh. |
| Chính | `reports/phase-07-08-prep/consumer-survey.md`, `phase-08-draft.md` (nhánh) | Nhóm A luôn nạp; bản vá khoá theo digest; bản render không bao giờ sửa tay. |
| Chính | `cutover-write-lease-design.md` (nhánh) | Khoá ghi phủ `docs/**`, `AGENTS.md`, `CLAUDE.md`, skill; không phủ `core/instructions`. |
| Liên quan | `transitional-switchboard.json`, `claim-and-disposition-vocabulary.*`, `shipped-path-conventions-inventory.md` (nhánh) | Switchboard ghi `docs/specs/platform-foundations.md` là non-authority projection; từ vựng `normative-law` ghi "L1–L8"; phân loại repo-local, consumer-project, mixed. |
| Liên quan | `independent-frontier-review-2026-09-25.md`, `...-rereview-...md`, `reports/phase-06/owner-answers.md` (nhánh) | Sửa `AGENTS.md` và luật khoá không qua cổng (H6); chiếu instruction giữ neo cũ; luật A13 về claim id khi gộp tiêu đề. |
| Liên quan | `dropped-claims-register.json`, `alias-table-and-resolver-contract.md`, `evidence-payload-relocation-policy.md` (nhánh) | 17 claim rơi (không mục nào về luật); bảng bí danh chỉ tra cứu; chính sách dời bằng chứng. |
| Bối cảnh | `phase-01` đến `phase-10`, `pilot/`, phần còn lại của `ledger/` và `reports/` (nhánh) | Không bàn về luật hay instruction, hoặc là diff và pack của khu agent-coordination (R2 đã xem khoảng 50 trong 540 file). |

### Ngoài `plans/`: nơi cần đối chiếu

| Nơi | Liên quan |
|---|---|
| [`docs/platform-foundations.md`](../../docs/platform-foundations.md) | Luật khoá L1–L10. |
| [`docs/specs/platform-foundations.md`](../../docs/specs/platform-foundations.md) | RUL11 (D-ADR0054), RUL104 (D-ADR0062), D-ADR0030, D-ADR0035 và phần Lịch sử quyết định. |
| [`docs/specs/distribution.md`](../../docs/specs/distribution.md) | RUL102: một owner duy nhất cho việc ghép instruction của agent (dòng 362). |
| [`docs/platform/proposals/documentation-system-unification.md`](../../docs/platform/proposals/documentation-system-unification.md) | §4.6 tầng giao luật và §4.7.2 Agent Context Engine. |
| [`docs/platform/intent-preservation-ledger.md`](../../docs/platform/intent-preservation-ledger.md) | PF-I007 "preserved future" cho Agent Context Engine. |
| [`docs/distribution-vision.md`](../../docs/distribution-vision.md) | Hướng cài đặt, setup, doctor; ghi đè project trên global. |
| [`docs/backlog.md`](../../docs/backlog.md) | Backlog `p-7eb9e65b`: fgOS và AgentKit ghi đè registration của nhau. |
| [`docs/decisions/index.md`](../../docs/decisions/index.md) | Bản chiếu sinh ra của quyết định (`fgos decision-index`). |
| [`docs/platform/agent-mailbox/spec.md`](../../docs/platform/agent-mailbox/spec.md) | Spec nháp mailbox: chèn instruction vào phiên agent (luồng MAIL). |
| [`core/instructions/decision-question.md`](../../core/instructions/decision-question.md) | Nguồn instruction hiện có. |
| [`core/instructions/design-principles.md`](../../core/instructions/design-principles.md) | Nguồn instruction hiện có; nguyên tắc 3 nói CLI là driver mỏng. |
| [`core/instructions/platform-laws.md`](../../core/instructions/platform-laws.md) | Nguồn instruction hiện có. |
| [`core/skills/_shared/decision-question.md`](../../core/skills/_shared/decision-question.md) | Mẫu câu hỏi quyết định đầy đủ. |
| [`src/setup/instruction-registry.mjs`](../../src/setup/instruction-registry.mjs) | Schema đơn vị instruction. |
| [`src/setup/instruction-composition.mjs`](../../src/setup/instruction-composition.mjs) | Bộ ghép tập instruction hiệu lực. |
| [`src/setup/instruction-projections.mjs`](../../src/setup/instruction-projections.mjs) | Phần render ra host. |
| [`.claude/skills/instruction-audit/SKILL.md`](../../.claude/skills/instruction-audit/SKILL.md) | Skill soát bề mặt instruction. |

### Đã xét và loại

Các tài liệu này trùng từ khoá nhưng không phải về luật hay instruction cho agent.

| Tài liệu | Lý do loại |
|---|---|
| [research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md](research-261020-0955-seat-binding-needs-and-mechanisms-inventory.md) | "luật" ở đây là luật chọn ghế và tier khi định tuyến, không phải luật cho agent. |
| [260930-0445-tier-rigor-vocabulary-consolidation/plan.md](../260930-0445-tier-rigor-vocabulary-consolidation/plan.md) | gom thang cấu hình tier và rigor, không phải instruction. |
| [261001-0327-request-to-run-track/red-team-scope-complexity-critic.md](../261001-0327-request-to-run-track/reports/red-team-scope-complexity-critic.md) | dùng RUL11 làm thước chấm plan, không bàn về việc tối ưu luật. |
| [git-lessons-sweep-261017/sweep3-tests-redo.md](git-lessons-sweep-261017/sweep3-tests-redo.md) | kiểm kê test Git, trùng từ khoá "rule" và "instruction" ngẫu nhiên. |
| [design-261016-1220-lock-and-run-supervisor-foundation-v3-r5.md](design-261016-1220-lock-and-run-supervisor-foundation-v3-r5.md) | "luật" là luật thiết kế của holder-lock, cùng loạt r1–r6. |
| [audit-260905-1636-fgos-code-panel-quality-audit.md](audit-260905-1636-fgos-code-panel-quality-audit.md) | chất lượng code của một crate. |
| [tsk-34y-260729-1735-test-assertion-shape-consolidation-report.md](tsk-34y-260729-1735-test-assertion-shape-consolidation-report.md) | gom trùng assertion trong test, không phải luật. |

## Bước tiếp theo

1. Thêm bốn nguồn quan trọng nhất vào mục 2 của handoff (đã làm trong cùng lượt này): cuộc điều tra harness 10-06, hai báo cáo đo hook và chỉ dẫn theo CLI, và các cơ chế tiền lệ.
2. Nhóm A của handoff dùng `archaeologist-261006` làm điểm xuất phát cho việc phân loại sở hữu thay vì kiểm lại từ đầu.
3. Nhóm C2 bắt đầu từ `research-261020-1612`: đo bổ sung omp và pi, và cập nhật với bản Claude, Codex, agy mới nhất.
4. Nhóm E của handoff nên đọc mục "Đối chiếu với thiết kế nhóm E" ở trên trước khi thiết kế: sổ cái nên mở rộng đơn vị instruction hiện có, không dựng kho mới; cần chốt thứ tự land với `forgentx-5f` và nhà thật của RUL và D-ADR sau cắt chuyển.

## Câu hỏi chưa giải quyết

- Nhánh `plan/260925-documentation-authority-unification` chỉ có trên remote tới `168a27c6c`; cần lấy đầu nhánh `763568157` (hoặc hỏi `forgentx-5f`) để kiểm 331 bản vá và Phase 7, Phase 8 Bước 3, 4.
- Mười một thư mục cuối nhóm J chưa đọc sâu; có cần đọc không?
- Plan `260919-coordination-skill-harness-simplification` được `architecture-advisory-260926-1322` nhắc tới nhưng không còn dưới `plans/`; có thể đã lưu trữ hoặc đổi tên. Em chưa tìm ra.
- Các tài liệu mức Liên quan trong nhóm F và G chỉ được phân loại qua phần tóm tắt đầu file. Anh muốn em đọc trọn nhóm nào trước khi giao cho người làm nhóm B?

## Việc sẽ làm khi cần

Anh chưa cần ngay (2026-10-21). Ghi lại để không quên.

- **Hỏi `forgentx-5f` về 331 bản vá của kế hoạch tài liệu 260925.** Phiên đó chạy ở **máy khác**, nên không lấy được đầu nhánh `763568157` bằng `git fetch` ở máy này (nhánh remote chỉ tới `168a27c6c`, ngày 10-13). Khi cần, nhắn hỏi họ: họ định vá file nào trong `AGENTS.md`, `core/instructions/` và skill; và khi nào áp ở Phase 9. Cần làm **trước khi** sửa các file đó (nhóm B1, B3 và nhóm G của handoff), và để chốt thứ tự land giữa sổ luật và Phase 9 (14.1 đến 14.3).
