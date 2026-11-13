#!/bin/sh
# Runs the real bwrap after a pause, so a test can end the caller before bwrap
# reports the namespace init's pid on --info-fd.
sleep 0.6
exec /usr/bin/bwrap "$@"
