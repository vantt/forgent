# Đưa một máy lên `main` mới: config model/pool/account và Rust callers trên holder-lock

Ngày 2026-10-17. Dành cho mọi máy chạy fgOS trên repo này (hoặc dùng release của nó) mà chưa làm các bước dưới. Máy `~/projects/forgent` (máy thứ hai) đã làm xong lúc 16:43; máy owner đã land 4.4a lúc 16:25 nhưng vẫn cần bước 3.

Hai thay đổi đã lên `main`:

- **Config model/pool/account, đợt A** ([plan](../261017-1302-model-pool-config-additive-slice/plan.md), RUL102, RUL103 trong `docs/specs/runner.md`):
  - mỗi họ một executor (`claude-herdr` gộp vào `claude`, bỏ `glm-herdr`);
  - gemini qua omp nhận `--model`;
  - ô tier dạng `model@pool` hoặc danh sách;
  - `runner.llmAccounts` mới chỉ được đọc để kiểm tra;
  - `fgos dispatch explain`;
  - rigor mà capability tự khai nâng được trần tier của nó.
- **4.4a, Rust callers trên holder-lock** ([báo cáo landing](landing-261017-1625-rust-callers-holder-lock-stop-everything-landing.md)): `fgctl`, `install.lock` và observe dùng kernel lock, kèm hàng rào chặn binary cũ.

## 1. Kéo code

```bash
cd <repo>
git pull --ff-only
```

Config project (`.fgos/config.json`) đến cùng git, không phải sửa tay.

## 2. Dừng mọi writer của máy

Đóng hoặc để idle mọi phiên agent. Dừng `fgos run`, workflow runner, `fgos gateway stop`, runner nền và các pane agent. Kiểm:

```bash
ps -eo pid,args | grep -E 'fgos|fgctl' | grep -v grep
```

Lệnh này không được ra dòng nào.

## 3. Sửa config global (`~/.fgos/config.json`)

Config global không đi theo git, nên mỗi máy phải tự sửa.

```bash
grep -n 'claude-herdr\|glm-herdr' ~/.fgos/config.json
```

- **Còn executor `claude-herdr` hoặc `glm-herdr`, hay hai executor cùng `providerModel`:** xoá bản thừa. Nếu cần giữ transport của nó, chuyển thành một invocation của executor cùng họ (`claude`, `glm`).
- **Còn `prefer` trỏ `claude-herdr` hoặc `glm-herdr`:** đổi thành `claude` hoặc `glm`.
- **`runner.modelPolicies` trong config global:** chỉ dùng tên model thường. Dạng danh sách và `model@pool` chỉ đặt trong config project, vì release cũ trên máy không đọc được hai dạng này.
- **`runner.llmAccounts`:** chưa cần khai, lease vẫn đọc `runner.providers`. Nếu khai, đặt ở config global, không đặt ở project.

## 4. Cài `fgctl` mới

Bỏ qua bước này nếu máy đã cài sau 16:25 ngày 10-17.

```bash
mkdir -p .fgos/runtime/tmp/sync-261017
cp -p ~/.local/bin/fgctl .fgos/runtime/tmp/sync-261017/fgctl.prev
cargo install --locked --path apps/fgctl --root ~/.local
which -a fgctl     # chỉ được ra một file (dòng lặp do PATH trùng là cùng file)
```

## 5. Build và activate release

```bash
cargo build --release --workspace
node scripts/build-rust-distribution.mjs --out /tmp/fgos-release-candidate
fgctl stage   --from /tmp/fgos-release-candidate
fgctl upgrade --from /tmp/fgos-release-candidate
fgctl status       # activeArtifactDigest là digest vừa build
```

Build từ một checkout không có file sửa dở trong payload (`src/`, `bin/`, `core/`, `domains/`, `packages/`, `docs/`). Sửa đổi chưa commit ở `AGENTS.md` hay `.claude/` không vào payload.

**Đừng commit `.fgos/distribution.json` mà `fgctl upgrade` vừa ghi.** Mỗi máy tự build ra một digest khác, nên nếu commit thì các máy sẽ thay nhau ghi đè file này. Trả nó về bản trên `main`:

```bash
git restore .fgos/distribution.json
```

Chưa có check nào đỏ vì lệch pin. Pin theo máy hay chỉ một máy build release vẫn là quyết định đang chờ owner.

## 6. Đặt hàng rào

Nếu `fgos doctor` báo `lock-fences` thiếu, chạy:

```bash
fgos doctor --fix
```

Bước kiểm dừng chặn `--fix` khi còn tiến trình có cwd trong workspace, kể cả các phiên Claude idle không phải fgOS. Khi đó làm như ở [landing máy thứ hai](landing-261017-1643-rust-callers-holder-lock-this-machine.md):

- kiểm từng pid qua `/proc/<pid>/fd`, xác nhận không pid nào mở file dưới `.fgos/` hay `~/.local/state/fgos/`;
- gọi `fixLockFences(root, { excludePids, hostBin })` từ payload của release mới, chạy từ `/tmp`.

## 7. Kiểm bằng doctor

```bash
fgos doctor
```

Các check sau phải pass:

| Check | Phải thấy |
|---|---|
| `lock-kernel-semantics`, `lock-borrow-vectors`, `state-root` | pass |
| `lock-holders` | pass, 0 held |
| `lock-fences` | pass, đủ N/N |
| `active-release-matches-checkout` | pass, changed=0 (chỉ ở source checkout) |
| `executor-family-unique` | mỗi họ một executor |
| `global-model-policies-portable` | ô global là tên model thường |
| `llm-accounts-shape` | pass (chưa khai thì báo "not declared") |
| `capability-rigor-ceiling` | liệt kê `architecture:synthesize`, `architecture:shape`, `architecture:explain` chạy `frontier`; đây là thông tin, không phải lỗi |

Kiểm thêm một capability:

```bash
fgos dispatch explain --for architecture:synthesize
```

`tier.value` là `frontier`, và `tier.ceiling.source` là `capability-rigor(architecture:synthesize, critical)`.

## 8. Gemini qua omp

Worker gemini cần profile omp `gemini-tetcu72` (`~/.omp/profiles/gemini-tetcu72/agent`) trên máy. Máy không có profile này thì gemini thất bại khi chạy; `bind()` không biết trước điều đó. Kiểm:

```bash
omp --profile=gemini-tetcu72 models list gemini
```

## Rollback

Dừng mọi writer, rồi:

- activate release trước (`fgctl repair`);
- chép lại `fgctl.prev` vào `~/.local/bin/fgctl`;
- xoá các thư mục tombstone mà `fenceStatus` liệt kê.

Config global sửa ở bước 3 thì khôi phục từ bản sao lưu của anh.
