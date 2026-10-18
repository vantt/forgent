# Kiểm tra mô hình reader Event Store phase 03 trên implementation

Ngày chạy: 2026-10-18. **Verdict: chưa đạt toàn bộ contract reader.** Tìm thấy **N2: mất folded history nhưng giữ cursor có thể nhận `Incremental` với delta rỗng**, đã tái hiện bằng Rust thật. Không tìm thấy counterexample mới cho certified walk, Kahn, causal deferral, dedupe hoặc coverage trong các miền hữu hạn bên dưới. Đây là báo cáo proof, không sửa production code.

## Đối tượng và kết luận theo invariant

Đích brief là commit `176cd4eeb2869918b888525cb515c7616d21e8b6`. HEAD thực tế là `0d55fa89383f69b01171aee9ac8eac3a15c8f9f5`; `git diff 176cd4eeb -- packages/event-store/rust packages/git/rust docs/platform/event-store/spec.md` rỗng. Vì vậy source, tests và spec dùng ở đây đúng bytes của đích, không chỉ suy luận từ tên branch. Đọc reading-map trước, rồi spec §10–12, bốn file `walk.rs`, `order.rs`, `cursor.rs`, `read.rs`, các tests reader/order và Publication walker mà reader gọi. Không dispatch agent, không gọi lifecycle, không stage/commit.

| Invariant | Verdict trong bounds | Evidence / giới hạn |
|---|---|---|
| Không bỏ event đã ack | **Đạt ở nguồn đọc/sequence; không đạt end-to-end fold khi mất history (N2)** | Active→closed→ref và replay trả đủ tập causal-ready. N2 giữ event trong `sequence`, nhưng delta rỗng + `Incremental` có thể làm cache rỗng bỏ event. Không phải mất bytes đã ack. Event còn thiếu dependency được deferred đúng contract, không bị coi là mất. |
| Không đếm event hai lần | **Đạt trong miền** | Dedupe theo position+hash hợp lệ; input nhân đôi, rotation snapshot và cursor đọc lặp không thêm lần thứ hai. Rebuild thay view, không nối toàn bộ sequence vào view cũ. |
| View causally closed | **Đạt trong miền** | Missing predecessors và descendants cùng deferred; coverage chỉ lấy emitted. Closure tính trên view hoàn chỉnh/block, không hứa mọi prefix bên trong promote block có causal order riêng. |
| Ba máy cùng ordered view sau full sync | **Đạt với cache còn nguyên hoặc rebuild được thực hiện; chưa bảo đảm consumer mất history vì N2** | BFS 4.096 trạng thái nhận dữ liệu; full ordered sequence bằng nhau. 605 trạng thái push/fetch/merge baseline được chạy lại. Consumer phải thực hiện replay/rebuild khi cần; không hứa convergence khi chưa sync đủ. |
| Walk kết thúc, không bỏ unknown origin dưới merge có certified commit | **Đạt trong miền** | 46.080 walk với pagination và tips lặp; C4 sáu commit tìm được B1 dù A1/A2 đã cover và `a` certified. Rust test thật vượt boundary 256 với chain 260 commit cũng qua. |
| Cursor không skip | **Đạt cho coverage; N2 làm chỉ dẫn fold không đủ để tái dựng cache** | Hai stream × hai seq: prefix liên tục, deferred không nâng coverage/certificates; sau dependency tới, event xuất hiện đúng một lần. `cover` của N2 là coverage từ view cũ hợp lệ, nhưng view mới không có history đó. |
| Incremental fold = replay = rebuild | **Không đạt toàn miền public ReadRequest (N2)** | Khi history hợp lệ, mọi ca được phân loại incremental đều bằng full order. `folded=[]` với coverage khác rỗng là yêu cầu rebuild hợp lệ, được ghi rõ tại `read.rs:33–34`, nhưng có thể nhận incremental. |

## Mô hình bám mã và khác biệt so với checker spec

- **Walk:** `walk.rs:58–75` chuyển certified ids thành stop cho Publication, phân trang 256 commit/4 MiB; `:78–83` có visited riêng và bỏ xử lý certified commit. Chính `packages/git/rust/src/publication.rs:1152–1284` giữ FIFO pending/visited qua continuation, trả stop commit nhưng không đẩy parents (`:1246–1255`), dọn duplicate pending trước xác định complete (`:1270–1273`). Checker mới mô hình hóa cả hai tầng; giảm kích thước page thành 1/2/4 để vét boundary trên DAG bốn node. Byte bound không được vét, Rust test thực kiểm boundary count. Không giả định `rev-list A..B` là implementation.
- **Coverage không prune:** `walk.rs:119–124` chỉ lọc seq, vẫn đi ancestors qua Publication. Merge kiểm parents ở `:126–135`. Seal kiểm digest, framing, identity/range ở `:99–117`. `check_contiguous` tại `:148` từ chối hole, không âm thầm nhảy seq. Certificate phải hợp lệ; không model cursor giả mạo.
- **Order thật:** `order.rs:33–49` dedupe/conflict theo `(origin:stream,seq)`, rồi lọc base. Với envelope hợp lệ và hash không collision, điều này tương đương dedupe theo h của spec. Key là tuple chuỗi `(ts,origin,stream,seq)` tại `:12–15`, không comparator pha trộn causality/timestamp. Mô hình dùng ts 0/1/2; harness ánh xạ sang UTC cố định hai chữ số như Rust tests, nên thứ tự bằng so sánh byte của code.
- **Deferral:** predecessor own seq và `seen` tại `order.rs:23–28`; thiếu dependency → deferred, lan qua descendants ở `:181–223`; Kahn dùng smallest key ở `:224–252`, cycle trả lỗi ở `:254–260`. Hole cùng stream có thể bị reader từ chối sớm bằng `EventStoreGap` trước order; đây là gap/corruption theo §11, không kết luận lỗi C5 chỉ vì standalone order có thể defer hole.
- **Promote:** `order.rs:50–137` lọc branch chưa promote, preliminary sort chọn claim đầu theo causal order, mỗi block `[promote, branch seq...]`, rồi Kahn trên blocks. `:192` bỏ cạnh nội bộ như spec §12 yêu cầu; thiếu named tail được giữ tại `:199–211`. Checker mới có missing tail, overlapping claims, internal edge, 54 permutation. Không đánh đồng block với sort từng branch event; branch bị ẩn không phải event bị bỏ khỏi project view sai contract.
- **Read khác abstraction cũ:** `read.rs:282–294` chỉ dùng coverage/certificates khi có history và query khớp; `:330–338` ghép **toàn bộ folded history + local + walked**, kiểm contiguous từ 0 rồi order với base rỗng. Vì vậy không chỉ sort delta trên cover như checker cũ. `:345–364` dựng lại cover từ emitted, chỉ certify khi không deferred và mọi walked event đã cover; điều kiện này còn chặt hơn câu ngắn “nothing deferred” của spec, tránh certify branch bị ẩn.
- **Fold:** delta tại `read.rs:381–386` vẫn lọc bằng **cursor cũ**, cả khi `have_history=false`; `fold_answer` không nhận cờ này. Đây là khác biệt quyết định tạo N2. Replay suffix phải dùng `sequence/full_order`, không chỉ `events`. Query đổi, mirror/legacy tip đổi, released deferred và promote khiến rebuild theo guard `cursor.rs:76–89`. Legacy prefix do `read.rs:374–379` ghép trước v4; không đưa legacy vào Kahn model.

## N2 — shortest counterexample và dòng cần sửa

Precondition chỉ cần **một event `A1`**, stream project, ref hợp lệ, không mirror/legacy tip thay đổi, không deferred, không concurrency, không clock rollback. Event có thể được append/ack rồi seal theo giao thức. Trace ngắn nhất theo transition granularity BFS là ba bước:

1. `fetch 0`: A1 đã có trong ref/local publication mà reader nhìn thấy.
2. `read`: view nhận `[A1]`, cursor có `emitted=cover={A:project:1}`, query project và certified commit hợp lệ.
3. Giữ cursor đó, mất/drop folded cache; gọi `read(..., cursor=old, folded=[])`. Đây **đúng yêu cầu rebuild từ zero** theo comment public API `read.rs:33–34`.

Bước 3 thực sự trả `sequence=[A1]`, `events=[]`, `fold=Incremental`. `have_history=false` nên walk bỏ certificate và đọc đầy đủ; nhưng delta dùng emitted cũ nên loại A1. Trong `cursor.rs:70–81`, `old_order=[]` làm `first=0=old_order.len()`; delta rỗng khiến `all(...)` tại `:82–89` đúng hiển nhiên. Các guard còn lại đều đúng. Consumer làm theo Incremental sẽ nối `[]` vào history rỗng và có `[]`, khác full rebuild `[A1]`. Event không hỏng, không bị xóa khỏi Git; lỗi là false incremental hint khi recovery cache.

Đây là witness ít event nhất (0 event không thể khác rebuild), ba transition ngắn nhất của BFS có publish/read/history-loss-read riêng. Nếu coi publication là initial state thì còn hai lần gọi read. BFS có **552 read transitions vi phạm**, không phải 552 lỗi độc lập; cùng một cơ chế với nhiều graph/timestamp/state. Tính shortest là trong abstraction đã khai báo, không tuyên bố shortest của mọi syscall thực.

**Điểm sửa:** `packages/event-store/rust/src/read.rs:387` phải truyền/áp dụng tính hợp lệ history khi chọn fold; khi cursor có cover mà thiếu folded history, ép `Fold::RebuildRequired { first_difference: 0 }`. Có thể mở rộng signature/guard `packages/event-store/rust/src/cursor.rs:76` để kiểm history được bảo toàn. Không chỉ bỏ lọc delta tại `read.rs:384`: chữa hint rebuild rõ ràng mới khớp contract recovery, đồng thời không đếm lại dữ liệu khi consumer vẫn có history. Sau sửa cần regression test đòi rebuild, rồi refold `sequence` và so với cursor rỗng. Báo cáo này chỉ chỉ ra điểm sửa, chưa sửa và chưa xác minh patch.

Harness Rust phía dưới chạy production `read`, `walk`, `order`, `fold_answer` qua GitDriver thật và fixture Git riêng trong `/tmp`. Test **assert hành vi lỗi quan sát được** để xác nhận witness, không phải test khẳng định contract đúng. Kết quả: `CONFIRMED: lost folded history; sequence=1, delta=0, fold=Incremental`.

## Bounds, kết quả và giới hạn proof

