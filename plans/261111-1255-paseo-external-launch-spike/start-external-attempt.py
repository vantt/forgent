"""Spike harness: write one `external` attempt and start its supervisor.

Stands in for the runner adapter `paseo-spawn`, which this spike does not build. It writes the
envelope (canonical JSON digest, contract v3 plus the `external` section), the 0600 side file and the
outbox, takes the attempt lock and hands it to `fgos internal supervise` at descriptor 3, then prints
the attempt directory for the external host's `FGOS_ATTEMPT_DIR`.

Read-only attempt, `linux-pgroup` containment, no steps: settle and bwrap are out of the spike.

Usage: python3 -I start-external-attempt.py <host-bin> <cli> <cli-abs-path> <cwd> <state-dir> [KEY=VALUE ...]
"""

import fcntl
import hashlib
import json
import os
import subprocess
import sys
import time


def canonical(value):
    # Every string fgOS writes here is ASCII, so sorted keys and compact separators are the contract's
    # canonical form (UTF-16 order equals byte order for ASCII keys).
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def boottime_ns():
    return time.clock_gettime_ns(time.CLOCK_BOOTTIME)


def main():
    host_bin, cli, cli_path, cwd, state_dir = sys.argv[1:6]
    agent_env = dict(item.split("=", 1) for item in sys.argv[6:])
    boot_id = open("/proc/sys/kernel/random/boot_id").read().strip()
    attempt_id = "att-spike-" + time.strftime("%H%M%S")
    run_dir = os.path.abspath(os.path.join(state_dir, attempt_id, "runs", "01"))
    os.makedirs(os.path.join(run_dir, "protected"), mode=0o700)
    outbox = os.path.join(run_dir, "worker-output", "outbox")
    os.makedirs(outbox)
    capture_dir = os.path.join(run_dir, "protected", "capture", attempt_id)

    runtime = os.environ.get("XDG_RUNTIME_DIR") or "/tmp"
    socket_dir = os.path.join(runtime, "fgos-spike")
    os.makedirs(socket_dir, mode=0o700, exist_ok=True)
    os.chmod(socket_dir, 0o700)
    socket_path = os.path.join(socket_dir, hashlib.sha256(attempt_id.encode()).hexdigest()[:16] + ".sock")

    side_file = os.path.join(run_dir, "protected", "attempt-secrets.json")
    fd = os.open(side_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.write(fd, json.dumps({"v": 1, "attemptId": attempt_id, "env": {}, "controlEpoch": 0, "controlToken": "spike"}).encode())
    os.close(fd)

    body = {
        "v": 3,
        "attemptId": attempt_id,
        "unitRunId": "unit-spike",
        "runDir": run_dir,
        "mode": "external",
        "protocolId": 1,
        "hostBin": host_bin,
        "payloadRoot": os.path.dirname(os.path.dirname(os.path.dirname(host_bin))),
        "cwd": os.path.abspath(cwd),
        "mutation": "read-only",
        "launch": {
            "command": cli_path,
            "args": [],
            "env": agent_env,
            "stdinPolicy": "null",
            "briefPath": None,
            "outboxDir": outbox,
            "capture": {
                "stdout": os.path.join(capture_dir, "stdout.log"),
                "stderr": os.path.join(capture_dir, "stderr.log"),
            },
        },
        "containment": {"preferred": "linux-pgroup"},
        "deadlines": {
            "softAt": None,
            "idleMs": None,
            "hardCeiling": {"bootId": boot_id, "boottimeNs": boottime_ns() + 30 * 60 * 10**9},
            "gateKillGraceMs": 5000,
        },
        "agentProtocol": {"cli": cli, "mode": "external"},
        "identity": {"writerId": "spike-" + attempt_id, "parentWriterId": None},
        "steps": [],
        "sideFile": side_file,
        "external": {"socketPath": socket_path, "orphanSettleMs": 2000, "helloLimitMs": 180000},
        "createdAt": {"bootId": boot_id, "boottimeNs": boottime_ns()},
    }
    envelope = dict(body, digest="sha256:" + hashlib.sha256(canonical(body).encode()).hexdigest())
    with open(os.path.join(run_dir, "envelope.json"), "w") as f:
        f.write(json.dumps(envelope))

    lock = os.open(os.path.join(run_dir, "attempt.lock"), os.O_RDWR | os.O_CREAT, 0o600)
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    os.dup2(lock, 3, inheritable=True)
    log = open(os.path.join(run_dir, "supervisor.log"), "ab")
    child = subprocess.Popen(
        [host_bin, "internal", "supervise", "--envelope", os.path.join(run_dir, "envelope.json"), "--protocol", "1"],
        cwd=run_dir,
        stdin=subprocess.DEVNULL,
        stdout=log,
        stderr=log,
        pass_fds=(3,),
        start_new_session=True,
    )
    for _ in range(100):
        if os.path.exists(socket_path):
            break
        if child.poll() is not None:
            sys.exit("supervisor exited early, see " + os.path.join(run_dir, "supervisor.log"))
        time.sleep(0.05)
    print(json.dumps({"attemptDir": run_dir, "supervisorPid": child.pid, "socket": socket_path}))


main()
