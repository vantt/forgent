# Model check: Event Store reader versus seal

Run `wf-run-1792224866445-9a03a834`, unit `unit-run-1792225313477-3f50c199` (openai, tetcu72), 2026-10-17. Checked spec v2 as committed in 232d61eb8, before the M1-M4 amendment.


**Phán quyết theo invariant.** Không tìm thấy mất event đã ack trong 23.990 trạng thái giao thức và 29 trạng thái crash vi mô, dưới các giả định durability ghi dưới đây. Không tìm thấy đếm trùng `h` trong reader. Thuộc tính “mọi reader view là prefix-consistent union” **không được bảo đảm bởi đặc tả hiện tại**: crash rotation có thể trùng `seq`, batch có thể lộ một phần, và fetch riêng từng ref có thể làm thiếu causal predecessor. Hội tụ cùng thứ tự **chưa đạt với §12 hiện tại** vì comparator không bắc cầu; Kahn topological sort chọn nhỏ nhất `(ts, origin, stream, seq)` đạt determinism cho cùng tập event hợp lệ trong toàn bộ miền đã kiểm tra. DAG walk đầy đủ với visited set **kết thúc và đủ coverage** trong miền kiểm tra; điều kiện dừng theo coverage của các origin đã biết trong M4 **không an toàn**.

Đây là proof task bằng mô hình, không phải kiểm thử implementation Rust hay phê chuẩn đặc tả. Kết luận “không tìm thấy” không phải chứng minh vô hạn. Không gọi lifecycle verb, không thay đổi source hoặc tài liệu trong repository. Các file tạm nằm trong `/tmp/event-store-proof`; chỉ artifact bắt buộc nằm trong outbox được chỉ định.

## Công cụ, miền và cách chạy

Dùng Python 3 standard library, BFS với trạng thái bất biến và tập `visited`; không dùng Java/TLC, package mạng hoặc solver ngoài. Lưu phần source cuối báo cáo thành `/tmp/check.py`, rồi chạy `python3 /tmp/check.py`. Kết quả JSON đầy đủ nằm ngay sau phần phân tích. Source là artifact tự đủ để chạy lại khi `/tmp` bị xóa.

Mô hình giao thức có hai writer, mỗi writer thử một batch một event trên cùng stream; một sealer có thể rotate từng event hoặc cả hai; một reader bắt đầu ở cursor rỗng, đọc active, closed, rồi ref; một máy B fetch snapshot ref. Các writer tranh cùng append mutex; sealer giữ mutex khi rename và cập nhật hwm. CAS và receipt là các bước riêng; chỉ được xóa segment sau receipt. Crash/restart của writer và sealer được bật ở mọi trạng thái có tiến trình đang làm việc; không giới hạn số crash vì visited set gộp vòng lặp. Crash sau return hoặc giữa các bước không đổi trạng thái durable là stutter, được gộp. Một writer crash sau write không tự thử lại business append; tránh giả định idempotency mà đặc tả không hứa. Ack được ghi ở fsync theo §9, kể cả crash trước return; đây là lựa chọn mạnh hơn ack quan sát được ở caller.

Mô hình vi mô riêng kiểm tra process crash và power crash trước/sau mỗi bước write, file fsync, directory fsync/ack, rename, directory fsync, objects, durable CAS, receipt, delete, directory fsync cuối. Nó có 11 phase, 22 cặp phase/loại crash. Process crash giữ namespace/content hiện tại; power crash về namespace/content đã durable. Đây là một event và không tích chập với interleaving hai writer. Không được nhân các số trạng thái của các mô hình rồi gọi đó là một proof tích hợp.

Giả định môi trường: hash không collision; lock thật sự loại trừ và được giải phóng khi process chết; ref CAS atomic và durable; event được giữ trong git object store khi ref reachable; fsync có hiệu lực; việc fsync đầy đủ các directory làm rename durable. Mô hình không chứng minh ext4/APFS/NTFS thực thi các giả định này. Rename từ active sang `closed/` đi qua hai directory; implementation cần fsync các directory liên quan, không diễn giải chữ “the directory” thành chỉ một directory tùy ý. Không mô hình byte-level hash corruption, malicious ref rewind, GC bug, network fairness vô hạn hay branch reducer. Promote được mô hình như DAG second parent và đọc đủ branch event, chưa chứng minh chính sách đặt branch event tại vị trí promote.

