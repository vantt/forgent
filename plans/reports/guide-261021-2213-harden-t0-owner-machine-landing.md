# Hướng dẫn land HARDEN T0 trên máy owner

Phiên `forgent-a8` viết lúc 2026-10-21 22:20 (Asia/Saigon). Máy owner có ba workspace: mdview, mcp-skill-hub và forgentX. Land theo kiểu dừng toàn bộ, vào giờ owner chọn (quyết định 3a). Máy thứ hai đã land xong lúc 22:06, kết quả ở [báo cáo đóng T0](closing-261021-2213-harden-t0-process-facts-door.md).

## Land cái gì

- **Code:** main `7d1f1c1b2` (merge T0). Nên build từ main mới nhất có cả bản sửa `406a81f98` của lane GIT, vì release đang chạy ở máy thứ hai (`613dfa84…`) còn lỗi row doctor `git-land-recovery`.
- **Thay đổi khi chạy:**
  - mọi phán sống/chết, quan sát và gửi tín hiệu tới tiến trình đi qua cửa in-process trong addon gộp;
  - route `fgos internal process-observe` bị xoá;
  - row doctor `coordination-abandoned-claims` bị xoá;
  - `gateway.json` có thêm tuple danh tính. Entry cũ chỉ có pid được đọc là `IdentityUnknown` và không bao giờ bị kill: nếu `fgos gateway stop` báo `gateway-stop-identity-unknown` thì làm theo lời nhắn, xoá file đó sau khi tự kiểm pid;
  - bước attempt chạy với env trống giờ thoát mã 70 (cố ý từ chối an toàn).
- **Định dạng trên đĩa:** release cũ vẫn đọc được `gateway.json` mới (chỉ lấy `pid`, `port`). `activation.json` không đổi (OQ-3 (c)).

## Các bước (làm trong mdview, mcp-skill-hub và forgentX, trừ khi ghi khác)

1. **Pull và đọc board:** `/usr/bin/git pull` ở forgentX; đọc các dòng `forgent-a8` mới nhất trong `plans/261017-1313-fgos-platform-program-board/log.md`.
2. **Dừng toàn bộ.** Không còn `fgos run`/`fgos session`/lead nào đang chạy. Kiểm bằng `ps` các tiến trình `fgos`, `fgctl`, `fgos-gateway` và các fd mở dưới `.fgos` của từng workspace và dưới `~/.local/state/fgos`. Nếu có gateway thì `fgos gateway stop </dev/null`.
3. **Dọn bằng release cũ:** `fgos doctor --fix </dev/null` trong từng workspace; `lock-holders` phải 0 held, `run-attempts-stuck` không còn attempt kẹt.
4. **Sao lưu** vào `.fgos/runtime/landing-t0/` của từng workspace:
   - `distribution.json`;
   - fetch refspecs (`git config --get-all remote.origin.fetch`);
   - hash của `.fgos/config.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`;
   - `~/.fgos/config.json` (mode 600);
   - `fgctl.prev` (bản `fgctl` đang dùng).
5. **Build trong một worktree tách riêng tại main**, `CARGO_TARGET_DIR` riêng trên ext4, không đặt trên `/tmp`:
   - `cargo build --locked --release --workspace`;
   - `node scripts/build-rust-distribution.mjs --repo-root <wt> --out <staged>`;
   - `cargo install --locked --path <wt>/apps/fgctl --root ~/.local`.
6. **Kiểm byte canonical JSON trên dữ liệu thật — bắt buộc, trước khi activate.** T0 chuyển `proof-helpers` và `reconciliation-planner` sang canonical JSON của crate Rust. Ở máy thứ hai đã kiểm 12 865 tài liệu, 0 chỗ lệch. Máy owner có dữ liệu riêng, nên phải kiểm lại. Chép script ở cuối hướng dẫn này vào `<wt>/.fgos/runtime/tmp/canonical-corpus.mjs`, rồi trong `<wt>`:
   ```bash
   env -u CLAUDE_CODE_SESSION_ID CARGO_TARGET_DIR=<target> node --input-type=module -e "
   import fs from 'node:fs'; const m=await import('./scripts/lib/git-addon-stage.mjs'); const e={...process.env}; m.ensureGitAddon(e, process.cwd());
   fs.writeFileSync('/tmp/t0-corpus.env', Object.entries(e).filter(([k,v])=>process.env[k]!==v).map(([k,v])=>k+'='+v).join('\n')+'\n')"
   env $(cat /tmp/t0-corpus.env) node .fgos/runtime/tmp/canonical-corpus.mjs \
     ~/projects/forgentX/.fgos ~/projects/mdview/.fgos ~/projects/mcp-skill-hub/.fgos
   ```
   Kết quả phải là `canonical-corpus: all equal`. **Có `MISMATCHES` thì dừng, không activate,** và báo `forgent-a8` danh sách `bad`.
