#!/bin/sh
set -eu

# scripts/check-glibc-ceiling.sh <binary>...
# Fails when any binary needs a newer glibc symbol version than GLIBC_CEILING
# (default 2.35, the glibc of Ubuntu 22.04), so a release built on a newer image
# cannot ship binaries that print a loader error on the oldest supported distro.

CEILING="${GLIBC_CEILING:-2.35}"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <binary>..." >&2
  exit 1
fi

status=0
for bin in "$@"; do
  if [ ! -f "$bin" ]; then
    echo "Error: $bin not found" >&2
    exit 1
  fi
  symbols="$(objdump -T "$bin")" || {
    echo "Error: objdump -T failed on $bin" >&2
    exit 1
  }
  needed="$(printf '%s\n' "$symbols" | grep -o 'GLIBC_[0-9][0-9.]*' | sed 's/^GLIBC_//' | sort -Vu | tail -n 1 || true)"
  if [ -z "$needed" ]; then
    echo "$bin: no versioned glibc symbols (ceiling GLIBC_$CEILING)"
    continue
  fi
  highest="$(printf '%s\n%s\n' "$needed" "$CEILING" | sort -V | tail -n 1)"
  if [ "$highest" != "$CEILING" ]; then
    echo "Error: $bin needs GLIBC_$needed, above the ceiling GLIBC_$CEILING" >&2
    status=1
  else
    echo "$bin: needs at most GLIBC_$needed (ceiling GLIBC_$CEILING)"
  fi
done
exit "$status"