Trong BFS, đọc active qua descriptor được trừu tượng thành snapshot các complete line ở bước đọc; reader giữ snapshot sau rename/delete. Closed listing/read được gộp, còn ENOENT được đại diện bởi lịch mà segment đã biến mất trước bước đó và được ref phía sau bù lại. Trừu tượng này bao phủ các cửa sổ chuyển chỗ event của miền hai event, nhưng không thay thế stress test filesystem. Định danh event là `(writer, seq)`, đại diện `h` khác nhau cho hai writer. Seq collision vẫn có hai hash khác nhau và không bị dedupe giấu đi. Cursor khác rỗng và origin mới được kiểm tra riêng ở witness M4.

## Các phản ví dụ và sửa văn bản đề xuất

### C1 — Trùng seq khi crash sau rename, trước hwm (§9.4, §10.1)

Trace BFS ngắn nhất được tìm thấy:

1. `W0: lock`.
2. `W0: write complete line seq=1`.
3. `W0: process crash/restart`.
4. `S: lock append`.
5. `S: durable rename active -> closed`.
6. `S: process crash/restart`.
7. `W1: lock`.
8. `W1: write complete line seq=1`.

Active đã rỗng nhưng hwm vẫn 0. §9.4 chỉ đọc active hoặc hwm, bỏ qua closed, nên cấp lại seq=1. Event đầu chưa ack trong trace tối thiểu; thêm `W0: fsync = ack` trước crash cho cùng phản ví dụ với event đầu đã ack. Không có event bị xóa trong trace này, nên không được báo thành mất ack. Tuy nhiên chain có hai event khác hash cùng seq, không còn là prefix của một sequence hợp lệ, và publish tiếp có thể mắc chain-gap. Recovery sau đó không sửa được identity đã cấp sai.

Đề xuất thêm §9.4: “Dưới `event-append`, trước khi cấp seq, phục hồi high-water mark từ active, mọi closed segment đã xác minh và receipt/ref đã xác minh; nếu chúng mâu thuẫn, dừng. Crash giữa rename và hwm phải được phục hồi trước mọi append mới. Sequence không được tái cấp từ hwm cũ.” Có thể dùng transaction rotation khác nhưng cần nêu rõ thứ tự durable và recovery; không chỉ yêu cầu sealer lần sau sửa vì writer có thể chạy trước.

### C2 — Batch lộ một phần (§9.5 và câu all-or-nothing)

Checker duyệt đủ 7 byte-prefix của batch minh họa `e1\ne2\n`. Với 3 byte `e1\n`, 4 byte `e1\ne`, hoặc 5 byte `e1\ne2`, reader fold `e1` dù batch hai event chưa hoàn tất và chưa ack. Đây là ba witness byte-prefix tìm được. Các ký hiệu e1/e2 đại diện hai dòng JSON hợp lệ có hash riêng; chiều dài toy không ảnh hưởng lập luận. Một `write` không phải transaction, và short write/crash có thể để lại complete line đầu. Recovery chỉ truncate sau newline cuối sẽ giữ e1 mãi.

Đề xuất §9 và §11: “Batch có framing với batch id, count/checksum và commit marker durable. Reader chỉ fold batch có commit marker hợp lệ. Recovery loại toàn bộ batch chưa commit, kể cả các complete line của nó; seq đã public không được tái sử dụng.” Nếu chọn cho phép partial unacked batch thì phải bỏ lời hứa all-or-nothing và sửa contract consumer tương ứng. Checker này chỉ chứng minh lỗi của quy tắc hiện tại, chưa chứng minh thiết kế framing đề xuất.

### C3 — Comparator có chu trình (§12, M2)

Witness: event 0 có ts=2, event 1 có ts=0 và thấy event 0, event 2 có ts=1 và concurrent với cả hai. Do causal edge, `0 < 1`; do timestamp, `1 < 2`; do timestamp, `2 < 0`. Event 3 độc lập ts=3 chỉ làm đủ miền bốn node. Không có total order nào thỏa cả ba so sánh. Sort API dùng comparator này có thể cho kết quả phụ thuộc thứ tự đầu vào.

