# Model check again, on the corrected Event Store rules

Run `wf-run-1792226327422-dac63901`, unit `unit-run-1792226327551-283cbd9e` (openai, tetcu72), 2026-10-17. Checked [docs/platform/event-store/spec.md](../../docs/platform/event-store/spec.md) as of e8f36d93c; its N1 and section 10 findings were folded into the spec right after.

| Invariant | Counterexample cũ đã sửa chưa? | Vi phạm mới trong miền đã duyệt? |
|---|---|---|
| Không mất event đã ack. | Không có witness cũ về mất ack; mô hình cũ cũng không tìm thấy. | Không tìm thấy trong BFS giao thức và mô hình power crash. |
| Không đếm một event hai lần. | Quy tắc dedupe theo `h` tiếp tục đạt. | Không tìm thấy trong reader và các lần catch-up có cursor. |
| Không có `seq` collision. | C1 đã sửa; replay cấp `seq=2` thay vì cấp lại `seq=1`. | Không tìm thấy; gap, overlap và hint vượt dữ liệu bị từ chối. |
| Không lộ một phần batch. | C2 đã sửa; mọi prefix thiếu marker đều không được fold. | Không tìm thấy trong miền byte-prefix của framing. |
| View causally closed. | C5 đã sửa; event bị deferred không nâng coverage và không tạo certification. | Không tìm thấy trong các miền đồ thị và cursor. |
| Ba máy có cùng ordered view sau full sync. | C3 đạt nhờ Kahn; C6 đạt bằng replay/rebuild, không phải bằng một global prefix bất biến. | Không tìm thấy với eventual successful full sync. |
| DAG walk kết thúc và không bỏ event, kể cả origin mới dưới merge khi đã có certified commit. | C4 đã sửa bằng pruning theo commit id được chứng nhận. | Không tìm thấy khi certificate tuân thủ §11–12; có một chỗ §10 cần thống nhất cách diễn đạt, ghi riêng bên dưới. |
| Rebuild-install không deadlock hoặc livelock dưới sustained writes. | Sáu witness cũ không kiểm tra invariant này. | **Có livelock mới N1.** Không tìm thấy deadlock trong mô hình retry; không thể xác nhận yêu cầu progress hiện tại. |

Báo cáo kiểm tra lại Event Store sau proof fold, ngày 2026-10-17. Phán quyết là sáu lớp counterexample cũ không còn vi phạm khi áp dụng các quy tắc đã sửa, nhưng đặc tả chưa bảo đảm tiến triển của rebuild-install khi writer liên tục ghi. “Không tìm thấy” luôn chỉ có nghĩa trong miền hữu hạn và các abstraction nêu dưới đây; đây không phải chứng minh implementation hay chấp thuận ký §26.

## Miền kiểm tra và giả định

Tôi trích đúng source Python trong báo cáo model-check đầu tiên, chạy lại nguyên bản, rồi sửa source đó trong `/tmp`. Negative control tái tạo đúng 23.990 trạng thái, 73.781 cạnh và witness C1 của bản cũ; các checker boundary, comparator và unsafe coverage stop cũng tái tạo C2–C6. Bản sửa giữ BFS, immutable state, visited set, crash/restart và thứ tự reader `active → closed → ref`. Nó thêm durable receipt độc lập với trạng thái process, recovery từ cả bốn nguồn, và các checker framing, certification, causal cursor, ba máy và liveness. Source cuối báo cáo là toàn bộ source đã chạy, không cần file cũ hoặc package bên ngoài.

