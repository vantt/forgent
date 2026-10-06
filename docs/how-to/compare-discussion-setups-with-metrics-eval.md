# Compare discussion setups with metrics eval

Use a blind judge to compare two **real** discussion outputs for the same
question. This measures the submitted deliverables; it does not prove one
protocol or provider generally superior. One judge and one question are
**directional evidence**, not a benchmark. Repeat across questions, swap neutral
labels and repeat judging before drawing a general conclusion.

Contract owners:
[`observe.eval.v1`](../../packages/observe/contracts/observe.eval.v1.json),
[`eval_journal`](../../packages/observe/rust/src/eval_journal.rs), and
[`metrics eval`](../../packages/observe/rust/src/metrics_cli/eval.rs).
Use [discussion-quality.v1](../reference/discussion-quality-rubric.md) without
changing its five criteria or anchors between outputs.

## 1. Prepare a fair comparison

Pin the exact question, rubric version, repository revision, output scope and
setup descriptions before running. A setup identifier should resolve to its
protocol/pattern, personas, role tasks, provider/model per seat, actual fallback
chain and synthesizer. Preserve unit/attempt run IDs for `runRefs`; do not guess
report filenames or substitute a planned provider for the one actually used.

Run both current setups on the same question with the same evidence access.
Use either final synthesis only for both, or the same complete packet for both.
Neither arm may read the other's outputs, assignments, summaries or prior
scores. Different providers or running the solo later does not establish
independence. Use enforced blind read boundaries or separate immutable evidence
copies; verify the boundary before interpreting the scores as a setup comparison.
Failures and policy refusals are real outcomes: do not replace them with a
historical successful output without recording that different comparison.

### Historical question and references

The actual 2026-10-04 question is the `objective` in
[`unit.json`](../../plans/reports/council-lens-experiment-261004/unit.json):

> Should fgOS add a mechanical dissent/agreement gate to the panel pattern, or
> is provider-distinct panelists plus the reviewed pattern's red-team already
> enough?

Reuse the **entire** objective (including evidence request and word limit), not
only the shortened question above:

```bash
jq -r '.objective' plans/reports/council-lens-experiment-261004/unit.json
```

Prior outputs, for coordinator calibration **outside the judge workspace**:

- [Council final verdict](../../plans/reports/council-lens-experiment-261004/outputs/ab-council-chairman-verdict.md)
- [fgOS pre-fix synthesis](../../plans/reports/council-lens-experiment-261004/outputs/ab-fgos-synthesizer.md)
- [fgOS post-fix synthesis](../../plans/reports/council-lens-experiment-261004/outputs/ab2-fgos-synthesizer-after-fix.md)
- [Comparison and limitations](../../plans/reports/council-ab-comparison-261004.md)

These are historical references, not substitutes for fresh current-setup runs.
The post-fix export contains a claim envelope and assignment paths; passing
that wrapper only on one side would repeat the old format confound.

## 2. Blind the judge; distinguish data blindness from isolation

Create a fresh scratch directory **outside `.fgos` and outside the project**,
under `/var/tmp`, not `/tmp` (for example,
`scratch=$(mktemp -d /var/tmp/discussion-judge.XXXXXX)`). The confined launch
mounts an empty tmpfs over `/tmp`, so a `/tmp` scratch is invisible inside the
sandbox. Confirm the actual SDK cwd in the judge's init event equals the
scratch path. It must contain
only two regular files: `A.md` and `B.md`. Make real copies, not symlinks. Keep
the A/B-to-setup mapping, run metadata, existing scores and output exports
elsewhere. Randomize the mapping before judging.

Normalize only identity-bearing wrappers, attribution, headers and absolute
assignment paths. Apply the same rule to both files; preserve reasoning,
dissent, uncertainty, citations and next steps. Do not improve one output's
content. Record the normalization policy outside the scratch directory.

Check the workspace once before the judge starts:

```bash
find "$scratch" -mindepth 1 -maxdepth 1 -printf '%f %y\n'
```

