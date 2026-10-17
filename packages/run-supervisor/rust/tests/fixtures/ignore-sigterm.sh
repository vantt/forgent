#!/bin/sh
# An agent that refuses SIGTERM: only SIGKILL ends it. $1 = marker file written once running.
trap '' TERM INT
echo running > "$1"
while true; do
  sleep 1
done