| Checker | Miền đã chạy / kết quả |
|---|---|
| Negative control gốc | Extract nguyên Python BFS báo cáo 15:27, chạy lại: 23.990 states, 73.781 edges, tái hiện C1 seq collision. Đây là defect mô hình cũ, không quy thành lỗi phase 03. |
| Corrected baseline | Extract nguyên Python báo cáo 15:45. Batch width 1/2/3: mỗi miền 32.238 states, 101.049 edges, 9.045 reader-return states, không counterexample protocol. Chỉ là baseline spec; không dùng riêng nó để certify code. |
| Baseline corrected DAG/cursor | 64 DAG; 124.416 sort có equal timestamps; 15.360 certified walks; 8.128 causal cursor reads; 6.784 two-stream reads (1.480 deferred); 508 proven incremental cases. Kết quả cũ được tái lập. |
| Implementation walk | 64 DAG × 15 tip subsets × 16 cert subsets × 3 page sizes = 46.080; lặp tips để kiểm visited. Cache chứa ancestor closure của certificates. Không missing ancestor, số pop ≤ số tips đầu + số edges; tối đa 4 page. C4 sáu commit cũng chạy. |
| Implementation order | 16 DAG khác nhau chứa own-stream edges của A1,B1,A2,B2; 81 ts assignments; 24 insertion permutations = 31.104 full-order runs. Thêm 16 available subsets/input nhân đôi = 20.736 ca. Tất cả emitted causally closed, không duplicate; ca thiếu dependency được held. |
| Differential Rust/Python | Toàn bộ 20.736 ca subset/duplicate phía trên được gửi vào **production `order()`** qua harness, so thứ tự output và tập deferred: **0 mismatch**. Không chỉ so hai bản Python. Missing diagnostics/concurrent pairs không differential exhaustively. |
| Implementation read BFS | 16 graph × 3 ts patterns; tổng 1.974 states, 5.820 edges, 3.948 read transitions, gồm 1.974 lần yêu cầu đọc không history. 1.632 incremental, 2.316 rebuild; 552 lần false incremental khi mất history (N2). Mỗi state giữ available prefix, folded order, cover, certificates, deferred. Có read lặp, fetch, mất folded history. Các reads không mất history bằng rebuild; sequence kể cả khi mất history vẫn bằng rebuild. |
| Promote | 54 permutations, hai missing-tail cases, một internal-edge contraction case; overlapping promote không đếm branch prefix hai lần. Rust test hiện có xác nhận placement block và ẩn orphan; domain này không nằm trong 20.736 differential cases. |
| Ba máy | BFS mọi thứ tự nhận bốn event: 4.096 states, 24.576 edges, một full-sync state. So ordered sequence causally closed. Baseline push/fetch/merge: 605 states, 1.473 edges, một full-sync state. Không mô hình hóa loss history như full-sync consumer guarantee. |
| Tests implementation thật | **51 tests hiện có qua**: cursor_incremental 9, order_kahn 7, walk_certified 2, legacy_reader 2, append_recovery 17, framing_prefixes 2, kill_append 7, p02_review 5. Thêm một Rust witness tái hiện N2. Không chạy npm test vì chỉ thêm report và proof không đổi code; không coi đây là chứng nhận toàn repo. |

Không cộng các checker thành một tích trạng thái toàn hệ thống. Baseline protocol/crash/framing là mô hình corrected-spec chạy lại, không được giả làm bằng chứng binary implementation của seal; implementation proof chính là model dịch code, differential order và tests Rust. Không chứng minh mọi crash/power-failure thật, transport, reducer business, rebuild-install/gate scheduler hoặc malicious cursors. N1 livelock trong baseline là historical negative finding của spec trước khi thêm bounded attempts, không phải phát hiện mới ở bốn file reader.

Hash giả định không collision; envelope/framing hợp lệ; unique origin/seq và chain invariant theo spec; certificates chỉ do reader hoàn tất cấp và history/cursor nguyên cặp trừ transition mất history được API hỗ trợ rõ ràng. Causal graph có DAG; corrupt cycle/conflicting position bị từ chối (Rust test đã chạy). Store/ref source không bị actor ngoài rewind; mirror rewind/tamper có tests hiện có. Full sync nghĩa mọi dependency/ref đã tới, không phải liveness của network. Local acknowledged events hiển thị ngay, foreign events chỉ sau seal/push/fetch; deferred chưa đủ dependency không được tính là miss. Closure trong promote block theo contraction của spec, không phải causal-prefix trong thứ tự các thành viên.

## Tái lập và artifacts

Mọi scratch, Cargo target, crate harness, JSON fixtures và log nằm ở `/tmp/es-p03-reader-proof/`; repo chỉ thêm báo cáo này. Tên report do `fgos convention path --kind report --type experiment --slug es-p03-model-recheck-reader --at 2026-10-18T15:31:00+07:00 --json` trả đúng đường brief. Python 3.14.4; rustc 1.99.0. Source và output đầy đủ bên dưới giúp tái lập không cần giữ thư mục `/tmp` của phiên.

Lưu các khối Python thành tên được ghi, chạy `python3 original.py`, `python3 corrected.py`, `python3 implemented.py /tmp/es-p03-cases.jsonl`. Ba checker độc lập, không import lẫn nhau. Với harness, tạo crate ngoài repo theo Cargo.toml bên dưới (đổi absolute repo root nếu cần), lưu `src/main.rs`, `tests/lost_history.rs`. Chạy:

```sh
CARGO_TARGET_DIR=/tmp/es-p03-reader-proof/target cargo test --locked -p fgos-event-store --test walk_certified --test order_kahn --test cursor_incremental --test legacy_reader
CARGO_TARGET_DIR=/tmp/es-p03-reader-proof/target cargo test --locked -p fgos-event-store --test append_recovery --test p02_review --test framing_prefixes --test kill_append
CARGO_TARGET_DIR=/tmp/es-p03-reader-proof/target cargo test --offline --manifest-path /tmp/es-p03-reader-proof/harness/Cargo.toml --test lost_history -- --nocapture
CARGO_TARGET_DIR=/tmp/es-p03-reader-proof/target cargo run --offline --quiet --manifest-path /tmp/es-p03-reader-proof/harness/Cargo.toml < /tmp/es-p03-cases.jsonl
```

Offline harness dùng dependency đã có cache; máy sạch cần lần đầu cho Cargo tải dependencies. Không cần service hoặc remote bên ngoài: tests tạo Git repo local. Checker exit 0 nghĩa các assertion quan sát/kiểm tra được hoàn tất; **không có nghĩa mọi invariant đạt**, vì N2 được giữ thành trường counterexample trong JSON và Rust witness assert đúng hành vi lỗi.

### Hash input và checker

| File | SHA-256 |
|---|---|
| `packages/event-store/rust/src/walk.rs` | `f23d2745b9e3f2c09947ace2977890ec6c4e798c628f7adda8a6f83663083d00` |
| `packages/event-store/rust/src/order.rs` | `80afdec737a2d8134477c45339553e166a05f5524582b497404045d02659a685` |
| `packages/event-store/rust/src/cursor.rs` | `716f404ac2bb51938f987fcad9469b768ddee933a903ddb39d7e96c1fa90cac9` |
| `packages/event-store/rust/src/read.rs` | `0b2f558c413789750d3d85b7872e6cf1eed96f881d331967a924bbdee80f2125` |
| `packages/git/rust/src/publication.rs` | `f25c1c8aff30b0c82e9bde8d4c6303297be2fe8235dd091e6a450a59771d69bb` |
| `docs/platform/event-store/spec.md` | `8a55e664e35b2ce60b2b016c4e4b7553855dcd7b96cad19ec9f204bd2a260b84` |
| `plans/reports/experiment-261017-1527-event-store-model-check-reader-seal.md` | `9e8561b12702400a732506cd30cae045f365a87442f007190d21ddb5674b91d8` |
| `plans/reports/experiment-261017-1545-event-store-model-recheck-corrected.md` | `e0a8880d18845043c38fb5a6f9a6933bd98196aaf15d82585351d2405fa85a99` |
| `original.py` | `1ce86065600410049aedc813d059b49d6d17f36197be97e4ba5fcac0f57ee157` |
| `corrected.py` | `bb06749a13a312dc09cbc908c069485d1110e35841a8b5d0620f0af2af1b6aa5` |
| `implemented.py` | `2c72ce653c4ed9e76793181122f57cf921955a81079f2fb8c970930978d5d161` |

### Output implementation model

```json
{
  "order": {
    "graphs": 16,
    "permutation_runs": 31104,
    "subset_duplicate_cases": 20736,
    "timestamps": 81
  },
  "promotion": {
    "internal_edge_removed": true,
    "missing_tail_cases": 2,
    "permutations": 54
  },
  "reader": {
    "bad_lost_history_fold": 552,
    "edges": 5820,
    "incremental": 1632,
    "lost_history": 1974,
    "reads": 3948,
    "rebuilds": 2316,
    "shortest_counterexample": [
      "fetch 0",
      "read",
      "read with folded=[]; preserve cursor"
    ],
    "states": 1974
  },
  "three_machines": {
    "edges": 24576,
    "full_sync_states": 1,
    "states": 4096
  },
  "walk": {
    "C4_read": [
      "b",
      "c",
      "m",
      "p",
      "q"
    ],
    "cases": 46080,
    "max_pages": 4
  }
}
```

### Output corrected baseline (nguyên bản)

