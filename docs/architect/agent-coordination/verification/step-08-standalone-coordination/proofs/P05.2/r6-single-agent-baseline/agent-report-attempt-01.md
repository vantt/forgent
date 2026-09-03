# mdview — separate editor screen: architectural-simplicity assessment

Case: FROZEN, mdview @ 84a6710ad2970d2702e6ff2814314fe39f9392b8. Single agent, one bounded pass, no clarification round.
Grounding: only the quoted PRD excerpts in the frozen brief. The mdview repo is **not** present in this working directory, so nothing below is verified against source — every claim is either quoted or explicitly flagged as an assumption (§5).

Objective constraint honored: the assessment below is for a **new, separate editor screen**. Inline editing on the existing view route is *not* assessed as a candidate answer; where it appears (§4) it is flagged as non-responsive to the locked objective.

---

## 1. Is it architecturally simple?

**Qualified no. The screen is simple; the write is not. "Add an editor screen" is not a UI task — it is the introduction of mdview's first write path to user-owned files, and effectively all of the cost lives there.**

The maintainer's separate-screen instinct is architecturally correct and should be kept: it leaves the read path at `/p/{id}/{path}` untouched and quarantines all new behavior behind one route. That is the cheap part, and it is genuinely cheap:

- **Route** — `/p/{project-id}/{path/to/file.md}/_edit` fits the existing namespace with no new concept. `_search` (§7.2) is the existing precedent for a reserved segment under a project path.
- **Client reach** — §7.1's stated DRY consequence ("chỉ một web UI … xem qua browser hay qua Tauri webview đều cùng một code path") means one implementation serves browser and Tauri window automatically. No duplicate UI work.
- **Read side** — fetching raw markdown is a thin sibling of the existing comrak render path.
- **Layering** — a write belongs in `mdview-core` as an extension of the `FileStore` port, exposed by the Axum adapter. That is exactly the shape §7.4 prescribes, so it does not distort Clean Architecture. (Assumption A1: `FileStore` is read-only today.)

What is *not* simple, and is not made simpler by the separate-screen constraint:

| Cost | Grounded in |
|---|---|
| `FileStore` port widens; **every** adapter must answer "what does write mean for me" — including the desktop adapter bound by the read-only invariant | §7.4, §7.5 |
| The daemon gains an unauthenticated write path to user files; the "no auth" simplification was only safe *because* everything was read-only | §3.2, §7.1 |
| Saving fires the Watcher → live-reload broadcast → the editor's own client (and every other client on that file) receives a change event; needs echo suppression or the editor fights itself | §7.1, §7.4 |
| §7.5's desktop read-only invariant must be amended, **or** the §7.1 single-UI DRY property must be broken to hide the editor in Tauri — the second option costs the exact property §7.1 sells | §7.1, §7.5 |
| PRD §3.2's "Không phải authoring tool hay WYSIWYG editor" must be formally reversed — a product decision, not an engineering one | §3.2 |

Short form: **the screen is a weekend; the write contract is a design project.**

---

## 2. Single largest risk / blocker

> **Silent lost updates: the editor's buffer races the very agent-driven file writes mdview exists to display, and §3.2 guarantees there is no backup to recover from.**

Why this one, specifically:

- mdview's primary workflow (§7.1) is *agent calls `mdview_view_file` → user views*. The files being viewed are files agents are actively producing. The `Watcher` port and live reload exist (§7.1, §7.4) precisely because files change underneath the viewer. An editor screen holds a buffer over a file that a live agent may rewrite at any moment — the buffer is **stale by construction**, not by accident.
- The **separate-screen constraint increases this risk** relative to the excluded inline alternative. A dedicated screen invites long-lived sessions — open the editor, walk away, come back, save — which is a strictly longer staleness window than a quick inline edit. The maintainer's constraint is right for isolation and wrong for staleness; that trade must be paid for explicitly.
- The failure is **irreversible**. §3.2: "Không sync hay backup files." A last-write-wins save silently destroys work with nothing in-product to recover it.
- It has **no cheap complete fix** and cannot be deferred to v2. The floor is: capture a version identity (content hash or mtime) at read, conditional/compare-and-swap write, an explicit conflict outcome in the UI, and a defined rule for what live-reload does to a dirty buffer. None of that fits a "just add a screen" budget.

**Runner-up, ranked second deliberately:** the daemon becomes an *unauthenticated* writer of arbitrary user files. §3.2 waives auth ("security tùy người dùng tự xử lý ở network level") — defensible while read-only, where the worst case is disclosure; once writes exist the worst case becomes silent overwrite by any local process, any private-network peer the PRD explicitly permits (§3.2 "trong private network"), or any web page the user visits issuing a cross-origin POST to the daemon's port. This is serious but ranks **second** because it is bounded and mitigable with known, small mechanism (loopback-only bind + Origin check + CSRF token + confinement to registry-indexed paths). The lost-update problem needs no adversary, fires on day one in the product's core workflow, and has no equivalently cheap complete fix.

---

## 3. Decision criteria

Ordered so the cheapest disqualifying answer comes first.

