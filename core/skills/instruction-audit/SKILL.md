---
name: instruction-audit
description: >-
  Periodically audit a repository's agent instruction surface and its
  enforcement so coding agents get the smallest, sharpest, non-duplicated set
  of rules, and every rule that matters is backed by a mechanical check. Scans
  what each agent runtime (Claude Code, AGENTS.md readers such as Codex and
  omp/pi, Gemini, Cursor, Copilot) loads on every turn, finds content loaded
  twice, installer-written blocks, stale hand-copied projections, duplicate or
  broken hook registrations, rules with no check, and mines git history for
  duplicated code and unfinished migrations to find which missing rule or
  check let them in. Produces a ranked, evidence-linked report and a delta
  against the previous run. Use when the user asks to audit, clean up, or
  improve CLAUDE.md / AGENTS.md / rules / hooks, asks why agents keep
  ignoring a rule or keep generating duplicate code, after installing or
  upgrading an agent kit or tool that writes into instruction files, or on a
  periodic schedule. Read-only: it proposes changes, it does not apply them.
metadata:
  version: "0.1"
  ecosystem: forgent
  # Outside the fgOS product one-door boundary (Git spec §12): its own git calls are a named class.
  oneDoor: standalone
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: scripts/instruction-audit.mjs does the mechanical scan; without node the lanes measure by hand.
    git:
      kind: command
      command: git
      missing_effect: degraded
      reason: the forensics lane and git-ignored hook detection need git history.
---

# instruction-audit

Instructions are context, not enforcement. An agent follows a rule when the
rule reaches it at the moment it acts, is short enough not to drown, and is
backed by a check that fails when it is broken. This skill measures all three
and reports what to cut, merge, move, or turn into a check.

It works on any repository. Nothing here assumes fgOS; fgOS-specific notes are
marked as such.

Helper: `node <skill-dir>/scripts/instruction-audit.mjs [--root <dir>] [--json]`

## Invocation

| Invocation | What runs |
|---|---|
| `/instruction-audit` | Full audit: scan, four lanes, synthesis, delta against the last report |
| `/instruction-audit scan` | Step 1 only: the mechanical scan, presented in plain language |
| `/instruction-audit focus <topic>` | Full audit with every lane steered at one symptom (e.g. "agents keep duplicating code", "rule X is ignored") |

## Hard rules

- **Read-only.** Never edit instruction files, hooks, or settings during the
  audit. Every change goes into the report as a proposal; applying it is a
  separate request.
- **Fix at the generator, not the copy.** When a block was written by a tool
  (marker comments, installer manifests, a projection script), the proposal
  names the tool and the setting that writes it. A hand edit to generated
  output is undone by the next install or refresh.
- **Evidence on every claim.** `file:line`, commit hash, or command output.
  A finding with no evidence is dropped or listed as a question.
- **Check before you trust a lane.** Lane reports are model output; spot-check
  the two or three claims the recommendations rest on before writing them
  down. Correct earlier reports when a check disproves them.
- **Ask, don't assume, about ownership.** Uncommitted changes to instruction
  files may be the user's own or a just-run installer's. Report which tool
  most likely wrote them (timestamps, markers, manifests) and ask.

## Step 1: Mechanical scan

Run the helper with `--json`, keep the JSON for the delta in step 5, and read
the plain output. It reports, per runtime:

- the always-loaded files, their size, and an approximate token count;
- files reached more than once through `@imports`;
- paragraphs that reach the same runtime two or more times, with locations;
- generated marker blocks and every file each one appears in;
- Claude Code hook registrations that repeat for the same event and matcher,
  hooks whose script is missing or git-ignored and are not guarded (they break
  in fresh clones and worktrees), and absolute paths that do not exist or
  point into another checkout.

The scan is the floor, not the audit. It cannot see stale projections,
contradictions, missing rules, or why duplication happened.

## Step 2: Four lanes in parallel

Run the four lanes in [`references/lane-prompts.md`](references/lane-prompts.md)
as parallel read-only subagents, each given the scan output and the user's
focus. Without subagents, run them inline one after another.

fgOS projects: run `fgos dispatch decide --for research --needs-soul
--has-live-task-access` before spawning and follow its mechanism, as
[`../_shared/executor-dispatch-fallback.md`](../_shared/executor-dispatch-fallback.md)
describes.

| Lane | Question it answers |
|---|---|
| 1. Instruction surface | What does an agent actually read when it writes code, and why might a stated rule not be followed? |
| 2. Enforcement surface | Which rules have a mechanical check (hook, pre-commit, test, CI, doctor), and which have none? |
| 3. Forensics | Where did duplication or a "second door" actually happen, which commit introduced it, and which missing rule or check would have stopped it? |
| 4. External practice (optional) | What do current tool docs and practitioners recommend for this symptom? Skip on periodic runs unless the symptom is new. |

## Step 3: Synthesize

Write the report with [`references/report-template.md`](references/report-template.md).
Order the proposals by leverage, using these defaults unless evidence says
otherwise:

1. **A check beats a rule.** Turn the most-violated rule into a test, a
   pre-commit step, or a blocking hook with an actionable message. The test
   suite or CI is the final gate because it applies to every agent runtime;
   hooks are early feedback for one runtime.
2. **Put the rule where the writer reads it.** Plan-time-only rules do not
   reach the implementing agent or an out-of-process worker; move them into
   the implement step or worker contract.
3. **Generate projections, don't copy them.** A hand-copied list of laws,
   commands, or counts drifts from its source; generate it and add a check
   that fails on drift.
4. **Cut and dedupe the always-loaded layer.** Remove double-loaded blocks at
   their generator, move area-specific rules into path-scoped rule files or
   nested AGENTS.md, and delete prose that a mechanical check already
   enforces down to a one-line pointer.
5. **Resolve contradictions explicitly.** When two rules pull in opposite
   directions (for example "keep changes scoped" versus "clean up what you
   find"), state which wins and when.

Every proposal names the principle or rule it serves, the evidence, and the
exact file or generator to change.

## Step 4: Decision questions

Collect every choice that belongs to the user (which installer target to keep,
whether to add a dependency, whether to promote a principle to a locked rule)
into one batch at the end of the report, each with situation, cause, options
with cost, recommendation, and scope. Decide yourself everything the evidence
already settles.

## Step 5: Delta and cadence

Save the scan JSON next to the report (same basename, `.json`). On the next
run, compare against the most recent previous JSON and lead the report with
what changed: always-loaded bytes, duplicate groups, hook duplicates, new
marker blocks, findings resolved and findings new. A periodic run with no
change is a one-paragraph report.

Good moments to run: after installing or upgrading any agent kit, plugin, or
indexer that writes into instruction files; after a burst of agent-written
code; monthly otherwise. For an unattended schedule use the host's scheduler
(for example the `schedule` or `loop` skills) with `/instruction-audit`.

## Report location

Use the repository's own convention for reports. fgOS projects: resolve the
path with `fgos convention path` (type `research`, slug
`instruction-audit`). Elsewhere: the project's plans or reports directory,
or ask once and remember the answer.
