# Báo cáo refutation experiment 2: seal-first

## Verdict theo scenario

**(a) PASS.** Hai linked worktree trên hai branch, mỗi branch seal ba shard, merge vào main theo cả thứ tự `a → b` và `b → a` đều có 0 conflict. Replay nhận đúng 6/6 event. Khi common ancestor đã có một sealed shard, cả hai thứ tự merge ba-way vẫn có 0 conflict và replay đúng 7/7 event. Đây là kết quả cấu trúc add-only: mỗi branch chỉ thêm pathname content-addressed mới, không sửa một pathname chung.

**(b) PASS trên môi trường đã đo.** Tôi chạy 20 lần cho từng boundary `temp-write`, `fsync`, `rename`, `git-add`, và `commit`: tổng cộng 100 lần SIGKILL, 100/100 recovery thành công, không mất và không nhân đôi event, và `git status --porcelain` sạch sau recovery. Temp còn sót không phải truth và bị recovery loại bỏ; OPEN vẫn nguyên vẹn cho tới sau commit nên fresh process có thể re-seal. Content-address làm re-seal idempotent. Nếu sealed file hoặc commit đã tồn tại, recovery chỉ hoàn tất bước còn thiếu. Truncation chỉ cắt đúng byte-prefix đã snapshot; nếu prefix không khớp thì dừng thay vì truncate mù.

**(c) PASS với serialization theo `writerId`.** Tôi chạy 20 race thật giữa hai process. Harness chờ thấy sealer đã giữ lock rồi mới khởi động writer. Cả 20/20 lần replay đúng hai event, không mất và không duplicate. Kết quả không chứng minh lock-free append: protocol đã pass vì writer và sealer của cùng `writerId` dùng cùng lock. Writer chờ seal commit và truncate xong rồi append vào OPEN mới.

**(d) PASS.** Cùng một event được seal ở hai worktree tạo cùng shard bytes và cùng pathname content-addressed. Hai branch merge không conflict; replay dedupe bằng event `h` và trả đúng một event.

**(e) PASS, với điều kiện store là monotonic append-only.** Xóa sealed shard trên một feature branch không cần cho write/seal/replay: correction phải là event mới, không rewrite history; retention/compaction phải xuất snapshot hoặc manifest mới rồi làm GC ở một maintenance boundary riêng sau khi chứng minh mọi reader không còn cần shard cũ. Nếu product yêu cầu hard-delete ngay (privacy/secret erasure), kết luận này không áp dụng và seal-first cần một delete/tombstone protocol riêng; thí nghiệm không chứng minh trường hợp đó.

## Protocol đã pass

1. Writer canonicalize payload, tính SHA-256 thành event `h`, append một JSON line vào `<git-common-dir>/fgos-open/<writerId>.jsonl`, rồi `fsync` file và directory trong lock của `writerId`.
2. Sealer lấy cùng lock, snapshot toàn bộ OPEN theo byte-prefix và chỉ nhận JSONL kết thúc bằng newline.
3. Sealer tính SHA-256 của toàn shard, ghi `.fgos/events/.<hash>.<pid>.tmp`, đóng file, `fsync` file và directory.
4. Sealer atomically rename temp thành `.fgos/events/<sha256>.jsonl`, rồi `fsync` directory lần nữa.
5. Sealer chạy `git add` đúng pathname đó và commit trên branch hiện tại. Sealed shard là immutable; các commit sau không sửa hoặc xóa nó.
6. Chỉ sau commit, sealer kiểm tra OPEN vẫn bắt đầu bằng snapshot bytes và atomically thay OPEN bằng suffix còn lại. Không bao giờ truncate trước publication.
7. Recovery xóa temp không-authoritative, re-seal từ OPEN, dùng pathname hash để bỏ qua materialization đã có, commit nếu index/working tree còn thay đổi, rồi mới cắt exact prefix.
8. Replay đọc mọi sealed shard cộng mọi OPEN shard, xác minh lại event hash, rồi dedupe theo `h`.

Các invariant quyết định là: OPEN là nguồn recovery cho tới commit; sealed path là hàm thuần của bytes; sealed file không đổi; truncate chỉ cắt prefix đã chứng minh; replay là set-union theo event hash; append và seal cùng writer được serialize.

## Số đo và bằng chứng chạy

