"""Spike harness: write one `external` attempt and start its supervisor.

Stands in for the runner adapter `paseo-spawn`, which this spike does not build. It writes the
envelope (canonical JSON digest, contract v3 plus the `external` section), the 0600 side file and the
outbox, takes the attempt lock and hands it to `fgos internal supervise` at descriptor 3, then prints
the attempt directory for the external host's `FGOS_ATTEMPT_DIR`.

No steps (settle is out of the spike). `linux-pgroup` containment; with SANDBOX=1, `linux-gate` behind bwrap.

Usage: python3 -I start-external-attempt.py <host-bin> <cli> <cli-abs-path> <cwd> <state-dir> [KEY=VALUE ...]
"""

import fcntl
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time


def canonical(value):
    # Every string fgOS writes here is ASCII, so sorted keys and compact separators are the contract's
    # canonical form (UTF-16 order equals byte order for ASCII keys).
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def boottime_ns():
    return time.clock_gettime_ns(time.CLOCK_BOOTTIME)


def sandbox(run_dir, socket_path, cwd, outbox, agent_env):
    """`linux-gate` containment with the prefix the bwrap driver builds for a terminal attempt
    (src/runner/dispatch/confinement/drivers/bwrap.mjs): read-only root, private /tmp, own PID
    namespace with the gate as pid 1, the workspace, outbox and a private home writable, the socket
    bound read-only under a masked runtime dir, the machine-private roots masked, and an empty `gate-exit.json` the gate fills in place.

    The private home gets only `auth.json` of the Codex home, as the driver's `codex-home` source does;
    `CODEX_HOME` and `HOME` point at it."""
    home = os.path.join(os.path.dirname(os.path.dirname(run_dir)), "home")
    os.makedirs(home, mode=0o700)
    source = agent_env.get("CODEX_HOME")
    if source:
        shutil.copyfile(os.path.join(source, "auth.json"), os.path.join(home, "auth.json"))
        os.chmod(os.path.join(home, "auth.json"), 0o600)
    agent_env["CODEX_HOME"] = home
    agent_env["HOME"] = home
    # The gate keeps the host's environment under the envelope's: the host's TMPDIR points at a
    # directory the read-only root hides from writes, and Codex's own sandbox locks a file there.
    agent_env["TMPDIR"] = "/tmp"
    gate_exit = os.path.join(run_dir, "gate-exit.json")
    open(gate_exit, "w").close()
    runtime = os.path.dirname(os.path.dirname(socket_path))
    prefix = ["--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc", "--tmpfs", "/tmp",
              "--unshare-pid", "--as-pid-1", "--setenv", "FGOS_CONFINED", "1", "--die-with-parent"]
    for path in (outbox, cwd, home, gate_exit):
        prefix += ["--bind", path, path]
    # The machine-private roots the driver hides from every confined dispatch, masked like the runtime dir.
    hidden = [d for d in (os.path.expanduser("~/.fgos/private"), os.path.expanduser("~/.config/herdr")) if os.path.isdir(d)]
    for d in hidden + [runtime]:
        prefix += ["--tmpfs", d]
    prefix += ["--ro-bind", socket_path, socket_path]
    for d in hidden + [runtime]:
        prefix += ["--remount-ro", d]
    prefix += ["--"]
    return {"preferred": "linux-gate", "bwrapPrefix": ["/usr/bin/bwrap", *prefix]}


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

    containment = {"preferred": "linux-pgroup"}
    if os.environ.get("SANDBOX") == "1":
        containment = sandbox(run_dir, socket_path, os.path.abspath(cwd), outbox, agent_env)

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
        "containment": containment,
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
