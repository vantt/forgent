# Hướng dẫn: ba bước host cho phase 11 (q-vbh2knqpnu)

Owner đã duyệt "Do all three now" ngày 2026-11-23. Ba bước dưới đây cần một shell không bị confine (terminal của
anh), vì sandbox của lead chỉ đọc được `.fgos/runtime`, `.agents` và cargo target. Chạy tất cả từ main checkout:

```bash
cd /home/vantt/projects/forgent
git switch main && git pull --ff-only   # main phải ở sau 0174ac6dd và chứa 5ebc25616
git merge-base --is-ancestor 5ebc25616 HEAD && echo ok
```

Trạng thái lúc lead kiểm tra (23:05): release đang active là `edf91f57`, activate lúc 15:56 và chưa có `5ebc25616`.
Hai worktree vẫn còn. Chưa có kết quả suite nào.

## Bước 1 — Build, stage và activate main

Theo quy trình ở `docs/how-to/measure-a-real-case.md` mục 5:

```bash
cargo build --release -p fgos -p fgctl
OUT=$(mktemp -d /tmp/fgos-release-candidate-XXXXXX)   # thư mục mới, rỗng mỗi lần build
node scripts/build-rust-distribution.mjs --out "$OUT"
./target/release/fgctl stage   --from "$OUT"
./target/release/fgctl upgrade --from "$OUT"
```

Script từ chối một `--out` đã có file (để không lẫn bản build cũ), nên mỗi lần build dùng một thư mục mới như trên.
Thư mục `/tmp/fgos-release-candidate` cũ để nguyên cũng được, không cần xoá.

Kiểm tra:

```bash
./target/release/fgctl status          # active release phải là digest mới, không còn edf91f57
./target/release/fgctl verify
.fgos/installation/bin/fgos metrics ping
fgos doctor                            # active-release-matches-checkout phải pass
```

Kiểm tra release mới có grant của phase 13:

```bash
R=$(grep -o '"releasePath": *"[^"]*"' .fgos/installation/activation.json | cut -d'"' -f4)
grep -c "plans/backlog.md" "$R/libexec/legacy-node/src/session-host/head-grants.mjs"   # phải ra 2
```

`fgctl upgrade` dời pin trong `.fgos/distribution.json`. Commit pin mới nếu anh muốn giữ nó
(`activation-matches-pin` chỉ cảnh báo, không fail).

## Bước 2 — Full suite trên main

```bash
mkdir -p .fgos/runtime/tmp
npm test 2>&1 | tee .fgos/runtime/tmp/heads-stable-npm-test.log
cargo test --workspace 2>&1 | tee .fgos/runtime/tmp/heads-stable-cargo-test.log
```

Mất khoảng 15–20 phút. Đừng SIGKILL giữa chừng. Báo lead xanh hay đỏ kèm hai đường dẫn log. Nếu đỏ, lead xác
định phase nào gây ra và sửa qua phase đó, không nới test.

## Bước 3 — Xoá đúng hai worktree

Tip của cả hai đã nằm trên main (`3885d6a75` và `0174ac6dd`). `fgos worktree remove` từ chối checkout dirty và
không có cờ force, nên phải bỏ phần sửa dở của p13 trước. Phần sửa đó đã land thành `5ebc25616`.

```bash
WT=/home/vantt/projects/forgent-worktrees
P13=$WT/261122-0118-heads-stable-and-able-p13
P11C=$WT/261122-0118-heads-stable-and-able-p11c

# chỉ thao tác khi path đúng là linked worktree đã đăng ký
git worktree list | grep -F "$P13 " && git -C "$P13" checkout -- src/session-host/head-grants.mjs test/session-host/head-grants.test.mjs
git -C "$P13" status --short            # phải trống

fgos worktree remove "$P13"  --delivered-to main --discard-ignored
fgos worktree remove "$P11C" --delivered-to main --discard-ignored
git worktree list | grep heads-stable   # phải không còn dòng nào
```

Không dùng `rm -rf` hay `git clean -x`. Nếu `worktree remove` từ chối, gửi lead mã refusal.

## Sau ba bước

1. Rotate supervisor và Miu để chúng chạy release mới. Grant được cố định lúc head start, nên head cũ không thấy
   thay đổi: `fgos session rotate <persona> --name <tên session>`, hoặc nhờ supervisor làm.
2. Nhắn lead một câu là đã xong. Lead viết dòng CHANGELOG và script probe, nhờ supervisor và Miu mỗi bên chạy
   probe một lần, viết `reports/head-grant-probe.md`, sửa ghi chú cũ trong `test/session-host/head-start.test.mjs`
   rồi đóng plan.
