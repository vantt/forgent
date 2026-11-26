# Gather fgOS rules to one owner: rerun 6 (independent audit)

Date: 2026-11-27 (Asia/Saigon). This is a read-only audit of the worktree
`/home/vantt/projects/forgent-worktrees/261125-2041-gather-fgos-rules-to-one-owner-p01r6` (branch
`gather-rules/p01r6`, HEAD `73a8590d3`). No file in the worktree was edited. All line numbers are from the source files
on disk at that HEAD.

## Verdict

Yes, one item remains beyond the kept-by-design list. It is a stale and conflicting statement about claim release at
the `planning`→`executing` edge. Three coding stage-skill sentences say a verb releases the claim back to `todo`,
but the code retired that behaviour, and two other passages (one of them in the same file) already say so. See
Task 2 (b)1. All four items that rerun 5 left open are fixed. No `Rule:` pointer is dangling, and no cited repository
path in the corpus is missing.

## Task 1: the four items rerun 5 left open

| Rerun-5 item | Status | Evidence |
|---|---|---|
| (a)1 Run selector rules written in both `fgos-run/SKILL.md` and `fgos-cook/references/case-and-doors.md` | Fixed | `core/skills/fgos-cook/references/case-and-doors.md:85-88` now keeps only the local instruction (pass `--pattern`/`--params`/`--param` only to change the degree) and says that when `--reason` is needed and what the pin records "are set once in `../../fgos-run/SKILL.md` (step 2)". The pointer resolves to `core/skills/fgos-run/SKILL.md`, and from both render surfaces to `.agents/skills/fgos-run/SKILL.md` and `plugins/fgOS/skills/fgos-run/SKILL.md`. Step 2 of Mode A holds the rules at `core/skills/fgos-run/SKILL.md:26` (inherit the activity's `unit`, `--reason` for a params request or a swap, the same selector is not a swap, and what the pin records). The rules now live in one place. |
| (a)2 Authority-map admission sentence in both `_shared/plan-contract.md` and `fgos-coding-validating/SKILL.md` | Fixed | `domains/coding/skills/fgos-coding-validating/SKILL.md:112-114` now reads "What this review admits, and what still needs the owner's answered question, is set in `../_shared/plan-contract.md` (Authority map)." The sentence is stated only in `core/skills/_shared/plan-contract.md:145-149`. The relative path has no source-tree target (`domains/coding/skills/_shared/` does not exist). It resolves in both render surfaces (`.agents/skills/_shared/plan-contract.md`, `plugins/fgOS/skills/_shared/plan-contract.md`), the same as the existing pointer on :107. One small precision issue: the file has two "Authority map" places, §3 item 4 (:68-75, the map's shape) and the §5 Rules bullet (:145-150, the admission sentence). The pointer does not say which one, so a reader may land on §3 first. This is not counted as a finding. |
| (b)1 Rule 2 of `coding-worktree-safety` said the merge "would destroy the live event log" | Fixed | `domains/coding/instructions/coding-worktree-safety.md:20` now says "`-A` stages every tracked `.fgos/` file as deleted and the merge would delete main's config, effective rules and seal pointer". The text matches `git ls-files .fgos` (config files, `.fgos/instructions/effective/rules.json`, `.fgos/events`, plus project, distribution, gate-bypass, docs-index and observe files). The list gives examples and does not claim to be complete, which is accurate. The compiled body in `.fgos/instructions/effective/rules.json` matches the source (checked: all 27 unit bodies equal their source files minus front matter). |
| (b)2 Line citation `src/state/work.mjs:24` in `_shared/executor-dispatch-fallback.md` | Fixed | `core/skills/_shared/executor-dispatch-fallback.md:158` now cites `ID_PATTERN` (`src/state/work.mjs`) by file only. The constant exists at `src/state/work.mjs:27`. No `path:line` citation remains anywhere in the corpus (searched for `*.{mjs,rs,md,json,yaml,sh,js}:<n>`). |

## Task 2: fresh sweep

The corpus is 130 files, the same set as rerun 5: the hand-written top of AGENTS.md, `core/instructions`,
`components/*/instructions`, `domains/*/instructions`, `core/skills/**`, `domains/*/skills/**`, `core/agents/*` and
`core/prompt-templates/*`. A script listed every `Rule: <id>` pointer and every backticked or linked path, and
resolved each path against the repository root, the file's own directory and both render surfaces. A second pass
compared every sentence with every other sentence, after replacing the standard pointer text with a placeholder
(Jaccard >= 0.5 gave 132 cross-file pairs). I read each pair and judged it by meaning.

### (a) A rule written in two places, neither a pointer

No new finding. The pairs found are:

- skill bodies against their own `references/` detail files;
- the coding stage-skill mechanics already listed as rerun-5 (a)3, which is out of scope by decision: the
  `lock-timeout` stop reason, the `gate-check` mechanics, the "no open call" stop and the reclaim blocks;
- kept-by-design items: persona and agent yaml against the head skills, the advise/group-thinking family, the
  council and architecture-panel templates, the `authority: inactive` lines, "a wake is one turn", the report-path
  lines and per-role ticket waits;
- local reads of a door's output, such as `case-and-doors.md:108` reading `data.results[-1]...`.

One more near-verbatim pair belongs to the same procedure-text class and is not counted. It describes how the `fgos`
shell function appends `--dir "$root"` from a linked worktree, and it appears at
`core/skills/fgos-routing/SKILL.md:76` and `domains/coding/skills/fgos-coding-implement/SKILL.md:53`. The function
exists in `scripts/fgos-shell-integration.sh`. That file says it is opt-in and that "no install step in this repo
sources it" (:9-11). The owner may want to know that both copies present this as automatic.

### (b) Stale or conflicting statements about current code

1. **Claim release at the `planning`→`executing` edge (Low, new).** Three passages say a verb releases the item's
   claim:
   - `domains/coding/skills/fgos-coding-planning/SKILL.md:69-73`: "Commit `plan.md` ... before this session ... calls
     `fgos discover` — that call releases the claim once the item reaches `executing`".
   - `domains/coding/skills/fgos-coding-exploring/SKILL.md:61-64`: the same sentence for `CONTEXT.md`.
   - `domains/coding/skills/fgos-coding-validating/SKILL.md:78-80`: "`fgos plan` — the call that actually fires the
     `planning`→`executing` edge and releases the claim back to `todo`".

   The code retired that release. At `src/intake/plan.mjs:482-485`, `releaseClaimOnExecuting` is a no-op, and the
   comment there reads "tsk-40m D5: releaseClaimOnExecuting retired ... the planning->executing edge no longer needs to
   release a durable doing status back to todo". Two skill passages already state the current behaviour:
   - `domains/coding/skills/fgos-coding-validating/SKILL.md:177-179`: "A runtime claim now stays active unbroken
     through `clarify → executing` (tsk-40m) — `releaseClaimOnExecuting` was retired, so the `fgos plan` call no
     longer releases the claim".
   - `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md:19-22`: the same statement.

   So validating contradicts itself between :78-80 and :177-179. Planning and exploring also name the wrong verb:
   `fgos discover` is the discovering stage's verb, and validating:79 says `fgos plan` fires the edge. The advice to
   commit before the edge may still hold for other reasons, but the stated reason (claim release) is stale.

Checked and consistent:

- The four rerun-5 fixes above.
- The rule units' cited doors exist: `npm run fgos:dev`, `setup:hooks`, `build:skills` and `test` are in
  `package.json`; `src/runner/execution/bind.mjs`, `apps/fgos-gateway/src/mcp.rs`,
  `packages/distribution/contracts/doctor-registry.v1.json`, `test/architecture.test.mjs`,
  `packages/component-authority/model/`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
  and `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md` all exist.
- `.fgos/instructions/effective/rules.json` is in sync with all 27 sources.
- Every `repo`-scope body appears verbatim in AGENTS.md.

### (c) Rule pointers

None is dangling. There are 119 `Rule: <id>` occurrences naming 17 distinct ids, the same set as rerun 5. Every id is
in `rules.json` with scope `repo` and has a `- id:` entry in AGENTS.md (24 entries, one per `repo` unit). Every
occurrence carries "set in .fgos/instructions/effective/rules.json" on the same or the next line. No pointer claims
that a `domain` or `component` unit (coding-worktree-safety, coding-verification-discipline, docs-only-verification)
is in AGENTS.md.

### (d) Cited repository paths that do not exist

No real misses. Each unresolved token is one of the classes rerun 5 already accepted:

- bare artifact names;
- module short names whose file exists;
- retired Node paths labelled as retired (`fgos-run/SKILL.md:11,27`, `capability-matching.md:23`,
  `capability-catalog.md:95`, `executor-dispatch-fallback.md:293-294`);
- runtime or project-side paths (`.fgos/logs/`, `.fgos/runtime/tmp/`, `.fgos/installation/activation.json`,
  `.fgos/authority/model/`, `fgos/agents/`, `upstreams/`, `decisions/`, `reports/`);
- payload-root `repo/...` paths;
- examples;
- `/v1/contract`;
- `coding/feature`;
- `approve/SKILL.md` (a plugin-only skill);
- `../_shared/...` pointers that resolve in the render surfaces;
- the canonical-source note in `dispatch-decide-door.md:44`.

One observation falls outside the corpus. The GitNexus block of AGENTS.md (the generated section after the
hand-written top) cites `.gitnexus/run.cjs` (AGENTS.md:54) and six `.claude/skills/gitnexus/*/SKILL.md` paths
(AGENTS.md:85-90). None of these exists in this worktree or in the main checkout (`.claude/skills/*` is gitignored,
and no `.gitnexus/` directory is present). That block is regenerated by `gitnexus analyze`, and
`impact-analysis-capability-gate` says never to edit inside it. It is therefore not a gathering finding. It only
means the GitNexus skills have not been generated on this machine.

## Summary of what remains

- (b)1: stale claim-release statements at `fgos-coding-planning/SKILL.md:69-73`,
  `fgos-coding-exploring/SKILL.md:61-64` and `fgos-coding-validating/SKILL.md:78-80`. They contradict
  `src/intake/plan.mjs:482-485`, `fgos-coding-validating/SKILL.md:177-179` and
  `worker-contract-and-orient.md:19-22`. Severity: Low.
- Optional, not counted: the pointer at `fgos-coding-validating/SKILL.md:114` could name §5 Rules. The two
  shell-function sentences present an opt-in wrapper as automatic.

Status: DONE
Summary: All four rerun-5 items are fixed in 73a8590d3, with resolving pointers and no dangling rule pointer or missing path. One new Low item remains: three coding skills still say a verb releases the claim at the planning→executing edge, which the code retired (src/intake/plan.mjs:482-485) and which two other passages already contradict.
