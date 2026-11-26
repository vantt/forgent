#!/bin/sh
# fgos-project-launcher v1: runs the release the nearest enclosing project activated, from this machine's release store only.
_fgos_rec=.fgos/installation/activation.json
_fgos_dir=$PWD
_fgos_nearest_git=
_fgos_using_project=
while [ ! -f "$_fgos_dir/$_fgos_rec" ]; do
  if [ -z "$_fgos_nearest_git" ] && { [ -e "$_fgos_dir/.git" ] || [ -L "$_fgos_dir/.git" ]; }; then
    _fgos_nearest_git="$_fgos_dir/.git"
  fi
  if [ "$_fgos_dir" = / ] || [ -z "$_fgos_dir" ]; then
    break
  fi
  _fgos_dir=${_fgos_dir%/*}
  [ -n "$_fgos_dir" ] || _fgos_dir=/
done
_fgos_refuse() {
  _fgos_target=${2+$1}
  _fgos_reason=${2:-$1}
  [ -n "${2+set}" ] || _fgos_target=$_fgos_act
  echo "fgos: refusing $_fgos_target: $_fgos_reason -- fgos runs only a release fgctl installed on this machine -- run 'fgctl init' in the project to activate one, then 'fgctl verify'" >&2
  exit 126
}
if [ -f "$_fgos_dir/$_fgos_rec" ]; then
  _fgos_act="${_fgos_dir%/}/$_fgos_rec"
else
  if [ -z "$_fgos_nearest_git" ]; then
    echo "fgos: no .fgos/installation found above $PWD -- run 'fgctl init' in the project" >&2
    exit 127
  fi
  if [ -L "$_fgos_nearest_git" ]; then
    _fgos_refuse "$_fgos_nearest_git" "$_fgos_nearest_git is a symlink"
  fi
  if [ ! -f "$_fgos_nearest_git" ]; then
    echo "fgos: no .fgos/installation found above $PWD -- run 'fgctl init' in the project" >&2
    exit 127
  fi
  if [ ! -r "$_fgos_nearest_git" ]; then
    _fgos_refuse "$_fgos_nearest_git" "it is not readable"
  fi
  _fgos_git_line=
  IFS= read -r _fgos_git_line < "$_fgos_nearest_git" || :
  case $_fgos_git_line in
    "gitdir: "*) _fgos_gitdir=${_fgos_git_line#gitdir: } ;;
    *) _fgos_refuse "$_fgos_nearest_git" "missing gitdir" ;;
  esac
  case $_fgos_gitdir in
    /*) ;;
    *) _fgos_refuse "$_fgos_nearest_git" "gitdir is relative ($_fgos_gitdir)" ;;
  esac
  if [ -L "$_fgos_gitdir" ]; then
    _fgos_refuse "$_fgos_gitdir" "gitdir is a symlink"
  fi
  if [ ! -f "$_fgos_gitdir/commondir" ]; then
    _fgos_refuse "$_fgos_gitdir/commondir" "missing commondir"
  fi
  if [ -L "$_fgos_gitdir/commondir" ]; then
    _fgos_refuse "$_fgos_gitdir/commondir" "commondir is a symlink"
  fi
  _fgos_commondir=
  { IFS= read -r _fgos_commondir || [ -n "$_fgos_commondir" ]; } < "$_fgos_gitdir/commondir" || _fgos_refuse "$_fgos_gitdir/commondir" "it is not readable"
  [ -n "$_fgos_commondir" ] || _fgos_refuse "$_fgos_gitdir/commondir" "missing commondir"
  if [ "${_fgos_commondir#/}" = "$_fgos_commondir" ]; then
    _fgos_common=$_fgos_gitdir
    _fgos_rem=$_fgos_commondir
    while [ -n "$_fgos_rem" ]; do
      _fgos_part=${_fgos_rem%%/*}
      case $_fgos_rem in
        */*) _fgos_rem=${_fgos_rem#*/} ;;
        *) _fgos_rem= ;;
      esac
      case $_fgos_part in
        ""|.) ;;
        ..) _fgos_common=${_fgos_common%/*} ;;
        *) _fgos_common="$_fgos_common/$_fgos_part" ;;
      esac
    done
  else
    _fgos_common=$_fgos_commondir
  fi
  _fgos_common=${_fgos_common%/}
  case $_fgos_common in
    */.git) ;;
    *) _fgos_refuse "$_fgos_common" "common dir is not named .git" ;;
  esac
  if [ -L "$_fgos_common" ]; then
    _fgos_refuse "$_fgos_common" "commondir is a symlink"
  fi
  _fgos_main=${_fgos_common%/.git}
  [ -n "$_fgos_main" ] || _fgos_main=/
  if [ ! -d "$_fgos_main" ]; then
    _fgos_refuse "$_fgos_main" "main checkout does not exist"
  fi
  if [ ! -O "$_fgos_main" ]; then
    _fgos_refuse "$_fgos_main" "main checkout is not owned by the calling user"
  fi
  _fgos_act="${_fgos_main%/}/$_fgos_rec"
  if [ ! -f "$_fgos_act" ]; then
    _fgos_refuse "$_fgos_act" "no activation found in main checkout"
  fi
  _fgos_using_project=$_fgos_main
fi
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
if [ -n "$_fgos_using_project" ]; then
  echo "fgos: using project $_fgos_using_project" >&2
fi
exec "$_fgos_release/bin/fgos" "$@"
