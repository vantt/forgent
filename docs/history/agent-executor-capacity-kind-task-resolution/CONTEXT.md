# agent-executor capacity kind:"task" resolution (tsk-3sw) — locked decisions

## Feature boundary

`capacities.<id>.kind` (`CAPACITY_KINDS`, `src/runner/dispatch.mjs`) has
had `"task"` in its vocabulary since `tsk-62v` but zero working
differentiation: a `kind:"task"` capacity resolves through the exact same
command/args spawn path as `kind:"cli"` — functionally identical today.
This item builds the real differentiation: a `kind:"task"` capacity can be
declared with only an `agentType` (a named agent definition) instead of
its own `command`/`args`, resolved into a real `claude --agent <agentType>`
invocation. It also simplifies the default `cli` vs `task` kind-resolution
framing itself (see this item's own `description` field, `fgos show
tsk-3sw`, for the full prior discussion trail this CONTEXT.md formalizes —
not reproduced verbatim here).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Scope this item to **Claude-only** for the `agentType`/`--agent` flag work. `resolveExecutorConfig`'s new agentType-only branch hardcodes `command: 'claude'` when building args from an `agentType` (never a provider-keyed lookup). Reason (YAGNI): no concrete non-Claude `agentType` consumer exists today — `judge-discovery` (the one real `kind:"task"` precedent) already declares its own `command`/`args` and needs no change. Live-verified evidence (recorded in `tsk-53h`, this item's own dependency) that Claude/`agy`/Codex each have a STRUCTURALLY DIFFERENT agent-dispatch shape (flag-based for Claude/`agy`, prompt-text-based for Codex, three different agent-definition file schemas) means a per-provider mapping is a real 3-way branch, not a trivial 2-way one — not worth building without a real consumer driving the requirements. Multi-provider generalization is `tsk-53h`'s own tracked follow-on, not this item's. |
| D2 | `--model {model}` is **omitted** from the args built for an agentType-only capacity — the named agent definition's own pinned `model:` frontmatter wins, unmodified by the work item's `tier`. Reason: live-verified (`--debug-file`, real dispatched-API-model log line) that an explicit `--model` flag overrides the agent definition's pinned model when both are present; omitting `--model` lets that pinned choice stand. Whoever authored a given agent definition (e.g. pinning `opus` for a review-heavy persona) already made a deliberate model choice for that persona — a work item's generic `tier` should not silently override it. This applies ONLY to the new agentType-only branch; every existing `command`/`args`-declaring capacity (`judge-discovery`, `submit-assist-classify`, the global `executor`/`executors.<tier>` blocks) is completely unaffected — none of them omit `--model` today, and this item does not touch them. |

## Pinned terms

- **cli-dispatch** / **task-dispatch** — mechanism names (not caller-
  identity names), per `tsk-53h`'s own pinned definition: cli-dispatch is
  the subprocess-spawn mechanism (`spawnWorker`/`resolveCapacityCli`);
  task-dispatch is native Agent/Task tool use inside a live Claude Code
  session. Already applied throughout `src/runner/dispatch.mjs`, its test,
  and the two capacity how-to docs (superseding an earlier "domain-1 /
  domain-2" framing).
- **agentType** — new `capacities.<id>` field this item introduces: names
  a Claude Code agent definition (`.claude/agents/<name>.md`) to invoke
  via `claude`'s own `--agent <name>` flag, in place of that capacity
  declaring its own `command`/`args`.

## Scout evidence

- `rg agentType src bin test docs` → zero hits. Confirms the field is
  genuinely new, not already partially wired anywhere.
- `rg byCapacity src/runner/dispatch.mjs` → confirms the exact precedence
  gate this item must extend: `const byCapacity = capacity &&
  (capacity.adapter || capacity.command) ? capacity : undefined;` — has no
  clause for `capacity.agentType` today, so an agentType-only capacity
  would silently fall through to `perTier ?? cfg.executor`, dropping
  `agentType` entirely with no error, until this item's own code change
  lands.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered and `present` — impact-analysis posture for this
  item's `executing` stage is **full**.
- `fgos list --id tsk-3sw` discovery field → empty; no prior
  `judgeDiscovery` verdict exists for this item to reconcile against.
- This item's own `description` field carries the full prior evidence
  trail these two decisions formalize: the live `claude --help`/`--agent`
  flag discovery, the `claude -p --agent code-simplifier --debug-file`
  model-precedence proof (both with and without `--model`), the
  `byCapacity` code trace, and the already-fixed `judge-decompose`
  allowedTools gap (commit `784bcbc`, unrelated to this item's own
  remaining scope but discovered during the same session). `fgos show
  tsk-3sw` is the canonical way to read that full trail.

## Outstanding, deferred to planning

- Exact shape of the new `resolveExecutorConfig` branch (where the
  agentType-only args template gets built from, e.g. deriving from
  `DEFAULT_RUNNER_CONFIG.executor`'s own args minus `--model`) —
  implementation shaping, `fgos-coding-planning`'s call.
- Whether `validateCapacityShape`'s static check for `agentType` (non-empty
  string when present, same pattern as `model`/`allowCrossProvider`) needs
  any additional shape rule — planning's call once the resolve-branch shape
  is fixed.
- Multi-provider `agentType` support (D1) — explicitly out of this item's
  scope, tracked as `tsk-53h`'s own follow-on per that item's `CONTEXT.md`.

## References

- `docs/explanation/agent-executor-capacity-aware-dispatch.md` — why the
  capacity mechanism exists.
- `docs/history/agent-executor-generalized-capacity-helper/CONTEXT.md`
  (`tsk-53h`) — this item's own dependency; the multi-provider evidence
  D1 cites lives there in full.
- `tsk-53h` — depends on this item completing first (its own D1).
