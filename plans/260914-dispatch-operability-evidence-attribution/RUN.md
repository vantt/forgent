# Run The Design Track

Use this prompt from the design worktree:

> Dùng `fgos-plan-loop` chạy toàn bộ design track
> `dispatch-operability-design` theo
> `plans/260914-dispatch-operability-evidence-attribution/plan.md`, từ D00 đến
> D06. Mỗi cell dùng branch/worktree riêng, chạy đủ Doer, Reviewer, Red-Team và
> fix/recheck khi cần. Đây là design-only: không sửa source code, không tạo Work
> item, không bắt đầu implementation. Chỉ dừng hỏi tôi khi có product decision
> mới hoặc đụng locked law; còn lại tự chạy đến verdict `READY` hoặc `NOT READY`.

The Lead starts with:

```sh
fgos coordination chain dispatch-operability-design --json
```

This is operator convenience. The normative contract is in `plan.md` and the
seven phase briefs.