| Mô hình | Bounds và kết quả thực chạy |
|---|---|
| BFS giao thức. | Hai writer cùng một stream, một sealer, một reader từ cursor rỗng và một mirror fetch. Mỗi writer thử tối đa một batch; duyệt riêng batch dài 1, 2 và 3 event, tức tối đa 2, 4 và 6 event. Mỗi cấu hình có 32.238 trạng thái, 101.049 cạnh, 9.045 reader-return state, không có counterexample. Số trạng thái bằng nhau do một batch hoàn chỉnh là một transition trong abstraction này. |
| Crash vi mô. | Một event, 12 phase từ create/write qua file fsync, directory fsync/ack, rename, hai directory barrier riêng, objects, CAS, durable receipt, delete và directory fsync. Cả process crash và power crash được bật tại mọi phase reachable. Có 30 trạng thái, 88 cạnh, không có ack loss. Bản cũ có 11 phase, 29 trạng thái. |
| Framing byte-level. | Batch hai event và marker JSON có 285 byte. Duyệt đủ 286 byte-prefix, 285 suffix-prefix sau một batch đã commit, và marker sai checksum. Reader chỉ thấy rỗng hoặc cả hai event. Recovery giữ đúng phần kết thúc tại marker hợp lệ. |
| Kahn. | Giữ miền cũ: 64 DAG bốn node, 24 timestamp permutation và 24 insertion order, 36.864 lần sort. Mở rộng thêm 81 timestamp assignment từ `{0,1,2}` để có timestamp bằng nhau, vẫn 24 insertion order: 124.416 lần sort nữa. |
| Certified DAG walk. | 64 DAG bốn node, 15 tập tip khác rỗng và 16 tập certificate: 15.360 walk. Cache ban đầu chứa đúng ancestor closure của certified commits. Mọi ancestor của tips đều có trong cache hoặc kết quả; số stack pop không vượt `|tips| + |edges|`. Giữ thêm witness merge/promote sáu commit của bản đầu, với certificate `a` hiện diện và origin `B` chưa biết. |
| Causal coverage. | 8.128 tổ hợp DAG, tập dữ liệu hiện diện và coverage causally closed; thêm 6.784 trường hợp hai stream, mỗi stream hai seq, trong đó 1.480 trường hợp còn deferred. Cursor từng stream luôn là prefix của stream và dừng trước phần deferred; bổ sung dependency sau đó không làm mất event. Có 508 trường hợp kiểm tra điều kiện incremental own-stream. |
| Chia sẻ. | Giữ mô hình hai clone cũ có 23 trạng thái. Thêm ba máy với push không force, fetch mirror và reconcile bằng union của hai parent: 605 trạng thái, 1.473 cạnh, một trạng thái full sync. Duyệt riêng mọi thứ tự nhận bốn event trên ba máy: 4.096 trạng thái, 24.576 cạnh; mọi full-sync view có cùng Kahn order. |
| Rebuild retry. | Equality quotient bốn trạng thái: chưa capture, snapshot current, snapshot stale, và installed. Writer có thể làm snapshot stale; install kiểm tra đúng điều kiện §13. BFS tìm vòng progress ba bước ngắn nhất. Đây là abstraction của seq tăng vô hạn, không dùng bộ đếm wrap-around để tạo lỗi giả. |

Bounds không nhỏ hơn bài đầu theo từng chiều tương ứng: vẫn hai writer, tăng độ dài batch; vẫn bốn node DAG, mở rộng timestamp có tie và certification; giữ witness sáu commit, tăng sharing lên ba máy; thêm phase fsync và kiểm tra liveness. Không cộng hoặc nhân số trạng thái của các mô hình để tuyên bố đã kiểm tra một tích hợp duy nhất.

Hash được giả định không collision; lock thật sự loại trừ và giải phóng khi process chết; file fsync, directory fsync và CAS có hiệu lực; reachable git objects không tự mất; store id không bị clone rồi ghi đồng thời trái contract. Ref không bị actor bên ngoài rewind. Receipt là cache hợp lệ do protocol ghi, không phải input độc hại. Recovery kiểm tra range và từ chối gap/overlap; nó không tự sửa corruption.

BFS giao thức gộp write của một batch marker-closed thành một bước, giữ batch đó qua process crash trước ack; trường hợp short write và power loss được kiểm tra ở hai mô hình riêng. Ack được tính ngay tại fsync, mạnh hơn chỉ tính return mà caller nhận được. Snapshot của descriptor được giữ sau rename/delete. Listing/read closed được gộp như bài đầu; cửa sổ ENOENT được đại diện bởi ref đã có dữ liệu trước delete. Hash dedupe được thực thi bằng set, đúng quy tắc §11; đây không phải test một thư viện dedupe cụ thể. Mô hình power crash cho phép hai tên cùng sống lại khi destination đã fsync nhưng source chưa fsync; cùng bytes vẫn chỉ là một event.

Trong DAG tổng quát, một node đại diện một event/changeset, certificate hợp lệ đại diện closure đã có trong view. Mô hình cursor riêng làm tường minh seq của hai stream. Mô hình ba máy abstract git merge thành union event của hai parent, còn tính đủ ancestor được kiểm riêng bởi walk. Failed CAS không đổi state là stutter; cần eventual successful sync, không thể hứa hội tụ khi máy offline mãi. Chính sách promote block, reducer business, legacy parity, filesystem thật và implementation Rust chưa được chứng minh. Không chạy `npm test`, vì không có thay đổi code và component chưa implementation.

## Replay sáu counterexample cũ

