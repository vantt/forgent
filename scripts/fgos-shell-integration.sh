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
# When the resolved root has no bin/fgos.mjs (or bin/fgos-runner.mjs) --
# e.g. this file is sourced while standing inside a git repo that is not a
# forgent checkout -- the function falls back to a real PATH install of the
# same name instead of shadowing it with a bad Node error
# (docs/history/global-project-config-awareness/CONTEXT.md D2).

_fgos_repo_root() {
  local common_dir
  common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
    echo "fgos: not a git repository" >&2
    return 1
  }
  dirname "$common_dir"
}

fgos() {
  local root real_bin
  root=$(_fgos_repo_root) || return 1
  if [ ! -f "$root/bin/fgos.mjs" ]; then
    real_bin=$(type -P fgos 2>/dev/null) || {
      echo "fgos: no bin/fgos.mjs at $root (not a forgent checkout) and no global fgos install on PATH" >&2
      return 1
    }
    "$real_bin" "$@"
    return $?
  fi
  node "$root/bin/fgos.mjs" "$@"
}

fgos-runner() {
  local root real_bin
  root=$(_fgos_repo_root) || return 1
  if [ ! -f "$root/bin/fgos-runner.mjs" ]; then
    real_bin=$(type -P fgos-runner 2>/dev/null) || {
      echo "fgos-runner: no bin/fgos-runner.mjs at $root (not a forgent checkout) and no global fgos-runner install on PATH" >&2
      return 1
    }
    "$real_bin" "$@"
    return $?
  fi
  node "$root/bin/fgos-runner.mjs" "$@"
}
