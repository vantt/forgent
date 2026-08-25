# Tool-registry: capability lookup is a prose contract, not compiled logic

`tsk-2br` asked what `repository-harness`'s "tool registry" mechanism is
for, what makes it interesting, and how it actually integrates into a
project's flow. The answer that survived scouting four upstream sources
(`repository-harness`, `symphony`, `beads`, `compound-engineering-plugin`)
is captured in full at `docs/distillery/deep-dives/tool-registry.md`; this
doc pulls out the parts most useful to a reader deciding whether — and
how — to port the idea into fgOS (the actual porting work is `tsk-1dj`,
out of scope here).

## The registry only returns facts; something else decides what to do with them

The deep-dive's bottom line, quoted directly:

> repository-harness tách rạch ròi hai chiều — *outbound* (harness's own
> compiled commands, luôn có) vs *inbound* (project tự đăng ký extra tool:
> gitnexus/c3/linter — optional, may absent). Cơ chế injection KHÔNG nằm
> trong code: registry chỉ trả **fact** (`status: present/missing/unknown`),
> chính **agent** (qua prose contract trong AGENTS.md/doc, không phải
> compiled logic) đọc fact đó và áp policy.

The deep-dive traces this claim all the way down to `repository-harness`'s
own source: `query tools` is a CLI command that returns a JSON set of
providers for a capability, and nothing in the harness's own Rust code
ever calls it automatically. The deep-dive's own end-to-end walkthrough
section makes the point explicit:

> **Đây là phát hiện quan trọng nhất của mục này: chính
> repository-harness — nơi sinh ra cơ chế — CŨNG KHÔNG tự "inject"
> capability-check vào workflow bắt buộc của chính nó.** Cơ chế inject
> thật sự là: **ai viết prose cho một bước cụ thể (AGENTS.md của MỘT
> project khác, hay 1 skill/story riêng) tự quyết định chèn câu "trước khi
> làm X, hỏi capability Y" vào đúng chỗ đó.** CLI chỉ là oracle sự-thật;
> không có hook cấu trúc nào tự động gọi nó.

## Symphony proves the pattern is portable without touching the registry's code

`symphony` reuses `repository-harness`'s registry as-is and only writes a
new prose file (`docs/OPTIONAL_TOOLING.md`) describing a 3-tier degrade
ladder for its own `design-review` capability:

> 1. Không provider đăng ký → skip sạch, ghi `design-review: inactive` lúc
>    trace, KHÔNG fail validation.
> 2. Đăng ký nhưng missing/unusable → chạy tiếp required checks
>    (build/Playwright/a11y/human screenshot), báo **degraded warning**,
>    đánh dấu **proof weak** nếu workflow đòi provider đó.
> 3. Present & usable → thêm audit optional, **bổ sung chứ không thay**
>    required evidence.

Symphony did not fork or reimplement the registry — it only wrote policy
prose that reads the same fact the registry already produced. That is the
deep-dive's proof that the mechanism travels: the registry is a shared
data layer, and each consuming project supplies its own prose contract on
top.

## Where the other two sources diverge

`beads` and `compound-engineering-plugin` solve a related but different
problem, and the deep-dive is explicit that they are not the same
mechanism:

> khác harness (registry ngoài, agent tự query), beads gate NGAY tại
> compile-time interface — capability = static type boundary, không phải
> runtime probe. Trade-off: cứng hơn (mỗi capability mới cần thay
> interface Go) nhưng an toàn hơn (compiler ép mọi implementation phải
> khai rõ có/không hỗ trợ).

`compound-engineering-plugin` skips a registry entirely and just runs
`command -v` at the point of use — "thiếu tool là capability optional,
không phải failure," the cheapest of the four approaches but with no
persisted status and no multi-provider support.

The point all four sources converge on regardless of mechanism:

> Điểm hội tụ chéo cả 4: **"absent capability = clean skip, never a
> failure"** — không nguồn nào coi thiếu optional tool là lỗi cứng.

## Why this matters for fgOS specifically (`tsk-1e4`)

fgOS's `CLAUDE.md` currently hardcodes a MUST to run GitNexus regardless
of whether the tool is actually installed on the machine — there is no
registry, so there is no way to distinguish "never registered" (a clean
skip) from "registered but broken" (a real gap worth warning about). The
deep-dive's proposed fix follows the harness/symphony shape: fgOS
consults a `impact-analysis` **capability**, never the literal string
"GitNexus," so a second provider could register later without any of the
three consuming skills (`fgos-coding-planning`, `fgos-coding-validating`,
`fgos-coding-implement`) needing to change:

> fgos-coding-planning/validating tham chiếu **capability** `impact-analysis`,
> KHÔNG BAO GIỜ tham chiếu tên "GitNexus" trực tiếp trong logic gate —
> GitNexus chỉ là provider đầu tiên đăng ký.

That prose rewrite is `tsk-1e4`'s job, not this item's — porting the
`fgos tool` verb-group itself is `tsk-1dj`, and registering GitNexus
against it is `tsk-4ad`. This item's own job ended at producing the
synthesis those three build on.

## A second real fgOS capability, beyond impact-analysis (`tsk-3ac`)

`impact-analysis` was the first capability registered against `fgos tool`
(GitNexus as its provider), but not the last. `tsk-3ac` — part of the
worker-slot design
(`docs/explanation/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md`'s
D5) — turned the herdr pane-labeling helper (`plugins/fgOS/skills/
terminal/rename.sh`) into a second real capability consumer: it declares
a pane-labeling capability through `fgos tool register`
(`src/state/tool-registry.mjs`) and gates the helper on `fgos tool
query`, rather than hardcoding an assumption about whether the calling
environment has any concept of a labelable pane at all.

Confirming the "absent capability = clean skip, never a failure"
convergence point from the four upstream sources above: `rename.sh`
already had this shape before the capability gate existed — it exits `0`
silently outside a herdr pane — and the gate formalizes that same
behavior through the registry instead of a hardcoded environment check.
The registry's single-consuming-call-site discipline applies here too:
`tsk-3ac` pinned the execution-lane call to `fgos-coding-driving` (which
knows the item id earliest and sees every stage change) and removed the
scattered rename calls that used to live elsewhere (`discover-next`'s own
step 6) — one call site per capability consumer, not one per place that
happened to know the id.