7. **Kích hoạt** lần lượt mdview, mcp-skill-hub rồi forgentX, liền nhau. Mỗi workspace:
   - `fgctl stage --from <staged>`;
   - `fgctl upgrade --from <staged>`;
   - chép lại `distribution.json` từ bản sao lưu;
   - kiểm hash không đổi;
   - `fgctl verify`.
8. **`fgos doctor --fix </dev/null`** với release mới, trong cả ba workspace.
9. **`fgos setup </dev/null`:** `configAddedKeys` và `globalConfigAddedKeys` phải rỗng, refspecs không đổi, `git fetch` chạy được.
10. **Doctor qua shim:**
    - `process-containment`, mọi row `git-*`, `lock-*`, `terminal-*`, `run-supervisor-route`, `state-root` đều đạt;
    - không còn row `coordination-abandoned-claims`;
    - `git-land-recovery` đạt nếu build từ main có `406a81f98`.
11. **Smoke ở forgentX:**
    - (a) `fgos gateway start`, `status`, `stop`;
    - (b) `fgos lock fence gateway --yes` trên lock rảnh phải báo `free` và không kill gì;
    - (c) một `fgos run` chỉ đọc (ví dụ "Reply with exactly the word OK"), outcome `pass`;
    - (d) một `fgos run` có ghi trong worktree tạm, commit qua ScopedCommit, pane tự đóng.
12. **Ghi lại:** một báo cáo landing (tên lấy từ `fgos convention path --kind report --type landing …`) và một dòng trên đầu `log.md` của board.

## Rollback

Dừng toàn bộ. Trong từng workspace:
1. `fgctl upgrade --from ~/.local/state/fgos/releases/<artifactDigest cũ>` (lấy ở `previousArtifactDigest` trong `.fgos/installation/activation.json`);
2. chép lại `distribution.json` và `~/.fgos/config.json` từ bản sao lưu;
3. `cp fgctl.prev ~/.local/bin/fgctl`.

Gateway do release mới khởi động phải được `fgos gateway stop` trước. Revert merge `7d1f1c1b2` trên main chỉ làm được trước khi T1 merge; sau đó thì sửa tiến.

## Script kiểm byte (`canonical-corpus.mjs`)

Lấy nguyên văn từ báo cáo lead phase 5 (`plans/reports/phase-lead-261021-2012-harden-t0-p05-durable-canonical.md` trên nhánh `harden/t0-process-facts-door`). Script tự chứa ba bản canonical cũ để so với crate, nên chạy được trên main mới (các bản đó đã bị xoá khỏi `src`).

```js
// Byte-equality of the three Node canonical twins against the door over a persisted JSON corpus.
// usage: node canonical-corpus.mjs <root> [<root>...]  (env prepared by ensureGitAddon)
import fs from 'node:fs';
import path from 'node:path';
import { canonicalJson } from '../../../src/native/door.mjs';
const proofTwin = (value) => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map((e) => proofTwin(e)).join(',') + ']';
  return '{' + Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => JSON.stringify(k) + ':' + proofTwin(value[k])).join(',') + '}';
};
const plainTwin = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(plainTwin).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${plainTwin(v[k])}`).join(',')}}`) : JSON.stringify(v);
const twins = { 'proof-helpers': proofTwin, 'recovery-planner': plainTwin, 'reconciliation-planner': plainTwin };
const stats = { files: 0, docs: 0, subtrees: 0, mismatches: 0, skipped: 0 };
const bad = [];
function check(value, file, depth) {
  if (value === null || typeof value !== 'object') return;
  stats.subtrees += 1;
  const door = canonicalJson(value);
  for (const [name, twin] of Object.entries(twins)) {
    if (twin(value) !== door) { stats.mismatches += 1; if (bad.length < 10) bad.push(`${name} ${file}`); }
  }
  if (depth < 3) for (const v of Array.isArray(value) ? value : Object.values(value)) check(v, file, depth + 1);
}
function docs(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.jsonl')) return text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return undefined; } });
  try { return [JSON.parse(text)]; } catch { return []; }
}
function walk(dir) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!e.isFile() || !/\.jsonl?$/.test(e.name)) continue;
    if (fs.statSync(full).size > 8 * 1024 * 1024) { stats.skipped += 1; continue; }
    stats.files += 1;
    for (const d of docs(full)) { if (d === undefined) continue; stats.docs += 1; check(d, full, 0); }
  }
}
for (const root of process.argv.slice(2)) walk(root);
console.log(JSON.stringify({ ...stats, bad }));
console.log(stats.mismatches === 0 ? 'canonical-corpus: all equal' : 'canonical-corpus: MISMATCHES');
```
