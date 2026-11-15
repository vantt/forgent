#!/bin/sh
# fgos-project-launcher v1: runs the release the nearest enclosing project activated, from this machine's release store only.
_fgos_dir=$PWD
while [ ! -f "$_fgos_dir/.fgos/installation/activation.json" ]; do
  if [ "$_fgos_dir" = / ] || [ -z "$_fgos_dir" ]; then
    echo "fgos: no .fgos/installation found above $PWD -- run 'fgctl init' in the project" >&2
    exit 127
  fi
  _fgos_dir=${_fgos_dir%/*}
  [ -n "$_fgos_dir" ] || _fgos_dir=/
done
_fgos_act="${_fgos_dir%/}/.fgos/installation/activation.json"
_fgos_refuse() {
  echo "fgos: refusing $_fgos_act: $1 -- fgos runs only a release fgctl installed on this machine -- run 'fgctl init' in the project to activate one, then 'fgctl verify'" >&2
  exit 126
}
# _fgos_field KEY LINE: sets _fgos_v to the quoted value after "KEY": on LINE; false when LINE has no "KEY".
_fgos_field() {
  case $2 in *"\"$1\""*) ;; *) return 1 ;; esac
  _fgos_v=${2#*"\"$1\""}
  _fgos_v=${_fgos_v#*:}
  _fgos_v=${_fgos_v#*\"}
  _fgos_v=${_fgos_v%%\"*}
}
_fgos_status= _fgos_digest= _fgos_has_status= _fgos_has_digest=
while IFS= read -r _fgos_line || [ -n "$_fgos_line" ]; do
  if [ -z "$_fgos_has_status" ] && _fgos_field status "$_fgos_line"; then _fgos_status=$_fgos_v; _fgos_has_status=1; fi
  if [ -z "$_fgos_has_digest" ] && _fgos_field artifactDigest "$_fgos_line"; then _fgos_digest=$_fgos_v; _fgos_has_digest=1; fi
  [ -z "$_fgos_has_status" ] || [ -z "$_fgos_has_digest" ] || break
done < "$_fgos_act" || _fgos_refuse "it is not readable"
[ "$_fgos_status" = ready ] || _fgos_refuse "status is not ready ($_fgos_status)"
case $_fgos_digest in sha256:*) _fgos_hex=${_fgos_digest#sha256:} ;; *) _fgos_hex= ;; esac
case $_fgos_hex in *[!0-9a-f]*) _fgos_hex= ;; esac
[ ${#_fgos_hex} -eq 64 ] || _fgos_refuse "artifactDigest is not sha256 and 64 lowercase hex digits"
_fgos_nonblank() { case $1 in *[![:space:]]*) return 0 ;; esac; return 1; }
if _fgos_nonblank "${FGOS_STATE_ROOT-}"; then _fgos_store=$FGOS_STATE_ROOT
elif _fgos_nonblank "${FGOS_STATE_HOME-}"; then _fgos_store=$FGOS_STATE_HOME
elif _fgos_nonblank "${XDG_STATE_HOME-}"; then _fgos_store=$XDG_STATE_HOME/fgos
elif [ "${HOME+set}" = set ]; then _fgos_store=${HOME:+$HOME/}.local/state/fgos
elif [ "${USERPROFILE+set}" = set ]; then _fgos_store=${USERPROFILE:+$USERPROFILE/}.local/state/fgos
else _fgos_store=.local/state/fgos
fi
case $_fgos_store in /*) ;; *) _fgos_refuse "the state root $_fgos_store is not an absolute path (set HOME or FGOS_STATE_ROOT)" ;; esac
_fgos_release=$_fgos_store/releases/$_fgos_digest
[ -d "$_fgos_release" ] || _fgos_release=$_fgos_store/releases/sha256-$_fgos_hex
[ -x "$_fgos_release/bin/fgos" ] || _fgos_refuse "release $_fgos_digest is not in this machine's release store $_fgos_store/releases"
exec "$_fgos_release/bin/fgos" "$@"
