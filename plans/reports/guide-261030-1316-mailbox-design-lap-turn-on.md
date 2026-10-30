---
title: "Guide: turn on mailbox and cross-machine mail on design-lap"
description: "Owner-machine steps: land a release that carries cross-machine mail, confirm the two keys, pull the switch, restart one session, and prove it against fg-server2."
date: 2026-10-30
---

# Turn on mail on design-lap

Written 2026-10-30 13:16 by `lead:MAIL` (`claude-idjn@fg-server2`). The owner asked for this guide on 2026-10-30. Nothing here changes design-lap until the owner (or the agent that owns design-lap releases) runs it. Workspace: `/home/vantt/projects/forgentX`, branch `main`.

The project switch `mailbox.crossMachine.enabled: true` is already committed on main (`2be0629d3`), so a pull is enough once the release is landed. The same-machine mailbox is on by default.

## Steps

1. **Pull main** into `/home/vantt/projects/forgentX` (keep any local uncommitted change: `git pull --rebase --autostash`).
2. **Land a release made from main at `0e6c26d43` or later**, with the recipe in `plans/reports/handoff-261025-2105-design-lap-release-landing.md` (back up, the release cargo compile of the workspace with `--locked`, the Rust distribution script, `cargo install fgctl`, `fgctl stage`, `fgctl upgrade`, restore `.fgos/distribution.json`, `fgctl verify`). Run no other suite or cargo compile at the same time: the QLC disk saturates. Earlier releases cannot read the version-2 mailbox record and do not know the cross-machine key.
3. **Confirm the other two machines' keys.** design-lap has both pins as `confirmed` since 10-25; check with `fgos identity pins`, and confirm again only when a row says `seen`:
   - `fgos identity pins --confirm fg-server2-jdp2bv --fingerprint 'SHA256:3/rco5+DYLiAsbOFISb+t0a16sIZBOav7DNKGsBmt3s'`
   - `fgos identity pins --confirm fg-server-sqs7es --fingerprint 'SHA256:RqduuhHrX6sqIyUeETIs/gjzaavwUXYsSAqoLwbcMZ4'`

   Your own key is `SHA256:nOLa4ePZzHDsvDbfW3bDXDeApfNlHgRAsnJSESF/GMg`; the other two machines have confirmed it.
4. **Restart a Claude Code session in the project.** A session started before the project id existed is never published. Let it run one tool call, then wait one sync interval (about 5 minutes).
5. **Check.** `fgos doctor` row `mailbox-hook` should end with `cross-machine: ...` and no "held until you confirm" warning; `fgos mailbox status` shows the `cross-machine:` line.
6. **Prove it.** Tell the fg-server2 lead (`claude-idjn@fg-server2`) the session handle (`fgos identity session`). It sends one line; run `fgos mailbox inbox` after a tool call and wait up to 5 minutes. Reply with `fgos mailbox send --to claude-idjn@fg-server2 --reply-to <id> "got it"`.

## Known limits

- Mail sent before a machine's first sync is skipped for good (the first sync takes a baseline); send the proof message after step 4.
- Mail does not wake an idle session yet; it shows at the next tool call.
