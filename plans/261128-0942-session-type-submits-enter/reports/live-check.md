# Phase 4 live check: `fgos session type` on a real Claude Code head

Verdict: **pass** on the third run. Criterion 4 is met. One `fgos session type` call submitted the check line, and
the head ran a turn and replied `ok`. Nobody sent a second `\r`.

Machine: fg-server2. Release `f3dffeb5`, built from main `70e53c73a2`. Head: `head:shaper-probe-0853-check2`
(Claude Code 2.1.332, pane `w6:p2MT`), started by the supervisor for this check and stopped after it. The
supervisor ran the host steps. All captures are in `captures/live-check/`.

## The passing run (rerun2)

The answer (`rerun2-type-answer.json`), exit 0, with empty stderr (`rerun2-type.err`):

```json
{ "session": "claude-4jvx@fg-server2", "submitted": true }
```

Before (`rerun2-before.read.json`, bottom of the screen): the head is idle after its start-up turn, and its composer
is empty.

```text
✻ Baked for 30s · done 7:52 PM

───────────────────────────────────────────────────
❯
───────────────────────────────────────────────────
  🤖 Opus 5.5 - 9%  ⌛ 5h 15% (2h43m)  wk 2% (4d…
  ⏵⏵ bypass permissions on (shift+tab to cycle)
```

After (`rerun2-after.read.json`): the line was submitted, the head ran a turn and replied `ok`, and its composer is
empty again.

```text
✻ Baked for 30s · done 7:52 PM

❯ Reply with the single word ok.

● ok

✻ Cooked for 1s · done 8:17 PM

───────────────────────────────────────────────────
❯
───────────────────────────────────────────────────
```

## The two failed runs, and the fixes they led to

Both failed runs refused `unknown` with "nothing was typed". So the gate held, and no text reached either pane. Each
failure exposed a real gap. Each gap was fixed, reviewed and landed before the next run.

| run | release | head | answer | cause | fix (landed) |
|---|---|---|---|---|---|
| 1 | 389b328d | `head:shaper-probe-0853-check` | `unknown` (x2) | (a) The verb read the head's Claude version from `<caller CLAUDE_CONFIG_DIR>/sessions/<host pid>.json`. A confined head keeps that file in its own confinement home, under its namespaced pid (`.../home/sessions/2.json`), so no version was read. (b) Claude's prompt suggestion is drawn faint (`ESC[2m`, `captures/live-check/probe.ansi.txt`). herdr's detector quotes it as the prompt text (`probe.explain.json`), so the composer gate would have read a draft. | `a27546744d`: the version is read from the head process's binary (`.../claude/versions/<v>`), guarded by `judge_here`. Heads start with `promptSuggestionEnabled: false`. |
| 2 | 0de56517 | `head:shaper-probe-0853-check2` | `unknown` | The suggestion was gone and the composer was empty (`rerun-probe.ansi.txt`, `rerun-probe.explain.json`: `idle`, evidence `❯`). But the confined head's identity record carries `cliSession` with no `pid` or `startTime`, so there was no process to read a version from. | `70e53c73a2`: the verb versions the process in the pane it types into. The pane's foreground process is Claude itself: host pid 2309026, exe `.../claude/versions/2.1.332` (`rerun-process-info.json`, `rerun-ps-forest.txt`, `rerun-exe.txt`). |

The fix briefs are `fix-claude-head-version.md` and `fix-session-type-version-from-pane.md` in this directory.

## O1: does herdr `pane send-text` replace or append to existing composer text?

Not answered. The phase 1 half-typed frames were all typed into an empty composer (`phase-01-capture.md`), and all
three live-check runs found or kept an empty composer. No capture shows `send-text` meeting text that was already in
the composer. D4 holds either way: the gate refuses `composer-not-empty` before it types.
