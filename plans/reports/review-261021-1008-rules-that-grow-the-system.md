# Vì sao hệ thống phình: luật nào đang đẩy nó to ra

Soát của `forgentx-95`, 2026-10-21 10:08. Owner hỏi lúc 10:06: "xem lại coi luật lệ của chúng ta có gì bất ổn không mà hệ thống lại phình". Báo cáo này chỉ phân tích và đề xuất. Mọi thay đổi luật đều là quyết định của owner: luật đã khoá thì phải supersede, không sửa tại chỗ.

## 1. Số liệu

Lấy từ `git log --numstat --no-merges`, không tính commit merge.

| Từ 10-10 tới 10-21 | Thêm | Xoá | Ròng |
|---|---|---|---|
| Rust (`packages/`) | +118 132 | −14 056 | **+104 076** |
| Node (`src/`) | +38 860 | −23 295 | **+15 565** |
| Test (`test/`) | +58 036 | −24 685 | **+33 351** |
| Docs | +10 717 | −2 857 | +7 860 |

- **Chuyển sang Rust mà Node không nhỏ đi.** Lớn nhất là git +32 337 dòng Rust, event-store +14 388, run-supervisor +9 643, process +7 649, holder-lock +7 512. Cũng trong thời gian đó Node vẫn tăng:
  - `src/holder-lock` +2 462, hiện khoảng 2 400 dòng: `index.mjs` 718, `fences.mjs` 519, `hold-transport.mjs` 507, `driver.mjs` 370;
  - `src/run-supervisor` +1 196;
  - `src/setup` +2 845;
  - `src/workflow` +3 084.

  Thư mục duy nhất giảm rõ là `src/runner/dispatch` (−2 538).
- **Test tăng nhanh hơn code.** Test tăng ròng +33 nghìn dòng, Node chỉ +15,5 nghìn. Từ 10-01 thêm 266 file test, xoá 102. Toàn suite giờ chạy 1 046–1 316 s.
- **Bề mặt luật và tài liệu chỉ có tăng:**
  - 144 doctor check;
  - 105 mã RUL;
  - 16 spec dài 10 852 dòng;
  - `AGENTS.md` 29,8 KB, cộng phần instruction luôn được nạp là 35,6 KB;
  - board 296 dòng, 171 KB;
  - 759 báo cáo.
- **SEAT tới phase 06:**
  - Node: +2 944 / −1 683;
  - Rust: +5 492;
  - test: +5 986 / −1 200.

## 2. Phát hiện: luật nào đẩy hệ thống to ra

### R1. Có luật bắt thêm, không có luật bắt bớt (gốc của các mục khác)

- **Luật bắt thêm:** L5 câu 5 bắt có bằng chứng, nên mỗi việc thêm test. Cổng install/setup/doctor bắt thêm doctor row cho mỗi config, env hay phụ thuộc mới. Thay đổi người dùng thấy thì thêm dòng CHANGELOG. Sự thật mới thì thêm vào spec. Quyết định mới thì thêm mã RUL.
- **Luật bắt bớt chỉ có hai,** và chỉ chạy khi ai đó chủ động thay một cơ chế:
  - L10, "đổi contract thì xoá đường cũ";
  - nguyên tắc 1, "thay thì chuyển hết caller rồi xoá".
- Không cổng nào đo **kích thước ròng** của một thay đổi hay một plan. Vì vậy luật bắt thêm luôn thắng.

**Đề xuất:** cổng "kích thước ròng" cho mỗi phase và mỗi plan.
- Báo cáo nêu Δ dòng của Node, Rust và test.
- Nếu tăng thì phải ghi lý do, và ghi thứ gì sẽ bị xoá ở bước nào.
- Mẫu phase (`ak-plan`) phải có mục **Delete** và **Tests to retire** bắt buộc, giống mục Create.

### R2. "Rust first" không bắt Node co lại, nên foundation thành nửa nửa

