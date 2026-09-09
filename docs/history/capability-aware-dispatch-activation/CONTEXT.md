# Capability-aware dispatch activation

## Feature boundary

Lát này làm agent nhận biết capability trước execution và trong planning bằng instruction hiện hữu. Nó bổ sung canonical capability `code:implement` trên catalog/config hiện tại và chuyển coding execution khỏi định danh lifecycle-shaped `fgos-coding-implement`. Nó không thay dispatch resolver, Work schema, Assignment shape, provider/model/tier policy hoặc thêm mutation guard.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | Giữ capability làm primitive dispatch; canonical identity hỗ trợ generic và domain-scoped domain:capability. |
| D2 | Activation doctrine là decide-before-execute; agent chọn capability từ catalog và hỏi dispatch trước execution unit. |
| D3 | Planning ghi canonical capability cho từng execution unit độc lập; capability là tín hiệu decomposition, không phải luật bắt buộc tách. |
| D4 | Lát đầu instruction-first; chưa đổi resolver, Work schema, Assignment shape hay thêm mutation guard. |
| D5 | Plan không lưu executor/provider/model; execution-time decide là nguồn quyết định hiện hành. |

## Pinned terms

- **Capability:** một behavior promise/purpose ổn định dùng để hỏi dispatch, không phải task instance, stage, flow, skill hay executor.
- **Generic capability:** canonical capability không gắn domain, ví dụ `advise`.
- **Domain-scoped capability:** canonical identity `domain:capability`, ví dụ `code:implement`.
- **Execution unit:** một phần việc có objective/boundary/output đủ rõ để có thể thực hiện inline hoặc giao executor; không mặc định là Work item.
- **Decide-before-execute:** agent hỏi dispatch trước khi thực hiện execution unit; control plane, không phải agent, quyết định inline/native/out-of-process.

## Scout evidence

- `.fgos/config.json` đã có `runner.capabilities`, `runner.executors` và mapping `prefer`; capability sống hiện tại cho coding implementation là `fgos-coding-implement`.
- `src/runner/dispatch/resolve.mjs` đã resolve purpose qua `capabilities.<name>.prefer` rồi `executors.<id>.for`; không cần resolver mới cho một canonical capability key khác.
- `src/runner/dispatch/plan.mjs` đã nhận selector `--for <purpose>` và trả DispatchPlan với `unavailable`, `in-process` hoặc `out-of-process` qua mechanism hiện có.
- `.agents/skills/_shared/executor-dispatch-fallback.md` hiện mô tả decide sau khi caller đã quyết định có lý do dispatch; điểm activation này cần đổi thành hỏi trước execution unit.
- `.agents/skills/fgos-coding-planning/SKILL.md` và child-spec hiện yêu cầu action/verify/footprint nhưng chưa yêu cầu capability awareness.
- `.agents/skills/fgos-coding-implement/SKILL.md` hiện gọi `decide --work <id>`, khiến coding dispatch còn phụ thuộc lifecycle identity.
- `fgos tool query --capability impact-analysis --status present` trả provider rỗng trong phiên scout; impact-analysis posture: inactive. Lát này chỉ thay prose/config, không chỉnh symbol.

## Canonical references

- `docs/specs/runner.md`
- `docs/knowledge/forgentx-repo-s-tool-registry-configuration/forgentx-tool-registry-configuration.md`
- `docs/how-to/write-verify-for-a-skill-prose-change.md` theo tên cũ được skill trỏ tới; đường dẫn sống hiện tại là `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`.
- `docs/history/capability-aware-dispatch-activation/DISCUSSION.md#design`

## Outstanding questions

None