The expected inventory is exactly `A.md f` and `B.md f` (either order).
No score file, mapping, rubric file, `.fgos`, `.claude`, historical `ab-*`
output, project instruction file or symlink belongs there. A `blind` runner
flag alone is insufficient: it does not hide accessible tracked evals or
previous outputs.

Start a fresh, non-resumed Opus session with scratch as cwd. Supply only the
exact shared question, fixed rubric/anchors and neutral output contents.
**Data blindness** means no setup mapping or prior scores enter the prompt and
no tool calls retrieve them. It does not mean tools, hooks, MCP, skills or
user instructions were unavailable.

The default `claude` executor uses `-p {prompt} --model {model}
--permission-mode acceptEdits`. `dispatch execute` has no pass-through for
extra Claude flags. Do not attach a flags list to a report and assume it was
applied, or bypass the project's dispatch door with a raw provider command.
Until an explicitly configured invocation has been exercised and audited,
describe this judge as **data-blind, not isolated**.

For real isolation, declare a separate CLI invocation/executor in runner
configuration. Check the installed `claude --help`: the tested version exposes
`--safe-mode`, `--no-session-persistence`, `--tools`, `--strict-mcp-config`,
`--mcp-config`, `--setting-sources` and `--disable-slash-commands`. The intended
values include an empty tools list, empty MCP server map and no user/project/local
setting sources. `--safe-mode` still permits admin-managed policy; do not
claim that every setting is disabled. `--bare` is a different mode that skips
OAuth/keychain authentication, so it is not an interchangeable switch.

The 2026-10-06 [availability canary](../../plans/reports/observe-independent-comparison-261006/isolation-canary.json) is not an A/B judgment. The later [actual comparison judge](../../plans/reports/observe-independent-comparison-261006/completion-judge-evidence.json) retains applied argv and SDK capabilities; its two-file before/after inventory is a coordinator-authored assertion, not an independently retained listing. That judge profile was a temporary configuration, not a committed one: re-declare and re-audit it each time. Three builtin plugins remain; no complete hidden-instruction inventory is claimed. Native Unit prepared argv/cwd do not alone prove effective execution: compare actual SDK initialization and execution evidence. `dispatch execute` chooses the first CLI invocation when no invocation ID is supplied; editing only a differently named profile does not apply its flags. Preserve referenced IDs and verify the invocation actually selected before a paid run.

A confined Pi worker needs a provisioned writable private authentication runtime: ordinary Pi CLI reads take an adjacent auth-file lock. Redirecting its agent directory without provisioning does not supply credentials. Inspect the owning project's public runner projection for an existing account-backed private-home profile (`PI_CODING_AGENT_DIR` for Pi, `HOME` for agy) and let fgOS's declared account inventory/driver provision the allowlisted files opaquely. Do not manually read/extract/copy credential contents or silently widen host credential-write grants. The earlier readonly failure was configuration, not quota exhaustion or an absent platform mechanism.

Source independence is stronger than hiding sibling runs: old comparisons can still be present in a readable source repository. Use the same immutable current-source packet for both arms, hide previous reports/scores, and audit actual reads. A passing output contract is not evidence that an arm stayed independent; discard contaminated output rather than relabel it or trim its reasoning.

