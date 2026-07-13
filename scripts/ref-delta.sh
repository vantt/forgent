#!/usr/bin/env bash
# Show what changed in a learning source since the last analyzed commit.
# Usage: scripts/ref-delta.sh <source-name>
# Reads last_analyzed_commit from docs/references/sources/<source-name>.md
# Only handles type: git-repo — paper/living-doc sources have no git delta.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <source-name>" >&2
  echo "Available sources:" >&2
  ls -1 docs/references/sources/ 2>/dev/null | sed 's/\.md$//' >&2
  exit 1
fi

proj="$1"
doc="docs/references/sources/$proj.md"
repo="references/$proj"

[ -f "$doc" ] || { echo "Missing index doc: $doc" >&2; exit 1; }

src_type=$(grep -m1 '^type:' "$doc" | awk '{print $2}')
if [ "$src_type" != "git-repo" ]; then
  echo "== $proj: type '$src_type' has no git delta =="
  echo "paper: extract once (check extracted_date); living-doc: compare changelog/version manually."
  exit 0
fi

[ -d "$repo/.git" ] || { echo "Missing clone: $repo (clone the repo there first)" >&2; exit 1; }

last=$(grep -m1 '^last_analyzed_commit:' "$doc" | awk '{print $2}')

# Domain coverage check: taxonomy (design doc) vs domains_covered (frontmatter).
# A domain added to the taxonomy after this project's last scan needs a
# backfill pass over the current HEAD tree (no history replay needed).
design_doc="docs/reference-learning-system.md"
taxonomy=$(sed -n '/^## Taxonomy/,/^## [^T]/p' "$design_doc" | grep -oP '^- `\K[a-z-]+' || true)
covered=$(grep -m1 '^domains_covered:' "$doc" | sed 's/^domains_covered:\s*\[\(.*\)\]/\1/' | tr -d ' ' | tr ',' '\n')
missing=$(comm -23 <(sort <<<"$taxonomy") <(sort <<<"$covered") | grep -v '^$' || true)
# Suppress when never analyzed — the upcoming full scan covers every domain anyway.
if [ -n "$missing" ] && [ -n "$last" ] && [ "$last" != "null" ]; then
  echo "== $proj: domains needing BACKFILL (scan HEAD tree for these only) =="
  echo "$missing" | sed 's/^/  - /'
  echo
fi

git -C "$repo" pull --ff-only --quiet 2>/dev/null || echo "(warn: pull failed, using local state)" >&2
head_commit=$(git -C "$repo" rev-parse --short HEAD)

if [ -z "$last" ] || [ "$last" = "null" ]; then
  echo "== $proj: never analyzed — FULL SCAN needed =="
  echo "Current HEAD: $head_commit"
  git -C "$repo" log -1 --format='%h %ad %s' --date=short
  echo
  echo "Top-level layout:"
  git -C "$repo" ls-tree --name-only HEAD
  exit 0
fi

if [ "$(git -C "$repo" rev-parse --short "$last")" = "$head_commit" ]; then
  echo "== $proj: up to date (last analyzed = HEAD = $head_commit) =="
  exit 0
fi

echo "== $proj: commits since $last =="
git -C "$repo" log --oneline --date=short --format='%h %ad %s' "$last..HEAD"
echo
echo "== Changed files =="
git -C "$repo" diff --stat "$last..HEAD"
echo
echo "After analysis, update last_analyzed_commit in $doc to: $head_commit"
