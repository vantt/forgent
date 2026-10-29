---
title: "Guide: turn on cross-machine mail and prove it on real machines"
description: "Per-machine steps to land a release that carries cross-machine mailbox delivery, confirm the machine keys once, switch it on, and run the live proof between fg-server and fg-server2 (design-lap only with the owner's go)."
date: 2026-10-30
---

# Turn on cross-machine mail and prove it

Written 2026-10-30 03:35 by `lead:MAIL` (`claude-idjn@fg-server2`). Owner instruction of the same night: install cross-machine mail through fg-server. Authority: plan `plans/261027-1205-mailbox-v8-cross-machine-delivery/`. Cross-machine mail is off by default; nothing below changes a machine that skips step 3.

## What a machine needs first

- A release built from main at `d13a825d1` or later. Earlier releases cannot read the version-2 mailbox record and do not know the key `mailbox.crossMachine.enabled`.
- Its own machine key and the other machines' keys. Fingerprints (each machine shows its own with `fgos identity machine`):

| Machine | Id | Key fingerprint |
|---|---|---|
| fg-server2 | `fg-server2-jdp2bv` | `SHA256:3/rco5+DYLiAsbOFISb+t0a16sIZBOav7DNKGsBmt3s` |
| fg-server | `fg-server-sqs7es` | `SHA256:RqduuhHrX6sqIyUeETIs/gjzaavwUXYsSAqoLwbcMZ4` |
| design-lap (owner) | `design-lap-iezwlz` | `SHA256:nOLa4ePZzHDsvDbfW3bDXDeApfNlHgRAsnJSESF/GMg` |

## Steps, per machine

1. **Land the release.** Use that machine's own landing recipe (the one in `plans/reports/handoff-261025-2105-design-lap-release-landing.md`, section "Landing recipe"). fg-server2 and fg-server land through their own agents in their own windows; design-lap only after the owner says go. Serialize with whoever runs a heavy gate on that machine.
2. **Confirm the other machines' keys once.** A machine takes mail only from a machine whose key it confirmed (`mailbox.remote.requireConfirmed`). On each machine, for each other machine:
   `fgos identity pins --confirm <machine-id> --fingerprint <fingerprint from the table>`.
   Status on fg-server2 on 2026-10-30: fg-server and design-lap are already `confirmed`. fg-server must still confirm fg-server2; the owner carries the fingerprint, as for the first six pins.
3. **Switch it on.** `fgos config set mailbox.crossMachine.enabled true --reason "cross-machine mail live proof"` in the project, then commit that one file and push; other machines get it with their next pull, after step 1 there. The first sync on a machine takes a baseline, so mail already in the log is never delivered later.
4. **Prove it, receiver first.** Start a Claude Code or Codex session on the receiving machine and let it run one tool call (that registers its head, and the next sync publishes it). Wait one sync interval (`eventStore.sync.intervalSec`) so the sender can see it in the shared directory. On the sender: `fgos mailbox send --to <handle> "<one line>"` (the answer says "recorded", not "delivered"). On the receiver the session sees the mail at its next tool call, or run `fgos mailbox inbox`. On the sender, after the next sync, `fgos mailbox status` lists the message as offered; if the receiver refused it, it lists the reason, and a machine whose key is not confirmed shows up under "needs your confirmation" with the command.
5. **Write the result** on the board: machines, release digests, the message's recorded and offered times, and anything that was refused.

## Known limits

- A message sent before the receiver's first sync stays "waiting" for good.
- Heads registered before the project-id change are never published; restart the session.
- The receiver reads the whole project stream at each sync; fine for now, a store cursor is the fix when logs grow.
- Mail does not wake an idle session yet; that is plan `plans/261030-0323-mailbox-v9-wake-on-mail/`.
