# forgentX repo's tool-registry configuration

Lookup facts about the `fgos tool` registry's real, live configuration in
this repo (`tsk-4ad`), quoted from `docs/distillery/deep-dives/tool-
registry.md`'s "Cấu hình forgentX hiện tại (tsk-4ad)" section — the verb
group itself (`check`/`query`) is the `tsk-1dj` port; this reference covers
only what is actually configured today and how to read/extend it without
asking again.

> **tsk-in1-1 D1**: `register`/`remove` đã bị rút — provider giờ khai báo
> thẳng trong `runner.capacities.<id>` (`.fgos/config.json`), sửa file
> config như mọi `capacities` entry khác, không qua verb CLI riêng.

(tsk-in1-1 D1: `register`/`remove` are retired — a provider is now
declared directly in `runner.capacities.<id>` (`.fgos/config.json`), edited
like any other `capacities` entry, no longer through a dedicated CLI verb.)

## Registered providers

Confirmed via `fgos tool query --capability impact-analysis --json`:

> `gitnexus` — `kind: mcp`, `capability: impact-analysis`, `scan:
> .gitnexus`, `responsibility: Verification`, `description: Code-graph
> blast radius`. Provider đầu tiên và duy nhất cho `impact-analysis` hôm
> nay.

(gitnexus is today's first and only provider for `impact-analysis`.)

## Capability vocabulary in use

> **Capability vocab đang dùng**: 2 nhãn hôm nay — `impact-analysis`
> (gitnexus) và `pane-labeling` (herdr), cả hai kebab-case, tự chuẩn hoá
> qua `normalizeCapability` (`src/state/tool-registry.mjs`). Thêm nhãn mới
> không cần sửa code: khai thẳng `capability: "<ten-moi>"` trên entry
> `runner.capacities.<id>` — consumer (một skill, hay CLAUDE.md) tự quyết
> định có hỏi nhãn đó hay không, registry không áp policy.

(2 labels in use today — `impact-analysis` (gitnexus) and `pane-labeling`
(herdr). Adding a new label needs no code change: declare `capability:
"<new-name>"` directly on a `runner.capacities.<id>` entry; the consumer —
a skill, or CLAUDE.md — decides whether to ask for that label, the
registry itself applies no policy.)

## The curated `runner.capabilities` catalog (D4/D14, tsk-in1-3)

> Danh mục riêng, tách khỏi cả 2 vocab trên: `runner.capabilities.<name>`
> trong `.fgos/config.json` — mỗi entry `{description?, aliases?}`, cả 2
> field optional (`{}` hợp lệ, chỉ cần khoá). Đây là nơi ghi CHUNG cho cả
> tool-registry's `capability` (Tầng 1, presence/fact) lẫn — sau này —
> `capacities.<id>.for` (Tầng 2, dispatch purpose-lookup, một task khác
> trong cùng lineage). `aliases` khác `normalizeCapability`'s tự động
> kebab-case: nó khai tên gọi KHÁC hẳn cùng trỏ về 1 entry (vd
> `impact_analysis`/`Impact Analysis` cùng trỏ về `impact-analysis`).
> Validate qua `validateCapabilitiesShape` (`src/runner/dispatch.mjs`) —
> hiện chưa ép một `capability`/`for` phải nằm trong danh mục này (đó là
> việc riêng của task đọc `for`).

(A separate catalog from both vocabs above: `runner.capabilities.<name>`
in `.fgos/config.json` — each entry `{description?, aliases?}`, both
fields optional (`{}` is valid, only the key is required). This is the
SHARED place both the tool-registry's `capability` (layer 1,
presence/fact) and — later — `capacities.<id>.for` (layer 2, dispatch
purpose-lookup, a separate task in the same lineage) read from. `aliases`
differs from `normalizeCapability`'s automatic kebab-case folding: it
names genuinely DIFFERENT spellings that all resolve to the same entry
(e.g. `impact_analysis`/`Impact Analysis` both point at `impact-analysis`).
Validated via `validateCapabilitiesShape` (`src/runner/dispatch.mjs`) —
today nothing yet enforces that a `capability`/`for` value must actually
be in this catalog; that enforcement is a separate task's job.)

## Registering a new provider

Sửa thẳng `.fgos/config.json` — thêm 1 entry `runner.capacities.<id>` có
`capability` (điểm phân biệt "tool" khỏi 1 capacity dispatch bình thường
như `agy` — `toolsFromCapacities`, `src/state/tool-registry.mjs`, chỉ
nhặt entry nào khai `capability`):

```json
"runner": {
  "capacities": {
    "<id>": {
      "kind": "tool",
      "capability": "<nhan>",
      "invocations": [
        { "via": "mcp | cli", "command": "<lenh-hoac-mcp:ten>" }
      ],
      "scanTarget": "<duong-dan, chi via:mcp>",
      "responsibility": "<vai-tro, optional>",
      "description": "<mo-ta, optional>"
    }
  }
}
```

> `scanTarget` bắt buộc khi `invocations[0].via` là `mcp` (không nằm trên
> `PATH`, presence check bằng scan path trên đĩa thay vì `command -v`).
> `<id>` (khoá object) đóng vai trò `--name` cũ — phải duy nhất trong
> `capacities`, engine đã tự đảm bảo (JSON object key). Presence/probe
> mechanism nằm ở `invocations[0].via`/`.command` — KHÔNG còn ở `kind`
> nữa (tsk-in1-4 D5: `kind` giờ là trục BẢN CHẤT `agent`/`tool`, tách
> khỏi trục CƠ CHẾ GỌI `invocations[].via`; xem "The curated
> `runner.capabilities` catalog" ở trên và `docs/specs/runner.md` RUL41
> cho toàn bộ thiết kế). `via: "mcp"` chỉ cần `command` (định danh, không
> `args`, `validateInvocationShape`'s "gate B1" không ép hình dạng
> executor lên nó); `via: "cli"` cần đủ `command`+`args` như 1 executor
> block thật. Đây là state chia sẻ chung một chỗ (`.fgos/config.json`),
> không phải per-branch (ADR0020) — sửa trong main checkout, không phải
> trong worktree của 1 item.

(`scanTarget` is required when `invocations[0].via` is `mcp` — not on
PATH, presence is checked by scanning a disk path instead of
`command -v`. `<id>` (the object key) plays the old `--name`'s role —
must be unique within `capacities`, which the engine already guarantees
(a JSON object key). The presence/probe mechanism now lives in
`invocations[0].via`/`.command` — no longer in `kind` (tsk-in1-4 D5:
`kind` is now the BAN CHAT axis, `agent`/`tool`, separate from the CO CHE
GOI axis `invocations[].via`; see "The curated `runner.capabilities`
catalog" above and `docs/specs/runner.md` RUL41 for the full design).
`via: "mcp"` only needs `command` (an identifier, never `args` —
`validateInvocationShape`'s "gate B1" never forces the executor shape
onto it); `via: "cli"` needs the full `command`+`args` shape a real
executor block does. This is shared state in one place
(`.fgos/config.json`), never per-branch (ADR0020) — edit it in the main
checkout, not inside an item's own worktree.

> **tsk-in1-4 open item**: this migration (`agy.kind: "cli"→"agent"`,
> `gitnexus`/`herdr.kind: "mcp"/"cli"→"tool"` + `invocations[]`) is
> implemented and tested (synthetic fixtures) but NOT yet applied to this
> repo's own live `.fgos/config.json` — unlike tsk-in1-1/tsk-in1-3's
> additive fields, this one is a breaking `kind` vocabulary change old
> code cannot load, so it cannot land on `main` ahead of `fgw/tsk-in1`'s
> own code merge (ADR0020's direct-commit path assumes backward
> compatibility, which this change does not have). Whoever merges
> `fgw/tsk-in1` to `main` must apply this data migration in the SAME
> action, not before.)

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

## A tool-registry entry is never an automatic presence gate for dispatch (tsk-62v, tsk-5tm-1 D1)

> `capacities.<capacityId>`'s own presence/staleness was checked
> automatically by `resolveExecutorConfig` once (tsk-62v D1/D2) — retired
> at `tsk-5tm-1` D1: 2/3 real entries were `kind:"task"`, for which it
> never ran, and the third's signal added nothing an OS `ENOENT` on a
> missing binary didn't already give for free. `resolveExecutorConfig`
> never consults this registry today, for ANY `capacityId` — a `capacities`
> entry declaring a `capability` (making it also a tool-registry entry, the
> "Registering a new provider" section above) and one that does not
> dispatch and probe completely independently. A caller that wants a real
> presence gate before dispatching a specific capacity asks for it itself,
> explicitly, at the call site:
>
> ```
> fgos tool query --capability <nhan> --status present --dir <main-checkout-root>
> ```
>
> — never something `resolveExecutorConfig`/`fgos-coding-implement` does on
> its own authority. `CLAUDE.md`'s impact-analysis capability gate is the
> one real consumer of this pattern today (`gitnexus`).

(A `capacities.<capacityId>` entry's own presence/staleness used to be
checked automatically by `resolveExecutorConfig` (tsk-62v D1/D2) — retired
at `tsk-5tm-1` D1: 2 of the 3 real entries were `kind:"task"`, for which it
never ran anyway, and the third's signal added nothing an OS `ENOENT` on a
missing binary didn't already give for free. `resolveExecutorConfig` never
consults this registry today, for any `capacityId` — a `capacities` entry
declaring a `capability` (making it also a tool-registry entry, per the
"Registering a new provider" section above) and one that dispatches are
completely independent concerns. A caller that wants a real presence gate
before dispatching a specific capacity has to ask for it explicitly at the
call site, with `fgos tool query --status present`, never something
`resolveExecutorConfig`/`fgos-coding-implement` does automatically.
`CLAUDE.md`'s impact-analysis capability gate is the one real consumer of
this pattern today, gating on `gitnexus`.)

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
