# Hướng dẫn land HARDEN T2 trên máy owner

Phiên `lead:HARDEN` viết lúc 2026-10-23 22:28 (Asia/Saigon). Máy owner `design-lap` có ba workspace: forgentX, mdview và mcp-skill-hub. Land theo kiểu dừng toàn bộ, vào giờ owner chọn, và **cần owner nói "go" trước khi activate** trên `design-lap`. Máy thứ hai (`fg-server2`) đã land lúc 22:09; kết quả ở [báo cáo landing](landing-261023-2228-harden-t2-git-terminal-control-this-machine.md) và [báo cáo đóng T2](closing-261023-2228-harden-t2-git-terminal-control.md).

Lead của `fg-server` dùng cùng hướng dẫn này với một workspace (`~/projects/forgent`) và chỉ cần quyền của chính máy đó. Mẫu của hướng dẫn: [hướng dẫn T1](guide-261022-2003-harden-t1-owner-machine-landing.md).

## Land cái gì

- **Code:** main `084da2df7` hoặc mới hơn. T2 là merge `a01f725bf`.
- **Build từ main hiện tại mang theo mọi thứ lên main sau release đang chạy.**
  - Dòng board cuối cùng ghi cho `design-lap`: release `447cb9a4…` từ main `e604ec15f`. Đọc `artifactDigest` thật ở `.fgos/installation/activation.json` của từng workspace trước khi tin dòng này.
  - Từ `e604ec15f` đến `084da2df7` có ≈ 295 commit. Danh sách đầy đủ: `git log --merges e604ec15f..084da2df7`. Những thứ làm đổi việc phải làm tay:
    - **IDENT:** mỗi máy có một khoá ký (`fgos doctor --fix` tạo, không bao giờ thay), thêm ba hàng doctor `identity-machine-key`, `identity-ssh-keygen`, `identity-pinned-machines`; `PI_SESSION_ID` thành writer id; `fgos identity resolve` nhận id phiên đầy đủ. Mỗi máy cần ghi một dòng `IDENT key` lên board (bước 11).
    - **CFG:** mọi lần đọc YAML của Node đi qua addon, không còn js-yaml. Chạy `node bin/fgos.mjs` thẳng từ checkout chưa stage addon sẽ báo lỗi có tên khi đọc YAML (kênh này vốn không được hỗ trợ).
    - **HARDEN T2:** xem bên dưới.
- **Thay đổi khi chạy của T2** (đủ để người land biết điều gì sẽ khác; chi tiết ở `CHANGELOG.md` mục `[Unreleased]`):
  - Origin dạng scp (`git@github.com:org/repo.git`) và `ssh://user@host/...` dùng được cho `fgos identity mint`, cổng Remote và Event Store.
  - `fgos doctor` có 6 hàng Git và 2 hàng terminal (trước đây 10 và 3). Không còn hàng check `git-transport-config`, `git-trust-topology`, `git-durability-capability`, `git-publication-refspecs`, `git-land-recovery`, `terminal-config`; bốn fix Git (`git-driver-directories`, `git-wal-dir`, `git-land-recovery`, `git-publication-refspecs`) vẫn còn.
  - `fgos doctor` không còn đóng pane terminal quá hạn giữ lại; nó báo kèm id pane để người đóng.
  - Giới hạn layout dưới sàn đo được (`terminal.layout.minCols` < 40 hoặc `minRows` < 8) bị lõi terminal từ chối bằng tên `terminal-config-below-floor` thay vì chạy.
  - Chính sách xếp pane mặc định là `even-split` (ba pane thành ba cột nếu terminal đủ rộng); `measured-split` vẫn chọn được. Nhãn tab và pane đọc được hơn.
  - `/fgOS:terminal` và `/fgOS:terminal-close` không còn script `pane-owned.sh`; việc kiểm quyền sở hữu pane nằm trong `attach`.
- **Định dạng trên đĩa:** release trước đọc được mọi thứ T2 để lại. T2 không nén chain Worktree hay Refs, nên không có ledger mới. File gợi ý nhóm terminal không còn được ghi (release cũ ghi và không bao giờ đọc). Event Store pin dạng `ssh://[redacted]@host/…` cần chạy `fgos setup` một lần (bước 9).

