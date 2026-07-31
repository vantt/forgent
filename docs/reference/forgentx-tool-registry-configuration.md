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

## Explicitly out of scope for tsk-4ad

> Việc CHƯA nằm trong tsk-4ad: sửa prose 3 skill
> (fgos-planning/validating/executing) + CLAUDE.md để MỖI BƯỚC workflow
> tự hỏi capability (`fgos tool query --capability impact-analysis
> --status present`) thay vì hardcode tên "GitNexus" trong logic gate —
> đó là injection thật sự (xem mục "Ví dụ end-to-end" ở trên), và là
> việc riêng của tsk-1e4. tsk-4ad dừng ở: đăng ký provider, có
> DOCTOR_CHECKS entry, và ghi chú đọc-hiểu-được này.

(Not done by tsk-4ad: rewriting the three skills'
(fgos-planning/validating/executing) prose plus CLAUDE.md so every
workflow step asks the capability (`fgos tool query --capability
impact-analysis --status present`) instead of hardcoding the name
"GitNexus" in gate logic — that's the real injection point, and it's
`tsk-1e4`'s own separate job. `tsk-4ad` stops at: registering the
provider, adding the `DOCTOR_CHECKS` entry, and this readable reference
note.)
