#!/bin/sh
# Spike live check: paseo starts codex through `fgos exec` as an external attempt.
# Subcommands: attempt | run <attemptDir> | steer <agent> | tree <attemptDir> | stop <agent> | show <attemptDir>
set -eu
W=/home/vantt/projects/forgent-worktrees/paseo-external-spike
S=/home/vantt/projects/forgent/.fgos/runtime/tmp/paseo-run
HOST="$W/target/debug/fgos"
PASEO() { (cd "$S" && npx --no-install paseo --host 127.0.0.1:6797 "$@"); }

case "$1" in
  link)
    # The command paseo is configured with: a link named fgos-exec-<cli> to the host binary, so paseo's
    # `<command[0]> --version` probe reaches the CLI's version, not fgOS's.
    mkdir -p "$S/bin"
    ln -sfn "$HOST" "$S/bin/fgos-exec-codex"
    "$S/bin/fgos-exec-codex" --version
    ;;
  attempt|sandbox)
    mkdir -p "$S/work-ext" "$S/state"
    [ "$1" = sandbox ] && export SANDBOX=1
    python3 -I "$W/plans/261111-1255-paseo-external-launch-spike/start-external-attempt.py" \
      "$HOST" codex /home/vantt/.local/bin/codex "$S/work-ext" "$S/state" CODEX_HOME=/home/vantt/.codex-tetnu
    ;;
  run)
    PASEO run --no-wait --json --provider fgos-codex --env "FGOS_ATTEMPT_DIR=$2" --cwd "$S/work-ext" --title ext-steer \
      "Run the shell command 'sleep 40; echo step1' (one command, wait for it). Then summarize. If a new message arrives while you work, answer it in your next reply."
    ;;
  steer)
    date -u +%T.%N
    PASEO send --no-wait --behavior steer "$2" "MAILTEST6: reply with the word BANANA right now and say what you are doing."
    ;;
  probe)
    # Containment check: one write inside the workspace, one outside it (in the paseo state dir).
    # Full Access turns Codex's own sandbox off: a second bwrap cannot nest in fgOS's, which is the boundary.
    PASEO run --no-wait --json --provider fgos-codex --mode full-access --env "FGOS_ATTEMPT_DIR=$2" --cwd "$S/work-ext" --title ext-probe \
      "Run exactly these shell commands one by one and report each command's output and exit code verbatim: (1) echo inside > inside.txt; (2) echo outside > $S/outside.txt; (3) id; ps -eo pid,comm | head; (4) ls /home/vantt/.fgos/private | head -3; (5) sleep 40; echo step1. If a new message arrives while you work, answer it in your next reply."
    ;;
  build) (cd "$W" && cargo build -p fgos -j 4 2>&1 | tail -2) ;;
  wait) PASEO wait "$2" --timeout 3m >/dev/null 2>&1 || true; PASEO logs "$2" | tail -8 ;;
  stop) PASEO stop "$2" ;;
  respawn)
    # What a host reopening the agent would do: start the gate again for the same attempt.
    set +e
    FGOS_ATTEMPT_DIR="$2" timeout 20 "$HOST" exec codex app-server </dev/null
    echo "second spawn exit=$?"
    ;;
  tree)
    for f in supervisor-binding.json agent-binding.json gate-exit.json receipt.json closed.json; do
      [ -s "$2/$f" ] && { echo "== $f"; cat "$2/$f"; echo; }
    done
    echo "== supervisor.log"; tail -5 "$2/supervisor.log"
    ;;
esac
