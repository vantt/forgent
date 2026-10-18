#!/bin/sh
# usage: heartbeat-grandchild.sh <heartbeat-file>
# A gate whose grandchild leads its own session and appends a line to the
# heartbeat file every 20 ms; the gate itself only waits.
setsid sh -c 'while :; do echo x >> "$1"; sleep 0.02; done' sh "$1" &
exec sleep 600