Máy chạy `linux`, kernel `7.0.0-38-generic`, Node và Git thật, process thật. Run xác minh cuối ở `/tmp/seal-first-runs-SwOHMt`; source ở `/tmp/fgos-seal-first-zBYRVs/seal-first.mjs`; output máy ở `/tmp/fgos-seal-first-zBYRVs/results-verified.json`. Kết quả: merge thường 6/6 theo cả hai thứ tự; three-way 7/7 theo cả hai thứ tự; crash `20 × 5 = 100/100`; race `20/20`; duplicate replay `1/1`.

## Giả định filesystem và giới hạn

Thí nghiệm dựa vào rename cùng filesystem là atomic, `fsync(file)` làm bytes bền trước publication, và `fsync(directory)` làm entry temp/rename bền. Temp và final đều nằm trong cùng `.fgos/events/`, nên không có cross-device rename. OPEN nằm trong git common dir dùng chung và không tracked; sealed file nằm trong worktree và tracked. Lock prototype là file `O_EXCL` chứa PID, recovery xóa lock khi PID không còn tồn tại. Đây chưa phải lock production-grade vì PID reuse, hostname, timeout, permission và process sống nhưng treo chưa được giải quyết.

Tôi không kiểm được macOS/APFS, Windows/NTFS, WSL, NFS/SMB hay network filesystem; không suy rộng atomicity/directory-fsync sang các môi trường đó. Tôi cũng chưa thử power loss/kernel panic thật, torn write, disk-full/ENOSPC, permission failure, concurrent `git add/commit` của nhiều writer trong cùng worktree, bare/separate-git-dir/submodule, clone/fetch/GC, hoặc multi-machine OPEN. SIGKILL không mô phỏng mất page cache hay storage controller.

## Câu hỏi mở

1. Ack point sản phẩm là sau fsync OPEN, sau rename, hay sau commit; mỗi lựa chọn cho RPO và latency khác nhau?
2. Ai sở hữu serialization của Git index/commit khi nhiều writer khác `writerId` seal đồng thời trong cùng worktree?
3. Lock production dùng OS advisory lock hay lease có fencing token để tránh PID reuse và multi-host ambiguity?
4. Compaction, snapshot và hard-delete giữ add-only merge property bằng manifest/tombstone nào?
5. Có cần sealed truth chia sẻ giữa clone/máy hay Git chỉ là publisher cục bộ?
6. Cần ma trận crash thật trên filesystem/platform được hỗ trợ nào trước khi chọn Candidate B?

## Prototype source để chạy lại

Lưu block sau thành `seal-first.mjs`, rồi chạy `node seal-first.mjs test` trong một thư mục tạm có `git` trên PATH.