1. **Is §3.2's "not an authoring tool" load-bearing or positioning?** If load-bearing → stop here, take the fallback in §4. If positioning → amend the PRD in writing *before* any code. This is a gate, answerable in one sentence, and everything below is wasted if it comes back "load-bearing."
2. **Who else writes these files while the editor is open?** "Agents, routinely" → conflict handling is mandatory scope. "Only me, never concurrently" → a read-time mtime/hash check that refuses on mismatch is sufficient and the largest risk collapses.
3. **What is the accepted conflict outcome?** Refuse-and-reload (safe, mildly annoying) / present-a-diff (expensive) / last-write-wins (**unacceptable** given §3.2's no-backup guarantee). Pick before implementing, not after the first conflict.
4. **Does the daemon stay loopback-only?** §7.1 explicitly contemplates private-network use. Non-loopback reachable → auth is required before shipping any write. Loopback-only → Origin/CSRF check is the floor, not optional.
5. **Amend §7.5, or gate the desktop client?** Amending the read-only invariant is cheap and honest. A capability flag that hides the editor in Tauri costs the §7.1 single-code-path property — pay that only for a stated reason.
6. **Write scope.** Confine to "overwrite an existing `.md` already in the registry index" — no create/rename/delete. Path-traversal risk then reduces to a resolver behavior the codebase already owns, rather than a new attack surface.
7. **Reversibility budget.** With no sync/backup in-product, will the team accept even a minimal net (atomic temp-write + rename, and/or one `.bak`)? A "no" here tightens criterion 3 to refuse-and-reload only.

---

## 4. Alternatives considered

- **Inline editing on the existing view screen** — *not recommended, and flagged as non-responsive.* The locked objective explicitly excludes it ("must be its own screen, never inline editing grafted onto the current read-only view route"). Recorded here only so it is visibly rejected rather than silently absent. Any answer proposing it has not answered the question asked.
- **Hand off to the user's real editor** (daemon surfaces the local path / launches `$EDITOR`) — **the strongest fallback, and the recommendation if criterion 1 returns "load-bearing."** Preserves §3.2, §7.1, §7.4, and §7.5 intact; zero write path in the daemon; near-zero code. Not the primary recommendation only because it does not deliver the editor *screen* the objective asks for. The maintainer should see this option explicitly before committing.
- **Separate editor process/daemon; mdview stays read-only** — rejected. If it touches the registry it violates §7.1's hard invariant (never two daemons writing one SQLite registry); if it doesn't, it is simply a second application, i.e. more moving parts than the coupling it was meant to avoid.
- **Desktop-only editor (Tauri writes natively, web stays read-only)** — rejected. Directly contradicts §7.5 and breaks the §7.1 single-code-path property by creating two interaction paths.
- **Write via a new MCP tool (e.g. `mdview_write_file`) instead of a UI** — named, not recommended. Fits the existing MCP adapter and sidesteps the browser CSRF surface entirely, but gives a human no editor screen, so it does not answer the objective. Worth noting as a complement, not a substitute.
- **CRDT / OT collaborative editing** — rejected as disproportionate. For a single-user local tool the correct answer to the conflict problem is compare-and-swap on a content hash, not a merge engine.

---

## 5. Unsupported assumptions

Each of these was required to reach the judgment above and is **not** established by the frozen brief.

- **A1.** `FileStore` is currently read-only. §7.4 names the port, not its methods. If it already declares write, the layering cost in §1 drops materially.
- **A2.** The HTTP surface has no auth, CSRF, or Origin checking today — inferred from §3.2's "không cần authentication," not verified in code.
- **A3.** The daemon is reachable by other local processes on a fixed port. §7.1 quotes `:7700` but not the bind address.
- **A4.** The Watcher covers the same project `.md` files the editor would write, so a save triggers live reload. Strongly implied by "live reload" in §7.1; not stated as covering all project files.
- **A5.** Agents write project `.md` files *while* mdview is running. Inferred from the `mdview_view_file` workflow in §7.1; the brief states no write frequency. **This assumption is what makes the §2 risk the largest one** — if it is false, the ranking flips to the unauthenticated-write surface.
- **A6.** Users have no external revision history. §3.2 rules out in-product sync/backup, but many users keep docs in git, which would soften the lost-update severity considerably. Unverified.
- **A7.** "One web UI" (§7.1) means a new editor screen appears in the Tauri webview automatically unless deliberately gated.
- **A8.** mdview is effectively single-user; no multi-human concurrent editing to design for.
- **A9.** No code-level verification was possible — the frozen repo is not present in this working directory. Nothing here was checked against source.

---

## Unresolved questions

1. Does `FileStore` already expose write methods? (Collapses or confirms A1 and a chunk of the §1 cost table.)
2. Does the daemon bind loopback-only, or can it bind non-loopback for the private-network use §3.2 permits? (Sets whether criterion 4 requires auth or just an Origin check.)
3. Is §3.2's "not an authoring tool" a hard product boundary or a positioning line? (Criterion 1 — gates everything else.)
4. How often do agents rewrite a file that a human would have open in an editor? (Sets whether the §2 risk or its runner-up is actually the largest.)
