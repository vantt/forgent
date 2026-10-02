# Read-only posture and account probe

Status: done. The repository remained unmodified: `git status --short` produced no output and `POSTURE-PROBE.txt` was absent after the probe.

1. Command: `touch POSTURE-PROBE.txt`
   Exit code: 1
   Verbatim output:

   ```text
   touch: cannot touch 'POSTURE-PROBE.txt': Read-only file system
   ```

2. Command: `echo probe >> src/runner/execution/bind.mjs`
   Exit code: 1
   Verbatim output:

   ```text
   zsh:1: read-only file system: src/runner/execution/bind.mjs
   ```

3. Command: `for probe_var in CODEX_HOME HOME PI_CODING_AGENT_DIR; do if (( ${+parameters[$probe_var]} )); then printf '%s=%s\\n' "$probe_var" "${(P)probe_var}"; fi; done`
   Exit code: 0
   Verbatim output:

   ```text
   CODEX_HOME=/tmp/fgos-confinement/disp_1790939670206_4ee21d0e/home
   HOME=/home/vantt
   ```

   `PI_CODING_AGENT_DIR` was not set and is therefore absent, as requested.

4. `codex` was available. Command: `codex login status`
   Exit code: 0
   Verbatim output:

   ```text
   WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/fgos-confinement/disp_1790939670206_4ee21d0e/home"))
   Logged in using ChatGPT
   ```

   Requested status line: `Logged in using ChatGPT`.
