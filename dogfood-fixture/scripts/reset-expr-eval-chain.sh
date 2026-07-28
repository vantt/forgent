#!/usr/bin/env bash
# Restores dogfood-fixture to baseline for scenarios/expr-eval-chain.md replays.
# Removes only the files that scenario generates — never touches anything else.
set -euo pipefail

cd "$(dirname "$0")/.."

removed=0
for path in src/expr test/expr; do
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "removed $path"
    removed=1
  fi
done

if [ "$removed" -eq 0 ]; then
  echo "already at baseline — nothing to remove"
fi