- **Luật hiện tại:** nguyên tắc 4 bảo foundation viết bằng Rust. Nhưng không luật nào nói: khi authority đã sang Rust thì phần Node phải co về client mỏng **trong cùng plan**.
- **Hậu quả:** Rust tăng 104 nghìn dòng mà Node không giảm. `src/holder-lock` dày 2,4 nghìn dòng. Đây đúng là "foundation nửa nửa mất ổn định" như anh nói lúc 10:01.

**Đề xuất:**
- Mỗi component foundation có một **ngân sách Node**: client mỏng, giới hạn số dòng hoặc số export, ghi trong spec của component.
- Plan nào chuyển authority sang Rust thì phải xoá bản Node đang tự quyết trong cùng plan (áp L10 vào việc chuyển ngôn ngữ).

### R3. Cổng install/setup/doctor gắn một doctor row cho mỗi thứ mới, và không bao giờ gỡ

- **Luật hiện tại:** `AGENTS.md`, mục "Install/setup/doctor gate", yêu cầu mọi config default, env var hay phụ thuộc hạ tầng mới phải đăng ký vào config-merge của `fgos setup` và vào registry của `fgos doctor`.
- **Hậu quả:** 144 doctor check; `src/setup` tăng +2 845 dòng từ 10-10 (13 846 dòng tổng).
- **Lỗ hổng:** không luật nào bắt gỡ row khi cơ chế đi. SEAT phải tự đi gỡ `runner-rigor-config` và `capability-rigor-ceiling`.

**Đề xuất:**
- Gom row theo component, mỗi component một hoặc vài row sức khoẻ, không làm một row cho mỗi khoá.
- Row thuộc component nào thì gỡ cùng lúc khi cơ chế của component đó bị xoá.
- Đặt trần cho số row; vượt trần thì phải gộp.

### R4. Luật "không cần tương thích ngược" mâu thuẫn với việc cài thật ở nhiều nơi

- **Memory ghi** (owner nói nhiều lần, ghi lại 09-29): một người dùng, không cần backward compatible, không alias, không giữ đường cũ.
- **Thực tế:** fgOS chạy trên 3 workspace và 2 máy, cùng một file `~/.fgos/config.json` mà release nào cũng đọc, cùng các run cũ đang dở. Vì thế mỗi thay đổi lại dựng thêm fence, drain, bộ đọc legacy và bước chuyển đổi.
  - SEAT có các phase −01, 05, 09 cùng file `legacy-seat-read.mjs`.
  - holder-lock có `fences.mjs` 519 dòng.
  - Lần land lock protocol 2 chặn commit mọi phiên suốt 2 giờ rưỡi.
- Hai luật ngầm này kéo về hai phía. Chưa có luật nào nói rõ phải tương thích **tới đâu**.

**Đề xuất:** owner chốt một chính sách tương thích tường minh. Ví dụ:
- dừng toàn bộ rồi land cùng lúc trên mọi workspace và mọi máy, không chạy song song hai release;
- dữ liệu cũ chỉ cần đọc được qua một đường đọc duy nhất, không giữ đường ghi cũ;
- fence và drain chỉ tồn tại qua một release, sau đó xoá.

### R5. Hội đồng và red-team chỉ thêm, gần như không bớt

- **Quy trình hiện tại:** mỗi vòng review được hỏi "còn thiếu gì", nên đầu ra gần như toàn yêu cầu thêm: guard, contract, refusal có tên, test.
- **Ví dụ SEAT:**
  - hội đồng ra G1–G8, tám việc thêm;
  - red-team ra 37 phát hiện, nhận 16;
  - plan lên 14 phase;
  - spec dài 444 dòng.
- Không vòng nào được hỏi "cái gì có thể bỏ".

