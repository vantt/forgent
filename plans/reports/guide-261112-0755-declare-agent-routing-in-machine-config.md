# Hướng dẫn: giữ định tuyến riêng của owner khi bản chuẩn không còn nêu pool `thehive`

Dành cho: owner, trên máy owner, fg-server và fg-server2. Người viết: HARDEN (packaging P01, cập nhật 2026-11-12 sau quyết định 86 Q1 (a)). Trạng thái: **đề xuất, chờ owner áp dụng**. HARDEN không tự sửa tệp cấu hình nào của owner (`~/.fgos/config.*` và `.fgos/config.*`).

> **Điều kiện trước hết:** trên mỗi máy, làm theo thứ tự: (1) "Bước 0: kiểm tra pin", (2) "Các dòng cần thêm" vào `~/.fgos/config.yaml` (nếu máy đó còn muốn chạy qua `thehive`), (3) mới kích hoạt bản phát hành kế tiếp. fg-server2 làm ở bước của big lead.

## Chuyện gì thay đổi và vì sao

Quyết định 80 Q1 (a): mặc định của bản phát hành chỉ định tuyến tới CLI agent **có trên máy**, định tuyến riêng của owner nằm trong cấu hình của máy owner, và máy không có CLI agent nào thì `fgos run` báo `agent-cli-missing` kèm cách sửa.

Ba thay đổi người dùng thấy:

1. **Bind chỉ chọn executor có CLI trên PATH.** Executor nào chạy chương trình (`claude`, `codex`, `omp`, `pi`) mà máy không có thì bị bỏ qua, `fgos dispatch explain` ghi lý do `cli-missing`. Máy owner có đủ bốn CLI nên không đổi gì. Kiểm tra: mục "Đã kiểm chứng" bên dưới.
2. **Hai dòng doctor** `executor-skills-installed` và `confined-pane-accounts` bỏ qua (skip, không fail) executor có CLI chưa cài. Tên dòng và số dòng không đổi.
3. **Bản chuẩn không còn pool `thehive`.** Trong `core/config-standard/runner.yaml`, sáu ô tier trước đây là danh sách "thehive trước, OpenRouter sau":

   | Ô | Trước | Nay |
   |---|---|---|
   | `modelPolicies.z-ai.nano`, `.standard`, `.mini` | `["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]` | `"z-ai/glm-5.3-flash@openrouter"` |
   | `modelPolicies.deepseek.nano`, `.standard`, `.mini` | `["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]` | `"deepseek/deepseek-v4.1-flash@openrouter"` |

   Pool `thehive` là tài khoản riêng của owner; máy khác không có nên mỗi lần chạy doctor `model-policy-pools` còn cảnh báo. Tài khoản của owner vẫn nằm trong `~/.fgos/private/accounts.yaml`, không đổi.

Không đổi: các chuỗi `prefer` (đã liệt kê đủ CLI; bộ lọc CLI-có-mặt tự quyết cái nào tính), khai kỹ năng `ak:cook` (đã chuyển sang cấu hình máy theo hướng dẫn [declare-cook-skill-in-machine-config](guide-261109-1837-declare-cook-skill-in-machine-config.md)), tệp tài khoản.

## Sáu ô nay đặt một lần trong `~/.fgos/config.yaml`

Quyết định 86 Q1 (a) (2026-11-12) nới RUL102: cấu hình toàn cục `~/.fgos/config.yaml` nhận ô tier dạng danh sách, `model@pool` và đối tượng như tệp dự án. Bộ nạp không còn bỏ ô đó và không còn cảnh báo; dòng doctor `global-model-policies-portable` đã bị xóa. Thứ tự ưu tiên giữ nguyên: bản chuẩn < toàn cục < dự án, từng ô một. Hồ sơ: D-ADR0075 trong `docs/platform/runner/decisions/h-36d872fbb0e5.md`.

Hệ quả: sáu ô `thehive` khai **một lần mỗi máy** ở tệp toàn cục, mọi dự án trên máy đó dùng chung; không cần chép vào từng tệp dự án nữa. Cách đặt trong tệp dự án (bản trước của hướng dẫn này) chỉ là tạm thời và được gỡ ở "Gỡ các ô tạm trong tệp dự án".

