---
authoritative_for: why runner config splits capability (curated vocab), executor (named registry of how a capability is fulfilled), and capacity (the for-purpose lookup binding) into three distinct concepts instead of the two overlapping ones (tool-registry's free-text capability, dispatch.mjs's closed-enum purpose) that existed before
---

# Why capability, executor, and capacity are three separate concepts

Before this item, "capability" existed as two vocabularies that never
actually overlapped: `tool-registry.mjs`'s capability was free-text
presence/fact tracking (e.g. `impact-analysis`, `pane-labeling`);
`dispatch.mjs`'s `CAPACITY_PURPOSES` was a closed enum with a single member
(`judge`) used for purpose-lookup. `runner.capacities` was also carrying
two different jobs at once — an executor registry keyed by name, and an
optional purpose binding — while a separate `cfg.executors.<tier>` field
(tier-keyed fallback) sat nearby, on a completely different axis. This item
(a continuation of `tsk-5tm`'s task-dispatch-unification lineage) untangles
all of that into three named concepts.

## The unification, and why the enum became curated rather than free-text

> D4: Thêm runner.capabilities -- danh mục capability curated, predefined
> + đăng ký thêm được, hợp nhất vocab tool-registry (free-text) và dispatch
> (CAPACITY_PURPOSES enum đóng)

`runner.capabilities` is fgOS's own curated (not free-text) vocabulary of
capability promises. The two prior vocabularies shared zero members
(`impact-analysis`/`pane-labeling` on the tool-registry side,
`judge` on the dispatch side) — a curated, closed vocabulary was chosen
over reopening tool-registry's free-text model, so fgOS defines the
category and whoever implements one registers an executor `for` it.

> D14: runner.capabilities.<name> mang shape {description, aliases: [...]}

Each capability entry allows multiple names mapping to one entry — richer
than `normalizeCapability`'s automatic kebab-case-only normalization —
inheriting the description/responsibility spirit of the old tool-registry
provider shape.

## Why `executors` (tier-keyed) and the new name-keyed registry couldn't share a field

> D3: Giữ nguyên tên field capacities (không đổi thành executors) cho
> registry executor hợp nhất; field executors (tier-keyed) không dời đi
> đâu, không đổi tên

This wasn't a naming preference — `cfg.executors` already exists and is
hard-validated to accept only `light`/`standard`/`heavy` keys
(`dispatch.mjs:521-528`, `tsk-4eu`). Reusing that name for a name-keyed
registry would be rejected by its own validator. `tsk-5tm` D11 had already
locked this same reasoning previously.

> D6: Xoá hẳn executors.<tier> (tier-keyed fallback, từ P41). Chỉ còn 2
> tầng: executor (global default) và capacities (registry hợp nhất, D1/D3)

The tier-keyed fallback was removed outright: zero live entries on the
running machine, and its history includes a real bug — `tsk-5tm` D10
confirmed the `judge-decompose` bug (`tsk-5ge`) was caused by content being
placed into `runner.executors.judge` as if it configured the `judge`
capacity, when `executors` only ever accepted tier keys. `tsk-4eu`'s
validator exists specifically to catch that exact confusion. The
tier-fallback feature it removed had never actually been used, so nothing
real was lost.

> D7: Giữ cfg.executor (global default) đứng riêng, KHÔNG gộp vào
> capacities.default

`executor` (singular, global default) stays its own required field rather
than becoming a `capacities.default` entry — it's the bootstrap seed
(`ensureRunnerConfigForDir`/`DEFAULT_RUNNER_CONFIG`) and the template
source for `buildAgentTypeExecutor`, with no optional guard the way
`capacities`/`capabilities` have. Folding it into an optional map under a
special `'default'` key would recreate exactly the meaningful-key-name trap
that caused the D6 bug in the first place.

## `kind` splits into what vs. how

> D5: kind tách thành 2 giá trị agent|tool (trục BẢN CHẤT), chuyển vocab
> cũ (cli/binary/mcp/skill/http/task) vào invocations[].via (trục CƠ CHẾ
> GỌI); INVOCATION_VIA mở rộng từ ['cli'] thành ['task','cli','mcp','api']

`kind` now answers "is this an agent or a tool" (the essential-nature
axis); the old vocabulary of `cli`/`binary`/`mcp`/`skill`/`http`/`task`
moves to `invocations[].via` (the calling-mechanism axis). This matches
marketing-cockpit's real ADR0027/0042 shape (`kind: agent|tool`,
`invocation via: task|cli|mcp|api`) and closes a real design/code gap: the
task-dispatch-unification `DISCUSSION.md` had already described
`kind: agent` for `agy` in prose, but `CAPACITY_KINDS`
(`dispatch.mjs:443`) never actually had an `agent` value in code — the
running config had to use `kind: cli` as a workaround, a drift a prior
review (`tsk-1qn` D2) had only spot-read past rather than caught.

That expansion was narrowed once, then reopened with real code behind it:

> D8: Sửa INVOCATION_VIA của D5 thành ['cli','task','mcp'] (bỏ 'api')