**Đề xuất:**
- Mỗi hội đồng và mỗi red-team phải nộp thêm một **danh sách bỏ**: cơ chế, kiểm tra, test, row có thể xoá.
- Phát hiện nào đòi thêm thì phải nêu thứ nó thay hoặc xoá, hoặc nói rõ vì sao không có gì để xoá.
- Big lead chấm phát hiện theo cả lợi ích lẫn kích thước.

### R6. Quy trình tạo test chỉ thêm (đã có trong đề xuất HARDEN, mục 4.7b)

- **Luật hiện tại:** mẫu phase có mục "Tests (proofs owned)" chỉ liệt kê test mới. Brief của lead nói "viết test mà phase file liệt kê".
- **Lỗ hổng:**
  - kiểm tra trùng trong `npm test` chỉ bắt test sao chép y nguyên từng byte;
  - nguyên tắc 8 mới thành luật gần đây, test cũ chưa được dời xuống tầng thấp;
  - không có ngân sách thời gian chạy cho từng area.

**Đề xuất:**
- Mẫu phase bắt buộc có mục "Tests to retire/merge".
- Mỗi area có ngân sách wall time; vượt thì phải gộp hoặc dời test xuống tầng thấp.
- Lead brief bắt tìm test chủ trước khi viết test mới.

### R7. Bề mặt luật chỉ tăng (liên quan cổng 6 mới của HARDEN)

- **Hiện trạng:** mỗi quyết định thêm một mã RUL hoặc một đoạn vào `AGENTS.md` hay vào spec, rất hiếm khi gỡ. Số liệu ở mục 1: 105 RUL, 35,6 KB instruction luôn nạp, board 171 KB.
- **Hậu quả:** agent đọc nhiều token hơn, và luật dễ trùng hoặc mâu thuẫn nhau. R4 là một ví dụ.

**Đề xuất:**
- Định kỳ soát bề mặt luật bằng skill `instruction-audit` (đã có).
- Mỗi luật mới phải nói nó thay luật nào, hoặc vì sao không thay luật nào.
- Board giữ phần "đang chạy" ngắn gọn, phần log chuyển ra file lưu trữ theo tháng.

## 3. Áp ngay cho SEAT (trong khung đã duyệt)

- **Mốc đo sau phase 08** (owner đồng ý 10:06): Node và test của SEAT phải giảm ròng so với lúc trước SEAT. Nếu không giảm thì dừng, soát, báo owner trước khi làm 09–11.
- **Brief của phase 07 và 08** thêm hai yêu cầu:
  - danh sách xoá: `walkBindings`, `listCandidates`, `nextCandidate`, `retrySameCandidate`, `resolveTierModel`, `resolveTierCandidates`, `tierFallbackOf`, cùng test của chúng;
  - báo cáo Δ dòng của Node và test.
- **Soát lại phần SEAT đã làm** theo R2 và R4: `legacy-seat-read.mjs` và fence `-01` có cần không, hay một lần dừng toàn bộ là đủ (R4). Chờ owner chốt chính sách tương thích.

## 4. Câu hỏi cho owner

1. Thêm **cổng kích thước ròng** (R1), cùng mục **Delete** và **Tests to retire** bắt buộc trong mẫu phase (R1, R6)?
2. **Ngân sách Node cho mỗi foundation** và luật "chuyển authority sang Rust thì xoá Node trong cùng plan" (R2)? Luật này nên thành RUL mới, sửa nguyên tắc 4, hay đi theo plan HARDEN?
3. **Chính sách tương thích** (R4): chốt "dừng toàn bộ, land cùng lúc; dữ liệu cũ chỉ cần một đường đọc; fence và drain sống tối đa một release"?
4. Doctor row theo component, có trần, gỡ cùng cơ chế (R3)?
5. Hội đồng và red-team phải nộp **danh sách bỏ** (R5)?
6. Có đưa phần soát bề mặt luật (R7) vào HARDEN như một tầng ngang, chạy cùng cổng 6, không?