## Điều kiện trước khi land

1. **Không kéo checkout trước khi activate.** Config dự án của forgentX trên main đã là `terminal.layout.policy` `even-split`, còn release cũ chỉ đăng ký `measured-split` và từ chối giá trị lạ. Kéo trước thì release cũ từ chối cấu hình terminal. Vì vậy hướng dẫn này chỉ `git fetch` ở bước 1 và kéo ở bước 7.
2. **Release hiện tại phải đạt** (làm ở từng workspace, bước 3): `fgos doctor --fix </dev/null`, rồi `fgos doctor --json </dev/null`.
   - Hàng `terminal-config` phải đạt. Một giá trị dưới sàn 40×8 sau T2 là từ chối lúc chạy, nên sửa trước khi activate.
   - Hàng `git-operation-journal` phải đạt (không có thao tác Git đang treo).
   - Ghi lại mọi hàng đang đỏ để so ở bước 10.
3. **Census D8** (bước 3, chạy một lần cho cả máy). Đọc phần "Census" bên dưới.

## Các bước (làm trong mdview, mcp-skill-hub và forgentX, trừ khi ghi khác)

1. **Fetch và đọc board, không kéo checkout.** Ở forgentX:
   - `/usr/bin/git fetch`;
   - `git log origin/main -5 --format='%h %s'`;
   - `git show origin/main:plans/261017-1313-fgos-platform-program-board/log.md | head -60`, rồi đọc các dòng `lead:HARDEN` mới nhất (đừng đọc cả file).
2. **Dừng toàn bộ.**
   - Không còn `fgos run`, `fgos session` hay lead nào đang chạy.
   - Kiểm bằng `ps` các tiến trình `fgos`, `fgctl`, `fgos-gateway`, và các fd đang mở dưới `.fgos` của từng workspace và dưới `~/.local/state/fgos`.
   - Có gateway thì `fgos gateway stop </dev/null`.
   - **Chỉ dừng tiến trình của chính mình.** Phiên khác (SEAT, MAIL, DOC…) đang chạy thì nhắn họ qua board, đừng kill.
3. **Điều kiện trước khi land** (release cũ, từng workspace) và **census** (một lần cho cả máy). Làm như hai mục trên và mục "Census". Lưu `fgos doctor --json </dev/null` vào `doctor-before.json` trong thư mục sao lưu của bước 4 (tạo thư mục trước).
4. **Sao lưu** vào `.fgos/runtime/tmp/landing-harden-t2/` của từng workspace. Dùng `cp -p` để giữ mode:
   - `.fgos/distribution.json`;
   - `.fgos/config.json`;
   - `.fgos/installation/activation.json`;
   - fetch refspecs: `git config --get-all remote.origin.fetch`;
   - hash của `AGENTS.md`, `CLAUDE.md` và `.claude/settings.json` (`sha256sum`);
   - `~/.fgos/config.json` (mode 600; sao một lần, không cần mỗi workspace);
   - `~/.local/bin/fgctl` thành `fgctl.prev` (một lần).
