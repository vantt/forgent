#!/bin/sh
# Runs the real bwrap without the --info-fd option, so the namespace and its
# init start normally but the caller never learns the init's pid.
n=$#
i=0
while [ "$i" -lt "$n" ]; do
  arg=$1
  shift
  i=$((i + 1))
  if [ "$arg" = "--info-fd" ]; then
    shift
    i=$((i + 1))
    continue
  fi
  set -- "$@" "$arg"
done
exec /usr/bin/bwrap "$@"