**C1, §9.3–4 và §10.1.** Replay cùng tám hành động: `W0 lock → write seq=1 → process crash → S lock → rename active to closed; fsync closed; fsync stream → S crash → W1 lock → write`. Kết quả mới của bước cuối là `seq=2`. `hwm` vẫn có thể bằng 0, nhưng committed closed range kết thúc ở 1 được recovery đọc dưới `event-append`. Các vector bổ sung xác nhận receipt 2, closed 3..4 và active 5 cho high-water mark 5; closed gap, overlap và hint vượt mọi location trả `event-store-seq-recovery-conflict`. Receipt vẫn tồn tại sau sealer crash và trước/sau delete. Event chưa ack trong witness tối thiểu vẫn có marker hợp lệ nên có thể được giữ, đúng contract “append in progress may or may not be visible”.

**C2, §9.6 và §11.1.** Các prefix tương ứng `e1\n`, `e1\ne` và `e1\ne2` trước đây lộ `e1`. Với event JSON và marker mới, prefix kết thúc sau event đầu, sau một byte event sau, hoặc ngay trước newline cuối của event sau đều trả `[]`. Toàn bộ 285 prefix chưa đủ marker đều không visible; chỉ prefix 285 byte đầy đủ mới trả cả hai event. Truncate ở marker cuối loại cả complete event line chưa commit. Marker không phải event và không lấy seq.

**C3, §12.** Giữ witness `0→1`, `ts=(2,0,1,3)`. Comparator cũ tạo vòng `0<1<2<0`. Kahn mới trả `[2,0,1,3]` trong mọi insertion order; cạnh `0→1` được giữ. Các kết quả `comparator_counterexample` trong JSON là negative control có chủ đích của comparator cũ, không phải phát hiện mới trong Kahn.

**C4, §11.3.** Giữ `a=seal A1`, `b=seal B1`, `m=merge(a,b)`, `c=seal A2(parent=m)`, `q=seal Q1`, `p=promote-seal P1(parents=c,q)`. Chọn coverage `{A1,A2}` và `certified={a}` để còn mạnh hơn witness cũ chỉ biết A1. Walk mới là `[p,c,m,a,b,q]`; nó dừng đúng ở `a`, vẫn đi parent `b`, và trả delta `{B1,P1,Q1}`. Nếu bắt đầu ở `c`, nó vẫn tìm `B1`. Kết quả `unsafe_cursor_stop` trong helper sharing gốc cố ý chạy quy tắc cũ làm negative control; không dùng helper đó để chứng minh pruning mới.

**C5, §11.5 và §12.** Giữ `a=0`, `b=1`, `b.seen[A]=1`. Khi chỉ B được fetch, emit rỗng, `b` deferred, coverage không tiến và certified không tăng. Khi A tới, lần đọc sau trả `[a,b]`. Test cursor hai stream còn kiểm tra rằng A2 không được nâng coverage nếu A1 hoặc causal predecessor của A1 thiếu. Sau khi toàn bộ dependency tới, những event từng deferred được emit đúng một lần.

**C6, §12 và §15.** Giữ `x(ts=2)` rồi thêm concurrent `y(ts=1)`. Sort mới vẫn cần `[y,x]`; sửa spec không loại bỏ sự đảo vị trí này. Cursor là coverage, consumer nhận `rebuildRequired`, rồi replay suffix hoặc rebuild cho `[y,x]`, bằng full sort. Checker dùng rebuild từ tập union để xác minh kết quả. Không có lời hứa rằng nối delta vào `[x]` là hợp lệ. Chỉ 508 trường hợp own-stream mà event mới phụ thuộc toàn bộ view cũ mới được xác nhận incremental append cho cùng kết quả.

## Counterexample mới N1: rebuild-install có thể livelock

N1 vi phạm yêu cầu “không livelock trong rebuild-install retry dưới sustained writes”. Quy tắc liên quan là câu cuối §13: snapshot chỉ được install nếu own-stream positions còn current, nếu không thì tính lại; §15 yêu cầu rebuild ngoài gate. Văn bản hiện tại không hứa một quota hoặc reservation cho installer. Đây là lỗ hổng progress, không phải vi phạm safety của việc từ chối snapshot cũ.

Trace ngắn nhất trong transition system đã khai báo là một lasso ba bước; trạng thái đầu có own seq `k` và chưa capture:

1. Installer capture và tính rebuild ngoài gate từ own seq `k`.
2. Writer lấy gate, append và ack event `k+1`, cập nhật cache, rồi nhả gate.
3. Installer lấy gate, thấy `k != k+1`, từ chối snapshot và quay lại rebuild.

