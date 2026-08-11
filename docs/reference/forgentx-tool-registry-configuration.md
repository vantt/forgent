# forgentX repo's tool-registry configuration

Lookup facts about the `fgos tool` registry's real, live configuration in
this repo (`tsk-4ad`), quoted from `docs/distillery/deep-dives/tool-
registry.md`'s "Cấu hình forgentX hiện tại (tsk-4ad)" section — the verb
group itself (`register`/`check`/`query`/`remove`) is the `tsk-1dj` port;
this reference covers only what is actually configured today and how to
read/extend it without asking again.

## Registered providers

Confirmed via `fgos tool query --capability impact-analysis --json`:

> `gitnexus` — `kind: mcp`, `capability: impact-analysis`, `scan:
> .gitnexus`, `responsibility: Verification`, `description: Code-graph
> blast radius`. Provider đầu tiên và duy nhất cho `impact-analysis` hôm
> nay.

(gitnexus is today's first and only provider for `impact-analysis`.)

## Capability vocabulary in use

> **Capability vocab đang dùng**: đúng 1 nhãn — `impact-analysis`
> (kebab-case, tự chuẩn hoá qua `normalizeCapability`,
> `src/state/tool-registry.mjs`). Thêm nhãn mới không cần sửa code: chỉ
> cần `--capability <ten-moi>` lúc `register` — consumer (một skill, hay
> CLAUDE.md) tự quyết định có hỏi nhãn đó hay không, registry không áp
> policy.

(Exactly one label in use today — `impact-analysis`. Adding a new label
needs no code change: pass `--capability <new-name>` at `register` time;
the consumer — a skill, or CLAUDE.md — decides whether to ask for that
label, the registry itself applies no policy.)

## Registering a new provider

```
fgos tool register --name <ten> --kind <cli|binary|mcp|skill|http> \
  --capability <nhan> --command <lenh-hoac-mcp:ten> \
  [--scan <duong-dan>] [--responsibility <vai-tro>] [--description "..."] \
  --dir <main-checkout-root>
```

> `--scan` bắt buộc cho `kind` `mcp`/`skill` (không nằm trên `PATH`,
> presence check bằng scan path trên đĩa thay vì `command -v`). `--name`
> phải duy nhất — đăng ký trùng tên bị từ chối thẳng
> (`validateToolRegistration`); muốn thay một provider đã có, `fgos tool
> remove --name <ten>` trước rồi `register` lại. Chạy từ một worktree
> (không phải main checkout) luôn cần `--dir` trỏ về main checkout —
> registry là state chia sẻ chung một chỗ, không phải per-branch
> (ADR0020).

(`--scan` is required for `kind` `mcp`/`skill` — not on PATH, presence is
checked by scanning a disk path instead of `command -v`. `--name` must be
unique — a duplicate registration is rejected outright
(`validateToolRegistration`); to replace an existing provider, `fgos tool
remove --name <name>` first, then `register` again. Run from a worktree
(not the main checkout), `--dir` must always point at the main checkout —
the registry is shared state in one place, never per-branch, per
ADR0020.)

## Probing and reading status

> - `fgos tool check [--name x] [--json]` — probe từng tool đã đăng ký,
>   ghi `status`+`checkedAt` vào `.fgos/tool-status.local.json` (cục bộ,
>   gitignored, KHÔNG qua event-log — sự thật về máy đang chạy, không
>   phải quyết định team). Luôn exit 0, kể cả khi tool thiếu.
> - `fgos tool query --capability <nhan> [--status present]` — trả
>   provider set, gộp đăng ký (chia sẻ) với overlay trạng thái cục bộ
>   (máy này).
> - `fgos doctor` — check `tool-registry-configured`
>   (`src/setup/checks.mjs`) tự báo posture tổng quát, không cần tự gọi
>   `tool query` tay.

(`fgos tool check` probes each registered tool, writes `status`+
`checkedAt` to the local, gitignored `.fgos/tool-status.local.json` —
never through the event log, since it's a fact about the running machine,
not a team decision. Always exits 0, even when a tool is missing. `fgos
tool query --capability <label> [--status present]` returns the provider
set, merging the shared registration with the local machine's status
overlay. `fgos doctor`'s `tool-registry-configured` check already reports
overall posture without needing to call `tool query` by hand.)

## Degrade-ladder status meanings

> - **inactive** — 0 tool đăng ký cho capability này. Vô hại, bỏ qua
>   sạch, không phải thiếu sót.
> - **degraded** — có đăng ký nhưng probe ra `missing`, hoặc chưa từng
>   `check` (`unknown`). Gap thật — cảnh báo weak-proof trong verify/plan
>   note, nhưng vẫn chạy tiếp phần khác.
> - **full** — mọi tool đăng ký đều `present`. Giữ nguyên hành vi MUST
>   hiện tại không đổi.

(**inactive** — zero tools registered for this capability; harmless, a
clean skip, not a gap. **degraded** — registered but probes `missing`, or
never `check`ed (`unknown`); a real gap — flag a weak-proof warning in a
verify/plan note, but keep going on everything else. **full** — every
registered tool is `present`; existing MUST behavior stays unchanged.)

## Registering a capacity for capacity-aware dispatch (tsk-62v)

> The runner config's optional `capacities.<capacityId>` block (D1, in
> `.fgos/config.json`'s `runner` section) can
> declare `"kind": "cli"` for a capacity dispatched through `dispatch.mjs`'s
> `resolveExecutorConfig`. When it does, presence is checked by consulting
> this SAME registry (`fgos tool query`'s own functions, called
> in-process) instead of re-probing PATH independently — reusing the
> discovery layer above, not building a second one. This only works if the
> capacity was registered first, with `--name` matching the capacity's own
> id exactly:
>
> ```
> fgos tool register --name <capacityId> --kind cli \
>   --capability <nhan> --command <lenh> --dir <main-checkout-root>
> fgos tool check --name <capacityId> --dir <main-checkout-root>
> ```
>
> Thiếu bước đăng ký này, `resolveExecutorConfig` từ chối thẳng
> (`RunnerConfigError`) tại resolve-time — trước khi spawn bất cứ gì, cùng
> phong cách "lỗi rõ ràng" executor block hiện có đã dùng cho một block
> thiếu `command`/`args`. Đăng ký rồi nhưng `fgos tool check` chưa từng
> chạy (hoặc trả `missing`) cũng từ chối — chỉ `status: present` mới cho
> qua.

(A `capacities.<capacityId>` entry declaring `"kind":
"cli"` (D1) has its presence checked by consulting this same registry —
`fgos tool query`'s own functions, called in-process — instead of
re-probing PATH independently, reusing the discovery layer above rather
than building a second one. This only works once the capacity is
registered, with `--name` matching the capacity's own id exactly. Skipping
that registration step makes `resolveExecutorConfig` refuse outright
(`RunnerConfigError`) at resolve time, before anything is spawned — the
same "fail loud" style the existing executor-block check already uses for
a block missing `command`/`args`. Registered but never `fgos tool check`ed
(or checked `missing`) refuses the same way — only `status: present`
passes.)

## Explicitly out of scope for tsk-4ad

> Việc CHƯA nằm trong tsk-4ad: sửa prose 3 skill
> (fgos-coding-planning/validating/executing) + CLAUDE.md để MỖI BƯỚC workflow
> tự hỏi capability (`fgos tool query --capability impact-analysis
> --status present`) thay vì hardcode tên "GitNexus" trong logic gate —
> đó là injection thật sự (xem mục "Ví dụ end-to-end" ở trên), và là
> việc riêng của tsk-1e4. tsk-4ad dừng ở: đăng ký provider, có
> DOCTOR_CHECKS entry, và ghi chú đọc-hiểu-được này.

(Not done by tsk-4ad: rewriting the three skills'
(fgos-coding-planning/validating/executing) prose plus CLAUDE.md so every
workflow step asks the capability (`fgos tool query --capability
impact-analysis --status present`) instead of hardcoding the name
"GitNexus" in gate logic — that's the real injection point, and it's
`tsk-1e4`'s own separate job. `tsk-4ad` stops at: registering the
provider, adding the `DOCTOR_CHECKS` entry, and this readable reference
note.)
