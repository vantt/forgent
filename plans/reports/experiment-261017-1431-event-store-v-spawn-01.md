# V-SPAWN-01 — baseline đường Work mutation hiện tại

Run `wf-run-1792220971735-537c5269` (unit `unit-run-1792220971867-6b11971a`, executor openai, account tetcu72), 2026-10-17. Folded into section 17 of [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md).

| Mutation | Concurrent sessions | n | p50 (ms) | p95 (ms) | p99 (ms) | max (ms) | lỗi |
|---|---:|---:|---:|---:|---:|---:|---:|
| `claim` (`take`) | 1 | 40 | 1.432,87 | 2.173,65 | 2.235,35 | 2.235,35 | 0 |
| `claim` (`take`) | 10 | 40 | 9.697,39 | 19.521,20 | 21.607,18 | 21.607,18 | 0 |
| `claim` (`take`) | 20 | 40 | 19.321,81 | 37.429,76 | 39.474,38 | 39.474,38 | 0 |
| `move` (`todo` → `blocked`) | 1 | 40 | 116,77 | 125,03 | 131,02 | 131,02 | 0 |
| `move` (`todo` → `blocked`) | 10 | 40 | 213,53 | 289,81 | 307,66 | 307,66 | 0 |
| `move` (`todo` → `blocked`) | 20 | 40 | 333,18 | 480,38 | 504,73 | 504,73 | 0 |
| `settle` (`return --to blocked`) | 1 | 40 | 615,38 | 776,27 | 1.167,05 | 1.167,05 | 0 |
| `settle` (`return --to blocked`) | 10 | 40 | 721,55 | 873,34 | 921,34 | 921,34 | 0 |
| `settle` (`return --to blocked`) | 20 | 40 | 1.205,25 | 1.556,47 | 1.647,74 | 1.647,74 | 0 |

Các số là thời gian tường từ lúc process Node CLI được spawn đến lúc nó thoát. Mỗi hàng có 40 phép đo riêng, vượt yêu cầu tối thiểu 30. `claim` dùng `take` mặc định có retry/wait; `move` dùng item độc lập với CAS `--expect todo`; `settle` dùng một claim đã tạo trước bằng chính `FGOS_SESSION_ID` của process settle để thỏa writer-identity. Mỗi session có ID riêng.

## Phương pháp

Tôi clone `--no-hardlinks` source vào `/tmp/vspawn-p4Z3WG/repo`, chạy `npm ci --ignore-scripts`, tạo Git project và fgOS store tươi tại `/tmp/vspawn-p4Z3WG/project`, rồi seed các item `executing` độc lập. Mọi CLI call chạy payload Node của bản clone với `FGOS_HOST_BIN=/home/vantt/.local/state/fgos/releases/sha256:e5e7c2f988b1ce252ecfa6d1de8174db22c1c07fb11f5578cb85705290c96b4f/bin/fgos`, và `CLAUDE_CODE_SESSION_ID` đã bị unset. Không có ghi nào vào checkout thật hay `.fgos` thật.

Máy đo là Intel Core i7-13700, 24 logical CPUs; `/tmp` là `tmpfs`; Git là `2.53.0`; Node là `v24.22.0`. Trong các batch `settle`, terminal CLI process có đỉnh 35 open FDs; harness thấy tối đa 1, 10 và 20 direct child CLI processes tương ứng với concurrency. Lấy mẫu `ps -e` trong run ghi nhận đỉnh toàn máy 719 processes, nhưng chỉ là chỉ báo môi trường vì máy đang có công việc khác, không phải con số quy cho benchmark.

`strace -f -e trace=process -c` trên một `take` thành công ở fixture đã seed ghi 983 `clone` và 984 lần `execve` thành công (17.678 calls, 16.694 lỗi tra PATH); vì vậy số child process thực tế quan sát được trên hot path là 983, không phải chỉ một Node wrapper. Đây là phép đếm ở fixture cuối khá lớn (nhiều claims/items) và bao gồm process gọi gián tiếp; nó là baseline chi phí process của đường hiện tại, không nên diễn giải là chi phí cố định của một append nhỏ trên store rỗng.

