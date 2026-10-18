#!/usr/bin/env python3
"""A stand-in for the herdr CLI that keeps one real pane.

`pane run` starts the command line under `script` (a pty whose slave is the
controlling terminal of the command, as in a herdr pane), `pane process-info`
reports that command's live process, and every other call answers from small
files in $FAKE_HERDR_DIR that a test edits while it runs:

  explain.json   the screen detector's verdict, answered by `agent explain`
  screen.txt     what `pane read` prints
  gone           when present, every pane command says pane_not_found
  no-process     when present, `pane process-info` reports only the pane's shell
  calls.log      every call, arguments joined by a tab (written here)
  sent.jsonl     what was typed at the pane: text, keys, prompt (written here)
"""
import json
import os
import signal
import subprocess
import sys

DIR = os.environ["FAKE_HERDR_DIR"]
PANE = "fk:p1"
TAB = "fk:t1"


def path(name):
    return os.path.join(DIR, name)


def log(name, line):
    with open(path(name), "a") as f:
        f.write(line + "\n")


def say(result):
    print(json.dumps({"id": "cli:fake", "result": result}))
    sys.exit(0)


def fail(code, message=None):
    print(json.dumps({"error": {"code": code, "message": message or code}, "id": "cli:fake"}), file=sys.stderr)
    sys.exit(1)


def read(name, default=""):
    try:
        with open(path(name)) as f:
            return f.read()
    except FileNotFoundError:
        return default


args = sys.argv[1:]
log("calls.log", "\t".join(args))
if args[:1] == ["--session"]:
    args = args[2:]
if args[:1] == ["--version"]:
    print("herdr 0.9.1-fake")
    sys.exit(0)
if args[:3] == ["pane", "layout", "--help"]:
    print("usage: herdr pane layout")
    sys.exit(0)

group, action = (args + ["", ""])[:2]
rest = args[2:]


def pane_gone():
    return os.path.exists(path("gone")) or os.path.exists(path("closed"))


def shell_pid():
    return int(read("script.pid", "0") or 0)


def children(pid):
    try:
        return [int(c) for c in read_proc(f"/proc/{pid}/task/{pid}/children").split()]
    except OSError:
        return []


def read_proc(p):
    with open(p) as f:
        return f.read()


if (group, action) == ("status", "server"):
    say({"running": True, "socket": os.environ.get("HERDR_SOCKET_PATH", "")})
if (group, action) == ("tab", "create"):
    say({"type": "tab_created", "root_pane": {"pane_id": PANE, "tab_id": TAB}, "tab": {"tab_id": TAB, "label": "fake"}})
if (group, action) in (("tab", "rename"), ("pane", "rename"), ("pane", "report-agent")):
    say({"type": "ok"})

if group in ("pane", "agent") and pane_gone():
    fail("pane_not_found", "pane not found")

if (group, action) == ("pane", "get"):
    say({"pane": {"pane_id": PANE, "tab_id": TAB, "agent_status": "idle"}, "type": "pane_info"})
if (group, action) == ("pane", "run"):
    line = rest[1]
    proc = subprocess.Popen(
        ["setsid", "script", "-qefc", line, "/dev/null"],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=False,
        close_fds=True,
    )
    with open(path("script.pid"), "w") as f:
        f.write(str(proc.pid))
    say({"type": "ok"})
if (group, action) == ("pane", "process-info"):
    shell = shell_pid()
    live = []
    if not os.path.exists(path("no-process")):
        for child in children(shell):
            try:
                argv = read_proc(f"/proc/{child}/cmdline").split("\0")[:-1]
            except OSError:
                continue
            live.append({"argv": argv, "cmdline": " ".join(argv), "cwd": "/", "name": os.path.basename(argv[0]) if argv else "", "pid": child})
    if not live:
        live = [{"argv": ["sh"], "cmdline": "sh", "cwd": "/", "name": "sh", "pid": shell}]
    say({"process_info": {"foreground_process_group_id": live[0]["pid"], "foreground_processes": live, "pane_id": PANE, "shell_pid": shell}, "type": "pane_process_info"})
if (group, action) == ("pane", "read"):
    sys.stdout.write(read("screen.txt"))
    sys.exit(0)
if (group, action) == ("pane", "send-text"):
    log("sent.jsonl", json.dumps({"kind": "text", "text": rest[1]}))
    say({"type": "ok"})
if (group, action) == ("pane", "send-keys"):
    log("sent.jsonl", json.dumps({"kind": "keys", "keys": rest[1:]}))
    say({"type": "ok"})
if (group, action) == ("agent", "prompt"):
    log("sent.jsonl", json.dumps({"kind": "prompt", "text": rest[1]}))
    say({"type": "ok"})
if (group, action) == ("agent", "get"):
    say({"pane": {"pane_id": PANE, "agent": "claude", "agent_status": read("agent-status", "idle").strip() or "idle"}, "type": "pane_info"})
if (group, action) == ("agent", "explain"):
    sys.stdout.write(read("explain.json", "{}"))
    sys.exit(0)
if (group, action) == ("pane", "close"):
    shell = shell_pid()
    if shell:
        try:
            os.killpg(os.getpgid(shell), signal.SIGHUP)
        except OSError:
            pass
    open(path("closed"), "w").close()
    say({"type": "ok"})

fail("unknown_command", " ".join(args))
