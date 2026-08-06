# plan.md — tsk-1ia: fix jq index(.) rebind bug

## Mode gate

1 flag: existing covered behavior (đụng đúng code path tsk-580 vừa thêm,
đã có test suite). **Mode: small.** Root cause + fix đã xác nhận thực
nghiệm trước khi item này submit (xem CONTEXT.md D1/D2).

## Approach

Sửa đúng 1 dòng jq expression trong `bin/fgos.mjs` (bind `. as $s` trước
khi pipe vào literal array, thay vì để `.` rebind vào chính array). Thêm 2
test case THẬT SỰ CHẠY jq command (spawnSync) trên fixture resolved/
chưa-resolved — đóng đúng gap coverage (D3) khiến bug cũ lọt qua. Phát
sinh thêm 1 vấn đề khi viết test: generated command giả định
`<repo-root>/bin/fgos.mjs` tồn tại — đúng cho chính repo này (dogfooding)
nhưng sai cho 1 git repo rỗng dùng làm fixture — đã symlink `bin`/`src`
thật vào fixture để test chạy được, KHÔNG sửa assumption đó (out of scope,
tiền lệ có sẵn từ 2 how-to doc, thuộc phạm vi milestone "aware 3 context"
riêng — distribution-vision.md).

## Verify

```
out=$(node --test --test-name-pattern="actually running it" test/cli/fgos.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*returns false when not all children are resolved" && echo "$out" | grep -qE "^. .*returns true when all children are resolved"
```

Đã chạy thật: exit 0 (2 test pass), full suite 535/535 pass, không
regression.

## Verdict

READY — fix + evidence đã có trước khi submit, implementation + test đã
chạy thật, không split, 1 mảnh việc duy nhất.