Distinguish two levels and name the one you achieved. **Read-audited**: raw tool calls show no seat read the other arm's output or prior results. **Sandbox-isolated**: no seat *could* read them, because every seat's confinement masks every repository that holds outputs, evidence or prior scores (not only the owning project's run trees). The [completed reference comparison](../../plans/reports/observe-acceptance-fixes-261006.md#cập-nhật-sau-nghiệm-thu-lần-hai) is read-audited only: only one seat masked the evidence repository, and a coordinator file holding one arm's position summary was readable when the other arm launched. Also check what the source packet already concludes: a packet that quotes a decision settled after the historical run changes the evidence condition, even when the question text is byte-identical.

Run from the target project using the fgOS source entry, with a configured
judge executor and explicit separate project root and scratch cwd:

```bash
node /home/vantt/projects/forgentX/bin/fgos.mjs dispatch decide "$judge_executor" \
  --cwd "$scratch" --repo-root "$project_root"
node /home/vantt/projects/forgentX/bin/fgos.mjs dispatch execute "$judge_executor" \
  --prompt-file "$judge_input" --model opus --tier flagship \
  --cwd "$scratch" --repo-root "$project_root"
```

Execute only if `decide` returns out-of-process; follow its returned mechanism
otherwise. A name alone does not configure an isolated invocation. Preserve
the effective prepared argv, model/session identity and actual transcript or
stream outside scratch. Audit available tools/MCP, loaded instruction and hook
events, and actual tool calls separately. No `--continue`, `--resume`,
`--add-dir`, source-reading tools or fallback model. If Opus is unavailable,
stop rather than silently change judges.

Assemble `$judge_input` outside scratch: full shared objective, rubric wording
and anchors, then `BEGIN A`, contents of A, `END A`, `BEGIN B`, contents of B,
`END B`. Keep output and persisted inventory/hashes outside scratch too.
An inventory assertion in a coordinator-authored JSON is not an independently
retained listing. Repeat in a new session with swapped A/B labels for stronger
evidence.

## 3. Record only the real judgments

Check host support without writing a record:

```bash
fgos metrics eval list --dir /absolute/project/root
```

An old host fails with `unknown metrics subcommand "eval"`; this is not an empty
successful list. Build/stage a current host, or use its binary directly. Setting
`FGOS_HOST_BIN` affects Node host helpers; invoking `target/debug/fgos` directly
avoids accidentally using the old installed release.

After reviewing the judge output, restore the A/B mapping **outside the judge
session**. Produce one stdin JSON object per evaluated setup, with unique
`evalId`, free harness label, the shared `question` string, setup ID, the five real
scores, rubric ID, judge run/setup ID, and the actual `runRefs` array. Exclude
`v`, `type` and `ts`: Observe owns the envelope and capture time. Keep the judge's
quoted rationale in the comparison evidence report linked by your judge ID.
Qualify project-scoped runRefs: include the absolute owning project root in
`setup` when the journal lives elsewhere. Disclose question deviations, prior
result access and actual judge capabilities in `setup`/`judge`; real scores do
not become an independent comparison simply because recording succeeded.
Do not fabricate scores to make an example or a failed live run look complete.

```bash
# eval-a.json / eval-b.json contain the two real, mapped judgments.
/absolute/path/to/current/fgos metrics eval record --dir /absolute/project/root < eval-a.json
/absolute/path/to/current/fgos metrics eval record --dir /absolute/project/root < eval-b.json
# --question must equal the stored string exactly; here, the full historical objective.
q="$(jq -r '.objective' plans/reports/council-lens-experiment-261004/unit.json)"
/absolute/path/to/current/fgos metrics eval list --question "$q" --dir /absolute/project/root
/absolute/path/to/current/fgos metrics eval list --harness=fgos-panel --question="$q" --dir /absolute/project/root
```

`--harness` and `--question` are exact-match, intersecting filters: `--question`
compares the whole stored `question` string, with no prefix, ID or substring
matching. Pick one form of the question (a short ID or the full text) before
recording, and use the same string when filtering. Inspect the
`fgos.v1` envelope's `data.evals` **and** `data.invalid`: an out-of-range or
malformed tracked line is reported with shard/line/error and never contributes
scores, even when it would not match the filters. Fix the evidence source;
do not interpret invalid data as a low score or overwrite history to make it
pass. There is no case lifecycle or one-open-case restriction for evals.

Compare only complete score vectors sharing the same question, output scope,
rubric version and judge procedure. Keep costs, elapsed time, fallback effects
and passive agreement separately visible; a quality total is not a latency
or independence measure. Commit only real evaluation records, never synthetic
test data or judge identity mappings intended to remain hidden.
