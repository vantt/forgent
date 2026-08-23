# fgos-shell-integration.sh -- bash functions for running fgos/fgos-runner
# from any cwd inside a forgent checkout (main checkout or a linked git
# worktree), without hardcoding a path (STR87 first slice, D1/D4).
#
# This file is meant to be SOURCED from your own shell rc file, e.g.:
#
#   source /path/to/forgent/scripts/fgos-shell-integration.sh
#
# It is never executed directly and no install step in this repo sources it
# automatically for you -- adding it to ~/.bashrc (or similar) is your call
# to make (D3).
#
# 3-tier resolution (tsk-2qc-1 D2/D3/D4, docs/history/install-setup-
# external-project-reliability/CONTEXT.md): dev-checkout self-hosting
# (tier 1, the `$root/bin/fgos.mjs` file-check below) > project-local
# install (tier 2, `node_modules/.bin/fgos`, walking up from $PWD the same
# way Node's own module resolution does -- kept as a real mode for
# cross-project version pinning) > global install (tier 3, the only tier
# needing a PATH lookup). Tier 3 reads the config-cache
# (`~/.fgos/config.json`'s `bin.globalFgosPath`, populated by `fgos setup`/
# `doctor --fix` -- see src/setup/bin-discovery.mjs) before ever shelling
# out to `command -v`, and self-heals: a stale/missing cached path falls
# straight through to the live PATH probe, same as before this cache
# existed (docs/history/global-project-config-awareness/CONTEXT.md D2).
#
# Still requires being inside SOME git repository to resolve tier 1 at all
# (git-common-dir is how the root is found, worktree-aware) -- a pure
# global npm install never needs this wrapper function in the first place,
# since npm's own bin-linking already puts a real `fgos` executable on
# PATH unconditionally, in any directory. This wrapper's job is the
# dev-checkout / project-local-pin story, not replacing that real binary.

_fgos_tier2_bin() {
  # Tier 2: walk up from $PWD looking for node_modules/.bin/<name>.
  local name="$1" dir="$PWD"
  while [ -n "$dir" ]; do
    if [ -f "$dir/node_modules/.bin/$name" ]; then
      echo "$dir/node_modules/.bin/$name"
      return 0
    fi
    [ "$dir" = "/" ] && return 1
    dir=$(dirname "$dir")
  done
  return 1
}

_fgos_tier3_cached_bin() {
  # Tier 3, cache-first (D4): extract bin.globalFgosPath via grep/sed --
  # never spawns node just to parse a small JSON file on a hot shell path.
  local cache_file="$HOME/.fgos/config.json" cached
  [ -f "$cache_file" ] || return 1
  cached=$(grep -o '"globalFgosPath"[[:space:]]*:[[:space:]]*"[^"]*"' "$cache_file" 2>/dev/null | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')
  [ -n "$cached" ] && [ -f "$cached" ] || return 1
  echo "$cached"
}

fgos() {
  local root real_bin common_dir tier2 tier3 has_dir=0 arg
  common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
    echo "fgos: not a git repository" >&2
    return 1
  }
  root=$(dirname "$common_dir")
  for arg in "$@"; do
    case "$arg" in
      --dir|--dir=*) has_dir=1; break ;;
    esac
  done
  if [ -f "$root/bin/fgos.mjs" ]; then
    if [ "$has_dir" -eq 0 ]; then
      node "$root/bin/fgos.mjs" "$@" --dir "$root"
    else
      node "$root/bin/fgos.mjs" "$@"
    fi
    return $?
  fi
  if tier2=$(_fgos_tier2_bin fgos); then
    if [ "$has_dir" -eq 0 ]; then
      "$tier2" "$@" --dir "$root"
    else
      "$tier2" "$@"
    fi
    return $?
  fi
  if tier3=$(_fgos_tier3_cached_bin); then
    if [ "$has_dir" -eq 0 ]; then
      "$tier3" "$@" --dir "$root"
    else
      "$tier3" "$@"
    fi
    return $?
  fi
  # `type -P` is bash-only and silently fails under zsh, which always trips
  # this "no PATH install" branch even when one exists. `unset -f` inside
  # the command substitution only affects that subshell, so it un-shadows
  # this very function just long enough for `command -v` to do a plain
  # PATH lookup -- portable across bash and zsh alike.
  real_bin=$(unset -f fgos 2>/dev/null; command -v fgos)
  if [ -z "$real_bin" ]; then
    echo "fgos: no bin/fgos.mjs at $root (not a forgent checkout), no project-local node_modules/.bin/fgos, and no global fgos install on PATH" >&2
    return 1
  fi
  if [ "$has_dir" -eq 0 ]; then
    "$real_bin" "$@" --dir "$root"
  else
    "$real_bin" "$@"
  fi
}

fgos-runner() {
  local root real_bin common_dir tier2
  common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
    echo "fgos-runner: not a git repository" >&2
    return 1
  }
  root=$(dirname "$common_dir")
  if [ -f "$root/bin/fgos-runner.mjs" ]; then
    node "$root/bin/fgos-runner.mjs" "$@"
    return $?
  fi
  if tier2=$(_fgos_tier2_bin fgos-runner); then
    "$tier2" "$@"
    return $?
  fi
  real_bin=$(unset -f fgos-runner 2>/dev/null; command -v fgos-runner)
  if [ -z "$real_bin" ]; then
    echo "fgos-runner: no bin/fgos-runner.mjs at $root (not a forgent checkout), no project-local node_modules/.bin/fgos-runner, and no global fgos-runner install on PATH" >&2
    return 1
  fi
  "$real_bin" "$@"
}
