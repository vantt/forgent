---
name: handoff
disable-model-invocation: true
description: >-
  Replace the current head session with a fresh successor now, carrying a redacted handoff. Run by the person as
  /handoff; the model never starts it. Does nothing outside a head session.
---

# handoff

Manual session rotation for the current head session.

1. Read `FGOS_HEAD_ROLE` (form `head:<persona>-<name>`). If it is unset or empty, this is not a head session: say so
   in one line and do nothing else.
2. Split it into the persona and the name (the persona is the part before the first `-` after `head:`; ask the person
   if the split is ambiguous) and run:

   ```bash
   fgos head rotate <persona> --name <name>
   ```

3. Tell the person what happened: the successor started and answered and this session retires, or the failure reason
   and that this session stays alive (a failed rotation never ends the old session).
