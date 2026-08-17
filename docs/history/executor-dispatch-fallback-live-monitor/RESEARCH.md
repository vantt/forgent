# RESEARCH.md — tsk-37ij (Step B live-visibility fix)

## Round 1 — 2026-08-17

**Asked:**
1. Is `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` the only
   real copy of this fragment, or are there mirrors that also need this
   edit?
2. What is the technically correct Claude Code tool mechanism for a live
   agent session to surface `dispatch.mjs execute`'s already-live stderr
   tee (`dispatch.mjs:2154`) to a human watching the session in real time?

**Checked:**
- `find . -iname "executor-dispatch-fallback.md"` (run twice: once in
  tsk-1ep's worktree, once fresh in this item's own worktree, right after
  `EnterWorktree`) — both times returned exactly one hit:
  `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`. **This was
  wrong** — `npm test` (`test/skills/fgos-mirror.test.mjs`) caught it
  after the implement step: `.agents/skills/_shared/executor-dispatch-
  fallback.md` genuinely exists (`git ls-files` confirms it is tracked,
  real commit history: `c681f353`/`cea6e219`), and is byte-identical to
  the plugin copy per `fgos-mirror.test.mjs`'s own assertion — until this
  item's edit landed on the plugin copy only. Root cause of the `find`
  miss is unconfirmed (re-running the identical `find .` a third time,
  later in the same worktree, correctly returned both files) — possibly
  a stale directory-entry cache immediately after `EnterWorktree`'s own
  `git worktree add`, possibly something else; not chased further since
  the actionable fix (sync both files, verified via `fgos-mirror.test.mjs`
  passing) does not depend on the root cause. **Lesson applied going
  forward: run the FULL `npm test` once against a freshly claimed item's
  branch before trusting a narrow `find`/`grep` scan to have found every
  real file needing an edit** — the same class of gap `tsk-1ep`'s own
  citation-drift baseline correction already surfaced once this session,
  now confirmed as a repeatable risk, not a one-off.
- Live-verified this same conversation, twice (tsk-52z, tsk-1ep): a
  native agent session calling `node src/runner/dispatch.mjs execute ...`
  through the plain (synchronous, foreground) Bash tool call gets the
  ENTIRE captured stdout+stderr back as one block only once the whole
  child process (`agy`) exits — nothing is relayed to the chat while it
  runs, even though `dispatch.mjs`'s own CLI path already tees the
  child's live output to its OWN stderr as it happens
  (`dispatch.mjs:2154`: `onChunk: (stream, chunk) =>
  process.stderr.write(chunk)`, tsk-129's feature). The live-tee is real;
  the caller (a synchronous Bash call) just never relays it.
- Read the `Monitor` tool's own schema/description in full (fetched via
  `ToolSearch`). Key correction to an earlier, imprecise claim made
  informally in this same conversation ("Bash `run_in_background` +
  Monitor"): **Monitor is not a way to watch an existing
  `run_in_background` Bash process** — it runs its OWN `command` and
  treats each stdout line of THAT command as a live event/notification.
  Bash `run_in_background` alone gives exactly ONE completion
  notification, not per-line streaming (per the tool's own doc: "Only
  use this if you don't need the result immediately and are OK being
  notified when the command completes later" / "For one-shot 'wait until
  done,' use Bash with `run_in_background` instead"). The correct
  mechanism for genuine per-line live visibility is to give Monitor the
  `dispatch.mjs execute ...` invocation itself as its `command` — Monitor
  only reads stdout as its event stream, so `2>&1` is required to fold
  `dispatch.mjs`'s live-teed stderr into that stream (per Monitor's own
  doc: "Only stdout is the event stream... for a command you run
  directly... merge stderr with `2>&1` so its failures reach your
  filter").
- Confirmed `execute`'s CLI usage still accepts `--has-live-task-access`
  unchanged (checked this same conversation's earlier
  `dispatch.mjs execute --help` output): no flag/argument shape change
  needed, only the *invocation channel* (Monitor vs. plain Bash) changes.

**Found:**
- One file to edit: `plugins/fgOS/skills/_shared/executor-dispatch-
  fallback.md`'s Step B.
- Correct instruction: run the `execute` command via the **Monitor**
  tool directly (`command` = the same `dispatch.mjs execute ...`
  invocation, with `2>&1` appended), not via a plain synchronous Bash
  call — this is the real, intended relay channel, not a workaround.
- No other doc in the repo currently instructs this; this is a genuinely
  new instruction, not a drift/sync fix like tsk-1ep's baseline issue.

**Open:** none — both points resolved with direct evidence gathered this
same session (live-verified twice) plus the tool's own documented
contract.
