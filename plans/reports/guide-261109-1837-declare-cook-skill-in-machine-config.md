# Hướng dẫn: khai báo kỹ năng cook trong cấu hình của máy

Dành cho: owner, trên máy owner, fg-server và fg-server2. Người viết: COOK. Trạng thái: **đề xuất, chờ owner áp dụng hoặc cho phép COOK áp dụng**. COOK không tự sửa cấu hình của owner.

> **Điều kiện trước hết:** kích hoạt bản phát hành kế tiếp trên máy của owner và trên fg-server **chỉ sau khi** các dòng khai kỹ năng cook ở dưới đã nằm trong cấu hình của máy đó. fg-server2 đã khai (18 dòng trong `~/.fgos/config.yaml`, bản sao lưu `~/.fgos/config.yaml.bak-261109-cook-skill`).

## Chuyện gì thay đổi và vì sao

Cấu hình chuẩn đi kèm bản phát hành (`core/config-standard/runner.yaml`) từng khai `supports.skills: ["ak:cook"]` cho sáu executor (`claude`, `glm`, `openai`, `gemini`, `xai`, `deepseek`). Theo quyết định 79 Q5 (fgOS không cần biết có hay không `ak-cook`) và quyết định 80 Q1 (định tuyến theo máy nằm trong cấu hình của máy), bản chuẩn không còn nêu tên kỹ năng của một bộ kỹ năng bên ngoài. Máy nào dùng `ak:cook` thì tự khai nó.

## Thứ tự: khai trước, rồi mới kích hoạt bản phát hành mới

Thay đổi này nằm trong bản chuẩn của bản phát hành kế tiếp. Nếu một máy kích hoạt bản đó mà chưa khai, thì một Unit có `skills: ["ak:cook"]` sẽ bị `bind()` từ chối với lý do `skills-unavailable`, nêu tên kỹ năng thiếu. Các lần chạy khác không bị ảnh hưởng, vì chỉ Unit nào nêu tên kỹ năng mới hỏi tới nó. Khai trước thì không có khoảng trống.

## Các dòng cần thêm (tệp toàn cục của máy: `~/.fgos/config.yaml`)

Khóa `runner.executors.<id>.supports.skills` có phạm vi `both` (đặt được ở tệp toàn cục lẫn tệp dự án). Với định tuyến theo máy, đặt ở tệp toàn cục:

```yaml
runner:
  executors:
    claude:
      supports:
        skills: ["ak:cook"]
    glm:
      supports:
        skills: ["ak:cook"]
    openai:
      supports:
        skills: ["ak:cook"]
    gemini:
      supports:
        skills: ["ak:cook"]
    xai:
      supports:
        skills: ["ak:cook"]
    deepseek:
      supports:
        skills: ["ak:cook"]
```

Nếu tệp đã có khối `runner:` thì gộp các executor vào khối đó, đừng tạo khối thứ hai. Máy nào chỉ dùng một vài executor thì chỉ cần khai những executor đó.

Cách khác: khai trong tệp dự án `.fgos/config.yaml` (tệp này nằm trong git, nên áp dụng cho mọi máy clone repo này). Lệnh `fgos config set runner.executors.claude.supports.skills '["ak:cook"]' --reason "<lý do>"` mặc định ghi vào tệp dự án. Chọn tệp toàn cục hay tệp dự án là việc của owner.

## Kiểm tra sau khi khai

1. `fgos config check`: không có finding mức `fail`.
2. `fgos config show --json`: trong `data.value.runner.executors`, mỗi executor đã khai phải có `supports.skills` bằng `["ak:cook"]`. Đây là giá trị hiệu lực đã gộp cả tệp toàn cục. **Đừng dùng `fgos config explain` để kiểm:** với khóa này nó vẫn in `current: null` và `file: null` dù tệp toàn cục đã khai (COOK đã thử trên nhánh, không có giá trị nào từ bản chuẩn nữa), nên nó không phản ánh giá trị toàn cục.
3. `fgos doctor`: dòng `executor-skills-installed` kiểm từng kỹ năng đã khai có `SKILL.md` trong thư mục kỹ năng của runtime đó (`claude` đọc `.claude/skills/ak-cook`, `openai` đọc `.agents/skills/ak-cook`, `gemini` và `xai` đọc `.omp/skills/ak-cook`, `glm` và `deepseek` đọc `.pi/skills/ak-cook`).

## Hoàn tác

Xóa các dòng vừa thêm (hoặc `fgos config unset runner.executors.<id>.supports.skills` cho tệp dự án). Sau đó một Unit nêu `ak:cook` bị từ chối `skills-unavailable` cho tới khi khai lại.

## Đã kiểm chứng trên nhánh (2026-11-09)

- Với `~/.fgos/config.yaml` thật của fg-server2 (đã khai sáu executor) và bản chuẩn của nhánh (không còn `ak:cook`), một Unit chỉ đọc có `skills: ["ak:cook"]` chạy qua `npm run fgos:dev -- run --unit` bind được vào `gemini` (omp-herdr) và kết thúc `pass`.
- Đối chứng: cùng Unit với một HOME rỗng (không có khai báo toàn cục) bị từ chối ngay với `policy-refusal`, lý do `skills-unavailable`, chi tiết `executor "claude" does not declare skills [ak:cook]`. Đó là đường từ chối sẵn có của `bind()`.

## Chưa kiểm chứng

COOK chưa chạy `fgos doctor` sau khi khai (dòng `executor-skills-installed`) và chưa kiểm trên máy của owner và fg-server. Test của repo (config crate và dòng doctor) đã chạy trên cấu hình có khai.
