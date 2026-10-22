---
title: "Sequence ids through one counter ref: probe on GitHub"
lane: IDENT
date: 2026-10-22
---

# Sequence ids through one counter ref: probe on GitHub

The owner asked for a cheap, daemon-free way to keep sequential ids (`D-ADR0063`, decision file numbers) unique across machines, with the id format unchanged and as little garbage as possible. The candidate: one ref per sequence kind, each claim an orphan commit whose message is the number, pushed with `--force-with-lease=<ref>:<old sha>` so the forge accepts it only if nobody claimed in between.

## Result

The forge does the compare-and-swap atomically. Every case behaved as required.

| Case | Expected | Observed on `github.com/vantt/forgent` |
|---|---|---|
| First claim, ref absent (lease `<ref>:`) | accepted | `a 0001 rc=0` |
| Two machines claim the next number at once, same old sha | exactly one accepted | `a 0002 rc=0`, `b 0002 rc=1` |
| Loser fetches and retries | gets the next number | `b 0003 rc=0` |
| Push with a stale lease | refused | `stale rc=1` |
| State on the forge | one ref, tip has no parent | one ref, tip subject `0003`, parents 0 |
| Cleanup | ref deleted | `delete rc=0`, no probe ref left |

Latency from `fg-server`, three runs: push 1.63-1.80 s, `ls-remote` 0.69-0.75 s. One claim costs one `ls-remote`, one fetch of a single tiny commit, and one push, so about 2.5-3 s, paid only when a sequence number is minted (a few times a week).

## Garbage

- On the forge at any time: one ref per sequence kind (two today) and one commit of about 200 bytes behind each. Each claim replaces the previous orphan commit, so no history builds up behind the ref.
- Not verified: when GitHub actually removes the replaced commits. GitHub does not expose its garbage collection; unreachable objects may stay on its side until its own maintenance runs. They are invisible to clones and fetches of refs, and each is about 200 bytes.

## Method

Two fresh repositories (`git init`, `origin` = the real forge, no clone of the project), commits made with `git commit-tree` on the empty tree and an env-only identity, so no repository config was written. The probe ref was `refs/fgos/seq-probe/d-adr-1792646140`, deleted at the end. The script was a scratch file in the session's scratchpad; its steps are the table above.

## Open points for the design

- A number claimed but never used leaves a gap. Claim only right before the commit that uses it; if that commit fails and nobody claimed after, push the ref back to the previous number with the same lease.
- No network: the claim fails and the writer waits or retries; the format is never changed to work around it (owner 2026-10-22).
- A repository with no remote claims against its local ref only.