5. **Build** trong một worktree tách riêng tại `origin/main` (`git worktree add --detach <wt> origin/main` từ forgentX).
   - Dùng `CARGO_TARGET_DIR` riêng trên ext4, **không đặt trên `/tmp`**, **không dùng chung với checkout khác**, và không tái dùng target của lần build khác.
   - Lệnh:
     - `cargo build --locked --release --workspace`;
     - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <staged>` (`<staged>` là thư mục mới, rỗng; script từ chối thư mục có sẵn nội dung);
     - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.
   - Ghi `git -C <wt> rev-parse HEAD`: đó là main commit nguồn của release, cần cho báo cáo.
6. **Kích hoạt** lần lượt mdview, mcp-skill-hub rồi forgentX, liền nhau. Ở mỗi workspace:
   1. `fgctl stage --from <staged>`;
   2. `fgctl upgrade --from <staged>`. Nếu bị từ chối với `git-predecessor-writer-live` thì có lệnh git của phiên khác đang chạy: thử lại mỗi 30 giây (ở `fg-server` qua ở lần thứ ba);
   3. chép lại `distribution.json` từ bản sao lưu;
   4. kiểm hash `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` không đổi;
   5. `fgctl verify`.
7. **Kéo checkout forgentX:** `/usr/bin/git pull --ff-only`. Giờ checkout bằng source của release nên hàng `active-release-matches-checkout` có nghĩa. Nếu pull báo xung đột với file chưa commit thì dừng và hỏi; không stash hay reset bừa.
8. **`fgos doctor --fix </dev/null`** với release mới, ở từng workspace. Hàng `identity-machine-key` sẽ tạo khoá máy ở lần này.
9. **`fgos setup --json </dev/null`** ở từng workspace.
   - `refspecs` phải không đổi so với bản sao lưu.
   - `configAddedKeys` và `globalConfigAddedKeys`: trên `fg-server2` hai danh sách đều rỗng. Máy owner đang ở release cũ hơn; nếu danh sách không rỗng thì dán lên board kèm nguồn (lane nào thêm khoá), đó không phải lý do rollback.
   - **Origin `ssh://user@host/…`:** nếu hàng doctor của Event Store báo `remote URL changed; rerun setup` (chỉ xảy ra với origin ssh có tên user), lần `fgos setup` này đã ghi lại pin. Chạy lại doctor để xác nhận. Kiểm origin bằng `git remote get-url origin`.
10. **Chính sách layout `measured-split` → `even-split`.** Làm **sau** bước 6, vì release cũ không đăng ký `even-split` và sẽ từ chối. Release mới giữ `measured-split` chạy bình thường nên không vội, nhưng đây là giá trị chuẩn cũ mà `fgos setup` từng ghi, không phải lựa chọn của người dùng (quyết định owner 26–27). Config chứa mọi khoá với giá trị chuẩn; `setup` không tự đổi giá trị đã ghi.
    - Đã sao lưu `~/.fgos/config.json` ở bước 4. Sửa mọi file sau chỉ khi nó đang giữ `measured-split`: `~/.fgos/config.json` và `.fgos/config.json` của mỗi workspace. forgentX đã nhận giá trị mới qua bước 7; script bỏ qua file đã đúng.

      ```sh
      node -e '
      const fs=require("fs");
      for (const f of process.argv.slice(1)) {
        if (!fs.existsSync(f)) { console.log("absent  ", f); continue; }
        const text=fs.readFileSync(f,"utf8");
        const policy=JSON.parse(text)?.terminal?.layout?.policy;
        if (policy!=="measured-split") { console.log("keep    ", f, JSON.stringify(policy)); continue; }
        const needle="\"policy\": \"measured-split\"";
        if (text.split(needle).length!==2) { console.log("MANUAL  ", f, "(not exactly one match, edit by hand)"); continue; }
        fs.writeFileSync(f, text.replace(needle, "\"policy\": \"even-split\""));
        console.log("changed ", f);
      }' ~/.fgos/config.json <forgentX>/.fgos/config.json <mdview>/.fgos/config.json <mcp-skill-hub>/.fgos/config.json </dev/null
      ```
    - Script chỉ ghi khi giá trị phân tích được là `measured-split` và dòng khớp đúng một lần; mode file được giữ. Dòng `MANUAL` thì sửa tay đúng giá trị `terminal.layout.policy`, không đụng khoá khác.
