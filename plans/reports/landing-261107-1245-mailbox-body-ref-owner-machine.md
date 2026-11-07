# Mail body ref (Git crate) landed: what the owner machine and other lanes must do

Date: 2026-11-07. Lane MAIL, step 1 of the mail-body retention plan (`mailbox-261106-1230-body-retention-build-plan.md`).
Commits on main: `df644d414`, `5f158d3ea`. Review: lead:OPC, merged with three conditions (all in the landing).

## What changed at runtime

Nothing is sent or stored differently yet. The Git crate can now own `refs/fgos/mail-bodies/<machine>`: it is written
through its own `HolderAuthority` under the machine's `project:mailbox` event-seal, pushed only as a leased replace
(`--force-with-lease`), and mirrored by every peer into `refs/fgos/remotes/<remote>/mail-bodies/*`. Event Store never
reads that ref. Steps 2 to 6 (receiver, upgrade, sender, rotation, proof) still follow.

## What each machine must do after pulling this

A new third fetch mapping is part of the repository config. `publication_fetch_mappings` still returns the two
mappings Event Store requires, so event sync keeps working on a clone set up before this landing. The setup and doctor
side uses `granted_fetch_mappings` (those two plus the mail-body mirror):

- Run `fgos doctor --fix` (or `fgos setup`) on every clone, once the release that carries this code is activated.
  Until then the `git-repository-config` row fails with 'required fetch mapping is missing'. That row going red is
  expected, not a regression.
- fg-server: RULE runs it after its next upgrade. design-lap: LAND runs it after its next upgrade. fg-server2: MAIL.
- No sender uses the ref yet, so skipping the fix costs nothing but a red doctor row.

## What other lanes must avoid

- Do not add the mail-body mapping to `publication_fetch_mappings`: Event Store (`refspec.rs`) requires every mapping it
  returns and would stop syncing on old clones.
- Do not push `refs/fgos/mail-bodies/*` by any path other than the Git crate's leased push.

## Still open

Step 2 onward (payload version 3 in the mailbox receiver) and step 7 (deleting old mail from the event refs, which
needs an Event Store certified truncation designed with OPC). No new pre-existing failure found in anyone's area.
