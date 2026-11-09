# Hướng dẫn: khai báo kỹ năng cook trong cấu hình của máy

Dành cho: owner, trên máy owner, fg-server và fg-server2. Người viết: COOK. Trạng thái: **đề xuất, chờ owner áp dụng hoặc cho phép COOK áp dụng**. COOK không tự sửa cấu hình của owner.

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
2. `fgos config explain runner.executors.claude.supports.skills`: trường `current` phải là `["ak:cook"]` và `file` chỉ tệp bạn vừa sửa. Hiện nay (chưa khai) `current` là `null`, vì giá trị đang đến từ bản chuẩn.
3. `fgos doctor`: dòng `executor-skills-installed` kiểm từng kỹ năng đã khai có `SKILL.md` trong thư mục kỹ năng của runtime đó (`claude` đọc `.claude/skills/ak-cook`, `openai` đọc `.agents/skills/ak-cook`, `gemini` và `xai` đọc `.omp/skills/ak-cook`, `glm` và `deepseek` đọc `.pi/skills/ak-cook`).

## Hoàn tác

Xóa các dòng vừa thêm (hoặc `fgos config unset runner.executors.<id>.supports.skills` cho tệp dự án). Sau đó một Unit nêu `ak:cook` bị từ chối `skills-unavailable` cho tới khi khai lại.

## Chưa kiểm chứng

COOK chưa áp thử các dòng này vào `~/.fgos/config.yaml` thật. Các kiểm tra ở trên là lệnh COOK dự kiến, chưa chạy sau khi khai. Test của repo (config crate và dòng doctor) đã chạy trên cấu hình có khai.
