# Hướng dẫn: giữ định tuyến riêng của owner khi bản chuẩn không còn nêu pool `thehive`

Dành cho: owner, trên máy owner, fg-server và fg-server2. Người viết: HARDEN (packaging P01). Trạng thái: **đề xuất, chờ owner áp dụng**. HARDEN không tự sửa tệp cấu hình nào của owner (`~/.fgos/config.*` và `.fgos/config.*`).

> **Điều kiện trước hết:** chỉ kích hoạt bản phát hành kế tiếp trên một máy **sau khi** máy đó đã làm xong mục "Các dòng cần thêm" dưới đây (nếu máy đó còn muốn chạy qua `thehive`). fg-server2 làm ở bước của big lead.

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

## Vì sao sáu ô này không đặt được trong `~/.fgos/config.yaml`

Cấu hình toàn cục **không** giữ ô tier dạng danh sách hoặc `model@pool` (RUL102): bộ nạp bỏ ô đó kèm cảnh báo và dòng doctor `global-model-policies-portable` fail. Lý do gốc là bản cũ trên cùng máy đọc tệp toàn cục; owner đã quyết các máy nâng cấp cùng lúc nên lý do đó đã hết. Big lead đang hỏi owner có nới quy tắc này không; nếu nới thì có một phase riêng và hướng dẫn này được cập nhật. Owner đã chọn nới quy tắc này ở một phase sau; khi phase đó land, sáu ô chuyển sang `~/.fgos/config.yaml` và cách đặt trong tệp dự án dưới đây chỉ là tạm thời. **Cho đến lúc đó**, sáu ô nằm trong tệp **dự án** (`.fgos/config.yaml`), nơi mọi dạng ô đều được nhận.

Khóa còn lại bạn cần cho máy (kỹ năng) vẫn đặt ở tệp toàn cục như hướng dẫn cook.

## Các dòng cần thêm (tệp dự án: `.fgos/config.yaml`, mỗi dự án muốn giữ thehive)

Dự án nào của owner muốn z-ai và deepseek tiếp tục đi qua `thehive` trước thì thêm sáu ô. Dùng cửa cấu hình để có `@fgos:why`:

```sh
fgos config set runner.modelPolicies.z-ai.nano      '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.z-ai.standard  '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.z-ai.mini      '["thehive/zai-org/glm-5.3-flash@thehive","z-ai/glm-5.3-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.nano     '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.standard '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
fgos config set runner.modelPolicies.deepseek.mini     '["thehive/deepseek-ai/deepseek-v4.1-flash-1017@thehive","deepseek/deepseek-v4.1-flash@openrouter"]' --reason "owner: thehive trước, OpenRouter dự phòng"
```

Hoặc viết tay (gộp vào khối `runner.modelPolicies` đã có, không tạo khối thứ hai):

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

Dự án `forgent` đã có sẵn ô `deepseek.advanced` đi qua thehive (ghi 2026-10-25); `advanced` không đổi trong bản chuẩn nên không cần thêm.

Không có khai báo nào cần thêm vào `~/.fgos/config.yaml` cho thay đổi này. Nếu dự án không thêm sáu ô, z-ai và deepseek chạy qua OpenRouter, không qua thehive.

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

Chỉ được khác: `generated_at`, `data_hash` và dòng định nghĩa tier (nay bằng tiếng Anh). `executor`, `model`, `tier`, `family` phải giữ nguyên. Với z-ai và deepseek: `fgos config show --json`, đọc `data.value.runner.modelPolicies["z-ai"].standard` và `.deepseek.standard`, phải là danh sách có thehive nếu bạn muốn giữ nó. Cuối cùng `fgos doctor`: `model-policy-pools` không cảnh báo, `global-model-policies-portable` pass.

Máy chưa có CLI nào: `fgos run` thoát mã 4 với `agent-cli-missing: ... install one of claude, codex, omp, pi, then run "fgos doctor"`.

## Hoàn tác

Xóa sáu ô vừa thêm (`fgos config unset runner.modelPolicies.z-ai.nano` ... hoặc xóa dòng) và kích hoạt lại bản trước (`fgctl repair` hoặc `fgctl init --override-pin`). Bản trước tự nêu thehive trong bản chuẩn, và các ô khai trong dự án gộp trùng khớp nên không xung đột.

## Đã kiểm chứng trên nhánh (2026-11-12)

- Máy này (đủ claude, codex, omp, pi): `fgos dispatch explain --for execute` và `--for review` trong dự án forgent, bản đang kích hoạt so với nhánh: cùng executor `gemini`, cùng model (`gemini-3.8-flash-high`, `gemini-3.8-flash-medium`), cùng tier. Khác duy nhất: dòng định nghĩa tier bằng tiếng Anh; invocation `omp-herdr` so với `omp-cli-bwrap` là do phiên so sánh chạy ngoài herdr, không phải do thay đổi.
- HOME trống, PATH không có CLI agent: `fgos run "say hi"` thoát mã 4 với `agent-cli-missing`; thêm một `claude` giả vào PATH thì `execute` bind `claude`; chỉ có `omp` thì bind `gemini` qua `omp-cli-bwrap`.

## Chưa kiểm chứng

Chưa chạy trên máy owner và fg-server; chưa chạy `fgos doctor` thật sau khi thêm sáu ô (test của repo phủ hai dòng doctor và việc bỏ qua CLI vắng).
