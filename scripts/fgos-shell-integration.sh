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

_fgos_repo_root() {
  local common_dir
  common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
    echo "fgos: not a git repository" >&2
    return 1
  }
  dirname "$common_dir"
}

fgos() {
  local root
  root=$(_fgos_repo_root) || return 1
  node "$root/bin/fgos.mjs" "$@"
}

fgos-runner() {
  local root
  root=$(_fgos_repo_root) || return 1
  node "$root/bin/fgos-runner.mjs" "$@"
}
