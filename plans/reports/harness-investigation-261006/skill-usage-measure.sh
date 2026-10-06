#!/usr/bin/env bash
# Usage: skill-usage-measure.sh  -> per-skill repo reference count (outside skill trees) + transcript invocation count
cd /home/vantt/projects/forgentX
T=~/.claude/projects/-home-vantt-projects-forgentX
INV=$(grep -ho '"skill": \?"[^"]*"' $T/*.jsonl $T/*/subagents/*.jsonl 2>/dev/null | sed 's/"skill": \?"//;s/"$//;s/^fgOS://')
for d in $(ls .claude/skills | grep -v '^_' ); do
  n=${d#ak-}
  refs=$(git grep -l -E "(ak[:-]|ck:)$n([^a-z-]|$)" -- . ':!.claude' ':!plugins' ':!.agents' ':!upstreams' ':!archive' 2>/dev/null | wc -l)
  inv=$(printf '%s\n' "$INV" | grep -cx -e "$d" -e "$n")
  echo "$d refs=$refs inv=$inv"
done
