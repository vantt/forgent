#!/usr/bin/env bash
# Recapture the six shaper goldens for the description change of core/agents/shaper.yaml (phase 5 of plan
# 261125-1557-shaper-worktree) and name the change in goldens/NOTES.md. Run from the root of the p08 worktree:
#   bash /home/vantt/projects/forgent/plans/261125-1557-shaper-worktree/reports/recapture-shaper-goldens.sh
# It refuses unless each golden holds the old phrase exactly once, and it changes nothing else.
set -euo pipefail
G=packages/agent-start-context/goldens
OLD='it lands only its own discussion file'
NEW='it saves each round on its own discussion branch in its own worktree and lands that branch once'
FILES=("$G/agent-file/shaper.md" "$G/opening/shaper-plain.txt" "$G/opening/shaper-task.txt"
       "$G/opening/shaper-task-coding.txt" "$G/opening/shaper-handoff.txt" "$G/opening/shaper-question.txt")
# The persona file must already carry the new text (folded YAML joins its lines with spaces).
tr '\n' ' ' < core/agents/shaper.yaml | tr -s ' ' | grep -qF "$NEW" || { echo "core/agents/shaper.yaml lacks the new description" >&2; exit 1; }
for f in "${FILES[@]}"; do
  n=$(grep -cF "$OLD" "$f" || true)
  [ "$n" = 1 ] || { echo "$f: expected the old phrase once, found $n" >&2; exit 1; }
done
for f in "${FILES[@]}"; do
  OLD="$OLD" NEW="$NEW" perl -0pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/' "$f"
done
python3 - "$G/NOTES.md" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
line = ("- 2026-11-27: the shaper agent file and its five openings (6 goldens), because `core/agents/shaper.yaml`'s\n"
        "  description now says the shaper saves each round on its own discussion branch in its own worktree and lands that\n"
        "  branch once (plan 261125-1557-shaper-worktree, phase 5). Only the description text differs.\n")
if line in s:
    sys.exit(0)
head, sep, tail = s.partition("## Recaptured\n")
if not sep:
    sys.exit("NOTES.md has no '## Recaptured' section")
# Append the line at the end of the Recaptured list (before the next heading, or at the end of the file).
nxt = tail.find("\n## ")
body, rest = (tail, "") if nxt < 0 else (tail[:nxt + 1], tail[nxt + 1:])
body = body.rstrip("\n") + "\n" + line
open(p, "w").write(head + sep + body + ("\n" + rest if rest else ""))
PY
git diff --stat -- "$G"
