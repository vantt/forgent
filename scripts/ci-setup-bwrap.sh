#!/bin/sh
set -eu

# scripts/ci-setup-bwrap.sh
# Sets a Linux runner up the way a supported Linux machine is set up for the confinement rows of
# `fgos doctor` (docs/how-to/install-fgos-in-a-project-and-use-doctor.md, section 4.4.1): bubblewrap
# installed, and unprivileged user namespaces allowed where AppArmor restricts them (Ubuntu 24.04+).

sudo apt-get update
sudo apt-get install -y bubblewrap
if [ -e /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]; then
  sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
fi
bwrap --ro-bind / / --unshare-user --unshare-pid true