Lock wait không được CLI xuất thành metric riêng. Nó được quan sát qua `.fgos/main-checkout.lock` với holder PID/TTL trong khi các `take` cùng batch chờ retry. Vì không có timestamp per-lock acquisition, báo cáo không bịa một số wait chính xác: proxy rõ nhất là `claim` p95 tăng từ 2.173,65 ms ở concurrency 1 lên 37.429,76 ms ở concurrency 20, tức ít nhất khoảng 35,26 giây tail latency do tranh chấp/serialization và công việc kèm theo.

## Ý nghĩa cho Node facade gọi Rust per append

Ngân sách packet là không quá 2 spawns trên hot path, p95 ở 20 sessions không tệ hơn baseline và dưới 50 ms. Baseline hiện tại không đạt 50 ms ở cả ba mutation tại concurrency 20; nghiêm trọng nhất là `claim` p95 37,43 giây. Vì vậy “không tệ hơn baseline” là điều kiện quá yếu nếu đứng một mình: Rust event store nên đặt tiêu chí thực thi mạnh hơn là tối đa 2 child spawns/append, không quét/lặp process theo số claim hiện hữu, và p95 dưới 50 ms tại 20 sessions cho từng mutation. Node facade spawn Rust một lần rồi để Rust tự append/lock có thể vẫn đáp ứng budget spawn; facade spawn Rust cho nhiều primitive nối tiếp hoặc Rust lại shell-out theo item thì không đáp ứng được bằng chứng này.

## Caveat

Fixture dùng store tăng dần với nhiều item/claim để có mẫu độc lập; vì thế nó phản ánh đường thật dưới state không rỗng, nhưng không cô lập hoàn toàn ảnh hưởng kích thước log. `settle` ban đầu đã bị loại vì prep claim dùng khác writer ID, làm tất cả thất bại; bảng cuối dùng run lại với cùng writer ID và 0 lỗi. `strace` làm bản thân call chậm hơn và chỉ dùng để đếm, không dùng cho percentile. Open-FD sampler nhìn direct Node CLI PIDs, không tất cả grandchildren; process counter của `strace` mới bao gồm descendants.

## Tái lập

Hai script chính xác được dùng, ngoài workspace: `/tmp/vspawn-benchmark.mjs` (seed + `claim`/`move` + probe `strace`) và `/tmp/vspawn-settle.mjs` (run lại `settle` hợp lệ). Lệnh là:

```sh
git clone --no-hardlinks /home/vantt/projects/forgent /tmp/vspawn-p4Z3WG/repo
cd /tmp/vspawn-p4Z3WG/repo && npm ci --ignore-scripts
env -u CLAUDE_CODE_SESSION_ID node /tmp/vspawn-benchmark.mjs /tmp/vspawn-p4Z3WG/repo /tmp/vspawn-p4Z3WG/project /tmp/vspawn-p4Z3WG/results.json
env -u CLAUDE_CODE_SESSION_ID node /tmp/vspawn-settle.mjs /tmp/vspawn-p4Z3WG/repo /tmp/vspawn-p4Z3WG/project /tmp/vspawn-p4Z3WG/settle-results.json
```

Sau đó đọc hai JSON result bằng `jq`. Để chỉ kiểm tra process cost, chạy trong project đã init:

```sh
env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=/home/vantt/.local/state/fgos/releases/sha256:e5e7c2f988b1ce252ecfa6d1de8174db22c1c07fb11f5578cb85705290c96b4f/bin/fgos \
  FGOS_SESSION_ID=proc-count strace -f -e trace=process -c node /tmp/vspawn-p4Z3WG/repo/bin/fgos.mjs take --id proc-count-2
```