```json
{
  "C1_replay": [
    "W0: lock",
    "W0: write complete line seq=1",
    "W0: process crash/restart",
    "S: lock append",
    "S: rename active -> closed; fsync closed; fsync stream",
    "S: process crash/restart",
    "W1: lock",
    "W1: write complete line seq=2"
  ],
  "protocol": {
    "1": {
      "states": 32238,
      "edges": 101049,
      "reader_return_states": 9045,
      "counterexamples": {}
    },
    "2": {
      "states": 32238,
      "edges": 101049,
      "reader_return_states": 9045,
      "counterexamples": {}
    },
    "3": {
      "states": 32238,
      "edges": 101049,
      "reader_return_states": 9045,
      "counterexamples": {}
    }
  },
  "framing": {
    "bytes": 285,
    "prefix_cases": 286,
    "recovery_cases": 285,
    "C2_old_cuts": [
      [],
      [],
      []
    ]
  },
  "recovery": [
    [
      [
        0,
        [
          [
            1,
            1
          ]
        ],
        [],
        0
      ],
      1
    ],
    [
      [
        2,
        [
          [
            1,
            2
          ],
          [
            3,
            4
          ]
        ],
        [
          5
        ],
        1
      ],
      5
    ],
    [
      [
        0,
        [
          [
            2,
            2
          ]
        ],
        [],
        0
      ],
      "event-store-seq-recovery-conflict"
    ],
    [
      [
        0,
        [
          [
            1,
            2
          ],
          [
            2,
            3
          ]
        ],
        [],
        0
      ],
      "event-store-seq-recovery-conflict"
    ],
    [
      [
        0,
        [],
        [],
        1
      ],
      "event-store-seq-recovery-conflict"
    ],
    [
      [
        3,
        [],
        [
          4
        ],
        0
      ],
      4
    ]
  ],
  "order_dag_original_bounds": {
    "graphs": 64,
    "timestamp_assignments": 1536,
    "toposort_runs": 36864,
    "walks": 960,
    "comparator_counterexample": {
      "edges": [
        [
          0,
          1
        ]
      ],
      "ts": [
        2,
        0,
        1,
        3
      ],
      "cycle": [
        0,
        1,
        2,
        0
      ]
    }
  },
  "corrected_exhaustive": {
    "graphs": 64,
    "sort_runs_equal_timestamps": 124416,
    "certified_walks": 15360,
    "causal_cursor_reads": 8128,
    "proven_incremental_cases": 508
  },
  "C4": {
    "cover": [
      "A1",
      "A2"
    ],
    "certified": [
      "a"
    ],
    "walk": [
      "p",
      "c",
      "m",
      "a",
      "b",
      "q"
    ],
    "delta": [
      "B1",
      "P1",
      "Q1"
    ]
  },
  "C5_C6": {
    "C5_first": [],
    "C5_cursor": {},
    "C5_certified": [],
    "C5_after_dependency": [
      0,
      1
    ],
    "C6_before": [
      0
    ],
    "C6_rebuildRequired_result": [
      1,
      0
    ],
    "C3_old_witness_kahn": [
      2,
      0,
      1,
      3
    ]
  },
  "stream_cursors": {
    "cases": 6784,
    "reads_with_deferred": 1480,
    "streams": 2,
    "events_per_stream": 2
  },
  "sharing_original": {
    "sync_states": 23,
    "terminal_states": 1,
    "merge_promote_walk": [
      [
        "A1",
        "A2",
        "B1",
        "P1",
        "Q1"
      ],
      [
        "p",
        "c",
        "m",
        "a",
        "b",
        "q"
      ]
    ],
    "unsafe_cursor_stop": [
      [
        "A2"
      ],
      [
        "c"
      ]
    ],
    "missed": "B1"
  },
  "three_machines": {
    "states": 4096,
    "edges": 24576,
    "full_sync_terminal": 1
  },
  "three_push_merge": {
    "states": 605,
    "edges": 1473,
    "full_sync_terminal": 1,
    "note": "failed CAS and unchanged fetch are stutters; parent event sets union on merge"
  },
  "power": {
    "states": 30,
    "edges": 88,
    "ack_loss_states": 0,
    "barriers": "file; stream create; closed destination; stream source; ref; receipt; delete directory"
  },
  "rebuild_liveness": {
    "states": 4,
    "deadlock": false,
    "shortest_fair_progress_lasso": [
      "capture outside gate",
      "gated append advances own seq",
      "install rejects stale; retry"
    ],
    "repeat": "each round starts at seq k, captures k, writer acks k+1, install rejects; k increases without bound"
  }
}
```

### Output negative control (nguyên bản)

```json
{
  "protocol": {
    "states": 23990,
    "edges": 73781,
    "reader_return_states": 6769,
    "counterexamples": {
      "sequence_collision": [
        "W0: lock",
        "W0: write complete line seq=1",
        "W0: process crash/restart",
        "S: lock append",
        "S: durable rename active -> closed",
        "S: process crash/restart",
        "W1: lock",
        "W1: write complete line seq=1"
      ]
    }
  },
  "order_dag": {
    "graphs": 64,
    "timestamp_assignments": 1536,
    "toposort_runs": 36864,
    "walks": 960,
    "comparator_counterexample": {
      "edges": [
        [
          0,
          1
        ]
      ],
      "ts": [
        2,
        0,
        1,
        3
      ],
      "cycle": [
        0,
        1,
        2,
        0
      ]
    }
  },
  "sharing": {
    "sync_states": 23,
    "terminal_states": 1,
    "merge_promote_walk": [
      [
        "A1",
        "A2",
        "B1",
        "P1",
        "Q1"
      ],
      [
        "p",
        "c",
        "m",
        "a",
        "b",
        "q"
      ]
    ],
    "unsafe_cursor_stop": [
      [
        "A2"
      ],
      [
        "c"
      ]
    ],
    "missed": "B1"
  },
  "boundary": {
    "batch_byte_prefixes": 7,
    "partial_batch_counterexamples": [
      {
        "bytes_written": 3,
        "visible_lines": [
          "e1"
        ]
      },
      {
        "bytes_written": 4,
        "visible_lines": [
          "e1"
        ]
      },
      {
        "bytes_written": 5,
        "visible_lines": [
          "e1"
        ]
      }
    ],
    "foreign_ref_subsets": 4,
    "non_causal_closed_views": [
      [
        1
      ]
    ],
    "late_concurrent_insert": {
      "before": [
        "x(ts=2)"
      ],
      "after": [
        "y(ts=1)",
        "x(ts=2)"
      ]
    }
  },
  "crash_micro": {
    "states": 29,
    "edges": 83,
    "crash_phase_kind_pairs": 22,
    "ack_loss_states": 0
  }
}
```

## Full checker source — original.py

```python
#!/usr/bin/env python3
import json,itertools,heapq
from collections import deque, namedtuple
S=namedtuple('S','wp lock active closed hwm ref sp target receipt rp view baseline ack mirror')
# Events are (writer, seq); two writers each attempt one single-event batch.
def initial(): return S((0,0),-1,(),(),0,(),0,(),False,0,(),(),(),())
def transitions(s):
 def emit(label,**kw): return label,s._replace(**kw)
 for w in range(2):
  p=s.wp[w]; ps=list(s.wp)
  if p==0 and s.lock==-1:
   ps[w]=1; yield emit(f'W{w}: lock',wp=tuple(ps),lock=w)
  if p==1:
   seq=s.active[-1][1]+1 if s.active else s.hwm+1
   ps[w]=2; yield emit(f'W{w}: write complete line seq={seq}',wp=tuple(ps),active=s.active+((w,seq),))
  if p==2:
   ps[w]=3; yield emit(f'W{w}: fsync = ack',wp=tuple(ps),ack=tuple(sorted(set(s.ack)|{s.active[-1]})))
  if p==3:
   ps[w]=4; yield emit(f'W{w}: unlock/return',wp=tuple(ps),lock=-1)
  if p in (1,2,3):
   ps[w]=0 if p==1 else 4
   yield emit(f'W{w}: process crash/restart',wp=tuple(ps),lock=-1)
 if s.sp==0 and s.active and s.lock==-1:
  yield emit('S: lock append',sp=1,lock=2)
 if s.sp==1:
  yield emit('S: durable rename active -> closed',sp=2,active=(),closed=s.closed+(s.active,),target=s.active)
 if s.sp==2:
  yield emit('S: durable hwm; unlock append',sp=0,hwm=s.target[-1][1],lock=-1,target=())
 if s.sp==0 and s.closed:
  t=s.closed[0]
  yield emit('S: verify segment / write git objects',sp=3,target=t,receipt=False)
 if s.sp==3:
  # Already-published recovery verifies exact segment before deletion.
  if set(s.target)<=set(s.ref):
   yield emit('S: recovery verified receipt',sp=5,receipt=True)
  elif s.target[0][1]==max((e[1] for e in s.ref),default=0)+1:
   yield emit('S: CAS ref durable',sp=4,ref=tuple(sorted(set(s.ref)|set(s.target))))
 if s.sp==4:
  yield emit('S: verify ref and blob; receipt',sp=5,receipt=True)
 if s.sp==5 and s.receipt:
  yield emit('S: delete verified closed segment + fsync dir',sp=0,closed=tuple(x for x in s.closed if x!=s.target),target=(),receipt=False)
 if s.sp:
  yield emit('S: process crash/restart',sp=0,lock=-1 if s.lock==2 else s.lock,target=(),receipt=False)
 if s.rp==0:
  yield emit('R: open/read active descriptor',rp=1,view=s.active,baseline=s.ack)
 if s.rp==1:
  yield emit('R: list/read closed (ENOENT resolved by later ref)',rp=2,view=tuple(sorted(set(s.view)|{e for seg in s.closed for e in seg})))
 if s.rp==2:
  yield emit('R: read ref/dedupe/return',rp=3,view=tuple(sorted(set(s.view)|set(s.ref))))
 if s.mirror!=s.ref:
  yield emit('B: fetch ref snapshot',mirror=s.ref)
def bfs():
 root=initial(); q=deque([root]); prev={root:None}; labels={}; found={}; edges=0; complete=0
 def trace(s):
  out=[]
  while prev[s] is not None: out.append(labels[s]);s=prev[s]
  return list(reversed(out))
 while q:
  s=q.popleft()
  physical=set(s.active)|{e for seg in s.closed for e in seg}|set(s.ref)
  tests={
   'ack_lost':not set(s.ack)<=physical,
   'sequence_collision':len({e[1] for e in physical})<len(physical),
   'reader_misses_prestart_ack':s.rp==3 and not set(s.baseline)<=set(s.view),
   'reader_duplicate_hash':len(s.view)!=len(set(s.view)),
   'reader_nonprefix':s.rp==3 and sorted({e[1] for e in s.view})!=list(range(1,max((e[1] for e in s.view),default=0)+1))}
  for k,v in tests.items():
   if v and k not in found: found[k]=trace(s)
  if s.rp==3: complete+=1
  for label,t in transitions(s):
   edges+=1
   if t not in prev: prev[t]=s;labels[t]=label;q.append(t)
 return {'states':len(prev),'edges':edges,'reader_return_states':complete,'counterexamples':found}
# Enumerate all labeled DAGs on n nodes (edges go from lower to higher id).
def dag_checks(n=4):
 pairs=list(itertools.combinations(range(n),2)); graphs=orders=walks=0; cycle_witness=None
 for mask in range(1<<len(pairs)):
  edges={p for i,p in enumerate(pairs) if mask>>i&1}; graphs+=1
  reach=set(edges)
  for k in range(n):
   reach|={(a,b) for a in range(n) for b in range(n) if (a,k) in reach and (k,b) in reach}
  for ts in itertools.permutations(range(n)):
   key=lambda a:(ts[a],str(a),'project',1)
   def before(a,b): return (a,b) in reach or ((b,a) not in reach and key(a)<key(b))
   for a,b,c in itertools.permutations(range(n),3):
    if before(a,b) and before(b,c) and before(c,a) and cycle_witness is None:
     cycle_witness={'edges':sorted(edges),'ts':ts,'cycle':[a,b,c,a]}
   results=set()
   for insertion in itertools.permutations(range(n)):
    pending=set(insertion);out=[]
    while pending:
     ready=[a for a in pending if not any((b,a) in edges for b in pending)]
     a=min(ready,key=key);out.append(a);pending.remove(a)
    results.add(tuple(out));orders+=1
   assert len(results)==1
  # Every possible tip set; full parent walk visits every reachable node once.
  for tips_mask in range(1,1<<n):
   stack=[i for i in range(n) if tips_mask>>i&1];seen=set(); pops=0
   while stack:
    a=stack.pop();pops+=1
    if a in seen:continue
    seen.add(a);stack.extend(b for b,c in edges if c==a)
   expected={i for i in range(n) if tips_mask>>i&1}
   expected|={a for a,b in reach if tips_mask>>b&1}
   assert seen==expected and pops<=n+len(edges);walks+=1
 return {'graphs':graphs,'timestamp_assignments':graphs*24,'toposort_runs':orders,'walks':walks,'comparator_counterexample':cycle_witness}
def sharing():
 # Shared machine id: a,b seal independent origins, m merge, p promote with branch q.
 parents={'a':(),'b':(),'m':('a','b'),'c':('m',),'q':(),'p':('c','q')}
 events={'a':('A1',),'b':('B1',),'m':(),'c':('A2',),'q':('Q1',),'p':('P1',)}
 def walk(tip,stop=False):
  stack=[tip];seen=set();view=set();trace=[]
  while stack:
   c=stack.pop()
   if c in seen:continue
   seen.add(c);view.update(events[c]);trace.append(c)
   if stop and 'A2' in view:continue
   stack.extend(reversed(parents[c]))
  return sorted(view),trace
 full=walk('p');bad=walk('c',True)
 assert full[0]==['A1','A2','B1','P1','Q1']
 # Exhaust all schedules of CAS-push of two initial clone tips, merge and two fetches.
 root=(None,None,None,False);todo=deque([root]);seen={root}; terminal=[]
 while todo:
  remote,ma,mb,merged=todo.popleft();nexts=[]
  if remote is None:nexts += [('a',ma,mb,merged),('b',ma,mb,merged)]
  elif remote!='m': nexts += [('m',ma,mb,True)]
  if ma!=remote:nexts += [(remote,remote,mb,merged)]
  if mb!=remote:nexts += [(remote,ma,remote,merged)]
  if remote==ma==mb=='m':terminal.append((remote,ma,mb,merged))
  for t in nexts:
   if t not in seen:seen.add(t);todo.append(t)
 assert terminal and all(walk(t[1])[0]==walk(t[2])[0]==['A1','B1'] for t in terminal)
 return {'sync_states':len(seen),'terminal_states':len(terminal),'merge_promote_walk':full,'unsafe_cursor_stop':bad,'missed':'B1'}
def crash_micro():
 # loc 0 absent, 1 active, 2 closed, 3 deleted; persisted namespace is atomic.
 # Separate file content fsync, directory fsync, ref fsync, receipt and deletion.
 root=(0,0,False,False,False,False,False,0)
 todo=deque([root]);seen={root};edges=0;bad=[];crash_phases=set()
 while todo:
  state=todo.popleft();loc,dloc,data,ddata,ref,receipt,ack,pc=state
  if ack and not (ref or (dloc in (1,2) and ddata)):bad.append(state)
  nxt=[]
  if pc==0:nxt.append((1,dloc,True,ddata,ref,False,ack,1))
  if pc==1:nxt.append((loc,dloc,data,True,ref,receipt,ack,2))
  if pc==2:nxt.append((loc,1,data,ddata,ref,receipt,True,3))
  if pc==3:nxt.append((2,dloc,data,ddata,ref,receipt,ack,4))
  if pc==4:nxt.append((loc,2,data,ddata,ref,receipt,ack,5))
  if pc==5:nxt.append((loc,dloc,data,ddata,ref,receipt,ack,6)) # objects
  if pc==6:nxt.append((loc,dloc,data,ddata,True,receipt,ack,7)) # durable CAS
  if pc==7:nxt.append((loc,dloc,data,ddata,ref,True,ack,8))
  if pc==8 and receipt:nxt.append((3,dloc,data,ddata,ref,receipt,ack,9))
  if pc==9:nxt.append((loc,3,data,ddata,ref,receipt,ack,10))
  for power in (False,True):
   l=dloc if power else loc;dt=ddata if power else data
   restart=10 if l==3 else (7 if ref and l==2 else (5 if l==2 else (1 if l==1 else 0)))
   nxt.append((l,dloc,dt,ddata,ref,False,ack,restart));crash_phases.add((pc,power))
  for t in nxt:
   edges+=1
   if t not in seen:seen.add(t);todo.append(t)
 return {'states':len(seen),'edges':edges,'crash_phase_kind_pairs':len(crash_phases),'ack_loss_states':len(bad)}
def boundary_checks():
 # A two-line batch: write may return short or crash after any byte prefix.
 data=b'e1\ne2\n'; partial=[]
 for cut in range(len(data)+1):
  complete=data[:cut].split(b'\n')[:-1]
  if complete and len(complete)<2:
   partial.append({'bytes_written':cut,'visible_lines':[x.decode() for x in complete]})
 # Event b observes a on another ref. Fetching b's ref does not fetch a's ref.
 edges={(0,1)}; bad=[]
 for mask in range(4):
  view={i for i in range(2) if mask>>i&1}
  if any(b in view and a not in view for a,b in edges):bad.append(sorted(view))
 # Determinism of a fixed set is weaker than append-only order across growing sets.
 return {'batch_byte_prefixes':len(data)+1,'partial_batch_counterexamples':partial,
 'foreign_ref_subsets':4,'non_causal_closed_views':bad,
 'late_concurrent_insert':{'before':['x(ts=2)'],'after':['y(ts=1)','x(ts=2)']}}
if __name__=='__main__': print(json.dumps({'protocol':bfs(),'order_dag':dag_checks(),'sharing':sharing(),'boundary':boundary_checks(),'crash_micro':crash_micro()},indent=2))
```

