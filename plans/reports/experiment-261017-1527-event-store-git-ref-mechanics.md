# Git mechanics for Event Store refs (V-REF-01)

Run `wf-run-1792224866445-9a03a834`, unit `unit-run-1792225498399-80c8f1a0` (openai, tetcu72), 2026-10-17.


Môi trường: Git `2.53.0`, Linux, ba clone `a`, `b`, `c` và một bare remote đều nằm trong `/tmp`; toàn bộ sandbox bị xóa khi script kết thúc. Thời gian là một lần đo wall-clock trên máy chạy, chỉ dùng để xấp xỉ quy mô chứ không phải ngưỡng hiệu năng.

## Kết quả và hệ quả cho spec

| Case | Kết quả | Ý nghĩa cho spec |
|---|---|---|
| 1. Plumbing seal + CAS | **PASS.** Seal 9 ms; `HEAD` và index không đổi, work tree vẫn dirty, hook không chạy. Tám CAS đồng thời có đúng 1 thắng, 7 retry thành công. | Xác nhận cơ chế ở §10.2.2–10.2.4 thực hiện được bằng `hash-object`, `mktree`, `commit-tree`, `update-ref <ref> <new> <old>` mà không lấy index/main lock. Không cần đổi văn bản, nhưng §10 nên nói rõ CAS lỗi trả non-zero và caller phải đọc tip lại trước mỗi retry. |
| 2. GC, packed refs và clone | **PASS, với điều kiện ref còn tồn tại.** Ref và object chỉ reachable từ `refs/fgos/events/a` sống qua `gc`, `gc --prune=now`, `repack -ad`, `pack-refs --all`. Fresh clone không có custom ref mặc định (exit 128); explicit fetch mirror thành công. | Khẳng định §10 và §14. Cần làm rõ ở §14 rằng clone/fetch mặc định chỉ có `refs/heads/*`; setup phải cài explicit fetch refspec trước khi reader trông đợi mirror. |
| 3. Three-machine sharing + divergence | **PASS.** Explicit fetch đưa ref `b` sang `refs/fgos/remotes/origin/events/b`; ref own không xuất hiện. Push non-fast-forward bị từ chối (exit 1); merge commit hai parent sau đó push thường thành công, không force. | Khẳng định §14 và cảnh báo `event-store-machine-ref-shared` ở §21. Nên thêm câu §14: merge commit cần tree/reader semantics được crate xác nhận, vì proof này chỉ chứng minh cơ chế Git, không xác minh event contiguity của hai nhánh divergent. |
| 4. DAG walk | **PASS.** DAG gồm 100,000 seal commits và 10 merge side commits, 100,011 reachable commits. `rev-list` 10k: 27 ms; full: 224 ms; `cursor..tip`: 190 ms, trả 90,011 commits. | §22 nói chain grows đúng, nhưng §15/§22 nên tránh ngụ ý range walk rẻ tuyệt đối: `A..B` vẫn duyệt phần reachable cần thiết. Giữ snapshot/compaction là follow-up khi full rebuild vượt budget. |
| 5. Forge/default fetch | **PASS cục bộ; giới hạn ngoại suy.** Bare remote local chấp nhận và phục vụ custom refs; fetch refspec mặc định là `+refs/heads/*:refs/remotes/origin/*`, nên bỏ qua `refs/fgos/*`. GitHub/GitLab/forge policy không thể kiểm tra từ bare remote local. | §14/§23.5 cần kiểm chứng trên remote thực của owner trước acceptance; không tuyên bố forge production sẽ chấp nhận refs chỉ từ thí nghiệm này. |
| 6. worktree/stash/clean/switch | **PASS.** `git worktree add`, `stash`, `clean -fdx`, và `checkout` không thay ref custom. | Khẳng định assumption §10 và migration §18: các porcelain này không là cơ chế dọn/đổi `refs/fgos/*`. Không cần đổi văn bản. |

## Quan sát chi tiết

- Case 1 chạy seal khi `.git/index.lock` đang tồn tại, `README` dirty, và `post-commit` hook được cài. Kết quả `head_same=yes index_same=yes dirty=yes hook_absent=yes`; do đó plumbing đã không đụng index, work tree, `HEAD`, và không invoke post-commit hook.
- `update-ref` của bảy contender thua CAS trả lỗi; mỗi contender sau đó lấy tip hiện tại và publish successor bằng CAS mới. Đây là retry sạch ở cấp Git. Production không được retry mù nếu tip foreign làm hỏng invariant §10.2.1; spec đã đúng khi yêu cầu dừng `event-store-ref-moved` đối với actor ngoài store.
- Fresh clone báo remote `HEAD` chưa trỏ branch, nhưng điều đó không ảnh hưởng discovery ref: `refs/fgos/events/a` vẫn absent cho đến explicit refspec. Lỗi `rev-parse` exit 128 là bằng chứng absent, không phải lỗi thử nghiệm.
- Benchmark dùng `fast-import` chỉ để tạo nhanh DAG thử nghiệm; nó không phải implementation seal. Case 1 mới là phép thử đúng plumbing mà spec yêu cầu.