```js
#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const git = (cwd, args, ok = true) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (ok && r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r;
};
const common = wt => path.resolve(wt, git(wt, ['rev-parse', '--git-common-dir']).stdout.trim());
const dirs = wt => ({
  open: path.join(common(wt), 'fgos-open'),
  events: path.join(wt, '.fgos', 'events'),
});
function syncDir(dir) { const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
function event(payload) {
  const canonical = JSON.stringify(payload);
  return { ...payload, h: sha(canonical) };
}
function parseLines(buf) {
  const s = buf.toString('utf8');
  if (!s) return [];
  if (!s.endsWith('\n')) throw new Error('partial JSONL tail');
  return s.trimEnd().split('\n').map(JSON.parse);
}
async function lock(wt, writer, fn) {
  const d = dirs(wt).open; fs.mkdirSync(d, { recursive: true });
  const p = path.join(d, `${writer}.lock`);
  for (;;) {
    try { fs.writeFileSync(p, JSON.stringify({ pid: process.pid }), { flag: 'wx' }); break; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        const pid = JSON.parse(fs.readFileSync(p)).pid;
        try { process.kill(pid, 0); } catch (x) { if (x.code === 'ESRCH') { fs.unlinkSync(p); continue; } }
      } catch {}
      await sleep(2);
    }
  }
  try { return await fn(); } finally { try { fs.unlinkSync(p); } catch {} }
}
async function append(wt, writer, payload, holdMs = 0) {
  return lock(wt, writer, async () => {
    const d = dirs(wt).open; const p = path.join(d, `${writer}.jsonl`);
    const line = JSON.stringify(event(payload)) + '\n';
    const fd = fs.openSync(p, 'a');
    try { fs.writeSync(fd, line); fs.fsyncSync(fd); if (holdMs) await sleep(holdMs); }
    finally { fs.closeSync(fd); }
    syncDir(d);
  });
}
function killAt(step, wanted) { if (step === wanted) process.kill(process.pid, 'SIGKILL'); }
async function seal(wt, writer, killStep = '', holdAfterSnapshotMs = 0) {
  return lock(wt, writer, async () => {
    const { open, events } = dirs(wt); fs.mkdirSync(events, { recursive: true });
    const op = path.join(open, `${writer}.jsonl`);
    const bytes = fs.existsSync(op) ? fs.readFileSync(op) : Buffer.alloc(0);
    if (!bytes.length) return null;
    parseLines(bytes);
    if (holdAfterSnapshotMs) await sleep(holdAfterSnapshotMs);
    const id = sha(bytes), final = path.join(events, `${id}.jsonl`);
    const tmp = path.join(events, `.${id}.${process.pid}.tmp`);
    if (!fs.existsSync(final)) {
      const fd = fs.openSync(tmp, 'wx');
      try { fs.writeFileSync(fd, bytes); } finally { fs.closeSync(fd); }
      killAt('temp-write', killStep);
      const sf = fs.openSync(tmp, 'r'); try { fs.fsyncSync(sf); } finally { fs.closeSync(sf); }
      syncDir(events);
      killAt('fsync', killStep);
      fs.renameSync(tmp, final); syncDir(events);
    }
    killAt('rename', killStep);
    git(wt, ['add', path.relative(wt, final)]);
    killAt('git-add', killStep);
    if (git(wt, ['diff', '--cached', '--quiet'], false).status !== 0)
      git(wt, ['commit', '-m', `seal ${id}`]);
    killAt('commit', killStep);
    // Cut only the snapshotted prefix; a suffix is preserved. Lock makes the usual case exact.
    const now = fs.existsSync(op) ? fs.readFileSync(op) : Buffer.alloc(0);
    if (now.subarray(0, bytes.length).equals(bytes)) {
      const rest = now.subarray(bytes.length), tp = `${op}.${process.pid}.tmp`;
      const fd = fs.openSync(tp, 'w'); try { fs.writeFileSync(fd, rest); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(tp, op); syncDir(open);
    } else throw new Error('open prefix changed while locked');
    return id;
  });
}
async function recover(wt, writer) {
  const { events } = dirs(wt); fs.mkdirSync(events, { recursive: true });
  // Temps are never authoritative. If complete, their hash identifies the same final shard;
  // re-seal from OPEN is safer because OPEN remains intact until commit.
  for (const n of fs.readdirSync(events).filter(n => n.endsWith('.tmp'))) fs.unlinkSync(path.join(events, n));
  return seal(wt, writer);
}
function replay(wt) {
  const seen = new Map(), add = p => {
    if (!fs.existsSync(p)) return;
    for (const e of parseLines(fs.readFileSync(p))) {
      const h = e.h, body = { ...e }; delete body.h;
      if (h !== sha(JSON.stringify(body))) throw new Error(`bad event hash ${p}`);
      seen.set(h, e);
    }
  };
  const { events, open } = dirs(wt);
  if (fs.existsSync(events)) for (const n of fs.readdirSync(events).filter(n => /^[0-9a-f]{64}\.jsonl$/.test(n))) add(path.join(events, n));
  if (fs.existsSync(open)) for (const n of fs.readdirSync(open).filter(n => n.endsWith('.jsonl'))) add(path.join(open, n));
  return [...seen.values()].sort((a,b) => a.h.localeCompare(b.h));
}
function initRepo(root) {
  fs.mkdirSync(root, { recursive: true }); git(root, ['init', '-q', '-b', 'main']);
  git(root, ['config', 'user.email', 'experiment@example.invalid']); git(root, ['config', 'user.name', 'Experiment']);
  fs.writeFileSync(path.join(root, 'README'), 'fixture\n'); git(root, ['add', 'README']); git(root, ['commit', '-qm', 'init']);
}
async function child(args) {
  return new Promise(resolve => { const p = spawn(process.execPath, [new URL(import.meta.url).pathname, ...args], { stdio: 'ignore' }); p.on('exit', (code, signal) => resolve({code, signal})); });
}
function assert(c, m) { if (!c) throw new Error(m); }
async function testCrash(root, repeats = 20) {
  const steps = ['temp-write','fsync','rename','git-add','commit']; const counts = {};
  for (const step of steps) { counts[step] = 0;
    for (let i=0; i<repeats; i++) {
      const r = path.join(root, `crash-${step}-${i}`); initRepo(r);
      await append(r, 'w', { scenario:'crash', step, i });
      const x = await child(['seal', r, 'w', step]); assert(x.signal === 'SIGKILL', `${step}: not killed`);
      await recover(r, 'w'); const v = replay(r);
      assert(v.length === 1 && v[0].step === step && v[0].i === i, `${step}: loss/dup`);
      assert(git(r, ['status', '--porcelain']).stdout === '', `${step}: dirty after recovery`);
      counts[step]++;
    }
  } return counts;
}
async function testRace(root, repeats = 20) {
  let pass=0;
  for (let i=0;i<repeats;i++) {
    const r=path.join(root,`race-${i}`); initRepo(r); await append(r,'w',{scenario:'race',i,n:1});
    const s=child(['seal-delay',r,'w','100']);
    const lockPath=path.join(dirs(r).open,'w.lock');
    for(let wait=0;!fs.existsSync(lockPath)&&wait<500;wait++) await sleep(1);
    assert(fs.existsSync(lockPath),`race ${i}: sealer never held lock`);
    const a=child(['append',r,'w',JSON.stringify({scenario:'race',i,n:2})]);
    await Promise.all([s,a]); await recover(r,'w'); const v=replay(r);
    assert(v.length===2 && new Set(v.map(x=>x.n)).size===2, `race ${i}`); pass++;
  } return pass;
}
async function branchFixture(root, order, baseSeal=false) {
  initRepo(root); if(baseSeal){await append(root,'base',{who:'base'});await seal(root,'base');}
  const a=`${root}-a`, b=`${root}-b`; git(root,['worktree','add','-qb','a',a]); git(root,['worktree','add','-qb','b',b]);
  for(let i=0;i<3;i++){await append(a,'a',{who:'a',i});await seal(a,'a');await append(b,'b',{who:'b',i});await seal(b,'b');}
  for(const br of order) { const m=git(root,['merge','--no-edit',br],false); assert(m.status===0,`merge conflict ${order}: ${m.stderr}`); }
  const v=replay(root); assert(v.length===(baseSeal?7:6),`merge union ${order}`); return v.length;
}
async function testDuplicate(root) {
  initRepo(root); const a=`${root}-a`,b=`${root}-b`;git(root,['worktree','add','-qb','a',a]);git(root,['worktree','add','-qb','b',b]);
  const p={same:'event'};await append(a,'a',p);await seal(a,'a');await append(b,'b',p);await seal(b,'b');
  git(root,['merge','--no-edit','a']);git(root,['merge','--no-edit','b']);
  assert(replay(root).length===1,'duplicate replay'); return 1;
}
async function runAll() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'seal-first-runs-'));
  const result={platform:process.platform,kernel:os.release(),root};
  result.mergeAB=await branchFixture(path.join(root,'merge-ab'),['a','b']);
  result.mergeBA=await branchFixture(path.join(root,'merge-ba'),['b','a']);
  result.threeWayAB=await branchFixture(path.join(root,'three-ab'),['a','b'],true);
  result.threeWayBA=await branchFixture(path.join(root,'three-ba'),['b','a'],true);
  result.crash=await testCrash(root,20); result.race=await testRace(root,20); result.duplicate=await testDuplicate(path.join(root,'duplicate'));
  console.log(JSON.stringify(result,null,2));
}
const [cmd,...args]=process.argv.slice(2);
if(cmd==='append') await append(args[0],args[1],JSON.parse(args[2]));
else if(cmd==='seal') await seal(args[0],args[1],args[2]||'');
else if(cmd==='seal-delay') await seal(args[0],args[1],'',+args[2]);
else if(cmd==='recover') await recover(args[0],args[1]);
else if(cmd==='replay') console.log(JSON.stringify(replay(args[0]),null,2));
else if(cmd==='test') await runAll();
else console.error('usage: seal-first.mjs append|seal|recover|replay|test ...');
```

## Kiểm lại bởi controller (2026-10-17 12:25)

Controller chạy lại prototype trong báo cáo này trên cùng máy: kết quả khớp hoàn toàn (mergeAB 6, mergeBA 6, threeWay 7/7 cả hai chiều, crash 20 lần ở mỗi ranh giới temp-write/fsync/rename/git-add/commit đều khôi phục đúng, race 20/20, duplicate 1).
