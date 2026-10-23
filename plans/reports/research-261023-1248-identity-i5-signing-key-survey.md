---
title: "Identity I5: which signing keys the machines really have"
lane: IDENT
date: 2026-10-23
---

# Identity I5: which signing keys the machines really have

The owner moved the I5 decision (sender authenticity: per-machine signing key, trusted-machine list, signed directory entries and messages) earlier than the close of I4 (2026-10-23 12:48, "đồng ý, làm sớm đi"), because MAIL refuses cross-machine mail without it and the key choice does not depend on the Event Store. G0 decision 5 asked for evidence of which keys the machines really have before choosing between existing SSH or Git signing keys and a key Identity mints. This report collects that evidence.

## Survey command

Read-only. It prints key types, fingerprints and counts, never key material. Run it on each machine from inside the forgent checkout (the first line needs an activated project) and post the output as one board line tagged `IDENT I5 survey`.

```bash
echo "machine: $(fgos identity machine --json </dev/null | python3 -c 'import json,sys;print(json.load(sys.stdin)["data"]["handle"])')"
echo "openssh: $(ssh -V 2>&1)"
for p in ~/.ssh/*.pub; do [ -f "$p" ] || continue; k="${p%.pub}"; enc=no-private
  [ -f "$k" ] && { ssh-keygen -y -P '' -f "$k" >/dev/null 2>&1 && enc=no-passphrase || enc=passphrase; }
  echo "ssh-key: $(ssh-keygen -lf "$p" | awk '{print $1, $NF}') private=$enc"; done
echo "ssh-agent keys: $(ssh-add -l 2>/dev/null | grep -c .)"
echo "git gpg.format=$(git config --global gpg.format) signingkey-set=$([ -n "$(git config --global user.signingkey)" ] && echo yes || echo no) commit.gpgsign=$(git config --global commit.gpgsign)"
echo "gpg secret keys: $(gpg --list-secret-keys --with-colons 2>/dev/null | grep -c '^sec')"
echo "push transport: $(git remote get-url origin 2>/dev/null | sed -E 's#^(https?|ssh|git)(://|@).*#\1#')"
```

## Results

| Machine | OpenSSH | SSH key pairs | ssh-agent | Git signing configured | GPG secret keys | Push transport |
|---|---|---|---|---|---|---|
| `fg-server` | 10.2p1 (`ssh-keygen -Y sign` available) | none (`~/.ssh` holds only `authorized_keys` and `known_hosts`) | 0 keys | no | 0 | https, credential helper `gh auth git-credential` |
| `fg-server2` | 10.2p1 (`-Y sign` available) | none | 0 keys | no | 0 | https (survey by `claude-muyt@fg-server2`, board 14:05) |
| `design-lap` | 8.9p1 (`-Y sign` available) | two ED25519 pairs without passphrase, both deploy keys named for other jobs (`fgos-prod-sync`, `vnflow_deploy`); not machine identity keys and not to be reused | 0 keys | no | 0 | https |

## Reading

No machine has a key fit to sign as the machine: `fg-server` and `fg-server2` have no key pair at all, and `design-lap`'s two keys belong to deploy jobs. No machine has Git signing or GPG configured, and every machine pushes over https with a token. "Reuse the keys already on the machine" is therefore not available; every machine needs a new key whichever option is chosen. All three machines have OpenSSH 8.9 or later, so `ssh-keygen -Y sign` / `-Y verify` (OpenSSH 8.1+) is available everywhere and needs no new crypto dependency. The decision question goes to the owner with this evidence (2026-10-23 16:45).