11. **Doctor** (`fgos doctor --json </dev/null`, từng workspace), so với `doctor-before.json`:
    - **Phải có:** đúng 6 hàng Git (`git-worktree-recovery`, `git-component-compatible`, `git-repository-config`, `git-operation-journal`, `git-native-locks`, `git-mutation-one-door`) và 2 hàng terminal (`terminal-control`, `terminal-allocations`); các hàng `identity-machine-key`, `identity-ssh-keygen` (cần OpenSSH `ssh-keygen`), `identity-pinned-machines` đạt; `terminal-control` đạt với `even-split`.
    - **Không còn** các hàng check đã gộp (xem "Land cái gì").
    - `git-mutation-one-door` sẽ **đỏ** với 5 chỗ `unresolved-binary`. Đây là lỗi của commit CFG `03c99bc61` trên main, không phải của T2; đã báo CFG.
    - `git-operation-journal` **đạt kèm cảnh báo** nếu có hơn 64 thao tác Git đã xong còn giữ hoặc cũ hơn 7 ngày (trên `fg-server2`: 385 thao tác, 2 578 KiB, cũ nhất 4,6 ngày). Cảnh báo này đúng như thiết kế, không phải lý do rollback.
    - Không được có hàng đỏ mới ngoài `git-mutation-one-door` so với `doctor-before.json`.
    - Ở forgentX, `active-release-matches-checkout` phải đạt.
12. **Smoke ở forgentX:**
    1. `fgos gateway start`, `status`, rồi `stop`.
    2. `fgos dispatch decide --for t2-smoke --needs-soul --has-live-task-access </dev/null`: mechanism `in-process`.
    3. `fgos identity --json </dev/null` trả về `source`; `fgos identity mint work --json </dev/null` ra một id thật (không cần mạng; bỏ id đó không dùng).
    4. Một `fgos run` chỉ đọc, outcome `completed`; một `fgos run --writes …` trong worktree tạm, commit qua ScopedCommit.
    5. `fgos worktree create <path> --detach` rồi `fgos worktree remove <path> --delivered-to refs/heads/main`: trên `fg-server2` mất 3,1 s và 1,2 s, và không còn registration treo (`git worktree list --porcelain` không có `prunable`).
    6. Một `git commit` thật trong main checkout của forgentX: hook pre-commit phải cho qua.
    7. **Tuỳ chọn, chưa làm trên `fg-server2`:** nếu có herdr, một lần chạy ba pane cho một nhóm trên màn rộng: mong đợi ba cột. Báo kết quả (hoặc ảnh chụp) lên board; đây là kiểm chứng sống duy nhất của layout mới.
13. **Ghi lại:**
    - một dòng `IDENT key — design-lap: <keyFingerprint>` lên đầu `log.md` của board; lấy `keyFingerprint` từ `fgos identity machine --json </dev/null`;
    - một dòng `log.md` cho lần land: các `artifactDigest` mới, main commit nguồn (bước 5), dòng `TOTAL` của census, kết quả doctor (số hàng, hàng đỏ);
    - một báo cáo landing, đặt tên bằng `fgos convention path --kind report --type landing --slug harden-t2-owner-machine </dev/null`.

## Census

Lệnh dưới đây chỉ đọc. Nó quét mọi thư mục `fgos/git/operations` dưới `$HOME` (`-xdev`) và đếm ba loại chain mà các nhánh xoá drain sẽ bỏ. Chạy **một lần trước khi activate** (bước 3), cả với release cũ lẫn mới đều như nhau. Sao chép nguyên văn:

```sh
node -e '
const fs=require("fs"),path=require("path"),cp=require("child_process");
const roots=cp.execFileSync("find",[process.env.HOME,"-xdev","-type","d","-path","*/fgos/git/operations","-prune"],{encoding:"utf8",maxBuffer:1<<26}).split("\n").filter(Boolean);
const kindOf=k=>typeof k==="string"?k:Object.keys(k??{})[0];
const keys=["legacyScopedOrSync","ledgerV1","unreadable"];const tot={wals:0};for(const k of keys)tot[k]=0;
for(const ops of roots){const git=path.dirname(ops);const o={wal:git};for(const k of keys)o[k]=0;tot.wals++;
 for(const id of fs.readdirSync(ops)){let r;try{r=JSON.parse(fs.readFileSync(path.join(ops,id,"00000000.json"),"utf8"))}catch{o.unreadable++;continue}
  const i=r.phase&&r.phase.data||{};const k=kindOf(i.kind);const rs=i.resourceSet||[];
  if((k==="ScopedCommit"||k==="Sync")&&rs.length===1&&/^worktree:/.test(rs[0])&&!rs[0].includes(":custody:"))o.legacyScopedOrSync++;
}
 const c=path.join(git,"compacted");for(const f of fs.existsSync(c)?fs.readdirSync(c):[]){if(f.startsWith("."))continue;const p=path.join(c,f);let x;try{x=JSON.parse(fs.readFileSync(p,"utf8"))}catch{o.unreadable++;continue}
  if(x.v===1)o.ledgerV1++;}
 for(const k of keys)tot[k]+=o[k]; if(keys.some(k=>o[k])) console.log(JSON.stringify(o));}
console.log("TOTAL",JSON.stringify(tot));' </dev/null
```