## Bước 0: kiểm tra pin trên từng máy (trước khi kích hoạt)

Lý do: RUL102 cũ bảo vệ dự án ghim bản phát hành trước 2026-10-17, vì bản đó fail với ô danh sách và chạy `model@pool` như tên model. Quy tắc đã bỏ nên một dự án như vậy trên cùng máy sẽ hỏng khi đọc tệp toàn cục có ô danh sách. Không có dòng doctor nào còn canh việc này (bản phát hành không ghi ngày hay phiên bản, doctor không liệt kê được dự án khác), nên owner kiểm tay một lần:

```sh
# mỗi dự án có fgOS trên máy này (cd vào từng dự án)
fgctl status                      # dòng activeArtifactDigest
cat .fgos/installation/activation.json   # activatedAt, artifactDigest, pinSnapshot
```

Đọc `activatedAt`: dự án kích hoạt từ 2026-10-17 trở đi đọc được ô danh sách. Dự án kích hoạt trước đó, hoặc ghim `exact-digest` vào một bản cũ (xem ngày dựng thư mục `~/.local/state/fgos/releases/<digest>`), phải nâng bản (`fgctl upgrade`) hoặc không dùng chung máy với tệp toàn cục có ô danh sách. Liệt kê dự án: các thư mục có `.fgos/installation/activation.json`, ví dụ `find ~ -maxdepth 6 -path '*/.fgos/installation/activation.json'`.

Kết quả đã đo trên fg-server2 (2026-11-12): một dự án có activation, `forgent`, ghim `sha256:ed51feeafded...` kích hoạt 2026-11-09; không có pin nào trước 2026-10-17. Máy owner và fg-server: chưa đo.

## Các dòng cần thêm (tệp toàn cục: `~/.fgos/config.yaml`, một lần mỗi máy)

`fgos config set` không có cờ chọn tệp toàn cục: với khóa `runner.modelPolicies` nó ghi vào tệp **dự án** (chỉ khóa `global-only` mới vào tệp toàn cục). Vì vậy bước này là sửa tay `~/.fgos/config.yaml`. Gộp vào khối `runner.modelPolicies` đã có nếu có, đừng tạo khối thứ hai (máy này chưa có khối đó):

```yaml
runner:
  modelPolicies:
    z-ai:
      nano: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
      standard: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
      mini: ["thehive/zai-org/glm-5.3-flash@thehive", "z-ai/glm-5.3-flash@openrouter"]
    deepseek:
      nano: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
      standard: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
      mini: ["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive", "deepseek/deepseek-v4.1-flash@openrouter"]
```

Kiểm tra: `fgos config check` (không fail), `fgos config show --json`, đọc `data.value.runner.modelPolicies["z-ai"].standard` và `.deepseek.standard`: phải là danh sách có thehive, và `fgos dispatch explain --for execute` không đổi so với trước.

Nếu muốn dùng lệnh thay vì sửa tay thì lệnh `fgos config set` dưới đây ghi vào tệp **dự án** (đây chính là cách tạm trước đây, dùng cho một dự án riêng muốn khác máy):

```sh
fgos config set runner.modelPolicies.z-ai.nano      '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.z-ai.standard  '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.z-ai.mini      '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.nano     '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.standard '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.mini     '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
```

Dự án `forgent` còn ô `deepseek.advanced`, `flagship`, `frontier` và `z-ai` cao hơn đi qua thehive trong tệp dự án (ghi 2026-10-25 và 2026-11-09); chúng không đổi trong bản chuẩn nên không bắt buộc chuyển. Chuyển chúng sang tệp toàn cục là lựa chọn riêng của owner.

## Gỡ các ô tạm trong tệp dự án

Dự án nào đã thêm sáu ô theo bản trước của hướng dẫn này (cách tạm) thì sau khi tệp toàn cục đã có sáu ô và `fgos dispatch explain` cho kết quả như cũ, xóa chúng khỏi tệp dự án, mỗi dự án một commit riêng để dễ hoàn tác:

```sh
fgos config unset runner.modelPolicies.z-ai.nano
fgos config unset runner.modelPolicies.z-ai.standard
fgos config unset runner.modelPolicies.z-ai.mini
fgos config unset runner.modelPolicies.deepseek.nano
fgos config unset runner.modelPolicies.deepseek.standard
fgos config unset runner.modelPolicies.deepseek.mini
```

(Ô có ghi chú `@fgos:why` cần thêm `--acknowledge-comment-loss`.) Không xóa `deepseek.advanced` và các ô khác của dự án `forgent`. Nếu một dự án giữ ô của riêng nó, ô đó vẫn thắng tệp toàn cục.

## Kiểm tra routing không đổi

Trước khi kích hoạt (bản đang chạy) và sau khi kích hoạt, trong cùng dự án:

```sh
fgos dispatch explain --for execute > /tmp/explain-execute-truoc.json    # chạy trước kích hoạt
fgos dispatch explain --for review  > /tmp/explain-review-truoc.json
# kích hoạt bản mới, rồi:
fgos dispatch explain --for execute > /tmp/explain-execute-sau.json
fgos dispatch explain --for review  > /tmp/explain-review-sau.json
diff /tmp/explain-execute-truoc.json /tmp/explain-execute-sau.json
diff /tmp/explain-review-truoc.json /tmp/explain-review-sau.json
```

Chỉ được khác: `generated_at`, `data_hash` và dòng định nghĩa tier (nay bằng tiếng Anh). `executor`, `model`, `tier`, `family` phải giữ nguyên. Với z-ai và deepseek: đã nêu ở mục kiểm tra phía trên (ô phải là danh sách có thehive nếu bạn muốn giữ nó). Cuối cùng `fgos doctor`: `model-policy-pools` không cảnh báo (dòng `global-model-policies-portable` không còn).

Máy chưa có CLI nào: `fgos run` thoát mã 4 với `agent-cli-missing: ... install one of claude, codex, omp, pi, then run "fgos doctor"`.

## Hoàn tác

1. Xóa sáu ô khỏi `~/.fgos/config.yaml` (sửa tay), trên máy nào đã thêm. Việc này **bắt buộc trước** khi kích hoạt lại một bản trước 2026-11-12 hoặc một bản cũ hơn 2026-10-17: bản trước nới quy tắc bỏ ô danh sách trong tệp toàn cục và chạy `fgos doctor` fail dòng `global-model-policies-portable`; bản trước 2026-10-17 còn fail khi đọc ô danh sách.
2. Kích hoạt lại bản trước (`fgctl repair` hoặc `fgctl init --override-pin`). Bản trước tự nêu thehive trong bản chuẩn, nên không cần gì thêm.
3. Nếu đã gỡ các ô tạm trong tệp dự án: hoàn tác commit gỡ đó, hoặc thêm lại sáu ô bằng các lệnh `fgos config set` ở trên.

## Đã kiểm chứng trên nhánh (2026-11-12)

- Máy này (đủ claude, codex, omp, pi): `fgos dispatch explain --for execute` và `--for review` trong dự án forgent, bản đang kích hoạt so với nhánh: cùng executor `gemini`, cùng model (`gemini-3.8-flash-high`, `gemini-3.8-flash-medium`), cùng tier. Khác duy nhất: dòng định nghĩa tier bằng tiếng Anh; invocation `omp-herdr` so với `omp-cli-bwrap` là do phiên so sánh chạy ngoài herdr, không phải do thay đổi.
- HOME trống, PATH không có CLI agent: `fgos run "say hi"` thoát mã 4 với `agent-cli-missing`; thêm một `claude` giả vào PATH thì `execute` bind `claude`; chỉ có `omp` thì bind `gemini` qua `omp-cli-bwrap`.

## Chưa kiểm chứng

Chưa chạy trên máy owner và fg-server (kể cả bước 0: pin của dự án ở hai máy đó chưa đo); chưa chạy `fgos doctor` thật sau khi thêm sáu ô vào tệp toàn cục (test của repo phủ hai dòng doctor, việc bỏ qua CLI vắng, và việc ô danh sách, `model@pool` và đối tượng trong tệp toàn cục được nạp nguyên và bị ô dự án ghi đè).