An Opus consult against the real `events.jsonl` history confirmed only two
`via` values had ever actually been registered (`cli`: gather/herdr/
submit-assist-classify; `mcp`: gitnexus) — `http`/`binary`/`skill` were
dead vocabulary, and `api` would have been vocabulary expansion ahead of
any real producer, violating YAGNI.

> D13: Xây 1 http/api adapter thật (EXECUTOR_ADAPTERS['http']) làm tiền lệ
> chứng minh port pluggable. Sửa lại D8: đưa 'api' trở lại INVOCATION_VIA,
> lần này có code thật đứng sau

`api` came back into `INVOCATION_VIA` once a real `http` adapter was built
to prove the `EXECUTOR_ADAPTERS` port is genuinely pluggable — chosen over
a `bash`/`shell` adapter deliberately, both because it doesn't reopen a
dynamic shell-injection surface (`RUL45`) and because it exercises a
meaningfully different execution shape (a network call, not a subprocess).
This also generalized `EXECUTOR_ADAPTERS`' own calling convention from a
fixed `(command, args, cwd, opts)` signature to a plain invocation object
each adapter destructures itself (`cli` reads `command`/`args`, `http`
reads `method`/`url`/`headers`/`body`) — forcing `http` into the old
CLI-shaped signature would have repeated the exact "invocation doesn't fit
command/args" trap the `mcp` case (D9 below) already hit.

## The three gates D5 needed to actually ship safely

> D9: D5 cần 3 gate sửa kèm, không thể ship riêng D5 mà thiếu: (a)
> validateCapacityShape không được bắt buộc command/args cho MỖI
> invocation -- phải tuỳ theo via; (b) resolveExecutorConfig phải CHỌN
> invocation đúng theo via, không lấy invocations[0] mù; (c)
> resolveExecutorCommand phải THROW khi một invocation không có
> adapter/via dispatch-được, không được âm thầm rơi về DEFAULT_ADAPTER
> cli-spawn

Without these three fixes, a real `gitnexus` entry (`via: mcp`, no
`command`) would have failed `validateExecutorShape`'s unconditional
command/args requirement and never loaded, `resolveExecutorConfig` would
have blindly taken `invocations[0]` regardless of which `via` was actually
wanted, and an unrecognized `via` would have silently fallen back to
spawning the literal string as a CLI binary — the same underlying failure
mode as the `judge-decompose` bug D6 already used as evidence, just
relocated to a different resolve path. Silent fallback was replaced with a
throw at resolve-time instead of an opaque worker-spawn failure later.

## Two marketing-cockpit patterns considered and rejected

> D11: Đánh giá và TỪ CHỐI 2 mô hình marketing-cockpit -- không port: (a)
> silent model-tier downgrade (critical->analytical->standard->lightweight);
> (b) tách model-policy.yaml thành file riêng

(a) was rejected because fgOS already has an explicit solution to the same
underlying problem (`rigorOverrides` on `agy`, `modelForTier` throwing
plainly when a tier+provider pair is missing) — copying a competitor's
shape without knowing what actually triggers it (budget? rate-limit?
never specified in their own docs) would silently downgrade heavy/critical
work to a smaller model, the opposite of the loud-failure philosophy this
whole item was already applying elsewhere. (b) was rejected because
`mergeWithGlobalConfig` (`dispatch.mjs:312-328`) already gives the "fix one
place, whole hierarchy updates" property without needing to register a new
config source in `fgos setup`/`doctor` (the install gate `AGENTS.md`
requires of any new config source).

## An open question resolved as intentional design, not a bug

> D12: Xác nhận #3's câu hỏi còn -- capacityIdForWork miễn khi tra vào
> capacities (key theo executor-name) KHÔNG PHẢI bug, là thiết kế có ý
> (tsk-5tm-6 D4)

`dispatch.mjs:1599-1613`'s own comment already states the miss is the
signal for "no config override" — per the Native-First Dispatch Doctrine
(`docs/decisions/0026` rule 2), every `fgos-fanout` candidate is
same-provider and needs a soul, so it defaults to native rather than
falling into the generic "no capacity → out-of-process" branch (which is
for purpose-targeted lookups like `agy`, a different path entirely). D10's
separate finding about the `--for`/purpose path does not contradict this —
the two paths (`--work` vs `--for`) were already distinct.

## Source

`tsk-in1`, continuing the `tsk-5tm` task-dispatch-unification lineage,
found while reviewing `plans/reports/
task-dispatch-system-architecture-spec-260815-1916-concepts-triggers-config-and-real-flows-report.md`
against marketing-cockpit's real `executor-registry.yaml`
(`docs/distillery/sources/marketing-cockpit.md`). The item's own
`docs/history/capability-executor-registry-unification/DISCUSSION.md#design`
reference has since been cleaned up from disk; the decisions above are
copied verbatim from the `.fgos/` event-log record against `tsk-in1`
(D1-D15). Related follow-up: `docs/explanation/
why-capacity-for-and-capability-fields-were-unified-and-mcp-tools-get-a-hand-back.md`
(`tsk-45f`, a narrower bug found the next day in the `for`/`capability`
field split this item introduced).
