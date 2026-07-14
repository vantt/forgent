# Critical Patterns

Mandatory pre-planning / pre-execution context for this repository.
bee-compounding appends hard-won patterns here; keep it short and current.

- **Verify chạy đúng chuỗi literal, không phải năng lực.** Khi verify của cell là một chuỗi lệnh, validating phải THỰC THI đúng chuỗi đó trước Gate 3; spike chứng minh capability không thay được (Node 24: `node --test <dir>` chết MODULE_NOT_FOUND, chỉ nhận glob — bắt được giữa swarm, lẽ ra bắt ở validating). (20260714-phase-1-state-layer)
- **Đường crash-recovery phải có test giết-thật.** Mọi reap/recovery path cần ít nhất một test SIGKILL process thật giữa thao tác — fixture dữ liệu chỉ chứng minh logic phân lớp, không tái hiện hiện trường vật lý (git/fs bookkeeping sống sót sau crash); bug orphaned-checkout ship qua panel + unit tests, chỉ e2e giết-thật bắt được. Kèm: test "X throws" trên đường lỗi họ crash là ứng viên xét lại khi đường đó được exercise thật. (20260714-phase-2-routing)
- **Quote mọi glob truyền cho test runner.** Glob không quote bị sh expand (`**`→`*`), test rơi khỏi suite mà vẫn exit 0; để runner tự discovery, và khi thêm thư mục test mới thì so số test trước/sau. (20260714-phase-1-state-layer)