Đề xuất thay quy tắc concurrent bằng thuật toán: “Tạo DAG cạnh theo own-stream seq và seen, gồm transitive dependencies; từ tập node indegree=0, liên tục lấy node có khóa nhỏ nhất `(ts, origin, stream, seq)`, emit và bỏ các cạnh ra. Không gọi pairwise comparator trộn causal và timestamp. Thiếu dependency hoặc cycle là lỗi/chưa đủ dữ liệu, không tự bỏ cạnh.” Với identity hợp lệ khóa phân biệt event; seq collision C1 phải bị chặn trước. Đã duyệt 64 DAG có node đánh số theo một topological labeling, 24 hoán vị ts mỗi DAG, và 24 insertion order mỗi trường hợp: 36.864 lần sort đều duy nhất. Mọi DAG bốn node có thể đổi nhãn vào miền này. Miền timestamps được chọn có giá trị khác nhau; không tuyên bố đã exhaustive mọi tổ hợp ts bằng nhau. Tie được định nghĩa bởi origin/stream/seq trong code.

### C4 — Dừng DAG theo cursor đã biết bỏ sót origin mới (§11.3, §14.3, M4)

DAG cụ thể: `a=seal A1`, `b=seal B1`, `m=merge(a,b)` không có events blob, `c=seal A2(parent=m)`. Hai clone dùng chung machine id nhưng origin A/B riêng. Cursor reader chỉ biết A1. Nếu đến c và coi origin A đã covered rồi dừng branch, trace walk chỉ là `[c]`, trả delta `[A2]`, bỏ B1 chưa biết. Lỗi xảy ra cả với visited set vì visited chỉ chống đi lại, không cho phép prune một ancestor chưa khám phá.

DAG kiểm tra còn có `q=seal Q1` và `p=promote-seal P1` với parents `(c,q)`. Full walk `[p,c,m,a,b,q]` tìm đủ A1,A2,B1,P1,Q1; merge có seal.json-only và không bị đọc nhầm events.jsonl. First-parent walk tại m cũng bỏ b; đây là hệ quả của cùng DAG, không phải kết quả từ một implementation git thực tế.

Đề xuất §10/11/14: “Mỗi commit được thăm tối đa một lần; visit mọi parent. Commit kind merge không có events.jsonl. Coverage là theo `(origin, stream)`, chỉ nhận event từ seal đã xác minh. Chỉ prune ở commit có object id nằm trong một frontier đã xử lý đầy đủ và đã chứng nhận tất cả ancestors của nó. Không prune chỉ vì seq của các origin đang có trong cursor đã covered. Khi chưa có frontier đó, đi đến roots.” Full traversal hữu hạn không đồng nghĩa chi phí thấp: miền tổng quát là O(V+E) cho reachable DAG. Không có proof bounded-latency dưới Work gate từ thử nghiệm này. Có thể xây cache reachable-commit/frontier, nhưng cần proof riêng trước khi dùng nó để dừng.

### C5 — Foreign view thiếu causal predecessor (§11 read boundary, §12 seen, §14 fetch)

Cho a trên ref A, b trên ref B với `b.seen[A]=1`. Máy C fetch B trước A (hoặc remote có B trước A vì B đã thấy a từ kênh đồng bộ khác). Trong bốn tập hiện diện `{}`, `{a}`, `{b}`, `{a,b}`, tập `{b}` không causal-closed. Không có own-stream gap nào bắt được lỗi này. Topological sort riêng tập `{b}` vẫn emit b vì node a chưa được đưa vào DAG.

Đề xuất: “View là causally closed union: khi seen yêu cầu event chưa có, giữ dependent event pending, báo missing dependency và fetch/retry; không fold nó vào consumer view hoặc advance cursor vượt qua nó. Publication không được ngầm coi rằng tất cả ref phụ thuộc đã được chia sẻ.” Nếu intended contract chỉ là per-stream contiguous union thì phải viết rõ định nghĩa yếu hơn; không được gọi đó là causal prefix. Máy chưa fetch đủ có thể trả incomplete status thay vì báo corruption hay chờ network dưới Work gate.

### C6 — Prefix của total order không ổn định khi event concurrent tới muộn (§11 cursor, §12 order)

