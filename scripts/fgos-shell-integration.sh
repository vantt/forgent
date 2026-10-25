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
# 4-tier resolution (tsk-2qc-1 D2/D3/D4, docs/history/install-setup-
# external-project-reliability/CONTEXT.md): workspace installation
# (tier 0, the `$root/.fgos/installation/bin/fgos` executable check below) >
# dev-checkout self-hosting (tier 1, the `$root/bin/fgos.mjs` file-check below) >
# project-local install (tier 2, `node_modules/.bin/fgos`, walking up from $PWD the same
# way Node's own module resolution does -- kept as a real mode for
# cross-project version pinning) > global install (tier 3, the only tier
# needing a PATH lookup). Tier 3 reads the bin cache
# (`~/.fgos/runtime/bin-cache.json`'s `globalFgosPath`, populated by `fgos setup`/
# `doctor --fix` -- see src/setup/bin-discovery.mjs) before ever shelling
# out to `command -v`, and self-heals: a stale/missing cached path falls
# straight through to the live PATH probe, same as before this cache
# existed (docs/history/global-project-config-awareness/CONTEXT.md D2).
#
# Still requires being inside SOME git repository to resolve tier 1 at all
# (the common dir, read from the .git layout on disk without a git child, is
# how the root is found, worktree-aware) -- a pure
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
  # Tier 3, cache-first (D4): extract globalFgosPath via grep/sed --
  # never spawns node just to parse a small JSON file on a hot shell path.
  local cache_file="$HOME/.fgos/runtime/bin-cache.json" cached
  [ -f "$cache_file" ] || return 1
  cached=$(grep -o '"globalFgosPath"[[:space:]]*:[[:space:]]*"[^"]*"' "$cache_file" 2>/dev/null | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')
  [ -n "$cached" ] && [ -f "$cached" ] || return 1
  echo "$cached"
}

fgos() {
  local root real_bin real_root common_dir dir git_dir tier2 tier3 has_dir=0 arg
  # The repository's common dir, read from the layout Git keeps on disk (no git
  # child; same reading as scripts/lib/git-dir-layout.mjs repositoryDirs): walk
  # up from the physical cwd to the first .git -- a directory is the common dir;
  # a file names "gitdir: <path>" (relative to its directory unless absolute),
  # whose commondir file, when present, names the common dir relative to it.
  # Inlined in each function on purpose: a sourced-shell snapshot drops
  # _-prefixed helpers (tsk-3k2).
  common_dir="" dir=$(pwd -P)
  while :; do
    if [ -d "$dir/.git" ]; then common_dir="$dir/.git"; break; fi
    if [ -f "$dir/.git" ]; then
      git_dir=$(sed -n 's/^gitdir:[[:space:]]*\(.*[^[:space:]]\)[[:space:]]*$/\1/p' "$dir/.git" 2>/dev/null | head -n 1)
      [ -n "$git_dir" ] || break
      case "$git_dir" in /*) ;; *) git_dir="$dir/$git_dir" ;; esac
      common_dir="$git_dir"
      if [ -f "$git_dir/commondir" ]; then
        common_dir=$(head -n 1 "$git_dir/commondir")
        case "$common_dir" in /*) ;; *) common_dir="$git_dir/$common_dir" ;; esac
      fi
      break
    fi
    [ "$dir" = "/" ] && break
    dir=$(dirname "$dir")
  done
  if [ -z "$common_dir" ] || [ ! -d "$common_dir" ] || ! common_dir=$(readlink -f "$common_dir" 2>/dev/null); then
    echo "fgos: not a git repository" >&2
    return 1
  fi
  root=$(dirname "$common_dir")
  for arg in "$@"; do
    case "$arg" in
      --dir|--dir=*) has_dir=1; break ;;
    esac
  done
  if [ -x "$root/.fgos/installation/bin/fgos" ]; then
    # `-x` follows a symlink chain transparently -- confirm the REAL target
    # (not just the lexical path) still lives under the installation root
    # before executing it, the same discipline resolveFgosBin's Node tier-0
    # check applies. `readlink -f` is a GNU coreutils extension, present on
    # this track's only approved reference target (x86_64-unknown-linux-gnu).
    real_bin=$(readlink -f "$root/.fgos/installation/bin/fgos" 2>/dev/null)
    real_root=$(readlink -f "$root/.fgos/installation" 2>/dev/null)
    case "$real_bin" in
      "$real_root"/*)
        if [ "$has_dir" -eq 0 ]; then
          "$root/.fgos/installation/bin/fgos" "$@" --dir "$root"
        else
          "$root/.fgos/installation/bin/fgos" "$@"
        fi
        return $?
        ;;
    esac
  fi
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
  local root real_bin common_dir dir git_dir tier2
  # The repository's common dir, read from the layout Git keeps on disk (no git
  # child; same reading as scripts/lib/git-dir-layout.mjs repositoryDirs): walk
  # up from the physical cwd to the first .git -- a directory is the common dir;
  # a file names "gitdir: <path>" (relative to its directory unless absolute),
  # whose commondir file, when present, names the common dir relative to it.
  # Inlined in each function on purpose: a sourced-shell snapshot drops
  # _-prefixed helpers (tsk-3k2).
  common_dir="" dir=$(pwd -P)
  while :; do
    if [ -d "$dir/.git" ]; then common_dir="$dir/.git"; break; fi
    if [ -f "$dir/.git" ]; then
      git_dir=$(sed -n 's/^gitdir:[[:space:]]*\(.*[^[:space:]]\)[[:space:]]*$/\1/p' "$dir/.git" 2>/dev/null | head -n 1)
      [ -n "$git_dir" ] || break
      case "$git_dir" in /*) ;; *) git_dir="$dir/$git_dir" ;; esac
      common_dir="$git_dir"
      if [ -f "$git_dir/commondir" ]; then
        common_dir=$(head -n 1 "$git_dir/commondir")
        case "$common_dir" in /*) ;; *) common_dir="$git_dir/$common_dir" ;; esac
      fi
      break
    fi
    [ "$dir" = "/" ] && break
    dir=$(dirname "$dir")
  done
  if [ -z "$common_dir" ] || [ ! -d "$common_dir" ] || ! common_dir=$(readlink -f "$common_dir" 2>/dev/null); then
    echo "fgos-runner: not a git repository" >&2
    return 1
  fi
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