## Full checker source — corrected.py

```python
#!/usr/bin/env python3
import json,itertools,heapq
from collections import deque, namedtuple
S=namedtuple('S','wp lock active closed hwm ref sp target receipt rp view baseline ack mirror durable_receipt')
WIDTH=1
# Events are (writer, seq); two writers each attempt one single-event batch.
def initial(): return S((0,0),-1,(),(),0,(),0,(),False,0,(),(),(),(),0)
def transitions(s):
 def emit(label,**kw): return label,s._replace(**kw)
 for w in range(2):
  p=s.wp[w]; ps=list(s.wp)
  if p==0 and s.lock==-1:
   ps[w]=1; yield emit(f'W{w}: lock',wp=tuple(ps),lock=w)
  if p==1:
   seq=recover(s)+1
   ps[w]=2; yield emit(f'W{w}: write complete line seq={seq}',wp=tuple(ps),active=s.active+tuple((w,seq+i) for i in range(WIDTH)))
  if p==2:
   ps[w]=3; yield emit(f'W{w}: fsync = ack',wp=tuple(ps),ack=tuple(sorted(set(s.ack)|set(s.active[-WIDTH:]))))
  if p==3:
   ps[w]=4; yield emit(f'W{w}: unlock/return',wp=tuple(ps),lock=-1)
  if p in (1,2,3):
   ps[w]=0 if p==1 else 4
   yield emit(f'W{w}: process crash/restart',wp=tuple(ps),lock=-1)
 if s.sp==0 and s.active and s.lock==-1:
  yield emit('S: lock append',sp=1,lock=2)
 if s.sp==1:
  yield emit('S: rename active -> closed; fsync closed; fsync stream',sp=2,active=(),closed=s.closed+(s.active,),target=s.active)
 if s.sp==2:
  yield emit('S: durable hwm; unlock append',sp=0,hwm=s.target[-1][1],lock=-1,target=())
 if s.sp==0 and s.closed:
  t=s.closed[0]
  yield emit('S: verify segment / write git objects',sp=3,target=t,receipt=False)
 if s.sp==3:
  # Already-published recovery verifies exact segment before deletion.
  if set(s.target)<=set(s.ref):
   yield emit('S: recovery verified receipt',sp=5,receipt=True,durable_receipt=max(s.durable_receipt,s.target[-1][1]))
  elif s.target[0][1]==max((e[1] for e in s.ref),default=0)+1:
   yield emit('S: CAS ref durable',sp=4,ref=tuple(sorted(set(s.ref)|set(s.target))))
 if s.sp==4:
  yield emit('S: verify ref and blob; receipt',sp=5,receipt=True,durable_receipt=max(s.durable_receipt,s.target[-1][1]))
 if s.sp==5 and s.receipt:
  yield emit('S: delete verified closed segment + fsync dir',sp=0,closed=tuple(x for x in s.closed if x!=s.target),target=(),receipt=False)
 if s.sp:
  yield emit('S: process crash/restart',sp=0,lock=-1 if s.lock==2 else s.lock,target=(),receipt=False)
 if s.rp==0:
  yield emit('R: open/read active descriptor',rp=1,view=s.active,baseline=s.ack)
 if s.rp==1:
  yield emit('R: list/read closed (ENOENT resolved by later ref)',rp=2,view=tuple(sorted(set(s.view)|{e for seg in s.closed for e in seg})))
 if s.rp==2:
  yield emit('R: read ref/dedupe/return',rp=3,view=tuple(sorted(set(s.view)|set(s.ref))))
 if s.mirror!=s.ref:
  yield emit('B: fetch ref snapshot',mirror=s.ref)
def bfs():
 root=initial(); q=deque([root]); prev={root:None}; labels={}; found={}; edges=0; complete=0
 def trace(s):
  out=[]
  while prev[s] is not None: out.append(labels[s]);s=prev[s]
  return list(reversed(out))
 while q:
  s=q.popleft()
  physical=set(s.active)|{e for seg in s.closed for e in seg}|set(s.ref)
  tests={
   'ack_lost':not set(s.ack)<=physical,
   'sequence_collision':len({e[1] for e in physical})<len(physical),
   'reader_misses_prestart_ack':s.rp==3 and not set(s.baseline)<=set(s.view),
   'reader_duplicate_hash':len(s.view)!=len(set(s.view)),
   'reader_nonprefix':s.rp==3 and sorted({e[1] for e in s.view})!=list(range(1,max((e[1] for e in s.view),default=0)+1))}
  for k,v in tests.items():
   if v and k not in found: found[k]=trace(s)
  if s.rp==3: complete+=1
  for label,t in transitions(s):
   edges+=1
   if t not in prev: prev[t]=s;labels[t]=label;q.append(t)
 return {'states':len(prev),'edges':edges,'reader_return_states':complete,'counterexamples':found}
# Enumerate all labeled DAGs on n nodes (edges go from lower to higher id).
def dag_checks(n=4):
 pairs=list(itertools.combinations(range(n),2)); graphs=orders=walks=0; cycle_witness=None
 for mask in range(1<<len(pairs)):
  edges={p for i,p in enumerate(pairs) if mask>>i&1}; graphs+=1
  reach=set(edges)
  for k in range(n):
   reach|={(a,b) for a in range(n) for b in range(n) if (a,k) in reach and (k,b) in reach}
  for ts in itertools.permutations(range(n)):
   key=lambda a:(ts[a],str(a),'project',1)
   def before(a,b): return (a,b) in reach or ((b,a) not in reach and key(a)<key(b))
   for a,b,c in itertools.permutations(range(n),3):
    if before(a,b) and before(b,c) and before(c,a) and cycle_witness is None:
     cycle_witness={'edges':sorted(edges),'ts':ts,'cycle':[a,b,c,a]}
   results=set()
   for insertion in itertools.permutations(range(n)):
    pending=set(insertion);out=[]
    while pending:
     ready=[a for a in pending if not any((b,a) in edges for b in pending)]
     a=min(ready,key=key);out.append(a);pending.remove(a)
    results.add(tuple(out));orders+=1
   assert len(results)==1
  # Every possible tip set; full parent walk visits every reachable node once.
  for tips_mask in range(1,1<<n):
   stack=[i for i in range(n) if tips_mask>>i&1];seen=set(); pops=0
   while stack:
    a=stack.pop();pops+=1
    if a in seen:continue
    seen.add(a);stack.extend(b for b,c in edges if c==a)
   expected={i for i in range(n) if tips_mask>>i&1}
   expected|={a for a,b in reach if tips_mask>>b&1}
   assert seen==expected and pops<=n+len(edges);walks+=1
 return {'graphs':graphs,'timestamp_assignments':graphs*24,'toposort_runs':orders,'walks':walks,'comparator_counterexample':cycle_witness}
def sharing():
 # Shared machine id: a,b seal independent origins, m merge, p promote with branch q.
 parents={'a':(),'b':(),'m':('a','b'),'c':('m',),'q':(),'p':('c','q')}
 events={'a':('A1',),'b':('B1',),'m':(),'c':('A2',),'q':('Q1',),'p':('P1',)}
 def walk(tip,stop=False):
  stack=[tip];seen=set();view=set();trace=[]
  while stack:
   c=stack.pop()
   if c in seen:continue
   seen.add(c);view.update(events[c]);trace.append(c)
   if stop and 'A2' in view:continue
   stack.extend(reversed(parents[c]))
  return sorted(view),trace
 full=walk('p');bad=walk('c',True)
 assert full[0]==['A1','A2','B1','P1','Q1']
 # Exhaust all schedules of CAS-push of two initial clone tips, merge and two fetches.
 root=(None,None,None,False);todo=deque([root]);seen={root}; terminal=[]
 while todo:
  remote,ma,mb,merged=todo.popleft();nexts=[]
  if remote is None:nexts += [('a',ma,mb,merged),('b',ma,mb,merged)]
  elif remote!='m': nexts += [('m',ma,mb,True)]
  if ma!=remote:nexts += [(remote,remote,mb,merged)]
  if mb!=remote:nexts += [(remote,ma,remote,merged)]
  if remote==ma==mb=='m':terminal.append((remote,ma,mb,merged))
  for t in nexts:
   if t not in seen:seen.add(t);todo.append(t)
 assert terminal and all(walk(t[1])[0]==walk(t[2])[0]==['A1','B1'] for t in terminal)
 return {'sync_states':len(seen),'terminal_states':len(terminal),'merge_promote_walk':full,'unsafe_cursor_stop':bad,'missed':'B1'}
def crash_micro():
 # loc 0 absent, 1 active, 2 closed, 3 deleted; persisted namespace is atomic.
 # Separate file content fsync, directory fsync, ref fsync, receipt and deletion.
 root=(0,0,False,False,False,False,False,0)
 todo=deque([root]);seen={root};edges=0;bad=[];crash_phases=set()
 while todo:
  state=todo.popleft();loc,dloc,data,ddata,ref,receipt,ack,pc=state
  if ack and not (ref or (dloc in (1,2) and ddata)):bad.append(state)
  nxt=[]
  if pc==0:nxt.append((1,dloc,True,ddata,ref,False,ack,1))
  if pc==1:nxt.append((loc,dloc,data,True,ref,receipt,ack,2))
  if pc==2:nxt.append((loc,1,data,ddata,ref,receipt,True,3))
  if pc==3:nxt.append((2,dloc,data,ddata,ref,receipt,ack,4))
  if pc==4:nxt.append((loc,2,data,ddata,ref,receipt,ack,5))
  if pc==5:nxt.append((loc,dloc,data,ddata,ref,receipt,ack,6)) # objects
  if pc==6:nxt.append((loc,dloc,data,ddata,True,receipt,ack,7)) # durable CAS
  if pc==7:nxt.append((loc,dloc,data,ddata,ref,True,ack,8))
  if pc==8 and receipt:nxt.append((3,dloc,data,ddata,ref,receipt,ack,9))
  if pc==9:nxt.append((loc,3,data,ddata,ref,receipt,ack,10))
  for power in (False,True):
   l=dloc if power else loc;dt=ddata if power else data
   restart=10 if l==3 else (7 if ref and l==2 else (5 if l==2 else (1 if l==1 else 0)))
   nxt.append((l,dloc,dt,ddata,ref,False,ack,restart));crash_phases.add((pc,power))
  for t in nxt:
   edges+=1
   if t not in seen:seen.add(t);todo.append(t)
 return {'states':len(seen),'edges':edges,'crash_phase_kind_pairs':len(crash_phases),'ack_loss_states':len(bad)}
def boundary_checks():
 # A two-line batch: write may return short or crash after any byte prefix.
 data=b'e1\ne2\n'; partial=[]
 for cut in range(len(data)+1):
  complete=data[:cut].split(b'\n')[:-1]
  if complete and len(complete)<2:
   partial.append({'bytes_written':cut,'visible_lines':[x.decode() for x in complete]})
 # Event b observes a on another ref. Fetching b's ref does not fetch a's ref.
 edges={(0,1)}; bad=[]
 for mask in range(4):
  view={i for i in range(2) if mask>>i&1}
  if any(b in view and a not in view for a,b in edges):bad.append(sorted(view))
 # Determinism of a fixed set is weaker than append-only order across growing sets.
 return {'batch_byte_prefixes':len(data)+1,'partial_batch_counterexamples':partial,
 'foreign_ref_subsets':4,'non_causal_closed_views':bad,
 'late_concurrent_insert':{'before':['x(ts=2)'],'after':['y(ts=1)','x(ts=2)']}}

# Corrected recovery: receipt is durable independently of the sealer process.
def recover(s):
 end=s.durable_receipt
 pending=sorted((seg for seg in s.closed if seg[-1][1]>end),key=lambda seg:seg[0][1])
 for seg in pending+([s.active] if s.active else []):
  assert [e[1] for e in seg]==list(range(end+1,end+len(seg)+1)), ('recovery-conflict',s)
  end=seg[-1][1]
 assert s.hwm<=end,('hwm-ahead',s)
 return end

def replay_c1():
 s=initial(); steps=[]
 for prefix in ['W0: lock','W0: write','W0: process','S: lock','S: rename','S: process','W1: lock','W1: write']:
  label,s=next((l,t) for l,t in transitions(s) if l.startswith(prefix)); steps.append(label)
 assert s.active[-1][1]==2
 return steps

def framing():
 import hashlib
 lines=[json.dumps({'origin':'A','stream':'project','seq':i,'payload':str(i)},sort_keys=True,separators=(',',':')).encode()+b'\n' for i in (1,2)]
 body=b''.join(lines)
 marker={'v':4,'kind':'batch-commit','origin':'A','stream':'project','firstSeq':1,'lastSeq':2,'count':2,'sha256':hashlib.sha256(body).hexdigest()}
 data=body+json.dumps(marker,sort_keys=True,separators=(',',':')).encode()+b'\n'
 def parse(data):
  pending=[];out=[];valid_end=0;offset=0
  for raw in data.splitlines(keepends=True):
   offset+=len(raw)
   if not raw.endswith(b'\n'):break
   try:x=json.loads(raw)
   except (ValueError,UnicodeError):break
   if x.get('kind')!='batch-commit':pending.append((raw,x));continue
   seq=[x['seq'] for _,x in pending]
   if not pending or x['count']!=len(pending) or seq!=list(range(x['firstSeq'],x['lastSeq']+1)) or any(e['origin']!=x['origin'] or e['stream']!=x['stream'] for _,e in pending) or hashlib.sha256(b''.join(r for r,_ in pending)).hexdigest()!=x['sha256']:break
   out.extend(e for _,e in pending);pending=[];valid_end=offset
  return tuple(x['seq'] for x in out),valid_end
 for cut in range(len(data)+1):
  visible,end=parse(data[:cut]);assert visible in ((),(1,2));assert visible==((1,2) if cut==len(data) else ())
  assert parse(data[:end])[0]==visible
 # Every byte prefix appended after an already committed batch is dropped in full.
 for cut in range(len(data)):
  visible,end=parse(data+data[:cut]);assert visible==(1,2) and end==len(data)
 bad=dict(marker);bad['sha256']='0'*64
 assert parse(body+json.dumps(bad).encode()+b'\n')[0]==()
 return {'bytes':len(data),'prefix_cases':len(data)+1,'recovery_cases':len(data),'C2_old_cuts':[parse(body[:i])[0] for i in (len(lines[0]),len(lines[0])+1,len(body)-1)]}

def ancestors(edges,tips):
 seen=set();stack=list(tips)
 while stack:
  a=stack.pop()
  if a in seen:continue
  seen.add(a);stack.extend(x for x,y in edges if y==a)
 return seen

def ordered(nodes,edges,ts,covered=frozenset()):
 pending=set(nodes)-set(covered);out=[]
 while True:
  ready=[x for x in pending if all(a in covered or a in out for a,b in edges if b==x)]
  if not ready:break
  a=min(ready,key=lambda x:(ts[x],str(x),'project',1));out.append(a);pending.remove(a)
 return tuple(out),frozenset(pending)

def exhaustive_corrected(n=4):
 pairs=list(itertools.combinations(range(n),2));walks=sorts=reads=incremental=0
 for mask in range(1<<len(pairs)):
  edges={p for i,p in enumerate(pairs) if mask>>i&1}
  ideals=[set(i for i in range(n) if m>>i&1) for m in range(1<<n)]
  ideals=[v for v in ideals if ancestors(edges,v)==v]
  # All timestamp assignments from 0,1,2 include equal timestamps.
  for ts in itertools.product(range(3),repeat=n):
   expected=ordered(range(n),edges,ts)[0]
   for insertion in itertools.permutations(range(n)):
    assert ordered(insertion,edges,ts)[0]==expected;sorts+=1
  for tm in range(1,1<<n):
   tips={i for i in range(n) if tm>>i&1};full=ancestors(edges,tips)
   for cm in range(1<<n):
    certified={i for i in range(n) if cm>>i&1};cache=ancestors(edges,certified)
    stack=list(tips);visited=set();got=set(cache);pops=0
    while stack:
     c=stack.pop();pops+=1
     if c in visited:continue
     visited.add(c)
     if c in certified:continue
     got.add(c);stack.extend(a for a,b in edges if b==c)
    assert full<=got and got<=full|cache
    assert pops<=len(tips)+len(edges);walks+=1
  for available_mask in range(1<<n):
   available={i for i in range(n) if available_mask>>i&1}
   for cover in ideals:
    emitted,deferred=ordered(available,edges,tuple(range(n)),cover)
    new=cover|set(emitted)
    assert ancestors(edges,new)==new
    assert not (set(emitted)&cover)
    # No certification when deferred. Later all data arrives: no event skipped.
    certified=not deferred
    later,pending=ordered(range(n),edges,tuple(range(n)),new)
    assert not pending and new|set(later)==set(range(n));reads+=1
  # Proven own-stream case: added event sees every old event (or its own predecessor).
  for cover in ideals:
   before=ordered(cover,edges,tuple(reversed(range(n))))[0]
   extended=set(edges)|{(x,n) for x in cover}
   after=ordered(cover|{n},extended,tuple(reversed(range(n)))+(0,))[0]
   assert after==before+(n,);incremental+=1
 return {'graphs':1<<len(pairs),'sort_runs_equal_timestamps':sorts,'certified_walks':walks,'causal_cursor_reads':reads,'proven_incremental_cases':incremental}

def corrected_c4():
 parents={'a':(),'b':(),'m':('a','b'),'c':('m',),'q':(),'p':('c','q')}
 ev={'a':{'A1'},'b':{'B1'},'m':set(),'c':{'A2'},'q':{'Q1'},'p':{'P1'}}
 cover={'A1','A2'};cert={'a'};stack=['p'];visited=set();out=set();trace=[]
 while stack:
  c=stack.pop()
  if c in visited:continue
  visited.add(c);trace.append(c)
  if c in cert:continue
  out|=ev[c]-cover;stack.extend(reversed(parents[c]))
 assert out=={'B1','P1','Q1'}
 return {'cover':sorted(cover),'certified':sorted(cert),'walk':trace,'delta':sorted(out)}

def c5_c6():
 edge={(0,1)}
 first,defer=ordered({1},edge,(2,0));assert first==() and defer=={1}
 second,defer=ordered({0,1},edge,(2,0));assert second==(0,1) and not defer
 before=ordered({0},set(),(2,1))[0];after=ordered({0,1},set(),(2,1))[0]
 assert before==(0,) and after==(1,0)
 # Consumer takes rebuildRequired; appending delta alone would be wrong.
 rebuilt=after;assert rebuilt==(1,0)
 return {'C5_first':first,'C5_cursor':{},'C5_certified':[],'C5_after_dependency':second,'C6_before':before,'C6_rebuildRequired_result':rebuilt,'C3_old_witness_kahn':ordered(range(4),{(0,1)},(2,0,1,3))[0]}

def three_machines(n=4):
 # Each ref contributes one event; published union is fixed and all fetch subset orders explored.
 root=(0,0,0);q=deque([root]);seen={root};edges=0;full=(1<<n)-1;terminal=0
 while q:
  s=q.popleft()
  if s==(full,full,full):
   views=[ordered(range(n),{(0,1),(1,3)},(2,0,1,0))[0] for _ in s]
   assert views[0]==views[1]==views[2];terminal+=1
  for m in range(3):
   for bit in range(n):
    if s[m]>>bit&1:continue
    t=list(s);t[m]|=1<<bit;t=tuple(t);edges+=1
    present={i for i in range(n) if t[m]>>i&1}
    emitted,_=ordered(present,{(0,1),(1,3)},(2,0,1,0))
    assert ancestors({(0,1),(1,3)},emitted)==set(emitted)
    if t not in seen:seen.add(t);q.append(t)
 return {'states':len(seen),'edges':edges,'full_sync_terminal':terminal}

# Both namespace directory barriers modelled separately. Destination first is essential.
def power_model():
 # loc bit 1 active, bit 2 closed; durable namespace dloc; file data/ddata.
 root=(0,0,False,False,False,False,False,0)
 q=deque([root]);seen={root};edges=0;bad=[]
 while q:
  s=q.popleft();loc,dloc,data,ddata,ref,receipt,ack,pc=s
  if ack and not (ref or (dloc and ddata)):bad.append(s)
  nxt=[]
  if pc==0:nxt.append((1,dloc,True,ddata,ref,receipt,ack,1))
  if pc==1:nxt.append((loc,dloc,data,True,ref,receipt,ack,2))
  if pc==2:nxt.append((loc,1,data,ddata,ref,receipt,True,3))
  if pc==3:nxt.append((2,dloc,data,ddata,ref,receipt,ack,4))
  if pc==4:nxt.append((loc,dloc|2,data,ddata,ref,receipt,ack,5))
  if pc==5:nxt.append((loc,2,data,ddata,ref,receipt,ack,6))
  if pc==6:nxt.append((loc,dloc,data,ddata,ref,receipt,ack,7)) # unreachable objects
  if pc==7:nxt.append((loc,dloc,data,ddata,True,receipt,ack,8))
  if pc==8:nxt.append((loc,dloc,data,ddata,ref,True,ack,9))
  if pc==9 and receipt:nxt.append((0,dloc,data,ddata,ref,receipt,ack,10))
  if pc==10:nxt.append((loc,0,data,ddata,ref,receipt,ack,11))
  for power in (False,True):
   l=dloc if power else loc;dt=ddata if power else data
   # Reappearing duplicate namespace names alias identical immutable bytes, dedup by h.
   restart=11 if ref and not l else (8 if ref else (4 if l&2 else (1 if l else 0)))
   nxt.append((l,dloc,dt,ddata,ref,receipt,ack,restart))
  for t in nxt:
   edges+=1
   if t not in seen:seen.add(t);q.append(t)
 assert not bad
 return {'states':len(seen),'edges':edges,'ack_loss_states':len(bad),'barriers':'file; stream create; closed destination; stream source; ref; receipt; delete directory'}

def recovery_vectors():
 # receipt, closed ranges, active range, hint -> result or refusal.
 def run(receipt,closed,active,hwm):
  s=initial()._replace(durable_receipt=receipt,closed=tuple(tuple(('w',i) for i in range(a,b+1)) for a,b in closed),active=tuple(('w',i) for i in active),hwm=hwm)
  try:return recover(s)
  except AssertionError:return 'event-store-seq-recovery-conflict'
 cases=[(0,[(1,1)],[],0),(2,[(1,2),(3,4)],[5],1),(0,[(2,2)],[],0),(0,[(1,2),(2,3)],[],0),(0,[],[],1),(3,[],[4],0)]
 out=[run(*x) for x in cases]
 assert out==[1,5,'event-store-seq-recovery-conflict','event-store-seq-recovery-conflict','event-store-seq-recovery-conflict',4]
 return list(zip(cases,out))

# Finite equality quotient: dirty means own seq changed since captured snapshot.
# Real monotone seq is unbounded; quotient retains exactly the install guard.
def rebuild_liveness():
 root=('idle',False);q=deque([root]);prev={root:None};labels={};adj={}
 while q:
  s=q.popleft();pc,dirty=s;ns=[]
  if pc=='idle':ns.append(('capture outside gate',('ready',False)))
  if pc=='ready':
   ns.append(('gated append advances own seq',('ready',True)))
   ns.append(('install rejects stale; retry' if dirty else 'install succeeds',('idle',False) if dirty else ('done',False)))
  adj[s]=ns
  for label,t in ns:
   if t not in prev:prev[t]=s;labels[t]=label;q.append(t)
 # BFS shortest cycle from root avoiding done, containing write and rejected install.
 todo=deque([(root,[],frozenset())]);visited={(root,frozenset())};witness=None
 while todo:
  s,path,flags=todo.popleft()
  for label,t in adj[s]:
   nf=flags|({'write'} if label.startswith('gated') else {'retry'} if 'rejects' in label else set())
   if t==root and nf=={'write','retry'}:witness=path+[label];todo.clear();break
   key=(t,frozenset(nf))
   if t[0]!='done' and key not in visited:visited.add(key);todo.append((t,path+[label],frozenset(nf)))
 assert witness and len(witness)==3
 assert all(adj[s] for s in adj if s[0]!='done')
 return {'states':len(prev),'deadlock':False,'shortest_fair_progress_lasso':witness,'repeat':'each round starts at seq k, captures k, writer acks k+1, install rejects; k increases without bound'}

def three_push_merge():
 # Event-set abstraction of non-force CAS, mirror fetch, two-parent reconciliation.
 root=(0,(1,2,4),(0,0,0));q=deque([root]);seen={root};edges=0;terminal=0
 while q:
  remote,local,mirror=q.popleft();nexts=[]
  if remote==7 and local==(7,7,7) and mirror==(7,7,7):
   views=[ordered(range(3),{(0,2)},(2,1,0))[0] for _ in range(3)]
   assert views[0]==views[1]==views[2];terminal+=1
  for m in range(3):
   if remote!=local[m] and remote & ~local[m]==0:
    nexts.append((local[m],local,mirror)) # CAS against currently read remote.
   if mirror[m]!=remote:
    x=list(mirror);x[m]=remote;nexts.append((remote,local,tuple(x)))
   merged=local[m]|mirror[m]
   if merged!=local[m]:
    x=list(local);x[m]=merged;nexts.append((remote,tuple(x),mirror))
  for t in nexts:
   edges+=1
   assert remote & ~t[0]==0
   assert all(t[1][m]&(1<<m) for m in range(3))
   if t not in seen:seen.add(t);q.append(t)
 assert terminal==1
 return {'states':len(seen),'edges':edges,'full_sync_terminal':terminal,'note':'failed CAS and unchanged fetch are stutters; parent event sets union on merge'}

def stream_cursors():
 # Nodes 0=A1, 1=B1, 2=A2, 3=B2; all topologically-labelled cross edges.
 pairs=list(itertools.combinations(range(4),2));cases=0;deferred_cases=0
 for mask in range(64):
  edges={p for i,p in enumerate(pairs) if mask>>i&1}|{(0,2),(1,3)}
  for ca,cb in itertools.product(range(3),repeat=2):
   covered=set(([0,2][:ca])+([1,3][:cb]))
   if ancestors(edges,covered)!=covered:continue
   for am in range(16):
    available={i for i in range(4) if am>>i&1}
    emit,deferred=ordered(available,edges,(2,0,1,0),covered)
    new=covered|set(emit);cursor=[]
    for stream in ([0,2],[1,3]):
     prefix=[x for x in stream if x in new]
     assert prefix==stream[:len(prefix)];cursor.append(len(prefix))
     assert not any(x in new for x in deferred if x in stream)
    assert ancestors(edges,new)==new
    later,remaining=ordered(range(4),edges,(2,0,1,0),new)
    assert not remaining and new|set(later)==set(range(4))
    cases+=1;deferred_cases+=bool(deferred)
 return {'cases':cases,'reads_with_deferred':deferred_cases,'streams':2,'events_per_stream':2}

def protocol_bounds():
 global WIDTH
 results={}
 for width in (1,2,3):
  WIDTH=width;results[str(width)]=bfs()
 WIDTH=1
 return results

if __name__=='__main__':
 print(json.dumps({'C1_replay':replay_c1(),'protocol':protocol_bounds(),'framing':framing(),'recovery':recovery_vectors(),'order_dag_original_bounds':dag_checks(),'corrected_exhaustive':exhaustive_corrected(),'C4':corrected_c4(),'C5_C6':c5_c6(),'stream_cursors':stream_cursors(),'sharing_original':sharing(),'three_machines':three_machines(),'three_push_merge':three_push_merge(),'power':power_model(),'rebuild_liveness':rebuild_liveness()},indent=2))
```