Cách đọc kết quả:

- Lệnh in một dòng cho mỗi WAL có số khác 0, rồi một dòng `TOTAL`. Đánh dấu từng WAL được in là **scratch** (benchmark hay fixture dưới `.fgos/runtime/tmp/`, `~/.cache/`, `tmp/` của một job agent, hoặc gốc bench của `forgent-worktrees/<lane>/`; không release nào chạy ở đó) hoặc **real** (một dự án fgOS đang vận hành).
- **Dán dòng `TOTAL` và danh sách WAL (kèm scratch/real) lên board**, trong dòng `log.md` của bước 13. Ghi thêm `artifactDigest` đang chạy của từng workspace cùng main commit nguồn của nó; mỗi release đó phải được build sau `869e789d7` (kiểm `git merge-base --is-ancestor 869e789d7 <main commit nguồn>` trả về 0), vì một release cũ hơn có thể ghi lại chain dạng cũ. Dự án fgOS nằm trên mount khác `$HOME` thì owner nêu tên để chạy riêng, vì `-xdev` không thấy chúng.
- **Census này không chặn lần land.** Nhánh `harden/t2-p08-census-slices` (xoá các chấp nhận `worktree:{root}` cũ và nhánh ledger v1) **chưa được merge** vào release này. Số liệu của máy owner là điều kiện để HARDEN quyết định merge nhánh đó: cả hai dòng `TOTAL` của `fg-server` và `design-lap` phải đọc 0 cho `legacyScopedOrSync`, `ledgerV1` và `unreadable`, và không workspace nào chạy release build trước `869e789d7`. Một WAL **real** có số khác 0 thì báo `lead:HARDEN` trước khi land: nhánh đó sẽ không được merge, và release này vẫn land bình thường. `unreadable` khác 0 trên một WAL real có thể là chain hỏng, báo kèm đường dẫn.
- Trên `fg-server2` lần chạy ở phase 8 đọc 0 ở mọi mục (155 WAL); các ghi chép không cho thấy nó được chạy lại lúc land.

## Rollback

Dừng toàn bộ, rồi trong từng workspace:

1. `fgctl upgrade --from ~/.local/state/fgos/releases/<artifactDigest cũ>`. Digest cũ lấy ở `previousArtifactDigest` trong `.fgos/installation/activation.json`, hoặc ở bản sao `activation.json` trong thư mục sao lưu.
2. Chép lại `distribution.json`, `.fgos/config.json` và `~/.fgos/config.json` từ bản sao lưu. **Bước chép `~/.fgos/config.json` và `.fgos/config.json` là bắt buộc nếu bạn đã làm bước 10:** release cũ chỉ đăng ký `measured-split` nên từ chối `even-split`. Riêng forgentX, `.fgos/config.json` là file có theo dõi trong git; sau khi rollback release thì phục hồi nó từ bản sao lưu, không dùng `git checkout` (HEAD đã là `even-split`, mà release cũ từ chối).
3. `cp fgctl.prev ~/.local/bin/fgctl`.

Release cũ đọc được mọi định dạng mà T2 để lại trên đĩa. Event Store pin ghi lại với tên user ssh (`ssh://user@host/…`) sẽ báo `remote URL changed; rerun setup` dưới release cũ: chạy `fgos setup` ở đó. Việc này chỉ liên quan origin ssh có tên user.

Trên main, `git revert -m 1 a01f725bf` chỉ dùng khi không lane nào build thêm trên nó; hỏi `lead:HARDEN` trước. Quá đó thì sửa tiến.
