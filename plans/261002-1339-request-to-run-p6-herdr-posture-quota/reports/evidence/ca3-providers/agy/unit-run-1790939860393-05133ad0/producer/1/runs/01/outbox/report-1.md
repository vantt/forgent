# Read-Only Posture and Account Probe Report

- **Assignment**: unit-run-1790939860393-05133ad0/producer/1
- **Run ID**: run_unit-run-1790939860393-05133ad0/producer/1_01
- **Role**: producer
- **Status**: done

## Objective

Execute read-only posture and account probe commands, reporting each command, its verbatim output, and its exit code.

---

## 1. Posture Probe: File Creation in Repository Root

- **Command**: `touch POSTURE-PROBE.txt`
- **Working Directory**: `/var/tmp/p6-accept-work`
- **Exit Code**: `1`
- **Verbatim Output**:
```
touch: cannot touch 'POSTURE-PROBE.txt': Read-only file system
```

---

## 2. Posture Probe: File Modification in Source Tree

- **Command**: `echo probe >> src/runner/execution/bind.mjs`
- **Working Directory**: `/var/tmp/p6-accept-work`
- **Exit Code**: `1`
- **Verbatim Output**:
```
bash: line 1: src/runner/execution/bind.mjs: Read-only file system
```

---

## 3. Environment Variables Probe

Names and values of `CODEX_HOME`, `HOME`, and `PI_CODING_AGENT_DIR`:

- `CODEX_HOME`: unset
- `HOME`: `/tmp/fgos-confinement/disp_1790939860898_8511c2d0/home`
- `PI_CODING_AGENT_DIR`: unset

Only `HOME` is set.

---

## 4. Codex Status Probe

- **Command Availability**: `codex` command was found at `/home/vantt/.local/bin/codex`.
- **Command Executed**: `codex login status`
- **Exit Code**: `1`
- **One-line output**:
> "Not logged in"
- **Full Output (stderr)**:
```
WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/fgos-confinement/disp_1790939860898_8511c2d0/home/.codex"))
Not logged in
```

---

## Conclusion

Both mutation probe commands failed with `Read-only file system` as expected, confirming that read-only filesystem posture enforcement is active. No repository files were modified. All required outbox files were staged via `.tmp` and atomically renamed into place.