Một máy đọc `[x(ts=2)]`; lần fetch sau mang event concurrent y(ts=1). Cùng thuật toán deterministic sẽ cho `[y,x]`. View cũ không là prefix của view mới dù cả hai causally closed. Đây là witness riêng của boundary checker, không phải mất event. “Prefix-consistent union” cần định nghĩa: prefix theo từng stream và causal closure khác với prefix bất biến của global total order.

Đề xuất: “Cursor seq/ref-tip biểu diễn coverage, không phải offset trong thứ tự global bất biến. Khi union thay đổi do event concurrent cũ hơn theo tie-break, consumer replay phần chịu ảnh hưởng hoặc rebuild; chỉ coi kết quả incremental append là an toàn nếu chứng minh thứ tự không đổi. Event Store không hứa global prefix giữa hai tập event khác nhau.” Nếu cần global append-only prefix thật sự, cần một publication watermark/consensus contract khác; không thể suy ra từ tie-break local.

## Kết quả dương và giới hạn hội tụ

Trong BFS giao thức không có `ack_lost`, `reader_misses_prestart_ack`, `reader_duplicate_hash` hay `reader_nonprefix` theo phép đo đơn giản “không thiếu số seq” của checker. C1 cho thấy phép đo không thiếu số seq yếu hơn tính hợp lệ của sequence: hai hash trùng seq vẫn đi qua phép đo ấy. Báo cáo không đánh đồng hai điều này. Reader có 6.769 trạng thái đã return; 73.781 cạnh được xét. Mỗi lớp vi phạm lưu trace BFS đầu tiên; không liệt kê vô hạn các trace lặp crash tương đương.

Mô hình vi mô có 29 trạng thái, 83 cạnh, không có ack loss. Nó giả định rename durable sau directory barrier và ref durable sau CAS; chưa chứng minh power-loss behavior của implementation. Cửa sổ hwm đã được kiểm tra trong BFS hai writer, không được giấu bằng việc mô hình vi mô chỉ có một writer.

Mô hình sharing có 23 trạng thái và một terminal converged state: hai clone push CAS cùng ref, remote nhận a hoặc b trước, clone sau tạo merge giữ cả hai parents, rồi hai máy fetch theo mọi thứ tự. Khi cả hai đã fetch m, union đều là A1/B1. Git merge object creation và CAS là bước atomic trừu tượng; retry/failure không đổi durable state là stutter. Kết quả này có điều kiện eventual successful sync và full DAG walk; không bảo đảm hội tụ trong lịch offline mãi hoặc fetch rewind. Với cùng union, Kahn algorithm cho cùng ordered view. §12 cũ chưa cho phép kết luận đó.

960 walk (64 DAG nhân 15 tập tip khác rỗng) đều thăm đúng mọi ancestor, không quá V+E stack pops. Git commit DAG hữu hạn nên termination không cần biết trước tập origin. Visited cũng chống lặp khi hai parents có ancestor chung. Đây là safety/termination hữu hạn, không phải benchmark và không loại bỏ O(N) history traversal. Promote-position semantics và missing-seen/cycle handling là các contract còn cần kiểm tra khi văn bản được sửa.

Không tìm thêm phản ví dụ ngoài sáu lớp C1–C6 nêu trên. Không chạy `npm test`: task chỉ kiểm chứng một draft chưa implementation, không sửa production code. Không có thay đổi evergreen spec; các đoạn sửa là đề xuất để tác giả review.

## Dữ liệu tái lập

Runtime: `3.14.4`. Source SHA-256: `1ce86065600410049aedc813d059b49d6d17f36197be97e4ba5fcac0f57ee157`.

Input `docs/platform/event-store/spec.md`, SHA-256 `4348ba168489493017e0c95bfbee0c44fe511f7522d4aeed1d54310aff9ce472`.

Input `plans/reports/council-261017-1513-event-store-reopen-final-packet.md`, SHA-256 `9e36a1d37d25a8e9bb9791db357cab3bdaa3cb055153490dabc7fffd6fbb8292`.

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

## Source checker đầy đủ

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

Xác minh artifact: đã chạy lại checker và so JSON bằng nhau; source nhúng trùng byte với source đã chạy và compile được. Trace C1 có ack trước crash cũng đã replay bằng transition function và xác nhận hai event khác nhau cùng seq=1.