## Full checker source — implemented.py

```python
#!/usr/bin/env python3
"""Finite model translated from phase-03 Rust. Standard library only."""
from dataclasses import dataclass,replace
from collections import deque
from itertools import combinations,product,permutations
import json,hashlib
@dataclass(frozen=True)
class E:
    origin:str
    stream:str
    seq:int
    ts:int
    seen:tuple=()
    promote:int=0
    branch:bool=False
    @property
    def pos(self):return (self.origin+':'+self.stream,self.seq)
    @property
    def key(self):return (self.ts,self.origin,self.stream,self.seq)
    @property
    def deps(self):return self.seen+((self.pos[0],self.seq-1),) if self.seq>1 else self.seen

def sort_nodes(es,blocks,base):
    positions={e.pos:i for i,e in enumerate(es)}
    owners={i:n for n,b in enumerate(blocks) for i in b}
    deps=[set() for b in blocks];nxt=[set() for b in blocks];held=set();missing=set()
    for n,b in enumerate(blocks):
        for i in b:
            for p in es[i].deps:
                if p[1]<=base.get(p[0],0):continue
                other=owners.get(positions.get(p))
                if other is None:held.add(n);missing.add(p)
                elif other!=n:deps[n].add(other);nxt[other].add(n)
            if es[i].promote:
                p=(es[i].origin+':branch:f',es[i].promote)
                if p[1]>base.get(p[0],0) and p not in positions:held.add(n);missing.add(p)
    q=deque(sorted(held))
    while q:
        for c in nxt[q.popleft()]:
            if c not in held:held.add(c);q.append(c)
    degree=list(map(len,deps));ready={n for n,d in enumerate(degree) if d==0}
    out=[];deferred=[];visited=0
    while ready:
        n=min(ready,key=lambda n:(es[blocks[n][0]].key,n));ready.remove(n);visited+=1
        (deferred if n in held else out).extend(blocks[n])
        for c in nxt[n]:
            degree[c]-=1
            if degree[c]==0:ready.add(c)
    if visited!=len(blocks):raise ValueError('cycle')
    return out,deferred,missing

def order(inp,base=None,project=True):
    base=base or {};unique={}
    for e in inp:
        if e.pos in unique and unique[e.pos]!=e:raise ValueError('conflict')
        unique[e.pos]=e
    es=[unique[p] for p in sorted(unique) if p[1]>base.get(p[0],0)]
    claims={}
    if project:
        for e in es:
            if e.promote:claims[e.origin]=max(claims.get(e.origin,0),e.promote)
    es=[e for e in es if not project or not e.branch or e.seq<=claims.get(e.origin,0)]
    singles=[[i] for i in range(len(es))]
    pre,held,_=sort_nodes(es,singles,base)
    blocks=[];assigned=set()
    if project:
        for i in pre+held:
            e=es[i]
            if not e.promote:continue
            members=sorted((j for j,b in enumerate(es) if b.origin==e.origin and b.stream=='branch:f' and b.seq<=e.promote and j not in assigned),key=lambda j:es[j].seq)
            block=[i]+members;assigned.update(block);blocks.append(block)
        blocks += [[i] for i,e in enumerate(es) if not e.branch and i not in assigned]
    else:blocks=singles
    out,held,missing=sort_nodes(es,blocks,base)
    return tuple(es[i] for i in out),tuple(es[i] for i in held),missing

def contiguous(es,base=None):
    by={};base=base or {}
    for e in es:
        if e.pos in by and by[e.pos]!=e:raise ValueError('conflict')
        by[e.pos]=e
    for stream in {p[0] for p in by}:
        high=base.get(stream,0)
        for seq in sorted(p[1] for p in by if p[0]==stream and p[1]>high):
            if seq!=high+1:raise ValueError('gap')
            high=seq

def cover(es):
    c={}
    for e in es:c[e.pos[0]]=max(c.get(e.pos[0],0),e.seq)
    return c

def walk(parents,tips,cert,page=2):
    # Publication FIFO continuation; stopped commits are returned, not expanded.
    pending=deque(tips);gitseen=set();visited=set();pages=0;pops=0
    while pending:
        batch=[]
        while pending and len(batch)<page:
            c=pending.popleft();pops+=1
            if c in gitseen:continue
            gitseen.add(c)
            if c not in cert:pending.extend(parents[c])
            batch.append(c)
        pages+=1
        pending=deque(c for c in pending if c not in gitseen)
        for c in batch:
            if c in visited:continue
            visited.add(c)
    return visited,visited-set(cert),pages,pops

def closure(parents,tips):
    seen=set();q=list(tips)
    while q:
        c=q.pop()
        if c not in seen:seen.add(c);q.extend(parents[c])
    return seen

def fold(old,new,oldcov,delta,own='a',same_tips=True,released=False,same_query=True):
    first=next((i for i,(a,b) in enumerate(zip(old,new)) if a!=b),min(len(old),len(new)))
    inc=(same_query and same_tips and not released and first==len(old) and all(e.origin==own and not e.promote and all(s==e.pos[0] or dict(e.seen).get(s,0)>=n for s,n in oldcov.items()) for e in delta))
    return inc,first

def closed(es):
    c=cover(es)
    return all(n<=c.get(s,0) for e in es for s,n in e.deps)

def dag_checks():
    pairs=list(combinations(range(4),2));count=0;maxpages=0
    for mask in range(64):
        ps={i:tuple(a for k,(a,b) in enumerate(pairs) if b==i and mask>>k&1) for i in range(4)}
        for tm in range(1,16):
            tips=[i for i in range(4) if tm>>i&1]
            for cm in range(16):
                cert={i for i in range(4) if cm>>i&1};cached=closure(ps,cert)
                for size in (1,2,4):
                    seen,read,pages,pops=walk(ps,tips+tips,cert,size)
                    assert closure(ps,tips)<=cached|read
                    assert pops<=2*len(tips)+sum(map(len,ps.values()))
                    assert len(seen)<=4
                    count+=1;maxpages=max(maxpages,pages)
    ps={'a':(),'b':(),'m':('a','b'),'c':('m',),'q':(),'p':('c','q')}
    seen,read,_,_=walk(ps,['p'],{'a'},1)
    assert 'b' in read and read=={'b','m','c','q','p'}
    return dict(cases=count,max_pages=maxpages,C4_read=sorted(read))

def graphs():
    pairs=list(combinations(range(4),2));seen=set()
    for mask in range(64):
        edges=frozenset({p for i,p in enumerate(pairs) if mask>>i&1}|{(0,2),(1,3)})
        if edges not in seen:seen.add(edges);yield edges

def events(edges,ts):
    es=[E('ab'[i%2],'project',1+i//2,ts[i]) for i in range(4)]
    return tuple(replace(e,seen=tuple(es[a].pos for a,b in sorted(edges) if b==i and es[a].origin!=e.origin)) for i,e in enumerate(es))

def order_checks(casefile):
    cases=perms=0
    with open(casefile,'w') as f:
        for edges in graphs():
            for ts in product(range(3),repeat=4):
                es=events(edges,ts);expected=order(es)[0]
                for insertion in permutations(es):assert order(insertion)[0]==expected;perms+=1
                for mask in range(16):
                    inp=[e for i,e in enumerate(es) if mask>>i&1]
                    out,held,_=order(inp+inp)
                    assert closed(out) and len(set(out))==len(out)
                    assert set(out)|set(held)==set(inp)
                    # Actual Rust differential fixture, abstract timestamps map to UTC seconds.
                    f.write(json.dumps(dict(events=[dict(origin=e.origin,stream=e.stream,seq=e.seq,ts=e.ts,seen=dict(e.seen)) for e in inp+inp],out=[es.index(e) for e in out],held=sorted(es.index(e) for e in held),ids=[dict(origin=e.origin,seq=e.seq) for e in es]))+'\n')
                    cases+=1
    return dict(graphs=16,timestamps=81,permutation_runs=perms,subset_duplicate_cases=cases)

def read_bfs():
    # State: fetched prefix set, folded full history, emitted coverage, certificates,
    # deferred hashes. Each commit carries one event; certificates stop only its own root.
    totals=dict(states=0,edges=0,reads=0,rebuilds=0,incremental=0,lost_history=0,bad_lost_history_fold=0);witness=None
    for edges in graphs():
        for ts in ((2,0,1,0),(0,0,0,0),(0,2,1,2)):
            es=events(edges,ts)
            root=(0,(),(),frozenset(),frozenset());q=deque([root]);prev={root:None}
            while q:
                s=q.popleft();mask,old,cv,cert,oldheld=s;oldcov=dict(cv);trans=[]
                for i,e in enumerate(es):
                    if mask>>i&1:continue
                    # Same-stream publication has all earlier seq via ancestry.
                    if e.seq>1 and not mask>>(i-2)&1:continue
                    trans.append(('fetch '+str(i),(mask|1<<i,old,cv,cert,oldheld)))
                for lose in (False,True):
                    folded=() if lose else old
                    have=(not oldcov or bool(folded))
                    base=oldcov if have else {};stops=cert if have else frozenset()
                    fetched=[i for i in range(4) if mask>>i&1]
                    # Per-event ancestor commits for same stream; mirrors may be distinct roots.
                    ps={i:((i-2,) if es[i].seq>1 else ()) for i in range(4)}
                    visited,read,_,_=walk(ps,fetched,stops)
                    walked=[es[i] for i in read if es[i].seq>base.get(es[i].pos[0],0)]
                    contiguous(walked,base)
                    union=list(folded)+walked;contiguous(union)
                    out,held,_=order(union);newcov=cover(out)
                    assert closed(out) and len(out)==len(set(out))
                    assert set(out)|set(held)=={es[i] for i in fetched}
                    for stream,n in newcov.items():
                        assert {e.seq for e in out if e.pos[0]==stream}==set(range(1,n+1))
                    newcert=set(stops)
                    if not held and all(e.seq<=newcov.get(e.pos[0],0) for e in walked):newcert.update(visited);newcert.update(fetched)
                    delta=tuple(e for e in out if e.seq>oldcov.get(e.pos[0],0))
                    inc,first=fold(folded,out,oldcov,delta,released=bool(set(oldheld)-set(held)))
                    applied=folded+delta if inc else out
                    assert out==order([es[i] for i in fetched])[0]
                    if applied!=out:
                        assert lose and oldcov and inc
                        totals['bad_lost_history_fold']+=1
                        trace=[];back=s
                        while prev[back] is not None:
                            back,label=prev[back];trace.append(label)
                        trace=list(reversed(trace))+['read with folded=[]; preserve cursor']
                        if witness is None or len(trace)<len(witness):witness=trace
                    elif not lose:assert applied==out
                    assert not (set(delta)&set(old))
                    if mask==15:assert set(out)==set(es)
                    totals['reads']+=1;totals['incremental' if inc else 'rebuilds']+=1;totals['lost_history']+=lose
                    t=(mask,out,tuple(sorted(newcov.items())),frozenset(newcert),frozenset(held))
                    trans.append(('read rebuild-history' if lose else 'read',t))
                for label,t in trans:
                    totals['edges']+=1
                    if t not in prev:prev[t]=(s,label);q.append(t)
            totals['states']+=len(prev)
    totals['shortest_counterexample']=witness
    return totals

def promotion_checks():
    count=0
    for n in (1,2):
        branch=tuple(E('a','branch:f',i,0,branch=True) for i in range(1,n+1))
        p=E('a','project',1,1,promote=n)
        x=E('b','project',1,2)
        for input in permutations(branch+(p,x)):
            out,held,_=order(input)
            assert out==(p,)+branch+(x,) and not held;count+=1
        out,held,missing=order((p,)+branch[:-1])
        assert not out and set(held)==set((p,)+branch[:-1]) and missing
    # Overlap: first causal claim owns prefix, second claim adds only suffix.
    b1=E('a','branch:f',1,2,branch=True);b2=E('a','branch:f',2,0,branch=True)
    p1=E('a','project',1,2,promote=1);p2=E('a','project',2,0,promote=2)
    for inp in permutations((b1,b2,p1,p2)):
        assert order(inp)[0]==(p1,b1,p2,b2);count+=1
    # Internal edges removed intentionally: closure concerns complete block, not each prefix.
    p=replace(p1,seen=(b1.pos,));assert order((b1,p))[0]==(p,b1)
    return dict(permutations=count,missing_tail_cases=2,internal_edge_removed=True)

def sharing_bfs():
    es=events({(0,2),(1,3),(0,3)},(2,0,1,0));root=(0,0,0);q=deque([root]);seen={root};edges=terminal=0
    while q:
        s=q.popleft()
        if s==(15,15,15):
            views=[order([es[i] for i in range(4) if m>>i&1])[0] for m in s]
            assert views[0]==views[1]==views[2];terminal+=1
        for m in range(3):
            for i in range(4):
                if s[m]>>i&1:continue
                t=list(s);t[m]|=1<<i;t=tuple(t);edges+=1
                out,_,_=order([es[j] for j in range(4) if t[m]>>j&1]);assert closed(out)
                if t not in seen:seen.add(t);q.append(t)
    return dict(states=len(seen),edges=edges,full_sync_states=terminal)

if __name__=='__main__':
    import sys
    result=dict(walk=dag_checks(),order=order_checks(sys.argv[1] if len(sys.argv)>1 else '/tmp/es-p03-cases.jsonl'),reader=read_bfs(),promotion=promotion_checks(),three_machines=sharing_bfs())
    print(json.dumps(result,indent=2,sort_keys=True))
```