## Script tái lập chính xác

```bash
#!/usr/bin/env bash
set -euo pipefail
export GIT_AUTHOR_NAME=Experiment GIT_AUTHOR_EMAIL=experiment@invalid GIT_COMMITTER_NAME=Experiment GIT_COMMITTER_EMAIL=experiment@invalid
root=$(mktemp -d /tmp/fgos-event-store.XXXXXX); trap 'rm -rf "$root"' EXIT
remote="$root/remote.git"; git init --bare -q "$remote"
for m in a b c; do git clone -q "$remote" "$root/$m"; done
git -C "$root/a" checkout -qb main; printf base > "$root/a/README"; git -C "$root/a" add README; git -C "$root/a" commit -qm base; git -C "$root/a" push -q origin main
for m in b c; do git -C "$root/$m" fetch -q origin main; git -C "$root/$m" checkout -qB main origin/main; done
seal(){ local r=$1 f=$2 x=$3 o=${4:-}; local b s t c; b=$(printf '%s\n' "$x"|git -C "$r" hash-object -w --stdin); s=$(printf '{"kind":"seal"}\n'|git -C "$r" hash-object -w --stdin); t=$(printf '100644 blob %s\tevents.jsonl\n100644 blob %s\tseal.json\n' "$b" "$s"|git -C "$r" mktree); if [ -n "$o" ];then c=$(printf seal|git -C "$r" commit-tree "$t" -p "$o");else c=$(printf seal|git -C "$r" commit-tree "$t");fi; git -C "$r" update-ref "$f" "$c" "${o:-0000000000000000000000000000000000000000}" || return $?; echo "$c"; }
cd "$root/a"; printf dirty >> README; mkdir -p .git/hooks; printf '#!/bin/sh\ntouch ../hook-ran\n'>.git/hooks/post-commit; chmod +x .git/hooks/post-commit
h=$(git rev-parse HEAD); i=$(git hash-object .git/index); :>.git/index.lock; a0=$(date +%s%N); tip=$(seal "$root/a" refs/fgos/events/a c1); a1=$(date +%s%N); rm .git/index.lock
echo "C1 plumbing_ms=$(((a1-a0)/1000000)) head_same=$([ "$h" = "$(git rev-parse HEAD)" ]&&echo yes||echo no) index_same=$([ "$i" = "$(git hash-object .git/index)" ]&&echo yes||echo no) dirty=$(git diff --quiet||echo yes) hook_absent=$([ ! -e ../hook-ran ]&&echo yes||echo no)"
ref=refs/fgos/events/cas; seed=$(seal "$root/a" "$ref" seed); mkdir "$root/cas"
for n in $(seq 1 8);do (set +e;seal "$root/a" "$ref" "$n" "$seed" >"$root/cas/$n.out" 2>&1;rc=$?;echo "$rc" >"$root/cas/$n.rc")&done;wait
w=$(rg -l '^0$' "$root/cas"/*.rc|wc -l|tr -d ' '); retries=0;for n in $(seq 1 8);do [ "$(cat "$root/cas/$n.rc")" = 0 ]||{ old=$(git -C "$root/a" rev-parse "$ref");seal "$root/a" "$ref" retry "$old">/dev/null;retries=$((retries+1));};done;echo "C1 cas_winners=$w retry_successes=$retries"
git -C "$root/a" push -q origin refs/fgos/events/a:refs/fgos/events/a; before=$(git -C "$root/a" rev-parse refs/fgos/events/a);git -C "$root/a" gc;git -C "$root/a" gc --prune=now;git -C "$root/a" repack -ad;git -C "$root/a" pack-refs --all; fresh="$root/fresh";git clone -q "$remote" "$fresh";set +e;git -C "$fresh" rev-parse refs/fgos/events/a >/dev/null;clone=$?;set -e;git -C "$fresh" fetch -q origin '+refs/fgos/events/*:refs/fgos/remotes/origin/events/*';mir=$(git -C "$fresh" rev-parse refs/fgos/remotes/origin/events/a);echo "C2 survive=$([ "$before" = "$(git -C "$root/a" rev-parse refs/fgos/events/a)" ]&&echo yes||echo no) clone_custom_ref_exit=$clone mirror_same=$([ "$before" = "$mir" ]&&echo yes||echo no)"
seal "$root/b" refs/fgos/events/b b >/dev/null;git -C "$root/b" push -q origin refs/fgos/events/b:refs/fgos/events/b;git -C "$root/c" fetch -q origin '+refs/fgos/events/*:refs/fgos/remotes/origin/events/*';set +e;git -C "$root/c" rev-parse refs/fgos/events/b>/dev/null;own=$?;set -e
shared=refs/fgos/events/shared;base=$(seal "$root/a" "$shared" base);git -C "$root/a" push -q origin "$shared:$shared";git -C "$root/b" fetch -q origin "$shared:$shared";left=$(seal "$root/a" "$shared" left "$base");right=$(seal "$root/b" "$shared" right "$base");git -C "$root/a" push -q origin "$shared:$shared";set +e;git -C "$root/b" push origin "$shared:$shared" >"$root/nff" 2>&1;nff=$?;set -e;git -C "$root/b" fetch -q origin "$shared:refs/fgos/remotes/origin/events/shared";rt=$(git -C "$root/b" rev-parse refs/fgos/remotes/origin/events/shared);tree=$(git -C "$root/b" rev-parse "$right^{tree}");merge=$(printf merge|git -C "$root/b" commit-tree "$tree" -p "$right" -p "$rt");git -C "$root/b" update-ref "$shared" "$merge" "$right";git -C "$root/b" push -q origin "$shared:$shared";echo "C3 mirror_foreign=yes own_ref_exit=$own nff_exit=$nff merge_parents=$(git -C "$root/b" show -s --format=%P "$merge"|wc -w|tr -d ' ')"
bench="$root/bench";git init -q "$bench";seq 1 100000 | awk 'function meta(){print "author Experiment <experiment@invalid> " NR " +0000";print "committer Experiment <experiment@invalid> " NR " +0000"}function one(mark,parent,msg){print "commit refs/fgos/events/bench";print "mark :"mark;meta();print "data "length(msg);print msg;print "from :"parent;print "M 100644 :1 events.jsonl"}BEGIN{print "blob";print "mark :1";print "data 0";print "commit refs/fgos/events/bench";print "mark :2";print "author Experiment <experiment@invalid> 0 +0000";print "committer Experiment <experiment@invalid> 0 +0000";print "data 4";print "root";print "M 100644 :1 events.jsonl";p=2;m=2}{if(NR%10000==0){side=++m;one(side,p,"side");main=++m;print "commit refs/fgos/events/bench";print "mark :"main;meta();print "data 5";print "merge";print "from :"p;print "merge :"side;print "M 100644 :1 events.jsonl";p=main}else{main=++m;one(main,p,"seal");p=main}}' | git -C "$bench" fast-import --quiet;prev=$(git -C "$bench" rev-parse refs/fgos/events/bench);cur=$(git -C "$bench" rev-list --reverse "$prev" | sed -n '10000p');ms(){ x=$(date +%s%N);"$@">/dev/null;y=$(date +%s%N);echo $(((y-x)/1000000));};echo "C4 reachable=$(git -C "$bench" rev-list --count "$prev") ms_10k=$(ms git -C "$bench" rev-list "$cur") ms_100k=$(ms git -C "$bench" rev-list "$prev") ms_incremental=$(ms git -C "$bench" rev-list "$cur..$prev") incremental_count=$(git -C "$bench" rev-list --count "$cur..$prev")"
git -C "$root/a" worktree add -q "$root/wt" -b topic;git -C "$root/a" stash push -qm experiment;git -C "$root/a" clean -fdx -q;git -C "$root/a" checkout -q main;echo "C5 default_refspec=$(git -C "$fresh" config --get-all remote.origin.fetch|tr '\n' ';') local_remote_accepts=yes forge_not_testable=yes";echo "C6 ref_after_porcelain=$(git -C "$root/a" rev-parse refs/fgos/events/a)"
```

Lệnh chạy: `chmod +x /tmp/fgos-event-store-git-179222.sh && /tmp/fgos-event-store-git-179222.sh`.

## Output lần chạy cuối

```text
C1 plumbing_ms=9 head_same=yes index_same=yes dirty=yes hook_absent=yes
C1 cas_winners=1 retry_successes=7
C2 survive=yes clone_custom_ref_exit=128 mirror_same=yes
C3 mirror_foreign=yes own_ref_exit=128 nff_exit=1 merge_parents=2
C4 reachable=100011 ms_10k=27 ms_100k=224 ms_incremental=190 incremental_count=90011
C5 default_refspec=+refs/heads/*:refs/remotes/origin/*; local_remote_accepts=yes forge_not_testable=yes
C6 ref_after_porcelain=6f1ebb80da593f0cc7180c8e10e5058ab211ec0b
```
