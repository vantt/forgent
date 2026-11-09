# Hướng dẫn cho máy owner và fg-server: điểm đọc census trước khi merge các lát xoá của T2 phase 08

Việc cần làm: chạy hai lệnh chỉ đọc bên dưới trên máy owner và trên fg-server, rồi dán kết quả cho HARDEN. Cả hai lệnh không ghi gì, không cần pull, không cần build; chỉ cần `node` và `find` (mỗi lệnh chạy khoảng 30 giây đến 1 phút). Plan: [`plan.md`](../261023-0415-harden-t2-git-terminal-control/plan.md) mục D-T2-8; phase: [`phase-08-census-gated-deletes.md`](../261023-0415-harden-t2-git-terminal-control/phase-08-census-gated-deletes.md).

## Vì sao cần

Nhánh `harden/t2-p08-census-slices` xoá hai thứ fgOS đã ngừng ghi nhưng còn đọc được:

- Lát A: chuỗi ScopedCommit/Sync cũ chỉ mang resource `worktree:<đường dẫn>` (không có `:custody:`). Chỉ release dựng trước `869e789d7` (2026-10-19 18:15 +07) mới ghi dạng này.
- Lát C: biên nhận nén (compacted ledger) phiên bản 1. Không code hiện tại nào ghi dạng này.

Nếu một repo thật còn chuỗi như vậy, xoá phần đọc sẽ làm chuỗi đó bị từ chối thay vì phát lại. Hai lát này là merge riêng, nhánh vẫn chưa merge. Chỉ merge khi cả máy owner lẫn fg-server đều đọc ra 0 (fg-server2 đã đọc, xem cuối).

## Lệnh 1: đếm WAL cũ (chạy ở thư mục nào cũng được)

Dán nguyên khối:

```sh
node -e '
const fs=require("fs"),path=require("path"),cp=require("child_process");
const roots=cp.execFileSync("find",[process.env.HOME,"-xdev","-type","d","-path","*/fgos/git/operations","-prune"],{encoding:"utf8",maxBuffer:1<<26}).split("\n").filter(Boolean);
const kindOf=k=>typeof k==="string"?k:Object.keys(k??{})[0];
const keys=["legacyScopedOrSync","ledgerV1","unreadable","emptyOperationDir"];const tot={wals:0};for(const k of keys)tot[k]=0;
for(const ops of roots){const git=path.dirname(ops);const o={wal:git};for(const k of keys)o[k]=0;tot.wals++;
 for(const id of fs.readdirSync(ops)){const d=path.join(ops,id);let r;try{r=JSON.parse(fs.readFileSync(path.join(d,"00000000.json"),"utf8"))}catch{try{if(fs.readdirSync(d).length===0){o.emptyOperationDir++;continue}}catch{}o.unreadable++;console.log("UNREADABLE",d);continue}
  const i=r.phase&&r.phase.data||{};const k=kindOf(i.kind);const rs=i.resourceSet||[];
  if((k==="ScopedCommit"||k==="Sync")&&rs.length===1&&/^worktree:/.test(rs[0])&&!rs[0].includes(":custody:"))o.legacyScopedOrSync++;
}
 const c=path.join(git,"compacted");for(const f of fs.existsSync(c)?fs.readdirSync(c):[]){if(f.startsWith("."))continue;const p=path.join(c,f);let x;try{x=JSON.parse(fs.readFileSync(p,"utf8"))}catch{o.unreadable++;console.log("UNREADABLE",p);continue}
  if(x.v===1)o.ledgerV1++;}
 for(const k of keys)tot[k]+=o[k]; if(keys.some(k=>o[k])) console.log(JSON.stringify(o));}
console.log("TOTAL",JSON.stringify(tot));' </dev/null
```

### Kết quả "bằng 0" trông thế nào

Dòng cuối là `TOTAL {...}`. Đạt khi:

```
TOTAL {"wals":<N>,"legacyScopedOrSync":0,"ledgerV1":0,"unreadable":0,"emptyOperationDir":<bất kỳ>}
```

- `legacyScopedOrSync` phải là 0 (chặn lát A) và `ledgerV1` phải là 0 (chặn lát C).
- `unreadable` phải là 0. Nếu khác 0, lệnh in thêm dòng `UNREADABLE <đường dẫn>`; dán các dòng đó.
- `emptyOperationDir` không chặn: đó là thư mục thao tác rỗng (một lần chạy chết trước khi ghi bản ghi đầu), không mang loại chuỗi nào.
- Trước dòng `TOTAL` có thể có từng dòng JSON cho mỗi WAL có số khác 0. Với mỗi dòng như vậy, ghi WAL đó là thư mục scratch (benchmark, fixture dưới `.fgos/runtime/tmp/`, `~/.cache/`, `forgent-worktrees/<lane>/`) hay dự án thật. Dòng scratch không chặn; dòng thật chặn.

## Lệnh 2: release đang kích hoạt trong từng workspace

```sh
find "$HOME" -xdev -path '*/.fgos/installation/activation.json' -type f 2>/dev/null | while read -r f; do node -e 'const a=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));if(a.activatedAt)console.log(a.activatedAt,process.argv[1].replace(/\/\.fgos\/installation\/activation\.json$/,""))' "$f" </dev/null 2>/dev/null; done | sort | head -40
```

Mỗi dòng là `<thời điểm kích hoạt> <workspace>`. Đạt khi mọi dòng có thời điểm sau `2026-10-19T11:15:00Z`. Một dòng sớm hơn nghĩa là workspace đó có thể còn chạy release trước `869e789d7` và chặn lát A. Dòng không có thời điểm (fixture) không được in.

## Dán lại cho HARDEN

1. Tên máy (owner hay fg-server) và ngày giờ chạy.
2. Dòng `TOTAL` của lệnh 1 và mọi dòng `UNREADABLE` hoặc JSON từng WAL (kèm nhãn scratch/thật).
3. Toàn bộ đầu ra của lệnh 2.
4. Tên mọi repo nằm trên ổ hoặc mount khác `$HOME` mà fgOS chạy trên đó (`find -xdev` không thấy). Nếu có, chạy lại lệnh 1 với `$HOME` thay bằng thư mục đó, rồi dán.

## Sau đó

HARDEN rebase lại nhánh trên main hiện tại và merge hai lát thành một merge commit riêng khi cả hai máy đọc 0. Nếu có dòng chặn, lát tương ứng bị bỏ và ghi "giữ vì bằng chứng"; không ảnh hưởng phần còn lại của T2.

## Điểm đọc trên fg-server2 (2026-11-09, đã chạy bởi HARDEN)

- Lệnh 1: `TOTAL {"wals":190,"legacyScopedOrSync":0,"ledgerV1":0,"unreadable":0,"emptyOperationDir":1}`. Thư mục rỗng là `event-store-cutover-9f371889a9167ffe482a6a0799f7d26f-1` trong WAL của checkout chính (rỗng từ 2026-10-24). Bản lệnh trong phase 08 gốc đếm nó là `unreadable:1`; lệnh trên tách nó ra.
- Lệnh 2: một workspace, `/home/vantt/projects/forgent`, kích hoạt 2026-11-08T23:49:29Z.