## Harness — Cargo.toml

```toml
[package]
name="es-p03-proof-harness"
version="0.1.0"
edition="2021"
[dependencies]
fgos-event-store={path="/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/event-store/rust"}
fgos-git={path="/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/git/rust"}
fgos-holder-lock={path="/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/holder-lock/rust"}
serde_json="=1.0.151"
```

## Harness — src/main.rs

```rust
use std::io::{self,BufRead};
use fgos_event_store::{envelope::{Envelope,Scope},append::Positions,order::order};
fn main(){let mut count=0;for line in io::stdin().lock().lines(){let v:serde_json::Value=serde_json::from_str(&line.unwrap()).unwrap();let es:Vec<Envelope>=v["events"].as_array().unwrap().iter().map(|x|{let mut e=Envelope{v:4,event_type:"work.add".into(),scope:Scope::Project,origin:x["origin"].as_str().unwrap().repeat(32),stream:x["stream"].as_str().unwrap().into(),seq:x["seq"].as_u64().unwrap(),ts:format!("2026-01-01T00:00:{:02}.000Z",x["ts"].as_u64().unwrap()),seen:Positions::new(),src:"proof".into(),schema_version:1,payload:serde_json::json!({}),h:String::new()};for(s,n)in x["seen"].as_object().unwrap(){let (o,stream)=s.split_once(':').unwrap();e.seen.insert(format!("{}:{}",o.repeat(32),stream),n.as_u64().unwrap());}e.h=e.compute_hash().unwrap();e}).collect();let got=order(&es,&Positions::new(),true).unwrap();let id=|e:&Envelope|v["ids"].as_array().unwrap().iter().position(|x|x["origin"].as_str().unwrap().repeat(32)==e.origin&&x["seq"].as_u64().unwrap()==e.seq).unwrap();let out:Vec<_>=got.events.iter().map(id).collect();let mut held:Vec<_>=got.deferred.iter().map(id).collect();held.sort();assert_eq!(serde_json::json!(out),v["out"],"case {}",count);assert_eq!(serde_json::json!(held),v["held"],"case {}",count);count+=1;}println!("Rust/Python differential: {count} cases, 0 mismatches");}
```