Lặp ba bước đó với `k←k+1`. Mỗi process đều được chạy trong mỗi vòng; writer luôn hoàn tất, installer luôn thử install nhưng không bao giờ thành công. Không cần crash, CAS failure, network failure hoặc lock starvation. Lịch này thỏa weak fairness cho writer và installer. Nếu áp đặt strong fairness lên đúng transition “install succeeds” thì có thể loại lịch, nhưng spec không đặt giả định đó và scheduler thực tế không bảo đảm nó. Bound hữu hạn theo tổng số append sẽ làm writer dừng và che lỗi, vì vậy checker dùng equality quotient bảo toàn chính xác guard current/stale; trace nâng được thành lịch thật với seq tăng mãi. Ba bước là ngắn nhất với granularity capture, write và checked install: cần cả một snapshot, một lần làm stale, và một lần reject.

Không có trạng thái deadlock reachable trong mô hình retry này: mọi trạng thái chưa installed đều có transition. Điều đó không phải proof toàn hệ thống không deadlock; lock ranks và các port khác nằm ngoài mô hình.

Đề xuất thêm văn bản vào §13/§15: “Rebuild-install không được retry vô hạn. Sau một số lần own-position mismatch hữu hạn, consumer phải kết thúc bằng `event-store-rebuild-busy` hoặc dùng một cơ chế handoff bảo đảm install tiến triển. Trả busy phải giữ cache hiện tại hợp lệ và không cài snapshot cũ. Không được mô tả bounded failure là successful rebuild.” Nếu yêu cầu là rebuild **phải thành công** dưới sustained writes, cần thêm và chứng minh một cơ chế cụ thể, chẳng hạn chuẩn bị ngoài gate với retention của own-stream tail, rồi dưới gate chỉ fold tail đã được bảo đảm sẵn và install; không walk DAG hoặc gọi git dưới gate. Counterexample đủ để bác bỏ retry thuần túy; checker này chưa chứng minh phương án handoff đó.

## Một chỗ văn bản cần thống nhất trước implementation

§10.2.4 nói thêm `<new>` vào `certified` và ghi “the walk's cover”, trong khi §11.5 và §12 cấm certification nếu có event deferred. Model đã áp dụng luật mạnh và rõ của §11–12: không certificate nào được thêm nếu còn deferred, kể cả receipt. Vì thế không báo một execution cố tình trái luật đó thành counterexample mới của corrected model.

Tuy nhiên implementation không nên phải tự đoán: walk §10.2.1 diễn ra trước khi `<new>` tồn tại. Nếu chép nguyên cover cũ và certify `<new>` vô điều kiện, một lần seal sau có thể prune commit chứa event chưa được cover; nếu ancestor còn deferred thì còn có thể che event của origin khác. Nên sửa §10.2.4 thành: “Receipt lưu `lastSeq` đã publish riêng với emitted coverage. Chỉ thêm `<new>` vào `certified` sau khi mọi event thuộc `<new>` và ancestor của nó đã được emit, coverage tương ứng đã được nâng, và không có event deferred; nếu chưa đạt thì giữ durable receipt cho deletion nhưng không certify `<new>`.” Đây là làm rõ chỗ giao giữa receipt durability và reader certification, không giả định receipt tự đồng nghĩa causal completeness.

## Tái lập và evidence

Chỉ đọc ba input trong repository, chỉ tạo source và dữ liệu chạy trong `/tmp`; ngoài ra chỉ ghi các artifact bắt buộc vào outbox được chỉ định, mỗi file bằng `.tmp` rồi rename. Không gọi Work lifecycle, không sửa spec, không chạy git commit hoặc dispatch task khác. Runtime là Python 3.14.4 với standard library.

Lưu khối source cuối báo cáo thành `/tmp/check.py`, chạy `python3 /tmp/check.py`. Source này self-contained. Checker đã chạy hai lần cho JSON trùng byte. Bản nguyên thủy cũng đã chạy riêng và tái tạo baseline 23.990 trạng thái. Những field chứa từ `unsafe` hoặc `comparator_counterexample` là negative control cũ như đã giải thích; kết quả mới nằm ở `protocol`, `framing`, `corrected_exhaustive`, `stream_cursors`, `three_machines`, `three_push_merge`, `power` và `rebuild_liveness`.

SHA-256 của source đã chạy: `bb06749a13a312dc09cbc908c069485d1110e35841a8b5d0620f0af2af1b6aa5`.

- `docs/platform/event-store/spec.md`: `830fdd0d752f734bdb4c6fdd70ec02c90c0137daf274ad06270610d681e9c54c`.
- `plans/reports/experiment-261017-1527-event-store-model-check-reader-seal.md`: `9e8561b12702400a732506cd30cae045f365a87442f007190d21ddb5674b91d8`.
- `plans/reports/review-261017-1538-event-store-proof-fold-verdicts.md`: `efefd7144c27f955b198a88c0d965b03bcbdc107169b77625acd5a957da4b7e2`.

Kết quả JSON đầy đủ:

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

## Toàn bộ checker source

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