## Harness — tests/lost_history.rs

```rust
#[path="/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/event-store/rust/tests/reader_support/mod.rs"]
mod reader_support;
use reader_support::*;
use fgos_event_store::{read::{read,ReadRequest},cursor::{Cursor,Fold},layout::StreamId};
#[test]
fn reproduce_lost_history_incremental_empty_delta() {
 let f=Fixture::new();let mut h=f.handle();let p=f.port(&mut h,"refs/fgos/events/test-aa");
 let e=event('a',1,2);let streams=[StreamId::parse("project").unwrap()];
 let oid=seal(&p,&f.repo,vec![],&[e.clone()],"test-aa");
 publish(&p,&f.repo,"refs/fgos/events/test-aa",None,oid,"first");
 let empty=Cursor::default();
 let first=read(&p,&f.repo,ReadRequest{layout:&f.layout,origin:&e.origin,streams:&streams,cursor:&empty,folded:&[],project:true}).unwrap();
 let second=read(&p,&f.repo,ReadRequest{layout:&f.layout,origin:&e.origin,streams:&streams,cursor:&first.cursor,folded:&[],project:true}).unwrap();
 assert_eq!(second.sequence,vec![e]);
 assert!(second.events.is_empty());
 assert_eq!(second.fold,Fold::Incremental);
 println!("CONFIRMED: lost folded history; sequence=1, delta=0, fold=Incremental");
}
```

## Log Rust witness và differential

```text
     Locking 32 packages to highest compatible versions
   Compiling serde_json v1.0.151
   Compiling syn v3.0.5
   Compiling fgos-durable-file v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/durable-file/rust)
   Compiling fgos-process v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/process/rust)
   Compiling fgos-event-store v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/event-store/rust)
   Compiling fgos-holder-lock v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/holder-lock/rust)
   Compiling serde_derive v1.0.229
   Compiling thiserror-impl v2.0.20
   Compiling thiserror v2.0.20
   Compiling serde v1.0.229
   Compiling fgos-canonical-json v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/canonical-json/rust)
   Compiling fgos-git v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/git/rust)
   Compiling es-p03-proof-harness v0.1.0 (/tmp/es-p03-reader-proof/harness)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 3.31s
     Running tests/lost_history.rs (/tmp/es-p03-reader-proof/target/debug/deps/lost_history-62d8de7267966eb2)

running 1 test
CONFIRMED: lost folded history; sequence=1, delta=0, fold=Incremental
test reproduce_lost_history_incremental_empty_delta ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.64s

Rust/Python differential: 20736 cases, 0 mismatches
```

## Log tests append/framing/crash

```text
   Compiling fgos-event-store v0.2.0 (/home/vantt/projects/forgent/.claude/worktrees/es-p03-proof/packages/event-store/rust)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.28s
     Running tests/append_recovery.rs (/tmp/es-p03-reader-proof/target/debug/deps/append_recovery-6b579fefa3b210c0)

running 17 tests
test real_guarantee_on_os_temp_and_tmpfs ... ok
test guarantee_none_refuses_and_rank_order_is_enforced ... ok
test missing_wide_and_symlink_lock_dirs_refuse ... ok
test validation_precedes_lock_and_initialization ... ok
test append_sweeps_old_and_shared_identity_temps_under_the_lock ... ok
test vanished_closed_segment_is_recorded_and_gate_requires_catch_up ... ok
test gate_refuses_missing_prefix_and_a_receipted_deleted_tail ... ok
test high_water_recovers_receipt_closed_active_and_stale_hint ... ok
test read_dedupes_a_rotation_snapshot_and_detects_conflicting_identity ... ok
test receipt_alone_prevents_sequence_reuse_after_segment_deletion ... ok
test one_batch_write_contains_marker_and_a_short_write_never_acknowledges ... ok
test a_verifying_marker_with_internal_sequence_overlap_refuses_instead_of_truncating ... ok
test rotation_has_no_sequence_reset_and_syncs_both_directories ... ok
test append_ack_hashes_seen_and_cursor_are_verified ... ok
test reader_keeps_one_active_descriptor_and_dedupes_rotation_at_each_boundary ... ok
test corrupt_immutable_segments_refuse_and_are_never_truncated ... ok
test gaps_overlaps_and_unbacked_hints_refuse_without_assigning ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/framing_prefixes.rs (/tmp/es-p03-reader-proof/target/debug/deps/framing_prefixes-57a4665182a54846)

running 2 tests
test wrong_checksum_marker_and_complete_unmarked_lines_never_fold ... ok
test every_byte_prefix_is_invisible_and_next_append_truncates_it ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.61s

     Running tests/kill_append.rs (/tmp/es-p03-reader-proof/target/debug/deps/kill_append-5b4207eb35aadc8a)

running 7 tests
test sigkill_during_truncation_recovery_is_idempotent ... ok
test sigkill_at_every_append_and_ack_boundary_preserves_acknowledged_prefix ... ok
test sigkill_during_hint_repair_and_rotation_crash_with_stale_hint ... ok
test sigkill_at_new_active_file_ack_boundaries_preserves_rotated_and_new_events ... ok
test sigkill_at_every_rotation_boundary_never_reuses_sequence ... ok
test eight_real_processes_append_with_one_contiguous_sequence_and_identity ... ok
test sigkill_during_real_write_never_exposes_a_partial_batch ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p02_review.rs (/tmp/es-p03-reader-proof/target/debug/deps/p02_review-35bc5df3859f3172)

running 5 tests
test unbacked_hint_refuses_before_truncating_torn_tail ... ok
test garbage_hint_is_rewritten_and_stray_closed_path_is_named ... ok
test steady_append_performs_two_real_fsyncs_and_no_hint_replacement ... ok
test vanished_already_folded_range_does_not_bounce_the_gate ... ok
test complete_damaged_batches_refuse_without_changing_any_bytes ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

```
